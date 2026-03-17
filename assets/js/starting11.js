// ===============================
// Auth Protection
// ===============================
const token = localStorage.getItem("token");
if (!token) {
  alert("You must be logged in to build your Starting XI.");
  window.location.href = "login.html";
}

// ===============================
// Player Data
// ===============================
let players = [
  { name: "SARIM SHAHZAD", pos: "GK", img: "assets/img/players/player1.jpg" },

  { name: "CLAUDIU CIRDEREI", pos: "DF", img: "assets/img/players/player6.jpg" },
  { name: "ALIIF MOSTOFA", pos: "DF", img: "assets/img/players/player7.jpg" },
  { name: "MUNEEB QUIDWAI", pos: "DF", img: "assets/img/players/player8.jpg" },
  { name: "ARAM OVAK", pos: "DF", img: "assets/img/players/player14.jpg" },
  { name: "EDDIE MURPHY", pos: "DF", img: "assets/img/players/player15.jpg" },

  { name: "SULIEMAN AZIZ", pos: "MF", img: "assets/img/players/player4.jpg" },
  { name: "INAM SYED", pos: "MF", img: "assets/img/players/player5.jpg" },

  { name: "MUNEEB ROUF", pos: "FW", img: "assets/img/players/player2.jpg" },
  { name: "SHAHEER IMRAN", pos: "FW", img: "assets/img/players/player3.jpg" },
  { name: "SAMEER KASHIF", pos: "FW", img: "assets/img/players/player9.jpg" },
  { name: "AIMONN AJMAL", pos: "FW", img: "assets/img/players/player10.jpg" },
  { name: "BILAL KHAN", pos: "FW", img: "assets/img/players/player11.jpg" },
  { name: "SAFEER SHAKE", pos: "FW", img: "assets/img/players/player12.jpg" },
  { name: "TASEEN KALAM", pos: "FW", img: "assets/img/players/player13.jpg" },
];

// ===============================
// DOM References
// ===============================
const formationSelect = document.getElementById("formationSelect");
const playerPool = document.getElementById("playerPool");

const rowFW = document.getElementById("row-fw");
const rowMF = document.getElementById("row-mf");
const rowDF = document.getElementById("row-df");
const rowGK = document.getElementById("row-gk");
const submitBtn = document.getElementById("submitXI");


// ===============================
// Render Player Pool
// ===============================
function renderPlayerPool() {
  playerPool.innerHTML = players.map((p, index) => `
    <div class="player-chip"
         draggable="true"
         data-index="${index}"
         ondragstart="handleDragStart(event)">
      <img src="${p.img}" alt="${p.name}">
      <div>
        <div class="fw-semibold">${p.name}</div>
        <div class="text-muted small">${p.pos}</div>
      </div>
    </div>
  `).join("");
}

// ===============================
// Render Formation
// ===============================
function renderFormation(formation) {

  const [df, mf, fw] = formation.split("-").map(n => parseInt(n, 10));

  rowFW.style.gridTemplateColumns = `repeat(${fw}, 120px)`;
  rowMF.style.gridTemplateColumns = `repeat(${mf}, 120px)`;
  rowDF.style.gridTemplateColumns = `repeat(${df}, 120px)`;
  rowGK.style.gridTemplateColumns = `repeat(1, 120px)`;

  rowFW.innerHTML = Array.from({ length: fw }, (_, i) =>
    `<div class="slot"
          data-default="FW ${i + 1}"
          ondragover="allowDrop(event)"
          ondrop="handleDrop(event)">
        FW ${i + 1}
     </div>`
  ).join("");

  rowMF.innerHTML = Array.from({ length: mf }, (_, i) =>
    `<div class="slot"
          data-default="MF ${i + 1}"
          ondragover="allowDrop(event)"
          ondrop="handleDrop(event)">
        MF ${i + 1}
     </div>`
  ).join("");

  rowDF.innerHTML = Array.from({ length: df }, (_, i) =>
    `<div class="slot"
          data-default="DF ${i + 1}"
          ondragover="allowDrop(event)"
          ondrop="handleDrop(event)">
        DF ${i + 1}
     </div>`
  ).join("");

  rowGK.innerHTML =
    `<div class="slot"
          data-default="GK"
          ondragover="allowDrop(event)"
          ondrop="handleDrop(event)">
        GK
     </div>`;
}

// ===============================
// Drag & Drop Logic
// ===============================
let draggedPlayerIndex = null;
let draggedSlot = null;

function handleDragStart(e) {
  draggedPlayerIndex = e.currentTarget.dataset.index;
  draggedSlot = null;
}

function handleSlotDrag(e) {
  draggedSlot = e.currentTarget.closest(".slot");
  draggedPlayerIndex = null;
}

function allowDrop(e) {
  e.preventDefault();
}

function handleDrop(e) {
  e.preventDefault();

  const targetSlot = e.currentTarget;

  // ===============================
  // Swap / Move Between Slots
  // ===============================
  if (draggedSlot) {

    if (targetSlot === draggedSlot) {
      draggedSlot = null;
      return;
    }

    const sourcePlayer = JSON.parse(draggedSlot.dataset.player);
    const targetPlayer = targetSlot.classList.contains("filled")
      ? JSON.parse(targetSlot.dataset.player)
      : null;

    // Move source to target
    fillSlot(targetSlot, sourcePlayer);

    // If target had a player → move back to source
    if (targetPlayer) {
      fillSlot(draggedSlot, targetPlayer);
    } else {
      resetSlot(draggedSlot);
    }

    draggedSlot = null;
    return;
  }

  // ===============================
  // Dragging From Pool
  // ===============================
  if (draggedPlayerIndex !== null) {

    if (targetSlot.classList.contains("filled")) return;

    const player = players[draggedPlayerIndex];

    fillSlot(targetSlot, player);

    players.splice(draggedPlayerIndex, 1);
    renderPlayerPool();

    draggedPlayerIndex = null;
  }
}

// ===============================
// Fill Slot
// ===============================
function fillSlot(slot, player) {
  slot.innerHTML = `
    <div class="text-center draggable-player"
         draggable="true"
         ondragstart="handleSlotDrag(event)">
      <img src="${player.img}" 
           style="width:40px;height:40px;border-radius:50%;object-fit:cover;"><br>
      <small>${player.name}</small>
    </div>
  `;

  slot.classList.add("filled");
  slot.dataset.player = JSON.stringify(player);
  slot.onclick = () => removeFromSlot(slot);
  updateSubmitButton();
}

// ===============================
// Remove Player From Slot
// ===============================
function removeFromSlot(slot) {
  if (!slot.classList.contains("filled")) return;

  const player = JSON.parse(slot.dataset.player);

  players.push(player);
  renderPlayerPool();

  resetSlot(slot);
}

// ===============================
// Reset Slot
// ===============================
function resetSlot(slot) {
  slot.classList.remove("filled");
  slot.innerHTML = slot.dataset.default;
  slot.removeAttribute("data-player");
  slot.onclick = null;
  updateSubmitButton();
}

// ===============================
// Init
// ===============================
renderPlayerPool();
renderFormation(formationSelect.value);

formationSelect.addEventListener("change", (e) => {

  //Collect players currently on pitch
  const filledSlots = document.querySelectorAll(".slot.filled");

  filledSlots.forEach(slot => {
    const player = JSON.parse(slot.dataset.player);
    players.push(player);
  });

  //Re-render player pool
  renderPlayerPool();

  //Render new formation
  renderFormation(e.target.value);
});

function updateSubmitButton() {
  const filledSlots = document.querySelectorAll(".slot.filled");
  submitBtn.disabled = filledSlots.length !== 11;
}

submitBtn.addEventListener("click", async () => {

  const filledSlots = document.querySelectorAll(".slot.filled");

  const squad = Array.from(filledSlots).map(slot => {
    const player = JSON.parse(slot.dataset.player);
    return {
      name: player.name,
      position: slot.dataset.default
    };
  });

  const formation = formationSelect.value;

  try {
    const res = await fetch(`${API_BASE_URL}/api/team/starting11`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        formation,
        players: squad
      })
    });

    const data = await res.json();

    if (res.ok) {
      alert("Starting XI saved successfully!");
    } else {
      alert(data.message);
    }

  } catch (err) {
    console.error(err);
    alert("Error saving squad");
  }
});
