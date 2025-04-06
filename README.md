# Block Breaker

A modern take on the classic arcade brick-breaking game with a sci-fi twist. Break all the bricks with your glowing paddle and ball to win!

![Block Breaker Game](images/game-preview.jpg)

## Live Demo

[Play Block Breaker Online](https://shraddhakumbhar1.github.io/block-breaker/)

## Features

- **Neon Sci-Fi Aesthetic**: Sleek dark background with glowing elements and grid pattern
- **Dynamic Ball Physics**: Realistic ball movement and brick collision detection
- **Visual Effects**: 
  - Glowing trails behind the ball
  - Particle effects when bricks break
  - Pulsing effect when ball is ready to launch
- **Game Elements**:
  - Multiple difficulty levels (speed settings)
  - Lives system with heart icons
  - Score tracking
  - Timer that starts only when ball is launched
  - Game Over and Win screens with stats
- **Responsive Controls**: Control with mouse or keyboard

## How to Play

1. Click "Play" to start the game
2. Click or press Space to launch the ball from the paddle
3. Move the paddle to bounce the ball and hit all the bricks
4. Clear all bricks to win!
5. If the ball falls below the paddle, you lose a life
6. Game ends when all lives are lost

## Controls

- **Mouse**: Move the mouse to control the paddle
- **Keyboard**: Use A/D or Left/Right arrows to move the paddle
- **Launch Ball**: Click or press any key when the ball is on the paddle
- **Reset Game**: Click the Reset button to start over

## Technical Details

- Built with vanilla JavaScript, HTML5, and CSS3
- Utilizes HTML5 Canvas for rendering
- No external libraries or dependencies
- Responsive design that works on different screen sizes

## Game Mechanics

- Each brick destroyed adds to your score
- Different colored bricks create unique visual effects when broken
- Ball speed increases at higher difficulty levels
- Ball direction changes based on where it hits the paddle for strategic gameplay
- Timer tracks how long it takes to clear all bricks

## Developer Notes

For testing purposes, the game includes hidden cheat codes:
- Type `011` before starting the game to enable "penetration mode" (ball goes through bricks without bouncing)
- Type `033` before starting to instantly win when the game starts

These features are not visible in the UI and are intended for testing only.

## Installation

To run this game locally:

1. Clone this repository
```
git clone https://github.com/shraddhakumbhar1/block-breaker.git
```

2. Open the folder and launch `index.html` in your browser

No build process or dependencies required!

## Credits

Developed with ❤️ using HTML, CSS, and JavaScript.

## License

MIT License - Feel free to use and modify for your own projects!