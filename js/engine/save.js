/* ===================================================
   Save System — localStorage persistence
   =================================================== */

const SaveSystem = {
    SAVE_KEY: 'littleNour_save',

    // Default save data
    _defaults() {
        return {
            unlockedPlanets: [0],   // indices of unlocked planets
            completedPlanets: [],    // indices of completed planets
            stars: {},               // { planetIndex: starCount }
            totalStars: 0,
            keepsakes: [],           // collected keepsake IDs
            drawings: [],            // saved drawings [{planetIdx, points, score}]
            settings: {
                assistMode: false,
                soundVolume: 0.5,
                showTextHints: false
            },
            gliderSkin: 'default',
            firstTime: true
        };
    },

    // Load save data
    load() {
        try {
            const raw = localStorage.getItem(this.SAVE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                // Merge with defaults to handle new fields
                return { ...this._defaults(), ...data };
            }
        } catch (e) {
            console.warn('Failed to load save:', e);
        }
        return this._defaults();
    },

    // Save data
    save(data) {
        try {
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save:', e);
        }
    },

    // Quick helpers
    completePlanet(planetIdx, starCount, keepsakeId, drawingPoints) {
        const data = this.load();

        // Mark completed
        if (!data.completedPlanets.includes(planetIdx)) {
            data.completedPlanets.push(planetIdx);
        }

        // Update stars
        const prevStars = data.stars[planetIdx] || 0;
        if (starCount > prevStars) {
            data.stars[planetIdx] = starCount;
            data.totalStars = Object.values(data.stars).reduce((a, b) => a + b, 0);
        }

        // Unlock next planet
        const nextIdx = planetIdx + 1;
        if (!data.unlockedPlanets.includes(nextIdx)) {
            data.unlockedPlanets.push(nextIdx);
        }

        // Add keepsake
        if (keepsakeId && !data.keepsakes.includes(keepsakeId)) {
            data.keepsakes.push(keepsakeId);
        }

        // Save drawing
        if (drawingPoints) {
            data.drawings.push({
                planetIdx,
                points: drawingPoints,
                score: starCount,
                timestamp: Date.now()
            });
        }

        data.firstTime = false;
        this.save(data);
        return data;
    },

    // Update settings
    updateSettings(settings) {
        const data = this.load();
        data.settings = { ...data.settings, ...settings };
        this.save(data);
        return data;
    },

    // Reset all data
    reset() {
        localStorage.removeItem(this.SAVE_KEY);
    }
};
