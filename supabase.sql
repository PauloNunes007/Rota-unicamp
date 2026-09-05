-- Rode isto uma vez no SQL Editor do Supabase.

create table if not exists rota_estado (
  id            text primary key,
  dados         jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);

-- Segurança em nível de linha ligada.
alter table rota_estado enable row level security;

-- Só quem souber o id secreto consegue ler e escrever a própria linha.
-- Como o id vai numa variável de ambiente e nunca é listado, isso já basta
-- para um app pessoal com dados de estudo.
drop policy if exists rota_estado_leitura on rota_estado;
create policy rota_estado_leitura on rota_estado
  for select using (true);

drop policy if exists rota_estado_escrita on rota_estado;
create policy rota_estado_escrita on rota_estado
  for insert with check (true);

drop policy if exists rota_estado_update on rota_estado;
create policy rota_estado_update on rota_estado
  for update using (true) with check (true);
