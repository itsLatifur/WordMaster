# WordsMaster 🎯

A professional word unscrambling game with multiple difficulty levels, built with modern web technologies.

![WordsMaster Game](https://img.shields.io/badge/Game-WordsMaster-blue)
![Version](https://img.shields.io/badge/Version-1.0.0-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### Game Mechanics

- **Three Difficulty Levels**: Easy (5 words), Medium (10 words), Hard (20 words)
- **Time-based Challenges**: Different time limits for each difficulty
- **Lives System**: 3 hearts/lives per game
- **Hint System**: Up to 3 hints per game with progressive letter reveals
- **Scoring System**: Points for correct answers, time bonuses, and streak multipliers
- **High Score Tracking**: Persistent local storage of your best scores

### User Experience

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Accessibility Features**: ARIA labels, keyboard navigation, screen reader support
- **Visual Feedback**: Animations for correct/incorrect answers, confetti for achievements
- **Audio Integration**: Background music and sound effects with volume controls
- **Progressive Enhancement**: Graceful degradation when features aren't supported

### Technical Features

- **Modular Architecture**: Clean separation of concerns with ES6 classes
- **Error Handling**: Comprehensive error handling and user feedback
- **Performance Optimized**: Efficient audio loading and background effects
- **Local Storage**: Persistent high scores and user preferences

## 🚀 Getting Started

### Prerequisites

- Modern web browser with ES6+ support
- Optional: Node.js for development server

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/itsLatifur/WordMaster.git
   cd wordsmaster
   ```

2. **Install dependencies (optional)**

   ```bash
   npm install
   ```

3. **Run the game**

   **Option A: Direct file access**

   - Simply open `index.html` in your web browser

   **Option B: Development server**

   ```bash
   npm run dev
   ```

   **Option C: Simple HTTP server**

   ```bash
   npm start
   ```

## 🎮 How to Play

1. **Choose Difficulty**: Select Easy, Medium, or Hard mode
2. **Configure Audio**: Set your music and sound effect preferences
3. **Unscramble Words**: Type the correct word from the scrambled letters
4. **Use Hints**: Get letter hints when you're stuck (limited to 3 per game)
5. **Beat the Clock**: Complete all words before time runs out
6. **Achieve High Scores**: Earn points for speed, accuracy, and streaks

### Scoring System

- **Base Points**: 100 points per correct word
- **Time Bonus**: Remaining seconds added to final score
- **Streak Bonus**: 10 points per consecutive correct answer
- **Perfect Game Bonus**: 100 extra points for completing without hints
- **Hint Penalty**: No penalty, but no perfect bonus if hints are used

## 📁 Project Structure

```
wordsmaster/
├── index.html              # Main game interface
├── css/
│   ├── styles.css         # Main styles and themes
│   └── animations.css     # Animation keyframes and effects
├── js/
│   ├── game.js           # Core game logic and state management
│   ├── audioManager.js   # Audio system with error handling
│   ├── effects.js        # Background effects and animations
│   ├── utils.js          # Utility functions and helpers
│   └── words.js          # Word database and categories
├── assets/
│   └── audio/            # Sound effects and background music
│       ├── bgm.mp3
│       ├── correct-sfx.mp3
│       ├── wrong-sfx.mp3
│       ├── highscore-sfx.mp3
│       └── perfect-sfx.mp3
├── package.json          # Project configuration and scripts
└── README.md             # This file
```

## 🛠 Technical Details

### Architecture

- **ES6 Classes**: Modern JavaScript with class-based architecture
- **Module Pattern**: Separate concerns into focused modules
- **Event-Driven**: Responsive user interface with proper event handling
- **Error Boundaries**: Graceful error handling and user feedback

### Dependencies

- **Bootstrap 5.3.0**: UI framework for responsive design
- **Bootstrap Icons**: Icon font for consistent UI elements
- **Vanta.js**: Animated background effects
- **Three.js**: 3D graphics library for background animations

### Browser Support

- **Modern Browsers**: Chrome 60+, Firefox 60+, Safari 12+, Edge 79+
- **Mobile Browsers**: iOS Safari 12+, Chrome Mobile 60+
- **Features**: ES6 classes, async/await, CSS Grid, Flexbox

## 🎨 Customization

### Adding New Words

Edit `js/words.js` to add new words to the database:

```javascript
const WORDS = [
  // Add your words here
  "example",
  "custom",
  "words",
];
```

### Themes and Colors

Modify CSS custom properties in `css/styles.css`:

```css
:root {
  --primary-color: #275e66;
  --accent-color: #ff6b6b;
  --secondary-color: #a5d8dd;
  /* ... */
}
```

### Audio Files

Replace audio files in `assets/audio/` with your own sounds:

- `bgm.mp3`: Background music (should loop)
- `correct-sfx.mp3`: Correct answer sound
- `wrong-sfx.mp3`: Wrong answer sound
- `highscore-sfx.mp3`: New high score sound
- `perfect-sfx.mp3`: Perfect game sound

## 📱 Responsive Design

The game automatically adapts to different screen sizes:

- **Desktop**: Full layout with all features
- **Tablet**: Optimized button sizes and spacing
- **Mobile**: Touch-friendly interface with adjusted layouts

## ♿ Accessibility

- **Keyboard Navigation**: Full game playable with keyboard
- **Screen Readers**: ARIA labels and semantic HTML
- **High Contrast**: Clear visual distinction between elements
- **Reduced Motion**: Respects user's motion preferences

## 🔧 Development

### Scripts

```bash
npm run start    # Start production server
npm run dev      # Start development server with live reload
npm run build    # Build for production (future enhancement)
npm run test     # Run tests (future enhancement)
```

### Code Style

- **ES6+**: Modern JavaScript features
- **JSDoc**: Function documentation
- **Modular**: Separate files for different concerns
- **Error Handling**: Comprehensive try-catch blocks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Bootstrap Team**: For the excellent UI framework
- **Vanta.js**: For beautiful animated backgrounds
- **Three.js Community**: For 3D graphics capabilities
- **Web Audio API**: For advanced audio control

## 🔮 Future Enhancements

- [ ] User accounts and cloud save
- [ ] Multiplayer mode
- [ ] Daily challenges
- [ ] Achievement system
- [ ] Word categories and themes
- [ ] Progressive Web App (PWA)
- [ ] Social sharing features
- [ ] Leaderboards
- [ ] Power-ups and special abilities
- [ ] Custom word lists

---

**Made with ❤️ by [itsLatifur](https://github.com/itsLatifur)**
