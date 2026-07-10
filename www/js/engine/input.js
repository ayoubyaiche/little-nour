/* ===================================================
   Input Manager — Unified touch + mouse handling
   =================================================== */

class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.listeners = [];
        this.pointerDown = false;
        this.pointerPos = { x: 0, y: 0 };
        this._scaleX = 1;
        this._scaleY = 1;

        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);

        canvas.addEventListener('pointerdown', this._onPointerDown, { passive: false });
        canvas.addEventListener('pointermove', this._onPointerMove, { passive: false });
        canvas.addEventListener('pointerup', this._onPointerUp, { passive: false });
        canvas.addEventListener('pointercancel', this._onPointerUp, { passive: false });

        // Prevent context menu on long press
        canvas.addEventListener('contextmenu', e => e.preventDefault());
    }

    updateScale(displayWidth, displayHeight, canvasWidth, canvasHeight) {
        this._scaleX = canvasWidth / displayWidth;
        this._scaleY = canvasHeight / displayHeight;
    }

    _getPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * this._scaleX,
            y: (e.clientY - rect.top) * this._scaleY
        };
    }

    _onPointerDown(e) {
        e.preventDefault();
        this.pointerDown = true;
        const pos = this._getPos(e);
        this.pointerPos = pos;
        this._dispatch('down', pos.x, pos.y, { pointerId: e.pointerId });
    }

    _onPointerMove(e) {
        e.preventDefault();
        const pos = this._getPos(e);
        this.pointerPos = pos;
        if (this.pointerDown) {
            this._dispatch('move', pos.x, pos.y, { pointerId: e.pointerId });
        } else {
            this._dispatch('hover', pos.x, pos.y, { pointerId: e.pointerId });
        }
    }

    _onPointerUp(e) {
        e.preventDefault();
        this.pointerDown = false;
        const pos = this._getPos(e);
        this.pointerPos = pos;
        this._dispatch('up', pos.x, pos.y, { pointerId: e.pointerId });
    }

    onInput(callback) {
        this.listeners.push(callback);
    }

    _dispatch(type, x, y, data) {
        for (const listener of this.listeners) {
            listener(type, x, y, data);
        }
    }

    destroy() {
        this.canvas.removeEventListener('pointerdown', this._onPointerDown);
        this.canvas.removeEventListener('pointermove', this._onPointerMove);
        this.canvas.removeEventListener('pointerup', this._onPointerUp);
        this.canvas.removeEventListener('pointercancel', this._onPointerUp);
    }
}
