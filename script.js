let config ={
    width: window.innerWidth,
    height: window.innerHeight-150,
    skyGradient: ["#000044", "#88CCFF"],
    planeColor: "#FFFFFF",
    planeSize: 20,
    terrainSegmentWidth: 10,
    terrainMaxDelta: 50,
    terrainMinHeight: 50,
    terrainMaxHeight: 200
};
let state ={
    player:{
        x: config.width/4,
        y: config.height/2,
        z: 100,
        forwardSpeed: 2,
        acceleration: .001,
        maxSpeed: 6
    },
    terrain: [],
    keys:{}
};
let canvas=document.getElementById("gameCanvas");
let ctx=canvas.getContext("2d");
function resizeCanvas(){
    config.width=window.innerWidth;
    config.height=window.innerHeight-150;
    canvas.width=config.width;
    canvas.height=config.height;
    state.player.y=config.height/2;
    generateInitialTerrain();
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
function generateInitialTerrain(){
    state.terrain=[];
    let cols=Math.ceil(config.width/config.terrainSegmentWidth)+2;
    let h=(config.terrainMaxHeight+config.terrainMinHeight)/2;
    for (let i=0;i<cols;i++){
        state.terrain.push({
            x: i*config.terrainSegmentWidth,
            y: config.height-h
        });
        h+=(Math.random()*2-1)*config.terrainMaxDelta;
        h=Math.max(config.terrainMinHeight, Math.min(config.terrainMaxHeight, h));
    }
}
function updateTerrain(dx){
    for (let p of state.terrain){
        p.x-=dx;
    }
    if (state.terrain[0].x<-config.terrainSegmentWidth){
        state.terrain.shift();
    }
    let last=state.terrain[state.terrain.length-1];
    let newH=config.height-(config.height-last.y+(Math.random()*2-1)*config.terrainMaxDelta);
    newH=Math.max(config.height-config.terrainMaxHeight, Math.min(config.height-config.terrainMinHeight, newH));
    state.terrain.push({
        x: last.x+config.terrainSegmentWidth,
        y: newH
    });
}
function renderSky(){
    let grad=ctx.createLinearGradient(0, 0, 0, config.height);
    grad.addColorStop(0, config.skyGradient[0]);
    grad.addColorStop(1, config.skyGradient[1]);
    ctx.fillStyle=grad;
    ctx.fillRect(0, 0, config.width, config.height);
}
function renderTerrain(){
    ctx.fillStyle="#224422";
    ctx.beginPath();
    ctx.moveTo(0, config.height);
    for (let p of state.terrain){
        ctx.lineTo(p.x, p.y);
    }
    ctx.lineTo(config.width, config.height);
    ctx.closePath();
    ctx.fill();
}
function renderPlane(){
    ctx.save();
    ctx.translate(state.player.x, state.player.y);
    ctx.fillStyle=config.planeColor;
    ctx.beginPath();
    ctx.moveTo(config.planeSize, 0);
    ctx.lineTo(-config.planeSize, -config.planeSize/2);
    ctx.lineTo(-config.planeSize, config.planeSize/2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}
let controlKeys ={
    "w": "upY",
    "s": "downY",
    "-": "slower",
    "=": "faster",
    "+": "faster"
};
window.addEventListener("keydown", e=>{
    let c=controlKeys[e.key];
    if (c){
        state.keys[c]=true;e.preventDefault();
    }
});
window.addEventListener("keyup", e=>{
    let c=controlKeys[e.key];
    if (c){
        state.keys[c]=false;e.preventDefault();
    }
});
function handleControls(){
    if (state.keys.faster){
        state.player.maxSpeed=Math.min(state.player.maxSpeed+.05, 10);
    }
    if (state.keys.slower){
        state.player.maxSpeed=Math.max(state.player.maxSpeed-.05, 1);
    }
    if (state.keys.upY){
        state.player.y=Math.max(state.player.y-state.player.maxSpeed, 0);
    }
    if (state.keys.downY){
        state.player.y=Math.min(state.player.y+state.player.maxSpeed, config.height);
    }
}
function update(){
    handleControls();
    state.player.forwardSpeed=Math.min(
        state.player.forwardSpeed+state.player.acceleration,
        state.player.maxSpeed
    );
    updateTerrain(state.player.forwardSpeed);
}
function draw(){
    ctx.clearRect(0, 0, config.width, config.height);
    renderSky();
    renderTerrain();
    renderPlane();
    ctx.fillStyle="#FFF";
    ctx.font="16px 'EB Garamond'";
    ctx.fillText(`Speed: ${state.player.forwardSpeed.toFixed(2)}`, 220, 30);
    ctx.fillText(`Max:   ${state.player.maxSpeed.toFixed(2)}`, 220, 50);
}
function gameLoop(){
    update();
    draw();
    requestAnimationFrame(gameLoop);
}
generateInitialTerrain();
gameLoop();