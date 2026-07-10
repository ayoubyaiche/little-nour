/* ===================================================
   $1 Unistroke Gesture Recognizer
   Based on the $1 algorithm by Wobbrock, Wilson & Li
   =================================================== */

class GestureRecognizer {
    constructor() {
        this.templates = {};
        this.NUM_POINTS = 64;
        this.SQUARE_SIZE = 250;
        this.HALF_DIAGONAL = 0.5 * Math.sqrt(250 * 250 + 250 * 250);
        this.ANGLE_RANGE = MathUtils.degToRad(45);
        this.ANGLE_PRECISION = MathUtils.degToRad(2);
        this.PHI = 0.5 * (-1.0 + Math.sqrt(5.0)); // Golden Ratio

        this._loadDefaultTemplates();
    }

    // ====== Core Recognition ======

    recognize(points) {
        if (points.length < 5) return { name: 'none', score: 0 };

        const processed = this._processPoints(points);
        let bestScore = 0;
        let bestName = 'none';

        for (const [name, templateSets] of Object.entries(this.templates)) {
            for (const template of templateSets) {
                const d = this._distanceAtBestAngle(processed, template,
                    -this.ANGLE_RANGE, this.ANGLE_RANGE, this.ANGLE_PRECISION);
                const score = 1.0 - d / this.HALF_DIAGONAL;
                if (score > bestScore) {
                    bestScore = score;
                    bestName = name;
                }
            }
        }

        // Convert to 0-100 percentage
        return {
            name: bestName,
            score: Math.round(MathUtils.clamp(bestScore * 100, 0, 100))
        };
    }

    // ====== Point Processing Pipeline ======

    _processPoints(points) {
        let pts = points.map(p => ({ x: p.x, y: p.y }));
        pts = this._resample(pts, this.NUM_POINTS);
        const indicativeAngle = Math.atan2(
            pts[0].y - this._centroid(pts).y,
            pts[0].x - this._centroid(pts).x
        );
        pts = this._rotateBy(pts, -indicativeAngle);
        pts = this._scaleTo(pts, this.SQUARE_SIZE);
        pts = this._translateTo(pts, { x: 0, y: 0 });
        return pts;
    }

    _resample(points, n) {
        const totalLen = this._pathLength(points);
        const interval = totalLen / (n - 1);
        let D = 0;
        const newPoints = [{ x: points[0].x, y: points[0].y }];

        for (let i = 1; i < points.length; i++) {
            const d = MathUtils.dist(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
            if ((D + d) >= interval) {
                const qx = points[i - 1].x + ((interval - D) / d) * (points[i].x - points[i - 1].x);
                const qy = points[i - 1].y + ((interval - D) / d) * (points[i].y - points[i - 1].y);
                newPoints.push({ x: qx, y: qy });
                points.splice(i, 0, { x: qx, y: qy });
                D = 0;
            } else {
                D += d;
            }
        }

        // Edge case: rounding might leave us one short
        while (newPoints.length < n) {
            newPoints.push({ x: points[points.length - 1].x, y: points[points.length - 1].y });
        }

        return newPoints.slice(0, n);
    }

    _rotateBy(points, radians) {
        const c = this._centroid(points);
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        return points.map(p => ({
            x: (p.x - c.x) * cos - (p.y - c.y) * sin + c.x,
            y: (p.x - c.x) * sin + (p.y - c.y) * cos + c.y
        }));
    }

    _scaleTo(points, size) {
        const bb = this._boundingBox(points);
        const w = Math.max(bb.width, 1);
        const h = Math.max(bb.height, 1);
        return points.map(p => ({
            x: p.x * (size / w),
            y: p.y * (size / h)
        }));
    }

    _translateTo(points, target) {
        const c = this._centroid(points);
        return points.map(p => ({
            x: p.x + target.x - c.x,
            y: p.y + target.y - c.y
        }));
    }

    // ====== Matching ======

    _distanceAtBestAngle(points, template, a, b, threshold) {
        let x1 = this.PHI * a + (1.0 - this.PHI) * b;
        let f1 = this._distanceAtAngle(points, template, x1);
        let x2 = (1.0 - this.PHI) * a + this.PHI * b;
        let f2 = this._distanceAtAngle(points, template, x2);

        while (Math.abs(b - a) > threshold) {
            if (f1 < f2) {
                b = x2;
                x2 = x1;
                f2 = f1;
                x1 = this.PHI * a + (1.0 - this.PHI) * b;
                f1 = this._distanceAtAngle(points, template, x1);
            } else {
                a = x1;
                x1 = x2;
                f1 = f2;
                x2 = (1.0 - this.PHI) * a + this.PHI * b;
                f2 = this._distanceAtAngle(points, template, x2);
            }
        }
        return Math.min(f1, f2);
    }

    _distanceAtAngle(points, template, radians) {
        const rotated = this._rotateBy(points, radians);
        return this._pathDistance(rotated, template);
    }

    _pathDistance(pts1, pts2) {
        let d = 0;
        const len = Math.min(pts1.length, pts2.length);
        for (let i = 0; i < len; i++) {
            d += MathUtils.dist(pts1[i].x, pts1[i].y, pts2[i].x, pts2[i].y);
        }
        return d / len;
    }

    // ====== Helpers ======

    _centroid(points) {
        let x = 0, y = 0;
        for (const p of points) { x += p.x; y += p.y; }
        return { x: x / points.length, y: y / points.length };
    }

    _boundingBox(points) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const p of points) {
            minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
        }
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    _pathLength(points) {
        let d = 0;
        for (let i = 1; i < points.length; i++) {
            d += MathUtils.dist(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
        }
        return d;
    }

    // ====== Add a template ======

    addTemplate(name, points) {
        if (!this.templates[name]) this.templates[name] = [];
        this.templates[name].push(this._processPoints(points));
    }

    // ====== Generate shape points for templates ======

    _generateCircle(cx, cy, r, numPoints = 64) {
        const pts = [];
        for (let i = 0; i < numPoints; i++) {
            const angle = (2 * Math.PI * i) / numPoints;
            pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
        }
        return pts;
    }

    _generateTriangle(cx, cy, size) {
        const pts = [];
        const vertices = [];
        for (let i = 0; i < 3; i++) {
            const angle = (2 * Math.PI * i) / 3 - Math.PI / 2;
            vertices.push({ x: cx + Math.cos(angle) * size, y: cy + Math.sin(angle) * size });
        }
        vertices.push(vertices[0]); // close
        // Interpolate between vertices
        for (let i = 0; i < vertices.length - 1; i++) {
            for (let t = 0; t < 20; t++) {
                pts.push({
                    x: MathUtils.lerp(vertices[i].x, vertices[i + 1].x, t / 20),
                    y: MathUtils.lerp(vertices[i].y, vertices[i + 1].y, t / 20)
                });
            }
        }
        return pts;
    }

    _generateSquare(cx, cy, size) {
        const half = size / 2;
        const corners = [
            { x: cx - half, y: cy - half },
            { x: cx + half, y: cy - half },
            { x: cx + half, y: cy + half },
            { x: cx - half, y: cy + half },
            { x: cx - half, y: cy - half }
        ];
        const pts = [];
        for (let i = 0; i < corners.length - 1; i++) {
            for (let t = 0; t < 16; t++) {
                pts.push({
                    x: MathUtils.lerp(corners[i].x, corners[i + 1].x, t / 16),
                    y: MathUtils.lerp(corners[i].y, corners[i + 1].y, t / 16)
                });
            }
        }
        return pts;
    }

    _generateStar(cx, cy, outerR, innerR, points = 5) {
        const pts = [];
        const totalPoints = points * 2;
        const vertices = [];
        for (let i = 0; i <= totalPoints; i++) {
            const r = (i % 2 === 0) ? outerR : innerR;
            const angle = (Math.PI * i / points) - Math.PI / 2;
            vertices.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
        }
        for (let i = 0; i < vertices.length - 1; i++) {
            for (let t = 0; t < 10; t++) {
                pts.push({
                    x: MathUtils.lerp(vertices[i].x, vertices[i + 1].x, t / 10),
                    y: MathUtils.lerp(vertices[i].y, vertices[i + 1].y, t / 10)
                });
            }
        }
        return pts;
    }

    _generateArch(cx, cy, r) {
        const pts = [];
        const numPoints = 32;
        for (let i = 0; i <= numPoints; i++) {
            const angle = Math.PI - (Math.PI * i) / numPoints; // Left to right top half arc
            pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
        }
        return pts;
    }

    _generateStairs(startX, startY, endX, endY, steps = 3) {
        const pts = [];
        const vertices = [];
        const stepW = (endX - startX) / steps;
        const stepH = (endY - startY) / steps;
        
        let cx = startX;
        let cy = startY;
        vertices.push({ x: cx, y: cy });
        
        for (let i = 0; i < steps; i++) {
            // Horizontal
            cx += stepW;
            vertices.push({ x: cx, y: cy });
            // Vertical
            cy += stepH;
            vertices.push({ x: cx, y: cy });
        }
        
        for (let i = 0; i < vertices.length - 1; i++) {
            for (let t = 0; t < 10; t++) {
                pts.push({
                    x: MathUtils.lerp(vertices[i].x, vertices[i + 1].x, t / 10),
                    y: MathUtils.lerp(vertices[i].y, vertices[i + 1].y, t / 10)
                });
            }
        }
        return pts;
    }


    _generateCrescent(cx, cy, r) {
        const pts = [];
        // Outer arc
        for (let i = 0; i <= 40; i++) {
            const angle = (Math.PI * 2 * i) / 40 - Math.PI / 2;
            pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
        }
        // Inner arc (offset, smaller) — drawn in reverse
        for (let i = 40; i >= 0; i--) {
            const angle = (Math.PI * 2 * i) / 40 - Math.PI / 2;
            pts.push({
                x: cx + r * 0.35 + Math.cos(angle) * r * 0.75,
                y: cy + Math.sin(angle) * r * 0.75
            });
        }
        return pts;
    }

    _generateZigzag(startX, startY, width, amplitude, segments) {
        const pts = [];
        const segW = width / segments;
        for (let i = 0; i <= segments; i++) {
            const x = startX + i * segW;
            const y = startY + (i % 2 === 0 ? -amplitude : amplitude);
            pts.push({ x, y });
            // Interpolate
            if (i < segments) {
                const nx = startX + (i + 1) * segW;
                const ny = startY + ((i + 1) % 2 === 0 ? -amplitude : amplitude);
                for (let t = 1; t < 8; t++) {
                    pts.push({
                        x: MathUtils.lerp(x, nx, t / 8),
                        y: MathUtils.lerp(y, ny, t / 8)
                    });
                }
            }
        }
        return pts;
    }

    _generateWavyLine(startX, startY, width, amplitude, waves) {
        const pts = [];
        for (let i = 0; i <= 80; i++) {
            const t = i / 80;
            pts.push({
                x: startX + t * width,
                y: startY + Math.sin(t * Math.PI * 2 * waves) * amplitude
            });
        }
        return pts;
    }

    _generateSpiral(cx, cy, maxR, turns) {
        const pts = [];
        const totalSteps = 80;
        for (let i = 0; i <= totalSteps; i++) {
            const t = i / totalSteps;
            const angle = t * Math.PI * 2 * turns;
            const r = t * maxR;
            pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
        }
        return pts;
    }

    _generateLine(x1, y1, x2, y2) {
        const pts = [];
        for (let i = 0; i <= 30; i++) {
            const t = i / 30;
            pts.push({ x: MathUtils.lerp(x1, x2, t), y: MathUtils.lerp(y1, y2, t) });
        }
        return pts;
    }

    _generateHexagon(cx, cy, r) {
        const pts = [];
        const vertices = [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
            vertices.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
        }
        vertices.push(vertices[0]); // close
        for (let i = 0; i < vertices.length - 1; i++) {
            for (let t = 0; t < 12; t++) {
                pts.push({
                    x: MathUtils.lerp(vertices[i].x, vertices[i + 1].x, t / 12),
                    y: MathUtils.lerp(vertices[i].y, vertices[i + 1].y, t / 12)
                });
            }
        }
        return pts;
    }

    // ====== Pre-loaded Templates ======

    _loadDefaultTemplates() {
        const cx = 150, cy = 150, r = 80;

        // Circle — multiple variations
        this.addTemplate('circle', this._generateCircle(cx, cy, r));
        this.addTemplate('circle', this._generateCircle(cx, cy, r * 0.7));
        this.addTemplate('circle', this._generateCircle(cx + 20, cy + 20, r * 1.2));

        // Crescent moon
        this.addTemplate('crescent', this._generateCrescent(cx, cy, r));

        // Triangle
        this.addTemplate('triangle', this._generateTriangle(cx, cy, r));
        this.addTemplate('triangle', this._generateTriangle(cx, cy, r * 0.8));

        // Square / rectangle
        this.addTemplate('square', this._generateSquare(cx, cy, r * 1.5));
        this.addTemplate('square', this._generateSquare(cx, cy, r));

        // Star (5-pointed)
        this.addTemplate('star', this._generateStar(cx, cy, r, r * 0.4));
        this.addTemplate('star', this._generateStar(cx, cy, r * 0.7, r * 0.3));

        // Zigzag
        this.addTemplate('zigzag', this._generateZigzag(50, cy, 200, 40, 4));
        this.addTemplate('zigzag', this._generateZigzag(50, cy, 200, 30, 5));

        // Wavy line
        this.addTemplate('wavy', this._generateWavyLine(50, cy, 200, 30, 2));
        this.addTemplate('wavy', this._generateWavyLine(50, cy, 200, 40, 3));

        // Spiral
        this.addTemplate('spiral', this._generateSpiral(cx, cy, r, 2));
        this.addTemplate('spiral', this._generateSpiral(cx, cy, r, 3));

        // Straight line (horizontal)
        this.addTemplate('line', this._generateLine(50, cy, 250, cy));
        // Straight line (vertical)
        this.addTemplate('line', this._generateLine(cx, 50, cx, 250));

        // Hexagon
        this.addTemplate('hexagon', this._generateHexagon(cx, cy, r));

        // Creative Animations:
        // Arch (Bridge)
        this.addTemplate('arch', this._generateArch(cx, cy, r));
        // Stairs
        this.addTemplate('stairs', this._generateStairs(50, 250, 250, 50, 3));
        this.addTemplate('stairs', this._generateStairs(50, 250, 250, 50, 4));
    }

    // Get template points for hint display (un-processed, in canvas space)
    getHintPoints(shapeName, cx, cy, size) {
        const r = size / 2;
        switch (shapeName) {
            case 'circle': return this._generateCircle(cx, cy, r);
            case 'crescent': return this._generateCrescent(cx, cy, r);
            case 'triangle': return this._generateTriangle(cx, cy, r);
            case 'square': return this._generateSquare(cx, cy, r * 1.2);
            case 'star': return this._generateStar(cx, cy, r, r * 0.4);
            case 'zigzag': return this._generateZigzag(cx - r, cy, r * 2, r * 0.5, 4);
            case 'wavy': return this._generateWavyLine(cx - r, cy, r * 2, r * 0.4, 2);
            case 'spiral': return this._generateSpiral(cx, cy, r, 2);
            case 'line': return this._generateLine(cx - r, cy, cx + r, cy);
            case 'hexagon': return this._generateHexagon(cx, cy, r);
            case 'arch': return this._generateArch(cx, cy, r);
            case 'stairs': return this._generateStairs(cx - r, cy + r, cx + r, cy - r, 3);
            default: return this._generateCircle(cx, cy, r);
        }
    }
}
