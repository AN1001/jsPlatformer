import data from './level.js';
//===================
const FRAMERATE = 60;
const SCALEFACTOR = 1;

(function () {
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;
})();

let curLevel = 0

const platformLeft = new Image()
platformLeft.src = "Tiles/tile_0089.png"

const platformMid = new Image()
platformMid.src = "Tiles/tile_0090.png"

const platformRight = new Image()
platformRight.src = "Tiles/tile_0091.png"

const wall = new Image()
wall.src = "Tiles/tile_0107.png"

const floor = new Image()
floor.src = "Tiles/tile_0024.png"

const bounceL = new Image()
bounceL.src = "Tiles/tile_0264.png"

const bounceM = new Image()
bounceM.src = "Tiles/tile_0265.png"

const bounceR = new Image()
bounceR.src = "Tiles/tile_0266.png"

const signL = new Image()
signL.src = "Tiles/tile_0198.png"

const repel = new Image()
repel.src = "Tiles/tile_0249.png"

var canvas = document.getElementById("canvas"),
  ctx = canvas.getContext("2d"),
  width = 1000,
  height = window.innerHeight,
  player = {
      x: width / 2,
      y: height - 450,
      width: 30,
      height: 30,
      speed: 3,
      velX: 0,
      velY: 0,
      jumping: false,
      grounded: false
  },
  keys = [],
  friction = 0.8,
  gravity = 0.3;

canvas.offscreenCanvas = document.createElement("canvas");
canvas.offscreenCanvas.id = "offscreenCanvas";

var levels = []

data.forEach(function(el){
  let overflow = Math.floor(el.y%height)
  let level = Math.floor(el.y/height)

  if(levels[`level${level}`]==undefined){
    levels[`level${level}`] = [el]
  }else{
    levels[`level${level}`].push(el)
  }

  el.y = Math.floor(el.y%height)
  
  if(el.y-el.height<0){
    console.log("boundary")
    console.log(el)
    let clone = { ...el }
    clone.y = Math.floor(el.y%height)-el.height
    levels[`level${level-1}`].push(clone)
  }

  el.y = height-el.y

})

console.log(levels)
var boxes = levels[`level${curLevel}`];

// dimensions
boxes.push({
  x: 0,
  y: 0,
  width: 10,
  height: height,
  type:"wall"
});
boxes.push({
  x: width - 10,
  y: 0,
  width: 10,
  height: height,
  type:"wall"
});
boxes.push({
  x: 0,
  y: height - 2,
  width: width,
  height: 50,
  type:"floor"
});

canvas.width = width;
canvas.height = height;
canvas.offscreenCanvas.width = width;
canvas.offscreenCanvas.height = height;

function update() {
  // check keys
  if(player.y<-30){
    curLevel+=1
    boxes = levels[`level${curLevel}`];
    if(boxes==undefined){boxes=[]}
    player.y = height-50
    drawBoxes(boxes, canvas.offscreenCanvas)

  } else if(player.y>(height+10)){
    curLevel-=1
    boxes = levels[`level${curLevel}`];
    if(boxes==undefined){boxes=[]}
    player.y = -30
    drawBoxes(boxes, canvas.offscreenCanvas)

  }

  if (keys[38] || keys[32] || keys[87]) {
      // up arrow or space or W
      if (!player.jumping && player.grounded) {
          player.jumping = true;
          player.grounded = false;
          player.velY = -player.speed * 2.1; //TEMP CHANGE 2.1
      }
  }
  if (keys[39] || keys[68]) {
      // right arrow or D
      if (player.velX < player.speed) {
          player.velX++;
      }
  }
  if (keys[37] || keys[65]) {
      // left arrow or A
      if (player.velX > -player.speed) {
          player.velX--;
      }
  }

  player.velX *= friction;
  player.velY += gravity;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "black";
  ctx.beginPath();
  
  player.grounded = false;
  ctx.drawImage(canvas.offscreenCanvas, 0, 0, 1000/SCALEFACTOR, Math.floor(height/SCALEFACTOR))

  for (var i = 0; i < boxes.length; i++) {

      var dir = colCheck(player, boxes[i]);

      if (dir === "l" || dir === "r") {
          player.velX = 0;
          player.jumping = false;
      } else if (dir === "b") {
          player.grounded = true;
          player.jumping = false;
      } else if (dir === "t") {
          player.velY *= -1;
      } else if (dir === "bounce"){
          player.velX *= -10;
      }

  }
  
  if(player.grounded){
       player.velY = 0;
  }
  
  player.x += player.velX;
  player.y += player.velY;

  ctx.fill();
  ctx.fillStyle = "red";
  ctx.fillRect(Math.floor(player.x/SCALEFACTOR),Math.floor(player.y/SCALEFACTOR), Math.floor(player.width/SCALEFACTOR), Math.floor(player.height/SCALEFACTOR));

}

function colCheck(shapeA, shapeB) {
  // get the vectors to check against
  if(shapeB.type=="env"){
    return null
  }

  var vX = (shapeA.x + (shapeA.width / 2)) - (shapeB.x + (shapeB.width / 2)),
      vY = (shapeA.y + (shapeA.height / 2)) - (shapeB.y + (shapeB.height / 2)),
      // add the half widths and half heights of the objects
      hWidths = (shapeA.width / 2) + (shapeB.width / 2),
      hHeights = (shapeA.height / 2) + (shapeB.height / 2),
      colDir = null;

  // if the x and y vector are less than the half width or half height, they we must be inside the object, causing a collision
  if (Math.abs(vX) < hWidths && Math.abs(vY) < hHeights) {
      // figures out on which side we are colliding (top, bottom, left, or right)
      var oX = hWidths - Math.abs(vX),
          oY = hHeights - Math.abs(vY);
      if (oX >= oY) {
          if (vY > 0) {
              colDir = "t";
              shapeA.y += oY;
          } else {
              colDir = "b";
              shapeA.y -= oY;
              if(shapeB.type == "bounce"){
                shapeA.velY = -player.speed * 2.1 * shapeB.bouncyness;
                shapeA.jumping = true;
                colDir = ""
              }
          }
      } else {
          if (vX > 0) {
              colDir = "l";
              shapeA.x += oX;
          } else {
              colDir = "r";
              shapeA.x -= oX;
          }
          if(shapeB.type == "repel"){
              colDir = "bounce"
          }
      }
  }
  return colDir;
}

function drawBoxes(boxes, canvas){
  boxes.push({
    x: 0,
    y: 0,
    width: 10,
    height: height,
    type:"wall"
  });
  boxes.push({
    x: width - 10,
    y: 0,
    width: 10,
    height: height,
    type:"wall"
  });

  let ctx = canvas.getContext("2d")
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "green";
  ctx.beginPath();

  for (var i = 0; i < boxes.length; i++) {
    if(boxes[i].type == "platform"){
      let num = Math.floor(boxes[i].width/boxes[i].height)
      let tw = Math.floor(boxes[i].width/num)
      ctx.drawImage(platformLeft, boxes[i].x, boxes[i].y, tw, boxes[i].height)

      for (var j = 1; j < num-1; j++) {
        ctx.drawImage(platformMid, boxes[i].x+(tw*j), boxes[i].y, tw, boxes[i].height)
      }

      ctx.drawImage(platformRight, boxes[i].x+tw*(num-1), boxes[i].y, tw, boxes[i].height)

    } else if(boxes[i].type == "wall"){
      ctx.drawImage(wall, boxes[i].x, boxes[i].y, boxes[i].width, boxes[i].height)

    } else if(boxes[i].type == "floor"){
      ctx.drawImage(floor, boxes[i].x, boxes[i].y, boxes[i].width, boxes[i].height)

    } else if(boxes[i].type == "bounce"){
      let num = Math.floor(boxes[i].width/boxes[i].height)
      let tw = Math.floor(boxes[i].width/num)
      ctx.drawImage(bounceL, boxes[i].x, boxes[i].y, tw, boxes[i].height)

      for (var j = 1; j < num-1; j++) {
        ctx.drawImage(bounceM, boxes[i].x+(tw*j), boxes[i].y, tw, boxes[i].height)
      }

      ctx.drawImage(bounceR, boxes[i].x+tw*(num-1), boxes[i].y, tw, boxes[i].height)

    }else if(boxes[i].type == "env"){
      switch(boxes[i].code){
        case "signL":
          ctx.drawImage(signL, boxes[i].x, boxes[i].y, boxes[i].width, boxes[i].height)
      }
    }else if(boxes[i].type == "repel"){
      ctx.drawImage(repel, boxes[i].x, boxes[i].y, boxes[i].width, boxes[i].height)
    }else {
      ctx.rect(boxes[i].x, boxes[i].y, boxes[i].width, boxes[i].height);
    }
  }

  ctx.fill();
}

document.body.addEventListener("keydown", function (e) {
  keys[e.keyCode] = true;
});

document.body.addEventListener("keyup", function (e) {
  keys[e.keyCode] = false;
});

window.addEventListener("load", function () {
  setTimeout(() => {
    drawBoxes(boxes, canvas.offscreenCanvas)
  }, "100");

  document.documentElement.style.setProperty("--SCALE-FACTOR", SCALEFACTOR);
  drawBoxes(boxes, canvas.offscreenCanvas)
  update()
  startAnimating(FRAMERATE);
});

window.addEventListener("resize", function () {
  window.location.href = window.location.href
});

function SEF(){
  ctx.imageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  canvas.offscreenCanvas.getContext("2d").imageSmoothingEnabled = false;
  canvas.offscreenCanvas.getContext("2d").webkitImageSmoothingEnabled = false;
}

var fps, fpsInterval, startTime, now, then, elapsed;


function startAnimating(fps) {
    SEF()
    fpsInterval = 1000 / fps;
    then = Date.now();
    startTime = then;
    animate();
}

function animate() {

  // request another frame
  requestAnimationFrame(animate);

  // calc elapsed time since last loop

  now = Date.now();
  elapsed = now - then;

  // if enough time has elapsed, draw the next frame

  if (elapsed > fpsInterval) {

      // Get ready for next frame by setting then=now, but also adjust for your
      // specified fpsInterval not being a multiple of RAF's interval (16.7ms)
      then = now - (elapsed % fpsInterval);

      update()

  }
}
