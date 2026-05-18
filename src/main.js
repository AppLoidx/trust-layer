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

/* ─────────── SECTION 6.5 — Solidity code showcase ─────────── */
(function initCodeBlock() {
  const codeEl = document.getElementById('solidityCode');
  if (!codeEl) return;

  const src = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TrustLayerLoan
 * @notice One master contract per loan. Implements the TrustLayer tranche structure:
 *   Tranche A (Senior)     — 70% of loan, 12% return
 *   Tranche B (Mezzanine)  — 20% of loan, 18% return
 *   Tranche C (Junior)     — 10% of loan, 25% return (borrower's own capital)
 *
 * Flow (normal):
 *   1. Borrower deploys via LoanFactory, funding Tranche C upfront
 *   2. External investors fund Tranche A and B
 *   3. When A+B fully funded → status becomes ACTIVE, countdown starts
 *   4. After maturityTime, backend sends repayment ETH and calls distribute()
 *   5. Contract pays every investor: principal + interest
 *
 * Flow (default):
 *   - Platform calls declareDefault() at any time while ACTIVE
 *   - Tranche C (borrower collateral) is forfeited first
 *   - Remaining balance is split proportionally between A and B investors
 *   - Status becomes DEFAULTED
 */
contract TrustLayerLoan {
    enum Status {
        COLLECTING,
        ACTIVE,
        DISTRIBUTED,
        DEFAULTED
    }

    struct Tranche {
        uint256 allocated;
        uint256 filled;
        uint256 rateBps;
        address[] investors;
        mapping(address => uint256) invested;
    }

    address public borrower;
    address public platform;
    uint256 public loanAmount;
    uint256 public maturityTime;
    uint256 public durationSeconds;
    uint256 public createdAt;
    Status public status;

    // tranches[0]=A, tranches[1]=B, tranches[2]=C
    Tranche[3] internal tranches;

    event InvestmentMade(address indexed investor, uint8 tranche, uint256 amount);
    event ContractActivated(uint256 timestamp);
    event Distributed(uint256 timestamp, uint256 totalPaid);
    event DefaultDeclared(uint256 timestamp, uint256 recoveredAmount);

    constructor(
        address _borrower,
        address _platform,
        uint256 _loanAmount,
        uint256 _durationSeconds
    ) payable {
        require(_borrower != address(0), "Invalid borrower");
        require(_platform != address(0), "Invalid platform");
        require(_loanAmount > 0, "Loan amount must be > 0");
        require(_durationSeconds > 0, "Duration must be > 0");

        borrower = _borrower;
        platform = _platform;
        loanAmount = _loanAmount;
        durationSeconds = _durationSeconds;
        createdAt = block.timestamp;
        status = Status.COLLECTING;

        // Tranche allocations
        tranches[0].allocated = (_loanAmount * 70) / 100;
        tranches[0].rateBps = 1200;

        tranches[1].allocated = (_loanAmount * 20) / 100;
        tranches[1].rateBps = 1800;

        tranches[2].allocated = (_loanAmount * 10) / 100;
        tranches[2].rateBps = 2500;

        // Borrower must fund Tranche C at creation
        require(
            msg.value == tranches[2].allocated,
            "Must fund exactly Tranche C (10%)"
        );
        tranches[2].filled = tranches[2].allocated;
        tranches[2].investors.push(_borrower);
        tranches[2].invested[_borrower] = tranches[2].allocated;
    }

    function invest(uint8 trancheId) external payable {
        require(status == Status.COLLECTING, "Not accepting investments");
        require(trancheId < 2, "External investors: only A(0) or B(1)");
        require(msg.value > 0, "Amount must be > 0");

        Tranche storage t = tranches[trancheId];
        require(t.filled + msg.value <= t.allocated, "Exceeds tranche capacity");

        if (t.invested[msg.sender] == 0) {
            t.investors.push(msg.sender);
        }
        t.invested[msg.sender] += msg.value;
        t.filled += msg.value;

        emit InvestmentMade(msg.sender, trancheId, msg.value);

        if (
            tranches[0].filled == tranches[0].allocated &&
            tranches[1].filled == tranches[1].allocated
        ) {
            status = Status.ACTIVE;
            maturityTime = block.timestamp + durationSeconds;
            emit ContractActivated(block.timestamp);
        }
    }

    function distribute() external {
        require(status == Status.ACTIVE, "Contract not active");
        require(block.timestamp >= maturityTime, "Not matured yet");

        uint256 total = calculateTotalPayout();
        require(address(this).balance >= total, "Insufficient balance for payout");

        status = Status.DISTRIBUTED;

        uint256 paid = 0;
        for (uint8 t = 0; t < 3; t++) {
            Tranche storage tranche = tranches[t];
            for (uint256 i = 0; i < tranche.investors.length; i++) {
                address investor = tranche.investors[i];
                uint256 principal = tranche.invested[investor];
                uint256 interest = (principal * tranche.rateBps) / 10000;
                uint256 payout = principal + interest;
                paid += payout;
                payable(investor).transfer(payout);
            }
        }

        emit Distributed(block.timestamp, paid);
    }

    function declareDefault() external {
        require(msg.sender == platform, "Only platform can declare default");
        require(status == Status.ACTIVE, "Contract not active");

        status = Status.DEFAULTED;

        uint256 available = address(this).balance;
        uint256 totalAB = tranches[0].filled + tranches[1].filled;

        uint256 recovered = 0;
        if (available > 0 && totalAB > 0) {
            for (uint8 t = 0; t < 2; t++) {
                Tranche storage tranche = tranches[t];
                for (uint256 i = 0; i < tranche.investors.length; i++) {
                    address investor = tranche.investors[i];
                    uint256 share = tranche.invested[investor];
                    uint256 payout = (available * share) / totalAB;
                    if (payout > 0) {
                        recovered += payout;
                        payable(investor).transfer(payout);
                    }
                }
            }
        }

        emit DefaultDeclared(block.timestamp, recovered);
    }

    function calculateTotalPayout() public view returns (uint256 total) {
        for (uint8 t = 0; t < 3; t++) {
            uint256 f = tranches[t].filled;
            total += f + (f * tranches[t].rateBps) / 10000;
        }
    }

    receive() external payable {}`;

  // Lines to highlight (key contract sections)
  const highlightedLines = new Set([
    24, 25, 26, 27, 28, 29,       // enum Status
    31, 32, 33, 34, 35, 36, 37,   // struct Tranche
    60, 61, 62, 63, 64, 65,       // constructor params
    79, 80, 81, 82, 83, 84, 85,   // tranche allocations
    98, 99, 100,                   // invest function header
    120, 121, 122, 123, 124,       // auto-activation
    131, 132,                      // distribute header
    139, 140, 141,                 // payout loop
    162, 163,                      // declareDefault
    168, 169, 170,                 // DEFAULTED status
    174, 175, 176, 177, 178,      // proportional split
  ]);

  function highlight(code) {
    let h = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    h = h.replace(/(\/\*\*[\s\S]*?\*\/)/g, '<span class="sol-comment">$1</span>');
    h = h.replace(/(\/\/.*)/g, '<span class="sol-comment">$1</span>');
    h = h.replace(/(".*?")/g, '<span class="sol-string">$1</span>');
    h = h.replace(/\b(pragma)\b/g, '<span class="sol-pragma">$1</span>');
    h = h.replace(/\b(contract|function|struct|enum|event|mapping|modifier|import|is|using|returns|return|require|emit|external|public|internal|private|view|payable|pure|memory|storage|calldata|indexed|for|if|else|while|new|delete|this|super)\b/g, '<span class="sol-keyword">$1</span>');
    h = h.replace(/\b(uint256|uint8|uint|int256|address|bool|bytes|string|bytes32)\b/g, '<span class="sol-type">$1</span>');
    h = h.replace(/\b(msg|block|tx|now|true|false)\b/g, '<span class="sol-builtin">$1</span>');
    h = h.replace(/\b(COLLECTING|ACTIVE|DISTRIBUTED|DEFAULTED)\b/g, '<span class="sol-enum">$1</span>');
    h = h.replace(/\b(\d+)\b/g, '<span class="sol-number">$1</span>');

    return h;
  }

  const lines = src.split('\n');
  const html = lines.map((line, i) => {
    const num = i + 1;
    const hl = highlightedLines.has(num) ? ' highlight' : '';
    return `<span class="code-line${hl}" data-line="${num}">${highlight(line)}</span>`;
  }).join('');

  codeEl.innerHTML = html;
})();/* ─────────── SECTION 5 — Default protection parallax ─────────── */
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
