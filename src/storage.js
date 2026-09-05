import { createClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const ID = import.meta.env.VITE_ESTADO_ID;

const supabase = URL && KEY ? createClient(URL, KEY) : null;

// Cópia local de emergência. Se a internet cair ou o Supabase falhar,
// o app continua funcionando e sincroniza quando voltar.
const LOCAL = "rota-unicamp-local";

function lerLocal() {
  try { const v = localStorage.getItem(LOCAL); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
function gravarLocal(valor) {
  try { localStorage.setItem(LOCAL, JSON.stringify(valor)); } catch {}
}

export const storage = {
  async get() {
    if (!supabase) {
      const local = lerLocal();
      if (!local) throw new Error("sem dados");
      return { value: JSON.stringify(local) };
    }
    const { data, error } = await supabase
      .from("rota_estado").select("dados").eq("id", ID).maybeSingle();

    if (error) {
      const local = lerLocal();
      if (local) return { value: JSON.stringify(local) };
      throw error;
    }
    if (!data) {
      const local = lerLocal();
      if (local) return { value: JSON.stringify(local) };
      throw new Error("primeira vez");
    }
    gravarLocal(data.dados);
    return { value: JSON.stringify(data.dados) };
  },

  async set(_chave, valorTexto) {
    const valor = typeof valorTexto === "string" ? JSON.parse(valorTexto) : valorTexto;
    gravarLocal(valor);
    if (!supabase) return { ok: true, offline: true };
    const { error } = await supabase
      .from("rota_estado")
      .upsert({ id: ID, dados: valor, atualizado_em: new Date().toISOString() });
    if (error) throw error;
    return { ok: true };
  },
};

// O componente foi escrito usando window.storage, então mantemos a mesma
// interface e só trocamos para onde ela aponta.
if (typeof window !== "undefined") {
  window.storage = {
    get: (chave) => storage.get(chave),
    set: (chave, valor) => storage.set(chave, valor),
  };
}
