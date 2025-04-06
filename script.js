const resetButton = document.getElementById('reset-button');
const returnButton = document.getElementById('return-button');
const nextLevelButton = document.getElementById('next-level-button');
const gameContainer = document.getElementById('game-container');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Check if context was obtained successfully
if (!ctx) {
    console.error("Failed to get canvas context!");
    alert("Your browser doesn't support the canvas element. Please try a different browser.");
}

const scoreElement = document.getElementById('score-value');
const livesElement = document.getElementById('heart-container');
const timerElement = document.getElementById('time-value');
const infoBar = document.getElementById('info-bar'); // Need this to set canvas width
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreElement = document.getElementById('final-score');
const finalTimeElement = document.getElementById('final-time');
const restartButton = document.getElementById('restart-button');
const winScreen = document.getElementById('win-screen');
const winScoreElement = document.getElementById('win-score');
const winTimeElement = document.getElementById('win-time');
const playAgainButton = document.getElementById('play-again-button');
const speedSelector = document.getElementById('speed-selector');

// Game constants
const PADDLE_HEIGHT = 15;
const PADDLE_WIDTH = 100;
const BALL_RADIUS = 10;
const BRICK_ROW_COUNT = 5;
const BRICK_COLUMN_COUNT = 9;
const BRICK_WIDTH = 75;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP = 30;
const BRICK_OFFSET_LEFT = 30;
// Modern sci-fi palette with neon colors
const BRICK_COLORS = [
    "#00e5ff", // Cyan
    "#7c4dff", // Purple
    "#18ffff", // Light blue
    "#ff00e5", // Magenta
    "#7700ff"  // Violet
];
const INITIAL_LIVES = 3;
const HEART_SYMBOL = '♥';

// Particles array for visual effects
let particles = [];

// Ball trail array to store previous positions
const TRAIL_LENGTH = 5; // Number of trail positions to keep
let ballTrail = [];

// Confetti array and settings
let confetti = [];
const CONFETTI_COUNT = 150; // Number of confetti particles
const CONFETTI_COLORS = ['#00e5ff', '#ff00e5', '#7700ff', '#00ff9d', '#ffff00', '#ff3860'];
const CONFETTI_SHAPES = ['circle', 'square', 'triangle', 'line'];

// Set Canvas Dimensions (using info bar width as reference)
canvas.width = 800; // As defined in CSS for #info-bar
canvas.height = 600;
infoBar.style.width = `${canvas.width}px`; // Ensure info bar matches canvas width dynamically

// Game variables
let paddleX = (canvas.width - PADDLE_WIDTH) / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height - PADDLE_HEIGHT - BALL_RADIUS - 5; // Start slightly above paddle
let ballDX = 1; // Starting with slow speed
let ballDY = -1; // Starting with slow speed
let ballBaseSpeed = 1; // Base speed multiplier
let score = 0;
let lives = INITIAL_LIVES;
let bricks = [];
let gameInterval = null;
let timerInterval = null;
let secondsElapsed = 0;
let gameRunning = false;
let ballStuckToPaddle = true; // Ball starts stuck to paddle
let leftPressed = false; // Track if left key is pressed
let rightPressed = false; // Track if right key is pressed
let paddleSpeed = 4; // Reduced from 8 to 4 for lower sensitivity
let timerStarted = false; // Track if timer has been started

// --- Initialization ---

function initializeBricks() {
    bricks = [];
    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
        bricks[c] = [];
        for (let r = 0; r < BRICK_ROW_COUNT; r++) {
            const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
            const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
            bricks[c][r] = {
                x: brickX,
                y: brickY,
                status: 1, // 1: visible, 0: broken
                color: BRICK_COLORS[r % BRICK_COLORS.length] // Cycle through colors per row
            };
        }
    }
}

function initializeGame() {
    score = 0;
    lives = INITIAL_LIVES;
    secondsElapsed = 0;
    paddleX = (canvas.width - PADDLE_WIDTH) / 2;
    ballX = canvas.width / 2;
    ballY = canvas.height - PADDLE_HEIGHT - BALL_RADIUS - 2; // Position just above paddle
    
    // Set ball speed based on speedSelector value
    ballBaseSpeed = parseInt(speedSelector.value);
    ballDX = ballBaseSpeed * (Math.random() < 0.5 ? 1 : -1); // Apply selected speed
    ballDY = -ballBaseSpeed; // Apply selected speed
    
    // Ball starts stuck to paddle
    ballStuckToPaddle = true;
    
    scoreElement.textContent = score;
    timerElement.textContent = secondsElapsed;
    updateLivesDisplay();
    initializeBricks();
}

// --- Drawing Functions ---

function drawPaddle() {
    // Main paddle body
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - PADDLE_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT);
    const paddleGradient = ctx.createLinearGradient(
        paddleX, canvas.height - PADDLE_HEIGHT, 
        paddleX, canvas.height
    );
    paddleGradient.addColorStop(0, '#141b2d');
    paddleGradient.addColorStop(1, '#0a0e17');
    ctx.fillStyle = paddleGradient;
    ctx.fill();
    ctx.closePath();
    
    // Glowing edge
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - PADDLE_HEIGHT, PADDLE_WIDTH, 2);
    ctx.fillStyle = '#00e5ff';
    ctx.fill();
    ctx.closePath();
    
    // Add side accents
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - PADDLE_HEIGHT, 2, PADDLE_HEIGHT);
    ctx.rect(paddleX + PADDLE_WIDTH - 2, canvas.height - PADDLE_HEIGHT, 2, PADDLE_HEIGHT);
    ctx.fillStyle = '#00e5ff';
    ctx.fill();
    ctx.closePath();
    
    // Add glow effect
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - PADDLE_HEIGHT, PADDLE_WIDTH, 2);
    ctx.fillStyle = 'rgba(0, 229, 255, 0.5)';
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
}

function drawBall() {
    // Draw ball trail first (so it's behind the ball)
    drawBallTrail();
    
    ctx.beginPath();
    
    // If ball is stuck to paddle, add a pulsing effect
    let radius = BALL_RADIUS;
    if (ballStuckToPaddle && gameRunning) {
        // Create a pulsing effect using sine wave
        const pulseFactor = Math.sin(Date.now() / 200) * 0.15 + 1; // Oscillates between 0.85 and 1.15
        radius *= pulseFactor;
        
        // Draw a faint circle around the ball
        ctx.beginPath();
        ctx.arc(ballX, ballY, radius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
        ctx.fill();
        ctx.closePath();
    }
    
    ctx.beginPath();
    ctx.arc(ballX, ballY, radius, 0, Math.PI * 2);
    
    // Create radial gradient for the ball
    const ballGradient = ctx.createRadialGradient(
        ballX, ballY, 0,
        ballX, ballY, radius
    );
    ballGradient.addColorStop(0, '#ffffff');
    ballGradient.addColorStop(0.7, '#ff00e5');
    ballGradient.addColorStop(1, '#7700ff');
    
    ctx.fillStyle = ballGradient;
    ctx.fill();
    ctx.closePath();
    
    // Add glow effect
    ctx.shadowColor = '#ff00e5';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(ballX, ballY, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 0, 229, 0.5)';
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
}

function drawBricks() {
    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
        for (let r = 0; r < BRICK_ROW_COUNT; r++) {
            if (bricks[c][r].status === 1) {
                const brick = bricks[c][r];
                
                // Draw main brick body
                ctx.beginPath();
                ctx.rect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);
                ctx.fillStyle = brick.color;
                ctx.fill();
                ctx.closePath();
                
                // Draw highlight at top of brick for 3D effect
                ctx.beginPath();
                ctx.rect(brick.x, brick.y, BRICK_WIDTH, 2);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fill();
                ctx.closePath();
                
                // Draw inner rectangle for tech look
                ctx.beginPath();
                ctx.rect(brick.x + 3, brick.y + 3, BRICK_WIDTH - 6, BRICK_HEIGHT - 6);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.stroke();
                ctx.closePath();
            }
        }
    }
}

function updateLivesDisplay() {
    livesElement.textContent = HEART_SYMBOL.repeat(lives);
}

function drawScore() {
    scoreElement.textContent = score;
}

function drawTimer() {
    timerElement.textContent = secondsElapsed;
}

// --- Movement and Collision ---

function handleMouseMove(e) {
    // Calculate position relative to the canvas, not the whole window
    const canvasRect = canvas.getBoundingClientRect();
    const relativeX = e.clientX - canvasRect.left;

    // Only update if mouse is within canvas bounds horizontally
    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - PADDLE_WIDTH / 2;
        // Keep paddle within bounds
        if (paddleX < 0) {
            paddleX = 0;
        }
        if (paddleX + PADDLE_WIDTH > canvas.width) {
            paddleX = canvas.width - PADDLE_WIDTH;
        }
        
        // Update ball position if it's stuck to the paddle
        if (ballStuckToPaddle) {
            ballX = paddleX + PADDLE_WIDTH / 2;
        }
    }
}

// Handle keyboard controls for paddle movement
function handleKeyDown(e) {
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        rightPressed = true;
    } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        leftPressed = true;
    }
}

function handleKeyUp(e) {
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        rightPressed = false;
    } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        leftPressed = false;
    }
}

// Update paddle position based on keyboard input
function updatePaddlePosition() {
    if (rightPressed) {
        paddleX += paddleSpeed;
        if (paddleX + PADDLE_WIDTH > canvas.width) {
            paddleX = canvas.width - PADDLE_WIDTH;
        }
    } else if (leftPressed) {
        paddleX -= paddleSpeed;
        if (paddleX < 0) {
            paddleX = 0;
        }
    }
    
    // Update ball position if it's stuck to the paddle
    if (ballStuckToPaddle) {
        ballX = paddleX + PADDLE_WIDTH / 2;
    }
}

// Handle releasing the ball from paddle
function releaseBall() {
    if (ballStuckToPaddle && gameRunning) {
        ballStuckToPaddle = false;
        // Give the ball a slight upward velocity
        ballDY = -ballBaseSpeed;
        // Add some horizontal velocity based on position on paddle
        let deltaX = ballX - (paddleX + PADDLE_WIDTH / 2);
        ballDX = deltaX * 0.1; // Smaller value for more controlled start
        
        // Start the timer when the ball is first launched
        if (!timerStarted) {
            startTimer();
            timerStarted = true;
        }
        
        // Add visual feedback when ball is released
        createParticles(ballX, ballY, "#00e5ff");
    }
}

function collisionDetection() {
    // Ball collision with bricks
    for (let c = 0; c < BRICK_COLUMN_COUNT; c++) {
        for (let r = 0; r < BRICK_ROW_COUNT; r++) {
            const brick = bricks[c][r];
            if (brick.status === 1) {
                if (
                    ballX + BALL_RADIUS > brick.x &&
                    ballX - BALL_RADIUS < brick.x + BRICK_WIDTH &&
                    ballY + BALL_RADIUS > brick.y &&
                    ballY - BALL_RADIUS < brick.y + BRICK_HEIGHT
                ) {
                    // Determine which side of the brick was hit
                    // Calculate distances from ball center to brick edges
                    const distLeft = Math.abs((ballX + BALL_RADIUS) - brick.x);
                    const distRight = Math.abs(ballX - BALL_RADIUS - (brick.x + BRICK_WIDTH));
                    const distTop = Math.abs((ballY + BALL_RADIUS) - brick.y);
                    const distBottom = Math.abs(ballY - BALL_RADIUS - (brick.y + BRICK_HEIGHT));
                    
                    // Find the smallest distance to determine which side was hit
                    const minDist = Math.min(distLeft, distRight, distTop, distBottom);
                    
                    // Reverse appropriate direction based on which side was hit
                    if (minDist === distLeft || minDist === distRight) {
                        ballDX = -ballDX; // Horizontal collision (left or right)
                    } else {
                        ballDY = -ballDY; // Vertical collision (top or bottom)
                    }
                    
                    brick.status = 0;
                    score++;
                    drawScore();
                    
                    // Create particle effect when brick breaks
                    createParticles(brick.x, brick.y, brick.color);
                }
            }
        }
    }

    // Check for win condition AFTER checking all bricks
    if (score === BRICK_ROW_COUNT * BRICK_COLUMN_COUNT) {
        if (gameRunning) { // Ensure win screen only shows if game is actually running
            showWinScreen();
            return; // Exit collision detection early if win condition met
        }
    }

    // Skip other collision checks if ball is stuck to paddle
    if (ballStuckToPaddle) {
        return;
    }

    // Ball collision with walls
    if (ballX + ballDX > canvas.width - BALL_RADIUS || ballX + ballDX < BALL_RADIUS) {
        ballDX = -ballDX; // Bounce off left/right walls
    }
    if (ballY + ballDY < BALL_RADIUS) {
        ballDY = -ballDY; // Bounce off top wall
        
        // Add a small random horizontal component to prevent vertical loops
        const jitter = (Math.random() - 0.5) * 0.5;
        ballDX += jitter;
        
        // Ensure ball doesn't get too fast or slow horizontally
        if (Math.abs(ballDX) > ballBaseSpeed * 2) {
            ballDX = ballDX > 0 ? ballBaseSpeed * 2 : -ballBaseSpeed * 2;
        }
        if (Math.abs(ballDX) < 0.5) {
            ballDX = ballDX > 0 ? 0.5 : -0.5;
        }
    } else if (ballY + ballDY > canvas.height - BALL_RADIUS - PADDLE_HEIGHT) {
        // Check collision with paddle
        if (ballX > paddleX && ballX < paddleX + PADDLE_WIDTH) {
            // Make sure the ball is actually moving down
            if (ballDY > 0) {
                ballDY = -ballDY;
                // Change angle based on hit position
                let deltaX = ballX - (paddleX + PADDLE_WIDTH / 2);
                ballDX = deltaX * 0.15; // Make bounce angle dependent on hit location
                
                // Ensure minimum horizontal velocity to prevent getting stuck in vertical paths
                const minSpeed = 0.5;
                if (Math.abs(ballDX) < minSpeed) {
                    ballDX = ballDX < 0 ? -minSpeed : minSpeed;
                }
                
                // Ensure ball is always above paddle to prevent getting stuck
                if (ballY > canvas.height - PADDLE_HEIGHT - BALL_RADIUS - 1) {
                    ballY = canvas.height - PADDLE_HEIGHT - BALL_RADIUS - 1;
                }
            }
        } else if (ballY + ballDY > canvas.height - BALL_RADIUS) {
             // Ball missed the paddle and hit the bottom wall
            lives--;
            updateLivesDisplay();
            if (lives <= 0) {
                endGame();
            } else {
                // Reset ball and paddle position for next life
                // Center the paddle
                paddleX = (canvas.width - PADDLE_WIDTH) / 2;
                // Position ball on paddle
                ballX = paddleX + PADDLE_WIDTH / 2;
                ballY = canvas.height - PADDLE_HEIGHT - BALL_RADIUS - 2;
                // Make ball stick to paddle and wait for user input
                ballStuckToPaddle = true;
                // Create "reset" particles as visual indicator
                createParticles(ballX, ballY + 10, "#ff3860");
            }
        }
    }
}

// Create brick breaking particle effect
function createParticles(x, y, color) {
    const particleCount = 10;
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: x + BRICK_WIDTH / 2,
            y: y + BRICK_HEIGHT / 2,
            radius: Math.random() * 3 + 1,
            color: color,
            speed: Math.random() * 3 + 1,
            angle: Math.random() * Math.PI * 2,
            life: 30 + Math.random() * 20
        });
    }
}

// Draw particles
function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        
        // Make particles fade out
        const alpha = p.life / 50;
        ctx.fillStyle = `rgba(${hexToRgb(p.color).r}, ${hexToRgb(p.color).g}, ${hexToRgb(p.color).b}, ${alpha})`;
        ctx.fill();
        ctx.closePath();
        
        // Add glow to particles
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0;
        
        // Update particle position
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;
        
        // Decrease life
        p.life--;
    }
    
    // Remove dead particles
    particles = particles.filter(p => p.life > 0);
}

// Helper function to convert hex color to rgb
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

// --- Game Loop ---

function update() {
    updatePaddlePosition(); // Update paddle position based on keyboard input
    collisionDetection();
    
    // Only update ball position if it's not stuck to paddle
    if (!ballStuckToPaddle) {
        // Store current position in trail before updating
        if (ballTrail.length >= TRAIL_LENGTH) {
            ballTrail.shift(); // Remove oldest position
        }
        ballTrail.push({x: ballX, y: ballY}); // Add current position
        
        ballX += ballDX;
        ballY += ballDY;
    } else {
        // Make sure ball stays on paddle
        ballX = paddleX + PADDLE_WIDTH / 2;
        ballY = canvas.height - PADDLE_HEIGHT - BALL_RADIUS - 2;
        
        // Clear the trail when ball is stuck to paddle
        ballTrail = [];
    }
}

function draw() {
    // Clear canvas before drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw game grid background for sci-fi effect
    drawGridBackground();
    
    drawBricks();
    drawBall();
    drawPaddle();
    drawParticles(); // Draw all active particles
    
    // Draw instruction when ball is stuck to paddle
    if (ballStuckToPaddle && gameRunning) {
        drawReleaseInstruction();
    }
}

function gameLoop() {
    console.log("gameLoop: Frame start"); // Log: Animation frame started
    if (!gameRunning) {
        console.log("gameLoop: Exiting (gameRunning is false)"); // Log: Loop stop condition
        return;
    }
    update();
    draw();
    // Use requestAnimationFrame for smoother animation
    gameInterval = requestAnimationFrame(gameLoop);
}

function startTimer() {
    clearInterval(timerInterval); // Clear any existing timer
    timerInterval = setInterval(() => {
        secondsElapsed++;
        drawTimer();
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function startGame() {
    // Freeze the game first
    freezeGameState();
    
    try {
        if (gameRunning) {
            console.log("Game already running, returning");
            return;
        }
        
        // Disable speed selector during gameplay
        speedSelector.disabled = true;
        
        // Force canvas dimensions - this is crucial
        canvas.width = 800;
        canvas.height = 600;
        
        console.log("Canvas dimensions:", canvas.width, "x", canvas.height);
        
        // Initialize game
        initializeGame();
        
        // Reset timer state
        stopTimer();
        secondsElapsed = 0;
        timerStarted = false;
        timerElement.textContent = secondsElapsed;
        
        // Manually draw the first frame
        drawBricks();
        drawBall();
        drawPaddle();
        
        console.log("Initial state drawn");
        
        // Start the game (but not the timer yet)
        gameRunning = true;
        gameLoop();
    } catch (error) {
        console.error("Error in startGame:", error);
        alert("Error starting game: " + error.message);
    }
}

function endGame() {
    // Freeze the game first
    freezeGameState();
    
    // Update game over screen
    finalScoreElement.textContent = score; // Display final score
    finalTimeElement.textContent = secondsElapsed; // Display final time
    
    // Create and add overlay background for blur effect
    createOverlayBackground();
    
    // Show game over screen
    gameOverScreen.style.display = 'block';
    
    // Enable speed selector for next game
    speedSelector.disabled = false;
}

function showWinScreen() {
    // Freeze the game first
    freezeGameState();
    
    // Update win screen
    winScoreElement.textContent = score;
    winTimeElement.textContent = secondsElapsed;
    
    // Create and add overlay background for blur effect
    createOverlayBackground();
    
    // Enable or disable Next Level button based on current speed
    const currentSpeed = parseInt(speedSelector.value);
    if (currentSpeed < 3) {
        nextLevelButton.style.display = 'block';
        nextLevelButton.textContent = `Next Level (Speed ${currentSpeed + 1})`;
    } else {
        nextLevelButton.style.display = 'none';
    }
    
    winScreen.style.display = 'block';
    
    // Enable speed selector for next game
    speedSelector.disabled = false;
    
    // Start confetti animation after 2 seconds
    setTimeout(createConfetti, 2000);
}

// Helper function to create the blurred overlay background
function createOverlayBackground() {
    // Remove any existing overlay
    removeOverlayBackground();
    
    // Create the overlay element
    const overlay = document.createElement('div');
    overlay.className = 'overlay-background';
    overlay.id = 'blur-overlay';
    
    // Add it to the DOM as the first child of the container
    const container = document.querySelector('.container');
    container.insertBefore(overlay, container.firstChild);
}

// Helper function to remove the blurred overlay background
function removeOverlayBackground() {
    const existingOverlay = document.getElementById('blur-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
}

// Add grid background for sci-fi effect
function drawGridBackground() {
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Draw horizontal lines
    const gridSize = 30;
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
        ctx.closePath();
    }
    
    // Draw vertical lines
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
        ctx.closePath();
    }
}

// Function to draw the release instruction
function drawReleaseInstruction() {
    ctx.save(); // Save the current state
    
    // Draw instruction text
    ctx.font = "18px 'Orbitron'";
    ctx.fillStyle = "#00e5ff";
    ctx.textAlign = "center";
    const text = "CLICK or PRESS ANY KEY to LAUNCH";
    
    // Add glow effect
    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 10;
    
    // Position text above the ball
    ctx.fillText(text, canvas.width / 2, canvas.height - 150);
    
    // Add animated arrow pointing to the ball
    const arrowY = canvas.height - 120 + Math.sin(Date.now() / 300) * 5; // Subtle animation
    
    // Draw the arrow
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, arrowY);
    ctx.lineTo(canvas.width / 2 - 10, arrowY - 10);
    ctx.lineTo(canvas.width / 2 + 10, arrowY - 10);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore(); // Restore the original state
}

// Function to freeze the game state
function freezeGameState() {
    // Draw one last frame to ensure everything is visible
    // for the blurred background
    draw();
    
    // Stop the game loop and timer
    gameRunning = false;
    cancelAnimationFrame(gameInterval);
    stopTimer();
}

// Function to reset the game
function resetGame() {
    // Stop any existing game
    freezeGameState();
    
    // Reset game variables
    score = 0;
    lives = INITIAL_LIVES;
    secondsElapsed = 0;
    timerStarted = false;
    
    // Reset ball and paddle positions
    paddleX = (canvas.width - PADDLE_WIDTH) / 2;
    ballX = canvas.width / 2;
    ballY = canvas.height - PADDLE_HEIGHT - BALL_RADIUS - 2;
    ballStuckToPaddle = true;
    
    // Clear the ball trail
    ballTrail = [];
    
    // Reset ball speed based on selector
    ballBaseSpeed = parseInt(speedSelector.value);
    ballDX = ballBaseSpeed * (Math.random() < 0.5 ? 1 : -1);
    ballDY = -ballBaseSpeed;
    
    // Update UI
    scoreElement.textContent = score;
    timerElement.textContent = secondsElapsed;
    updateLivesDisplay();
    
    // Reinitialize bricks
    initializeBricks();
    
    // Draw the reset game state
    draw();
    
    // Start game automatically
    startGame();
}

// --- Event Listeners ---
resetButton.addEventListener('click', resetGame);
restartButton.addEventListener('click', function() {
    gameOverScreen.style.display = 'none';
    removeOverlayBackground();
    startGame();
});
playAgainButton.addEventListener('click', function() {
    winScreen.style.display = 'none';
    removeOverlayBackground();
    // Clear confetti
    confetti = [];
    // Remove confetti canvas if it exists
    const confettiCanvas = document.getElementById('confetti-canvas');
    if (confettiCanvas) {
        confettiCanvas.remove();
    }
    startGame();
});
returnButton.addEventListener('click', function() {
    gameOverScreen.style.display = 'none';
    removeOverlayBackground();
    resetGame();
});
nextLevelButton.addEventListener('click', function() {
    // In a future version this would load the next level
    // For now, we'll just increase the speed and restart
    let currentSpeed = parseInt(speedSelector.value);
    if (currentSpeed < 3) {
        speedSelector.value = (currentSpeed + 1).toString();
    }
    winScreen.style.display = 'none';
    removeOverlayBackground();
    // Clear confetti
    confetti = [];
    // Remove confetti canvas if it exists
    const confettiCanvas = document.getElementById('confetti-canvas');
    if (confettiCanvas) {
        confettiCanvas.remove();
    }
    startGame();
});
document.addEventListener('mousemove', handleMouseMove, false);

// Add keyboard event listeners for paddle control
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

// Add event listeners for releasing ball
canvas.addEventListener('click', releaseBall);
document.addEventListener('keydown', function(e) {
    // Any key will release the ball
    releaseBall();
});

// Add event listener for speed selector
speedSelector.addEventListener('change', function() {
    ballBaseSpeed = parseInt(this.value);
    console.log("Speed changed to:", ballBaseSpeed);
});

// New function to draw the ball trail
function drawBallTrail() {
    // Only draw trail if ball is moving (not stuck to paddle)
    if (ballStuckToPaddle || ballTrail.length === 0) return;
    
    // Draw each trail position with decreasing opacity
    for (let i = 0; i < ballTrail.length; i++) {
        const pos = ballTrail[i];
        // Calculate opacity based on position in trail (newer = more opaque)
        const opacity = 0.6 * (i + 1) / ballTrail.length;
        const radius = BALL_RADIUS * (0.7 + (i / ballTrail.length) * 0.3);
        
        // Draw trail circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 0, 229, ${opacity})`;
        ctx.fill();
        ctx.closePath();
    }
}

// Function to create confetti
function createConfetti() {
    // Clear any existing confetti
    confetti = [];
    
    // Create new confetti particles
    for (let i = 0; i < CONFETTI_COUNT; i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: -20 - Math.random() * 100, // Start above the screen
            size: Math.random() * 8 + 2,
            color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
            shape: CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)],
            speedX: Math.random() * 3 - 1.5, // Random horizontal velocity
            speedY: Math.random() * 3 + 2, // Downward velocity
            rotation: Math.random() * 360, // Initial rotation
            rotationSpeed: (Math.random() * 2 - 1) * 3, // Rotation speed
            gravity: 0.1 + Math.random() * 0.1,
            opacity: 1,
            life: Math.random() * 200 + 150 // How long the confetti will last
        });
    }
    
    // Start the confetti animation
    animateConfetti();
}

// Function to animate confetti
function animateConfetti() {
    // If no confetti or win screen is hidden, stop animation
    if (confetti.length === 0 || winScreen.style.display === 'none') {
        return;
    }
    
    // Get the win screen dimensions and position
    const winScreenRect = winScreen.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    
    // Create a temporary canvas for the confetti
    const confettiCanvas = document.createElement('canvas');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    confettiCanvas.style.position = 'fixed';
    confettiCanvas.style.top = '0';
    confettiCanvas.style.left = '0';
    confettiCanvas.style.pointerEvents = 'none'; // Make sure it doesn't block clicks
    confettiCanvas.style.zIndex = '15'; // Above the win screen
    confettiCanvas.id = 'confetti-canvas';
    
    // Remove any existing confetti canvas
    const existingCanvas = document.getElementById('confetti-canvas');
    if (existingCanvas) {
        existingCanvas.remove();
    }
    
    // Add the canvas to the document
    document.body.appendChild(confettiCanvas);
    
    // Get context for drawing
    const ctx = confettiCanvas.getContext('2d');
    
    // Animation function
    function animate() {
        // Clear canvas
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        
        // Update and draw confetti
        for (let i = 0; i < confetti.length; i++) {
            const p = confetti[i];
            
            // Update position
            p.x += p.speedX;
            p.y += p.speedY;
            p.speedY += p.gravity; // Apply gravity
            p.rotation += p.rotationSpeed;
            
            // Reduce life
            p.life--;
            
            // If confetti is off-screen or life is over, recycle it
            if (p.y > confettiCanvas.height + 20 || p.life <= 0) {
                if (Math.random() < 0.3) { // 30% chance to remove instead of recycle
                    confetti.splice(i, 1);
                    i--;
                    continue;
                } else {
                    // Recycle by putting it back at the top
                    p.y = -20;
                    p.life = Math.random() * 100 + 50;
                }
            }
            
            // Start fading out as life decreases
            if (p.life < 50) {
                p.opacity = p.life / 50;
            }
            
            // Draw confetti
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.opacity;
            
            // Draw different shapes
            switch (p.shape) {
                case 'circle':
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'square':
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                    break;
                case 'triangle':
                    ctx.beginPath();
                    ctx.moveTo(0, -p.size);
                    ctx.lineTo(-p.size, p.size);
                    ctx.lineTo(p.size, p.size);
                    ctx.closePath();
                    ctx.fill();
                    break;
                case 'line':
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = p.size / 3;
                    ctx.beginPath();
                    ctx.moveTo(0, -p.size);
                    ctx.lineTo(0, p.size);
                    ctx.stroke();
                    break;
            }
            
            ctx.restore();
        }
        
        // Continue animation if there's still confetti and win screen is showing
        if (confetti.length > 0 && winScreen.style.display !== 'none') {
            requestAnimationFrame(animate);
        } else {
            // Remove canvas when done
            confettiCanvas.remove();
        }
    }
    
    // Start animation
    animate();
}

// Initial Setup - automatically start the game when the page loads
window.addEventListener('load', function() {
    initializeBricks();
    drawBricks();
    updateLivesDisplay();
    drawScore();
    drawTimer();
    
    // Start game automatically after a short delay
    setTimeout(startGame, 500);
}); 