const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const timeEl = document.getElementById("time");
const scoreEl = document.getElementById("score");
const levelText = document.getElementById("levelText");

const easyBtn = document.getElementById("easyBtn");
const mediumBtn = document.getElementById("mediumBtn");
const hardBtn = document.getElementById("hardBtn");
const restartBtn = document.getElementById("restartBtn");

let game = null;

const COLORS = ["red", "green", "blue", "yellow", "purple", "cyan"];

function randomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function randomPos(min, max) {
    return Math.random() * (max - min) + min;
}

class Block {
    constructor(x, y, color, game) {
        this.x = x;
        this.y = y;
        this.size = 40;
        this.color = color;
        this.game = game;

        if (game.mode === "hard") {
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = (Math.random() - 0.5) * 2;
        } else {
            this.vx = 0;
            this.vy = 0;
        }
    }

    update() {
        if (this.game.mode === "hard") {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x <= 0 || this.x >= canvas.width - this.size) this.vx *= -1;
            if (this.y <= 0 || this.y >= canvas.height - this.size) this.vy *= -1;
        }
    }

    draw() {
        this.update();
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }

    contains(px, py) {
        return (
            px >= this.x &&
            px <= this.x + this.size &&
            py >= this.y &&
            py <= this.y + this.size
        );
    }
}


class CenterCircle {
    constructor(color) {
        this.radius = 28;
        this.color = color;

        this.x = canvas.width / 2;
        this.y = canvas.height / 2;

        this.vx = 1.4;
        this.vy = 1.2;
    }

    randomizePosition() {
        this.x = randomPos(this.radius, canvas.width - this.radius);
        this.y = randomPos(this.radius, canvas.height - this.radius);
    }

    update(game) {
        if (game.mode === "hard") {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < this.radius || this.x > canvas.width - this.radius) this.vx *= -1;
            if (this.y < this.radius || this.y > canvas.height - this.radius) this.vy *= -1;
        }
    }

    draw(game) {
        this.update(game);
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Game {
    constructor(mode) {
        this.mode = mode;
        this.running = true;
        this.score = 0;
        this.time = 60;

        this.centerColor = randomColor();
        this.center = new CenterCircle(this.centerColor);

        this.blocks = [];
        this.createBlocks();

        this.startTimer();
        this.loop();
    }

    createBlocks() {
        this.blocks = [];
        const correctIndex = Math.floor(Math.random() * 6);

        for (let i = 0; i < 6; i++) {
            const color = (i === correctIndex)
                ? this.centerColor
                : randomColor();

            this.blocks.push(
                new Block(
                    Math.random() * 450,
                    Math.random() * 350,
                    color,
                    this
                )
            );
        }
    }

    handleCircleMove() {
        if (this.mode === "medium") {
            this.center.randomizePosition();
        }
    }

    click(x, y) {
        if (!this.running) return;

        for (let b of this.blocks) {
            if (b.contains(x, y)) {

                this.handleCircleMove();

                if (b.color === this.centerColor) {
                    this.score++;
                    scoreEl.textContent = this.score;
                    this.updateLevel();

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

    startTimer() {
        timeEl.textContent = this.time;
        scoreEl.textContent = this.score;

        this.interval = setInterval(() => {
            this.time--;
            timeEl.textContent = this.time;
            if (this.time <= 0) this.end();
        }, 1000);
    }

    updateLevel() {
        const s = this.score;
        let emoji = "😴";
        if (s > 10) emoji = "😬";
        if (s > 20) emoji = "😐";
        if (s > 30) emoji = "🙂";
        if (s > 40) emoji = "⭐";
        if (s >= 50) emoji = "🔥";
        levelText.textContent = "Aktuální: " + emoji;
    }

    end() {
        this.running = false;
        clearInterval(this.interval);
        restartBtn.disabled = false;
    }

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.center.draw(this);
        this.blocks.forEach(b => b.draw());
    }

    loop() {
        this.draw();
        if (this.running) requestAnimationFrame(() => this.loop());
    }
}

canvas.addEventListener("click", e => {
    if (!game) return;
    const r = canvas.getBoundingClientRect();
    game.click(e.clientX - r.left, e.clientY - r.top);
});

easyBtn.onclick = () => {
    game = new Game("easy");
    restartBtn.disabled = true;
};

mediumBtn.onclick = () => {
    game = new Game("medium");
    restartBtn.disabled = true;
};

hardBtn.onclick = () => {
    game = new Game("hard");
    restartBtn.disabled = true;
};

restartBtn.onclick = () => {
    game = new Game(game.mode);
    restartBtn.disabled = true;
};
