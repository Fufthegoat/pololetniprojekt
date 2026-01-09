const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const easyBtn = document.getElementById("easyBtn");
const hardBtn = document.getElementById("hardBtn");
const restartBtn = document.getElementById("restartBtn");
const levelText = document.getElementById("levelText");

const colors = ["red", "blue", "green", "yellow"];
let game = null;

function getLevelText(score) {
    if (score <= 10) return "😴";
    if (score <= 20) return "😬";
    if (score <= 30) return "😐";
    if (score <= 40) return "🙂";
    if (score <= 49) return "⭐";
    return "🔥";
}

class CenterCircle {
    constructor(hard) {
        this.radius = 30;
        this.hard = hard;
        this.change();
    }

    change() {
        this.color = colors[Math.floor(Math.random() * colors.length)];

        if (this.hard) {
            this.x = Math.random() * (canvas.width - 60) + 30;
            this.y = Math.random() * (canvas.height - 60) + 30;
        } else {
            this.x = canvas.width / 2;
            this.y = canvas.height / 2;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class Block {
    constructor(color, blocks, center) {
        this.size = 40;
        this.color = color;

        let ok = false;
        while (!ok) {
            this.x = Math.random() * (canvas.width - this.size);
            this.y = Math.random() * (canvas.height - this.size);
            ok = true;

            for (let b of blocks) {
                if (
                    this.x < b.x + b.size &&
                    this.x + this.size > b.x &&
                    this.y < b.y + b.size &&
                    this.y + this.size > b.y
                ) {
                    ok = false;
                    break;
                }
            }

            const bx = this.x + this.size / 2;
            const by = this.y + this.size / 2;
            const dx = bx - center.x;
            const dy = by - center.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < center.radius + this.size / 2 + 5) {
                ok = false;
            }
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }

    isClicked(x, y) {
        return x >= this.x && x <= this.x + this.size &&
            y >= this.y && y <= this.y + this.size;
    }
}

class Game {
    constructor(hard) {
        this.hard = hard;
        this.center = new CenterCircle(hard);
        this.blocks = [];
        this.score = 0;
        this.time = 60;
        this.running = true;

        this.spawn();
        this.updateUI();
        this.startTimer();
        this.loop();
    }

    updateUI() {
        document.getElementById("score").textContent = this.score;
        document.getElementById("time").textContent = this.time;
        levelText.textContent = "Aktuální: " + getLevelText(this.score);
    }

    spawn() {
        this.blocks = [];
        colors.forEach(c => {
            this.blocks.push(new Block(c, this.blocks, this.center));
        });
    }

    startTimer() {
        this.interval = setInterval(() => {
            if (this.time > 0) {
                this.time--;
                this.updateUI();
            } else this.end();
        }, 1000);
    }

    click(x, y) {
        if (!this.running) return;
        const b = this.blocks.find(b => b.isClicked(x, y));
        if (!b) return;

        if (b.color === this.center.color) {
            this.score++;
            this.center.change();
            this.spawn();
            this.updateUI();
        } else this.end();
    }

    end() {
        this.running = false;
        clearInterval(this.interval);
        restartBtn.disabled = false;
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
    if (!game) return;
    const r = canvas.getBoundingClientRect();
    game.click(e.clientX - r.left, e.clientY - r.top);
});

easyBtn.onclick = () => {
    game = new Game(false);
    restartBtn.disabled = true;
};

hardBtn.onclick = () => {
    game = new Game(true);
    restartBtn.disabled = true;
};

restartBtn.onclick = () => {
    game = new Game(game.hard);
    restartBtn.disabled = true;
};
