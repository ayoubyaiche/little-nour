/* ===================================================
   Menu Scene — Animated title screen
   =================================================== */

const MenuScene = {
    _name: 'menu',
    stars: [],
    time: 0,
    buttons: [],
    hoveredBtn: -1,
    titleBob: 0,
    nour: null,
    particles: null,
    floatingPlanets: [],

    enter(data) {
        this.time = 0;
        this.stars = Renderer.generateStars(120);
        this.hoveredBtn = -1;
        this.particles = new ParticleSystem();

        // Floating mini-planets for decoration
        this.floatingPlanets = [];
        for (let i = 0; i < 5; i++) {
            this.floatingPlanets.push({
                x: MathUtils.randFloat(0.1, 0.9),
                y: MathUtils.randFloat(0.15, 0.85),
                r: MathUtils.randFloat(8, 25),
                speed: MathUtils.randFloat(0.3, 0.8),
                phase: MathUtils.randFloat(0, Math.PI * 2),
                color1: MathUtils.randChoice(['#FF8C69', '#87CEEB', '#DDA0DD', '#98FB98', '#FFD700']),
                color2: MathUtils.randChoice(['#FF6347', '#4682B4', '#9370DB', '#3CB371', '#FFA500']),
                glow: MathUtils.randChoice(['#FF8C69', '#87CEEB', '#DDA0DD', '#98FB98', '#FFD700'])
            });
        }

        // Play menu music
        if (window.game && window.game.audio) {
            window.game.audio.playMenuMusic();
        }
    },

    update(dt) {
        this.time += dt;
        this.titleBob = Math.sin(this.time * 1.5) * 8;
        this.particles.update(dt);

        // Occasional sparkle
        if (Math.random() < 0.03) {
            const canvas = document.getElementById('gameCanvas');
            this.particles.emitSparkle(
                MathUtils.randFloat(50, canvas.width - 50),
                MathUtils.randFloat(50, canvas.height - 50),
                MathUtils.randChoice(['#FFD700', '#FF69B4', '#87CEEB'])
            );
        }
    },

    render(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        // Background gradient
        Renderer.clearWithGradient(ctx, w, h, '#0a0a2e', '#1a0a3e');

        // Stars
        Renderer.drawStarfield(ctx, w, h, this.stars, this.time);

        // Floating planets
        for (const p of this.floatingPlanets) {
            const px = p.x * w + Math.sin(this.time * p.speed + p.phase) * 15;
            const py = p.y * h + Math.cos(this.time * p.speed * 0.7 + p.phase) * 10;
            Renderer.drawPlanet(ctx, px, py, p.r, p.color1, p.color2, p.glow);
        }

        // Particles
        this.particles.render(ctx);

        // === Title ===
        const titleY = h * 0.18 + this.titleBob;
        const fontSize = Math.min(w * 0.12, 72);

        // Title glow
        Renderer.drawGlow(ctx, w / 2, titleY, fontSize * 2.5, '#FF69B4', 0.15);

        // Title text
        ctx.save();
        ctx.font = `800 ${Math.round(fontSize)}px 'Nunito', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Text gradient
        const titleGrad = ctx.createLinearGradient(w / 2 - 150, titleY, w / 2 + 150, titleY);
        titleGrad.addColorStop(0, '#FFB6C1');
        titleGrad.addColorStop(0.5, '#FFD700');
        titleGrad.addColorStop(1, '#FF69B4');

        ctx.shadowColor = 'rgba(255, 105, 180, 0.6)';
        ctx.shadowBlur = 20;
        ctx.fillStyle = titleGrad;
        ctx.fillText('Little Nour', w / 2, titleY);

        // Subtitle
        ctx.font = `600 ${Math.round(fontSize * 0.3)}px 'Nunito', sans-serif`;
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(255, 228, 181, 0.8)';
        ctx.fillText('✨ A Drawing Adventure ✨', w / 2, titleY + fontSize * 0.55);
        ctx.restore();

        // === Nour character preview ===
        const nourPreview = new Nour(w / 2, h * 0.42, Math.min(w, h) * 0.12);
        nourPreview.stateTimer = this.time;
        nourPreview.bobOffset = Math.sin(this.time * 2) * 6;
        nourPreview.render(ctx);

        // === Buttons ===
        const btnW = Math.min(w * 0.55, 280);
        const btnH = Math.min(h * 0.08, 55);
        const btnX = w / 2 - btnW / 2;
        const btnGap = btnH * 1.4;
        const btnStartY = h * 0.56;

        this.buttons = [
            { x: btnX, y: btnStartY, w: btnW, h: btnH, text: '🚀  Play', action: 'play',
              bg: 'rgba(255, 105, 180, 0.7)', textColor: '#fff' },
            { x: btnX, y: btnStartY + btnGap, w: btnW, h: btnH, text: '📖  Sketchbook', action: 'sketchbook',
              bg: 'rgba(100, 149, 237, 0.7)', textColor: '#fff' },
            { x: btnX, y: btnStartY + btnGap * 2, w: btnW, h: btnH, text: '⚙️  Settings', action: 'settings',
              bg: 'rgba(147, 112, 219, 0.6)', textColor: '#fff' }
        ];

        for (let i = 0; i < this.buttons.length; i++) {
            const btn = this.buttons[i];
            const hovered = this.hoveredBtn === i;
            Renderer.drawButton(ctx, btn.x, btn.y, btn.w, btn.h, btn.text,
                btn.bg, btn.textColor, Math.min(btnH * 0.42, 22), hovered);
        }

        // === Credits line ===
        ctx.font = `400 ${Math.round(12)}px 'Nunito', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillText('Made with ♥', w / 2, h - 20);
    },

    handleInput(type, x, y) {
        if (type === 'hover') {
            this.hoveredBtn = -1;
            for (let i = 0; i < this.buttons.length; i++) {
                const b = this.buttons[i];
                if (MathUtils.pointInRect(x, y, b.x, b.y, b.w, b.h)) {
                    this.hoveredBtn = i;
                    break;
                }
            }
        }

        if (type === 'up') {
            for (let i = 0; i < this.buttons.length; i++) {
                const b = this.buttons[i];
                if (MathUtils.pointInRect(x, y, b.x, b.y, b.w, b.h)) {
                    if (window.game && window.game.audio) window.game.audio.playClick();
                    switch (b.action) {
                        case 'play':
                            window.game.sceneManager.switchTo('planetMap');
                            break;
                        case 'sketchbook':
                            window.game.sceneManager.switchTo('sketchbook');
                            break;
                        case 'settings':
                            this._toggleAssistMode();
                            break;
                    }
                }
            }
        }
    },

    _toggleAssistMode() {
        const data = SaveSystem.load();
        data.settings.assistMode = !data.settings.assistMode;
        SaveSystem.save(data);
        // Visual feedback - quick sparkle
        if (this.particles) {
            const canvas = document.getElementById('gameCanvas');
            this.particles.emitSparkle(canvas.width / 2, canvas.height * 0.8);
        }
    },

    exit() {
        this.particles = null;
    }
};
