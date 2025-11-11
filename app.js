/* =========================================================
   APP.JS — Interacciones globales
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  // NAV TOGGLE (mobile)
  const navToggle = document.getElementById('nav-toggle');
  const mainNav = document.querySelector('.main-nav');
  navToggle?.addEventListener('click', () => {
    mainNav.style.display = mainNav.style.display === 'flex' ? 'none' : 'flex';
  });

  // Resaltar sección activa
const sections = ['#hero', '#regiones','#marco', '#comparativa', '#metodologia', '#objetivos', '#transformaciones', '#simuladores', '#comentarios']
    .map(s=>document.querySelector(s)).filter(Boolean);
  const navLinks = [...document.querySelectorAll('.main-nav a')];
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if (en.isIntersecting){
        const id = '#'+en.target.id;
        navLinks.forEach(l=>l.classList.toggle('active', l.getAttribute('href')===id));
      }
    });
  },{threshold:0.45});
  sections.forEach(s=>obs.observe(s));

  (function(){
  const reveal = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if (e.isIntersecting){
        e.target.classList.add('in');
        reveal.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });

  document
    .querySelectorAll('.stage-item, .bar, .acc-item')
    .forEach(el => reveal.observe(el));
})();

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', e=>{
      const id = a.getAttribute('href');
      if (id.length>1 && document.querySelector(id)) {
        e.preventDefault();
        document.querySelector(id).scrollIntoView({behavior:'smooth', block:'start'});
      }
    });
  });

  // Tilt del mockup
  const mock = document.querySelector('.tilt');
  mock?.addEventListener('mousemove', e=>{
    const r = mock.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top)  / r.height - .5;
    mock.style.transform = `rotateX(${ -y*6 }deg) rotateY(${ x*8 }deg) translateZ(0)`;
  });
  mock?.addEventListener('mouseleave', ()=> mock.style.transform = 'rotateX(0) rotateY(0)');

 // Carousel (autoplay + dots + teclado)
const carousel = document.getElementById('carousel');

// ✅ Detectar si este carrusel pertenece a Transformaciones
const isTransformaciones = carousel?.closest('#transformaciones');

if (!isTransformaciones) {
  // ✅ Carrusel normal (funciona igual que antes)
  const track = document.querySelector('.carousel-track');
  const items = [...document.querySelectorAll('.carousel-item')];
  const prev = document.querySelector('.carousel-arrow.prev');
  const next = document.querySelector('.carousel-arrow.next');
  let index = 0;

  function itemWidth(){ const w = items[0]?.getBoundingClientRect().width || 320; return w + 20; }
  function updateCarousel() {
    track.style.transform = `translateX(${-index * itemWidth()}px)`;
    document.querySelectorAll('.carousel-dot').forEach((d,i)=>d.classList.toggle('active', i===index));
  }

  prev?.addEventListener('click', () => { index = Math.max(0, index - 1); updateCarousel(); });
  next?.addEventListener('click', () => { index = Math.min(items.length - 1, index + 1); updateCarousel(); });
  window.addEventListener('resize', updateCarousel);

  const dotsWrap = document.createElement('div'); 
  dotsWrap.className = 'carousel-dots';

  items.forEach((_,i)=> {
    const s = document.createElement('span'); 
    s.className = 'carousel-dot';
    s.addEventListener('click', ()=> { index = i; updateCarousel(); });
    dotsWrap.appendChild(s);
  });

  carousel.appendChild(dotsWrap);

  let auto = setInterval(()=> { 
    index = (index+1) % items.length; 
    updateCarousel(); 
  }, 4200);

  carousel.addEventListener('mouseenter', ()=> clearInterval(auto));
  carousel.addEventListener('mouseleave', ()=> auto = setInterval(()=> { 
    index = (index+1)%items.length; 
    updateCarousel(); 
  }, 4200));

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') next?.click();
    if (e.key === 'ArrowLeft')  prev?.click();
  });

  updateCarousel();

} else {
  // ✅ Carrusel dentro de Transformaciones → debe quedar QUIETO
  console.log("Carrusel estático activado en la sección Transformaciones.");

  const track = document.querySelector('#transformaciones .carousel-track');
  if (track) track.style.transform = "none";
}


  // Botón volver arriba
  const toTop = document.getElementById('toTop');
  window.addEventListener('scroll', ()=>{ toTop.classList.toggle('show', window.scrollY > 500); });
  toTop?.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));
});

/* =========================================================
   ANALIZADOR TIPO VT — PROTOTIPO EDUCATIVO
   ========================================================= */
(function () {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  if (!dropzone || !fileInput) return;

  const meta = {
    wrap: document.getElementById('fileMeta'),
    name: document.getElementById('metaName'),
    size: document.getElementById('metaSize'),
    type: document.getElementById('metaType'),
    sha:  document.getElementById('metaSha')
  };

  const actions = {
    wrap:  document.getElementById('actions'),
    scan:  document.getElementById('scanBtn'),
    reset: document.getElementById('resetBtn')
  };

  const results = {
    wrap: document.getElementById('results'),
    kDet: document.getElementById('kpiDetections'),
    kOk:  document.getElementById('kpiClean'),
    kSus: document.getElementById('kpiSusp'),
    tableBody: document.querySelector('#engineTable tbody'),
    chart: document.getElementById('vtChart')
  };

  let currentFile = null;
  let currentHash = null;

  // Utils
  function fmtSize(bytes){
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB','MB','GB']; let u = -1;
    do { bytes /= 1024; ++u; } while (bytes >= 1024 && u < units.length-1);
    return `${bytes.toFixed(2)} ${units[u]}`;
  }
  async function sha256(file){
    const buf = await file.arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2,'0')).join('');
  }
  function show(el, yes){ el.classList.toggle('hidden', !yes); }
  function seedFromHash(hash, idx=0){
    const n = parseInt(hash.slice(idx, idx+8) || '0', 16);
    return (n % 1000) / 1000;
  }

  // DnD
  dropzone.addEventListener('click', ()=> fileInput.click());
  dropzone.addEventListener('keydown', (e)=> { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
  ['dragenter','dragover'].forEach(ev => dropzone.addEventListener(ev, e=>{ e.preventDefault(); dropzone.classList.add('drag'); }));
  ['dragleave','drop'].forEach(ev => dropzone.addEventListener(ev, e=>{ e.preventDefault(); dropzone.classList.remove('drag'); }));
  dropzone.addEventListener('drop', (e)=>{ const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) handleFile(f); });
  fileInput.addEventListener('change', ()=>{ const f = fileInput.files && fileInput.files[0]; if (f) handleFile(f); });

  async function handleFile(file){
    currentFile = file;
    meta.name.textContent = file.name;
    meta.size.textContent = fmtSize(file.size);
    meta.type.textContent = file.type || '—';
    show(meta.wrap, true); show(actions.wrap, true); show(results.wrap, false);

    meta.sha.textContent = 'Calculando…';
    currentHash = await sha256(file);
    meta.sha.textContent = currentHash;

    // copiar SHA
    meta.sha.style.cursor = 'copy';
    meta.sha.title = 'Copiar SHA-256';
    meta.sha.onclick = async () => {
      try { await navigator.clipboard.writeText(meta.sha.textContent.trim()); meta.sha.dataset.tip='¡Copiado!'; setTimeout(()=> delete meta.sha.dataset.tip, 1200); } catch {}
    };
  }

  const ENGINES = ['ClamAV','Sophos','Kaspersky','Bitdefender','ESET','MS Defender','Avast','Avira','Malwarebytes','TrendMicro','McAfee','CrowdStrike','Fortinet','SentinelOne','PaloAlto','F-Secure'];

  function simulateEngines(hash){
    let detections=0, suspicious=0, clean=0;
    const rows = ENGINES.map((name, i)=>{
      const r = seedFromHash(hash, i*2);
      const conf = Math.round(50 + seedFromHash(hash, i*3)*50);
      let label, result;
      if (r > 0.72 || /dead|bad|c0de/.test(hash)) { label = 'malicious'; result = 'Trojan.Generic'; detections++; }
      else if (r > 0.50) { label = 'suspicious'; result = 'Heurística'; suspicious++; }
      else { label = 'clean'; result = '—'; clean++; }
      return { name, result, label, conf };
    });
    return { rows, detections, suspicious, clean };
  }

  function drawDonut(canvas, det, ok, sus){
    const ctx = canvas.getContext('2d');
    const total = Math.max(det+ok+sus, 1);
    const parts = [{ v: det, color: '#ef4444' }, { v: ok,  color: '#22c55e' }, { v: sus, color: '#f59e0b' }];
    ctx.clearRect(0,0,canvas.width, canvas.height);
    const cx = canvas.width/2, cy = canvas.height/2, r = Math.min(cx,cy)-6; let ang = -Math.PI/2;
    parts.forEach(p=>{
      const a = (p.v/total)*Math.PI*2;
      ctx.beginPath(); ctx.arc(cx, cy, r, ang, ang+a, false);
      ctx.lineWidth = 26; ctx.strokeStyle = p.color; ctx.stroke(); ang += a;
    });
    ctx.beginPath(); ctx.arc(cx, cy, r-18, 0, Math.PI*2);
    ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.stroke();
  }

  function fillTable(rows){
    results.tableBody.innerHTML = '';
    rows.forEach(r=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.name}</td><td>${r.result}</td><td><span class="tag ${r.label}">${r.label}</span></td><td>${r.conf}%</td>`;
      results.tableBody.appendChild(tr);
    });
  }

  actions.scan.addEventListener('click', async ()=>{
    if (!currentFile || !currentHash) return;
    actions.scan.disabled = true;
    actions.scan.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analizando…';
    await new Promise(r => setTimeout(r, 800));
    const sim = simulateEngines(currentHash);
    results.kDet.textContent = sim.detections;
    results.kOk.textContent  = sim.clean;
    results.kSus.textContent = sim.suspicious;
    drawDonut(results.chart, sim.detections, sim.clean, sim.suspicious);
    fillTable(sim.rows);
    show(results.wrap, true);
    actions.scan.disabled = false;
    actions.scan.innerHTML = '<i class="fas fa-play"></i> Analizar (simulación)';
  });

  actions.reset.addEventListener('click', ()=>{
    currentFile = null; currentHash = null; fileInput.value = '';
    show(meta.wrap, false); show(actions.wrap, false); show(results.wrap, false);
  });
})();

// ===============================
// CARRUSEL AUTOMÁTICO DEL HERO
// ===============================
const heroTrack = document.querySelector('.hero-track');
const heroImages = document.querySelectorAll('.hero-track img');
let heroIndex = 0;

if (heroTrack && heroImages.length > 0) {
  setInterval(() => {
    heroIndex = (heroIndex + 1) % heroImages.length;
    heroTrack.style.transform = `translateX(-${heroIndex * 100}%)`;
  }, 4000);
}