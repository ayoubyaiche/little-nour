/* ===================================================
   Drawing Canvas — Stroke capture, hint display, glow trail
   =================================================== */

class DrawingCanvas {
    constructor(gestureRecognizer) {
        this.recognizer = gestureRecognizer;
        this.active = false;
        this.currentStroke = [];
        this.displayStroke = []; // smoothed for display
        this.targetShape = null;
        this.hintPoints = [];
        this.attemptNumber = 0;
        this.assistMode = false;

        // Canvas area (set externally)
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;

        // Animation
        this.fadeIn = 0;
        this.hintPulse = 0;
        this.resultCallback = null;

        // Stroke glow trail
        this.trailParticles = [];
    }

    // Set drawing area bounds
    setBounds(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    }

    // Start a new drawing challenge
    startChallenge(shapeName, attempt = 0, assistMode = false) {
        this.targetShape = shapeName;
        this.attemptNumber = attempt;
        this.assistMode = assistMode;
        this.currentStroke = [];
        this.displayStroke = [];
        this.active = true;
        this.fadeIn = 0;
        this.hintPulse = 0;
        this.trailParticles = [];

        // Generate hint points in canvas center
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const hintSize = Math.min(this.width, this.height) * 0.5;
        this.hintPoints = this.recognizer.getHintPoints(shapeName, cx, cy, hintSize);
    }

    // End challenge
    endChallenge() {
        this.active = false;
        this.currentStroke = [];
        this.displayStroke = [];
    }

    // Handle input
    handleInput(type, x, y) {
        if (!this.active) return;

        // Check if point is within canvas bounds
        if (x < this.x || x > this.x + this.width || y < this.y || y > this.y + this.height) {
            return;
        }

        switch (type) {
            case 'down':
                this.currentStroke = [{ x, y }];
                this.displayStroke = [{ x, y }];
                break;

            case 'move':
                if (this.currentStroke.length > 0) {
                    // Add point (with min distance filter)
                    const last = this.currentStroke[this.currentStroke.length - 1];
                    if (MathUtils.dist(last.x, last.y, x, y) > 3) {
                        this.currentStroke.push({ x, y });
                        this.displayStroke.push({ x, y });

                        // Trail particles
                        this.trailParticles.push({
                            x, y,
                            life: 1,
                            size: MathUtils.randFloat(2, 5)
                        });
                    }
                }
                break;

            case 'up':
                if (this.currentStroke.length > 5) {
                    this._evaluate();
                }
                break;
        }
    }

    // Evaluate the drawn stroke
    _evaluate() {
        const result = this.recognizer.recognize(this.currentStroke);
        const isTargetMatch = result.name === this.targetShape;
        const score = isTargetMatch ? result.score : Math.max(0, result.score - 30);

        // Determine stars
        let stars = 0;
        if (score >= 85) stars = 3;
        else if (score >= 60) stars = 2;
        else if (score >= 35) stars = 1;

        const success = stars > 0 && isTargetMatch;

        if (this.resultCallback) {
            this.resultCallback({
                success,
                score,
                stars,
                matchedShape: result.name,
                targetShape: this.targetShape,
                strokePoints: [...this.currentStroke]
            });
        }
    }

    // Set callback for when drawing is evaluated
    onResult(callback) {
        this.resultCallback = callback;
    }

    update(dt) {
        if (!this.active) return;

        this.fadeIn = Math.min(1, this.fadeIn + dt * 2);
        this.hintPulse += dt * 2;

        // Fade trail particles
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            this.trailParticles[i].life -= dt * 3;
            if (this.trailParticles[i].life <= 0) {
                this.trailParticles.splice(i, 1);
            }
        }
    }

    render(ctx) {
        if (!this.active && this.fadeIn <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.fadeIn;

        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(10, 10, 26, 0.4)';
        Renderer.roundedRect(ctx, this.x, this.y, this.width, this.height, 20);
        ctx.fill();

        // Pulsing border
        const borderAlpha = 0.3 + 0.2 * Math.sin(this.hintPulse);
        ctx.strokeStyle = `rgba(255, 215, 0, ${borderAlpha})`;
        ctx.lineWidth = 3;
        Renderer.roundedRect(ctx, this.x, this.y, this.width, this.height, 20);
        ctx.stroke();

        // Draw hint
        this._renderHint(ctx);

        // Draw trail particles
        for (const p of this.trailParticles) {
            ctx.save();
            ctx.globalAlpha = p.life * 0.6;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Draw current stroke with glow
        if (this.displayStroke.length > 1) {
            // Glow layer
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(this.displayStroke[0].x, this.displayStroke[0].y);
            for (let i = 1; i < this.displayStroke.length; i++) {
                ctx.lineTo(this.displayStroke[i].x, this.displayStroke[i].y);
            }
            ctx.stroke();
            ctx.restore();

            // Main stroke
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(this.displayStroke[0].x, this.displayStroke[0].y);
            for (let i = 1; i < this.displayStroke.length; i++) {
                ctx.lineTo(this.displayStroke[i].x, this.displayStroke[i].y);
            }
            ctx.stroke();
        }

        // Label
        ctx.font = `${Math.round(16 * (this.width / 300))}px 'Nunito', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('✏️ Draw the shape!', this.x + this.width / 2, this.y + this.height - 15);

        ctx.restore();
    }

    _renderHint(ctx) {
        if (this.hintPoints.length < 2) return;

        const showDotted = this.attemptNumber >= 1 || this.assistMode;
        const showArrows = this.attemptNumber >= 2;

        ctx.save();

        if (showDotted || this.assistMode) {
            // Persistent dotted guide
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(this.hintPoints[0].x, this.hintPoints[0].y);
            for (let i = 1; i < this.hintPoints.length; i++) {
                ctx.lineTo(this.hintPoints[i].x, this.hintPoints[i].y);
            }
            ctx.stroke();
            ctx.setLineDash([]);

            // Arrow indicators
            if (showArrows) {
                const step = Math.floor(this.hintPoints.length / 5);
                for (let i = step; i < this.hintPoints.length - 1; i += step) {
                    const p = this.hintPoints[i];
                    const next = this.hintPoints[Math.min(i + 3, this.hintPoints.length - 1)];
                    const angle = MathUtils.angle(p.x, p.y, next.x, next.y);
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(angle);
                    ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
                    ctx.beginPath();
                    ctx.moveTo(6, 0);
                    ctx.lineTo(-3, -4);
                    ctx.lineTo(-3, 4);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
            }
        } else {
            // First attempt: brief glowing outline with fade
            const hintAlpha = Math.max(0, 1 - this.hintPulse * 0.3);
            if (hintAlpha > 0.01) {
                ctx.globalAlpha = hintAlpha;
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(this.hintPoints[0].x, this.hintPoints[0].y);
                for (let i = 1; i < this.hintPoints.length; i++) {
                    ctx.lineTo(this.hintPoints[i].x, this.hintPoints[i].y);
                }
                ctx.stroke();
            }
        }

        // Start point indicator
        const startPulse = 0.5 + 0.5 * Math.sin(this.hintPulse * 3);
        ctx.globalAlpha = 0.6 * startPulse;
        ctx.fillStyle = '#7CFC00';
        ctx.beginPath();
        ctx.arc(this.hintPoints[0].x, this.hintPoints[0].y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
