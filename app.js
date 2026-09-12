/* ============================================================
   KRISHNA HIWALE — 3D PORTFOLIO MAIN JAVASCRIPT
   Three.js particle universes + GSAP scroll animations
   ============================================================ */

'use strict';

// ─── GSAP PLUGINS ───────────────────────────────────────────
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ─── UTILITY ────────────────────────────────────────────────
const qs  = (s, p = document) => p.querySelector(s);
const qsa = (s, p = document) => [...p.querySelectorAll(s)];

// ─── LOADER ─────────────────────────────────────────────────
let appInitialized = false;

function dismissLoader() {
  const loader = qs('#loader');
  if (loader) loader.classList.add('hidden');
  document.body.style.overflow = '';
  if (!appInitialized) {
    appInitialized = true;
    initApp();
  }
}

function initLoader() {
  const bar  = qs('#loaderBar');
  const pct  = qs('#loaderPct');
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 30 + 15;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      if (bar) bar.style.width = '100%';
      if (pct) pct.textContent = '100%';
      setTimeout(dismissLoader, 200);
    } else {
      if (bar) bar.style.width = progress + '%';
      if (pct) pct.textContent = Math.floor(progress) + '%';
    }
  }, 50);

  // Safety fallback: auto dismiss after 1 second max
  setTimeout(dismissLoader, 1000);
}
document.body.style.overflow = 'hidden';

// ─── CUSTOM CURSOR ──────────────────────────────────────────
function initCursor() {
  const cursor   = qs('#cursor');
  const follower = qs('#cursor-follower');
  let mx = 0, my = 0, fx = 0, fy = 0;

  window.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (cursor) { cursor.style.left = mx + 'px'; cursor.style.top = my + 'px'; }
  });

  function followCursor() {
    fx += (mx - fx) * 0.12;
    fy += (my - fy) * 0.12;
    if (follower) { follower.style.left = fx + 'px'; follower.style.top = fy + 'px'; }
    requestAnimationFrame(followCursor);
  }
  followCursor();
}

// ─── NAVBAR ─────────────────────────────────────────────────
function initNavbar() {
  const nav = qs('#navbar');
  const hamburger = qs('#hamburger');
  const mobileMenu = qs('#mobileMenu');

  window.addEventListener('scroll', () => {
    nav?.classList.toggle('scrolled', window.scrollY > 60);
  });

  hamburger?.addEventListener('click', () => {
    mobileMenu?.classList.toggle('open');
  });

  qsa('.mob-link').forEach(l => {
    l.addEventListener('click', () => mobileMenu?.classList.remove('open'));
  });

  // Active link on scroll
  const sections = qsa('section[id]');
  const navLinks = qsa('.nav-link');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(l => {
          l.classList.toggle('active', l.dataset.section === e.target.id);
        });
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => observer.observe(s));
}

// ─── THREE.JS HERO CANVAS ────────────────────────────────────
function initHeroCanvas() {
  const canvas = qs('#heroCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  // Particle System
  const COUNT    = 3000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(COUNT * 3);
  const colors    = new Float32Array(COUNT * 3);
  const sizes     = new Float32Array(COUNT);

  const colA = new THREE.Color('#a855f7');
  const colB = new THREE.Color('#06b6d4');
  const colC = new THREE.Color('#ec4899');

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    const c = [colA, colB, colC][Math.floor(Math.random() * 3)];
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
    sizes[i] = Math.random() * 3 + 0.5;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Neural Network Lines
  const lineMat = new THREE.LineBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending });
  const nodePositions = [];
  for (let i = 0; i < 80; i++) {
    nodePositions.push(new THREE.Vector3(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 10
    ));
  }

  for (let i = 0; i < nodePositions.length; i++) {
    for (let j = i + 1; j < nodePositions.length; j++) {
      const dist = nodePositions[i].distanceTo(nodePositions[j]);
      if (dist < 5) {
        const lg = new THREE.BufferGeometry().setFromPoints([nodePositions[i], nodePositions[j]]);
        scene.add(new THREE.Line(lg, lineMat));
      }
    }
  }

  // Mouse parallax
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.004;
    particles.rotation.y = t * 0.08 + mouseX * 0.04;
    particles.rotation.x = t * 0.04 + mouseY * 0.02;
    camera.position.x += (mouseX * 0.8 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 0.5 - camera.position.y) * 0.05;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// ─── THREE.JS SKILLS CANVAS ──────────────────────────────────
function initSkillsCanvas() {
  const canvas = qs('#skillsCanvas');
  if (!canvas || typeof THREE === 'undefined') return;
  const section = qs('#skills');
  if (!section) return;

  const w = section.offsetWidth, h = section.offsetHeight;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
  camera.position.z = 8;

  // Floating data cubes
  const cubes = [];
  const cubeColors = [0xa855f7, 0x06b6d4, 0xec4899, 0xf59e0b, 0x10b981];
  for (let i = 0; i < 12; i++) {
    const size = Math.random() * 0.4 + 0.15;
    const geo  = new THREE.BoxGeometry(size, size, size);
    const mat  = new THREE.MeshBasicMaterial({
      color: cubeColors[i % cubeColors.length],
      transparent: true, opacity: 0.12, wireframe: true
    });
    const cube = new THREE.Mesh(geo, mat);
    cube.position.set((Math.random()-0.5)*20, (Math.random()-0.5)*12, (Math.random()-0.5)*8);
    cube.userData = { vx: (Math.random()-0.5)*0.01, vy: (Math.random()-0.5)*0.008 };
    scene.add(cube);
    cubes.push(cube);
  }

  // Rings
  for (let i = 0; i < 3; i++) {
    const geo = new THREE.TorusGeometry(2 + i * 1.2, 0.02, 8, 60);
    const mat = new THREE.MeshBasicMaterial({ color: i === 0 ? 0xa855f7 : i === 1 ? 0x06b6d4 : 0xec4899, transparent: true, opacity: 0.12 });
    const torus = new THREE.Mesh(geo, mat);
    torus.rotation.x = Math.PI * (0.3 + i * 0.2);
    scene.add(torus);
    cubes.push({ mesh: torus, isRing: true, speed: 0.004 + i * 0.002 });
  }

  function animate() {
    requestAnimationFrame(animate);
    cubes.forEach(c => {
      if (c.isRing) {
        c.mesh.rotation.z += c.speed;
      } else {
        c.rotation.x += 0.01;
        c.rotation.y += 0.012;
        c.position.x += c.userData.vx;
        c.position.y += c.userData.vy;
        if (Math.abs(c.position.x) > 11) c.userData.vx *= -1;
        if (Math.abs(c.position.y) > 7)  c.userData.vy *= -1;
      }
    });
    renderer.render(scene, camera);
  }
  animate();
}

// ─── THREE.JS CONTACT CANVAS ─────────────────────────────────
function initContactCanvas() {
  const canvas = qs('#contactCanvas');
  if (!canvas || typeof THREE === 'undefined') return;
  const section = qs('#contact');
  if (!section) return;

  const w = section.offsetWidth, h = section.offsetHeight;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setSize(w, h);
  renderer.setPixelRatio(1);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, w/h, 0.1, 100);
  camera.position.z = 6;

  const COUNT = 800;
  const geo   = new THREE.BufferGeometry();
  const pos   = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    pos[i*3]   = (Math.random()-0.5)*20;
    pos[i*3+1] = (Math.random()-0.5)*12;
    pos[i*3+2] = (Math.random()-0.5)*10;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat  = new THREE.PointsMaterial({ color: 0xa855f7, size: 0.06, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
  const pts  = new THREE.Points(geo, mat);
  scene.add(pts);

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.005;
    pts.rotation.y = t * 0.05;
    pts.rotation.x = Math.sin(t * 0.3) * 0.1;
    renderer.render(scene, camera);
  }
  animate();
}

// ─── TYPEWRITER EFFECT ────────────────────────────────────────
function initTypewriter() {
  const el = qs('#typedText');
  if (!el) return;

  const words = [
    'Data Stories',
    'ML Models',
    'Visual Dashboards',
    'Insights from Data',
    'Analytical Solutions',
    'Climate Analytics',
  ];
  let wi = 0, ci = 0, deleting = false;

  function tick() {
    const word = words[wi];
    if (deleting) {
      el.textContent = word.slice(0, ci--);
    } else {
      el.textContent = word.slice(0, ci++);
    }

    let delay = deleting ? 55 : 95;
    if (!deleting && ci === word.length + 1) { deleting = true; delay = 2000; }
    else if (deleting && ci < 0) { deleting = false; wi = (wi + 1) % words.length; ci = 0; delay = 300; }
    setTimeout(tick, delay);
  }
  tick();
}

// ─── COUNTER ANIMATION ────────────────────────────────────────
function initCounters() {
  const counters = qsa('.stat-num');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el    = e.target;
      const end   = parseInt(el.dataset.count);
      const dur   = 1500;
      const start = Date.now();
      function update() {
        const p = Math.min((Date.now() - start) / dur, 1);
        el.textContent = Math.round(p * end);
        if (p < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => obs.observe(c));
}

// ─── SKILL BAR ANIMATION ──────────────────────────────────────
function initSkillBars() {
  const bars = qsa('.skill-bar-fill');
  const obs  = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.style.width = e.target.dataset.width + '%';
      obs.unobserve(e.target);
    });
  }, { threshold: 0.2 });
  bars.forEach(b => obs.observe(b));
}

// ─── REVEAL ANIMATIONS ───────────────────────────────────────
function initReveal() {
  const items = qsa('.reveal-item');
  const obs   = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (!e.isIntersecting) return;
      e.target.style.transitionDelay = (e.target.dataset.index ? e.target.dataset.index * 0.1 : 0) + 's';
      e.target.classList.add('visible');
      obs.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  items.forEach(item => obs.observe(item));
}

// ─── PORTRAIT IMAGE ──────────────────────────────────────────
function initPortrait() {
  // Images are served as direct files - nothing to do here.
  // portrait.jpg = hero section, about-photo.jpg = about section
  // Both are already set in HTML src attributes directly.
}

function generateAvatarSVG() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <defs>
      <radialGradient id="bg" cx="50%" cy="50%">
        <stop offset="0%" stop-color="#1a0b3d"/>
        <stop offset="100%" stop-color="#070c1a"/>
      </radialGradient>
      <linearGradient id="skin" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#c8956c"/>
        <stop offset="100%" stop-color="#b07850"/>
      </linearGradient>
    </defs>
    <circle cx="100" cy="100" r="100" fill="url(#bg)"/>
    <circle cx="100" cy="85" r="40" fill="url(#skin)"/>
    <ellipse cx="100" cy="165" rx="55" ry="50" fill="url(#skin)"/>
    <text x="100" y="108" font-family="Outfit,sans-serif" font-size="28" font-weight="900"
      fill="white" text-anchor="middle" letter-spacing="-1">KH</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

// ─── CONTACT FORM ────────────────────────────────────────────
function initContactForm() {
  const form = qs('#contactForm');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name    = qs('#nameInput')?.value.trim();
    const email   = qs('#emailInput')?.value.trim();
    const subject = qs('#subjectInput')?.value.trim();
    const message = qs('#messageInput')?.value.trim();
    const note    = qs('#formNote');

    if (!name || !email || !message) {
      if (note) { note.textContent = '⚠️ Please fill in all required fields.'; note.style.color = '#f59e0b'; }
      return;
    }

    // Compose mailto link
    const to   = 'krishnahiwale15@gmail.com';
    const sub  = encodeURIComponent(subject || `Portfolio Contact from ${name}`);
    const body = encodeURIComponent(`Hi Krishna,\n\nMy name is ${name}.\n\n${message}\n\nFrom: ${email}`);
    window.location.href = `mailto:${to}?subject=${sub}&body=${body}`;

    if (note) { note.textContent = '✅ Opening your mail client…'; note.style.color = '#10b981'; }
    form.reset();
  });
}

// ─── SMOOTH SCROLL ───────────────────────────────────────────
function initSmoothScroll() {
  qsa('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const target = qs(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ─── PROJECT CARD TILT ───────────────────────────────────────
function initCardTilt() {
  qsa('.project-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = (e.clientX - r.left) / r.width  - 0.5;
      const y  = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `translateY(-8px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
      card.style.transition = 'transform 0.1s';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.25,1,0.5,1)';
    });
  });
}

// ─── GLOWING CURSOR ON LINKS ──────────────────────────────────
function initLinkGlow() {
  const links = qsa('a, button, .glass-card, .skill-bar-fill');
  links.forEach(l => {
    l.addEventListener('mouseenter', () => {
      const c = qs('#cursor');
      if (c) { c.style.transform = 'translate(-50%,-50%) scale(2.5)'; c.style.background = '#06b6d4'; }
    });
    l.addEventListener('mouseleave', () => {
      const c = qs('#cursor');
      if (c) { c.style.transform = 'translate(-50%,-50%) scale(1)'; c.style.background = '#a855f7'; }
    });
  });
}

// ─── HERO SECTION GSAP PARALLAX (if GSAP loaded) ─────────────
function initGSAPAnimations() {
  if (typeof gsap === 'undefined') return;
  if (typeof ScrollTrigger !== 'undefined') {
    gsap.to('.hero-content', {
      yPercent: -25,
      ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('.hero-portrait', {
      yPercent: -15,
      ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  }
}

// ─── MAIN APP INIT ───────────────────────────────────────────
function initApp() {
  initCursor();
  initNavbar();
  initHeroCanvas();
  initSkillsCanvas();
  initContactCanvas();
  initTypewriter();
  initCounters();
  initSkillBars();
  initReveal();
  initPortrait();
  initContactForm();
  initSmoothScroll();
  initCardTilt();
  initLinkGlow();
  initGSAPAnimations();
}

// ─── BOOT ────────────────────────────────────────────────────
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initLoader();
} else {
  document.addEventListener('DOMContentLoaded', initLoader);
}
window.addEventListener('load', () => {
  if (!appInitialized) dismissLoader();
});
