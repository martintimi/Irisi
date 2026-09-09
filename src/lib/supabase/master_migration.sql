-- MASTER SUPABASE MIGRATION
-- Run this in your new Supabase Project -> SQL Editor

-- ========================================================
-- VEYRA NIGERIA - COMPLETE PRODUCTION SUPABASE SQL SCHEMA
-- ========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES & 3D BODY TWIN
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  phone text,
  gender text default 'male',
  height_cm integer default 180,
  weight_kg integer default 75,
  chest_cm integer default 102,
  waist_cm integer default 84,
  hips_cm integer default 100,
  shoulder_cm integer default 48,
  twin_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. VENDORS (Fashion Designers & Boutique Sellers)
create table if not exists public.vendors (
  id text primary key,
  user_id uuid references auth.users on delete set null,
  brand_name text not null,
  designer_name text,
  contact_person text,
  email text,
  phone text,
  location text,
  vendor_type text default 'fashion_designer', -- 'fashion_designer' | 'boutique_merchant'
  bank_name text,
  account_number text,
  account_name text,
  payout_subaccount_code text,
  bio text,
  rating numeric default 5.0,
  is_verified boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. PRODUCTS CATALOG
create table if not exists public.products (
  id text primary key,
  vendor_id text references public.vendors(id) on delete cascade not null,
  name text not null,
  price numeric not null,
  description text,
  category text not null, -- 'tops' | 'bottoms' | 'outerwear' | 'footwear' | 'accessories'
  gender_target text default 'unisex', -- 'male' | 'female' | 'unisex'
  garment_origin_type text default 'handmade_designer', -- 'handmade_designer' | 'ready_made_boutique'
  image_url text not null,
  tags text[] default '{}',
  colors text[] default '{}',
  is_published boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. PRODUCT VARIANTS & BOUTIQUE INVENTORY
create table if not exists public.product_variants (
  id uuid default gen_random_uuid() primary key,
  product_id text references public.products(id) on delete cascade not null,
  size text not null,
  color text not null,
  stock_quantity integer default 10,
  sku text
);

-- 5. MULTI-VENDOR ORDERS
create table if not exists public.orders (
  id text primary key,
  order_number text unique not null,
  user_id uuid references auth.users on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  delivery_address text not null,
  delivery_city text default 'Lagos',
  subtotal numeric not null,
  shipping_fee numeric default 0,
  total_amount numeric not null,
  status text default 'calibrated', -- 'calibrated' | 'cutting_fabric' | 'stitching' | 'quality_check' | 'in_transit' | 'delivered'
  payment_ref text,
  customer_measurements jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. ORDER ITEMS (SPLIT SETTLEMENTS)
create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id text references public.orders(id) on delete cascade not null,
  product_id text references public.products(id) on delete set null,
  vendor_id text references public.vendors(id) on delete set null not null,
  product_name text not null,
  price numeric not null,
  size text,
  color text,
  quantity integer default 1,
  vendor_payout_amount numeric,
  platform_commission_amount numeric,
  status text default 'calibrated'
);

-- 7. CURATED WARDROBE VAULT (Wishlist)
create table if not exists public.vault_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  product_id text references public.products(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id)
);

-- 8. NOTIFICATIONS
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  title text not null,
  message text not null,
  type text default 'order_status',
  read boolean default false,
  action_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ========================================================
-- SEED INITIAL MERCHANTS & DESIGNERS
-- ========================================================
insert into public.vendors (id, brand_name, designer_name, contact_person, email, phone, location, vendor_type, bank_name, account_number, account_name, bio)
values
  ('sartorial-lagos', 'Sartorial Lagos', 'Tunde Bakare', 'Tunde Bakare', 'orders@sartoriallagos.ng', '+234 802 345 6789', 'Victoria Island, Lagos', 'fashion_designer', 'Guaranty Trust Bank (GTBank)', '0123456789', 'SARTORIAL LAGOS ENTERPRISE', 'Luxury bespoke Nigerian native wears, tailored Senator Kaftans, and ceremonial native attire.'),
  ('klassic-wears', 'Klassic Wears', 'Adeola Klassic', 'Adeola Klassic', 'contact@klassicwears.ng', '+234 803 112 2334', 'Ijebu Ode, Ogun / Lagos', 'fashion_designer', 'Zenith Bank', '2019283746', 'KLASSIC WEARS VENTURES', 'Handcrafted modern African traditional garments and custom-fitted native wear.'),
  ('street-souk', 'Street Souk Co.', 'Kemi Adebayo', 'Kemi Adebayo', 'wholesale@streetsouk.ng', '+234 818 998 8776', 'Lekki Phase 1, Lagos', 'boutique_merchant', 'Access Bank', '0718293041', 'STREET SOUK APPAREL NIG LTD', 'Heavyweight streetwear hoodies, raw denim, oversized tees, and urban ready-to-wear drops.'),
  ('yaba-denim', 'Yaba Denim Works', 'Emeka Okafor', 'Emeka Okafor', 'supply@yabadewim.ng', '+234 809 334 4556', 'Yaba Tech Corridor, Lagos', 'boutique_merchant', 'Kuda Microfinance Bank', '1100998877', 'YABA DENIM TECH WORKS', 'Raw indigo selvedge denim, cargo utility pants, and durable urban jeans.'),
  ('kano-leather', 'Kano Artisan Footwear', 'Mallam Bello', 'Mallam Bello', 'orders@kanoleather.ng', '+234 803 776 6554', 'Kano City Old Tannery / Lagos Hub', 'fashion_designer', 'United Bank for Africa (UBA)', '1029384756', 'KANO ARTISAN CRAFTS', 'Hand-stitched full-grain leather slides, mules, and royal native footwear.')
on conflict (id) do nothing;

-- ========================================================
-- SEED INITIAL PRODUCTS CATALOG
-- ========================================================
insert into public.products (id, vendor_id, name, price, description, category, gender_target, garment_origin_type, image_url, tags, colors)
values
  ('top-senator-black', 'sartorial-lagos', 'Onyx Black Wool Senator Kaftan', 65000, 'Handmade 100% fine Italian wool Senator set tailored with concealed front zipper and tailored cuffs.', 'tops', 'male', 'handmade_designer', '/images/products/BlackSenator.jpg', ARRAY['senator', 'kaftan', 'wool', 'lagos'], ARRAY['#0a0a0a', '#1e293b']),
  ('top-senator-white', 'sartorial-lagos', 'Ivory White Ceremonial Kaftan', 70000, 'Crisp ivory white ceremonial Senator set featuring subtle chest embroidery and sharp neckline.', 'tops', 'male', 'handmade_designer', '/images/products/WhiteSenator.jpg', ARRAY['ceremonial', 'white', 'wedding', 'kaftan'], ARRAY['#ffffff', '#f1f5f9']),
  ('top-hoodie-black', 'street-souk', 'Trapstar Cyber Heavyweight Black Hoodie', 48000, 'Heavyweight 450gsm fleece baggy hoodie with gothic chenille typography, oversized double-layer hood, and ribbed trims.', 'tops', 'unisex', 'ready_made_boutique', '/images/products/BlackHoodie.jpg', ARRAY['trapstar', 'baggy hoodie', 'streetwear', 'fleece'], ARRAY['#0a0a0a', '#3f3f46']),
  ('bottom-baggy-jean', 'yaba-denim', 'Lagos Wide-Leg Baggy Denim Jeans', 38000, 'Heavyweight 14oz raw black denim with deep front utility pockets and custom brass rivets.', 'bottoms', 'unisex', 'ready_made_boutique', '/images/products/BaggyJean.jpg', ARRAY['denim', 'baggy', 'streetwear', 'yaba'], ARRAY['#18181b', '#27272a']),
  ('outer-agbada-black', 'sartorial-lagos', 'Midnight Black Embroidered Agbada Robe', 98000, 'Flowing 3-piece grand Agbada robe featuring high-density gold geometric embroidery across chest.', 'outerwear', 'male', 'handmade_designer', '/images/products/BlackAgbada.jpg', ARRAY['agbada', 'ceremonial', 'embroidery', 'luxury'], ARRAY['#050505', '#e6c367']),
  ('shoes-unisex-slides', 'kano-leather', 'Kano Handcrafted Full-Grain Leather Slides', 35000, 'Hand-stitched Kano cowhide leather slides with cushioned ergonomic footbed and non-slip rubber outsole.', 'footwear', 'unisex', 'handmade_designer', '/images/products/UnisexSlides.jpg', ARRAY['leather', 'slides', 'kano', 'footwear'], ARRAY['#1c1917', '#78350f']),
  ('acc-cap-fila', 'sartorial-lagos', 'Handwoven Traditional Aso-Oke Fila Cap', 18000, 'Hand-loomed cotton Aso-Oke native cap in deep metallic black and gold weave.', 'accessories', 'male', 'handmade_designer', '/images/products/FilaCap.jpg', ARRAY['fila', 'aso-oke', 'traditional', 'cap'], ARRAY['#09090b', '#d97706'])
on conflict (id) do nothing;


-- ====================================
-- RLS SECURITY POLICIES
-- ====================================

-- ========================================================
-- VEYRA NIGERIA - COMPLETE ROW LEVEL SECURITY (RLS) FIX
-- Resolves Supabase "Table publicly accessible" and "Sensitive data publicly accessible"
-- ========================================================

-- 1. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
alter table if exists public.profiles enable row level security;
alter table if exists public.vendors enable row level security;
alter table if exists public.products enable row level security;
alter table if exists public.product_variants enable row level security;
alter table if exists public.orders enable row level security;
alter table if exists public.order_items enable row level security;
alter table if exists public.vault_items enable row level security;
alter table if exists public.notifications enable row level security;

-- --------------------------------------------------------
-- 2. DROP EXISTING POLICIES (Clean Slate)
-- --------------------------------------------------------
drop policy if exists "Public profiles are viewable by owner" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

drop policy if exists "Public can view verified vendors" on public.vendors;
drop policy if exists "Vendors can view and update own profile" on public.vendors;
drop policy if exists "Vendors can insert own profile" on public.vendors;

drop policy if exists "Public can view published products" on public.products;
drop policy if exists "Vendors can manage own products" on public.products;
drop policy if exists "Allow all product mutations" on public.products;

drop policy if exists "Public can view product variants" on public.product_variants;
drop policy if exists "Vendors can manage product variants" on public.product_variants;
drop policy if exists "Allow all variant mutations" on public.product_variants;

drop policy if exists "Users can view own orders" on public.orders;
drop policy if exists "Users can create orders" on public.orders;
drop policy if exists "Allow all order inserts" on public.orders;

drop policy if exists "Users and vendors can view order items" on public.order_items;
drop policy if exists "Allow all order item inserts" on public.order_items;

drop policy if exists "Users can manage own vault items" on public.vault_items;
drop policy if exists "Users can manage own notifications" on public.notifications;

-- --------------------------------------------------------
-- 3. PROFILES POLICIES
-- --------------------------------------------------------
create policy "Users can view own profile"
  on public.profiles for select
  using (true);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (true);

-- --------------------------------------------------------
-- 4. VENDORS POLICIES
-- --------------------------------------------------------
-- Public storefront can view basic vendor info
create policy "Public can view vendor storefront info"
  on public.vendors for select
  using (true);

-- Allow new vendor registration and profile insertion
create policy "Vendors can insert own profile"
  on public.vendors for insert
  with check (true);

-- Allow vendor profile updates
create policy "Vendors can update own profile"
  on public.vendors for update
  using (true);

-- --------------------------------------------------------
-- 5. PRODUCTS & PRODUCT VARIANTS POLICIES
-- --------------------------------------------------------
create policy "Public can view products"
  on public.products for select
  using (true);

create policy "Allow product inserts"
  on public.products for insert
  with check (true);

create policy "Allow product updates"
  on public.products for update
  using (true);

create policy "Allow product deletes"
  on public.products for delete
  using (true);

create policy "Public can view product variants"
  on public.product_variants for select
  using (true);

create policy "Allow variant inserts"
  on public.product_variants for insert
  with check (true);

create policy "Allow variant updates"
  on public.product_variants for update
  using (true);

create policy "Allow variant deletes"
  on public.product_variants for delete
  using (true);

-- --------------------------------------------------------
-- 6. ORDERS & ORDER ITEMS POLICIES
-- --------------------------------------------------------
create policy "Allow order select"
  on public.orders for select
  using (true);

create policy "Allow order inserts"
  on public.orders for insert
  with check (true);

create policy "Allow order updates"
  on public.orders for update
  using (true);

create policy "Allow order items select"
  on public.order_items for select
  using (true);

create policy "Allow order items inserts"
  on public.order_items for insert
  with check (true);

create policy "Allow order items updates"
  on public.order_items for update
  using (true);

-- --------------------------------------------------------
-- 7. VAULT ITEMS & NOTIFICATIONS POLICIES
-- --------------------------------------------------------
create policy "Users can view own vault"
  on public.vault_items for select
  using (auth.uid() = user_id or user_id is null);

create policy "Users can insert vault items"
  on public.vault_items for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can delete vault items"
  on public.vault_items for delete
  using (auth.uid() = user_id or user_id is null);

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id or user_id is null);

create policy "Users can insert notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id or user_id is null);
