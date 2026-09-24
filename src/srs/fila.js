/* ============================================================
   Fila inteligente da revisão diária.

   Ordem de prioridade a cada cartão:
   1. aprendendo/reaprendendo cujo passo de minutos já venceu
   2. revisões vencidas hoje, das com menor chance de lembrar
      para as mais seguras (se houver acúmulo, salva primeiro
      o que está mais perto de ser esquecido)
   3. cartões novos, até o limite diário, na ordem de importação
   4. se nada mais sobrou, adianta aprendendo que vence em breve
   ============================================================ */
import { State, inicioDoDia, fimDoDia, chanceAgora } from "./fsrs.js";

export const MODO = { DIARIA: 0, LIVRE: 1 };
// posições no registro de revisões: [ts, idCartão, nota, estadoAntes, diasDecorridos, modo, ms]
export const LOG = { TS: 0, ID: 1, NOTA: 2, ESTADO: 3, DIAS: 4, MODO: 5, MS: 6 };

const ADIANTAR_MIN = 20; // minutos de aprendizado que podem ser adiantados no fim

export function feitosHoje(log, agora, virada) {
  const ini = inicioDoDia(agora, virada);
  let novos = 0, revisoes = 0, total = 0, erros = 0;
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i];
    if (e[LOG.TS] < ini) break; // o registro é cronológico
    total++;
    if (e[LOG.NOTA] === 1) erros++;
    if (e[LOG.MODO] !== MODO.DIARIA) continue;
    if (e[LOG.ESTADO] === State.NOVO) novos++;
    else if (e[LOG.ESTADO] === State.REVISAO) revisoes++;
  }
  return { novos, revisoes, total, erros };
}

const ativo = (c) => !c.suspenso;

// Panorama do dia: o que ainda falta, respeitando os limites.
export function panorama(cartoes, log, cfg, agora) {
  const fim = fimDoDia(agora, cfg.virada);
  const feitos = feitosHoje(log, agora, cfg.virada);
  const aprendendo = [], revisoes = [], novos = [];
  for (const c of cartoes) {
    if (!ativo(c)) continue;
    const s = c.srs;
    if (s.state === State.NOVO) novos.push(c);
    else if (s.state === State.REVISAO) { if (s.due < fim) revisoes.push(c); }
    else if (s.due < fim) aprendendo.push(c);
  }
  const vagasRev = Math.max(0, cfg.revisoesPorDia - feitos.revisoes);
  const vagasNovos = Math.max(0, cfg.novosPorDia - feitos.novos);

  revisoes.sort((a, b) => (chanceAgora(a.srs, agora, cfg.virada) ?? 1) - (chanceAgora(b.srs, agora, cfg.virada) ?? 1));
  novos.sort((a, b) => a.criado - b.criado || (a.ordem ?? 0) - (b.ordem ?? 0));
  aprendendo.sort((a, b) => a.srs.due - b.srs.due);

  return {
    feitos,
    aprendendo,
    revisoes: revisoes.slice(0, vagasRev),
    novos: novos.slice(0, vagasNovos),
    acumuladas: Math.max(0, revisoes.length - vagasRev),
    novosNaFila: novos.length,
  };
}

// Próximo cartão da revisão diária, ou { espera: ts } se só há aprendizado futuro.
export function proximoDiario(cartoes, log, cfg, agora) {
  const p = panorama(cartoes, log, cfg, agora);
  const vencido = p.aprendendo.find((c) => c.srs.due <= agora);
  if (vencido) return { cartao: vencido, p };
  if (p.revisoes.length) return { cartao: p.revisoes[0], p };
  if (p.novos.length) return { cartao: p.novos[0], p };
  if (p.aprendendo.length) {
    const prox = p.aprendendo[0];
    if (prox.srs.due - agora <= ADIANTAR_MIN * 60000) return { cartao: prox, p };
    return { espera: prox.srs.due, p };
  }
  return { p };
}

// Quantos cartões de revisão vencem em cada um dos próximos dias.
export function previsao(cartoes, cfg, agora, dias = 7) {
  const ini = inicioDoDia(agora, cfg.virada);
  const out = new Array(dias).fill(0);
  for (const c of cartoes) {
    if (!ativo(c) || c.srs.state === State.NOVO) continue;
    const i = Math.max(0, Math.floor((c.srs.due - ini) / 86400000));
    if (i < dias) out[i]++;
  }
  return out;
}

// Taxa de acerto real nas revisões (não conta aprendizado), últimos N dias.
export function retencaoReal(log, agora, dias = 30) {
  const desde = agora - dias * 86400000;
  let ok = 0, n = 0;
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i];
    if (e[LOG.TS] < desde) break;
    if (e[LOG.ESTADO] !== State.REVISAO) continue;
    n++; if (e[LOG.NOTA] > 1) ok++;
  }
  return n ? { taxa: ok / n, n } : null;
}
