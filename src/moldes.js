/* ============================================================
   Moldes da banca, matemática
   Destilado de 105 questões objetivas de 1ª fase da Unicamp
   (Mapa da Aprovação, últimos 10 anos), cruzado com as provas
   de 2023 a 2026 e com os simulados já registrados aqui.

   O gatilho é a parte que interessa. É a frase do enunciado
   que denuncia o padrão antes de você começar a calcular.
   ============================================================ */

export const MOLDES_FONTE = {
  "base": "Mapa da Aprovação (GabaritaGeo) — Matemática, últimos 10 anos Unicamp, 105 questões objetivas de 1ª fase",
  "coberturaTemporal": "provas até 2022",
  "lacunaConhecida": "2023 a 2027 não estão na apostila; ver bloco 'radarRecente'"
};

export const INCIDENCIA_MAT = [
  {
    "capitulo": "Funções",
    "questoes": 23,
    "percentual": 21.9,
    "faixa": "26-48"
  },
  {
    "capitulo": "Geometria plana",
    "questoes": 15,
    "percentual": 14.3,
    "faixa": "73-87"
  },
  {
    "capitulo": "Conjuntos numéricos (matrizes, complexos, lógica)",
    "questoes": 13,
    "percentual": 12.4,
    "faixa": "10-22"
  },
  {
    "capitulo": "Trigonometria",
    "questoes": 13,
    "percentual": 12.4,
    "faixa": "93-105"
  },
  {
    "capitulo": "Geometria analítica",
    "questoes": 12,
    "percentual": 11.4,
    "faixa": "49-60"
  },
  {
    "capitulo": "Geometria espacial",
    "questoes": 12,
    "percentual": 11.4,
    "faixa": "61-72"
  },
  {
    "capitulo": "Análise combinatória",
    "questoes": 5,
    "percentual": 4.8,
    "faixa": "1-5"
  },
  {
    "capitulo": "Aritmética",
    "questoes": 4,
    "percentual": 3.8,
    "faixa": "6-9"
  },
  {
    "capitulo": "Equações",
    "questoes": 3,
    "percentual": 2.9,
    "faixa": "23-25"
  },
  {
    "capitulo": "Inequações",
    "questoes": 3,
    "percentual": 2.9,
    "faixa": "88-90"
  },
  {
    "capitulo": "Médias",
    "questoes": 2,
    "percentual": 1.9,
    "faixa": "91-92"
  }
];

export const LEITURA_INCIDENCIA = [
  "Geometria somada (plana + analítica + espacial) é 39 de 105, ou 37% da prova. É o maior bloco isolado, maior que funções.",
  "Funções e geometria juntas são 62 de 105, quase 60%. Se você fechar esses dois, fecha a maior parte da prova.",
  "PA e PG quase nunca aparecem como capítulo próprio. Aparecem escondidas dentro de outros temas (matriz, triângulo, trigonometria, quadrilátero circunscrito). Estudar PA/PG isolado rende pouco; treinar reconhecer PA/PG dentro de outro assunto rende muito.",
  "A apostila não tem nenhum capítulo de probabilidade, estatística ou matemática financeira. Isso é lacuna do material, não da banca. Ver 'radarRecente'."
];

export const ASSINATURA_BANCA = [
  {
    "traco": "Enunciado curto, conta curta, sacada única",
    "detalhe": "A Unicamp quase nunca pede conta longa na 1ª fase. Se você está no quinto passo algébrico, quase sempre existe um caminho de dois passos que você não viu. Conta comprida é sinal de que passou do ponto."
  },
  {
    "traco": "Alternativas em faixa, não em valor",
    "detalhe": "Aparece direto em forma de 'maior que', 'menor que', 'entre X e Y', ou intervalo de ângulo. Nesses casos você não precisa do valor exato, precisa só localizar. Estimar é mais rápido e mais seguro que calcular."
  },
  {
    "traco": "Parâmetro literal no lugar de número",
    "detalhe": "Usa a, b, c, k, r, θ em vez de valores. O objetivo é testar se você sabe a propriedade, não se sabe substituir. Muitas dessas se matam testando um caso particular válido."
  },
  {
    "traco": "Gráfico ou figura como enunciado",
    "detalhe": "Boa parte das questões de função dá o gráfico e pergunta sobre outro gráfico (inversa, quadrado, transladado, área acumulada). O dado está no desenho, não no texto."
  },
  {
    "traco": "Texto de apoio compartilhado entre questões",
    "detalhe": "Um mesmo contexto (cerca de carpinteiro, mapa de cidade, epidemia, hemácias) serve de base para 1 ou 2 questões, às vezes de disciplinas diferentes. Ler o texto uma vez com atenção paga duas questões."
  },
  {
    "traco": "Contexto atual e interdisciplinar",
    "detalhe": "Covid, vacina, canal de Suez, vulcão, álcool em gel, aquecimento global, lucro de empresa. A matemática por trás é simples. O custo está na leitura."
  },
  {
    "traco": "Repetição declarada entre anos",
    "detalhe": "A banca reaproveita molde com uma palavra trocada. O exemplo mais claro na apostila são as questões 61 e 64, idênticas exceto por 'área lateral' e 'área de superfície'."
  }
];

export const MOLDES = [
  {
    "id": "M01",
    "titulo": "Potência de i com expoente gigante",
    "topico": "Números complexos",
    "incidencia": "alta",
    "ocorrencias": 3,
    "exemplos": [
      "Q17 (z elevado a 2016)",
      "Q21 (i^2014 − i^1987)",
      "Q22 (soma i^0 até i^2013)"
    ],
    "gatilho": "Expoente absurdo em i, ou uma soma de potências de i que vai até um ano.",
    "rota": [
      "Divida o expoente por 4 e fique só com o resto.",
      "Resto 0 vale 1, resto 1 vale i, resto 2 vale −1, resto 3 vale −i.",
      "Em soma longa, agrupe de 4 em 4, porque cada bloco de 4 soma zero. Sobra só o rabo."
    ],
    "pegadinha": "Na soma que vai de i^0 até i^2013 são 2014 termos, não 2013. Errar a contagem de termos derruba a questão inteira mesmo com a periodicidade certa.",
    "nivel": "obrigatoria"
  },
  {
    "id": "M02",
    "titulo": "Determinante como teste de invertibilidade",
    "topico": "Matrizes",
    "incidencia": "alta",
    "ocorrencias": 5,
    "exemplos": [
      "Q10 (PA dentro da matriz)",
      "Q11 (A + Aᵀ singular)",
      "Q12 (linhas com soma constante)",
      "Q18 (matriz de rotação)",
      "Q20 (determinante e simetria)"
    ],
    "gatilho": "As palavras 'invertível', 'singular', 'não invertível', ou uma matriz com parâmetro literal.",
    "rota": [
      "Traduza a palavra antes de calcular. Não invertível é determinante zero, invertível é determinante diferente de zero.",
      "Procure estrutura antes de abrir Sarrus. Linha proporcional, coluna repetida, soma constante entre linhas, identidade trigonométrica.",
      "Se a matriz tem seno e cosseno, tente o determinante simbólico. Costuma dar 1 e matar a questão."
    ],
    "pegadinha": "A questão pergunta sobre A + Aᵀ ou sobre a transposta, não sobre A. Calcular o determinante da matriz errada é o erro mais comum aqui.",
    "nivel": "obrigatoria"
  },
  {
    "id": "M03",
    "titulo": "Composição de funções lida no gráfico",
    "topico": "Funções",
    "incidencia": "alta",
    "ocorrencias": 2,
    "exemplos": [
      "Q26 (f(g(−1)) − g(f(1)))",
      "Q44 (f(g(1)) − g(f(1)))"
    ],
    "gatilho": "Dois gráficos lado a lado e uma expressão do tipo f(g(a)) − g(f(b)).",
    "rota": [
      "Resolva de dentro para fora, um valor de cada vez.",
      "Anote o resultado intermediário no papel antes de entrar no segundo gráfico.",
      "Confira em qual dos dois gráficos você está lendo cada etapa."
    ],
    "pegadinha": "Trocar de gráfico no meio da composição. É a mesma questão em dois anos diferentes, com números trocados, então vale automatizar o procedimento.",
    "nivel": "obrigatoria"
  },
  {
    "id": "M04",
    "titulo": "Função afim que não precisa dos coeficientes",
    "topico": "Funções",
    "incidencia": "média",
    "ocorrencias": 3,
    "exemplos": [
      "Q40 (f afim com f(4)=2, pede f(f(3)+f(5)))",
      "Q31 (f(f(1))=1)",
      "Q36 (relação funcional implícita)"
    ],
    "gatilho": "Dão só uma informação sobre a função e pedem algo aparentemente impossível com um único dado.",
    "rota": [
      "Se um dado só não determina a e b, é porque não precisa determinar.",
      "Em função afim, f(3) + f(5) é igual a 2·f(4), porque 3 e 5 são simétricos em torno de 4.",
      "Em relação funcional implícita, substitua valores estratégicos de x (0, 1, 3) até fechar o sistema."
    ],
    "pegadinha": "Tentar montar sistema e travar por falta de equação. O travamento é o sinal de que o caminho é a simetria, não a álgebra.",
    "nivel": "obrigatoria",
    "alertaPessoal": "É exatamente o seu padrão de travar procurando um método escondido, como aconteceu na cúbica antes de você aprender Briot-Ruffini."
  },
  {
    "id": "M05",
    "titulo": "Dado o gráfico de f, qual é o gráfico de g",
    "topico": "Funções",
    "incidencia": "alta",
    "ocorrencias": 5,
    "exemplos": [
      "Q33 (y = [f(x)]²)",
      "Q41 (inversa)",
      "Q43 (y = 2f(x−1))",
      "Q35 (área sombreada como função)",
      "Q32 (formato de f(x) = x(ax+b))"
    ],
    "gatilho": "Enunciado mostra um gráfico e as quatro alternativas são gráficos.",
    "rota": [
      "Nunca esboce a curva inteira. Teste 2 ou 3 pontos-chave e elimine.",
      "Pontos-chave que mais eliminam, onde f vale 0, onde f vale 1 ou −1, e onde f troca de sinal.",
      "Em quadrado de função, o que está abaixo do eixo sobe e o que vale 1 fica em 1.",
      "Em inversa, é reflexão na reta y = x. Confira só um ponto para decidir."
    ],
    "pegadinha": "Em y = 2f(x−1), a translação é para a direita, não para a esquerda. O sinal dentro do parêntese inverte o sentido.",
    "nivel": "obrigatoria"
  },
  {
    "id": "M06",
    "titulo": "Duas curvas que se cortam ou não se cortam",
    "topico": "Geometria analítica e funções",
    "incidencia": "alta",
    "ocorrencias": 5,
    "exemplos": [
      "Q42 (duas parábolas que não se interceptam)",
      "Q49 (parábola tangente a duas retas)",
      "Q52 (circunferência e parábola)",
      "Q53 (reta corta circunferência em dois pontos)",
      "Q60 (interseção de mediatrizes)"
    ],
    "gatilho": "As palavras 'interceptam', 'não se interceptam', 'uma única vez', 'em dois pontos distintos'.",
    "rota": [
      "Curva com curva, iguale as duas, jogue tudo para um lado e olhe o discriminante. Delta menor que zero é não se cortam, igual a zero é tangente, maior que zero é dois pontos.",
      "Reta com circunferência, não iguale nada. Compare a distância do centro à reta com o raio.",
      "Distância de ponto a reta é sempre medida na perpendicular. Não precisa provar que o triângulo é retângulo, ele é retângulo por definição."
    ],
    "pegadinha": "Em sistema com circunferência, achar dois valores de y não significa dois pontos. Cada y pode gerar dois x, ou nenhum. Volte e conte os pares.",
    "nivel": "obrigatoria",
    "alertaPessoal": "Você já perdeu as duas pontas desse molde. Na Q69 do simulado 2019 achou dois valores de y e concluiu dois pontos. E na questão da reta com |b| = 2√3 acertou mas desconfiou por não saber que distância de ponto a reta é sempre pela perpendicular."
  },
  {
    "id": "M07",
    "titulo": "Circunferência fora da forma canônica",
    "topico": "Geometria analítica",
    "incidencia": "alta",
    "ocorrencias": 4,
    "exemplos": [
      "Q51 (x² + y² = 2cx com centro sobre uma reta)",
      "Q54 (reta que divide o círculo em duas partes iguais)",
      "Q55 (quantos pontos o círculo corta nos eixos)",
      "Q52"
    ],
    "gatilho": "Equação do tipo x² + y² = ax + by, com os termos lineares do lado errado.",
    "rota": [
      "Jogue tudo para a esquerda e complete quadrado. O centro sai em (a/2, b/2).",
      "Qualquer reta que divide a circunferência em duas partes iguais passa pelo centro. Basta testar qual alternativa contém o centro.",
      "Para contar interseção com os eixos, faça x = 0 e depois y = 0, e some as soluções sem esquecer a origem."
    ],
    "pegadinha": "A origem satisfaz x² + y² = ax + by sempre. Ela é ponto de interseção com os dois eixos ao mesmo tempo e é contada uma vez só, não duas.",
    "nivel": "obrigatoria"
  },
  {
    "id": "M08",
    "titulo": "Reta que corta os dois eixos",
    "topico": "Geometria analítica",
    "incidencia": "alta",
    "ocorrencias": 3,
    "exemplos": [
      "Q50 (mediatriz de AB)",
      "Q57 (ponto médio de AB)",
      "Q58 (área do triângulo OAB)"
    ],
    "gatilho": "'A reta intercepta os eixos coordenados nos pontos A e B'.",
    "rota": [
      "Ache A e B em dez segundos fazendo x = 0 e depois y = 0.",
      "Ponto médio é média das coordenadas.",
      "Área do triângulo com vértice na origem é metade do produto dos interceptos, em módulo.",
      "Mediatriz é perpendicular (coeficiente angular oposto e inverso) passando pelo ponto médio."
    ],
    "pegadinha": "Sinal negativo do intercepto. Área é sempre positiva, mas o ponto médio guarda o sinal.",
    "nivel": "obrigatoria"
  },
  {
    "id": "M09",
    "titulo": "Cilindro que muda de dimensão",
    "topico": "Geometria espacial",
    "incidencia": "alta",
    "ocorrencias": 6,
    "exemplos": [
      "Q62 (álcool em gel, coluna que baixa)",
      "Q67 (cilindro inscrito na esfera)",
      "Q68 (mesma área total que uma esfera)",
      "Q69 (raio pela metade, altura dobrada)",
      "Q70 (mesmo volume, área lateral limitada)",
      "Q72 (areia do cilindro virando cone)"
    ],
    "gatilho": "Cilindro com alguma dimensão alterada, comparado com esfera, ou despejado em outro sólido.",
    "rota": [
      "Escreva volume e área em função de r e h antes de qualquer conta numérica.",
      "Volume depende de r ao quadrado, área lateral depende de r na primeira potência. Metade do raio é um quarto do volume.",
      "Cilindro inscrito em esfera com altura igual ao diâmetro da base, o raio da esfera é r√2, sai por Pitágoras no corte.",
      "Volume conservado entre sólidos, iguale as duas expressões, não calcule cada um."
    ],
    "pegadinha": "Confundir área lateral com área total, e diâmetro com raio. O enunciado costuma dar o diâmetro de propósito.",
    "nivel": "obrigatoria"
  },
  {
    "id": "M10",
    "titulo": "Tetraedro contra cubo, a questão repetida",
    "topico": "Geometria espacial",
    "incidencia": "repetida",
    "ocorrencias": 2,
    "exemplos": [
      "Q61 (áreas laterais iguais)",
      "Q64 (áreas de superfície iguais)"
    ],
    "gatilho": "Tetraedro regular e cubo com áreas iguais, pede a razão entre as arestas.",
    "rota": [
      "Face do tetraedro é triângulo equilátero, área a²√3/4.",
      "Lateral do tetraedro são 3 faces, superfície total são 4. Lateral do cubo são 4 faces, total são 6.",
      "Iguale, isole a razão a/b e só depois extraia a raiz."
    ],
    "pegadinha": "Esta é a mesma questão em dois anos, mudando só 'lateral' para 'superfície'. Se você decorar um dos resultados e não ler qual das duas versões caiu, erra tendo estudado.",
    "nivel": "obrigatoria"
  },
  {
    "id": "M11",
    "titulo": "Sólido cortado em cubinhos",
    "topico": "Geometria espacial",
    "incidencia": "média",
    "ocorrencias": 2,
    "exemplos": [
      "Q71 (queijo 20×8×5 dividido em cubos de 1 cm)",
      "Q63 (planificação e relação de Euler)"
    ],
    "gatilho": "Bloco dividido em cubinhos com contagem por número de faces pintadas, ou planificação pedindo vértices e arestas.",
    "rota": [
      "Cubinhos com uma face na casca formam os 6 miolos das faces, some 2·[(a−2)(b−2) + (a−2)(c−2) + (b−2)(c−2)].",
      "Sem casca é o bloco interno (a−2)(b−2)(c−2). Três faces são sempre os 8 vértices.",
      "Em poliedro, conte faces e some os lados de todas elas. Cada aresta foi contada duas vezes. Depois use Euler para achar os vértices."
    ],
    "pegadinha": "Esquecer de descontar 2 em cada dimensão, ou contar as bordas duas vezes.",
    "nivel": "importante"
  },
  {
    "id": "M12",
    "titulo": "Caça ao ângulo com isósceles e bissetriz",
    "topico": "Geometria plana",
    "incidencia": "alta",
    "ocorrencias": 4,
    "exemplos": [
      "Q76 (AD bissetriz e AD = DB)",
      "Q82 (pentágono equilátero, achar θ)",
      "Q105 (dois isósceles semelhantes)",
      "Q79 (achar θ em triângulo retângulo composto)"
    ],
    "gatilho": "Figura com lados marcados como iguais e um ângulo a determinar.",
    "rota": [
      "Marque todo lado igual na figura antes de escrever qualquer equação. Lado igual gera ângulo igual na base.",
      "Batize um ângulo de x e escreva os outros em função de x andando pela figura.",
      "Ângulo externo de um triângulo é a soma dos dois internos não adjacentes. Isso encurta metade dessas questões.",
      "Feche com a soma 180 no triângulo escolhido."
    ],
    "pegadinha": "Bissetriz só é perpendicular ao lado oposto quando o triângulo é isósceles com aquele vértice no topo. Fora disso ela não é altura.",
    "nivel": "obrigatoria",
    "alertaPessoal": "Você mesmo escreveu que 'o segredo é ângulo' na geometria plana da Unicamp, e listou bissetriz e ângulo externo como as duas lacunas de teoria que faltavam. Este é o molde. Na Q49 do Poliedro você fez tudo certo e respondeu o ângulo errado."
  },
  {
    "id": "M13",
    "titulo": "Área por razão, não por cálculo",
    "topico": "Geometria plana",
    "incidencia": "alta",
    "ocorrencias": 5,
    "exemplos": [
      "Q77 (triângulo medial, área t)",
      "Q75 (isósceles com altura h)",
      "Q78 (setor dividido em duas áreas iguais)",
      "Q85 (semicírculo sobre a base do triângulo)",
      "Q80 (quadrilátero com lados iguais dois a dois)"
    ],
    "gatilho": "Pede uma área em função de outra área, ou uma razão entre áreas.",
    "rota": [
      "Não calcule as duas áreas. Monte a razão.",
      "Em figuras semelhantes, a razão entre áreas é o quadrado da razão entre lados.",
      "Ponto médio corta a área ao meio quando a mediana sai dele. Triângulo medial tem um quarto da área do original.",
      "Quadrilátero com duas diagonais perpendiculares tem área igual a metade do produto das diagonais."
    ],
    "pegadinha": "Elevar a razão ao quadrado quando não é semelhança, ou esquecer de elevar quando é.",
    "nivel": "obrigatoria"
  },
  {
    "id": "M14",
    "titulo": "Figura decomposta em quadrados ou círculos tangentes",
    "topico": "Geometria plana",
    "incidencia": "alta",
    "ocorrencias": 4,
    "exemplos": [
      "Q81 (retângulo decomposto em 4 quadrados)",
      "Q74 (três círculos tangentes dois a dois e à mesma reta)",
      "Q73 (círculo inscrito em quadrilátero)",
      "Q84 (feixe de laser refletindo)"
    ],
    "gatilho": "Figura montada por peças encaixadas, tangência, ou reflexão dentro de um retângulo.",
    "rota": [
      "Em decomposição, escreva o mesmo comprimento por dois caminhos diferentes e iguale. Não monte soma de áreas.",
      "Em círculos tangentes externamente, a distância entre centros é a soma dos raios. Desenhe o trapézio dos centros e aplique Pitágoras.",
      "Em círculo inscrito em quadrilátero, vale Pitot, ou seja, a soma de dois lados opostos é igual à soma dos outros dois.",
      "Em reflexão, espelhe a figura em vez de seguir o raio. O caminho vira uma reta."
    ],
    "pegadinha": "Cair em equação do segundo grau por ter montado área em vez de comprimento.",
    "nivel": "obrigatoria",
    "alertaPessoal": "A Q81 é literalmente a questão do retângulo em 4 quadrados que você resolveu por soma de áreas e caiu em equação do segundo grau. O caminho era igualdade de comprimentos."
  },
  {
    "id": "M15",
    "titulo": "PA ou PG escondida dentro de outro assunto",
    "topico": "Progressões",
    "incidencia": "alta",
    "ocorrencias": 6,
    "exemplos": [
      "Q10 (PA nos termos da matriz)",
      "Q38 (PG e menor valor de s/a)",
      "Q83 (lados do triângulo retângulo em PA)",
      "Q95 (ângulos do triângulo em PA)",
      "Q102 (tan, sec e 2 em PA)",
      "Q73 (lados do quadrilátero em PA)"
    ],
    "gatilho": "A palavra 'progressão' aparece uma vez no meio de um enunciado de geometria, matriz ou trigonometria.",
    "rota": [
      "Nomeie os termos como x−r, x, x+r. Isso faz a soma virar 3x e mata metade do trabalho.",
      "Se são três ângulos de triângulo em PA, o do meio vale 60 graus. Anote isso, cai direto.",
      "Se são os três lados de um triângulo retângulo em PA, a proporção é 3, 4, 5 escalada.",
      "Em PG, use b² = ac antes de tentar razão explícita."
    ],
    "pegadinha": "Sair procurando fórmula de soma de PA quando a questão só precisa da simetria dos três termos.",
    "nivel": "obrigatoria"
  },
  {
    "id": "M16",
    "titulo": "Girard com seno e cosseno como raízes",
    "topico": "Trigonometria e polinômios",
    "incidencia": "repetida",
    "ocorrencias": 2,
    "exemplos": [
      "Q99 (2x² + x + k = 0 com sen θ e cos θ como raízes)",
      "Q95"
    ],
    "gatilho": "Uma equação do segundo grau cujas raízes são grandezas ligadas por identidade (sen e cos, catetos, lados).",
    "rota": [
      "Soma das raízes é −b/a, produto é c/a. Divida pelo coeficiente líder sempre.",
      "Eleve a soma ao quadrado. Aparece sen² + cos² + 2·sen·cos.",
      "Substitua sen² + cos² por 1 e resolva para o parâmetro."
    ],
    "pegadinha": "Usar soma das raízes igual a −b quando a não vale 1. Em 2x² + x + k, a soma é −1/2, não −1.",
    "nivel": "obrigatoria",
    "alertaPessoal": "Você errou exatamente isso na Q64 do simulado Unicamp 2019, chegando a k = 0 em vez de k = −3/4, e errou a Q70 do mesmo simulado também por Girard. É o seu erro mais reincidente em matemática. Girard também resolveu a questão da hipotenusa do Simulado Oficial 2026, onde você travou tentando Bhaskara."
  },
  {
    "id": "M17",
    "titulo": "Soma de seno com cosseno elevada ao quadrado",
    "topico": "Trigonometria",
    "incidencia": "alta",
    "ocorrencias": 3,
    "exemplos": [
      "Q100 (sen x + cos x = 0,2, pede |sen x − cos x|)",
      "Q103 (cos x = tg x)",
      "Q96 (simplificação de expressão)"
    ],
    "gatilho": "Aparece sen x + cos x, ou sen x − cos x, ou uma igualdade entre duas razões trigonométricas.",
    "rota": [
      "Eleve os dois lados ao quadrado. A identidade fundamental entra e sobra só o produto sen·cos.",
      "Se aparece tangente, escreva como sen sobre cos e multiplique cruzado.",
      "Troque cos² por 1 − sen² para cair em equação do segundo grau em sen x."
    ],
    "pegadinha": "Esquecer o módulo. Elevar ao quadrado perde o sinal, e a questão costuma pedir o valor absoluto justamente por isso.",
    "nivel": "obrigatoria"
  },
  {
    "id": "M18",
    "titulo": "Arco duplo com a fórmula dada no enunciado",
    "topico": "Trigonometria",
    "incidencia": "alta",
    "ocorrencias": 3,
    "exemplos": [
      "Q93 (canal de Suez, ângulo 67,5 graus, dadas cos 2θ e sen 2θ)",
      "Q97 (2cos(2θ) + 5cos θ = 4)",
      "Q94 (tg θ + tg α num quadrado)"
    ],
    "gatilho": "Ângulo não notável como 67,5 ou 22,5, ou a fórmula do arco duplo aparecendo em 'Dados' logo abaixo do enunciado.",
    "rota": [
      "Se a banca deu a fórmula, ela quer que você use. Não invente caminho por lei dos cossenos.",
      "Ângulo metade de notável (67,5 é metade de 135, 22,5 é metade de 45) pede arco metade.",
      "Em equação com cos(2θ) e cos θ juntos, troque cos(2θ) por 2cos²θ − 1 e resolva em cos θ.",
      "Ache o cosseno e depois localize o ângulo na faixa pedida, sem calcular o ângulo exato."
    ],
    "pegadinha": "Resolver por lei dos cossenos, chegar ao mesmo lugar e gastar três vezes o tempo. O atalho é o dado do enunciado.",
    "nivel": "obrigatoria",
    "alertaPessoal": "Você identificou que tinha esquecido as fórmulas de arco metade e que tende a resolver por lei dos cossenos. Este molde é a razão pela qual isso custa caro."
  },
  {
    "id": "M19",
    "titulo": "Casa dos pombos e garantia mínima",
    "topico": "Combinatória e lógica",
    "incidencia": "média",
    "ocorrencias": 3,
    "exemplos": [
      "Q3 (mínimo de pessoas para garantir três no mesmo dia da semana)",
      "Q15 (dois livros num grupo de dez)",
      "Q13 (soma de três inteiros ímpar)"
    ],
    "gatilho": "As palavras 'no mínimo', 'garantir', 'pelo menos', 'podemos afirmar corretamente'.",
    "rota": [
      "Monte o pior caso possível, aquele que adia ao máximo a conclusão.",
      "Some um. O mínimo que garante é sempre pior caso mais um.",
      "Em questão de 'pelo menos', teste se a alternativa pode ser furada por um contraexemplo. Basta um para derrubar."
    ],
    "pegadinha": "Alternativas com 'pelo menos um' e 'todos' juntas. Só uma resiste a contraexemplo, e testar contraexemplo é mais rápido que provar.",
    "nivel": "importante"
  },
  {
    "id": "M20",
    "titulo": "Contagem com posição fixa ou restrição",
    "topico": "Combinatória",
    "incidencia": "média",
    "ocorrencias": 3,
    "exemplos": [
      "Q1 (anagramas de REFLORESTAMENTO começando por FLORES)",
      "Q2 (duas pessoas que se recusam a ficar lado a lado)",
      "Q5 (comissão de 3 rapazes e 5 moças)"
    ],
    "gatilho": "Anagrama com bloco fixo, pessoas que não podem ficar juntas, comissão com composição definida.",
    "rota": [
      "Com bloco fixo, apague as letras usadas e conte o anagrama do que sobrou, sem esquecer as repetições do resto.",
      "Com restrição de não vizinhança, conte o total e subtraia o caso em que ficam juntos, tratando o par como bloco único e multiplicando por 2.",
      "Em comissão, combinação de cada grupo, multiplicadas. Escolha não tem ordem."
    ],
    "pegadinha": "Em REFLORESTAMENTO, depois de tirar FLORES ainda sobram letras repetidas. O denominador não é 1, e também não é o do total. Recontar do zero as 9 letras restantes é obrigatório.",
    "nivel": "importante"
  },
  {
    "id": "M21",
    "titulo": "Estimativa com número grande e resposta em faixa",
    "topico": "Aritmética e ordem de grandeza",
    "incidencia": "alta",
    "ocorrencias": 6,
    "exemplos": [
      "Q7 (toneladas de açúcar em litros de refrigerante)",
      "Q86 (área da região sem voos)",
      "Q65 (perímetro entre 14 e 16 cm)",
      "Q88 (dias até 4 mil infectados)",
      "Q89 (log e intervalo de x)",
      "Q47 (temperatura em 2012 por tendência linear)"
    ],
    "gatilho": "Alternativas escritas como 'maior que', 'menor que', 'entre X e Y', ou números com ordens de grandeza bem separadas.",
    "rota": [
      "Arredonde de propósito e verifique se a alternativa ainda se decide.",
      "Cuide das unidades primeiro, de tonelada para grama, mililitro para centímetro cúbico, quilômetro para metro.",
      "Com log, use as aproximações dadas e trabalhe em potência de 10.",
      "Confira a ordem de grandeza no final contando as casas."
    ],
    "pegadinha": "Erro de potência de dez. Você chega no algarismo certo e marca a alternativa com um zero a mais ou a menos.",
    "nivel": "obrigatoria",
    "alertaPessoal": "Você já cometeu isso duas vezes num mesmo simulado, na Q18 de química (4000 em vez de 400) e na Q45 de física (lambda certo, potência de dez errada)."
  },
  {
    "id": "M22",
    "titulo": "Texto de apoio compartilhado e contexto real",
    "topico": "Leitura de enunciado",
    "incidencia": "alta",
    "ocorrencias": 5,
    "exemplos": [
      "Q9 e Q87 (mesma cerca de carpinteiro, capítulos diferentes)",
      "Q59 e Q60 (mapa da cidade)",
      "Q27 (vacina e epidemia)",
      "Q90 (hemácias, gráfico vindo de biologia)",
      "Q46 (precipitação em Campinas)"
    ],
    "gatilho": "O bloco 'TEXTO PARA A PRÓXIMA QUESTÃO' ou 'PARA AS PRÓXIMAS 2 QUESTÕES'.",
    "rota": [
      "Leia o texto de apoio uma vez com atenção e marque no papel os dois ou três números que ele fornece.",
      "Olhe a figura antes de olhar as alternativas. Dado obrigatório costuma estar no desenho, não no texto.",
      "Se são duas questões sobre o mesmo texto, resolva as duas na sequência, aproveitando o entendimento."
    ],
    "pegadinha": "Dado escondido na figura. A cerca do carpinteiro só fecha se você contar os parafusos no detalhe da ligação, que não está descrito em texto nenhum.",
    "nivel": "obrigatoria",
    "alertaPessoal": "Foi exatamente isso na Q69 do Poliedro em química, onde a razão de 3 CO₂ por zeólita estava na figura e você abandonou a questão achando que estava errando."
  }
];

export const PEGADINHAS = [
  {
    "nome": "Responder a grandeza errada",
    "descricao": "Você resolve certo e marca outra coisa. Ângulo A em vez de ângulo AÊB, dose aplicada em vez de DL50, alelo em vez de indivíduo, energia fornecida em vez de dissipada, x² em vez de x.",
    "antidoto": "Antes de marcar, releia só a última linha do enunciado e escreva ao lado da conta o nome da grandeza pedida.",
    "reincidencia": "cinco ocorrências registradas nos seus simulados"
  },
  {
    "nome": "Parar na penúltima linha",
    "descricao": "Chegar em x² = 12 + 6√3 e marcar a alternativa que mostra esse valor, sem extrair a raiz.",
    "antidoto": "Circule a incógnita pedida no começo. Se você isolou o quadrado dela, ainda falta um passo."
  },
  {
    "nome": "Trocar a resposta certa por desconfiança",
    "descricao": "Você acerta de primeira, desconfia e troca por uma segunda tentativa errada.",
    "antidoto": "Só troque se encontrar o erro específico. Desconforto não é erro encontrado."
  },
  {
    "nome": "Ler pela primeira palavra da alternativa",
    "descricao": "Descartar a alternativa correta porque o começo dela soou errado, sem ler o resto.",
    "antidoto": "Leia as quatro alternativas inteiras antes de descartar qualquer uma."
  },
  {
    "nome": "Área lateral contra área total",
    "descricao": "A banca troca uma palavra e mantém o resto da questão idêntico ao ano anterior.",
    "antidoto": "Sublinhe 'lateral', 'total', 'superfície' no enunciado antes de escrever a fórmula."
  },
  {
    "nome": "Divisão longa com zero omitido no quociente",
    "descricao": "Quando o número parcial é menor que o divisor, você pula o zero e a resposta perde uma casa.",
    "antidoto": "Estimar a ordem de grandeza antes de dividir, e conferir contando os dígitos do quociente."
  }
];

export const RADAR_RECENTE = {
  "aviso": "A apostila cobre até 2022. O que está abaixo veio de análise das edições recentes e do seu histórico de simulados, não do material.",
  "itens": [
    {
      "ano": "Unicamp 2026 (aplicada em 26/10/2025)",
      "observacao": "Caíram porcentagem, funções, probabilidade e geometria plana com área de triângulos. Houve assuntos repetidos do ano anterior, especificamente módulo e função composta. Não caíram PA, PG nem matrizes, apesar de matrizes terem voltado ao edital naquele ano.",
      "leitura": "Matrizes voltarem ao conteúdo programático e não caírem na 1ª fase deixa o tema com risco alto para 2027. A apostila tem cinco questões de matriz, todas boas para treinar isso."
    },
    {
      "ano": "Unicamp 2025 (aplicada em 20/10/2024)",
      "observacao": "A prova foi fortemente visual, com dezenas de questões apoiadas em gráficos, mapas e fotografias. Em matemática houve uma questão contextualizada no conclave, montada como problema de interpretação de dados.",
      "leitura": "Confirma o traço de contexto atual e leitura de gráfico. O conteúdo matemático dessas questões é sempre mais simples do que a embalagem sugere."
    },
    {
      "ano": "Simulado Oficial Unicamp 2027",
      "observacao": "Você fez 11 de 12 em matemática. O único erro foi a Q47, polinômio com raiz única real.",
      "leitura": "Polinômio com condição sobre número de raízes reais é molde de fronteira entre funções e álgebra. Vale um bloco dedicado com discriminante, teorema das raízes racionais e Briot-Ruffini."
    },
    {
      "ano": "Simulado Aberto Unicamp 2026 (Poliedro)",
      "observacao": "Você fez 5 de 12 em matemática, com a maior parte dos erros concentrados em geometria, nas questões 46, 50 e 53.",
      "leitura": "É a mesma concentração da incidência histórica. Geometria é 37% da prova e é onde seus erros se acumulam."
    }
  ],
  "lacunasDoMaterial": [
    "Probabilidade, zero questões na apostila, mas apareceu na Unicamp 2026. É o maior buraco do material.",
    "Estatística descritiva e leitura de tabela, só duas questões de média, nenhuma de mediana, moda ou desvio.",
    "Matemática financeira e porcentagem, só aparecem embutidas em duas questões de aritmética, e porcentagem caiu em 2026.",
    "Poliedros e Euler, uma única questão, e ainda assim marcada como adaptada."
  ]
};

export const PLANO_MOLDES = [
  "Passe 1, reconhecimento. Leia os 22 moldes sem resolver nada, só para o gatilho grudar. Vinte minutos.",
  "Passe 2, execução cronometrada. Pegue os moldes marcados como obrigatórios e faça as questões de exemplo em bloco, sem consultar nada, marcando X no que travar.",
  "Passe 3, correção. Só depois de fechar o bloco, corrija e classifique cada erro em uma das pegadinhas transversais.",
  "Passe 4, os buracos. Probabilidade, porcentagem e estatística não estão na apostila. Precisam de material separado."
];

export const MOLDE_STATUS_LABEL = {
  novo: "Ainda não treinei",
  treinando: "Treinando",
  dominado: "Dominado",
};
export const MOLDE_STATUS_CICLO = { novo: "treinando", treinando: "dominado", dominado: "novo" };

// Peso para a fila de revisão. Molde obrigatório e ainda não treinado sobe primeiro.
export function pesoMolde(m, status) {
  const st = status || "novo";
  if (st === "dominado") return 0;
  let p = m.nivel === "obrigatoria" ? 3 : 1;
  if (m.incidencia === "repetida") p += 2;
  if (m.alertaPessoal) p += 2;
  if (st === "treinando") p -= 1;
  return p;
}
