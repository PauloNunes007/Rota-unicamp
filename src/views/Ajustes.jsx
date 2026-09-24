import React, { useState } from "react";
import { C, inp, btnP, btnG, btnQ, lbl } from "../tema.js";
import { PageHead, Sheet } from "../ui.jsx";
import { CONFIG_APP_PADRAO, migrar } from "../dados.js";

const passos = (txt) => txt.split(/[\s,;]+/).map(Number).filter((n) => Number.isFinite(n) && n > 0);

function Campo({ rotulo, ajuda, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{rotulo}</div>
      {children}
      {ajuda && <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 6, lineHeight: 1.5, maxWidth: 560 }}>{ajuda}</div>}
    </div>
  );
}

export function Ajustes({ blob, config, ops, tema, trocarTema, sync }) {
  const [v, setV] = useState({
    ...config,
    passosAprendizado: config.passosAprendizado.join(" "),
    passosReaprendizado: config.passosReaprendizado.join(" "),
  });
  const [msg, setMsg] = useState(null);
  const [backupMsg, setBackupMsg] = useState(null);

  function salvar() {
    ops.setConfig({
      retencao: Math.min(0.97, Math.max(0.75, Number(v.retencao) || 0.9)),
      novosPorDia: Math.max(0, Math.round(Number(v.novosPorDia) || 0)),
      revisoesPorDia: Math.max(1, Math.round(Number(v.revisoesPorDia) || 1)),
      passosAprendizado: passos(v.passosAprendizado),
      passosReaprendizado: passos(v.passosReaprendizado),
      intervaloMax: Math.max(1, Math.round(Number(v.intervaloMax) || 365)),
      dataProva: v.dataProva || "",
      virada: Math.min(12, Math.max(0, Math.round(Number(v.virada) || 0))),
      fuzz: !!v.fuzz,
      registrarLivre: !!v.registrarLivre,
    });
    setMsg("Ajustes salvos. Os novos valores valem a partir da próxima resposta.");
    setTimeout(() => setMsg(null), 4000);
  }

  function baixarBackup() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(blob)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url; a.download = `rota-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function restaurar(file) {
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      if (!confirm("Restaurar este backup substitui todos os dados atuais. Continuar?")) return;
      ops.restaurar(migrar(parsed));
      setBackupMsg({ ok: true, t: "Backup restaurado." });
    } catch { setBackupMsg({ ok: false, t: "Esse arquivo não é um backup válido." }); }
  }

  const r = Math.round(Number(v.retencao) * 100);

  return (
    <div>
      <PageHead title="Ajustes" sub="Como o algoritmo agenda os cartões e quanto entra por dia." />

      <div className="ru-duas" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)", gap: 20, alignItems: "start" }}>
        <Sheet>
          <Campo rotulo={`Retenção desejada: ${r}%`}
            ajuda="A chance de lembrar que o FSRS mira no dia de cada revisão. Subir de 90% para 95% quase dobra a carga diária; abaixo de 85% você esquece demais. 90% é o ponto de equilíbrio mais usado.">
            <input type="range" min="0.8" max="0.97" step="0.01" value={v.retencao} onChange={(e) => setV({ ...v, retencao: e.target.value })} style={{ width: "100%", maxWidth: 360 }} />
          </Campo>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Campo rotulo="Novos por dia">
              <input type="number" min="0" value={v.novosPorDia} onChange={(e) => setV({ ...v, novosPorDia: e.target.value })} style={{ ...inp, width: 110 }} />
            </Campo>
            <Campo rotulo="Máximo de revisões por dia">
              <input type="number" min="1" value={v.revisoesPorDia} onChange={(e) => setV({ ...v, revisoesPorDia: e.target.value })} style={{ ...inp, width: 110 }} />
            </Campo>
          </div>
          <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: -8, marginBottom: 18, lineHeight: 1.5, maxWidth: 560 }}>
            Regra prática: depois de algumas semanas, as revisões diárias se estabilizam perto de 10 vezes o número de novos por dia. Importar um pacote grande não sobrecarrega, porque os novos entram aos poucos.
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Campo rotulo="Passos de aprendizado (min)">
              <input value={v.passosAprendizado} onChange={(e) => setV({ ...v, passosAprendizado: e.target.value })} style={{ ...inp, width: 150 }} />
            </Campo>
            <Campo rotulo="Passos ao errar (min)">
              <input value={v.passosReaprendizado} onChange={(e) => setV({ ...v, passosReaprendizado: e.target.value })} style={{ ...inp, width: 150 }} />
            </Campo>
          </div>
          <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: -8, marginBottom: 18, lineHeight: 1.5, maxWidth: 560 }}>
            Cartão novo ou esquecido volta nesses minutos, no mesmo dia, antes de ganhar intervalos em dias. Separe por espaço. Vazio pula direto para dias.
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Campo rotulo="Data da prova">
              <input type="date" value={v.dataProva} onChange={(e) => setV({ ...v, dataProva: e.target.value })} style={{ ...inp, width: 170 }} />
            </Campo>
            <Campo rotulo="Intervalo máximo (dias)">
              <input type="number" min="1" value={v.intervaloMax} onChange={(e) => setV({ ...v, intervaloMax: e.target.value })} style={{ ...inp, width: 110 }} />
            </Campo>
            <Campo rotulo="Dia vira às (h)">
              <input type="number" min="0" max="12" value={v.virada} onChange={(e) => setV({ ...v, virada: e.target.value })} style={{ ...inp, width: 90 }} />
            </Campo>
          </div>
          <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: -8, marginBottom: 18, lineHeight: 1.5, maxWidth: 560 }}>
            Com a data da prova preenchida, nenhum intervalo passa da véspera, então todo cartão tem uma revisão final antes dela. Apague a data para desligar.
          </div>

          <label style={{ display: "flex", gap: 9, alignItems: "center", fontSize: 14, marginBottom: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={!!v.fuzz} onChange={(e) => setV({ ...v, fuzz: e.target.checked })} />
            Espalhar levemente os intervalos (evita que cartões importados juntos vençam todos no mesmo dia)
          </label>
          <label style={{ display: "flex", gap: 9, alignItems: "center", fontSize: 14, marginBottom: 20, cursor: "pointer" }}>
            <input type="checkbox" checked={!!v.registrarLivre} onChange={(e) => setV({ ...v, registrarLivre: e.target.checked })} />
            No estudo livre, contar as respostas para o agendamento por padrão
          </label>

          <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
            <button className="ru-btn" onClick={salvar} style={btnP}>Salvar ajustes</button>
            <button className="ru-btn" onClick={() => setV({ ...CONFIG_APP_PADRAO, passosAprendizado: CONFIG_APP_PADRAO.passosAprendizado.join(" "), passosReaprendizado: CONFIG_APP_PADRAO.passosReaprendizado.join(" ") })} style={btnG}>Voltar ao padrão</button>
            {msg && <span style={{ fontSize: 13.5, color: C.green }}>{msg}</span>}
          </div>
        </Sheet>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Sheet>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Aparência</div>
            <button className="ru-btn" onClick={trocarTema} style={btnG}>{tema === "escuro" ? "Usar modo claro" : "Usar modo escuro"}</button>
          </Sheet>

          <Sheet>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Backup</div>
            <div style={{ fontSize: 13.5, color: C.inkSoft, marginBottom: 12, lineHeight: 1.55 }}>
              {sync}. O backup inclui cartões, histórico de revisões e os dados da versão anterior do app.
            </div>
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
              <button className="ru-btn" onClick={baixarBackup} style={btnP}>Baixar backup</button>
              <label className="ru-btn" style={{ ...btnQ, cursor: "pointer" }}>
                Restaurar de arquivo
                <input type="file" accept=".json,application/json" hidden onChange={(e) => { if (e.target.files[0]) restaurar(e.target.files[0]); e.target.value = ""; }} />
              </label>
            </div>
            {backupMsg && <div style={{ fontSize: 13, marginTop: 10, color: backupMsg.ok ? C.green : C.red }}>{backupMsg.t}</div>}
          </Sheet>

          <Sheet>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Sobre o algoritmo</div>
            <div style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.6 }}>
              FSRS-5, o mesmo agendador que o Anki usa hoje. Cada cartão guarda uma dificuldade (1 a 10) e uma estabilidade, que é quantos dias levam para a chance de lembrar cair a 90%. A cada resposta, o intervalo é recalculado para você revisar bem no ponto em que estaria começando a esquecer, que é onde uma revisão rende mais.
              <div style={{ ...lbl, marginTop: 10, marginBottom: 0 }}>{blob.srs.log.length} respostas registradas.</div>
            </div>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
