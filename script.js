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
let lives = 5;
let currentItems = [];
let solvedLevels = []; 
let currentKey = "11/01/26";

function init() {
    const savedStatus = localStorage.getItem(`status_${currentKey}`);
    
    // Reseta visual padrão
    document.getElementById("grid").style.display = "grid";
    document.getElementById("grid").style.pointerEvents = "auto";
    document.getElementById("game-controls").style.display = "block";
    document.getElementById("status-panel").classList.add("hidden");
    document.getElementById("solved-container").innerHTML = "";

    userAssignments = {};
    lives = 5;
    solvedLevels = [];
    
    const game = gamesDatabase[currentKey];
    currentItems = [];
    game.groups.forEach(g => currentItems.push(...g.items));
    
    // Se o jogo já foi finalizado, não embaralha (para manter a ordem resolvida no print)
    if (!savedStatus) {
        currentItems.sort(() => Math.random() - 0.5);
    }
    
    renderGrid();
    updateUI();

    // Lógica de Persistência: Se já jogou, mostra as respostas e bloqueia
    if (savedStatus) {
        // Revela todos os grupos como se tivessem sido resolvidos
        game.groups.forEach(g => {
            renderSolvedRow(g, COLORS[g.level]);
        });
        currentItems = []; // Limpa o grid de seleção
        renderGrid();
        
        if (savedStatus === "won") {
            showGameOver("Parabéns!", "Você encontrou as conexões ocultas!", COLORS[1], false);
        } else {
            showGameOver("Que pena!", "Você não encontrou as conexões ocultas. Tente novamente amanhã.", COLORS[3], false);
        }
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
    document.getElementById("lives").textContent = "•".repeat(Math.max(0, lives));
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
            renderSolvedRow(ct.group, COLORS[ct.colorId]);
            currentItems = currentItems.filter(i => !ct.words.includes(i));
            solvedLevels.push(ct.colorId);
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
        showGameOver("Parabéns!", "Você encontrou as conexões ocultas!", COLORS[1], true);
    } else if (lives <= 0) {
        // No erro final, mostra os itens que faltavam no grid mas bloqueados
        showGameOver("Que pena!", "Você não encontrou as conexões ocultas. Tente novamente amanhã.", COLORS[3], true);
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
    const panel = document.getElementById("status-panel");
    document.getElementById("status-title").textContent = title;
    document.getElementById("status-title").style.color = color;
    document.getElementById("status-message").textContent = msg;
    
    panel.classList.remove("hidden");
    document.getElementById("game-controls").style.display = "none";
    
    // Bloqueia interações no grid mas deixa visível
    document.getElementById("grid").style.pointerEvents = "none";
    document.getElementById("grid").style.opacity = "0.6";

    if (save) {
        const status = (solvedLevels.length === 4) ? "won" : "lost";
        localStorage.setItem(`status_${currentKey}`, status);
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