var Orb = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // orb-src/orb.js
  var orb_exports = {};
  __export(orb_exports, {
    create: () => create
  });

  // orb-src/thinking-orbs@0.3.2/index-B8WsUNf5.js
  function lerp(a, b, f) {
    return a + (b - a) * f;
  }
  function frac(x) {
    return x - Math.floor(x);
  }
  function vnoise(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    let fx = x - xi;
    let fy = y - yi;
    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    const a = hashD(xi, yi);
    const b = hashD(xi + 1, yi);
    const c = hashD(xi, yi + 1);
    const d = hashD(xi + 1, yi + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  function hashD(a, b) {
    const h = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
    return h - Math.floor(h);
  }
  function fibDir(i, n) {
    const golden = Math.PI * (3 - Math.sqrt(5));
    const y = 1 - 2 * (i + 0.5) / n;
    const rad = Math.sqrt(1 - y * y);
    const a = i * golden;
    return [rad * Math.cos(a), y, rad * Math.sin(a)];
  }
  function angleDelta(a, b) {
    return Math.atan2(Math.sin(a - b), Math.cos(a - b));
  }
  function makeProj(yaw, tilt, cx, cy, scale) {
    const st = Math.sin(tilt);
    const ct = Math.cos(tilt);
    const sy = Math.sin(yaw);
    const cyw = Math.cos(yaw);
    return (x, y, z) => {
      const x1 = x * cyw + z * sy;
      const z1 = -x * sy + z * cyw;
      const y1 = y * ct - z1 * st;
      const z2 = y * st + z1 * ct;
      return [cx + x1 * scale, cy - y1 * scale, z2];
    };
  }
  function inkColor(w, alpha, dark, tint) {
    if (!tint) {
      const g = Math.round((dark ? 1 - w : w) * 255);
      return `rgba(${g},${g},${g},${alpha})`;
    }
    const ramp = (c) => Math.round(dark ? c * (1 - w) : c + (255 - c) * w);
    return `rgba(${ramp(tint.r)},${ramp(tint.g)},${ramp(tint.b)},${alpha})`;
  }
  function paint(ctx, dots, dark, rMin = 0.3, tint) {
    for (const d of dots) {
      const alpha = d.a ?? 1;
      const w = Math.min(1, Math.max(0, d.white));
      ctx.fillStyle = inkColor(w, alpha, dark, tint);
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  function paintLines(ctx, lines, dark, tint) {
    for (const l of lines) {
      const alpha = l.a ?? 1;
      const w = Math.min(1, Math.max(0, l.white));
      ctx.strokeStyle = inkColor(w, alpha, dark, tint);
      ctx.lineWidth = l.w;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
    }
  }
  function finalizeFrame(dots, lines, rMin = 0.3) {
    const visible = [];
    for (const d of dots) {
      if ((d.a ?? 1) < 0.02) continue;
      d.r = Math.max(rMin, d.r);
      visible.push(d);
    }
    visible.sort((a, b) => a.z - b.z);
    return { dots: visible, lines: lines.filter((l) => (l.a ?? 1) >= 0.02) };
  }
  function paintFrame(ctx, frame2, dark, tint) {
    if (frame2.lines.length) paintLines(ctx, frame2.lines, dark, tint);
    paint(ctx, frame2.dots, dark, 0.3, tint);
  }
  function radiusScale(size, pow) {
    return (size / 300) ** pow;
  }
  var COUNT_PAIRS = [
    ["latRings", "lonDensity"],
    ["rings", "lonDensity"],
    ["lanes", "segs"]
  ];
  var COUNT_KEYS = ["orbitN", "ghostN", "nodeN", "strandN", "signals"];
  var ICON_DENSITY_KEYS = ["iconD"];
  var RADIUS_KEYS = [
    "rBase",
    "rDepth",
    "rActive",
    "rDot",
    "ghostR",
    "partR",
    "partRDepth",
    "nodeR",
    "nodeRDepth"
  ];
  function scaleCounts(opts, scale) {
    const out = { ...opts };
    const done = /* @__PURE__ */ new Set();
    const rt = Math.sqrt(scale);
    for (const [a, b] of COUNT_PAIRS) {
      const va = out[a];
      const vb = out[b];
      if (va != null && vb != null && !done.has(a) && !done.has(b)) {
        out[a] = Math.max(2, Math.round(va * rt));
        out[b] = Math.max(2, Math.round(vb * rt));
        done.add(a);
        done.add(b);
      }
    }
    for (const k of COUNT_KEYS) {
      const v = out[k];
      if (v != null && v !== 0 && !done.has(k)) out[k] = Math.max(1, Math.round(v * scale));
    }
    for (const k of ICON_DENSITY_KEYS) {
      const v = out[k];
      if (v != null) out[k] = Math.max(0.02, v * scale);
    }
    return out;
  }
  function scaleRadii(opts, scale) {
    const out = { ...opts };
    for (const k of RADIUS_KEYS) {
      const v = out[k];
      if (v != null) out[k] = v * scale;
    }
    out.rSizeMul = (out.rSizeMul ?? 1) * scale;
    return out;
  }
  var BASE_PROFILES = {
    globe: {
      latRings: 17,
      lonDensity: 44,
      rBase: 0.6,
      rDepth: 1.7,
      rBoost: 1,
      inkFar: 0.62,
      inkSpan: 0.54,
      rsPow: 0.6,
      rMin: 0.3
    },
    orbits: {
      orbitN: 12,
      ghostN: 40,
      ghostR: 0.9,
      ghostA: 0.5,
      particles: 3,
      partR: 1.2,
      partRDepth: 1.6,
      rsPow: 0.6,
      rMin: 0.3
    },
    rubik: {
      latRings: 15,
      lonDensity: 40,
      moveCount: 14,
      rBase: 0.6,
      rDepth: 1.7,
      rActive: 0.3,
      inkFar: 0.62,
      inkSpan: 0.54,
      rsPow: 0.6,
      rMin: 0.3
    },
    wave: {
      rings: 15,
      lonDensity: 40,
      rBase: 0.6,
      rDepth: 1.7,
      rsPow: 0.6,
      rMin: 0.3
    },
    web: {
      nodeN: 30,
      thr: 0.72,
      signals: 5,
      nodeR: 1.4,
      nodeRDepth: 1.8,
      lineW: 0.8,
      rsPow: 0.6,
      rMin: 0.3
    },
    braid: {
      strandN: 52,
      turns: 3,
      ghostN: 150,
      rBase: 1.2,
      rDepth: 1.8,
      rsPow: 0.6,
      rMin: 0.3
    },
    ribbon: {
      lanes: 5,
      segs: 88,
      ghostN: 150,
      rBase: 1.1,
      rDepth: 1.7,
      rsPow: 0.6,
      rMin: 0.3
    },
    // ring shares ribbon's painter; faceOn cancels the camera tilt and moves
    // the undulation onto the radius, and there is no ghost sphere behind it
    ring: {
      lanes: 5,
      segs: 88,
      ghostN: 0,
      faceOn: 1,
      rBase: 1.1,
      rDepth: 1.7,
      rsPow: 0.6,
      rMin: 0.3
    },
    morph: {
      rDot: 0.021,
      iconD: 1,
      rMin: 0.25
    }
  };
  var frameBraid = (size, t, o) => {
    const cx = size / 2;
    const cy = size / 2;
    const R = size / 2 * 0.76;
    const pt = makeProj(t * 0.4, 0.3, cx, cy, 1);
    const rs = radiusScale(size, o.rsPow ?? 0.6);
    const dots = [];
    const ghostN = o.ghostN ?? 150;
    for (let i = 0; i < ghostN; i++) {
      const d = fibDir(i, ghostN);
      const [px, py, z] = pt(d[0] * R, d[1] * R, d[2] * R);
      const depth = (z / R + 1) / 2;
      dots.push({ x: px, y: py, z, r: 0.8 * rs, white: 0.78, a: 0.1 + 0.22 * depth });
    }
    const strandN = o.strandN ?? 52;
    const turns = o.turns ?? 3;
    for (let s = 0; s < 3; s++) {
      const phase = s / 3 * 2 * Math.PI;
      for (let i = 0; i < strandN; i++) {
        const u = (frac(i / strandN + t * 0.045) * 2 - 1) * 0.96;
        const surf = Math.sqrt(Math.max(0, 1 - u * u));
        const endFade = Math.min(1, (1 - Math.abs(u)) / 0.1);
        const a = u * Math.PI * turns + phase;
        const weave = 1 + 0.075 * Math.sin(u * Math.PI * turns * 2 + phase * 2 + t * 0.8);
        const rr = surf * R * weave;
        const [px, py, zr] = pt(Math.cos(a) * rr, u * R * weave, Math.sin(a) * rr);
        const depth = (zr / R + 1) / 2;
        dots.push({
          x: px,
          y: py,
          z: zr,
          r: ((o.rBase ?? 1.2) + (o.rDepth ?? 1.8) * depth) * rs,
          white: 0.55 - 0.45 * depth,
          a: endFade * (0.45 + 0.55 * depth)
        });
      }
    }
    return finalizeFrame(dots, [], o.rMin);
  };
  function solveCycle(time, count, slotDur, rest) {
    const cyc = 2 * count * slotDur + rest;
    const tc = time % cyc;
    const amount = new Array(count).fill(0);
    let active = -1;
    if (tc < 2 * count * slotDur) {
      const slot = Math.floor(tc / slotDur);
      const p = (tc - slot * slotDur) / slotDur;
      const cl = Math.min(1, p / 0.7);
      const ep = 1 - (1 - cl) ** 3;
      if (slot < count) {
        for (let i = 0; i < slot; i++) amount[i] = 1;
        amount[slot] = ep;
        active = slot;
      } else {
        const u = 2 * count - 1 - slot;
        for (let i = 0; i < u; i++) amount[i] = 1;
        amount[u] = 1 - ep;
        active = u;
      }
    }
    return { amount, active };
  }
  function applyMoves(pt3, moves, sc) {
    let [x, y, z] = pt3;
    let inActive = false;
    for (let i = 0; i < moves.length; i++) {
      if (sc.amount[i] <= 0) continue;
      const mv = moves[i];
      const coord = mv.axis === 0 ? x : mv.axis === 1 ? y : z;
      if (coord < mv.lo || coord >= mv.hi) continue;
      if (i === sc.active) inActive = true;
      const a = mv.ang * sc.amount[i];
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      if (mv.axis === 0) {
        const y2 = y * ca - z * sa;
        z = y * sa + z * ca;
        y = y2;
      } else if (mv.axis === 1) {
        const x2 = x * ca + z * sa;
        z = -x * sa + z * ca;
        x = x2;
      } else {
        const x2 = x * ca - y * sa;
        y = x * sa + y * ca;
        x = x2;
      }
    }
    return [x, y, z, inActive];
  }
  function makeMoves(count) {
    const moves = [];
    for (let i = 0; i < count; i++) {
      const axis = Math.min(2, Math.floor(hashD(i, 2.3) * 3));
      const lo = -1 + 0.5 * Math.min(3, Math.floor(hashD(i, 5.9) * 4));
      const dir = hashD(i, 7.7) < 0.5 ? 1 : -1;
      moves.push({ axis, lo, hi: lo + 0.5, ang: dir * Math.PI / 2 });
    }
    return moves;
  }
  var frameGlobe = (size, t, o) => {
    const spin = 0.5;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 * 0.82;
    const tilt = 0.4 + 0.06 * Math.sin(t * 0.35);
    const pt = makeProj(t * spin, tilt, cx, cy, radius);
    const scan = t * (spin + (1.7 - spin) * (o.scanMul ?? 1));
    const rs = radiusScale(size, o.rsPow ?? 0.6);
    const dimBase = o.dimBase ?? 1;
    const dots = [];
    const latRings = o.latRings ?? 17;
    const lonDensity = o.lonDensity ?? 44;
    for (let li = 0; li <= latRings; li++) {
      const lat = -Math.PI / 2 + li / latRings * Math.PI;
      const cosLat = Math.cos(lat);
      const sinLat = Math.sin(lat);
      const lonCount = Math.max(1, Math.round(Math.abs(cosLat) * lonDensity));
      for (let lj = 0; lj < lonCount; lj++) {
        const lon = lj / lonCount * 2 * Math.PI;
        const [px, py, z] = pt(cosLat * Math.cos(lon), sinLat, cosLat * Math.sin(lon));
        const depth = (z + 1) / 2;
        const d = angleDelta(lon + t * spin, scan);
        const boost = Math.exp(-(d * d) / 0.18) * Math.max(0, z);
        dots.push({
          x: px,
          y: py,
          z,
          r: ((o.rBase ?? 0.6) + (o.rDepth ?? 1.7) * depth + (o.rBoost ?? 1) * boost) * rs,
          white: (o.inkFar ?? 0.62) - (o.inkSpan ?? 0.54) * depth,
          // dimBase < 1 fades un-scanned dots so the meridian reads clearly
          a: dimBase + (1 - dimBase) * Math.min(1, boost)
        });
      }
    }
    return finalizeFrame(dots, [], o.rMin);
  };
  var frameRubik = (size, t, o) => {
    const cx = size / 2;
    const cy = size / 2;
    const R = size / 2 * 0.82;
    const pt = makeProj(t * 0.55, 0.35 + 0.1 * Math.sin(t * 0.9), cx, cy, R);
    const rs = radiusScale(size, o.rsPow ?? 0.6);
    const moveCount = o.moveCount ?? 14;
    const moves = makeMoves(moveCount);
    const sc = solveCycle(t, moveCount, 0.42, 1.2);
    const dots = [];
    const latRings = o.latRings ?? 15;
    const lonDensity = o.lonDensity ?? 40;
    for (let li = 0; li <= latRings; li++) {
      const lat = -Math.PI / 2 + li / latRings * Math.PI;
      const cosLat = Math.cos(lat);
      const sinLat = Math.sin(lat);
      const lonCount = Math.max(1, Math.round(Math.abs(cosLat) * lonDensity));
      for (let lj = 0; lj < lonCount; lj++) {
        const lon = lj / lonCount * 2 * Math.PI;
        const [x, y, z, inActive] = applyMoves([cosLat * Math.cos(lon), sinLat, cosLat * Math.sin(lon)], moves, sc);
        const [px, py, zr] = pt(x, y, z);
        const depth = (zr + 1) / 2;
        dots.push({
          x: px,
          y: py,
          z: zr,
          r: ((o.rBase ?? 0.6) + (o.rDepth ?? 1.7) * depth + (inActive ? o.rActive ?? 0.3 : 0)) * rs,
          white: (o.inkFar ?? 0.62) - (o.inkSpan ?? 0.54) * depth - (inActive ? 0.14 : 0)
        });
      }
    }
    return finalizeFrame(dots, [], o.rMin);
  };
  var frameWave = (size, t, o) => {
    const cx = size / 2;
    const cy = size / 2;
    const R = size / 2 * 0.874;
    const pt = makeProj(t * 0.18, 0.38, cx, cy, 1);
    const rs = radiusScale(size, o.rsPow ?? 0.6);
    const dots = [];
    const rings = o.rings ?? 15;
    const lonDensity = o.lonDensity ?? 40;
    for (let ri = 0; ri <= rings; ri++) {
      const lat = -Math.PI / 2 + ri / rings * Math.PI;
      const cosLat = Math.cos(lat);
      const sinLat = Math.sin(lat);
      const w = 0.62 * Math.sin(t * 2.1 - ri * 0.52) + 0.38 * Math.sin(t * 1.27 + ri * 0.83);
      const rr = R * (0.88 + 0.105 * w);
      const lonCount = Math.max(1, Math.round(Math.abs(cosLat) * lonDensity));
      for (let lj = 0; lj < lonCount; lj++) {
        const lon = lj / lonCount * 2 * Math.PI;
        const [px, py, z] = pt(cosLat * Math.cos(lon) * rr, sinLat * rr, cosLat * Math.sin(lon) * rr);
        const depth = (z / R + 1) / 2;
        const crest = Math.max(0, w);
        dots.push({
          x: px,
          y: py,
          z,
          r: ((o.rBase ?? 0.6) + (o.rDepth ?? 1.7) * depth) * (1 + 0.4 * crest) * rs,
          white: 0.66 - 0.56 * depth - 0.1 * crest
        });
      }
    }
    return finalizeFrame(dots, [], o.rMin);
  };
  function smoothE(x) {
    return x * x * (3 - 2 * x);
  }
  function polyPath(verts) {
    const V = verts.length;
    const L = [];
    let total = 0;
    for (let i = 0; i < V; i++) {
      const a = verts[i];
      const b = verts[(i + 1) % V];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      L.push(l);
      total += l;
    }
    return (f) => {
      let target = f * total;
      let i = 0;
      while (target > L[i] && i < V - 1) {
        target -= L[i];
        i++;
      }
      const a = verts[i];
      const b = verts[(i + 1) % V];
      const ff = L[i] ? Math.min(1, target / L[i]) : 0;
      return [a[0] + (b[0] - a[0]) * ff, a[1] + (b[1] - a[1]) * ff];
    };
  }
  var CIRCLE = (f) => {
    const a = -Math.PI / 2 + f * 2 * Math.PI;
    return [Math.cos(a) * 0.24, Math.sin(a) * 0.24];
  };
  var TRIANGLE = polyPath([
    [0, -0.26],
    [0.24, 0.16],
    [-0.24, 0.16]
  ]);
  var SQUARE = polyPath([
    [0, -0.2],
    [0.2, -0.2],
    [0.2, 0.2],
    [-0.2, 0.2],
    [-0.2, -0.2]
  ]);
  var CYCLE = [CIRCLE, TRIANGLE, SQUARE];
  function morphN(d) {
    return Math.max(6, Math.round(34 * d));
  }
  var HOLD = 1.4;
  var MORPH = 0.9;
  var SEG = HOLD + MORPH;
  var frameMorph = (size, t, o) => {
    const K = CYCLE.length;
    const tc = t % (SEG * K);
    const held = o.shape != null && o.shape >= 0 && o.shape < K ? Math.floor(o.shape) : -1;
    const k = held >= 0 ? held : Math.floor(tc / SEG);
    const local = held >= 0 ? t % SEG : tc - k * SEG;
    const m = held >= 0 ? 0 : local > HOLD ? smoothE((local - HOLD) / MORPH) : 0;
    const sprd = o.spread ?? 1;
    const pA = CYCLE[k];
    const pB = held >= 0 ? pA : CYCLE[(k + 1) % K];
    const M = 160;
    const pts = [];
    for (let i = 0; i < M; i++) {
      const f = i / M;
      const a = pA(f);
      const b = pB(f);
      pts.push([(a[0] + (b[0] - a[0]) * m) * sprd, (a[1] + (b[1] - a[1]) * m) * sprd]);
    }
    const L = [];
    let total = 0;
    for (let i = 0; i < M; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % M];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      L.push(l);
      total += l;
    }
    const n = morphN(o.iconD ?? 1);
    const re = (o.rDot ?? 0.021) * 1.35 * sprd;
    const pulse = 1 + 0.02 * Math.sin(local * 3.1);
    const dots = [];
    const c2 = size / 2;
    let seg = 0;
    let acc = 0;
    for (let k2 = 0; k2 < n; k2++) {
      const target = k2 / n * total;
      while (acc + L[seg] < target && seg < M - 1) {
        acc += L[seg];
        seg++;
      }
      const a = pts[seg];
      const b = pts[(seg + 1) % M];
      const f = L[seg] ? Math.min(1, (target - acc) / L[seg]) : 0;
      const x = (a[0] + (b[0] - a[0]) * f) * pulse;
      const y = (a[1] + (b[1] - a[1]) * f) * pulse;
      dots.push({
        x: c2 + x * size,
        y: c2 + y * size,
        z: 0,
        r: Math.max(0.35, re * size),
        white: 0.1
      });
    }
    return finalizeFrame(dots, [], o.rMin);
  };
  var frameOrbits = (size, t, o) => {
    const cx = size / 2;
    const cy = size / 2;
    const R = size / 2 * 0.82;
    const pt = makeProj(t * 0.12, 0.3, cx, cy, 1);
    const rs = radiusScale(size, o.rsPow ?? 0.6);
    const dots = [];
    const orbitN = o.orbitN ?? 12;
    const ghostN = o.ghostN ?? 40;
    const particles = o.particles ?? 3;
    for (let orb = 0; orb < orbitN; orb++) {
      const h1 = hashD(orb, 1.7);
      const h2 = hashD(orb, 5.2);
      const h3 = hashD(orb, 8.9);
      const ro = R * (0.45 + 0.52 * h1);
      const th = h1 * 2 * Math.PI;
      const phi = Math.acos(2 * h2 - 1);
      const nx = Math.sin(phi) * Math.cos(th);
      const ny = Math.cos(phi);
      const nz = Math.sin(phi) * Math.sin(th);
      let ux = -ny;
      let uy = nx;
      const uz = 0;
      const ul = Math.max(1e-6, Math.sqrt(ux * ux + uy * uy));
      ux /= ul;
      uy /= ul;
      const vx = ny * uz - nz * uy;
      const vy = nz * ux - nx * uz;
      const vz = nx * uy - ny * ux;
      const speed = (0.25 + 0.55 * h3) * (h3 > 0.5 ? 1 : -1);
      for (let k = 0; k < ghostN; k++) {
        const a = k / ghostN * 2 * Math.PI;
        const [px, py, z] = pt(
          (ux * Math.cos(a) + vx * Math.sin(a)) * ro,
          (uy * Math.cos(a) + vy * Math.sin(a)) * ro,
          (uz * Math.cos(a) + vz * Math.sin(a)) * ro
        );
        const depth = (z / ro + 1) / 2;
        dots.push({
          x: px,
          y: py,
          z,
          r: (o.ghostR ?? 0.9) * rs,
          white: 0.72,
          a: (o.ghostA ?? 0.5) * (0.4 + 0.6 * depth)
        });
      }
      for (let m = 0; m < particles; m++) {
        const a = t * speed + m / particles * 2 * Math.PI + h2 * 6;
        const [px, py, z] = pt(
          (ux * Math.cos(a) + vx * Math.sin(a)) * ro,
          (uy * Math.cos(a) + vy * Math.sin(a)) * ro,
          (uz * Math.cos(a) + vz * Math.sin(a)) * ro
        );
        const depth = (z / ro + 1) / 2;
        dots.push({
          x: px,
          y: py,
          z,
          r: ((o.partR ?? 1.2) + (o.partRDepth ?? 1.6) * depth) * rs,
          white: 0.3 - 0.22 * depth
        });
      }
    }
    return finalizeFrame(dots, [], o.rMin);
  };
  var frameRibbon = (size, t, o) => {
    const cx = size / 2;
    const cy = size / 2;
    const R = size / 2 * 0.78;
    const spin = o.spin ?? 1;
    const camTilt = 0.3;
    const pt = makeProj(t * 0.1 * spin, camTilt, cx, cy, 1);
    const rs = radiusScale(size, o.rsPow ?? 0.6);
    const dots = [];
    const ghostN = o.ghostN ?? 150;
    for (let i = 0; i < ghostN; i++) {
      const d = fibDir(i, ghostN);
      const [px, py, z] = pt(d[0] * R, d[1] * R, d[2] * R);
      const depth = (z / R + 1) / 2;
      dots.push({ x: px, y: py, z, r: 0.8 * rs, white: 0.78, a: 0.1 + 0.22 * depth });
    }
    const ya = t * 0.24 * spin;
    const ta = o.faceOn ? -camTilt : 0.55 + 0.3 * Math.sin(t * 0.18) * spin;
    const ux = Math.cos(ya);
    const uy = 0;
    const uz = Math.sin(ya);
    const vx = -uz * Math.sin(ta);
    const vy = Math.cos(ta);
    const vz = ux * Math.sin(ta);
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const wobAmp = 0.23 * (o.wobMul ?? 1);
    const baseR = o.faceOn ? R / (1 + 0.85 * wobAmp) : R;
    const baseLanes = o.lanes ?? 5;
    const segs = o.segs ?? 88;
    const lanes = Math.max(1, Math.round(baseLanes * (o.bandMul ?? 1)));
    for (let w = 0; w < lanes; w++) {
      const laneOff = (w - (lanes - 1) / 2) * 0.075;
      const edge = Math.abs(w - (lanes - 1) / 2) / Math.max(1, (lanes - 1) / 2);
      for (let k = 0; k < segs; k++) {
        const a = k / segs * 2 * Math.PI;
        const wob = (0.16 * Math.sin(a * 3 - t * 1.7 + w * 0.22) + 0.07 * Math.sin(a * 5 + t * 1.1)) * (o.wobMul ?? 1);
        const radial = o.faceOn ? 1 + wob : 1;
        const off = o.faceOn ? laneOff : laneOff + wob;
        const x = ux * Math.cos(a) + vx * Math.sin(a) + nx * off;
        const y = uy * Math.cos(a) + vy * Math.sin(a) + ny * off;
        const z = uz * Math.cos(a) + vz * Math.sin(a) + nz * off;
        const l = Math.sqrt(x * x + y * y + z * z);
        const rr = baseR * radial;
        const [px, py, zr] = pt(x / l * rr, y / l * rr, z / l * rr);
        const depth = (zr / R + 1) / 2;
        dots.push({
          x: px,
          y: py,
          z: zr,
          r: ((o.rBase ?? 1.1) + (o.rDepth ?? 1.7) * depth) * (1 - 0.25 * edge) * rs,
          white: 0.52 - 0.44 * depth + 0.18 * edge,
          a: 0.4 + 0.6 * depth
        });
      }
    }
    return finalizeFrame(dots, [], o.rMin);
  };
  var frameWeb = (size, t, o) => {
    const cx = size / 2;
    const cy = size / 2;
    const R = size / 2 * 0.8 * (o.spread ?? 1);
    const pt = makeProj(t * 0.12, 0.32, cx, cy, R);
    const rs = radiusScale(size, o.rsPow ?? 0.6);
    const nodeN = o.nodeN ?? 30;
    const thr = o.thr ?? 0.72;
    const nodeR = o.nodeR ?? 1.4;
    const nodeRDepth = o.nodeRDepth ?? 1.8;
    const nodes = [];
    for (let i = 0; i < nodeN; i++) {
      const d = fibDir(i, nodeN);
      const x = d[0] + 0.3 * (vnoise(i * 0.31 + 9, t * 0.24) - 0.5) * 2;
      const y = d[1] + 0.3 * (vnoise(i * 0.53 + 27, t * 0.21) - 0.5) * 2;
      const z = d[2] + 0.3 * (vnoise(i * 0.77 + 55, t * 0.27) - 0.5) * 2;
      const l = Math.sqrt(x * x + y * y + z * z);
      nodes.push([x / l, y / l, z / l]);
    }
    const lines = [];
    const dots = [];
    for (let i = 0; i < nodeN; i++) {
      for (let j = i + 1; j < nodeN; j++) {
        const dx = nodes[i][0] - nodes[j][0];
        const dy = nodes[i][1] - nodes[j][1];
        const dz = nodes[i][2] - nodes[j][2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist >= thr) continue;
        const [x1, y1, z1] = pt(nodes[i][0], nodes[i][1], nodes[i][2]);
        const [x2, y2, z2] = pt(nodes[j][0], nodes[j][1], nodes[j][2]);
        const depth = ((z1 + z2) / 2 + 1) / 2;
        lines.push({
          x1,
          y1,
          x2,
          y2,
          white: 0.42,
          a: (1 - dist / thr) * (0.3 + 0.55 * depth),
          w: Math.max(0.6, (o.lineW ?? 0.8) * rs)
        });
      }
    }
    for (let i = 0; i < nodeN; i++) {
      const [px, py, z] = pt(nodes[i][0], nodes[i][1], nodes[i][2]);
      const depth = (z + 1) / 2;
      const pulse = 1 + 0.25 * Math.sin(t * 1.4 + i * 2.7);
      dots.push({
        x: px,
        y: py,
        z,
        r: (nodeR + nodeRDepth * depth) * pulse * rs,
        white: 0.55 - 0.45 * depth
      });
    }
    const signals = o.signals ?? 5;
    for (let s = 0; s < signals; s++) {
      const seg = Math.floor(t * 0.55 + s * 7.31);
      const a = Math.floor(hashD(seg, s * 3.1 + 1.7) * nodeN);
      const b = Math.floor(hashD(seg, s * 5.7 + 4.2) * nodeN);
      if (a === b) continue;
      const f = frac(t * 0.55 + s * 7.31);
      const x = lerp(nodes[a][0], nodes[b][0], f);
      const y = lerp(nodes[a][1], nodes[b][1], f);
      const z = lerp(nodes[a][2], nodes[b][2], f);
      const l = Math.max(1e-6, Math.sqrt(x * x + y * y + z * z));
      const [px, py, zr] = pt(x / l, y / l, z / l);
      const depth = (zr + 1) / 2;
      dots.push({
        x: px,
        y: py,
        z: zr,
        r: (nodeR * 1.5 + nodeRDepth * depth) * rs,
        white: 0.05,
        a: 0.5 + 0.5 * depth
      });
    }
    return finalizeFrame(dots, lines, o.rMin);
  };
  var MODE_FRAMES = {
    orbits: frameOrbits,
    globe: frameGlobe,
    rubik: frameRubik,
    wave: frameWave,
    web: frameWeb,
    braid: frameBraid,
    ribbon: frameRibbon,
    // ring shares ribbon's geometry — the `faceOn` profile flag switches it
    ring: frameRibbon,
    morph: frameMorph
  };
  var MODE_DRAWS = Object.fromEntries(
    Object.entries(MODE_FRAMES).map(([key, frame2]) => [
      key,
      (ctx, size, t, dark, opts) => paintFrame(ctx, frame2(size, t, opts), dark)
    ])
  );
  var STATE_TO_MODE = {
    working: "orbits",
    searching: "globe",
    solving: "rubik",
    listening: "wave",
    connecting: "web",
    weaving: "braid",
    composing: "ribbon",
    breathing: "ring",
    shaping: "morph"
  };
  var PRESETS = {
    orbits: {
      64: { speed: 1.885, count: 1, size: 1 },
      32: { speed: 2.9072, count: 0.4251, size: 1.6849 },
      20: { speed: 3.9, count: 0.238, size: 2.4 }
    },
    globe: {
      64: { speed: 2.015, count: 0.42, size: 1.15, extra: { scanMul: 4.08, dimBase: 0.45 } },
      32: { speed: 2.3803, count: 0.1839, size: 1.4769, extra: { scanMul: 4.2301, dimBase: 0.45 } },
      20: { speed: 2.665, count: 0.105, size: 1.75, extra: { scanMul: 4.335, dimBase: 0.45 } }
    },
    rubik: {
      64: { speed: 1.82, count: 0.35, size: 1.05 },
      32: { speed: 1.8964, count: 0.1537, size: 1.4951 },
      20: { speed: 1.95, count: 0.088, size: 1.9 }
    },
    wave: {
      64: { speed: 4.388, count: 0.341, size: 1 },
      32: { speed: 4.1512, count: 0.169, size: 1.3232 },
      20: { speed: 3.998, count: 0.105, size: 1.6 }
    },
    web: {
      64: { speed: 3.315, count: 1.35, size: 0.95 },
      32: { speed: 5.0104, count: 0.4942, size: 1.2571 },
      20: { speed: 6.63, count: 0.25, size: 1.52 }
    },
    braid: {
      64: { speed: 1.625, count: 0.5, size: 1 },
      32: { speed: 2.2234, count: 0.2056, size: 1.2011 },
      20: { speed: 2.75, count: 0.1125, size: 1.36 }
    },
    ribbon: {
      64: { speed: 2.34, count: 0.25, size: 0.85, extra: { spin: 0, bandMul: 3.9, wobMul: 1 } },
      32: { speed: 2.7776, count: 0.0969, size: 0.9766, extra: { spin: 0, bandMul: 4.49, wobMul: 1 } },
      20: { speed: 3.12, count: 0.051, size: 1.073, extra: { spin: 0, bandMul: 4.94, wobMul: 1 } }
    },
    ring: {
      64: { speed: 3.24, count: 0.25, size: 0.956, extra: { spin: 0, bandMul: 3.627, wobMul: 0.368 } },
      32: { speed: 3.5517, count: 0.0678, size: 1.31, extra: { spin: 0, bandMul: 3.8265, wobMul: 0.4751 } },
      20: { speed: 3.78, count: 0.028, size: 1.622, extra: { spin: 0, bandMul: 3.968, wobMul: 0.565 } }
    },
    morph: {
      64: { speed: 2.405, count: 0.702, size: 0.395, extra: { spread: 1.45 } },
      32: { speed: 2.2057, count: 0.5937, size: 0.6916, extra: { spread: 1.45 } },
      20: { speed: 2.08, count: 0.53, size: 1.011, extra: { spread: 1.45 } }
    }
  };
  var cache = /* @__PURE__ */ new Map();
  function resolvePreset(state, size) {
    const key = `${state}-${size}`;
    const hit = cache.get(key);
    if (hit) return hit;
    const mode = STATE_TO_MODE[state];
    const preset = PRESETS[mode][size];
    let opts = { ...BASE_PROFILES[mode] };
    if (preset.count !== 1) opts = scaleCounts(opts, preset.count);
    if (preset.size !== 1) opts = scaleRadii(opts, preset.size);
    if (preset.extra) opts = { ...opts, ...preset.extra };
    const resolved = { mode, speed: preset.speed, opts };
    cache.set(key, resolved);
    return resolved;
  }

  // orb-src/aura.js
  var Aura = (() => {
    const MAX = 512, cv = document.createElement("canvas");
    cv.width = cv.height = MAX;
    const gl = cv.getContext("webgl", { premultipliedAlpha: true, alpha: true, preserveDrawingBuffer: true, antialias: false });
    if (!gl) return null;
    const vs = `attribute vec2 p;varying vec2 uv;void main(){uv=p;gl_Position=vec4(p,0.,1.);}`;
    const fs = `precision highp float;varying vec2 uv;uniform float t,energy,seed,dark;uniform vec3 c,spark;
  vec3 hash3(vec3 p){p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));return -1.+2.*fract(sin(p)*43758.5453);}
  float noise(vec3 p){vec3 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
    return mix(mix(mix(dot(hash3(i),f),dot(hash3(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),mix(dot(hash3(i+vec3(0,1,0)),f-vec3(0,1,0)),dot(hash3(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),
               mix(mix(dot(hash3(i+vec3(0,0,1)),f-vec3(0,0,1)),dot(hash3(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),mix(dot(hash3(i+vec3(0,1,1)),f-vec3(0,1,1)),dot(hash3(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z);}
  float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.02+vec3(1.7,9.2,4.1);a*=.5;}return v;}
  void main(){
    vec2 q=uv*1.12; float r=length(q);
    float ang=atan(q.y,q.x);
    float tt=t*(.18+.5*energy);
    vec3 P=vec3(q*1.35,tt+seed);
    vec2 w=vec2(fbm(P),fbm(P+vec3(5.2,1.3,2.8)));
    float f=fbm(vec3(q*1.6+1.8*w,tt*1.3+seed));
    float swirl=fbm(vec3(cos(ang+tt*.6)*r*2.,sin(ang+tt*.6)*r*2.,tt*.7+seed*2.));
    float sphere=smoothstep(1.02,.35,r);
    float core=exp(-r*r*(5.5-2.5*energy));
    float plasma=smoothstep(.02,.55,f+.25*swirl)*sphere;
    float rim=smoothstep(.55,.86,r)*smoothstep(1.,.84,r)*(.55+.45*sin(ang*3.+tt*2.+f*6.));
    float fil=pow(1.-abs(fbm(vec3(q*3.2+w*2.,tt*.9+seed*3.))*2.),6.)*sphere*smoothstep(.1,.7,r);
    float halo=exp(-max(r-.7,0.)*6.)*smoothstep(1.35,.7,r)*.35;
    vec3 hot=mix(c,vec3(1.),.55), deep=c*vec3(.5,.62,.85)+vec3(.0,.02,.06), shift=c*.72+spark*.28;   // the shift is a spark of the character's warm color, not a hue rotation (that read as violet)
    vec3 col=deep*halo+c*plasma*(.6+.5*energy)+hot*core*(.45+.4*energy)+shift*rim*energy*.9+hot*fil*(.35+.6*energy);
    float a=clamp(halo+plasma*(.5+.3*energy)+core*.7+rim*energy*.6+fil*(.3+.5*energy),0.,1.);
    if(dark<.5){
      // paper: light can't be added, only ink laid down, so the mood's dark ink mixed toward white read as gray mud. Here every
      // layer is its own premultiplied wash in a vivid version of the mood (c scaled to full brightness), the core warm, the halo thin.
      float mx=max(max(c.r,c.g),c.b), chroma=mx-min(min(c.r,c.g),c.b);
      vec3 viv=c/max(mx,.001), warm=spark;   // on paper spark carries the orb's paper color (character.json → orb.paper)
      vec3 glow=mix(mix(spark,vec3(1.),.47),viv,smoothstep(.04,.2,chroma));                 // neutral ink (rest) glows warm instead of gray
      vec3 hotL=mix(glow,warm,.35), inkL=mix(mix(glow,warm,.6),c,.45*smoothstep(.04,.2,chroma));   // filaments: deeper mood, never gray
      float ap=plasma*(.16+.1*energy), ac=core*(.45+.2*energy), ah=halo*.12, ar=rim*energy*.4, af=fil*(.32+.4*energy);
      vec3 pm=glow*ap+hotL*ac+glow*ah+mix(glow,warm,.5)*ar+inkL*af;
      a=clamp(ap+ac+ah+ar+af,0.,1.);
      gl_FragColor=vec4(min(pm,vec3(a)),a);
      return;
    }
    gl_FragColor=vec4(col*a,a);
  }`;
    const sh = (type, src) => {
      const x = gl.createShader(type);
      gl.shaderSource(x, src);
      gl.compileShader(x);
      if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(x));
        return null;
      }
      return x;
    };
    const pr = gl.createProgram(), v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    gl.attachShader(pr, v);
    gl.attachShader(pr, f);
    gl.linkProgram(pr);
    gl.useProgram(pr);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {};
    ["t", "energy", "seed", "dark", "c", "spark"].forEach((k) => U[k] = gl.getUniformLocation(pr, k));
    gl.clearColor(0, 0, 0, 0);
    return { render(ctx, px, { t, energy, seed, dark, tint, spark }) {
      const n = Math.min(MAX, Math.max(64, Math.round(px * 0.5)));
      gl.viewport(0, 0, n, n);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(U.t, t);
      gl.uniform1f(U.energy, energy);
      gl.uniform1f(U.seed, seed);
      gl.uniform1f(U.dark, dark ? 1 : 0);
      gl.uniform3f(U.c, tint.r / 255, tint.g / 255, tint.b / 255);
      gl.uniform3f(U.spark, spark.r / 255, spark.g / 255, spark.b / 255);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(cv, 0, MAX - n, n, n, 0, 0, px, px);
    } };
  })();

  // orb-src/color.js
  var rgb = (h) => {
    const n = parseInt(h.slice(1), 16);
    return { r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255 };
  };

  // orb-src/orb.js
  var BASE = 64;
  var CALM = 0.38;
  var PULSE_GAIN = 0.35;
  var ENERGY = { breathing: 0.34, listening: 0.35, weaving: 0.36, composing: 0.36, connecting: 0.37, shaping: 0.37, working: 0.38, searching: 0.38, solving: 0.38 };
  var rnd = (s) => () => (s = s * 16807 % 2147483647) / 2147483647;
  function constellation(n, k, seed) {
    const r = rnd(seed), pts = [], ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - 2 * (i + 0.5) / n, rr = Math.sqrt(1 - y * y), a = i * ga;
      pts.push([Math.cos(a) * rr, y, Math.sin(a) * rr, r() * 6.283]);
    }
    const pairs = [], seen = /* @__PURE__ */ new Set();
    pts.forEach((p, i) => {
      pts.map((q, j) => [j, (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2]).filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]).slice(0, k).forEach(([j]) => {
        const key = i < j ? i + "-" + j : j + "-" + i;
        if (!seen.has(key)) {
          seen.add(key);
          pairs.push([Math.min(i, j), Math.max(i, j), r() * 6.283]);
        }
      });
    });
    return { pts, pairs };
  }
  function frame(C, t, energy, R, cx, cy) {
    const yaw = t * (0.16 + 0.22 * energy), tilt = 0.42 + 0.12 * Math.sin(t * 0.13), cyw = Math.cos(yaw), syw = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
    const amp = 0.05 + 0.1 * energy, P = [], dots = [], lines = [];
    for (const [x0, y0, z0, ph] of C.pts) {
      const d = 1 + amp * (Math.sin(x0 * 3.1 + t * 1.05 + ph) + Math.sin(y0 * 4.3 - t * 0.83) + Math.sin(z0 * 5.2 + t * 0.61)) / 3;
      const x = x0 * d, y = y0 * d, z = z0 * d, x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y1 = y * ct - z1 * st, z2 = y * st + z1 * ct;
      const f = 3.2 / (3.2 - z2), depth = (z2 + 1) / 2;
      P.push([cx + x1 * R * f, cy + y1 * R * f, depth]);
      dots.push({ x: cx + x1 * R * f, y: cy + y1 * R * f, z: depth, r: (0.35 + 0.75 * depth) * (0.8 + 0.3 * energy), white: 0.6 * (1 - depth), a: 0.2 + 0.8 * depth * depth });
    }
    for (const [i, j, ph] of C.pairs) {
      const a = P[i], b = P[j], dep = (a[2] + b[2]) / 2, tw = 0.55 + 0.45 * Math.sin(t * (1.2 + energy) + ph);
      const al = (0.05 + 0.42 * dep * dep) * tw * (0.55 + 0.6 * energy);
      if (al < 0.03) continue;
      lines.push({ x1: a[0], y1: a[1], x2: b[0], y2: b[1], white: 0.55 * (1 - dep), a: al, w: 0.18 + 0.22 * dep });
    }
    return finalizeFrame(dots, lines);
  }
  function create({ seed = 7, spark = "#FF8A29", paper = "#FF9E61" } = {}) {
    const off = document.createElement("canvas"), o = off.getContext("2d"), cons = {}, speed = resolvePreset("breathing", BASE).speed;
    const get = (n) => cons[n] || (cons[n] = constellation(n, 3, seed * 7919 + n));
    return { draw(ctx, x, y, r, t, { state = "breathing", from = null, mix = 1, tint = "#FFFFFF", pulse = 0, wake = 1, dark = true, dens = 1 } = {}) {
      const px = Math.max(8, Math.round(r * 2 * Math.min(2, devicePixelRatio || 1)));
      if (off.width !== px || off.height !== px) {
        off.width = off.height = px;
      }
      const c = rgb(tint), p = Math.min(1, pulse) * PULSE_GAIN, en = Math.min(CALM, ENERGY[state] ?? 0.35), clock = t * speed * (1 + 0.05 * p);
      o.setTransform(1, 0, 0, 1, 0, 0);
      o.clearRect(0, 0, px, px);
      if (Aura) Aura.render(o, px, { t: t + seed, energy: Math.min(CALM + 0.06, en * (0.4 + 0.6 * wake) + 0.16 * p), seed, dark, tint: c, spark: rgb(dark ? spark : paper) });
      if (wake < 1) {
        o.globalCompositeOperation = "destination-in";
        o.fillStyle = `rgba(0,0,0,${wake})`;
        o.fillRect(0, 0, px, px);
        o.globalCompositeOperation = "source-over";
      }
      const breath = 1 + 0.025 * Math.sin(t * (0.7 + 0.5 * en)) * (0.6 + en) + 0.03 * p, grow = 0.55 + 0.45 * wake, s = px / BASE * 0.86 * breath * grow, sh = px * (1 - 0.86 * breath * grow) / 2;
      o.setTransform(s, 0, 0, s, sh, sh);
      const light = (v) => Math.round(Math.min(255, v * 0.35 + 255 * 0.65)), dot = dark ? { r: light(c.r), g: light(c.g), b: light(c.b) } : c;
      const full = r * 2 > 260 ? 110 : r * 2 > 150 ? 80 : 48, n = Math.max(12, Math.round((18 + (full - 18) * dens) / 4) * 4);
      o.globalAlpha = wake;
      paintFrame(o, frame(get(n), clock * 0.8 + seed, Math.min(CALM + 0.06, en + 0.14 * p), BASE * 0.43, BASE / 2, BASE / 2), dark, dot);
      const cs = 0.58, co = BASE * (1 - cs) / 2;
      o.transform(cs, 0, 0, cs, co, co);
      const core = (st) => {
        const { mode, opts } = resolvePreset(st, BASE);
        return MODE_FRAMES[mode](BASE, clock, opts);
      };
      if (from && mix < 1) {
        o.globalAlpha = (1 - mix) * wake * 0.7;
        paintFrame(o, core(from), dark, dot);
      }
      o.globalAlpha = (from && mix < 1 ? mix : 1) * wake * 0.7;
      paintFrame(o, core(state), dark, dot);
      o.globalAlpha = 1;
      ctx.drawImage(off, x - r, y - r, r * 2, r * 2);
    } };
  }
  return __toCommonJS(orb_exports);
})();
