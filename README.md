# Neon Snake Ultra 🐍✨

A high-performance, neon-styled modernization of the classic Snake arcade game.

Neon Snake Ultra is a single-file web game built with vanilla JavaScript. It upgrades the classic mechanics with a custom rendering engine that uses linear interpolation for smooth movement, particle effects, and a responsive layout that adapts to any device size.

## 🎮 Features

### Core Mechanics

- **Smooth Rendering:** Unlike traditional grid-based snake games that "teleport" from tile to tile, this engine uses requestAnimationFrame and linear interpolation to render smooth, fluid movement at 60fps.
- **Smart Input Buffer:** Prevents accidental "suicides" by queuing key presses, ensuring rapid inputs are handled correctly.
- **Persistence:** Automatically saves your High Score to the browser's localStorage.

### Visuals & UI

- **Neon Aesthetics:** Features glowing shadows, pulsing food animations, and a "Cyberpunk" color palette.
- **Particle System:** A custom particle engine generates explosion effects whenever food is consumed.
- **Dynamic Resizing:** The game board automatically calculates grid dimensions to fill ~85% of the viewport, ensuring a maximized experience on both mobile phones and 4K monitors.
- **Glassmorphism UI:** Start and Game Over screens feature semi-transparent, blurred backdrops.

### Controls

- **Desktop:** Arrow Keys (⬆️⬇️⬅️➡️)
- **Mobile:** Touch Swipes (Up/Down/Left/Right)

## 🚀 Quick Start

This project is designed as a Single File Application. There are no build steps, npm installs, or servers required.

1. Download the snake_game.html file.
2. Open it in any modern web browser (Chrome, Firefox, Safari, Edge).
3. Play!

## 🛠️ Tech Stack

- **HTML5 Canvas:** Used for the primary rendering loop.
- **Vanilla JavaScript:** No external libraries or frameworks.
- **CSS3:** Used for layout, typography (Press Start 2P), and glowing effects.

## 🔮 Future Improvements

- [ ] Add sound effects (retro bleeps/bloops).
- [ ] Add "Speed Boost" power-ups.
- [ ] Implement a global leaderboard using Firebase.

## 📄 License

Distributed under the MIT License. See LICENSE for more information.