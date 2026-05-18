import * as THREE from 'three';
import './style.css';

/* ─────────── Topnav scroll state ─────────── */
const nav = document.getElementById('topnav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

/* ─────────── Reveal on scroll (IntersectionObserver) ─────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      const counter = e.target.querySelector('[data-count]');
      if (counter && !counter.dataset.animated) {
        counter.dataset.animated = '1';
        animateCount(counter);
      }
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

function animateCount(el) {
  const target = parseFloat(el.dataset.count);
  const divide = parseFloat(el.dataset.divide || '1');
  const duration = 1600;
  const start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const cur = target * eased / divide;
    if (target >= 1000) {
      el.textContent = Math.round(cur).toLocaleString();
    } else if (divide > 1) {
      el.textContent = cur.toFixed(1);
    } else {
      el.textContent = Math.round(cur);
    }
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ─────────── Three.js Icosahedron ─────────── */
(function initIcosa() {
  const canvas = document.getElementById('icosa');
  if (!canvas) return;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 7);

  const geo = new THREE.IcosahedronGeometry(2.2, 0);
  const lineMat = new THREE.LineBasicMaterial({ color: 0x0E9F8E, transparent: true, opacity: 0.55 });
  const edges = new THREE.EdgesGeometry(geo);
  const wireframe = new THREE.LineSegments(edges, lineMat);
  scene.add(wireframe);

  // Inner subtle face mesh
  const faceMat = new THREE.MeshBasicMaterial({
    color: 0x0E9F8E,
    transparent: true,
    opacity: 0.04,
    side: THREE.DoubleSide
  });
  const faceMesh = new THREE.Mesh(geo, faceMat);
  scene.add(faceMesh);

  // Vertex glow points
  const ptsGeo = new THREE.BufferGeometry();
  const positions = [];
  const posAttr = geo.attributes.position;
  const seen = new Set();
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i), y = posAttr.getY(i), z = posAttr.getZ(i);
    const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
    if (!seen.has(key)) {
      seen.add(key);
      positions.push(x, y, z);
    }
  }
  ptsGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const ptsMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.07,
    transparent: true,
    opacity: 0.85
  });
  const points = new THREE.Points(ptsGeo, ptsMat);
  scene.add(points);

  // Subtle outer halo (larger faint icosahedron)
  const outerGeo = new THREE.IcosahedronGeometry(2.8, 0);
  const outerMat = new THREE.LineBasicMaterial({ color: 0x1A56DB, transparent: true, opacity: 0.12 });
  const outerEdges = new THREE.EdgesGeometry(outerGeo);
  const outerWire = new THREE.LineSegments(outerEdges, outerMat);
  scene.add(outerWire);

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  function animate() {
    const t = clock.getElapsedTime();
    wireframe.rotation.x = t * 0.12;
    wireframe.rotation.y = t * 0.18;
    faceMesh.rotation.x = wireframe.rotation.x;
    faceMesh.rotation.y = wireframe.rotation.y;
    points.rotation.x = wireframe.rotation.x;
    points.rotation.y = wireframe.rotation.y;
    outerWire.rotation.x = -t * 0.06;
    outerWire.rotation.y = -t * 0.09;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
})();

/* ─────────── SECTION 3 — Sticky parallax protocol animation ─────────── */
(function initProtocolParallax() {
  const wrap = document.getElementById('protocol');
  if (!wrap) return;
  const frame = document.getElementById('contractFrame');
  const trancheA = wrap.querySelector('[data-tranche="a"]');
  const trancheB = wrap.querySelector('[data-tranche="b"]');
  const trancheC = wrap.querySelector('[data-tranche="c"]');
  const clockOv = document.getElementById('clockOverlay');
  const distBadge = document.getElementById('distBadge');
  const waterfallArrows = document.getElementById('waterfallArrows');
  const statusText = document.getElementById('contractStatusText');
  const narrations = wrap.querySelectorAll('.step-narration');
  const pips = wrap.querySelectorAll('.pip');

  let currentStep = -1;

  function setStep(step) {
    if (step === currentStep) return;
    currentStep = step;

    // narration
    narrations.forEach(n => {
      n.classList.toggle('active', parseInt(n.dataset.step, 10) === step);
    });
    pips.forEach((p, i) => {
      p.classList.toggle('done', i < step);
      p.classList.toggle('active', i === step);
    });

    // contract scale in (step 0)
    if (step >= 0) frame.classList.add('in');

    // tranche heights
    const baseH = frame.clientHeight;
    const cH = baseH * 0.10;
    const bH = baseH * 0.20;
    const aH = baseH * 0.70;

    [trancheA, trancheB, trancheC].forEach(t => {
      t.classList.add('collapsed');
      t.style.height = '0px';
    });

    if (step >= 1) {
      trancheC.classList.remove('collapsed');
      trancheC.style.height = cH + 'px';
    }
    if (step >= 2) {
      trancheB.classList.remove('collapsed');
      trancheB.style.height = bH + 'px';
      trancheA.classList.remove('collapsed');
      trancheA.style.height = aH + 'px';
    }

    clockOv.classList.toggle('show', step === 3);
    distBadge.classList.toggle('show', step >= 4);
    waterfallArrows.classList.toggle('show', step >= 4);

    [trancheA, trancheB, trancheC].forEach(t => {
      t.style.opacity = (step >= 4) ? '0.35' : '';
    });

    if (step <= 1) statusText.textContent = 'Collecting';
    else if (step === 2) statusText.textContent = 'Active';
    else if (step === 3) statusText.textContent = 'Maturing';
    else statusText.textContent = 'Distributed';
  }

  let ticking = false;
  function update() {
    const rect = wrap.getBoundingClientRect();
    const total = wrap.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;
    let progress = scrolled / total;
    progress = Math.max(0, Math.min(0.999, progress));
    const step = Math.min(4, Math.floor(progress * 5));
    setStep(step);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  });
  update();
  setTimeout(update, 500);
})();

/* ─────────── SECTION 5 — Default protection parallax ─────────── */
(function initDefaultParallax() {
  const wrap = document.getElementById('default');
  if (!wrap) return;
  const segRecovery = document.getElementById('segRecovery');
  const segCollateral = document.getElementById('segCollateral');
  const poolTotal = document.getElementById('poolTotal');
  const distribution = document.getElementById('distribution');
  const callout = document.getElementById('defaultCallout');
  const stateTag = document.getElementById('defaultStateTag');
  const copy = document.getElementById('defaultCopy');

  let curState = -1;
  function setState(s) {
    if (s === curState) return;
    curState = s;
    if (s === 0) {
      segRecovery.style.width = '40%';
      segRecovery.textContent = '₽400K (40%)';
      segCollateral.style.width = '0%';
      segCollateral.textContent = '';
      poolTotal.textContent = '₽400K';
      distribution.classList.remove('show');
      callout.classList.remove('show');
      stateTag.classList.remove('recovered');
      stateTag.innerHTML = '<span>State A · Borrower returns 40%</span>';
      copy.innerHTML = 'Borrower repays <strong>400,000 ₽</strong> of a 1M loan, then defaults. The pool is short — but Tranche C collateral is about to be added.';
    } else {
      segRecovery.style.width = '40%';
      segRecovery.textContent = '₽400K';
      segCollateral.style.width = '10%';
      segCollateral.textContent = '+₽100K';
      poolTotal.textContent = '₽500K';
      distribution.classList.add('show');
      callout.classList.add('show');
      stateTag.classList.add('recovered');
      stateTag.innerHTML = '<span>State B · Waterfall executes</span>';
      copy.innerHTML = 'Tranche C collateral (<strong>₽100K</strong>) is forfeited and added to the recovery pool. The contract pays <strong>Senior first</strong>, in priority order. Mezzanine and Junior receive nothing.';
    }
  }

  let ticking = false;
  function update() {
    const rect = wrap.getBoundingClientRect();
    const total = wrap.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;
    let progress = scrolled / total;
    progress = Math.max(0, Math.min(0.999, progress));
    setState(progress < 0.5 ? 0 : 1);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  });
  update();
  setTimeout(update, 500);
})();
