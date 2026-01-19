const gamesDatabase = {
    "11/01/2026": {
        groups: [
            { level: 1, title: "Achados na Insuficiência Cardíaca", items: ["B3", "ESTASE JUGULAR", "EDEMA DE MMII", "ORTOPNEIA"] },
            { level: 2, title: "Hepatites Virais", items: ["HBSAG", "ANTI-HCV", "ICTERÍCIA", "FECAL-ORAL"] },
            { level: 3, title: "Eritemas", items: ["INFECCIOSO", "NODOSO", "MULTIFORME", "MARGINADO"] },
            { level: 4, title: "Epônimos com 'Murphy'", items: ["SINAL", "PONTO", "TRÍADE", "BOTÃO"] }
        ]
    },
    "12/01/2026": {
        groups: [
            { level: 1, title: "Sinais de Irritação Peritoneal", items: ["BLUMBERG", "ROVSING", "LAPINSKY", "GENEAU DE MUSSY"] },
            { level: 2, title: "Exames de Triagem Neonatal", items: ["PEZINHO", "ORELHINHA", "CORAÇÃOZINHO", "OLHINHO"] },
            { level: 3, title: "Verme", items: ["CHATO", "SOLITÁRIA", "REDONDO", "ANCILÓSTOMO"] },
            { level: 4, title: "Escalas de Coma/Sedação", items: ["GLASGOW", "RAMSAY", "RASS", "FOUR"] }
        ]
    },
    "13/01/2026": {
        groups: [
            { level: 1, title: "Sintomas de Tuberculose", items: ["TOSSE", "FEBRE VESPERTINA", "SUDORESE NOTURNA", "EMAGRECIMENTO"] },
            { level: 2, title: "Tipos de Insulina", items: ["NPH", "REGULAR", "LISPRO", "GLARGINA"] },
            { level: 3, title: "Ossos do Ouvido", items: ["MARTELO", "BIGORNA", "ESTRIBO", "ESTRIADO"] },
            { level: 4, title: "Camadas da Pele", items: ["EPIDERME", "DERME", "HIPODERME", "FÁSCIA"] }
        ]
    }
};

const COLORS = { 1: "#5eed71", 2: "#51b8d4", 3: "#ed685e", 4: "#edc75e" };
let userAssignments = {}; 
let lives = 7;
const maxLives = 7;
let currentItems = [];
let solvedLevels = []; 
let currentKey = "11/01/2026";

let startTime, timerInterval, gameStarted = false;

function formatDuration(ms) {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function startTimer() {
    if (timerInterval) return;
    startTime = Date.now();
    timerInterval = setInterval(() => {
        document.getElementById("liveTimer").textContent = formatDuration(Date.now() - startTime);
    }, 1000);
}

function init() {
    const savedStatus = localStorage.getItem(`nexo_status_${currentKey}`);
    const gridEl = document.getElementById("grid");
    gridEl.style.display = "grid"; gridEl.style.pointerEvents = "auto"; gridEl.style.opacity = "1";
    document.getElementById("game-controls").style.display = "block";
    document.getElementById("status-panel").classList.add("hidden");
    document.getElementById("solved-container").innerHTML = "";
    document.getElementById("liveTimer").textContent = "0m 0s";
    
    clearInterval(timerInterval); timerInterval = null; gameStarted = false;
    userAssignments = {}; lives = maxLives; solvedLevels = [];
    
    const game = gamesDatabase[currentKey];
    currentItems = [];
    game.groups.forEach(g => currentItems.push(...g.items));
    if (!savedStatus) currentItems.sort(() => Math.random() - 0.5);
    
    renderGrid();
    updateUI();

    if (savedStatus) {
        game.groups.forEach(g => {
            renderSolvedRow(g, COLORS[g.level]);
            solvedLevels.push(g.level);
        });
        currentItems = []; renderGrid();
        showGameOver(savedStatus === "won" ? "Parabéns! 🎈" : "Que pena! 😔", "", COLORS[savedStatus === "won" ? 1 : 3], false);
    }
}

function changeGame(val) { currentKey = val; init(); }

function renderGrid() {
    const grid = document.getElementById("grid");
    grid.innerHTML = "";
    currentItems.forEach(text => {
        const div = document.createElement("div");
        div.className = "item";
        if (userAssignments[text]) div.classList.add(`sel-g${userAssignments[text]}`);
        div.textContent = text;
        div.onclick = () => handleSelection(text);
        grid.appendChild(div);
    });
}

function handleSelection(text) {
    if (!gameStarted) { gameStarted = true; startTimer(); }
    if (userAssignments[text]) {
        delete userAssignments[text];
    } else {
        const possible = [1, 2, 3, 4].filter(c => !solvedLevels.includes(c));
        for (let c of possible) {
            if (Object.values(userAssignments).filter(v => v === c).length < 4) {
                userAssignments[text] = c; break;
            }
        }
    }
    renderGrid(); updateUI();
}

function updateUI() {
    document.getElementById("submitBtn").disabled = Object.keys(userAssignments).length !== currentItems.length || currentItems.length === 0;
    document.getElementById("attempts-counter").textContent = `${maxLives - lives} / ${maxLives}`;
}

document.getElementById("submitBtn").onclick = async () => {
    const activeColors = [...new Set(Object.values(userAssignments))].sort();
    const sorted = [];
    activeColors.forEach(c => sorted.push(...currentItems.filter(w => userAssignments[w] === c)));
    currentItems = sorted;
    renderGrid();
    await new Promise(r => setTimeout(r, 600));

    let correctGroups = [];
    let wrongColors = [];

    activeColors.forEach(colorId => {
        const words = Object.keys(userAssignments).filter(k => userAssignments[k] === colorId);
        const match = gamesDatabase[currentKey].groups.find(g => g.items.every(i => words.includes(i)));
        if (match) {
            correctGroups.push({ group: match, words: words, colorId: colorId });
        } else {
            wrongColors.push(colorId);
        }
    });

    if (correctGroups.length > 0) {
        correctGroups.forEach(cg => {
            document.querySelectorAll(`.sel-g${cg.colorId}`).forEach(el => el.classList.add("correct-anim"));
        });
        await new Promise(r => setTimeout(r, 500));
        correctGroups.forEach(cg => {
            renderSolvedRow(cg.group, COLORS[cg.colorId]);
            currentItems = currentItems.filter(i => !cg.words.includes(i));
            solvedLevels.push(cg.colorId);
        });
    }

    if (wrongColors.length > 0) {
        wrongColors.forEach(c => {
            document.querySelectorAll(`.sel-g${c}`).forEach(el => {
                el.classList.add("shake");
                setTimeout(() => el.classList.remove("shake"), 450);
            });
        });
        lives--;
    }

    userAssignments = {}; renderGrid(); updateUI();
    if (solvedLevels.length === 4) showGameOver("Parabéns! 🎈", "", COLORS[1], true);
    else if (lives <= 0) showGameOver("Que pena! 😔", "", COLORS[3], true);
};

function renderSolvedRow(group, color) {
    const div = document.createElement("div");
    div.className = "solved-row";
    div.style.backgroundColor = color;
    div.innerHTML = `<div class="group-title">${group.title}</div><div>${group.items.join(", ")}</div>`;
    document.getElementById("solved-container").appendChild(div);
}

function showGameOver(title, msg, color, save) {
    clearInterval(timerInterval);
    const panel = document.getElementById("status-panel");
    const statusTitle = document.getElementById("status-title");
    const statusMessage = document.getElementById("status-message");
    const timeText = document.getElementById("liveTimer").textContent;
    const totalAttempts = maxLives - lives;

    statusTitle.textContent = title;
    statusTitle.style.color = color;
    
    if (solvedLevels.length === 4) {
        statusMessage.innerHTML = `Você precisou de <strong>${timeText}</strong> para encontrar as conexões ocultas em <strong>${totalAttempts}</strong> tentativas!`;
    } else {
        statusMessage.innerHTML = "Você não encontrou as conexões ocultas de hoje. Tente novamente amanhã.";
    }

    panel.classList.remove("hidden");
    document.getElementById("game-controls").style.display = "none";
    document.getElementById("grid").style.opacity = "0.5";
    if (save) localStorage.setItem(`nexo_status_${currentKey}`, solvedLevels.length === 4 ? "won" : "lost");
}

function shareResult() {
    const timeText = document.getElementById("liveTimer").textContent;
    const totalAttempts = maxLives - lives;
    navigator.clipboard.writeText(`MEDnexo (${currentKey})\nConcluí o desafio em ${timeText} e ${totalAttempts} tentativas! 🩺`);
    alert("Copiado!");
}

document.getElementById("clearBtn").onclick = () => { userAssignments = {}; renderGrid(); updateUI(); };
init();