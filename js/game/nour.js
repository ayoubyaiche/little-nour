/* ===================================================
   Nour — Little anime girl with long black hair
   =================================================== */

class Nour {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;

        // Animation
        this.state = 'idle'; // idle, drawing, happy, flying
        this.stateTimer = 0;
        this.bobOffset = 0;
        this.rotation = 0;
        this.direction = 1; // 1 = right, -1 = left

        // Flying animation
        this.flyStartX = 0;
        this.flyStartY = 0;
        this.flyEndX = 0;
        this.flyEndY = 0;
        this.flyProgress = 0;

        // Glider
        this.gliderTrailPoints = [];
        this.gliderSkin = 'default';

        // Hair animation
        this.hairWave = 0;
    }

    setState(newState) {
        this.state = newState;
        this.stateTimer = 0;
    }

    startFly(fromX, fromY, toX, toY) {
        this.flyStartX = fromX;
        this.flyStartY = fromY;
        this.flyEndX = toX;
        this.flyEndY = toY;
        this.flyProgress = 0;
        this.state = 'flying';
        this.direction = toX > fromX ? 1 : -1;
    }

    update(dt) {
        this.stateTimer += dt;
        this.hairWave += dt * 2.5;

        switch (this.state) {
            case 'idle':
                this.bobOffset = Math.sin(this.stateTimer * 2) * this.size * 0.08;
                this.rotation = Math.sin(this.stateTimer * 1.5) * 0.03;
                break;

            case 'drawing':
                this.bobOffset = Math.sin(this.stateTimer * 3) * this.size * 0.03;
                this.rotation = 0;
                break;

            case 'happy':
                this.bobOffset = Math.sin(this.stateTimer * 6) * this.size * 0.15;
                this.rotation = Math.sin(this.stateTimer * 8) * 0.15;
                break;

            case 'flying':
                this.flyProgress = Math.min(1, this.flyProgress + dt * 0.5);
                const t = MathUtils.easeInOut(this.flyProgress);
                this.x = MathUtils.lerp(this.flyStartX, this.flyEndX, t);
                // Arc trajectory
                const arcHeight = Math.abs(this.flyEndX - this.flyStartX) * 0.3;
                this.y = MathUtils.lerp(this.flyStartY, this.flyEndY, t)
                    - Math.sin(t * Math.PI) * arcHeight;
                this.rotation = Math.sin(this.stateTimer * 4) * 0.1;
                this.bobOffset = 0;

                // Trail
                this.gliderTrailPoints.push({ x: this.x, y: this.y, life: 1 });
                if (this.gliderTrailPoints.length > 30) this.gliderTrailPoints.shift();
                break;
        }

        // Fade trail points
        for (let i = this.gliderTrailPoints.length - 1; i >= 0; i--) {
            this.gliderTrailPoints[i].life -= dt * 2;
            if (this.gliderTrailPoints[i].life <= 0) {
                this.gliderTrailPoints.splice(i, 1);
            }
        }
    }

    render(ctx) {
        // Glider trail
        this._renderTrail(ctx);

        ctx.save();
        ctx.translate(this.x, this.y + this.bobOffset);
        ctx.rotate(this.rotation);
        ctx.scale(this.direction, 1);

        const s = this.size;

        // === Glider Leaf (when flying) ===
        if (this.state === 'flying') {
            this._renderGlider(ctx, s);
        }

        // === LONG BLACK HAIR (behind body) ===
        this._renderHairBack(ctx, s);

        // === Body / Dress ===
        // Dress body (skinny cute anime style)
        ctx.fillStyle = '#FF6B8A'; // pink dress
        ctx.beginPath();
        ctx.moveTo(-s * 0.16, -s * 0.05); // Narrow shoulders
        ctx.quadraticCurveTo(-s * 0.12, s * 0.35, -s * 0.18, s * 0.48); // Skinny long torso/skirt
        // Skirt bottom
        ctx.quadraticCurveTo(-s * 0.1, s * 0.52, 0, s * 0.5);
        ctx.quadraticCurveTo(s * 0.1, s * 0.52, s * 0.18, s * 0.48);
        ctx.quadraticCurveTo(s * 0.12, s * 0.35, s * 0.16, -s * 0.05);
        ctx.closePath();
        ctx.fill();

        // Dress collar / top section
        ctx.fillStyle = '#FF8FAA';
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.02, s * 0.14, s * 0.08, 0, 0, Math.PI * 2); // Narrower collar
        ctx.fill();

        // Little bow on dress
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(-s * 0.08, -s * 0.02, s * 0.06, s * 0.04, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(s * 0.08, -s * 0.02, s * 0.06, s * 0.04, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, -s * 0.02, s * 0.025, 0, Math.PI * 2);
        ctx.fill();

        // === Head ===
        ctx.fillStyle = '#FFE0C2'; // soft skin
        ctx.beginPath();
        ctx.arc(0, -s * 0.25, s * 0.24, 0, Math.PI * 2);
        ctx.fill();

        // === LONG BLACK HAIR (front — bangs) ===
        this._renderHairFront(ctx, s);

        // === Anime Eyes (large, sparkly) ===
        const eyeY = -s * 0.27;
        const eyeSpacing = s * 0.11;
        const eyeW = s * 0.09;
        const eyeH = s * 0.1;

        // Left eye
        this._renderAnimeEye(ctx, -eyeSpacing, eyeY, eyeW, eyeH, '#2B1B0E');
        // Right eye
        this._renderAnimeEye(ctx, eyeSpacing, eyeY, eyeW, eyeH, '#2B1B0E');

        // Cute nose (tiny dot)
        ctx.fillStyle = '#EEBB99';
        ctx.beginPath();
        ctx.arc(0, -s * 0.18, s * 0.012, 0, Math.PI * 2);
        ctx.fill();

        // Mouth — cute smile
        ctx.strokeStyle = '#CC7766';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (this.state === 'happy') {
            // Big happy open mouth
            ctx.fillStyle = '#FF9999';
            ctx.beginPath();
            ctx.ellipse(0, -s * 0.13, s * 0.06, s * 0.04, 0, 0, Math.PI);
            ctx.fill();
            ctx.strokeStyle = '#CC7766';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else {
            // Small gentle smile
            ctx.arc(0, -s * 0.155, s * 0.035, 0.15, Math.PI - 0.15);
            ctx.stroke();
        }

        // Blush marks (anime style — diagonal lines)
        ctx.save();
        ctx.globalAlpha = 0.45;
        // Left blush
        ctx.fillStyle = '#FF9999';
        ctx.beginPath();
        ctx.ellipse(-s * 0.19, -s * 0.18, s * 0.055, s * 0.03, -0.15, 0, Math.PI * 2);
        ctx.fill();
        // Right blush
        ctx.beginPath();
        ctx.ellipse(s * 0.19, -s * 0.18, s * 0.055, s * 0.03, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // === Arms (small, skinny) ===
        ctx.fillStyle = '#FFE0C2';
        // Left arm
        ctx.beginPath();
        ctx.ellipse(-s * 0.18, s * 0.15, s * 0.03, s * 0.12, 0.15, 0, Math.PI * 2);
        ctx.fill();
        // Right arm
        ctx.beginPath();
        ctx.ellipse(s * 0.18, s * 0.15, s * 0.03, s * 0.12, -0.15, 0, Math.PI * 2);
        ctx.fill();

        // === Legs/feet (skinny, little shoes) ===
        ctx.fillStyle = '#FF4D6D'; // dark pink shoes
        ctx.beginPath();
        ctx.ellipse(-s * 0.07, s * 0.54, s * 0.06, s * 0.03, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(s * 0.07, s * 0.54, s * 0.06, s * 0.03, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shoe straps
        ctx.strokeStyle = '#CC3355';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(-s * 0.07, s * 0.52, s * 0.03, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(s * 0.07, s * 0.52, s * 0.03, Math.PI, 0);
        ctx.stroke();

        // === Hair accessory — small star clip ===
        ctx.fillStyle = '#FFD700';
        Renderer.drawStar(ctx, s * 0.2, -s * 0.42, s * 0.04, s * 0.02, 5);
        ctx.fill();

        ctx.restore();
    }

    // === Anime Eye Renderer ===
    _renderAnimeEye(ctx, cx, cy, w, h, irisColor) {
        // White
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2);
        ctx.fill();

        // Iris (large, anime style)
        const irisR = w * 0.7;
        const irisGrad = ctx.createRadialGradient(cx, cy - irisR * 0.2, 0, cx, cy, irisR);
        irisGrad.addColorStop(0, '#5B3A1E');
        irisGrad.addColorStop(0.5, irisColor);
        irisGrad.addColorStop(1, '#1A0A00');
        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, irisR, 0, Math.PI * 2);
        ctx.fill();

        // Pupil
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(cx, cy + irisR * 0.05, irisR * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Big sparkle highlight (anime style — two bright dots)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(cx - w * 0.25, cy - h * 0.25, w * 0.25, 0, Math.PI * 2);
        ctx.fill();
        // Smaller second sparkle
        ctx.beginPath();
        ctx.arc(cx + w * 0.2, cy + h * 0.15, w * 0.12, 0, Math.PI * 2);
        ctx.fill();

        // Eyelash top line
        ctx.strokeStyle = '#1A0A00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, w * 1.05, h * 0.6, 0, Math.PI, 0);
        ctx.stroke();
    }

    // === Long Black Hair (behind body) ===
    _renderHairBack(ctx, s) {
        ctx.save();
        ctx.fillStyle = '#1A1A1A'; // jet black

        // Main long hair flowing down behind body
        const wave1 = Math.sin(this.hairWave) * s * 0.03;
        const wave2 = Math.sin(this.hairWave + 1) * s * 0.04;
        const wave3 = Math.sin(this.hairWave + 2) * s * 0.03;

        // Left hair strand (long, past waist)
        ctx.beginPath();
        ctx.moveTo(-s * 0.24, -s * 0.35);
        ctx.quadraticCurveTo(-s * 0.32 + wave1, s * 0.1, -s * 0.28 + wave2, s * 0.5);
        ctx.quadraticCurveTo(-s * 0.25 + wave3, s * 0.7, -s * 0.2, s * 0.75);
        ctx.lineTo(-s * 0.12, s * 0.7);
        ctx.quadraticCurveTo(-s * 0.15, s * 0.3, -s * 0.15, -s * 0.1);
        ctx.closePath();
        ctx.fill();

        // Right hair strand (long, past waist)
        ctx.beginPath();
        ctx.moveTo(s * 0.24, -s * 0.35);
        ctx.quadraticCurveTo(s * 0.32 - wave1, s * 0.1, s * 0.28 - wave2, s * 0.5);
        ctx.quadraticCurveTo(s * 0.25 - wave3, s * 0.7, s * 0.2, s * 0.75);
        ctx.lineTo(s * 0.12, s * 0.7);
        ctx.quadraticCurveTo(s * 0.15, s * 0.3, s * 0.15, -s * 0.1);
        ctx.closePath();
        ctx.fill();

        // Center back hair
        ctx.beginPath();
        ctx.moveTo(-s * 0.15, -s * 0.3);
        ctx.lineTo(-s * 0.1, s * 0.55);
        ctx.quadraticCurveTo(0, s * 0.65 + wave2, s * 0.1, s * 0.55);
        ctx.lineTo(s * 0.15, -s * 0.3);
        ctx.closePath();
        ctx.fill();

        // Hair shine streaks
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#666699';
        ctx.beginPath();
        ctx.ellipse(-s * 0.18, s * 0.15, s * 0.02, s * 0.2, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(s * 0.18, s * 0.2, s * 0.02, s * 0.18, -0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.restore();
    }

    // === Hair Front (bangs) ===
    _renderHairFront(ctx, s) {
        ctx.fillStyle = '#1A1A1A'; // jet black

        // Top of head hair volume
        ctx.beginPath();
        ctx.arc(0, -s * 0.3, s * 0.27, Math.PI, 0);
        // Curve back along the forehead
        ctx.quadraticCurveTo(0, -s * 0.35, -s * 0.27, -s * 0.3);
        ctx.fill();

        // Anime-style bangs (choppy, layered)
        // Center bang
        ctx.beginPath();
        ctx.moveTo(-s * 0.08, -s * 0.42);
        ctx.lineTo(-s * 0.04, -s * 0.34);
        ctx.lineTo(s * 0.04, -s * 0.34);
        ctx.lineTo(s * 0.08, -s * 0.42);
        ctx.closePath();
        ctx.fill();

        // Left bangs
        ctx.beginPath();
        ctx.moveTo(-s * 0.22, -s * 0.38);
        ctx.quadraticCurveTo(-s * 0.2, -s * 0.3, -s * 0.12, -s * 0.32);
        ctx.lineTo(-s * 0.05, -s * 0.35);
        ctx.lineTo(-s * 0.1, -s * 0.42);
        ctx.closePath();
        ctx.fill();

        // Right bangs
        ctx.beginPath();
        ctx.moveTo(s * 0.22, -s * 0.38);
        ctx.quadraticCurveTo(s * 0.2, -s * 0.3, s * 0.12, -s * 0.32);
        ctx.lineTo(s * 0.05, -s * 0.35);
        ctx.lineTo(s * 0.1, -s * 0.42);
        ctx.closePath();
        ctx.fill();

        // Side hair framing face
        ctx.beginPath();
        ctx.moveTo(-s * 0.26, -s * 0.32);
        ctx.quadraticCurveTo(-s * 0.3, -s * 0.1, -s * 0.27, s * 0.05);
        ctx.lineTo(-s * 0.22, s * 0.0);
        ctx.quadraticCurveTo(-s * 0.24, -s * 0.15, -s * 0.22, -s * 0.3);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(s * 0.26, -s * 0.32);
        ctx.quadraticCurveTo(s * 0.3, -s * 0.1, s * 0.27, s * 0.05);
        ctx.lineTo(s * 0.22, s * 0.0);
        ctx.quadraticCurveTo(s * 0.24, -s * 0.15, s * 0.22, -s * 0.3);
        ctx.closePath();
        ctx.fill();

        // Hair shine highlight
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = '#8888CC';
        ctx.beginPath();
        ctx.ellipse(-s * 0.05, -s * 0.38, s * 0.08, s * 0.04, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    _renderGlider(ctx, s) {
        ctx.save();
        ctx.translate(0, -s * 0.5);

        // Leaf shape
        const grad = ctx.createLinearGradient(-s * 0.6, 0, s * 0.6, 0);
        grad.addColorStop(0, '#32CD32');
        grad.addColorStop(0.5, '#7CFC00');
        grad.addColorStop(1, '#32CD32');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.15);
        ctx.quadraticCurveTo(-s * 0.7, -s * 0.1, -s * 0.5, s * 0.1);
        ctx.quadraticCurveTo(-s * 0.2, s * 0.05, 0, s * 0.1);
        ctx.quadraticCurveTo(s * 0.2, s * 0.05, s * 0.5, s * 0.1);
        ctx.quadraticCurveTo(s * 0.7, -s * 0.1, 0, -s * 0.15);
        ctx.fill();

        // Leaf vein
        ctx.strokeStyle = 'rgba(0, 100, 0, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.12);
        ctx.lineTo(0, s * 0.08);
        ctx.stroke();

        ctx.restore();
    }

    _renderTrail(ctx) {
        if (this.gliderTrailPoints.length < 2) return;

        for (let i = 1; i < this.gliderTrailPoints.length; i++) {
            const p = this.gliderTrailPoints[i];
            ctx.save();
            ctx.globalAlpha = p.life * 0.6;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2 + p.life * 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}
