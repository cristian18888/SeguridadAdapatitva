// Utils: mulberry32 PRNG for deterministic results from seed
function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

async function seededDetectionsFromHash(hashHex, engines) {
  const seed = parseInt(hashHex.slice(0, 8), 16) >>> 0;
  const rng = mulberry32(seed);
  return engines.map(e => {
    const p = rng();
    const detected = p < e.baseDetectionProbability;
    return {
      name: e.name,
      detected: detected,
      score: Math.round((p * 100))
    };
  });
}

// Main flow for file input element with id 'file-input' and results container 'results'
async function setupFileSimulator() {
  const input = document.getElementById('file-input');
  const results = document.getElementById('results');
  if (!input) return;
  input.addEventListener('change', async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    // Basic validations
    const maxSize = 5 * 1024 * 1024; // 5 MB limit for demo
    if (file.size > maxSize) {
      results.innerText = 'Archivo muy grande. Límite 5 MB.';
      return;
    }
    // calculate hash
    results.innerText = 'Calculando SHA-256...';
    const hash = await calculateSHA256(file);
    results.innerHTML = `<p><strong>SHA-256:</strong> <code>${hash}</code></p>`;
    // load engines and compute detections
    const resp = await fetch('/assets/data/antivirus_engines.json');
    const engines = await resp.json();
    const detections = await seededDetectionsFromHash(hash, engines);
    // render table
    let html = '<table><thead><tr><th>Motor</th><th>Detectado</th><th>Score</th></tr></thead><tbody>';
    detections.forEach(d => {
      html += `<tr><td>${d.name}</td><td>${d.detected ? 'YES' : 'NO'}</td><td>${d.score}</td></tr>`;
    });
    html += '</tbody></table>';
    results.innerHTML += html;
  });
}

// Auto-setup on DOMContentLoaded if present
document.addEventListener('DOMContentLoaded', () => {
  setupFileSimulator().catch(err => console.error(err));
});