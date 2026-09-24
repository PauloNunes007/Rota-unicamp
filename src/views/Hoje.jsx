import React, { useEffect, useMemo, useState } from "react";
import { Play } from "lucide-react";
import { C, btnP, btnQ } from "../tema.js";
import { PageHead, Sheet, Stat, Empty, Tag } from "../ui.jsx";
import { Sessao } from "./Sessao.jsx";
import { agendar, fimDoDia } from "../srs/fsrs.js";
import { proximoDiario, panorama, previsao, retencaoReal, MODO } from "../srs/fila.js";
import { caminhoTexto, contarPorNo } from "../dados.js";

const hora = (ts) => new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const DIAS_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

// Relógio que anda a cada 20 s, para cartões em aprendizado vencerem na tela.
function useAgora(ativo) {
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    if (!ativo) return;
    const t = setInterval(() => setAgora(Date.now()), 20000);
    return () => clearInterval(t);
  }, [ativo]);
  return [agora, setAgora];
}

export function Hoje({ srs, cfg, arvore, ops, irPara }) {
  const [emSessao, setEmSessao] = useState(false);
  const [agora, setAgora] = useAgora(true);
  const [exibidos, setExibidos] = useState(0);

  // a cada resposta o relógio é atualizado para a fila refletir o momento real
  const prox = useMemo(() => proximoDiario(srs.cartoes, srs.log, cfg, agora), [srs.cartoes, srs.log, cfg, agora]);
  const p = prox.p;
  const restantes = p.novos.length + p.aprendendo.length + p.revisoes.length;

  if (emSessao) {
    const c = prox.cartao;
    const previa = c ? agendar(c.srs, agora, cfg, c.id) : null;
    const topo = (
      <>
        <span title="novos" style={{ color: C.blue, fontWeight: 600 }}>{p.novos.length}</span>
        <span title="aprendendo" style={{ color: C.red, fontWeight: 600 }}>{p.aprendendo.length}</span>
        <span title="revisões" style={{ color: C.green, fontWeight: 600 }}>{p.revisoes.length}</span>
        <span style={{ fontSize: 12.5 }}>novos · aprendendo · revisões</span>
      </>
    );
    if (!c) {
      return (
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center", paddingTop: 30 }}>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>
            {prox.espera ? "Pausa curta" : "Revisão do dia concluída"}
          </div>
          <Empty>
            {prox.espera
              ? <>Os cartões que você errou há pouco voltam às {hora(prox.espera)}. Espaçar esse retorno é justamente o que fixa a memória. Volte nessa hora, ou encerre por agora.</>
              : <>Nada mais vence hoje. {p.acumuladas > 0 && <>Ficaram {p.acumuladas} revisões acima do seu limite diário; elas continuam na frente amanhã, das mais arriscadas para as mais seguras.</>}</>}
          </Empty>
          <div style={{ display: "flex", gap: 9, justifyContent: "center" }}>
            {prox.espera && <button className="ru-btn" onClick={() => setAgora(Date.now())} style={btnQ}>Verificar de novo</button>}
            <button className="ru-btn" onClick={() => { setEmSessao(false); ops.limparDesfazer(); }} style={btnP}>Voltar</button>
          </div>
        </div>
      );
    }
    return (
      <Sessao
        cartao={c}
        chave={exibidos}
        caminho={caminhoTexto(arvore, c.no)}
        previa={previa}
        agora={agora}
        topo={topo}
        onNota={(g, ms) => { ops.responder(c.id, g, MODO.DIARIA, ms, true); setExibidos((n) => n + 1); setAgora(Date.now()); }}
        podeDesfazer={ops.podeDesfazer}
        onDesfazer={() => { ops.desfazer(); setExibidos((n) => n + 1); setAgora(Date.now()); }}
        onSair={() => { setEmSessao(false); ops.limparDesfazer(); }}
        onEditar={ops.abrirEdicao}
      />
    );
  }

  return <Painel srs={srs} cfg={cfg} arvore={arvore} p={p} restantes={restantes} agora={agora}
    comecar={() => { setAgora(Date.now()); setEmSessao(true); }} irPara={irPara} />;
}

function Painel({ srs, cfg, arvore, p, restantes, agora, comecar, irPara }) {
  const prev = useMemo(() => previsao(srs.cartoes, cfg, agora, 7), [srs.cartoes, cfg, agora]);
  const ret = useMemo(() => retencaoReal(srs.log, agora, 30), [srs.log, agora]);
  const porNo = useMemo(() => contarPorNo(arvore, srs.cartoes, fimDoDia(agora, cfg.virada)), [arvore, srs.cartoes, agora, cfg.virada]);
  const maxPrev = Math.max(1, ...prev);
  const semana = prev.slice(1).reduce((a, b) => a + b, 0);

  const materias = arvore.raizes.concat(arvore.sem)
    .map((n) => ({ n, x: porNo.get(n.id) }))
    .filter((o) => o.x && o.x.total);

  if (!srs.cartoes.length) {
    return (
      <div>
        <PageHead title="Revisão diária" sub="A fila de hoje aparece aqui assim que existirem cartões." />
        <Sheet>
          <Empty>Nenhum cartão ainda. Importe um pacote JSON para começar; os cartões entram como novos e aparecem aqui aos poucos, no ritmo do seu limite diário.</Empty>
          <button className="ru-btn" onClick={() => irPara("importar")} style={btnP}>Importar pacote</button>
        </Sheet>
      </div>
    );
  }

  return (
    <div>
      <PageHead
        title="Revisão diária"
        sub="Só o que o algoritmo marcou para hoje: o que está perto de ser esquecido, mais os novos do dia."
        right={
          <button className="ru-btn" disabled={!restantes} onClick={comecar}
            style={{ ...btnP, padding: "12px 20px", fontSize: 15, opacity: restantes ? 1 : 0.45, cursor: restantes ? "pointer" : "default" }}>
            <Play size={15} /> {restantes ? `Revisar ${restantes}` : "Tudo em dia"}
          </button>
        }
      />

      <Sheet style={{ marginBottom: 20 }}>
        <div className="ru-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 24 }}>
          <Stat value={p.revisoes.length} label="revisões vencidas" color={p.revisoes.length ? C.green : C.inkFaint} />
          <Stat value={p.aprendendo.length} label="em aprendizado hoje" color={p.aprendendo.length ? C.red : C.inkFaint} />
          <Stat value={p.novos.length} label={`novos hoje (${p.novosNaFila} esperando)`} color={p.novos.length ? C.blue : C.inkFaint} />
          <Stat value={p.feitos.total} label="respostas dadas hoje" />
        </div>
        {p.acumuladas > 0 && (
          <div style={{ marginTop: 18, fontSize: 13.5, color: C.amber, lineHeight: 1.5 }}>
            Há {p.acumuladas} revisões vencidas além do limite de {cfg.revisoesPorDia} por dia. As mais arriscadas entram primeiro.
          </div>
        )}
      </Sheet>

      <div className="ru-duas" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)", gap: 20 }}>
        <Sheet>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Próximos dias</div>
          <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 16 }}>{semana} revisões previstas nos próximos 6 dias, sem contar novos.</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 110 }} role="img" aria-label={`Revisões por dia: ${prev.join(", ")}`}>
            {prev.map((v, i) => {
              const dia = new Date(agora + i * 86400000);
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, minWidth: 0 }}>
                  <span style={{ fontSize: 12, color: C.inkSoft, fontVariantNumeric: "tabular-nums" }}>{v}</span>
                  <div style={{ width: "100%", maxWidth: 34, height: Math.max(2, (v / maxPrev) * 70), background: i === 0 ? C.blue : C.blueMid, opacity: i === 0 ? 1 : 0.55, borderRadius: "4px 4px 0 0" }} />
                  <span style={{ fontSize: 11.5, color: C.inkSoft }}>{i === 0 ? "hoje" : DIAS_CURTOS[dia.getDay()]}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.lineSoft}`, fontSize: 13.5, color: C.inkSoft, lineHeight: 1.55 }}>
            {ret
              ? <>Retenção real nos últimos 30 dias: <strong style={{ color: C.ink }}>{Math.round(ret.taxa * 100)}%</strong> em {ret.n} revisões. Meta configurada: {Math.round(cfg.retencao * 100)}%.</>
              : <>A retenção real aparece depois das primeiras revisões.</>}
          </div>
        </Sheet>

        <Sheet>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Por área</div>
          {materias.map(({ n, x }, i) => (
            <button key={n.id} className="ru-row" onClick={() => irPara("livre", n.id)} style={{
              display: "flex", width: "100%", alignItems: "center", gap: 10, padding: "9px 4px", background: "transparent",
              border: "none", borderTop: i ? `1px solid ${C.lineSoft}` : "none", cursor: "pointer", fontFamily: "inherit", color: C.ink, textAlign: "left"
            }}>
              <span style={{ flex: 1, fontSize: 14.5 }}>{n.nome}</span>
              <span style={{ fontSize: 12.5, color: C.inkSoft }}>{x.total}</span>
              {x.vencidos > 0 ? <Tag color={C.amber}>{x.vencidos} vencidos</Tag> : <Tag color={C.green}>em dia</Tag>}
            </button>
          ))}
        </Sheet>
      </div>
    </div>
  );
}
