// Contour smoothing with corner preservation -> cubic Bezier SVG path.
(() => {
  const rd = (v) => Math.round(v * 10) / 10;

  function contours(imgd, pathomit) {
    const o = Object.assign({}, ImageTracer.optionpresets.default, {
      colorsampling: 0, numberofcolors: 2, colorquantcycles: 1, mincolorratio: 0, blurradius: 0,
      pal: [{ r: 0, g: 0, b: 0, a: 255 }, { r: 255, g: 255, b: 255, a: 255 }], pathomit, rightangleenhance: false,
    });
    const ii = ImageTracer.colorquantization(imgd, o);
    const ls = ImageTracer.layering(ii);
    const ps = ImageTracer.pathscan(ls[0], pathomit);
    const ins = ImageTracer.internodes(ps, o);
    return ins.map((p) => p.points.map((q) => ({ x: q.x, y: q.y })));
  }

  // Indices of sharp corners on a closed polyline.
  function corners(P, k, minTurnDeg) {
    const n = P.length, turn = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const a = P[(i - k + n) % n], b = P[i], c = P[(i + k) % n];
      const v1x = b.x - a.x, v1y = b.y - a.y, v2x = c.x - b.x, v2y = c.y - b.y;
      const d = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y);
      turn[i] = d ? Math.acos(Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / d))) : 0;
    }
    const thr = (minTurnDeg * Math.PI) / 180, out = [];
    for (let i = 0; i < n; i++) {
      if (turn[i] < thr) continue;
      let isMax = true;
      for (let j = -k; j <= k && isMax; j++) if (j && turn[(i + j + n) % n] > turn[i]) isMax = false;
      if (isMax && (!out.length || i - out[out.length - 1] > k)) out.push(i);
    }
    if (out.length > 1 && out[0] + n - out[out.length - 1] <= k) out.pop();
    return out;
  }

  function gauss(sigma) {
    const r = Math.ceil(sigma * 2.5), w = [];
    for (let i = -r; i <= r; i++) w.push(Math.exp(-(i * i) / (2 * sigma * sigma)));
    return { r, w };
  }

  // Smooth an open run, endpoints fixed; weights taper near the ends.
  function smoothOpen(R, g) {
    const n = R.length, out = R.map((p) => ({ ...p }));
    for (let i = 1; i < n - 1; i++) {
      const r = Math.min(g.r, i, n - 1 - i);
      let sx = 0, sy = 0, sw = 0;
      for (let j = -r; j <= r; j++) { const w = g.w[j + g.r]; sx += R[i + j].x * w; sy += R[i + j].y * w; sw += w; }
      out[i] = { x: sx / sw, y: sy / sw };
    }
    return out;
  }
  function smoothClosed(R, g) {
    const n = R.length;
    return R.map((_, i) => {
      let sx = 0, sy = 0, sw = 0;
      for (let j = -g.r; j <= g.r; j++) { const p = R[(i + j + n * 4) % n], w = g.w[j + g.r]; sx += p.x * w; sy += p.y * w; sw += w; }
      return { x: sx / sw, y: sy / sw };
    });
  }

  function rdp(P, eps) {
    if (P.length < 3) return P;
    const keep = new Uint8Array(P.length); keep[0] = keep[P.length - 1] = 1;
    const st = [[0, P.length - 1]];
    while (st.length) {
      const [a, b] = st.pop(); let md = 0, mi = -1;
      const ax = P[a].x, ay = P[a].y, dx = P[b].x - ax, dy = P[b].y - ay, L = Math.hypot(dx, dy);
      for (let i = a + 1; i < b; i++) { const d = L ? Math.abs((P[i].x - ax) * dy - (P[i].y - ay) * dx) / L : Math.hypot(P[i].x - ax, P[i].y - ay); if (d > md) { md = d; mi = i; } }
      if (md > eps) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
    }
    return P.filter((_, i) => keep[i]);
  }

  // Catmull-Rom through points -> cubic segments. Open run: one-sided tangents at ends.
  function bez(P, closed, T) {
    const n = P.length, segs = [];
    const get = (i) => closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))];
    const m = closed ? n : n - 1;
    for (let i = 0; i < m; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      const t = T / 6;
      segs.push([p1.x + (p2.x - p0.x) * t, p1.y + (p2.y - p0.y) * t, p2.x - (p3.x - p1.x) * t, p2.y - (p3.y - p1.y) * t, p2.x, p2.y]);
    }
    return segs;
  }

  window.smoothTrace = (imgd, o, X, Y) => {
    const { pathomit = 60, k = 5, turnDeg = 55, sigma = 3, eps = 0.8, tension = 1 } = o;
    const g = gauss(sigma);
    const parts = []; let d = '', nCorners = 0, nSub = 0;
    for (const P of contours(imgd, pathomit)) {
      if (P.length < 8) continue;
      d = ''; let cx = 0, cy = 0; for (const q of P) { cx += q.x; cy += q.y; } cx /= P.length; cy /= P.length;
      const C = corners(P, k, turnDeg); nCorners += C.length; nSub++;
      if (!C.length) {
        const S = rdp(smoothClosed(P, g).concat([]), eps);
        // rdp on closed: drop duplicate end
        const segs = bez(S, true, tension);
        parts.push({ cx, cy, d: `M${X(S[0].x)} ${Y(S[0].y)}` + segs.map((s) => `C${X(s[0])} ${Y(s[1])} ${X(s[2])} ${Y(s[3])} ${X(s[4])} ${Y(s[5])}`).join('') + 'Z' });
        continue;
      }
      const n = P.length; let first = true;
      for (let c = 0; c < C.length; c++) {
        const a = C[c], b = C[(c + 1) % C.length];
        const run = []; for (let i = a; ; i = (i + 1) % n) { run.push(P[i]); if (i === b && run.length > 1) break; }
        const S = rdp(smoothOpen(run, g), eps);
        if (first) { d += `M${X(S[0].x)} ${Y(S[0].y)}`; first = false; }
        if (S.length === 2) { d += `L${X(S[1].x)} ${Y(S[1].y)}`; continue; }
        d += bez(S, false, tension).map((s) => `C${X(s[0])} ${Y(s[1])} ${X(s[2])} ${Y(s[3])} ${X(s[4])} ${Y(s[5])}`).join('');
      }
      parts.push({ cx, cy, d: d + 'Z' });
    }
    return { parts, nCorners, nSub };
  };
})();
