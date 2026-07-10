/* ===================================================
   Planet Data — Config for all planets & Ayoub
   =================================================== */

const PlanetData = {
    planets: [
        // ====== Planet 0: Night Hill — Ayoub (Night Guardian) ======
        {
            name: 'Night Hill',
            creatureName: 'Ayoub',
            creatureType: 'owl',
            biome: {
                bgTop: '#1a1035',
                bgBottom: '#2d1b4e',
                groundColor: '#3a2d5c',
                groundHighlight: '#5a4d7c',
                accentColor: '#c4b5e0',
                planetColor1: '#6b5b8a',
                planetColor2: '#3a2d5c',
                glowColor: '#9b8bb5'
            },
            hints: [
                { shape: 'crescent', description: 'Draw a boat to cross the river', animationType: 'boat_sail' },
                { shape: 'stairs', description: 'Draw stairs to reach the sky', animationType: 'ayoub_climb' },
                { shape: 'circle', description: 'Draw a sun to light the night', animationType: 'sun_rise' }
            ],
            difficulty: 1,
            keepsake: { id: 'moonstone', name: 'Moonstone', icon: '🌙' },
            creatureColors: {
                body: '#8B7BB5',
                belly: '#C4B5E0',
                eyes: '#FFE4B5',
                accent: '#DDA0DD'
            },
            ambientParticles: {
                colors: ['#E6E6FA', '#DDA0DD', '#FFE4B5'],
                count: 3,
                type: 'float' // gentle floating
            }
        },

        // ====== Planet 1: Floating Pond — Ayoub (Ocean Explorer) ======
        {
            name: 'Floating Pond',
            creatureName: 'Ayoub',
            creatureType: 'fish',
            biome: {
                bgTop: '#0d3b4f',
                bgBottom: '#1a5c6e',
                groundColor: '#2a7d8e',
                groundHighlight: '#4aadbe',
                accentColor: '#7fdbec',
                planetColor1: '#4aadbe',
                planetColor2: '#1a5c6e',
                glowColor: '#7fdbec'
            },
            hints: [
                { shape: 'arch', description: 'Draw a bridge for the car', animationType: 'car_bridge' },
                { shape: 'wavy', description: 'Draw a rain cloud to grow a flower', animationType: 'rain_flower' }
            ],
            difficulty: 1,
            keepsake: { id: 'pearl', name: 'Pearl', icon: '🫧' },
            creatureColors: {
                body: '#4AADBE',
                belly: '#7FDBEC',
                eyes: '#FFFFFF',
                accent: '#FF8C69'
            },
            ambientParticles: {
                colors: ['#7FDBEC', '#B0E0E6', '#AFEEEE'],
                count: 5,
                type: 'bubble'
            }
        },

        // ====== Planet 2: Scrap Metal Moon — Ayoub (Tech Engineer) ======
        {
            name: 'Scrap Metal Moon',
            creatureName: 'Ayoub',
            creatureType: 'robot',
            biome: {
                bgTop: '#1a1a2e',
                bgBottom: '#2d2d44',
                groundColor: '#4a4a5e',
                groundHighlight: '#6a6a7e',
                accentColor: '#8ae08a',
                planetColor1: '#5a5a7a',
                planetColor2: '#3a3a5a',
                glowColor: '#8ae08a'
            },
            hints: [
                { shape: 'square', description: 'Draw a square (screen)' },
                { shape: 'line', description: 'Draw a straight line (antenna)' },
                { shape: 'triangle', description: 'Draw a triangle (signal)' }
            ],
            difficulty: 2,
            keepsake: { id: 'gear', name: 'Golden Gear', icon: '⚙️' },
            creatureColors: {
                body: '#7A7A9A',
                belly: '#9A9ABA',
                eyes: '#8AE08A',
                accent: '#FFD700'
            },
            ambientParticles: {
                colors: ['#8AE08A', '#FFD700', '#AAAACC'],
                count: 2,
                type: 'spark'
            }
        },

        // ====== Planet 3: Meadow — Ayoub (Garden Keeper) ======
        {
            name: 'Meadow Planet',
            creatureName: 'Ayoub',
            creatureType: 'flower',
            biome: {
                bgTop: '#2d4a1e',
                bgBottom: '#4a7a2e',
                groundColor: '#6aaa4e',
                groundHighlight: '#8aca6e',
                accentColor: '#FFB6C1',
                planetColor1: '#8aca6e',
                planetColor2: '#4a7a2e',
                glowColor: '#FFB6C1'
            },
            hints: [
                { shape: 'circle', description: 'Draw a petal' },
                { shape: 'star', description: 'Draw a pollen spark' }
            ],
            difficulty: 2,
            keepsake: { id: 'seed', name: 'Magic Seed', icon: '🌱' },
            creatureColors: {
                body: '#FF69B4',
                belly: '#FFB6C1',
                eyes: '#FFD700',
                accent: '#98FB98'
            },
            ambientParticles: {
                colors: ['#FFB6C1', '#FFD700', '#98FB98'],
                count: 4,
                type: 'float'
            }
        },

        // ====== Planet 4: Sky Isle — Ayoub (Sky Watcher) ======
        {
            name: 'Sky Isle',
            creatureName: 'Ayoub',
            creatureType: 'cloud',
            biome: {
                bgTop: '#87CEEB',
                bgBottom: '#B0E0E6',
                groundColor: '#FFFFFF',
                groundHighlight: '#F0F8FF',
                accentColor: '#E6E6FA',
                planetColor1: '#FFFFFF',
                planetColor2: '#B0E0E6',
                glowColor: '#E6E6FA'
            },
            hints: [
                { shape: 'circle', description: 'Draw a cloud blob' },
                { shape: 'spiral', description: 'Draw a wind swirl' }
            ],
            difficulty: 2,
            keepsake: { id: 'feather', name: 'Cloud Feather', icon: '🪶' },
            creatureColors: {
                body: '#FFFFFF',
                belly: '#F0F8FF',
                eyes: '#87CEEB',
                accent: '#DDA0DD'
            },
            ambientParticles: {
                colors: ['#FFFFFF', '#F0F8FF', '#E6E6FA'],
                count: 3,
                type: 'float'
            }
        }
    ],

    getPlanet(index) {
        return this.planets[index] || null;
    },

    get totalPlanets() {
        return this.planets.length;
    }
};
