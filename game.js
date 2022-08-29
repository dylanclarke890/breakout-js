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

function fillEllipse(x, y, w, h, fillStyle) {
  ctx.beginPath();
  ctx.moveTo(x, y - h / 2); // A1
  ctx.bezierCurveTo(
    x + w / 2,
    y - h / 2, // C1
    x + w / 2,
    y + h / 2, // C2
    x,
    y + h / 2
  ); // A2
  ctx.bezierCurveTo(
    x - w / 2,
    y + h / 2, // C3
    x - w / 2,
    y - h / 2, // C4
    x,
    y - h / 2
  ); // A1
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.closePath();
}

function randUpTo(num, floor = false) {
  const res = Math.random() * num;
  return floor ? Math.floor(res) : res;
}

function randXDir() {
  const ran = Math.random();
  return ran > 0.5 ? DIRECTION.LEFT : DIRECTION.RIGHT;
}

function randYDir() {
  const ran = Math.random();
  return ran > 0.5 ? DIRECTION.UP : DIRECTION.DOWN;
}

function randTrajectory() {
  return { x: randXDir(), y: randYDir() };
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
    this.x += left ? settings.paddle.s * -1 : settings.paddle.s;
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
    ctx.strokeRect(this.x, this.y, this.w, this.h);
  }
}

class Powerup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.r = 15;
    this.type = type;
    this.collected = false;
  }

  update() {
    this.y++;
    if (!this.collected && isCircleRectColliding(this, state.paddle)) {
      this.collected = true;
      switch (this.type) {
        case "EXTRALIFE":
          state.level.lives++;
          break;
        case "MULTIBALLS":
          const itemsToAppend = [];
          for (let i = 0; i < state.balls.length; i++) {
            for (let j = 0; j < settings.powerups.multiAmount; j++) {
              itemsToAppend.push(
                new Ball(state.balls[i].x, state.balls[i].y, randTrajectory())
              );
            }
          }
          state.balls.push(...itemsToAppend);
          break;
        case "NOCOLLISION":
          state.balls.forEach((v) => {
            v.superDuration = settings.powerups.noCollisionDuration;
            v.color = "yellow";
          });
          break;
        case "SAFETYNET":
          state.net.active = true;
          state.net.duration = settings.powerups.safetyNetCollisionLimit;
          break;
      }
    }
  }
  draw() {
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, true);
    ctx.fill();
    drawText(
      POWERUP[this.type],
      "10px Arial",
      "yellow",
      this.x - 10,
      this.y + 5
    );
  }
}

class Ball {
  constructor(x, y, trajectory) {
    this.x = x;
    this.y = y;
    this.r = 10;
    this.color = "white";
    this.speed = 3;
    this.startingSpeed = this.speed;
    this.maxSpeed = 12;
    this.collisionCount = 0;
    this.trajectory = trajectory;
    this.outOfBounds = false;
    this.superDuration = 0;
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
    state.bricks.forEach((brick) => {
      if (isCircleRectColliding(this, brick)) {
        hasCollided = true;
        if (this.superDuration <= 0) {
          this.color = "white";
          this.trajectory.y =
            this.trajectory.y === DIRECTION.UP ? DIRECTION.DOWN : DIRECTION.UP;
        } else {
          this.superDuration--;
        }
        destroyedBricks.push(brick);
        if (Math.random() <= settings.powerups.chance) {
          const powerupTypes = Object.keys(POWERUP);
          const randomType = powerupTypes[randUpTo(powerupTypes.length, true)];
          state.powerups.push(
            new Powerup(
              brick.x + brick.w / 2,
              brick.y + brick.h / 2,
              randomType
            )
          );
        }
      }
    });
    state.bricks = state.bricks.filter((b) => !destroyedBricks.includes(b));
    if (state.bricks.length === 0) state.over = true;

    // Periodically increase the speed based off of the amount of collisions.
    if (hasCollided) {
      this.collisionCount++;
    }
    if (this.collisionCount > 0 && this.collisionCount % 5 === 0) {
      this.speed = Math.min(this.speed + 1, this.maxSpeed);
      this.collisionCount = 0; // otherwise will infinitely speed up once it first hits 5.
    }

    if (state.net.active && state.net.duration) {
      if (this.y + this.r >= state.net.y) {
        this.trajectory.y = DIRECTION.UP;
        state.net.duration--;
      }
    } else {
      state.net.duration = 0;
      state.net.active = 0;
    }

    if (this.y > canvas.height) this.outOfBounds = true;
  }

  draw() {
    ctx.fillStyle = this.color;
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

const POWERUP = {
  // EXTRALIFE: "life",
  MULTIBALLS: "multi",
  // NOCOLLISION: "super",
  // SAFETYNET: "net",
};

const settings = {
  powerups: {
    safetyNetCollisionLimit: 3,
    noCollisionDuration: 3,
    multiAmount: 3,
    chance: 0.8,
  },
  bricks: {
    w: 40,
    h: 20,
  },
  paddle: {
    w: 80,
    h: 20,
    s: 20,
  },
};

const state = {
  paddle: new Paddle(),
  balls: [
    new Ball(canvas.width / 2, canvas.height - 80, { x: randXDir(), y: "U" }),
  ],
  started: false,
  over: false,
  powerups: [],
  movement: {
    left: false,
    right: false,
  },
  level: {
    lives: 3,
    lifeLost: false,
  },
  bricks: [],
  net: { active: false, duration: 0, y: canvas.height - 40 },
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
    const absolute = brick[2];
    const x = absolute ? brick[0] : brick[0] * settings.bricks.w;
    const y = absolute ? brick[1] : brick[1] * settings.bricks.h;
    state.bricks.push(new Brick(x, y));
  });
})();

function handlePaddle() {
  state.paddle.update();
  state.paddle.draw();
}

function handleBalls() {
  for (let i = 0; i < state.balls.length; i++) {
    state.balls[i].update();
    state.balls[i].draw();
  }
  state.balls = state.balls.filter((b) => !b.outOfBounds);
  if (state.balls.length === 0) state.level.lifeLost = true;
}

function handlePowerups() {
  for (let i = 0; i < state.powerups.length; i++) {
    state.powerups[i].update();
    state.powerups[i].draw();
  }
  if (state.net.active) {
    ctx.fillStyle = "lightblue";
    ctx.fillRect(0, state.net.y, canvas.width, 10);
  }

  state.powerups = state.powerups.filter(
    (p) => !p.collected && p.y < canvas.height
  );
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
    state.powerups = [];
    state.balls.push(
      new Ball(canvas.width / 2, canvas.height - 80, { x: randXDir(), y: "U" })
    );
    state.paddle.x = canvas.width / 2 - state.paddle.w / 2;
    state.started = false;
    state.over = state.level.lives === 0;
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
    handleBalls();
    handleBricks();
    handlePowerups();
    handleGameState();
  } else {
    handleOver();
  }
  requestAnimationFrame(animate);
})();