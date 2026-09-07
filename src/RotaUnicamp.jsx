import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, ReferenceLine, Cell
} from "recharts";
import {
  Plus, Check, Trash2, RefreshCw, Settings2, X,
  RotateCw, ChevronRight, ArrowLeft
} from "lucide-react";
import {
  MOLDES, MOLDES_FONTE, INCIDENCIA_MAT, LEITURA_INCIDENCIA, ASSINATURA_BANCA,
  PEGADINHAS, RADAR_RECENTE, PLANO_MOLDES, MOLDE_STATUS_LABEL, MOLDE_STATUS_CICLO, pesoMolde
} from "./moldes.js";

/* ============================================================
   Sistema visual
   Papel de caderno. Tinta azul. Correção em vermelho.
   Instrument Sans para interface e números, Literata para leitura.
   ============================================================ */
const CLARO = {
  bg: "#F6F4EF", card: "#FFFEFC", shell: "#FCFBF8",
  ink: "#28353E", inkSoft: "#647079", inkFaint: "#9AA5AB",
  line: "#E7E3D9", lineSoft: "#F0EDE5",
  blue: "#2F5286", blueMid: "#4A72AC", blueSoft: "#E9EEF5",
  red: "#B54B3F", redSoft: "#F6E9E6",
  green: "#3D7259", greenSoft: "#EAF1EC",
  amber: "#AD7C2B", amberSoft: "#F6EEDD",
  paper: "#FDFBF4", paperRule: "#DCE6EF", paperMargin: "#E8A9A0", paperEdge: "#E4DFD2",
  cover: "linear-gradient(145deg,#3A5D8F 0%,#2A4470 55%,#1F3457 100%)",
  ombra: "rgba(40,53,62,",
};

const ESCURO = {
  bg: "#141618", card: "#1D2023", shell: "#191B1E",
  ink: "#E3E6E4", inkSoft: "#9BA2A5", inkFaint: "#6D7477",
  line: "#2B2F33", lineSoft: "#232629",
  blue: "#82A8DF", blueMid: "#6D93C9", blueSoft: "#1E2833",
  red: "#DD8478", redSoft: "#2C2220",
  green: "#77B896", greenSoft: "#1D2823",
  amber: "#D6AB65", amberSoft: "#2A2519",
  paper: "#212528", paperRule: "#2E353B", paperMargin: "#7A4A45", paperEdge: "#2A2E32",
  cover: "linear-gradient(145deg,#2E3438 0%,#212528 55%,#17191B 100%)",
  ombra: "rgba(0,0,0,",
};

const C = {};
const SH = {};
const R = { sm: 8, md: 12, lg: 16 };
const inp = {}, sel = {}, btnP = {}, btnG = {}, btnQ = {}, btnI = {}, lbl = {};

function applyTheme(modo) {
  Object.assign(C, modo === "escuro" ? ESCURO : CLARO);
  const o = C.ombra;
  Object.assign(SH, {
    card: `0 1px 1px ${o}.03), 0 2px 6px ${o}.05)`,
    lift: `0 1px 2px ${o}.04), 0 8px 18px ${o}.09)`,
    hero: `0 1px 2px ${o}.05), 0 10px 26px ${o}.14)`,
    page: `0 1px 2px ${o}.05), 0 14px 34px ${o}.13)`,
  });
  Object.assign(inp, { background: C.card, border: `1px solid ${C.line}`, borderRadius: R.sm, color: C.ink, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", outline: "none", transition: "border-color .12s, box-shadow .12s" });
  Object.assign(sel, inp, { cursor: "pointer" });
  Object.assign(btnP, { display: "inline-flex", alignItems: "center", gap: 7, background: C.blue, color: modo === "escuro" ? "#12161A" : "#fff", border: "none", borderRadius: R.sm, padding: "10px 17px", fontSize: 14, fontFamily: "inherit", fontWeight: 500, cursor: "pointer", transition: "transform .1s, filter .12s" });
  Object.assign(btnG, { display: "inline-flex", alignItems: "center", gap: 7, background: C.card, color: C.inkSoft, border: `1px solid ${C.line}`, borderRadius: R.sm, padding: "10px 16px", fontSize: 14, fontFamily: "inherit", cursor: "pointer", transition: "background .12s" });
  Object.assign(btnQ, { display: "inline-flex", alignItems: "center", gap: 6, background: C.blueSoft, color: C.blue, border: "none", borderRadius: 999, padding: "6px 13px", fontSize: 13, fontFamily: "inherit", fontWeight: 500, cursor: "pointer" });
  Object.assign(btnI, { background: "transparent", border: "none", cursor: "pointer", padding: 5, borderRadius: 6, display: "inline-flex", alignItems: "center" });
  Object.assign(lbl, { fontSize: 13, color: C.inkSoft, marginBottom: 6 });
}
applyTheme("claro");

// Uma cor discreta por matéria, usada nas divisórias do caderno de erros
const SUBJECT_COLOR = {
  "Matemática": "#4A72AC", "Física": "#7D6BAE", "Química": "#3D9187",
  "Biologia": "#3D7259", "Geografia": "#AD7C2B", "História": "#B5673F",
  "Filosofia": "#8A6D9E", "Sociologia": "#B54B87", "Português": "#B54B3F",
  "Literatura": "#9C5A3C", "Inglês": "#5C7FA6",
};


const EXAM_DATE = new Date("2026-10-18T09:00:00");
const TARGET_SCORE = 60;
const CUTOFF_SCORE = 47;
const TOTAL_QUESTIONS = 72;
const STORAGE_KEY = "rota-unicamp-data-v1";

const PACE_MIN_PER_QUESTION = {
  "Matemática": 8, "Física": 6, "Química": 6, "Biologia": 4, "Geografia": 4,
  "História": 4, "Filosofia": 4, "Sociologia": 4, "Português": 5, "Literatura": 5, "Inglês": 3
};
const SUBJECTS = Object.keys(PACE_MIN_PER_QUESTION);
const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const DEFAULT_WEEK_SCHEDULE = [
  { type: "simulado", subjects: [] },
  { type: "study", subjects: ["Matemática", "Física"] },
  { type: "study", subjects: ["Química", "Biologia"] },
  { type: "study", subjects: ["Geografia", "História"] },
  { type: "study", subjects: ["Filosofia", "Sociologia"] },
  { type: "study", subjects: ["Matemática", "Português"] },
  { type: "study", subjects: ["Literatura", "Inglês"] },
];

const SUBJECT_MODES_DEFAULT = {
  "Matemática": "treino", "Química": "treino", "Física": "profundidade",
  "Biologia": "profundidade", "Geografia": "profundidade", "História": "profundidade",
  "Filosofia": "profundidade", "Sociologia": "profundidade",
  "Português": "profundidade", "Literatura": "profundidade", "Inglês": "treino",
};
const MODE_LABEL = {
  treino: "Treino, vários tópicos e volume de questões",
  profundidade: "Profundidade, um tópico por dia, teoria e depois questões",
};

const ERROR_TYPES = {
  conteudo:      { label: "Lacuna de conteúdo", color: C.red,   fix: "Precisa estudar o tópico" },
  grandeza:      { label: "Grandeza errada",     color: C.amber, fix: "Sublinhe o que é pedido antes de calcular" },
  conta:         { label: "Erro de conta",       color: "#7B4B9E", fix: "Confira a ordem de grandeza antes de marcar" },
  interpretacao: { label: "Interpretação",       color: C.blue,  fix: "Releia enunciado e figura antes de montar" },
  desconfianca:  { label: "Troquei por dúvida",  color: "#1F7A73", fix: "Não troque sem achar o erro na primeira" },
  tempo:         { label: "Tempo ou cansaço",    color: C.inkSoft, fix: "Gestão de prova, não de estudo" },
};

const STATUS_LABELS = { not_started: "Não estudado", in_progress: "Estudando", reviewing: "Revisando", mastered: "Dominado" };
const STATUS_COLORS = { not_started: C.red, in_progress: C.amber, reviewing: C.blue, mastered: C.green };
const INCIDENCE_WEIGHT = { altissima: 3, alta: 2, media: 1 };
const INCIDENCE_TITLE = { altissima: "Cai muito", alta: "Cai bastante", media: "Cai pouco" };

/* ---------------- utilidades ---------------- */
function todayISO() { return new Date().toISOString().slice(0, 10); }
function addDays(iso, n) { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
function fmtDate(iso) { const d = new Date(iso + "T12:00:00"); return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }); }
function diffDays(a, b) { return Math.round((new Date(a + "T12:00:00") - new Date(b + "T12:00:00")) / 86400000); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

/* ---------------- dados semente ---------------- */
function seedTopics() {
  const seed = [
    // Pesos vindos da contagem real de 105 questões objetivas da Unicamp.
    // Funções é 22% da prova, e geometria somada é 37%.
    ["Matemática", "Funções e Exponencial", 5, 0.75], ["Matemática", "Geometria Plana", 5, 0.40],
    ["Matemática", "Geometria Analítica", 4, 0.60], ["Matemática", "Geometria Espacial", 4, 0.60],
    ["Matemática", "Trigonometria", 4, 0.60], ["Matemática", "Matrizes, Determinantes e Complexos", 4, 0.65],
    ["Matemática", "Combinatória e Probabilidade", 3, 0.70], ["Matemática", "Polinômios", 3, 0.80],
    ["Matemática", "Porcentagem e Matemática Financeira", 3, 0.65],
    ["Matemática", "Conjuntos", 2, 0.70], ["Matemática", "Estatística e Médias", 2, 0.70],
    ["Física", "Cinemática e Encontros", 4, 0.60], ["Física", "Calorimetria e Termologia", 3, 0.85],
    ["Física", "Transferência de Calor", 3, 0.50], ["Física", "Gravitação e MCU", 4, 0.70],
    ["Física", "Eletricidade", 2, 0.70],
    ["Química", "Estequiometria", 5, 0.45], ["Química", "Termoquímica", 3, 0.60],
    ["Química", "Físico-Química Geral", 2, 0.70], ["Química", "Química Orgânica", 3, 0.70],
    ["Biologia", "Genética", 4, 0.55], ["Biologia", "Ecologia e Biomas", 4, 0.50],
    ["Biologia", "Fisiologia (metabolismo, excreção)", 3, 0.55], ["Biologia", "Botânica", 3, 0.50],
    ["Biologia", "Parasitologia", 3, 0.50],
    ["Geografia", "Geologia e Relevo", 4, 0.50], ["Geografia", "Geografia Humana e Urbanização", 3, 0.75],
    ["Geografia", "Geopolítica", 4, 0.65], ["Geografia", "Cartografia", 3, 0.70],
    ["História", "Brasil Colônia", 3, 0.70], ["História", "Brasil República e Primeira Guerra", 3, 0.70],
    ["História", "História Geral e Antiga", 3, 0.80],
    ["Filosofia", "Filosofia Moderna e Iluminismo", 3, 0.40], ["Filosofia", "Ética e Política", 3, 0.50],
    ["Sociologia", "Teoria Sociológica", 3, 0.75],
    ["Português", "Interpretação de Texto", 4, 0.75], ["Português", "Figuras de Linguagem", 3, 0.50],
    ["Literatura", "Questões sobre as obras", 4, 0.55], ["Inglês", "Interpretação de Texto", 2, 0.85],
  ];
  return seed.map(([subject, name, examWeight, acc]) => ({
    id: uid(), subject, name, examWeight, correct: Math.round(acc * 20), total: 20,
    lastPracticed: null, status: "in_progress", phase: "teoria", lessonsTotal: null, lessonsDone: 0
  }));
}

function seedAulas() {
  const mods = [
    ["Biologia", 1, "Bioquímica celular", "Água, sais, carboidratos, lipídios, proteínas, enzimas e ácidos nucleicos", "alta"],
    ["Biologia", 2, "Citologia, organelas e membranas", "Procarionte e eucarionte, organelas, membrana, transporte, microscopia", "altissima"],
    ["Biologia", 3, "Bioenergética", "Respiração celular, fermentação e fotossíntese", "altissima"],
    ["Biologia", 4, "Núcleo, DNA e divisão celular", "DNA, RNA, síntese proteica, código genético, mitose e meiose", "altissima"],
    ["Biologia", 5, "Genética mendeliana", "1ª e 2ª lei de Mendel, probabilidade, heredogramas", "alta"],
    ["Biologia", 6, "Genética pós-mendeliana e biotecnologia", "Alelos múltiplos, ligação, sexo, populações, engenharia genética", "alta"],
    ["Biologia", 7, "Evolução e filogenética", "Teorias, evidências, especiação, cladogramas", "altissima"],
    ["Biologia", 8, "Ecologia I", "Cadeias e teias, fluxo de energia, pirâmides, ciclos biogeoquímicos", "altissima"],
    ["Biologia", 9, "Ecologia II", "Relações ecológicas, sucessão, biomas, impactos e desequilíbrios", "altissima"],
    ["Biologia", 10, "Botânica e fisiologia vegetal", "Reino Plantae, angiospermas, tecidos condutores, hormônios", "alta"],
    ["Biologia", 11, "Fisiologia humana I", "Digestório, respiratório, circulatório e excretor", "media"],
    ["Biologia", 12, "Fisiologia humana II", "Endócrino, nervoso e imunológico", "alta"],
    ["Biologia", 13, "Zoologia", "Invertebrados, filo Arthropoda e filo Chordata", "alta"],
    ["Biologia", 14, "Microbiologia e saúde", "Vírus, bactérias, viroses, parasitoses, ISTs e saúde pública", "alta"],

    ["Química", 1, "Estequiometria", "Mol, massa molar, cálculo estequiométrico, reagente limitante e excesso", "altissima"],
    ["Química", 2, "Soluções", "Concentração comum e molar, percentual, diluição e mistura", "alta"],
    ["Química", 3, "Meio ambiente e química verde", "Poluição atmosférica, efeito estufa, chuva ácida", "altissima"],
    ["Química", 4, "Estudo da matéria", "Densidade, estados físicos, fenômenos físicos e químicos", "alta"],
    ["Química", 5, "Gases", "Pressão, pressão parcial, volume molar e transformações gasosas", "alta"],
    ["Química", 6, "Termoquímica", "Entalpia, delta H de reação, lei de Hess, combustão", "alta"],
    ["Química", 7, "Química orgânica", "Funções orgânicas, nomenclatura, isomeria e reações básicas", "alta"],
    ["Química", 8, "Eletroquímica e equilíbrio", "Pilhas, eletrólise, equilíbrio, pH e ácido-base", "media"],

    ["Física", 1, "Cinemática", "MU, MUV, gráficos, velocidade relativa, encontros, movimento circular", "altissima"],
    ["Física", 2, "Eletrodinâmica", "Corrente, resistores, lei de Ohm, circuitos, potência", "altissima"],
    ["Física", 3, "Termologia", "Calorimetria, mudanças de fase, transmissão de calor, gases ideais", "alta"],
    ["Física", 4, "Trabalho e energia", "Trabalho, energia mecânica, conservação e potência", "alta"],
    ["Física", 5, "Dinâmica", "Leis de Newton, atrito, plano inclinado e forças", "alta"],
    ["Física", 6, "Óptica", "Refração, reflexão, lentes e espelhos", "alta"],
    ["Física", 7, "Gravitação e MCU", "Leis de Kepler, gravitação universal, satélites e órbitas", "alta"],
    ["Física", 8, "Ondas", "Ondulatória, som, luz e espectro eletromagnético", "media"],

    ["Matemática", 1, "Matemática básica", "Porcentagem, razão e proporção, regra de três, escalas", "altissima"],
    ["Matemática", 2, "Funções", "Afim, quadrática, composta, exponencial, logaritmo, gráficos", "altissima"],
    ["Matemática", 3, "Geometria plana", "Áreas, triângulos, semelhança, circunferência, ângulos", "altissima"],
    ["Matemática", 4, "Trigonometria", "Triângulo retângulo, ciclo, arcos, lei dos senos e cossenos", "altissima"],
    ["Matemática", 5, "Sequências e progressões", "PA, PG, somas e aplicações", "alta"],
    ["Matemática", 6, "Geometria analítica", "Ponto, reta, distância, circunferência e cônicas", "alta"],
    ["Matemática", 7, "Combinatória e probabilidade", "Contagem, arranjo, combinação, probabilidade condicional", "alta"],
    ["Matemática", 8, "Polinômios e complexos", "Raízes, Girard, Briot-Ruffini, raízes racionais, complexos", "alta"],
    ["Matemática", 9, "Geometria espacial", "Prismas, pirâmides, cilindros, cones, esferas, volumes", "alta"],
    ["Matemática", 10, "Estatística e matrizes", "Média, mediana, moda, dispersão, matrizes, sistemas", "media"],

    ["História", 1, "Brasil Colônia", "Escravidão, povos indígenas, sociedade colonial, capitanias", "altissima"],
    ["História", 2, "Idade Moderna", "Navegações, mercantilismo, colonização da América, reinos africanos", "altissima"],
    ["História", 3, "Idade Contemporânea", "Revolução Francesa, independências, industrialização", "alta"],
    ["História", 4, "Idade Média", "Feudalismo, renascimento comercial, Igreja e cruzadas", "alta"],
    ["História", 5, "Brasil Monárquico", "Primeiro reinado, regência, segundo reinado, abolição", "alta"],
    ["História", 6, "Brasil República", "Primeira República, Vargas, ditadura, redemocratização", "alta"],
    ["História", 7, "Século XX mundial", "Guerras mundiais, Guerra Fria, descolonização", "alta"],

    ["Geografia", 1, "Geopolítica", "Conflitos, globalização, ordem mundial, blocos econômicos", "altissima"],
    ["Geografia", 2, "Volta ao mundo", "África, Oriente Médio, América Latina, Europa regional", "altissima"],
    ["Geografia", 3, "Espaço agrário", "Conflitos agrários, pecuária e produção agrícola brasileira", "alta"],
    ["Geografia", 4, "Espaço urbano", "Urbanização brasileira e problemas urbanos", "alta"],
    ["Geografia", 5, "Espaço brasileiro", "Território, regiões, regional de São Paulo", "alta"],
    ["Geografia", 6, "Geografia física", "Geologia, relevo, clima, biomas, tectônica", "alta"],
    ["Geografia", 7, "Cartografia", "Projeções, escalas, fusos, coordenadas, distorções", "alta"],
    ["Geografia", 8, "Indústria e energia", "Industrialização brasileira, matriz energética, comércio exterior", "alta"],

    ["Filosofia", 1, "Filosofia Antiga", "Sócrates e os sofistas, Platão, Aristóteles, helenismo", "altissima"],
    ["Filosofia", 2, "Filosofia Política", "Maquiavel, Hobbes, Locke, Rousseau, contrato social", "altissima"],
    ["Filosofia", 3, "Filosofia Moderna", "Descartes, racionalismo, empirismo, ética kantiana", "alta"],
    ["Filosofia", 4, "Mal e justiça", "Hannah Arendt, Foucault, poder e biopolítica", "alta"],

    ["Sociologia", 1, "Movimentos sociais", "Feminismo e gênero, movimento negro, movimentos agrários", "altissima"],
    ["Sociologia", 2, "Estado e cidadania", "Estado moderno, cidadania no Brasil, três poderes", "alta"],
    ["Sociologia", 3, "Cultura e sociedade", "Cultura, diversidade, etnocentrismo, preconceito", "alta"],
    ["Sociologia", 4, "Teoria sociológica", "Durkheim, Marx e Weber", "alta"],
    ["Sociologia", 5, "Sociologia brasileira", "Pensadores brasileiros e manifestações culturais", "alta"],

    ["Português", 1, "Gêneros textuais", "Notícia, reportagem, tirinha, charge, poema, argumentação", "altissima"],
    ["Português", 2, "Gramática e interpretação", "Polissemia, ambiguidade, intertextualidade, coesão", "alta"],
    ["Português", 3, "Figuras de linguagem", "Metáfora, metonímia, alegoria, ironia e demais", "alta"],
    ["Português", 4, "Estratégias de interpretação", "Imagem, inferência, confronto de argumentos", "alta"],
  ];
  return mods.map(([subject, order, title, scope, incidence]) => ({
    id: `${subject.slice(0, 3).toLowerCase()}-${order}`, subject, order, title, scope, incidence,
    status: "not_started", content: null, fixacao: null
  }));
}

function seedObras() {
  return [
    ["A Vida Não É Útil", "Ailton Krenak"], ["Prosas Seguidas de Odes Mínimas", "José Paulo Paes"],
    ["Morangos Mofados", "Caio Fernando Abreu"], ["Vida e Morte de M. J. Gonzaga de Sá", "Lima Barreto"],
    ["No Seu Pescoço", "Chimamanda Ngozi Adichie"], ["Olhos d'Água", "Conceição Evaristo"],
    ["Memórias Póstumas de Brás Cubas", "Machado de Assis"], ["Canções Escolhidas", "Paulo César Pinheiro"],
    ["Os Funerais da Mamãe Grande", "Gabriel García Márquez"],
  ].map(([title, author]) => ({ id: uid(), title, author, totalPages: null, currentPage: 0 }));
}

function seedSimulados() {
  const b = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { acertos: v[0], total: v[1] }]));
  return [
    {
      id: uid(), date: "2026-08-30", name: "Simulado Aberto Unicamp 2026 (Poliedro)", acertos: 50, total: 72,
      subjectBreakdown: b({ "Matemática": [5, 12], "Química": [2, 7], "Física": [5, 7], "Biologia": [5, 7],
        "Geografia": [6, 7], "História": [7, 7], "Filosofia": [0, 3], "Sociologia": [3, 3],
        "Português": [11, 12], "Inglês": [6, 7] })
    },
    {
      id: uid(), date: "2026-08-08", name: "Simulado Oficial Unicamp 2027", acertos: 55, total: 72,
      subjectBreakdown: b({ "Matemática": [11, 12], "Química": [5, 7], "Física": [7, 7], "Biologia": [2, 7],
        "Geografia": [5, 7], "História": [4, 6], "Filosofia": [2, 3], "Sociologia": [4, 4],
        "Português": [5, 6], "Literatura": [3, 6], "Inglês": [7, 7] })
    },
    { id: uid(), date: "2026-08-06", name: "Prova Unicamp 2021", acertos: 49, total: 72, subjectBreakdown: {} },
    {
      id: uid(), date: "2026-08-01", name: "Prova Unicamp 2019", acertos: 65, total: 89,
      subjectBreakdown: b({ "Matemática": [6, 13], "Química": [6, 8], "Física": [7, 9], "Biologia": [6, 11],
        "Geografia": [8, 11], "História": [10, 11], "Filosofia": [1, 1], "Sociologia": [1, 1],
        "Português": [5, 7], "Literatura": [6, 7], "Inglês": [8, 9] })
    },
    { id: uid(), date: "2026-07-25", name: "Simulado Poliedro Ciclo 1", acertos: 50, total: 72, subjectBreakdown: {} },
  ];
}

const emptyData = {
  topics: seedTopics(), errors: [], flashcards: [], aulas: seedAulas(), obras: seedObras(),
  simulados: seedSimulados(),
  // status por molde da banca, no formato { M01: "novo" | "treinando" | "dominado" }
  moldes: {},
  route: {},
  settings: { dailyHours: 8, blockMinutes: 120, weekSchedule: DEFAULT_WEEK_SCHEDULE, dailyReadingPages: 15, activeObraId: null, dailyCardLimit: 100, cardsFollowSchedule: true, subjectModes: SUBJECT_MODES_DEFAULT }
};

const SEED_VERSION = 5;

// Junta dados de fábrica novos a um armazenamento que já existe,
// sem apagar nada que o usuário tenha registrado.
function migrate(stored) {
  const d = { ...emptyData, ...(stored || {}) };
  d.settings = { ...emptyData.settings, ...(stored?.settings || {}) };

  if ((d.seedVersion || 0) < 2) {
    const key = (s) => `${s.date}|${s.name}`;
    // tira o marcador genérico das versões antigas
    const limpos = (d.simulados || []).filter(
      (s) => !(s.name === "Simulado Poliedro" && !Object.keys(s.subjectBreakdown || {}).length)
    );
    const jaTem = new Set(limpos.map(key));
    d.simulados = [...limpos, ...seedSimulados().filter((s) => !jaTem.has(key(s)))]
      .sort((a, b) => b.date.localeCompare(a.date));

    // completa módulos de aula que ainda não existiam
    const ids = new Set((d.aulas || []).map((a) => a.id));
    d.aulas = [...(d.aulas || []), ...seedAulas().filter((a) => !ids.has(a.id))];

    // completa obras e tópicos se estiverem vazios
    if (!d.obras || !d.obras.length) d.obras = seedObras();
    if (!d.topics || !d.topics.length) d.topics = seedTopics();

    d.seedVersion = 2;
  }

  if ((d.seedVersion || 0) < 3) {
    d.topics = (d.topics || []).map((t) => ({
      lessonsTotal: null, lessonsDone: 0,
      phase: t.status === "mastered" ? "fechado" : "teoria",
      ...t,
    }));
    d.settings.subjectModes = { ...SUBJECT_MODES_DEFAULT, ...(d.settings.subjectModes || {}) };
    if (!d.settings.tema) d.settings.tema = "claro";
    d.seedVersion = 3;
  }

  if ((d.seedVersion || 0) < 4) {
    // guarda o progresso nos moldes da banca
    d.moldes = d.moldes || {};

    // A contagem das 105 questões mostrou que a lista de matemática estava
    // desequilibrada. Corrige o peso do que já existe e cria o que faltava,
    // sem tocar em acertos, fase ou histórico de nenhum tópico.
    const pesoNovo = {
      "Funções e Exponencial": 5, "Geometria Plana": 5, "Geometria Analítica": 4,
      "Trigonometria": 4, "Combinatória e Probabilidade": 3, "Polinômios": 3, "Conjuntos": 2,
    };
    d.topics = (d.topics || []).map((t) =>
      t.subject === "Matemática" && pesoNovo[t.name] ? { ...t, examWeight: pesoNovo[t.name] } : t
    );

    const jaTem = new Set(d.topics.filter((t) => t.subject === "Matemática").map((t) => t.name));
    const faltando = seedTopics().filter(
      (t) => t.subject === "Matemática" && !jaTem.has(t.name)
    );
    d.topics = [...d.topics, ...faltando];

    d.seedVersion = 4;
  }

  if ((d.seedVersion || 0) < 5) {
    // adiciona destaque e o ciclo de correção a erros que já existiam,
    // sem mexer em nada que já estava preenchido
    d.errors = (d.errors || []).map((e) => ({
      destaque: false,
      correctionStatus: "pendente",
      correctionHistory: [],
      ...e,
    }));
    if (d.settings.correctionsFollowSchedule === undefined) {
      d.settings.correctionsFollowSchedule = true;
    }
    d.seedVersion = 5;
  }
  return d;
}

/* ---------------- motor da rota ---------------- */
const PHASE_LABEL = { teoria: "Vendo a teoria", questoes: "Fazendo questões", fechado: "Fechado" };
const PHASE_COLOR = { teoria: "#B57A16", questoes: "#173C86", fechado: "#2C7355" };
function fase(t) { return t.phase || (t.status === "mastered" ? "fechado" : "teoria"); }
function teoriaCompleta(t) {
  return t.lessonsTotal ? (t.lessonsDone || 0) >= t.lessonsTotal : false;
}


function topicAccuracy(t) { return t.total > 0 ? t.correct / t.total : 0.5; }

function getRecentSimuladoAcc(simulados) {
  const withB = simulados.filter((s) => s.subjectBreakdown && Object.keys(s.subjectBreakdown).length > 0);
  if (!withB.length) return {};
  const recent = [...withB].sort((a, b) => b.date.localeCompare(a.date))[0];
  const map = {};
  Object.entries(recent.subjectBreakdown).forEach(([s, { acertos, total }]) => {
    if (total > 0) map[s] = { acc: acertos / total, date: recent.date };
  });
  return map;
}

function topicScore(t, daysLeft, today, simAcc) {
  const w = t.examWeight / 5;
  const urgency = daysLeft <= 14 ? 1.15 : 1;
  const status = t.status || "in_progress";
  const sim = simAcc && simAcc[t.subject];
  const boost = sim ? (1 - sim.acc) * 0.3 : 0;
  if (status === "not_started") return (1.6 + w * 0.6) * urgency + boost;
  const acc = topicAccuracy(t);
  const recency = Math.min((t.lastPracticed ? diffDays(today, t.lastPracticed) : 30) / 14, 1);
  let base = (w * 0.45 + (1 - acc) * 0.35 + recency * 0.2) * urgency + boost;
  if (status === "mastered") base *= 0.3;
  return base;
}

function reasonText(t, today, simAcc) {
  const status = t.status || "in_progress";
  const sim = simAcc && simAcc[t.subject];
  const simPart = sim ? `foi mal em ${t.subject} no último simulado, ${Math.round(sim.acc * 100)}% de acerto` : null;
  if (status === "not_started") return ["ainda não estudado", `peso ${t.examWeight} de 5 na prova`, simPart].filter(Boolean).join(", ");
  const acc = Math.round(topicAccuracy(t) * 100);
  const rec = t.lastPracticed ? diffDays(today, t.lastPracticed) : null;
  const parts = [`peso ${t.examWeight} de 5`, `acerto atual ${acc}%`];
  parts.push(rec == null ? "nunca praticado" : rec === 0 ? "praticado hoje" : `sem prática há ${rec} dias`);
  if (status === "mastered") parts.push("dominado, só manutenção");
  if (simPart) parts.push(simPart);
  return parts.join(", ");
}

function generateRoute(topics, dailyHours, blockMinutes, daysLeft, today, allowed, simAcc, modes) {
  const totalBlocks = Math.max(1, Math.round((dailyHours * 60) / blockMinutes));
  const subjects = allowed && allowed.length ? allowed : [...new Set(topics.map((t) => t.subject))];
  if (!subjects.length) return [];

  // divide os blocos do dia entre as matérias, o mais parelho possível
  const cota = {};
  subjects.forEach((s, i) => {
    cota[s] = Math.floor(totalBlocks / subjects.length) + (i < totalBlocks % subjects.length ? 1 : 0);
  });

  const blocks = [];
  subjects.forEach((subject) => {
    const n = cota[subject];
    if (!n) return;
    const pool = topics
      .filter((t) => t.subject === subject)
      .map((t) => ({ ...t, sc: topicScore(t, daysLeft, today, simAcc) }))
      .sort((a, b) => b.sc - a.sc);
    if (!pool.length) return;

    const mode = (modes && modes[subject]) || "treino";
    const pace = PACE_MIN_PER_QUESTION[subject] || 6;

    const criar = (t, role, i) => ({
      id: uid(), topicId: t.id, subject, topicName: t.name, minutes: blockMinutes, role, mode,
      suggestedQuestions: role === "teoria" ? 0 : Math.max(5, Math.round(blockMinutes / pace)),
      reason: reasonText(t, today, simAcc), done: false, loggedQuestions: "", loggedCorrect: ""
    });

    if (mode === "profundidade") {
      const abertos = pool.filter((t) => fase(t) !== "fechado");
      if (!abertos.length) {
        // tudo fechado nessa matéria, cai em manutenção por questões
        for (let i = 0; i < n; i++) blocks.push(criar(pool[i % pool.length], "questoes", i));
        return;
      }
      // continua de onde parou antes de abrir um tópico novo
      const emAndamento = abertos.find((t) => fase(t) === "questoes")
        || abertos.find((t) => (t.lessonsDone || 0) > 0);
      const t = emAndamento || abertos[0];
      const role = fase(t) === "questoes" ? "questoes" : "teoria";
      for (let i = 0; i < n; i++) blocks.push(criar(t, role, i));
    } else {
      for (let i = 0; i < n; i++) {
        const t = pool[Math.min(i, pool.length - 1)];
        blocks.push(criar(t, "questoes", i));
      }
    }
  });

  return blocks;
}

function daysToExam() { return Math.max(1, Math.ceil((EXAM_DATE - new Date()) / 86400000)); }

// Agendamento consciente da data da prova.
// Cartão novo respondido como Fácil não volta amanhã, e nenhum intervalo
// ultrapassa a prova, para todo cartão ter pelo menos uma revisão final.
function schedule(card, q) {
  let { ease, interval, repetitions } = card;
  if (q < 3) {
    repetitions = 0; interval = 1;
    ease = Math.max(1.3, ease - 0.2);
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = q === 5 ? 4 : q === 4 ? 2 : 1;
    else if (repetitions === 2) interval = q === 5 ? 10 : q === 4 ? 6 : 3;
    else interval = Math.round(interval * ease);
    ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  }
  const cap = Math.max(1, daysToExam() - 1);
  interval = Math.min(interval, cap);
  const t = todayISO();
  return { ease, interval, repetitions, nextReview: addDays(t, interval), lastReviewed: t };
}

// "Já domino" tira o cartão do rodízio e devolve só na reta final.
function parkCard() {
  const cap = Math.max(1, daysToExam() - 1);
  const t = todayISO();
  return { ease: 2.8, interval: cap, repetitions: 3, nextReview: addDays(t, cap), lastReviewed: t };
}

/* ============================================================ */

export default function RotaUnicamp() {
  const [data, setData] = useState(emptyData);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("rota");
  const [tema, setTema] = useState("claro");
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!document.getElementById("ru-fonts")) {
      const l = document.createElement("link");
      l.id = "ru-fonts"; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Literata:opsz,wght@7..72,400;7..72,500;7..72,600&family=Kalam:wght@400;700&display=swap";
      document.head.appendChild(l);
    }
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res && res.value) {
          const migrado = migrate(JSON.parse(res.value));
          if (migrado.settings?.tema) setTema(migrado.settings.tema);
          setData(migrado);
          try { await window.storage.set(STORAGE_KEY, JSON.stringify(migrado), false); } catch {}
        } else {
          setData({ ...emptyData, seedVersion: SEED_VERSION });
        }
      } catch (e) { /* primeira vez */ }
      finally { setLoaded(true); }
    })();
  }, []);

  const persist = useCallback(async (next) => {
    setData(next);
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(next), false); }
    catch (e) { setToast("Não deu para salvar agora. As mudanças valem só nesta sessão."); setTimeout(() => setToast(null), 4000); }
  }, []);

  applyTheme(tema);

  function trocarTema() {
    const novo = tema === "claro" ? "escuro" : "claro";
    setTema(novo);
    persist({ ...data, settings: { ...data.settings, tema: novo } });
  }

  const daysLeft = useMemo(() => Math.max(0, Math.ceil((EXAM_DATE - new Date()) / 86400000)), []);
  const bestScore = useMemo(() => data.simulados.length ? Math.max(...data.simulados.map((s) => Math.round((s.acertos / (s.total || TOTAL_QUESTIONS)) * TOTAL_QUESTIONS))) : null, [data.simulados]);

  if (!loaded) {
    return <div style={{ background: C.bg, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.inkFaint, fontFamily: "'Instrument Sans', system-ui, sans-serif", fontSize: 14 }}>Abrindo o caderno…</div>;
  }

  return (
    <div style={{ fontFamily: "'Instrument Sans', system-ui, -apple-system, sans-serif", background: C.bg, color: C.ink, height: "100vh", display: "flex", position: "relative", overflow: "hidden" }}>
      <style>{`
        html, body, #root { height: 100%; margin: 0; background: ${C.bg}; }
        ::selection { background: ${C.blueSoft}; }
        .ru-nav:hover { background: ${C.lineSoft} !important; color: ${C.ink} !important; }
        .ru-row { transition: background .12s; }
        .ru-row:hover { background: ${C.lineSoft} !important; }
        .ru-btn { transition: filter .12s, transform .1s, box-shadow .12s; }
        .ru-btn:hover { filter: brightness(.97); }
        .ru-btn:active { transform: translateY(1px); }
        .ru-card { transition: box-shadow .16s, transform .16s; }
        .ru-card:hover { box-shadow: ${SH.lift}; transform: translateY(-1px); }
        @keyframes ruUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .ru-in { animation: ruUp .34s cubic-bezier(.22,.8,.3,1) both; }
        .ru-in:nth-child(1){animation-delay:.02s} .ru-in:nth-child(2){animation-delay:.07s}
        .ru-in:nth-child(3){animation-delay:.12s} .ru-in:nth-child(4){animation-delay:.17s}
        .ru-in:nth-child(5){animation-delay:.22s} .ru-in:nth-child(6){animation-delay:.27s}
        .ru-hero {
          background:
            repeating-linear-gradient(0deg, rgba(255,255,255,.035) 0 1px, transparent 1px 34px),
            repeating-linear-gradient(90deg, rgba(255,255,255,.035) 0 1px, transparent 1px 34px),
            radial-gradient(120% 140% at 88% 8%, #4A72AC 0%, #2F5286 50%, #223B62 100%);
        }
        @keyframes ruFolha {
          0%   { opacity: 0; transform: rotateY(-52deg) translateZ(0); }
          60%  { opacity: 1; }
          100% { opacity: 1; transform: rotateY(0deg); }
        }
        @keyframes ruFolhaTras {
          0%   { opacity: 0; transform: rotateY(38deg); }
          100% { opacity: 1; transform: rotateY(0deg); }
        }
        .ru-folha { animation: ruFolha .46s cubic-bezier(.3,.72,.28,1) both; backface-visibility: hidden; }
        .ru-folha-tras { animation: ruFolhaTras .38s cubic-bezier(.3,.72,.28,1) both; backface-visibility: hidden; }
        .ru-capa { transition: transform .3s cubic-bezier(.3,.72,.28,1), box-shadow .3s; }
        .ru-capa:hover { transform: rotateY(-9deg) translateX(-3px); box-shadow: ${SH.lift}; }
        .ru-capa:active { transform: rotateY(-16deg); }
        .ru-lesson p { margin: 0 0 1.1em; }
        .ru-lesson strong { font-weight: 600; }
        input:focus, textarea:focus, select:focus { border-color: ${C.blueMid} !important; box-shadow: 0 0 0 3px ${C.blueSoft}; }
        *::-webkit-scrollbar { width: 10px; height: 10px; }
        *::-webkit-scrollbar-thumb { background: #DCDEDA; border-radius: 999px; border: 3px solid ${C.bg}; }
        *::-webkit-scrollbar-track { background: transparent; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>

      <Rail tab={tab} setTab={setTab} daysLeft={daysLeft} bestScore={bestScore} tema={tema} trocarTema={trocarTema} />

      <main style={{ flex: 1, minWidth: 0, minHeight: 0, padding: "44px 56px 96px", overflowY: "auto", background: C.bg }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        {tab === "rota" && <Rota data={data} persist={persist} daysLeft={daysLeft} bestScore={bestScore} setShowSettings={setShowSettings} setTab={setTab} />}
        {tab === "aulas" && <Aulas data={data} persist={persist} />}
        {tab === "topicos" && <Topicos data={data} persist={persist} daysLeft={daysLeft} />}
        {tab === "moldes" && <Moldes data={data} persist={persist} />}
        {tab === "flashcards" && <Flashcards data={data} persist={persist} />}
        {tab === "leitura" && <Leitura data={data} persist={persist} />}
        {tab === "erros" && <CadernoErros data={data} persist={persist} />}
        {tab === "correcao" && <CorrecaoErros data={data} persist={persist} />}
        {tab === "painel" && <Painel data={data} />}
        {tab === "simulados" && <Simulados data={data} persist={persist} />}
        </div>
      </main>

      {showSettings && <SettingsModal data={data} persist={persist} onClose={() => setShowSettings(false)} />}
      {toast && (
        <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", background: C.redSoft, border: `1px solid ${C.red}`, color: C.red, padding: "9px 16px", borderRadius: 3, fontSize: 13 }}>{toast}</div>
      )}
    </div>
  );
}

/* ---------------- navegação lateral ---------------- */
function Rail({ tab, setTab, daysLeft, bestScore, tema, trocarTema }) {
  const groups = [
    ["Hoje", [["rota", "Rota do dia"], ["leitura", "Leitura"], ["flashcards", "Flashcards"], ["correcao", "Correção de erros"]]],
    ["Estudo", [["aulas", "Aulas"], ["topicos", "Tópicos"], ["moldes", "Moldes da banca"]]],
    ["Diagnóstico", [["erros", "Caderno de erros"], ["simulados", "Simulados"], ["painel", "Painel"]]],
  ];
  const lo = 40;
  const pos = bestScore == null ? 0 : Math.max(0, Math.min(1, (bestScore - lo) / (TARGET_SCORE - lo)));
  const cut = ((CUTOFF_SCORE - lo) / (TARGET_SCORE - lo)) * 100;

  return (
    <nav style={{ width: 258, background: C.shell, borderRight: `1px solid ${C.line}`, padding: "26px 0 24px", display: "flex", flexDirection: "column", flexShrink: 0, minHeight: 0 }}>
      <div style={{ padding: "0 22px 22px" }}>
        <div style={{ background: C.blue, borderRadius: R.md, padding: "18px 18px 16px", color: "#fff", boxShadow: SH.hero }}>
          <div style={{ fontSize: 12.5, opacity: .72, letterSpacing: ".01em" }}>Faltam para a 1ª fase</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 44, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.045em", fontVariantNumeric: "tabular-nums" }}>{daysLeft}</span>
            <span style={{ fontSize: 14, opacity: .78 }}>dias</span>
          </div>
          <div style={{ fontSize: 12, opacity: .62, marginTop: 5 }}>18 de outubro</div>
        </div>
      </div>

      <div style={{ padding: "0 22px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 9 }}>
          <span style={{ fontSize: 12.5, color: C.inkSoft }}>Melhor resultado</span>
          <span style={{ fontSize: 16, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{bestScore ?? "—"}</span>
        </div>
        <div style={{ height: 6, background: C.lineSoft, borderRadius: 999, position: "relative", overflow: "visible" }}>
          <div style={{ position: "absolute", inset: 0, width: `${pos * 100}%`, background: `linear-gradient(90deg, ${C.blueMid}, ${C.blue})`, borderRadius: 999 }} />
          <div style={{ position: "absolute", left: `${cut}%`, top: -3, width: 2, height: 12, background: C.red, borderRadius: 1 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11.5, color: C.inkFaint }}>
          <span>corte {CUTOFF_SCORE}</span><span>meta {TARGET_SCORE}</span>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 16, overflowY: "auto", flex: 1, minHeight: 0 }}>
        {groups.map(([g, items]) => (
          <div key={g} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.inkFaint, letterSpacing: ".06em", textTransform: "uppercase", padding: "0 22px 7px" }}>{g}</div>
            {items.map(([id, label]) => {
              const on = tab === id;
              return (
                <div key={id} style={{ padding: "0 12px" }}>
                  <button className={on ? "" : "ru-nav"} onClick={() => setTab(id)} style={{
                    display: "block", width: "100%", textAlign: "left", padding: "8px 12px", marginBottom: 2,
                    border: "none", borderRadius: R.sm, cursor: "pointer", fontFamily: "inherit", fontSize: 14.5,
                    background: on ? C.blueSoft : "transparent",
                    color: on ? C.blue : C.inkSoft, fontWeight: on ? 600 : 400, transition: "background .12s, color .12s"
                  }}>{label}</button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ padding: "14px 22px 0", borderTop: `1px solid ${C.line}`, marginTop: "auto" }}>
        <button className="ru-btn" onClick={trocarTema} style={{ ...btnG, width: "100%", justifyContent: "center", fontSize: 13.5 }}>
          {tema === "claro" ? "Modo escuro" : "Modo claro"}
        </button>
      </div>
    </nav>
  );
}

/* ---------------- primitivas ---------------- */
function Sheet({ children, style, accent }) {
  return (
    <div style={{
      background: C.card, borderRadius: R.lg, boxShadow: SH.card,
      padding: 26, position: "relative", overflow: "hidden", ...style
    }}>
      {accent && <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: accent }} />}
      {children}
    </div>
  );
}

function Empty({ children }) {
  return <div style={{ fontSize: 14.5, color: C.inkFaint, padding: "22px 0", lineHeight: 1.65, maxWidth: 560 }}>{children}</div>;
}

function Tag({ children, color }) {
  const c = color || C.inkSoft;
  return <span style={{ fontSize: 12, fontWeight: 500, color: c, background: `${c}12`, borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>{children}</span>;
}

function Weight({ level, title }) {
  const n = INCIDENCE_WEIGHT[level] || 1;
  const c = n === 3 ? C.red : n === 2 ? C.amber : C.inkFaint;
  return (
    <span title={title} style={{ display: "inline-flex", gap: 2.5, alignItems: "flex-end", height: 14 }}>
      {[1, 2, 3].map((i) => (
        <span key={i} style={{ width: 3.5, height: 5 + i * 3, borderRadius: 2, background: i <= n ? c : C.line, display: "block" }} />
      ))}
    </span>
  );
}

function Stat({ value, label, color }) {
  return (
    <div>
      <div style={{ fontSize: 40, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.035em", color: color || C.ink, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 13.5, color: C.inkSoft, marginTop: 8, maxWidth: 190, lineHeight: 1.4 }}>{label}</div>
    </div>
  );
}



function Modal({ title, onClose, children, wide }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,20,27,.42)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, borderRadius: R.lg, boxShadow: SH.lift, padding: 30, width: wide ? 640 : 512, maxHeight: "86vh", overflowY: "auto", fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.015em" }}>{title}</div>
          <button className="ru-btn" onClick={onClose} style={btnI}><X size={18} color={C.inkFaint} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PageHead({ title, sub, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, marginBottom: 34 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 36, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.12 }}>{title}</h1>
        {sub && <div style={{ fontSize: 16, color: C.inkSoft, marginTop: 10, maxWidth: 700, lineHeight: 1.55 }}>{sub}</div>}
      </div>
      {right && <div style={{ display: "flex", gap: 9, flexShrink: 0 }}>{right}</div>}
    </div>
  );
}

/* ---------------- Rota ---------------- */
function ReadingStrip({ data, persist, setTab }) {
  const obras = data.obras || [];
  const active = useMemo(() => {
    const ex = data.settings.activeObraId ? obras.find((o) => o.id === data.settings.activeObraId) : null;
    if (ex && (!ex.totalPages || ex.currentPage < ex.totalPages)) return ex;
    return obras.find((o) => !o.totalPages || o.currentPage < o.totalPages) || obras[0];
  }, [obras, data.settings.activeObraId]);
  const [page, setPage] = useState("");
  if (!active) return null;
  const target = data.settings.dailyReadingPages || 15;
  const to = active.totalPages ? Math.min(active.totalPages, active.currentPage + target) : active.currentPage + target;

  function save() {
    const p = Number(page);
    if (!page || isNaN(p)) return;
    persist({ ...data, obras: data.obras.map((o) => (o.id === active.id ? { ...o, currentPage: p } : o)) });
    setPage("");
  }

  return (
    <Sheet accent={C.green} style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 210 }}>
        <div style={{ fontFamily: "'Literata', serif", fontSize: 16, fontWeight: 500 }}>{active.title}</div>
        <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 2 }}>
          Leia hoje da página {active.currentPage} à {to}{active.totalPages ? `, de ${active.totalPages}` : ""}
        </div>
      </div>
      <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
        <input type="number" placeholder="parei na pág." value={page} onChange={(e) => setPage(e.target.value)} style={{ ...inp, width: 118 }} />
        <button className="ru-btn" onClick={save} style={btnQ}><Check size={13} /> Salvar</button>
        <button className="ru-btn" onClick={() => setTab("leitura")} style={btnI}><ChevronRight size={17} color={C.inkFaint} /></button>
      </div>
    </Sheet>
  );
}

function Hero({ daysLeft, bestScore, sched, weekday, blocks, dueCards }) {
  const lo = 40;
  const pos = bestScore == null ? 0 : Math.max(0, Math.min(1, (bestScore - lo) / (TARGET_SCORE - lo)));
  const falta = bestScore == null ? null : Math.max(0, TARGET_SCORE - bestScore);
  const mins = blocks.reduce((s, b) => s + b.minutes, 0);
  const qs = blocks.filter((b) => b.role !== "teoria").reduce((s, b) => s + b.suggestedQuestions, 0);
  const feitos = blocks.filter((b) => b.done).length;

  return (
    <div className="ru-hero ru-in" style={{
      borderRadius: R.lg, padding: "34px 38px", color: "#fff", marginBottom: 26,
      boxShadow: "0 2px 6px rgba(16,42,94,.2), 0 20px 48px rgba(16,42,94,.22)", position: "relative", overflow: "hidden"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 40, flexWrap: "wrap" }}>
        <div style={{ minWidth: 260 }}>
          <div style={{ fontSize: 13.5, opacity: .68, letterSpacing: ".02em" }}>
            {WEEKDAY_LABELS[weekday]}{sched.type === "simulado" ? ", dia de simulado" : `, ${(sched.subjects || []).join(" e ")}`}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 8 }}>
            <span style={{ fontSize: 76, fontWeight: 600, lineHeight: .92, letterSpacing: "-0.055em", fontVariantNumeric: "tabular-nums" }}>{daysLeft}</span>
            <span style={{ fontSize: 19, opacity: .74 }}>dias até a prova</span>
          </div>
          {blocks.length > 0 && (
            <div style={{ fontSize: 14.5, opacity: .78, marginTop: 12 }}>
              {feitos} de {blocks.length} blocos feitos · {(mins / 60).toFixed(1)} h · {qs} questões previstas
            </div>
          )}
        </div>

        <div style={{ minWidth: 300, flex: "0 1 380px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <span style={{ fontSize: 14, opacity: .72 }}>Melhor resultado</span>
            <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
              {bestScore ?? "—"}<span style={{ fontSize: 16, opacity: .58, fontWeight: 400 }}>/72</span>
            </span>
          </div>
          <div style={{ height: 9, background: "rgba(255,255,255,.16)", borderRadius: 999, position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, width: `${pos * 100}%`, background: "linear-gradient(90deg,#A9C1E4,#EFF3FA)", borderRadius: 999, boxShadow: "0 0 8px rgba(255,255,255,.28)" }} />
            <div style={{ position: "absolute", left: `${((CUTOFF_SCORE - lo) / (TARGET_SCORE - lo)) * 100}%`, top: -4, width: 2, height: 17, background: "#FF9E92", borderRadius: 2 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12.5, opacity: .62 }}>
            <span>corte {CUTOFF_SCORE}</span>
            <span>meta {TARGET_SCORE}</span>
          </div>
          {falta != null && (
            <div style={{ fontSize: 14.5, marginTop: 16, opacity: .9 }}>
              {falta === 0 ? "Meta batida. Agora é manter e ampliar a margem." : `Faltam ${falta} acertos para a meta de ${TARGET_SCORE}.`}
            </div>
          )}
          {dueCards > 0 && (
            <div style={{ fontSize: 13.5, marginTop: 8, opacity: .72 }}>{dueCards} flashcards vencidos hoje</div>
          )}
        </div>
      </div>
    </div>
  );
}

function BackupNudge({ data, setShowSettings }) {
  const last = data.settings.lastBackup;
  const dias = last ? diffDays(todayISO(), last) : null;
  if (last && dias < 7) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: C.amberSoft, borderRadius: R.md, padding: "12px 18px", marginBottom: 20 }}>
      <span style={{ fontSize: 14, color: C.ink }}>
        {last ? `Seu último backup foi há ${dias} dias.` : "Você ainda não fez nenhum backup dos seus dados."} Exporte e guarde o texto num bloco de notas.
      </span>
      <button className="ru-btn" onClick={() => setShowSettings(true)} style={{ ...btnQ, background: "#fff", color: C.amber }}>Fazer backup</button>
    </div>
  );
}

function Rota({ data, persist, daysLeft, bestScore, setShowSettings, setTab }) {
  const today = todayISO();
  const blocks = data.route[today] || [];
  const dueCards = data.flashcards.filter((c) => c.nextReview <= today).length;
  const weekday = new Date(today + "T12:00:00").getDay();
  const sched = (data.settings.weekSchedule || DEFAULT_WEEK_SCHEDULE)[weekday] || { type: "study", subjects: [] };
  const simAcc = useMemo(() => getRecentSimuladoAcc(data.simulados), [data.simulados]);

  function regenerate() {
    persist({ ...data, route: { ...data.route, [today]: generateRoute(data.topics, data.settings.dailyHours, data.settings.blockMinutes, daysLeft, today, sched.subjects, simAcc, data.settings.subjectModes || SUBJECT_MODES_DEFAULT) } });
  }
  function upd(id, patch) {
    persist({ ...data, route: { ...data.route, [today]: blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) } });
  }
  function log(b) {
    const q = Number(b.loggedQuestions) || 0, c = Number(b.loggedCorrect) || 0;
    if (q <= 0) return;
    persist({
      ...data,
      topics: data.topics.map((t) => (t.id === b.topicId ? { ...t, correct: t.correct + c, total: t.total + q, lastPracticed: today } : t)),
      route: { ...data.route, [today]: blocks.map((x) => (x.id === b.id ? { ...x, done: true } : x)) }
    });
  }

  const topicOf = (b) => data.topics.find((t) => t.id === b.topicId);

  function updTopic(id, patch) {
    persist({ ...data, topics: data.topics.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
  }

  // registra aulas vistas hoje e fecha a teoria quando chega no total
  function verAulas(b, quantas) {
    const t = topicOf(b); if (!t) return;
    const vistas = Math.max(0, (t.lessonsDone || 0) + quantas);
    const total = t.lessonsTotal;
    const fechou = total ? vistas >= total : false;
    persist({
      ...data,
      topics: data.topics.map((x) => x.id === t.id ? {
        ...x, lessonsDone: total ? Math.min(vistas, total) : vistas,
        status: x.status === "not_started" ? "in_progress" : x.status,
        phase: fechou ? "questoes" : "teoria", lastPracticed: today
      } : x)
    });
  }

  function fecharTeoria(b) {
    const t = topicOf(b); if (!t) return;
    updTopic(t.id, {
      phase: "questoes", lastPracticed: today,
      status: t.status === "not_started" ? "in_progress" : t.status,
      lessonsDone: t.lessonsTotal || t.lessonsDone || 0
    });
  }

  function fecharTopico(b) {
    const t = topicOf(b); if (!t) return;
    updTopic(t.id, { phase: "fechado", status: "reviewing", lastPracticed: today });
  }

  function logTeoria(b) {
    persist({
      ...data,
      topics: data.topics.map((t) => (t.id === b.topicId && (t.status || "in_progress") === "not_started"
        ? { ...t, status: "in_progress", lastPracticed: today } : t.id === b.topicId ? { ...t, lastPracticed: today } : t)),
      route: { ...data.route, [today]: blocks.map((x) => (x.id === b.id ? { ...x, done: true } : x)) }
    });
  }

  const mins = blocks.reduce((s, b) => s + b.minutes, 0);
  const qs = blocks.reduce((s, b) => s + b.suggestedQuestions, 0);

  const cardsBanner = dueCards > 0 && (
    <button className="ru-row" onClick={() => setTab("flashcards")} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
      background: C.blueSoft, border: "none", borderRadius: R.md, padding: "14px 18px",
      marginBottom: 20, cursor: "pointer", color: C.ink, fontFamily: "inherit", fontSize: 14
    }}>
      <span>{dueCards} flashcard{dueCards > 1 ? "s vencidos" : " vencido"} para revisar hoje</span>
      <ChevronRight size={16} color={C.inkSoft} />
    </button>
  );

  if (sched.type === "simulado") {
    return (
      <div>
        <Hero daysLeft={daysLeft} bestScore={bestScore} sched={sched} weekday={weekday} blocks={[]} dueCards={dueCards} />
        <BackupNudge data={data} setShowSettings={setShowSettings} />
        <ReadingStrip data={data} persist={persist} setTab={setTab} />
        {cardsBanner}
        <Sheet accent={C.blue} style={{ maxWidth: 560 }}>
          <div style={{ fontFamily: "'Literata', serif", fontSize: 17, marginBottom: 8 }}>Simulado completo, 72 questões</div>
          <div style={{ fontSize: 14, color: C.inkSoft, lineHeight: 1.6, marginBottom: 16 }}>
            Sem consultar nada, marcando X e pulando o que travar. A correção fica para depois, com calma.
          </div>
          <button className="ru-btn" onClick={() => setTab("simulados")} style={btnP}>Registrar resultado</button>
        </Sheet>
      </div>
    );
  }

  return (
    <div>
      <Hero daysLeft={daysLeft} bestScore={bestScore} sched={sched} weekday={weekday} blocks={blocks} dueCards={dueCards} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, marginBottom: 22 }}>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>
          {blocks.length ? "Blocos de hoje" : "Nenhuma rota gerada hoje"}
        </div>
        <div style={{ display: "flex", gap: 9 }}>
          <button className="ru-btn" onClick={() => setShowSettings(true)} style={btnG}><Settings2 size={15} /></button>
          <button className="ru-btn" onClick={regenerate} style={btnP}><RefreshCw size={15} /> {blocks.length ? "Gerar de novo" : "Gerar rota"}</button>
        </div>
      </div>

      <BackupNudge data={data} setShowSettings={setShowSettings} />
      <ReadingStrip data={data} persist={persist} setTab={setTab} />
      {cardsBanner}
      {(sched.subjects || []).includes("Matemática") && <MoldesStrip data={data} persist={persist} setTab={setTab} />}

      {blocks.length === 0 && <Empty>Nenhuma rota gerada hoje ainda.</Empty>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {blocks.map((b, i) => (
          <div key={b.id} className="ru-card ru-in" style={{
            background: C.card, borderRadius: R.lg, boxShadow: SH.card, padding: "24px 28px",
            position: "relative", overflow: "hidden", opacity: b.done ? .7 : 1
          }}>
            {b.done && <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: C.green }} />}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, minWidth: 0 }}>
                <span style={{
                  width: 26, height: 26, borderRadius: 999, background: b.done ? C.greenSoft : C.blueSoft,
                  color: b.done ? C.green : C.blue, fontSize: 13, fontWeight: 600,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1
                }}>{b.done ? <Check size={14} /> : i + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 19.5, fontWeight: 600, letterSpacing: "-0.02em", textDecoration: b.done ? "line-through" : "none" }}>{b.topicName}</div>
                  <div style={{ marginTop: 8, display: "flex", gap: 7, flexWrap: "wrap" }}>
                    <Tag color={SUBJECT_COLOR[b.subject] || C.blue}>{b.subject}</Tag>
                    {b.mode === "profundidade" && topicOf(b) && (
                      <Tag color={PHASE_COLOR[fase(topicOf(b))]}>{PHASE_LABEL[fase(topicOf(b))]}</Tag>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                {b.role === "teoria" ? (
                  <>
                    <div style={{ fontSize: 17, fontWeight: 600, color: C.amber, lineHeight: 1.2 }}>Teoria</div>
                    <div style={{ fontSize: 12.5, color: C.inkFaint, marginTop: 5 }}>{b.minutes} min de aula</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.035em", color: C.blue, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{b.suggestedQuestions}</div>
                    <div style={{ fontSize: 12.5, color: C.inkFaint, marginTop: 5 }}>questões · {b.minutes} min</div>
                  </>
                )}
              </div>
            </div>

            <div style={{ fontSize: 13.5, color: C.inkSoft, marginTop: 14, paddingLeft: 40, lineHeight: 1.55 }}>{b.reason}</div>

            {b.role === "teoria" && !b.done && (() => {
              const t = topicOf(b);
              const total = t?.lessonsTotal;
              const vistas = t?.lessonsDone || 0;
              const pct = total ? Math.min(100, Math.round((vistas / total) * 100)) : null;
              return (
                <div style={{ marginTop: 14, marginLeft: 40, background: C.amberSoft, borderRadius: R.sm, padding: "16px 18px" }}>
                  <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.55, marginBottom: 12 }}>
                    Bloco de aprendizado. Veja a videoaula ou o módulo na aba Aulas, monte os flashcards, e só passe para questões quando a teoria deste tópico estiver fechada.
                  </div>

                  {total ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13.5, marginBottom: 7 }}>
                        <span style={{ color: C.inkSoft }}>{vistas} de {total} aulas vistas</span>
                        <span style={{ color: C.amber, fontWeight: 600 }}>faltam {Math.max(0, total - vistas)}</span>
                      </div>
                      <div style={{ height: 7, background: "rgba(181,122,22,.18)", borderRadius: 999, marginBottom: 14 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: C.amber, borderRadius: 999, transition: "width .3s" }} />
                      </div>
                    </>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13.5, color: C.inkSoft }}>Quantas aulas esse tópico tem no total?</span>
                      <input type="number" placeholder="ex. 12" onKeyDown={(e) => {
                        if (e.key === "Enter" && Number(e.target.value) > 0) updTopic(b.topicId, { lessonsTotal: Number(e.target.value) });
                      }} style={{ ...inp, width: 92 }} />
                      <span style={{ fontSize: 12.5, color: C.inkFaint }}>digite e aperte Enter</span>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13.5, color: C.inkSoft }}>Vi hoje</span>
                    {[1, 2, 3, 5].map((k) => (
                      <button key={k} className="ru-btn" onClick={() => verAulas(b, k)} style={{ ...btnQ, background: "#fff", color: C.amber }}>+{k}</button>
                    ))}
                    <button className="ru-btn" onClick={() => fecharTeoria(b)} style={{ ...btnQ, background: C.amber, color: "#fff" }}>
                      <Check size={13} /> Fechei a teoria deste tópico
                    </button>
                  </div>
                </div>
              );
            })()}

            {!b.done ? (
              <div style={{ display: "flex", gap: 8, marginTop: 16, paddingLeft: 40, alignItems: "center", flexWrap: "wrap" }}>
                {b.role === "teoria" ? (
                  <button className="ru-btn" onClick={() => logTeoria(b)} style={btnQ}><Check size={13} /> Concluí a teoria</button>
                ) : (
                  <>
                    <input type="number" placeholder="fiz" value={b.loggedQuestions} onChange={(e) => upd(b.id, { loggedQuestions: e.target.value })} style={{ ...inp, width: 84 }} />
                    <input type="number" placeholder="acertei" value={b.loggedCorrect} onChange={(e) => upd(b.id, { loggedCorrect: e.target.value })} style={{ ...inp, width: 96 }} />
                    <button className="ru-btn" onClick={() => log(b)} style={btnQ}><Check size={13} /> Registrar bloco</button>
                  </>
                )}
              </div>
            ) : (
              <div style={{ marginTop: 14, paddingLeft: 40 }}>
                <div style={{ fontSize: 13.5, color: C.green }}>
                  {b.role === "teoria" ? "Teoria registrada" : "Registrado, prioridade recalculada"}
                </div>
                {b.mode === "profundidade" && b.role === "questoes" && topicOf(b) && fase(topicOf(b)) !== "fechado" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13.5, color: C.inkSoft }}>
                      Acerto atual em {b.topicName}, {Math.round(topicAccuracy(topicOf(b)) * 100)}%.
                    </span>
                    <button className="ru-btn" onClick={() => fecharTopico(b)} style={{ ...btnQ, background: C.greenSoft, color: C.green }}>
                      <Check size={13} /> Fechar este tópico e passar para o próximo
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsModal({ data, persist, onClose }) {
  const [hours, setHours] = useState(data.settings.dailyHours);
  const [block, setBlock] = useState(data.settings.blockMinutes);
  const [week, setWeek] = useState(data.settings.weekSchedule || DEFAULT_WEEK_SCHEDULE);
  const [modes, setModes] = useState({ ...SUBJECT_MODES_DEFAULT, ...(data.settings.subjectModes || {}) });
  const [backup, setBackup] = useState("");
  const [bmsg, setBmsg] = useState(null);
  const updDay = (i, patch) => setWeek(week.map((d, j) => (j === i ? { ...d, ...patch } : d)));

  async function exportar() {
    const txt = JSON.stringify(data);
    setBackup(txt);
    try {
      await navigator.clipboard.writeText(txt);
      setBmsg("Backup copiado para a área de transferência. Cole num bloco de notas e salve.");
    } catch {
      setBmsg("Selecione o texto abaixo, copie e guarde num bloco de notas.");
    }
    persist({ ...data, settings: { ...data.settings, lastBackup: todayISO() } });
  }
  function importar() {
    try {
      const parsed = JSON.parse(backup);
      if (!parsed || typeof parsed !== "object") throw new Error();
      persist(migrate(parsed));
      setBmsg("Backup restaurado.");
    } catch { setBmsg("Esse texto não é um backup válido."); }
  }

  return (
    <Modal title="Como a rota é montada" onClose={onClose} wide>
      <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
        <div><div style={lbl}>Horas por dia</div><input type="number" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} style={{ ...inp, width: 100 }} /></div>
        <div><div style={lbl}>Minutos por bloco</div><input type="number" step="15" value={block} onChange={(e) => setBlock(e.target.value)} style={{ ...inp, width: 100 }} /></div>
      </div>
      <div style={lbl}>Duas matérias por dia, ou dia de simulado</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {week.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 62, fontSize: 13.5, color: C.inkSoft, flexShrink: 0 }}>{WEEKDAY_LABELS[i]}</span>
            <select value={d.type} onChange={(e) => updDay(i, { type: e.target.value, subjects: e.target.value === "simulado" ? [] : (d.subjects.length ? d.subjects : [SUBJECTS[0], SUBJECTS[1]]) })} style={{ ...sel, width: 100 }}>
              <option value="study">Estudo</option><option value="simulado">Simulado</option>
            </select>
            {d.type === "study" && [0, 1].map((slot) => (
              <select key={slot} value={d.subjects[slot] || SUBJECTS[slot]} onChange={(e) => { const s = [...d.subjects]; s[slot] = e.target.value; updDay(i, { subjects: s }); }} style={{ ...sel, flex: 1 }}>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            ))}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 26, paddingTop: 20, borderTop: `1px solid ${C.line}` }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Como cada matéria é estudada</div>
        <div style={{ fontSize: 13.5, color: C.inkSoft, marginBottom: 14, lineHeight: 1.55 }}>
          Treino espalha vários tópicos no dia e foca em volume de questões. Profundidade trava o dia num tópico só, começando pela teoria.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {SUBJECTS.map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13.5, width: 92, color: C.inkSoft, flexShrink: 0 }}>{s}</span>
              <select value={modes[s] || "treino"} onChange={(e) => setModes({ ...modes, [s]: e.target.value })} style={{ ...sel, flex: 1, fontSize: 13 }}>
                <option value="treino">Treino</option>
                <option value="profundidade">Profundidade</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 26, paddingTop: 20, borderTop: `1px solid ${C.line}` }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Backup dos seus dados</div>
        <div style={{ fontSize: 13.5, color: C.inkSoft, marginBottom: 12, lineHeight: 1.55 }}>
          Exporte de vez em quando e guarde o texto. Se algo se perder, cole aqui e restaure.
        </div>
        <div style={{ display: "flex", gap: 9, marginBottom: 10 }}>
          <button className="ru-btn" onClick={exportar} style={btnP}>Exportar e copiar</button>
          <button className="ru-btn" onClick={importar} style={btnQ}>Restaurar do texto</button>
          <button className="ru-btn" onClick={() => {
            persist(migrate({ ...data, seedVersion: 0 }));
            setBmsg("Dados de fábrica repostos. Nada do que você registrou foi apagado.");
          }} style={btnQ}>Repor dados de fábrica</button>
        </div>
        <textarea value={backup} onChange={(e) => setBackup(e.target.value)} placeholder="Cole aqui um backup para restaurar, ou clique em exportar" style={{ ...inp, width: "100%", minHeight: 76, fontFamily: "ui-monospace, monospace", fontSize: 11.5, resize: "vertical" }} />
        {bmsg && <div style={{ fontSize: 13, marginTop: 7, color: bmsg.startsWith("Esse") ? C.red : C.green }}>{bmsg}</div>}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 22 }}>
        <button className="ru-btn" onClick={onClose} style={btnG}>Cancelar</button>
        <button className="ru-btn" onClick={() => { persist({ ...data, settings: { ...data.settings, dailyHours: Number(hours), blockMinutes: Number(block), weekSchedule: week, subjectModes: modes } }); onClose(); }} style={btnP}>Salvar</button>
      </div>
    </Modal>
  );
}

/* ---------------- Aulas ---------------- */
function renderLesson(text) {
  const lines = text.split("\n"); const out = []; let bullets = [];
  const inline = (s) => s.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>);
  const flush = (k) => {
    if (!bullets.length) return;
    out.push(<ul key={`u${k}`} style={{ margin: "0 0 1.15em", paddingLeft: 22 }}>
      {bullets.map((b, i) => <li key={i} style={{ marginBottom: 7, lineHeight: 1.72 }}>{inline(b)}</li>)}
    </ul>); bullets = [];
  };
  lines.forEach((raw, i) => {
    const l = raw.trimEnd();
    if (l.startsWith("### ")) { flush(i); out.push(<h3 key={i} style={{ fontFamily: "'Instrument Sans', system-ui, sans-serif", fontSize: 18, fontWeight: 600, margin: "1.9em 0 .55em", color: C.blue }}>{l.slice(4)}</h3>); }
    else if (l.startsWith("## ")) { flush(i); out.push(<h2 key={i} style={{ fontFamily: "'Instrument Sans', system-ui, sans-serif", fontSize: 25, fontWeight: 600, letterSpacing: "-0.025em", margin: "2.1em 0 .7em", paddingBottom: 12, borderBottom: `1px solid ${C.line}` }}>{l.slice(3)}</h2>); }
    else if (l.startsWith("# ")) { flush(i); out.push(<h1 key={i} style={{ fontFamily: "'Instrument Sans', system-ui, sans-serif", fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em", margin: "0 0 .7em", lineHeight: 1.15 }}>{l.slice(2)}</h1>); }
    else if (l.trim() === "---") { flush(i); out.push(<hr key={i} style={{ border: "none", borderTop: `1px solid ${C.lineSoft}`, margin: "2.2em 0" }} />); }
    else if (l.startsWith("- ")) bullets.push(l.slice(2));
    else if (l.trim() === "") flush(i);
    else { flush(i); out.push(<p key={i}>{inline(l)}</p>); }
  });
  flush("z");
  return out;
}

function Aulas({ data, persist }) {
  const [openId, setOpenId] = useState(null);
  const [subject, setSubject] = useState("Biologia");
  const [imp, setImp] = useState(""); const [msg, setMsg] = useState(null);
  const all = data.aulas || [];
  const open = openId ? all.find((a) => a.id === openId) : null;
  const subjects = useMemo(() => { const s = []; all.forEach((a) => { if (!s.includes(a.subject)) s.push(a.subject); }); return s; }, [all]);
  const list = useMemo(() => all.filter((a) => a.subject === subject).sort((a, b) => a.order - b.order), [all, subject]);

  function importar() {
    try {
      const items = [].concat(JSON.parse(imp));
      let n = 0;
      const next = data.aulas.map((a) => {
        const m = items.find((it) => it.id === a.id);
        if (m && (m.content || m.fixacao)) { n++; return { ...a, content: m.content ?? a.content, fixacao: m.fixacao ?? a.fixacao }; }
        return a;
      });
      if (!n) { setMsg("Nenhum módulo com esse id. Confira o campo id do bloco."); return; }
      persist({ ...data, aulas: next }); setImp(""); setMsg(`${n} aula carregada.`);
      setTimeout(() => setMsg(null), 4000);
    } catch { setMsg("O texto colado não é um JSON válido."); }
  }

  if (open) {
    return (
      <div>
        <button className="ru-btn" onClick={() => setOpenId(null)} style={{ ...btnG, marginBottom: 26 }}><ArrowLeft size={14} /> Todas as aulas</button>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: C.inkSoft, marginBottom: 20, paddingBottom: 12, borderBottom: `1px solid ${C.line}` }}>
            <span>{open.subject}, módulo {open.order}</span>
            <select value={open.status} onChange={(e) => persist({ ...data, aulas: data.aulas.map((a) => (a.id === open.id ? { ...a, status: e.target.value } : a)) })} style={{ ...sel, width: 128, fontSize: 13 }}>
              <option value="not_started">Não iniciado</option><option value="studying">Estudando</option><option value="done">Concluído</option>
            </select>
          </div>

          {open.content ? (
            <article className="ru-lesson" style={{ fontFamily: "'Literata', Georgia, serif", fontSize: 19, lineHeight: 1.82, color: C.ink }}>
              {renderLesson(open.content)}
            </article>
          ) : (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 8px" }}>{open.title}</h1>
              <div style={{ fontFamily: "'Literata', serif", fontSize: 16, color: C.inkSoft, lineHeight: 1.7 }}>{open.scope}</div>
              <Empty>O conteúdo desta aula ainda não foi carregado. Peça a aula no chat e cole o bloco na caixa lá embaixo da lista de aulas.</Empty>
            </>
          )}

          {open.fixacao && (
            <section style={{ marginTop: 48, background: C.greenSoft, borderLeft: `3px solid ${C.green}`, borderRadius: R.md, padding: "26px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <RotateCw size={15} color={C.green} />
                <span style={{ fontSize: 16, fontWeight: 600, color: C.green }}>Fixação</span>
              </div>
              <div style={{ fontSize: 13.5, color: C.inkSoft, marginBottom: 16, lineHeight: 1.6 }}>
                Responda sem consultar a aula. Onde você travar é exatamente o trecho para reler.
              </div>
              <div className="ru-lesson" style={{ fontFamily: "'Literata', serif", fontSize: 15.5, lineHeight: 1.75 }}>{renderLesson(open.fixacao)}</div>
            </section>
          )}
        </div>
      </div>
    );
  }

  const done = list.filter((a) => a.status === "done").length;

  return (
    <div>
      <PageHead title="Aulas" sub="Currículo montado a partir da incidência real das provas da Unicamp, na ordem em que faz sentido estudar." />

      <div style={{ display: "flex", gap: 22, borderBottom: `1px solid ${C.line}`, marginBottom: 24, overflowX: "auto" }}>
        {subjects.map((s) => {
          const on = s === subject;
          return (
            <button key={s} className="ru-nav" onClick={() => setSubject(s)} style={{
              background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit",
              fontSize: 16.5, padding: "0 0 14px", whiteSpace: "nowrap",
              color: on ? C.ink : C.inkFaint, fontWeight: on ? 600 : 400,
              borderBottom: `2px solid ${on ? C.blue : "transparent"}`, marginBottom: -1
            }}>{s}</button>
          );
        })}
      </div>

      <div style={{ fontSize: 13.5, color: C.inkSoft, marginBottom: 14 }}>
        {list.length} módulos, {done} concluídos
      </div>

      <div style={{ borderRadius: R.md, overflow: "hidden", background: C.card, boxShadow: SH.card }}>
        {list.map((a, i) => (
          <button key={a.id} className="ru-row" onClick={() => setOpenId(a.id)} style={{
            display: "flex", alignItems: "center", gap: 16, width: "100%", textAlign: "left",
            background: "transparent", border: "none", borderTop: i ? `1px solid ${C.lineSoft}` : "none",
            padding: "19px 26px", cursor: "pointer", color: C.ink, fontFamily: "inherit"
          }}>
            <span style={{ fontSize: 14, color: C.inkFaint, width: 18, flexShrink: 0 }}>{a.order}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 17.5, fontWeight: 600, letterSpacing: "-0.01em" }}>{a.title}</span>
              <span style={{ display: "block", fontSize: 14.5, color: C.inkSoft, marginTop: 4, lineHeight: 1.5 }}>{a.scope}</span>
            </span>
            <Weight level={a.incidence} title={INCIDENCE_TITLE[a.incidence]} />
            {a.status === "done" && <Check size={16} color={C.green} />}
            {!a.content && <span style={{ fontSize: 12.5, color: C.inkFaint, whiteSpace: "nowrap" }}>vazia</span>}
            <ChevronRight size={16} color={C.inkFaint} />
          </button>
        ))}
      </div>

      <Sheet style={{ marginTop: 24, maxWidth: 620 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Carregar uma aula</div>
        <div style={{ fontSize: 13.5, color: C.inkSoft, marginBottom: 12, lineHeight: 1.55 }}>Cole aqui o bloco que eu mandar no chat.</div>
        <textarea value={imp} onChange={(e) => setImp(e.target.value)} placeholder="[{&quot;id&quot;: …}]" style={{ ...inp, width: "100%", minHeight: 84, fontFamily: "ui-monospace, monospace", fontSize: 12.5, resize: "vertical" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
          <button className="ru-btn" onClick={importar} style={btnP}><Plus size={14} /> Carregar</button>
          {msg && <span style={{ fontSize: 13.5, color: msg.startsWith("Nenhum") || msg.startsWith("O texto") ? C.red : C.green }}>{msg}</span>}
        </div>
      </Sheet>
    </div>
  );
}

/* ---------------- Tópicos ---------------- */
function Topicos({ data, persist, daysLeft }) {
  const today = todayISO();
  const modes = { ...SUBJECT_MODES_DEFAULT, ...(data.settings.subjectModes || {}) };
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ subject: SUBJECTS[0], name: "", examWeight: 3 });
  const upd = (id, patch) => persist({ ...data, topics: data.topics.map((t) => (t.id === id ? { ...t, ...patch } : t)) });

  const cov = useMemo(() => {
    const tot = data.topics.reduce((s, t) => s + t.examWeight, 0) || 1;
    const ns = data.topics.filter((t) => (t.status || "in_progress") === "not_started");
    return { pct: Math.round((1 - ns.reduce((s, t) => s + t.examWeight, 0) / tot) * 100), count: ns.length };
  }, [data.topics]);

  const grouped = useMemo(() => {
    const m = {}; data.topics.forEach((t) => { (m[t.subject] = m[t.subject] || []).push(t); }); return m;
  }, [data.topics]);

  return (
    <div>
      <PageHead
        title="Tópicos"
        sub="Peso na prova e taxa de acerto são o que alimenta a rota. Corrija quando o número não refletir a realidade."
        right={<button className="ru-btn" onClick={() => setOpen(true)} style={btnP}><Plus size={14} /> Novo tópico</button>}
      />

      <Sheet accent={cov.count ? C.red : C.green} style={{ marginBottom: 26, display: "flex", gap: 40, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{cov.pct}%</div>
          <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4 }}>da prova coberta, por peso</div>
        </div>
        <div>
          <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1, color: cov.count ? C.red : C.green }}>{cov.count}</div>
          <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4 }}>tópicos nunca estudados</div>
        </div>
      </Sheet>

      {Object.entries(grouped).map(([subj, ts]) => (
        <div key={subj} style={{ marginBottom: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}>
            <span style={{ fontSize: 17, fontWeight: 600 }}>{subj}</span>
            <Tag color={modes[subj] === "profundidade" ? C.amber : C.blue}>
              {modes[subj] === "profundidade" ? "profundidade" : "treino"}
            </Tag>
          </div>
          <div style={{ borderRadius: R.md, overflow: "hidden", background: C.card, boxShadow: SH.card }}>
            {ts.slice().sort((a, b) => topicScore(b, daysLeft, today) - topicScore(a, daysLeft, today)).map((t, i) => {
              const profundidade = modes[t.subject] === "profundidade";
              const acc = Math.round(topicAccuracy(t) * 100);
              const rec = t.lastPracticed ? diffDays(today, t.lastPracticed) : null;
              const st = t.status || "in_progress";
              return (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 20px", borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 15.5 }}>{t.name}</span>
                    {profundidade && (
                      <span style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, fontSize: 12.5, color: C.inkFaint }}>
                        <span style={{ color: PHASE_COLOR[fase(t)], fontWeight: 500 }}>{PHASE_LABEL[fase(t)]}</span>
                        {fase(t) === "teoria" && (
                          <>
                            <span>aulas</span>
                            <input type="number" value={t.lessonsDone || 0} onChange={(e) => upd(t.id, { lessonsDone: Number(e.target.value) || 0 })}
                              style={{ ...inp, width: 52, padding: "3px 6px", fontSize: 12.5 }} />
                            <span>de</span>
                            <input type="number" placeholder="?" value={t.lessonsTotal ?? ""} onChange={(e) => upd(t.id, { lessonsTotal: e.target.value === "" ? null : Number(e.target.value) })}
                              style={{ ...inp, width: 52, padding: "3px 6px", fontSize: 12.5 }} />
                          </>
                        )}
                      </span>
                    )}
                  </span>
                  {profundidade && (
                    <select value={fase(t)} onChange={(e) => upd(t.id, { phase: e.target.value })} style={{ ...sel, width: 128, fontSize: 13, color: PHASE_COLOR[fase(t)] }}>
                      <option value="teoria">Vendo teoria</option>
                      <option value="questoes">Fazendo questões</option>
                      <option value="fechado">Fechado</option>
                    </select>
                  )}
                  <select value={st} onChange={(e) => upd(t.id, { status: e.target.value })} style={{ ...sel, width: 126, fontSize: 13, color: STATUS_COLORS[st] }}>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k} style={{ color: C.ink }}>{v}</option>)}
                  </select>
                  <select value={t.examWeight} onChange={(e) => upd(t.id, { examWeight: Number(e.target.value) })} style={{ ...sel, width: 76, fontSize: 13 }}>
                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>peso {n}</option>)}
                  </select>
                  <span style={{ fontSize: 13.5, width: 62, textAlign: "right", color: st === "not_started" ? C.inkFaint : acc < 50 ? C.red : acc < 70 ? C.amber : C.green }}>
                    {st === "not_started" ? "—" : `${acc}%`}
                  </span>
                  <span style={{ fontSize: 12.5, width: 92, textAlign: "right", color: C.inkFaint }}>{rec == null ? "nunca visto" : `há ${rec} dias`}</span>
                  <button className="ru-btn" onClick={() => persist({ ...data, topics: data.topics.filter((x) => x.id !== t.id) })} style={btnI}><Trash2 size={14} color={C.inkFaint} /></button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {open && (
        <Modal title="Novo tópico" onClose={() => setOpen(false)}>
          <div style={lbl}>Matéria</div>
          <select value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} style={{ ...sel, width: "100%" }}>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{ ...lbl, marginTop: 14 }}>Nome</div>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} style={{ ...inp, width: "100%" }} />
          <div style={{ ...lbl, marginTop: 14 }}>Peso na prova, de 1 a 5</div>
          <select value={f.examWeight} onChange={(e) => setF({ ...f, examWeight: e.target.value })} style={{ ...sel, width: "100%" }}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 22 }}>
            <button className="ru-btn" onClick={() => setOpen(false)} style={btnG}>Cancelar</button>
            <button className="ru-btn" onClick={() => {
              if (!f.name.trim()) return;
              persist({ ...data, topics: [...data.topics, { id: uid(), subject: f.subject, name: f.name.trim(), examWeight: Number(f.examWeight), correct: 0, total: 0, lastPracticed: null, status: "not_started" }] });
              setF({ subject: SUBJECTS[0], name: "", examWeight: 3 }); setOpen(false);
            }} style={btnP}>Adicionar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Moldes da banca ---------------- */
const MOLDE_COR = { novo: null, treinando: "#B57A16", dominado: "#2C7355" };

// Fila do dia. Ordena por peso e devolve os primeiros que ainda não estão dominados.
function moldesDoDia(status, quantos) {
  return MOLDES
    .map((m) => ({ m, p: pesoMolde(m, status[m.id]) }))
    .filter((x) => x.p > 0)
    .sort((a, b) => b.p - a.p || a.m.id.localeCompare(b.m.id))
    .slice(0, quantos)
    .map((x) => x.m);
}

function MoldesStrip({ data, persist, setTab }) {
  const status = data.moldes || {};
  const fila = useMemo(() => moldesDoDia(status, 2), [status]);
  if (!fila.length) return null;

  function marcar(id) {
    persist({ ...data, moldes: { ...status, [id]: "treinando" } });
  }

  return (
    <div style={{
      background: C.card, borderRadius: R.md, boxShadow: SH.card,
      padding: "16px 20px", marginBottom: 20, borderLeft: `3px solid ${C.amber}`
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, marginBottom: 10 }}>
        <span style={{ fontSize: 14.5, fontWeight: 600 }}>Moldes para reconhecer hoje</span>
        <button className="ru-btn" onClick={() => setTab("moldes")} style={{ ...btnI, fontSize: 13, color: C.blue, fontFamily: "inherit" }}>
          ver todos <ChevronRight size={14} />
        </button>
      </div>
      {fila.map((m, i) => (
        <div key={m.id} style={{ paddingTop: i ? 12 : 0, marginTop: i ? 12 : 0, borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "baseline" }}>
            <span style={{ fontSize: 14.5, fontWeight: 500 }}>{m.titulo}</span>
            <button className="ru-btn" onClick={() => marcar(m.id)} style={{ ...btnQ, background: C.amberSoft, color: C.amber, flexShrink: 0 }}>
              Estou treinando
            </button>
          </div>
          <div style={{ fontSize: 13.5, color: C.inkSoft, marginTop: 5, lineHeight: 1.55 }}>{m.gatilho}</div>
        </div>
      ))}
    </div>
  );
}

function Moldes({ data, persist }) {
  const [aba, setAba] = useState("moldes");
  const [topico, setTopico] = useState("todos");
  const [soCriticos, setSoCriticos] = useState(false);
  const [aberto, setAberto] = useState(null);

  const status = data.moldes || {};
  const topicos = useMemo(() => {
    const t = []; MOLDES.forEach((m) => { if (!t.includes(m.topico)) t.push(m.topico); }); return t;
  }, []);

  const lista = useMemo(() => MOLDES.filter(
    (m) => (topico === "todos" || m.topico === topico) && (!soCriticos || m.nivel === "obrigatoria")
  ), [topico, soCriticos]);

  const dominados = MOLDES.filter((m) => status[m.id] === "dominado").length;

  function girar(id) {
    const proximo = MOLDE_STATUS_CICLO[status[id] || "novo"];
    persist({ ...data, moldes: { ...status, [id]: proximo } });
  }

  const abas = [
    ["moldes", "Moldes"], ["assinatura", "Jeito da banca"], ["pegadinhas", "Pegadinhas"],
    ["incidencia", "Incidência"], ["radar", "Depois de 2022"],
  ];

  return (
    <div>
      <PageHead
        title="Moldes da banca"
        sub={`${MOLDES.length} padrões destilados de 105 questões objetivas de matemática da Unicamp. A prova repete formato muito mais do que repete número, e reconhecer o formato é o que falta na hora.`}
        right={<span style={{ fontSize: 14, color: C.inkSoft, alignSelf: "center" }}>{dominados} de {MOLDES.length} dominados</span>}
      />

      <div style={{ display: "flex", gap: 22, borderBottom: `1px solid ${C.line}`, marginBottom: 24, overflowX: "auto" }}>
        {abas.map(([id, label]) => {
          const on = aba === id;
          return (
            <button key={id} className="ru-nav" onClick={() => setAba(id)} style={{
              background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit",
              fontSize: 16.5, padding: "0 0 14px", whiteSpace: "nowrap",
              color: on ? C.ink : C.inkFaint, fontWeight: on ? 600 : 400,
              borderBottom: `2px solid ${on ? C.blue : "transparent"}`, marginBottom: -1
            }}>{label}</button>
          );
        })}
      </div>

      {aba === "moldes" && (
        <>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
            <select value={topico} onChange={(e) => setTopico(e.target.value)} style={{ ...sel, minWidth: 210 }}>
              <option value="todos">Todos os tópicos</option>
              {topicos.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14, color: C.inkSoft, cursor: "pointer" }}>
              <input type="checkbox" checked={soCriticos} onChange={(e) => setSoCriticos(e.target.checked)} />
              Só o que não pode errar
            </label>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {lista.map((m) => {
              const st = status[m.id] || "novo";
              const cor = MOLDE_COR[st];
              const on = aberto === m.id;
              return (
                <div key={m.id} className="ru-card" style={{
                  background: C.card, borderRadius: R.lg, boxShadow: SH.card,
                  position: "relative", overflow: "hidden", opacity: st === "dominado" ? .74 : 1
                }}>
                  {cor && <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: cor }} />}

                  <button onClick={() => setAberto(on ? null : m.id)} style={{
                    display: "block", width: "100%", textAlign: "left", background: "transparent",
                    border: "none", cursor: "pointer", color: C.ink, fontFamily: "inherit", padding: "22px 26px 18px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start" }}>
                      <div style={{ display: "flex", gap: 14, minWidth: 0 }}>
                        <span style={{ fontSize: 13, color: C.inkFaint, marginTop: 4, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{m.id}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 18.5, fontWeight: 600, letterSpacing: "-0.02em" }}>{m.titulo}</div>
                          <div style={{ marginTop: 8, display: "flex", gap: 7, flexWrap: "wrap" }}>
                            <Tag color={SUBJECT_COLOR["Matemática"]}>{m.topico}</Tag>
                            {m.nivel === "obrigatoria" && <Tag color={C.red}>Não pode errar</Tag>}
                            {m.incidencia === "repetida" && <Tag color={C.amber}>Repetiu de ano</Tag>}
                            {m.alertaPessoal && <Tag color={C.green}>Já te pegou</Tag>}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                        <span style={{ fontSize: 13, color: C.inkFaint }}>{m.ocorrencias}×</span>
                        <ChevronRight size={16} color={C.inkFaint} style={{ transform: on ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
                      </div>
                    </div>

                    <div style={{
                      marginTop: 14, paddingLeft: 14, borderLeft: `2px solid ${C.red}`,
                      fontFamily: "'Literata', Georgia, serif", fontSize: 16, lineHeight: 1.65, color: C.ink
                    }}>{m.gatilho}</div>
                  </button>

                  {on && (
                    <div style={{ borderTop: `1px solid ${C.lineSoft}`, padding: "22px 26px 24px", display: "flex", flexDirection: "column", gap: 22 }}>
                      <section>
                        <div style={{ ...lbl, fontWeight: 600 }}>Rota de resolução</div>
                        <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 7, fontSize: 15, lineHeight: 1.6 }}>
                          {m.rota.map((p, i) => <li key={i}>{p}</li>)}
                        </ol>
                      </section>

                      <section style={{ background: C.redSoft, borderLeft: `3px solid ${C.red}`, borderRadius: R.md, padding: "16px 18px" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.red, marginBottom: 5 }}>Onde a banca derruba</div>
                        <div style={{ fontSize: 14.5, lineHeight: 1.6 }}>{m.pegadinha}</div>
                      </section>

                      {m.alertaPessoal && (
                        <section style={{ background: C.greenSoft, borderLeft: `3px solid ${C.green}`, borderRadius: R.md, padding: "16px 18px" }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: C.green, marginBottom: 5 }}>No seu histórico</div>
                          <div style={{ fontSize: 14.5, lineHeight: 1.6 }}>{m.alertaPessoal}</div>
                        </section>
                      )}

                      <section>
                        <div style={{ ...lbl, fontWeight: 600 }}>Onde treinar</div>
                        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: C.inkSoft, lineHeight: 1.7 }}>
                          {m.exemplos.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      </section>

                      <button className="ru-btn" onClick={() => girar(m.id)} style={{ ...btnG, alignSelf: "flex-start" }}>
                        {st === "dominado" && <Check size={14} color={C.green} />}
                        {MOLDE_STATUS_LABEL[st]}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {aba === "assinatura" && (
        <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 4 }}>
          {ASSINATURA_BANCA.map((a, i) => (
            <Sheet key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 17.5, fontWeight: 600, letterSpacing: "-0.015em", marginBottom: 7 }}>{a.traco}</div>
              <div style={{ fontFamily: "'Literata', Georgia, serif", fontSize: 16, lineHeight: 1.72, color: C.inkSoft }}>{a.detalhe}</div>
            </Sheet>
          ))}
        </div>
      )}

      {aba === "pegadinhas" && (
        <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 10 }}>
          {PEGADINHAS.map((p, i) => (
            <Sheet key={i} accent={C.red}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "baseline" }}>
                <div style={{ fontSize: 17.5, fontWeight: 600, letterSpacing: "-0.015em" }}>{p.nome}</div>
                {p.reincidencia && <Tag color={C.red}>{p.reincidencia}</Tag>}
              </div>
              <div style={{ fontFamily: "'Literata', Georgia, serif", fontSize: 16, lineHeight: 1.72, color: C.inkSoft, margin: "8px 0 14px" }}>{p.descricao}</div>
              <div style={{ background: C.greenSoft, borderRadius: R.sm, padding: "12px 15px", fontSize: 14.5, color: C.green, lineHeight: 1.6 }}>{p.antidoto}</div>
            </Sheet>
          ))}
        </div>
      )}

      {aba === "incidencia" && (
        <div style={{ maxWidth: 760 }}>
          <div style={{ fontSize: 13.5, color: C.inkSoft, marginBottom: 18 }}>{MOLDES_FONTE.base}</div>
          <Sheet style={{ marginBottom: 22 }}>
            {INCIDENCIA_MAT.map((c, i) => (
              <div key={c.capitulo} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 15 }}>{c.capitulo}</span>
                <span style={{ width: 34, textAlign: "right", fontSize: 14, color: C.inkFaint, fontVariantNumeric: "tabular-nums" }}>{c.questoes}</span>
                <span style={{ width: 190, height: 7, background: C.lineSoft, borderRadius: 999, overflow: "hidden", flexShrink: 0 }}>
                  <span style={{ display: "block", height: "100%", width: `${(c.percentual / 22) * 100}%`, background: i === 0 ? C.blue : C.blueMid, borderRadius: 999 }} />
                </span>
                <span style={{ width: 48, textAlign: "right", fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{c.percentual}%</span>
              </div>
            ))}
          </Sheet>
          <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 12, fontSize: 15.5, lineHeight: 1.65, color: C.inkSoft }}>
            {LEITURA_INCIDENCIA.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </div>
      )}

      {aba === "radar" && (
        <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 13.5, color: C.inkFaint, marginBottom: 6, lineHeight: 1.6 }}>{RADAR_RECENTE.aviso}</div>
          {RADAR_RECENTE.itens.map((r, i) => (
            <Sheet key={i} accent={C.blue}>
              <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.015em", marginBottom: 8 }}>{r.ano}</div>
              <div style={{ fontFamily: "'Literata', Georgia, serif", fontSize: 16, lineHeight: 1.72, marginBottom: 12 }}>{r.observacao}</div>
              <div style={{ background: C.blueSoft, borderRadius: R.sm, padding: "12px 15px", fontSize: 14.5, color: C.blue, lineHeight: 1.6 }}>{r.leitura}</div>
            </Sheet>
          ))}
          <Sheet accent={C.red}>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.015em", marginBottom: 10 }}>O que a apostila não cobre</div>
            <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 9, fontSize: 15, lineHeight: 1.6, color: C.inkSoft }}>
              {RADAR_RECENTE.lacunasDoMaterial.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          </Sheet>
          <Sheet>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.015em", marginBottom: 10 }}>Como usar isto</div>
            <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 9, fontSize: 15, lineHeight: 1.6, color: C.inkSoft }}>
              {PLANO_MOLDES.map((p, i) => <li key={i}>{p}</li>)}
            </ol>
          </Sheet>
        </div>
      )}
    </div>
  );
}

/* ---------------- Flashcards ---------------- */
function Flashcards({ data, persist }) {
  const today = todayISO();
  const weekday = new Date(today + "T12:00:00").getDay();
  const sched = (data.settings.weekSchedule || DEFAULT_WEEK_SCHEDULE)[weekday] || { type: "study", subjects: [] };
  const todaySubjects = sched.subjects || [];
  const limit = data.settings.dailyCardLimit ?? 100;
  const follow = data.settings.cardsFollowSchedule !== false;

  const [rev, setRev] = useState(false); const [queue, setQueue] = useState([]); const [flip, setFlip] = useState(false);
  const [scope, setScope] = useState("dia");
  const [filter, setFilter] = useState("Todas");
  const [one, setOne] = useState({ subject: SUBJECTS[0], topic: "", front: "", back: "" });
  const [bulkS, setBulkS] = useState(SUBJECTS[0]); const [bulkT, setBulkT] = useState(""); const [bulk, setBulk] = useState("");

  const allDue = useMemo(
    () => data.flashcards.filter((c) => c.nextReview <= today).sort((a, b) => a.nextReview.localeCompare(b.nextReview)),
    [data.flashcards, today]
  );
  const dueToday = useMemo(
    () => (follow && todaySubjects.length ? allDue.filter((c) => todaySubjects.includes(c.subject)) : allDue),
    [allDue, follow, todaySubjects]
  );
  const sessionPool = scope === "dia" ? dueToday : allDue;
  const session = sessionPool.slice(0, limit);
  const backlog = Math.max(0, allDue.length - dueToday.length);

  const card = rev && queue.length ? data.flashcards.find((c) => c.id === queue[0]) : null;

  function advance(patch) {
    const id = queue[0];
    persist({ ...data, flashcards: data.flashcards.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
    const rest = queue.slice(1); setQueue(rest); setFlip(false); if (!rest.length) setRev(false);
  }
  const grade = (q) => advance(schedule(data.flashcards.find((x) => x.id === queue[0]), q));
  const park = () => advance(parkCard());

  function masterTopic(subject, topic) {
    persist({
      ...data, flashcards: data.flashcards.map((c) =>
        c.subject === subject && (c.topic || "") === (topic || "") ? { ...c, ...parkCard() } : c)
    });
  }

  const mk = (subject, topic, front, back) => ({ id: uid(), subject, topic, front, back, ease: 2.5, interval: 0, repetitions: 0, nextReview: today, lastReviewed: null });
  const list = filter === "Todas" ? data.flashcards : data.flashcards.filter((c) => c.subject === filter);

  const topics = useMemo(() => {
    const m = {};
    data.flashcards.forEach((c) => {
      const k = `${c.subject}||${c.topic || ""}`;
      if (!m[k]) m[k] = { subject: c.subject, topic: c.topic || "", total: 0, due: 0 };
      m[k].total += 1; if (c.nextReview <= today) m[k].due += 1;
    });
    return Object.values(m).sort((a, b) => b.due - a.due || a.subject.localeCompare(b.subject));
  }, [data.flashcards, today]);

  if (rev) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontSize: 13.5, color: C.inkSoft }}>{queue.length} restante{queue.length > 1 ? "s" : ""}</span>
          <button className="ru-btn" onClick={() => setRev(false)} style={btnG}>Pausar</button>
        </div>
        {card ? (
          <>
            <div onClick={() => setFlip(!flip)} style={{
              background: C.card, borderTop: `3px solid ${flip ? C.green : C.blue}`, boxShadow: SH.lift,
              borderRadius: R.lg, padding: "84px 48px", minHeight: 280, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", textAlign: "center", cursor: "pointer"
            }}>
              <div style={{ fontSize: 12.5, color: C.inkFaint, marginBottom: 18 }}>{card.subject}{card.topic ? `, ${card.topic}` : ""}</div>
              <div style={{ fontFamily: "'Literata', serif", fontSize: 23, lineHeight: 1.55 }}>{flip ? card.back : card.front}</div>
              {!flip && <div style={{ fontSize: 12.5, color: C.inkFaint, marginTop: 24 }}>clique para virar</div>}
            </div>
            {flip ? (
              <>
                <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "center" }}>
                  <button className="ru-btn" onClick={() => grade(0)} style={{ ...btnG, color: C.red, borderColor: C.red }}>Errei<Small>1 dia</Small></button>
                  <button className="ru-btn" onClick={() => grade(3)} style={{ ...btnG, color: C.amber, borderColor: C.amber }}>Difícil<Small>1 a 3 dias</Small></button>
                  <button className="ru-btn" onClick={() => grade(4)} style={{ ...btnG, color: C.blue, borderColor: C.blue }}>Bom<Small>2 a 6 dias</Small></button>
                  <button className="ru-btn" onClick={() => grade(5)} style={{ ...btnG, color: C.green, borderColor: C.green }}>Fácil<Small>4 a 10 dias</Small></button>
                </div>
                <div style={{ textAlign: "center", marginTop: 14 }}>
                  <button className="ru-btn" onClick={park} style={{ ...btnQ, background: C.greenSoft, color: C.green }}>
                    Já domino, só quero rever antes da prova
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
                <button className="ru-btn" onClick={() => setFlip(true)} style={btnP}>Virar</button>
              </div>
            )}
          </>
        ) : (
          <><Empty>Sessão concluída.</Empty><button className="ru-btn" onClick={() => setRev(false)} style={btnG}>Voltar</button></>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHead
        title="Flashcards"
        sub="A revisão segue as matérias do dia e para no seu limite diário. Nada de fila infinita."
        right={<button className="ru-btn" disabled={!session.length} onClick={() => { setQueue(session.map((c) => c.id)); setFlip(false); setRev(true); }}
          style={{ ...btnP, opacity: session.length ? 1 : 0.45, cursor: session.length ? "pointer" : "default" }}>
          <RotateCw size={14} /> Revisar {session.length}
        </button>}
      />

      <Sheet style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 44, flexWrap: "wrap", alignItems: "flex-start" }}>
          <Stat value={dueToday.length} label={follow && todaySubjects.length ? `vencidos em ${todaySubjects.join(" e ")}` : "vencidos hoje"} color={dueToday.length ? C.amber : C.green} />
          <Stat value={backlog} label="de outras matérias, ficam para o dia delas" color={C.inkFaint} />
          <Stat value={data.flashcards.length} label="cartões no total" />
        </div>

        <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap", marginTop: 22, paddingTop: 18, borderTop: `1px solid ${C.lineSoft}` }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.inkSoft, cursor: "pointer" }}>
            <input type="checkbox" checked={follow} onChange={(e) => persist({ ...data, settings: { ...data.settings, cardsFollowSchedule: e.target.checked } })} />
            Só as matérias do dia
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.inkSoft }}>
            Máximo por dia
            <input type="number" value={limit} onChange={(e) => persist({ ...data, settings: { ...data.settings, dailyCardLimit: Number(e.target.value) || 100 } })} style={{ ...inp, width: 78 }} />
          </label>
          {backlog > 0 && (
            <button className="ru-btn" onClick={() => setScope(scope === "dia" ? "tudo" : "dia")} style={btnQ}>
              {scope === "dia" ? "Incluir as outras matérias" : "Voltar só para as do dia"}
            </button>
          )}
        </div>
      </Sheet>

      {topics.length > 0 && (
        <>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Por assunto</div>
          <div style={{ borderRadius: R.md, overflow: "hidden", background: C.card, boxShadow: SH.card, marginBottom: 28 }}>
            {topics.map((t, i) => (
              <div key={`${t.subject}${t.topic}`} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 22px", borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}>
                <span style={{ flex: 1, fontSize: 15 }}>{t.topic || "sem assunto"}<span style={{ color: C.inkFaint }}>, {t.subject}</span></span>
                <span style={{ fontSize: 13.5, color: C.inkFaint }}>{t.total} cartões</span>
                {t.due > 0
                  ? <Tag color={C.amber}>{t.due} vencidos</Tag>
                  : <Tag color={C.green}>em dia</Tag>}
                <button className="ru-btn" onClick={() => masterTopic(t.subject, t.topic)} style={btnQ}>Já domino</button>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        <Sheet style={{ flex: "1 1 300px" }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Novo cartão</div>
          <select value={one.subject} onChange={(e) => setOne({ ...one, subject: e.target.value })} style={{ ...sel, width: "100%", marginBottom: 9 }}>
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input value={one.topic} onChange={(e) => setOne({ ...one, topic: e.target.value })} placeholder="Assunto" style={{ ...inp, width: "100%", marginBottom: 9 }} />
          <textarea value={one.front} onChange={(e) => setOne({ ...one, front: e.target.value })} placeholder="Pergunta" style={{ ...inp, width: "100%", minHeight: 54, marginBottom: 9, resize: "vertical" }} />
          <textarea value={one.back} onChange={(e) => setOne({ ...one, back: e.target.value })} placeholder="Resposta" style={{ ...inp, width: "100%", minHeight: 54, marginBottom: 12, resize: "vertical" }} />
          <button className="ru-btn" onClick={() => {
            if (!one.front.trim() || !one.back.trim()) return;
            persist({ ...data, flashcards: [mk(one.subject, one.topic.trim(), one.front.trim(), one.back.trim()), ...data.flashcards] });
            setOne({ ...one, front: "", back: "" });
          }} style={btnP}><Plus size={14} /> Adicionar</button>
        </Sheet>

        <Sheet style={{ flex: "1 1 300px" }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 5 }}>Vários de uma vez</div>
          <div style={{ fontSize: 13.5, color: C.inkSoft, marginBottom: 13 }}>Uma linha por cartão, pergunta e resposta separadas por barra vertical.</div>
          <div style={{ display: "flex", gap: 9, marginBottom: 9 }}>
            <select value={bulkS} onChange={(e) => setBulkS(e.target.value)} style={sel}>{SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            <input value={bulkT} onChange={(e) => setBulkT(e.target.value)} placeholder="Assunto" style={{ ...inp, flex: 1 }} />
          </div>
          <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder={"pergunta 1 | resposta 1\npergunta 2 | resposta 2"} style={{ ...inp, width: "100%", minHeight: 126, marginBottom: 12, resize: "vertical" }} />
          <button className="ru-btn" onClick={() => {
            const novos = bulk.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
              const p = l.split("|"); if (p.length < 2) return null;
              const f = p[0].trim(), b = p.slice(1).join("|").trim();
              return f && b ? mk(bulkS, bulkT.trim(), f, b) : null;
            }).filter(Boolean);
            if (!novos.length) return;
            persist({ ...data, flashcards: [...novos, ...data.flashcards] }); setBulk("");
          }} style={btnP}><Plus size={14} /> Adicionar todos</button>
        </Sheet>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "30px 0 14px" }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{list.length} cartões</div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ ...sel, fontSize: 13.5 }}>
          <option>Todas</option>{SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {!list.length && <Empty>Nenhum cartão ainda.</Empty>}
      <div style={{ borderRadius: R.md, overflow: "hidden", background: list.length ? C.card : "transparent", boxShadow: list.length ? SH.card : "none" }}>
        {list.map((c, i) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 22px", borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}>
            <span style={{ fontSize: 12.5, color: SUBJECT_COLOR[c.subject] || C.inkFaint, width: 84, flexShrink: 0 }}>{c.subject}</span>
            <span style={{ flex: 1, fontSize: 14.5, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.front}</span>
            <span style={{ fontSize: 12.5, color: c.nextReview <= today ? C.amber : C.inkFaint, whiteSpace: "nowrap" }}>
              {c.nextReview <= today ? "vencido" : `volta ${fmtDate(c.nextReview)}`}
            </span>
            <button className="ru-btn" onClick={() => persist({ ...data, flashcards: data.flashcards.filter((x) => x.id !== c.id) })} style={btnI}><Trash2 size={14} color={C.inkFaint} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Small({ children }) {
  return <span style={{ fontSize: 11, opacity: .62, marginLeft: 5 }}>{children}</span>;
}

/* ---------------- Leitura ---------------- */
function Leitura({ data, persist }) {
  const upd = (id, patch) => persist({ ...data, obras: data.obras.map((o) => (o.id === id ? { ...o, ...patch } : o)) });
  const activeId = data.settings.activeObraId;

  return (
    <div>
      <PageHead title="Leitura das obras" sub="A rota do dia sempre mostra até que página ler da obra atual." />
      <Sheet style={{ marginBottom: 22, display: "flex", alignItems: "center", gap: 12, maxWidth: 380 }}>
        <span style={{ fontSize: 14, color: C.inkSoft }}>Páginas por dia</span>
        <input type="number" value={data.settings.dailyReadingPages} onChange={(e) => persist({ ...data, settings: { ...data.settings, dailyReadingPages: Number(e.target.value) || 15 } })} style={{ ...inp, width: 72 }} />
      </Sheet>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.obras.map((o) => {
          const pct = o.totalPages ? Math.min(100, Math.round((o.currentPage / o.totalPages) * 100)) : null;
          const fin = o.totalPages && o.currentPage >= o.totalPages;
          const act = activeId === o.id;
          return (
            <Sheet key={o.id} accent={fin ? C.green : act ? C.blue : null}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
                <div>
                  <div style={{ fontFamily: "'Literata', serif", fontSize: 17, fontWeight: 500 }}>{o.title}</div>
                  <div style={{ fontSize: 13.5, color: C.inkSoft, marginTop: 2 }}>{o.author}</div>
                </div>
                {fin ? <Tag color={C.green}>concluída</Tag>
                  : act ? <Tag color={C.blue}>lendo agora</Tag>
                  : <button className="ru-btn" onClick={() => persist({ ...data, settings: { ...data.settings, activeObraId: o.id } })} style={btnQ}>Ler esta</button>}
              </div>
              <div style={{ display: "flex", gap: 9, alignItems: "center", marginTop: 14 }}>
                <span style={{ fontSize: 13.5, color: C.inkSoft }}>página</span>
                <input type="number" value={o.currentPage} onChange={(e) => upd(o.id, { currentPage: Number(e.target.value) || 0 })} style={{ ...inp, width: 72 }} />
                <span style={{ fontSize: 13.5, color: C.inkSoft }}>de</span>
                <input type="number" placeholder="total" value={o.totalPages ?? ""} onChange={(e) => upd(o.id, { totalPages: e.target.value === "" ? null : Number(e.target.value) })} style={{ ...inp, width: 72 }} />
                {pct != null && <span style={{ fontSize: 14, fontWeight: 600, color: C.green }}>{pct}%</span>}
              </div>
              {pct != null && (
                <div style={{ height: 3, background: C.lineSoft, marginTop: 12 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: C.green }} />
                </div>
              )}
            </Sheet>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Caderno de erros ---------------- */
const POR_FOLHA = 2;

function CadernoErros({ data, persist }) {
  const [vista, setVista] = useState("capa");   // capa | sumario | folhas
  const [subject, setSubject] = useState(null);
  const [folha, setFolha] = useState(0);
  const [dir, setDir] = useState("frente");
  const [open, setOpen] = useState(false);
  const [imp, setImp] = useState(""); const [msg, setMsg] = useState(null);

  const blank = () => ({ subject: SUBJECTS[0], topic: "", errorType: "conteudo", source: "", reasoning: "", specificError: "", correctSolution: "", keyConcept: "", trigger: "", destaque: false });
  const [f, setF] = useState(blank());

  const porMateria = useMemo(() => {
    const m = {};
    data.errors.forEach((e) => { (m[e.subject] = m[e.subject] || []).push(e); });
    return Object.entries(m)
      .map(([s, arr]) => ({ subject: s, erros: arr.slice().sort((a, b) => b.date.localeCompare(a.date)) }))
      .sort((a, b) => b.erros.length - a.erros.length);
  }, [data.errors]);

  const fixados = useMemo(() => data.errors.filter((e) => e.destaque), [data.errors]);
  const erros = subject ? (porMateria.find((m) => m.subject === subject)?.erros || []) : [];
  const totalFolhas = Math.max(1, Math.ceil(erros.length / POR_FOLHA));
  const naFolha = erros.slice(folha * POR_FOLHA, folha * POR_FOLHA + POR_FOLHA);

  function abrirMateria(s) { setSubject(s); setFolha(0); setDir("frente"); setVista("folhas"); }
  function irFolha(n) {
    if (n < 0 || n >= totalFolhas) return;
    setDir(n > folha ? "frente" : "tras");
    setFolha(n);
  }

  function importarErros() {
    try {
      const itens = [].concat(JSON.parse(imp));
      const chave = (e) => `${(e.source || "").trim()}|${(e.topic || "").trim()}|${(e.specificError || "").slice(0, 40)}`;
      const jaTem = new Set(data.errors.map(chave));
      const novos = itens.filter((e) => e && e.topic && !jaTem.has(chave(e))).map((e) => {
        const d = e.date || todayISO();
        return {
          id: uid(), date: d, due1: e.due1 || addDays(d, 1), due7: e.due7 || addDays(d, 7), due30: e.due30 || addDays(d, 30),
          r1Done: !!e.r1Done, r7Done: !!e.r7Done, r30Done: !!e.r30Done,
          subject: e.subject || SUBJECTS[0], topic: e.topic, errorType: e.errorType || "conteudo",
          source: e.source || "", reasoning: e.reasoning || "", specificError: e.specificError || "",
          correctSolution: e.correctSolution || "", keyConcept: e.keyConcept || "", trigger: e.trigger || "",
          destaque: !!e.destaque,
          correctionStatus: e.correctionStatus || "pendente",
          correctionHistory: e.correctionHistory || []
        };
      });
      if (!novos.length) { setMsg("Nenhum erro novo. Todos já estavam no caderno."); return; }
      persist({ ...data, errors: [...novos, ...data.errors] });
      setImp(""); setMsg(`${novos.length} erro${novos.length > 1 ? "s importados" : " importado"}.`);
      setTimeout(() => setMsg(null), 5000);
    } catch { setMsg("O texto colado não é um JSON válido."); }
  }

  return (
    <div>
      <PageHead
        title="Caderno de erros"
        sub={vista === "capa" ? "Abra o caderno para ver o sumário por matéria."
          : vista === "sumario" ? "Escolha a matéria e o caderno folheia até ela."
          : `${subject}, folha ${folha + 1} de ${totalFolhas}`}
        right={<>
          {vista !== "capa" && <button className="ru-btn" onClick={() => { setVista(vista === "folhas" ? "sumario" : "capa"); }} style={btnG}><ArrowLeft size={14} /> Voltar</button>}
          <button className="ru-btn" onClick={() => setOpen(true)} style={btnP}><Plus size={14} /> Registrar erro</button>
        </>}
      />

      <div style={{ perspective: 1800, display: "flex", justifyContent: "center", paddingBottom: 8 }}>
        {vista === "capa" && <Capa total={data.errors.length} materias={porMateria.length} onOpen={() => setVista("sumario")} />}

        {vista === "sumario" && (
          <Folha key="sumario" dir="frente" wide>
            <TituloManuscrito>Sumário</TituloManuscrito>
            {fixados.length > 0 && (
              <div style={{ marginBottom: 22, paddingBottom: 18, borderBottom: `1px dashed ${C.paperRule}` }}>
                <div style={{ fontFamily: "'Kalam', cursive", fontSize: 19, fontWeight: 700, color: "#B57A16", marginBottom: 10 }}>
                  ★ Erros que se repetem
                </div>
                {fixados.map((e) => (
                  <button key={e.id} onClick={() => abrirMateria(e.subject)} style={{
                    display: "block", width: "100%", textAlign: "left", background: "#F6EEDD", border: "1px solid #B57A1655",
                    borderRadius: 8, padding: "10px 14px", marginBottom: 8, cursor: "pointer", fontFamily: "'Kalam', cursive"
                  }}>
                    <span style={{ fontSize: 17, fontWeight: 700, color: "#B57A16" }}>{e.topic}</span>
                    <span style={{ fontSize: 14, color: C.inkFaint }}>, {e.subject}</span>
                  </button>
                ))}
              </div>
            )}
            {!porMateria.length && <LinhaManuscrita muted>Nenhum erro registrado ainda.</LinhaManuscrita>}
            {porMateria.map((m, i) => (
              <button key={m.subject} onClick={() => abrirMateria(m.subject)} style={{
                display: "flex", alignItems: "baseline", gap: 12, width: "100%", textAlign: "left",
                background: "transparent", border: "none", cursor: "pointer", padding: "9px 0",
                fontFamily: "'Kalam', cursive", color: C.ink, lineHeight: 1.9
              }}>
                <span style={{ fontSize: 17, color: C.inkFaint, width: 26 }}>{i + 1}.</span>
                <span style={{ fontSize: 21, color: SUBJECT_COLOR[m.subject] || C.ink, fontWeight: 700 }}>{m.subject}</span>
                <span style={{ flex: 1, borderBottom: `1px dotted ${C.paperRule}`, transform: "translateY(-4px)" }} />
                <span style={{ fontSize: 18, color: C.inkSoft }}>{m.erros.length} erro{m.erros.length > 1 ? "s" : ""}</span>
                <span style={{ fontSize: 16, color: C.inkFaint }}>fl. {i + 1}</span>
              </button>
            ))}
          </Folha>
        )}

        {vista === "folhas" && (
          <Folha key={`${subject}-${folha}`} dir={dir} wide color={SUBJECT_COLOR[subject]}>
            <TituloManuscrito color={SUBJECT_COLOR[subject]}>{subject}</TituloManuscrito>
            {!naFolha.length && <LinhaManuscrita muted>Folha em branco.</LinhaManuscrita>}
            {naFolha.map((e, i) => <ErroManuscrito key={e.id} e={e} ultimo={i === naFolha.length - 1}
              onDelete={() => persist({ ...data, errors: data.errors.filter((x) => x.id !== e.id) })} />)}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 26, paddingTop: 14, borderTop: `1px solid ${C.paperRule}` }}>
              <button className="ru-btn" disabled={folha === 0} onClick={() => irFolha(folha - 1)}
                style={{ ...btnG, opacity: folha === 0 ? .35 : 1, background: "transparent" }}>
                <ArrowLeft size={14} /> Folha anterior
              </button>
              <span style={{ fontFamily: "'Kalam', cursive", fontSize: 16, color: C.inkFaint }}>{folha + 1} / {totalFolhas}</span>
              <button className="ru-btn" disabled={folha >= totalFolhas - 1} onClick={() => irFolha(folha + 1)}
                style={{ ...btnG, opacity: folha >= totalFolhas - 1 ? .35 : 1, background: "transparent" }}>
                Próxima folha <ChevronRight size={14} />
              </button>
            </div>
          </Folha>
        )}
      </div>

      <Sheet style={{ marginTop: 30, maxWidth: 780, marginLeft: "auto", marginRight: "auto" }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Importar erros</div>
        <div style={{ fontSize: 13.5, color: C.inkSoft, marginBottom: 13, lineHeight: 1.55 }}>
          Cole o bloco que eu montar no chat. Erros repetidos são ignorados automaticamente.
        </div>
        <textarea value={imp} onChange={(e) => setImp(e.target.value)} placeholder='[{"subject": "Matemática", "topic": …}]'
          style={{ ...inp, width: "100%", minHeight: 84, fontFamily: "ui-monospace, monospace", fontSize: 12.5, resize: "vertical" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 11 }}>
          <button className="ru-btn" onClick={importarErros} style={btnP}><Plus size={14} /> Importar</button>
          {msg && <span style={{ fontSize: 13.5, color: msg.startsWith("O texto") ? C.red : msg.startsWith("Nenhum") ? C.inkSoft : C.green }}>{msg}</span>}
        </div>
      </Sheet>

      {open && (
        <Modal title="Registrar erro" onClose={() => setOpen(false)} wide>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><div style={lbl}>Matéria</div>
              <select value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} style={{ ...sel, width: "100%" }}>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div><div style={lbl}>Tópico</div>
              <input value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} style={{ ...inp, width: "100%" }} /></div>
          </div>
          <div style={{ ...lbl, marginTop: 14 }}>Que tipo de erro foi</div>
          <select value={f.errorType} onChange={(e) => setF({ ...f, errorType: e.target.value })} style={{ ...sel, width: "100%" }}>
            {Object.entries(ERROR_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <div style={{ fontSize: 13, color: ERROR_TYPES[f.errorType].color, marginTop: 5 }}>{ERROR_TYPES[f.errorType].fix}</div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: C.inkSoft, marginTop: 12, cursor: "pointer" }}>
            <input type="checkbox" checked={f.destaque} onChange={(e) => setF({ ...f, destaque: e.target.checked })} />
            Marcar como erro recorrente, aparece fixado no sumário
          </label>
          {[["source", "De onde veio a questão", "input"], ["reasoning", "O que eu fiz", "area"], ["specificError", "Onde errei", "area"],
            ["correctSolution", "Como se resolve", "area"], ["keyConcept", "Conceito por trás", "input"], ["trigger", "Gatilho para reconhecer da próxima vez", "input"]].map(([k, l, t]) => (
            <div key={k}>
              <div style={{ ...lbl, marginTop: 14 }}>{l}</div>
              {t === "area"
                ? <textarea value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} style={{ ...inp, width: "100%", minHeight: 54, resize: "vertical" }} />
                : <input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} style={{ ...inp, width: "100%" }} />}
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 9, marginTop: 22 }}>
            <button className="ru-btn" onClick={() => setOpen(false)} style={btnG}>Cancelar</button>
            <button className="ru-btn" onClick={() => {
              if (!f.topic.trim() || !f.specificError.trim()) return;
              const d = todayISO();
              persist({ ...data, errors: [{ id: uid(), date: d, due1: addDays(d, 1), due7: addDays(d, 7), due30: addDays(d, 30), r1Done: false, r7Done: false, r30Done: false, correctionStatus: "pendente", correctionHistory: [], ...f }, ...data.errors] });
              setF(blank()); setOpen(false);
            }} style={btnP}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Correção de erros ---------------- */
function CorrecaoErros({ data, persist }) {
  const today = todayISO();
  const weekday = new Date(today + "T12:00:00").getDay();
  const sched = (data.settings.weekSchedule || DEFAULT_WEEK_SCHEDULE)[weekday] || { type: "study", subjects: [] };
  const todaySubjects = sched.subjects || [];
  const follow = data.settings.correctionsFollowSchedule !== false;

  const [rev, setRev] = useState(false);
  const [queue, setQueue] = useState([]);
  const [reveal, setReveal] = useState(false);
  const [nota, setNota] = useState("");
  const [scope, setScope] = useState("dia");
  const [filter, setFilter] = useState("Todas");

  const pendentesTodos = useMemo(
    () => data.errors.filter((e) => (e.correctionStatus || "pendente") === "pendente"),
    [data.errors]
  );
  const pendentesDia = useMemo(
    () => (follow && todaySubjects.length ? pendentesTodos.filter((e) => todaySubjects.includes(e.subject)) : pendentesTodos),
    [pendentesTodos, follow, todaySubjects]
  );
  const pool = scope === "dia" ? pendentesDia : pendentesTodos;
  const backlog = Math.max(0, pendentesTodos.length - pendentesDia.length);

  const item = rev && queue.length ? data.errors.find((e) => e.id === queue[0]) : null;

  function registrarTentativa(resultado) {
    const id = queue[0];
    persist({
      ...data,
      errors: data.errors.map((x) => {
        if (x.id !== id) return x;
        const historico = [...(x.correctionHistory || []), { date: today, result: resultado, note: nota.trim() }];
        return { ...x, correctionHistory: historico, correctionStatus: resultado === "acertou" ? "dominado" : "pendente" };
      }),
    });
    const resto = queue.slice(1);
    setQueue(resto); setReveal(false); setNota("");
    if (!resto.length) setRev(false);
  }

  function reabrir(id) {
    persist({ ...data, errors: data.errors.map((x) => (x.id === id ? { ...x, correctionStatus: "pendente" } : x)) });
  }

  const dominados = data.errors.filter((e) => e.correctionStatus === "dominado");
  const list = filter === "Todas" ? data.errors : data.errors.filter((e) => e.subject === filter);

  if (rev) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontSize: 13.5, color: C.inkSoft }}>{queue.length} restante{queue.length > 1 ? "s" : ""}</span>
          <button className="ru-btn" onClick={() => setRev(false)} style={btnG}>Pausar</button>
        </div>
        {item ? (
          <div style={{
            background: C.card, borderTop: `3px solid ${reveal ? C.green : C.blue}`, boxShadow: SH.lift,
            borderRadius: R.lg, padding: "44px 40px", minHeight: 260
          }}>
            <div style={{ fontSize: 12.5, color: C.inkFaint, marginBottom: 8 }}>{item.subject}{item.topic ? `, ${item.topic}` : ""}</div>
            {item.destaque && <div style={{ fontSize: 12.5, color: "#B57A16", fontWeight: 600, marginBottom: 14 }}>Erro recorrente</div>}
            {item.source && <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 18 }}>{item.source}</div>}

            {!reveal ? (
              <>
                <div style={{ fontFamily: "'Literata', serif", fontSize: 18, lineHeight: 1.6, marginBottom: 22 }}>
                  Pense de novo nessa situação antes de olhar a resposta. O que você faria agora
                </div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <button className="ru-btn" onClick={() => setReveal(true)} style={btnP}>Já pensei, mostrar a resposta</button>
                </div>
              </>
            ) : (
              <>
                {item.reasoning && <div style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 10 }}><b>O que você fez da última vez.</b> {item.reasoning}</div>}
                {item.specificError && <div style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 10, color: C.red }}><b>Onde errou.</b> {item.specificError}</div>}
                {item.correctSolution && <div style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 10, color: C.green }}><b>O certo.</b> {item.correctSolution}</div>}
                {item.keyConcept && <div style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 10, color: C.blue }}><b>Conceito.</b> {item.keyConcept}</div>}
                {item.trigger && <div style={{ fontSize: 15, lineHeight: 1.6, marginTop: 14, background: `${C.amber}1F`, borderLeft: `3px solid ${C.amber}`, borderRadius: "0 6px 6px 0", padding: "8px 13px" }}>{item.trigger}</div>}

                <div style={{ marginTop: 20 }}>
                  <div style={lbl}>Comentário opcional</div>
                  <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="ex, errei essa de novo, achei difícil" style={{ ...inp, width: "100%" }} />
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "center" }}>
                  <button className="ru-btn" onClick={() => registrarTentativa("errou")} style={{ ...btnG, color: C.red, borderColor: C.red }}>Errei de novo</button>
                  <button className="ru-btn" onClick={() => registrarTentativa("acertou")} style={{ ...btnG, color: C.green, borderColor: C.green }}>Acertei dessa vez</button>
                </div>
              </>
            )}
          </div>
        ) : (
          <><Empty>Sessão concluída.</Empty><button className="ru-btn" onClick={() => setRev(false)} style={btnG}>Voltar</button></>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHead
        title="Correção de erros"
        sub="Volta o mesmo erro até você acertar sem ajuda. Não sai por dia, sai por acerto."
        right={<button className="ru-btn" disabled={!pool.length} onClick={() => { setQueue(pool.map((e) => e.id)); setReveal(false); setRev(true); }}
          style={{ ...btnP, opacity: pool.length ? 1 : 0.45, cursor: pool.length ? "pointer" : "default" }}>
          <RotateCw size={14} /> Corrigir {pool.length}
        </button>}
      />

      <Sheet style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 44, flexWrap: "wrap", alignItems: "flex-start" }}>
          <Stat value={pendentesDia.length} label={follow && todaySubjects.length ? `pendentes em ${todaySubjects.join(" e ")}` : "pendentes hoje"} color={pendentesDia.length ? C.amber : C.green} />
          <Stat value={backlog} label="de outras matérias, ficam para o dia delas" color={C.inkFaint} />
          <Stat value={dominados.length} label="já dominados" color={C.green} />
        </div>
        <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap", marginTop: 22, paddingTop: 18, borderTop: `1px solid ${C.lineSoft}` }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.inkSoft, cursor: "pointer" }}>
            <input type="checkbox" checked={follow} onChange={(e) => persist({ ...data, settings: { ...data.settings, correctionsFollowSchedule: e.target.checked } })} />
            Só as matérias do dia
          </label>
          {backlog > 0 && (
            <button className="ru-btn" onClick={() => setScope(scope === "dia" ? "tudo" : "dia")} style={btnQ}>
              {scope === "dia" ? "Incluir as outras matérias" : "Voltar só para as do dia"}
            </button>
          )}
        </div>
      </Sheet>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "30px 0 14px" }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{list.length} erros no caderno</div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ ...sel, fontSize: 13.5 }}>
          <option>Todas</option>{SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {!list.length && <Empty>Nenhum erro registrado ainda.</Empty>}
      <div style={{ borderRadius: R.md, overflow: "hidden", background: list.length ? C.card : "transparent", boxShadow: list.length ? SH.card : "none" }}>
        {list.map((e, i) => {
          const status = e.correctionStatus || "pendente";
          return (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 22px", borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}>
              {e.destaque && <span style={{ color: "#B57A16", fontSize: 14 }}>★</span>}
              <span style={{ fontSize: 12.5, color: SUBJECT_COLOR[e.subject] || C.inkFaint, width: 84, flexShrink: 0 }}>{e.subject}</span>
              <span style={{ flex: 1, fontSize: 14.5, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.topic}</span>
              {status === "dominado"
                ? <Tag color={C.green}>dominado</Tag>
                : <Tag color={C.amber}>pendente</Tag>}
              {status === "dominado" && <button className="ru-btn" onClick={() => reabrir(e.id)} style={btnQ}>Reabrir</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Capa({ total, materias, onOpen }) {
  return (
    <button onClick={onOpen} className="ru-capa" style={{
      width: 330, height: 440, borderRadius: "5px 14px 14px 5px", border: "none", cursor: "pointer",
      background: C.cover, boxShadow: SH.page, position: "relative", overflow: "hidden",
      padding: 0, transformStyle: "preserve-3d"
    }}>
      <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 22, background: "rgba(0,0,0,.22)" }} />
      <span style={{ position: "absolute", left: 30, right: 26, top: 30, bottom: 30, border: "1px solid rgba(255,255,255,.16)", borderRadius: 6 }} />
      <span style={{ position: "absolute", left: 0, right: 0, top: 112, display: "block", color: "#fff", fontFamily: "'Kalam', cursive", fontSize: 34, fontWeight: 700, letterSpacing: ".01em" }}>
        Caderno de Erros
      </span>
      <span style={{ position: "absolute", left: 0, right: 0, top: 166, display: "block", color: "rgba(255,255,255,.6)", fontFamily: "'Kalam', cursive", fontSize: 19 }}>
        Unicamp 2027
      </span>
      <span style={{ position: "absolute", left: 0, right: 0, bottom: 96, display: "block", color: "rgba(255,255,255,.82)", fontFamily: "'Kalam', cursive", fontSize: 21 }}>
        {total} {total === 1 ? "erro" : "erros"} · {materias} {materias === 1 ? "matéria" : "matérias"}
      </span>
      <span style={{ position: "absolute", left: 0, right: 0, bottom: 54, display: "block", color: "rgba(255,255,255,.5)", fontSize: 13, fontFamily: "'Instrument Sans', sans-serif" }}>
        clique para abrir
      </span>
    </button>
  );
}

function Folha({ children, dir, wide, color }) {
  return (
    <div className={dir === "tras" ? "ru-folha-tras" : "ru-folha"} style={{
      width: "100%", maxWidth: wide ? 860 : 640, background: C.paper, borderRadius: "4px 12px 12px 4px",
      boxShadow: SH.page, padding: "38px 44px 34px 74px", position: "relative", overflow: "hidden",
      backgroundImage: `repeating-linear-gradient(${C.paper} 0px, ${C.paper} 33px, ${C.paperRule} 33px, ${C.paperRule} 34px)`,
      backgroundPosition: "0 46px", transformOrigin: "left center"
    }}>
      <span style={{ position: "absolute", left: 52, top: 0, bottom: 0, width: 1.5, background: C.paperMargin, opacity: .55 }} />
      <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 14, background: `linear-gradient(90deg, ${C.paperEdge}, transparent)` }} />
      {[...Array(9)].map((_, i) => (
        <span key={i} style={{ position: "absolute", left: 20, top: 40 + i * 44, width: 13, height: 13, borderRadius: 999, background: C.bg, boxShadow: `inset 0 1px 2px ${C.ombra}.2)` }} />
      ))}
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}

function TituloManuscrito({ children, color }) {
  return (
    <div style={{ fontFamily: "'Kalam', cursive", fontWeight: 700, fontSize: 30, color: color || C.ink, marginBottom: 22, lineHeight: 1.4 }}>
      {children}
      <span style={{ display: "block", height: 2, background: color || C.ink, opacity: .28, marginTop: 6, width: 190, borderRadius: 2 }} />
    </div>
  );
}

function LinhaManuscrita({ children, muted }) {
  return <div style={{ fontFamily: "'Kalam', cursive", fontSize: 19, lineHeight: 1.79, color: muted ? C.inkFaint : C.ink }}>{children}</div>;
}

function ErroManuscrito({ e, ultimo, onDelete }) {
  const et = ERROR_TYPES[e.errorType || "conteudo"];
  const sc = SUBJECT_COLOR[e.subject] || C.ink;
  const K = { fontFamily: "'Kalam', cursive", fontSize: 18.5, lineHeight: 1.79, color: C.ink };
  const R2 = { fontFamily: "'Kalam', cursive", fontSize: 15, color: C.inkFaint };

  return (
    <div style={{
      marginBottom: ultimo ? 4 : 34, paddingBottom: ultimo ? 0 : 26,
      borderBottom: ultimo ? "none" : `1px dashed ${C.paperRule}`,
      ...(e.destaque ? { background: "#F6EEDD", borderLeft: "3px solid #B57A16", borderRadius: "0 8px 8px 0", padding: "14px 16px", marginLeft: -16 } : {})
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, marginBottom: 8 }}>
        <div style={{ fontFamily: "'Kalam', cursive", fontWeight: 700, fontSize: 22, color: sc, lineHeight: 1.5 }}>
          {e.destaque && <span style={{ color: "#B57A16", marginRight: 6 }}>★</span>}
          {e.topic}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ ...R2, color: et.color, border: `1px solid ${et.color}55`, borderRadius: 999, padding: "1px 10px" }}>{et.label}</span>
          <span style={R2}>{fmtDate(e.date)}</span>
          <button className="ru-btn" onClick={onDelete} style={btnI}><Trash2 size={13} color={C.inkFaint} /></button>
        </div>
      </div>

      {e.source && <div style={{ ...R2, marginBottom: 10 }}>{e.source}</div>}

      {e.reasoning && <div style={{ ...K, marginBottom: 4 }}><b style={{ color: C.inkSoft, fontWeight: 700 }}>O que fiz.</b> {e.reasoning}</div>}
      {e.specificError && <div style={{ ...K, marginBottom: 4, color: C.red }}><b style={{ fontWeight: 700 }}>Onde errei.</b> {e.specificError}</div>}
      {e.correctSolution && <div style={{ ...K, marginBottom: 4, color: C.green }}><b style={{ fontWeight: 700 }}>O certo.</b> {e.correctSolution}</div>}
      {e.keyConcept && <div style={{ ...K, marginBottom: 4, color: C.blue }}><b style={{ fontWeight: 700 }}>Conceito.</b> {e.keyConcept}</div>}

      {e.trigger && (
        <div style={{ ...K, marginTop: 10, background: `${C.amber}1F`, borderLeft: `3px solid ${C.amber}`, borderRadius: "0 6px 6px 0", padding: "8px 13px" }}>
          {e.trigger}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, color }) {
  if (!value) return null;
  return (
    <div>
      <div style={{ fontSize: 12.5, color: color || C.inkFaint, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "'Literata', serif", fontSize: 14.5, lineHeight: 1.6 }}>{value}</div>
    </div>
  );
}

/* ---------------- Painel ---------------- */
function Painel({ data }) {
  const split = useMemo(() => {
    const m = {}; data.errors.forEach((e) => { const t = e.errorType || "conteudo"; m[t] = (m[t] || 0) + 1; });
    return Object.entries(m).map(([type, count]) => ({ type, count, ...ERROR_TYPES[type] })).sort((a, b) => b.count - a.count);
  }, [data.errors]);

  const ec = useMemo(() => {
    const total = data.errors.length; if (!total) return null;
    const cont = data.errors.filter((e) => (e.errorType || "conteudo") === "conteudo").length;
    return { total, cont, exec: total - cont, pct: Math.round(((total - cont) / total) * 100) };
  }, [data.errors]);

  const bySubject = useMemo(() => {
    const m = {}; data.errors.forEach((e) => { m[e.subject] = (m[e.subject] || 0) + 1; });
    return Object.entries(m).map(([subject, count]) => ({ subject, count })).sort((a, b) => b.count - a.count);
  }, [data.errors]);

  const weakest = useMemo(() => [...data.topics].filter((t) => t.total > 0).sort((a, b) => topicAccuracy(a) - topicAccuracy(b)).slice(0, 6), [data.topics]);
  const trend = useMemo(() => [...data.simulados].sort((a, b) => a.date.localeCompare(b.date)).map((s) => ({
    date: fmtDate(s.date), nome: s.name, bruto: `${s.acertos}/${s.total}`,
    acertos: Math.round((s.acertos / (s.total || TOTAL_QUESTIONS)) * TOTAL_QUESTIONS)
  })), [data.simulados]);

  const axis = { stroke: C.inkFaint, fontSize: 12, fontFamily: "Instrument Sans" };

  return (
    <div>
      <PageHead title="Painel" sub="Onde os erros se concentram e como a nota está andando." />

      {ec && (
        <Sheet style={{ marginBottom: 22, maxWidth: 780 }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Falta estudo ou falta execução</div>
          <div style={{ display: "flex", height: 10, marginBottom: 10 }}>
            <div style={{ width: `${100 - ec.pct}%`, background: C.red }} />
            <div style={{ width: `${ec.pct}%`, background: C.blue }} />
          </div>
          <div style={{ display: "flex", gap: 26, fontSize: 14 }}>
            <span style={{ color: C.red }}>{ec.cont} por lacuna de conteúdo</span>
            <span style={{ color: C.blue }}>{ec.exec} por execução, {ec.pct}%</span>
          </div>
          <div style={{ fontFamily: "'Literata', serif", fontSize: 15, color: C.ink, marginTop: 14, lineHeight: 1.65, maxWidth: 600 }}>
            {ec.pct >= 50
              ? "A maior parte dos seus erros não é falta de estudo. Estudar mais conteúdo não resolve isso, o que resolve é mudar o jeito de executar a prova."
              : "A maior parte dos seus erros ainda é falta de conteúdo. Feche os módulos das aulas antes de gastar energia otimizando execução."}
          </div>
          <div style={{ marginTop: 18 }}>
            {split.map((t, i) => (
              <div key={t.type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}>
                <span style={{ fontSize: 14.5, color: t.color }}>{t.label}</span>
                <span style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                  <span style={{ fontSize: 13, color: C.inkFaint }}>{t.fix}</span>
                  <span style={{ fontSize: 15, fontWeight: 600, width: 20, textAlign: "right" }}>{t.count}</span>
                </span>
              </div>
            ))}
          </div>
        </Sheet>
      )}

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 22 }}>
        <Sheet style={{ flex: "1 1 330px" }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Erros por matéria</div>
          {!bySubject.length ? <Empty>Sem erros registrados.</Empty> : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={bySubject} layout="vertical" margin={{ left: 4, right: 10 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={C.lineSoft} horizontal={false} />
                <XAxis type="number" {...axis} allowDecimals={false} />
                <YAxis type="category" dataKey="subject" {...axis} width={84} />
                <Tooltip contentStyle={{ background: C.card, border: "none", borderRadius: R.sm, boxShadow: SH.lift, fontSize: 13, fontFamily: "Instrument Sans" }} />
                <Bar dataKey="count">{bySubject.map((s, i) => <Cell key={i} fill={SUBJECT_COLOR[s.subject] || C.blue} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Sheet>

        <Sheet style={{ flex: "1 1 330px" }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Tópicos com pior acerto</div>
          {!weakest.length ? <Empty>Registre blocos na rota para alimentar isso.</Empty> : weakest.map((t, i) => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: i ? `1px solid ${C.lineSoft}` : "none", fontSize: 14.5 }}>
              <span>{t.name}<span style={{ color: C.inkFaint }}>, {t.subject}</span></span>
              <span style={{ color: C.red, fontWeight: 600 }}>{Math.round(topicAccuracy(t) * 100)}%</span>
            </div>
          ))}
        </Sheet>
      </div>

      <Sheet>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 3 }}>Nota nos simulados</div>
        <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 16 }}>Tudo convertido para a base de 72 questões, para provas de tamanhos diferentes ficarem comparáveis.</div>
        {!trend.length ? <Empty>Registre um simulado para ver a curva.</Empty> : (
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={trend} margin={{ top: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={C.lineSoft} />
              <XAxis dataKey="date" {...axis} />
              <YAxis {...axis} domain={[30, TOTAL_QUESTIONS]} />
              <Tooltip contentStyle={{ background: C.card, border: "none", borderRadius: R.sm, boxShadow: SH.lift, fontSize: 13, fontFamily: "Instrument Sans" }}
                formatter={(v, n, p) => [`${v} de 72 (bruto ${p.payload.bruto})`, p.payload.nome]} />
              <ReferenceLine y={TARGET_SCORE} stroke={C.green} strokeDasharray="4 4" label={{ value: "meta 60", fill: C.green, fontSize: 12, position: "right" }} />
              <ReferenceLine y={CUTOFF_SCORE} stroke={C.red} strokeDasharray="4 4" label={{ value: "corte 47", fill: C.red, fontSize: 12, position: "right" }} />
              <Line type="monotone" dataKey="acertos" stroke={C.blue} strokeWidth={2} dot={{ r: 3.5, fill: C.blue }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Sheet>
    </div>
  );
}

/* ---------------- Simulados ---------------- */
function Simulados({ data, persist }) {
  const [f, setF] = useState({ date: todayISO(), name: "", acertos: "", total: TOTAL_QUESTIONS });
  const [showB, setShowB] = useState(false);
  const [b, setB] = useState({});
  const sorted = [...data.simulados].sort((a, b2) => b2.date.localeCompare(a.date));

  return (
    <div>
      <PageHead title="Simulados" sub="O detalhamento por matéria é o que faz a rota da semana seguinte nascer cirúrgica em vez de aproximada." />

      <Sheet style={{ marginBottom: 22, maxWidth: 780 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div><div style={lbl}>Data</div><input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} style={inp} /></div>
          <div style={{ flex: 1, minWidth: 170 }}><div style={lbl}>Nome</div><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} style={{ ...inp, width: "100%" }} /></div>
          <div><div style={lbl}>Acertos</div><input type="number" value={f.acertos} onChange={(e) => setF({ ...f, acertos: e.target.value })} style={{ ...inp, width: 82 }} /></div>
          <div><div style={lbl}>Total</div><input type="number" value={f.total} onChange={(e) => setF({ ...f, total: e.target.value })} style={{ ...inp, width: 82 }} /></div>
          <button className="ru-btn" onClick={() => {
            if (!f.name.trim() || f.acertos === "") return;
            const sb = {}; Object.entries(b).forEach(([s, v]) => { if (v?.acertos !== "" && v?.total !== "" && v) sb[s] = { acertos: Number(v.acertos), total: Number(v.total) }; });
            persist({ ...data, simulados: [{ id: uid(), date: f.date, name: f.name.trim(), acertos: Number(f.acertos), total: Number(f.total) || TOTAL_QUESTIONS, subjectBreakdown: sb }, ...data.simulados] });
            setF({ date: todayISO(), name: "", acertos: "", total: TOTAL_QUESTIONS }); setB({}); setShowB(false);
          }} style={btnP}><Plus size={14} /> Adicionar</button>
        </div>

        <button className="ru-btn" onClick={() => setShowB(!showB)} style={{ ...btnQ, marginTop: 14 }}>
          {showB ? "Esconder detalhamento" : "Detalhar por matéria"}
        </button>

        {showB && (
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
            {SUBJECTS.map((s) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 13.5, width: 92, color: C.inkSoft }}>{s}</span>
                <input type="number" placeholder="acertos" value={b[s]?.acertos ?? ""} onChange={(e) => setB({ ...b, [s]: { ...b[s], acertos: e.target.value } })} style={{ ...inp, width: 74 }} />
                <span style={{ color: C.inkFaint }}>de</span>
                <input type="number" placeholder="total" value={b[s]?.total ?? ""} onChange={(e) => setB({ ...b, [s]: { ...b[s], total: e.target.value } })} style={{ ...inp, width: 74 }} />
              </div>
            ))}
          </div>
        )}
      </Sheet>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 780 }}>
        {sorted.map((s) => {
          const col = s.acertos >= TARGET_SCORE ? C.green : s.acertos >= CUTOFF_SCORE ? C.amber : C.red;
          return (
            <Sheet key={s.id} accent={col}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 2 }}>{fmtDate(s.date)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ fontSize: 24, fontWeight: 700, color: col }}>{s.acertos}<span style={{ fontSize: 15, color: C.inkFaint, fontWeight: 400 }}>/{s.total}</span></span>
                  <button className="ru-btn" onClick={() => persist({ ...data, simulados: data.simulados.filter((x) => x.id !== s.id) })} style={btnI}><Trash2 size={14} color={C.inkFaint} /></button>
                </div>
              </div>
              {s.subjectBreakdown && Object.keys(s.subjectBreakdown).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.lineSoft}` }}>
                  {Object.entries(s.subjectBreakdown).map(([k, v]) => (
                    <Tag key={k} color={v.acertos / v.total < 0.6 ? C.red : C.inkSoft}>{k} {v.acertos}/{v.total}</Tag>
                  ))}
                </div>
              )}
            </Sheet>
          );
        })}
      </div>
    </div>
  );
}
