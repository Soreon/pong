/* eslint-env browser */
/* eslint max-len: 0 */

const canvas = document.getElementById('canv');
canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
const context = canvas.getContext('2d');
context.translate(0.5, 0.5);
context.shadowBlur = 10;
context.shadowColor = '#F0F';

let aiming = false;

const bar = {
  x: Math.round(canvas.clientWidth / 2),
  y: canvas.clientHeight - 50,
  width: 100,
  height: 20,
  t: canvas.clientHeight - 50,
  color: '#F0F',
};

const ball = {
  x: bar.x,
  y: bar.y - 10,
  radius: 5,
  color: '#0FF',
  engaged: false,
  ratio: 0.5,
  vec: {
    x: 0,
    y: 0,
  },
  speed: 4,
};

function clamp(number, min, max) { return Math.min(Math.max(number, min), max); }

function clear() {
  context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 */
function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.strokeStyle = '#FF0';
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.closePath();
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 */
// function rectangle(ctx, x, y, width, height) {
//   ctx.beginPath();
//   ctx.strokeStyle = '#F0F';
//   ctx.lineWidth = 2;
//   ctx.rect(x, y, width, height);
//   ctx.stroke();
// }

// function circle(ctx, x, y, radius) {
//   ctx.beginPath();
//   ctx.strokeStyle = '#0FF';
//   ctx.arc(x, y, radius, 0, 2 * Math.PI);
//   ctx.stroke();
// }

function drawBar() {
  context.strokeStyle = bar.color;
  context.beginPath();
  context.moveTo(bar.x - Math.round(bar.width / 2), bar.y);
  context.lineTo(bar.x - Math.round(bar.width / 2), bar.y + bar.height);
  context.lineTo(bar.x + Math.round(bar.width / 2), bar.y + bar.height);
  context.lineTo(bar.x + Math.round(bar.width / 2), bar.y);
  context.quadraticCurveTo(bar.x, bar.y - ((bar.y - bar.t) / 16), bar.x - Math.round(bar.width / 2), bar.y);
  context.stroke();
}

function drawBall() {
  context.beginPath();
  context.strokeStyle = ball.color;
  context.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
  context.stroke();
}

function draw() {
  clear();
  drawBar();
  drawBall();
  line(context, ball.x, ball.y, ball.x + (ball.vec.x * 50), ball.y + (ball.vec.y * 50));
}

function step() {
  if (ball.engaged) {
    // TODO: faire les autres paroies
    const tempX = ball.x + (ball.vec.x * ball.speed);
    if (tempX <= 0) {
      if (ball.vec.y < 0) {
        const angle = Math.PI - Math.atan2(ball.vec.y, ball.vec.x);
        ball.vec.x = Math.cos(angle);
        ball.vec.y = Math.sin(angle);
      }
    }

    ball.x += ball.vec.x * ball.speed;
    ball.y += ball.vec.y * ball.speed;
  }
}

function animate() {
  draw();
  step();
  requestAnimationFrame(animate);
}

// Permet de calculer un point de la courbe de bezier
function getQBezierValue(t, p1, p2, p3) {
  const iT = 1 - t;
  return (iT * iT * p1) + (2 * iT * t * p2) + (t * t * p3);
}

// Permet d'obtenir la tengente en un point de la courbe de bezier
function getQBezierDerivative(t, p1, p2, p3) {
  const vec = { x: 0, y: 0 };
  const a = (1 - t) * 2;
  const b = t * 2;
  vec.x = (a * (p2.x - p1.x)) + (b * (p3.x - p2.x));
  vec.y = (a * (p2.y - p1.y)) + (b * (p3.y - p2.y));
  const u = Math.sqrt((vec.x * vec.x) + (vec.y * vec.y));
  vec.x /= u;
  vec.y /= u;
  return vec;
}

function onMouseMove(e) {
  // Si on ne vise pas la barre se déplace
  if (!aiming) {
    bar.x += e.movementX;
    bar.x = clamp(bar.x, Math.round(bar.width / 2), canvas.clientWidth - Math.round(bar.width / 2) - 1);
  } else { // Si on vise ( clic maintenu ), la balle se déplace
    ball.ratio += e.movementX * 0.002;
    ball.ratio = clamp(ball.ratio, 0, 1);
  }

  bar.t += e.movementY * 3;
  bar.t = clamp(bar.t, 0, 1000);

  if (!ball.engaged) {
    ball.x = bar.x + (ball.ratio * bar.width) + -Math.round(bar.width / 2);
    ball.y = getQBezierValue(ball.ratio, bar.y, bar.y - ((bar.y - bar.t) / 16), bar.y) - 10;
    const p1 = { x: bar.x - Math.round(bar.width / 2), y: bar.y };
    const p2 = { x: bar.x, y: bar.y - ((bar.y - bar.t) / 16) };
    const p3 = { x: bar.x + Math.round(bar.width / 2), y: bar.y };
    const res = getQBezierDerivative(Math.abs(ball.ratio), p1, p2, p3);
    ball.vec.x = ((Math.cos(-Math.PI / 2) * res.x) - (Math.sin(-Math.PI / 2) * res.y));
    ball.vec.y = ((Math.sin(-Math.PI / 2) * res.x) + (Math.cos(-Math.PI / 2) * res.y));
  }
}

function onMouseDown() { aiming = true; }
function onMouseUp() { aiming = false; ball.engaged = true; }

function lockChangeAlert() {
  if (document.pointerLockElement === canvas || document.mozPointerLockElement === canvas) {
    document.addEventListener('mouseup', onMouseUp, false);
    document.addEventListener('mousedown', onMouseDown, false);
    document.addEventListener('mousemove', onMouseMove, false);
  } else {
    document.removeEventListener('mouseup', onMouseUp, false);
    document.removeEventListener('mousedown', onMouseDown, false);
    document.removeEventListener('mousemove', onMouseMove, false);
  }
}

canvas.addEventListener('click', () => { canvas.requestPointerLock(); });
document.addEventListener('pointerlockchange', lockChangeAlert, false);
document.addEventListener('mozpointerlockchange', lockChangeAlert, false);

animate();
