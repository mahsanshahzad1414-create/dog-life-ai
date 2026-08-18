/* =========================================================
   DOG LIFE AI
   Premium Virtual Dog Adventure
   public/game.js

   Designed specifically for the supplied public/index.html.
   No external JavaScript libraries required.
========================================================= */

(() => {
  "use strict";

  /* =======================================================
     CONFIG
  ======================================================= */

  const STORAGE_KEY = "dogLifeAI_save_v3";
  const SETTINGS_KEY = "dogLifeAI_settings_v3";

  const XP_PER_LEVEL = 100;
  const MAX_STAT = 100;

  const DOGS = {
    buddy: {
      name: "Buddy",
      emoji: "🐕",
      personality: "Playful & loyal",
      happiness: 84,
      energy: 78,
      bond: 4,
      color: "#8b5e3c"
    },

    luna: {
      name: "Luna",
      emoji: "🐩",
      personality: "Curious & clever",
      happiness: 82,
      energy: 80,
      bond: 4,
      color: "#d8d8e8"
    },

    max: {
      name: "Max",
      emoji: "🐶",
      personality: "Brave & energetic",
      happiness: 86,
      energy: 88,
      bond: 4,
      color: "#c98b52"
    },

    coco: {
      name: "Coco",
      emoji: "🦮",
      personality: "Gentle & friendly",
      happiness: 88,
      energy: 74,
      bond: 5,
      color: "#c79b6d"
    }
  };

  const MISSIONS = [
    {
      text: "Sniff around and find the first hidden bone.",
      type: "bones",
      target: 1,
      reward: 20
    },
    {
      text: "Explore the meadow and collect 3 bones.",
      type: "bones",
      target: 3,
      reward: 30
    },
    {
      text: "Go on a long walk and keep your energy above 30%.",
      type: "energy",
      target: 30,
      reward: 35
    },
    {
      text: "Explore the world and discover something new.",
      type: "explore",
      target: 1,
      reward: 25
    },
    {
      text: "Collect 5 bones for your companion.",
      type: "bones",
      target: 5,
      reward: 50
    }
  ];

  const BADGES = [
    {
      id: "first",
      name: "First Steps",
      requirement: s => s.adventures >= 1
    },
    {
      id: "bone10",
      name: "Bone Hunter",
      requirement: s => s.totalBones >= 10
    },
    {
      id: "bond50",
      name: "Best Friends",
      requirement: s => s.bond >= 50
    },
    {
      id: "streak3",
      name: "On a Roll",
      requirement: s => s.bestStreak >= 3
    },
    {
      id: "level5",
      name: "Rising Star",
      requirement: s => s.level >= 5
    },
    {
      id: "zoomies",
      name: "Zoomies",
      requirement: s =>
        s.lastAdventureEnergy >= 70
    },
    {
      id: "explorer",
      name: "Explorer",
      requirement: s => s.adventures >= 5
    },
    {
      id: "missions10",
      name: "Mission Master",
      requirement: s => s.missionsCompleted >= 10
    },
    {
      id: "happy90",
      name: "Goodest Dog",
      requirement: s => s.happiness >= 90
    },
    {
      id: "level10",
      name: "Legend",
      requirement: s => s.level >= 10
    },
    {
      id: "bone50",
      name: "Treasure Pup",
      requirement: s => s.totalBones >= 50
    },
    {
      id: "doglife",
      name: "Dog Life",
      requirement: s => {
        const normal = BADGES
          .filter(b => b.id !== "doglife")
          .every(b => b.requirement(s));

        return normal;
      }
    }
  ];

  /* =======================================================
     HELPERS
  ======================================================= */

  const $ = id => document.getElementById(id);

  const clamp = (value, min = 0, max = 100) =>
    Math.max(min, Math.min(max, value));

  const random = (min, max) =>
    Math.random() * (max - min) + min;

  const randomInt = (min, max) =>
    Math.floor(random(min, max + 1));

  const todayKey = () => {
    const d = new Date();

    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")
    ].join("-");
  };

  const yesterdayKey = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);

    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0")
    ].join("-");
  };

  const safeNumber = value =>
    Number.isFinite(Number(value)) ? Number(value) : 0;

  /* =======================================================
     DEFAULT STATE
  ======================================================= */

  function createDefaultState() {
    const dog = DOGS.buddy;

    return {
      version: 3,

      playerName: "Player",

      dogId: "buddy",

      level: 1,
      xp: 0,

      happiness: dog.happiness,
      energy: dog.energy,
      bond: dog.bond,

      totalBones: 0,
      adventures: 0,
      missionsCompleted: 0,

      streak: 0,
      bestStreak: 0,
      lastActiveDate: null,

      lastAdventureEnergy: 0,

      favorites: false,

      daily: {
        date: todayKey(),
        adventure: false,
        bones: 0,
        bond: false,
        xpClaimed: 0
      },

      journal: [],

      badges: [],

      mission: null,

      updatedAt: Date.now()
    };
  }

  let state = createDefaultState();

  /* =======================================================
     SETTINGS
  ======================================================= */

  let settings = {
    sound: true,
    reducedMotion: false
  };

  function loadSettings() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(SETTINGS_KEY)
      );

      if (saved && typeof saved === "object") {
        settings = {
          ...settings,
          ...saved
        };
      }
    } catch {
      settings = {
        sound: true,
        reducedMotion: false
      };
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
      );
    } catch {
      // Storage may be unavailable.
    }
  }

  /* =======================================================
     SAVE / LOAD
  ======================================================= */

  function normalizeState(raw) {
    const base = createDefaultState();

    const merged = {
      ...base,
      ...(raw || {})
    };

    merged.daily = {
      ...base.daily,
      ...(raw?.daily || {})
    };

    merged.journal = Array.isArray(raw?.journal)
      ? raw.journal
      : [];

    merged.badges = Array.isArray(raw?.badges)
      ? raw.badges
      : [];

    merged.level = Math.max(
      1,
      Math.floor(safeNumber(merged.level))
    );

    merged.xp = Math.max(
      0,
      safeNumber(merged.xp)
    );

    merged.happiness = clamp(
      safeNumber(merged.happiness)
    );

    merged.energy = clamp(
      safeNumber(merged.energy)
    );

    merged.bond = clamp(
      safeNumber(merged.bond)
    );

    merged.totalBones = Math.max(
      0,
      Math.floor(safeNumber(merged.totalBones))
    );

    merged.adventures = Math.max(
      0,
      Math.floor(safeNumber(merged.adventures))
    );

    merged.missionsCompleted = Math.max(
      0,
      Math.floor(safeNumber(merged.missionsCompleted))
    );

    if (!DOGS[merged.dogId]) {
      merged.dogId = "buddy";
    }

    return merged;
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        state = normalizeState(
          JSON.parse(saved)
        );
      }
    } catch {
      state = createDefaultState();
    }

    ensureDailyReset();
    ensureMission();
    updateBadges(false);
  }

  function saveState() {
    state.updatedAt = Date.now();

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
      );
    } catch {
      showToast(
        "Progress could not be saved.",
        "⚠️"
      );
    }
  }

  /* =======================================================
     DAILY SYSTEM
  ======================================================= */

  function ensureDailyReset() {
    const today = todayKey();

    if (state.daily?.date !== today) {
      state.daily = {
        date: today,
        adventure: false,
        bones: 0,
        bond: false,
        xpClaimed: 0
      };
    }

    if (
      state.lastActiveDate &&
      state.lastActiveDate !== today
    ) {
      const yesterday = yesterdayKey();

      if (state.lastActiveDate !== yesterday) {
        state.streak = 0;
      }
    }
  }

  function registerActivity() {
    const today = todayKey();

    if (state.lastActiveDate === today) {
      return;
    }

    if (
      state.lastActiveDate === yesterdayKey()
    ) {
      state.streak += 1;
    } else {
      state.streak = 1;
    }

    state.bestStreak = Math.max(
      state.bestStreak,
      state.streak
    );

    state.lastActiveDate = today;

    saveState();
  }

  /* =======================================================
     LEVEL / XP
  ======================================================= */

  function addXP(amount) {
    amount = Math.max(0, Math.floor(amount));

    if (!amount) return;

    state.xp += amount;

    let leveled = false;

    while (
      state.xp >= XP_PER_LEVEL
    ) {
      state.xp -= XP_PER_LEVEL;
      state.level += 1;
      leveled = true;
    }

    if (leveled) {
      showToast(
        `Level ${state.level}! Your bond is growing.`,
        "⭐"
      );

      playSound("level");
    }

    updateBadges(true);
    saveState();
    renderAll();
  }

  /* =======================================================
     BOND
  ======================================================= */

  function increaseBond(amount) {
    const before = state.bond;

    state.bond = clamp(
      state.bond + amount
    );

    if (state.bond > before) {
      state.daily.bond = true;
    }

    updateBadges(true);
  }

  /* =======================================================
     DOG
  ======================================================= */

  function currentDog() {
    return DOGS[state.dogId] || DOGS.buddy;
  }

  function applyDog() {
    const dog = currentDog();

    $("heroDog").textContent = dog.emoji;
    $("profileDogVisual").textContent = dog.emoji;

    $("heroDogName").textContent = dog.name;

    const heroName =
      $("heroDogName");

    if (heroName) {
      heroName.setAttribute(
        "aria-label",
        `${dog.name}, ${dog.personality}`
      );
    }

    const status =
      document.querySelector(
        ".status-badge"
      );

    if (status) {
      status.innerHTML =
        `<span class="status-dot"></span> ${dogMood()}`;
    }

    document
      .querySelectorAll(".dog-option")
      .forEach(option => {
        option.classList.toggle(
          "selected",
          option.dataset.dog === state.dogId
        );
      });
  }

  function selectDog(id) {
    if (!DOGS[id]) return;

    state.dogId = id;

    const dog = DOGS[id];

    /*
      Only initialize base wellbeing for a fresh
      companion. Existing progress remains intact.
    */
    if (state.adventures === 0) {
      state.happiness = dog.happiness;
      state.energy = dog.energy;
      state.bond = dog.bond;
    }

    applyDog();
    renderAll();
    saveState();

    showToast(
      `${dog.name} is ready for adventure!`,
      "🐾"
    );

    closeModal("dogModal");
  }

  function dogMood() {
    const average =
      (
        state.happiness +
        state.energy +
        state.bond
      ) / 3;

    if (average >= 85) return "Thriving";
    if (average >= 70) return "Happy";
    if (average >= 50) return "Content";
    if (average >= 30) return "Tired";
    return "Needs care";
  }

  /* =======================================================
     MISSION SYSTEM
  ======================================================= */

  function ensureMission() {
    if (
      !state.mission ||
      typeof state.mission.text !== "string"
    ) {
      state.mission =
        { ...MISSIONS[randomInt(0, MISSIONS.length - 1)] };
    }
  }

  function newMission() {
    const currentText =
      state.mission?.text;

    let candidates =
      MISSIONS.filter(
        mission => mission.text !== currentText
      );

    if (!candidates.length) {
      candidates = MISSIONS;
    }

    state.mission = {
      ...candidates[
        randomInt(0, candidates.length - 1)
      ]
    };

    saveState();
    renderMission();

    showToast(
      "A new mission has arrived.",
      "✨"
    );

    playSound("mission");
  }

  function completeMission() {
    if (!state.mission) return;

    const reward =
      safeNumber(state.mission.reward);

    state.missionsCompleted += 1;

    addXP(reward);

    state.mission = null;

    ensureMission();
    updateBadges(true);
    saveState();
  }

  function checkMissionProgress() {
    if (!state.mission) return false;

    const mission = state.mission;

    if (
      mission.type === "bones" &&
      game.bones >= mission.target
    ) {
      completeMission();
      return true;
    }

    if (
      mission.type === "energy" &&
      state.energy >= mission.target
    ) {
      completeMission();
      return true;
    }

    if (
      mission.type === "explore" &&
      game.distance >= 350
    ) {
      completeMission();
      return true;
    }

    return false;
  }

  function renderMission() {
    const el = $("missionText");

    if (!el) return;

    ensureMission();

    el.textContent =
      state.mission.text;
  }

  /* =======================================================
     BADGES
  ======================================================= */

  function updateBadges(notify = true) {
    const unlocked = [];

    BADGES.forEach(badge => {
      if (badge.requirement(state)) {
        unlocked.push(badge.id);
      }
    });

    const previous =
      Array.isArray(state.badges)
        ? state.badges
        : [];

    const newlyUnlocked =
      unlocked.filter(
        id => !previous.includes(id)
      );

    state.badges = unlocked;

    if (
      notify &&
      newlyUnlocked.length
    ) {
      const badge =
        BADGES.find(
          b => b.id === newlyUnlocked[0]
        );

      if (badge) {
        showToast(
          `Badge unlocked: ${badge.name}`,
          "🏆"
        );

        playSound("badge");
      }
    }

    renderBadges();
  }

  function renderBadges() {
    const grid = $("badgeGrid");

    if (!grid) return;

    const cards =
      grid.querySelectorAll(".badge-card");

    cards.forEach((card, index) => {
      const badge = BADGES[index];

      if (!badge) return;

      const unlocked =
        state.badges.includes(badge.id);

      card.classList.toggle(
        "locked",
        !unlocked
      );

      card.classList.toggle(
        "unlocked",
        unlocked
      );

      card.setAttribute(
        "aria-label",
        `${badge.name}: ${
          unlocked
            ? "Unlocked"
            : "Locked"
        }`
      );
    });

    $("collectionUnlocked").textContent =
      state.badges.length;
  }

  /* =======================================================
     JOURNAL
  ======================================================= */

  function addJournalEntry(result) {
    const dog = currentDog();

    const entry = {
      id:
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,

      date: new Date().toISOString(),

      dog: dog.name,

      emoji: dog.emoji,

      bones: result.bones,

      xp: result.xp,

      bond: result.bond,

      energy: result.energy,

      title:
        result.bones >= 5
          ? "Treasure hunting champion"
          : result.bones >= 2
          ? "A pawsome adventure"
          : "A lovely walk together"
    };

    state.journal.unshift(entry);

    /*
      Keep the journal substantial without
      allowing unlimited local-storage growth.
    */
    state.journal =
      state.journal.slice(0, 100);

    saveState();
  }

  function renderJournal() {
    const list = $("journalList");
    const empty = $("journalEmpty");

    if (!list || !empty) return;

    const entries =
      Array.isArray(state.journal)
        ? state.journal
        : [];

    $("journalCount").textContent =
      entries.length;

    empty.classList.toggle(
      "hidden",
      entries.length > 0
    );

    list.innerHTML = "";

    entries.forEach(entry => {
      const article =
        document.createElement("article");

      article.className =
        "journal-entry";

      const date =
        new Date(entry.date);

      const formatted =
        Number.isNaN(date.getTime())
          ? "Adventure"
          : date.toLocaleDateString(
              undefined,
              {
                day: "numeric",
                month: "short",
                year: "numeric"
              }
            );

      article.innerHTML = `
        <div class="journal-entry-icon">
          ${escapeHTML(entry.emoji || "🐾")}
        </div>

        <div class="journal-entry-content">
          <span class="eyebrow">${escapeHTML(formatted)}</span>
          <h3>${escapeHTML(entry.title || "Adventure")}</h3>
          <p>
            ${escapeHTML(entry.dog || "Buddy")}
            discovered
            <strong>${safeNumber(entry.bones)}</strong>
            bone${safeNumber(entry.bones) === 1 ? "" : "s"}
            and earned
            <strong>${safeNumber(entry.xp)} XP</strong>.
          </p>

          <div class="journal-entry-meta">
            <span>🦴 ${safeNumber(entry.bones)}</span>
            <span>⭐ ${safeNumber(entry.xp)} XP</span>
            <span>💛 +${safeNumber(entry.bond)}%</span>
          </div>
        </div>
      `;

      list.appendChild(article);
    });
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  /* =======================================================
     SCREEN NAVIGATION
  ======================================================= */

  let currentScreen = "home";

  function navigate(screen) {
    const valid = [
      "home",
      "adventure",
      "journal",
      "collection",
      "profile"
    ];

    if (!valid.includes(screen)) {
      screen = "home";
    }

    currentScreen = screen;

    document
      .querySelectorAll(".screen")
      .forEach(section => {
        section.classList.toggle(
          "active",
          section.dataset.screenContent === screen
        );
      });

    document
      .querySelectorAll(".nav-item")
      .forEach(button => {
        button.classList.toggle(
          "active",
          button.dataset.screen === screen
        );
      });

    if (screen === "journal") {
      renderJournal();
    }

    if (screen === "collection") {
      renderBadges();
    }

    if (screen === "profile") {
      renderProfile();
    }

    window.scrollTo({
      top: 0,
      behavior:
        settings.reducedMotion
          ? "auto"
          : "smooth"
    });
  }

  /* =======================================================
     MODALS
  ======================================================= */

  function openModal(id) {
    const modal = $(id);

    if (!modal) return;

    modal.classList.remove("hidden");

    document.body.classList.add(
      "modal-open"
    );

    const focusable =
      modal.querySelector(
        "button:not(.modal-close), input"
      );

    if (focusable) {
      setTimeout(
        () => focusable.focus(),
        50
      );
    }
  }

  function closeModal(id) {
    const modal = $(id);

    if (!modal) return;

    modal.classList.add("hidden");

    const anyOpen =
      document.querySelector(
        ".modal:not(.hidden)"
      );

    if (!anyOpen) {
      document.body.classList.remove(
        "modal-open"
      );
    }
  }

  function closeAllModals() {
    document
      .querySelectorAll(".modal")
      .forEach(modal =>
        modal.classList.add("hidden")
      );

    document.body.classList.remove(
      "modal-open"
    );
  }

  /* =======================================================
     TOAST
  ======================================================= */

  let toastTimer = null;

  function showToast(message, icon = "✨") {
    const toast = $("toast");

    if (!toast) return;

    $("toastIcon").textContent = icon;
    $("toastMessage").textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 3200);
  }

  /* =======================================================
     SOUND
     Uses Web Audio API — no external audio files.
  ======================================================= */

  let audioContext = null;

  function getAudioContext() {
    if (!settings.sound) return null;

    try {
      if (!audioContext) {
        const AudioCtx =
          window.AudioContext ||
          window.webkitAudioContext;

        if (!AudioCtx) return null;

        audioContext = new AudioCtx();
      }

      if (
        audioContext.state === "suspended"
      ) {
        audioContext.resume();
      }

      return audioContext;
    } catch {
      return null;
    }
  }

  function playSound(type = "click") {
    if (!settings.sound) return;

    const ctx = getAudioContext();

    if (!ctx) return;

    const now = ctx.currentTime;

    const patterns = {
      click: [440],
      bone: [620, 820],
      level: [523, 659, 784],
      badge: [523, 659, 784, 1047],
      mission: [392, 523, 659],
      success: [523, 659, 880],
      error: [180, 140]
    };

    const frequencies =
      patterns[type] || patterns.click;

    frequencies.forEach(
      (frequency, index) => {
        const oscillator =
          ctx.createOscillator();

        const gain =
          ctx.createGain();

        oscillator.type =
          type === "error"
            ? "sawtooth"
            : "sine";

        oscillator.frequency.value =
          frequency;

        gain.gain.setValueAtTime(
          0.0001,
          now + index * 0.07
        );

        gain.gain.exponentialRampToValueAtTime(
          0.08,
          now + index * 0.07 + 0.015
        );

        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          now + index * 0.07 + 0.16
        );

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start(
          now + index * 0.07
        );

        oscillator.stop(
          now + index * 0.07 + 0.18
        );
      }
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  function renderAll() {
    ensureDailyReset();

    applyDog();

    renderHeader();
    renderHomeStats();
    renderDailyGoals();
    renderMission();
    renderProfile();
    renderJournal();
    renderBadges();

    if (game.running) {
      renderGameHUD();
    }
  }

  function renderHeader() {
    $("topStreak").textContent =
      state.streak;

    $("profileName").textContent =
      state.playerName || "Player";
  }

  function renderHomeStats() {
    $("heroLevel").textContent =
      `Level ${state.level}`;

    $("heroBond").textContent =
      `${Math.round(state.bond)}%`;

    $("happinessValue").textContent =
      `${Math.round(state.happiness)}%`;

    $("energyValue").textContent =
      `${Math.round(state.energy)}%`;

    $("bondValue").textContent =
      `${Math.round(state.bond)}%`;

    $("xpValue").textContent =
      `${Math.round(state.xp)} XP`;

    $("happinessBar").style.width =
      `${state.happiness}%`;

    $("energyBar").style.width =
      `${state.energy}%`;

    $("bondBar").style.width =
      `${state.bond}%`;

    $("xpBar").style.width =
      `${state.xp}%`;

    $("happinessStatus").textContent =
      happinessText();

    $("energyStatus").textContent =
      energyText();

    $("bondStatus").textContent =
      bondText();

    $("xpStatus").textContent =
      `${XP_PER_LEVEL - Math.floor(state.xp)} XP to next level`;

    $("heroFavoriteButton").textContent =
      state.favorites ? "♥" : "♡";
  }

  function happinessText() {
    if (state.happiness >= 90)
      return "Absolutely joyful";

    if (state.happiness >= 75)
      return "Very happy";

    if (state.happiness >= 55)
      return "Feeling good";

    if (state.happiness >= 35)
      return "Needs attention";

    return "Needs some love";
  }

  function energyText() {
    if (state.energy >= 80)
      return "Full of energy";

    if (state.energy >= 60)
      return "Ready to play";

    if (state.energy >= 35)
      return "A little tired";

    return "Needs a rest";
  }

  function bondText() {
    if (state.bond >= 90)
      return "Unbreakable bond";

    if (state.bond >= 70)
      return "Best friends";

    if (state.bond >= 50)
      return "Growing closer";

    if (state.bond >= 25)
      return "Getting closer";

    return "Getting started";
  }

  function renderDailyGoals() {
    const completed =
      Number(state.daily.adventure) +
      Number(state.daily.bones >= 5) +
      Number(state.daily.bond);

    $("goalCounter").textContent =
      `${completed} / 3`;

    const goals =
      document.querySelectorAll(
        "#dailyGoals .goal-card"
      );

    if (goals[0]) {
      goals[0].classList.toggle(
        "completed",
        state.daily.adventure
      );
    }

    if (goals[1]) {
      goals[1].classList.toggle(
        "completed",
        state.daily.bones >= 5
      );
    }

    if (goals[2]) {
      goals[2].classList.toggle(
        "completed",
        state.daily.bond
      );
    }
  }

  function renderProfile() {
    $("profileDisplayName").textContent =
      state.playerName || "Player";

    $("profileLevel").textContent =
      state.level;

    $("profileWins").textContent =
      state.adventures;

    $("profileBones").textContent =
      state.totalBones;

    $("profileXp").textContent =
      calculateTotalXP();

    $("profileStreak").textContent =
      state.bestStreak;

    $("nameInput").value =
      state.playerName || "";
  }

  function calculateTotalXP() {
    return (
      Math.max(0, state.level - 1) *
        XP_PER_LEVEL +
      state.xp
    );
  }

  /* =======================================================
     ADVENTURE GAME
  ======================================================= */

  const game = {
    canvas: null,
    ctx: null,

    running: false,
    paused: false,
    completed: false,

    animationFrame: null,
    lastTime: 0,

    elapsed: 0,
    timeLeft: 90,

    bones: 0,
    distance: 0,

    player: {
      x: 600,
      y: 340,
      radius: 28,
      speed: 260,
      direction: 0
    },

    collectibles: [],

    particles: [],

    keys: {
      up: false,
      down: false,
      left: false,
      right: false
    },

    camera: {
      x: 0,
      y: 0
    }
  };

  function setupCanvas() {
    game.canvas = $("gameCanvas");

    if (!game.canvas) return;

    game.ctx =
      game.canvas.getContext("2d");

    resizeCanvas();
  }

  function resizeCanvas() {
    if (!game.canvas) return;

    /*
      The canvas keeps its logical coordinate system.
      CSS handles responsive presentation.
    */

    if (window.devicePixelRatio > 1) {
      const rect =
        game.canvas.getBoundingClientRect();

      if (
        rect.width > 0 &&
        rect.height > 0
      ) {
        game.canvas.style.aspectRatio =
          `${game.canvas.width}/${game.canvas.height}`;
      }
    }
  }

  function resetGame() {
    game.elapsed = 0;
    game.timeLeft = 90;

    game.bones = 0;
    game.distance = 0;

    game.player.x =
      game.canvas.width / 2;

    game.player.y =
      game.canvas.height / 2;

    game.player.direction = 0;

    game.collectibles = [];
    game.particles = [];

    spawnCollectibles(9);

    game.camera.x = 0;
    game.camera.y = 0;
  }

  function spawnCollectibles(count) {
    for (let i = 0; i < count; i++) {
      game.collectibles.push({
        x: random(80, game.canvas.width - 80),
        y: random(100, game.canvas.height - 80),
        radius: 15,
        collected: false,
        bob: random(0, Math.PI * 2)
      });
    }
  }

  function startAdventure() {
    navigate("adventure");

    setupCanvas();

    if (!game.canvas || !game.ctx) {
      showToast(
        "Adventure could not start.",
        "⚠️"
      );
      return;
    }

    game.running = true;
    game.paused = false;
    game.completed = false;

    $("gamePaused").classList.add("hidden");
    $("gameComplete").classList.add("hidden");

    resetGame();

    registerActivity();

    renderGameHUD();

    playSound("success");

    game.lastTime =
      performance.now();

    cancelAnimationFrame(
      game.animationFrame
    );

    game.animationFrame =
      requestAnimationFrame(gameLoop);
  }

  function pauseAdventure() {
    if (!game.running || game.completed)
      return;

    game.paused = true;

    $("gamePaused").classList.remove(
      "hidden"
    );

    playSound("click");
  }

  function resumeAdventure() {
    if (!game.running || game.completed)
      return;

    game.paused = false;

    $("gamePaused").classList.add(
      "hidden"
    );

    game.lastTime =
      performance.now();

    game.animationFrame =
      requestAnimationFrame(gameLoop);

    playSound("click");
  }

  function exitAdventure() {
    if (!game.running) {
      navigate("home");
      return;
    }

    game.running = false;
    game.paused = false;

    cancelAnimationFrame(
      game.animationFrame
    );

    $("gamePaused").classList.add(
      "hidden"
    );

    $("gameComplete").classList.add(
      "hidden"
    );

    navigate("home");
    renderAll();
  }

  function gameLoop(timestamp) {
    if (!game.running) return;

    if (game.paused) {
      game.animationFrame =
        requestAnimationFrame(gameLoop);

      game.lastTime = timestamp;

      drawGame();

      return;
    }

    const dt =
      Math.min(
        (timestamp - game.lastTime) / 1000,
        0.05
      );

    game.lastTime = timestamp;

    game.elapsed += dt;
    game.timeLeft =
      Math.max(0, 90 - game.elapsed);

    updateGame(dt);
    drawGame();
    renderGameHUD();

    if (game.timeLeft <= 0) {
      finishAdventure();
      return;
    }

    game.animationFrame =
      requestAnimationFrame(gameLoop);
  }

  function updateGame(dt) {
    const p = game.player;

    let dx = 0;
    let dy = 0;

    if (game.keys.up) dy -= 1;
    if (game.keys.down) dy += 1;
    if (game.keys.left) dx -= 1;
    if (game.keys.right) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const length =
        Math.sqrt(dx * dx + dy * dy);

      dx /= length;
      dy /= length;

      p.x +=
        dx *
        p.speed *
        dt;

      p.y +=
        dy *
        p.speed *
        dt;

      p.direction =
        Math.atan2(dy, dx);

      game.distance +=
        p.speed * dt;

      state.energy =
        clamp(
          state.energy -
            dt * 1.6
        );

      state.happiness =
        clamp(
          state.happiness +
            dt * 0.18
        );
    }

    /*
      Keep player inside the world.
    */

    p.x =
      clamp(
        p.x,
        p.radius + 15,
        game.canvas.width -
          p.radius -
          15
      );

    p.y =
      clamp(
        p.y,
        p.radius + 80,
        game.canvas.height -
          p.radius -
          15
      );

    /*
      Passive recovery when standing still.
    */

    if (dx === 0 && dy === 0) {
      state.energy =
        clamp(
          state.energy +
            dt * 0.45
        );
    }

    updateCollectibles(dt);
    updateParticles(dt);

    checkMissionProgress();

    if (
      game.elapsed > 0 &&
      Math.floor(game.elapsed) % 8 === 0
    ) {
      state.energy =
        clamp(state.energy);
    }
  }

  function updateCollectibles(dt) {
    const p = game.player;

    game.collectibles.forEach(item => {
      if (item.collected) return;

      item.bob += dt * 2;

      const dx =
        p.x - item.x;

      const dy =
        p.y - item.y;

      const distance =
        Math.sqrt(
          dx * dx +
          dy * dy
        );

      if (
        distance <
        p.radius + item.radius
      ) {
        collectBone(item);
      }
    });
  }

  function collectBone(item) {
    item.collected = true;

    game.bones += 1;

    state.totalBones += 1;
    state.daily.bones += 1;

    state.happiness =
      clamp(
        state.happiness + 2
      );

    increaseBond(1);

    addParticleBurst(
      item.x,
      item.y
    );

    playSound("bone");

    showToast(
      "Bone collected! +10 XP",
      "🦴"
    );

    addXP(10);

    checkMissionProgress();

    saveState();

    setTimeout(() => {
      if (
        game.running &&
        !game.completed
      ) {
        spawnCollectibles(1);
      }
    }, 500);
  }

  function finishAdventure() {
    if (
      game.completed ||
      !game.running
    ) {
      return;
    }

    game.completed = true;
    game.running = false;

    cancelAnimationFrame(
      game.animationFrame
    );

    const bones = game.bones;

    const xp =
      30 +
      bones * 10 +
      Math.min(
        20,
        Math.floor(
          game.distance / 200
        )
      );

    const bondReward =
      Math.max(
        1,
        Math.min(
          10,
          2 +
            Math.floor(bones / 2)
        )
      );

    state.adventures += 1;

    state.daily.adventure = true;

    state.lastAdventureEnergy =
      Math.round(state.energy);

    state.happiness =
      clamp(
        state.happiness +
          Math.min(8, bones + 2)
      );

    state.energy =
      clamp(
        state.energy -
          Math.min(18, 5 + bones)
      );

    increaseBond(bondReward);

    registerActivity();

    addJournalEntry({
      bones,
      xp,
      bond: bondReward,
      energy: state.energy
    });

    /*
      Add XP directly here rather than calling
      addXP() repeatedly during completion.
    */

    state.xp += xp;

    let levelled = false;

    while (
      state.xp >= XP_PER_LEVEL
    ) {
      state.xp -= XP_PER_LEVEL;
      state.level += 1;
      levelled = true;
    }

    updateBadges(false);

    saveState();

    $("resultBones").textContent =
      bones;

    $("resultXp").textContent =
      xp;

    $("resultBond").textContent =
      `+${bondReward}%`;

    $("completeTitle").textContent =
      bones >= 5
        ? "You're a legendary dog team!"
        : bones >= 2
        ? "What a pawsome adventure!"
        : "What a good dog!";

    $("completeMessage").textContent =
      levelled
        ? `Level ${state.level}! Your adventure has been saved to the journal.`
        : "Your adventure has been saved to the journal.";

    $("gameComplete").classList.remove(
      "hidden"
    );

    playSound(
      levelled
        ? "level"
        : "success"
    );

    renderAll();
  }

  /* =======================================================
     GAME HUD
  ======================================================= */

  function renderGameHUD() {
    $("gameHappiness").textContent =
      Math.round(state.happiness);

    $("gameEnergy").textContent =
      Math.round(state.energy);

    $("gameHappinessBar").style.width =
      `${state.happiness}%`;

    $("gameEnergyBar").style.width =
      `${state.energy}%`;

    $("boneScore").textContent =
      game.bones;

    $("gameXp").textContent =
      Math.round(state.xp);

    $("gameTimer").textContent =
      Math.ceil(game.timeLeft);
  }

  /* =======================================================
     CANVAS DRAWING
  ======================================================= */

  function drawGame() {
    const canvas = game.canvas;
    const ctx = game.ctx;

    if (!canvas || !ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(
      0,
      0,
      w,
      h
    );

    drawWorldBackground(
      ctx,
      w,
      h
    );

    drawWorldDetails(
      ctx,
      w,
      h
    );

    drawCollectibles(ctx);

    drawParticles(ctx);

    drawDog(
      ctx,
      game.player.x,
      game.player.y
    );

    /*
      Subtle paused visual.
    */

    if (game.paused) {
      ctx.fillStyle =
        "rgba(5, 10, 20, 0.16)";

      ctx.fillRect(
        0,
        0,
        w,
        h
      );
    }
  }

  function drawWorldBackground(
    ctx,
    w,
    h
  ) {
    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        0,
        h
      );

    gradient.addColorStop(
      0,
      "#bfe7ff"
    );

    gradient.addColorStop(
      0.48,
      "#d9f3cf"
    );

    gradient.addColorStop(
      1,
      "#9bd18c"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
      0,
      0,
      w,
      h
    );

    /*
      Soft distant hills.
    */

    ctx.fillStyle =
      "rgba(69, 133, 83, 0.28)";

    ctx.beginPath();

    ctx.moveTo(0, 260);

    for (
      let x = 0;
      x <= w;
      x += 80
    ) {
      const y =
        250 +
        Math.sin(x * 0.012) * 35;

      ctx.lineTo(
        x,
        y
      );
    }

    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();

    ctx.fill();

    /*
      Main meadow.
    */

    ctx.fillStyle =
      "rgba(255,255,255,0.07)";

    for (
      let i = 0;
      i < 80;
      i++
    ) {
      const x =
        (i * 157) % w;

      const y =
        100 +
        ((i * 83) % (h - 120));

      ctx.beginPath();

      ctx.arc(
        x,
        y,
        2,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }
  }

  function drawWorldDetails(
    ctx,
    w,
    h
  ) {
    /*
      Path.
    */

    ctx.fillStyle =
      "rgba(221, 190, 137, 0.62)";

    ctx.beginPath();

    ctx.moveTo(
      w * 0.43,
      0
    );

    ctx.bezierCurveTo(
      w * 0.50,
      h * 0.25,
      w * 0.34,
      h * 0.55,
      w * 0.56,
      h
    );

    ctx.lineTo(
      w * 0.72,
      h
    );

    ctx.bezierCurveTo(
      w * 0.48,
      h * 0.53,
      w * 0.65,
      h * 0.25,
      w * 0.57,
      0
    );

    ctx.closePath();

    ctx.fill();

    /*
      Trees.
    */

    const trees = [
      [100, 160],
      [190, 500],
      [1030, 150],
      [1080, 510],
      [920, 390],
      [280, 260]
    ];

    trees.forEach(
      ([x, y], index) => {
        drawTree(
          ctx,
          x,
          y,
          0.8 + (index % 2) * 0.15
        );
      }
    );

    /*
      Flowers.
    */

    for (
      let i = 0;
      i < 35;
      i++
    ) {
      const x =
        (i * 193) % w;

      const y =
        100 +
        ((i * 137) % (h - 130));

      ctx.fillStyle =
        i % 3 === 0
          ? "rgba(255,255,255,0.8)"
          : "rgba(255,230,150,0.8)";

      ctx.beginPath();

      ctx.arc(
        x,
        y,
        2.2,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }
  }

  function drawTree(
    ctx,
    x,
    y,
    scale
  ) {
    ctx.save();

    ctx.translate(
      x,
      y
    );

    ctx.scale(
      scale,
      scale
    );

    ctx.fillStyle =
      "#79533a";

    ctx.fillRect(
      -10,
      10,
      20,
      65
    );

    ctx.fillStyle =
      "#39784d";

    [
      [0, -25, 42],
      [-27, 5, 31],
      [27, 5, 31]
    ].forEach(
      ([cx, cy, r]) => {
        ctx.beginPath();

        ctx.arc(
          cx,
          cy,
          r,
          0,
          Math.PI * 2
        );

        ctx.fill();
      }
    );

    ctx.restore();
  }

  function drawCollectibles(ctx) {
    game.collectibles.forEach(
      item => {
        if (item.collected) return;

        const bob =
          Math.sin(item.bob) * 4;

        ctx.save();

        ctx.translate(
          item.x,
          item.y + bob
        );

        /*
          Glow.
        */

        const glow =
          ctx.createRadialGradient(
            0,
            0,
            2,
            0,
            0,
            28
          );

        glow.addColorStop(
          0,
          "rgba(255,255,255,0.55)"
        );

        glow.addColorStop(
          1,
          "rgba(255,255,255,0)"
        );

        ctx.fillStyle = glow;

        ctx.beginPath();

        ctx.arc(
          0,
          0,
          30,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.font =
          "28px system-ui";

        ctx.textAlign =
          "center";

        ctx.textBaseline =
          "middle";

        ctx.fillText(
          "🦴",
          0,
          0
        );

        ctx.restore();
      }
    );
  }

  function drawDog(
    ctx,
    x,
    y
  ) {
    const dog =
      currentDog();

    const moving =
      game.keys.up ||
      game.keys.down ||
      game.keys.left ||
      game.keys.right;

    const bounce =
      moving
        ? Math.sin(game.elapsed * 14) * 4
        : Math.sin(game.elapsed * 2) * 1.5;

    ctx.save();

    ctx.translate(
      x,
      y + bounce
    );

    /*
      Shadow.
    */

    ctx.fillStyle =
      "rgba(0,0,0,0.18)";

    ctx.beginPath();

    ctx.ellipse(
      0,
      31,
      38,
      12,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    /*
      Selection glow.
    */

    const glow =
      ctx.createRadialGradient(
        0,
        0,
        10,
        0,
        0,
        55
      );

    glow.addColorStop(
      0,
      "rgba(255,255,255,0.28)"
    );

    glow.addColorStop(
      1,
      "rgba(255,255,255,0)"
    );

    ctx.fillStyle = glow;

    ctx.beginPath();

    ctx.arc(
      0,
      0,
      55,
      0,
      Math.PI * 2
    );

    ctx.fill();

    /*
      Dog emoji.
    */

    ctx.font =
      "58px system-ui, Apple Color Emoji";

    ctx.textAlign =
      "center";

    ctx.textBaseline =
      "middle";

    ctx.fillText(
      dog.emoji,
      0,
      0
    );

    /*
      Small name tag.
    */

    ctx.font =
      "600 14px system-ui";

    const label =
      dog.name;

    const width =
      ctx.measureText(label).width +
      22;

    ctx.fillStyle =
      "rgba(11,16,32,0.78)";

    roundRect(
      ctx,
      -width / 2,
      42,
      width,
      24,
      12
    );

    ctx.fill();

    ctx.fillStyle =
      "#ffffff";

    ctx.fillText(
      label,
      0,
      54
    );

    ctx.restore();
  }

  function roundRect(
    ctx,
    x,
    y,
    width,
    height,
    radius
  ) {
    const r =
      Math.min(
        radius,
        width / 2,
        height / 2
      );

    ctx.beginPath();

    ctx.moveTo(
      x + r,
      y
    );

    ctx.arcTo(
      x + width,
      y,
      x + width,
      y + height,
      r
    );

    ctx.arcTo(
      x + width,
      y + height,
      x,
      y + height,
      r
    );

    ctx.arcTo(
      x,
      y + height,
      x,
      y,
      r
    );

    ctx.arcTo(
      x,
      y,
      x + width,
      y,
      r
    );

    ctx.closePath();
  }

  /* =======================================================
     PARTICLES
  ======================================================= */

  function addParticleBurst(
    x,
    y
  ) {
    for (
      let i = 0;
      i < 12;
      i++
    ) {
      game.particles.push({
        x,
        y,
        vx: random(-80, 80),
        vy: random(-120, -20),
        life: 0.8,
        maxLife: 0.8,
        symbol:
          i % 2 === 0
            ? "✦"
            : "✨"
      });
    }
  }

  function updateParticles(dt) {
    game.particles =
      game.particles.filter(
        particle => {
          particle.life -= dt;

          particle.x +=
            particle.vx * dt;

          particle.y +=
            particle.vy * dt;

          particle.vy +=
            220 * dt;

          return particle.life > 0;
        }
      );
  }

  function drawParticles(ctx) {
    game.particles.forEach(
      particle => {
        const alpha =
          clamp(
            particle.life /
              particle.maxLife,
            0,
            1
          );

        ctx.save();

        ctx.globalAlpha =
          alpha;

        ctx.font =
          "20px system-ui";

        ctx.textAlign =
          "center";

        ctx.textBaseline =
          "middle";

        ctx.fillText(
          particle.symbol,
          particle.x,
          particle.y
        );

        ctx.restore();
      }
    );
  }

  /* =======================================================
     KEYBOARD CONTROLS
  ======================================================= */

  const keyMap = {
    ArrowUp: "up",
    w: "up",
    W: "up",

    ArrowDown: "down",
    s: "down",
    S: "down",

    ArrowLeft: "left",
    a: "left",
    A: "left",

    ArrowRight: "right",
    d: "right",
    D: "right"
  };

  function handleKeyDown(event) {
    const control =
      keyMap[event.key];

    if (control) {
      event.preventDefault();

      game.keys[control] = true;

      getAudioContext();
    }

    if (
      event.key === "Escape"
    ) {
      closeAllModals();

      if (
        game.running &&
        !game.completed
      ) {
        if (game.paused) {
          resumeAdventure();
        } else {
          pauseAdventure();
        }
      }
    }

    if (
      event.key === " " &&
      currentScreen === "adventure" &&
      game.running &&
      !game.completed
    ) {
      event.preventDefault();

      if (game.paused) {
        resumeAdventure();
      } else {
        pauseAdventure();
      }
    }
  }

  function handleKeyUp(event) {
    const control =
      keyMap[event.key];

    if (control) {
      event.preventDefault();

      game.keys[control] = false;
    }
  }

  /* =======================================================
     TOUCH CONTROLS
  ======================================================= */

  function setupTouchControls() {
    document
      .querySelectorAll(
        "[data-control]"
      )
      .forEach(button => {
        const control =
          button.dataset.control;

        const start = event => {
          event.preventDefault();

          game.keys[control] = true;

          getAudioContext();
        };

        const end = event => {
          event.preventDefault();

          game.keys[control] = false;
        };

        button.addEventListener(
          "pointerdown",
          start
        );

        button.addEventListener(
          "pointerup",
          end
        );

        button.addEventListener(
          "pointercancel",
          end
        );

        button.addEventListener(
          "pointerleave",
          end
        );

        button.addEventListener(
          "pointerout",
          end
        );
      });
  }

  /* =======================================================
     EVENT BINDINGS
  ======================================================= */

  function setupNavigation() {
    document
      .querySelectorAll(".nav-item")
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            playSound("click");

            navigate(
              button.dataset.screen
            );
          }
        );
      });

    $("brandButton")
      ?.addEventListener(
        "click",
        () => {
          navigate("home");
          playSound("click");
        }
      );
  }

  function setupHomeButtons() {
    $("startAdventureButton")
      ?.addEventListener(
        "click",
        startAdventure
      );

    $("quickMissionButton")
      ?.addEventListener(
        "click",
        () => {
          startAdventure();
        }
      );

    $("exploreFeature")
      ?.addEventListener(
        "click",
        startAdventure
      );

    $("trainingFeature")
      ?.addEventListener(
        "click",
        () => {
          increaseBond(2);

          state.happiness =
            clamp(
              state.happiness + 3
            );

          addXP(15);

          state.daily.bond = true;

          saveState();

          showToast(
            "Training complete! +15 XP",
            "🎓"
          );

          playSound("success");
        }
      );

    $("journalFeature")
      ?.addEventListener(
        "click",
        () => {
          navigate("journal");
          playSound("click");
        }
      );

    $("statsRefreshButton")
      ?.addEventListener(
        "click",
        () => {
          state.energy =
            clamp(
              state.energy + 2
            );

          state.happiness =
            clamp(
              state.happiness + 1
            );

          saveState();
          renderAll();

          showToast(
            "Your dog's wellbeing is refreshed.",
            "💚"
          );
        }
      );

    $("heroFavoriteButton")
      ?.addEventListener(
        "click",
        () => {
          state.favorites =
            !state.favorites;

          saveState();
          renderAll();

          showToast(
            state.favorites
              ? "Added to favorites."
              : "Removed from favorites.",
            state.favorites
              ? "❤️"
              : "♡"
          );

          playSound("click");
        }
      );

    $("changeDogButton")
      ?.addEventListener(
        "click",
        () => {
          openModal("dogModal");
        }
      );

    $("profileButton")
      ?.addEventListener(
        "click",
        () => {
          navigate("profile");
          playSound("click");
        }
      );

    $("soundButton")
      ?.addEventListener(
        "click",
        () => {
          settings.sound =
            !settings.sound;

          saveSettings();

          updateSoundUI();

          if (settings.sound) {
            playSound("click");
          }

          showToast(
            settings.sound
              ? "Sound enabled."
              : "Sound muted.",
            settings.sound
              ? "🔊"
              : "🔇"
          );
        }
      );
  }

  function setupAdventureButtons() {
    $("pauseButton")
      ?.addEventListener(
        "click",
        () => {
          if (game.paused) {
            resumeAdventure();
          } else {
            pauseAdventure();
          }
        }
      );

    $("resumeButton")
      ?.addEventListener(
        "click",
        resumeAdventure
      );

    $("exitAdventureButton")
      ?.addEventListener(
        "click",
        exitAdventure
      );

    $("newMissionButton")
      ?.addEventListener(
        "click",
        newMission
      );

    $("playAgainButton")
      ?.addEventListener(
        "click",
        startAdventure
      );

    $("journalResultButton")
      ?.addEventListener(
        "click",
        () => {
          game.running = false;

          $("gameComplete")
            .classList.add(
              "hidden"
            );

          navigate("journal");
        }
      );

    $("journalStartButton")
      ?.addEventListener(
        "click",
        startAdventure
      );
  }

  function setupDogModal() {
    document
      .querySelectorAll(
        ".dog-option"
      )
      .forEach(option => {
        option.addEventListener(
          "click",
          () => {
            document
              .querySelectorAll(
                ".dog-option"
              )
              .forEach(item =>
                item.classList.remove(
                  "selected"
                )
              );

            option.classList.add(
              "selected"
            );

            playSound("click");
          }
        );
      });

    $("confirmDogButton")
      ?.addEventListener(
        "click",
        () => {
          const selected =
            document.querySelector(
              ".dog-option.selected"
            );

          if (!selected) {
            showToast(
              "Choose a companion first.",
              "🐾"
            );

            return;
          }

          selectDog(
            selected.dataset.dog
          );
        }
      );
  }

  function setupProfile() {
    $("editProfileButton")
      ?.addEventListener(
        "click",
        () => {
          $("nameInput").value =
            state.playerName || "";

          openModal(
            "profileModal"
          );
        }
      );

    $("saveNameButton")
      ?.addEventListener(
        "click",
        saveProfileName
      );

    $("nameInput")
      ?.addEventListener(
        "keydown",
        event => {
          if (
            event.key === "Enter"
          ) {
            event.preventDefault();

            saveProfileName();
          }
        }
      );

    $("soundToggle")
      ?.addEventListener(
        "change",
        event => {
          settings.sound =
            event.target.checked;

          saveSettings();
          updateSoundUI();
        }
      );

    $("motionToggle")
      ?.addEventListener(
        "change",
        event => {
          settings.reducedMotion =
            event.target.checked;

          saveSettings();

          document.body.classList.toggle(
            "reduced-motion",
            settings.reducedMotion
          );
        }
      );

    $("resetProgressButton")
      ?.addEventListener(
        "click",
        resetProgress
      );
  }

  function saveProfileName() {
    const input =
      $("nameInput");

    if (!input) return;

    const name =
      input.value
        .trim()
        .replace(/\s+/g, " ");

    if (!name) {
      showToast(
        "Please enter a name.",
        "⚠️"
      );

      input.focus();

      return;
    }

    state.playerName =
      name.slice(0, 30);

    saveState();
    renderAll();

    closeModal(
      "profileModal"
    );

    showToast(
      `Welcome, ${state.playerName}!`,
      "👋"
    );

    playSound("success");
  }

  function updateSoundUI() {
    const button =
      $("soundButton");

    if (button) {
      button.textContent =
        settings.sound
          ? "🔊"
          : "🔇";

      button.setAttribute(
        "aria-label",
        settings.sound
          ? "Mute sound"
          : "Enable sound"
      );
    }

    const checkbox =
      $("soundToggle");

    if (checkbox) {
      checkbox.checked =
        settings.sound;
    }

    const motion =
      $("motionToggle");

    if (motion) {
      motion.checked =
        settings.reducedMotion;
    }

    document.body.classList.toggle(
      "reduced-motion",
      settings.reducedMotion
    );
  }

  function resetProgress() {
    const confirmed =
      window.confirm(
        "Reset all Dog Life progress?\n\nThis will delete your adventures, XP, badges, bones, streak and journal from this browser."
      );

    if (!confirmed) return;

    state =
      createDefaultState();

    ensureMission();

    saveState();

    closeAllModals();

    navigate("home");

    renderAll();

    showToast(
      "Progress has been reset.",
      "↻"
    );

    playSound("click");
  }

  function setupModalClosing() {
    document
      .querySelectorAll(
        "[data-close-modal]"
      )
      .forEach(element => {
        element.addEventListener(
          "click",
          event => {
            event.stopPropagation();

            const modal =
              element.closest(".modal");

            if (modal) {
              closeModal(
                modal.id
              );
            }
          }
        );
      });
  }

  /* =======================================================
     VISIBILITY / LIFECYCLE
  ======================================================= */

  function setupLifecycle() {
    document.addEventListener(
      "visibilitychange",
      () => {
        if (
          document.hidden &&
          game.running &&
          !game.completed
        ) {
          pauseAdventure();
        }
      }
    );

    window.addEventListener(
      "beforeunload",
      () => {
        saveState();
      }
    );

    window.addEventListener(
      "resize",
      resizeCanvas
    );
  }

  /* =======================================================
     LOADING SCREEN
  ======================================================= */

  function hideLoadingScreen() {
    const loading =
      $("loadingScreen");

    if (!loading) return;

    setTimeout(() => {
      loading.classList.add(
        "hidden"
      );
    }, 500);
  }

  /* =======================================================
     INITIALIZATION
  ======================================================= */

  function init() {
    loadSettings();
    loadState();

    setupCanvas();

    setupNavigation();
    setupHomeButtons();
    setupAdventureButtons();
    setupDogModal();
    setupProfile();
    setupModalClosing();
    setupTouchControls();
    setupLifecycle();

    window.addEventListener(
      "keydown",
      handleKeyDown,
      { passive: false }
    );

    window.addEventListener(
      "keyup",
      handleKeyUp,
      { passive: false }
    );

    updateSoundUI();
    renderAll();

    /*
      First-run welcome.
    */

    const firstRun =
      !localStorage.getItem(
        STORAGE_KEY
      );

    if (firstRun) {
      showToast(
        "Welcome to Dog Life! 🐾",
        "✨"
      );
    }

    hideLoadingScreen();
  }

  /* =======================================================
     START
  ======================================================= */

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }

})();
