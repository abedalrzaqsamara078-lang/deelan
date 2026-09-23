/**
 * =============================================================================
 * Forever With You — Dedicated to Deelan ❤️
 * Interactive Romantic Story Engine & 120 FPS Silky Beating Heart
 * =============================================================================
 */

(function () {
  'use strict';

  // DOM Elements
  const canvas = document.getElementById('heartCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const ambientGlow = document.getElementById('ambientGlow');
  const romanticHeader = document.getElementById('romanticHeader');
  const romanticFooter = document.getElementById('romanticFooter');
  const storyContainer = document.getElementById('storyContainer');

  // Story Screens
  const screenIntro = document.getElementById('screenIntro');
  const screenStage1 = document.getElementById('screenStage1');
  const screenStage2 = document.getElementById('screenStage2');
  const screenStage3 = document.getElementById('screenStage3');
  const screenClimax = document.getElementById('screenClimax');

  // Buttons
  const btnStartJourney = document.getElementById('btnStartJourney');
  const btnSkipToHeart = document.getElementById('btnSkipToHeart');
  const btnNextStage1 = document.getElementById('btnNextStage1');
  const btnNextStage2 = document.getElementById('btnNextStage2');
  const btnNextStage3 = document.getElementById('btnNextStage3');
  const btnAcceptRoses = document.getElementById('btnAcceptRoses');
  const btnReplayStory = document.getElementById('btnReplayStory');
  const musicToggleBtn = document.getElementById('musicToggleBtn');
  const musicBtnLabel = document.getElementById('musicBtnLabel');

  // Stage Viewports & HUDs
  const itemsStage1 = document.getElementById('itemsStage1');
  const counterStage1 = document.getElementById('counterStage1');
  const whisperStage1 = document.getElementById('whisperStage1');

  const itemsStage2 = document.getElementById('itemsStage2');
  const counterStage2 = document.getElementById('counterStage2');
  const whisperStage2 = document.getElementById('whisperStage2');

  const goldenKeyItem = document.getElementById('goldenKeyItem');
  const gateLeft = document.getElementById('gateLeft');
  const gateRight = document.getElementById('gateRight');
  const whisperStage3 = document.getElementById('whisperStage3');
  const fallingPetalsRain = document.getElementById('fallingPetalsRain');

  // ---------------------------------------------------------------------------
  // Romantic Palette & Sprites
  // ---------------------------------------------------------------------------
  const COLOR_BG = '#060208';
  const COLOR_CORE_RGBA = 'rgba(185, 15, 60, 0.70)';
  const COLOR_TIP_RGBA = 'rgba(255, 210, 235, 0.95)';
  const COLOR_HEART_RED = 'rgb(255, 24, 64)';
  const COLOR_TEXT_MAIN = '#fff8fc';
  const COLOR_TEXT_GLOW = 'rgba(255, 50, 125, 0.95)';

  // ---------------------------------------------------------------------------
  // Heart Parametric Formula & Precomputations
  // ---------------------------------------------------------------------------
  function getHeartPoint(t) {
    const x = 16.0 * Math.pow(Math.sin(t), 3) * 1.08;
    let y = -(13.0 * Math.cos(t) - 5.0 * Math.cos(2.0 * t) - 2.0 * Math.cos(3.0 * t) - Math.cos(4.0 * t));
    const distToTip = Math.abs(Math.PI - t);
    if (distToTip < 0.25) {
      y -= (0.25 - distToTip) * 3.5;
    }
    return { x, y };
  }

  function getHeartNormal(t) {
    const dt = 0.002;
    const p1 = getHeartPoint(t - dt);
    const p2 = getHeartPoint(t + dt);
    let tx = p2.x - p1.x;
    let ty = p2.y - p1.y;
    const mag = Math.hypot(tx, ty);
    if (mag === 0) return { nx: 0, ny: 0 };
    tx /= mag;
    ty /= mag;
    let nx = -ty;
    let ny = tx;
    const hp = getHeartPoint(t);
    if (nx * hp.x + ny * hp.y < 0) {
      nx = -nx;
      ny = -ny;
    }
    return { nx, ny };
  }

  const NUM_SAMPLES = 3000;
  const phis = [];
  const radii = [];
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const t = (2.0 * Math.PI * i) / NUM_SAMPLES;
    const pt = getHeartPoint(t);
    phis.push(Math.atan2(pt.y, pt.x));
    radii.push(Math.hypot(pt.x, pt.y));
  }

  const sortedIndices = Array.from({ length: NUM_SAMPLES }, (_, i) => i)
    .sort((a, b) => phis[a] - phis[b]);
  const phisSorted = sortedIndices.map(i => phis[i]);
  const radiiSorted = sortedIndices.map(i => radii[i]);

  function getMaxRadius(phi) {
    let low = 0, high = phisSorted.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (phisSorted[mid] < phi) low = mid + 1;
      else high = mid - 1;
    }
    if (low === 0) return radiiSorted[0];
    if (low >= phisSorted.length) return radiiSorted[radiiSorted.length - 1];
    const p0 = phisSorted[low - 1], p1 = phisSorted[low];
    const r0 = radiiSorted[low - 1], r1 = radiiSorted[low];
    const denom = p1 - p0;
    if (denom === 0) return r0;
    return r0 + (r1 - r0) * ((phi - p0) / denom);
  }

  // Pre-rendered Heart Sprites Cache
  const _OFFSCREEN_SPRITES = {};

  function createHeartSprite(size) {
    const dim = Math.round(size * 2.6);
    const cvs = document.createElement('canvas');
    cvs.width = dim;
    cvs.height = dim;
    const c = cvs.getContext('2d');
    const cx = dim / 2;
    const cy = dim / 2;

    // Outer glow
    c.shadowColor = 'rgba(255, 30, 80, 0.9)';
    c.shadowBlur = Math.round(dim * 0.25);
    c.fillStyle = COLOR_HEART_RED;

    c.beginPath();
    const s = size / 28;
    for (let i = 0; i <= 24; i++) {
      const t = (2.0 * Math.PI * i) / 24.0;
      const hx = 16.0 * Math.pow(Math.sin(t), 3) * s;
      const hy = -(13.0 * Math.cos(t) - 5.0 * Math.cos(2.0 * t) - 2.0 * Math.cos(3.0 * t) - Math.cos(4.0 * t)) * s;
      if (i === 0) c.moveTo(cx + hx, cy + hy);
      else c.lineTo(cx + hx, cy + hy);
    }
    c.closePath();
    c.fill();

    // Inner highlight
    c.shadowBlur = 0;
    c.fillStyle = 'rgba(255, 210, 235, 0.65)';
    c.beginPath();
    const sInner = s * 0.55;
    for (let i = 0; i <= 24; i++) {
      const t = (2.0 * Math.PI * i) / 24.0;
      const hx = 16.0 * Math.pow(Math.sin(t), 3) * sInner;
      const hy = -(13.0 * Math.cos(t) - 5.0 * Math.cos(2.0 * t) - 2.0 * Math.cos(3.0 * t) - Math.cos(4.0 * t)) * sInner - 1.5;
      if (i === 0) c.moveTo(cx + hx, cy + hy);
      else c.lineTo(cx + hx, cy + hy);
    }
    c.closePath();
    c.fill();

    return { cvs, half: dim / 2 };
  }

  function getHeartSprite(size) {
    const key = Math.round(size);
    if (!_OFFSCREEN_SPRITES[key]) {
      _OFFSCREEN_SPRITES[key] = createHeartSprite(key);
    }
    return _OFFSCREEN_SPRITES[key];
  }
  [16, 20, 24, 28].forEach(getHeartSprite);

  // Silky Fibers
  let fibers = [];

  function buildFibers() {
    fibers = [];
    const totalCount = 9500;
    const interiorCount = 7200;
    const rimCount = totalCount - interiorCount;

    for (let i = 0; i < interiorCount; i++) {
      const phi = (Math.random() * 2.0 - 1.0) * Math.PI;
      const maxR = getMaxRadius(phi);
      const rFrac = Math.pow(Math.random(), 0.62) * 0.99;
      const baseR = maxR * rFrac;
      const flen = (7.0 + Math.random() * 11.0) * (0.6 + 0.65 * rFrac);
      const fan = (Math.random() + Math.random() - 1.0) * 0.22;
      const baseAngle = phi + fan;
      const curveBias = (Math.random() - 0.5) * 0.20;

      fibers.push({
        baseR, flen, phi, baseAngle, curveBias,
        cosP: Math.cos(phi), sinP: Math.sin(phi),
        isRim: false
      });
    }

    for (let i = 0; i < rimCount; i++) {
      const t = Math.random() * 2.0 * Math.PI;
      const hp = getHeartPoint(t);
      const norm = getHeartNormal(t);
      const phi = Math.atan2(hp.y, hp.x);
      const maxR = Math.hypot(hp.y, hp.x);
      const baseR = maxR * (1.0 + (Math.random() * 0.035 - 0.02));
      const flen = (Math.random() < 0.2) ? (12.0 + Math.random() * 10.0) : (6.0 + Math.random() * 8.0);
      const normAng = Math.atan2(norm.ny, norm.nx);
      const angle = normAng + (Math.random() + Math.random() - 1.0) * 0.25;
      const curveBias = (Math.random() - 0.5) * 0.20;

      fibers.push({
        baseR, flen, phi, baseAngle: angle, curveBias,
        cosP: Math.cos(phi), sinP: Math.sin(phi),
        isRim: true
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Romantic Poetry Whispers
  // ---------------------------------------------------------------------------
  const ROMANTIC_POETRY = [
    "Deelan, My Everything",
    "Forever Yours, Deelan",
    "My Soulmate Deelan",
    "You Are My Universe",
    "Every Beat is Yours",
    "My Endless Love",
    "The Light of My Life",
    "Breathtakingly Beautiful",
    "My Heart Belongs to You",
    "Lost in Your Love",
    "Pure Magic With You",
    "My One & Only Love"
  ];

  class FloatingRubyHeart {
    constructor(x, y, size = 20, vx = 0, vy = -1.6) {
      this.x = x;
      this.y = y;
      this.size = size;
      this.vx = vx;
      this.vy = vy;
      this.swaySpeed = 1.4 + Math.random() * 0.8;
      this.swayAmp = 0.5 + Math.random() * 0.6;
      this.swayPhase = Math.random() * Math.PI * 2;
      this.life = 140 + Math.floor(Math.random() * 60);
      this.maxLife = this.life;
      this.sprite = getHeartSprite(size);
    }
    update(dt) {
      this.swayPhase += this.swaySpeed * dt;
      this.x += this.vx + Math.sin(this.swayPhase) * this.swayAmp;
      this.y += this.vy;
      this.vy *= 0.992;
      this.life--;
      return this.life > 0 && this.y > 110;
    }
    draw(c) {
      const p = this.life / this.maxLife;
      let alpha = p < 0.85 ? p * p * (3.0 - 2.0 * p) : (1.0 - p) / 0.15;
      if (this.y < 165) alpha *= Math.max(0, (this.y - 110) / 55.0);
      if (alpha <= 0) return;
      c.save();
      c.globalAlpha = Math.max(0, Math.min(1, alpha));
      c.drawImage(this.sprite.cvs, this.x - this.sprite.half, this.y - this.sprite.half);
      c.restore();
    }
  }

  class FairyDustSpark {
    constructor(x, y, vx, vy, color) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color;
      this.size = 1.4 + Math.random() * 1.4;
      this.life = 45 + Math.floor(Math.random() * 35);
      this.maxLife = this.life;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.965;
      this.vy *= 0.965;
      this.vy -= 0.02;
      this.life--;
      return this.life > 0 && this.y > 110;
    }
    draw(c) {
      const p = this.life / this.maxLife;
      let alpha = p * p * (3.0 - 2.0 * p);
      if (this.y < 155) alpha *= Math.max(0, (this.y - 110) / 45.0);
      if (alpha <= 0) return;
      c.save();
      c.globalAlpha = Math.max(0, Math.min(1, alpha));
      c.fillStyle = this.color;
      c.beginPath();
      c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  }

  class CelestialPoemWhisper {
    constructor(text, x, y) {
      this.text = text;
      this.x = x;
      this.y = y;
      this.vy = -0.75;
      this.life = 220;
      this.maxLife = this.life;
    }
    update() {
      this.y += this.vy;
      this.life--;
      return this.life > 0 && this.y > 110;
    }
    draw(c) {
      const p = this.life / this.maxLife;
      let alpha = p > 0.8 ? (1.0 - p) / 0.2 : p / 0.8;
      if (this.y < 165) alpha *= Math.max(0, (this.y - 110) / 55.0);
      alpha = Math.max(0, Math.min(1, alpha));
      if (alpha <= 0) return;

      c.save();
      c.font = "bold 24px 'Alex Brush', 'Monotype Corsiva', cursive";
      c.textAlign = 'center';
      c.textBaseline = 'middle';

      c.globalAlpha = alpha * 0.70;
      c.fillStyle = '#ff327d';
      c.fillText(this.text, this.x + 1, this.y + 1);
      c.fillText(this.text, this.x - 1, this.y - 1);

      c.globalAlpha = alpha;
      c.fillStyle = COLOR_TEXT_MAIN;
      c.fillText(this.text, this.x, this.y);
      c.restore();
    }
  }

  const rubyHearts = [];
  const fairyDust = [];
  const poeticWhispers = [];
  let lastWhisperTime = -10.0;
  let whisperLaneToggle = 0;

  // ---------------------------------------------------------------------------
  // Harmonic Physics & Canvas Sizing
  // ---------------------------------------------------------------------------
  let width = window.innerWidth;
  let height = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  let baseScale = 14.5;
  let beatScale = 1.0;
  let prevBeatScale = 1.0;
  let curTipLag = 0.0;
  let springX = 0.0;
  let springV = 0.0;
  let timeSec = 0.0;
  let lastBeatTrigger = false;

  let mouseX = width / 2;
  let mouseY = height / 2;
  let tiltX = 0;
  let tiltY = 0;

  // Mode: 'story' or 'heart'
  let appMode = 'story';

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    const minDim = Math.min(width, height);
    baseScale = (minDim / 700) * 14.5;
    baseScale = Math.max(8.0, Math.min(18.5, baseScale));
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  buildFibers();

  // ---------------------------------------------------------------------------
  // Web Audio API Synthesizer (Zero External Dependencies)
  // ---------------------------------------------------------------------------
  let audioCtx = null;
  let isMusicPlaying = false;
  let chordTimer = null;
  let lastThumpTime = 0;

  function initAudio() {
    if (!audioCtx) {
      const AudioClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playHeartbeatThump(vol = 0.55, pitch = 1.0) {
    if (!isMusicPlaying || !audioCtx) return;
    const now = audioCtx.currentTime;
    if (now - lastThumpTime < 0.12) return;
    lastThumpTime = now;

    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(46 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(24 * pitch, now + 0.16);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(105, now);
      filter.frequency.linearRampToValueAtTime(45, now + 0.16);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(vol * 0.65, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {}
  }

  // Sweet Sound Effect Chimes for Mini-Tasks
  function playSweetChime(freq = 523.25) { // C5
    initAudio();
    if (!audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.35);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {}
  }

  const ROMANTIC_CHORDS = [
    [146.83, 220.00, 277.18, 369.99, 440.00], // Dmaj7
    [123.47, 185.00, 220.00, 293.66, 369.99], // Bm9
    [98.00, 146.83, 196.00, 293.66, 369.99],  // Gmaj7
    [110.00, 164.81, 220.00, 293.66, 329.63]  // A7sus4
  ];
  let chordIdx = 0;

  function playAmbientPadChord() {
    if (!isMusicPlaying || !audioCtx) return;
    try {
      const freqs = ROMANTIC_CHORDS[chordIdx];
      chordIdx = (chordIdx + 1) % ROMANTIC_CHORDS.length;
      const now = audioCtx.currentTime;
      const chordDuration = 5.2;

      freqs.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(420 + idx * 45, now);

        const noteVol = idx === 0 ? 0.07 : 0.028;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(noteVol, now + 1.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + chordDuration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + chordDuration + 0.1);
      });
    } catch (e) {}
  }

  function startRomanticAudio() {
    initAudio();
    isMusicPlaying = true;
    musicToggleBtn.classList.add('active');
    musicBtnLabel.textContent = 'Playing For Deelan ❤️';
    playAmbientPadChord();
    if (chordTimer) clearInterval(chordTimer);
    chordTimer = setInterval(playAmbientPadChord, 5000);
  }

  function stopRomanticAudio() {
    isMusicPlaying = false;
    musicToggleBtn.classList.remove('active');
    musicBtnLabel.textContent = 'Play Romantic Music';
    if (chordTimer) {
      clearInterval(chordTimer);
      chordTimer = null;
    }
  }

  musicToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isMusicPlaying) stopRomanticAudio();
    else startRomanticAudio();
  });

  // ---------------------------------------------------------------------------
  // Interactive Story Stages Engine
  // ---------------------------------------------------------------------------
  const allScreens = [screenIntro, screenStage1, screenStage2, screenStage3, screenClimax];

  function showScreen(targetScreen) {
    allScreens.forEach(scr => scr.classList.remove('active'));
    targetScreen.classList.add('active');
  }

  function switchToHeartMode() {
    appMode = 'heart';
    storyContainer.classList.add('hidden');
    romanticHeader.classList.add('visible');
    romanticFooter.classList.add('visible');
    if (!isMusicPlaying) startRomanticAudio();

    // Spawn loving celebratory burst
    const cx = width / 2;
    const cy = height / 2;
    for (let i = 0; i < 6; i++) {
      rubyHearts.push(new FloatingRubyHeart(cx + (Math.random() - 0.5) * 120, cy + (Math.random() - 0.5) * 120, 24));
    }
  }

  function switchToStoryMode() {
    appMode = 'story';
    storyContainer.classList.remove('hidden');
    romanticHeader.classList.remove('visible');
    romanticFooter.classList.remove('visible');
    showScreen(screenIntro);
  }

  // --- Stage 1 Logic: Catch 3 Starlight Hearts ---
  let starsCaught = 0;
  const stage1Whispers = [
    "Every step brings me closer to you, Deelan...",
    "In a universe of billions, you are my only light...",
    "My heart has always known the way to you ❤️"
  ];

  function initStage1() {
    starsCaught = 0;
    counterStage1.textContent = "⭐ 0 / 3 Caught";
    whisperStage1.textContent = "";
    btnNextStage1.disabled = true;
    itemsStage1.innerHTML = "";

    const positions = [
      { top: '25%', left: '48%' },
      { top: '48%', left: '68%' },
      { top: '65%', left: '38%' }
    ];

    positions.forEach((pos, idx) => {
      const star = document.createElement('div');
      star.className = 'starlight-heart-item';
      star.style.top = pos.top;
      star.style.left = pos.left;
      star.style.animationDelay = (idx * 0.4) + 's';
      star.innerHTML = `
        <div class="star-icon-wrap">⭐</div>
      `;

      star.addEventListener('click', (e) => {
        e.stopPropagation();
        star.style.pointerEvents = 'none';
        star.style.transform = 'scale(1.6)';
        star.style.opacity = '0';
        setTimeout(() => star.remove(), 350);

        starsCaught++;
        playSweetChime(523.25 + idx * 110);
        counterStage1.textContent = `⭐ ${starsCaught} / 3 Caught`;
        whisperStage1.textContent = stage1Whispers[idx] || "Almost there, Deelan...";

        if (starsCaught >= 3) {
          btnNextStage1.disabled = false;
        }
      });

      itemsStage1.appendChild(star);
    });
  }

  // --- Stage 2 Logic: Clear 3 Rose Petal Clusters ---
  let petalsCleared = 0;
  const stage2Whispers = [
    "No distance could ever keep our souls apart...",
    "Every rose blooms with your name, Deelan...",
    "The bridge is glowing with our love 🌸"
  ];

  function initStage2() {
    petalsCleared = 0;
    counterStage2.textContent = "🌸 0 / 3 Petals Cleared";
    whisperStage2.textContent = "";
    btnNextStage2.disabled = true;
    itemsStage2.innerHTML = "";

    const positions = [
      { top: '40%', left: '46%' },
      { top: '56%', left: '62%' },
      { top: '32%', left: '74%' }
    ];

    positions.forEach((pos, idx) => {
      const rose = document.createElement('div');
      rose.className = 'rose-cluster-item';
      rose.style.top = pos.top;
      rose.style.left = pos.left;
      rose.style.animationDelay = (idx * 0.5) + 's';
      rose.innerHTML = `
        <div class="rose-icon-wrap">🌸</div>
      `;

      rose.addEventListener('click', (e) => {
        e.stopPropagation();
        rose.style.pointerEvents = 'none';
        rose.style.transform = 'scale(1.5) rotate(45deg)';
        rose.style.opacity = '0';
        setTimeout(() => rose.remove(), 350);

        petalsCleared++;
        playSweetChime(587.33 + idx * 95);
        counterStage2.textContent = `🌸 ${petalsCleared} / 3 Petals Cleared`;
        whisperStage2.textContent = stage2Whispers[idx] || "You are so close to him, Deelan...";

        if (petalsCleared >= 3) {
          btnNextStage2.disabled = false;
        }
      });

      itemsStage2.appendChild(rose);
    });
  }

  // --- Stage 3 Logic: Golden Heart Key ---
  function initStage3() {
    goldenKeyItem.classList.remove('unlocked');
    const gateScenery = document.querySelector('.gate-scenery');
    if (gateScenery) gateScenery.classList.remove('open');
    whisperStage3.textContent = "";
    btnNextStage3.disabled = true;

    goldenKeyItem.onclick = (e) => {
      e.stopPropagation();
      playSweetChime(659.25);
      setTimeout(() => playSweetChime(880.00), 160);

      goldenKeyItem.classList.add('unlocked');
      if (gateScenery) gateScenery.classList.add('open');
      whisperStage3.textContent = "He is waiting right here for you, Deelan ✨";
      btnNextStage3.disabled = false;
    };
  }

  // --- Stage 4 Logic: Grand Climax & Bouquet Reveal ---
  function initClimax() {
    if (!isMusicPlaying) startRomanticAudio();
    playSweetChime(440.00);
    setTimeout(() => playSweetChime(659.25), 200);

    // Falling petals rain generator
    fallingPetalsRain.innerHTML = "";
    for (let i = 0; i < 20; i++) {
      const petal = document.createElement('div');
      petal.textContent = Math.random() < 0.5 ? '🌸' : '🌹';
      petal.style.position = 'absolute';
      petal.style.left = Math.random() * 100 + '%';
      petal.style.top = '-20px';
      petal.style.fontSize = (14 + Math.random() * 12) + 'px';
      petal.style.opacity = (0.5 + Math.random() * 0.5).toString();
      petal.style.animation = `petal-fall ${3 + Math.random() * 3}s linear infinite`;
      petal.style.animationDelay = (Math.random() * 3) + 's';
      fallingPetalsRain.appendChild(petal);
    }
  }

  // Inject dynamic keyframe for petal rain
  const petalStyle = document.createElement('style');
  petalStyle.textContent = `
    @keyframes petal-fall {
      0% { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
    }
  `;
  document.head.appendChild(petalStyle);

  // Button Listeners
  btnStartJourney.addEventListener('click', () => {
    initAudio();
    if (!isMusicPlaying) startRomanticAudio();
    initStage1();
    showScreen(screenStage1);
  });

  btnSkipToHeart.addEventListener('click', () => {
    switchToHeartMode();
  });

  btnNextStage1.addEventListener('click', () => {
    initStage2();
    showScreen(screenStage2);
  });

  btnNextStage2.addEventListener('click', () => {
    initStage3();
    showScreen(screenStage3);
  });

  btnNextStage3.addEventListener('click', () => {
    initClimax();
    showScreen(screenClimax);
  });

  btnAcceptRoses.addEventListener('click', () => {
    // Jubilant celebration
    playSweetChime(523.25);
    setTimeout(() => playSweetChime(659.25), 150);
    setTimeout(() => playSweetChime(783.99), 300);
    setTimeout(() => playSweetChime(1046.50), 450);

    btnAcceptRoses.disabled = true;
    btnAcceptRoses.innerHTML = "<span>Forever Yours, Deelan ❤️</span>";

    setTimeout(() => {
      switchToHeartMode();
    }, 1200);
  });

  btnReplayStory.addEventListener('click', () => {
    switchToStoryMode();
  });

  // ---------------------------------------------------------------------------
  // Canvas Click / Particle Interaction (In Heart Mode)
  // ---------------------------------------------------------------------------
  function triggerPoeticWhisper(cx, cy) {
    const now = timeSec;
    if (now - lastWhisperTime < 1.4 || poeticWhispers.length >= 2) return;
    lastWhisperTime = now;

    const text = ROMANTIC_POETRY[Math.floor(Math.random() * ROMANTIC_POETRY.length)];
    const laneX = whisperLaneToggle === 0 ? cx - 210 : cx + 210;
    whisperLaneToggle = 1 - whisperLaneToggle;
    const startY = cy - 60 + (Math.random() * 40 - 20);

    poeticWhispers.push(new CelestialPoemWhisper(text, laneX, startY));
  }

  function handleUserClick() {
    if (appMode !== 'heart') return;

    if (!isMusicPlaying) startRomanticAudio();
    playHeartbeatThump(0.75, 1.05);

    // Harmonic spring impulse
    springV = Math.min(2.4, springV + 0.85);

    const cx = width / 2 + tiltX;
    const cy = height / 2 - 15 + tiltY;

    // Burst ruby hearts
    if (rubyHearts.length < 14) {
      const count = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const t = Math.random() * 2 * Math.PI;
        const hp = getHeartPoint(t);
        const norm = getHeartNormal(t);
        const scale = baseScale * beatScale;
        const px = cx + hp.x * scale + norm.nx * (15 + Math.random() * 30);
        const py = cy + hp.y * scale + norm.ny * (15 + Math.random() * 30);
        const vx = norm.nx * (0.4 + Math.random() * 0.8) + (Math.random() - 0.5) * 0.6;
        const vy = norm.ny * (0.4 + Math.random() * 0.8) - (1.2 + Math.random() * 1.0);
        const size = [16, 20, 24][Math.floor(Math.random() * 3)];
        rubyHearts.push(new FloatingRubyHeart(px, py, size, vx, vy));
      }
    }

    // Burst fairy dust sparks
    if (fairyDust.length < 35) {
      const count = 6 + Math.floor(Math.random() * 5);
      for (let i = 0; i < count; i++) {
        const t = Math.random() * 2 * Math.PI;
        const hp = getHeartPoint(t);
        const norm = getHeartNormal(t);
        const scale = baseScale * beatScale;
        const px = cx + hp.x * scale + norm.nx * (8 + Math.random() * 20);
        const py = cy + hp.y * scale + norm.ny * (8 + Math.random() * 20);
        const vx = norm.nx * (0.8 + Math.random() * 1.4) + (Math.random() - 0.5) * 0.6;
        const vy = norm.ny * (0.8 + Math.random() * 1.4) - (0.5 + Math.random() * 1.2);
        const col = Math.random() < 0.35 ? '#ffdca0' : (Math.random() < 0.5 ? '#ffb4dc' : '#ff1840');
        fairyDust.push(new FairyDustSpark(px, py, vx, vy, col));
      }
    }

    triggerPoeticWhisper(cx, cy);
  }

  // ---------------------------------------------------------------------------
  // Continuous Physics Loop
  // ---------------------------------------------------------------------------
  const BPM = 60.0;

  function updatePhysics(dt) {
    timeSec += dt;
    const period = 60.0 / BPM;
    const p = (timeSec % period) / period;

    const kSpring = 42.0;
    const cSpring = 8.6;
    const springAcc = -kSpring * springX - cSpring * springV;
    springV += springAcc * dt;
    springX += springV * dt;

    const springOffset = Math.min(0.18, Math.max(0.0, springX));

    const d1 = p - 0.10;
    const d2 = p - 0.28;
    const gaussianLub = Math.exp(-(d1 * d1) / (2.0 * 0.038 * 0.038));
    const gaussianDub = Math.exp(-(d2 * d2) / (2.0 * 0.042 * 0.042));
    const breath = 0.012 * Math.sin(p * Math.PI * 2.0);

    const rawScale = 1.0 + 0.135 * gaussianLub + 0.075 * gaussianDub + breath + springOffset;

    const cx = width / 2 + tiltX;
    const cy = height / 2 - 15 + tiltY;

    if (appMode === 'heart') {
      if (gaussianLub > 0.85) {
        if (!lastBeatTrigger) {
          lastBeatTrigger = true;
          playHeartbeatThump(0.60, 1.0);
          triggerPoeticWhisper(cx, cy);
          if (rubyHearts.length < 8) {
            const hp = getHeartPoint(Math.random() * 2 * Math.PI);
            rubyHearts.push(new FloatingRubyHeart(cx + hp.x * baseScale * rawScale, cy + hp.y * baseScale * rawScale, 18));
          }
        }
      } else if (gaussianDub > 0.8) {
        if (lastBeatTrigger) {
          lastBeatTrigger = false;
          playHeartbeatThump(0.45, 1.15);
        }
      } else {
        if (gaussianLub < 0.2 && gaussianDub < 0.2) {
          lastBeatTrigger = false;
        }
      }
    }

    const scaleVelocity = (rawScale - prevBeatScale) / Math.max(dt, 0.001);
    prevBeatScale = beatScale;
    beatScale = rawScale;

    const targetLag = -scaleVelocity * 0.0055;
    curTipLag += (targetLag - curTipLag) * 0.16;

    if (ambientGlow) {
      const glow = Math.max(gaussianLub, gaussianDub * 0.85);
      ambientGlow.style.opacity = (0.16 + 0.26 * glow).toFixed(2);
      ambientGlow.style.transform = `translate(-50%, -50%) scale(${beatScale.toFixed(2)})`;
    }
  }

  // ---------------------------------------------------------------------------
  // Super-Fast Batched Render Loop (120 FPS Guaranteed)
  // ---------------------------------------------------------------------------
  let lastFrameTime = performance.now();

  function render(now) {
    const dt = Math.min((now - lastFrameTime) / 1000.0, 0.05);
    lastFrameTime = now;

    updatePhysics(dt);

    tiltX += ((mouseX - width / 2) * 0.02 - tiltX) * 0.06;
    tiltY += ((mouseY - height / 2) * 0.02 - tiltY) * 0.06;

    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2 + tiltX;
    const cy = height / 2 - 15 + tiltY;
    const scale = baseScale * beatScale;
    const lagFactor = curTipLag;
    const flutterTime = timeSec * 3.6;

    // Batched Fibers
    ctx.lineWidth = 1.0;

    // 1. Core/mid fiber segments
    ctx.strokeStyle = COLOR_CORE_RGBA;
    ctx.beginPath();
    const fiberLen = fibers.length;
    for (let i = 0; i < fiberLen; i++) {
      const f = fibers[i];
      const r = f.baseR * scale;
      const px = cx + r * f.cosP;
      const py = cy + r * f.sinP;

      const flen = f.flen * (scale / baseScale);
      const flutter = 0.05 * Math.sin(flutterTime + f.phi * 3.0);
      const ang = f.baseAngle + flutter + lagFactor * (f.isRim ? f.cosP : 0.45);

      const midLen = flen * 0.55;
      const mx = px + midLen * Math.cos(ang);
      const my = py + midLen * Math.sin(ang);

      ctx.moveTo(px, py);
      ctx.lineTo(mx, my);
    }
    ctx.stroke();

    // 2. Silky tip segments
    ctx.strokeStyle = COLOR_TIP_RGBA;
    ctx.beginPath();
    for (let i = 0; i < fiberLen; i++) {
      const f = fibers[i];
      const r = f.baseR * scale;
      const px = cx + r * f.cosP;
      const py = cy + r * f.sinP;

      const flen = f.flen * (scale / baseScale);
      const flutter = 0.05 * Math.sin(flutterTime + f.phi * 3.0);
      const ang = f.baseAngle + flutter + lagFactor * (f.isRim ? f.cosP : 0.45);

      const midLen = flen * 0.55;
      const mx = px + midLen * Math.cos(ang);
      const my = py + midLen * Math.sin(ang);

      const tipAng = ang + f.curveBias;
      const tipLen = flen * 0.45;
      const ex = mx + tipLen * Math.cos(tipAng);
      const ey = my + tipLen * Math.sin(tipAng);

      ctx.moveTo(mx, my);
      ctx.lineTo(ex, ey);
    }
    ctx.stroke();

    // 3. Central Luminous Name "Deelan"
    const namePulse = 0.90 + 0.10 * Math.sin(timeSec * 2.8);
    const fontSize = Math.round(44 * (scale / baseScale));

    ctx.save();
    ctx.font = `bold ${fontSize}px 'Alex Brush', 'Monotype Corsiva', cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.globalAlpha = 0.85 * namePulse;
    ctx.fillStyle = COLOR_TEXT_GLOW;
    for (let dx = -2; dx <= 2; dx += 2) {
      for (let dy = -2; dy <= 2; dy += 2) {
        ctx.fillText('Deelan', cx + dx, cy - 25 + dy);
      }
    }

    ctx.globalAlpha = 1.0;
    ctx.fillStyle = COLOR_TEXT_MAIN;
    ctx.fillText('Deelan', cx, cy - 25);
    ctx.restore();

    // In Heart Mode, draw particles
    if (appMode === 'heart') {
      for (let i = rubyHearts.length - 1; i >= 0; i--) {
        if (!rubyHearts[i].update(dt)) rubyHearts.splice(i, 1);
        else rubyHearts[i].draw(ctx);
      }

      for (let i = fairyDust.length - 1; i >= 0; i--) {
        if (!fairyDust[i].update()) fairyDust.splice(i, 1);
        else fairyDust[i].draw(ctx);
      }

      for (let i = poeticWhispers.length - 1; i >= 0; i--) {
        if (!poeticWhispers[i].update()) poeticWhispers.splice(i, 1);
        else poeticWhispers[i].draw(ctx);
      }
    }

    ctx.restore();
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);

  // ---------------------------------------------------------------------------
  // User Input Events
  // ---------------------------------------------------------------------------
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  window.addEventListener('click', (e) => {
    if (!musicToggleBtn.contains(e.target) && !btnReplayStory.contains(e.target)) {
      handleUserClick();
    }
  });

  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0] && !musicToggleBtn.contains(e.target) && !btnReplayStory.contains(e.target)) {
      handleUserClick();
    }
  }, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === 'b' || e.key === 'B') {
      handleUserClick();
    } else if (e.key === 'f' || e.key === 'F') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  });

})();
