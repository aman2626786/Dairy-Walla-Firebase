-- ============================================================
-- DairyWalla — Supabase Database Schema
-- Safe to run multiple times (IF NOT EXISTS)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── profiles ─────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  name text,
  phone text not null,
  role text check (role in ('distributor', 'shopkeeper')) not null,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Users can view own profile') then
    create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Users can update own profile') then
    create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='Users can insert own profile') then
    create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
  end if;
end $$;

-- ── distributor_profiles ──────────────────────────────────────
create table if not exists public.distributor_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  business_name text not null,
  connection_code text unique not null,
  order_window_start text default '18:00',
  order_window_cutoff text default '20:00',
  owner_name text,
  company text,
  address text,
  city text,
  delivery_areas text,
  gst text,
  location_name text,
  latitude double precision,
  longitude double precision,
  profile_complete boolean default false,
  created_at timestamptz default now()
);
alter table public.distributor_profiles enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='distributor_profiles' and policyname='Anyone can view distributor profiles') then
    create policy "Anyone can view distributor profiles" on public.distributor_profiles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='distributor_profiles' and policyname='Distributors can update own profile') then
    create policy "Distributors can update own profile" on public.distributor_profiles for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='distributor_profiles' and policyname='Distributors can insert own profile') then
    create policy "Distributors can insert own profile" on public.distributor_profiles for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- ── shopkeeper_profiles ───────────────────────────────────────
create table if not exists public.shopkeeper_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  shop_name text not null,
  owner_name text,
  address text,
  city text,
  delivery_timing text,
  location_name text,
  latitude double precision,
  longitude double precision,
  profile_complete boolean default false,
  created_at timestamptz default now()
);
alter table public.shopkeeper_profiles enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='shopkeeper_profiles' and policyname='Anyone can view shopkeeper profiles') then
    create policy "Anyone can view shopkeeper profiles" on public.shopkeeper_profiles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='shopkeeper_profiles' and policyname='Shopkeepers can update own profile') then
    create policy "Shopkeepers can update own profile" on public.shopkeeper_profiles for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='shopkeeper_profiles' and policyname='Shopkeepers can insert own profile') then
    create policy "Shopkeepers can insert own profile" on public.shopkeeper_profiles for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- ── connections ───────────────────────────────────────────────
create table if not exists public.connections (
  id uuid default uuid_generate_v4() primary key,
  shopkeeper_id uuid references public.shopkeeper_profiles(id) on delete cascade,
  shopkeeper_name text,
  shop_name text,
  distributor_id uuid references public.distributor_profiles(id) on delete cascade,
  distributor_name text,
  business_name text,
  status text check (status in ('pending', 'active', 'rejected')) default 'pending',
  delivery_group_id uuid,
  delivery_group_name text,
  created_at timestamptz default now()
);
alter table public.connections enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='connections' and policyname='Users can view their connections') then
    create policy "Users can view their connections" on public.connections for select using (
      auth.uid() in (
        select user_id from public.shopkeeper_profiles where id = shopkeeper_id
        union
        select user_id from public.distributor_profiles where id = distributor_id
      )
    );
  end if;
  if not exists (select 1 from pg_policies where tablename='connections' and policyname='Shopkeepers can create connections') then
    create policy "Shopkeepers can create connections" on public.connections for insert with check (
      auth.uid() in (select user_id from public.shopkeeper_profiles where id = shopkeeper_id)
    );
  end if;
  if not exists (select 1 from pg_policies where tablename='connections' and policyname='Distributors can update connections') then
    create policy "Distributors can update connections" on public.connections for update using (
      auth.uid() in (select user_id from public.distributor_profiles where id = distributor_id)
    );
  end if;
end $$;

-- ── products ──────────────────────────────────────────────────
create table if not exists public.products (
  id uuid default uuid_generate_v4() primary key,
  distributor_id uuid references public.distributor_profiles(id) on delete cascade,
  name text not null,
  brand text,
  category text not null default 'other',
  unit text,
  price numeric(10,2) not null,
  available boolean default true,
  image_url text,
  created_at timestamptz default now()
);
alter table public.products enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='products' and policyname='Anyone can view available products') then
    create policy "Anyone can view available products" on public.products for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='products' and policyname='Distributors can manage own products') then
    create policy "Distributors can manage own products" on public.products for all using (
      auth.uid() in (select user_id from public.distributor_profiles where id = distributor_id)
    );
  end if;
end $$;

-- ── delivery_groups ───────────────────────────────────────────
create table if not exists public.delivery_groups (
  id uuid default uuid_generate_v4() primary key,
  distributor_id uuid references public.distributor_profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);
alter table public.delivery_groups enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='delivery_groups' and policyname='Anyone can view delivery groups') then
    create policy "Anyone can view delivery groups" on public.delivery_groups for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='delivery_groups' and policyname='Distributors can manage own groups') then
    create policy "Distributors can manage own groups" on public.delivery_groups for all using (
      auth.uid() in (select user_id from public.distributor_profiles where id = distributor_id)
    );
  end if;
end $$;

-- ── orders ────────────────────────────────────────────────────
create table if not exists public.orders (
  id uuid default uuid_generate_v4() primary key,
  shopkeeper_id uuid references public.shopkeeper_profiles(id) on delete cascade,
  shopkeeper_name text,
  shop_name text,
  distributor_id uuid references public.distributor_profiles(id) on delete cascade,
  type text check (type in ('normal', 'late')) default 'normal',
  status text check (status in ('pending', 'accepted', 'rejected', 'fulfilled')) default 'pending',
  source text check (source in ('web', 'whatsapp')) default 'web',
  delivery_date date,
  delivery_group_name text,
  total numeric(10,2) default 0,
  placed_at timestamptz default now()
);
alter table public.orders enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='orders' and policyname='Users can view their orders') then
    create policy "Users can view their orders" on public.orders for select using (
      auth.uid() in (
        select user_id from public.shopkeeper_profiles where id = shopkeeper_id
        union
        select user_id from public.distributor_profiles where id = distributor_id
      )
    );
  end if;
  if not exists (select 1 from pg_policies where tablename='orders' and policyname='Shopkeepers can place orders') then
    create policy "Shopkeepers can place orders" on public.orders for insert with check (
      auth.uid() in (select user_id from public.shopkeeper_profiles where id = shopkeeper_id)
    );
  end if;
  if not exists (select 1 from pg_policies where tablename='orders' and policyname='Distributors can update order status') then
    create policy "Distributors can update order status" on public.orders for update using (
      auth.uid() in (select user_id from public.distributor_profiles where id = distributor_id)
    );
  end if;
end $$;

-- ── order_items ───────────────────────────────────────────────
create table if not exists public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name text,
  brand text,
  unit text,
  unit_price numeric(10,2),
  quantity integer
);
alter table public.order_items enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='order_items' and policyname='Users can view order items') then
    create policy "Users can view order items" on public.order_items for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='order_items' and policyname='Shopkeepers can insert order items') then
    create policy "Shopkeepers can insert order items" on public.order_items for insert with check (true);
  end if;
end $$;

-- ── notifications ─────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  type text,
  message text,
  read boolean default false,
  created_at timestamptz default now()
);
alter table public.notifications enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='Users can view own notifications') then
    create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='Users can update own notifications') then
    create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='Anyone can insert notifications') then
    create policy "Anyone can insert notifications" on public.notifications for insert with check (true);
  end if;
end $$;

-- ── profiles table mein phone column ensure karo ─────────────
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_name='profiles' and column_name='phone'
  ) then
    alter table public.profiles add column phone text not null default '';
  end if;
end $$;

-- —— user_roles (multi-role support) ——————————————————————————————
create table if not exists public.user_roles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('distributor', 'shopkeeper')),
  created_at timestamptz default now(),
  unique(user_id, role)
);
alter table public.user_roles enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='user_roles' and policyname='Users can view own roles') then
    create policy "Users can view own roles" on public.user_roles for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='user_roles' and policyname='Users can insert own roles') then
    create policy "Users can insert own roles" on public.user_roles for insert with check (auth.uid() = user_id);
  end if;
end $$;

-- Ensure shopkeeper phone is available on connections for quick calling
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'connections' and column_name = 'shopkeeper_phone'
  ) then
    alter table public.connections add column shopkeeper_phone text;
  end if;
end $$;
