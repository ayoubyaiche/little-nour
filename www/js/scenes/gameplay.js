/* ===================================================
   Gameplay Scene — Full planet gameplay loop
   =================================================== */

const GameplayScene = {
    _name: 'gameplay',
    // State
    phase: 'arrival', // arrival, intro, drawing, success, departure
    phaseTimer: 0,
    planetIndex: 0,
    planetData: null,
    hintIndex: 0,
    attemptNumber: 0,
    earnedStars: 0,
    totalStarsThisPlanet: 0,

    // Objects
    creature: null,
    nour: null,
    drawingCanvas: null,
    gestureRecognizer: null,
    particles: null,
    stars: [],

    // UI
    time: 0,
    showReward: false,
    rewardTimer: 0,
    rewardStars: 0,

    // Ambient
    ambientParticles: [],
    ambientTimer: 0,

    enter(data) {
        this.planetIndex = data.planetIndex || 0;
        this.planetData = PlanetData.getPlanet(this.planetIndex);
        this.phase = 'arrival';
        this.phaseTimer = 0;
        this.hintIndex = 0;
        this.attemptNumber = 0;
        this.totalStarsThisPlanet = 0;
        this.time = 0;
        this.showReward = false;
        this.rewardTimer = 0;

        this.stars = Renderer.generateStars(60);
        this.particles = new ParticleSystem();
        this.gestureRecognizer = new GestureRecognizer();

        const canvas = document.getElementById('gameCanvas');
        const w = canvas.width;
        const h = canvas.height;

        // Create creature
        const creatureSize = Math.min(w, h) * 0.14;
        this.creature = new Creature(
            this.planetData.creatureType,
            this.planetData.creatureColors,
            w * 0.65, h * 0.45,
            creatureSize
        );

        // Create Nour
        this.nour = new Nour(w * 0.2, h * 0.55, Math.min(w, h) * 0.1);

        // Create drawing canvas
        this.drawingCanvas = new DrawingCanvas(this.gestureRecognizer);
        const canvasSize = Math.min(w * 0.55, h * 0.45);
        this.drawingCanvas.setBounds(
            w / 2 - canvasSize / 2,
            h * 0.15,
            canvasSize,
            canvasSize
        );

        // Drawing result handler
        this.drawingCanvas.onResult((result) => this._onDrawResult(result));

        // Ambient particles
        this.ambientParticles = [];
    },

    update(dt) {
        this.time += dt;
        this.phaseTimer += dt;
        this.particles.update(dt);

        if (this.creature) this.creature.update(dt);
        if (this.nour) this.nour.update(dt);
        if (this.drawingCanvas) this.drawingCanvas.update(dt);

        // Ambient particle emission
        this.ambientTimer += dt;
        if (this.ambientTimer > 0.5 && this.planetData.ambientParticles) {
            this.ambientTimer = 0;
            const canvas = document.getElementById('gameCanvas');
            const ap = this.planetData.ambientParticles;
            this.particles.emitTrail(
                MathUtils.randFloat(0, canvas.width),
                MathUtils.randFloat(canvas.height * 0.3, canvas.height),
                1,
                { colors: ap.colors }
            );
        }

        // Reward animation
        if (this.showReward) {
            this.rewardTimer += dt;
        }

        // Phase logic
        switch (this.phase) {
            case 'arrival':
                if (this.phaseTimer > 2) {
                    this._setPhase('intro');
                }
                break;

            case 'intro':
                if (this.phaseTimer > 0.5) {
                    this.creature.setState('showHint');
                }
                if (this.phaseTimer > 1.5) {
                    this._setPhase('drawing');
                    this._startDrawing();
                }
                break;

            case 'success':
                if (this.phaseTimer > 2.5) {
                    // Check if more hints remain
                    if (this.hintIndex < this.planetData.hints.length - 1) {
                        this.hintIndex++;
                        this.attemptNumber = 0;
                        this.showReward = false;
                        this._setPhase('intro');
                        this.creature.setState('idle');
                    } else {
                        this._setPhase('departure');
                    }
                }
                break;

            case 'departure':
                if (this.phaseTimer > 0.5 && this.nour.state !== 'flying') {
                    const canvas = document.getElementById('gameCanvas');
                    this.nour.startFly(this.nour.x, this.nour.y, canvas.width + 100, -50);
                    if (window.game && window.game.audio) window.game.audio.playWhoosh();
                }
                if (this.phaseTimer > 3) {
                    // Save progress
                    const keepsake = this.planetData.keepsake;
                    SaveSystem.completePlanet(
                        this.planetIndex,
                        this.totalStarsThisPlanet,
                        keepsake.id,
                        null
                    );
                    window.game.sceneManager.switchTo('planetMap');
                }
                break;
        }
    },

    _setPhase(phase) {
        this.phase = phase;
        this.phaseTimer = 0;
    },

    _startDrawing() {
        const saveData = SaveSystem.load();
        const hint = this.planetData.hints[this.hintIndex];
        this.drawingCanvas.startChallenge(
            hint.shape,
            this.attemptNumber,
            saveData.settings.assistMode
        );
        this.nour.setState('drawing');
        this.creature.setState('waitForDraw');
    },

    _onDrawResult(result) {
        if (result.success) {
            this.earnedStars = result.stars;
            this.totalStarsThisPlanet = Math.max(this.totalStarsThisPlanet, result.stars);

            this.creature.setState('reactSuccess');
            this.nour.setState('happy');
            this.drawingCanvas.endChallenge();

            // Celebration!
            const canvas = document.getElementById('gameCanvas');
            this.particles.emitCelebration(canvas.width / 2, canvas.height / 2);

            if (window.game && window.game.audio) {
                window.game.audio.playSuccess();
                setTimeout(() => {
                    if (window.game && window.game.audio) window.game.audio.playStarCollect();
                }, 500);
            }

            this.showReward = true;
            this.rewardTimer = 0;
            this.rewardStars = result.stars;

            this._setPhase('success');

        } else {
            // Retry
            this.attemptNumber++;
            this.creature.setState('reactRetry');
            if (window.game && window.game.audio) window.game.audio.playRetry();

            // Restart drawing with escalated hints
            setTimeout(() => {
                if (this.phase === 'drawing') {
                    this._startDrawing();
                    this.creature.setState('showHint');
                }
            }, 1200);
        }
    },

    render(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        const biome = this.planetData.biome;

        // Background gradient (biome-specific)
        Renderer.clearWithGradient(ctx, w, h, biome.bgTop, biome.bgBottom);

        // Stars
        Renderer.drawStarfield(ctx, w, h, this.stars, this.time);

        // Ground
        this._renderGround(ctx, w, h, biome);

        // Planet sphere in background
        Renderer.drawPlanet(ctx, w * 0.85, h * 0.15, Math.min(w, h) * 0.08,
            biome.planetColor1, biome.planetColor2, biome.glowColor);

        // Ambient particles
        this.particles.render(ctx);

        // Creature
        if (this.creature) this.creature.render(ctx);

        // Nour
        if (this.nour) this.nour.render(ctx);

        // Drawing canvas
        if (this.phase === 'drawing') {
            this.drawingCanvas.render(ctx);
        }

        // Phase-specific overlays
        this._renderPhaseOverlay(ctx, w, h);

        // Reward popup
        if (this.showReward) {
            this._renderRewardPopup(ctx, w, h);
        }

        // HUD
        this._renderHUD(ctx, w, h);
    },

    _renderGround(ctx, w, h, biome) {
        const groundY = h * 0.7;

        // Ground fill
        ctx.fillStyle = biome.groundColor;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        // Gentle curve
        ctx.quadraticCurveTo(w * 0.25, groundY - 15, w * 0.5, groundY + 5);
        ctx.quadraticCurveTo(w * 0.75, groundY + 20, w, groundY - 5);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();

        // Ground highlight
        ctx.fillStyle = biome.groundHighlight;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(0, groundY + 5);
        ctx.quadraticCurveTo(w * 0.3, groundY - 5, w * 0.6, groundY + 10);
        ctx.quadraticCurveTo(w * 0.8, groundY + 25, w, groundY + 5);
        ctx.lineTo(w, groundY + 30);
        ctx.lineTo(0, groundY + 30);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
    },

    _renderPhaseOverlay(ctx, w, h) {
        switch (this.phase) {
            case 'arrival': {
                // Planet name reveal
                const alpha = MathUtils.clamp(this.phaseTimer / 0.5, 0, 1);
                ctx.save();
                ctx.globalAlpha = alpha;
                Renderer.drawText(ctx, this.planetData.name, w / 2, h * 0.1,
                    `800 ${Math.round(Math.min(w * 0.07, 36))}px 'Nunito', sans-serif`,
                    this.planetData.biome.accentColor);
                Renderer.drawText(ctx, `Meet Ayoub! 👨`, w / 2, h * 0.16,
                    `600 ${Math.round(Math.min(w * 0.04, 20))}px 'Nunito', sans-serif`,
                    'rgba(255,255,255,0.7)');
                ctx.restore();
                break;
            }

            case 'intro': {
                // Hint description
                const hint = this.planetData.hints[this.hintIndex];
                const alpha = MathUtils.clamp(this.phaseTimer / 0.5, 0, 1);
                ctx.save();
                ctx.globalAlpha = alpha * 0.8;
                Renderer.drawText(ctx, hint.description, w / 2, h * 0.1,
                    `600 ${Math.round(Math.min(w * 0.04, 20))}px 'Nunito', sans-serif`,
                    '#FFD700');
                ctx.restore();
                break;
            }

            case 'drawing': {
                // Shape name + hint count
                const hint = this.planetData.hints[this.hintIndex];
                Renderer.drawText(ctx, hint.description, w / 2, h * 0.08,
                    `600 ${Math.round(Math.min(w * 0.035, 18))}px 'Nunito', sans-serif`,
                    'rgba(255,255,255,0.6)');

                // Progress dots
                const dotY = h * 0.12;
                const totalHints = this.planetData.hints.length;
                for (let i = 0; i < totalHints; i++) {
                    ctx.fillStyle = i <= this.hintIndex ? '#FFD700' : 'rgba(255,255,255,0.3)';
                    ctx.beginPath();
                    ctx.arc(w / 2 + (i - (totalHints - 1) / 2) * 18, dotY, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            }

            case 'departure': {
                const alpha = MathUtils.clamp(this.phaseTimer / 1, 0, 1);
                ctx.save();
                ctx.globalAlpha = alpha;
                Renderer.drawText(ctx, '🌟 Planet Complete! 🌟', w / 2, h * 0.1,
                    `800 ${Math.round(Math.min(w * 0.06, 32))}px 'Nunito', sans-serif`,
                    '#FFD700');
                ctx.restore();
                break;
            }
        }
    },

    _renderRewardPopup(ctx, w, h) {
        const scale = MathUtils.easeOutElastic(MathUtils.clamp(this.rewardTimer / 0.5, 0, 1));

        ctx.save();
        ctx.translate(w / 2, h * 0.35);
        ctx.scale(scale, scale);

        // Background
        ctx.fillStyle = 'rgba(20, 10, 40, 0.85)';
        Renderer.roundedRect(ctx, -110, -60, 220, 120, 20);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 2;
        Renderer.roundedRect(ctx, -110, -60, 220, 120, 20);
        ctx.stroke();

        // Stars
        const starSize = 20;
        for (let i = 0; i < 3; i++) {
            const sx = (i - 1) * 40;
            const sy = -15;
            const earned = i < this.rewardStars;

            ctx.save();
            if (earned) {
                const delay = i * 0.15;
                const starScale = MathUtils.clamp((this.rewardTimer - 0.3 - delay) * 4, 0, 1);
                ctx.globalAlpha = starScale;
                ctx.scale(1 + (1 - starScale) * 0.5, 1 + (1 - starScale) * 0.5);
                ctx.fillStyle = '#FFD700';
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
            }
            Renderer.drawStar(ctx, sx, sy, starSize, starSize * 0.4, 5);
            ctx.fill();
            ctx.restore();
        }

        // Text
        ctx.font = `700 16px 'Nunito', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText('Great Drawing!', 0, 35);

        // Keepsake
        if (this.rewardTimer > 0.8) {
            ctx.font = '24px sans-serif';
            ctx.fillText(this.planetData.keepsake.icon, 0, -40);
        }

        ctx.restore();
    },

    _renderHUD(ctx, w, h) {
        // Back button
        const btnW = Math.min(w * 0.18, 80);
        const btnH = Math.min(h * 0.06, 35);
        this._backBtn = { x: 10, y: 10, w: btnW, h: btnH };
        Renderer.drawButton(ctx, 10, 10, btnW, btnH, '←', 'rgba(100,100,150,0.5)', '#fff',
            Math.min(btnH * 0.5, 18));

        // Planet name (small)
        ctx.font = `600 ${Math.round(Math.min(w * 0.03, 14))}px 'Nunito', sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText(this.planetData.name, w - 15, 25);
    },

    handleInput(type, x, y) {
        // Drawing canvas gets priority
        if (this.phase === 'drawing' && this.drawingCanvas) {
            this.drawingCanvas.handleInput(type, x, y);
        }

        if (type === 'up') {
            // Back button
            if (this._backBtn && MathUtils.pointInRect(x, y, this._backBtn.x, this._backBtn.y, this._backBtn.w, this._backBtn.h)) {
                if (window.game && window.game.audio) window.game.audio.playClick();
                window.game.sceneManager.switchTo('planetMap');
            }
        }
    },

    exit() {
        this.creature = null;
        this.nour = null;
        this.drawingCanvas = null;
        this.particles = null;
    }
};
