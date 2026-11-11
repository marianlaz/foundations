/*
 * Motor de orbes — el lenguaje de partículas de "Orbe Cian", reusable.
 *
 *   var o = Orbe.create(canvas, { hue: 187, form: 'orb', seed: 'vigia' });
 *   o.set({ hue: 265 });   // cambia en caliente
 *   o.destroy();
 *
 * Script clásico: espera THREE r128 ya cargado (cdnjs). Si no hay THREE o WebGL,
 * create() tira un Error con code 'SIN_WEBGL' para que la página muestre su aviso.
 *
 * Las cuatro formas son las del Akasha:
 *   orb      generalista          anillos de birome + nube (Orbe Cian, tal cual)
 *   ring     vigía / monitor      un disco ecuatorial de surcos finos, dos halos y nube tenue
 *   crystal  analista / investig. un icosaedro: el trazo corre por las aristas, las caras se iluminan
 *   star     ejecutor / hacedor   rayos que salen del núcleo con pulsos que viajan hacia afuera
 */
(function (global) {
  'use strict';

  var FORMAS = ['orb', 'ring', 'crystal', 'star'];
  var TONO_CIAN = 187;

  // ---------- azar con semilla ----------
  // Mismo nombre, mismo orbe: la semilla (texto o número) se hashea y alimenta un mulberry32.
  function hashTexto(s) {
    var h = 1779033703 ^ s.length;
    for (var i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }
  function crearAzar(semilla) {
    if (semilla === undefined || semilla === null || semilla === '') return Math.random;
    var a = typeof semilla === 'number' && isFinite(semilla) ? (semilla >>> 0) ^ 0x9e3779b9 : hashTexto(String(semilla));
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- color ----------
  // hue 0–360 como en la ficha del Akasha. 187 es el cian canónico #00e5ff.
  function colores(hue) {
    var h = ((Math.round(hue) % 360) + 360) % 360;
    if (h === TONO_CIAN) return { base: new THREE.Color(0x00e5ff), luz: new THREE.Color(0.85, 1.0, 1.0) };
    // los azules puros se ven apagados en suma aditiva: les subo un poco la luminosidad
    var azul = Math.max(0, Math.cos((h - 245) * Math.PI / 180));
    var base = new THREE.Color().setHSL(h / 360, 1, 0.5 + 0.1 * azul * azul);
    var luz = base.clone().multiplyScalar(0.15).add(new THREE.Color(0.85, 0.85, 0.85));
    return { base: base, luz: luz };
  }

  // ---------- vectores ----------
  function dirAzar(rnd, o) {
    var z = rnd() * 2 - 1, t = rnd() * Math.PI * 2, s = Math.sqrt(1 - z * z);
    o[0] = s * Math.cos(t); o[1] = s * Math.sin(t); o[2] = z;
    return o;
  }
  function perp(a, o) {
    var h = Math.abs(a[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    var x = a[1] * h[2] - a[2] * h[1], y = a[2] * h[0] - a[0] * h[2], z = a[0] * h[1] - a[1] * h[0];
    var l = Math.hypot(x, y, z);
    o[0] = x / l; o[1] = y / l; o[2] = z / l;
    return o;
  }
  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; v[0] /= l; v[1] /= l; v[2] /= l; return v; }
  function cruz(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  // gira v alrededor del eje unitario k (Rodrigues)
  function girar(v, k, ang) {
    var c = Math.cos(ang), s = Math.sin(ang), d = (k[0] * v[0] + k[1] * v[1] + k[2] * v[2]) * (1 - c), x = cruz(k, v);
    return [v[0] * c + x[0] * s + k[0] * d, v[1] * c + x[1] * s + k[1] * d, v[2] * c + x[2] * s + k[2] * d];
  }
  function signo(rnd) { return rnd() < 0.5 ? -1 : 1; }

  // =====================================================================
  //  orb — Orbe Cian, sin cambios: mismo reparto, mismo shader.
  // =====================================================================
  var VERT_ORB = [
    'attribute vec3 aAxis;',
    'attribute vec4 aData;',
    'uniform float uTime;',
    'uniform float uSize;',
    'uniform float uMax;',
    'uniform vec3 uPointer;',
    'uniform float uForce;',
    'varying float vAlpha;',
    'varying float vHot;',
    'void main() {',
    '  float seed = aData.w;',
    '  float ang = aData.x + uTime * aData.y;',
    '  float r = aData.z * (1.0 + 0.07 * sin(ang * 3.0 + uTime * 0.6 + seed * 40.0))',
    '          * (1.0 + 0.035 * sin(uTime * 0.45));',
    '  vec3 p = (position * cos(ang) + cross(aAxis, position) * sin(ang)) * r;',
    '  p += aAxis * 0.05 * sin(ang * 2.0 + seed * 90.0 + uTime * 0.3);',
    '  vec4 wp = modelMatrix * vec4(p, 1.0);',
    '  vec3 d = wp.xyz - uPointer;',
    '  float f = uForce / (1.0 + dot(d, d) * 7.0);',
    '  wp.xyz += normalize(d + 0.0001) * f * 0.4;',
    '  vec4 mv = viewMatrix * wp;',
    '  gl_Position = projectionMatrix * mv;',
    '  float trazo = step(0.5, seed);',
    '  float tw = 0.65 + 0.35 * sin(uTime * 1.7 + seed * 300.0);',
    '  float prof = max(-mv.z, 0.001);',
    '  gl_PointSize = min(uSize * (0.75 + trazo * 0.55 + fract(seed * 17.0) * 0.6) / prof, uMax);',
    '  vAlpha = (0.2 + trazo * 0.3) * tw * smoothstep(0.04, 0.45, prof);',
    '  vHot = f + trazo * 0.25;',
    '}'
  ].join('\n');

  function construirOrb(N, rnd) {
    var ANILLOS = 44, N_ANILLO = Math.floor(N * 0.38);
    var base = new Float32Array(N * 3), eje = new Float32Array(N * 3), data = new Float32Array(N * 4);
    var anillos = [];
    for (var r = 0; r < ANILLOS; r++) {
      var a = dirAzar(rnd, [0, 0, 0]);
      anillos.push({ a: a, rad: 0.72 + rnd() * 0.5, vel: (0.12 + rnd() * 0.3) * signo(rnd) });
    }
    var ta = [0, 0, 0], tu = [0, 0, 0];
    for (var i = 0; i < N; i++) {
      var fase = rnd() * Math.PI * 2, vel, rad, seed = rnd();
      if (i < N_ANILLO) {
        var g = anillos[i % ANILLOS];
        // leve desvío del eje para que el trazo tenga grosor, como una línea de birome
        ta[0] = g.a[0] + (rnd() - 0.5) * 0.05;
        ta[1] = g.a[1] + (rnd() - 0.5) * 0.05;
        ta[2] = g.a[2] + (rnd() - 0.5) * 0.05;
        norm(ta); perp(ta, tu);
        rad = g.rad + (rnd() - 0.5) * 0.03;
        vel = g.vel * (0.97 + rnd() * 0.06);
        seed = seed * 0.5 + 0.5; // semilla alta = trazo, más brillante
      } else {
        dirAzar(rnd, ta); perp(ta, tu);
        rad = 0.25 + Math.pow(rnd(), 0.3) * 0.8;
        vel = (0.04 + rnd() * 0.16) * signo(rnd);
        seed = seed * 0.5;
      }
      eje.set(ta, i * 3); base.set(tu, i * 3);
      data[i * 4] = fase; data[i * 4 + 1] = vel; data[i * 4 + 2] = rad; data[i * 4 + 3] = seed;
    }
    return { vert: VERT_ORB, attrs: { position: [base, 3], aAxis: [eje, 3], aData: [data, 4] } };
  }

  // =====================================================================
  //  Shader de las variaciones. Mismo idioma que orb (cada partícula se mueve sola
  //  en el vertex shader, misma cola de empuje/brillo), con cuatro clases de partícula:
  //    0 órbita  — gira u alrededor de aAxis, como en orb, con ondulación por partícula
  //    1 flujo   — corre de A a B y vuelve a empezar (aristas)
  //    2 vaivén  — va y viene entre A y B dentro de una cara, iluminada por su normal
  //    3 rayo    — sale del núcleo por la dirección A, con pulsos que viajan hacia afuera
  //  aData  = fase, velocidad, radio (o largo del rayo), semilla
  //  aExtra = clase, onda radial, onda sobre el eje, fase propia (rayo/arista)
  //  aNorm  = centro de la órbita (clase 0) o normal de la cara (clase 2)
  // =====================================================================
  var VERT_VAR = [
    'attribute vec3 aAxis;',
    'attribute vec4 aData;',
    'attribute vec4 aExtra;',
    'attribute vec3 aNorm;',
    'uniform float uTime;',
    'uniform float uSize;',
    'uniform float uMax;',
    'uniform vec3 uPointer;',
    'uniform float uForce;',
    'uniform float uFondo;',
    'uniform float uRespira;',
    'varying float vAlpha;',
    'varying float vHot;',
    'void main() {',
    '  float seed = aData.w;',
    '  float clase = aExtra.x;',
    '  float t = uTime;',
    '  vec3 p;',
    '  float luz = 1.0, tam = 1.0, calor = 0.0;',
    '  if (clase < 0.5) {',
    '    float ang = aData.x + t * aData.y;',
    '    float r = aData.z * (1.0 + aExtra.y * sin(ang * 3.0 + t * 0.6 + seed * 40.0));',
    '    p = (position * cos(ang) + cross(aAxis, position) * sin(ang)) * r;',
    '    p += aAxis * aExtra.z * sin(ang * 2.0 + seed * 90.0 + t * 0.3);',
    '    p += aNorm;',
    '  } else if (clase < 1.5) {',
    // arista: el punto corre a lo largo y además gira un poco alrededor de ella (grosor de birome)
    '    float s = fract(aData.x + t * aData.y);',
    '    vec3 e = aAxis - position;',
    '    p = position + e * s;',
    '    vec3 n = normalize(cross(e, position + aAxis));',
    '    vec3 m = normalize(cross(e, n));',
    '    float w = aData.x * 13.0 + t * 1.3;',
    '    p += (n * cos(w) + m * sin(w)) * aExtra.y;',
    '    float pulso = pow(0.5 + 0.5 * sin(s * 6.2832 * 2.0 - t * 1.6 + aExtra.w), 8.0);',
    '    luz = 0.7 + 0.9 * pulso;',
    '    calor = pulso * 0.35;',
    '  } else if (clase < 2.5) {',
    '    float s = 0.5 - 0.5 * cos(aData.x + t * aData.y);',
    '    p = mix(position, aAxis, s);',
    '    vec3 nw = normalize(mat3(modelMatrix) * aNorm);',
    '    float l = max(dot(nw, normalize(vec3(-0.45, 0.55, 0.70))), 0.0);',
    '    luz = 0.06 + 3.4 * l * l * l;',
    '  } else {',
    '    float s = fract(aData.x + t * aData.y);',
    '    float largo = aData.z * (0.88 + 0.12 * sin(t * 1.1 + aExtra.w));',
    '    float rr = mix(0.12, largo, s);',
    '    vec3 lado = cross(position, aAxis);',
    '    float w = seed * 314.0 + t * 0.9;',
    '    p = position * rr + (aAxis * cos(w) + lado * sin(w)) * (aExtra.y + aExtra.z * s * s);',
    '    float pulso = pow(0.5 + 0.5 * sin(s * 15.0 - t * 3.0 + aExtra.w), 6.0);',
    '    luz = (1.0 - s * 0.65) * (0.65 + 1.4 * pulso);',
    '    tam = 1.0 - s * 0.45;',
    '    calor = pulso * 0.45;',
    '  }',
    '  p *= 1.0 + uRespira * sin(t * 0.45);',
    '  vec4 wp = modelMatrix * vec4(p, 1.0);',
    '  vec3 d = wp.xyz - uPointer;',
    '  float f = uForce / (1.0 + dot(d, d) * 7.0);',
    '  wp.xyz += normalize(d + 0.0001) * f * 0.4;',
    '  vec4 mv = viewMatrix * wp;',
    '  gl_Position = projectionMatrix * mv;',
    '  float trazo = step(0.5, seed);',
    '  float tw = 0.65 + 0.35 * sin(t * 1.7 + seed * 300.0);',
    '  float prof = max(-mv.z, 0.001);',
    // lo que queda detrás del centro se apaga un poco: así se lee el volumen
    '  float centro = -(viewMatrix * modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).z;',
    '  float fondo = mix(1.0, uFondo, smoothstep(-0.9, 0.9, prof - centro));',
    '  gl_PointSize = min(uSize * (0.75 + trazo * 0.55 + fract(seed * 17.0) * 0.6) * tam / prof, uMax);',
    '  vAlpha = (0.2 + trazo * 0.3) * tw * smoothstep(0.04, 0.45, prof) * luz * fondo;',
    '  vHot = f + trazo * 0.25 + calor;',
    '}'
  ].join('\n');

  // Acumulador de partículas para las variaciones.
  function Lote(N) {
    this.N = N; this.i = 0;
    this.pos = new Float32Array(N * 3); this.eje = new Float32Array(N * 3);
    this.data = new Float32Array(N * 4); this.extra = new Float32Array(N * 4); this.nrm = new Float32Array(N * 3);
  }
  Lote.prototype.poner = function (A, B, fase, vel, rad, seed, clase, o1, o2, fp, C) {
    var i = this.i++;
    if (i >= this.N) return;
    this.pos[i * 3] = A[0]; this.pos[i * 3 + 1] = A[1]; this.pos[i * 3 + 2] = A[2];
    this.eje[i * 3] = B[0]; this.eje[i * 3 + 1] = B[1]; this.eje[i * 3 + 2] = B[2];
    this.data[i * 4] = fase; this.data[i * 4 + 1] = vel; this.data[i * 4 + 2] = rad; this.data[i * 4 + 3] = seed;
    this.extra[i * 4] = clase; this.extra[i * 4 + 1] = o1; this.extra[i * 4 + 2] = o2; this.extra[i * 4 + 3] = fp || 0;
    if (C) { this.nrm[i * 3] = C[0]; this.nrm[i * 3 + 1] = C[1]; this.nrm[i * 3 + 2] = C[2]; }
  };
  Lote.prototype.lleno = function () { return this.i >= this.N; };
  Lote.prototype.salida = function (fondo, respira) {
    return {
      vert: VERT_VAR, fondo: fondo, respira: respira,
      attrs: { position: [this.pos, 3], aAxis: [this.eje, 3], aData: [this.data, 4], aExtra: [this.extra, 4], aNorm: [this.nrm, 3] }
    };
  };
  // una partícula de nube que orbita, como las de orb
  function nube(L, rnd, rMin, rMax, curva, velMin, velMax, brillo, centro, radioK) {
    var a = dirAzar(rnd, [0, 0, 0]), u = perp(a, [0, 0, 0]);
    var rad = rMin + Math.pow(rnd(), curva) * (rMax - rMin);
    var seed = brillo ? rnd() * 0.5 + 0.5 : rnd() * 0.5;
    L.poner(u, a, rnd() * Math.PI * 2, (velMin + rnd() * (velMax - velMin)) * signo(rnd) * (radioK || 1), rad, seed, 0, 0.07, 0.05 * rad, 0, centro);
  }

  // =====================================================================
  //  ring — el vigía: un disco ecuatorial con surcos (como Saturno), dos halos inclinados.
  // =====================================================================
  function construirRing(N, rnd) {
    var L = new Lote(N);
    // eje del disco: casi vertical, inclinado hacia la cámara para que el disco se lea
    var inc = 0.42 + (rnd() - 0.5) * 0.18, az = (rnd() - 0.5) * 0.9;
    var A0 = norm(girar(girar([0, 1, 0], [1, 0, 0], inc), [0, 1, 0], az));
    var sentido = signo(rnd);

    // bandas del disco con un hueco (división) en el medio; cada banda, surcos finos
    var corte = 1.02 + (rnd() - 0.5) * 0.12;
    var bandas = [
      { a: 0.56, b: 0.74, peso: 0.18, luz: 0.55 },
      { a: 0.78, b: corte - 0.025, peso: 0.48, luz: 1.0 },
      { a: corte + 0.035, b: 1.30 + rnd() * 0.06, peso: 0.34, luz: 0.8 }
    ];
    var surcos = [];
    bandas.forEach(function (b) {
      var n = Math.round(14 * (b.b - b.a) / 0.2) + 4;
      for (var k = 0; k < n; k++) surcos.push({ rad: b.a + rnd() * (b.b - b.a), peso: b.peso / n * (0.4 + rnd()), luz: b.luz });
    });
    var total = surcos.reduce(function (s, x) { return s + x.peso; }, 0);
    surcos.forEach(function (s) { s.peso /= total; });

    var nDisco = Math.floor(N * 0.52), ta = [0, 0, 0];
    for (var k = 0; k < surcos.length; k++) {
      var s = surcos[k], cuantos = Math.round(nDisco * s.peso);
      for (var j = 0; j < cuantos; j++) {
        ta[0] = A0[0] + (rnd() - 0.5) * 0.012; ta[1] = A0[1] + (rnd() - 0.5) * 0.012; ta[2] = A0[2] + (rnd() - 0.5) * 0.012;
        var a = norm(ta.slice()), u = perp(a, [0, 0, 0]);
        var rad = s.rad + (rnd() - 0.5) * 0.008;
        var vel = sentido * 0.3 * Math.pow(rad, -1.5) * (0.98 + rnd() * 0.04); // lo de adentro gira más rápido
        // los surcos más luminosos son trazo; los apagados, polvo del disco
        var seed = rnd() < s.luz * 0.85 ? rnd() * 0.5 + 0.5 : rnd() * 0.5;
        L.poner(u, a, rnd() * Math.PI * 2, vel, rad, seed, 0, 0.006, 0.006, 0);
      }
    }
    // dos halos inclinados, finos, en sentido contrario
    var lado = perp(A0, [0, 0, 0]);
    for (var h = 0; h < 2; h++) {
      var ah = norm(girar(A0, norm(girar(lado, A0, rnd() * Math.PI)), (h ? -1 : 1) * (0.55 + rnd() * 0.3)));
      var rh = 1.4 + rnd() * 0.1, vh = -sentido * (0.1 + rnd() * 0.08), nh = Math.floor(N * 0.05);
      for (var q = 0; q < nh; q++) {
        ta[0] = ah[0] + (rnd() - 0.5) * 0.03; ta[1] = ah[1] + (rnd() - 0.5) * 0.03; ta[2] = ah[2] + (rnd() - 0.5) * 0.03;
        var a2 = norm(ta.slice());
        L.poner(perp(a2, [0, 0, 0]), a2, rnd() * Math.PI * 2, vh * (0.97 + rnd() * 0.06), rh + (rnd() - 0.5) * 0.02, rnd() < 0.6 ? rnd() * 0.5 + 0.5 : rnd() * 0.5, 0, 0.02, 0.02, 0);
      }
    }
    // núcleo chico y brillante, y la nube tenue alrededor
    var nNucleo = Math.floor(N * 0.12);
    for (var c = 0; c < nNucleo; c++) nube(L, rnd, 0.04, 0.34, 1.6, 0.12, 0.3, rnd() < 0.35);
    while (!L.lleno()) nube(L, rnd, 0.3, 1.6, 0.6, 0.03, 0.12, false);
    return L.salida(0.55, 0.03);
  }

  // =====================================================================
  //  crystal — el analista: un icosaedro. El trazo fluye por las aristas,
  //  las caras tienen polvo que se ilumina según hacia dónde miran.
  // =====================================================================
  function icosaedro() {
    var f = (1 + Math.sqrt(5)) / 2;
    var v = [[-1, f, 0], [1, f, 0], [-1, -f, 0], [1, -f, 0], [0, -1, f], [0, 1, f], [0, -1, -f], [0, 1, -f], [f, 0, -1], [f, 0, 1], [-f, 0, -1], [-f, 0, 1]];
    var aristas = [], caras = [], es = function (i, j) {
      var dx = v[i][0] - v[j][0], dy = v[i][1] - v[j][1], dz = v[i][2] - v[j][2];
      return Math.abs(dx * dx + dy * dy + dz * dz - 4) < 1e-6;
    };
    for (var i = 0; i < 12; i++) for (var j = i + 1; j < 12; j++) {
      if (!es(i, j)) continue;
      aristas.push([i, j]);
      for (var k = j + 1; k < 12; k++) if (es(i, k) && es(j, k)) caras.push([i, j, k]);
    }
    return { v: v.map(function (p) { return norm(p.slice()); }), aristas: aristas, caras: caras };
  }

  function construirCrystal(N, rnd) {
    var L = new Lote(N), ico = icosaedro(), R = 1.02;
    // cada semilla inclina el cristal distinto
    var k0 = dirAzar(rnd, [0, 0, 0]), giro = rnd() * Math.PI * 2;
    var V = ico.v.map(function (p) { var q = girar(p, k0, giro); return [q[0] * R, q[1] * R, q[2] * R]; });

    // aristas: trazo que corre de un vértice al otro, cada arista con su sentido y su ritmo
    var nArista = Math.floor(N * 0.40), porArista = Math.floor(nArista / ico.aristas.length);
    ico.aristas.forEach(function (e) {
      var a = V[e[0]], b = V[e[1]];
      if (rnd() < 0.5) { var x = a; a = b; b = x; }
      var vel = 0.05 + rnd() * 0.07, fp = rnd() * Math.PI * 2;
      for (var j = 0; j < porArista; j++) {
        var grosor = 0.003 + Math.pow(rnd(), 3) * 0.02;
        L.poner(a, b, rnd(), vel * (0.95 + rnd() * 0.1), 1, rnd() < 0.85 ? rnd() * 0.5 + 0.5 : rnd() * 0.5, 1, grosor, 0, fp);
      }
    });
    // caras: polvo que va y viene entre dos puntos de la misma cara
    var nCara = Math.floor(N * 0.34), porCara = Math.floor(nCara / ico.caras.length);
    function enCara(c) {
      var r1 = rnd(), r2 = rnd(); if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
      var a = V[c[0]], b = V[c[1]], d = V[c[2]], k = 0.985;
      return [(a[0] + r1 * (b[0] - a[0]) + r2 * (d[0] - a[0])) * k, (a[1] + r1 * (b[1] - a[1]) + r2 * (d[1] - a[1])) * k, (a[2] + r1 * (b[2] - a[2]) + r2 * (d[2] - a[2])) * k];
    }
    ico.caras.forEach(function (c) {
      var a = V[c[0]], b = V[c[1]], d = V[c[2]];
      var nrm = norm([a[0] + b[0] + d[0], a[1] + b[1] + d[1], a[2] + b[2] + d[2]]);
      for (var j = 0; j < porCara; j++) {
        L.poner(enCara(c), enCara(c), rnd() * Math.PI * 2, (0.08 + rnd() * 0.15) * signo(rnd), 1, rnd() < 0.3 ? rnd() * 0.5 + 0.5 : rnd() * 0.5, 2, 0, 0, 0, nrm);
      }
    });
    // vértices: nudos brillantes, partículas orbitando muy cerca de cada punta
    var nVert = Math.floor(N * 0.05), porVert = Math.floor(nVert / 12);
    V.forEach(function (c) {
      for (var j = 0; j < porVert; j++) {
        var a = dirAzar(rnd, [0, 0, 0]);
        L.poner(perp(a, [0, 0, 0]), a, rnd() * Math.PI * 2, (0.3 + rnd() * 0.5) * signo(rnd), 0.012 + Math.pow(rnd(), 2) * 0.05, rnd() * 0.5 + 0.5, 0, 0.1, 0.01, 0, c);
      }
    });
    // adentro, una semilla de nube como la de orb; afuera, polvo muy tenue
    var nNucleo = Math.floor(N * 0.10);
    for (var q = 0; q < nNucleo; q++) nube(L, rnd, 0.05, 0.5, 0.7, 0.06, 0.2, rnd() < 0.3);
    while (!L.lleno()) nube(L, rnd, 1.0, 1.7, 1.2, 0.02, 0.08, false);
    return L.salida(0.4, 0.025);
  }

  // =====================================================================
  //  star — el hacedor: rayos que nacen del núcleo, largos y cortos alternados,
  //  con pulsos de luz que viajan hacia afuera. Un núcleo denso con su corona de anillos.
  // =====================================================================
  function construirStar(N, rnd) {
    var L = new Lote(N);
    // direcciones de los rayos: al azar pero sin amontonarse
    var RAYOS = 26 + Math.floor(rnd() * 10), dirs = [], intentos = 0;
    while (dirs.length < RAYOS && intentos < 5000) {
      intentos++;
      var d = dirAzar(rnd, [0, 0, 0]), ok = true;
      for (var j = 0; j < dirs.length; j++) if (d[0] * dirs[j][0] + d[1] * dirs[j][1] + d[2] * dirs[j][2] > 0.86) { ok = false; break; }
      if (ok) dirs.push(d);
    }
    var nRayo = Math.floor(N * 0.56);
    var largos = dirs.map(function (_, i) { return i % 3 === 0 ? 1.4 + rnd() * 0.25 : 0.75 + rnd() * 0.45; });
    var pesoTotal = largos.reduce(function (s, x) { return s + x; }, 0);
    dirs.forEach(function (dir, i) {
      var cuantos = Math.round(nRayo * largos[i] / pesoTotal), fp = rnd() * Math.PI * 2, vel = 0.14 + rnd() * 0.1;
      var u = perp(dir, [0, 0, 0]);
      for (var q = 0; q < cuantos; q++) {
        var dj = norm([dir[0] + (rnd() - 0.5) * 0.02, dir[1] + (rnd() - 0.5) * 0.02, dir[2] + (rnd() - 0.5) * 0.02]);
        L.poner(dj, perp(dj, [0, 0, 0]), rnd(), vel * (0.9 + rnd() * 0.2), largos[i], rnd() < 0.8 ? rnd() * 0.5 + 0.5 : rnd() * 0.5,
          3, 0.002 + rnd() * 0.004, 0.006 + rnd() * 0.024, fp);
      }
    });
    // corona: anillos chicos de birome alrededor del núcleo, como un orb en miniatura
    var CORONA = 12, nCorona = Math.floor(N * 0.10), anillos = [];
    for (var r = 0; r < CORONA; r++) anillos.push({ a: dirAzar(rnd, [0, 0, 0]), rad: 0.22 + rnd() * 0.12, vel: (0.3 + rnd() * 0.4) * signo(rnd) });
    for (var c = 0; c < nCorona; c++) {
      var g = anillos[c % CORONA];
      var a = norm([g.a[0] + (rnd() - 0.5) * 0.05, g.a[1] + (rnd() - 0.5) * 0.05, g.a[2] + (rnd() - 0.5) * 0.05]);
      L.poner(perp(a, [0, 0, 0]), a, rnd() * Math.PI * 2, g.vel * (0.97 + rnd() * 0.06), g.rad + (rnd() - 0.5) * 0.015, rnd() * 0.5 + 0.5, 0, 0.05, 0.015, 0);
    }
    // núcleo denso y caliente
    var nNucleo = Math.floor(N * 0.12);
    for (var n = 0; n < nNucleo; n++) nube(L, rnd, 0.01, 0.2, 1.4, 0.2, 0.5, rnd() < 0.5);
    // halo tenue
    while (!L.lleno()) nube(L, rnd, 0.25, 1.5, 0.8, 0.03, 0.1, false);
    return L.salida(1.0, 0.04);
  }

  var CONSTRUCTORES = { orb: construirOrb, ring: construirRing, crystal: construirCrystal, star: construirStar };

  var FRAG = [
    'uniform vec3 uColor;',
    'uniform vec3 uLuz;',
    'varying float vAlpha;',
    'varying float vHot;',
    'void main() {',
    '  vec2 c = gl_PointCoord - 0.5;',
    '  float d = dot(c, c) * 4.0;',
    '  if (d > 1.0) discard;',
    '  float s = pow(1.0 - d, 2.2);',
    '  vec3 col = mix(uColor, uLuz, clamp(vHot * 0.6 + s * 0.25, 0.0, 1.0));',
    '  gl_FragColor = vec4(col * s * vAlpha, 1.0);',
    '}'
  ].join('\n');

  // =====================================================================
  //  create
  // =====================================================================
  function create(canvas, opciones) {
    if (!global.THREE) { var e0 = new Error('Orbe: falta three.js (r128) antes de orbe.js'); e0.code = 'SIN_WEBGL'; throw e0; }
    var renderer;
    var o = normalizar({}, opciones || {});
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: !!o.still });
    } catch (err) {
      var e1 = new Error('Orbe: este navegador no tiene WebGL activo'); e1.code = 'SIN_WEBGL'; e1.cause = err; throw e1;
    }

    var calma = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var chico = (global.matchMedia && global.matchMedia('(pointer: coarse)').matches) || global.innerWidth < 700;

    renderer.setClearColor(0x000000, 1);
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, 1, 0.01, 50);
    var tonos = colores(o.hue);
    var uniforms = {
      uTime: { value: 0 },
      uSize: { value: 1 },
      uMax: { value: 40 },
      uPointer: { value: new THREE.Vector3(0, 0, 0) },
      uForce: { value: 0 },
      uFondo: { value: 1 },
      uRespira: { value: 0.035 },
      uColor: { value: tonos.base },
      uLuz: { value: tonos.luz }
    };
    var orbe = null, geo = null, mat = null;

    // arma (o rearma) las partículas según forma, semilla y densidad
    function armar() {
      if (orbe) { scene.remove(orbe); geo.dispose(); mat.dispose(); }
      var N = Math.max(1000, Math.round((chico ? 36000 : 80000) * o.density));
      var hecho = CONSTRUCTORES[o.form](N, crearAzar(o.seed));
      geo = new THREE.BufferGeometry();
      Object.keys(hecho.attrs).forEach(function (k) { geo.setAttribute(k, new THREE.BufferAttribute(hecho.attrs[k][0], hecho.attrs[k][1])); });
      uniforms.uFondo.value = hecho.fondo !== undefined ? hecho.fondo : 1;
      uniforms.uRespira.value = hecho.respira !== undefined ? hecho.respira : 0.035;
      mat = new THREE.ShaderMaterial({
        uniforms: uniforms, transparent: true, depthWrite: false, depthTest: false,
        blending: THREE.AdditiveBlending, vertexShader: hecho.vert, fragmentShader: FRAG
      });
      orbe = new THREE.Points(geo, mat);
      orbe.frustumCulled = false;
      orbe.rotation.set(rotX, rotY, 0);
      scene.add(orbe);
    }

    // viaje: 0 = afuera mirando el orbe, 1 = adentro, en el centro
    var lejos = 3.9, viaje = 0, destino = 0;
    function encuadrar() {
      var e = viaje * viaje * (3 - 2 * viaje);
      camera.position.set(0, 0, lejos + (0.02 - lejos) * e);
      camera.fov = 50 + 34 * e;
      camera.updateProjectionMatrix();
    }
    function medir() {
      var w = canvas.clientWidth || global.innerWidth, h = canvas.clientHeight || global.innerHeight;
      var pr = Math.min(global.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(pr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      lejos = 3.9 / Math.min(1, Math.max(0.45, camera.aspect * 0.95));
      uniforms.uSize.value = h * pr * 0.0125;
      uniforms.uMax.value = h * pr * 0.035;
      encuadrar();
      if (o.still) dibujar();
    }

    // Puntero: arrastrar gira el orbe, acercarse empuja las partículas.
    var rotX = 0.25, rotY = 0, velX = 0, velY = 0.0016, arrastrando = false, px = 0, py = 0, fuerza = 0;
    var ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plano = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), golpe = new THREE.Vector3();
    var ix = 0, iy = 0, cuerpo = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1.3);

    function ubicar(e) {
      var b = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(plano, golpe)) uniforms.uPointer.value.copy(golpe);
      fuerza = destino === 1 ? 0 : 1;
    }
    function pulsar(e) {
      if (Math.hypot(e.clientX - ix, e.clientY - iy) > 6) return;
      if (destino === 1) { destino = 0; return; }
      if (ray.ray.intersectsSphere(cuerpo)) { destino = 1; fuerza = 0; }
    }
    var oyentes = {
      tecla: function (e) { if (o.interactive && e.key === 'Escape') destino = 0; },
      baja: function (e) { if (!o.interactive) return; arrastrando = true; px = ix = e.clientX; py = iy = e.clientY; ubicar(e); canvas.setPointerCapture(e.pointerId); },
      mueve: function (e) {
        if (!o.interactive) return;
        ubicar(e);
        if (!arrastrando) return;
        velY = (e.clientX - px) * 0.0006; velX = (e.clientY - py) * 0.0006;
        rotY += (e.clientX - px) * 0.005; rotX += (e.clientY - py) * 0.005;
        px = e.clientX; py = e.clientY;
      },
      sube: function (e) { if (!o.interactive) return; arrastrando = false; ubicar(e); pulsar(e); if (e.pointerType !== 'mouse') fuerza = 0; },
      cancela: function () { arrastrando = false; fuerza = 0; },
      sale: function () { fuerza = 0; }
    };
    global.addEventListener('keydown', oyentes.tecla);
    canvas.addEventListener('pointerdown', oyentes.baja);
    canvas.addEventListener('pointermove', oyentes.mueve);
    canvas.addEventListener('pointerup', oyentes.sube);
    canvas.addEventListener('pointercancel', oyentes.cancela);
    canvas.addEventListener('pointerleave', oyentes.sale);
    var observador = null;
    if (global.ResizeObserver) { observador = new ResizeObserver(medir); observador.observe(canvas); }
    else global.addEventListener('resize', medir);

    function dibujar() { if (orbe) { orbe.rotation.set(rotX, rotY, 0); renderer.render(scene, camera); } }

    var reloj = new THREE.Clock(), t = 0, ritmo = calma ? 0.25 : 1, pedido = 0;
    function cuadro() {
      pedido = 0;
      var dt = Math.min(reloj.getDelta(), 0.05);
      t += dt * ritmo;
      uniforms.uTime.value = t;
      uniforms.uForce.value += (fuerza - uniforms.uForce.value) * 0.08;
      if (Math.abs(destino - viaje) > 0.0005) {
        viaje += (destino - viaje) * (calma ? 0.2 : 0.035);
        encuadrar();
      }
      if (!arrastrando) {
        velY += (0.0016 * ritmo - velY) * 0.02;
        velX *= 0.95;
        rotY += velY; rotX += velX;
      }
      rotX = Math.max(-1.2, Math.min(1.2, rotX));
      dibujar();
      pedido = requestAnimationFrame(cuadro);
    }
    function arrancar() {
      if (o.still) { if (pedido) cancelAnimationFrame(pedido); pedido = 0; uniforms.uTime.value = t; dibujar(); return; }
      if (!pedido) { reloj.getDelta(); pedido = requestAnimationFrame(cuadro); }
    }

    armar();
    medir();
    arrancar();

    return {
      set: function (nuevas) {
        var antes = { form: o.form, seed: o.seed, density: o.density };
        normalizar(o, nuevas || {});
        if (!o.interactive) { arrastrando = false; fuerza = 0; destino = 0; }
        tonos = colores(o.hue);
        uniforms.uColor.value.copy(tonos.base);
        uniforms.uLuz.value.copy(tonos.luz);
        if (antes.form !== o.form || antes.seed !== o.seed || antes.density !== o.density) armar();
        arrancar();
        if (o.still) dibujar();
      },
      destroy: function () {
        if (pedido) cancelAnimationFrame(pedido);
        pedido = 0;
        global.removeEventListener('keydown', oyentes.tecla);
        canvas.removeEventListener('pointerdown', oyentes.baja);
        canvas.removeEventListener('pointermove', oyentes.mueve);
        canvas.removeEventListener('pointerup', oyentes.sube);
        canvas.removeEventListener('pointercancel', oyentes.cancela);
        canvas.removeEventListener('pointerleave', oyentes.sale);
        if (observador) observador.disconnect(); else global.removeEventListener('resize', medir);
        if (orbe) { scene.remove(orbe); geo.dispose(); mat.dispose(); orbe = null; }
        renderer.dispose();
        if (renderer.forceContextLoss) renderer.forceContextLoss();
      }
    };
  }

  // completa y valida opciones sobre o (solo pisa las que vienen)
  function normalizar(o, n) {
    if (o.hue === undefined) { o.hue = TONO_CIAN; o.form = 'orb'; o.seed = undefined; o.density = 1; o.interactive = true; o.still = false; }
    if (n.hue !== undefined && n.hue !== null && n.hue !== '' && isFinite(+n.hue)) o.hue = Math.round(+n.hue);
    if (n.form !== undefined) o.form = FORMAS.indexOf(n.form) >= 0 ? n.form : 'orb';
    if ('seed' in n) o.seed = n.seed === null || n.seed === '' ? undefined : n.seed;
    if (n.density !== undefined && isFinite(+n.density)) o.density = Math.max(0.02, Math.min(1, +n.density));
    if (n.interactive !== undefined) o.interactive = !!n.interactive;
    if (n.still !== undefined) o.still = !!n.still;
    return o;
  }

  global.Orbe = { create: create, FORMAS: FORMAS.slice() };
})(window);
