const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


const timeEl = document.getElementById("time");
const scoreEl = document.getElementById("score");

const easyBtn = document.getElementById("easyBtn");
const mediumBtn = document.getElementById("mediumBtn");
const hardBtn = document.getElementById("hardBtn");

const endScreen = document.getElementById("endScreen");
const finalText = document.getElementById("finalText");
const finalRestartBtn = document.getElementById("finalRestartBtn");


let game = null;
let hoveredBlock = null;

const COLORS = ["red", "green", "blue", "yellow", "purple", "cyan"];

// Vrati nahodnou barvu
function randomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// Zjistovani zda se ctverce prekryvaji
function rectsOverlap(a, b) {
    return !(
        a.x + a.size <= b.x ||
        a.x >= b.x + b.size ||
        a.y + a.size <= b.y ||
        a.y >= b.y + b.size
    );
}

// Zjistovani jestli se ctverec dotyka kruhu
function rectCircleOverlap(rect, circle) {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.size));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.size));
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    return dx * dx + dy * dy < circle.radius * circle.radius;
}

// Vytvori nahodny smer pohybu
function randomVelocity(speed = 1.5) {
    const angle = Math.random() * Math.PI * 2;
    return {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed
    };
}

function startNewGame(mode) {
    if (game && game.interval) clearInterval(game.interval);
    game = new Game(mode);
}


class Block {
    constructor(x, y, color, game) {
        this.x = x;
        this.y = y;
        this.size = 40;
        this.color = color;
        this.game = game;

        // Pohyb v hard modu
        if (game.mode === "hard") {
            const v = randomVelocity(1.8);
            this.vx = v.vx;
            this.vy = v.vy;
        } else {
            this.vx = 0;
            this.vy = 0;
        }
    }

   
    update() {
        if (this.game.mode === "hard") {
            this.x += this.vx;
            this.y += this.vy;

            // Odraz od okraju
            if (this.x <= 0 || this.x >= canvas.width - this.size) this.vx *= -1;
            if (this.y <= 0 || this.y >= canvas.height - this.size) this.vy *= -1;
        }
    }

     
    draw() {
        this.update();

        // Zvyrazneni pri najeti mysi
        if (this === hoveredBlock) {
            ctx.save();
            ctx.shadowColor = "white";
            ctx.shadowBlur = 15;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - 3, this.y - 3, this.size + 6, this.size + 6);
            ctx.restore();
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.size, this.size);
        }
    }

    // Zjistuje jestli hrac klikl na blok
    contains(px, py) {
        return px >= this.x && px <= this.x + this.size &&
               py >= this.y && py <= this.y + this.size;
    }
}

// Trida pro stredove kolecko
class CenterCircle {
    constructor(color, game) {
        this.radius = 28;
        this.color = color;
        this.game = game;
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
    }

    // Nahodna pozice pro medium uroven
    randomizePosition() {
        this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.y = Math.random() * (canvas.height - this.radius * 2) + this.radius;
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Trida cele hry
class Game {
    constructor(mode) {
        this.mode = mode;
        this.running = true;
        this.score = 0;
        this.time = 60;

        endScreen.classList.add("hidden");

        this.centerColor = randomColor();
        this.center = new CenterCircle(this.centerColor, this);

        this.blocks = [];
        this.createBlocks();

        this.startTimer();
        this.loop();
    }

    // Vytvori 6 bloku
    createBlocks() {
        this.blocks = [];
        const correctIndex = Math.floor(Math.random() * 6);

        for (let i = 0; i < 6; i++) {
            const color = (i === correctIndex) ? this.centerColor : randomColor();

            let block;
            do {
                block = new Block(
                    Math.random() * (canvas.width - 40),
                    Math.random() * (canvas.height - 40),
                    color,
                    this
                );
            } while (
                this.blocks.some(b => rectsOverlap(b, block)) ||
                rectCircleOverlap(block, this.center)
            );

            this.blocks.push(block);
        }
    }

    // Kliknuti hrace
    click(x, y) {
        for (let b of this.blocks) {
            if (b.contains(x, y)) {
                if (b.color === this.centerColor) {
                    this.score++;
                    scoreEl.textContent = this.score;
                    this.centerColor = randomColor();
                    this.center.color = this.centerColor;
                    this.createBlocks();
                } else {
                    this.time = Math.max(0, this.time - 2);
                    timeEl.textContent = this.time;
                }
                return;
            }
        }
    }

    // Casovac 1 minuty
    startTimer() {
        this.interval = setInterval(() => {
            this.time--;
            timeEl.textContent = this.time;
            if (this.time <= 0) this.end();
        }, 1000);
    }

    end() {
        this.running = false;
        clearInterval(this.interval);
        finalText.textContent = `Skóre: ${this.score}`;
        endScreen.classList.remove("hidden");
    }

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.center.draw();
        this.blocks.forEach(b => b.draw());
    }

    loop() {
        this.draw();
        if (this.running) requestAnimationFrame(() => this.loop());
    }
}

canvas.addEventListener("click", e => {
    const r = canvas.getBoundingClientRect();
    game.click(e.clientX - r.left, e.clientY - r.top);
});

// Na najeti bloku se zvyrazni
canvas.addEventListener("mousemove", e => {
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;

    hoveredBlock = null;
    for (let b of game.blocks) {
        if (b.contains(mx, my)) {
            hoveredBlock = b;
            break;
        }
    }
});

easyBtn.onclick = () => startNewGame("easy");
mediumBtn.onclick = () => startNewGame("medium");
hardBtn.onclick = () => startNewGame("hard");

// Restart hry
finalRestartBtn.onclick = () => startNewGame(game.mode);
