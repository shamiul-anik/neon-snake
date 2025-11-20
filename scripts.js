/**
 * CONFIGURATION
 */
const TILE_SIZE = 25; // Slightly bigger tiles
const GAME_SPEED = 110; // Milliseconds per move (lower is faster logic, but animation is 60fps)

/**
 * GAME STATE
 */
let canvas, ctx;
let gridWidth, gridHeight;

let snake = [];
let snakeDir = { x: 0, y: 0 }; // Current movement direction
let nextDir = { x: 0, y: -1 }; // Buffered direction
let food = { x: 0, y: 0 };
let particles = []; // Explosion particles

let score = 0;
let highScore = localStorage.getItem("snakeHighScore") || 0;
let isGameRunning = false;

// Timing & Animation
let lastTime = 0;
let moveAccumulator = 0; // Accumulates time to trigger next grid move
let lastMovePercent = 0; // 0.0 to 1.0, for smooth interpolation

// Input Buffer
let inputQueue = [];

// Touch
let touchStartX = 0;
let touchStartY = 0;

// DOM
const scoreEl = document.getElementById("score-val");
const highScoreEl = document.getElementById("high-score-val");
const finalScoreEl = document.getElementById("final-score");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");

window.onload = function () {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d", { alpha: false }); // Optimization

  highScoreEl.innerText = highScore;

  resizeGame();
  window.addEventListener("resize", resizeGame);

  // Input
  document.addEventListener("keydown", handleKeyDown);
  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", startGame);

  // Touch
  canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
  canvas.addEventListener("touchmove", handleTouchMove, { passive: false });

  // Start Render Loop
  requestAnimationFrame(gameLoop);
};

function resizeGame() {
  // Make canvas roughly 85% of screen, rounding to nearest tile size
  const maxWidth = window.innerWidth * 0.95;
  const maxHeight = window.innerHeight * 0.8;

  // Calculate grid dimensions
  const cols = Math.floor(maxWidth / TILE_SIZE);
  const rows = Math.floor(maxHeight / TILE_SIZE);

  gridWidth = cols;
  gridHeight = rows;

  canvas.width = cols * TILE_SIZE;
  canvas.height = rows * TILE_SIZE;

  // If game is not running, center the snake for the new size if we were to start
  if (!isGameRunning) {
    // Optional: could redraw static background
    draw();
  }
}

function startGame() {
  // Initialize Snake in middle
  const startX = Math.floor(gridWidth / 2);
  const startY = Math.floor(gridHeight / 2);

  snake = [
    { x: startX, y: startY },
    { x: startX, y: startY + 1 },
    { x: startX, y: startY + 2 },
  ];

  snakeDir = { x: 0, y: -1 };
  nextDir = { x: 0, y: -1 };
  inputQueue = [];

  score = 0;
  scoreEl.innerText = score;

  moveAccumulator = 0;
  lastMovePercent = 0;
  particles = []; // Clear particles

  placeFood();

  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  isGameRunning = true;
}

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  if (isGameRunning) {
    updatePhysics(deltaTime);
  }

  updateParticles(deltaTime); // Particles update even on game over? Maybe.
  draw();

  requestAnimationFrame(gameLoop);
}

/**
 * LOGIC UPDATE
 */
function updatePhysics(deltaTime) {
  moveAccumulator += deltaTime;

  // Calculate interpolation percentage (0 to 1) for smooth rendering
  // We cap it at 1.0 so it doesn't visually overshoot before the logic snap occurs
  lastMovePercent = Math.min(moveAccumulator / GAME_SPEED, 1.0);

  // Time to move one grid cell?
  if (moveAccumulator >= GAME_SPEED) {
    moveAccumulator -= GAME_SPEED;
    lastMovePercent = 0; // Reset interpolation

    // Process Input
    if (inputQueue.length > 0) {
      const nextInput = inputQueue.shift();
      // Prevent 180 turns
      if (nextInput.x !== -snakeDir.x && nextInput.y !== -snakeDir.y) {
        snakeDir = nextInput;
      }
    }

    moveSnake();
  }
}

function moveSnake() {
  const head = { x: snake[0].x + snakeDir.x, y: snake[0].y + snakeDir.y };

  // Wall Collision
  if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
    gameOver();
    return;
  }

  // Self Collision
  for (let i = 0; i < snake.length - 1; i++) {
    // -1 because tail will move
    if (head.x === snake[i].x && head.y === snake[i].y) {
      gameOver();
      return;
    }
  }

  snake.unshift(head);

  // Eat Food
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.innerText = score;
    createExplosion(head.x, head.y, "#ff0055");
    placeFood();
    // Grow: don't pop tail
  } else {
    snake.pop();
  }
}

function gameOver() {
  isGameRunning = false;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("snakeHighScore", highScore);
    highScoreEl.innerText = highScore;
  }
  finalScoreEl.innerText = score;
  gameOverScreen.classList.remove("hidden");
}

function placeFood() {
  let valid = false;
  while (!valid) {
    food.x = Math.floor(Math.random() * gridWidth);
    food.y = Math.floor(Math.random() * gridHeight);

    valid = true;
    // Check collision with snake
    for (let s of snake) {
      if (s.x === food.x && s.y === food.y) {
        valid = false;
        break;
      }
    }
  }
}

/**
 * PARTICLES SYSTEM
 */
function createExplosion(x, y, color) {
  const pixelX = x * TILE_SIZE + TILE_SIZE / 2;
  const pixelY = y * TILE_SIZE + TILE_SIZE / 2;

  for (let i = 0; i < 12; i++) {
    particles.push({
      x: pixelX,
      y: pixelY,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 1.0,
      color: color,
    });
  }
}

function updateParticles(deltaTime) {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= deltaTime * 0.002; // Fade speed

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

/**
 * RENDER ENGINE
 */
function draw() {
  // Background (Dark with subtle grid)
  ctx.fillStyle = "#05070a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();

  // Draw Food (Pulsing)
  const pulseScale = 1 + Math.sin(Date.now() / 150) * 0.1;
  const fx = food.x * TILE_SIZE + TILE_SIZE / 2;
  const fy = food.y * TILE_SIZE + TILE_SIZE / 2;

  ctx.shadowBlur = 20;
  ctx.shadowColor = "#ff0055";
  ctx.fillStyle = "#ff0055";

  ctx.beginPath();
  ctx.arc(fx, fy, (TILE_SIZE / 2 - 4) * pulseScale, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Draw Snake (Interpolated for smoothness)
  if (isGameRunning && snake.length > 0) {
    drawSmoothSnake();
  } else if (snake.length > 0) {
    // Static draw for paused/gameover state
    drawStaticSnake();
  }

  // Draw Particles
  particles.forEach((p) => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1.0;
}

function drawGrid() {
  ctx.strokeStyle = "#161b22";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= canvas.width; x += TILE_SIZE) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }
  for (let y = 0; y <= canvas.height; y += TILE_SIZE) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }
  ctx.stroke();
}

function drawStaticSnake() {
  ctx.fillStyle = "#00ff9d";
  snake.forEach((s, i) => {
    if (i !== 0) ctx.fillStyle = "#00cc7a";
    ctx.fillRect(
      s.x * TILE_SIZE + 1,
      s.y * TILE_SIZE + 1,
      TILE_SIZE - 2,
      TILE_SIZE - 2
    );
  });
}

function drawSmoothSnake() {
  // Logic:
  // The head visually moves from 'snake[0]' towards 'snake[0] + snakeDir'.
  // Actually, in our logic, snake[0] IS the current head position.
  // To make it look smooth, we treat the visual head as being between the previous head (snake[1]) and current head (snake[0])?
  // No, standard interpolation usually renders the object at (prevPos * (1-t) + currPos * t).
  // BUT, our game logic updates instantly.

  // Better approach for Grid Snake:
  // Render the HEAD moving from (currentPos - direction) to (currentPos) based on lastMovePercent.
  // Render the TAIL sliding out.

  // However, simplifying: We will just render rects.
  // To fake smoothness, we can draw the head slightly offset based on percentage?
  // Actually, true smooth snake usually requires logic updates to be decoupled from grid, or visually lag behind logic.

  // Let's try a simpler visual trick:
  // We just draw the static blocks, but we interpolate the HEAD position strictly.

  const interp = lastMovePercent; // 0 to 1

  // Draw Body
  for (let i = 1; i < snake.length; i++) {
    ctx.fillStyle = "#00cc7a";
    // Shadow for body
    ctx.shadowBlur = 5;
    ctx.shadowColor = "rgba(0, 255, 157, 0.3)";

    let seg = snake[i];
    let nextSeg = snake[i - 1]; // The segment closer to head

    // We can interpolate the body segments following each other?
    // That is complex. Let's stick to static body, smooth head for now,
    // OR smooth whole snake:

    // Standard interpolation: Render segment i at Position(i) -> Position(i-1) ??
    // No, that makes the snake detach.

    // For this grid implementation, let's keep the body static grid blocks for reliability,
    // but add a slight "slide" effect by rendering a rectangle connecting i and i-1?

    ctx.fillRect(
      seg.x * TILE_SIZE + 1,
      seg.y * TILE_SIZE + 1,
      TILE_SIZE - 2,
      TILE_SIZE - 2
    );
  }

  // Draw Head (Smoothly sliding)
  // The logic head is at snake[0]. The visual head should slide FROM snake[0]-dir TO snake[0].
  // Wait, 'snake[0]' is already the destination of the current move.
  // So we interpolate from (snake[0] - snakeDir) to snake[0].

  // Reverse the current direction to find "previous" spot of the head
  // Note: This is visually approximate because if direction changed, we assume straight line.
  // But it looks good enough at high speed.

  let prevHeadX = snake[0].x - snakeDir.x;
  let prevHeadY = snake[0].y - snakeDir.y;

  let visualHeadX = prevHeadX + snakeDir.x * interp;
  let visualHeadY = prevHeadY + snakeDir.y * interp;

  ctx.fillStyle = "#00ff9d";
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#00ff9d";

  ctx.fillRect(
    visualHeadX * TILE_SIZE + 1,
    visualHeadY * TILE_SIZE + 1,
    TILE_SIZE - 2,
    TILE_SIZE - 2
  );

  ctx.shadowBlur = 0;

  // Eyes
  ctx.fillStyle = "#000";
  const headPx = visualHeadX * TILE_SIZE;
  const headPy = visualHeadY * TILE_SIZE;

  // Simple eyes
  ctx.fillRect(headPx + 6, headPy + 6, 4, 4);
  ctx.fillRect(headPx + 14, headPy + 6, 4, 4);
}

/**
 * INPUT HANDLING
 */
function handleKeyDown(e) {
  if (!isGameRunning) return;

  // Prevent scrolling
  if (
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1
  ) {
    e.preventDefault();
  }

  const key = e.code;
  let desiredDir = null;

  if (key === "ArrowUp") desiredDir = { x: 0, y: -1 };
  if (key === "ArrowDown") desiredDir = { x: 0, y: 1 };
  if (key === "ArrowLeft") desiredDir = { x: -1, y: 0 };
  if (key === "ArrowRight") desiredDir = { x: 1, y: 0 };

  if (desiredDir) {
    // We add to a queue to prevent overwriting inputs within the same frame
    // limit queue size to 2 to prevent huge lag buffer
    if (inputQueue.length < 2) {
      // Optimization: Check if this input is redundant or opposite to the LAST queued input
      // This logic effectively happens in the game loop, so we just push here.
      inputQueue.push(desiredDir);
    }
  }
}

function handleTouchStart(e) {
  if (!isGameRunning) return;
  e.preventDefault();
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}

function handleTouchMove(e) {
  if (!isGameRunning) return;
  e.preventDefault();
  if (!touchStartX || !touchStartY) return;

  let touchEndX = e.touches[0].clientX;
  let touchEndY = e.touches[0].clientY;
  let xDiff = touchStartX - touchEndX;
  let yDiff = touchStartY - touchEndY;

  if (Math.abs(xDiff) > 10 || Math.abs(yDiff) > 10) {
    let dir = null;
    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      dir = xDiff > 0 ? { x: -1, y: 0 } : { x: 1, y: 0 };
    } else {
      dir = yDiff > 0 ? { x: 0, y: -1 } : { x: 0, y: 1 };
    }

    if (dir && inputQueue.length < 2) {
      inputQueue.push(dir);
    }

    touchStartX = touchEndX;
    touchStartY = touchEndY;
  }
}
