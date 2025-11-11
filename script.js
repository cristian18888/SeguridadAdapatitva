const canvas = document.getElementById('grid-bg');
const ctx = canvas.getContext('2d');
let w, h, t = 0;
function resize(){
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
resize(); window.addEventListener('resize', resize);

function draw(){
  ctx.clearRect(0,0,w,h);
  ctx.strokeStyle = 'rgba(160, 200, 230, 0.08)';
  ctx.lineWidth = 1;
  const grid = 48;
  const offset = (Math.sin(t/6000)*grid);
  for(let x = ((offset%grid)+grid)%grid; x < w; x += grid){
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke();
  }
  for(let y = ((offset%grid)+grid)%grid; y < h; y += grid){
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
  }
  t += 16;
  requestAnimationFrame(draw);
}
draw();

const card = document.querySelector('.showcase');
if(card){
  card.addEventListener('mousemove', (e)=>{
    const r = card.getBoundingClientRect();
    const cx = e.clientX - r.left, cy = e.clientY - r.top;
    const rx = ((cy / r.height) - .5) * -8;
    const ry = ((cx / r.width) - .5) * 10;
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  });
  card.addEventListener('mouseleave', ()=>{
    card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
  });
}


  (function () {
    const btn = document.querySelector('.nav-toggle');
    const nav = document.getElementById('primary-nav');

    if (!btn || !nav) return;
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.classList.toggle('open', open);
      document.body.classList.toggle('no-scroll', open);
    });


    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('no-scroll');
    }));
  })();

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

  // Utilidades
  function fmtSize(bytes){
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB','MB','GB'];
    let u = -1; do { bytes /= 1024; ++u; } while (bytes >= 1024 && u < units.length-1);
    return `${bytes.toFixed(2)} ${units[u]}`;
  }
  async function sha256(file){
    const buf = await file.arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', buf);
    const hex = [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2,'0')).join('');
    return hex;
  }
  function show(el, yes){ el.classList.toggle('hidden', !yes); }
  function seedFromHash(hash, idx=0){
    
    // Convierte 8 chars del hash a un número 0..1 (determinista)
    const part = hash.slice(idx, idx+8);
    const n = parseInt(part || '0', 16);
    return (n % 1000) / 1000;
  }

  // Drag & drop + click
  dropzone.addEventListener('click', ()=> fileInput.click());
  dropzone.addEventListener('keydown', (e)=> {
    if (e.key === 'Enter' || e.key === ' ') fileInput.click();
  });

  ['dragenter','dragover'].forEach(ev => dropzone.addEventListener(ev, e=>{
    e.preventDefault(); dropzone.classList.add('drag');
  }));
  ;['dragleave','drop'].forEach(ev => dropzone.addEventListener(ev, e=>{
    e.preventDefault(); dropzone.classList.remove('drag');
  }));
  dropzone.addEventListener('drop', (e)=>{
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleFile(f);
  });
  fileInput.addEventListener('change', ()=>{
    const f = fileInput.files && fileInput.files[0];
    if (f) handleFile(f);
  });

  async function handleFile(file){
    currentFile = file;

    // Metadatos básicos
    meta.name.textContent = file.name;
    meta.size.textContent = fmtSize(file.size);
    meta.type.textContent = file.type || '—';

    show(meta.wrap, true);
    show(actions.wrap, true);
    show(results.wrap, false);

    // Hash SHA-256 en el navegador
    meta.sha.textContent = 'Calculando…';
    currentHash = await sha256(file);
    meta.sha.textContent = currentHash;
  }

  // Simulador de motores (determinista por hash)
  const ENGINES = [
    'ClamAV','Sophos','Kaspersky','Bitdefender','ESET','MS Defender',
    'Avast','Avira','Malwarebytes','TrendMicro','McAfee','CrowdStrike',
    'Fortinet','SentinelOne','PaloAlto','F-Secure'
  ];
  const LABELS = ['malicious','suspicious','clean'];

  function simulateEngines(hash){
    let detections=0, suspicious=0, clean=0;
    const rows = ENGINES.map((name, i)=>{
      const r = seedFromHash(hash, i*2);   // 0..1
      const conf = Math.round(50 + seedFromHash(hash, i*3)*50); // 50..100
      let label, result;

      // Reglas simples: más detecciones si termina en ciertos patrones
      if (r > 0.72 || /dead|bad|c0de/.test(hash)) {
        label = 'malicious'; result = 'Trojan.Generic';
        detections++;
      } else if (r > 0.50) {
        label = 'suspicious'; result = 'Heurística';
        suspicious++;
      } else {
        label = 'clean'; result = '—';
        clean++;
      }

      return { name, result, label, conf };
    });

    return { rows, detections, suspicious, clean };
  }

  function drawDonut(canvas, det, ok, sus){
    const ctx = canvas.getContext('2d');
    const total = Math.max(det+ok+sus, 1);
    const parts = [
      { v: det, color: '#ef4444' }, // rojo
      { v: ok,  color: '#22c55e' }, // verde
      { v: sus, color: '#f59e0b' }  // amarillo
    ];

    ctx.clearRect(0,0,canvas.width, canvas.height);
    const cx = canvas.width/2, cy = canvas.height/2, r = Math.min(cx,cy)-6;
    let ang = -Math.PI/2;

    parts.forEach(p=>{
      const a = (p.v/total)*Math.PI*2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, ang, ang+a, false);
      ctx.lineWidth = 26;
      ctx.strokeStyle = p.color;
      ctx.stroke();
      ang += a;
    });

    // anillo interno
    ctx.beginPath();
    ctx.arc(cx, cy, r-18, 0, Math.PI*2);
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgba(255,255,255,.08)';
    ctx.stroke();
  }

  function fillTable(rows){
    results.tableBody.innerHTML = '';
    rows.forEach(r=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.name}</td>
        <td>${r.result}</td>
        <td><span class="tag ${r.label}">${r.label}</span></td>
        <td>${r.conf}%</td>
      `;
      results.tableBody.appendChild(tr);
    });
  }

  actions.scan.addEventListener('click', async ()=>{
    if (!currentFile || !currentHash) return;

    // “Progreso” breve para UX
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
    currentFile = null; currentHash = null;
    fileInput.value = '';
    show(meta.wrap, false);
    show(actions.wrap, false);
    show(results.wrap, false);
  });
})();