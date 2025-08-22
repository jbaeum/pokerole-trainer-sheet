let trainer = null,
  pokemonCatalog = [],
  attackCatalog = [],
  evolutionData = [],
  natureData = [],
  rankData = [],
  itemsData = [],
  symbolData = [];
let selectedPokemonIndex = null;

const moveRanks = ["Starter", "Beginner", "Amateur", "Ace", "Pro", "Master"];
const statusEffectsInfo = {
  Poison: { maxLevel: 2, colors: ["#c39ee7", "#9a64c4", "#6e3ea1"] },
  Burned: { maxLevel: 3, colors: ["#f28b82", "#d23f3f", "#a22020"] },
  Frozen: { maxLevel: 1, colors: ["#a9defc", "#62b0e8"] },
  Paralyzed: { maxLevel: 1, colors: ["#f9ec89", "#d9ce3a"], textColor: "#444" },
  Asleep: { maxLevel: 1, colors: ["#aaa"] },
  Confused: { maxLevel: 1, colors: ["#f2b5e6", "#db7ac8"] },
  Disable: { maxLevel: 1, colors: ["#8888bb"] },
  Infatuate: { maxLevel: 1, colors: ["#ff8de0"] },
};

const statGroups = [
  {
    title: "Attributes",
    stats: ["Strength", "Dexterity", "Vitality", "Special", "Insight"],
  },
  {
    title: "Social Attributes",
    stats: ["Tough", "Cool", "Beauty", "Clever", "Cute"],
  },
  { title: "Skills: Fight", stats: ["Brawl", "Channel", "Evasion", "Clash"] },
  {
    title: "Skills: Contest",
    stats: ["Allure", "Etiquette", "Intimidate", "Perform"],
  },
  {
    title: "Skills: Survival",
    stats: ["Alert", "Athletics", "Nature", "Stealth"],
  },
  { title: "Skills: Extra (WIP)", stats: [] },
];

const trainerStatGroups = [
  {
    title: "Attributes",
    stats: ["Strength", "Dexterity", "Vitality", "Special", "Insight"],
  },
  {
    title: "Social Attributes",
    stats: ["Tough", "Cool", "Beauty", "Clever", "Cute"],
  },
  { title: "Skills: Fight", stats: ["Brawl", "Channel", "Evasion", "Clash"] },
  {
    title: "Skills: Contest",
    stats: ["Allure", "Etiquette", "Intimidate", "Perform"],
  },
  {
    title: "Skills: Survival",
    stats: ["Alert", "Athletics", "Nature", "Stealth"],
  },
  {
    title: "Skills: Knowledge",
    stats: ["Crafts", "Lore", "Medicine", "Science"],
  },
];

async function loadPokemonCatalog() {
  pokemonCatalog = await (await fetch("pokemon-data.json")).json();
}
async function loadAttackCatalog() {
  attackCatalog = await (await fetch("attack-data.json")).json();
}
async function loadEvolutionData() {
  evolutionData = await (await fetch("evolution-data.json")).json();
}
async function loadNatureData() {
  natureData = await (await fetch("nature-data.json")).json();
}
async function loadRankData() {
  rankData = await (await fetch("rank-data.json")).json();
}
async function loadItemsData() {
  itemsData = await (await fetch("items-data.json")).json();
}

async function loadSymbolData(){
  symbolData = await (await fetch("symbol-data.json")).json();
}

function calculateStatFormula(formula, pkm) {
  if (!formula || formula === "-" || !formula.trim()) return null;
  return formula.split("+").reduce((sum, part) => {
    const key = part.trim().toLowerCase();
    // Prüfe, ob es einen Modifier gibt
    if (key in pkm) {
      // Wenn es einen passenden Mod gibt, addiere ihn
      const modKey = key + "Mod";
      const base = parseInt(pkm[key]) || 0;
      const mod = modKey in pkm ? parseInt(pkm[modKey]) || 0 : 0;
      return sum + base + mod;
    }
    if (!isNaN(parseInt(key))) return sum + parseInt(key);
    return sum;
  }, 0);
}

function renderMoveOptions(moves, p, selectedMove = null) {
  moves = [...moves].sort((a, b) => a.localeCompare(b));
  const grouped = {};
  moves.forEach((name) => {
    const md = attackCatalog.find((m) => m["Move name"] === name);
    const type = md?.Type || "Normal";
    const stab =
      type.toLowerCase() === (p.type1 || "").toLowerCase() ||
      type.toLowerCase() === (p.type2 || "").toLowerCase();
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push({ name, stab });
  });
  return Object.entries(grouped)
    .map(
      ([type, arr]) =>
        `<optgroup label="${type}">${arr
          .map((m) => {
            const selectedAttr = selectedMove === m.name ? "selected" : "";
            const stabText = m.stab ? " (STAB)" : "";
            return `<option value="${m.name}" ${selectedAttr} class="type-${type}">${m.name}${stabText}</option>`;
          })
          .join("")}</optgroup>`
    )
    .join("");
}

function saveData() {
  localStorage.setItem("trainer", JSON.stringify(trainer));
}
function loadData() {
  const data = localStorage.getItem("trainer");
  if (data) {
    trainer = JSON.parse(data);
    if (!trainer.pokemon) trainer.pokemon = [];
    if (!trainer.pokemon.length)
      trainer.pokemon.push(createPokemonFromCatalog(pokemonCatalog[0]));
  } else {
    trainer = {
  "name": "Max Mustertrainer",
  "bio": "",
  "image": "",
  "pokemon": [],
  "rank": "",
  "ageGroup": "",
  "nature": "",
  "hp": 0,
  "will": 0,
  "strength": 0,
  "vitality": 0,
  "dexterity": 0,
  "insight": 0,
  "achievements": {
    "Beginner": [
      false,
      false,
      false,
      false
    ],
    "Amateur": [
      false,
      false,
      false,
      false
    ],
    "Starter": [
      false,
      false,
      false,
      true
    ],
    "Amateur": [
      false,
      false,
      false,
      false
    ]
  },
  "pokecash": 0
};
  }
  saveData();
}

function getTypeBadges(types) {
  return types
    .map((t) => `<span class="type-badge type-${t}">${t}</span>`)
    .join(" ");
}
function getListArray(data, prefix, count) {
  return Array.from(
    { length: count },
    (_, n) => data[`${prefix}${n + 1}`]
  ).filter(Boolean);
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function getMovesFromPokemon(pk, prefix) {
  return Object.keys(pk)
    .filter((k) => k.startsWith(prefix))
    .map((k) => pk[k])
    .filter(Boolean);
}
function getAllowedMovesByRank(pkm, rank) {
  let idx = moveRanks.indexOf(rank),
    all = [];
  for (let i = 0; i <= idx; i++)
    all = all.concat(pkm.moves[moveRanks[i]] || []);
  return [...new Set(all)];
}
function getSpriteUrlFromName(name) {
  if (name === "-") return "";
  return `https://img.pokemondb.net/sprites/home/normal/${name
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[()]/g, "")}.png`;
}

function getTitleForIcon(name) {
  const entry = symbolData.find(obj => obj.hasOwnProperty(name));
  return entry ? entry[name] : name; // Fallback auf name, falls kein Titel gefunden
}

function createPokemonFromCatalog(pk) {
  const minStrength = +pk["StrengthMin"] || 0;
  const minDexterity = +pk["DexterityMin"] || 0;
  const minVitality = +pk["VitalityMin"] || 0;
  const minSpecial = +pk["SpecialMin"] || 0;
  const minInsight = +pk["InsightMin"] || 0;
  return {
    name: pk["Pokemon Name"],
    gender: "",
    pokeball: "",
    type1: pk["Type 1"] || "",
    type2: pk["Type 2"] || "",
    sprite: getSpriteUrlFromName(pk["Pokemon Name"]),
    currentRank: "Starter",
    selectedMoves: [null, null, null, null],
    victoriesCount: 0,
    hpMax: +pk["Base HP"] || 2,
    hp: +pk["Base HP"] || 0,
    will: 0,
    nature: natureData[0]?.Natures || "Hardy",
    attackMax: +pk["StrengthMax"] || 5,
    attack: +pk["StrengthMax"] || 5,
    defense: pk.vitality || 0,
    defenseMod: 0,
    spDefense: pk.insight || 0,
    spDefenseMod: 0,
    strength: minStrength,
    dexterity: minDexterity,
    vitality: minVitality,
    special: minSpecial,
    insight: minInsight,
    strengthMod: 0,
    dexterityMod: 0,
    vitalityMod: 0,
    specialMod: 0,
    insightMod: 0,
    tough: 0,
    cool: 0,
    beauty: 0,
    clever: 0,
    cute: 0,
    brawl: 0,
    channel: 0,
    evasion: 0,
    clash: 0,
    allure: 0,
    etiquette: 0,
    intimidate: 0,
    perform: 0,
    alert: 0,
    athletics: 0,
    nature: 0,
    stealth: 0,
    statusEffect: "",
    statusEffectLevel: 0,
    clashAttack: null,
    moves: {
      Starter: getMovesFromPokemon(pk, "Starter Moves"),
      Beginner: getMovesFromPokemon(pk, "Beginner Moves"),
      Amateur: getMovesFromPokemon(pk, "Amateur Moves"),
      Ace: getMovesFromPokemon(pk, "Ace Moves"),
      Pro: getMovesFromPokemon(pk, "Pro Moves"),
      Master: getMovesFromPokemon(pk, "Master Moves"),
    },
  };
}

function renderSidebar() {
  const sb = document.getElementById("sidebar");
  sb.innerHTML = "";

  // Trainer-Block
  const tDiv = document.createElement("div");
  tDiv.className = "trainer-summary";

  // Bild (falls vorhanden)
  const imgHtml = trainer.image
    ? `<img src="${trainer.image}" alt="Trainer" class="trainer-avatar">`
    : "👤";

  // HTML-Inhalt mit Name, Rang, HP, Pokecash
  tDiv.innerHTML = `
    <div class="avatar">${imgHtml}</div>
    <div class="trainer-info">
      <h3>${trainer.name}</h3>
      <div class="trainer-rank"><strong>Rank:</strong> ${trainer.rank}</div>
      <div class="trainer-hp"><strong>HP:</strong> ${trainer.hp}/${trainer.hpMax}</div>
      <div class="trainer-will"><strong>Will:</strong> ${trainer.will}/${trainer.willMax}</div>
      <div class="trainer-cash"><strong>Pokecash:</strong> ${trainer.pokecash} ₽</div>
    </div>
  `;

  tDiv.onclick = () => {
    selectedPokemonIndex = null;
    renderDetailTrainer();
  };

  sb.appendChild(tDiv);
  const addBtn = document.createElement("button");
  addBtn.textContent = "+ Add Pokémon";
  addBtn.style.width = "100%";
  addBtn.onclick = () => {
    if (trainer.pokemon.length >= 6) return alert("Max 6 Pokémon");
    trainer.pokemon.push(createPokemonFromCatalog(pokemonCatalog[0]));
    saveData();
    renderSidebar();
  };
  sb.appendChild(addBtn);
  trainer.pokemon.forEach((p, i) => {
    const pDiv = document.createElement("div");
    pDiv.className = "pokemon-summary";
    const pkData =
      pokemonCatalog.find((x) => x["Pokemon Name"] === p.name) || {};
    const baseHp = +pkData["Base HP"] || 0;
    const maxHp = baseHp + ((p.vitality || 0) + (p.vitalityMod || 0));
    const baseWill = (p.insight || 0) + (p.insightMod || 0) + 2;
    pDiv.innerHTML = `<div class="avatar">${
      p.sprite ? `<img src="${p.sprite}">` : "❓"
    }</div>
      <div class="pokemon-info"><div class="pokemon-name-row"><strong>${
        p.nickname ? p.nickname + " (" + p.name + ")" : p.name
      }</strong> ${getTypeBadges([p.type1, p.type2].filter(Boolean))}</div>
      <div class="detail-flex">
        <div class="pk-hp">HP: ${p.hp}/${maxHp}</div>
        <div class="pk-will">Will: ${p.will}/${baseWill}</div>
      </div>
      <div class="pokemon-atks">${
        (p.selectedMoves || []).filter(Boolean).length
          ? p.selectedMoves
              .filter(Boolean)
              .map((m) => `<div class="poke-atk">${m}</div>`)
              .join("")
          : "<em>No Attacks</em>"
      }</div>
      <div class="pokemon-status">${renderStatusBadge(p)}</div> ${
      p.heldItem
        ? `<div class="pokemon-item"><span style="color:#a7842f; font-weight:bold;">🎒 Item:</span> ${p.heldItem}</div>`
        : ""
    }
</div>`;
    pDiv.onclick = () => {
      selectedPokemonIndex = i;
      renderDetailPokemon(i);
    };
    sb.appendChild(pDiv);
  });
}

function renderStatusBadge(p) {
  if (p.statusEffect) {
    const c =
      statusEffectsInfo[p.statusEffect]?.colors[
        (p.statusEffectLevel || 1) - 1
      ] || "#ccc";
    const tc = statusEffectsInfo[p.statusEffect]?.textColor || "#fff";
    return `<strong>Status:</strong> <span class="type-badge" style="background:${c};color:${tc};">${
      p.statusEffect
    } (Stufe ${p.statusEffectLevel || 1})</span>`;
  }
  return `<strong>Status:</strong> -`;
}

function renderDetailTrainer() {
  
  const ageGroups = ["Kid", "Teen", "Adult", "Senior"];
  const natureOptions = natureData
    .map(
      (n) =>
        `<option value="${n.Natures}"${
          trainer.nature === n.Natures ? " selected" : ""
        }>${n.Natures}</option>`
    )
    .join("");
  const natureConfidence =
    natureData.find((n) => n.Natures === trainer.nature)?.Confidence || "-";
  const allItemsSorted = itemsData
    .map((i) => i.Items)
    .flat()
    .sort();

  const trainerStatGroups = [
    {
      title: "Attributes",
      stats: ["Strength", "Dexterity", "Vitality",  "Insight"],
    },
    {
      title: "Social Attributes",
      stats: ["Tough", "Cool", "Beauty", "Clever", "Cute"],
    },
    { title: "Skills: Fight", stats: ["Brawl", "Throw", "Evasion", "Weapons"] },
    {
      title: "Skills: Contest",
      stats: ["Empathy", "Etiquette", "Intimidate", "Perform"],
    },
    {
      title: "Skills: Survival",
      stats: ["Alert", "Athletics", "Nature", "Stealth"],
    },
    {
      title: "Skills: Knowledge",
      stats: ["Crafts", "Lore", "Medicine", "Science"],
    },
  ];

  // HP & Will automatisch berechnen
  trainer.hpMax = (trainer.vitality || 0) + 4;
  trainer.willMax = (trainer.insight || 0) + 2;

  // Defaults für ältere Saves
  trainer.rank = trainer.rank || "Beginner";
  trainer.ageGroup = trainer.ageGroup || "Adult";
  trainer.nature = trainer.nature || natureData[0]?.Natures || "";
  trainer.hp = trainer.hp ?? 4;
  trainer.will = trainer.will ?? 4;
  if (!trainer.achievements) trainer.achievements = {};
  if (!trainer.achievements[trainer.rank])
    trainer.achievements[trainer.rank] = [false, false, false, false];
 if (!Array.isArray(trainer.backpack)) {
  trainer.backpack = [];
}

  trainer.pokecash = trainer.pokecash ?? 0;

  trainer.backpackUsage = trainer.backpackUsage || {};

  // Achievement-Data für aktuellen Rang
  const rankInfo = rankData.find((r) => r["Rank"] === trainer.rank) || {};
  const currentAchievements = trainer.achievements[trainer.rank] || [
    false,
    false,
    false,
    false,
  ];
  const achievementList = [1, 2, 3, 4]
    .map((idx) => {
      const achvText = rankInfo[`Achievement ${idx}`] || "";
      const checked = currentAchievements[idx - 1] ? "checked" : "";
      return `<div class="achv-row">
      <input type="checkbox" id="achv${idx}" data-idx="${idx - 1}" ${checked}>
      <label for="achv${idx}">${achvText}</label>
    </div>`;
    })
    .join("");

  // Stats HTML
  // Gruppen für Spalte 1 und 2 trennen
const col1Groups = trainerStatGroups.filter(g =>
  g.title === "Attributes" || g.title === "Social Attributes"
);
const col2Groups = trainerStatGroups.filter(g =>
  g.title !== "Attributes" && g.title !== "Social Attributes"
);

// Generiere das Gruppen-HTML jeweils wie gehabt:
function renderGroups(groups) {
  return groups.map(group => {
    const rows = group.stats.map(st => {
      const key = st.toLowerCase();
      const current = trainer[key] ?? 0;
      const maxVal = 5;
      let btns = "";
      for (let v = 1; v <= maxVal; v++) {
        let cls = "stat-btn";
        if (v <= current) cls += " active";
        if (v <= 0) cls += " min";
        btns += `<div class="${cls}" data-stat="${key}" data-val="${v}"></div>`;
      }
      return `<div class="stat-row">
        <span class="stat-label">${st}</span>
        <div class="stat-btn-group">${btns}</div>
      </div>`;
    }).join("");
    return `<div class="stat-group">
      <h4>${group.title}</h4>
      <div class="stats-boxes">${rows || "<em>No stats</em>"}</div>
    </div>`;
  }).join("");
}

// Endgültiges statMatrix-HTML:
const statMatrix = `
  <div class="fieldset-col">
    ${renderGroups(col1Groups)}
  </div>
  <div class="fieldset-col">
    ${renderGroups(col2Groups)}
  </div>
`;


  // Backpack Items
  const potions = [
    "Potion",
    "Super Potion",
    "Hyper Potion",
    "Max Potion",
    "Full Restore",
  ];

  const potionMaxUses = {
    "Potion": 2,
    "Super Potion": 4,
    "Hyper Potion": 14,
    "Max Potion": 1,
    "Full Restore": 1,
  };

  const backpackItems = trainer.backpack || [];


  // Potions vom Rest trennen
const potionItems = backpackItems.filter(s => potions.includes(s.name));
const otherItems = backpackItems.filter(s => !potions.includes(s.name));


function addPotion(name, amount) {
  if (!trainer.backpack) trainer.backpack = [];

  const maxUses = potionMaxUses[name] ?? Infinity;

  // Finde ersten vorhandenen Stack mit Platz für neue Anwendungen
  let stack = trainer.backpack.find(s => s.name === name && s.used < maxUses);

  if (stack) {
    stack.quantity += amount;
  } else {
    trainer.backpack.push({ name: name, quantity: amount, used: 0 });
  }

  saveData();
  renderDetailTrainer();
}


function usePotionByIndex(idx, count = 1) {
  if (!trainer.backpack || !trainer.backpack[idx]) {
    alert("Potion-Stack nicht gefunden.");
    return;
  }
  const stack = trainer.backpack[idx];
  const maxUses = potionMaxUses[stack.name] ?? Infinity;

  let totalUses = stack.used + count;
  let usesToApply = count;

  // Wenn insgesamt Nutzungen das Maximum überschreiten, begrenze sie
  if (totalUses > maxUses) {
    usesToApply = maxUses - stack.used;
    alert(`Du kannst nur noch ${usesToApply} mal diese Potion verwenden.`);
    return;
  }

  stack.used += usesToApply;

  // Für jede vollständige Nutzung einer Potion Menge reduzieren
  while (stack.used >= maxUses && usesToApply > 0) {
    stack.used -= maxUses;
    stack.quantity--;
    usesToApply--;
  }

  // Stack entfernen wenn leer
  if (stack.quantity <= 0) {
    trainer.backpack.splice(idx, 1);

    // Falls neu derselbe Potion-Typ Stacks existieren, reset used des nächsten
    const nextStack = trainer.backpack.find(s => s.name === stack.name);
    if (nextStack) {
      nextStack.used = 0;
    }
  }

  saveData();
  renderDetailTrainer();
}








function removePotionStack(index) {
  if (!trainer.backpack) return;
  trainer.backpack.splice(index, 1);
  saveData();
  renderDetailTrainer();
}



const potionStacks = (trainer.backpack || []).filter(s => potions.includes(s.name));

const potionListHTML = potionStacks.map((stack, idx) => {
  const maxUses = potionMaxUses[stack.name] ?? "∞";
  return `
    <div class="potion-row">
      <label>${stack.name}</label>
      <span> Menge: ${stack.quantity} </span>
      <span> Verwendet: ${stack.used} / ${maxUses} </span>
      <input type="number" min="1" step="1" value="1" data-index="${idx}" class="use-count-input" style="width: 50px; margin-left: 10px;">
      <button data-index="${idx}" class="use-potion-btn">Use</button>
      <button data-index="${idx}" class="remove-potion-btn">Remove</button>
    </div>
  `;
}).join("");

const otherListHTML = otherItems
  .map((item) => `
    <div class="item-row">
      <label>${item.name}</label>
      <input type="number" min="0" step="1" data-item="${item.name}" value="${item.quantity}" class="item-qty-input">
      <button type="button" data-item="${item.name}" class="remove-item-btn">Remove</button>
    </div>
  `)
  .join("");


  // Dropdown zum neuen Item hinzufügen (nur Items die noch nicht drin sind)
  const addableItems = allItemsSorted.filter(
    (name) => !trainer.backpack || !(name in trainer.backpack)
  );

  const addItemOptions = addableItems
    .map((item) => `<option value="${item}">${item}</option>`)
    .join("");

  // Backpack HTML-Konstrukt (Pokecash als Input)
  const backpackHtml = `
  <fieldset class="form-section">
    <legend>Backpack</legend>
    <div class="form-row">
      <label for="pokecash-input"><b>Pokecash:</b></label>
      <input type="number" id="pokecash-input" min="0" value="${
        trainer.pokecash || 0
      }">
    </div>
    <fieldset class="form-subsection">
      <legend>Items</legend>
      ${
        potionListHTML ? `<div class="bag-potions">${potionListHTML}</div>` : ""
      }
      ${
        otherListHTML
          ? `<div class="bag-items">${otherListHTML}</div>`
          : "<em>No Items in backpack</em>"
      }
      <div class="form-row add-item-row">
        <select id="add-item-select">${addItemOptions}</select>
        <input type="number" id="add-item-qty" min="1" step="1" value="1" style="width:50px;">
        <button id="add-item-btn" type="button">Add Item</button>
      </div>
    </fieldset>
  </fieldset>
`;

  // Haupt-HTML zusammenbauen
  document.getElementById("detail-view").innerHTML = `
    <div class="detail-content trainer-detail">
      <h2>Trainer Profile</h2>

      <fieldset class="form-section trainer-detail">
        <legend>Genral</legend>
        <div class="form-row">
        <div class="fieldset-col">
        <div class="form-row"><label for="t-name"><b>Name:</b></label>
          <input type="text" id="t-name" value="${trainer.name ?? ""}">
        </div>
        <div class="form-row"><label for="t-rank"><b>Rank:</b></label>
          <select id="t-rank">${moveRanks
            .map(
              (r) =>
                `<option${trainer.rank === r ? " selected" : ""}>${r}</option>`
            )
            .join("")}</select>
        </div>
        <div class="form-row"><label for="t-age"><b>Age:</b></label>
          <select id="t-age">${ageGroups
            .map(
              (a) =>
                `<option${
                  trainer.ageGroup === a ? " selected" : ""
                }>${a}</option>`
            )
            .join("")}</select>
        </div></div>
        
    <div class="fieldset-col">
   
        
        <div class="form-row">
          <label for="t-nature"><b>Nature:</b></label>
          <select id="t-nature">${natureOptions}</select>
          <span class="nature-confidence">Confidence: <b>${natureConfidence}</b></span>
        </div>
        <div class="form-row"><label for="t-hp-current"><strong>HP:</strong></label>
  <input type="number" id="t-hp-current" min="0" max="${trainer.hpMax}" value="${
    trainer.hp
  }" style="width:3.5em;">
  / ${trainer.hpMax}
</div>
        <div class="form-row"><label for="t-will-current"><strong>Will:</strong></label>
  <input type="number" id="t-will-current" min="0" max="${trainer.willMax}" value="${
    trainer.will
  }" style="width:3.5em;">
  / ${trainer.willMax}
</div></div>
      </fieldset>

      <fieldset class="form-section">
        <legend>Attributes & Skills</legend>
        <div class="stat-matrix-flex">
        ${statMatrix}
        </div>
      </fieldset>

      <fieldset class="form-section">
        <legend>Achievements (${trainer.rank})</legend>
        <div id="achievements-list">${achievementList}</div>
      </fieldset>

      ${backpackHtml}

      <fieldset class="form-section">
        <legend>Misc.</legend>
        <div class="form-row">
          ${
            trainer.image
              ? `<img src="${trainer.image}" width="80" style="vertical-align:middle;border-radius:6px;margin-right:8px;">`
              : ""
          }
          <input type="file" id="trainer-image-upload" accept="image/*"/>
        </div>
        <div class="form-row"><label for="t-bio"><b>Bio:</b></label>
          <textarea id="t-bio" rows="3" style="width: 95%;">${
            trainer.bio ?? ""
          }</textarea>
        </div>
      </fieldset>
    </div>
  `;

  // Ereignishandler einrichten
  const d = document.querySelector(".detail-content");
  d.querySelector("#t-name").oninput = (e) => {
    trainer.name = e.target.value;
    saveData();
    renderSidebar();
    document.title = trainer.name ? `Pokémon Trainer: ${trainer.name}` : "Pokémon Trainer";
  };
  d.querySelector("#t-rank").onchange = (e) => {
    trainer.rank = e.target.value;
    if (!trainer.achievements) trainer.achievements = {};
    if (!trainer.achievements[trainer.rank])
      trainer.achievements[trainer.rank] = [false, false, false, false];
    saveData();
    renderDetailTrainer();
  };
  d.querySelector("#t-age").onchange = (e) => {
    trainer.ageGroup = e.target.value;
    saveData();
  };
  d.querySelector("#t-nature").onchange = (e) => {
    trainer.nature = e.target.value;
    saveData();
    renderDetailTrainer();
  };

  d.querySelector("#t-bio").oninput = (e) => {
    trainer.bio = e.target.value;
    saveData();
  };

  d.querySelectorAll(".stat-btn").forEach(
    (btn) =>
      (btn.onclick = () => {
        const stat = btn.dataset.stat,
          val = parseInt(btn.dataset.val);
        trainer[stat] = trainer[stat] === val && val > 0 ? val - 1 : val;
        trainer.hp = (trainer.vitality || 0) + 2;
        trainer.will = (trainer.insight || 0) + 2;
        saveData();
        renderDetailTrainer();
        renderSidebar();
      })
  );

  d.querySelectorAll("#achievements-list input[type=checkbox]").forEach(
    (box) => {
      box.onchange = () => {
        const idx = +box.dataset.idx;
        if (!trainer.achievements) trainer.achievements = {};
        if (!trainer.achievements[trainer.rank])
          trainer.achievements[trainer.rank] = [false, false, false, false];
        trainer.achievements[trainer.rank][idx] = box.checked;

        if (trainer.achievements[trainer.rank].every((x) => x)) {
          const curIdx = moveRanks.indexOf(trainer.rank);
          if (curIdx < moveRanks.length - 1) {
            trainer.rank = moveRanks[curIdx + 1];
            if (!trainer.achievements[trainer.rank])
              trainer.achievements[trainer.rank] = [false, false, false, false];
            alert(`Du bist in den Rang ${trainer.rank} aufgestiegen!`);
          }
        }
        saveData();
        renderDetailTrainer();
      };
    }
  );

  // Pokecash editable
  d.querySelector("#pokecash-input").oninput = (e) => {
    trainer.pokecash = +e.target.value || 0;
    saveData();
    renderSidebar();
  };

  // Mengen der existierenden Items ändern
 d.querySelectorAll(".item-qty-input").forEach((input) => {
  input.onchange = () => {
    const itemName = input.dataset.item;
    let val = parseInt(input.value);
    if (isNaN(val) || val < 0) val = 0;
    if (!trainer.backpack) trainer.backpack = [];

    // Finde Stack-Index und aktualisiere quantity
    const stackIndex = trainer.backpack.findIndex(s => s.name === itemName);
    if (stackIndex >= 0) {
      trainer.backpack[stackIndex].quantity = val;
      // Entferne Stack bei Menge 0
      if (val === 0) {
        trainer.backpack.splice(stackIndex, 1);
      }
    }
    saveData();
    renderDetailTrainer();
  };
});


  // Items entfernen
  d.querySelectorAll(".remove-item-btn").forEach((button) => {
  button.onclick = () => {
    const itemName = button.dataset.item;
    if (!trainer.backpack) trainer.backpack = [];
    const stackIndex = trainer.backpack.findIndex(s => s.name === itemName);
    if (stackIndex >= 0) {
      trainer.backpack.splice(stackIndex, 1);
    }
    saveData();
    renderDetailTrainer();
  };
});


  // Item hinzufügen per Button
 d.querySelector("#add-item-btn").onclick = () => {
  const itemSelect = document.querySelector("#add-item-select");
  const qtyInput = document.querySelector("#add-item-qty");
  const itemName = itemSelect.value;
  let qty = parseInt(qtyInput.value);
  if (!itemName) return alert("Please select an Item.");
  if (isNaN(qty) || qty < 1) qty = 1;
  if (!trainer.backpack) trainer.backpack = [];

  addPotion(itemName, qty);

  saveData();
  renderDetailTrainer();
};


  d.querySelector("#trainer-image-upload").onchange = (e) => {
    const f = e.target.files;
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      trainer.image = ev.target.result;
      saveData();
      renderDetailTrainer();
      renderSidebar();
    };
    r.readAsDataURL(f[0]);
  };

  d.querySelectorAll(".use-potion-btn").forEach(button => {
  button.onclick = () => {
    const idx = parseInt(button.dataset.index);
    const input = d.querySelector(`.use-count-input[data-index="${idx}"]`);
    let count = 1;
    if (input) {
      count = parseInt(input.value);
      if (isNaN(count) || count < 1) count = 1;
    }
    usePotionByIndex(idx, count);
  };
});

d.querySelectorAll(".remove-potion-btn").forEach(button => {
  button.onclick = () => {
    const idx = parseInt(button.dataset.index);
    removePotionStack(idx);
  };
});


d.querySelector("#t-hp-current").oninput = e => {
  let v = +e.target.value;
    trainer.hp = v;
  saveData();
  renderDetailTrainer();
  renderSidebar();
};


d.querySelector("#t-will-current").oninput = e => {
  let v = +e.target.value;
    trainer.will = v;
  saveData();
  renderDetailTrainer();
  renderSidebar();
};

}

function renderDetailPokemon(i) {
  const p = trainer.pokemon[i],
    pkData = pokemonCatalog.find((x) => x["Pokemon Name"] === p.name) || {};
  const gender = "";
  p.type1 = pkData["Type 1"] || "";
  p.type2 = pkData["Type 2"] || "";

  const baseHp = +pkData["Base HP"] || 0;
  const hpMax = baseHp + ((p.vitality || 0) + (p.vitalityMod || 0));
  const maxWill = (p.insight || 0) + 2;

  // Pain-Penalty-Logik
  const isFirstPain = p.hp <= Math.floor(hpMax / 2);
  const isSecondPain = p.hp <= 1;
  const painPenaltyHtml = `
  <span class="pain-penalties" style="margin-left:12px;">
    <span><strong>Pain Penalties:</strong></span>
    <div class="tooltip">
    <span class="pain-box${
      isFirstPain ? " active" : ""
    }"></span><span class="tooltiptext">1 success removed</span></div>
    <div class="tooltip"><span class="pain-box${
      isSecondPain ? " active" : ""
    }"></span><span class="tooltiptext">2 success removed</span></div>
  </span>
`;

  p.clash = typeof p.clash === "number" ? p.clash : 0;

  const initiative =
    (p.dexterity || 0) + (p.dexterityMod || 0) + (p.alert || 0);
  const evasion = (p.dexterity || 0) + (p.evasion || 0);

  p.nickname = p.nickname || "";

  const pokeball = p.pokeball || "";

  const allItemsSorted = itemsData.map((i) => i.Items).sort();
  const currentItem = p.heldItem || "";

  const victoriesCount = p.victoriesCount || 0;

  p.actionsThisTurn = p.actionsThisTurn ?? 0;
  // Aktionen Counter Boxen
  const actionBoxes = [];
  for (let j = 1; j <= 5; j++) {
    let cls = "action-box";
    if (p.actionsThisTurn >= j) cls += " active";
    actionBoxes.push(`<div class="${cls}" data-action="${j}"></div>`);
  }
  const actionCounterHtml = `
  <fieldset class="form-section">
  <legend>Multiple Action Counter</legend>
  <div class="actions-counter">
    <div class="form-row"><label for="pk-select"><strong>Counter:</strong></label>
    <div class="actions-box-group">${actionBoxes.join("")}</div>
  </div></div>
  </fieldset>
`;

  const itemOptions = [
    `<option value="" ${!currentItem ? "selected" : ""}>No Item</option>`,
    ...allItemsSorted.map(
      (item) =>
        `<option value="${item}" ${
          currentItem === item ? "selected" : ""
        }>${item}</option>`
    ),
  ].join("");

  // Evolution-Info: Abgleich über Evo Time
  const evoTime = (pkData["Evo Time"] || "").trim();
  const evoInfo =
    evolutionData.find(
      (e) =>
        (e["Evo Time"] || "").trim().toLowerCase() === evoTime.toLowerCase()
    ) || {};
  const victories =
    evoInfo["No of Victories"] && evoInfo["No of Victories"] !== "-"
      ? parseInt(evoInfo["No of Victories"])
      : null;

  let evoText = "";
  if (evoTime) {
    const lower = evoTime.toLowerCase();
    if (["fast", "medium", "slow"].includes(lower)) {
      evoText =
        victories !== null
          ? `Evolves after ${victories} victories (${evoTime}).`
          : `Evolves (${evoTime}).`;
    } else {
      evoText = `Develops under condition: ${evoTime}.`;
    }
  } else {
    evoText = "<em>No evolution data available</em>";
  }

  // Status Optionen dynamisch basierend auf statusEffectsInfo
  const statusOptions = Object.entries(statusEffectsInfo)
    .map(([statusName]) => {
      return `<option value="${statusName}" ${
        p.statusEffect === statusName ? "selected" : ""
      }>${statusName}</option>`;
    })
    .join("");

  const maxStatusLevel =
    p.statusEffect && statusEffectsInfo[p.statusEffect]
      ? statusEffectsInfo[p.statusEffect].maxLevel
      : 1; // Default 1 wenn kein Status oder kein Eintrag
  const statusLevelValue = Math.min(p.statusEffectLevel || 1, maxStatusLevel);

  // --- Pokemon-Select Optionen ---
  const pokemonOptions = pokemonCatalog
    .map(
      (pk) =>
        `<option value="${pk["Pokemon Name"]}"${
          pk["Pokemon Name"] === p.name ? " selected" : ""
        }>
       ${pk["Pokemon Name"]}
     </option>`
    )
    .join("");

  const genderOptions = ["male", "female"].map(
    (g) =>
      `<option value="${g}"${p.gender === g ? " selected" : ""}>${
        g.charAt(0).toUpperCase() + g.slice(1)
      }</option>`
  );

  const pokeballOptions = [
    "Poke Ball",
    "Great Ball",
    "Ultra Ball",
    "Master Ball",
    "Safari Ball",
    "Fast Ball",
    "Level Ball",
    "Lure Ball",
    "Heavy Ball",
    "Love Ball",
    "Friend Ball",
    "Moon Ball",
    "Sport Ball",
    "Net Ball",
    "Dive Ball",
    "Nest Ball",
    "Repeat Ball",
    "Timer Ball",
    "Luxury Ball",
    "Premier Ball",
    "Dusk Ball",
    "Heal Ball",
    "Quick Ball",
    "Cherish Ball",
    "Park Ball",
    "Dream Ball",
    "Strange Ball",
    "Artisan Poke Ball",
    "Artisan Great Ball",
    "Artisan Ultra Ball",
    "Feather Ball",
    "Wing Ball",
    "Jet Ball",
    "Heavy Ball",
    "Leaden Ball",
    "Gigaton Ball",
    "Origin Ball",
  ].map(
    (ball) =>
      `<option value="${ball}"${p.pokeball === ball ? " selected" : ""}>${
        ball.charAt(0).toUpperCase() + ball.slice(1)
      }</option>`
  );
  // --- Stats generieren ---
  const leftColGroups = ["Attributes", "Social Attributes"];
const [groupsLeft, groupsRight] = statGroups.reduce(
  ([left, right], group) => {
    if (leftColGroups.includes(group.title)) {
      left.push(group);
    } else {
      right.push(group);
    }
    return [left, right];
  },
  [[], []]
);

function renderGroups(groups) {
  return groups
    .map(group => {
      const rows = group.stats
        .map(st => {
          const key = st.toLowerCase();
          const pkMax = [
            "strength",
            "dexterity",
            "vitality",
            "special",
            "insight"
          ].includes(key)
            ? +pkData[capitalize(st) + "Max"] || 5
            : 5;
          const cur = p[key] ?? 0;
          let btns = "";
          for (let v = 1; v <= pkMax; v++) {
            let cls = "stat-btn";
            if (v <= cur) cls += " active";
            if (v <= 0) cls += " min";
            btns += `<div class="${cls}" data-stat="${key}" data-val="${v}"></div>`;
          }
          return `<div class="stat-row">
            <span class="stat-label">${st}</span>
            <div class="stat-btn-group">${btns}</div>
          </div>`;
        })
        .join("");
      return `<div class="stat-group">
        <h4>${group.title}</h4>
        <div class="stats-boxes">${rows || "<em>No stats</em>"}</div>
      </div>`;
    })
    .join("");
}
const statMatrix = `
  <div class="detail-flex">
    <div class="fieldset-col">
      ${renderGroups(groupsLeft)}
    </div>
    <div class="fieldset-col">
      ${renderGroups(groupsRight)}
    </div>
  </div>
`;


  const allowedMoves = getAllowedMovesByRank(p, p.currentRank);

  const maxAttacks = (p.insight || 0) + 2;
  const abilities = [pkData["Ability 1"], pkData["Ability 2"]].filter(Boolean);
  // Nature-Auswahl zusammenbauen
  const natureOptions = natureData
    .map(
      (n) =>
        `<option value="${n.Natures}"${
          p.nature === n.Natures ? " selected" : ""
        }>${n.Natures}</option>`
    )
    .join("");

  const natureConfidence =
    natureData.find((n) => n.Natures === p.nature)?.Confidence || "-";

  const weak = getTypeBadges(getListArray(pkData, "Weak", 7)),
    resist = getTypeBadges(getListArray(pkData, "Resist", 11)),
    immune = getTypeBadges(getListArray(pkData, "Immune", 3));

  const attackCards = Array.from({ length: maxAttacks }, (_, slot) => {
    const sel = p.selectedMoves[slot];
    const md = attackCatalog.find((m) => m["Move name"] === sel) || {};
    const mt = md.Type || "Normal";
    const isStab = sel && (mt === p.type1 || mt === p.type2);
    const acc = md.Accuracy ? calculateStatFormula(md.Accuracy, p) : null;
    const dmg = md.Damage ? calculateStatFormula(md.Damage, p) : null;
    const iconNames = [];
    for (let k = 1; k <= 6; k++) {
      const icon = md[`Icons ${k}`];
      if (icon && icon.trim() !== "") iconNames.push(icon.trim());
    }
 
    const iconHtml = iconNames
      .map(
        name =>{
          const title = getTitleForIcon(name);
          return `<div class="tooltip"><img class="icon-img" src="icons/${name}.png" alt="${name}" title="${title}" style="height:1.8em;vertical-align:middle;margin-right:4px;"><span class="tooltiptext">${title}</span></div>`;
  })
      .join("");
    const select = `<select class="attack-select" data-slot="${slot}">
      <option value="" ${!sel ? "selected" : ""}>No selection</option>
      ${renderMoveOptions(allowedMoves, p, sel)}
    </select>`;
    if (!sel) return `<div class="attack-card bg-Normal">${select}</div>`;
    return `<div class="attack-card bg-${mt}">${select}<div class="attack-card-inner">
      <div class="attack-header"><div class="attack-name">${sel}${
      isStab ? `<span class="stab-mark">(STAB)</span>` : ""
    }</div>
      <span class="attack-type attack-type-${mt}">${mt}</span></div>
      <div class="attack-info-row"><b>Accuracy:</b> ${md.Accuracy || "-"}${
      acc !== null ? " [" + acc + "]" : ""
    }</div>
      <div class="attack-info-row"><b>Damage:</b> ${md.Damage || "-"}${
      dmg !== null ? " [" + dmg + "]" : ""
    }</div>
      <div class="attack-info-row"><b>Effect:</b> ${md.Effect || "-"}</div>
      <div class="attack-info-row"><b>Symbols:</b> ${iconHtml}</div>
    </div></div>`;
  }).join("");

  // Nach <h3>Attacken</h3> und ${attackCards}
  const clashEligibleAttacks = (p.selectedMoves || [])
    .map((name) => attackCatalog.find((a) => a["Move name"] === name))
    .filter((a) => a && /Strength|Special/i.test(a.Damage || ""));

  const clashAttackOptions = [
    `<option value="">– No selection –</option>`,
    ...clashEligibleAttacks.map(
      (a) =>
        `<option value="${a["Move name"]}" ${
          p.clashAttack === a["Move name"] ? "selected" : ""
        }>${a["Move name"]}</option>`
    ),
  ].join("");

  const clashSelectHtml = `
    <div style="margin-top:16px;">
      <label><b>Clash Attacks:</b>
        <select id="pk-clash-attack">${clashAttackOptions}</select>
      </label>
      <span id="clash-value" style="margin-left:12px;"></span>
    </div>
  `;

  document.getElementById(
    "detail-view"
  ).innerHTML = `<div class="detail-content pokemon-detail">
    <h2>Pokémon-Details</h2>
    <fieldset class="form-section pokemon-detail">
  <legend>Details</legend>
  <div class="form-row">
    <div class="fieldset-col">
      <div class="form-row">
        <label for="pk-select"><strong>Pokémon:</strong></label>
        <select id="pk-select">${pokemonOptions}</select>
      </div>
      <div class="form-row">
        <label for="pk-rank"><strong>Rank:</strong></label>
        <select id="pk-rank">${moveRanks.map(
          r => `<option ${p.currentRank === r ? "selected" : ""}>${r}</option>`
        ).join("")}</select>
      </div>
      <div class="form-row">
        <label for="pk-pokeball"><strong>Pokeball:</strong></label>
        <select id="pk-pokeball">${pokeballOptions}</select>
      </div>
      <div class="form-row">
        <label for="pk-nickname"><strong>Nickname:</strong></label>
        <input type="text" id="pk-nickname" value="${p.nickname}" maxlength="24" style="width: 10em;">
      </div>
      <div class="form-row">
        <label for="pk-gender"><strong>Gender:</strong></label>
        <select id="pk-gender">${genderOptions}</select>
      </div>
      <div class="form-row">
        <span><strong>Type:</strong></span>
        ${getTypeBadges([p.type1, p.type2].filter(Boolean))}
      </div></div>
      <div class="fieldset-col">
      <div class="form-row">
        <label for="pk-nature"><strong>Nature:</strong></label>
        <select id="pk-nature">${natureOptions}</select>
        <span class="nature-confidence"><strong>Confidence:</strong> <b>${natureConfidence}</b></span>
      </div>
    
    
      <div class="form-row">
        <span><strong>HP:</strong></span>
        <input type="number" id="pk-hp-current" min="0" max="${hpMax}" value="${p.hp}" style="width:3.5em;">
        / ${hpMax}
        ${painPenaltyHtml}
      </div>
      <div class="form-row">
        <span><strong>Will:</strong></span>
        <input type="number" id="pk-will-current" min="0" max="${maxWill}" value="${p.will}" style="width:3.5em;">
        / ${maxWill}
      </div>
      <div class="form-row">
        <label for="pk-ability"><strong>Ability:</strong></label>
        <select id="pk-ability">${abilities.map(
          a => `<option ${p.ability === a ? "selected" : ""}>${a}</option>`
        ).join("")}</select>
      </div>
      <div class="form-row">
        <label for="pk-item"><strong>Item:</strong></label>
        <select id="pk-item">${itemOptions}</select>
      </div>
      <div class="evolution-info">${evoText}</div>
    </div>
  </div>
</fieldset>

    
    <fieldset class="form-section pokemon-detail">
    <legend>Type Effectiveness & Status</legend>
    <div class="form-row">
  <div class="fieldset-col">
  <div class="form-row"><span><strong>Weak:</strong></span> ${weak}</div>
    <div class="form-row"><span><strong>Resist:</strong></span> ${resist}</div>
    <div class="form-row"><span><strong>Immune:</strong></span> ${immune}</div>
  </div>
<div class="fieldset-col">

 
  <div class="form-row"><label for="pk-status"><strong>Condition:</strong></label><select id="pk-status">
    <option value="" ${
      p.statusEffect === "" ? "selected" : ""
    }>No condition</option>
    ${statusOptions}
  </select>
  </div>

<div class="form-row"><label for="pk-status-level"><strong>Level:</strong></label>
  <input type="number" id="pk-status-level" min="1" max="${maxStatusLevel}" value="${statusLevelValue}">
</div>
</fieldset>
<fieldset class="form-section">
<legend>Misc.</legend>
<div class="form-row"><div class="fieldset-col">
<div class="form-row">
    <label for="pk-defense-mod"><strong>Defense:</strong></label>
<input type="number" id="pk-defense-mod" value="${
    p.defenseMod || 0
  }" style="width:3em;">
  <span>${(p.vitality || 0) + (p.vitalityMod || 0)} &nbsp;→&nbsp; <b>${
    (p.vitality || 0) + (p.vitalityMod || 0) + (p.defenseMod || 0)
  }</b></span>
  
 </div>
<div class="form-row"><label for="pk-spdefense-mod"><strong>Sp. Def.:</strong></label>
<input type="number" id="pk-spdefense-mod" value="${
    p.spDefenseMod || 0
  }" style="width:3em;">
<span>${(p.insight || 0) + (p.insightMod || 0)} &nbsp;→&nbsp; <b>${
    (p.insight || 0) + (p.insightMod || 0) + (p.spDefenseMod || 0)
  }</b></span>
</div>
<div class="form-row"><label><strong>Victories:</strong></label>
  <input type="text" id="pk-victories" value="${victoriesCount}" maxlength="24" style="width: 10em;">

</div>
</div><div class="fieldset-col">
<div class="form-row"><span><strong>Initiative:</strong></span>${initiative}</div>
  <div class="form-row"><span><strong>Evasion:</strong></span> ${evasion}
</div>
       
    </fieldset>

<fieldset class="form-section">
        <legend>Attributes & Skills</legend>
    <div class="detail-column">${statMatrix}</div>
      </fieldset>
<fieldset class="form-section">
<legend>Stat Modification</legend>
<div class="attribute-modifiers">
  <div class="form-row"><label><strong>Str. Mod:</strong></label>
    <input type="number" id="pk-strength-mod" value="${
      p.strengthMod || 0
    }" style="width:3em;">
    <span>Basis: ${p.strength || 0} → <b>${
    (p.strength || 0) + (p.strengthMod || 0)
  }</b></span>
  </label></div>
  <div class="form-row"><label><strong>Dex. Mod:</strong></label>
    <input type="number" id="pk-dexterity-mod" value="${
      p.dexterityMod || 0
    }" style="width:3em;">
    <span>Basis: ${p.dexterity || 0} → <b>${
    (p.dexterity || 0) + (p.dexterityMod || 0)
  }</b></span>
  </div>
  <div class="form-row"><label><strong>Vit. Mod:</strong></label>
    <input type="number" id="pk-vitality-mod" value="${
      p.vitalityMod || 0
    }" style="width:3em;">
    <span>Basis: ${p.vitality || 0} → <b>${
    (p.vitality || 0) + (p.vitalityMod || 0)
  }</b></span>
  </div>
  <div class="form-row"><label><strong>Sp. Mod:</strong></label>
    <input type="number" id="pk-special-mod" value="${
      p.specialMod || 0
    }" style="width:3em;">
    <span>Basis: ${p.special || 0} → <b>${
    (p.special || 0) + (p.specialMod || 0)
  }</b></span>
  </div>
  <div class="form-row"><label><strong>Ins. Mod:</strong></label>
    <input type="number" id="pk-insight-mod" value="${
      p.insightMod || 0
    }" style="width:3em;">
    <span>Basis: ${p.insight || 0} → <b>${
    (p.insight || 0) + (p.insightMod || 0)
  }</b></span>
 </div>
</div>
</fieldset>

    ${actionCounterHtml}

    <h3>Attacks</h3>
    ${attackCards}
    ${clashSelectHtml}

  <button class="remove-pokemon-btn" id="remove-pokemon-btn">Remove Pokémon</button>
  </div>`;

  const d = document.querySelector(".detail-content");
  d.querySelector("#pk-select").onchange = (e) => {
    const selectedName = e.target.value.trim();
    const pkDataNew = pokemonCatalog.find(
      (x) => x["Pokemon Name"].trim() === selectedName
    );
    if (!pkDataNew) return;
    trainer.pokemon[i] = createPokemonFromCatalog(pkDataNew);
    saveData();

    renderDetailPokemon(i);
        renderSidebar();
  };

  const remBtn = document.getElementById("remove-pokemon-btn");
  if (remBtn)
    remBtn.onclick = () => {
      if (confirm(`"Are you sure you want to remove ${p.nickname || p.name}"?`)) {
        trainer.pokemon.splice(i, 1);
        saveData();
        renderSidebar();
        renderDetailTrainer();
      }
    };

  d.querySelector("#pk-rank").onchange = (e) => {
    p.currentRank = e.target.value;
    saveData();
    renderDetailPokemon(i);
  };
  d.querySelector("#pk-nickname").oninput = (e) => {
    p.nickname = e.target.value;
    saveData();
    renderSidebar();
  };

  d.querySelector("#pk-ability").onchange = (e) => {
    p.ability = e.target.value;
    saveData();
  };

  d.querySelector("#pk-status").onchange = (e) => {
    p.statusEffect = e.target.value || "";
    // Status-Level auf 1 setzen initial
    p.statusEffectLevel = 1;
    saveData();
    renderDetailPokemon(i);
    renderSidebar();
  };

  d.querySelector("#pk-status-level").oninput = (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) val = 1;
    const maxLevel =
      p.statusEffect && statusEffectsInfo[p.statusEffect]
        ? statusEffectsInfo[p.statusEffect].maxLevel
        : 1;
    if (val > maxLevel) val = maxLevel;
    p.statusEffectLevel = val;
    saveData();
    renderSidebar(); // Detailansicht bleibt erhalten
  };

  d.querySelector("#pk-item").onchange = (e) => {
    p.heldItem = e.target.value || null;
    saveData();
    renderDetailPokemon(i);
    renderSidebar();
  };

  d.querySelectorAll(".stat-btn").forEach(
    (btn) =>
      (btn.onclick = () => {
        const stat = btn.dataset.stat,
          val = parseInt(btn.dataset.val);
        const isMain = [
          "strength",
          "dexterity",
          "vitality",
          "special",
          "insight",
        ].includes(stat);
        const minVal = isMain
          ? +pokemonCatalog.find((x) => x["Pokemon Name"] === p.name)[
              capitalize(stat) + "Min"
            ] || 0
          : 0;
        if (p[stat] === val && val > minVal) {
          p[stat] = val - 1;
        } else {
          p[stat] = Math.max(minVal, val);
        }
        saveData();
        renderDetailPokemon(i);
        renderSidebar();
      })
  );

  d.querySelectorAll(".action-box").forEach((box) => {
    box.onclick = (e) => {
      if (e && e.preventDefault) e.preventDefault(); // <- Sicherstellen
      const val = +box.dataset.action;
      if (p.actionsThisTurn === val) {
        p.actionsThisTurn = val - 1;
      } else {
        p.actionsThisTurn = val;
      }
      saveData();
      d.querySelectorAll(".action-box").forEach((b, n) => {
        b.classList.toggle("active", n < p.actionsThisTurn);
      });
    };
  });

  d.querySelectorAll(".attack-select").forEach(
    (sel) =>
      (sel.onchange = (e) => {
        p.selectedMoves[+sel.dataset.slot] = e.target.value || null;
        saveData();
        renderDetailPokemon(i);
        renderSidebar();
      })
  );

  d.querySelector("#pk-hp-current").oninput = (e) => {
    let v = +e.target.value;
    p.hp = v;
    saveData();
    renderDetailPokemon(i);
    renderSidebar();
  };

  d.querySelector("#pk-will-current").oninput = (e) => {
    let v = +e.target.value;
    p.will = v;
    saveData();
    renderDetailPokemon(i);
    renderSidebar();
  };

  function calcClashValue(a, p) {
    if (!a) return "";
    let stat = 0;
    const damageStr = a.Damage ? String(a.Damage) : "";
    if (/Strength/i.test(damageStr))
      stat = (p.strength || 0) + (p.strengthMod || 0);
    if (/Special/i.test(damageStr))
      stat = (p.special || 0) + (p.specialMod || 0);
    return stat + (p.clash || 0);
  }

  function updateClashValue() {
    const sel = d.querySelector("#pk-clash-attack");
    if (!sel) return;
    const attackName = sel.value;
    const attackData = attackCatalog.find((a) => a["Move name"] === attackName);
    const clashResult = attackName ? calcClashValue(attackData, p) : "";
    const v = d.querySelector("#clash-value");
    if (v)
      v.textContent =
        attackName && clashResult !== "" ? `Clash: ${clashResult}` : "";
  }

  const clashSel = d.querySelector("#pk-clash-attack");
  if (clashSel) {
    clashSel.onchange = updateClashValue;
    updateClashValue();
  }

  const defModInput = d.querySelector("#pk-defense-mod");
  if (defModInput) {
    defModInput.oninput = (e) => {
      p.defenseMod = parseInt(e.target.value) || 0;
      saveData();
      renderDetailPokemon(i); // Nur wenn du die Anzeige direkt aktualisieren willst
      renderSidebar();
    };
  }
  const spDefModInput = d.querySelector("#pk-spdefense-mod");
  if (spDefModInput) {
    spDefModInput.oninput = (e) => {
      p.spDefenseMod = parseInt(e.target.value) || 0;
      saveData();
      renderDetailPokemon(i);
      renderSidebar();
    };
  }
  const strengthModInput = d.querySelector("#pk-strength-mod");
  if (strengthModInput) {
    strengthModInput.oninput = (e) => {
      p.strengthMod = parseInt(e.target.value) || 0;
      saveData();
      renderDetailPokemon(i);
      renderSidebar();
    };
  }
  const dexterityModInput = d.querySelector("#pk-dexterity-mod");
  if (dexterityModInput) {
    dexterityModInput.oninput = (e) => {
      p.dexterityMod = parseInt(e.target.value) || 0;
      saveData();
      renderDetailPokemon(i);
      renderSidebar();
    };
  }
  const vitalityModInput = d.querySelector("#pk-vitality-mod");
  if (vitalityModInput) {
    vitalityModInput.oninput = (e) => {
      p.vitalityMod = parseInt(e.target.value) || 0;
      saveData();
      renderDetailPokemon(i);
      renderSidebar();
    };
  }
  const specialModInput = d.querySelector("#pk-special-mod");
  if (specialModInput) {
    specialModInput.oninput = (e) => {
      p.specialMod = parseInt(e.target.value) || 0;
      saveData();
      renderDetailPokemon(i);
      renderSidebar();
    };
  }
  const insightModInput = d.querySelector("#pk-insight-mod");
  if (insightModInput) {
    insightModInput.oninput = (e) => {
      p.insightMod = parseInt(e.target.value) || 0;
      saveData();
      renderDetailPokemon(i);
      renderSidebar();
    };
  }
  d.querySelector("#pk-nature").onchange = (e) => {
    p.nature = e.target.value;
    saveData();
    renderDetailPokemon(i); // damit das neue Confidence angezeigt wird
  };

  d.querySelector("#pk-gender").onchange = (e) => {
    p.gender = e.target.value;
    saveData();
  };
  d.querySelector("#pk-pokeball").onchange = (e) => {
    p.pokeball = e.target.value;
    saveData();
  };
  d.querySelector("#pk-victories").onchange = (e) => {
    p.victoriesCount = e.target.value;
    saveData();
  };
}

document.getElementById("btn-export-trainer").onclick = function () {
  const json = JSON.stringify(trainer, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = (trainer.name || "trainer") + ".json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

document.getElementById("btn-import-trainer").onclick = function () {
  document.getElementById("import-trainer-file").click();
};

document.getElementById("import-trainer-file").onchange = function (evt) {
  const file = evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const loaded = JSON.parse(e.target.result);
      // Optional: primitive schema check
      if (!loaded || !Array.isArray(loaded.pokemon))
        throw new Error("Wrong Format");
      trainer = loaded;
      saveData();
      renderSidebar();
      // Falls du eine Hauptansicht renderst, dort auch aktualisieren
      renderDetailTrainer?.();
      alert("Trainer loaded!");
    } catch (e) {
      alert("Error while importing: " + e.message);
    }
  };
  reader.readAsText(file);
};

window.addEventListener("DOMContentLoaded", async () => {
  await loadPokemonCatalog();
  await loadAttackCatalog();
  await loadEvolutionData();
  await loadNatureData();
  await loadRankData();
  await loadItemsData();
  await loadSymbolData();
  loadData();
  renderSidebar();
  renderDetailTrainer();
  const themeSelect = document.getElementById("theme-select");
  const theme = localStorage.getItem("theme") || "theme-gengar";
  document.body.className = theme;
  themeSelect.value = theme;
  themeSelect.addEventListener("change", (e) => {
    document.body.className = e.target.value;
    localStorage.setItem("theme", e.target.value);
  });
});
