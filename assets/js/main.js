(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  /* ============ theme ============ */
  const themeToggle = document.getElementById("theme-toggle");
  const iconSun = themeToggle.querySelector(".icon-sun");
  const iconMoon = themeToggle.querySelector(".icon-moon");

  function applyTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
      iconSun.hidden = true; iconMoon.hidden = false;
      themeToggle.setAttribute("aria-pressed", "true");
    } else {
      root.setAttribute("data-theme", "light");
      iconSun.hidden = false; iconMoon.hidden = true;
      themeToggle.setAttribute("aria-pressed", "false");
    }
  }
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    applyTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }
  themeToggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem("theme", next);
  });

  /* ============ clock ============ */
  const clockEl = document.getElementById("tray-clock");
  function tickClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    clockEl.textContent = `${h}:${m}`;
  }
  tickClock();
  setInterval(tickClock, 15000);

  /* ============ footer year ============ */
  document.getElementById("footer-year").textContent = new Date().getFullYear();

  /* ============ toast ============ */
  const toastRegion = document.getElementById("toast-region");
  function toast(message, ms = 2600) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    toastRegion.appendChild(el);
    setTimeout(() => el.remove(), ms);
  }

  /* ============ boot screen ============ */
  const bootScreen = document.getElementById("boot-screen");
  const bootBarFill = document.getElementById("boot-bar-fill");
  const bootText = document.getElementById("boot-text");
  const bootSkip = document.getElementById("boot-skip");
  const bootSoundToggle = document.getElementById("boot-sound-toggle");

  const bootLines = [
    "Loading personality.dll…",
    "Calibrating sarcasm levels…",
    "Initializing byte-pet.exe…",
    "Brewing coffee.bat…",
    "Almost there…",
  ];

  let soundEnabled = false;
  function playBlip() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.12 + 0.25);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.3);
      });
    } catch (e) { /* audio unavailable, silently skip */ }
  }
  bootSoundToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    bootSoundToggle.setAttribute("aria-pressed", String(soundEnabled));
    if (soundEnabled) playBlip();
  });

  const alreadyBooted = sessionStorage.getItem("booted") === "1";

  function endBoot() {
    bootScreen.classList.add("is-leaving");
    setTimeout(() => { bootScreen.hidden = true; }, 500);
    sessionStorage.setItem("booted", "1");
    document.removeEventListener("keydown", endBootOnKey);
  }
  function endBootOnKey() { endBoot(); }

  if (alreadyBooted || prefersReducedMotion) {
    bootScreen.hidden = true;
  } else {
    let progress = 0;
    let lineIndex = 0;
    bootText.textContent = bootLines[0];
    const interval = setInterval(() => {
      progress += Math.random() * 18 + 8;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        bootText.textContent = "Ready.";
        setTimeout(endBoot, 350);
      } else {
        const nextLine = Math.floor((progress / 100) * (bootLines.length - 1));
        if (nextLine !== lineIndex) { lineIndex = nextLine; bootText.textContent = bootLines[lineIndex]; }
      }
      bootBarFill.style.width = progress + "%";
    }, 220);
    bootSkip.addEventListener("click", () => { clearInterval(interval); endBoot(); });
    document.addEventListener("keydown", endBootOnKey);
  }

  /* ============ scroll reveal ============ */
  const revealSupported = "IntersectionObserver" in window && !prefersReducedMotion;
  const revealIO = revealSupported
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" })
    : null;
  function observeReveal(el) {
    if (revealIO) revealIO.observe(el);
    else el.classList.add("is-visible");
  }
  document.querySelectorAll(".reveal").forEach(observeReveal);

  /* ============ taskbar start menu ============ */
  const startBtn = document.getElementById("start-btn");
  const startMenu = document.getElementById("start-menu");

  function closeStartMenu() {
    startMenu.hidden = true;
    startBtn.setAttribute("aria-expanded", "false");
  }
  function toggleStartMenu() {
    const willOpen = startMenu.hidden;
    startMenu.hidden = !willOpen;
    startBtn.setAttribute("aria-expanded", String(willOpen));
  }
  startBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleStartMenu(); });
  document.addEventListener("click", (e) => {
    if (!startMenu.hidden && !startMenu.contains(e.target) && e.target !== startBtn) closeStartMenu();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeStartMenu(); });
  startMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeStartMenu));

  /* ============ tabs ============ */
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      tabButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", String(active));
        b.tabIndex = active ? 0 : -1;
      });
      tabPanels.forEach((p) => { p.hidden = p.dataset.tabPanel !== target; p.classList.toggle("is-active", p.dataset.tabPanel === target); });
    });
  });

  /* ============ generic pointer drag helper ============ */
  function makeDraggable(el, onDragStart) {
    let dragging = false, offsetX = 0, offsetY = 0, moved = false;

    el.addEventListener("pointerdown", (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true; moved = false;
      const rect = el.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      el.classList.add("is-dragging");
      // Reparent to <body>: a transformed ancestor (e.g. a revealed .window)
      // would otherwise become the containing block for position:fixed and
      // clip the element via its own overflow:hidden.
      if (el.parentElement !== document.body) document.body.appendChild(el);
      el.style.position = "fixed";
      el.style.left = rect.left + "px";
      el.style.top = rect.top + "px";
      el.style.right = "auto";
      el.style.bottom = "auto";
      el.setPointerCapture(e.pointerId);
      if (onDragStart) onDragStart();
    });

    el.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      moved = true;
      const w = el.offsetWidth, h = el.offsetHeight;
      const x = Math.min(Math.max(0, e.clientX - offsetX), window.innerWidth - w);
      const y = Math.min(Math.max(0, e.clientY - offsetY), window.innerHeight - h);
      el.style.left = x + "px";
      el.style.top = y + "px";
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      el.classList.remove("is-dragging");
      // Drop back into normal document flow at this page position (instead of
      // staying position:fixed, which would keep it pinned to the viewport
      // and make it "chase" the cursor on every subsequent scroll).
      const rect = el.getBoundingClientRect();
      el.style.position = "absolute";
      el.style.left = (rect.left + window.scrollX) + "px";
      el.style.top = (rect.top + window.scrollY) + "px";
      try { el.releasePointerCapture(e.pointerId); } catch (err) { /* noop */ }
    }
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);

    return () => moved;
  }

  /* ============ mascot registry (shared by hero + catalog) ============ */
  const MASCOTS = [
    {
      id: "byte", name: "Byte",
      blurb: "The original. A small nod to the handle. He's the one you can drag around up top.",
      svg: `<ellipse cx="60" cy="118" rx="26" ry="6" fill="#000" opacity=".08"/>
        <path d="M60 22 L60 8" stroke="#2A5CDB" stroke-width="3" stroke-linecap="round"/>
        <circle cx="60" cy="7" r="5" fill="#FF6B4A"/>
        <path d="M60 20c26 0 40 20 40 46 0 28-18 44-40 44S20 94 20 66c0-26 14-46 40-46z" fill="url(#GRADID)" stroke="#1A3F9E" stroke-width="2"/>
        <rect x="34" y="52" width="52" height="30" rx="8" fill="#0F1229"/>
        <circle cx="50" cy="67" r="4.2" fill="#5B8DEF"/><circle cx="70" cy="67" r="4.2" fill="#5B8DEF"/>
        <path d="M52 76q8 6 16 0" stroke="#5B8DEF" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <ellipse cx="38" cy="72" rx="5" ry="3.4" fill="#FF6B4A" opacity=".55"/><ellipse cx="82" cy="72" rx="5" ry="3.4" fill="#FF6B4A" opacity=".55"/>
        <path d="M30 104c-6 4-10 4-16 2M90 104c6 4 10 4 16 2" stroke="#1A3F9E" stroke-width="3" fill="none" stroke-linecap="round"/>
        <defs><linearGradient id="GRADID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7BA6FF"/><stop offset="1" stop-color="#2A5CDB"/></linearGradient></defs>`,
    },
    {
      id: "pixel", name: "Pixel",
      blurb: "Allergic to anti-aliasing. Refuses to render at anything but whole numbers.",
      svg: `<ellipse cx="60" cy="118" rx="26" ry="6" fill="#000" opacity=".08"/>
        <rect x="28" y="22" width="14" height="16" fill="url(#GRADID)" stroke="#8E1F5A" stroke-width="2"/>
        <rect x="78" y="22" width="14" height="16" fill="url(#GRADID)" stroke="#8E1F5A" stroke-width="2"/>
        <rect x="22" y="36" width="76" height="68" fill="url(#GRADID)" stroke="#8E1F5A" stroke-width="2"/>
        <rect x="36" y="54" width="48" height="30" fill="#0F1229"/>
        <rect x="46" y="63" width="8" height="8" fill="#FF7FC0"/><rect x="66" y="63" width="8" height="8" fill="#FF7FC0"/>
        <rect x="50" y="76" width="20" height="4" fill="#FF7FC0"/>
        <rect x="30" y="104" width="12" height="10" fill="url(#GRADID)" stroke="#8E1F5A" stroke-width="2"/>
        <rect x="78" y="104" width="12" height="10" fill="url(#GRADID)" stroke="#8E1F5A" stroke-width="2"/>
        <defs><linearGradient id="GRADID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF7FC0"/><stop offset="1" stop-color="#E8409A"/></linearGradient></defs>`,
    },
    {
      id: "circuit", name: "Circuit",
      blurb: "Hums faintly at 60Hz. Overheats a little if you stare too long.",
      svg: `<ellipse cx="60" cy="118" rx="26" ry="6" fill="#000" opacity=".08"/>
        <polygon points="60,14 96,36 96,84 60,106 24,84 24,36" fill="url(#GRADID)" stroke="#0F5B36" stroke-width="2"/>
        <rect x="36" y="52" width="48" height="30" rx="4" fill="#0F1229"/>
        <circle cx="50" cy="67" r="4" fill="#8FF0B4"/><circle cx="70" cy="67" r="4" fill="#8FF0B4"/>
        <path d="M52 76q8 5 16 0" stroke="#8FF0B4" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <path d="M24 50h-12v12M96 50h12v12M24 70h-12v12M96 70h12v12" stroke="#1FAE63" stroke-width="3" fill="none" stroke-linecap="round"/>
        <defs><linearGradient id="GRADID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FE0A6"/><stop offset="1" stop-color="#1FAE63"/></linearGradient></defs>`,
    },
    {
      id: "glitch", name: "Glitch",
      blurb: "Occasionally renders in two places at once. Feature, not bug.",
      svg: `<ellipse cx="60" cy="118" rx="26" ry="6" fill="#000" opacity=".08"/>
        <polygon points="60,12 82,30 68,52 90,60 66,78 78,100 51,111 33,90 42,68 20,60 40,44 30,24" fill="#FF6B4A" opacity=".3" transform="translate(-3,1)"/>
        <polygon points="60,12 82,30 68,52 90,60 66,78 78,100 51,111 33,90 42,68 20,60 40,44 30,24" fill="#3DDC84" opacity=".3" transform="translate(3,-1)"/>
        <polygon points="60,12 82,30 68,52 90,60 66,78 78,100 51,111 33,90 42,68 20,60 40,44 30,24" fill="url(#GRADID)" stroke="#4A2E9E" stroke-width="2"/>
        <rect x="38" y="50" width="44" height="28" rx="4" fill="#0F1229"/>
        <circle cx="51" cy="64" r="4" fill="#C9B6FF"/><circle cx="69" cy="64" r="4" fill="#C9B6FF"/>
        <path d="M51 72h18" stroke="#C9B6FF" stroke-width="2.2" stroke-linecap="round"/>
        <defs><linearGradient id="GRADID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B39BFF"/><stop offset="1" stop-color="#7C4FE0"/></linearGradient></defs>`,
    },
    {
      id: "nibble", name: "Nibble",
      blurb: "Byte's shadow. Half the size, twice the opinions.",
      svg: `<ellipse cx="60" cy="118" rx="20" ry="5" fill="#000" opacity=".08"/>
        <path d="M60 30 L60 18" stroke="#B23A22" stroke-width="2.4" stroke-linecap="round"/><circle cx="60" cy="16" r="3.6" fill="#2A5CDB"/>
        <polygon points="60,30 88,64 60,98 32,64" fill="url(#GRADID)" stroke="#B23A22" stroke-width="2"/>
        <rect x="40" y="54" width="40" height="24" rx="4" fill="#0F1229"/>
        <circle cx="52" cy="66" r="3.6" fill="#FFC5B4"/><circle cx="68" cy="66" r="3.6" fill="#FFC5B4"/>
        <path d="M52 72q8 4 16 0" stroke="#FFC5B4" stroke-width="2" fill="none" stroke-linecap="round"/>
        <defs><linearGradient id="GRADID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF9C87"/><stop offset="1" stop-color="#E14B2A"/></linearGradient></defs>`,
    },
  ];

  function renderMascotMarkup(mascotData) {
    const gid = `mg_${mascotData.id}_${Math.random().toString(36).slice(2, 8)}`;
    return mascotData.svg.replace(/GRADID/g, gid);
  }

  /* ============ mascot drag + easter egg progress ============ */
  const mascot = document.getElementById("mascot");
  const mascotSvg = document.getElementById("mascot-svg");
  const mascotLabelEl = mascot.querySelector(".mascot-label");
  let activeMascotName = "Byte";

  function setActiveMascot(id, opts = {}) {
    const data = MASCOTS.find((m) => m.id === id) || MASCOTS[0];
    mascotSvg.innerHTML = renderMascotMarkup(data);
    mascotLabelEl.textContent = data.name;
    mascot.setAttribute("aria-label", `${data.name}, the office mascot. Drag me around.`);
    activeMascotName = data.name;
    if (!opts.silent) {
      try { localStorage.setItem("active-mascot", id); } catch (e) { /* storage unavailable */ }
      toast(`${data.name} is now running the hero section.`);
    }
    document.querySelectorAll(".catalog-item").forEach((el) => {
      const selected = el.dataset.mascot === data.id;
      el.classList.toggle("is-selected", selected);
      el.setAttribute("aria-pressed", String(selected));
    });
  }

  let savedMascot = "byte";
  try { savedMascot = localStorage.getItem("active-mascot") || "byte"; } catch (e) { /* storage unavailable */ }
  setActiveMascot(savedMascot, { silent: true });

  let mascotWasMoved = false;
  const mascotMoved = makeDraggable(mascot);
  mascot.addEventListener("pointerup", () => {
    if (mascotMoved() && !mascotWasMoved) { mascotWasMoved = true; toast(`${activeMascotName} appreciates the field trip.`); }
  });

  /* ============ desktop icon drag + notepad ============ */
  const desktopIcon = document.getElementById("desktop-icon");
  const notepad = document.getElementById("notepad");
  const notepadClose = document.getElementById("notepad-close");
  const iconMoved = makeDraggable(desktopIcon);

  desktopIcon.addEventListener("dblclick", () => {
    notepad.hidden = false;
    notepadClose.focus();
  });
  desktopIcon.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); notepad.hidden = false; notepadClose.focus(); }
  });
  notepadClose.addEventListener("click", () => { notepad.hidden = true; desktopIcon.focus(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !notepad.hidden) { notepad.hidden = true; } });

  /* ============ mascot catalog ============ */
  const catalogBtn = document.getElementById("catalog-btn");
  const catalog = document.getElementById("mascot-catalog");
  const catalogClose = document.getElementById("catalog-close");
  const catalogGrid = document.getElementById("catalog-grid");

  // Guard against a stale cache mismatch (old HTML without #catalog-grid,
  // paired with newer JS, or vice versa) — skip populating instead of
  // throwing and taking down the rest of the script.
  if (catalogGrid) {
    MASCOTS.forEach((data) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "catalog-item";
      item.dataset.mascot = data.id;
      item.setAttribute("aria-pressed", "false");
      item.innerHTML = `
        <span class="catalog-item-check" aria-hidden="true">&#10003;</span>
        <svg viewBox="0 0 120 130" width="64" height="70" aria-hidden="true">${renderMascotMarkup(data)}</svg>
        <span class="mascot-label">${data.name}</span>
        <p class="catalog-desc">${data.blurb}</p>`;
      item.addEventListener("click", () => setActiveMascot(data.id));
      catalogGrid.appendChild(item);
    });
    document.querySelectorAll(".catalog-item").forEach((el) => {
      const selected = el.dataset.mascot === savedMascot;
      el.classList.toggle("is-selected", selected);
      el.setAttribute("aria-pressed", String(selected));
    });
  }

  catalogBtn.addEventListener("click", () => {
    closeStartMenu();
    catalog.hidden = false;
    catalogClose.focus();
  });
  catalogClose.addEventListener("click", () => { catalog.hidden = true; catalogBtn.focus(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !catalog.hidden) { catalog.hidden = true; } });

  /* ============ hero window controls ============ */
  const heroWindow = document.querySelector(".hero-window");
  const heroMin = document.getElementById("hero-min");
  const heroMax = document.getElementById("hero-max");
  const heroClose = document.getElementById("hero-close");

  heroMin.addEventListener("click", () => {
    const minimized = heroWindow.classList.toggle("is-minimized");
    // Mascot/desktop-icon may have been dragged out of .window-body (they get
    // reparented to <body> on first drag), so hiding .window-body alone won't
    // hide them anymore — toggle them explicitly, wherever they currently live.
    mascot.classList.toggle("is-hero-hidden", minimized);
    desktopIcon.classList.toggle("is-hero-hidden", minimized);
    if (minimized) notepad.hidden = true;
    toast(minimized ? "Minimized. It's still here, just shy." : "Restored.");
  });
  heroMax.addEventListener("click", () => {
    heroWindow.classList.toggle("is-maximized");
  });
  heroClose.addEventListener("click", () => {
    heroWindow.classList.remove("window-shake");
    void heroWindow.offsetWidth;
    heroWindow.classList.add("window-shake");
    toast("Nice try. I'm kind of the whole homepage.");
  });

  /* ============ shutdown / BSOD easter egg ============ */
  const bsod = document.getElementById("bsod");
  const bsodProgress = document.getElementById("bsod-progress");
  const shutdownBtn = document.getElementById("shutdown-btn");

  function triggerBSOD() {
    closeStartMenu();
    bsod.hidden = false;
    let pct = 0;
    const t = setInterval(() => {
      pct += Math.random() * 20 + 10;
      if (pct >= 100) { pct = 100; clearInterval(t); }
      bsodProgress.textContent = Math.floor(pct) + "% complete";
    }, 260);
    function reboot() {
      bsod.hidden = true;
      clearInterval(t);
      bsod.removeEventListener("click", reboot);
      document.removeEventListener("keydown", rebootKey);
      toast("Welcome back. Israel.exe is running normally (allegedly).");
    }
    function rebootKey() { reboot(); }
    bsod.addEventListener("click", reboot);
    document.addEventListener("keydown", rebootKey);
  }
  shutdownBtn.addEventListener("click", triggerBSOD);

  /* ============ konami code easter egg ============ */
  const konamiSeq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let konamiPos = 0;
  document.addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === konamiSeq[konamiPos]) {
      konamiPos++;
      if (konamiPos === konamiSeq.length) {
        konamiPos = 0;
        activateClassicMode();
      }
    } else {
      konamiPos = key === konamiSeq[0] ? 1 : 0;
    }
  });
  function activateClassicMode() {
    toast("✨ Developer mode unlocked. Applying theme_classic.exe…");
    root.classList.add("classic-mode");
    if (!document.getElementById("classic-style")) {
      const style = document.createElement("style");
      style.id = "classic-style";
      style.textContent = `.classic-mode { filter: saturate(.6) sepia(.15) contrast(1.03); transition: filter .4s ease; }`;
      document.head.appendChild(style);
    }
    setTimeout(() => { root.classList.remove("classic-mode"); toast("Reverted to factory settings."); }, 4500);
  }

  /* ============ Game of Life widget ============ */
  // Called once the #gol-canvas markup exists in the DOM (it's injected
  // dynamically as part of the Conway-GoL project card, after the GitHub
  // repo list loads) — never runs automatically at parse time.
  let golInited = false;
  function initGoL() {
    if (golInited) return;
    const canvas = document.getElementById("gol-canvas");
    if (!canvas) return;
    golInited = true;
    const ctx = canvas.getContext("2d");
    const cols = 40, rows = 18;
    let cellW, cellH;
    let grid = new Uint8Array(cols * rows);
    let playing = false;
    let timer = null;
    let gen = 0;

    const genCountEl = document.getElementById("gol-gen-count");
    const playBtn = document.getElementById("gol-play");
    const randomBtn = document.getElementById("gol-random");
    const clearBtn = document.getElementById("gol-clear");

    function resizeCanvas() {
      const displayWidth = canvas.clientWidth || 480;
      const displayHeight = displayWidth * (220 / 480);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cellW = displayWidth / cols;
      cellH = displayHeight / rows;
      draw();
    }

    function idx(x, y) { return y * cols + x; }

    function seedRandom() {
      for (let i = 0; i < grid.length; i++) grid[i] = Math.random() < 0.28 ? 1 : 0;
      gen = 0; genCountEl.textContent = gen;
      draw();
    }

    function clearGrid() {
      grid.fill(0);
      gen = 0; genCountEl.textContent = gen;
      draw();
    }

    function step() {
      const next = new Uint8Array(grid.length);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          let neighbors = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = (x + dx + cols) % cols;
              const ny = (y + dy + rows) % rows;
              neighbors += grid[idx(nx, ny)];
            }
          }
          const alive = grid[idx(x, y)] === 1;
          next[idx(x, y)] = alive ? (neighbors === 2 || neighbors === 3 ? 1 : 0) : (neighbors === 3 ? 1 : 0);
        }
      }
      grid = next;
      gen++;
      genCountEl.textContent = gen;
      draw();
    }

    function draw() {
      const w = canvas.clientWidth || 480;
      const h = w * (220 / 480);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--ink") ? "#0F1229" : "#0F1229";
      ctx.fillStyle = "#0F1229";
      ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (grid[idx(x, y)]) {
            const g = ctx.createLinearGradient(x * cellW, y * cellH, x * cellW, y * cellH + cellH);
            g.addColorStop(0, "#7BA6FF");
            g.addColorStop(1, "#2A5CDB");
            ctx.fillStyle = g;
            ctx.fillRect(x * cellW + 1, y * cellH + 1, cellW - 2, cellH - 2);
          }
        }
      }
    }

    function toggleAt(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor(((clientX - rect.left) / rect.width) * cols);
      const y = Math.floor(((clientY - rect.top) / rect.height) * rows);
      if (x < 0 || x >= cols || y < 0 || y >= rows) return;
      grid[idx(x, y)] = grid[idx(x, y)] ? 0 : 1;
      draw();
    }

    let paintDown = false;
    canvas.addEventListener("pointerdown", (e) => { paintDown = true; toggleAt(e.clientX, e.clientY); });
    canvas.addEventListener("pointermove", (e) => { if (paintDown) toggleAt(e.clientX, e.clientY); });
    window.addEventListener("pointerup", () => { paintDown = false; });

    function setPlaying(next) {
      playing = next;
      playBtn.textContent = playing ? "Pause" : "Play";
      if (playing) {
        timer = setInterval(step, prefersReducedMotion ? 900 : 300);
      } else {
        clearInterval(timer);
      }
    }
    playBtn.addEventListener("click", () => setPlaying(!playing));
    randomBtn.addEventListener("click", seedRandom);
    clearBtn.addEventListener("click", () => { setPlaying(false); clearGrid(); });

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    seedRandom();
  }

  /* ============ live projects from GitHub ============ */
  const GITHUB_USER = "tamagochi-descompuesto1";
  const GITHUB_EXCLUDED = new Set([GITHUB_USER, GITHUB_USER + ".github.io"]);
  const PROJECTS_CACHE_KEY = "github-projects-cache-v1";
  const PROJECTS_CACHE_TTL = 10 * 60 * 1000;

  const FALLBACK_PROJECTS = [
    {
      name: "nlp-examples", url: "https://github.com/tamagochi-descompuesto1/nlp-examples",
      description: "Three bite-sized NLP demos in one repo: sentiment analysis on movie reviews, named entity recognition on tweets, and a slightly petty API-vs-API translation bake-off. BLEU scores don't lie.",
      tags: ["NLP", "HuggingFace", "NER", "Sentiment"], language: "JavaScript",
    },
    {
      name: "NLP-NAS", url: "https://github.com/tamagochi-descompuesto1/NLP-NAS",
      description: "Neural Architecture Search for text-generation networks — teaching a search algorithm to design its own model instead of me guessing hyperparameters at 2am.",
      tags: ["NAS", "Deep Learning", "Text Generation"], language: "Python",
    },
    {
      name: "nas4textgen", url: "https://github.com/tamagochi-descompuesto1/nas4textgen",
      description: "My Master's thesis project: hardware-aware NAS for text generation on a Jetson Orin Nano — squeezing DistilGPT2-scale models onto a dev kit instead of a data center.",
      tags: ["NAS", "Edge AI", "Jetson", "Thesis"], language: "Jupyter Notebook",
    },
    {
      name: "snake-DQN", url: "https://github.com/tamagochi-descompuesto1/snake-DQN",
      description: "A deep Q-network learns Snake from scratch — no RL library, just the Bellman equation and spite. Turned out the bottleneck wasn't learning, it was information: better reward shaping took the record from ~130 to ~530.",
      tags: ["Reinforcement Learning", "DQN", "PyTorch"], language: "Python",
    },
    {
      name: "Conway-GoL", url: "https://github.com/tamagochi-descompuesto1/Conway-GoL",
      description: "Conway's Game of Life, but configurable: five rulesets, three boundary modes, a pattern library, and a population chart — because plain B3/S23 wasn't fussy enough. Poke the live version below (click cells, hit play).",
      tags: ["Cellular Automata", "NumPy", "Simulation"], language: "Python",
    },
  ];

  const LANG_EXT = {
    Python: "py", JavaScript: "js", TypeScript: "ts", "Jupyter Notebook": "ipynb",
    HTML: "html", CSS: "css", "C++": "cpp", C: "c", Java: "java", Go: "go", Rust: "rs",
  };

  function fileNameFor(repoName, language) {
    const ext = LANG_EXT[language];
    return ext ? `${repoName.toLowerCase()}.${ext}` : repoName.toLowerCase();
  }

  function timeAgo(dateStr) {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days < 1) return "today";
    if (days === 1) return "yesterday";
    if (days < 30) return days + "d ago";
    const months = Math.floor(days / 30);
    if (months < 12) return months + "mo ago";
    return Math.floor(months / 12) + "y ago";
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function buildProjectCard(project) {
    const isWide = /^conway-gol$/i.test(project.name);
    const article = document.createElement("article");
    article.className = "window project-card reveal" + (isWide ? " project-card-wide" : "");

    const tagsHtml = (project.tags || []).slice(0, 5).map((t) => `<li class="chip">${escapeHtml(t)}</li>`).join("");
    const metaBits = [];
    if (project.stars) metaBits.push("★ " + project.stars);
    if (project.updated) metaBits.push("updated " + timeAgo(project.updated));
    const metaHtml = metaBits.length ? `<p class="project-meta">${metaBits.join(" · ")}</p>` : "";

    article.innerHTML = `
      <div class="window-titlebar">
        <span class="window-title">
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M2 3h12v8H8l-3 3v-3H2z" fill="currentColor"/></svg>
          ${escapeHtml(fileNameFor(project.name, project.language))}
        </span>
        <span class="window-controls" aria-hidden="true"><span class="win-dot win-dot-min"></span><span class="win-dot win-dot-max"></span><span class="win-dot win-dot-close"></span></span>
      </div>
      <div class="window-body">
        <p>${escapeHtml(project.description || "No description yet — you know how it is.")}</p>
        ${metaHtml}
        <ul class="chip-list chip-list-tags">${tagsHtml}</ul>
        <a class="project-link" href="${project.url}" target="_blank" rel="noopener">Open repo <span aria-hidden="true">↗</span></a>
      </div>`;

    if (isWide) {
      const widget = document.createElement("div");
      widget.className = "gol-widget";
      widget.innerHTML = `
        <canvas id="gol-canvas" width="480" height="220" role="img" aria-label="Interactive Game of Life grid. Click cells to toggle them, then press Play."></canvas>
        <div class="gol-controls">
          <button id="gol-play" class="btn btn-small btn-primary" type="button">Play</button>
          <button id="gol-random" class="btn btn-small btn-secondary" type="button">Random</button>
          <button id="gol-clear" class="btn btn-small btn-secondary" type="button">Clear</button>
          <span class="gol-gen">Gen <span id="gol-gen-count">0</span></span>
        </div>`;
      article.querySelector(".window-body").appendChild(widget);
    }
    return article;
  }

  function renderProjects(list, statusText) {
    const grid = document.getElementById("projects-grid");
    const status = document.getElementById("projects-status");
    grid.innerHTML = "";
    if (!list.length) {
      status.hidden = false;
      status.classList.add("is-error");
      status.textContent = "No projects to show right now — check GitHub directly.";
      return;
    }
    list.forEach((project) => {
      const card = buildProjectCard(project);
      grid.appendChild(card);
      observeReveal(card);
    });
    status.classList.toggle("is-error", Boolean(statusText));
    status.hidden = !statusText;
    if (statusText) status.textContent = statusText;
    if (document.getElementById("gol-canvas")) initGoL();
  }

  function mapRepo(repo) {
    return {
      name: repo.name,
      description: repo.description,
      url: repo.html_url,
      language: repo.language,
      tags: [repo.language, ...(repo.topics || [])].filter(Boolean),
      stars: repo.stargazers_count,
      updated: repo.pushed_at || repo.updated_at,
    };
  }

  async function loadProjects() {
    try {
      const cached = sessionStorage.getItem(PROJECTS_CACHE_KEY);
      if (cached) {
        const { time, projects } = JSON.parse(cached);
        if (Date.now() - time < PROJECTS_CACHE_TTL && Array.isArray(projects) && projects.length) {
          renderProjects(projects);
          return;
        }
      }
    } catch (e) { /* corrupt cache, ignore and refetch */ }

    try {
      const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=100`, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!res.ok) throw new Error("GitHub API responded " + res.status);
      const repos = await res.json();
      const projects = repos.filter((r) => !r.fork && !GITHUB_EXCLUDED.has(r.name)).map(mapRepo);
      if (!projects.length) throw new Error("no repos returned");
      renderProjects(projects);
      try {
        sessionStorage.setItem(PROJECTS_CACHE_KEY, JSON.stringify({ time: Date.now(), projects }));
      } catch (e) { /* storage unavailable, skip caching */ }
    } catch (err) {
      renderProjects(FALLBACK_PROJECTS, "Couldn't reach the GitHub API just now — showing a cached lineup instead.");
    }
  }

  loadProjects();

})();
