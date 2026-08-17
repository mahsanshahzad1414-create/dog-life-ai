/* =========================================================
   DOG LIFE AI — GAME ENGINE
   Premium browser game logic
========================================================= */

"use strict";

/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY = "dog-life-ai-save-v1";

const defaultState = {
  dog: {
    name: "Luna",
    breed: "Golden Retriever",
    emoji: "🐕",
    level: 1,
    xp: 0,
    coins: 120,
    happiness: 86,
    hunger: 78,
    energy: 92,
    health: 96,
    cleanliness: 88,
    intelligence: 12,
    loyalty: 20,
    ageDays: 1
  },

  stats: {
    adventures: 0,
    missions: 0,
    treats: 0,
    walks: 0,
    tricks: 0,
    totalXp: 0,
    totalCoins: 0
  },

  settings: {
    sound: true,
    notifications: true,
    reducedMotion: false
  },

  journal: [],

  badges: [
    {
      id: "first-step",
      name: "First Steps",
      description: "Complete your first adventure.",
      icon: "🐾",
      unlocked: false
    },
    {
      id: "good-human",
      name: "Good Human",
      description: "Complete 5 missions.",
      icon: "💜",
      unlocked: false
    },
    {
      id: "happy-pup",
      name: "Happy Pup",
      description: "Reach 100 happiness.",
      icon: "😊",
      unlocked: false
    },
    {
      id: "clever-pup",
      name: "Clever Pup",
      description: "Reach 50 intelligence.",
      icon: "🧠",
      unlocked: false
    },
    {
      id: "walk-master",
      name: "Walk Master",
      description: "Take 10 walks.",
      icon: "🦮",
      unlocked: false
    },
    {
      id: "treasure-hunter",
      name: "Treasure Hunter",
      description: "Collect 500 coins.",
      icon: "💎",
      unlocked: false
    },
    {
      id: "loyal-heart",
      name: "Loyal Heart",
      description: "Reach 100 loyalty.",
      icon: "❤️",
      unlocked: false
    },
    {
      id: "level-five",
      name: "Growing Up",
      description: "Reach level 5.",
      icon: "⭐",
      unlocked: false
    }
  ]
};

let state = loadState();

/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector, parent = document) =>
  parent.querySelector(selector);

const $$ = (selector, parent = document) =>
  [...parent.querySelectorAll(selector)];

function byId(id) {
  return document.getElementById(id);
}

/* =========================================================
   SAFE CLAMP
========================================================= */

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

/* =========================================================
   SAVE / LOAD
========================================================= */

function deepClone(object) {
  return JSON.parse(JSON.stringify(object));
}

function mergeState(saved) {
  const base = deepClone(defaultState);

  if (!saved || typeof saved !== "object") {
    return base;
  }

  base.dog = {
    ...base.dog,
    ...(saved.dog || {})
  };

  base.stats = {
    ...base.stats,
    ...(saved.stats || {})
  };

  base.settings = {
    ...base.settings,
    ...(saved.settings || {})
  };

  if (Array.isArray(saved.journal)) {
    base.journal = saved.journal;
  }

  if (Array.isArray(saved.badges)) {
    base.badges = base.badges.map((badge) => {
      const existing = saved.badges.find(
        (item) => item.id === badge.id
      );

      return existing
        ? { ...badge, ...existing }
        : badge;
    });
  }

  return base;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return deepClone(defaultState);
    }

    return mergeState(JSON.parse(raw));
  } catch (error) {
    console.warn("Could not load save:", error);
    return deepClone(defaultState);
  }
}

function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );
  } catch (error) {
    console.warn("Could not save game:", error);
  }
}

/* =========================================================
   AUDIO
========================================================= */

let audioContext = null;

function getAudioContext() {
  if (!state.settings.sound) {
    return null;
  }

  try {
    if (!audioContext) {
      audioContext = new (
        window.AudioContext ||
        window.webkitAudioContext
      )();
    }

    return audioContext;
  } catch {
    return null;
  }
}

function playTone(
  frequency = 440,
  duration = 0.08,
  type = "sine",
  volume = 0.035
) {
  const ctx = getAudioContext();

  if (!ctx) {
    return;
  }

  try {
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Audio is optional.
  }
}

function playSuccessSound() {
  playTone(523, 0.08);
  setTimeout(() => playTone(659, 0.09), 75);
  setTimeout(() => playTone(784, 0.12), 150);
}

function playClickSound() {
  playTone(380, 0.045, "sine", 0.02);
}

function playCoinSound() {
  playTone(880, 0.06);
  setTimeout(() => playTone(1175, 0.08), 60);
}

/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;

function showToast(message, icon = "✨") {
  const toast = byId("toast");

  if (!toast) {
    return;
  }

  toast.innerHTML = `
    <span>${icon}</span>
    <span>${escapeHtml(message)}</span>
  `;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================================================
   DOG DATA
========================================================= */

const dogBreeds = [
  {
    id: "golden",
    name: "Golden Retriever",
    emoji: "🐕",
    description: "Friendly, loyal & adventurous"
  },
  {
    id: "husky",
    name: "Husky",
    emoji: "🐺",
    description: "Energetic, clever & curious"
  },
  {
    id: "beagle",
    name: "Beagle",
    emoji: "🐶",
    description: "Playful, brave & food-loving"
  },
  {
    id: "corgi",
    name: "Corgi",
    emoji: "🐕",
    description: "Cheerful, smart & confident"
  },
  {
    id: "poodle",
    name: "Poodle",
    emoji: "🐩",
    description: "Elegant, intelligent & social"
  },
  {
    id: "shiba",
    name: "Shiba Inu",
    emoji: "🦊",
    description: "Independent, alert & spirited"
  }
];

function getCurrentBreed() {
  return (
    dogBreeds.find(
      (breed) => breed.name === state.dog.breed
    ) || dogBreeds[0]
  );
}

/* =========================================================
   XP / LEVEL SYSTEM
========================================================= */

function xpRequiredForLevel(level) {
  return Math.floor(
    100 + (level - 1) * 75 + Math.pow(level - 1, 2) * 15
  );
}

function getLevelProgress() {
  const required = xpRequiredForLevel(state.dog.level);

  return {
    current: state.dog.xp,
    required,
    percent: clamp(
      (state.dog.xp / required) * 100
    )
  };
}

function addXP(amount, reason = "Adventure reward") {
  if (!Number.isFinite(amount) || amount <= 0) {
    return;
  }

  state.dog.xp += Math.floor(amount);
  state.stats.totalXp += Math.floor(amount);

  let leveledUp = false;

  while (
    state.dog.xp >= xpRequiredForLevel(state.dog.level)
  ) {
    const required =
      xpRequiredForLevel(state.dog.level);

    state.dog.xp -= required;
    state.dog.level += 1;
    leveledUp = true;

    state.dog.health = clamp(
      state.dog.health + 6
    );

    state.dog.energy = clamp(
      state.dog.energy + 8
    );

    state.dog.happiness = clamp(
      state.dog.happiness + 7
    );

    showToast(
      `${state.dog.name} reached level ${state.dog.level}!`,
      "⭐"
    );

    playSuccessSound();
  }

  if (!leveledUp) {
    showToast(`+${amount} XP — ${reason}`, "✨");
  }

  checkBadges();
  saveState();
  renderAll();
}

/* =========================================================
   COINS
========================================================= */

function addCoins(amount, reason = "Reward") {
  if (!Number.isFinite(amount) || amount <= 0) {
    return;
  }

  state.dog.coins += Math.floor(amount);
  state.stats.totalCoins += Math.floor(amount);

  playCoinSound();

  showToast(
    `+${Math.floor(amount)} coins — ${reason}`,
    "🪙"
  );

  checkBadges();
  saveState();
  renderAll();
}

/* =========================================================
   STAT CHANGES
========================================================= */

function modifyDogStat(stat, amount) {
  if (!(stat in state.dog)) {
    return;
  }

  state.dog[stat] = clamp(
    Number(state.dog[stat]) + amount
  );
}

function careForDog({
  happiness = 0,
  hunger = 0,
  energy = 0,
  health = 0,
  cleanliness = 0,
  intelligence = 0,
  loyalty = 0
}) {
  modifyDogStat("happiness", happiness);
  modifyDogStat("hunger", hunger);
  modifyDogStat("energy", energy);
  modifyDogStat("health", health);
  modifyDogStat("cleanliness", cleanliness);
  modifyDogStat("intelligence", intelligence);
  modifyDogStat("loyalty", loyalty);

  saveState();
  checkBadges();
  renderAll();
}

/* =========================================================
   JOURNAL
========================================================= */

function addJournalEntry({
  title,
  description,
  icon = "🐾",
  xp = 0,
  coins = 0
}) {
  state.journal.unshift({
    id:
      Date.now().toString(36) +
      Math.random().toString(36).slice(2),
    title,
    description,
    icon,
    xp,
    coins,
    timestamp: Date.now()
  });

  if (state.journal.length > 50) {
    state.journal.length = 50;
  }

  saveState();
}

/* =========================================================
   BADGES
========================================================= */

function checkBadges() {
  const conditions = {
    "first-step":
      state.stats.adventures >= 1,

    "good-human":
      state.stats.missions >= 5,

    "happy-pup":
      state.dog.happiness >= 100,

    "clever-pup":
      state.dog.intelligence >= 50,

    "walk-master":
      state.stats.walks >= 10,

    "treasure-hunter":
      state.dog.coins >= 500,

    "loyal-heart":
      state.dog.loyalty >= 100,

    "level-five":
      state.dog.level >= 5
  };

  let unlockedSomething = false;

  state.badges.forEach((badge) => {
    if (
      !badge.unlocked &&
      conditions[badge.id]
    ) {
      badge.unlocked = true;
      unlockedSomething = true;

      showToast(
        `Badge unlocked: ${badge.name}`,
        badge.icon
      );
    }
  });

  if (unlockedSomething) {
    playSuccessSound();
    saveState();
  }
}

/* =========================================================
   NAVIGATION
========================================================= */

function switchScreen(screenId) {
  const screens = $$(".screen");
  const navItems = $$(".nav-item");

  screens.forEach((screen) => {
    screen.classList.toggle(
      "active",
      screen.id === screenId
    );
  });

  navItems.forEach((item) => {
    item.classList.toggle(
      "active",
      item.dataset.screen === screenId
    );
  });

  window.scrollTo({
    top: 0,
    behavior: state.settings.reducedMotion
      ? "auto"
      : "smooth"
  });

  playClickSound();
}

/* =========================================================
   RENDERING
========================================================= */

function renderDog() {
  const breed = getCurrentBreed();

  const dogElements = [
    byId("heroDog"),
    byId("profileDog")
  ];

  dogElements.forEach((element) => {
    if (element) {
      element.textContent = breed.emoji;
    }
  });

  const nameElements = [
    byId("heroDogName"),
    byId("profileDogName")
  ];

  nameElements.forEach((element) => {
    if (element) {
      element.textContent = state.dog.name;
    }
  });

  const breedElements = [
    byId("profileDogBreed")
  ];

  breedElements.forEach((element) => {
    if (element) {
      element.textContent = state.dog.breed;
    }
  });
}

function renderStats() {
  const mapping = {
    happiness: state.dog.happiness,
    hunger: state.dog.hunger,
    energy: state.dog.energy,
    health: state.dog.health
  };

  Object.entries(mapping).forEach(
    ([stat, value]) => {
      const valueElement =
        byId(`stat-${stat}`);

      const fillElement =
        byId(`bar-${stat}`);

      if (valueElement) {
        valueElement.textContent =
          `${Math.round(value)}%`;
      }

      if (fillElement) {
        fillElement.style.width =
          `${clamp(value)}%`;
      }
    }
  );

  const xp = getLevelProgress();

  const xpValue = byId("xpValue");

  if (xpValue) {
    xpValue.textContent =
      `${xp.current} / ${xp.required} XP`;
  }

  const xpBar = byId("xpBar");

  if (xpBar) {
    xpBar.style.width =
      `${xp.percent}%`;
  }

  const levelElements = $$("[data-level]");

  levelElements.forEach((element) => {
    element.textContent =
      state.dog.level;
  });

  const coinElements =
    $$("[data-coins]");

  coinElements.forEach((element) => {
    element.textContent =
      state.dog.coins;
  });

  const intelligence =
    byId("profileIntelligence");

  if (intelligence) {
    intelligence.textContent =
      Math.round(state.dog.intelligence);
  }

  const loyalty =
    byId("profileLoyalty");

  if (loyalty) {
    loyalty.textContent =
      Math.round(state.dog.loyalty);
  }

  const adventures =
    byId("profileAdventures");

  if (adventures) {
    adventures.textContent =
      state.stats.adventures;
  }

  const streak =
    byId("streakValue");

  if (streak) {
    streak.textContent =
      Math.max(
        1,
        Math.min(
          365,
          Math.floor(
            state.stats.adventures / 2
          ) + 1
        )
      );
  }
}

function renderGoals() {
  const goals = [
    {
      title: "Give your dog some love",
      description: "Pet, play or complete a care action.",
      reward: "+20 XP",
      completed: state.stats.missions >= 1
    },
    {
      title: "Complete an adventure",
      description: "Explore the world together.",
      reward: "+35 XP",
      completed: state.stats.adventures >= 1
    },
    {
      title: "Keep the energy high",
      description: "Finish an adventure with enough energy.",
      reward: "+25 coins",
      completed:
        state.dog.energy >= 75
    }
  ];

  const container = byId("goalsGrid");

  if (!container) {
    return;
  }

  container.innerHTML =
    goals
      .map(
        (goal) => `
          <article class="goal-card">
            <div class="goal-check">
              ${goal.completed ? "✓" : "○"}
            </div>

            <div>
              <strong>${escapeHtml(goal.title)}</strong>
              <small>${escapeHtml(
                goal.description
              )}</small>
            </div>

            <span class="goal-reward">
              ${escapeHtml(goal.reward)}
            </span>
          </article>
        `
      )
      .join("");
}

function renderJournal() {
  const container =
    byId("journalList");

  const empty =
    byId("journalEmpty");

  const count =
    byId("journalCount");

  if (count) {
    count.textContent =
      `${state.journal.length} memories`;
  }

  if (!container || !empty) {
    return;
  }

  if (state.journal.length === 0) {
    container.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");

  container.innerHTML =
    state.journal
      .map((entry) => {
        const date =
          new Date(entry.timestamp);

        const dateText =
          date.toLocaleDateString(
            undefined,
            {
              day: "numeric",
              month: "short",
              year: "numeric"
            }
          );

        return `
          <article class="journal-entry">
            <div class="journal-art">
              ${escapeHtml(entry.icon)}
            </div>

            <div class="journal-copy">
              <strong>
                ${escapeHtml(entry.title)}
              </strong>

              <p>
                ${escapeHtml(entry.description)}
              </p>

              <small>
                ${dateText}
              </small>
            </div>

            <div class="journal-result">
              ${
                entry.xp
                  ? `<strong>+${entry.xp}</strong>
                     <small>XP</small>`
                  : ""
              }

              ${
                entry.coins
                  ? `<strong>+${entry.coins}</strong>
                     <small>coins</small>`
                  : ""
              }
            </div>
          </article>
        `;
      })
      .join("");
}

function renderBadges() {
  const container =
    byId("badgeGrid");

  const unlocked =
    state.badges.filter(
      (badge) => badge.unlocked
    ).length;

  const score =
    byId("badgeScore");

  if (score) {
    score.textContent =
      `${unlocked} / ${state.badges.length} unlocked`;
  }

  if (!container) {
    return;
  }

  container.innerHTML =
    state.badges
      .map(
        (badge) => `
          <article
            class="badge-card ${
              badge.unlocked
                ? ""
                : "locked"
            }"
          >
            <div class="badge-art">
              ${escapeHtml(badge.icon)}
            </div>

            <strong>
              ${escapeHtml(badge.name)}
            </strong>

            <small>
              ${escapeHtml(
                badge.description
              )}
            </small>
          </article>
        `
      )
      .join("");
}

function renderSettings() {
  const sound =
    byId("settingSound");

  const notifications =
    byId("settingNotifications");

  const reducedMotion =
    byId("settingReducedMotion");

  if (sound) {
    sound.checked =
      state.settings.sound;
  }

  if (notifications) {
    notifications.checked =
      state.settings.notifications;
  }

  if (reducedMotion) {
    reducedMotion.checked =
      state.settings.reducedMotion;
  }

  document.body.classList.toggle(
    "reduced-motion",
    state.settings.reducedMotion
  );
}

function renderAll() {
  renderDog();
  renderStats();
  renderGoals();
  renderJournal();
  renderBadges();
  renderSettings();
}

/* =========================================================
   CARE ACTIONS
========================================================= */

function feedDog() {
  if (state.dog.hunger >= 100) {
    showToast(
      `${state.dog.name} isn't hungry right now.`,
      "🥣"
    );
    return;
  }

  const gained =
    Math.min(
      28,
      100 - state.dog.hunger
    );

  careForDog({
    hunger: gained,
    happiness: 3,
    energy: 2
  });

  state.stats.treats += 1;

  addJournalEntry({
    title: "Snack Time",
    description:
      `${state.dog.name} enjoyed a delicious meal.`,
    icon: "🥣",
    xp: 8
  });

  addXP(8, "Taking care of your dog");
}

function petDog() {
  careForDog({
    happiness: 8,
    loyalty: 3
  });

  addJournalEntry({
    title: "A Little Love",
    description:
      `${state.dog.name} received some well-deserved affection.`,
    icon: "💜",
    xp: 5
  });

  addXP(5, "Showing affection");
}

function groomDog() {
  if (state.dog.cleanliness >= 100) {
    showToast(
      `${state.dog.name} is already sparkling clean!`,
      "✨"
    );
    return;
  }

  careForDog({
    cleanliness: 30,
    happiness: 4,
    health: 2
  });

  addJournalEntry({
    title: "Fresh & Clean",
    description:
      `${state.dog.name} had a relaxing grooming session.`,
    icon: "🫧",
    xp: 10
  });

  addXP(10, "Grooming");
}

function walkDog() {
  if (state.dog.energy < 20) {
    showToast(
      `${state.dog.name} needs some rest first.`,
      "😴"
    );
    return;
  }

  state.stats.walks += 1;

  careForDog({
    happiness: 12,
    hunger: -8,
    energy: -20,
    cleanliness: -7,
    health: 3,
    loyalty: 5
  });

  addJournalEntry({
    title: "Neighborhood Walk",
    description:
      `${state.dog.name} explored the neighborhood with you.`,
    icon: "🦮",
    xp: 18,
    coins: 5
  });

  addXP(18, "Going for a walk");
  addCoins(5, "Walk bonus");
}

function restDog() {
  if (state.dog.energy >= 100) {
    showToast(
      `${state.dog.name} is already fully rested.`,
      "☀️"
    );
    return;
  }

  careForDog({
    energy: 30,
    health: 5,
    hunger: -5
  });

  addJournalEntry({
    title: "Quiet Rest",
    description:
      `${state.dog.name} took some time to recharge.`,
    icon: "🛏️",
    xp: 7
  });

  addXP(7, "Resting");
}

/* =========================================================
   MISSION SYSTEM
========================================================= */

const missions = [
  {
    id: "fetch",
    title: "Perfect Fetch",
    description:
      "Complete a quick fetch challenge.",
    rewardXp: 25,
    rewardCoins: 12,
    icon: "🎾"
  },
  {
    id: "sniff",
    title: "Mystery Scent",
    description:
      "Follow the mysterious scent trail.",
    rewardXp: 32,
    rewardCoins: 18,
    icon: "👃"
  },
  {
    id: "friend",
    title: "Make a New Friend",
    description:
      "Meet another friendly dog.",
    rewardXp: 28,
    rewardCoins: 15,
    icon: "🐾"
  },
  {
    id: "park",
    title: "Park Explorer",
    description:
      "Discover something interesting in the park.",
    rewardXp: 38,
    rewardCoins: 22,
    icon: "🌳"
  }
];

let activeMission = null;

function startRandomMission() {
  const mission =
    missions[
      Math.floor(
        Math.random() * missions.length
      )
    ];

  activeMission = mission;

  const missionTitle =
    byId("missionTitle");

  const missionDescription =
    byId("missionDescription");

  const missionIcon =
    byId("missionIcon");

  if (missionTitle) {
    missionTitle.textContent =
      mission.title;
  }

  if (missionDescription) {
    missionDescription.textContent =
      mission.description;
  }

  if (missionIcon) {
    missionIcon.textContent =
      mission.icon;
  }

  showToast(
    `Mission ready: ${mission.title}`,
    mission.icon
  );
}

function completeMission() {
  if (!activeMission) {
    startRandomMission();
    return;
  }

  const mission =
    activeMission;

  state.stats.missions += 1;

  careForDog({
    happiness: 7,
    energy: -7,
    hunger: -3,
    loyalty: 4,
    intelligence: 2
  });

  addJournalEntry({
    title: mission.title,
    description:
      `${state.dog.name} completed the mission successfully.`,
    icon: mission.icon,
    xp: mission.rewardXp,
    coins: mission.rewardCoins
  });

  addXP(
    mission.rewardXp,
    "Mission completed"
  );

  addCoins(
    mission.rewardCoins,
    "Mission reward"
  );

  activeMission = null;

  startRandomMission();

  checkBadges();
}

/* =========================================================
   ADVENTURE GAME
========================================================= */

const game = {
  canvas: null,
  ctx: null,

  running: false,
  paused: false,
  started: false,
  ended: false,

  lastFrame: 0,
  elapsed: 0,
  duration: 90,

  score: 0,
  collected: 0,
  targetCount: 10,

  keys: {
    up: false,
    down: false,
    left: false,
    right: false
  },

  player: {
    x: 250,
    y: 250,
    radius: 23,
    speed: 205
  },

  world: {
    width: 1000,
    height: 560
  },

  items: [],
  obstacles: [],
  decorations: []
};

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(
    randomRange(min, max + 1)
  );
}

function distance(a, b) {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y
  );
}

function resizeGameCanvas() {
  if (!game.canvas) {
    return;
  }

  const rect =
    game.canvas.getBoundingClientRect();

  const dpr =
    Math.min(window.devicePixelRatio || 1, 2);

  game.canvas.width =
    Math.floor(rect.width * dpr);

  game.canvas.height =
    Math.floor(rect.height * dpr);

  game.ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );

  game.displayWidth =
    rect.width;

  game.displayHeight =
    rect.height;
}

function initializeGameCanvas() {
  game.canvas =
    byId("gameCanvas");

  if (!game.canvas) {
    return;
  }

  game.ctx =
    game.canvas.getContext("2d");

  resizeGameCanvas();

  window.addEventListener(
    "resize",
    resizeGameCanvas
  );
}

function resetGameWorld() {
  game.elapsed = 0;
  game.score = 0;
  game.collected = 0;
  game.ended = false;
  game.paused = false;

  game.player.x =
    game.world.width / 2;

  game.player.y =
    game.world.height / 2;

  game.items = [];
  game.obstacles = [];
  game.decorations = [];

  createWorld();
  updateGameHud();
}

function createWorld() {
  const margin = 55;

  for (let i = 0; i < 12; i++) {
    game.obstacles.push({
      x: randomRange(
        margin,
        game.world.width - margin
      ),
      y: randomRange(
        margin,
        game.world.height - margin
      ),
      width: randomRange(45, 95),
      height: randomRange(35, 65)
    });
  }

  for (let i = 0; i < 45; i++) {
    game.decorations.push({
      x: randomRange(
        20,
        game.world.width - 20
      ),
      y: randomRange(
        20,
        game.world.height - 20
      ),
      type:
        Math.random() > 0.5
          ? "grass"
          : "flower",
      size: randomRange(1, 2)
    });
  }

  for (
    let i = 0;
    i < game.targetCount;
    i++
  ) {
    spawnCollectible();
  }
}

function spawnCollectible() {
  let item = null;

  for (let attempt = 0; attempt < 100; attempt++) {
    const candidate = {
      x: randomRange(
        45,
        game.world.width - 45
      ),
      y: randomRange(
        45,
        game.world.height - 45
      ),
      radius: 13,
      type:
        Math.random() > 0.72
          ? "star"
          : "treat",
      pulse: Math.random() * Math.PI * 2
    };

    const blocked =
      game.obstacles.some(
        (obstacle) =>
          candidate.x >
            obstacle.x - 20 &&
          candidate.x <
            obstacle.x +
              obstacle.width +
              20 &&
          candidate.y >
            obstacle.y - 20 &&
          candidate.y <
            obstacle.y +
              obstacle.height +
              20
      );

    if (!blocked) {
      item = candidate;
      break;
    }
  }

  if (item) {
    game.items.push(item);
  }
}

function isCollidingWithObstacle(
  x,
  y,
  radius
) {
  return game.obstacles.some(
    (obstacle) => {
      const nearestX =
        clamp(
          x,
          obstacle.x,
          obstacle.x + obstacle.width
        );

      const nearestY =
        clamp(
          y,
          obstacle.y,
          obstacle.y + obstacle.height
        );

      const dx =
        x - nearestX;

      const dy =
        y - nearestY;

      return (
        dx * dx +
          dy * dy <
        radius * radius
      );
    }
  );
}

function updateGame(delta) {
  if (
    !game.running ||
    game.paused ||
    game.ended
  ) {
    return;
  }

  game.elapsed += delta;

  const directionX =
    (game.keys.right ? 1 : 0) -
    (game.keys.left ? 1 : 0);

  const directionY =
    (game.keys.down ? 1 : 0) -
    (game.keys.up ? 1 : 0);

  let length =
    Math.hypot(
      directionX,
      directionY
    );

  let normalizedX = directionX;
  let normalizedY = directionY;

  if (length > 0) {
    normalizedX /= length;
    normalizedY /= length;
  }

  const speed =
    game.player.speed;

  const nextX =
    game.player.x +
    normalizedX *
      speed *
      delta;

  const nextY =
    game.player.y +
    normalizedY *
      speed *
      delta;

  const boundedX =
    clamp(
      nextX,
      game.player.radius,
      game.world.width -
        game.player.radius
    );

  const boundedY =
    clamp(
      nextY,
      game.player.radius,
      game.world.height -
        game.player.radius
    );

  if (
    !isCollidingWithObstacle(
      boundedX,
      game.player.y,
      game.player.radius
    )
  ) {
    game.player.x = boundedX;
  }

  if (
    !isCollidingWithObstacle(
      game.player.x,
      boundedY,
      game.player.radius
    )
  ) {
    game.player.y = boundedY;
  }

  collectItems();

  if (
    game.collected >=
    game.targetCount
  ) {
    finishAdventure(true);
    return;
  }

  if (
    game.elapsed >=
    game.duration
  ) {
    finishAdventure(false);
    return;
  }

  updateGameHud();
}

function collectItems() {
  for (
    let i = game.items.length - 1;
    i >= 0;
    i--
  ) {
    const item =
      game.items[i];

    if (
      distance(
        game.player,
        item
      ) <
      game.player.radius +
        item.radius
    ) {
      game.items.splice(i, 1);

      game.collected += 1;

      const points =
        item.type === "star"
          ? 25
          : 15;

      game.score += points;

      playCoinSound();

      if (
        game.collected <
        game.targetCount
      ) {
        spawnCollectible();
      }

      updateGameHud();
    }
  }
}

function drawRoundedRect(
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
  ctx.moveTo(x + r, y);
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

function drawGame() {
  if (!game.ctx) {
    return;
  }

  const ctx = game.ctx;

  const width =
    game.displayWidth ||
    game.canvas.clientWidth;

  const height =
    game.displayHeight ||
    game.canvas.clientHeight;

  const scaleX =
    width / game.world.width;

  const scaleY =
    height / game.world.height;

  ctx.clearRect(
    0,
    0,
    width,
    height
  );

  ctx.save();

  ctx.scale(
    scaleX,
    scaleY
  );

  drawWorld(ctx);
  drawObstacles(ctx);
  drawDecorations(ctx);
  drawCollectibles(ctx);
  drawPlayer(ctx);

  ctx.restore();

  if (game.paused && game.running) {
    drawPauseOverlay(
      ctx,
      width,
      height
    );
  }
}

function drawWorld(ctx) {
  const gradient =
    ctx.createLinearGradient(
      0,
      0,
      0,
      game.world.height
    );

  gradient.addColorStop(
    0,
    "#244844"
  );

  gradient.addColorStop(
    1,
    "#132e2d"
  );

  ctx.fillStyle =
    gradient;

  ctx.fillRect(
    0,
    0,
    game.world.width,
    game.world.height
  );

  ctx.strokeStyle =
    "rgba(255,255,255,0.025)";

  ctx.lineWidth = 1;

  const grid = 40;

  for (
    let x = 0;
    x <= game.world.width;
    x += grid
  ) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(
      x,
      game.world.height
    );
    ctx.stroke();
  }

  for (
    let y = 0;
    y <= game.world.height;
    y += grid
  ) {
    ctx.beginPath();
    ctx.moveTo(
      0,
      y
    );
    ctx.lineTo(
      game.world.width,
      y
    );
    ctx.stroke();
  }
}

function drawDecorations(ctx) {
  game.decorations.forEach(
    (item) => {
      if (
        item.type === "grass"
      ) {
        ctx.strokeStyle =
          "rgba(115,200,146,0.22)";

        ctx.lineWidth =
          item.size;

        ctx.beginPath();

        ctx.moveTo(
          item.x,
          item.y + 4
        );

        ctx.lineTo(
          item.x - 2,
          item.y - 3
        );

        ctx.moveTo(
          item.x + 1,
          item.y + 4
        );

        ctx.lineTo(
          item.x + 4,
          item.y - 4
        );

        ctx.stroke();
      } else {
        ctx.fillStyle =
          "rgba(244,183,217,0.35)";

        ctx.beginPath();

        ctx.arc(
          item.x,
          item.y,
          2.1 * item.size,
          0,
          Math.PI * 2
        );

        ctx.fill();
      }
    }
  );
}

function drawObstacles(ctx) {
  game.obstacles.forEach(
    (obstacle) => {
      ctx.fillStyle =
        "rgba(9,26,25,0.42)";

      drawRoundedRect(
        ctx,
        obstacle.x + 4,
        obstacle.y + 6,
        obstacle.width,
        obstacle.height,
        13
      );

      ctx.fill();

      ctx.fillStyle =
        "#385b4c";

      drawRoundedRect(
        ctx,
        obstacle.x,
        obstacle.y,
        obstacle.width,
        obstacle.height,
        13
      );

      ctx.fill();

      ctx.fillStyle =
        "rgba(255,255,255,0.055)";

      drawRoundedRect(
        ctx,
        obstacle.x + 3,
        obstacle.y + 3,
        obstacle.width - 6,
        8,
        5
      );

      ctx.fill();
    }
  );
}

function drawCollectibles(ctx) {
  game.items.forEach(
    (item) => {
      item.pulse += 0.05;

      const pulse =
        Math.sin(
          item.pulse
        ) * 2;

      ctx.save();

      ctx.translate(
        item.x,
        item.y
      );

      ctx.shadowBlur = 16;
      ctx.shadowColor =
        item.type === "star"
          ? "rgba(255,209,102,0.7)"
          : "rgba(139,124,255,0.7)";

      ctx.fillStyle =
        item.type === "star"
          ? "#ffd166"
          : "#a79cff";

      ctx.beginPath();

      if (
        item.type === "star"
      ) {
        drawStarPath(
          ctx,
          0,
          0,
          7 + pulse,
          3.5,
          5
        );
      } else {
        ctx.arc(
          0,
          0,
          9 + pulse,
          0,
          Math.PI * 2
        );
      }

      ctx.fill();

      ctx.restore();
    }
  );
}

function drawStarPath(
  ctx,
  cx,
  cy,
  outerRadius,
  innerRadius,
  points
) {
  const step =
    Math.PI / points;

  let rotation =
    -Math.PI / 2;

  ctx.beginPath();

  for (
    let i = 0;
    i < points * 2;
    i++
  ) {
    const radius =
      i % 2 === 0
        ? outerRadius
        : innerRadius;

    const x =
      cx +
      Math.cos(rotation) *
        radius;

    const y =
      cy +
      Math.sin(rotation) *
        radius;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }

    rotation += step;
  }

  ctx.closePath();
}

function drawPlayer(ctx) {
  const x =
    game.player.x;

  const y =
    game.player.y;

  ctx.save();

  ctx.translate(
    x,
    y
  );

  ctx.shadowBlur = 18;
  ctx.shadowColor =
    "rgba(0,0,0,0.35)";

  ctx.fillStyle =
    "rgba(0,0,0,0.25)";

  ctx.beginPath();

  ctx.ellipse(
    0,
    18,
    27,
    9,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.font =
    "46px system-ui, sans-serif";

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(
    getCurrentBreed().emoji,
    0,
    -4
  );

  ctx.restore();
}

function drawPauseOverlay(
  ctx,
  width,
  height
) {
  ctx.save();

  ctx.fillStyle =
    "rgba(4,9,15,0.38)";

  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  ctx.fillStyle =
    "rgba(255,255,255,0.9)";

  ctx.font =
    "700 22px 'Space Grotesk', sans-serif";

  ctx.textAlign = "center";

  ctx.fillText(
    "PAUSED",
    width / 2,
    height / 2
  );

  ctx.restore();
}

function gameLoop(timestamp) {
  if (!game.lastFrame) {
    game.lastFrame =
      timestamp;
  }

  const delta =
    Math.min(
      (timestamp -
        game.lastFrame) /
        1000,
      0.05
    );

  game.lastFrame =
    timestamp;

  updateGame(delta);
  drawGame();

  requestAnimationFrame(
    gameLoop
  );
}

function startAdventure() {
  if (!game.canvas) {
    initializeGameCanvas();
  }

  resetGameWorld();

  game.running = true;
  game.started = true;
  game.ended = false;

  const overlay =
    byId("gameOverlay");

  if (overlay) {
    overlay.classList.add(
      "hidden"
    );
  }

  showToast(
    "Adventure started! Collect every item.",
    "🐾"
  );

  switchScreen("adventureScreen");
}

function togglePause() {
  if (!game.running) {
    return;
  }

  game.paused =
    !game.paused;

  updateGameHud();
}

function finishAdventure(success) {
  if (game.ended) {
    return;
  }

  game.ended = true;
  game.running = false;

  const rewardXp =
    success
      ? 35 + game.score
      : Math.max(
          10,
          Math.floor(
            game.score * 0.55
          )
        );

  const rewardCoins =
    success
      ? 25 +
        game.collected * 3
      : Math.floor(
          game.collected * 2
        );

  state.stats.adventures += 1;

  careForDog({
    happiness: success ? 10 : 4,
    energy: success ? -18 : -10,
    hunger: -6,
    cleanliness: -4,
    loyalty: success ? 8 : 3
  });

  addJournalEntry({
    title: success
      ? "Adventure Complete"
      : "Adventure Finished",
    description:
      success
        ? `${state.dog.name} completed the full adventure and collected everything.`
        : `${state.dog.name} explored the world and brought home ${game.collected} finds.`,
    icon: success ? "🏆" : "🌲",
    xp: rewardXp,
    coins: rewardCoins
  });

  saveState();
  checkBadges();
  renderAll();

  showAdventureResult(
    success,
    rewardXp,
    rewardCoins
  );

  if (success) {
    playSuccessSound();
  }
}

function showAdventureResult(
  success,
  rewardXp,
  rewardCoins
) {
  const overlay =
    byId("gameOverlay");

  const title =
    byId("overlayTitle");

  const description =
    byId("overlayDescription");

  const icon =
    byId("overlayIcon");

  const score =
    byId("resultScore");

  const collected =
    byId("resultCollected");

  const reward =
    byId("resultReward");

  if (!overlay) {
    return;
  }

  if (icon) {
    icon.textContent =
      success ? "🏆" : "🌲";
  }

  if (title) {
    title.textContent =
      success
        ? "Adventure Complete!"
        : "Adventure Over";
  }

  if (description) {
    description.textContent =
      success
        ? `${state.dog.name} had an amazing adventure.`
        : `${state.dog.name} made it home safely.`;
  }

  if (score) {
    score.textContent =
      game.score;
  }

  if (collected) {
    collected.textContent =
      `${game.collected}/${game.targetCount}`;
  }

  if (reward) {
    reward.textContent =
      `+${rewardCoins} 🪙`;
  }

  overlay.classList.remove(
    "hidden"
  );
}

function updateGameHud() {
  const progress =
    byId("gameProgress");

  if (progress) {
    progress.textContent =
      `${game.collected}/${game.targetCount}`;
  }

  const score =
    byId("gameScore");

  if (score) {
    score.textContent =
      game.score;
  }

  const remaining =
    Math.max(
      0,
      Math.ceil(
        game.duration -
          game.elapsed
      )
    );

  const timer =
    byId("gameTimer");

  if (timer) {
    timer.textContent =
      `${remaining}s`;
  }

  const fill =
    byId("gameProgressBar");

  if (fill) {
    fill.style.width =
      `${(game.collected /
        game.targetCount) *
        100}%`;
  }
}

/* =========================================================
   KEYBOARD
========================================================= */

function setMovementKey(
  key,
  value
) {
  const normalized =
    key.toLowerCase();

  if (
    normalized === "arrowup" ||
    normalized === "w"
  ) {
    game.keys.up = value;
  }

  if (
    normalized === "arrowdown" ||
    normalized === "s"
  ) {
    game.keys.down = value;
  }

  if (
    normalized === "arrowleft" ||
    normalized === "a"
  ) {
    game.keys.left = value;
  }

  if (
    normalized === "arrowright" ||
    normalized === "d"
  ) {
    game.keys.right = value;
  }

  if (
    normalized === " " &&
    value
  ) {
    togglePause();
  }
}

document.addEventListener(
  "keydown",
  (event) => {
    if (
      [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        " "
      ].includes(event.key)
    ) {
      event.preventDefault();
    }

    setMovementKey(
      event.key,
      true
    );
  }
);

document.addEventListener(
  "keyup",
  (event) => {
    setMovementKey(
      event.key,
      false
    );
  }
);

/* =========================================================
   TOUCH CONTROLS
========================================================= */

function bindTouchButton(
  selector,
  direction
) {
  const button =
    $(selector);

  if (!button) {
    return;
  }

  const press = (event) => {
    event.preventDefault();
    game.keys[direction] =
      true;
  };

  const release = (event) => {
    event.preventDefault();
    game.keys[direction] =
      false;
  };

  button.addEventListener(
    "pointerdown",
    press
  );

  button.addEventListener(
    "pointerup",
    release
  );

  button.addEventListener(
    "pointercancel",
    release
  );

  button.addEventListener(
    "pointerleave",
    release
  );
}

function initializeTouchControls() {
  bindTouchButton(
    ".control-up",
    "up"
  );

  bindTouchButton(
    ".control-down",
    "down"
  );

  bindTouchButton(
    ".control-left",
    "left"
  );

  bindTouchButton(
    ".control-right",
    "right"
  );
}

/* =========================================================
   DOG CREATION MODAL
========================================================= */

let selectedBreed =
  dogBreeds[0];

function openDogModal() {
  const modal =
    byId("dogModal");

  if (!modal) {
    return;
  }

  renderBreedOptions();

  const input =
    byId("dogNameInput");

  if (input) {
    input.value =
      state.dog.name;
  }

  modal.classList.remove(
    "hidden"
  );
}

function closeDogModal() {
  const modal =
    byId("dogModal");

  if (modal) {
    modal.classList.add(
      "hidden"
    );
  }
}

function renderBreedOptions() {
  const container =
    byId("dogSelectionGrid");

  if (!container) {
    return;
  }

  container.innerHTML =
    dogBreeds
      .map(
        (breed) => `
          <button
            type="button"
            class="dog-option ${
              selectedBreed.id ===
              breed.id
                ? "selected"
                : ""
            }"
            data-breed="${escapeHtml(
              breed.id
            )}"
          >
            <span class="dog-option-art">
              ${breed.emoji}
            </span>

            <span>
              <strong>
                ${escapeHtml(
                  breed.name
                )}
              </strong>

              <small>
                ${escapeHtml(
                  breed.description
                )}
              </small>
            </span>
          </button>
        `
      )
      .join("");
}

function selectBreed(id) {
  const breed =
    dogBreeds.find(
      (item) =>
        item.id === id
    );

  if (!breed) {
    return;
  }

  selectedBreed =
    breed;

  renderBreedOptions();
}

function saveDogProfile() {
  const input =
    byId("dogNameInput");

  let name =
    input?.value.trim() ||
    state.dog.name;

  name =
    name.slice(0, 18);

  state.dog.name =
    name;

  state.dog.breed =
    selectedBreed.name;

  state.dog.emoji =
    selectedBreed.emoji;

  saveState();
  renderAll();
  closeDogModal();

  showToast(
    `${state.dog.name} is ready for adventure!`,
    "🐾"
  );
}

/* =========================================================
   SETTINGS
========================================================= */

function initializeSettings() {
  const sound =
    byId("settingSound");

  const notifications =
    byId("settingNotifications");

  const reducedMotion =
    byId("settingReducedMotion");

  sound?.addEventListener(
    "change",
    () => {
      state.settings.sound =
        sound.checked;

      saveState();

      if (sound.checked) {
        playSuccessSound();
      }
    }
  );

  notifications?.addEventListener(
    "change",
    () => {
      state.settings.notifications =
        notifications.checked;

      saveState();

      showToast(
        notifications.checked
          ? "Notifications enabled."
          : "Notifications disabled.",
        "🔔"
      );
    }
  );

  reducedMotion?.addEventListener(
    "change",
    () => {
      state.settings.reducedMotion =
        reducedMotion.checked;

      saveState();
      renderSettings();
    }
  );
}

/* =========================================================
   EVENT BINDING
========================================================= */

function bindClick(
  selector,
  handler
) {
  const element =
    $(selector);

  if (!element) {
    return;
  }

  element.addEventListener(
    "click",
    handler
  );
}

function initializeNavigation() {
  $$(".nav-item").forEach(
    (item) => {
      item.addEventListener(
        "click",
        () => {
          const screen =
            item.dataset.screen;

          if (screen) {
            switchScreen(
              screen
            );
          }
        }
      );
    }
  );

  bindClick(
    "#homeButton",
    () =>
      switchScreen(
        "homeScreen"
      )
  );

  bindClick(
    "#adventureButton",
    startAdventure
  );

  bindClick(
    "#startAdventureButton",
    startAdventure
  );

  bindClick(
    "#pauseGameButton",
    togglePause
  );

  bindClick(
    "#restartAdventureButton",
    startAdventure
  );

  bindClick(
    "#backHomeButton",
    () =>
      switchScreen(
        "homeScreen"
      )
  );
}

function initializeCareActions() {
  bindClick(
    "#feedButton",
    feedDog
  );

  bindClick(
    "#petButton",
    petDog
  );

  bindClick(
    "#groomButton",
    groomDog
  );

  bindClick(
    "#walkButton",
    walkDog
  );

  bindClick(
    "#restButton",
    restDog
  );

  bindClick(
    "#missionButton",
    completeMission
  );
}

function initializeDogModal() {
  bindClick(
    "#profileButton",
    openDogModal
  );

  bindClick(
    "#editDogButton",
    openDogModal
  );

  bindClick(
    "#closeDogModal",
    closeDogModal
  );

  bindClick(
    "#saveDogButton",
    saveDogProfile
  );

  const grid =
    byId("dogSelectionGrid");

  grid?.addEventListener(
    "click",
    (event) => {
      const button =
        event.target.closest(
          "[data-breed]"
        );

      if (!button) {
        return;
      }

      selectBreed(
        button.dataset.breed
      );
    }
  );

  $$(".modal-backdrop").forEach(
    (backdrop) => {
      backdrop.addEventListener(
        "click",
        () => {
          const modal =
            backdrop.closest(
              ".modal"
            );

          modal?.classList.add(
            "hidden"
          );
        }
      );
    }
  );
}

function initializeUtilityButtons() {
  bindClick(
    "#soundButton",
    () => {
      state.settings.sound =
        !state.settings.sound;

      saveState();
      renderSettings();

      showToast(
        state.settings.sound
          ? "Sound enabled."
          : "Sound muted.",
        state.settings.sound
          ? "🔊"
          : "🔇"
      );

      if (state.settings.sound) {
        playClickSound();
      }
    }
  );

  bindClick(
    "#notificationButton",
    () => {
      state.settings.notifications =
        !state.settings.notifications;

      saveState();
      renderSettings();

      showToast(
        state.settings.notifications
          ? "Notifications enabled."
          : "Notifications disabled.",
        "🔔"
      );
    }
  );

  bindClick(
    "#resetGameButton",
    () => {
      const confirmed =
        window.confirm(
          "Reset Dog Life completely? Your current dog, progress and memories will be deleted."
        );

      if (!confirmed) {
        return;
      }

      localStorage.removeItem(
        STORAGE_KEY
      );

      state =
        deepClone(
          defaultState
        );

      selectedBreed =
        dogBreeds[0];

      saveState();
      renderAll();

      showToast(
        "Your Dog Life has been reset.",
        "↻"
      );
    }
  );
}

/* =========================================================
   DAILY DECAY
========================================================= */

const DAILY_UPDATE_KEY =
  "dog-life-ai-last-update";

function applyTimeBasedChanges() {
  const now =
    Date.now();

  const last =
    Number(
      localStorage.getItem(
        DAILY_UPDATE_KEY
      ) || now
    );

  const elapsed =
    now - last;

  const day =
    24 * 60 * 60 * 1000;

  if (elapsed < day) {
    return;
  }

  const days =
    Math.min(
      7,
      Math.floor(
        elapsed / day
      )
    );

  for (
    let i = 0;
    i < days;
    i++
  ) {
    state.dog.hunger =
      clamp(
        state.dog.hunger - 8
      );

    state.dog.happiness =
      clamp(
        state.dog.happiness - 3
      );

    state.dog.cleanliness =
      clamp(
        state.dog.cleanliness - 5
      );

    state.dog.ageDays += 1;
  }

  localStorage.setItem(
    DAILY_UPDATE_KEY,
    now.toString()
  );

  saveState();
}

/* =========================================================
   DAILY MINI NOTIFICATION
========================================================= */

function showWelcomeMessage() {
  if (
    !state.settings.notifications
  ) {
    return;
  }

  const messages = [
    `Good to see you again! ${state.dog.name} missed you. 🐾`,
    `${state.dog.name} has an adventure waiting for you. 🌳`,
    "A new day means new memories. ✨",
    "Your best friend is ready to play. 🎾"
  ];

  const index =
    Math.floor(
      Math.random() *
        messages.length
    );

  setTimeout(
    () => {
      showToast(
        messages[index],
        "🐶"
      );
    },
    1300
  );
}

/* =========================================================
   INITIALIZATION
========================================================= */

function initializeGame() {
  applyTimeBasedChanges();

  initializeGameCanvas();
  initializeTouchControls();

  initializeNavigation();
  initializeCareActions();
  initializeDogModal();
  initializeUtilityButtons();
  initializeSettings();

  startRandomMission();

  renderAll();

  requestAnimationFrame(
    gameLoop
  );

  setTimeout(
    () => {
      const loading =
        byId("loadingScreen");

      loading?.classList.add(
        "loaded"
      );

      showWelcomeMessage();
    },
    700
  );
}

/* =========================================================
   GLOBAL ERROR SAFETY
========================================================= */

window.addEventListener(
  "error",
  (event) => {
    console.error(
      "Dog Life error:",
      event.error ||
        event.message
    );
  }
);

window.addEventListener(
  "unhandledrejection",
  (event) => {
    console.error(
      "Dog Life promise error:",
      event.reason
    );
  }
);

document.addEventListener(
  "visibilitychange",
  () => {
    if (
      document.hidden &&
      game.running
    ) {
      game.paused = true;
    }
  }
);

document.addEventListener(
  "DOMContentLoaded",
  initializeGame
);
