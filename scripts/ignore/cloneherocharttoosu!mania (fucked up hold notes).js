print(args);

let filename = `C:/Users/megal/Documents/Clone Hero/Songs/The Boneyard - The Olympian/notes.chart`;//`${__dirname}/notes.chart`;

let curHeader = "";
let readingInfo = false;
const headers = {};

const fs = require("fs");

const file = fs.read(filename).split("\n");

for(const line of file) {
    if(line.includes("[") && line.includes("]")) {
        let header = line.match(/\[(.+)\]/)[1];
        headers[header] = [];
        curHeader = header;
    }else if(line.includes("{")) {
        readingInfo = true;
    }else if(line.includes("}")) {
        readingInfo = false;
    }else if(readingInfo) {
        headers[curHeader].push(line.replace("  ", ""));
    }
}

//print(headers["SyncTrack"]);

const getDifficultyChartName = (difficulty) => Object.keys(headers).reduce((accum, youstupid) => youstupid.includes(difficulty) && youstupid);

const trackRegex = /([0-9]+) = (.) (.+)/; //some tracks only have 2 args like 420 = E soloend (or tempo events)
const propertyRegex = /(.+) = (.+)/; //for the Song header

const resolution = headers["Song"][headers["Song"].findIndex(e => e.includes("Resolution"))].match(propertyRegex)[2];
print(`song resolution = ${resolution}`);
//let lastTempo = 0;
let tempoOffset = 0;
let lastTempoChange = 0;
const tempoEvents = headers["SyncTrack"].filter(e => e.includes("B")); //OH YEAH (direction and magnitude);
let curTempo = tempoEvents[0].match(trackRegex)[3]; //BRAIN BLAST! (oh shoot im using this wrong)
let firstTimeTempo = true;
let cloneherochart = headers[getDifficultyChartName("Easy")];
let tempchart = [];//headers[getDifficultyChartName("Easy")]; //i need to slip in tempo events here so it's not weird
let chart = [];
//idk if there is a builtin function for this so (nvm)
//let indexestoinsert = [];
let k = 0;
for(let i = 0; i < cloneherochart.length; i++) {
    const chnote = cloneherochart[i];
    let [_, timing, eventType, args] = chnote.match(trackRegex);
    timing = +timing;
    args = args.split(" ");
    const note = {_, timing, eventType, args};
    if(eventType == "N") { //we don't care about starpower or solo events (so we're not including them)
        if(args[0] <= 4) { //if 5 then opaque force notes, if 6 then tap note (we don't care about what kindof note it is) 0 - 4 is the lane it is in
            //const tke = tempoEvents[k].match(trackRegex); //timing of tempo event
            //if(timing <= tke[1] && cloneherochart[i+1].match(trackRegex)[1] >= tke[1]) { 
            //    //chart[i] = {_: tke[0], timing: tke[1], eventType: tke[2], args: tke[3]};
            //    chart.push({_: tke[0], timing: tke[1], eventType: tke[2], args: tke[3]});
            //    k++;
            //}
            //chart[i] = note;
            tempchart.push(note);
        }
    }
}
for(let i = 0; i < tempchart.length; i++) {
    const note = tempchart[i];
    if(k >= tempoEvents.length) {
        break;
    }
//tempoLoop: //ah nevermind break works the way i thought it would
    for(let j = k; j < tempoEvents.length; j++) {
        const tke = tempoEvents[j].match(trackRegex); //timing of tempo event
        //print(tke[1], note.timing, tempchart[i+1].timing);
        if(note.timing >= tke[1]) {
            //chart[i] = {_: tke[0], timing: tke[1], eventType: tke[2], args: tke[3]};
            chart.push({_: tke[0], timing: tke[1], eventType: tke[2], args: tke[3]});
            //print(tke[0]);
            k++;
        }else {
            break;// tempoLoop; //bro what the fuck
        }
    }
    chart.push(note);
    //print(note._);
    //if(i > 100) {
    //    break;
    //}
    //if(note.timing > 100000) {
    //    break;
    //}
}
//print(chart);

let timingPoints = [];
let keys = [];

function formula(timing, tempo) {
    return verboseformula(timing, tempo, tempoOffset, lastTempoChange);
}

function verboseformula(timing, tempo, TO, LTC) { //for hold notes
    return TO+(((timing-LTC)/resolution*60000)/(tempo/1000)); //gotta divide tempo by 1000 because osu mania uses milliseconds
}

function checkTempo(time, nothingcrazy) {
    let retTempo = undefined;
    let ts = 0;
    let i;
    for(i = 0; i < tempoEvents.length; i++) {
        let [_, start, obv, tempo] = tempoEvents[i].match(trackRegex);
        let nextStart = tempoEvents[i+1]?.match(trackRegex)[1]; //OH YEAH optional chaining (direction and magnitude)
        //print(time-start);
        if(time - start >= 0) {
            if(nextStart) {
                if(time - nextStart <= 0) { //imma just assume that's right
                    //print(`${time} between ${start} - ${nextStart}, tempo must be ${_}`);
                    retTempo = tempo;
                    ts = start;
                    break;
                }
            }else {
                //print(`no further tempo events past ${start} (${time}) so tempo must be ${_}`);
                retTempo = tempo;
                ts = start;
                break;
            }
        }
    }

    if(nothingcrazy) {
        let TtempoOffset = tempoOffset;
        let TlastTempoChange = lastTempoChange;
        if((retTempo && curTempo != retTempo) || firstTimeTempo) {
            //lastTempo = curTempo; //yyeah
            if(i != 0) {
                lastTempo = +tempoEvents[i-1].match(trackRegex)[3];
            }else {
                lastTempo = retTempo;
            }
            TtempoOffset = formula(ts, lastTempo); //yeah whoops i shouldn't be using current tempo here because a note could happen after multiple tempo changes (for some reason)
            //print("TtempoOffset", TtempoOffset, ts, lastTempo);
            //timingPoints.push(`${tempoOffset},${(60/(retTempo))*1000000},4,1,0,0,1,0`);
            //curTempo = retTempo;
            TlastTempoChange = ts;
            //print("Ttempo change subbing "+ts);
        }
        return [retTempo, TtempoOffset, TlastTempoChange];
    }else {
        if((retTempo && curTempo != retTempo) || firstTimeTempo) {
            //lastTempo = curTempo;
            if(i != 0) {
                lastTempo = +tempoEvents[i-1].match(trackRegex)[3];
            }else {
                lastTempo = retTempo;
            }
            tempoOffset = formula(ts, lastTempo); //yeah whoops i shouldn't be using current tempo here because a note could happen after multiple tempo changes (for some reason)
            //print("tempoOffset", tempoOffset, ts, lastTempo);
            timingPoints.push(`${tempoOffset},${(60/(retTempo))*1000000},4,1,0,0,1,0`);
            curTempo = retTempo;
            lastTempoChange = ts;
            firstTimeTempo = false;
            //print("tempo change subbing "+ts);
        }
        return retTempo;    
    }
}
//https://www.vgmusic.com/file/ce355e3866ef228df023ac94d70c177a.html
//let i = chart[0].match(trackRegex);
let i = 0;
let osunotex = [51, 153, 256, 358, 460]; //51+Math.floor(x/5*512) x is 0 -> 4 or [0, 5)

for(let note of chart) { //oh that's cool getDifficultyChartName is only called once here (well obviously but i was worried about it calling it every loop)
    //honestly im not sure about this math but it looks good (tempo*notetiming)/60000000 (ok that shit was cap)
    //new formula (timing/resolution*60000)/tempo
    //print(args);
    //eventType can be 'N'ote, 'S'tarpower, or solo'E'vents
    //the last args for notes are the relative length
    
    if(note.eventType == "N") { //we don't care about starpower or solo events
        if(note.args[0] <= 4) { //if 5 then opaque force notes, if 6 then tap note (we don't care about what kindof note it is) 0 - 4 is the lane it is in
            let tempo = checkTempo(note.timing); //this is a weird system
            let milli = formula(note.timing, tempo);//(timing/resolution*60000)/tempo; //(curTempo*timing)/60000000;
            //print(milli);
            if(note.args.at(-1) != 0) {
                let [holdtempo, tempoOffset, lastTempoChange] = checkTempo((note.timing)+(+note.args.at(-1)), true);
                let holdlength = verboseformula((note.timing)+(+note.args.at(-1)), holdtempo, tempoOffset, lastTempoChange);
                //print(holdlength, +args.at(-1), milli+holdlength);
                keys.push(`${osunotex[+note.args[0]]},192,${milli},128,0,${holdlength}:0:0:0:0:`); //7th bit is set so 0b10000000 means hold note (shoot i only recently learned about the binary notation kinda thing like that)
            }else {
                keys.push(`${osunotex[+note.args[0]]},192,${milli},1,0,0:0:0:0:`);
            }
        }
    }else if(note.eventType == "B") {
        //tempo event!
        checkTempo(note.timing);
    }
    i++;
    //if(i > 25) {
    //    break;
    //}
    //break;
}

let str = "[TimingPoints]\n";

//print("[TimingPoints]");
for(let timingpoint of timingPoints) {
    //print(timingpoint);
    str += `${timingpoint}\n`;
}
str += "\n\n[HitObjects]\n";
//print();
//print();
//print("[HitObjects]");
for(let key of keys) {
    //print(key);
    str += `${key}\n`;
}

fs.write(`${__dirname}/output.txt`, str);