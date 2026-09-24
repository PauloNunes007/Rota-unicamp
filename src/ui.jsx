import React from "react";
import { X } from "lucide-react";
import { C, SH, R, sel, btnI, FONTE_UI } from "./tema.js";

export function Sheet({ children, style, accent }) {
  return (
    <div style={{ background: C.card, borderRadius: R.lg, boxShadow: SH.card, padding: 24, position: "relative", overflow: "hidden", ...style }}>
      {accent && <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: accent }} />}
      {children}
    </div>
  );
}

export function Empty({ children }) {
  return <div style={{ fontSize: 14.5, color: C.inkSoft, padding: "18px 0", lineHeight: 1.65, maxWidth: 600 }}>{children}</div>;
}

export function Tag({ children, color }) {
  const c = color || C.inkSoft;
  return <span style={{ fontSize: 12, fontWeight: 500, color: c, background: `${c}14`, borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>{children}</span>;
}

export function Stat({ value, label, color }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 38, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.035em", color: color || C.ink, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 13.5, color: C.inkSoft, marginTop: 8, maxWidth: 200, lineHeight: 1.4 }}>{label}</div>
    </div>
  );
}

export function PageHead({ title, sub, right }) {
  return (
    <div className="ru-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, marginBottom: 28, flexWrap: "wrap" }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.12 }}>{title}</h1>
        {sub && <div style={{ fontSize: 15.5, color: C.inkSoft, marginTop: 9, maxWidth: 680, lineHeight: 1.55 }}>{sub}</div>}
      </div>
      {right && <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>{right}</div>}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,20,27,.42)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 }}>
      <div role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()} style={{ background: C.card, color: C.ink, borderRadius: R.lg, boxShadow: SH.lift, padding: 26, width: wide ? 640 : 520, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto", boxSizing: "border-box", fontFamily: FONTE_UI }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.015em" }}>{title}</div>
          <button className="ru-btn" onClick={onClose} style={btnI} aria-label="Fechar"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Lista a árvore inteira num <select>, com recuo por nível.
export function SeletorNo({ arvore, value, onChange, style, incluirVazio, incluirSem, rotuloVazio = "Escolha o tópico" }) {
  const opcoes = [];
  const visitar = (n) => {
    opcoes.push(n);
    n.filhos.forEach(visitar);
  };
  arvore.raizes.forEach(visitar);
  if (incluirSem) opcoes.push(arvore.sem);
  return (
    <select value={value || ""} onChange={(e) => onChange(e.target.value)} style={{ ...sel, ...style }}>
      {incluirVazio && <option value="">{rotuloVazio}</option>}
      {opcoes.map((n) => (
        <option key={n.id} value={n.id}>{"   ".repeat(n.nivel)}{n.nome}</option>
      ))}
    </select>
  );
}

// Texto do cartão: preserva quebras de linha e aceita **negrito**.
export function TextoCartao({ children }) {
  const partes = String(children ?? "").split(/(\*\*[^*]+\*\*)/g);
  return (
    <span style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
      {partes.map((p, i) => (p.startsWith("**") && p.endsWith("**") && p.length > 4
        ? <strong key={i} style={{ fontWeight: 600 }}>{p.slice(2, -2)}</strong>
        : <React.Fragment key={i}>{p}</React.Fragment>))}
    </span>
  );
}
