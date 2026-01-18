const gamesDatabase = {
    "11/01/26": {
        groups: [
            { level: 1, title: "Achados na Insuficiência Cardíaca", items: ["B3", "ESTASE JUGULAR", "EDEMA DE MMII", "ORTOPNEIA"] },
            { level: 2, title: "Hepatites Virais", items: ["HBSAG", "ANTI-HCV", "ICTERÍCIA", "FECAL-ORAL"] },
            { level: 3, title: "Eritemas", items: ["INFECCIOSO", "NODOSO", "MULTIFORME", "MARGINADO"] },
            { level: 4, title: "Epônimos com 'Murphy'", items: ["SINAL", "PONTO", "TRÍADE", "BOTÃO"] }
        ]
    },
    "12/01/26": {
        groups: [
            { level: 1, title: "Sinais de Irritação Peritoneal", items: ["BLUMBERG", "ROVSING", "LAPINSKY", "GENEAU DE MUSSY"] },
            { level: 2, title: "Exames de Triagem Neonatal", items: ["PEZINHO", "ORELHINHA", "CORAÇÃOZINHO", "OLHINHO"] },
            { level: 3, title: "Verme", items: ["CHATO", "SOLITÁRIA", "REDONDO", "ANCILÓSTOMO"] },
            { level: 4, title: "Escalas de Coma/Sedação", items: ["GLASGOW", "RAMSAY", "RASS", "FOUR"] }
        ]
    },
    "13/01/26": {
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
let currentKey = "11/01/26";

let startTime, endTime, timerInterval;
let gameStarted = false;

function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
}

function startTimer() {
    if (timerInterval) return;
    startTime = Date.now();
    timerInterval = setInterval(() => {
        const diff = Date.now() - startTime;
        document.getElementById("liveTimer").textContent = formatDuration(diff);
    }, 1000);
}

function init() {
    const savedStatus = localStorage.getItem(`nexo_status_${currentKey}`);
    
    document.getElementById("grid").style.display = "grid";
    document.getElementById("grid").style.pointerEvents = "auto";
    document.getElementById("grid").style.opacity = "1";
    document.getElementById("game-controls").style.display = "block";
    document.getElementById("status-panel").classList.add("hidden");
    document.getElementById("solved-container").innerHTML = "";
    document.getElementById("liveTimer").textContent = "0m 0s";
    
    clearInterval(timerInterval);
    timerInterval = null;
    gameStarted = false;
    userAssignments = {};
    lives = maxLives;
    solvedLevels = [];
    
    const game = gamesDatabase[currentKey];
    currentItems = [];
    game.groups.forEach(g => currentItems.push(...g.items));
    
    if (!savedStatus) {
        currentItems.sort(() => Math.random() - 0.5);
    }
    
    renderGrid();
    updateUI();

    if (savedStatus) {
        game.groups.forEach(g => renderSolvedRow(g, COLORS[g.level]));
        currentItems = [];
        renderGrid();
        const win = savedStatus === "won";
        showGameOver(win ? "Parabéns! 🎈" : "Que pena! 😔", win ? "Você encontrou as conexões ocultas!" : "Você não encontrou as conexões. Tente novamente amanhã.", win ? COLORS[1] : COLORS[3], false);
    }
}

function changeGame(val) {
    currentKey = val;
    init();
}

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
    if (!gameStarted) {
        gameStarted = true;
        startTimer();
    }

    if (userAssignments[text]) {
        delete userAssignments[text];
    } else {
        const possibleColors = [1, 2, 3, 4].filter(c => !solvedLevels.includes(c));
        for (let c of possibleColors) {
            const currentSelectedInColor = Object.values(userAssignments).filter(v => v === c).length;
            if (currentSelectedInColor < 4) {
                userAssignments[text] = c;
                break;
            }
        }
    }
    renderGrid();
    updateUI();
}

function updateUI() {
    const totalSelected = Object.keys(userAssignments).length;
    document.getElementById("submitBtn").disabled = totalSelected !== currentItems.length || currentItems.length === 0;
    
    const attemptsUsed = maxLives - lives;
    document.getElementById("attempts-counter").textContent = `${attemptsUsed} / ${maxLives}`;
}

document.getElementById("submitBtn").onclick = async () => {
    const activeColors = [...new Set(Object.values(userAssignments))].sort();
    
    const sorted = [];
    activeColors.forEach(c => {
        sorted.push(...currentItems.filter(w => userAssignments[w] === c));
    });
    currentItems = sorted;
    renderGrid();

    await new Promise(r => setTimeout(r, 600));

    let correctThisTurn = [];
    let wrongThisTurn = [];

    activeColors.forEach(colorId => {
        const wordsInColor = Object.keys(userAssignments).filter(k => userAssignments[k] === colorId);
        const match = gamesDatabase[currentKey].groups.find(g => 
            g.items.every(item => wordsInColor.includes(item))
        );

        if (match) {
            correctThisTurn.push({ group: match, words: wordsInColor, colorId: colorId });
        } else {
            wrongThisTurn.push(colorId);
        }
    });

    if (correctThisTurn.length > 0) {
        correctThisTurn.forEach(ct => {
            document.querySelectorAll(`.sel-g${ct.colorId}`).forEach(el => el.classList.add("correct-anim"));
        });
        
        await new Promise(r => setTimeout(r, 500));

        correctThisTurn.forEach(ct => {
            renderSolvedRow(ct.group, COLORS[ct.group.level]);
            currentItems = currentItems.filter(i => !ct.words.includes(i));
            solvedLevels.push(ct.group.level);
        });
    }

    if (wrongThisTurn.length > 0) {
        wrongThisTurn.forEach(colorId => {
            document.querySelectorAll(`.sel-g${colorId}`).forEach(el => {
                el.classList.add("shake");
                setTimeout(() => el.classList.remove("shake"), 450);
            });
        });
        lives--;
    }

    userAssignments = {};
    renderGrid();
    updateUI();

    if (solvedLevels.length === 4) {
        showGameOver("Parabéns! 🎈", "Você encontrou as conexões ocultas!", COLORS[1], true);
    } else if (lives <= 0) {
        showGameOver("Que pena! 😔", "Você não encontrou as conexões ocultas. Tente novamente amanhã.", COLORS[3], true);
    }
};

function renderSolvedRow(group, color) {
    const container = document.getElementById("solved-container");
    const div = document.createElement("div");
    div.className = "solved-row";
    div.style.backgroundColor = color;
    div.innerHTML = `<div class="group-title">${group.title}</div><div>${group.items.join(", ")}</div>`;
    container.appendChild(div);
}

function showGameOver(title, msg, color, save = false) {
    clearInterval(timerInterval);
    const finalTime = document.getElementById("liveTimer").textContent;
    
    const panel = document.getElementById("status-panel");
    document.getElementById("status-title").textContent = title;
    document.getElementById("status-title").style.color = color;
    document.getElementById("status-message").textContent = msg;

    const attemptsUsed = maxLives - lives;
    document.getElementById("final-stats").innerHTML = `
        <div class="stats-container">
            <div class="stat-item"><strong>Tentativas:</strong> ${attemptsUsed}/${maxLives}</div>
            <div class="stat-item"><strong>Tempo:</strong> ${finalTime}</div>
        </div>
    `;
    
    panel.classList.remove("hidden");
    document.getElementById("game-controls").style.display = "none";
    document.getElementById("grid").style.pointerEvents = "none";
    document.getElementById("grid").style.opacity = "0.5";

    if (save) {
        localStorage.setItem(`nexo_status_${currentKey}`, solvedLevels.length === 4 ? "won" : "lost");
    }
}

function shareResult() {
    const text = `MEDnexo: Tentei o desafio de hoje! 🩺`;
    navigator.clipboard.writeText(text);
    alert("Resultado copiado!");
}

document.getElementById("clearBtn").onclick = () => {
    userAssignments = {};
    renderGrid();
    updateUI();
};

init();