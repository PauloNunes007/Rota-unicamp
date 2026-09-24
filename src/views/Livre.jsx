import React, { useEffect, useMemo, useState } from "react";
import { ChevronRight, Play } from "lucide-react";
import { C, R, SH, btnP, sel, lbl } from "../tema.js";
import { PageHead, Sheet, Empty, Tag } from "../ui.jsx";
import { Sessao } from "./Sessao.jsx";
import { agendar, fimDoDia, State } from "../srs/fsrs.js";
import { MODO } from "../srs/fila.js";
import { caminho, caminhoTexto, contarPorNo, descendentes, resolverNo } from "../dados.js";

const FILTROS = {
  todos: { nome: "Todos os cartões", f: () => true },
  vencidos: { nome: "Só os vencidos", f: (c, fim) => c.srs.state !== State.NOVO && c.srs.due < fim },
  novos: { nome: "Só os que nunca vi", f: (c) => c.srs.state === State.NOVO },
  vistos: { nome: "Só os que já vi", f: (c) => c.srs.state !== State.NOVO },
  dificeis: { nome: "Difíceis (já errei ou dificuldade alta)", f: (c) => c.srs.lapses > 0 || c.srs.d >= 7 },
};

function embaralhar(a) {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; }
  return x;
}

export function Livre({ srs, cfg, config, arvore, ops, noInicial }) {
  const [selecionado, setSelecionado] = useState(noInicial || null);
  const [abertos, setAbertos] = useState(() => new Set(noInicial ? caminho(arvore, noInicial).map((n) => n.id) : []));
  const [filtro, setFiltro] = useState("todos");
  const [misturar, setMisturar] = useState(true);
  const [registrar, setRegistrar] = useState(config.registrarLivre !== false);
  const [sessao, setSessao] = useState(null); // { fila: [ids], feitos, total, erros, exibidos }

  useEffect(() => { if (noInicial) setSelecionado(noInicial); }, [noInicial]);

  const agora = Date.now();
  const fim = fimDoDia(agora, cfg.virada);
  const porNo = useMemo(() => contarPorNo(arvore, srs.cartoes, fim), [arvore, srs.cartoes, fim]);
  const porId = useMemo(() => new Map(srs.cartoes.map((c) => [c.id, c])), [srs.cartoes]);

  const doNo = useMemo(() => {
    if (!selecionado) return [];
    const ids = descendentes(arvore, selecionado);
    return srs.cartoes.filter((c) => !c.suspenso && ids.has(resolverNo(arvore, c.no)));
  }, [selecionado, arvore, srs.cartoes]);
  const escolhidos = useMemo(() => doNo.filter((c) => FILTROS[filtro].f(c, fim)), [doNo, filtro, fim]);

  function comecar() {
    const base = [...escolhidos].sort((a, b) => a.criado - b.criado || (a.ordem ?? 0) - (b.ordem ?? 0));
    const fila = (misturar ? embaralhar(base) : base).map((c) => c.id);
    setSessao({ fila, feitos: 0, total: fila.length, erros: 0, exibidos: 0, no: selecionado });
  }

  if (sessao) {
    const c = porId.get(sessao.fila[0]);
    const nome = arvore.porId.get(sessao.no)?.nome;
    if (!c) {
      return (
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center", paddingTop: 30 }}>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>{nome}: sessão concluída</div>
          <Empty>
            {sessao.feitos} respostas, {sessao.erros} {sessao.erros === 1 ? "erro" : "erros"}. Cada cartão errado voltou para o fim da fila até você acertar.
            {registrar ? " As respostas contaram para o agendamento." : " O agendamento não foi alterado."}
          </Empty>
          <button className="ru-btn" onClick={() => { setSessao(null); ops.limparDesfazer(); }} style={btnP}>Voltar à árvore</button>
        </div>
      );
    }
    const previa = registrar ? agendar(c.srs, agora, cfg, c.id) : null;
    const pos = sessao.total - sessao.fila.length + 1;
    return (
      <Sessao
        cartao={c}
        chave={sessao.exibidos}
        caminho={caminhoTexto(arvore, c.no)}
        previa={previa}
        agora={agora}
        topo={<><strong style={{ color: C.ink, fontWeight: 600 }}>{nome}</strong><span>{Math.min(pos, sessao.total)} de {sessao.total}{sessao.fila.length > sessao.total - pos + 1 ? " (+ repetições)" : ""}</span></>}
        avisoSemAgenda={registrar ? "Estudo livre: a resposta atualiza o agendamento deste cartão." : "Estudo livre sem registro: o agendamento não muda."}
        onNota={(g, ms) => {
          if (registrar) ops.responder(c.id, g, MODO.LIVRE, ms, true);
          const resto = sessao.fila.slice(1);
          // errou: volta para o fim da fila desta sessão
          setSessao({ ...sessao, fila: g === 1 ? [...resto, c.id] : resto, feitos: sessao.feitos + 1, erros: sessao.erros + (g === 1), exibidos: sessao.exibidos + 1, anterior: sessao });
        }}
        podeDesfazer={!!sessao.anterior}
        onDesfazer={() => {
          if (!sessao.anterior) return;
          if (registrar) ops.desfazer();
          setSessao({ ...sessao.anterior, exibidos: sessao.exibidos + 1 });
        }}
        onSair={() => { setSessao(null); ops.limparDesfazer(); }}
        onEditar={ops.abrirEdicao}
      />
    );
  }

  const alternar = (id) => {
    const s = new Set(abertos);
    s.has(id) ? s.delete(id) : s.add(id);
    setAbertos(s);
  };

  const linha = (n) => {
    const x = porNo.get(n.id);
    if (n.virtual && !x) return null;
    const temFilhos = n.filhos.length > 0;
    const aberto = abertos.has(n.id);
    const on = selecionado === n.id;
    return (
      <React.Fragment key={n.id}>
        <div className={on ? "" : "ru-row"} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "7px 12px 7px 0", paddingLeft: 8 + n.nivel * 20,
          background: on ? C.blueSoft : "transparent", borderRadius: R.sm,
        }}>
          <button onClick={() => temFilhos && alternar(n.id)} aria-label={aberto ? "Recolher" : "Expandir"} style={{
            background: "none", border: "none", padding: 4, cursor: temFilhos ? "pointer" : "default", color: C.inkSoft,
            visibility: temFilhos ? "visible" : "hidden", display: "inline-flex",
          }}>
            <ChevronRight size={15} style={{ transform: aberto ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
          </button>
          <button onClick={() => { setSelecionado(n.id); if (temFilhos && !aberto) alternar(n.id); }} style={{
            flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", padding: 0,
            cursor: "pointer", fontFamily: "inherit", textAlign: "left", color: on ? C.blue : C.ink,
          }}>
            {n.cor && n.nivel <= 1 && <span style={{ width: 8, height: 8, borderRadius: 999, background: n.cor, flexShrink: 0 }} />}
            <span style={{ flex: 1, fontSize: n.nivel === 0 ? 15 : 14.5, fontWeight: n.nivel === 0 || on ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.nome}</span>
            <span style={{ fontSize: 12.5, color: C.inkSoft, fontVariantNumeric: "tabular-nums" }}>{x?.total || 0}</span>
            {x?.vencidos > 0 && <Tag color={C.amber}>{x.vencidos}</Tag>}
          </button>
        </div>
        {aberto && n.filhos.map(linha)}
      </React.Fragment>
    );
  };

  const selNo = selecionado ? arvore.porId.get(selecionado) : null;
  const xSel = selecionado ? porNo.get(selecionado) : null;

  return (
    <div>
      <PageHead title="Estudo livre" sub="Escolha qualquer ponto da árvore e revise tudo o que está abaixo dele, na hora que quiser, fora da fila do dia." />
      <div className="ru-duas" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)", gap: 20, alignItems: "start" }}>
        <div style={{ background: C.card, borderRadius: R.lg, boxShadow: SH.card, padding: 10 }}>
          {arvore.raizes.map(linha)}
          {linha(arvore.sem)}
        </div>

        <Sheet style={{ position: "sticky", top: 0 }}>
          {!selNo ? (
            <Empty>Selecione uma matéria ou um tópico na árvore.</Empty>
          ) : (
            <>
              <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 4 }}>{caminho(arvore, selNo.id).slice(0, -1).map((n) => n.nome).join(" › ") || " "}</div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 14 }}>{selNo.nome}</div>
              <div style={{ display: "flex", gap: 18, fontSize: 13.5, color: C.inkSoft, marginBottom: 18, flexWrap: "wrap" }}>
                <span><strong style={{ color: C.ink }}>{xSel?.total || 0}</strong> cartões</span>
                <span><strong style={{ color: C.ink }}>{xSel?.vencidos || 0}</strong> vencidos</span>
                <span><strong style={{ color: C.ink }}>{xSel?.novos || 0}</strong> nunca vistos</span>
              </div>

              <div style={lbl}>Quais cartões</div>
              <select value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ ...sel, width: "100%", marginBottom: 14 }}>
                {Object.entries(FILTROS).map(([k, v]) => <option key={k} value={k}>{v.nome}</option>)}
              </select>

              <label style={{ display: "flex", gap: 9, alignItems: "center", fontSize: 14, color: C.inkSoft, marginBottom: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={misturar} onChange={(e) => setMisturar(e.target.checked)} />
                Embaralhar a ordem
              </label>
              <label style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 14, color: C.inkSoft, marginBottom: 20, cursor: "pointer", lineHeight: 1.45 }}>
                <input type="checkbox" checked={registrar} onChange={(e) => setRegistrar(e.target.checked)} style={{ marginTop: 3 }} />
                <span>Contar para o agendamento<br /><span style={{ fontSize: 12.5 }}>O FSRS considera o tempo real desde a última revisão, então revisar antes da hora não bagunça os intervalos. Desligado, é treino puro.</span></span>
              </label>

              <button className="ru-btn" disabled={!escolhidos.length} onClick={comecar} style={{ ...btnP, width: "100%", opacity: escolhidos.length ? 1 : 0.45, cursor: escolhidos.length ? "pointer" : "default" }}>
                <Play size={14} /> {escolhidos.length ? `Estudar ${escolhidos.length} ${escolhidos.length === 1 ? "cartão" : "cartões"}` : "Nenhum cartão com esse filtro"}
              </button>
            </>
          )}
        </Sheet>
      </div>
    </div>
  );
}
