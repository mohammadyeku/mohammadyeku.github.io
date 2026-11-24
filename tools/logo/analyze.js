// Connected components on the binary image, grouped by character, with weight + spacing stats.
window.components = (info) => {
  const { d, W, H } = info, p = d.data, lab = new Int32Array(W * H).fill(-1), comps = [];
  const blk = (i) => p[i * 4] === 0;
  const st = new Int32Array(W * H);
  for (let s = 0; s < W * H; s++) {
    if (!blk(s) || lab[s] >= 0) continue;
    const id = comps.length; let top = 0, area = 0, per = 0, sx = 0, sy = 0, x0 = W, y0 = H, x1 = 0, y1 = 0; const edge = [];
    st[top++] = s; lab[s] = id;
    while (top) {
      const i = st[--top], x = i % W, y = (i / W) | 0; area++; sx += x; sy += y;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      let isEdge = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) { isEdge = true; continue; }
        const j = ny * W + nx;
        if (!blk(j)) { isEdge = true; per++; continue; }
        if (lab[j] < 0) { lab[j] = id; st[top++] = j; }
      }
      if (isEdge) edge.push(i);
    }
    comps.push({ id, area, per, cx: sx / area, cy: sy / area, bb: [x0, y0, x1, y1], edge });
  }
  return { comps, lab };
};

window.analyze = (info) => {
  const { comps } = components(info), W = info.W, s = info.scale;
  const chars = {};
  for (const c of comps) {
    if (c.area < 200) continue;
    c.char = charOf(c.cx, c.cy);
    const k = c.char; (chars[k] ||= { area: 0, per: 0, comps: [], edge: [], bb: [1e9, 1e9, 0, 0] });
    const g = chars[k]; g.area += c.area; g.per += c.per; g.comps.push(c); g.edge.push(...c.edge.filter((_, i) => i % 3 === 0));
    g.bb = [Math.min(g.bb[0], c.bb[0]), Math.min(g.bb[1], c.bb[1]), Math.max(g.bb[2], c.bb[2]), Math.max(g.bb[3], c.bb[3])];
  }
  const out = {};
  for (const [k, g] of Object.entries(chars)) out[k] = {
    weight: +(2 * g.area / g.per / s).toFixed(1), // ~ mean stroke width, native px
    ink: +(g.area / ((g.bb[2] - g.bb[0]) * (g.bb[3] - g.bb[1]))).toFixed(3),
    bb: g.bb.map((v) => Math.round(v / s)),
    comps: g.comps.map((c) => ({ id: c.id, area: Math.round(c.area / s / s), w: +(2 * c.area / c.per / s).toFixed(1), bb: c.bb.map((v) => Math.round(v / s)) })),
  };
  const names = Object.keys(chars), gaps = {};
  for (let a = 0; a < names.length; a++) for (let b = a + 1; b < names.length; b++) {
    const A = chars[names[a]].edge, B = chars[names[b]].edge; let m = 1e9;
    for (const i of A) { const ax = i % W, ay = (i / W) | 0; for (const j of B) { const dx = ax - j % W; if (dx > m || -dx > m) continue; const dy = ay - ((j / W) | 0); const dd = dx * dx + dy * dy; if (dd < m * m) m = Math.sqrt(dd); } }
    gaps[names[a] + '-' + names[b]] = Math.round(m / s);
  }
  return { chars: out, gaps };
};
