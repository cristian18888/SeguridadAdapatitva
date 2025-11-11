// Simple worker-like simulation (not a real Worker file; used inline if needed)
self.addEventListener('message', async (e) => {
  const { action, payload } = e.data;
  if (action === 'simulate') {
    // simulate steps with delays
    const steps = [
      { name: 'hashing', delay: 400 },
      { name: 'static-analysis', delay: 600 },
      { name: 'sandboxing', delay: 1200 },
      { name: 'report', delay: 300 }
    ];
    for (const s of steps) {
      await new Promise(r => setTimeout(r, s.delay));
      self.postMessage({ step: s.name });
    }
    self.postMessage({ done: true, result: payload });
  }
});