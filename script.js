//terser script.js -o script.min.js --compress --mangle
$(document).ready(function(){
    $("#startModal").show();
    $("#controls-toggle").hide();
    let animationFrameId;
    let config={
        width: window.innerWidth,
        height: window.innerHeight,
        skyGradient: ["#000044", "#88CCDD"],
        planeColor: "#FFF",
        planeSize: 33.5,
        terrainSegmentWidth: 10,
        terrainMaxDelta: 40,
        terrainMinHeight: 40,
        terrainMaxHeight: 200,
        ballSpawnInterval: 40,
        ballMinRadius: 5,
        ballMaxRadius: 20,
        cursorSize: 30,
        cursorGlowRadius: 8,
        cursorGradient: ["#DE0000", "#28465C"],
        reactionWindow: 4000,
        maxParticles: 100,
        maxBalls: 100,
        soundCooldown: 100
    };
    let state={
        player:{
            x: config.width/4,
            y: config.height/2,
            forwardSpeed: 2.1,
            acceleration: .01,
            maxSpeed: 12,
            verticalVelocity: 0,
            verticalAcceleration: .25,
            maxVerticalSpeed: 5,
            friction: .85,
            aura: null,
            auraTimestamp: 0
        },
        terrain: [],
        balls: [],
        frame: 0,
        keys:{},
        trailParticles:[],
        score: 0,
        collectedElements: [],
        elements: [
            {name: "Pyra", color: "#DE0000"},
            {name: "Aqua", color: "#1C94E9"},
            {name: "Voltis", color: "#800089"},
            {name: "Flora", color: "#009C17"},
            {name: "Glacia", color: "#59CFDA"},
            {name: "Terra", color: "#FFAA44"},
            {name: "Aero", color: "#75C2AA"}
        ],
        reactions: [
            {elements: ["Pyra", "Aqua"], name: "Steamburst", multiplier: 2, type: "amplifying"},
            {elements: ["Aqua", "Pyra"], name: "Steamburst", multiplier: 1.5, type: "amplifying"},
            {elements: ["Pyra", "Glacia"], name: "Frostburn", multiplier: 2, type: "amplifying"},
            {elements: ["Glacia", "Pyra"], name: "Frostburn", multiplier: 1.5, type: "amplifying"},
            {elements: ["Voltis", "Pyra"], name: "Sparkflare", bonus: 175, type: "transformative"},
            {elements: ["Pyra", "Voltis"], name: "Sparkflare", bonus: 175, type: "transformative"},
            {elements: ["Voltis", "Glacia"], name: "Chillshock", bonus: 60, type: "transformative"},
            {elements: ["Glacia", "Voltis"], name: "Chillshock", bonus: 60, type: "transformative"},
            {elements: ["Voltis", "Aqua"], name: "Voltflow", bonus: 90, type: "transformative"},
            {elements: ["Aqua", "Voltis"], name: "Voltflow", bonus: 90, type: "transformative"},
            {elements: ["Aero", "Pyra"], name: "Galeweave", bonus: 60, type: "transformative"},
            {elements: ["Aero", "Aqua"], name: "Galeweave", bonus: 60, type: "transformative"},
            {elements: ["Aero", "Voltis"], name: "Galeweave", bonus: 60, type: "transformative"},
            {elements: ["Aero", "Glacia"], name: "Galeweave", bonus: 60, type: "transformative"},
            {elements: ["Terra", "Pyra"], name: "Stoneguard", bonus: 40, type: "transformative"},
            {elements: ["Terra", "Aqua"], name: "Stoneguard", bonus: 40, type: "transformative"},
            {elements: ["Terra", "Voltis"], name: "Stoneguard", bonus: 40, type: "transformative"},
            {elements: ["Terra", "Glacia"], name: "Stoneguard", bonus: 40, type: "transformative"},
            {elements: ["Pyra", "Flora"], name: "Wildfire", bonus: 60, type: "transformative"},
            {elements: ["Flora", "Pyra"], name: "Wildfire", bonus: 60, type: "transformative"},
            {elements: ["Aqua", "Glacia"], name: "Icebind", bonus: 40, type: "status"},
            {elements: ["Glacia", "Aqua"], name: "Icebind", bonus: 40, type: "status"},
            {elements: ["Aqua", "Flora"], name: "Lifeburst", bonus: 70, type: "transformative"},
            {elements: ["Flora", "Aqua"], name: "Lifeburst", bonus: 70, type: "transformative"},
            {elements: ["Flora", "Voltis"], name: "Growthspark", bonus: 60, type: "catalyze"},
            {elements: ["Voltis", "Flora"], name: "Growthspark", bonus: 60, type: "catalyze"},
            {elements: ["Voltis", "Growthspark"], name: "Shockbloom", bonus: 200, type: "catalyze"},
            {elements: ["Flora", "Growthspark"], name: "Wildgrowth", bonus: 200, type: "catalyze"},
            {elements: ["Pyra", "Lifeburst"], name: "Flamebloom", bonus: 150, type: "transformative"},
            {elements: ["Voltis", "Lifeburst"], name: "Surgebloom", bonus: 150, type: "transformative"}
        ],
        lastReactionMessage:{text: "", opacity: 1, decay: .01},
        synth: null,
        lastSoundTime: 0,
        startTime: null,
        maxSpeedUsed: 8,
        reactionCounts:{},
        gameEnded: false
    };
    let canvas=document.getElementById("gameCanvas");
    let ctx=canvas.getContext("2d");
    if (!ctx){
        console.error("Canvas error, refresh to try again.");
        return;
    }
    try{
        state.synth=new Tone.PolySynth(Tone.Synth).toDestination();
        Tone.start();
    }
    catch (e){
        console.warn("Tone.js initialization failed:", e);
    }
    $("#startButton").click(function(){
        $("#startModal").hide();
        $("#controls-toggle").show();
        state.startTime=Date.now();
        loop();
    });
    $("#restartButton").click(function(){
        window.location.reload();
    });
    function resizeCanvas(){
        let headerH=document.querySelector("header").offsetHeight;
        let footerH=document.querySelector("footer").offsetHeight;
        config.width=window.innerWidth;
        config.height=window.innerHeight-headerH-footerH;
        canvas.width=config.width;
        canvas.height=config.height;
        state.player.x=config.width/4;
        state.player.y=config.height/2;
        generateInitialTerrain();
        state.balls.forEach(b=>{
            b.y=Math.min(b.y, config.height-b.r);
        });
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
        state.terrain=state.terrain.filter(p=>p.x>-config.terrainSegmentWidth*2);
        let last=state.terrain[state.terrain.length-1];
        while (last.x<config.width+config.terrainSegmentWidth){
            let h=config.height-last.y+(Math.random()*2-1)*config.terrainMaxDelta*.5;
            h=Math.max(config.terrainMinHeight, Math.min(config.terrainMaxHeight, h));
            state.terrain.push({
                x: last.x+config.terrainSegmentWidth,
                y: config.height-h
            });
            last=state.terrain[state.terrain.length-1];
        }
    }
    function renderSky(){
        let grad=ctx.createLinearGradient(0, 0, 0, config.height);
        grad.addColorStop(0, config.skyGradient[0]);
        grad.addColorStop(1, config.skyGradient[1]);
        ctx.fillStyle=grad;
        ctx.fillRect(0, 0, config.width, config.height);
    }
    function renderTerrain(){
        ctx.fillStyle="#225535";
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
        let tiltAngle=Math.max(-Math.PI/6, Math.min(Math.PI/6, state.player.verticalVelocity*.1));
        ctx.rotate(tiltAngle);
        ctx.fillStyle=config.planeColor;
        ctx.beginPath();
        ctx.moveTo(config.planeSize, 0);
        ctx.lineTo(-config.planeSize,-config.planeSize/2);
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
        "+": "faster",
        a: "slower",
        d: "faster"
    };
    window.addEventListener("keydown", e=>{
        let c=controlMap[e.key.toLowerCase()];
        if (c){
            state.keys[c]=true;
            e.preventDefault();
        }
    });
    window.addEventListener("keyup", e=>{
        let c=controlMap[e.key.toLowerCase()];
        if (c){
            state.keys[c]=false;
            e.preventDefault();
        }
    });
    function handleControls(){
        if (state.keys.faster){
            state.player.maxSpeed=Math.min(state.player.maxSpeed+.05, 15);
            state.maxSpeedUsed=Math.max(state.maxSpeedUsed, state.player.maxSpeed);
        }
        if (state.keys.slower){
            state.player.maxSpeed=Math.max(state.player.maxSpeed-.05, 1);
            state.maxSpeedUsed=Math.max(state.maxSpeedUsed, state.player.maxSpeed);
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
        state.player.verticalVelocity=Math.max(-state.player.maxVerticalSpeed, Math.min(state.player.maxVerticalSpeed, state.player.verticalVelocity));
        let buffer=20;
        state.player.y=Math.max(buffer, Math.min(config.height-buffer, state.player.y+state.player.verticalVelocity));
    }
    function playCollectionSound(){
        if (Date.now()-state.lastSoundTime<config.soundCooldown){
            return;
        }
        if (state.synth){
            state.synth.triggerAttackRelease("E4", "8n", Tone.now(), 1.0);
            state.lastSoundTime=Date.now();
        }
    }
    function playReactionSound(reactionName){
        if (Date.now()-state.lastSoundTime<config.soundCooldown){
            return;
        }
        if (!state.synth){
            return;
        }
        let synthConfig;
        switch(reactionName){
            case "Steamburst":
                synthConfig={oscillator: { type: "sine" }, envelope: { attack: .01, decay: .2, sustain: 0, release: .2}};
                state.synth.set(synthConfig);
                state.synth.triggerAttackRelease("G4", "8n", Tone.now(), 0.5);
                break;
            case "Frostburn":
                synthConfig={oscillator: { type: "triangle" }, envelope: { attack: .01, decay: .2, sustain: 0, release: .2}};
                state.synth.set(synthConfig);
                state.synth.triggerAttackRelease("A4", "8n", Tone.now(), 0.5);
                break;
            case "Sparkflare":
                synthConfig={oscillator: { type: "sawtooth" }, envelope: { attack: .01, decay: .3, sustain: 0, release: .3}};
                state.synth.set(synthConfig);
                state.synth.triggerAttackRelease("E3", "4n", Tone.now(), 0.5);
                break;
            case "Chillshock":
                synthConfig={oscillator: { type: "square" }, envelope: { attack: .01, decay: .2, sustain: 0, release: .2}};
                state.synth.set(synthConfig);
                state.synth.triggerAttackRelease("F3", "8n", Tone.now(), 0.5);
                break;
            case "Voltflow":
                synthConfig={oscillator: { type: "pulse" }, envelope: { attack: .01, decay: .2, sustain: 0, release: .2}};
                state.synth.set(synthConfig);
                state.synth.triggerAttackRelease("D4", "8n", Tone.now(), 0.5);
                break;
            case "Galeweave":
                synthConfig={oscillator: { type: "sine" }, envelope: { attack: .01, decay: .3, sustain: 0, release: .3}};
                state.synth.set(synthConfig);
                state.synth.triggerAttackRelease("C5", "4n", Tone.now(), 0.5);
                break;
            case "Stoneguard":
                synthConfig={oscillator: { type: "triangle" }, envelope: { attack: .01, decay: .2, sustain: 0, release: .2}};
                state.synth.set(synthConfig);
                state.synth.triggerAttackRelease("B3", "8n", Tone.now(), 0.5);
                break;
            case "Wildfire":
                synthConfig={oscillator: { type: "sawtooth" }, envelope: { attack: .01, decay: .3, sustain: 0, release: .3}};
                state.synth.set(synthConfig);
                state.synth.triggerAttackRelease("G3", "4n", Tone.now(), 0.5);
                break;
            case "Icebind":
                synthConfig={oscillator: { type: "sine" }, envelope: { attack: .01, decay: .2, sustain: 0, release: .2}};
                state.synth.set(synthConfig);
                state.synth.triggerAttackRelease("A5", "8n", Tone.now(), 0.5);
                break;
            case "Lifeburst":
                synthConfig={oscillator: { type: "triangle" }, envelope: { attack: .01, decay: .2, sustain: 0, release: .2}};
                state.synth.set(synthConfig);
                state.synth.triggerAttackRelease("E4", "8n", Tone.now(), 0.5);
                break;
            case "Growthspark":
                synthConfig={oscillator: { type: "pulse" }, envelope: { attack: .01, decay: .2, sustain: 0, release: .2}};
                state.synth.set(synthConfig);
                state.synth.triggerAttackRelease("F4", "8n", Tone.now(), 0.5);
                break;
            case "Shockbloom":
                synthConfig={oscillator: { type: "sawtooth" }, envelope: { attack: .01, decay: .2, sustain: 0, release: .2}};
                state.synth.set(synthConfig);
                state.synth.triggerAttackRelease("G4", "8n", Tone.now(), 0.5);
                break;
            case "Wildgrowth":
                synthConfig={oscillator: { type: "triangle" }, envelope: { attack: .01, decay: .2, sustain: 0, release: .2}};
                state.synth.set(synthConfig);
                state.synth.triggerAttackRelease("A4", "8n", Tone.now(), 0.5);
                break;
            case "Flamebloom":
                synthConfig={oscillator: { type: "sawtooth" }, envelope: { attack: .01, decay: .3, sustain: 0, release: .3}};
                state.synth.set(synthConfig);
                state.synth.triggerAttackRelease("E3", "4n", Tone.now(), 0.5);
                break;
            case "Surgebloom":
                synthConfig={oscillator: { type: "pulse" }, envelope: { attack: .01, decay: .2, sustain: 0, release: .2}};
                state.synth.set(synthConfig);
                state.synth.triggerAttackRelease("D4", "8n", Tone.now(), 0.5);
                break;
        }
        state.lastSoundTime=Date.now();
    }
    function update(){
        if (state.gameEnded) return;
        handleControls();
        state.player.forwardSpeed=Math.min(
            state.player.forwardSpeed+state.player.acceleration,
            state.player.maxSpeed
        );
        updateTerrain(state.player.forwardSpeed);
        updateBalls(state.player.forwardSpeed);
        if (state.trailParticles.length<config.maxParticles){
            state.trailParticles.push({
                x: state.player.x,
                y: state.player.y,
                size: config.cursorSize*.8,
                opacity: 1,
                decay: .05
            });
        }
        state.trailParticles=state.trailParticles.filter(p=>p.opacity>0);
        if (state.frame % config.ballSpawnInterval==0&&state.balls.length<config.maxBalls){
            spawnBall();
        }
        let now=Date.now();
        state.collectedElements=state.collectedElements.filter(e=>now-e.timestamp<config.reactionWindow);
        if (state.player.aura&&now-state.player.auraTimestamp>config.reactionWindow){
            state.player.aura=null;
        }
        if (state.score>=10000&&!state.gameEnded){
            endGame();
        }
        state.frame++;
    }
    function endGame(){
        state.gameEnded=true;
        cancelAnimationFrame(animationFrameId);
        let timeTaken=((Date.now()-state.startTime)/1000).toFixed(1);
        $("#total-score").text(`Total Score: ${state.score}`);
        $("#time-taken").text(`Time Taken: ${timeTaken} seconds`);
        let reactionList=$("#reaction-list");
        reactionList.empty();
        if (Object.keys(state.reactionCounts).length==0){
            reactionList.append("<li>No reactions performed</li>");
        }
        else{
            for (let reaction in state.reactionCounts){
                reactionList.append(`<li>${reaction}: ${state.reactionCounts[reaction]}</li>`);
            }
        }
        $("#endModal").show();
        $("#controls-toggle").hide();
        $("#touch-controls").hide();
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
            ctx.arc(p.x, p.y, radius, 0, Math.PI*2);
            ctx.fill();
            p.opacity-=p.decay;
        });
        ctx.restore();
        renderOrbCursor();
        renderReactionTimer();
        ctx.fillStyle="#FFF";
        ctx.font="16px \"EB Garamond\"";
        document.getElementById("cursor-speed").innerHTML=`Speed: ${state.player.forwardSpeed.toFixed(2)}`;
        document.getElementById("cursor-max-speed").innerHTML=`Max: ${state.player.maxSpeed.toFixed(2)}`;
        document.getElementById("cursor-score").innerHTML=`Score: ${state.score}`;
        if (state.lastReactionMessage.text){
            ctx.globalAlpha=state.lastReactionMessage.opacity;
            ctx.fillStyle="#FFD800";
            ctx.font="20px \"EB Garamond\"";
            ctx.fillText(state.lastReactionMessage.text, config.width/2-40, config.height/2);
            state.lastReactionMessage.opacity-=state.lastReactionMessage.decay;
            if (state.lastReactionMessage.opacity<=0){
                state.lastReactionMessage.text="";
                state.lastReactionMessage.opacity=1;
            }
            ctx.globalAlpha=1;
        }
    }
    function loop(){
        update();
        draw();
        animationFrameId=requestAnimationFrame(loop);
    }
    function renderBalls(){
        state.balls.forEach(b=>{
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
            ctx.fillStyle=b.color;
            ctx.fill();
        });
    }
    function spawnBall(){
        let r=Math.random()*(config.ballMaxRadius-config.ballMinRadius)+config.ballMinRadius;
        let element=state.elements[Math.floor(Math.random()*state.elements.length)];
        state.balls.push({
            x: config.width+r,
            y: Math.random()*(config.height-2*r)+r,
            r: r*1.2,
            color: element.color,
            element: element.name,
            collectTimestamp: 0
        });
    }
    function updateBalls(dx){
        state.balls.forEach(b=>b.x-=dx);
        state.balls=state.balls.filter(b=>{
            let dx=state.player.x-b.x;
            let dy=state.player.y-b.y;
            let distance=Math.sqrt(dx*dx+dy*dy);
            if (distance<b.r+config.planeSize){
                playCollectionSound();
                let basePoints=Math.floor(b.r*10);
                state.score+=basePoints;
                b.collectTimestamp=Date.now();
                checkReactions(b.element, basePoints);
                return false;
            }
            return b.x+b.r>0;
        });
    }
    function checkReactions(newElement, basePoints){
        let now=Date.now();
        let reactionTriggered=false;
        let auraConsumed=false;
        if (state.player.aura){
            for (let reaction of state.reactions){
                let [elem1, elem2]=reaction.elements;
                if ((state.player.aura==elem1&&newElement==elem2)||(state.player.aura==elem2&&newElement==elem1)){
                    let bonusPoints=0;
                    if (reaction.type=="amplifying"){
                        bonusPoints=Math.floor(basePoints*(reaction.multiplier-1));
                    }
                    else if (reaction.type=="transformative"||reaction.type=="catalyze"){
                        bonusPoints=reaction.bonus;
                    }
                    else if (reaction.type=="status"){
                        bonusPoints=reaction.bonus;
                        state.player.aura="Frozen";
                        state.player.auraTimestamp=now;
                        auraConsumed=false;
                    }
                    state.score+=bonusPoints;
                    state.lastReactionMessage.text=`${reaction.name}!+${bonusPoints}`;
                    state.lastReactionMessage.opacity=1;
                    state.reactionCounts[reaction.name]=(state.reactionCounts[reaction.name]||0)+1;
                    playReactionSound(reaction.name);
                    reactionTriggered=true;
                    if (reaction.type!=="status"){
                        auraConsumed=true;
                    }
                    break;
                }
            }
        }
        if (!reactionTriggered){
            let validElements=state.collectedElements.concat({name: newElement, timestamp: now });
            for (let reaction of state.reactions){
                let [elem1, elem2]=reaction.elements;
                if ((elem2=="Bloom"||elem2=="Quicken")&&validElements.some(e=>e.name==elem2)&&newElement==elem1){
                    let bonusPoints=reaction.bonus;
                    state.score+=bonusPoints;
                    state.lastReactionMessage.text=`${reaction.name}!+${bonusPoints}`;
                    state.lastReactionMessage.opacity=1;
                    state.reactionCounts[reaction.name]=(state.reactionCounts[reaction.name]||0)+1;
                    playReactionSound(reaction.name);
                    let idx=validElements.findIndex(e=>e.name==elem2);
                    if (idx>=0) validElements.splice(idx, 1);
                    reactionTriggered=true;
                    break;
                }
            }
            state.collectedElements=validElements.filter(e=>now-e.timestamp<config.reactionWindow);
        }
        if (!reactionTriggered&&(!state.player.aura||auraConsumed)){
            state.player.aura=newElement;
            state.player.auraTimestamp=now;
        }
        else if (auraConsumed){
            state.player.aura=null;
        }
    }
    function renderOrbCursor(){
        ctx.save();
        ctx.translate(state.player.x, state.player.y);
        let angle=Math.atan2(state.player.verticalVelocity, state.player.forwardSpeed);
        ctx.rotate(angle);
        let gradient=ctx.createRadialGradient(0, 0, 0, 0, 0, config.cursorSize+config.cursorGlowRadius);
        gradient.addColorStop(0, "#FFF");
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
        ctx.strokeStyle="#000";
        ctx.lineWidth=2;
        ctx.beginPath();
        ctx.moveTo(-config.cursorSize/2, 0);
        ctx.lineTo(0,-config.cursorSize/2);
        ctx.lineTo(config.cursorSize/2, 0);
        ctx.lineTo(0, config.cursorSize/2);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
    function renderReactionTimer(){
        if (!state.player.aura){
            return;
        }
        let now=Date.now();
        let timeLeft=config.reactionWindow-(now-state.player.auraTimestamp);
        if (timeLeft<=0) return;
        ctx.save();
        ctx.translate(state.player.x+30, state.player.y-20);
        ctx.fillStyle="rgba(255, 255, 255, .7)";
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle="#000";
        ctx.font="15px \"EB Garamond\"";
        ctx.textAlign="center";
        ctx.textBaseline="middle";
        ctx.fillText((timeLeft/1000).toFixed(1), 0, 0);
        ctx.restore();
    }
    [["upBtn","up"], ["downBtn","down"], ["slowerBtn","slower"], ["fasterBtn","faster"]].forEach(([btnId, ctrl])=>{
        let btn=document.getElementById(btnId);
        if (!btn){
            return;
        }
        btn.addEventListener("pointerdown", e=>{
            e.preventDefault();
            state.keys[ctrl]=true;
        },{passive:false});
        btn.addEventListener("pointerup", e=>{
            e.preventDefault();
            state.keys[ctrl]=false;
        },{passive:false});
        btn.addEventListener("pointerleave", e=>{
        e.preventDefault();
        state.keys[ctrl]=false;
        }, { passive: false });
    });
    canvas.addEventListener("touchmove", e=>{
        let t=e.touches[0];
        let headerH=document.querySelector("header").offsetHeight;
        let y=t.clientY-headerH;
        state.keys.up=y<config.height/2;
        state.keys.down=y>config.height/2;
        e.preventDefault();
    },{passive:false});
    canvas.addEventListener("touchend", ()=>{
        state.keys.up=state.keys.down=false;
    });
    let touchControls=$("#touch-controls");
    let touchControlsToggleBtn=$("#toggleControlsBtn");
    touchControls.hide();
    let istouchControlsVisible=false;
    touchControlsToggleBtn.text("Show Controls");
    touchControlsToggleBtn.on("click", function(){
        istouchControlsVisible=!istouchControlsVisible;
        touchControls.slideToggle(200);
        touchControlsToggleBtn.text(istouchControlsVisible?"Hide Controls":"Show Controls");
    });
});