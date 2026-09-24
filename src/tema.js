/* ============================================================
   Sistema visual
   Papel de caderno. Tinta azul. Correção em vermelho.
   Instrument Sans para interface e números, Literata para leitura.
   ============================================================ */
const CLARO = {
  bg: "#F6F4EF", card: "#FFFEFC", shell: "#FCFBF8",
  ink: "#28353E", inkSoft: "#647079", inkFaint: "#8C979D",
  line: "#E7E3D9", lineSoft: "#F0EDE5",
  blue: "#2F5286", blueMid: "#4A72AC", blueSoft: "#E9EEF5",
  red: "#B54B3F", redSoft: "#F6E9E6",
  green: "#3D7259", greenSoft: "#EAF1EC",
  amber: "#9A6B1F", amberSoft: "#F6EEDD",
  onBlue: "#fff",
  ombra: "rgba(40,53,62,",
};

const ESCURO = {
  bg: "#141618", card: "#1D2023", shell: "#191B1E",
  ink: "#E3E6E4", inkSoft: "#9BA2A5", inkFaint: "#7A8184",
  line: "#2B2F33", lineSoft: "#232629",
  blue: "#82A8DF", blueMid: "#6D93C9", blueSoft: "#1E2833",
  red: "#DD8478", redSoft: "#2C2220",
  green: "#77B896", greenSoft: "#1D2823",
  amber: "#D6AB65", amberSoft: "#2A2519",
  onBlue: "#12161A",
  ombra: "rgba(0,0,0,",
};

export const C = {};
export const SH = {};
export const R = { sm: 8, md: 12, lg: 16 };
export const inp = {}, sel = {}, btnP = {}, btnG = {}, btnQ = {}, btnI = {}, lbl = {};

export function aplicarTema(modo) {
  Object.assign(C, modo === "escuro" ? ESCURO : CLARO);
  const o = C.ombra;
  Object.assign(SH, {
    card: `0 1px 1px ${o}.03), 0 2px 6px ${o}.05)`,
    lift: `0 1px 2px ${o}.04), 0 8px 18px ${o}.09)`,
    hero: `0 1px 2px ${o}.05), 0 10px 26px ${o}.14)`,
  });
  Object.assign(inp, { background: C.card, border: `1px solid ${C.line}`, borderRadius: R.sm, color: C.ink, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", transition: "border-color .12s, box-shadow .12s" });
  Object.assign(sel, inp, { cursor: "pointer" });
  Object.assign(btnP, { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, background: C.blue, color: C.onBlue, border: "none", borderRadius: R.sm, padding: "10px 17px", fontSize: 14, fontFamily: "inherit", fontWeight: 500, cursor: "pointer", transition: "transform .1s, filter .12s" });
  Object.assign(btnG, { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, background: C.card, color: C.inkSoft, border: `1px solid ${C.line}`, borderRadius: R.sm, padding: "10px 16px", fontSize: 14, fontFamily: "inherit", cursor: "pointer", transition: "background .12s" });
  Object.assign(btnQ, { display: "inline-flex", alignItems: "center", gap: 6, background: C.blueSoft, color: C.blue, border: "none", borderRadius: 999, padding: "6px 13px", fontSize: 13, fontFamily: "inherit", fontWeight: 500, cursor: "pointer" });
  Object.assign(btnI, { background: "transparent", border: "none", cursor: "pointer", padding: 5, borderRadius: 6, display: "inline-flex", alignItems: "center", color: C.inkFaint });
  Object.assign(lbl, { fontSize: 13, color: C.inkSoft, marginBottom: 6 });
}
aplicarTema("claro");

export const FONTE_UI = "'Instrument Sans', system-ui, -apple-system, sans-serif";
export const FONTE_LEITURA = "'Literata', Georgia, serif";
