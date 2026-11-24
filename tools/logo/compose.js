// Group contours by character, shift each character, merge into one path.
window.charOf = (cx, cy) => (cx > 1640 ? (cy < 1760 ? 'ji' : 'ta') : (cy < 2200 ? 'hyaku' : 'hare')); // 2x coords
const fmt = (v) => (Math.round(v * 10) / 10).toString();

window.compose = (sm = {}, shifts = {}, pad = 24) => {
  const info = window.lastInfo, id = (v) => v / 2;
  const r = smoothTrace(info.d, Object.assign({ pathomit: 60, k: 6, turnDeg: 50, sigma: 4, eps: 0.6 }, sm), id, id);
  const counts = {};
  const d = r.parts.map((p) => {
    const c = charOf(p.cx, p.cy); counts[c] = (counts[c] || 0) + 1;
    const [dx, dy] = shifts[c] || [0, 0]; let k = 0;
    return p.d.replace(/-?\d+(\.\d+)?(e-?\d+)?/g, (m) => fmt(+m + (k++ % 2 ? dy : dx)));
  }).join('');
  const out = document.getElementById('out');
  out.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="${d}"/></svg>`;
  const bb = out.firstChild.firstChild.getBBox();
  const x0 = Math.floor(bb.x - pad), y0 = Math.floor(bb.y - pad), w = Math.ceil(bb.width + 2 * pad), h = Math.ceil(bb.height + 2 * pad);
  let k = 0; const d2 = d.replace(/-?\d+(\.\d+)?/g, (m) => fmt(+m - (k++ % 2 ? y0 : x0)));
  const final = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><path fill-rule="evenodd" d="${d2}"/></svg>`;
  out.innerHTML = final; window.lastSvg = final;
  return { counts, corners: r.nCorners, sub: r.nSub, w, h, kb: Math.round(final.length / 1024) };
};

// Original and new side by side at the same scale.
window.side = (px = 390) => {
  document.querySelector('.row').style.display = 'flex';
  const img = document.getElementById('src'); img.style.display = ''; img.style.width = px + 'px'; img.style.border = '0';
  document.getElementById('bin').style.display = 'none';
  const s = document.querySelector('#out svg'); s.style.width = Math.round(px * s.viewBox.baseVal.width / 1691) + 'px'; s.style.border = '0';
  scrollTo(0, 0);
};
// New one alone, big.
window.big = (px = 780) => {
  document.querySelector('.row').style.display = 'block';
  document.getElementById('src').style.display = 'none'; document.getElementById('bin').style.display = 'none';
  const s = document.querySelector('#out svg'); s.style.width = px + 'px'; s.style.border = '0'; scrollTo(0, 0);
};
window.setup = async () => {
  for (const f of ['smooth.js', 'compose.js']) if (!(f === 'smooth.js' ? window.smoothTrace : 0) || f === 'smooth.js')
    await new Promise((res, rej) => { const s = document.createElement('script'); s.src = f + '?' + Date.now(); s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  window.lastInfo = await prep({ scale: 2, blur: 4, thresh: 120 });
};
