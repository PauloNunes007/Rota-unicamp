/* ============================================================
   FSRS-5 (Free Spaced Repetition Scheduler)
   Jarrett Ye et al. Modelo DSR de memória: cada cartão guarda
   Dificuldade (1 a 10) e Estabilidade (dias até a chance de lembrar
   cair a 90%). A Recuperabilidade R é calculada na hora a partir do
   tempo desde a última revisão.

   R(t, S) = (1 + F·t/S)^DECAY          curva de esquecimento
   I(r, S) = S/F · (r^(1/DECAY) − 1)    intervalo para a retenção r

   Os 19 pesos abaixo são os padrões do FSRS-5, ajustados em
   centenas de milhões de revisões reais. Com histórico suficiente
   eles podem ser otimizados para você; o log de revisões já é
   guardado no formato que o otimizador precisa.

   Este módulo é puro: não conhece React nem armazenamento.
   ============================================================ */

export const PESOS_PADRAO = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046,
  1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315,
  2.9898, 0.51655, 0.6621,
];

const DECAY = -0.5;
const FACTOR = 19 / 81; // faz R(S, S) = 0,9

export const Rating = { ERREI: 1, DIFICIL: 2, BOM: 3, FACIL: 4 };
export const State = { NOVO: 0, APRENDENDO: 1, REVISAO: 2, REAPRENDENDO: 3 };

const MIN = 60 * 1000;
const HORA = 60 * MIN;
const DIA = 24 * HORA;

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/* ---------------- tempo em dias de estudo ---------------- */
// O dia de estudo vira às `virada` horas (4h por padrão, como no Anki),
// para quem estuda depois da meia-noite não ganhar um dia novo.
export function inicioDoDia(ts, virada = 4) {
  const d = new Date(ts - virada * HORA);
  d.setHours(0, 0, 0, 0);
  return d.getTime() + virada * HORA;
}
export function fimDoDia(ts, virada = 4) {
  const d = new Date(inicioDoDia(ts, virada));
  d.setDate(d.getDate() + 1);
  return d.getTime();
}
// Diferença em dias de calendário de estudo (robusto a horário de verão).
export function diasEntre(de, ate, virada = 4) {
  return Math.round((inicioDoDia(ate, virada) - inicioDoDia(de, virada)) / DIA);
}
function somarDias(ts, n, virada) {
  const d = new Date(inicioDoDia(ts, virada));
  d.setDate(d.getDate() + n);
  return d.getTime();
}

/* ---------------- fórmulas do modelo ---------------- */
export function recuperabilidade(diasDecorridos, S) {
  return Math.pow(1 + (FACTOR * Math.max(0, diasDecorridos)) / S, DECAY);
}
function intervaloBruto(S, retencao) {
  return (S / FACTOR) * (Math.pow(retencao, 1 / DECAY) - 1);
}

function criarModelo(w) {
  const S0 = (g) => Math.max(w[g - 1], 0.1);
  const D0 = (g) => w[4] - Math.exp(w[5] * (g - 1)) + 1;
  const proxD = (D, g) => {
    const delta = -w[6] * (g - 3);
    const linear = D + (delta * (10 - D)) / 9; // amortece perto do teto
    return clamp(w[7] * D0(4) + (1 - w[7]) * linear, 1, 10); // volta à média
  };
  const SAcerto = (D, S, R, g) => {
    const dificil = g === Rating.DIFICIL ? w[15] : 1;
    const facil = g === Rating.FACIL ? w[16] : 1;
    return S * (1 + Math.exp(w[8]) * (11 - D) * Math.pow(S, -w[9]) *
      (Math.exp((1 - R) * w[10]) - 1) * dificil * facil);
  };
  const SLapso = (D, S, R) => {
    const s = w[11] * Math.pow(D, -w[12]) * (Math.pow(S + 1, w[13]) - 1) * Math.exp((1 - R) * w[14]);
    return Math.min(s, S);
  };
  // revisão no mesmo dia (passos de aprendizado, estudo livre repetido)
  const SCurtoPrazo = (S, g) => S * Math.exp(w[17] * (g - 3 + w[18]));
  return { S0, D0, proxD, SAcerto, SLapso, SCurtoPrazo };
}

/* ---------------- fuzz determinístico ---------------- */
// Espalha um pouco os intervalos para os cartões importados juntos não
// vencerem todos no mesmo dia. A semente vem do cartão, então a prévia
// mostrada no botão é exatamente o que acontece ao clicar.
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function aleatorio(semente) {
  let t = (hash(semente) + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const FAIXAS_FUZZ = [[2.5, 7, 0.15], [7, 20, 0.1], [20, Infinity, 0.05]];
function comFuzz(ivl, semente) {
  if (ivl < 2.5) return ivl;
  let delta = 1;
  for (const [ini, fim, f] of FAIXAS_FUZZ) delta += f * Math.max(Math.min(ivl, fim) - ini, 0);
  const lo = Math.max(2, Math.round(ivl - delta));
  const hi = Math.round(ivl + delta);
  return Math.floor(aleatorio(semente) * (hi - lo + 1)) + lo;
}

/* ---------------- configuração ---------------- */
export const CONFIG_PADRAO = {
  retencao: 0.9,          // chance-alvo de lembrar no dia da revisão
  intervaloMax: 365,      // dias
  passosAprendizado: [1, 10], // minutos
  passosReaprendizado: [10],  // minutos
  fuzz: true,
  virada: 4,              // hora em que o dia de estudo vira
  limite: null,           // timestamp: nenhum intervalo passa desta data (a prova)
  pesos: PESOS_PADRAO,
};

export function cartaoNovo() {
  return { state: State.NOVO, due: 0, s: 0, d: 0, reps: 0, lapses: 0, step: 0, last: null, ivl: 0 };
}

/* ---------------- o agendador ---------------- */
// Devolve o resultado dos quatro botões de uma vez: { 1: srs, 2: srs, 3: srs, 4: srs }.
// Cada srs tem `due` (timestamp) e `ivl` (dias; 0 enquanto em passos de minutos).
export function agendar(srsAtual, agora, cfgParcial, semente = "") {
  const cfg = { ...CONFIG_PADRAO, ...cfgParcial };
  const m = criarModelo(cfg.pesos || PESOS_PADRAO);
  const c = srsAtual || cartaoNovo();
  const decorridos = c.last == null ? 0 : diasEntre(c.last, agora, cfg.virada);
  const R = c.state === State.NOVO ? 1 : recuperabilidade(decorridos, c.s || 0.1);

  // teto do intervalo: máximo configurado e, se houver, a véspera da prova
  let teto = cfg.intervaloMax;
  if (cfg.limite && cfg.limite > agora) {
    const ateProva = diasEntre(agora, cfg.limite, cfg.virada) - 1;
    if (ateProva >= 1) teto = Math.min(teto, ateProva);
  }
  const intervalo = (S, g) => {
    let ivl = Math.round(intervaloBruto(S, cfg.retencao));
    ivl = clamp(ivl, 1, cfg.intervaloMax);
    // no teto não há fuzz, senão o intervalo oscilaria para baixo do máximo
    if (cfg.fuzz && ivl < cfg.intervaloMax) ivl = Math.min(comFuzz(ivl, `${semente}|${c.reps}|${g}`), cfg.intervaloMax);
    return ivl;
  };

  // 1. Nova dificuldade e estabilidade para cada nota
  const D = {}, S = {};
  for (const g of [1, 2, 3, 4]) {
    if (c.state === State.NOVO) {
      D[g] = clamp(m.D0(g), 1, 10);
      S[g] = m.S0(g);
    } else {
      D[g] = m.proxD(c.d, g);
      if (decorridos === 0) S[g] = m.SCurtoPrazo(c.s, g);
      else S[g] = g === Rating.ERREI ? m.SLapso(c.d, c.s, R) : m.SAcerto(c.d, c.s, R, g);
    }
    S[g] = clamp(S[g], 0.1, 36500);
  }

  const base = (g) => ({ ...c, d: D[g], s: S[g], reps: c.reps + 1, last: agora });
  const emPassos = (g, state, step, minutos) =>
    ({ ...base(g), state, step, due: agora + minutos * MIN, ivl: 0 });
  const paraRevisao = (g, ivl) =>
    ({ ...base(g), state: State.REVISAO, step: 0, ivl, due: somarDias(agora, ivl, cfg.virada) });

  const out = {};

  if (c.state === State.REVISAO) {
    // Errei: lapso, volta para reaprender em minutos
    const passos = cfg.passosReaprendizado;
    if (passos.length) out[1] = { ...emPassos(1, State.REAPRENDENDO, 0, passos[0]), lapses: c.lapses + 1 };
    else out[1] = { ...paraRevisao(1, Math.min(intervalo(S[1], 1), teto)), lapses: c.lapses + 1 };

    // Difícil ≤ Bom < Fácil, sempre
    let h = intervalo(S[2], 2), b = intervalo(S[3], 3), f = intervalo(S[4], 4);
    h = Math.min(h, b);
    b = Math.max(b, h + 1);
    f = Math.max(f, b + 1);
    out[2] = paraRevisao(2, Math.min(h, teto));
    out[3] = paraRevisao(3, Math.min(b, teto));
    out[4] = paraRevisao(4, Math.min(f, teto));
    return out;
  }

  // NOVO, APRENDENDO ou REAPRENDENDO: passos em minutos até formar
  const passos = c.state === State.REAPRENDENDO ? cfg.passosReaprendizado : cfg.passosAprendizado;
  const estadoPassos = c.state === State.REAPRENDENDO ? State.REAPRENDENDO : State.APRENDENDO;
  const step = c.state === State.NOVO ? 0 : c.step;
  const formar = (g) => {
    let ivl = intervalo(S[g], g);
    if (g === Rating.FACIL) ivl = Math.max(ivl, intervalo(S[3], 3) + 1);
    return paraRevisao(g, Math.min(ivl, teto));
  };

  if (!passos.length) {
    for (const g of [1, 2, 3, 4]) out[g] = formar(g);
    return out;
  }

  out[1] = emPassos(1, estadoPassos, 0, passos[0]);

  const atrasoDificil = step === 0
    ? (passos.length > 1 ? (passos[0] + passos[1]) / 2 : Math.min(passos[0] * 1.5, passos[0] + 1440))
    : passos[Math.min(step, passos.length - 1)];
  out[2] = emPassos(2, estadoPassos, step, atrasoDificil);

  out[3] = step + 1 >= passos.length
    ? formar(3)
    : emPassos(3, estadoPassos, step + 1, passos[step + 1]);

  out[4] = formar(4);
  return out;
}

/* ---------------- apoio para a interface ---------------- */
export function rotuloIntervalo(srs, agora) {
  if (srs.ivl > 0) {
    const d = srs.ivl;
    if (d < 30) return `${d} d`;
    if (d < 365) return `${(d / 30).toFixed(d < 300 ? 1 : 0).replace(".", ",").replace(",0", "")} m`;
    return `${(d / 365).toFixed(1).replace(".", ",").replace(",0", "")} a`;
  }
  const min = Math.max(1, Math.round((srs.due - agora) / MIN));
  if (min < 60) return `${min} min`;
  const h = min / 60;
  return `${h.toFixed(h < 10 ? 1 : 0).replace(".", ",").replace(",0", "")} h`;
}

// Chance de lembrar agora (0 a 1), ou null para cartão nunca visto.
export function chanceAgora(srs, agora, virada = 4) {
  if (!srs || srs.state === State.NOVO || !srs.last) return null;
  return recuperabilidade(diasEntre(srs.last, agora, virada), srs.s);
}

export const ROTULO_ESTADO = {
  [State.NOVO]: "novo",
  [State.APRENDENDO]: "aprendendo",
  [State.REVISAO]: "revisão",
  [State.REAPRENDENDO]: "reaprendendo",
};
