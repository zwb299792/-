// =============== 全局常量 ===============
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
const CANVAS_CENTER_X = CANVAS_WIDTH / 2;
const CANVAS_CENTER_Y = CANVAS_HEIGHT / 2;
const TEXT = "LOVE";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");


// =============== 数学辅助函数 ===============
function heart_function(t, shrink_ratio) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));    
  const x_resize = x * shrink_ratio + CANVAS_CENTER_X; 
  const y_resize = y * shrink_ratio + CANVAS_CENTER_Y;
  return [Math.round(x_resize), Math.round(y_resize)];
}

function scatter_inside(x, y, beta) {
  const ratio_x = - beta * Math.log(Math.random());
  const ratio_y = - beta * Math.log(Math.random());
  const dx = ratio_x * (x - CANVAS_CENTER_X);
  const dy = ratio_y * (y - CANVAS_CENTER_Y);
  return [x - dx, y - dy];
}

function update_heart_point(x, y, ratio) {
  const distance = Math.pow(x - CANVAS_CENTER_X, 2) + Math.pow(y - CANVAS_CENTER_Y, 2);
  const force = 1 / Math.pow(distance, 0.52);
  const dx = ratio * force * (x - CANVAS_CENTER_X) + (Math.random() * 2 - 1);
  const dy = ratio * force * (y - CANVAS_CENTER_Y) + (Math.random() * 2 - 1);
  return [x - dx, y - dy];
}

function update_heart_halo_point(x, y, ratio) {
  const distance = Math.pow(x - CANVAS_CENTER_X, 2) + Math.pow(y - CANVAS_CENTER_Y, 2);
  const force = -1 / Math.pow(distance, 0.6);
  const dx = ratio * force * (x - CANVAS_CENTER_X) + (Math.random() * 28 - 14);
  const dy = ratio * force * (y - CANVAS_CENTER_Y) + (Math.random() * 28 - 14);
  return [x - dx, y - dy];
}

function cycle_curve(p) {
  return 0.65 * Math.sin(4 * p);
}


// =============== 爱心类 ===============
class Heart {
  constructor() {
    this.edge_points = new Set();
    this.halo_points = new Set();
    this.edge_diffusion_points = new Set();
    this.center_diffusion_points = new Set();
    this.generate_heart_points();

    this.frame_points = {};
    this.total_frames = 20;
    for (let frame = 0; frame < this.total_frames; frame++) {
      this.update_frame_points(frame);
    }
  }

  generate_heart_points() {
    // 基础轮廓点
    for (let i = 0; i < 2000; i++) {
      const t = Math.random() * 2 * Math.PI;
      const [x, y] = heart_function(t, 11);
      this.edge_points.add(`${x},${y}`);
    }

    // 外层光晕点
    for (let i = 0; i < 4000; i++) {
      const t = Math.random() * 2 * Math.PI;
      const [x, y] = heart_function(t, 11.6);
      this.halo_points.add(`${x},${y}`);
    }

    
    const edges = Array.from(this.edge_points).map(p => p.split(",").map(Number));

    // 边缘扩散点
    for (let i = 0; i < 4000; i++) {
      const [x, y] = edges[Math.floor(Math.random() * edges.length)];
      const [sx, sy] = scatter_inside(x, y, 0.05);
      this.edge_diffusion_points.add(`${sx},${sy}`);
    }

    // 中心扩散点
    for (let i = 0; i < 4000; i++) {
      const [x, y] = edges[Math.floor(Math.random() * edges.length)];
      const [sx, sy] = scatter_inside(x, y, 0.17);
      this.center_diffusion_points.add(`${sx},${sy}`);
    }
  }

  update_frame_points(frame) {
    const ratio = 10 * cycle_curve(frame / 10 * Math.PI);
    const all_points = [];

    // 基础轮廓点
    for (const p of this.edge_points) {
      const [x, y] = p.split(",").map(Number);
      const [nx, ny] = update_heart_point(x, y, ratio);
      const size = Math.floor(Math.random() * 3) + 1; // random.randint(1, 3)
      all_points.push([nx, ny, size]);
    }

    // 外层光晕点
    for (const p of this.halo_points) {
      const [x, y] = p.split(",").map(Number);
      const [nx, ny] = update_heart_halo_point(x, y, ratio);
      const size = Math.floor(Math.random() * 2) + 1; // random.randint(1, 2)
      all_points.push([nx, ny, size]);
    }

    // 边缘扩散点
    for (const p of this.edge_diffusion_points) {
      const [x, y] = p.split(",").map(Number);
      const [nx, ny] = update_heart_point(x, y, ratio);
      const size = Math.floor(Math.random() * 2) + 1; // random.randint(1, 2)
      all_points.push([nx, ny, size]);
    }

    // 中心扩散点
    for (const p of this.center_diffusion_points) {
      const [x, y] = p.split(",").map(Number);
      const [nx, ny] = update_heart_point(x, y, ratio);
      const size = Math.floor(Math.random() * 2) + 1; // random.randint(1, 2)
      all_points.push([nx, ny, size]);
    }

    // 文字点
    for (const [x, y] of TEXT_POINTS) {
      const [nx, ny] = update_heart_point(x, y, 0);
      all_points.push([nx, ny, 2]);
    }

    this.frame_points[frame] = all_points;
  }
}


// =============== 导入文字 ===============
let TEXT_POINTS = [];

fetch("text_points.json")
  .then(res => res.json())
  .then(data => {
    TEXT_POINTS = data;
    startAnimation(); // 在 JSON 加载完成后再启动动画
  });


// =============== 绘制函数 ===============
function startAnimation() {
  const heart = new Heart();
  let frame = 0;

  function draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 颜色渐变
    const beat_phase = Math.abs(Math.sin(frame / 20));
    const r = 255;
    const g = Math.floor(50 + 100 * beat_phase);
    const b = Math.floor(30 + 150 * beat_phase);
    const color = `rgb(${r},${g},${b})`;
    ctx.fillStyle = color;

    // 绘制当前帧的爱心点阵
    for (const [x, y, size] of heart.frame_points[frame % heart.total_frames]) {
      ctx.fillRect(x, y, size, size);
    }

    frame++;
    setTimeout(() => {requestAnimationFrame(draw);}, 160);
  }

  draw();
}
