# Lost Realms
## Overview
Lost Realms is an immersive, browser-based fantasy game where players pilot an orb to collect elemental orbs, triggering reactions to score points. The objective is to reach 10,000 points as quickly as possible by navigating a dynamic terrain and strategically combining elements. Inspired by *Flappy Bird* for its gameplay mechanics and *Genshin Impact* for its elemental reaction system, the game offers intuitive controls, engaging visuals, and a rich audio experience.
## Features
- **Elemental Reactions**: Collect orbs of different elements (e.g., Feuer, Wasser, Elektro) to trigger reactions like Vaporize, Melt, or Overload, each providing unique point bonuses.
- **Dynamic Terrain**: Navigate a procedurally generated landscape with a scrolling sky and terrain.
- **Responsive Controls**: Supports both keyboard and touch inputs for vertical movement and speed adjustments.
- **Audio Integration**: Utilizes Tone.js for sound effects and MIDI-based background music to enhance immersion.
- **Cross-Device Compatibility**: Optimized for desktop and mobile devices with responsive design and touch controls.
- **Endgame Metrics**: Displays total score, time taken, and reaction statistics upon reaching 10,000 points.
## Installation
To run Lost Realms locally, follow these steps:
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/richie-rich90454/lost-realms.git
   cd lost-realms
   ```
2. **Install Dependencies**:
   Ensure Node.js is installed, then run:
   ```bash
   npm install
   ```
3. **Start the Server**:
   The game uses Fastify to serve files. Run the server with:
   ```bash
   node server.js
   ```
   The server will start at `http://localhost:6008`.
4. **Access the Game**:
   Open a web browser and navigate to `http://localhost:6008`.
## Dependencies
- **Node.js**: For running the Fastify server.
- **Fastify**: Web server framework for serving game files.
- **@fastify/static**: Serves static files (HTML, CSS, JS, etc.).
- **@fastify/compress**: Compresses responses for faster delivery.
- **jQuery**: Handles DOM manipulation and touch controls.
- **Tone.js**: Powers audio effects and music playback.
- **Midi.js**: Processes MIDI files for background music.
## File Structure
- `index.html`: Main game interface with canvas, modals, and controls.
- `rules.html`: Detailed game rules and mechanics.
- `script.js`: Core game logic, including rendering, physics, and reactions.
- `bgm.js`: Background music handling with Tone.js and MIDI.
- `server.js`: Fastify server configuration.
- `NotoSans-VariableFont_wdth_wght.ttf`, `EBGaramond-VariableFont_wght.ttf`: Custom fonts for styling.
- `lost_realms.mid`: MIDI file for background music.
- `favicon.ico`: Game favicon.
## Usage
1. **Start the Game**:
   - On load, a modal welcomes players with instructions.
   - Click "Begin the Journey with Wonder!" to start.
2. **Controls**:
   - **Keyboard**:
     - `W` / `S`: Move up/down.
     - `-` / `A`: Decrease max speed.
     - `=` / `+` / `D`: Increase max speed.
   - **Touch**:
     - Swipe up/down or tap ▲/▼ for vertical movement.
     - Tap `-` / `+` to adjust speed.
3. **Gameplay**:
   - Collect elemental orbs to gain points and trigger reactions.
   - Reactions (e.g., Vaporize, Overload) provide bonus points based on their type (amplifying, transformative, catalyze, or status).
   - Reach 10,000 points to win and view game metrics.
4. **Rules**:
   - Access detailed rules via the "Rules" link or at `/rules.html`.
## Development
- **Canvas Rendering**: Uses HTML5 Canvas for rendering the sky, terrain, player orb, and elemental orbs.
- **Elemental System**: Implements a reaction system inspired by *Genshin Impact*, with 15 unique reactions.
- **Responsive Design**: Uses CSS media queries and `clamp()` for scalability across devices.
- **Audio**: Tone.js generates sound effects for orb collection and reactions; MIDI-based music loops in the background.
- **Server**: Fastify serves files with compression and no caching for development.
## License
This project is licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
## Acknowledgments
- Inspired by *Flappy Bird* for its simple yet addictive gameplay.
- Elemental reaction system adapted with modification from *Genshin Impact*.
- Fonts: Noto Sans and EB Garamond.
- Libraries: jQuery, Tone.js, Midi.js.