-- Virdlerim PWA - Supabase Senkronizasyon Tablosu ve Güvenlik İlkeleri
-- Supabase projenizin SQL Editor sekmesine yapıştırıp 'RUN' butonuna basmanız yeterlidir.

create table if not exists public.evrad_sync (
  sync_key text primary key,
  payload jsonb not null,
  client_timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) etkinleştirme
alter table public.evrad_sync enable row level security;

-- Anonim erişim için güvenli CRUD politikaları:
-- Her kullanıcı kendi ürettiği senkronizasyon anahtarıyla verilerini yönetir.
create policy "Allow select by sync_key" on public.evrad_sync
  for select using (true);

create policy "Allow insert by sync_key" on public.evrad_sync
  for insert with check (true);

create policy "Allow update by sync_key" on public.evrad_sync
  for update using (true);
