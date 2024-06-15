//visualization of reading midi files (now you can visually see where it fails to parse notes (like if there's 3 or 4 byte deltatime))
//https://www.music.mcgill.ca/~ich/classes/mumt306/midiformat.pdf
//https://ericjknapp.com/2019/09/26/midi-events/
//https://people.carleton.edu/~jellinge/m108f13/pages/04/04StandardMIDIFiles.html#:~:text=There%20are%20three%20types%20of%20track%20events%3A%201,event.%203%20Sysex%20Event%20-%20System%20Exclusive%20messages.
//https://www.ccarh.org/courses/253/handout/vlv/
//http://midi.teragonaudio.com/tech/midifile/vari.htm
//https://sites.uci.edu/camp2014/2014/05/19/timing-in-midi-files/
let headerData = [];
let headerLength;
let trackData = [];
const musicnotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

//let format;
//let numtracks;

//headerLength = parseInt(`0x${midi[4]}${midi[5]}${midi[6]}${midi[7]}`, 16);

//for(let i = 8; i < 8+headerLength; i++) {
//    headerData.push(midi[i]);
//    if(i % 2 == 1) {
//        if(!format) {
//            format = midi[i];
//        }else if(!numtracks) {
//            numtracks = midi[i];
//        }
//    }
//}

function elapse(time) {
    elapsedTime += (parseInt(time, 16)/divisions)*(60/tempo)*(1000); //deltatime in milliseconds
    print("elapsed", (parseInt(time, 16)/divisions)*(60/tempo)*(1000), "ms");
}

function parseEvent(event) {
    event = event.map((e) => (e.toString(16).length == 1 ? "0"+e.toString(16) : e.toString(16)).toUpperCase());
    elapse(event[0]);
    //print(event);
    let eventevent = "";
    if(event[2] == "51") {
        let str = "0x";
        for(let i = 4; i < event.length; i++) {
            str += event[i];
        }
        //print(str, parseInt(str, 16));
        tempo = (1000000*60)/parseInt(str, 16); //https://people.carleton.edu/~jellinge/m108f13/pages/04/04StandardMIDIFiles.html#:~:text=0%20%3D%20major%20key-,Tempo%20Meta%20Event,-Byte%201
        print(`tempo now ${tempo} at ${elapsedTime} ms in`);
        eventevent = "tempo";
    } //handle FF 03 event because it's fucking up on the beach at night (i'd include the midi file im talking about in jbs but im not gonna lie i have no idea where i got it (maybe i converted the starbound *.abc to midi somehow but that was a long time ago (apparently august 28th 2022))) (NOPE WHAT ACTUALLY HAPPENED IS I FOUND IT IN THE DESCRIPTION OF A RANDOM VIDEO! https://www.youtube.com/watch?v=cyxmIXhihg8) 
    else if(event[2] == "01" || event[2] == "02" || event[2] == "03" || event[2] == "04") {
        let str = "";
        for(let i = 4; i < event.length; i++) { //skip past all the other info
            str += String.fromCharCode(parseInt(event[i], 16));
        }
        eventstr = {"01": "text event ->", "02": "copyright", "03": "name ->", "04": "is using instrument", "05": ""} //oh shoot 03 is actually the track name 04 is the instrument (why is fl studio doing it like that)
        print(`track ${currentTrackNumber} ${eventstr[event[2]]} ${str}`);
        eventevent = eventstr[event[2]].split(" ")[0];
    }else if(event[2] == "58") {
        print("ignoring time signature event because idk how to handle allathat (basically assuming 4/4 idk)");
        eventevent = "time signature";
    }else if(event[2] == "2F") {
        print(`reached track end event of track ${currentTrackNumber}`);
        readingTrack = false;
        elapsedTime = 0;
        eventevent = "end";
    }
    return eventevent;
}

function parseNotes() {
    //midinote = midinote.map((e) => (e.toString(16).length == 1 ? "0"+e.toString(16) : e.toString(16)).toUpperCase());
    //print(midinote);
    let time;
    let j = 0;
    brush.SetColor(255/255, 204/255, 153/255, 0.5);
    if(midinote.length == 5) {
        time = midinote[0]+midinote[1]; //aw damn it bruh this shit does NOT work the same way one byte deltatime works (AW FUCK I JUST LEARNED THAT DELTATIME COULD BE 4 BYTES)
        j = 1;
        print("variable deltatime moment",time,midinote);
        let binary = parseInt(time, 16).toString(2).split("");
        binary.splice(0, 1);
        binary.splice(7, 1);
        //https://www.ccarh.org/courses/253/handout/vlv/
        //http://midi.teragonaudio.com/tech/midifile/vari.htm
        elapsedTime += (parseInt(binary.join(""), 2)/divisions)*(60/tempo)*(1000);//(60000/(tempo * parseInt(time, 16)));
        print("special elapsed", (parseInt(binary.join(""), 2)/divisions)*(60/tempo)*(1000), "ms");
        d2d.BeginDraw();
        let [_1, x1, y1] = calcPosFromI(i-midinote.length+1);
        d2d.FillRectangle(x1, y1, x1+32, y1+16, brush);
        d2d.EndDraw();
        Sleep(8);
        d2d.BeginDraw();
        let [_2, x2, y2] = calcPosFromI(i-midinote.length+2);
        d2d.FillRectangle(x2, y2, x2+32, y2+16, brush);
        d2d.EndDraw();
    }else {
        time = midinote[0];
        elapse(time);
        d2d.BeginDraw();
        let [yk, x, y] = calcPosFromI(i-midinote.length+1);
        d2d.FillRectangle(x, y, x+32, y+16, brush);
        d2d.EndDraw();
    }
    Sleep(8);
    if(midinote[j+1][0] == "9") {
        brush.SetColor(1.0, 153/255, 0.0, 0.5);
    }else if(midinote[j+1][0] == "8"){
        brush.SetColor(0.0, 153/255, 1.0, 0.5);
    }else {
        brush.SetColor(204/255, 1.0, 204/255, 0.5);
    }
    for(let k = j+1; k < midinote.length; k++) {
        d2d.BeginDraw();
        let [yk, x, y] = calcPosFromI(i-midinote.length+1+k);
        d2d.FillRectangle(x, y, x+32, y+16, brush);
        d2d.EndDraw();
        Sleep(8);
    }
    let key = parseInt(midinote[j+2], 16);
    updateStatus(`parsing note ${musicnotes[key%12]}${Math.floor(key/12)}`);
    if(midinote[j+1][0] == "9") { //if the second byte of midinote starts with 9 it's a note on event
        print(`hit ${musicnotes[key%12]}${Math.floor(key/12)} at ${elapsedTime}ms in`);
        holdingNotes[key] = elapsedTime;
    }else if(midinote[j+1][0] == "8") { //if the second byte of midinote starts with 8 it's a note off event
        if(holdingNotes[key] == undefined) { //bruh i had this as !holdingNotes[key] and it falsely accused the first note of being a glitch
            print(`not holding key but released anyways? (${key} -> ${musicnotes[key%12]}${Math.floor(key/12)})`);
        }else {
            realNotes.push({key, duration: elapsedTime-holdingNotes[key], start: holdingNotes[key], beats: /*parseInt(note[0], 16)/divisions*/(elapsedTime-holdingNotes[key])/(60000/tempo), channel: parseInt(midinote[j+1][1], 16)}); //x 500 tempo 60 = .5
            //key == 0 && print(midinote, "midinote"); //uh one of my test midis is kinda weird and keeps "releasing" a key that wasn't pressed
            delete holdingNotes[key];
            print(`released ${musicnotes[key%12]}${Math.floor(key/12)} after ${i == 0 ? (parseInt(time, 16)/divisions)*(60/tempo)*(1000) : "variable"} ms`);
        }
    }

    midinote = [];
}
let divisions;
let tempo = 60;
let realNotes = [];
//let readNotes = false;
let readingTrack = false;
let readingTrackHeader = false;
let readingEvent = false;
let currentEndTrackHeader = 0;
let currentTrackNumber = 0;
let currentTrackStartIndex = 0;
let currentTrackLength = 0;
let currentEvent = [];
let currentEventStartIndex = 0;
let currentEventLength = 0;
let elapsedTime = 0;
let midinote = [];
let holdingNotes = [];



let fs = require("fs");
let d2d, brush, font;
let midi = {byteLength: 0};

let width = 512;
let height = 700;

let i = 0;
let realreading = false;

function calcPosFromI(i) {
    let yk = i%16;
    let x = ((yk)*32)+8;
    let y = Math.floor(i/16)*16;
    return [yk, x, y];
}

function updateStatus(status) {
    d2d.BeginDraw();
    brush.SetColor(1.0, 1.0, 1.0);
    d2d.FillRectangle(128, height-32, width, height, brush);
    brush.SetColor(0.0, 0.0, 0.0);
    d2d.DrawText("status: "+status, font, 128, height-32, width, height, brush);
    d2d.EndDraw();
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1RenderTarget/*ID2D1DeviceContext*/, hwnd); //no fancy shit because calling EndDraw (with ID2D1DeviceContext and up) will also call Present (which apparently automatically clears the screen?)
        brush = d2d.CreateSolidColorBrush(0.0,0.0,0.0,1.0);
        font = d2d.CreateFont("Consolas", 16);

        let hMenu = CreateMenu();
        let hFileMenu = CreateMenu();
        AppendMenu(hFileMenu, MF_STRING, 1, "Open... :3");
        AppendMenu(hFileMenu, MF_STRING, 2, "Exit");
        AppendMenu(hFileMenu, MF_SEPARATOR, NULL, "NULL");
        AppendMenu(hMenu, MF_POPUP, hFileMenu, "File");

        SetMenu(hwnd, hMenu);

        SetTimer(hwnd, NULL, 32);
    }else if(msg == WM_COMMAND) {
                                        //wp == id
        //AppendMenu(hFileMenu, MF_STRING, 1, "Open...");
        //AppendMenu(hFileMenu, MF_STRING, 2, "Exit");
        
        if(wp == 1) {
            let file = showOpenFilePicker({
                multiple: false,
                excludeAcceptAllOption: true,
                types: [
                    {
                        description: "MIDI files",
                        accept: [".midi", ".mid"] //i can't be bothered to implement the mime types :sob:
                    }
                ]
            });
            print(file);
            if(file) {
                midi = fs.readBinary(file[0]);
                i = 0;
                d2d.BeginDraw();
                d2d.Clear(1.0, 1.0, 1.0, 1.0);
                brush.SetColor(0.0, 0.0, 0.0);
                for(let i = 0; i < midi.byteLength; i++) {
                    let hex = midi[i].toString(16).toUpperCase();
                    let yk = i%16;
                    let x = ((yk)*32)+8;
                    let y = Math.floor(i/16)*16;
                    if(yk == 8) {
                        d2d.DrawLine(x-8, y, x-8, y+16, brush);
                    }
                    d2d.DrawText(hex.length == 1 ? "0"+hex : hex, font, x, y, x+32, y+16, brush);
                }
                d2d.EndDraw();

                realreading = true;
            }
        }else if(wp == 2) {
            DestroyWindow(hwnd);
        }

    }else if(msg == WM_TIMER) {
        if(i >= midi.byteLength) {
            realreading = false;
        }
        if(realreading) {
            if(midi[i] == 77 && midi[i+1] == 84) { //new chunk
                if(midi[i+2] == 104 && midi[i+3] == 100) { //header
                    headerLength = parseInt(`0x${midi[i+4].toString(16)}${midi[i+5].toString(16)}${midi[i+6].toString(16)}${midi[i+7].toString(16)}`, 16);
                    
                    brush.SetColor(242/255, 6/255, 132/255, 0.5);
                    for(let j = i; j < i+8; j++) {
                        d2d.BeginDraw();
                        let [yk, x, y] = calcPosFromI(j);
                        d2d.FillRectangle(x, y, x+32, y+16, brush);
                        d2d.EndDraw();
                        Sleep(8);
                    }
                    //d2d.FillRectangle(x-8, y, (((i+3)%16)*32)+8+32, y+16, brush);
                    brush.SetColor(204/255, 153/255, 255/255, 0.5);
                    
                    for(let j = i+8; j < i+8+headerLength; j+=2) {
                        //print(midi[j], midi[j+1]);
                        d2d.BeginDraw();
                        let [_1, x1, y1] = calcPosFromI(j); //calculating these individually because they could be on different columns
                        let [_2, x2, y2] = calcPosFromI(j+1);
                        d2d.FillRectangle(x1, y1, x1+32, y1+16, brush);
                        d2d.FillRectangle(x2, y2, x2+32, y2+16, brush);
                        headerData.push(parseInt(`0x${midi[j].toString(16)}${midi[j+1].toString(16)}`, 16));
                        d2d.EndDraw(); //wait does present automatically clear ??? (im gonna switch to simple d2d)
                        Sleep(8);
                    }

                    print(headerData);
                    print("headerData");
                    divisions = headerData[2];

                    updateStatus("reading header");
                }else if(midi[i+2] == 114 && midi[i+3] == 107){ //track
                    brush.SetColor(85/255, 153/255, 204/255, 0.5);
                    for(let j = i; j < i+8; j++) {
                        d2d.BeginDraw();
                        let [yk, x, y] = calcPosFromI(j);
                        d2d.FillRectangle(x, y, x+32, y+16, brush);
                        //print("fill");
                        d2d.EndDraw();
                        Sleep(8);
                    }
                    readingTrack = true;
                    readingTrackHeader = true;
                    currentTrackNumber++;
                    currentTrackLength = parseInt(`0x${midi[i+4].toString(16)}${midi[i+5].toString(16)}${midi[i+6].toString(16)}${midi[i+7].toString(16)}`, 16);
                    currentEndTrackHeader = i+7;
                    currentTrackStartIndex = currentEndTrackHeader+1;
                    updateStatus("reading track");
                }
            }else if(readingTrack) {
                if(readingTrackHeader) {
                    if(i == currentEndTrackHeader) {
                        readingTrackHeader = false;
                    }
                }else {
                    if(midi[i] == 255) { //0xFF
                        readingEvent = true;
                        currentEvent = [];
                        currentEvent.push(midi[i-1]);
                        currentEvent.push(midi[i]);
                        currentEventLength = midi[i+2];
                        currentEventStartIndex = i+2;
                        updateStatus(`reading event ${(midi[i].toString(16).length == 1 ? "0"+midi[i].toString(16) : midi[i].toString(16)).toUpperCase()} ${(midi[i+1].toString(16).length == 1 ? "0"+midi[i+1].toString(16) : midi[i+1].toString(16)).toUpperCase()}`);
                        let hex = midi[i+1].toString(16).toUpperCase();
                        hex = hex.length == 1 ? "0"+hex : hex;
                        brush.SetColor(255/255, 204/255, 153/255, 0.5);
                        d2d.BeginDraw();
                        let [_1, x1, y1] = calcPosFromI(i-1);
                        d2d.FillRectangle(x1, y1, x1+32, y1+16, brush);
                        d2d.EndDraw();
                        Sleep(8);
                        brush.SetColor(1.0, 1.0, 0.0, 0.5);
                        d2d.BeginDraw();
                        let [yk, x, y] = calcPosFromI(i);
                        d2d.FillRectangle(x, y, x+32, y+16, brush);
                        d2d.EndDraw();
                        //for(let j = i; j <= i+2+currentEventLength; j++) {
                        //    d2d.BeginDraw();
                        //    let [yk, x, y] = calcPosFromI(j);
                        //    d2d.FillRectangle(x, y, x+32, y+16, brush);
                        //    d2d.EndDraw();
                        //    Sleep(8);
                        //}
                        //midinote keeps catching stray deltatimes from events so gotta get that outta there
                        //if(midinote.at(-1) == midi[i-1]) {
                        //    midinote.splice(-1, 1); //oh shoot i didn't know you could do negative numbers here (i only knew that they added the at function with negatives)
                        //}
                        //print(currentEvent, currentEventLength, currentEventStartIndex);
                    }else if(readingEvent) {
                        currentEvent.push(midi[i]);
                        //print(i, currentEventStartIndex, i-currentEventStartIndex, currentEventLength, midi[i]);
                        d2d.BeginDraw();
                        brush.SetColor(1.0, 1.0, 0.0, 0.5);
                        let [yk, x, y] = calcPosFromI(i);
                        d2d.FillRectangle(x, y, x+32, y+16, brush);
                        d2d.EndDraw();
                        if(i-currentEventStartIndex >= currentEventLength) {
                            readingEvent = false;
                            updateStatus(`parsing ${parseEvent(currentEvent)} event`);
                        }
                    }else if(midi[i+1] != 255){
                        updateStatus("reading notes");
                        let hex = midi[i].toString(16).toUpperCase();
                        //print(hex.length == 1 ? "0"+hex : hex, i);
                        midinote.push(hex.length == 1 ? "0"+hex : hex);//midi[i]);
                        if(midinote.length > 2) { //wait wtf why does the 0xC and 0xD event only have a length of 3 because they don't pad it ???
                            if((midinote[1][0] == "C" || midinote[1][0] == "D") && midinote.length == 3) {
                                parseNotes();
                            }else if(midinote[1][0] != "8" && midinote[1][0] != "9" && midinote[1][0] != "A" && midinote[1][0] != "B" && midinote[1][0] != "C" && midinote[1][0] != "D" && midinote[1][0] != "E") {
                                //print("midinote slippage");
                                if(midinote[2][0] == "8" || midinote[2][0] == "9" || midinote[2][0] == "A" || midinote[2][0] == "B" || midinote[2][0] == "C" || midinote[2][0] == "D" || midinote[2][0] == "E") {
                                    if(midinote.length == 5) {
                                        parseNotes();
                                    }
                                }
                            }else if(midinote.length == 4){
                                parseNotes();
                            }
                        }
                    }
                }
                if(i-currentTrackStartIndex >= currentTrackLength) {
                    readingTrack = false;
                    print(`finished reading track ${currentTrackNumber}`, i);
                    elapsedTime = 0;
                }
            }
            brush.SetColor(16/255, 16/255, 16/255, 0.1);
            d2d.BeginDraw();
            let [yk, x, y] = calcPosFromI(i);
            d2d.FillRectangle(x, y, x+32, y+16, brush);
            d2d.EndDraw();
            i++;
        }
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        d2d.Release();
    }
}

const wc = CreateWindowClass("rmg", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "read midi gui", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, width+20, height+42+20, NULL, NULL, hInstance);