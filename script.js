/* ============================================
   DISNEY — WHERE MAGIC LIVES
   app.js — Three.js + Interactions
   ============================================ */

'use strict';

// ── Loader ────────────────────────────────────
(function initLoader() {
    const loader = document.getElementById('loader');
    const progress = document.getElementById('loaderProgress');
    const letters = document.querySelectorAll('.loader-text span');

    // Animate letters
    letters.forEach((l, i) => {
        l.style.animationDelay = `${i * 0.06}s`;
    });

    let pct = 0;
    const interval = setInterval(() => {
        pct += Math.random() * 12;
        if (pct >= 100) {
            pct = 100;
            clearInterval(interval);
            setTimeout(() => {
                loader.classList.add('hidden');
                initAll();
            }, 400);
        }
        progress.style.width = pct + '%';
    }, 80);
})();

function initAll() {
    initStarField();
    initThreeJS();
    initCursor();
    initNav();
    initSparkles();
    initWorldsPortal();
    initStoriesSlider();
    initMagicOrb();
    initScrollReveal();
    initModal();
    initParallax();
}

// ── Star Field Background ──────────────────────
function initStarField() {
    const field = document.createElement('div');
    field.className = 'star-field';
    document.body.appendChild(field);

    for (let i = 0; i < 180; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 2 + 0.5;
        const dur = 2 + Math.random() * 5;
        star.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      width: ${size}px;
      height: ${size}px;
      --d: ${dur}s;
      --minOp: ${0.05 + Math.random() * 0.1};
      --maxOp: ${0.3 + Math.random() * 0.5};
      animation-delay: ${Math.random() * 5}s;
    `;
        field.appendChild(star);
    }
}

// ── Three.js Hero Canvas ───────────────────────
function initThreeJS() {
    const canvas = document.getElementById('threeCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // Particle System — Magical Dust
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const goldColor = new THREE.Color('#C9A84C');
    const blueColor = new THREE.Color('#4A90D9');
    const purpleColor = new THREE.Color('#8B5CF6');
    const palette = [goldColor, blueColor, purpleColor];

    for (let i = 0; i < particleCount; i++) {
        // Spread in a sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 2 + Math.random() * 4;

        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi) - 2;

        const c = palette[Math.floor(Math.random() * palette.length)];
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;

        sizes[i] = Math.random() * 3 + 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0, 0) },
        },
        vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      varying float vAlpha;
      uniform float uTime;
      uniform vec2 uMouse;
      
      void main() {
        vColor = color;
        vec3 pos = position;
        
        // Gentle drift
        pos.x += sin(uTime * 0.3 + position.y * 0.5) * 0.3;
        pos.y += cos(uTime * 0.2 + position.x * 0.5) * 0.3;
        pos.z += sin(uTime * 0.15 + position.z * 0.3) * 0.2;
        
        // Mouse repulsion
        vec2 toMouse = uMouse - pos.xy;
        float dist = length(toMouse);
        if (dist < 2.0) {
          pos.xy -= normalize(toMouse) * (2.0 - dist) * 0.4;
        }
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
        
        vAlpha = 0.6 + 0.4 * sin(uTime + position.x + position.y);
      }
    `,
        fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        
        float alpha = (1.0 - d * 2.0) * vAlpha;
        // Glow
        float glow = exp(-d * 5.0) * 0.5;
        gl_FragColor = vec4(vColor + glow, alpha);
      }
    `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Castle silhouette (wireframe lines)
    const castlePoints = [
        // Main tower
        new THREE.Vector3(-0.15, -2, -3), new THREE.Vector3(-0.15, 0.8, -3),
        new THREE.Vector3(0.15, -2, -3), new THREE.Vector3(0.15, 0.8, -3),
        new THREE.Vector3(-0.15, 0.8, -3), new THREE.Vector3(0, 1.5, -3),
        new THREE.Vector3(0.15, 0.8, -3), new THREE.Vector3(0, 1.5, -3),
    ];

    const lineGeo = new THREE.BufferGeometry().setFromPoints(castlePoints);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xC9A84C, opacity: 0.15, transparent: true });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // Mouse tracking
    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Animate
    let clock = { start: Date.now() };
    const hero = document.getElementById('hero');

    function animate() {
        if (!hero.getBoundingClientRect().bottom > -100) {
            requestAnimationFrame(animate);
            return;
        }
        requestAnimationFrame(animate);

        const t = (Date.now() - clock.start) / 1000;
        material.uniforms.uTime.value = t;
        material.uniforms.uMouse.value.set(mouseX * 3, mouseY * 3);

        // Slowly rotate particles
        particles.rotation.y = t * 0.03;
        particles.rotation.x = Math.sin(t * 0.05) * 0.1;

        // Camera parallax
        camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.02;
        camera.position.y += (mouseY * 0.5 - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
    }
    animate();
}

// ── Custom Cursor ──────────────────────────────
function initCursor() {
    const cursor = document.getElementById('cursor');
    const trail = document.getElementById('cursorTrail');
    let cx = 0, cy = 0;
    let tx = 0, ty = 0;

    document.addEventListener('mousemove', (e) => {
        cx = e.clientX; cy = e.clientY;
        cursor.style.left = cx + 'px';
        cursor.style.top = cy + 'px';
    });

    // Trail follows with lag
    function updateTrail() {
        tx += (cx - tx) * 0.12;
        ty += (cy - ty) * 0.12;
        trail.style.left = tx + 'px';
        trail.style.top = ty + 'px';
        requestAnimationFrame(updateTrail);
    }
    updateTrail();

    // Hover effects
    const hoverables = document.querySelectorAll('button, a, .world-card, .story-card, .char-card, .magic-orb, .track-btn');
    hoverables.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hovered');
            trail.classList.add('hovered');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hovered');
            trail.classList.remove('hovered');
        });
    });
}

// ── Navigation ────────────────────────────────
function initNav() {
    const nav = document.getElementById('nav');
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 80);
    });

    // Smooth scroll for nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const id = link.getAttribute('data-section');
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Begin journey button
    document.getElementById('beginJourney')?.addEventListener('click', () => {
        document.getElementById('worlds').scrollIntoView({ behavior: 'smooth' });
        addMagic(15);
    });

    document.getElementById('exploreBtn')?.addEventListener('click', () => {
        openModal({
            title: 'The Disney Story',
            emoji: '🎬',
            body: `Since 1923, The Walt Disney Company has been weaving magic into every frame, every theme park, every character. From a humble sketch of a mouse to galaxies far, far away — every story begins with someone who dared to dream. Welcome to where magic lives.`,
            quote: '"All our dreams can come true, if we have the courage to pursue them." — Walt Disney'
        });
    });
}

// ── Hero Sparkles ─────────────────────────────
function initSparkles() {
    const container = document.getElementById('sparkles');
    if (!container) return;

    function createSparkle() {
        const s = document.createElement('div');
        s.className = 'sparkle';
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const dur = 3 + Math.random() * 4;
        const dx1 = (Math.random() - 0.5) * 60;
        const dy1 = -20 - Math.random() * 40;
        const dx2 = (Math.random() - 0.5) * 120;
        const dy2 = -60 - Math.random() * 80;

        s.style.cssText = `
      left: ${x}%; top: ${y}%;
      --dur: ${dur}s;
      --delay: ${Math.random() * 4}s;
      --dx1: ${dx1}px; --dy1: ${dy1}px;
      --dx2: ${dx2}px; --dy2: ${dy2}px;
      opacity: 0;
      width: ${2 + Math.random() * 4}px;
      height: ${2 + Math.random() * 4}px;
      background: ${Math.random() > 0.5 ? '#F5E6A3' : '#C9A84C'};
      box-shadow: 0 0 6px ${Math.random() > 0.5 ? '#F5E6A3' : '#C9A84C'};
    `;
        container.appendChild(s);
        setTimeout(() => { if (s.parentNode) s.parentNode.removeChild(s); }, (dur + 4) * 1000);
    }

    // Create initial batch
    for (let i = 0; i < 20; i++) setTimeout(createSparkle, i * 200);
    setInterval(createSparkle, 600);
}

// ── Worlds Portal ─────────────────────────────
function initWorldsPortal() {
    const cards = document.querySelectorAll('.world-card');
    const portalCenter = document.getElementById('portalCenter');
    const portalPreview = document.getElementById('portalPreview');

    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            const world = card.dataset.world;
            const color = card.dataset.color;
            const desc = card.dataset.desc;
            const icon = card.querySelector('.world-icon').textContent;
            const name = card.querySelector('span').textContent;

            // Update portal center
            portalCenter.style.background = `radial-gradient(circle, ${color}22 0%, rgba(8,15,42,0.9) 100%)`;
            portalCenter.style.boxShadow = `0 0 60px ${color}33, inset 0 0 40px ${color}11`;
            portalCenter.style.borderColor = color + '66';

            portalPreview.innerHTML = `
        <span class="portal-emoji">${icon}</span>
        <div class="portal-name">${name}</div>
        <div class="portal-desc">${desc}</div>
      `;
            addMagic(3);
        });

        card.addEventListener('mouseleave', () => {
            portalCenter.style.background = '';
            portalCenter.style.boxShadow = '';
            portalCenter.style.borderColor = '';
            portalPreview.innerHTML = '<p>Hover a world</p>';
        });

        card.addEventListener('click', () => {
            const world = card.dataset.world;
            const icon = card.querySelector('.world-icon').textContent;
            const name = card.querySelector('span').textContent;
            const desc = card.dataset.desc;

            openModal({ title: name, emoji: icon, body: desc + ' Explore this world and discover countless stories waiting for you.', quote: 'Your adventure starts now.' });
            addMagic(8);
        });
    });

    // Orbit animation on hover
    const orbit = document.getElementById('worldsOrbit');
    let isOrbiting = true;
    let orbitAngle = 0;

    // Optional: auto-rotate the orbit container slowly
    function autoRotate() {
        if (isOrbiting) {
            orbitAngle += 0.05;
            // We'll do this via CSS instead
        }
        requestAnimationFrame(autoRotate);
    }
    // Keep CSS animation for orbiting ring; cards are positioned individually
}

// ── Stories Slider ────────────────────────────
function initStoriesSlider() {
    const track = document.getElementById('storiesTrack');
    const dotsContainer = document.getElementById('trackDots');
    if (!track) return;

    const cards = track.querySelectorAll('.story-card');
    const cardWidth = 320 + 32; // width + gap
    let current = 0;
    const total = cards.length;

    // Create dots
    cards.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'track-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(dot);
    });

    function goTo(idx) {
        current = Math.max(0, Math.min(idx, total - 1));
        track.style.transform = `translateX(-${current * cardWidth}px)`;
        document.querySelectorAll('.track-dot').forEach((d, i) => {
            d.classList.toggle('active', i === current);
        });
    }

    document.getElementById('trackPrev')?.addEventListener('click', () => { goTo(current - 1); addMagic(2); });
    document.getElementById('trackNext')?.addEventListener('click', () => { goTo(current + 1); addMagic(2); });

    // Story card interactions
    cards.forEach((card, i) => {
        const enterBtn = card.querySelector('.story-enter');
        const name = card.querySelector('.story-name')?.textContent;
        const excerpt = card.querySelector('.story-excerpt')?.textContent;
        const glyph = card.querySelector('.story-glyph')?.textContent;
        const year = card.querySelector('.story-year')?.textContent;

        enterBtn?.addEventListener('click', () => {
            openModal({
                title: name,
                emoji: glyph,
                subtitle: year,
                body: excerpt + ' Experience the timeless magic of this beloved tale — where every scene tells a story, every song lifts the spirit, and every ending reminds us why we believe.',
                quote: 'A tale for the ages.'
            });
            addMagic(10);
        });

        // Particle shimmer on hover
        card.addEventListener('mouseenter', () => createCardParticles(card));
    });
}

function createCardParticles(card) {
    const container = card.querySelector('.story-particles');
    if (!container) return;

    for (let i = 0; i < 6; i++) {
        const p = document.createElement('div');
        p.style.cssText = `
      position: absolute;
      width: 3px; height: 3px;
      border-radius: 50%;
      background: #C9A84C;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      opacity: 0;
      animation: sparkleFly ${1.5 + Math.random()}s ease-out forwards;
      --dx1: ${(Math.random() - 0.5) * 40}px;
      --dy1: ${-10 - Math.random() * 20}px;
      --dx2: ${(Math.random() - 0.5) * 60}px;
      --dy2: ${-30 - Math.random() * 40}px;
    `;
        container.appendChild(p);
        setTimeout(() => p.remove(), 3000);
    }
}

// ── Magic Orb / Gamification ───────────────────
let magicTotal = 0;
const MAGIC_MAX = 100;
const achievements = [
    { req: 10, id: 0, label: 'First Spark' },
    { req: 30, id: 1, label: 'Castle Explorer' },
    { req: 60, id: 2, label: 'Ocean Wanderer' },
    { req: 100, id: 3, label: 'True Believer' },
];

const orbMessages = [
    'Magic collected! ✨',
    'The force is strong! 🌟',
    'Believe in the magic! 💫',
    'You found a spell! 🪄',
    'Dreams taking shape… 🌙',
    'Fairy dust gathered! 🧚',
];

function addMagic(amount) {
    const prev = magicTotal;
    magicTotal = Math.min(MAGIC_MAX, magicTotal + amount);

    const fill = document.getElementById('magicFill');
    const count = document.getElementById('magicCount');
    if (fill) fill.style.width = (magicTotal / MAGIC_MAX * 100) + '%';
    if (count) count.textContent = `${Math.floor(magicTotal)} / ${MAGIC_MAX}`;

    // Check achievements
    achievements.forEach((ach, i) => {
        if (prev < ach.req && magicTotal >= ach.req) {
            const el = document.querySelectorAll('.achievement')[i];
            if (el) {
                el.classList.remove('locked');
                el.classList.add('unlocked');
                showFloatingText('🏆 ' + ach.label + ' Unlocked!', el);
            }
        }
    });
}

function initMagicOrb() {
    const orb = document.getElementById('magicOrb');
    const orbText = document.getElementById('orbText');
    if (!orb) return;

    let clicks = 0;

    orb.addEventListener('click', () => {
        clicks++;
        orb.classList.add('clicked');
        setTimeout(() => orb.classList.remove('clicked'), 400);

        addMagic(5 + Math.floor(Math.random() * 8));
        orbText.textContent = orbMessages[clicks % orbMessages.length];

        // Spawn floating emojis
        const emojis = ['✨', '⭐', '🌟', '💫', '🪄', '🌙'];
        for (let i = 0; i < 5; i++) {
            setTimeout(() => spawnFloatEmoji(orb, emojis[Math.floor(Math.random() * emojis.length)]), i * 100);
        }
    });
}

function spawnFloatEmoji(anchor, emoji) {
    const rect = anchor.getBoundingClientRect();
    const p = document.createElement('div');
    p.className = 'float-particle';
    p.textContent = emoji;
    p.style.cssText = `
    left: ${rect.left + rect.width / 2 + (Math.random() - 0.5) * 80}px;
    top: ${rect.top + rect.height / 2}px;
  `;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 2000);
}

function showFloatingText(text, anchor) {
    const rect = anchor.getBoundingClientRect();
    const el = document.createElement('div');
    el.style.cssText = `
    position: fixed;
    left: ${rect.left}px;
    top: ${rect.top - 10}px;
    font-family: 'Montserrat', sans-serif;
    font-size: 0.75rem;
    color: #F5E6A3;
    pointer-events: none;
    z-index: 9000;
    animation: floatUp 2s ease-out forwards;
    letter-spacing: 0.1em;
    white-space: nowrap;
  `;
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
}

// ── Modal ─────────────────────────────────────
function initModal() {
    const overlay = document.getElementById('modalOverlay');
    const closeBtn = document.getElementById('modalClose');

    overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    closeBtn?.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

function openModal({ title, emoji, subtitle, body, quote }) {
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    if (!overlay || !content) return;

    content.innerHTML = `
    <div style="text-align:center; margin-bottom:2rem;">
      <div style="font-size:3.5rem; margin-bottom:1rem;">${emoji || '✨'}</div>
      ${subtitle ? `<p style="font-family:var(--font-ui);font-size:0.6rem;letter-spacing:0.3em;color:var(--gold);margin-bottom:0.5rem;">${subtitle}</p>` : ''}
      <h2 style="font-family:var(--font-display);font-size:1.8rem;font-weight:400;color:var(--white);margin-bottom:1.5rem;">${title}</h2>
      <div style="width:40px;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);margin:0 auto 1.5rem;"></div>
    </div>
    <p style="font-family:var(--font-body);font-size:1.1rem;font-weight:300;color:var(--white-dim);line-height:1.9;margin-bottom:2rem;">${body}</p>
    ${quote ? `<blockquote style="font-style:italic;color:var(--gold);border-left:2px solid var(--gold);padding-left:1rem;font-size:0.95rem;opacity:0.8;">${quote}</blockquote>` : ''}
  `;

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// ── Scroll Reveal ─────────────────────────────
function initScrollReveal() {
    // Add reveal class to target elements
    const targets = [
        '.section-header',
        '.story-card',
        '.char-card',
        '.cta-card',
        '.exp-left',
        '.exp-right',
        '.worlds-portal-container',
        '.magic-meter',
        '.achievements',
    ];

    targets.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            el.classList.add('reveal');
        });
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Add magic for exploration
                if (entry.target.classList.contains('cta-card') || entry.target.classList.contains('char-card')) {
                    addMagic(2);
                }
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Stagger children
    document.querySelectorAll('.char-grid .char-card').forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.1}s`;
    });

    document.querySelectorAll('.stories-track .story-card').forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.08}s`;
    });
}

// ── Parallax ──────────────────────────────────
function initParallax() {
    const hero = document.getElementById('hero');
    const heroContent = hero?.querySelector('.hero-content');

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        // Hero content parallax
        if (heroContent && scrollY < window.innerHeight) {
            heroContent.style.transform = `translateY(${scrollY * 0.3}px)`;
            heroContent.style.opacity = 1 - scrollY / (window.innerHeight * 0.7);
        }

        // Footer castle parallax
        const footerCastle = document.querySelector('.footer-castle');
        if (footerCastle) {
            const rect = footerCastle.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
                const progress = (window.innerHeight - rect.top) / window.innerHeight;
                footerCastle.style.transform = `translateX(-50%) translateY(${-progress * 20}px)`;
                footerCastle.style.opacity = 0.2 + progress * 0.3;
            }
        }
    });
}

// ── Dynamic Hover on Characters ──────────────
document.querySelectorAll('.char-card').forEach(card => {
    card.addEventListener('click', () => {
        const name = card.querySelector('h3')?.textContent;
        const desc = card.querySelector('p')?.textContent;
        const quote = card.querySelector('.char-quote')?.textContent;
        const emoji = card.querySelector('.char-emoji')?.textContent;
        openModal({ title: name, emoji, body: desc, quote });
        addMagic(5);
    });
});

// ── CTA Cards Add Magic ───────────────────────
document.querySelectorAll('.cta-card .btn-primary').forEach(btn => {
    btn.addEventListener('click', () => {
        addMagic(12);
        const icon = btn.closest('.cta-card')?.querySelector('.cta-icon')?.textContent;
        const title = btn.closest('.cta-card')?.querySelector('h3')?.textContent;
        openModal({
            title,
            emoji: icon,
            body: 'Coming soon! This experience is being crafted with the same love and detail that goes into every Disney story. Stay tuned for something truly magical.',
            quote: 'The best is yet to come.'
        });
    });
});

// ── Mouse Sparkle Trail on Click ─────────────
document.addEventListener('click', (e) => {
    const emojis = ['✨', '⭐', '💫', '🌟'];
    const p = document.createElement('div');
    p.className = 'float-particle';
    p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    p.style.cssText = `
    left: ${e.clientX}px;
    top: ${e.clientY}px;
    font-size: 1.2rem;
    pointer-events: none;
  `;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 2000);
});

// ── Track dots ────────────────────────────────
// Re-init dots click to use cursor: none
setTimeout(() => {
    document.querySelectorAll('.track-dot').forEach(dot => {
        dot.style.cursor = 'none';
    });
}, 500);

console.log('%c🏰 Disney — Where Magic Lives', 'font-family: serif; font-size: 2rem; color: #C9A84C;');
console.log('%cBuilt with ✨ Three.js + Vanilla JS', 'font-family: monospace; color: #888;');