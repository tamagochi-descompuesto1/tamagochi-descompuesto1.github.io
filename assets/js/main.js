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
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

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
      try { el.releasePointerCapture(e.pointerId); } catch (err) { /* noop */ }
    }
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);

    return () => moved;
  }

  /* ============ mascot drag + easter egg progress ============ */
  const mascot = document.getElementById("mascot");
  let mascotWasMoved = false;
  const mascotMoved = makeDraggable(mascot);
  mascot.addEventListener("pointerup", () => {
    if (mascotMoved() && !mascotWasMoved) { mascotWasMoved = true; toast("Byte appreciates the field trip."); }
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

  /* ============ hero window controls ============ */
  const heroWindow = document.querySelector(".hero-window");
  const heroMin = document.getElementById("hero-min");
  const heroMax = document.getElementById("hero-max");
  const heroClose = document.getElementById("hero-close");

  heroMin.addEventListener("click", () => {
    const minimized = heroWindow.classList.toggle("is-minimized");
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
  (function initGoL() {
    const canvas = document.getElementById("gol-canvas");
    if (!canvas) return;
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
  })();

})();
