/* ===================================================
   Sketchbook Scene — Drawing journal & keepsake display
   =================================================== */

const SketchbookScene = {
    _name: 'sketchbook',
    time: 0,
    stars: [],
    saveData: null,
    pages: [],
    currentPage: 0,
    backBtn: null,
    prevBtn: null,
    nextBtn: null,
    particles: null,

    enter(data) {
        this.time = 0;
        this.stars = Renderer.generateStars(60);
        this.saveData = SaveSystem.load();
        this.currentPage = 0;
        this.particles = new ParticleSystem();
        this._buildPages();
    },

    _buildPages() {
        this.pages = [];

        // Build pages from completed planets
        for (let i = 0; i < PlanetData.totalPlanets; i++) {
            const planet = PlanetData.getPlanet(i);
            const completed = this.saveData.completedPlanets.includes(i);
            const stars = this.saveData.stars[i] || 0;
            const hasKeepsake = planet.keepsake && this.saveData.keepsakes.includes(planet.keepsake.id);

            this.pages.push({
                planetIndex: i,
                planetData: planet,
                completed,
                stars,
                hasKeepsake,
                drawings: this.saveData.drawings.filter(d => d.planetIdx === i)
            });
        }
    },

    update(dt) {
        this.time += dt;
        this.particles.update(dt);
    },

    render(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        // Background
        Renderer.clearWithGradient(ctx, w, h, '#1a0a2e', '#2a1a3e');
        Renderer.drawStarfield(ctx, w, h, this.stars, this.time);

        // Title
        Renderer.drawText(ctx, '📖 Sketchbook Journal', w / 2, h * 0.06,
            `700 ${Math.round(Math.min(w * 0.055, 28))}px 'Nunito', sans-serif`, '#FFE4B5');

        // Page counter
        ctx.font = `400 ${Math.round(Math.min(w * 0.03, 14))}px 'Nunito', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText(`Page ${this.currentPage + 1} of ${this.pages.length}`, w / 2, h * 0.11);

        // Current page
        if (this.pages.length > 0) {
            this._renderPage(ctx, w, h, this.pages[this.currentPage]);
        } else {
            Renderer.drawText(ctx, 'No drawings yet!', w / 2, h / 2,
                `600 ${Math.round(Math.min(w * 0.045, 22))}px 'Nunito', sans-serif`, 'rgba(255,255,255,0.5)');
            Renderer.drawText(ctx, 'Visit planets to fill your sketchbook ✨', w / 2, h * 0.55,
                `400 ${Math.round(Math.min(w * 0.03, 16))}px 'Nunito', sans-serif`, 'rgba(255,255,255,0.3)');
        }

        // Particles
        this.particles.render(ctx);

        // Navigation buttons
        const btnH = Math.min(h * 0.06, 40);
        const btnW = Math.min(w * 0.18, 80);

        // Back button
        this.backBtn = { x: 15, y: h - btnH - 15, w: btnW, h: btnH };
        Renderer.drawButton(ctx, this.backBtn.x, this.backBtn.y, this.backBtn.w, this.backBtn.h,
            '← Back', 'rgba(100,100,150,0.6)', '#fff', Math.min(btnH * 0.45, 16));

        // Prev/Next
        if (this.pages.length > 1) {
            this.prevBtn = { x: w / 2 - btnW - 10, y: h - btnH - 15, w: btnW, h: btnH };
            this.nextBtn = { x: w / 2 + 10, y: h - btnH - 15, w: btnW, h: btnH };

            if (this.currentPage > 0) {
                Renderer.drawButton(ctx, this.prevBtn.x, this.prevBtn.y, this.prevBtn.w, this.prevBtn.h,
                    '◀ Prev', 'rgba(147, 112, 219, 0.6)', '#fff', Math.min(btnH * 0.45, 16));
            }
            if (this.currentPage < this.pages.length - 1) {
                Renderer.drawButton(ctx, this.nextBtn.x, this.nextBtn.y, this.nextBtn.w, this.nextBtn.h,
                    'Next ▶', 'rgba(147, 112, 219, 0.6)', '#fff', Math.min(btnH * 0.45, 16));
            }
        }
    },

    _renderPage(ctx, w, h, page) {
        const pd = page.planetData;
        const centerX = w / 2;
        const pageW = Math.min(w * 0.85, 400);
        const pageH = Math.min(h * 0.65, 500);
        const pageX = centerX - pageW / 2;
        const pageY = h * 0.14;

        // Page background (like paper)
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 5;
        ctx.fillStyle = 'rgba(255, 248, 235, 0.95)';
        Renderer.roundedRect(ctx, pageX, pageY, pageW, pageH, 12);
        ctx.fill();
        ctx.restore();

        // Paper texture lines
        ctx.strokeStyle = 'rgba(200, 190, 170, 0.3)';
        ctx.lineWidth = 1;
        for (let ly = pageY + 40; ly < pageY + pageH - 20; ly += 25) {
            ctx.beginPath();
            ctx.moveTo(pageX + 20, ly);
            ctx.lineTo(pageX + pageW - 20, ly);
            ctx.stroke();
        }

        // Planet name header
        ctx.font = `700 ${Math.round(Math.min(pageW * 0.06, 22))}px 'Nunito', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = pd.biome.bgBottom;
        ctx.fillText(pd.name, centerX, pageY + 30);

        // Creature name
        ctx.font = `600 ${Math.round(Math.min(pageW * 0.04, 16))}px 'Nunito', sans-serif`;
        ctx.fillStyle = '#666';
        ctx.fillText(pd.creatureName, centerX, pageY + 52);

        // Mini creature drawing
        const miniCreature = new Creature(pd.creatureType, pd.creatureColors,
            centerX, pageY + pageH * 0.3, Math.min(pageW, pageH) * 0.12);
        miniCreature.stateTimer = this.time;
        miniCreature.update(0);
        miniCreature.render(ctx);

        // Status
        const statusY = pageY + pageH * 0.52;
        if (page.completed) {
            // Stars
            const starStr = '⭐'.repeat(page.stars) + '☆'.repeat(3 - page.stars);
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(starStr, centerX, statusY);

            // Keepsake
            if (page.hasKeepsake) {
                ctx.font = '28px sans-serif';
                ctx.fillText(pd.keepsake.icon, centerX, statusY + 35);
                ctx.font = `400 ${Math.round(Math.min(pageW * 0.035, 13))}px 'Nunito', sans-serif`;
                ctx.fillStyle = '#888';
                ctx.fillText(pd.keepsake.name, centerX, statusY + 55);
            }

            // Shape list
            ctx.font = `400 ${Math.round(Math.min(pageW * 0.035, 13))}px 'Nunito', sans-serif`;
            ctx.fillStyle = '#999';
            const shapes = pd.hints.map(h => h.shape).join(', ');
            ctx.fillText(`Shapes drawn: ${shapes}`, centerX, statusY + 80);

        } else {
            ctx.font = `600 ${Math.round(Math.min(pageW * 0.04, 16))}px 'Nunito', sans-serif`;
            ctx.fillStyle = '#bbb';
            ctx.fillText('Not yet visited...', centerX, statusY);
            ctx.font = '32px sans-serif';
            ctx.fillText('🔒', centerX, statusY + 40);
        }
    },

    handleInput(type, x, y) {
        if (type !== 'up') return;

        // Back
        if (this.backBtn && MathUtils.pointInRect(x, y, this.backBtn.x, this.backBtn.y, this.backBtn.w, this.backBtn.h)) {
            if (window.game && window.game.audio) window.game.audio.playClick();
            window.game.sceneManager.switchTo('menu');
            return;
        }

        // Prev
        if (this.prevBtn && this.currentPage > 0 &&
            MathUtils.pointInRect(x, y, this.prevBtn.x, this.prevBtn.y, this.prevBtn.w, this.prevBtn.h)) {
            this.currentPage--;
            if (window.game && window.game.audio) window.game.audio.playClick();
            return;
        }

        // Next
        if (this.nextBtn && this.currentPage < this.pages.length - 1 &&
            MathUtils.pointInRect(x, y, this.nextBtn.x, this.nextBtn.y, this.nextBtn.w, this.nextBtn.h)) {
            this.currentPage++;
            if (window.game && window.game.audio) window.game.audio.playClick();
            return;
        }
    },

    exit() {
        this.particles = null;
    }
};
