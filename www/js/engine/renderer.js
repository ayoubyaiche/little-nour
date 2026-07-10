/* ===================================================
   Renderer — Canvas drawing utilities & procedural art
   =================================================== */

const Renderer = {
    // Draw a rounded rectangle
    roundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    },

    // Draw a filled rounded rect with optional shadow
    fillRoundedRect(ctx, x, y, w, h, r, color, shadowColor = null) {
        ctx.save();
        if (shadowColor) {
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = 15;
            ctx.shadowOffsetY = 4;
        }
        ctx.fillStyle = color;
        this.roundedRect(ctx, x, y, w, h, r);
        ctx.fill();
        ctx.restore();
    },

    // Draw a star shape
    drawStar(ctx, cx, cy, outerR, innerR, points, rotation = 0) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (Math.PI * i / points) - Math.PI / 2 + rotation;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
    },

    // Draw a glowing circle
    drawGlow(ctx, x, y, r, color, intensity = 1) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');
        ctx.save();
        ctx.globalAlpha = intensity;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    // Draw starfield background
    drawStarfield(ctx, w, h, stars, time) {
        for (const star of stars) {
            const twinkle = 0.5 + 0.5 * Math.sin(time * star.speed + star.phase);
            ctx.save();
            ctx.globalAlpha = star.alpha * twinkle;
            ctx.fillStyle = star.color || '#ffffff';
            ctx.beginPath();
            ctx.arc(star.x * w, star.y * h, star.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    },

    // Generate random star data for starfield
    generateStars(count) {
        const colors = ['#ffffff', '#ffe4b5', '#b0c4de', '#e6e6fa', '#ffd1dc'];
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random(),
                y: Math.random(),
                size: MathUtils.randFloat(0.5, 2.5),
                alpha: MathUtils.randFloat(0.3, 1),
                speed: MathUtils.randFloat(1, 4),
                phase: MathUtils.randFloat(0, Math.PI * 2),
                color: MathUtils.randChoice(colors)
            });
        }
        return stars;
    },

    // Draw a small planet sphere with gradient
    drawPlanet(ctx, x, y, radius, color1, color2, glowColor) {
        // Glow
        this.drawGlow(ctx, x, y, radius * 2.5, glowColor, 0.3);

        // Planet body gradient
        const grad = ctx.createRadialGradient(
            x - radius * 0.3, y - radius * 0.3, radius * 0.1,
            x, y, radius
        );
        grad.addColorStop(0, color1);
        grad.addColorStop(1, color2);

        ctx.save();
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    // Draw text with shadow
    drawText(ctx, text, x, y, font, color, align = 'center', baseline = 'middle') {
        ctx.save();
        ctx.font = font;
        ctx.textAlign = align;
        ctx.textBaseline = baseline;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        ctx.restore();
    },

    // Draw a button (rounded rect with text)
    drawButton(ctx, x, y, w, h, text, bgColor, textColor, fontSize = 20, hovered = false) {
        ctx.save();
        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = hovered ? 20 : 10;
        ctx.shadowOffsetY = hovered ? 6 : 3;

        // Background
        const scale = hovered ? 1.03 : 1;
        const sx = x + w / 2 - (w * scale) / 2;
        const sy = y + h / 2 - (h * scale) / 2;
        const sw = w * scale;
        const sh = h * scale;

        ctx.fillStyle = bgColor;
        this.roundedRect(ctx, sx, sy, sw, sh, h / 3);
        ctx.fill();

        // Border glow
        if (hovered) {
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 2;
            this.roundedRect(ctx, sx, sy, sw, sh, h / 3);
            ctx.stroke();
        }

        // Text
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetY = 1;
        ctx.font = `${Math.round(fontSize)}px 'Nunito', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = textColor;
        ctx.fillText(text, x + w / 2, y + h / 2);
        ctx.restore();
    },

    // Draw a crescent moon shape
    drawCrescent(ctx, cx, cy, r) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(cx + r * 0.4, cy - r * 0.15, r * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    // Clear canvas with gradient background
    clearWithGradient(ctx, w, h, color1, color2) {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, color1);
        grad.addColorStop(1, color2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }
};
