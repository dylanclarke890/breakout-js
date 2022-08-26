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

class Paddle {
  constructor() {
    const { w, h } = settings.paddle;
    this.x = canvas.width / 2 - w / 2;
    this.y = canvas.height - h * 3;
    this.w = w;
    this.h = h;
  }

  update() {
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

const [canvas, ctx] = new2dCanvas("play-area", 800, 500);

const settings = {
  bricks: {
    w: 20,
    h: 10,
  },
  paddle: {
    w: 80,
    h: 20,
  },
  movementSpeed: 10,
};

const levels = [
  [
    [
      Math.floor((Math.random() * canvas.width) / settings.bricks.w) *
        settings.bricks.w,
      Math.floor((Math.random() * (canvas.height - 200)) / settings.bricks.h) *
        settings.bricks.h,
    ],
  ],
];

const state = {
  paddle: new Paddle(),
  over: false,
  movement: {
    left: false,
    right: false,
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
    console.log(brick);
    state.bricks.push(new Brick(brick[0], brick[1]));
  });
})();

function handlePaddle() {
  state.paddle.update();
  state.paddle.draw();
}

function handleBricks() {
  for (let i = 0; i < state.bricks.length; i++) {
    state.bricks[i].update();
    state.bricks[i].draw();
  }
}

(function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  handlePaddle();
  handleBricks();
  if (!state.over) requestAnimationFrame(animate);
})();