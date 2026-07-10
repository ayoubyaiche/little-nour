/* ===================================================
   Creature — Ayoub (man character) on every planet
   All creatures are Ayoub in different outfits/styles
   =================================================== */

class Creature {
    constructor(type, colors, x, y, size) {
        this.type = type;
        this.colors = colors;
        this.x = x;
        this.y = y;
        this.size = size;

        // State machine
        this.state = 'idle'; // idle, showHint, waitForDraw, reactSuccess, reactRetry
        this.stateTimer = 0;

        // Animation
        this.bobOffset = 0;
        this.bobSpeed = 2;
        this.squish = 1;
        this.squishTarget = 1;
        this.rotation = 0;
        this.eyeBlinkTimer = 0;
        this.isBlinking = false;
        this.emoteScale = 0;
        this.emoteType = null; // 'happy', 'confused', 'hint'
        this.glowIntensity = 0;
        this.waveArm = 0; // arm wave animation
    }

    setState(newState) {
        this.state = newState;
        this.stateTimer = 0;

        switch (newState) {
            case 'reactSuccess':
                this.squishTarget = 1.3;
                this.emoteType = 'happy';
                this.emoteScale = 0;
                this.glowIntensity = 1;
                break;
            case 'reactRetry':
                this.emoteType = 'confused';
                this.emoteScale = 0;
                this.squishTarget = 0.9;
                break;
            case 'showHint':
                this.emoteType = 'hint';
                this.emoteScale = 0;
                break;
            case 'idle':
                this.squishTarget = 1;
                this.emoteType = null;
                this.glowIntensity = 0;
                break;
        }
    }

    update(dt) {
        this.stateTimer += dt;
        this.bobOffset = Math.sin(this.stateTimer * this.bobSpeed) * this.size * 0.05;
        this.waveArm = this.stateTimer;

        // Squish spring
        this.squish += (this.squishTarget - this.squish) * 5 * dt;

        // Emote animation
        if (this.emoteType) {
            this.emoteScale = Math.min(1, this.emoteScale + dt * 3);
        }

        // Glow fade
        if (this.state !== 'reactSuccess') {
            this.glowIntensity *= 0.95;
        }

        // Eye blink
        this.eyeBlinkTimer += dt;
        if (!this.isBlinking && Math.random() < 0.005) {
            this.isBlinking = true;
            this.eyeBlinkTimer = 0;
        }
        if (this.isBlinking && this.eyeBlinkTimer > 0.15) {
            this.isBlinking = false;
        }

        // State-specific
        if (this.state === 'reactSuccess' && this.stateTimer > 0.3) {
            this.squishTarget = 1;
            this.rotation = Math.sin(this.stateTimer * 8) * 0.1;
        }

        if (this.state === 'reactRetry' && this.stateTimer > 0.5) {
            this.squishTarget = 1;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y + this.bobOffset);
        ctx.rotate(this.rotation);
        ctx.scale(this.squish, 2 - this.squish); // squish/stretch

        // Glow behind creature
        if (this.glowIntensity > 0.01) {
            Renderer.drawGlow(ctx, 0, 0, this.size * 2, this.colors.accent, this.glowIntensity * 0.4);
        }

        // Always render as Ayoub in different outfits based on planet type
        this._renderAyoub(ctx);

        if (this.state === 'giveGift') {
            const giftScale = Math.min(1, this.stateTimer * 2); // pop up quickly
            // Add a slight floating bounce
            const bounce = Math.sin(this.stateTimer * 4) * 5;
            ctx.save();
            ctx.translate(-this.size * 0.35, -this.size * 0.25 + bounce); // Position above left hand
            ctx.scale(giftScale, giftScale);
            
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // Draw heart or flower depending on planet color theme
            const icon = this.colors.body === '#4B0082' ? '💖' : '🌸';
            ctx.font = `${this.size * 0.5}px Arial`;
            ctx.fillText(icon, 0, 0);
            
            // Sparkles around the gift
            if (Math.random() < 0.1) {
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(Math.random()*40-20, Math.random()*40-20, 2, 0, Math.PI*2);
                ctx.fill();
            }
            
            ctx.restore();
        }

        ctx.restore();

        // Emote bubble (drawn without transforms)
        if (this.emoteType && this.emoteScale > 0.01) {
            this._renderEmote(ctx);
        }
    }

    // ====== Ayoub Renderer (man character) ======

    _renderAyoub(ctx) {
        const s = this.size;
        const outfit = this._getOutfitColors();

        // === BODY / OUTFIT ===
        // Main body (shirt/jacket - very skinny and tall)
        ctx.fillStyle = outfit.shirt;
        ctx.beginPath();
        ctx.moveTo(-s * 0.18, -s * 0.05);
        ctx.lineTo(-s * 0.16, s * 0.45);
        ctx.lineTo(s * 0.16, s * 0.45);
        ctx.lineTo(s * 0.18, -s * 0.05);
        ctx.closePath();
        ctx.fill();

        // Shoulders (narrow but structured)
        ctx.fillStyle = outfit.shirt;
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.02, s * 0.22, s * 0.08, 0, 0, Math.PI);
        ctx.fill();

        // Collar / neckline
        ctx.fillStyle = outfit.collar;
        ctx.beginPath();
        ctx.moveTo(-s * 0.1, -s * 0.07);
        ctx.lineTo(0, s * 0.05);
        ctx.lineTo(s * 0.1, -s * 0.07);
        ctx.closePath();
        ctx.fill();

        // Pants (long and skinny)
        ctx.fillStyle = outfit.pants;
        ctx.beginPath();
        ctx.moveTo(-s * 0.15, s * 0.4);
        ctx.lineTo(-s * 0.12, s * 0.75);
        ctx.lineTo(-s * 0.03, s * 0.75);
        ctx.lineTo(0, s * 0.45);
        ctx.lineTo(s * 0.03, s * 0.75);
        ctx.lineTo(s * 0.12, s * 0.75);
        ctx.lineTo(s * 0.15, s * 0.4);
        ctx.closePath();
        ctx.fill();

        // Shoes
        ctx.fillStyle = outfit.shoes;
        ctx.beginPath();
        ctx.ellipse(-s * 0.1, s * 0.78, s * 0.08, s * 0.035, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(s * 0.1, s * 0.78, s * 0.08, s * 0.035, 0, 0, Math.PI * 2);
        ctx.fill();

        // === ARMS ===
        ctx.fillStyle = '#E8C8A0'; // skin
        // Left arm
        let leftArmWave = 0;
        if (this.state === 'reactSuccess' || this.state === 'showHint') {
            leftArmWave = Math.sin(this.waveArm * 5) * 0.3 - 0.5;
        } else if (this.state === 'giveGift') {
            leftArmWave = -0.8; // Hold arm up steadily to offer gift
        }

        ctx.save();
        ctx.translate(-s * 0.22, s * 0.05);
        ctx.rotate(leftArmWave);
        ctx.beginPath();
        ctx.ellipse(0, s * 0.15, s * 0.04, s * 0.18, 0.1, 0, Math.PI * 2);
        ctx.fill();
        // Hand
        ctx.beginPath();
        ctx.arc(0, s * 0.3, s * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Right arm
        ctx.save();
        ctx.translate(s * 0.22, s * 0.05);
        ctx.beginPath();
        ctx.ellipse(0, s * 0.15, s * 0.04, s * 0.18, -0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, s * 0.3, s * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // === HEAD ===
        // Neck (long and elegant)
        ctx.fillStyle = '#E8C8A0';
        ctx.beginPath();
        ctx.rect(-s * 0.04, -s * 0.12, s * 0.08, s * 0.12);
        ctx.fill();

        // Head shape (sharp jawline, anime boy style)
        ctx.fillStyle = '#E8C8A0';
        ctx.beginPath();
        ctx.moveTo(-s * 0.15, -s * 0.32); // top left
        ctx.lineTo(s * 0.15, -s * 0.32);  // top right
        ctx.lineTo(s * 0.12, -s * 0.15);  // jaw right
        ctx.lineTo(0, -s * 0.02);         // sharp chin
        ctx.lineTo(-s * 0.12, -s * 0.15); // jaw left
        ctx.closePath();
        ctx.fill();

        // === HAIR (stylish, cool swept anime hair) ===
        ctx.fillStyle = '#1A1025'; // very dark cool tone
        
        // Back/Top hair volume
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.34, s * 0.18, s * 0.16, 0, Math.PI, 0);
        ctx.fill();

        // Spiky sweeps on the sides
        ctx.beginPath();
        ctx.moveTo(-s * 0.18, -s * 0.34);
        ctx.lineTo(-s * 0.22, -s * 0.2);
        ctx.lineTo(-s * 0.12, -s * 0.25);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(s * 0.18, -s * 0.34);
        ctx.lineTo(s * 0.22, -s * 0.2);
        ctx.lineTo(s * 0.12, -s * 0.25);
        ctx.fill();

        // Cool front bangs crossing the forehead
        ctx.beginPath();
        ctx.moveTo(-s * 0.1, -s * 0.4);
        ctx.quadraticCurveTo(s * 0.05, -s * 0.15, s * 0.12, -s * 0.25);
        ctx.lineTo(0, -s * 0.35);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(s * 0.05, -s * 0.42);
        ctx.quadraticCurveTo(-s * 0.08, -s * 0.18, -s * 0.15, -s * 0.22);
        ctx.lineTo(0, -s * 0.35);
        ctx.fill();

        // === FACE ===
        // Eyes
        if (!this.isBlinking) {
            // Eyebrows (intense, slanted, masculine)
            ctx.strokeStyle = '#1A1025';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-s * 0.12, -s * 0.29);
            ctx.lineTo(-s * 0.03, -s * 0.25);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(s * 0.03, -s * 0.25);
            ctx.lineTo(s * 0.12, -s * 0.29);
            ctx.stroke();

            // Sharp, cool eyes (slanted top lids)
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 1.5;
            
            // Left eye top lid
            ctx.beginPath();
            ctx.moveTo(-s * 0.11, -s * 0.24);
            ctx.quadraticCurveTo(-s * 0.07, -s * 0.26, -s * 0.04, -s * 0.22);
            ctx.stroke();
            
            // Right eye top lid
            ctx.beginPath();
            ctx.moveTo(s * 0.11, -s * 0.24);
            ctx.quadraticCurveTo(s * 0.07, -s * 0.26, s * 0.04, -s * 0.22);
            ctx.stroke();

            // Irises (deep cool brown)
            ctx.fillStyle = '#3A2E3A';
            ctx.beginPath();
            ctx.arc(-s * 0.075, -s * 0.23, s * 0.02, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(s * 0.075, -s * 0.23, s * 0.02, 0, Math.PI * 2);
            ctx.fill();

            // Eye highlights
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(-s * 0.085, -s * 0.24, s * 0.008, 0, Math.PI * 2);
            ctx.arc(s * 0.065, -s * 0.24, s * 0.008, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Blink (sharp closed lines)
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-s * 0.11, -s * 0.23);
            ctx.lineTo(-s * 0.04, -s * 0.21);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(s * 0.04, -s * 0.21);
            ctx.lineTo(s * 0.11, -s * 0.23);
            ctx.stroke();
        }


        // Nose
        ctx.fillStyle = '#D4A878';
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.2);
        ctx.lineTo(-s * 0.025, -s * 0.14);
        ctx.lineTo(s * 0.025, -s * 0.14);
        ctx.closePath();
        ctx.fill();

        // Mouth / smile
        ctx.strokeStyle = '#AA7755';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        if (this.state === 'reactSuccess') {
            // Big happy grin
            ctx.arc(0, -s * 0.1, s * 0.07, 0.1, Math.PI - 0.1);
            ctx.stroke();
            // Teeth flash
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.ellipse(0, -s * 0.07, s * 0.05, s * 0.025, 0, 0, Math.PI);
            ctx.fill();
        } else if (this.state === 'reactRetry') {
            // Confused mouth (wavy)
            ctx.beginPath();
            ctx.moveTo(-s * 0.05, -s * 0.08);
            ctx.quadraticCurveTo(-s * 0.02, -s * 0.1, 0, -s * 0.08);
            ctx.quadraticCurveTo(s * 0.02, -s * 0.06, s * 0.05, -s * 0.08);
            ctx.stroke();
        } else {
            // Gentle friendly smile
            ctx.arc(0, -s * 0.1, s * 0.05, 0.15, Math.PI - 0.15);
            ctx.stroke();
        }

        // Beard stubble / chin detail (subtle)
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#2A1A0A';
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.04, s * 0.12, s * 0.06, 0, 0, Math.PI);
        ctx.fill();
        ctx.restore();

        // === OUTFIT DETAIL (varies by planet type) ===
        this._renderOutfitDetail(ctx, s);
    }

    // Different outfit colors per planet/type
    _getOutfitColors() {
        switch (this.type) {
            case 'owl': // Night outfit
                return {
                    shirt: '#3D3068', pants: '#2A2050', collar: '#5A4888',
                    shoes: '#1A1030', detail: '#9B8BB5'
                };
            case 'fish': // Ocean outfit
                return {
                    shirt: '#1B6B7A', pants: '#0D4A58', collar: '#2A9AAA',
                    shoes: '#0A3040', detail: '#7FDBEC'
                };
            case 'robot': // Tech outfit
                return {
                    shirt: '#4A4A6E', pants: '#3A3A5E', collar: '#6A6A8E',
                    shoes: '#2A2A3E', detail: '#8AE08A'
                };
            case 'flower': // Garden outfit
                return {
                    shirt: '#2E6E3E', pants: '#1E4E2E', collar: '#4E9E5E',
                    shoes: '#1A3A1A', detail: '#FFB6C1'
                };
            case 'cloud': // Sky outfit
                return {
                    shirt: '#5A7AAA', pants: '#3A5A8A', collar: '#7A9ACA',
                    shoes: '#2A3A5A', detail: '#E6E6FA'
                };
            default:
                return {
                    shirt: '#4A6A8A', pants: '#3A4A5A', collar: '#6A8AAA',
                    shoes: '#2A3A4A', detail: '#FFD700'
                };
        }
    }

    // Small outfit detail per planet
    _renderOutfitDetail(ctx, s) {
        const outfit = this._getOutfitColors();

        // Small icon/badge on shirt
        ctx.fillStyle = outfit.detail;
        ctx.globalAlpha = 0.7;

        switch (this.type) {
            case 'owl':
                // Moon badge
                ctx.font = `${Math.round(s * 0.18)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🌙', 0, s * 0.15);
                break;
            case 'fish':
                // Wave badge
                ctx.font = `${Math.round(s * 0.18)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🌊', 0, s * 0.15);
                break;
            case 'robot':
                // Gear badge
                ctx.font = `${Math.round(s * 0.18)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('⚡', 0, s * 0.15);
                break;
            case 'flower':
                // Flower badge
                ctx.font = `${Math.round(s * 0.18)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🌸', 0, s * 0.15);
                break;
            case 'cloud':
                // Cloud badge
                ctx.font = `${Math.round(s * 0.18)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('☁️', 0, s * 0.15);
                break;
        }
        ctx.globalAlpha = 1;

        // Name tag
        ctx.font = `700 ${Math.round(s * 0.14)}px 'Nunito', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 3;
        ctx.fillText('Ayoub', 0, -s * 0.55);
        ctx.shadowBlur = 0;
    }

    // ====== Emote Bubble ======

    _renderEmote(ctx) {
        const bx = this.x + this.size * 0.5;
        const by = this.y - this.size * 0.8 + this.bobOffset;
        const scale = MathUtils.easeOutElastic(this.emoteScale);
        const bSize = this.size * 0.35 * scale;

        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(scale, scale);

        // Bubble
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(0, 0, bSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Emote icon
        ctx.font = `${Math.round(bSize * 0.9)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        switch (this.emoteType) {
            case 'happy': ctx.fillText('✨', 0, 0); break;
            case 'confused': ctx.fillText('❓', 0, 0); break;
            case 'hint': ctx.fillText('💭', 0, 0); break;
        }

        ctx.restore();
    }
}
