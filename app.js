/* ============ ZED Creatives — shared app logic ============ */

/* loader */
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if(!loader) return;
  const bar = loader.querySelector('.bar span');
  const img = loader.querySelector('img');
  requestAnimationFrame(()=>{
    img.style.transition = 'opacity .5s ease';
    img.style.opacity = 1;
    bar.style.transition = 'width 0.9s cubic-bezier(.16,.84,.44,1)';
    bar.style.width = '100%';
    setTimeout(()=>{
      loader.style.transition = 'transform .7s cubic-bezier(.7,0,.3,1)';
      loader.style.transform = 'translateY(-100%)';
      setTimeout(()=> loader.style.display='none', 700);
    }, 750);
  });
});

/* header scroll state */
const siteHeader = document.getElementById('site-header');
if(siteHeader){
  window.addEventListener('scroll', ()=>{
    siteHeader.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive:true });
}

/* custom cursor */
const cursor = document.getElementById('cursor');
if(cursor){
  let cx=0, cy=0, mx=0, my=0;
  window.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; });
  function tick(){
    cx += (mx-cx)*0.18; cy += (my-cy)*0.18;
    cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
    requestAnimationFrame(tick);
  }
  tick();
  document.addEventListener('mouseover', e=>{
    if(e.target.closest('a, button, input, select, textarea, .clickable')) cursor.classList.add('hover');
  });
  document.addEventListener('mouseout', e=>{
    if(e.target.closest('a, button, input, select, textarea, .clickable')) cursor.classList.remove('hover');
  });
}

/* scroll reveal (IntersectionObserver, no external deps) */
const revealItems = document.querySelectorAll('.reveal');
if(revealItems.length){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){ entry.target.classList.add('in'); io.unobserve(entry.target); }
    });
  }, { threshold:.15 });
  revealItems.forEach(el=> io.observe(el));
}

/* animated counters */
document.querySelectorAll('[data-count]').forEach(el=>{
  const target = +el.dataset.count;
  const suffix = el.dataset.suffix || '+';
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        let start = null;
        function step(ts){
          if(!start) start = ts;
          const progress = Math.min((ts-start)/1400, 1);
          const eased = 1 - Math.pow(1-progress, 3);
          el.textContent = Math.floor(eased*target) + suffix;
          if(progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        io.unobserve(el);
      }
    });
  }, { threshold:.4 });
  io.observe(el);
});

/* ============ mark current nav link ============ */
(function(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navlinks a').forEach(a=>{
    if(a.getAttribute('href') === path) a.classList.add('current');
  });
})();

/* ============ bottom tab bar ============ */
(function(){
  const tabbar = document.getElementById('tabbar');
  if(!tabbar) return;
  const path = location.pathname.split('/').pop() || 'index.html';
  const navTabs = Array.from(tabbar.querySelectorAll('.tab-btn'));
  navTabs.forEach(btn=>{
    if(btn.dataset.href === path) btn.classList.add('active');
    btn.addEventListener('click', ()=>{
      if(btn.dataset.href) window.location.href = btn.dataset.href;
    });
  });
})();

/* ============ PRODUCT CATALOG (shared demo data) ============ */
const ZED_PRODUCTS = [
  { id:'logo-template-pack', name:'Logo Template Pack', price:29, category:'Templates', grad:'grad-1',
    desc:'10 fully editable logo templates in Illustrator and Figma format — ideal for a fast, professional starting point.',
    tag:'Best seller' },
  { id:'brand-identity-kit', name:'Brand Identity Kit', price:89, category:'Identity Kits', grad:'grad-2',
    desc:'A complete starter identity system: logo suite, color palette, type pairing and usage guide.',
    tag:'New arrival' },
  { id:'social-media-templates', name:'Social Media Templates', price:39, category:'Templates', grad:'grad-3',
    desc:'60 editable post and story templates built on real grid systems for Instagram and LinkedIn.',
    tag:'Best seller' },
  { id:'packaging-mockup-bundle', name:'Packaging Mockup Bundle', price:49, category:'Mockups', grad:'grad-4',
    desc:'25 high-resolution PSD packaging mockups — boxes, pouches, bottles and labels.',
    tag:'' },
  { id:'font-icon-pack', name:'Font & Icon Pack', price:19, category:'Assets', grad:'grad-5',
    desc:'4 display fonts and 200 line icons, licensed for commercial brand and product use.',
    tag:'New arrival' },
  { id:'presentation-templates', name:'Presentation Templates', price:45, category:'Templates', grad:'grad-6',
    desc:'A 40-slide deck system for pitches, brand guidelines and client proposals.',
    tag:'' },
  { id:'everything-bundle', name:'Everything Bundle', price:199, category:'Bundles', grad:'grad-2',
    desc:'Every current ZED Creatives digital product in one download, at a bundle price.',
    tag:'Best value' },
];

function zedFindProduct(id){ return ZED_PRODUCTS.find(p=>p.id===id); }

/* Admin panel override: replace catalog with whatever was saved in admin.html, if any */
(function(){
  try{
    const override = JSON.parse(localStorage.getItem('zed_products_override'));
    if(override && Array.isArray(override) && override.length){
      ZED_PRODUCTS.length = 0;
      override.forEach(p=> ZED_PRODUCTS.push(p));
    }
  }catch(e){}
})();

/* Admin panel override: site-wide contact email + social links */
(function(){
  try{
    const settings = JSON.parse(localStorage.getItem('zed_settings_override'));
    if(!settings) return;
    if(settings.email){
      document.querySelectorAll('a[href^="mailto:felixsimon877@gmail.com"]').forEach(a=>{
        a.href = a.href.replace('felixsimon877@gmail.com', settings.email);
      });
    }
    const socialMap = { Instagram:'instagram', Behance:'behance', Dribbble:'dribbble', LinkedIn:'linkedin' };
    document.querySelectorAll('.socials a').forEach(a=>{
      const key = socialMap[a.textContent.trim()];
      if(key && settings[key]) a.href = settings[key];
    });
  }catch(e){}
})();

/* ============ CART (localStorage) ============ */
/* Note: uses localStorage, which works normally once this site is hosted for
   real (Netlify/Vercel/etc) or opened directly in a regular browser tab.
   It will NOT persist inside Claude.ai's own in-chat preview sandbox — that
   preview blocks browser storage APIs. Test persistence after hosting, or by
   opening the downloaded file directly in your own browser. */
const CART_KEY = 'zed_cart_v1';
const WISHLIST_KEY = 'zed_wishlist_v1';

function zedGetCart(){
  try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch(e){ return []; }
}
function zedSaveCart(cart){
  try{ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }catch(e){}
  zedUpdateCartBadge();
}
function zedAddToCart(id, qty=1){
  const cart = zedGetCart();
  const existing = cart.find(i=>i.id===id);
  if(existing) existing.qty += qty; else cart.push({ id, qty });
  zedSaveCart(cart);
}
function zedRemoveFromCart(id){
  zedSaveCart(zedGetCart().filter(i=>i.id!==id));
}
function zedUpdateQty(id, qty){
  const cart = zedGetCart();
  const item = cart.find(i=>i.id===id);
  if(item){ item.qty = Math.max(1, qty); zedSaveCart(cart); }
}
function zedCartCount(){
  return zedGetCart().reduce((sum,i)=>sum+i.qty, 0);
}
function zedCartTotal(){
  return zedGetCart().reduce((sum,i)=>{
    const p = zedFindProduct(i.id);
    return sum + (p ? p.price*i.qty : 0);
  }, 0);
}
function zedUpdateCartBadge(){
  document.querySelectorAll('[data-cart-count]').forEach(el=>{
    const count = zedCartCount();
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

/* ============ WISHLIST (localStorage) ============ */
function zedGetWishlist(){
  try{ return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || []; }
  catch(e){ return []; }
}
function zedToggleWishlist(id){
  let list = zedGetWishlist();
  if(list.includes(id)) list = list.filter(x=>x!==id);
  else list.push(id);
  try{ localStorage.setItem(WISHLIST_KEY, JSON.stringify(list)); }catch(e){}
  zedUpdateWishlistBadge();
  return list.includes(id);
}
function zedUpdateWishlistBadge(){
  document.querySelectorAll('[data-wishlist-count]').forEach(el=>{
    const count = zedGetWishlist().length;
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  zedUpdateCartBadge();
  zedUpdateWishlistBadge();
});

/* ============ DARK MODE ============ */
(function(){
  const THEME_KEY = 'zed_theme';
  function applyTheme(theme){
    document.documentElement.setAttribute('data-theme', theme);
    try{ localStorage.setItem(THEME_KEY, theme); }catch(e){}
  }
  let saved = 'light';
  try{ saved = localStorage.getItem(THEME_KEY) || 'light'; }catch(e){}
  applyTheme(saved);
  document.querySelectorAll('.theme-toggle').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  });
})();

/* ============ ORDER HISTORY (localStorage) ============ */
const ORDERS_KEY = 'zed_orders_v1';
function zedGetOrders(){
  try{ return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; }
  catch(e){ return []; }
}
function zedSaveOrder(order){
  const orders = zedGetOrders();
  orders.unshift(order);
  try{ localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); }catch(e){}
}

/* ============ COMMAND PALETTE / SITE SEARCH ============ */
const ZED_SEARCH_INDEX = [
  { group:'Pages', name:'Home', href:'index.html' },
  { group:'Pages', name:'About', href:'about.html' },
  { group:'Pages', name:'Services', href:'services.html' },
  { group:'Pages', name:'Portfolio', href:'portfolio.html' },
  { group:'Pages', name:'Shop', href:'shop.html' },
  { group:'Pages', name:'Pricing', href:'pricing.html' },
  { group:'Pages', name:'FAQ', href:'faq.html' },
  { group:'Pages', name:'Contact', href:'contact.html' },
  { group:'Pages', name:'Cart', href:'cart.html' },
  { group:'Pages', name:'Wishlist', href:'wishlist.html' },
  { group:'Pages', name:'Order History', href:'orders.html' },
  { group:'Pages', name:'Client Login', href:'login.html' },
  { group:'Services', name:'Brand Identity', href:'services.html' },
  { group:'Services', name:'Logo Design', href:'services.html' },
  { group:'Services', name:'Packaging Design', href:'services.html' },
  { group:'Services', name:'Social Media Design', href:'services.html' },
  { group:'Services', name:'UI/UX Design', href:'services.html' },
  { group:'Services', name:'Motion Graphics', href:'services.html' },
  { group:'Services', name:'3D Design', href:'services.html' },
  { group:'Portfolio', name:'Boss Lady Tumbler', href:'portfolio.html' },
  { group:'Portfolio', name:'Redleaf Insurance', href:'portfolio.html' },
  { group:'Portfolio', name:'Safaricom Device Plans', href:'portfolio.html' },
];
if(typeof ZED_PRODUCTS !== 'undefined'){
  ZED_PRODUCTS.forEach(p=> ZED_SEARCH_INDEX.push({ group:'Shop', name:p.name, href:`product.html?id=${p.id}` }));
}

(function(){
  const overlay = document.getElementById('cmdk-overlay');
  if(!overlay) return;
  const input = document.getElementById('cmdk-input');
  const results = document.getElementById('cmdk-results');
  let selected = 0;
  let currentItems = [];

  function open(){
    overlay.classList.add('open');
    input.value = '';
    input.focus();
    render('');
  }
  function close(){ overlay.classList.remove('open'); }

  function render(query){
    const q = query.trim().toLowerCase();
    const matches = q ? ZED_SEARCH_INDEX.filter(i=> i.name.toLowerCase().includes(q)) : ZED_SEARCH_INDEX.slice(0,8);
    currentItems = matches;
    selected = 0;
    if(matches.length === 0){
      results.innerHTML = '<div class="cmdk-empty">No results. Try a different search.</div>';
      return;
    }
    const groups = {};
    matches.forEach(m=>{ (groups[m.group] = groups[m.group]||[]).push(m); });
    results.innerHTML = Object.keys(groups).map(g=>`
      <div class="cmdk-group-label">${g}</div>
      ${groups[g].map((item)=>{
        const globalIdx = matches.indexOf(item);
        return `<div class="cmdk-item ${globalIdx===0?'selected':''}" data-idx="${globalIdx}" data-href="${item.href}"><span class="dot"></span>${item.name}</div>`;
      }).join('')}
    `).join('');
    results.querySelectorAll('.cmdk-item').forEach(el=>{
      el.addEventListener('click', ()=> window.location.href = el.dataset.href);
    });
  }

  function moveSelection(dir){
    if(!currentItems.length) return;
    selected = (selected + dir + currentItems.length) % currentItems.length;
    results.querySelectorAll('.cmdk-item').forEach(el=> el.classList.toggle('selected', +el.dataset.idx === selected));
    const activeEl = results.querySelector('.cmdk-item.selected');
    if(activeEl) activeEl.scrollIntoView({ block:'nearest' });
  }

  document.querySelectorAll('.js-open-search').forEach(btn=> btn.addEventListener('click', open));
  document.addEventListener('keydown', e=>{
    if((e.metaKey || e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); open(); }
    if(e.key === 'Escape') close();
    if(overlay.classList.contains('open')){
      if(e.key === 'ArrowDown'){ e.preventDefault(); moveSelection(1); }
      if(e.key === 'ArrowUp'){ e.preventDefault(); moveSelection(-1); }
      if(e.key === 'Enter' && currentItems[selected]){ window.location.href = currentItems[selected].href; }
    }
  });
  overlay.addEventListener('click', e=>{ if(e.target === overlay) close(); });
  input.addEventListener('input', ()=> render(input.value));
})();

/* ============ newsletter (client-side feedback) ============ */
document.querySelectorAll('.newsletter form').forEach(form=>{
  form.addEventListener('submit', e=>{
    e.preventDefault();
    const btn = form.querySelector('button');
    btn.textContent = 'Subscribed ✓';
    setTimeout(()=>{ btn.textContent = 'Join →'; form.reset(); }, 2200);
  });
});

/* ============ FAQ (admin-editable via zed_faq_override) ============ */
(function(){
  const list = document.getElementById('faq-list');
  if(!list) return;
  try{
    const override = JSON.parse(localStorage.getItem('zed_faq_override'));
    if(override && Array.isArray(override) && override.length){
      list.innerHTML = override.map(item => `
        <div class="faq-item">
          <div class="faq-q">${item.q}<span class="plus">+</span></div>
          <div class="faq-a"><p>${item.a}</p></div>
        </div>
      `).join('');
    }
  }catch(e){}
  list.querySelectorAll('.faq-item').forEach(item=>{
    item.querySelector('.faq-q').addEventListener('click', ()=>{
      const wasOpen = item.classList.contains('open');
      list.querySelectorAll('.faq-item.open').forEach(o=> o.classList.remove('open'));
      if(!wasOpen) item.classList.add('open');
    });
  });
})();

/* ============ THEME COLOUR OVERRIDE (admin-editable, applied via head snippet on each page) ============ */
/* See the <script> injected before </head> on every page for the actual application logic —
   it must run before paint, so it lives directly in <head>, not in this shared file. */

/* ============ MY PROFILE (localStorage) ============ */
const PROFILE_KEY = 'zed_profile_v1';
function zedGetProfile(){
  try{
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {
      name:'', email:'', avatar:'', notifyEmail:true, notifySms:false, darkPref:false
    };
  }catch(e){
    return { name:'', email:'', avatar:'', notifyEmail:true, notifySms:false, darkPref:false };
  }
}
function zedSaveProfile(profile){
  try{ localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); }catch(e){}
}

/* ============ TESTIMONIALS (localStorage, user-submitted) ============ */
const TESTIMONIALS_KEY = 'zed_testimonials_v1';
function zedGetUserTestimonials(){
  try{ return JSON.parse(localStorage.getItem(TESTIMONIALS_KEY)) || []; }
  catch(e){ return []; }
}
function zedAddTestimonial(entry){
  const list = zedGetUserTestimonials();
  list.unshift(entry);
  try{ localStorage.setItem(TESTIMONIALS_KEY, JSON.stringify(list)); }catch(e){}
}
