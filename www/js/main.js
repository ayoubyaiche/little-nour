/* ===================================================
   Main — Game initialization & loop
   =================================================== */

(function () {
    'use strict';

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // ====== Game Object ======
    const game = {
        canvas,
        ctx,
        sceneManager: new SceneManager(),
        input: null,
        audio: new AudioManager(),
        lastTime: 0,
        running: true
    };

    // Expose globally for scenes to access
    window.game = game;

    // ====== Canvas Sizing ======
    function resize() {
        const dpr = window.devicePixelRatio || 1;
        const displayW = window.innerWidth;
        const displayH = window.innerHeight;

        canvas.width = displayW * dpr;
        canvas.height = displayH * dpr;
        canvas.style.width = displayW + 'px';
        canvas.style.height = displayH + 'px';

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        // Don't scale — we handle DPR in our coordinate system

        if (game.input) {
            game.input.updateScale(displayW, displayH, canvas.width, canvas.height);
        }
    }

    window.addEventListener('resize', resize);
    resize();

    // ====== Input ======
    game.input = new InputManager(canvas);
    game.input.updateScale(window.innerWidth, window.innerHeight, canvas.width, canvas.height);

    game.input.onInput((type, x, y, data) => {
        game.sceneManager.handleInput(type, x, y, data);

        // Resume audio context on first interaction
        if (type === 'down') {
            game.audio.init();
            game.audio.resume();
        }
    });

    // ====== Register Scenes ======
    game.sceneManager.register('menu', MenuScene);
    game.sceneManager.register('planetMap', PlanetMapScene);
    game.sceneManager.register('gameplay', GameplayScene);
    game.sceneManager.register('sketchbook', SketchbookScene);

    // ====== Start ======
    game.sceneManager.push('menu', {});

    // ====== Game Loop ======
    function loop(timestamp) {
        if (!game.running) return;

        const dt = Math.min((timestamp - game.lastTime) / 1000, 0.05); // cap at 50ms
        game.lastTime = timestamp;

        // Update
        game.sceneManager.update(dt);

        // Render
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.sceneManager.render(ctx);

        requestAnimationFrame(loop);
    }

    game.lastTime = performance.now();
    requestAnimationFrame(loop);

    console.log('🌟 Little Nour — Game Started!');

})();
