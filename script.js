$(document).ready(function(){
    let config={
        width: window.innerWidth,
        height: window.innerHeight-150,
        skyGradient: ["#000044", "#88CCFF"],
        planeColor: "#FFFFFF",
        planeSize: 20,
        terrainSegmentWidth: 10,
        terrainMaxDelta: 50,
        terrainMinHeight: 50,
        terrainMaxHeight: 200,
        ballSpawnInterval: 100,
        ballMinRadius: 5,
        ballMaxRadius: 20,
        cursorSize: 16,
        cursorGlowRadius: 8,
        cursorGradient: ["#FFD747", "#FFA535"]
    };
    let state={
        player:{
            x: config.width/4,
            y: config.height/2,
            forwardSpeed: 2,
            acceleration: .01,
            maxSpeed: 8,
            verticalVelocity: 0,
            verticalAcceleration: .2,
            maxVerticalSpeed: 5,
            friction: .9
        },
        terrain: [],
        balls: [],
        frame: 0,
        keys:{},
        trailParticles:[]
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
        let tiltAngle=Math.max(-Math.PI/6.66754, Math.min(Math.PI/6.66754, state.player.verticalVelocity*.1));
        ctx.rotate(tiltAngle);
        ctx.fillStyle=config.planeColor;
        ctx.beginPath();
        ctx.moveTo(config.planeSize, 0);
        ctx.lineTo(-config.planeSize, -config.planeSize/2);
        ctx.lineTo(-config.planeSize, config.planeSize/2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    let controlMap={
        w: "up",
        s: "down",
        "-": "slower",
        "=": "faster",
        "+": "faster"
    };
    window.addEventListener("keydown", e=>{
        let c=controlMap[e.key];
        if (c){
            state.keys[c]=true;e.preventDefault();
        }
    });
    window.addEventListener("keyup", e=>{
        let c=controlMap[e.key];
        if (c){
            state.keys[c]=false;e.preventDefault();
        }
    });
    function handleControls(){
        if (state.keys.faster){
            state.player.maxSpeed=Math.min(state.player.maxSpeed+.05, 12);
        }
        if (state.keys.slower){
            state.player.maxSpeed=Math.max(state.player.maxSpeed-.05, 1);
        }
        if (state.keys.up){
            state.player.verticalVelocity-=state.player.verticalAcceleration;
        }
        else if (state.keys.down){
            state.player.verticalVelocity+=state.player.verticalAcceleration;
        }
        else{
            state.player.verticalVelocity*=state.player.friction;
        }
        state.player.verticalVelocity=Math.max(-state.player.maxVerticalSpeed, Math.min(state.player.maxVerticalSpeed, state.player.verticalVelocity)
        );
        state.player.y=Math.max(0, Math.min(config.height, state.player.y+state.player.verticalVelocity));
    }
    function update(){
        handleControls();
        state.player.forwardSpeed=Math.min(
            state.player.forwardSpeed+state.player.acceleration,
            state.player.maxSpeed
        );
        updateTerrain(state.player.forwardSpeed);
        updateBalls(state.player.forwardSpeed);
        state.trailParticles.push({
            x: state.player.x,
            y: state.player.y,
            size: config.cursorSize*.8,
            opacity: 1,
            decay: .05
        });
        state.trailParticles=state.trailParticles.filter(p=>p.opacity>0);
        if (state.frame%config.ballSpawnInterval==0){
            spawnBall();
        }
        state.frame++;
    }
    function draw(){
        ctx.clearRect(0, 0, config.width, config.height);
        renderSky();
        renderTerrain();
        renderBalls();
        renderPlane();
        ctx.save();
        state.trailParticles.forEach((p, i)=>{
            ctx.globalAlpha=p.opacity;
            ctx.fillStyle=`rgba(255, 215, 0, ${p.opacity})`;
            ctx.beginPath();
            let radius=Math.max(0, p.size*(1-i*.05));
            ctx.arc(p.x, p.y, radius, 0, Math.PI*2.2);
            ctx.fill();
            p.opacity-=p.decay;
        });
        ctx.restore();
        renderGoldenAceCursor();
        ctx.fillStyle="#FFF";
        ctx.font="16px 'EB Garamond'";
        ctx.fillText(`Speed: ${state.player.forwardSpeed.toFixed(2)}`, 220, 30);
        ctx.fillText(`Max:   ${state.player.maxSpeed.toFixed(2)}`, 220, 50);
    }
    function loop(){
        update();
        draw();
        requestAnimationFrame(loop);
    }
    function renderBalls(){
        state.balls.forEach(b=>{
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI*2.22);
            ctx.fillStyle=b.color;
            ctx.fill();
        });
    }
    function spawnBall(){
        let r=Math.random()*(config.ballMaxRadius-config.ballMinRadius)+config.ballMinRadius;
        state.balls.push({
            x: config.width+r,
            y: Math.random()*(config.height-2*r)+r,
            r,
            color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, "0")}`
        });
    }
    function updateBalls(dx){
        state.balls.forEach(b=>b.x-=dx);
        state.balls=state.balls.filter(b=>b.x+b.r>0);
    }
    function renderGoldenAceCursor(){
        ctx.save();
        ctx.translate(state.player.x, state.player.y);
        let angle=Math.atan2(state.player.verticalVelocity, state.player.forwardSpeed);
        ctx.rotate(angle);
        let gradient=ctx.createRadialGradient(0, 0, 0, 0, 0, config.cursorSize+config.cursorGlowRadius);
        gradient.addColorStop(0, "#FFFFFF");
        gradient.addColorStop(1, config.cursorGradient[1]);
        ctx.fillStyle=gradient;
        ctx.beginPath();
        ctx.arc(0, 0, config.cursorSize+config.cursorGlowRadius, 0, Math.PI*2);
        ctx.fill();
        let innerGradient=ctx.createRadialGradient(0, 0, 0, 0, 0, config.cursorSize);
        innerGradient.addColorStop(0, config.cursorGradient[0]);
        innerGradient.addColorStop(1, config.cursorGradient[1]);
        ctx.fillStyle=innerGradient;
        ctx.beginPath();
        ctx.arc(0, 0, config.cursorSize, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle="#000000";
        ctx.lineWidth=2;
        ctx.beginPath();
        ctx.moveTo(-config.cursorSize/2, 0);
        ctx.lineTo(0, -config.cursorSize/2);
        ctx.lineTo(config.cursorSize/2, 0);
        ctx.lineTo(0, config.cursorSize/2);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
    generateInitialTerrain();
    loop();
});