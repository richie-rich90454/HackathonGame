let isPlaying=false;
let midiData=null;
let synth=null;
async function initAudio(){
    synth=new Tone.PolySynth(Tone.FMSynth,{
        harmonicity: 3,
        modulationIndex: 10,
        oscillator: { type: "sine" },
        envelope:{
            attack: .002,
            decay: 1.2,
            sustain: .3,
            release: 1.5
        },
        modulation:{
            type: "triangle"
        },
        modulationEnvelope:{
            attack: .002,
            decay: .5,
            sustain: 0,
            release: .5
        }
    }).toDestination();
}
async function loadMidi(){
    try{
        let res=await fetch("lost_realms.mid");
        if (!res.ok) throw new Error(res.status);
        let buf=await res.arrayBuffer();
        return new Midi(buf);
    }
    catch (e){
        console.error("MIDI load failed:", e);
        return null;
    }
}
async function startMusic(){
    if (!synth){
        await initAudio();
    }
    if (!midiData){
        midiData=await loadMidi();
    }
    if (!midiData){
        return;
    }
    await Tone.start();
    Tone.Transport.cancel();
    let scheduleNotes=(time)=>{
        midiData.tracks.forEach(track=>{
            track.notes.forEach(n=>{
                synth.triggerAttackRelease(
                    n.name,
                    n.duration,
                    time+n.time,
                    n.velocity*.75
                );
            });
        });
    };
    let now=Tone.now()+.1;
    scheduleNotes(now);
    Tone.Transport.scheduleRepeat((time)=>{
        scheduleNotes(time);
    }, midiData.duration);
    if (midiData.header.tempos.length){
        Tone.Transport.bpm.value=midiData.header.tempos[0].bpm;
    }
    Tone.Transport.timeSignature=[3, 4];
    Tone.Transport.start(now);
    isPlaying=true;
}
window.addEventListener("DOMContentLoaded", async ()=>{
    await initAudio();
    await loadMidi();
    let unlockAndPlay=async ()=>{
        if (!isPlaying){
            await startMusic();
        }
        window.removeEventListener("click", unlockAndPlay);
        window.removeEventListener("keydown", unlockAndPlay);
    };
    window.addEventListener("click", unlockAndPlay);
    window.addEventListener("keydown", unlockAndPlay);
});