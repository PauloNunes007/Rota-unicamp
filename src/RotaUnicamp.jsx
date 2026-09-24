import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarCheck, Network, Upload, Layers, Settings2 } from "lucide-react";
import { C, SH, R, aplicarTema, FONTE_UI } from "./tema.js";
import { storage } from "./storage.js";
import { agendar, diasEntre, cartaoNovo } from "./srs/fsrs.js";
import { panorama } from "./srs/fila.js";
import { STORAGE_KEY, migrar, dadosVazios, configFsrs, montarArvore, normalizar } from "./dados.js";
import { Hoje } from "./views/Hoje.jsx";
import { Livre } from "./views/Livre.jsx";
import { Importar } from "./views/Importar.jsx";
import { Cartoes, EditarCartao } from "./views/Cartoes.jsx";
import { Ajustes } from "./views/Ajustes.jsx";

const ROTAS = [
  { id: "hoje", nome: "Revisão diária", curto: "Hoje", Icone: CalendarCheck },
  { id: "livre", nome: "Estudo livre", curto: "Livre", Icone: Network },
  { id: "importar", nome: "Importar", curto: "Importar", Icone: Upload },
  { id: "cartoes", nome: "Cartões", curto: "Cartões", Icone: Layers },
  { id: "ajustes", nome: "Ajustes", curto: "Ajustes", Icone: Settings2 },
];

function lerHash() {
  const [, rota, param] = window.location.hash.split("/");
  return { rota: ROTAS.some((r) => r.id === rota) ? rota : "hoje", param: param ? decodeURIComponent(param) : null };
}

const TEXTO_SYNC = {
  salvo: "Sincronizado com o Supabase",
  enviando: "Sincronizando…",
  offline: "Sem conexão com o Supabase: salvo neste navegador, envia quando voltar",
  local: "Salvo só neste navegador (Supabase não configurado)",
  erro: "Não foi possível salvar neste navegador",
};

export default function RotaUnicamp() {
  const [blob, setBlob] = useState(dadosVazios);
  const ref = useRef(blob);
  const [carregado, setCarregado] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const [local, setLocal] = useState(lerHash);
  const [edicao, setEdicao] = useState(null);
  const [sync, setSync] = useState(storage.remoto ? "salvo" : "local");
  const desfazer = useRef([]);
  const [, forcar] = useState(0);

  // tema: o salvo, senão o do sistema
  const tema = blob.srs.tema || (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "escuro" : "claro");
  aplicarTema(tema);

  useEffect(() => {
    if (!document.getElementById("ru-fonts")) {
      const l = document.createElement("link");
      l.id = "ru-fonts"; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Literata:opsz,wght@7..72,400;7..72,500;7..72,600&display=swap";
      document.head.appendChild(l);
    }
    const off = storage.onStatus(setSync);
    const hash = () => setLocal(lerHash());
    window.addEventListener("hashchange", hash);
    (async () => {
      try {
        const res = await storage.get(STORAGE_KEY);
        if (res?.value) {
          const d = migrar(JSON.parse(res.value));
          ref.current = d; setBlob(d);
        }
        setCarregado(true);
      } catch (e) {
        if (e?.primeiraVez) setCarregado(true); // começa vazio
        else setFalhou(true);
      }
    })();
    return () => { off(); window.removeEventListener("hashchange", hash); };
  }, []);

  // Grava a cada mudança, só depois de uma carga bem-sucedida (o storage
  // agrupa os envios). A primeira gravação persiste a migração.
  useEffect(() => {
    if (carregado) storage.set(STORAGE_KEY, JSON.stringify(blob));
  }, [blob, carregado]);

  // Toda mudança passa por aqui. A ref mantém o estado mais recente mesmo
  // entre respostas rápidas, sem depender de closures antigas.
  const commit = useCallback((fn) => {
    const next = fn(ref.current);
    if (next === ref.current) return;
    ref.current = next;
    setBlob(next);
  }, []);
  const mudarSrs = useCallback((fn) => commit((b) => ({ ...b, srs: { ...b.srs, ...fn(b.srs) } })), [commit]);
  const mudarCartoes = useCallback((ids, fn) => {
    const alvo = new Set(ids);
    mudarSrs((s) => ({ cartoes: s.cartoes.map((c) => (alvo.has(c.id) ? fn(c) : c)) }));
  }, [mudarSrs]);

  const config = blob.srs.config;
  const cfg = useMemo(() => configFsrs(config), [config]);
  const arvore = useMemo(() => montarArvore(blob.srs.nosExtras), [blob.srs.nosExtras]);

  const ops = useMemo(() => ({
    responder(id, nota, modo, ms) {
      const s = ref.current.srs;
      const c = s.cartoes.find((x) => x.id === id);
      if (!c) return;
      const agora = Date.now();
      const cf = configFsrs(s.config);
      const novo = agendar(c.srs, agora, cf, c.id)[nota];
      const dias = c.srs.last == null ? 0 : diasEntre(c.srs.last, agora, cf.virada);
      desfazer.current.push({ id, antes: c.srs, tamanhoLog: s.log.length });
      mudarSrs((s) => ({
        cartoes: s.cartoes.map((x) => (x.id === id ? { ...x, srs: novo } : x)),
        log: [...s.log, [agora, id, nota, c.srs.state, dias, modo, Math.round(ms)]],
      }));
    },
    get podeDesfazer() { return desfazer.current.length > 0; },
    desfazer() {
      const u = desfazer.current.pop();
      if (!u) return;
      mudarSrs((s) => ({
        cartoes: s.cartoes.map((x) => (x.id === u.id ? { ...x, srs: u.antes } : x)),
        log: s.log.slice(0, u.tamanhoLog),
      }));
    },
    limparDesfazer() { desfazer.current = []; forcar((n) => n + 1); },
    abrirEdicao(c) { setEdicao(c); },
    adicionarCartoes(novos) { mudarSrs((s) => ({ cartoes: [...s.cartoes, ...novos] })); },
    editarCartao(id, patch) { mudarCartoes([id], (c) => ({ ...c, ...patch })); },
    removerCartoes(ids) {
      const alvo = new Set(ids);
      mudarSrs((s) => ({ cartoes: s.cartoes.filter((c) => !alvo.has(c.id)) }));
    },
    moverCartoes(ids, no) { mudarCartoes(ids, (c) => ({ ...c, no })); },
    suspender(ids, sim) { mudarCartoes(ids, (c) => ({ ...c, suspenso: sim || undefined })); },
    reiniciar(ids) { mudarCartoes(ids, (c) => ({ ...c, srs: cartaoNovo() })); },
    criarTopico(pai, nome) {
      const base = `${pai ? `${pai}.` : ""}u-${normalizar(nome).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "t"}`;
      const existentes = new Set(ref.current.srs.nosExtras.map((n) => n.id));
      let id = base;
      for (let i = 2; existentes.has(id) || arvore.porId.has(id); i++) id = `${base}-${i}`;
      mudarSrs((s) => ({ nosExtras: [...s.nosExtras, { id, pai, nome }] }));
      return id;
    },
    setConfig(patch) { mudarSrs((s) => ({ config: { ...s.config, ...patch } })); },
    restaurar(novoBlob) { desfazer.current = []; commit(() => novoBlob); },
  }), [mudarSrs, mudarCartoes, commit, arvore]);

  const irPara = useCallback((rota, param) => {
    window.location.hash = `/${rota}${param ? `/${encodeURIComponent(param)}` : ""}`;
  }, []);

  const trocarTema = () => mudarSrs(() => ({ tema: tema === "escuro" ? "claro" : "escuro" }));

  const agoraMin = Math.floor(Date.now() / 60000);
  const pendentesHoje = useMemo(() => {
    const p = panorama(blob.srs.cartoes, blob.srs.log, cfg, Date.now());
    return p.novos.length + p.revisoes.length + p.aprendendo.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob.srs.cartoes, blob.srs.log, cfg, agoraMin]);

  if (!carregado) {
    return (
      <div style={{ background: C.bg, height: "100vh", display: "flex", flexDirection: "column", gap: 14, alignItems: "center", justifyContent: "center", color: C.inkSoft, fontFamily: FONTE_UI, fontSize: 14, padding: 16, textAlign: "center" }}>
        {falhou ? (
          <>
            <div>Não consegui carregar seus dados do Supabase e não há cópia neste navegador.<br />Nada foi gravado, para não sobrescrever o que está salvo.</div>
            <button onClick={() => window.location.reload()} style={{ fontFamily: "inherit", fontSize: 14, padding: "9px 16px", borderRadius: 8, border: `1px solid ${C.line}`, background: C.card, color: C.ink, cursor: "pointer" }}>Tentar de novo</button>
          </>
        ) : "Abrindo os cartões…"}
      </div>
    );
  }

  const diasProva = config.dataProva ? diasEntre(Date.now(), new Date(`${config.dataProva}T09:00:00`).getTime(), cfg.virada) : null;
  const { rota, param } = local;

  return (
    <div style={{ fontFamily: FONTE_UI, background: C.bg, color: C.ink, height: "100vh", display: "flex", overflow: "hidden" }}>
      <style>{`
        html, body, #root { height: 100%; margin: 0; background: ${C.bg}; }
        * { box-sizing: border-box; }
        ::selection { background: ${C.blueSoft}; }
        code { font-family: ui-monospace, monospace; font-size: .92em; background: ${C.lineSoft}; padding: 1px 5px; border-radius: 4px; }
        .ru-nav:hover { background: ${C.lineSoft} !important; color: ${C.ink} !important; }
        .ru-row { transition: background .12s; }
        .ru-row:hover { background: ${C.lineSoft} !important; }
        .ru-btn { transition: filter .12s, transform .1s, box-shadow .12s; }
        .ru-btn:hover { filter: brightness(.97); }
        .ru-btn:active { transform: translateY(1px); }
        .ru-cartao { padding: 26px 40px 22px; }
        button:focus-visible, a:focus-visible, summary:focus-visible { outline: 2px solid ${C.blueMid}; outline-offset: 2px; }
        input:focus, textarea:focus, select:focus { border-color: ${C.blueMid} !important; box-shadow: 0 0 0 3px ${C.blueSoft}; }
        .ru-bottom { display: none; }
        *::-webkit-scrollbar { width: 10px; height: 10px; }
        *::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 999px; border: 3px solid ${C.bg}; }
        *::-webkit-scrollbar-track { background: transparent; }
        @media (max-width: 860px) {
          .ru-rail { display: none !important; }
          .ru-bottom { display: flex; }
          .ru-main { padding: 22px 16px 96px !important; }
          .ru-duas, .ru-filtros { grid-template-columns: minmax(0, 1fr) !important; }
          .ru-stats { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .ru-cartao { padding: 18px 18px 16px; }
          .ru-hide-sm { display: none; }
          .ru-head h1 { font-size: 26px !important; }
        }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>

      <nav className="ru-rail" style={{ width: 236, background: C.shell, borderRight: `1px solid ${C.line}`, padding: "24px 0 20px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "0 20px 20px" }}>
          <div style={{ background: C.blue, borderRadius: R.md, padding: "16px 16px 14px", color: C.onBlue, boxShadow: SH.hero }}>
            <div style={{ fontSize: 12.5, opacity: .78 }}>Para revisar hoje</div>
            <div style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.045em", fontVariantNumeric: "tabular-nums", marginTop: 4 }}>{pendentesHoje}</div>
            {diasProva != null && diasProva >= 0 && (
              <div style={{ fontSize: 12.5, opacity: .78, marginTop: 6 }}>{diasProva === 0 ? "a prova é hoje" : `${diasProva} ${diasProva === 1 ? "dia" : "dias"} até a prova`}</div>
            )}
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12, flex: 1 }}>
          {ROTAS.map(({ id, nome, Icone }) => {
            const on = rota === id;
            return (
              <div key={id} style={{ padding: "0 10px" }}>
                <button className={on ? "" : "ru-nav"} onClick={() => irPara(id)} aria-current={on ? "page" : undefined} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "9px 12px", marginBottom: 2,
                  border: "none", borderRadius: R.sm, cursor: "pointer", fontFamily: "inherit", fontSize: 14.5,
                  background: on ? C.blueSoft : "transparent", color: on ? C.blue : C.inkSoft, fontWeight: on ? 600 : 400,
                }}>
                  <Icone size={16} /> {nome}
                </button>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "12px 20px 0", fontSize: 12, color: C.inkSoft, lineHeight: 1.45 }}>
          {blob.srs.cartoes.length} cartões · {TEXTO_SYNC[sync] || ""}
        </div>
      </nav>

      <main className="ru-main" style={{ flex: 1, minWidth: 0, padding: "40px 48px 80px", overflowY: "auto" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          {rota === "hoje" && <Hoje srs={blob.srs} cfg={cfg} arvore={arvore} ops={ops} irPara={irPara} />}
          {rota === "livre" && <Livre key={param || "raiz"} srs={blob.srs} cfg={cfg} config={config} arvore={arvore} ops={ops} noInicial={param} />}
          {rota === "importar" && <Importar srs={blob.srs} arvore={arvore} ops={ops} noInicial={param} />}
          {rota === "cartoes" && <Cartoes srs={blob.srs} cfg={cfg} arvore={arvore} ops={ops} />}
          {rota === "ajustes" && <Ajustes blob={blob} config={config} ops={ops} tema={tema} trocarTema={trocarTema} sync={TEXTO_SYNC[sync]} />}
        </div>
      </main>

      <nav className="ru-bottom" style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: C.shell, borderTop: `1px solid ${C.line}`, justifyContent: "space-around", padding: "6px 4px calc(6px + env(safe-area-inset-bottom))", zIndex: 40 }}>
        {ROTAS.map(({ id, curto, Icone }) => {
          const on = rota === id;
          return (
            <button key={id} onClick={() => irPara(id)} aria-current={on ? "page" : undefined} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none",
              padding: "6px 0", fontFamily: "inherit", fontSize: 11.5, color: on ? C.blue : C.inkSoft, fontWeight: on ? 600 : 400, cursor: "pointer", position: "relative",
            }}>
              <Icone size={19} />
              {curto}
              {id === "hoje" && pendentesHoje > 0 && (
                <span style={{ position: "absolute", top: 1, left: "calc(50% + 6px)", background: C.red, color: "#fff", borderRadius: 999, fontSize: 10, fontWeight: 600, padding: "1px 5px" }}>{pendentesHoje}</span>
              )}
            </button>
          );
        })}
      </nav>

      {edicao && (
        <EditarCartao arvore={arvore} inicial={edicao}
          onSalvar={(v) => ops.editarCartao(edicao.id, v)} onFechar={() => setEdicao(null)} />
      )}
    </div>
  );
}
