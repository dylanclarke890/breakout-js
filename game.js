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
    const { w, h } = settings.paddleSize;
    this.x = canvas.width / 2 - w / 2;
    this.y = canvas.height - h * 3;
    this.w = w;
    this.h = h;
  }

  draw() {
    ctx.fillStyle = "white";
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

const [canvas, ctx] = new2dCanvas("play-area", 800, 500);

const settings = {
  paddleSize: {
    w: 50,
    h: 20,
  },
};

const state = {
  paddle: new Paddle(),
  over: false,
};

function handlePaddle() {
  state.paddle.draw();
}

(function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  handlePaddle();
  if (!state.over) requestAnimationFrame(animate);
})();