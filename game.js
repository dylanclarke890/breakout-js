function new2dCanvas(id, width, height) {
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;
  return [canvas, ctx];
}

function drawText(text, font, fillStyle, x, y, maxWidth = undefined) {
  if (font) ctx.font = font;
  if (fillStyle) ctx.fillStyle = fillStyle;
  ctx.fillText(text, x, y, maxWidth);
}

function randUpTo(num, floor = false) {
  const res = Math.random() * num;
  return floor ? Math.floor(res) : res;
}

function isCircleRectColliding(circle, rect) {
  const distX = Math.abs(circle.x - rect.x - rect.w / 2);
  const distY = Math.abs(circle.y - rect.y - rect.h / 2);
  if (distX > rect.w / 2 + circle.r) return false;
  if (distY > rect.h / 2 + circle.r) return false;
  if (distX <= rect.w / 2) return true;
  if (distY <= rect.h / 2) return true;
  const dx = distX - rect.w / 2;
  const dy = distY - rect.h / 2;
  return dx * dx + dy * dy <= circle.r * circle.r;
}

function isRectRectColliding(first, second) {
  if (!first || !second) return false;
  if (
    !(
      first.x > second.x + second.width ||
      first.x + first.width < second.x ||
      first.y > second.y + second.height ||
      first.y + first.height < second.y
    )
  ) {
    return true;
  }
  return false;
}

class Paddle {
  constructor() {
    const { w, h } = settings.paddle;
    this.x = canvas.width / 2 - w / 2;
    this.y = canvas.height - h * 3;
    this.w = w;
    this.h = h;
  }

  update() {
    if (!state.started) return;
    const { left, right } = state.movement;
    // no movement or moving in both directions at once.
    if ((!left && !right) || (right && left)) return;
    this.x += left ? settings.movementSpeed * -1 : settings.movementSpeed;
    if (this.x < 0) this.x = 0;
    if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;
  }

  draw() {
    ctx.fillStyle = "white";
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

class Brick {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const { w, h } = settings.bricks;
    this.w = w;
    this.h = h;
  }

  update() {}
  draw() {
    ctx.fillStyle = "white";
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

class Ball {
  constructor(trajectory) {
    this.x = canvas.width / 2;
    this.y = canvas.height - 80;
    this.r = 10;
    this.speed = 3;
    this.startingSpeed = this.speed;
    this.maxSpeed = 12;
    this.collisionCount = 0;
    this.trajectory = trajectory;
  }

  update() {
    if (!state.started) return;
    const xMovement =
      this.trajectory.x === DIRECTION.LEFT ? this.speed : -this.speed;
    const yMovement =
      this.trajectory.y === DIRECTION.UP ? this.speed : -this.speed;
    this.x = Math.floor(this.x - xMovement);
    this.y = Math.floor(this.y - yMovement);
    let hasCollided = false;

    if (this.x - this.r <= 0) {
      hasCollided = true;
      this.trajectory.x = DIRECTION.RIGHT;
    }
    if (this.x + this.r >= canvas.width) {
      hasCollided = true;
      this.trajectory.x = DIRECTION.LEFT;
    }
    if (this.y - this.r <= 0) {
      hasCollided = true;
      this.trajectory.y = DIRECTION.DOWN;
    }
    if (isCircleRectColliding(this, state.paddle)) {
      hasCollided = true;
      this.trajectory.y = DIRECTION.UP;
    }

    const destroyedBricks = [];
    state.bricks.forEach((brick, i) => {
      if (!isCircleRectColliding(this, brick)) return;
      if (this.x - this.r <= brick.x) {
        hasCollided = true;
        this.trajectory.x = DIRECTION.RIGHT;
      }
      if (this.x + this.r >= brick.x + brick.w) {
        hasCollided = true;
        this.trajectory.x = DIRECTION.LEFT;
      }
      if (this.y - this.r <= brick.y) {
        hasCollided = true;
        this.trajectory.y = DIRECTION.UP;
      }
      if (this.y - this.r <= brick.y + brick.h) {
        hasCollided = true;
        this.trajectory.y = DIRECTION.DOWN;
      }
      destroyedBricks.push(brick);
    });
    state.bricks = state.bricks.filter((b) => !destroyedBricks.includes(b));
    if (state.bricks.length === 0) state.over = true;

    // Periodically increase the speed based off of the amount of collisions.
    if (hasCollided) this.collisionCount++;
    if (this.collisionCount > 0 && this.collisionCount % 5 === 0) {
      this.speed = Math.min(this.speed + 1, this.maxSpeed);
      this.collisionCount = 0; // otherwise will infinitely speed up once it first hits 5.
    }

    if (this.y > canvas.height) state.level.lifeLost = true;
  }

  draw() {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, true);
    ctx.fill();
  }
}

const [canvas, ctx] = new2dCanvas("play-area", 800, 500);

const DIRECTION = {
  UP: "U",
  DOWN: "D",
  LEFT: "L",
  RIGHT: "R",
};

const settings = {
  bricks: {
    w: 40,
    h: 20,
  },
  paddle: {
    w: 80,
    h: 20,
  },
  movementSpeed: 10,
};

const state = {
  paddle: new Paddle(),
  ball: new Ball({ x: "L", y: "U" }),
  started: false,
  over: false,
  movement: {
    left: false,
    right: false,
  },
  level: {
    lives: 3,
    lifeLost: false,
  },
  bricks: [],
  nextLevel: 0,
};

window.addEventListener("keydown", (e) => {
  switch (e.key.toLowerCase()) {
    case "arrowleft":
    case "a":
      state.movement = { ...state.movement, left: true };
      break;
    case "arrowright":
    case "d":
      state.movement = { ...state.movement, right: true };
    case " ":
      state.started = true;
    default:
      break;
  }
});

window.addEventListener("keyup", (e) => {
  switch (e.key.toLowerCase()) {
    case "arrowleft":
    case "a":
      state.movement = { ...state.movement, left: false };
      break;
    case "arrowright":
    case "d":
      state.movement = { ...state.movement, right: false };
    default:
      break;
  }
});

(function handleLevelSetUp() {
  const level = levels[state.nextLevel++];
  state.bricks = [];
  level.forEach((brick) => {
    const relative = brick[2];
    const x = relative ? brick[0] * settings.bricks.w : brick[0];
    const y = relative ? brick[1] * settings.bricks.h : brick[1];
    state.bricks.push(new Brick(x, y));
  });
})();

function handlePaddle() {
  state.paddle.update();
  state.paddle.draw();
}

function handleBall() {
  state.ball.update();
  state.ball.draw();
}

function handleBricks() {
  for (let i = 0; i < state.bricks.length; i++) {
    state.bricks[i].update();
    state.bricks[i].draw();
  }
}

function handleGameState() {
  if (state.level.lifeLost) {
    state.level.lives--;
    state.level.lifeLost = false;
    state.ball.x = canvas.width / 2;
    state.ball.y = canvas.height - 80;
    state.paddle.x = canvas.width / 2 - state.paddle.w / 2;
    state.started = false;
  }

  if (!state.started)
    drawText(
      `Lives: ${state.level.lives}`,
      "30px Arial",
      "white",
      canvas.width / 2 - 30,
      30
    );
}

function handleOver() {
  if (state.level.lives === 0) {
    drawText(
      "GAME OVER",
      "80px Arial",
      "white",
      canvas.width / 2 - 200,
      canvas.height / 2 - 100
    );
  } else if (state.bricks.length === 0) {
    drawText(
      "YOU WIN!",
      "80px Arial",
      "white",
      canvas.width / 2 - 200,
      canvas.height / 2 - 100
    );
  }
}

(function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!state.over) {
    handlePaddle();
    handleBall();
    handleBricks();
    handleGameState();
  } else {
    handleOver();
  }
  requestAnimationFrame(animate);
})();