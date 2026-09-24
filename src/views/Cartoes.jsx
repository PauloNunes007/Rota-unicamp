import React, { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Pause, Play, Search } from "lucide-react";
import { C, R, SH, inp, sel, btnP, btnG, btnQ, btnI, lbl } from "../tema.js";
import { PageHead, Empty, Modal, SeletorNo, Tag } from "../ui.jsx";
import { State, ROTULO_ESTADO, chanceAgora, inicioDoDia } from "../srs/fsrs.js";
import { caminhoTexto, criarCartao, descendentes, exportarPacote, normalizar, resolverNo } from "../dados.js";

const POR_PAGINA = 100;

const ESTADOS = {
  todos: "Todos",
  novos: "Novos",
  aprendendo: "Aprendendo",
  revisao: "Em revisão",
  suspensos: "Suspensos",
  dificeis: "Difíceis",
};

function filtrarEstado(c, e) {
  if (e === "suspensos") return !!c.suspenso;
  if (e === "todos") return true;
  if (c.suspenso) return false;
  const s = c.srs.state;
  if (e === "novos") return s === State.NOVO;
  if (e === "aprendendo") return s === State.APRENDENDO || s === State.REAPRENDENDO;
  if (e === "revisao") return s === State.REVISAO;
  if (e === "dificeis") return c.srs.lapses > 0 || c.srs.d >= 7;
  return true;
}

function quando(c, agora, virada) {
  if (c.suspenso) return { t: "suspenso", cor: C.inkSoft };
  if (c.srs.state === State.NOVO) return { t: "novo", cor: C.blue };
  const dias = Math.round((inicioDoDia(c.srs.due, virada) - inicioDoDia(agora, virada)) / 86400000);
  if (c.srs.due <= agora || dias <= 0) return { t: "vence hoje", cor: C.amber };
  if (dias === 1) return { t: "amanhã", cor: C.inkSoft };
  return { t: `em ${dias} dias`, cor: C.inkSoft };
}

function baixar(nome, texto) {
  const url = URL.createObjectURL(new Blob([texto], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url; a.download = nome; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Cartoes({ srs, cfg, arvore, ops }) {
  const [no, setNo] = useState("");
  const [estado, setEstado] = useState("todos");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [novo, setNovo] = useState(false);
  const [mover, setMover] = useState("");

  const agora = Date.now();
  const lista = useMemo(() => {
    const ids = no ? descendentes(arvore, no) : null;
    const q = normalizar(busca);
    return srs.cartoes.filter((c) =>
      (!ids || ids.has(resolverNo(arvore, c.no))) &&
      filtrarEstado(c, estado) &&
      (!q || normalizar(`${c.frente} ${c.verso} ${c.extra || ""} ${(c.tags || []).join(" ")}`).includes(q))
    );
  }, [srs.cartoes, no, estado, busca, arvore]);

  const visiveis = lista.slice(0, pagina * POR_PAGINA);
  const ids = () => lista.map((c) => c.id);
  const qtd = `${lista.length} ${lista.length === 1 ? "cartão" : "cartões"}`;

  return (
    <div>
      <PageHead
        title="Cartões"
        sub="Todos os cartões da base. As ações em lote valem para o que estiver filtrado."
        right={<button className="ru-btn" onClick={() => setNovo(true)} style={btnP}><Plus size={14} /> Novo cartão</button>}
      />

      <div className="ru-filtros" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, .7fr) minmax(0, 1fr)", gap: 10, marginBottom: 14 }}>
        <SeletorNo arvore={arvore} value={no} onChange={(v) => { setNo(v); setPagina(1); }} incluirVazio incluirSem rotuloVazio="Todas as matérias" />
        <select value={estado} onChange={(e) => { setEstado(e.target.value); setPagina(1); }} style={sel}>
          {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div style={{ position: "relative" }}>
          <Search size={15} color={C.inkSoft} style={{ position: "absolute", left: 11, top: 11 }} />
          <input value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }} placeholder="Buscar no texto" style={{ ...inp, width: "100%", paddingLeft: 33 }} />
        </div>
      </div>

      {lista.length > 0 && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 14, fontSize: 13.5, color: C.inkSoft }}>
          <strong style={{ color: C.ink, fontWeight: 600, marginRight: 4 }}>{qtd}</strong>
          <SeletorNo arvore={arvore} value={mover} onChange={setMover} incluirVazio rotuloVazio="Mover para…" style={{ fontSize: 13, padding: "6px 10px", maxWidth: 220 }} />
          {mover && <button className="ru-btn" onClick={() => { ops.moverCartoes(ids(), mover); setMover(""); }} style={btnQ}>Mover {lista.length}</button>}
          <button className="ru-btn" onClick={() => baixar(`${no ? caminhoTexto(arvore, no, " - ") : "cartoes"}.json`, exportarPacote(lista, no ? caminhoTexto(arvore, no) : "Todos os cartões"))} style={btnQ}>Exportar JSON</button>
          <button className="ru-btn" onClick={() => ops.suspender(ids(), estado !== "suspensos")} style={btnQ}>{estado === "suspensos" ? "Reativar" : "Suspender"}</button>
          <button className="ru-btn" onClick={() => { if (confirm(`Zerar o progresso de ${qtd}? Eles voltam a ser novos.`)) ops.reiniciar(ids()); }} style={btnQ}>Zerar progresso</button>
          <button className="ru-btn" onClick={() => { if (confirm(`Excluir ${qtd} de vez? Isso não pode ser desfeito.`)) ops.removerCartoes(ids()); }} style={{ ...btnQ, background: C.redSoft, color: C.red }}>Excluir</button>
        </div>
      )}

      {!lista.length && <Empty>{srs.cartoes.length ? "Nenhum cartão com esses filtros." : "A base está vazia. Importe um pacote ou crie um cartão."}</Empty>}

      {lista.length > 0 && (
        <div style={{ borderRadius: R.md, overflow: "hidden", background: C.card, boxShadow: SH.card }}>
          {visiveis.map((c, i) => {
            const q = quando(c, agora, cfg.virada);
            const r = chanceAgora(c.srs, agora, cfg.virada);
            return (
              <div key={c.id} className="ru-linha-cartao" style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderTop: i ? `1px solid ${C.lineSoft}` : "none", opacity: c.suspenso ? 0.6 : 1 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.frente}</div>
                  <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {caminhoTexto(arvore, c.no)}
                    {c.srs.state !== State.NOVO && <> · {ROTULO_ESTADO[c.srs.state]} · dificuldade {c.srs.d.toFixed(1).replace(".", ",")}{r != null && <> · lembrar agora {Math.round(r * 100)}%</>}</>}
                  </div>
                </div>
                <Tag color={q.cor}>{q.t}</Tag>
                <button className="ru-btn" onClick={() => ops.abrirEdicao(c)} style={btnI} aria-label="Editar" title="Editar"><Pencil size={14} /></button>
                <button className="ru-btn" onClick={() => ops.suspender([c.id], !c.suspenso)} style={btnI} aria-label={c.suspenso ? "Reativar" : "Suspender"} title={c.suspenso ? "Reativar" : "Suspender"}>
                  {c.suspenso ? <Play size={14} /> : <Pause size={14} />}
                </button>
                <button className="ru-btn" onClick={() => { if (confirm("Excluir este cartão?")) ops.removerCartoes([c.id]); }} style={btnI} aria-label="Excluir" title="Excluir"><Trash2 size={14} /></button>
              </div>
            );
          })}
        </div>
      )}
      {lista.length > visiveis.length && (
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button className="ru-btn" onClick={() => setPagina(pagina + 1)} style={btnG}>Mostrar mais {Math.min(POR_PAGINA, lista.length - visiveis.length)}</button>
        </div>
      )}

      {novo && <EditarCartao arvore={arvore} inicial={{ no: no || "", frente: "", verso: "", extra: "" }} novo
        onSalvar={(v) => { ops.adicionarCartoes([criarCartao(v)]); }} onFechar={() => setNovo(false)} />}
    </div>
  );
}

export function EditarCartao({ arvore, inicial, novo, onSalvar, onFechar }) {
  const [v, setV] = useState({ ...inicial, tags: (inicial.tags || []).join(", ") });
  const [salvo, setSalvo] = useState(false);
  const ok = v.no && v.frente.trim() && v.verso.trim();

  function salvar() {
    if (!ok) return;
    const tags = v.tags.split(",").map((t) => t.trim()).filter(Boolean);
    onSalvar({ no: v.no, frente: v.frente.trim(), verso: v.verso.trim(), extra: v.extra?.trim() || undefined, tags });
    if (novo) { setV({ ...v, frente: "", verso: "", extra: "" }); setSalvo(true); }
    else onFechar();
  }

  return (
    <Modal title={novo ? "Novo cartão" : "Editar cartão"} onClose={onFechar} wide>
      <div style={lbl}>Tópico</div>
      <SeletorNo arvore={arvore} value={v.no} onChange={(no) => setV({ ...v, no })} incluirVazio style={{ width: "100%", marginBottom: 12 }} />
      <div style={lbl}>Frente</div>
      <textarea autoFocus value={v.frente} onChange={(e) => { setV({ ...v, frente: e.target.value }); setSalvo(false); }} style={{ ...inp, width: "100%", minHeight: 70, marginBottom: 12, resize: "vertical" }} />
      <div style={lbl}>Verso</div>
      <textarea value={v.verso} onChange={(e) => setV({ ...v, verso: e.target.value })} style={{ ...inp, width: "100%", minHeight: 70, marginBottom: 12, resize: "vertical" }} />
      <div style={lbl}>Explicação (opcional, aparece depois da resposta)</div>
      <textarea value={v.extra || ""} onChange={(e) => setV({ ...v, extra: e.target.value })} style={{ ...inp, width: "100%", minHeight: 50, marginBottom: 12, resize: "vertical" }} />
      <div style={lbl}>Tags (separadas por vírgula)</div>
      <input value={v.tags} onChange={(e) => setV({ ...v, tags: e.target.value })} style={{ ...inp, width: "100%", marginBottom: 18 }} />
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 9 }}>
        {salvo && <span style={{ fontSize: 13, color: C.green, marginRight: "auto" }}>Adicionado. Pode escrever o próximo.</span>}
        <button className="ru-btn" onClick={onFechar} style={btnG}>{novo ? "Fechar" : "Cancelar"}</button>
        <button className="ru-btn" onClick={salvar} disabled={!ok} style={{ ...btnP, opacity: ok ? 1 : 0.45 }}>{novo ? "Adicionar" : "Salvar"}</button>
      </div>
    </Modal>
  );
}
