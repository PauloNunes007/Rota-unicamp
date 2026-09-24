/* ============================================================
   Árvore de matérias (editais Fuvest e Unicamp)

   Estrutura recursiva: cada nó tem `id` estável, `nome` e,
   opcionalmente, `filhos`. Um cartão aponta para qualquer nó
   (normalmente um tópico folha), e o estudo livre de um nó
   inclui todos os cartões abaixo dele.

   Regras para manter os ids estáveis:
   - o id de um filho é o id do pai + "." + um slug curto;
   - nunca reaproveite um id para um assunto diferente;
   - se precisar renomear, troque só o `nome`. Se precisar mover
     ou apagar, registre o id antigo em REMAPEAR_IDS para os
     cartões irem junto.

   PENDENTE: os tópicos entram a partir do checklist dos editais.
   Por enquanto só existem as áreas e as matérias.
   ============================================================ */

export const EDITAL_VERSAO = 1;

export const EDITAL = [
  {
    id: "linguagens", nome: "Linguagens",
    filhos: [
      { id: "linguagens.portugues", nome: "Português", cor: "#B54B3F", filhos: [] },
      { id: "linguagens.literatura", nome: "Literatura", cor: "#9C5A3C", filhos: [] },
      { id: "linguagens.ingles", nome: "Inglês", cor: "#5C7FA6", filhos: [] },
    ],
  },
  { id: "matematica", nome: "Matemática", cor: "#4A72AC", filhos: [] },
  {
    id: "natureza", nome: "Ciências da Natureza",
    filhos: [
      { id: "natureza.fisica", nome: "Física", cor: "#7D6BAE", filhos: [] },
      { id: "natureza.quimica", nome: "Química", cor: "#3D9187", filhos: [] },
      { id: "natureza.biologia", nome: "Biologia", cor: "#3D7259", filhos: [] },
    ],
  },
  {
    id: "humanas", nome: "Ciências Humanas",
    filhos: [
      { id: "humanas.historia", nome: "História", cor: "#B5673F", filhos: [] },
      { id: "humanas.geografia", nome: "Geografia", cor: "#AD7C2B", filhos: [] },
      { id: "humanas.filosofia", nome: "Filosofia", cor: "#8A6D9E", filhos: [] },
      { id: "humanas.sociologia", nome: "Sociologia", cor: "#B54B87", filhos: [] },
    ],
  },
];

// id antigo -> id novo, aplicado aos cartões na carga.
export const REMAPEAR_IDS = {};
