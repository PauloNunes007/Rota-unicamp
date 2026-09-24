import React, { useEffect, useRef, useState } from "react";
import { Undo2, Pencil, X } from "lucide-react";
import { C, SH, R, btnG, btnP, btnI, FONTE_LEITURA } from "../tema.js";
import { TextoCartao } from "../ui.jsx";
import { rotuloIntervalo } from "../srs/fsrs.js";

export const BOTOES = [
  { g: 1, nome: "Errei", tecla: "1", cor: () => C.red },
  { g: 2, nome: "Difícil", tecla: "2", cor: () => C.amber },
  { g: 3, nome: "Bom", tecla: "3", cor: () => C.blue },
  { g: 4, nome: "Fácil", tecla: "4", cor: () => C.green },
];

// Cartão em revisão. Não sabe de fila nem de algoritmo: recebe a prévia
// dos quatro resultados e avisa qual nota foi dada.
export function Sessao({ cartao, chave, caminho, previa, agora, topo, onNota, onDesfazer, podeDesfazer, onSair, onEditar, avisoSemAgenda }) {
  const [virado, setVirado] = useState(false);
  const inicio = useRef(Date.now());

  // `chave` muda a cada cartão exibido, mesmo quando o mesmo cartão volta na fila
  useEffect(() => { setVirado(false); inicio.current = Date.now(); }, [chave]);

  const responder = (g) => onNota(g, Math.min(60000, Date.now() - inicio.current));

  useEffect(() => {
    const tecla = (e) => {
      if (e.target.closest("input, textarea, select") || document.querySelector("[role=dialog]")) return;
      if ((e.key === "z" || e.key === "Z") && podeDesfazer) { e.preventDefault(); onDesfazer(); return; }
      if (e.key === "Escape") { onSair(); return; }
      if (!cartao) return;
      if (!virado && (e.key === " " || e.key === "Enter")) { e.preventDefault(); setVirado(true); return; }
      if (virado) {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); responder(3); return; }
        const b = BOTOES.find((x) => x.tecla === e.key);
        if (b) { e.preventDefault(); responder(b.g); }
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  });

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ fontSize: 14, color: C.inkSoft, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>{topo}</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="ru-btn" onClick={onDesfazer} disabled={!podeDesfazer} title="Desfazer a última resposta (Z)"
            style={{ ...btnG, padding: "8px 12px", opacity: podeDesfazer ? 1 : 0.4, cursor: podeDesfazer ? "pointer" : "default" }}>
            <Undo2 size={15} /> <span className="ru-hide-sm">Desfazer</span>
          </button>
          <button className="ru-btn" onClick={onSair} style={{ ...btnG, padding: "8px 12px" }} title="Sair (Esc)">
            <X size={15} /> <span className="ru-hide-sm">Sair</span>
          </button>
        </div>
      </div>

      {cartao && (
        <>
          <div onClick={() => !virado && setVirado(true)} className="ru-cartao" style={{
            background: C.card, borderTop: `3px solid ${virado ? C.green : C.blue}`, boxShadow: SH.lift,
            borderRadius: R.lg, minHeight: 300, display: "flex", flexDirection: "column",
            cursor: virado ? "default" : "pointer", position: "relative"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, fontSize: 12.5, color: C.inkSoft }}>
              <span style={{ minWidth: 0 }}>{caminho}</span>
              {onEditar && (
                <button className="ru-btn" onClick={(e) => { e.stopPropagation(); onEditar(cartao); }} style={btnI} title="Editar este cartão" aria-label="Editar este cartão">
                  <Pencil size={14} />
                </button>
              )}
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center", padding: "26px 0 10px" }}>
              <div style={{ fontFamily: FONTE_LEITURA, fontSize: 22, lineHeight: 1.55 }}>
                <TextoCartao>{cartao.frente}</TextoCartao>
              </div>
              {virado && (
                <>
                  <div style={{ height: 1, background: C.line, margin: "26px 0" }} />
                  <div style={{ fontFamily: FONTE_LEITURA, fontSize: 21, lineHeight: 1.55 }}>
                    <TextoCartao>{cartao.verso}</TextoCartao>
                  </div>
                  {cartao.extra && (
                    <div style={{ fontSize: 14.5, color: C.inkSoft, marginTop: 20, lineHeight: 1.6, textAlign: "left", background: C.lineSoft, borderRadius: R.sm, padding: "12px 16px" }}>
                      <TextoCartao>{cartao.extra}</TextoCartao>
                    </div>
                  )}
                </>
              )}
            </div>
            {!virado && <div style={{ fontSize: 12.5, color: C.inkSoft, textAlign: "center" }}>toque ou aperte espaço para ver a resposta</div>}
          </div>

          {virado ? (
            <div className="ru-notas" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 16 }}>
              {BOTOES.map((b) => (
                <button key={b.g} className="ru-btn" onClick={() => responder(b.g)} style={{
                  ...btnG, flexDirection: "column", gap: 3, padding: "11px 6px",
                  color: b.cor(), borderColor: b.cor(), fontWeight: 500,
                }}>
                  <span>{b.nome}</span>
                  <span style={{ fontSize: 12, color: C.inkSoft, fontWeight: 400 }}>
                    {previa ? rotuloIntervalo(previa[b.g], agora) : b.g === 1 ? "de novo no fim" : " "}
                    <span className="ru-hide-sm" style={{ opacity: .7 }}> · {b.tecla}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
              <button className="ru-btn" onClick={() => setVirado(true)} style={{ ...btnP, minWidth: 200 }}>Mostrar resposta</button>
            </div>
          )}
          {avisoSemAgenda && <div style={{ textAlign: "center", fontSize: 12.5, color: C.inkSoft, marginTop: 12 }}>{avisoSemAgenda}</div>}
        </>
      )}
    </div>
  );
}
