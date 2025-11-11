// --- Variables ---
const consoleLog = document.getElementById('consoleLog');
const fileInput = document.getElementById('fileInput');
const runIaBtn = document.getElementById('runIaBtn');
const sendToDockerBtn = document.getElementById('sendToDockerBtn');
const runSandboxBtn = document.getElementById('runSandboxBtn');
const downloadReportBtn = document.getElementById('downloadReportBtn');
const resetBtn = document.getElementById('resetBtn');

const sUpload = document.getElementById('s-upload');
const sIa = document.getElementById('s-ia');
const sDocker = document.getElementById('s-docker');
const sSandbox = document.getElementById('s-sandbox');
const sReport = document.getElementById('s-report');

const containerName = document.getElementById('containerName');
const containerStatus = document.getElementById('containerStatus');
const startContainerBtn = document.getElementById('startContainerBtn');
const stopContainerBtn = document.getElementById('stopContainerBtn');

const liveView = document.getElementById('liveView');
const reportContent = document.getElementById('reportContent');

let currentFile = null;
let lastReport = null;
let container = { running: false, id: null };

// --- Funciones ---
function now() { return new Date().toLocaleTimeString(); }
function log(msg) {
  const el = document.createElement('div');
  el.className = 'log-line';
  el.innerHTML = `<span class="timestamp">${now()}</span> ${msg}`;
  consoleLog.appendChild(el);
  consoleLog.scrollTop = consoleLog.scrollHeight;
}
function setActiveStage(el) {
  [sUpload, sIa, sDocker, sSandbox, sReport].forEach(x => x.classList.remove('active'));
  el.classList.add('active');
}

// --- File Upload ---
fileInput.addEventListener('change', () => {
  if (!fileInput.files.length) return;
  currentFile = fileInput.files[0];
  log(`Archivo seleccionado: <strong>${currentFile.name}</strong> (${Math.round(currentFile.size / 1024)} KB)`);
  runIaBtn.disabled = false;
});

// --- IA ---
runIaBtn.addEventListener('click', () => {
  if (!currentFile) return;
  setActiveStage(sIa);
  runIaBtn.disabled = true;
  log('Ejecutando IA (simulada)...');

  setTimeout(() => {
    const name = currentFile.name.toLowerCase();
    let score = Math.random();
    if (/malware|trojan|virus|bad|payload|exploit/.test(name))
      score = 0.85 + Math.random() * 0.14;

    const confidence = Math.round(score * 100);
    const verdict = score > 0.6 ? (score > 0.85 ? 'malicioso' : 'sospechoso') : 'limpio';
    log(`IA: verdict = <strong>${verdict}</strong> (confianza ${confidence}%)`);
    lastReport = { file: currentFile.name, ia: { verdict, confidence } };
    sendToDockerBtn.disabled = false;
  }, 1000);
});

// --- Docker Container ---
sendToDockerBtn.addEventListener('click', () => {
  setActiveStage(sDocker);
  sendToDockerBtn.disabled = true;
  createContainer();
});

function createContainer() {
  log('Creando contenedor Docker (simulado)...');
  setTimeout(() => {
    container.id = 'ctr-' + Date.now().toString().slice(-6);
    container.running = true;
    containerName.innerText = 'Nombre: ' + container.id;
    containerStatus.innerHTML = '<span class="status-pill status-running">En ejecución</span>';
    log(`✅ Contenedor ${container.id} creado y en ejecución.`);
    runSandboxBtn.disabled = false;
  }, 1000);
}

// --- Sandboxing ---
runSandboxBtn.addEventListener('click', () => {
  setActiveStage(sSandbox);
  runSandboxBtn.disabled = true;
  log('Ejecutando sandboxing...');
  liveView.innerText = '';

  const events = [
    'Iniciando entorno aislado...',
    'Detectando llamadas sospechosas...',
    'Creación de archivo temporal...',
    'Actividad de red detectada...',
    'Intento de persistencia...',
    'Finalizando análisis...'
  ];

  let i = 0;
  const interval = setInterval(() => {
    if (i >= events.length) {
      clearInterval(interval);
      finishSandbox();
    } else {
      liveView.innerHTML += `[${now()}] ${events[i++]}<br>`;
    }
  }, 800);
});

function finishSandbox() {
  log('Analizando trazas de sandbox...');
  setTimeout(() => {
    const score = Math.random();
    const verdict = score > 0.65 ? 'malicioso' : 'limpio';
    log(`Sandbox: resultado final ${verdict}`);
    lastReport.sandbox = { verdict, timestamp: new Date().toISOString() };
    reportContent.innerHTML = `<pre>${JSON.stringify(lastReport, null, 2)}</pre>`;
    downloadReportBtn.disabled = false;
    setActiveStage(sReport);
  }, 1200);
}

// --- Descargar reporte ---
downloadReportBtn.addEventListener('click', () => {
  const data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(lastReport, null, 2));
  const link = document.createElement('a');
  link.href = data;
  link.download = `reporte_${Date.now()}.json`;
  link.click();
});

// --- Reiniciar ---
resetBtn.addEventListener('click', () => location.reload());

// --- Inicialización ---
setActiveStage(sUpload);
log('Simulador listo. Selecciona un archivo para comenzar.');