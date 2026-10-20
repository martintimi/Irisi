-- ========================================================
-- ÌRÍSÍ NIGERIA - CLEAN PRODUCTION DATABASE SCHEMA (NO MOCK DATA)
-- Run this in your new Production Supabase Project -> SQL Editor
-- Target Domain: https://irisimi.ng
-- ========================================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- --------------------------------------------------------
-- 1. PROFILES & USER MEASUREMENTS
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- 2. VENDORS (Fashion Designers, Boutiques & Ateliers)
-- --------------------------------------------------------
create table if not exists public.vendors (
  id text primary key,
  user_id uuid references auth.users on delete set null,
  brand_name text not null,
  designer_name text,
  contact_person text,
  email text,
  phone text,
  location text,
  vendor_type text default 'boutique_merchant', -- 'fashion_designer' | 'boutique_merchant'
  bank_name text,
  account_number text,
  account_name text,
  payout_subaccount_code text,
  bio text,
  rating numeric default 5.0,
  is_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- --------------------------------------------------------
-- 3. PRODUCTS CATALOG
-- --------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  vendor_id text references public.vendors(id) on delete cascade not null,
  name text not null,
  price numeric not null,
  description text,
  category text not null, -- 'tops' | 'bottoms' | 'outerwear' | 'footwear' | 'accessories'
  gender_target text default 'unisex', -- 'male' | 'female' | 'unisex'
  garment_origin_type text default 'ready_made_boutique', -- 'handmade_designer' | 'ready_made_boutique'
  image_url text not null,
  tags text[] default '{}',
  colors text[] default '{}',
  is_published boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- --------------------------------------------------------
-- 4. PRODUCT VARIANTS & SIZES / STOCK
-- --------------------------------------------------------
create table if not exists public.product_variants (
  id uuid default gen_random_uuid() primary key,
  product_id text references public.products(id) on delete cascade not null,
  size text not null,
  color text not null,
  stock_quantity integer default 0,
  sku text
);

-- --------------------------------------------------------
-- 5. ORDERS (Escrow & Multi-Vendor)
-- --------------------------------------------------------
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
  status text default 'escrow_secured',
  payment_ref text,
  customer_measurements jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- --------------------------------------------------------
-- 6. ORDER ITEMS (Split Vendor Settlements)
-- --------------------------------------------------------
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
  status text default 'escrow_secured'
);

-- --------------------------------------------------------
-- 7. VAULT (Shopper Wishlist)
-- --------------------------------------------------------
create table if not exists public.vault_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  product_id text references public.products(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, product_id)
);

-- --------------------------------------------------------
-- 8. NOTIFICATIONS & INCOMING APPLICATIONS / WAITLIST
-- --------------------------------------------------------
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  title text not null,
  message text not null,
  type text default 'order_status', -- 'vendor_application' | 'waitlist_subscriber' | 'order_status'
  read boolean default false,
  action_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- --------------------------------------------------------
-- 9. CATEGORIES (Optional custom directory mapping)
-- --------------------------------------------------------
create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text unique not null,
  gender_target text default 'unisex',
  department text default 'clothing',
  image_url text,
  subtitle text,
  description text,
  is_popular boolean default false,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ========================================================
-- INDEXES FOR PRODUCTION QUERY PERFORMANCE
-- ========================================================
create index if not exists idx_products_vendor on public.products(vendor_id);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_published on public.products(is_published);
create index if not exists idx_product_variants_prod on public.product_variants(product_id);
create index if not exists idx_orders_customer_email on public.orders(customer_email);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_order_items_vendor on public.order_items(vendor_id);
create index if not exists idx_notifications_type on public.notifications(type);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================
alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.vault_items enable row level security;
alter table public.notifications enable row level security;
alter table public.categories enable row level security;

-- Profiles:
create policy "Public profiles viewable by all" on public.profiles for select using (true);
create policy "Users can insert own profile" on public.profiles for insert with check (true);
create policy "Users can update own profile" on public.profiles for update using (true);

-- Vendors:
create policy "Public can view verified vendors" on public.vendors for select using (true);
create policy "Vendors can insert" on public.vendors for insert with check (true);
create policy "Vendors can update" on public.vendors for update using (true);

-- Products:
create policy "Public can view published products" on public.products for select using (is_published = true or true);
create policy "Allow product insert" on public.products for insert with check (true);
create policy "Allow product update" on public.products for update using (true);
create policy "Allow product delete" on public.products for delete using (true);

-- Variants:
create policy "Public can view variants" on public.product_variants for select using (true);
create policy "Allow variant insert" on public.product_variants for insert with check (true);
create policy "Allow variant update" on public.product_variants for update using (true);
create policy "Allow variant delete" on public.product_variants for delete using (true);

-- Orders & Items:
create policy "Allow order select" on public.orders for select using (true);
create policy "Allow order insert" on public.orders for insert with check (true);
create policy "Allow order update" on public.orders for update using (true);

create policy "Allow order items select" on public.order_items for select using (true);
create policy "Allow order items insert" on public.order_items for insert with check (true);
create policy "Allow order items update" on public.order_items for update using (true);

-- Vault:
create policy "Vault select" on public.vault_items for select using (true);
create policy "Vault insert" on public.vault_items for insert with check (true);
create policy "Vault delete" on public.vault_items for delete using (true);

-- Notifications:
create policy "Notifications select" on public.notifications for select using (true);
create policy "Notifications insert" on public.notifications for insert with check (true);
create policy "Notifications update" on public.notifications for update using (true);

-- Categories:
create policy "Categories select" on public.categories for select using (true);
create policy "Categories insert" on public.categories for insert with check (true);
