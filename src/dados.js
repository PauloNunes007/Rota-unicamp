/* ============================================================
   Modelo de dados, migração e importação de pacotes.

   Tudo continua num único documento salvo (Supabase + cópia no
   navegador). Os campos da versão antiga (tópicos, erros,
   simulados, aulas...) ficam intactos dentro dele; o app de
   flashcards vive inteiro em `srs`:

   srs = {
     versao,
     cartoes: [{ id, no, frente, verso, extra?, tags?, criado, ordem,
                 origem?, suspenso?, srs: {state,due,s,d,reps,lapses,step,last,ivl} }],
     log: [[ts, idCartao, nota, estadoAntes, diasDecorridos, modo, ms]],
     nosExtras: [{ id, pai, nome }],   // tópicos criados fora do edital
     config: { ... },
   }
   ============================================================ */
import { EDITAL, REMAPEAR_IDS } from "./edital.js";
import { State, cartaoNovo, inicioDoDia, CONFIG_PADRAO } from "./srs/fsrs.js";

export const STORAGE_KEY = "rota-unicamp-data-v1";
export const SRS_VERSAO = 1;
export const NO_SEM_TOPICO = "_sem";

export const CONFIG_APP_PADRAO = {
  retencao: 0.9,
  novosPorDia: 20,
  revisoesPorDia: 200,
  passosAprendizado: [1, 10],
  passosReaprendizado: [10],
  intervaloMax: 365,
  dataProva: "2026-10-18", // intervalos não passam da véspera; vazio desliga
  virada: 4,
  fuzz: true,
  registrarLivre: true,    // estudo livre também atualiza o agendamento
};

export function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

export function normalizar(s) {
  return String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/\s+/g, " ").trim();
}
function slug(s) { return normalizar(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "t"; }

export function configFsrs(config) {
  const c = { ...CONFIG_APP_PADRAO, ...config };
  const limite = c.dataProva ? new Date(`${c.dataProva}T09:00:00`).getTime() : null;
  return {
    ...CONFIG_PADRAO,
    retencao: c.retencao,
    intervaloMax: c.intervaloMax,
    passosAprendizado: c.passosAprendizado,
    passosReaprendizado: c.passosReaprendizado,
    fuzz: c.fuzz,
    virada: c.virada,
    limite: Number.isFinite(limite) ? limite : null,
    novosPorDia: c.novosPorDia,
    revisoesPorDia: c.revisoesPorDia,
  };
}

/* ---------------- árvore ---------------- */
// Índice plano da árvore do edital + tópicos extras.
export function montarArvore(nosExtras = []) {
  const porId = new Map();
  const raizes = [];
  const add = (n, pai, nivel, cor) => {
    const no = { id: n.id, nome: n.nome, pai, nivel, cor: n.cor || cor || null, filhos: [], extra: !!n.extra };
    porId.set(n.id, no);
    if (pai) porId.get(pai).filhos.push(no); else raizes.push(no);
    (n.filhos || []).forEach((f) => add(f, n.id, nivel + 1, no.cor));
  };
  EDITAL.forEach((n) => add(n, null, 0, null));
  // extras podem apontar para outros extras; insere na ordem em que os pais existem
  let restantes = nosExtras.filter((n) => !porId.has(n.id));
  for (let voltas = 0; restantes.length && voltas < 10; voltas++) {
    restantes = restantes.filter((n) => {
      if (n.pai && !porId.has(n.pai)) return true;
      const pai = n.pai ? porId.get(n.pai) : null;
      add({ ...n, extra: true }, n.pai || null, pai ? pai.nivel + 1 : 0, pai?.cor);
      return false;
    });
  }
  const sem = { id: NO_SEM_TOPICO, nome: "Sem tópico", pai: null, nivel: 0, cor: null, filhos: [], virtual: true };
  porId.set(NO_SEM_TOPICO, sem);
  return { raizes, porId, sem };
}

export function resolverNo(arvore, id) { return arvore.porId.has(id) ? id : NO_SEM_TOPICO; }

export function caminho(arvore, id) {
  const out = [];
  let n = arvore.porId.get(resolverNo(arvore, id));
  while (n) { out.unshift(n); n = n.pai ? arvore.porId.get(n.pai) : null; }
  return out;
}
export function caminhoTexto(arvore, id, sep = " › ") { return caminho(arvore, id).map((n) => n.nome).join(sep); }

export function descendentes(arvore, id) {
  const out = new Set();
  const visitar = (n) => { out.add(n.id); n.filhos.forEach(visitar); };
  const raiz = arvore.porId.get(id);
  if (raiz) visitar(raiz);
  return out;
}

// Soma por nó (incluindo tudo abaixo dele): total, novos e vencidos hoje.
export function contarPorNo(arvore, cartoes, fimHoje) {
  const m = new Map();
  const bump = (id, novo, venc) => {
    let x = m.get(id);
    if (!x) { x = { total: 0, novos: 0, vencidos: 0 }; m.set(id, x); }
    x.total++; if (novo) x.novos++; if (venc) x.vencidos++;
  };
  for (const c of cartoes) {
    if (c.suspenso) continue;
    const novo = c.srs.state === State.NOVO;
    const venc = !novo && c.srs.due < fimHoje;
    let id = resolverNo(arvore, c.no);
    while (id) { bump(id, novo, venc); id = arvore.porId.get(id)?.pai; }
  }
  return m;
}

/* ---------------- cartões ---------------- */
export function criarCartao({ no, frente, verso, extra, tags, origem }, ordem = 0) {
  const c = { id: uid(), no, frente, verso, criado: Date.now(), ordem, srs: cartaoNovo() };
  if (extra) c.extra = extra;
  if (tags && tags.length) c.tags = tags;
  if (origem) c.origem = origem;
  return c;
}

export const chaveCartao = (frente, verso) => `${normalizar(frente)}\u0001${normalizar(verso)}`;

/* ---------------- importação de pacotes JSON ---------------- */
const CAMPOS = {
  frente: ["frente", "front", "pergunta", "question", "q", "prompt"],
  verso: ["verso", "back", "resposta", "answer", "a", "r"],
  extra: ["extra", "explicacao", "explicação", "comentario", "comentário", "nota", "obs"],
  tags: ["tags", "etiquetas"],
};
const pegar = (o, nomes) => { for (const k of nomes) if (o[k] != null && o[k] !== "") return o[k]; return undefined; };
const texto = (v) => (v == null ? "" : typeof v === "string" ? v.trim() : Array.isArray(v) ? v.join("\n").trim() : String(v).trim());

// Aceita:  [ {frente, verso}, ... ]
//     ou   { "nome": "...", "cartoes": [ ... ] }   (também "cards" ou "flashcards")
export function lerPacote(textoJson) {
  let bruto;
  try { bruto = JSON.parse(textoJson); }
  catch (e) { return { erro: `JSON inválido: ${e.message}` }; }

  let lista, nome;
  if (Array.isArray(bruto)) lista = bruto;
  else if (bruto && typeof bruto === "object") {
    lista = bruto.cartoes ?? bruto.cartões ?? bruto.cards ?? bruto.flashcards;
    nome = bruto.nome ?? bruto.name ?? bruto.pacote ?? bruto.pack;
    if (!Array.isArray(lista)) {
      // um cartão solto também vale
      if (pegar(bruto, CAMPOS.frente) != null) lista = [bruto];
      else return { erro: "Não achei a lista de cartões. Use um array, ou um objeto com a chave \"cartoes\"." };
    }
  } else return { erro: "O arquivo precisa conter um array de cartões." };

  const itens = [], invalidos = [];
  lista.forEach((o, i) => {
    if (!o || typeof o !== "object") { invalidos.push(i + 1); return; }
    const frente = texto(pegar(o, CAMPOS.frente));
    const verso = texto(pegar(o, CAMPOS.verso));
    if (!frente || !verso) { invalidos.push(i + 1); return; }
    const extra = texto(pegar(o, CAMPOS.extra)) || undefined;
    const t = pegar(o, CAMPOS.tags);
    const tags = Array.isArray(t) ? t.map(texto).filter(Boolean) : typeof t === "string" ? t.split(/[,;]/).map((x) => x.trim()).filter(Boolean) : undefined;
    itens.push({ frente, verso, extra, tags });
  });
  return { itens, invalidos, nome: nome ? String(nome) : undefined };
}

export function exportarPacote(cartoes, nome) {
  return JSON.stringify({
    nome,
    cartoes: cartoes.map((c) => {
      const o = { frente: c.frente, verso: c.verso };
      if (c.extra) o.extra = c.extra;
      if (c.tags?.length) o.tags = c.tags;
      return o;
    }),
  }, null, 2);
}

/* ---------------- migração ---------------- */
function acharPorNome(raizes, nome) {
  const alvo = normalizar(nome);
  const fila = [...raizes];
  while (fila.length) {
    const n = fila.shift();
    if (normalizar(n.nome) === alvo) return n;
    fila.push(...n.filhos);
  }
  return null;
}

// Cartão do SM-2 antigo para o modelo do FSRS, preservando o progresso:
// o intervalo atual vira a estabilidade (no FSRS, com retenção de 90%,
// intervalo = estabilidade) e o fator de facilidade vira a dificuldade.
function converterSm2(c) {
  const reps = c.repetitions || 0;
  if (!reps && !c.lastReviewed) return cartaoNovo();
  const dia = (iso) => inicioDoDia(new Date(`${iso}T12:00:00`).getTime());
  const ivl = Math.max(1, c.interval || 1);
  const due = c.nextReview ? dia(c.nextReview) : Date.now();
  const ease = c.ease || 2.5;
  return {
    state: State.REVISAO,
    due,
    s: ivl,
    d: Math.min(10, Math.max(1, 10 - (ease - 1.3) * (7 / 1.5))),
    reps: Math.max(1, reps),
    lapses: 0,
    step: 0,
    last: c.lastReviewed ? dia(c.lastReviewed) : due - ivl * 86400000,
    ivl,
  };
}

function migrarFlashcardsAntigos(antigos, nosExtras) {
  const cartoes = [];
  const garantirNo = (materia, topico) => {
    let arv = montarArvore(nosExtras);
    let base = materia ? acharPorNome(arv.raizes, materia) : null;
    if (!base && materia) {
      const id = `u-${slug(materia)}`;
      if (!nosExtras.some((n) => n.id === id)) nosExtras.push({ id, pai: null, nome: materia });
      arv = montarArvore(nosExtras);
      base = arv.porId.get(id);
    }
    if (!base) return NO_SEM_TOPICO;
    if (!topico) return base.id;
    const achado = acharPorNome([base], topico);
    if (achado) return achado.id;
    const id = `${base.id}.u-${slug(topico)}`;
    if (!nosExtras.some((n) => n.id === id)) nosExtras.push({ id, pai: base.id, nome: topico });
    return id;
  };
  antigos.forEach((c, i) => {
    if (!c || !c.front || !c.back) return;
    cartoes.push({
      id: c.id || uid(),
      no: garantirNo(c.subject, (c.topic || "").trim()),
      frente: c.front, verso: c.back,
      criado: Date.now() - (antigos.length - i), ordem: i,
      origem: "versão anterior",
      srs: converterSm2(c),
    });
  });
  return cartoes;
}

export function migrar(guardado) {
  const d = { ...(guardado || {}) };
  if (!d.srs || !d.srs.versao) {
    const nosExtras = [];
    const cartoes = migrarFlashcardsAntigos(Array.isArray(d.flashcards) ? d.flashcards : [], nosExtras);
    // O array `flashcards` antigo fica onde estava, sem mudança, para a
    // versão anterior do app continuar abrindo se um dia for preciso.
    d.srs = {
      versao: SRS_VERSAO,
      cartoes,
      log: [],
      nosExtras,
      config: { ...CONFIG_APP_PADRAO },
      tema: d.settings?.tema || null,
    };
  }
  d.srs = {
    cartoes: [], log: [], nosExtras: [], ...d.srs,
    config: { ...CONFIG_APP_PADRAO, ...(d.srs.config || {}) },
  };
  // ids do edital que mudaram de lugar
  if (Object.keys(REMAPEAR_IDS).length) {
    d.srs.cartoes = d.srs.cartoes.map((c) => (REMAPEAR_IDS[c.no] ? { ...c, no: REMAPEAR_IDS[c.no] } : c));
  }
  return d;
}

export const dadosVazios = () => migrar({});
