// Missed / extra ink of the traced SVG against a near-raw reference (both unshifted).
window.diffAgainst = async (ref, svg, offset, { show = true } = {}) => {
  const { W, H, scale: s } = ref;
  const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); await img.decode();
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d', { willReadFrequently: true });
  x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  x.drawImage(img, offset[0] * s, offset[1] * s, +vb[1] * s, +vb[2] * s);
  const t = x.getImageData(0, 0, W, H).data, r = ref.d.data;
  const out = new ImageData(W, H), o = out.data; let missed = 0, extra = 0, ink = 0;
  for (let i = 0; i < t.length; i += 4) {
    const R = r[i] < 128, T = t[i] < 128; if (R) ink++;
    if (R && !T) { missed++; o[i] = 230; o[i + 1] = 30; o[i + 2] = 30; }       // lost ink: red
    else if (T && !R) { extra++; o[i] = 40; o[i + 1] = 110; o[i + 2] = 230; }  // added ink: blue
    else if (T) { o[i] = o[i + 1] = o[i + 2] = 0; } else { o[i] = o[i + 1] = o[i + 2] = 255; }
    o[i + 3] = 255;
  }
  if (show) { const v = document.getElementById('bin'); v.width = W; v.height = H; v.getContext('2d').putImageData(out, 0, 0); }
  return { missedPct: +(100 * missed / ink).toFixed(2), extraPct: +(100 * extra / ink).toFixed(2) };
};
// Show the diff canvas big, scrolled to a region given in native px.
window.zoomTo = (x0, y0, px = 780) => {
  document.querySelector('.row').style.display = 'block';
  for (const id of ['src']) document.getElementById(id).style.display = 'none';
  document.getElementById('out').style.display = 'none';
  const v = document.getElementById('bin'); v.style.display = 'block'; v.style.border = '0';
  v.style.width = (px * 1691 / 600) + 'px'; // 600 native px across the pane width
  const k = px / 600; scrollTo(x0 * k, y0 * k);
};
