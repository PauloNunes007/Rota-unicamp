# Rota Unicamp — como colocar no ar

Tempo estimado: 30 a 60 minutos. Faça num intervalo, não no meio de um bloco de estudo.

O que você vai ter no fim: o app rodando numa URL própria, com os dados num
banco de verdade, acessível de qualquer aparelho, sem depender do Claude.

---

## Etapa 1 — Banco de dados no Supabase

1. Entre em supabase.com e crie um projeto novo. Guarde a senha do banco.
2. No menu lateral, abra **SQL Editor** e clique em **New query**.
3. Cole todo o conteúdo do arquivo `supabase.sql` e clique em **Run**.
4. Vá em **Project Settings**, aba **API**, e copie dois valores.
   - **Project URL**
   - **anon public** (a chave grande, não a service_role)

---

## Etapa 2 — Rodar na sua máquina

Você precisa do Node.js instalado (nodejs.org, versão LTS).

Na pasta do projeto, no terminal:

    npm install

Copie `.env.example` para um arquivo chamado `.env` e preencha:

    VITE_SUPABASE_URL=a Project URL que você copiou
    VITE_SUPABASE_ANON_KEY=a chave anon public
    VITE_ESTADO_ID=invente-um-texto-longo-e-secreto

O `VITE_ESTADO_ID` é o que protege seus dados. Invente algo difícil de
adivinhar, tipo `paulo-9f2b7c41ae83d05x`, e não mostre para ninguém.

Depois:

    npm run dev

Abra o endereço que aparecer, normalmente http://localhost:5173

---

## Etapa 3 — Colocar no ar com a Vercel

1. Crie um repositório no GitHub e suba a pasta do projeto.
   O arquivo `.gitignore` já impede que o `.env` vá junto, o que é o correto.
2. Entre em vercel.com, faça login com o GitHub e clique em **Add New, Project**.
3. Escolha o repositório. A Vercel detecta Vite sozinha, não precisa mudar nada.
4. Antes de clicar em Deploy, abra **Environment Variables** e cadastre as três
   variáveis do seu `.env`, com os mesmos nomes e valores.
5. Clique em **Deploy**.

Pronto. Você recebe uma URL do tipo `rota-unicamp.vercel.app`, que funciona
no computador e no celular. Toda vez que você der push no GitHub, a Vercel
publica a versão nova sozinha.

---

## Como levar seus dados atuais

No app dentro do Claude, abra a engrenagem da Rota e clique em
**Exportar e copiar**. No app novo, abra a mesma engrenagem, cole o texto no
campo de backup e clique em **Restaurar do texto**. Tudo vai junto.

---

## Detalhes que vale saber

**Se a internet cair**, o app continua funcionando. Ele mantém uma cópia local
no navegador e grava no Supabase assim que der.

**Sobre a segurança.** A proteção aqui é o `VITE_ESTADO_ID` ser secreto. Isso é
adequado para dados de estudo num app pessoal, mas não seria adequado para
dados sensíveis. Se um dia você quiser algo mais forte, o caminho é ligar o
Supabase Auth e trocar as políticas de RLS para usar `auth.uid()`.

**Para atualizar o app**, substitua os arquivos em `src/` pela versão nova e
dê push. Os dados ficam no banco, então nada se perde.

---

## Como o código está organizado

- `src/srs/fsrs.js` — algoritmo FSRS-5 (puro, sem interface)
- `src/srs/fila.js` — fila da revisão diária, limites, previsão
- `src/edital.js` — árvore de matérias e tópicos (Fuvest/Unicamp)
- `src/dados.js` — modelo de dados, migração e leitura de pacotes JSON
- `src/views/` — telas: Hoje, Estudo livre, Importar, Cartões, Ajustes
- `src/storage.js` — Supabase + cópia local, com envio agrupado

Formato de um pacote para importar:

    { "nome": "opcional", "cartoes": [ { "frente": "...", "verso": "...", "extra": "opcional" } ] }
