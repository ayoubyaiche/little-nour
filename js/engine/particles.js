/* ===================================================
   Particle System — Sparkles, stars, celebration effects
   =================================================== */

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    // Emit a burst of particles
    emit(x, y, count, options = {}) {
        const {
            colors = ['#FFD700', '#FF69B4', '#87CEEB', '#98FB98', '#DDA0DD'],
            minSpeed = 30,
            maxSpeed = 150,
            minSize = 2,
            maxSize = 6,
            lifetime = 1.5,
            gravity = 80,
            type = 'circle', // 'circle', 'star', 'spark'
            spread = Math.PI * 2, // full circle
            direction = -Math.PI / 2 // upward
        } = options;

        for (let i = 0; i < count; i++) {
            const angle = direction - spread / 2 + Math.random() * spread;
            const speed = MathUtils.randFloat(minSpeed, maxSpeed);
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: MathUtils.randFloat(minSize, maxSize),
                color: MathUtils.randChoice(colors),
                life: lifetime,
                maxLife: lifetime,
                gravity,
                type,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: MathUtils.randFloat(-5, 5)
            });
        }
    }

    // Emit sparkle trail (for glider, drawing)
    emitTrail(x, y, count = 3, options = {}) {
        this.emit(x, y, count, {
            colors: options.colors || ['#FFD700', '#FFF8DC', '#FFFACD'],
            minSpeed: 10,
            maxSpeed: 40,
            minSize: 1,
            maxSize: 3,
            lifetime: 0.6,
            gravity: 20,
            type: 'circle',
            ...options
        });
    }

    // Celebration burst
    emitCelebration(x, y) {
        this.emit(x, y, 40, {
            colors: ['#FFD700', '#FF69B4', '#87CEEB', '#98FB98', '#FF6347', '#DDA0DD'],
            minSpeed: 80,
            maxSpeed: 250,
            minSize: 3,
            maxSize: 8,
            lifetime: 2,
            gravity: 120,
            type: 'star'
        });
    }

    // Gentle sparkle effect
    emitSparkle(x, y, color = '#FFD700') {
        this.emit(x, y, 8, {
            colors: [color, '#ffffff'],
            minSpeed: 20,
            maxSpeed: 60,
            minSize: 1,
            maxSize: 4,
            lifetime: 0.8,
            gravity: 10,
            type: 'circle'
        });
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.vy += p.gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            p.rotation += p.rotSpeed * dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(ctx) {
        for (const p of this.particles) {
            const alpha = MathUtils.clamp(p.life / p.maxLife, 0, 1);
            const size = p.size * (0.5 + alpha * 0.5);

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);

            if (p.type === 'star') {
                ctx.fillStyle = p.color;
                Renderer.drawStar(ctx, 0, 0, size, size * 0.4, 5);
                ctx.fill();
            } else if (p.type === 'spark') {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = size * 0.3;
                ctx.beginPath();
                ctx.moveTo(-size, 0);
                ctx.lineTo(size, 0);
                ctx.stroke();
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    clear() {
        this.particles = [];
    }
}
