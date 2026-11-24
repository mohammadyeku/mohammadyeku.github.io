// Rebuild: per-component stroke weight, star replacement, per-character shifts.
(() => {
  const erf = (x) => { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
  const Phi = (x) => 0.5 * (1 + erf(x / Math.SQRT2));
  const PhiInv = (p) => { let lo = -8, hi = 8; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (Phi(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; };

  // Grey (blurred) copy of the source at the same scale as info.
  async function grey(info, blur) {
    const img = document.getElementById('src'), c = document.createElement('canvas'); c.width = info.W; c.height = info.H;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    x.filter = `grayscale(1) blur(${blur * info.scale}px)`; x.drawImage(img, 0, 0, c.width, c.height);
    const d = x.getImageData(0, 0, c.width, c.height).data, g = new Uint8Array(c.width * c.height);
    for (let i = 0; i < g.length; i++) g[i] = d[i * 4];
    return g;
  }

  // opts: { baseThresh, blur, target, strength, shifts:{char:[dx,dy]} (native px), starK, starIds:[...] }
  window.rebuild = async (opts) => {
    const info = window.lastInfo, { W, H, scale: s } = info;
    const sigma = opts.blur * s, base = PhiInv(opts.baseThresh / 255);
    const G = await grey(info, opts.blur);
    const { comps, lab } = components(info);
    const big = comps.filter((c) => c.area > 200);
    for (const c of big) c.char = charOf(c.cx, c.cy);
    // per-component threshold from weight correction
    const thr = new Float64Array(comps.length).fill(opts.baseThresh), info2 = [];
    for (const c of big) {
      const w = 2 * c.area / c.per / s, isStar = opts.starIds.includes(c.id);
      const perSide = isStar ? 0 : ((opts.target - w) / 2) * opts.strength; // native px
      thr[c.id] = 255 * Phi(base + (perSide * s) / sigma);
      info2.push({ id: c.id, char: c.char, w: +w.toFixed(1), perSide: +perSide.toFixed(2), t: Math.round(thr[c.id]) });
    }
    // grow labels outward so dilation has room (multi-source BFS)
    const R = Math.ceil(4 * s) + 6, own = Int32Array.from(lab), dist = new Uint8Array(W * H);
    let frontier = []; for (let i = 0; i < W * H; i++) if (own[i] >= 0) frontier.push(i);
    for (let step = 1; step <= R && frontier.length; step++) {
      const next = [];
      for (const i of frontier) { const x = i % W, y = (i / W) | 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const j = ny * W + nx; if (own[j] < 0) { own[j] = own[i]; dist[j] = step; next.push(j); } } }
      frontier = next;
    }
    // compose shifted binary, stars removed
    const out = new ImageData(W, H), o = out.data; o.fill(255);
    const shiftOf = {}; for (const c of big) { const sh = (opts.shifts[c.char] || [0, 0]); shiftOf[c.id] = [Math.round(sh[0] * s), Math.round(sh[1] * s)]; }
    for (let i = 0; i < W * H; i++) {
      const L = own[i]; if (L < 0 || shiftOf[L] === undefined || opts.starIds.includes(L)) continue;
      if (G[i] >= thr[L]) continue;
      const x = i % W + shiftOf[L][0], y = ((i / W) | 0) + shiftOf[L][1]; if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const j = (y * W + x) * 4; o[j] = o[j + 1] = o[j + 2] = 0;
    }
    for (let j = 3; j < o.length; j += 4) o[j] = 255;
    // stars: geometric, at original centre/size, shifted with their character (native coords)
    const stars = [];
    for (const id of opts.starIds) {
      const c = comps[id], sh = opts.shifts[c.char] || [0, 0];
      const [x0, y0, x1, y1] = c.bb.map((v) => v / s), cx = (x0 + x1) / 2 + sh[0];
      const split = (opts.doubleStars || []).includes(id);
      if (split) { const h = (y1 - y0) / 2; for (const cy of [y0 + h / 2, y1 - h / 2]) stars.push({ cx, cy: cy + sh[1], rx: (x1 - x0) / 2, ry: h / 2 }); }
      else stars.push({ cx, cy: (y0 + y1) / 2 + sh[1], rx: (x1 - x0) / 2, ry: (y1 - y0) / 2 });
    }
    window.lastInfo2 = Object.assign({}, info, { d: out, bbox: info.bbox });
    window.lastStars = stars;
    return info2;
  };

  window.starPath = ({ cx, cy, rx, ry }, k, X = (v) => v, Y = (v) => v) => {
    const r = Math.min(rx, ry), kx = k * r, ky = k * r, f = (v) => (Math.round(v * 10) / 10);
    const P = (x, y) => `${f(X(x))} ${f(Y(y))}`;
    return `M${P(cx, cy - ry)}Q${P(cx + kx, cy - ky)} ${P(cx + rx, cy)}Q${P(cx + kx, cy + ky)} ${P(cx, cy + ry)}Q${P(cx - kx, cy + ky)} ${P(cx - rx, cy)}Q${P(cx - kx, cy - ky)} ${P(cx, cy - ry)}Z`;
  };

  // Trace lastInfo2 + add stars, one evenodd path, cropped. Reuses compose() machinery.
  window.composeRebuilt = (sm = {}, pad = 24, k = 0.2) => {
    const keep = window.lastInfo; window.lastInfo = window.lastInfo2;
    const r = smoothTrace(lastInfo.d, Object.assign({ pathomit: 60, k: 20, turnDeg: 58, sigma: 14, eps: 1.5 }, sm), (v) => v / 2, (v) => v / 2);
    window.lastInfo = keep;
    const d = r.parts.map((p) => p.d.replace(/-?\d+(\.\d+)?(e-?\d+)?/g, (m) => (Math.round(+m * 10) / 10).toString())).join('') + lastStars.map((st) => starPath(st, k)).join('');
    const outEl = document.getElementById('out');
    outEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="${d}"/></svg>`;
    const bb = outEl.firstChild.firstChild.getBBox();
    const x0 = Math.floor(bb.x - pad), y0 = Math.floor(bb.y - pad), w = Math.ceil(bb.width + 2 * pad), h = Math.ceil(bb.height + 2 * pad);
    let i = 0; const d2 = d.replace(/-?\d+(\.\d+)?/g, (m) => (Math.round((+m - (i++ % 2 ? y0 : x0)) * 10) / 10).toString());
    const final = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><path fill-rule="evenodd" d="${d2}"/></svg>`;
    outEl.innerHTML = final; window.lastSvg = final;
    return { w, h, kb: Math.round(final.length / 1024), sub: r.nSub };
  };
})();
