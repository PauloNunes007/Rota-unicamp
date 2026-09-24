import React, { useMemo, useRef, useState } from "react";
import { Upload, Plus, FileJson } from "lucide-react";
import { C, R, inp, btnP, btnG, btnQ, lbl } from "../tema.js";
import { PageHead, Sheet, SeletorNo, TextoCartao } from "../ui.jsx";
import { lerPacote, chaveCartao, caminhoTexto, criarCartao, descendentes, resolverNo } from "../dados.js";

const EXEMPLO = `{
  "nome": "nome do pacote (opcional)",
  "cartoes": [
    { "frente": "...", "verso": "..." },
    { "frente": "...", "verso": "...", "extra": "explicação opcional", "tags": ["opcional"] }
  ]
}`;

export function Importar({ srs, arvore, ops, noInicial }) {
  const [destino, setDestino] = useState(noInicial || "");
  const [lotes, setLotes] = useState([]); // [{ origem, itens, invalidos, erro }]
  const [colar, setColar] = useState("");
  const [aceitarDuplicados, setAceitarDuplicados] = useState(false);
  const [novoTopico, setNovoTopico] = useState("");
  const [msg, setMsg] = useState(null);
  const [arrastando, setArrastando] = useState(false);
  const arquivo = useRef(null);

  async function lerArquivos(files) {
    const novos = [];
    for (const f of files) {
      const texto = await f.text();
      const r = lerPacote(texto);
      novos.push({ origem: r.nome || f.name.replace(/\.json$/i, ""), ...r });
    }
    setLotes((l) => [...l, ...novos]);
    setMsg(null);
  }

  function lerColado() {
    if (!colar.trim()) return;
    const r = lerPacote(colar);
    setLotes((l) => [...l, { origem: r.nome || "colado", ...r }]);
    if (!r.erro) setColar("");
    setMsg(null);
  }

  // Duplicado = mesma frente e verso já existentes no tópico de destino
  // (ou em algum tópico abaixo dele), ou repetido dentro dos arquivos.
  const analise = useMemo(() => {
    const ids = destino ? descendentes(arvore, destino) : new Set();
    const existentes = new Set(srs.cartoes.filter((c) => ids.has(resolverNo(arvore, c.no))).map((c) => chaveCartao(c.frente, c.verso)));
    const vistos = new Set();
    let validos = 0, duplicados = 0, invalidos = 0;
    const entrar = [];
    for (const l of lotes) {
      if (l.erro) continue;
      invalidos += l.invalidos.length;
      for (const it of l.itens) {
        const k = chaveCartao(it.frente, it.verso);
        const dup = existentes.has(k) || vistos.has(k);
        vistos.add(k);
        if (dup) duplicados++; else validos++;
        if (!dup || aceitarDuplicados) entrar.push({ ...it, origem: l.origem });
      }
    }
    return { validos, duplicados, invalidos, entrar };
  }, [lotes, destino, srs.cartoes, arvore, aceitarDuplicados]);

  function confirmar() {
    if (!destino || !analise.entrar.length) return;
    const base = Date.now();
    const cartoes = analise.entrar.map((it, i) => ({ ...criarCartao({ ...it, no: destino }, i), criado: base }));
    ops.adicionarCartoes(cartoes);
    setMsg(`${cartoes.length} ${cartoes.length === 1 ? "cartão importado" : "cartões importados"} em ${caminhoTexto(arvore, destino)}. Eles entram na revisão diária como novos.`);
    setLotes([]);
  }

  function criarTopico() {
    const nome = novoTopico.trim();
    if (!nome) return;
    const id = ops.criarTopico(destino || null, nome);
    setDestino(id);
    setNovoTopico("");
  }

  const pronto = destino && analise.entrar.length > 0;

  return (
    <div>
      <PageHead title="Importar pacote" sub="Escolha onde os cartões entram e envie um ou mais arquivos .json. Nada é gravado antes de você conferir e confirmar." />

      <div className="ru-duas" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 1fr)", gap: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Sheet>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>1. Destino</div>
            <SeletorNo arvore={arvore} value={destino} onChange={setDestino} incluirVazio style={{ width: "100%" }} />
            {destino && <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 8 }}>{caminhoTexto(arvore, destino)}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input value={novoTopico} onChange={(e) => setNovoTopico(e.target.value)} onKeyDown={(e) => e.key === "Enter" && criarTopico()}
                placeholder={destino ? "Novo subtópico dentro deste" : "Nova matéria"} style={{ ...inp, flex: 1, minWidth: 0 }} />
              <button className="ru-btn" onClick={criarTopico} disabled={!novoTopico.trim()} style={{ ...btnG, opacity: novoTopico.trim() ? 1 : 0.5 }}><Plus size={14} /> Criar</button>
            </div>
          </Sheet>

          <Sheet>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>2. Arquivos</div>
            <div
              onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
              onDragLeave={() => setArrastando(false)}
              onDrop={(e) => { e.preventDefault(); setArrastando(false); lerArquivos([...e.dataTransfer.files]); }}
              onClick={() => arquivo.current?.click()}
              style={{
                border: `1.5px dashed ${arrastando ? C.blue : C.line}`, background: arrastando ? C.blueSoft : "transparent",
                borderRadius: R.md, padding: "28px 16px", textAlign: "center", cursor: "pointer", color: C.inkSoft, fontSize: 14,
              }}>
              <Upload size={20} style={{ marginBottom: 8 }} />
              <div>Arraste os arquivos .json aqui ou clique para escolher</div>
              <input ref={arquivo} type="file" accept=".json,application/json" multiple hidden
                onChange={(e) => { lerArquivos([...e.target.files]); e.target.value = ""; }} />
            </div>

            <details style={{ marginTop: 14 }}>
              <summary style={{ fontSize: 13.5, color: C.inkSoft, cursor: "pointer" }}>Ou colar o JSON</summary>
              <textarea value={colar} onChange={(e) => setColar(e.target.value)} placeholder='[{"frente": "...", "verso": "..."}]'
                style={{ ...inp, width: "100%", minHeight: 120, marginTop: 10, fontFamily: "ui-monospace, monospace", fontSize: 12.5, resize: "vertical" }} />
              <button className="ru-btn" onClick={lerColado} style={{ ...btnQ, marginTop: 8 }}>Ler texto colado</button>
            </details>

            {lotes.length > 0 && (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                {lotes.map((l, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, padding: "8px 12px", background: l.erro ? C.redSoft : C.lineSoft, borderRadius: R.sm }}>
                    <FileJson size={15} color={l.erro ? C.red : C.inkSoft} />
                    <span style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
                      <strong style={{ fontWeight: 600 }}>{l.origem}</strong>{" "}
                      {l.erro
                        ? <span style={{ color: C.red }}>{l.erro}</span>
                        : <span style={{ color: C.inkSoft }}>
                            {l.itens.length} {l.itens.length === 1 ? "cartão" : "cartões"}
                            {l.invalidos.length > 0 && <span style={{ color: C.red }}>, {l.invalidos.length} sem frente ou verso (itens {l.invalidos.slice(0, 8).join(", ")}{l.invalidos.length > 8 ? "…" : ""})</span>}
                          </span>}
                    </span>
                    <button onClick={() => setLotes(lotes.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: C.inkSoft, cursor: "pointer", fontSize: 13 }}>remover</button>
                  </div>
                ))}
              </div>
            )}
          </Sheet>

          <Sheet>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>3. Conferir e importar</div>
            <div style={{ display: "flex", gap: 22, fontSize: 14, color: C.inkSoft, marginBottom: 14, flexWrap: "wrap" }}>
              <span><strong style={{ color: C.green, fontSize: 18 }}>{analise.validos}</strong> novos</span>
              <span><strong style={{ color: analise.duplicados ? C.amber : C.inkSoft, fontSize: 18 }}>{analise.duplicados}</strong> já existentes</span>
              <span><strong style={{ color: analise.invalidos ? C.red : C.inkSoft, fontSize: 18 }}>{analise.invalidos}</strong> inválidos</span>
            </div>
            {analise.duplicados > 0 && (
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13.5, color: C.inkSoft, marginBottom: 14, cursor: "pointer" }}>
                <input type="checkbox" checked={aceitarDuplicados} onChange={(e) => setAceitarDuplicados(e.target.checked)} />
                Importar os repetidos mesmo assim
              </label>
            )}
            {analise.entrar.length > 0 && (
              <div style={{ border: `1px solid ${C.lineSoft}`, borderRadius: R.sm, marginBottom: 14, maxHeight: 220, overflowY: "auto" }}>
                {analise.entrar.slice(0, 5).map((it, i) => (
                  <div key={i} style={{ padding: "9px 12px", borderTop: i ? `1px solid ${C.lineSoft}` : "none", fontSize: 13.5, lineHeight: 1.45 }}>
                    <div><TextoCartao>{it.frente}</TextoCartao></div>
                    <div style={{ color: C.inkSoft, marginTop: 3 }}><TextoCartao>{it.verso}</TextoCartao></div>
                  </div>
                ))}
                {analise.entrar.length > 5 && <div style={{ padding: "8px 12px", fontSize: 12.5, color: C.inkSoft, borderTop: `1px solid ${C.lineSoft}` }}>e mais {analise.entrar.length - 5}</div>}
              </div>
            )}
            <button className="ru-btn" onClick={confirmar} disabled={!pronto} style={{ ...btnP, opacity: pronto ? 1 : 0.45, cursor: pronto ? "pointer" : "default" }}>
              {!destino ? "Escolha o destino primeiro" : `Importar ${analise.entrar.length} ${analise.entrar.length === 1 ? "cartão" : "cartões"}`}
            </button>
            {msg && <div style={{ fontSize: 13.5, color: C.green, marginTop: 12, lineHeight: 1.5 }}>{msg}</div>}
          </Sheet>
        </div>

        <Sheet>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Formato do arquivo</div>
          <div style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.55, marginBottom: 12 }}>
            Um objeto com a lista em <code>cartoes</code>, ou só o array. Só <code>frente</code> e <code>verso</code> são obrigatórios.
          </div>
          <pre style={{ background: C.lineSoft, borderRadius: R.sm, padding: 14, fontSize: 12, lineHeight: 1.5, overflowX: "auto", margin: 0, color: C.ink }}>{EXEMPLO}</pre>
          <div style={{ ...lbl, marginTop: 14, lineHeight: 1.55 }}>
            Também aceita os nomes <code>pergunta</code>/<code>resposta</code>, <code>front</code>/<code>back</code> e <code>question</code>/<code>answer</code>.
            Use <code>**texto**</code> para negrito e quebras de linha normais. Se o mesmo arquivo for enviado duas vezes, os repetidos são detectados.
          </div>
        </Sheet>
      </div>
    </div>
  );
}
