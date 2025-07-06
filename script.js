// Game Canvas and Context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State Management
class GameState {
    static TITLE = 'title';
    static INSTRUCTIONS = 'instructions';
    static PLAYING = 'playing';
    static BOSS = 'boss';
    static STAGE_CLEAR = 'stageClear';
    static GAME_CLEAR = 'gameClear';
    static GAME_OVER = 'gameOver';
}

// Game Variables
let gameState = GameState.TITLE;
let score = 0;
let lives = 3;
let currentStage = 1;
let stageTimer = 0;
let gameObjects = [];
let lastTime = 0;
let scrollOffset = 0;
let bossHP = 0;
let maxBossHP = 0;

// Start image
let startImage = new Image();
startImage.src = 'images/start.png';

// Ending image
let omedetoImage = new Image();
omedetoImage.src = 'images/omedeto.png';

// Input Handling
class InputHandler {
    constructor() {
        this.keys = {};
        this.mousePos = { x: 0, y: 0 };
        this.touchPos = { x: 0, y: 0 };
        this.isTouching = false;
        this.touchStartTime = 0;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ') e.preventDefault();
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // Mouse events
        canvas.addEventListener('mousedown', (e) => {
            this.handleClick(e.offsetX, e.offsetY);
        });

        canvas.addEventListener('mousemove', (e) => {
            this.mousePos.x = e.offsetX;
            this.mousePos.y = e.offsetY;
        });

        // Touch events
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.touchPos.x = (touch.clientX - rect.left) * (canvas.width / rect.width);
            this.touchPos.y = (touch.clientY - rect.top) * (canvas.height / rect.height);
            this.isTouching = true;
            this.touchStartTime = Date.now();
            this.handleClick(this.touchPos.x, this.touchPos.y);
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.touchPos.x = (touch.clientX - rect.left) * (canvas.width / rect.width);
            this.touchPos.y = (touch.clientY - rect.top) * (canvas.height / rect.height);
        });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isTouching = false;
            this.touchStartTime = 0;
        });

        // Shoot button for mobile
        const shootButton = document.getElementById('shootButton');
        shootButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameState === GameState.PLAYING || gameState === GameState.BOSS) {
                player.shoot();
            }
        });
    }

    handleClick(x, y) {
        if (gameState === GameState.TITLE) {
            // Check if start button is clicked (responsive)
            const buttonWidth = canvas.width * 0.3;
            const buttonHeight = canvas.height * 0.08;
            const buttonX = canvas.width / 2 - buttonWidth / 2;
            const buttonY = canvas.height * 0.8;
            
            if (x >= buttonX && x <= buttonX + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
                gameState = GameState.INSTRUCTIONS;
            }
        } else if (gameState === GameState.INSTRUCTIONS) {
            // Check if start game button is clicked (responsive)
            const buttonWidth = canvas.width * 0.19;
            const buttonHeight = canvas.height * 0.12;
            const buttonX = canvas.width / 2 - buttonWidth / 2;
            const buttonY = canvas.height * 0.83;
            
            if (x >= buttonX && x <= buttonX + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
                startGame();
            }
        } else if (gameState === GameState.STAGE_CLEAR) {
            // Check if next stage button is clicked (responsive)
            const button1Width = canvas.width * 0.225;
            const buttonHeight = canvas.height * 0.12;
            const button1X = canvas.width * 0.275;
            const buttonY = canvas.height * 0.67;
            
            if (x >= button1X && x <= button1X + button1Width && y >= buttonY && y <= buttonY + buttonHeight) {
                nextStage();
            }
            
            // Check if return to start button is clicked (responsive)
            const button2Width = canvas.width * 0.2;
            const button2X = canvas.width * 0.525;
            
            if (x >= button2X && x <= button2X + button2Width && y >= buttonY && y <= buttonY + buttonHeight) {
                restartGame();
            }
        } else if (gameState === GameState.GAME_CLEAR) {
            // Check if restart button is clicked (game clear screen) (responsive)
            const buttonWidth = canvas.width * 0.19;
            const buttonHeight = canvas.height * 0.12;
            const buttonX = canvas.width / 2 - buttonWidth / 2;
            const buttonY = canvas.height * 0.83;
            
            if (x >= buttonX && x <= buttonX + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
                restartGame();
            }
        } else if (gameState === GameState.GAME_OVER) {
            // Check if restart button is clicked (game over screen) (responsive)
            const buttonWidth = canvas.width * 0.19;
            const buttonHeight = canvas.height * 0.12;
            const buttonX = canvas.width / 2 - buttonWidth / 2;
            const buttonY = canvas.height * 0.67;
            
            if (x >= buttonX && x <= buttonX + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
                restartGame();
            }
        } else if (gameState === GameState.PLAYING || gameState === GameState.BOSS) {
            // Shoot bullet
            player.shoot();
        }
    }

    isPressed(key) {
        return !!this.keys[key];
    }

    getTouchPosition() {
        return this.isTouching ? this.touchPos : null;
    }

    shouldShootOnTouch() {
        // Return true if touching for more than 500ms for continuous shooting
        return this.isTouching && this.touchStartTime > 0 && (Date.now() - this.touchStartTime > 500);
    }
}

// Base GameObject Class
class GameObject {
    constructor(x, y, width, height, imageSrc) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = new Image();
        this.image.src = imageSrc;
        this.active = true;
        this.imageLoaded = false;
        this.image.onload = () => {
            this.imageLoaded = true;
        };
    }

    update(deltaTime) {
        // Override in subclasses
    }

    render() {
        if (this.imageLoaded) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }

    getBounds() {
        // Reduce collision area by 20% on all sides for more precise detection
        const margin = Math.min(this.width, this.height) * 0.2;
        return {
            left: this.x + margin,
            right: this.x + this.width - margin,
            top: this.y + margin,
            bottom: this.y + this.height - margin
        };
    }

    collidesWith(other) {
        const bounds1 = this.getBounds();
        const bounds2 = other.getBounds();
        return bounds1.left < bounds2.right &&
               bounds1.right > bounds2.left &&
               bounds1.top < bounds2.bottom &&
               bounds1.bottom > bounds2.top;
    }
}

// Player Class
class Player extends GameObject {
    constructor() {
        super(50, 300, 100, 100, 'images/jiki.png');
        this.speed = 300;
        this.invulnerable = false;
        this.invulnerableTime = 0;
        this.blinkTimer = 0;
        this.visible = true;
        this.lastShot = 0;
        this.shotCooldown = 200;
    }

    update(deltaTime) {
        if (gameState !== GameState.PLAYING && gameState !== GameState.BOSS) return;

        // Handle invulnerability
        if (this.invulnerable) {
            this.invulnerableTime -= deltaTime;
            this.blinkTimer += deltaTime;
            if (this.blinkTimer > 100) {
                this.visible = !this.visible;
                this.blinkTimer = 0;
            }
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
                this.visible = true;
            }
        }

        // Movement
        const touchPos = input.getTouchPosition();
        if (touchPos) {
            // Mobile: move towards touch position
            const dx = touchPos.x - this.x - this.width / 2;
            const dy = touchPos.y - this.y - this.height / 2;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 5) {
                this.x += (dx / distance) * this.speed * deltaTime / 1000;
                this.y += (dy / distance) * this.speed * deltaTime / 1000;
            }
        } else {
            // PC: keyboard movement
            if (input.isPressed('ArrowLeft') || input.isPressed('a')) {
                this.x -= this.speed * deltaTime / 1000;
            }
            if (input.isPressed('ArrowRight') || input.isPressed('d')) {
                this.x += this.speed * deltaTime / 1000;
            }
            if (input.isPressed('ArrowUp') || input.isPressed('w')) {
                this.y -= this.speed * deltaTime / 1000;
            }
            if (input.isPressed('ArrowDown') || input.isPressed('s')) {
                this.y += this.speed * deltaTime / 1000;
            }
        }

        // Keep player within bounds
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
        this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));

        // Shooting
        const shouldShoot = input.isPressed(' ') || input.shouldShootOnTouch();
        if (shouldShoot && Date.now() - this.lastShot > this.shotCooldown) {
            this.shoot();
        }
    }

    shoot() {
        if (Date.now() - this.lastShot < this.shotCooldown) return;
        
        const bullet = new PlayerBullet(this.x + this.width, this.y + this.height / 2);
        gameObjects.push(bullet);
        this.lastShot = Date.now();
    }

    render() {
        if (this.visible) {
            super.render();
        }
    }

    hit() {
        if (this.invulnerable) return;
        
        // Store current position for respawn
        const respawnX = this.x;
        const respawnY = this.y;
        
        lives--;
        if (lives <= 0) {
            gameState = GameState.GAME_OVER;
        } else {
            // Respawn at hit location
            this.x = respawnX;
            this.y = respawnY;
            this.invulnerable = true;
            this.invulnerableTime = 3000;
            this.blinkTimer = 0;
        }
    }
}

// Bullet Classes
class PlayerBullet extends GameObject {
    constructor(x, y) {
        super(x, y, 40, 20, 'images/kougeki.png');
        this.speed = 400;
    }

    update(deltaTime) {
        this.x += this.speed * deltaTime / 1000;
        if (this.x > canvas.width) {
            this.active = false;
        }
    }
}

class EnemyBullet extends GameObject {
    constructor(x, y) {
        super(x, y, 300, 300, 'images/tekikougeki.png'); // Larger size to cover more area
        this.speed = 150 + (currentStage - 1) * 50;
    }

    update(deltaTime) {
        this.x -= this.speed * deltaTime / 1000;
        if (this.x < -this.width) {
            this.active = false;
        }
    }
}

// Enemy Class
class Enemy extends GameObject {
    constructor(x, y, stage) {
        super(x, y, 100, 100, `images/teki${stage}.png`);
        this.speed = 100 + (stage - 1) * 50; // Increased speed multiplier from 20 to 50
        this.stage = stage;
    }

    update(deltaTime) {
        this.x -= this.speed * deltaTime / 1000;
        if (this.x < -this.width) {
            this.active = false;
        }
    }

    hit() {
        this.active = false;
        score += 100;
        
        // Create explosion
        const explosion = new Explosion(this.x + this.width / 2, this.y + this.height / 2);
        gameObjects.push(explosion);
    }
}

// Boss Class
class Boss extends GameObject {
    constructor(stage) {
        // Double the size - maintain aspect ratio (assuming square images for now, adjust if needed)
        const maxBossSize = Math.min(canvas.width * 0.8, canvas.height * 1.6);
        const bossWidth = maxBossSize;
        const bossHeight = maxBossSize;
        const bossX = canvas.width - bossWidth * 3/5; // Show only 3/5, clip 2/5 on right
        const bossY = canvas.height - bossHeight; // Position at bottom to prevent clipping
        
        super(bossX, bossY, bossWidth, bossHeight, `images/bosu${stage}.png`);
        this.hp = 15 * stage;
        this.maxHP = this.hp;
        this.baseX = bossX;
        this.baseY = bossY;
        this.shakeAmount = 5;
        this.shakeTime = 0;
        this.lastShot = 0;
        this.shotCooldown = 1500 - (stage - 1) * 200;
        this.stage = stage;
        
        maxBossHP = this.hp;
        bossHP = this.hp;
    }

    update(deltaTime) {
        // Add slight shake movement
        this.shakeTime += deltaTime;
        const shakeX = Math.sin(this.shakeTime / 100) * this.shakeAmount;
        const shakeY = Math.cos(this.shakeTime / 150) * this.shakeAmount;
        
        this.x = this.baseX + shakeX;
        this.y = this.baseY + shakeY;

        // Shooting
        if (Date.now() - this.lastShot > this.shotCooldown) {
            this.shoot();
            this.lastShot = Date.now();
        }

        bossHP = this.hp;
    }

    // Override getBounds for boss to use full image bounds
    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }

    shoot() {
        // Fire one bullet from random screen section (top OR middle OR bottom)
        // Custom spacing for optimal 3-tier attack pattern
        const screenSections = [
            { x: this.x, y: 15 },                    // Top section
            { x: this.x, y: 150 },                   // Middle section
            { x: this.x, y: 350 }                    // Bottom section
        ];
        
        // Choose one random position and fire one bullet
        const randomPos = screenSections[Math.floor(Math.random() * screenSections.length)];
        const bullet = new EnemyBullet(randomPos.x, randomPos.y);
        gameObjects.push(bullet);
    }

    hit() {
        this.hp--;
        if (this.hp <= 0) {
            this.active = false;
            score += 5000;
            
            // Create big explosion
            const explosion = new Explosion(this.x + this.width / 2, this.y + this.height / 2, true);
            gameObjects.push(explosion);
            
            // Stage cleared - always show stage clear screen first
            gameState = GameState.STAGE_CLEAR;
        }
    }
}

// Explosion Class
class Explosion extends GameObject {
    constructor(x, y, large = false) {
        const size = large ? 160 : 80;
        super(x - size / 2, y - size / 2, size, size, 'images/bakuhatu.png');
        this.timer = 500;
        this.large = large;
    }

    update(deltaTime) {
        this.timer -= deltaTime;
        if (this.timer <= 0) {
            this.active = false;
        }
    }

    render() {
        const alpha = this.timer / 500;
        ctx.globalAlpha = alpha;
        super.render();
        ctx.globalAlpha = 1;
    }
}

// Background Class
class Background {
    constructor() {
        this.images = [
            new Image(),
            new Image(),
            new Image()
        ];
        this.images[0].src = 'images/haikei1.png';
        this.images[1].src = 'images/haikei2.png';
        this.images[2].src = 'images/haikei3.png';
        this.speed = 50;
    }

    update(deltaTime) {
        if (gameState === GameState.PLAYING || gameState === GameState.BOSS) {
            scrollOffset += this.speed * deltaTime / 1000;
            if (scrollOffset >= canvas.width) {
                scrollOffset = 0;
            }
        }
    }

    render() {
        const currentImage = this.images[currentStage - 1];
        if (currentImage.complete) {
            // Draw background twice for infinite scrolling
            ctx.drawImage(currentImage, -scrollOffset, 0, canvas.width, canvas.height);
            ctx.drawImage(currentImage, canvas.width - scrollOffset, 0, canvas.width, canvas.height);
        }
    }
}

// UI Class
class UI {
    render() {
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        
        if (gameState === GameState.TITLE) {
            this.renderTitle();
        } else if (gameState === GameState.INSTRUCTIONS) {
            this.renderInstructions();
        } else if (gameState === GameState.PLAYING || gameState === GameState.BOSS) {
            this.renderGameUI();
        } else if (gameState === GameState.STAGE_CLEAR) {
            this.renderStageClear();
        } else if (gameState === GameState.GAME_CLEAR) {
            this.renderGameClear();
        } else if (gameState === GameState.GAME_OVER) {
            this.renderGameOver();
        }
    }

    renderTitle() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw start image (responsive size)
        if (startImage.complete) {
            const maxImgSize = Math.min(canvas.width * 0.7, canvas.height * 0.6);
            const imgWidth = maxImgSize;
            const imgHeight = maxImgSize;
            const imgX = canvas.width / 2 - imgWidth / 2;
            const imgY = canvas.height * 0.1;
            ctx.drawImage(startImage, imgX, imgY, imgWidth, imgHeight);
        }
        
        // Draw start button below the image (responsive position)
        const buttonWidth = canvas.width * 0.3;
        const buttonHeight = canvas.height * 0.08;
        const buttonX = canvas.width / 2 - buttonWidth / 2;
        const buttonY = canvas.height * 0.8;
        
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        ctx.fillStyle = '#000';
        ctx.font = `${Math.max(16, canvas.height * 0.03)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('START', canvas.width / 2, buttonY + buttonHeight / 2 + 5);
    }

    renderInstructions() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.max(24, canvas.height * 0.06)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('遊び方', canvas.width / 2, canvas.height * 0.13);
        
        ctx.font = `${Math.max(14, canvas.height * 0.033)}px Arial`;
        ctx.textAlign = 'left';
        
        const leftMargin = canvas.width * 0.063;
        const indentMargin = canvas.width * 0.088;
        
        // PC controls
        ctx.fillText('【PC操作】', leftMargin, canvas.height * 0.23);
        ctx.fillText('• 矢印キー: 自機移動', indentMargin, canvas.height * 0.28);
        ctx.fillText('• スペースキー: 攻撃', indentMargin, canvas.height * 0.33);
        
        // Mobile controls
        ctx.fillText('【モバイル操作】', leftMargin, canvas.height * 0.42);
        ctx.fillText('• 画面タッチ&ドラッグ: 自機移動', indentMargin, canvas.height * 0.47);
        ctx.fillText('• 画面タップ: 攻撃', indentMargin, canvas.height * 0.52);
        ctx.fillText('• 画面長押し: 連続攻撃', indentMargin, canvas.height * 0.57);
        
        // Game rules
        ctx.fillText('【ゲームルール】', leftMargin, canvas.height * 0.62);
        ctx.fillText('• 30秒間敵を倒し続けるとボス出現', indentMargin, canvas.height * 0.67);
        ctx.fillText('• ボスを倒すとステージクリア', indentMargin, canvas.height * 0.72);
        ctx.fillText('• 全3ステージをクリアでゲームクリア', indentMargin, canvas.height * 0.77);
        
        // Start button (responsive)
        const buttonWidth = canvas.width * 0.19;
        const buttonHeight = canvas.height * 0.12;
        const buttonX = canvas.width / 2 - buttonWidth / 2;
        const buttonY = canvas.height * 0.83;
        
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        ctx.fillStyle = '#000';
        ctx.font = `${Math.max(16, canvas.height * 0.033)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('ゲーム開始', canvas.width / 2, buttonY + buttonHeight / 2 + 5);
    }

    renderGameUI() {
        // Score
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${score}`, canvas.width - 150, 30);
        
        // Lives
        ctx.fillText('Lives:', 10, 30);
        for (let i = 0; i < lives; i++) {
            if (player.image.complete) {
                ctx.drawImage(player.image, 70 + i * 30, 10, 20, 20);
            }
        }
        
        // Stage
        ctx.fillText(`Stage: ${currentStage}`, 10, 60);
        
        // Boss HP bar
        if (gameState === GameState.BOSS && maxBossHP > 0) {
            const barWidth = 200;
            const barHeight = 20;
            const barX = canvas.width / 2 - barWidth / 2;
            const barY = 50;
            
            ctx.fillStyle = '#666';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            const hpRatio = bossHP / maxBossHP;
            ctx.fillStyle = hpRatio > 0.5 ? '#00ff00' : hpRatio > 0.25 ? '#ffff00' : '#ff0000';
            ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
            
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('BOSS', canvas.width / 2, barY - 5);
        }
    }

    renderStageClear() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.max(24, canvas.height * 0.06)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(`第${currentStage}ステージクリア`, canvas.width / 2, canvas.height * 0.33);
        
        // Special congratulations message for stage 3
        if (currentStage === 3) {
            ctx.font = `${Math.max(20, canvas.height * 0.047)}px Arial`;
            ctx.fillText('🎉おめでとうございます🎉', canvas.width / 2, canvas.height * 0.42);
            ctx.font = `${Math.max(18, canvas.height * 0.04)}px Arial`;
            ctx.fillText('全ステージクリア！', canvas.width / 2, canvas.height * 0.48);
        } else {
            ctx.fillText('おめでとう！', canvas.width / 2, canvas.height * 0.42);
        }
        
        // Next stage button (responsive)
        const button1Width = canvas.width * 0.225;
        const buttonHeight = canvas.height * 0.12;
        const button1X = canvas.width * 0.275;
        const buttonY = canvas.height * 0.67;
        
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(button1X, buttonY, button1Width, buttonHeight);
        ctx.fillStyle = '#000';
        ctx.font = `${Math.max(14, canvas.height * 0.027)}px Arial`;
        if (currentStage === 1) {
            ctx.fillText('第２ステージにすすむ', button1X + button1Width / 2, buttonY + buttonHeight / 2 + 5);
        } else if (currentStage === 2) {
            ctx.fillText('第３ステージにすすむ', button1X + button1Width / 2, buttonY + buttonHeight / 2 + 5);
        } else if (currentStage === 3) {
            ctx.fillText('エンディングへ', button1X + button1Width / 2, buttonY + buttonHeight / 2 + 5);
        }
        
        // Return to start button (responsive)
        const button2Width = canvas.width * 0.2;
        const button2X = canvas.width * 0.525;
        
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(button2X, buttonY, button2Width, buttonHeight);
        ctx.fillStyle = '#000';
        ctx.font = `${Math.max(14, canvas.height * 0.027)}px Arial`;
        ctx.fillText('スタートに戻る', button2X + button2Width / 2, buttonY + buttonHeight / 2 + 5);
    }

    renderGameClear() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw omedeto image (responsive sizing)
        if (omedetoImage.complete) {
            const maxWidth = canvas.width * 0.5;
            const maxHeight = canvas.height * 0.42;
            const imageAspectRatio = omedetoImage.width / omedetoImage.height;
            
            let displayWidth = maxWidth;
            let displayHeight = maxWidth / imageAspectRatio;
            
            // If height exceeds maximum, scale down
            if (displayHeight > maxHeight) {
                displayHeight = maxHeight;
                displayWidth = maxHeight * imageAspectRatio;
            }
            
            const imgX = canvas.width / 2 - displayWidth / 2;
            const imgY = canvas.height * 0.083;
            ctx.drawImage(omedetoImage, imgX, imgY, displayWidth, displayHeight);
        }
        
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.max(32, canvas.height * 0.08)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('GAME CLEAR!', canvas.width / 2, canvas.height * 0.67);
        
        ctx.font = `${Math.max(18, canvas.height * 0.04)}px Arial`;
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height * 0.75);
        
        // Restart button (responsive)
        const buttonWidth = canvas.width * 0.19;
        const buttonHeight = canvas.height * 0.12;
        const buttonX = canvas.width / 2 - buttonWidth / 2;
        const buttonY = canvas.height * 0.83;
        
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        ctx.fillStyle = '#000';
        ctx.font = `${Math.max(16, canvas.height * 0.03)}px Arial`;
        ctx.fillText('スタートに戻る', canvas.width / 2, buttonY + buttonHeight / 2 + 5);
    }

    renderGameOver() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.max(32, canvas.height * 0.08)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height * 0.33);
        
        ctx.font = `${Math.max(18, canvas.height * 0.04)}px Arial`;
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height * 0.5);
        
        // Restart button (responsive)
        const buttonWidth = canvas.width * 0.19;
        const buttonHeight = canvas.height * 0.12;
        const buttonX = canvas.width / 2 - buttonWidth / 2;
        const buttonY = canvas.height * 0.67;
        
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        ctx.fillStyle = '#000';
        ctx.font = `${Math.max(16, canvas.height * 0.03)}px Arial`;
        ctx.fillText('スタートに戻る', canvas.width / 2, buttonY + buttonHeight / 2 + 5);
    }
}

// Game Functions
function startGame() {
    gameState = GameState.PLAYING;
    score = 0;
    lives = 3;
    currentStage = 1;
    stageTimer = 0;
    gameObjects = [];
    scrollOffset = 0;
    
    // Create player
    player = new Player();
    gameObjects.push(player);
    
    // Start spawning enemies
    enemySpawnTimer = 0;
}

function nextStage() {
    if (currentStage >= 3) {
        // Go to game clear screen after stage 3
        gameState = GameState.GAME_CLEAR;
    } else {
        currentStage++;
        stageTimer = 0;
        lives = 3; // Reset lives to 3 after each stage clear
        gameState = GameState.PLAYING;
        gameObjects = gameObjects.filter(obj => obj instanceof Player);
        enemySpawnTimer = 0;
    }
}

function restartGame() {
    gameState = GameState.TITLE;
    gameObjects = [];
    currentStage = 1;
    score = 0;
    lives = 3;
    stageTimer = 0;
    bossHP = 0;
    maxBossHP = 0;
}

function spawnBoss() {
    const boss = new Boss(currentStage);
    gameObjects.push(boss);
}

function spawnEnemy() {
    const x = canvas.width;
    const y = Math.random() * (canvas.height - 100);
    const enemy = new Enemy(x, y, currentStage);
    gameObjects.push(enemy);
}

function updateCollisions() {
    const player = gameObjects.find(obj => obj instanceof Player);
    if (!player || player.invulnerable) return;
    
    const playerBullets = gameObjects.filter(obj => obj instanceof PlayerBullet);
    const enemyBullets = gameObjects.filter(obj => obj instanceof EnemyBullet);
    const enemies = gameObjects.filter(obj => obj instanceof Enemy);
    const bosses = gameObjects.filter(obj => obj instanceof Boss);
    
    // Player vs Enemy bullets
    enemyBullets.forEach(bullet => {
        if (bullet.collidesWith(player)) {
            bullet.active = false;
            player.hit();
        }
    });
    
    // Player vs Enemies
    enemies.forEach(enemy => {
        if (enemy.collidesWith(player)) {
            enemy.active = false;
            player.hit();
        }
    });
    
    // Player vs Boss
    bosses.forEach(boss => {
        if (boss.collidesWith(player)) {
            player.hit();
        }
    });
    
    // Player bullets vs Enemies
    playerBullets.forEach(bullet => {
        enemies.forEach(enemy => {
            if (bullet.collidesWith(enemy)) {
                bullet.active = false;
                enemy.hit();
            }
        });
    });
    
    // Player bullets vs Boss
    playerBullets.forEach(bullet => {
        bosses.forEach(boss => {
            if (bullet.collidesWith(boss)) {
                bullet.active = false;
                boss.hit();
            }
        });
    });
}

// Game Loop
let player;
let background;
let ui;
let input;
let enemySpawnTimer = 0;
let enemySpawnInterval = 1500;

function init() {
    input = new InputHandler();
    background = new Background();
    ui = new UI();
    
    gameLoop();
}

function gameLoop(currentTime = 0) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update background
    background.update(deltaTime);
    background.render();
    
    // Update stage timer and spawn enemies
    if (gameState === GameState.PLAYING) {
        stageTimer += deltaTime;
        
        // Check if 30 seconds have passed to spawn boss
        if (stageTimer >= 30000) {
            // Clear all enemies
            gameObjects = gameObjects.filter(obj => !(obj instanceof Enemy));
            gameState = GameState.BOSS;
            spawnBoss();
        } else {
            // Spawn enemies
            enemySpawnTimer += deltaTime;
            const currentSpawnInterval = enemySpawnInterval - (currentStage - 1) * 300; // Slightly faster spawn with higher stages
            if (enemySpawnTimer >= currentSpawnInterval) {
                spawnEnemy();
                enemySpawnTimer = 0;
            }
        }
    }
    
    // Update game objects (only during playing states)
    if (gameState === GameState.PLAYING || gameState === GameState.BOSS) {
        gameObjects.forEach(obj => {
            if (obj.active) {
                obj.update(deltaTime);
            }
        });
        
        // Remove inactive objects
        gameObjects = gameObjects.filter(obj => obj.active);
        
        // Update collisions
        updateCollisions();
    }
    
    // Render game objects
    gameObjects.forEach(obj => {
        if (obj.active) {
            obj.render();
        }
    });
    
    // Render UI
    ui.render();
    
    requestAnimationFrame(gameLoop);
}

// Initialize game
init();