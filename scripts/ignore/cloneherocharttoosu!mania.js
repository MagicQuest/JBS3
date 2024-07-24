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
const propertyRegex = /(.+) = (.+)/;

const resolution = headers["Song"][headers["Song"].findIndex(e => e.includes("Resolution"))].match(propertyRegex)[2];
print(`song resolution = ${resolution}`);
//let lastTempo = 0;
let tempoOffset = 0;
let lastTempoChange = 0;
const tempoEvents = headers["SyncTrack"].filter(e => e.includes("B")); //OH YEAH (direction and magnitude);
let curTempo = tempoEvents[0].match(trackRegex)[3]; //BRAIN BLAST! (oh shoot im using this wrong)
let chart = headers[getDifficultyChartName("Easy")];
let timingPoints = [];
let keys = [];

function formula(timing, tempo) {
    return verboseformula(timing, tempo, tempoOffset, lastTempoChange); //gotta divide tempo by 1000 because osu mania uses milliseconds
}

function verboseformula(timing, tempo, TO, LTC) {
    return TO+(((timing-LTC)/resolution*60000)/(tempo/1000));
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
                    print(`${time} between ${start} - ${nextStart}, tempo must be ${_}`);
                    retTempo = tempo;
                    ts = start;
                    break;
                }
            }else {
                print(`no further tempo events past ${start} (${time}) so tempo must be ${_}`);
                retTempo = tempo;
                ts = start;
                break;
            }
        }
    }

    if(nothingcrazy) {
        let TtempoOffset = tempoOffset;
        let TlastTempoChange = lastTempoChange;
        if((retTempo && curTempo != retTempo) || timingPoints.length == 0) {
            //lastTempo = curTempo; //yyeah
            lastTempo = +tempoEvents[i-1].match(trackRegex)[3];
            TtempoOffset = formula(ts, lastTempo); //yeah whoops i shouldn't be using current tempo here because a note could happen after multiple tempo changes (for some reason)
            print("TtempoOffset", TtempoOffset, ts, lastTempo);
            //timingPoints.push(`${tempoOffset},${(60/(retTempo))*1000000},4,1,0,0,1,0`);
            //curTempo = retTempo;
            TlastTempoChange = ts;
            print("Ttempo change subbing "+ts);
        }
        return [retTempo, TtempoOffset, TlastTempoChange];
    }else {
        if((retTempo && curTempo != retTempo) || timingPoints.length == 0) {
            //lastTempo = curTempo;
            lastTempo = +tempoEvents[i-1].match(trackRegex)[3];
            tempoOffset = formula(ts, lastTempo); //yeah whoops i shouldn't be using current tempo here because a note could happen after multiple tempo changes (for some reason)
            print("tempoOffset", tempoOffset, ts, lastTempo);
            timingPoints.push(`${tempoOffset},${(60/(retTempo))*1000000},4,1,0,0,1,0`);
            curTempo = retTempo;
            lastTempoChange = ts;
            print("tempo change subbing "+ts);
        }
        return retTempo;    
    }
}
//https://www.vgmusic.com/file/ce355e3866ef228df023ac94d70c177a.html
//let i = chart[0].match(trackRegex);
let i = 0;
let osunotex = [51, 153, 256, 358, 460]; //51+Math.floor(x/5*512) x is 0 -> 4 or [0, 5)

for(let notedata of chart) { //oh that's cool getDifficultyChartName is only called once here (well obviously but i was worried about it calling it every loop)
    //honestly im not sure about this math but it looks good (tempo*notetiming)/60000000 (ok that shit was cap)
    //new formula (timing/resolution*60000)/tempo
    let [_, timing, eventType, args] = notedata.match(trackRegex);
    args = args.split(" ");
    //print(args);
    //eventType can be 'N'ote, 'S'tarpower, or solo'E'vents
    //the last args for notes are the relative length
    
    if(eventType == "N") { //we don't care about starpower or solo events
        if(args[0] <= 4) { //if 5 then opaque force notes, if 6 then tap note (we don't care about what kindof note it is) 0 - 4 is the lane it is in
            let tempo = checkTempo(+timing); //this is a weird system
            let milli = formula(+timing, tempo);//(timing/resolution*60000)/tempo; //(curTempo*timing)/60000000;
            print(milli);
            if(args.at(-1) != 0) {
                let [holdtempo, tempoOffset, lastTempoChange] = checkTempo((+timing)+(+args.at(-1)), true);
                let holdlength = verboseformula((+timing)+(+args.at(-1)), holdtempo, tempoOffset, lastTempoChange);
                //print(holdlength, +args.at(-1), milli+holdlength);
                keys.push(`${osunotex[+args[0]]},192,${milli},128,0,${holdlength}:0:0:0:0:`); //7th bit is set so 0b10000000 means hold note (shoot i only recently learned about the binary notation kinda thing like that)
            }else {
                keys.push(`${osunotex[+args[0]]},192,${milli},1,0,0:0:0:0:`);
            }
        }
    }
    i++;
    if(i > 5) {
        break;
    }
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