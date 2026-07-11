/* ============================================================
   ZED Creatives — Supabase data layer (zed-db.js)
   Requires: supabase-js CDN + supabase-config.js loaded first.

   Design: localStorage stays the fast, synchronous read path every
   page already uses (zed_*_override keys) — nothing about existing
   page rendering has to change. This file's job is to keep those
   localStorage keys in sync with Supabase:
     - On page load, pull fresh data from Supabase into localStorage,
       then reload once if anything actually changed.
     - Admin saves write to Supabase AND localStorage together.
   If Supabase isn't configured yet, everything silently no-ops and
   the site behaves exactly as it did before (local-only mode).
   ============================================================ */

(function(){
  const configured = !!(window.ZED_SUPABASE_URL && window.ZED_SUPABASE_ANON_KEY);
  window.ZED_DB_CONFIGURED = configured;
  if(!configured || typeof window.supabase === 'undefined') return;

  const client = window.supabase.createClient(window.ZED_SUPABASE_URL, window.ZED_SUPABASE_ANON_KEY);
  window.zedSupabase = client;

  /* ---------- field-name transforms between Supabase rows and existing localStorage shapes ---------- */
  const toProduct = r => ({ id:r.id, name:r.name, price:r.price, category:r.category, grad:r.grad, desc:r.description, tag:r.tag });
  const fromProduct = p => ({ id:p.id, name:p.name, price:p.price, category:p.category, grad:p.grad, description:p.desc, tag:p.tag });

  const toPortfolio = r => ({ img:r.img, title:r.title, category:r.category, sub:r.sub });
  const fromPortfolio = p => ({ img:p.img, title:p.title, category:p.category, sub:p.sub });

  const toService = r => ({ title:r.title, desc:r.description });
  const fromService = s => ({ title:s.title, description:s.desc });

  const toPricing = r => ({ tier:r.tier, price:r.price, period:r.period, desc:r.description, featured:r.featured, badge:r.badge, features:r.features || [] });
  const fromPricing = p => ({ tier:p.tier, price:p.price, period:p.period, description:p.desc, featured:!!p.featured, badge:p.badge||'', features:p.features||[] });

  const toFaq = r => ({ q:r.question, a:r.answer });
  const fromFaq = f => ({ question:f.q, answer:f.a });

  const toHero = r => r ? ({ eyebrow:r.eyebrow, headline:r.headline, lead:r.lead }) : null;
  const fromHero = h => ({ id:1, eyebrow:h.eyebrow, headline:h.headline, lead:h.lead });

  const toAbout = r => r ? ({ eyebrow:r.eyebrow, headline:r.headline, lead:r.lead, story1:r.story1, story2:r.story2, qfFocus:r.qf_focus, qfFounded:r.qf_founded, qfBased:r.qf_based, qfTools:r.qf_tools }) : null;
  const fromAbout = a => ({ id:1, eyebrow:a.eyebrow, headline:a.headline, lead:a.lead, story1:a.story1, story2:a.story2, qf_focus:a.qfFocus, qf_founded:a.qfFounded, qf_based:a.qfBased, qf_tools:a.qfTools });

  const toSettings = r => r ? ({ email:r.email, phone:r.phone, responseTime:r.response_time, basedLocation:r.based_location, currency:r.currency, currencyRate:r.currency_rate, currencySymbol:r.currency_symbol, instagram:r.instagram, behance:r.behance, dribbble:r.dribbble, linkedin:r.linkedin }) : null;
  const fromSettings = s => ({ id:1, email:s.email, phone:s.phone, response_time:s.responseTime, based_location:s.basedLocation, currency:s.currency, currency_rate:s.currencyRate, currency_symbol:s.currencySymbol, instagram:s.instagram, behance:s.behance, dribbble:s.dribbble, linkedin:s.linkedin });

  const toTheme = r => r ? ({ bg:r.bg, ink:r.ink, green:r.green, lime:r.lime, panel:r.panel }) : null;
  const fromTheme = t => ({ id:1, bg:t.bg, ink:t.ink, green:t.green, lime:t.lime, panel:t.panel });

  /* ---------- generic helpers ---------- */
  async function replaceAll(table, rows){
    // Simple, safe-for-small-tables strategy: wipe and reinsert in the new order.
    const del = await client.from(table).delete().not('id','is', null);
    if(del.error) throw del.error;
    if(rows.length){
      const ins = await client.from(table).insert(rows);
      if(ins.error) throw ins.error;
    }
  }
  async function upsertSingleton(table, row){
    const { error } = await client.from(table).upsert(row);
    if(error) throw error;
  }

  /* ---------- SYNC: pull Supabase → localStorage, reload once if changed ---------- */
  async function pullAndCache(table, key, transformList){
    const { data, error } = await client.from(table).select('*').order('sort_order', { ascending:true, nullsFirst:false });
    if(error || !data) return false;
    const value = JSON.stringify(transformList(data));
    const prev = localStorage.getItem(key);
    if(prev !== value){ localStorage.setItem(key, value); return true; }
    return false;
  }
  async function pullAndCacheSingleton(table, key, transformOne){
    const { data, error } = await client.from(table).select('*').eq('id',1).maybeSingle();
    if(error || !data) return false;
    const value = JSON.stringify(transformOne(data));
    const prev = localStorage.getItem(key);
    if(prev !== value){ localStorage.setItem(key, value); return true; }
    return false;
  }

  window.zedDbSync = async function(){
    if(sessionStorage.getItem('zed_synced_this_session')) return;
    try{
      const results = await Promise.all([
        pullAndCache('products','zed_products_override', rows => rows.map(toProduct)),
        pullAndCache('portfolio_items','zed_portfolio_override', rows => rows.map(toPortfolio)),
        pullAndCache('services','zed_services_override', rows => rows.map(toService)),
        pullAndCache('pricing_tiers','zed_pricing_override', rows => rows.map(toPricing)),
        pullAndCache('faq_items','zed_faq_override', rows => rows.map(toFaq)),
        pullAndCacheSingleton('hero_content','zed_hero_override', toHero),
        pullAndCacheSingleton('about_content','zed_about_override', toAbout),
        pullAndCacheSingleton('site_settings','zed_settings_override', toSettings),
        pullAndCacheSingleton('theme_colors','zed_theme_override', toTheme),
      ]);
      sessionStorage.setItem('zed_synced_this_session', '1');
      if(results.some(Boolean)) location.reload();
    }catch(e){ /* offline or misconfigured — local cache just keeps serving as-is */ }
  };
  // Run in the background shortly after load so it never blocks first paint.
  window.addEventListener('load', () => setTimeout(window.zedDbSync, 50));

  /* ---------- ADMIN WRITES: push to Supabase, then mirror to localStorage ---------- */
  window.zedDbSaveProducts = async list => { await replaceAll('products', list.map(fromProduct)); localStorage.setItem('zed_products_override', JSON.stringify(list)); };
  window.zedDbSavePortfolio = async list => { await replaceAll('portfolio_items', list.map(fromPortfolio)); localStorage.setItem('zed_portfolio_override', JSON.stringify(list)); };
  window.zedDbSaveServices = async list => { await replaceAll('services', list.map(fromService)); localStorage.setItem('zed_services_override', JSON.stringify(list)); };
  window.zedDbSavePricing = async list => { await replaceAll('pricing_tiers', list.map(fromPricing)); localStorage.setItem('zed_pricing_override', JSON.stringify(list)); };
  window.zedDbSaveFaq = async list => { await replaceAll('faq_items', list.map(fromFaq)); localStorage.setItem('zed_faq_override', JSON.stringify(list)); };
  window.zedDbSaveHero = async obj => { await upsertSingleton('hero_content', fromHero(obj)); localStorage.setItem('zed_hero_override', JSON.stringify(obj)); };
  window.zedDbSaveAbout = async obj => { await upsertSingleton('about_content', fromAbout(obj)); localStorage.setItem('zed_about_override', JSON.stringify(obj)); };
  window.zedDbSaveSettings = async obj => { await upsertSingleton('site_settings', fromSettings(obj)); localStorage.setItem('zed_settings_override', JSON.stringify(obj)); };
  window.zedDbSaveTheme = async obj => { await upsertSingleton('theme_colors', fromTheme(obj)); localStorage.setItem('zed_theme_override', JSON.stringify(obj)); };

  /* ---------- TESTIMONIALS: public insert (pending), admin moderation ---------- */
  window.zedDbSubmitTestimonial = async ({ name, role, quote }) => {
    const { error } = await client.from('testimonials').insert({ name, role, quote, approved:false });
    if(error) throw error;
  };
  window.zedDbFetchTestimonialsForModeration = async () => {
    const { data, error } = await client.from('testimonials').select('*').order('created_at', { ascending:false });
    if(error) throw error;
    return data;
  };
  window.zedDbApproveTestimonial = async id => { const { error } = await client.from('testimonials').update({ approved:true }).eq('id', id); if(error) throw error; };
  window.zedDbDeleteTestimonial = async id => { const { error } = await client.from('testimonials').delete().eq('id', id); if(error) throw error; };
  window.zedDbFetchApprovedTestimonials = async () => {
    const { data, error } = await client.from('testimonials').select('*').eq('approved', true).order('created_at', { ascending:false });
    if(error) throw error;
    return data;
  };

  /* ---------- AUTH (admin login gate) ---------- */
  window.zedDbSignIn = (email, password) => client.auth.signInWithPassword({ email, password });
  window.zedDbSignOut = () => client.auth.signOut();
  window.zedDbGetSession = async () => (await client.auth.getSession()).data.session;
})();
