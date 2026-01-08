const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

const colors = ["red", "blue", "green", "yellow"];

let game = null;

class CenterCircle {
    constructor() {
        this.radius = 30;
        this.changeColor();
    }

    changeColor() {
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    draw() {
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class Block {
    constructor(color, existingBlocks) {
        this.size = 40;
        this.color = color;

        let valid = false;
        while (!valid) {
            this.x = Math.random() * (canvas.width - this.size);
            this.y = Math.random() * (canvas.height - this.size);
            valid = true;

            for (let b of existingBlocks) {
                if (
                    this.x < b.x + b.size &&
                    this.x + this.size > b.x &&
                    this.y < b.y + b.size &&
                    this.y + this.size > b.y
                ) {
                    valid = false;
                    break;
                }
            }
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }

    isClicked(mx, my) {
        return (
            mx >= this.x &&
            mx <= this.x + this.size &&
            my >= this.y &&
            my <= this.y + this.size
        );
    }
}

class Game {
    constructor() {
        this.center = new CenterCircle();
        this.blocks = [];
        this.score = 0;
        this.timeLeft = 60;
        this.running = true;

        this.updateUI();
        this.spawnBlocks();
        this.startTimer();
        this.loop();
    }

    updateUI() {
        document.getElementById("score").textContent = this.score;
        document.getElementById("time").textContent = this.timeLeft;
    }

    spawnBlocks() {
        this.blocks = [];
        colors.forEach(color => {
            this.blocks.push(new Block(color, this.blocks));
        });
    }

    startTimer() {
        this.timer = setInterval(() => {
            if (this.timeLeft > 0) {
                this.timeLeft--;
                this.updateUI();
            } else {
                this.endGame();
            }
        }, 1000);
    }

    handleClick(x, y) {
        if (!this.running) return;

        const clickedBlocks = this.blocks.filter(b => b.isClicked(x, y));
        if (clickedBlocks.length === 0) return;

        const block = clickedBlocks[0];

        if (block.color === this.center.color) {
            this.score++;
            this.center.changeColor();
            this.spawnBlocks();
            this.updateUI();
        } else {
            this.endGame();
        }
    }

    endGame() {
        this.running = false;
        clearInterval(this.timer);
        restartBtn.disabled = false;
    }

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.center.draw();
        this.blocks.forEach(b => b.draw());

        if (!this.running) {
            ctx.fillStyle = "white";
            ctx.font = "30px Arial";
            ctx.fillText("KONEC HRY", 160, 175);
            ctx.font = "22px Arial";
            ctx.fillText(`Skóre: ${this.score}`, 190, 210);
        }
    }

    loop() {
        this.draw();
        if (this.running) {
            requestAnimationFrame(() => this.loop());
        }
    }
}

canvas.addEventListener("click", e => {
    if (!game) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    game.handleClick(x, y);
});

startBtn.addEventListener("click", () => {
    if (!game) {
        game = new Game();
        startBtn.style.display = "none";
        restartBtn.disabled = true;
    }
});

restartBtn.addEventListener("click", () => {
    game = new Game();
    restartBtn.disabled = true;
});