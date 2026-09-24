import { createClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const ID = import.meta.env.VITE_ESTADO_ID;

const supabase = URL && KEY ? createClient(URL, KEY) : null;

// Cópia local de emergência. Se a internet cair ou o Supabase falhar,
// o app continua funcionando e sincroniza quando voltar.
const LOCAL = "rota-unicamp-local";

// Numa sessão de revisão cada resposta muda o estado. Gravar no navegador é
// imediato; o envio ao Supabase espera um respiro e manda só a última versão.
const ATRASO_REMOTO = 1500;

function lerLocal() {
  try { const v = localStorage.getItem(LOCAL); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
function gravarLocal(valor) {
  try { localStorage.setItem(LOCAL, JSON.stringify(valor)); return true; } catch { return false; }
}
const carimbo = (v) => (v && typeof v._salvoEm === "number" ? v._salvoEm : 0);

let pendente = null;
let timer = null;
let ouvintes = new Set();
function avisar(status) { ouvintes.forEach((f) => { try { f(status); } catch {} }); }

async function enviar() {
  timer = null;
  if (!pendente || !supabase) return;
  const valor = pendente;
  pendente = null;
  avisar("enviando");
  const { error } = await supabase
    .from("rota_estado")
    .upsert({ id: ID, dados: valor, atualizado_em: new Date().toISOString() });
  if (error) {
    // guarda de novo para tentar na próxima mudança ou ao voltar a conexão
    if (!pendente) pendente = valor;
    avisar("offline");
  } else if (!pendente) {
    avisar("salvo");
  }
}

function agendar() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(enviar, ATRASO_REMOTO);
}

export const storage = {
  async get() {
    const local = lerLocal();
    const primeiraVez = () => Object.assign(new Error("primeira vez"), { primeiraVez: true });
    if (!supabase) {
      if (!local) throw primeiraVez();
      return { value: JSON.stringify(local) };
    }
    const { data, error } = await supabase
      .from("rota_estado").select("dados").eq("id", ID).maybeSingle();

    if (error || !data) {
      if (local) {
        // o banco está fora ou vazio: a cópia local vale e sobe quando der
        if (!error) { pendente = local; agendar(); }
        return { value: JSON.stringify(local) };
      }
      // erro de rede sem cópia local não é "primeira vez": quem chama
      // não pode gravar um estado vazio por cima do que está no banco
      throw error || primeiraVez();
    }
    // Fica a versão mais nova. Se a última gravação remota falhou e a local
    // avançou, a local não pode ser sobrescrita pelo banco desatualizado.
    if (local && carimbo(local) > carimbo(data.dados)) {
      pendente = local; agendar();
      return { value: JSON.stringify(local) };
    }
    gravarLocal(data.dados);
    return { value: JSON.stringify(data.dados) };
  },

  async set(_chave, valorTexto) {
    const valor = typeof valorTexto === "string" ? JSON.parse(valorTexto) : valorTexto;
    valor._salvoEm = Date.now();
    const okLocal = gravarLocal(valor);
    if (!supabase) {
      avisar(okLocal ? "local" : "erro");
      return { ok: okLocal, offline: true };
    }
    pendente = valor;
    agendar();
    return { ok: true };
  },

  // Manda o que estiver pendente agora, sem esperar o atraso.
  flush() {
    if (timer) { clearTimeout(timer); enviar(); }
  },

  onStatus(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); },
  remoto: !!supabase,
};

if (typeof window !== "undefined") {
  window.storage = {
    get: (chave) => storage.get(chave),
    set: (chave, valor) => storage.set(chave, valor),
  };
  // Ao trocar de aba ou fechar, tenta subir a última versão.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") storage.flush();
  });
  window.addEventListener("online", () => { if (pendente) agendar(); });
}
