-- ============================================================
-- ZED Creatives — Supabase schema
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- SINGLETON CONFIG TABLES (one row each, id fixed = 1) ----------
create table if not exists site_settings (
  id int primary key default 1,
  email text, phone text, response_time text, based_location text,
  currency text default 'USD', currency_rate numeric, currency_symbol text,
  instagram text, behance text, dribbble text, linkedin text,
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

create table if not exists theme_colors (
  id int primary key default 1,
  bg text default '#FAFAF7', ink text default '#14140F',
  green text default '#063121', lime text default '#BFD72F', panel text default '#F1F1E9',
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

create table if not exists hero_content (
  id int primary key default 1,
  eyebrow text, headline text, lead text,
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

create table if not exists about_content (
  id int primary key default 1,
  eyebrow text, headline text, lead text, story1 text, story2 text,
  qf_focus text, qf_founded text, qf_based text, qf_tools text,
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

-- ---------- MULTI-ROW CONTENT TABLES ----------
create table if not exists products (
  id text primary key,
  name text not null, price numeric not null default 0,
  category text, grad text, description text, tag text,
  sort_order int default 0, updated_at timestamptz default now()
);

create table if not exists portfolio_items (
  id uuid primary key default gen_random_uuid(),
  img text, title text, category text, sub text,
  sort_order int default 0, updated_at timestamptz default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  title text, description text,
  sort_order int default 0, updated_at timestamptz default now()
);

create table if not exists pricing_tiers (
  id uuid primary key default gen_random_uuid(),
  tier text, price text, period text, description text,
  featured boolean default false, badge text, features jsonb default '[]',
  sort_order int default 0, updated_at timestamptz default now()
);

create table if not exists faq_items (
  id uuid primary key default gen_random_uuid(),
  question text, answer text,
  sort_order int default 0, updated_at timestamptz default now()
);

-- Visitor-submitted testimonials — public can INSERT, only admin can DELETE/see unapproved
create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  name text, role text, quote text,
  approved boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Public (anon key): can READ everything except unapproved testimonials,
-- and can INSERT new testimonials. All WRITES to site content require
-- an authenticated (logged-in) admin session — see supabase/README.md.
-- ============================================================

alter table site_settings enable row level security;
alter table theme_colors enable row level security;
alter table hero_content enable row level security;
alter table about_content enable row level security;
alter table products enable row level security;
alter table portfolio_items enable row level security;
alter table services enable row level security;
alter table pricing_tiers enable row level security;
alter table faq_items enable row level security;
alter table testimonials enable row level security;

-- Public read access
create policy "public read" on site_settings for select using (true);
create policy "public read" on theme_colors for select using (true);
create policy "public read" on hero_content for select using (true);
create policy "public read" on about_content for select using (true);
create policy "public read" on products for select using (true);
create policy "public read" on portfolio_items for select using (true);
create policy "public read" on services for select using (true);
create policy "public read" on pricing_tiers for select using (true);
create policy "public read" on faq_items for select using (true);
create policy "public read approved" on testimonials for select using (approved = true);

-- Admin (any authenticated user) can write everything.
-- Because this studio has a single admin, "authenticated" is enough;
-- see README if you ever want to restrict to one specific email.
create policy "admin write" on site_settings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write" on theme_colors for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write" on hero_content for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write" on about_content for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write" on products for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write" on portfolio_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write" on services for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write" on pricing_tiers for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write" on faq_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write" on testimonials for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Public can submit a new testimonial (unapproved by default) but not read others' unapproved ones
create policy "public submit testimonial" on testimonials for insert with check (approved = false);

-- ============================================================
-- SEED DATA — mirrors the current defaults baked into the site,
-- so switching to Supabase doesn't blank anything out.
-- ============================================================

insert into site_settings (id, currency) values (1, 'USD') on conflict (id) do nothing;
insert into theme_colors (id) values (1) on conflict (id) do nothing;
insert into hero_content (id, eyebrow, headline, lead) values (
  1, 'ZED Creatives — Brand & Design Studio',
  'I Don''t Just Make Designs.<br>I Build Brands People <em>Remember.</em>',
  'ZED Creatives is a branding and graphic design studio turning early ideas into identities that hold up in the real world.'
) on conflict (id) do nothing;
insert into about_content (id, eyebrow, headline, lead, story1, story2, qf_focus, qf_founded, qf_based, qf_tools) values (
  1, 'About the studio', 'The designer<br>behind the work.',
  'Felix Simon, founder of ZED Creatives — building brand systems for founders who care about craft.',
  'I''ve spent the last seven years turning rough ideas into brands that hold up under real pressure — on shelf, on screen, in a pitch deck.',
  'ZED Creatives is a small studio with one point of view: design should protect the brand it''s built for, not just decorate it. Every project on this site passed through my own hands, from first sketch to final file.',
  'Brand identity, packaging, motion', '2021', 'Available worldwide, remote-first', 'Illustrator, Figma, Blender'
) on conflict (id) do nothing;

insert into products (id, name, price, category, grad, description, tag, sort_order) values
  ('logo-template-pack','Logo Template Pack',29,'Templates','grad-1','10 fully editable logo templates in Illustrator and Figma format — ideal for a fast, professional starting point.','Best seller',1),
  ('brand-identity-kit','Brand Identity Kit',89,'Identity Kits','grad-2','A complete starter identity system: logo suite, color palette, type pairing and usage guide.','New arrival',2),
  ('social-media-templates','Social Media Templates',39,'Templates','grad-3','60 editable post and story templates built on real grid systems for Instagram and LinkedIn.','Best seller',3),
  ('packaging-mockup-bundle','Packaging Mockup Bundle',49,'Mockups','grad-4','25 high-resolution PSD packaging mockups — boxes, pouches, bottles and labels.','',4),
  ('font-icon-pack','Font & Icon Pack',19,'Assets','grad-5','4 display fonts and 200 line icons, licensed for commercial brand and product use.','New arrival',5),
  ('presentation-templates','Presentation Templates',45,'Templates','grad-6','A 40-slide deck system for pitches, brand guidelines and client proposals.','',6),
  ('everything-bundle','Everything Bundle',199,'Bundles','grad-2','Every current ZED Creatives digital product in one download, at a bundle price.','Best value',7)
on conflict (id) do nothing;

insert into portfolio_items (title, category, sub, sort_order) values
  ('Boss Lady Tumbler','Merchandise','Custom engraved drinkware',1),
  ('Redleaf Insurance','Advertising','Teardrop banner & signage',2),
  ('Safaricom Device Plans','Print Design','Retail flyer design',3)
on conflict do nothing;

insert into services (title, description, sort_order) values
  ('Brand Identity','Positioning, naming support and full visual systems built to last.',1),
  ('Logo Design','Distinctive marks that scale from favicon to billboard.',2),
  ('Social Media Design','Template systems that keep a feed recognisable, post after post.',3),
  ('Packaging Design','Structural and print design built for real shelf presence.',4),
  ('Print Design','Business collateral and editorial layouts with real typographic craft.',5),
  ('Website Design','Marketing sites built to convert and to last.',6),
  ('UI/UX Design','Interface systems for real product teams, not one-off screens.',7),
  ('Motion Graphics','Logo animation and social motion design that gives identity a pulse.',8),
  ('3D Design','Photoreal renders and dimensional brand worlds.',9),
  ('Creative Direction','End-to-end art direction across a launch, keeping the vision straight.',10)
on conflict do nothing;

insert into pricing_tiers (tier, price, period, description, featured, badge, features, sort_order) values
  ('Starter','$450','/ project','A single mark, done right.', false, '',
    '["Logo design, 2 concepts","2 rounds of revisions","Colour palette","Source files + exports","5-day turnaround"]', 1),
  ('Growth','$1,200','/ project','A full identity system.', true, 'Most booked',
    '["Everything in Starter","Full brand identity system","Typography & brand guide","Social & print templates","3 rounds of revisions","10-day turnaround"]', 2),
  ('Complete','$2,800','/ project','Identity, packaging, launch.', false, '',
    '["Everything in Growth","Packaging & structural design","3D product mockups","Launch campaign assets","Unlimited revisions","Dedicated project timeline"]', 3)
on conflict do nothing;

insert into faq_items (question, answer, sort_order) values
  ('How long does a typical project take?','A single logo runs about 5 working days. A full identity system is typically 2–3 weeks depending on revisions and how quickly feedback comes back.',1),
  ('What''s included in the price?','Every package includes source files, export formats for web and print, and a set number of revision rounds. See the pricing page for exact inclusions per tier.',2),
  ('Do you offer payment plans?','Yes — most projects are split 50% upfront and 50% on delivery. Larger scopes can be split into milestones.',3),
  ('Can I buy a template instead of custom work?','Yes — the shop has fixed-price, instant-download templates and kits if you don''t need a fully custom project.',4),
  ('Do you work with clients outside your timezone?','Yes, the studio is remote-first and works with clients worldwide — most communication happens async over email with scheduled calls as needed.',5),
  ('What if I''m not happy with the direction?','Every package includes revision rounds specifically for this. If a direction genuinely isn''t working, we go back to the concept stage rather than polishing the wrong idea.',6)
on conflict do nothing;
