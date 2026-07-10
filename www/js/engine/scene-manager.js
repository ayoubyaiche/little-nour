/* ===================================================
   Scene Manager — Push/pop scene stack with transitions
   =================================================== */

class SceneManager {
    constructor() {
        this.scenes = {};
        this.stack = [];
        this.transitioning = false;
        this.transitionAlpha = 0;
        this.transitionDuration = 0.5; // seconds
        this.transitionTimer = 0;
        this.pendingScene = null;
        this.transitionPhase = null; // 'fadeOut' or 'fadeIn'
    }

    register(name, scene) {
        this.scenes[name] = scene;
    }

    get current() {
        return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
    }

    get currentName() {
        return this.current ? this.current._name : null;
    }

    switchTo(name, data = {}) {
        if (this.transitioning) return;
        if (!this.scenes[name]) {
            console.error(`Scene "${name}" not found`);
            return;
        }
        this.transitioning = true;
        this.transitionTimer = 0;
        this.transitionPhase = 'fadeOut';
        this.pendingScene = { name, data };
    }

    push(name, data = {}) {
        if (!this.scenes[name]) {
            console.error(`Scene "${name}" not found`);
            return;
        }
        const scene = this.scenes[name];
        scene._name = name;
        if (scene.enter) scene.enter(data);
        this.stack.push(scene);
    }

    pop() {
        if (this.stack.length > 0) {
            const scene = this.stack.pop();
            if (scene.exit) scene.exit();
        }
    }

    _performSwitch() {
        // Exit current
        if (this.current) {
            if (this.current.exit) this.current.exit();
            this.stack.pop();
        }
        // Enter new
        const { name, data } = this.pendingScene;
        const scene = this.scenes[name];
        scene._name = name;
        if (scene.enter) scene.enter(data);
        this.stack.push(scene);
        this.pendingScene = null;
    }

    update(dt) {
        // Handle transitions
        if (this.transitioning) {
            this.transitionTimer += dt;
            const halfDur = this.transitionDuration / 2;

            if (this.transitionPhase === 'fadeOut') {
                this.transitionAlpha = Math.min(1, this.transitionTimer / halfDur);
                if (this.transitionTimer >= halfDur) {
                    this._performSwitch();
                    this.transitionPhase = 'fadeIn';
                    this.transitionTimer = 0;
                }
            } else if (this.transitionPhase === 'fadeIn') {
                this.transitionAlpha = 1 - Math.min(1, this.transitionTimer / halfDur);
                if (this.transitionTimer >= halfDur) {
                    this.transitioning = false;
                    this.transitionAlpha = 0;
                    this.transitionPhase = null;
                }
            }
        }

        // Update current scene
        if (this.current && this.current.update && !this.transitioning) {
            this.current.update(dt);
        }
    }

    render(ctx) {
        // Render current scene
        if (this.current && this.current.render) {
            this.current.render(ctx);
        }

        // Draw transition overlay
        if (this.transitioning && this.transitionAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = this.transitionAlpha;
            ctx.fillStyle = '#0a0a1a';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
        }
    }

    handleInput(type, x, y, data) {
        if (this.transitioning) return;
        if (this.current && this.current.handleInput) {
            this.current.handleInput(type, x, y, data);
        }
    }
}
