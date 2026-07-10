/* ===================================================
   Planet Map Scene — Starfield overworld navigation
   =================================================== */

const PlanetMapScene = {
    _name: 'planetMap',
    stars: [],
    time: 0,
    planets: [],
    hoveredPlanet: -1,
    particles: null,
    saveData: null,
    backBtn: null,
    nourOnMap: null,

    enter(data) {
        this.time = 0;
        this.stars = Renderer.generateStars(100);
        this.hoveredPlanet = -1;
        this.particles = new ParticleSystem();
        this.saveData = SaveSystem.load();
        this._buildPlanetLayout();
    },

    _buildPlanetLayout() {
        const canvas = document.getElementById('gameCanvas');
        const w = canvas.width;
        const h = canvas.height;

        this.planets = [];
        const total = PlanetData.totalPlanets;

        // Arrange in a gentle arc/wave
        for (let i = 0; i < total; i++) {
            const pData = PlanetData.getPlanet(i);
            const t = (i + 0.5) / total;
            const px = w * 0.12 + t * w * 0.76;
            const py = h * 0.45 + Math.sin(t * Math.PI * 1.5 + 0.5) * h * 0.15;
            const r = Math.min(w, h) * 0.055;

            this.planets.push({
                x: px,
                y: py,
                r: r,
                data: pData,
                index: i,
                unlocked: this.saveData.unlockedPlanets.includes(i),
                completed: this.saveData.completedPlanets.includes(i),
                stars: this.saveData.stars[i] || 0,
                bobPhase: Math.random() * Math.PI * 2
            });
        }

        // Nour position on map (at last completed or first unlocked)
        const lastUnlocked = Math.max(...this.saveData.unlockedPlanets);
        const idx = Math.min(lastUnlocked, this.planets.length - 1);
        this.nourOnMap = new Nour(this.planets[idx].x, this.planets[idx].y - this.planets[idx].r - 30,
            Math.min(w, h) * 0.06);
    },

    update(dt) {
        this.time += dt;
        this.particles.update(dt);

        if (this.nourOnMap) {
            this.nourOnMap.update(dt);
        }
    },

    render(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        // Background
        Renderer.clearWithGradient(ctx, w, h, '#0a0a2e', '#15103a');
        Renderer.drawStarfield(ctx, w, h, this.stars, this.time);

        // Title
        Renderer.drawText(ctx, '🌌 Galaxy Map', w / 2, h * 0.06,
            `700 ${Math.round(Math.min(w * 0.055, 30))}px 'Nunito', sans-serif`, '#E6E6FA');

        // Total stars
        const totalStars = this.saveData.totalStars || 0;
        Renderer.drawText(ctx, `⭐ ${totalStars}`, w - 60, h * 0.06,
            `700 ${Math.round(Math.min(w * 0.04, 22))}px 'Nunito', sans-serif`, '#FFD700');

        // Draw paths between planets
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.15)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        for (let i = 0; i < this.planets.length - 1; i++) {
            const a = this.planets[i];
            const b = this.planets[i + 1];
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            // Curved path
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2 - 30;
            ctx.quadraticCurveTo(midX, midY, b.x, b.y);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.restore();

        // Draw planets
        for (let i = 0; i < this.planets.length; i++) {
            const p = this.planets[i];
            const bob = Math.sin(this.time * 0.8 + p.bobPhase) * 4;
            const px = p.x;
            const py = p.y + bob;
            const hovered = this.hoveredPlanet === i;

            if (p.unlocked) {
                // Render planet
                const displayR = hovered ? p.r * 1.15 : p.r;
                Renderer.drawPlanet(ctx, px, py, displayR,
                    p.data.biome.planetColor1, p.data.biome.planetColor2, p.data.biome.glowColor);

                // Name label
                ctx.save();
                ctx.font = `600 ${Math.round(Math.min(p.r * 0.45, 14))}px 'Nunito', sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillStyle = '#fff';
                ctx.shadowColor = 'rgba(0,0,0,0.7)';
                ctx.shadowBlur = 4;
                ctx.fillText(p.data.name, px, py + p.r + 16);
                ctx.restore();

                // Stars earned
                if (p.stars > 0) {
                    const starStr = '⭐'.repeat(p.stars) + '☆'.repeat(3 - p.stars);
                    ctx.font = `${Math.round(Math.min(p.r * 0.35, 11))}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.fillText(starStr, px, py + p.r + 30);
                }

                // Completed checkmark
                if (p.completed) {
                    ctx.save();
                    ctx.font = `${Math.round(p.r * 0.5)}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('✅', px + p.r * 0.7, py - p.r * 0.7);
                    ctx.restore();
                }

                // Creature icon peek
                ctx.save();
                ctx.globalAlpha = hovered ? 1 : 0.7;
                ctx.font = `${Math.round(p.r * 0.6)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const creatureEmoji = this._getCreatureEmoji(p.data.creatureType);
                ctx.fillText(creatureEmoji, px, py);
                ctx.restore();

            } else {
                // Locked planet — silhouette
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = '#4a4a6a';
                ctx.beginPath();
                ctx.arc(px, py, p.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 0.5;
                ctx.font = `${Math.round(p.r * 0.7)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🔒', px, py);
                ctx.restore();

                // Name hidden
                ctx.save();
                ctx.font = `600 ${Math.round(Math.min(p.r * 0.4, 13))}px 'Nunito', sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillText('???', px, py + p.r + 16);
                ctx.restore();
            }
        }

        // Draw Nour on map
        if (this.nourOnMap) {
            this.nourOnMap.render(ctx);
        }

        // Particles
        this.particles.render(ctx);

        // Back button
        const backBtnW = Math.min(w * 0.2, 100);
        const backBtnH = Math.min(h * 0.06, 40);
        this.backBtn = { x: 15, y: h - backBtnH - 15, w: backBtnW, h: backBtnH };
        Renderer.drawButton(ctx, this.backBtn.x, this.backBtn.y, this.backBtn.w, this.backBtn.h,
            '← Back', 'rgba(100,100,150,0.6)', '#fff', Math.min(backBtnH * 0.45, 16));
    },

    _getCreatureEmoji(type) {
        // Ayoub is on every planet — show man emoji
        return '👨';
    },

    handleInput(type, x, y) {
        if (type === 'hover') {
            this.hoveredPlanet = -1;
            for (let i = 0; i < this.planets.length; i++) {
                const p = this.planets[i];
                if (MathUtils.pointInCircle(x, y, p.x, p.y, p.r * 1.5)) {
                    this.hoveredPlanet = i;
                    break;
                }
            }
        }

        if (type === 'up') {
            // Back button
            if (this.backBtn && MathUtils.pointInRect(x, y, this.backBtn.x, this.backBtn.y, this.backBtn.w, this.backBtn.h)) {
                if (window.game && window.game.audio) window.game.audio.playClick();
                window.game.sceneManager.switchTo('menu');
                return;
            }

            // Planet click
            for (let i = 0; i < this.planets.length; i++) {
                const p = this.planets[i];
                if (MathUtils.pointInCircle(x, y, p.x, p.y, p.r * 1.5)) {
                    if (p.unlocked) {
                        if (window.game && window.game.audio) window.game.audio.playClick();
                        window.game.sceneManager.switchTo('gameplay', { planetIndex: i });
                    } else {
                        // Wobble animation for locked planet
                        this.particles.emitSparkle(p.x, p.y, '#FF6347');
                        if (window.game && window.game.audio) window.game.audio.playRetry();
                    }
                    break;
                }
            }
        }
    },

    exit() {
        this.particles = null;
    }
};
