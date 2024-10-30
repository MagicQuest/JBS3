//im not even gonna lie i have no idea why this has been my most buggy script (i blame spawn/beep, showOpenFilePicker) (method fluidsynth.LoadNewSf2 was killing myshit but i was doing it wrong lmao i fixed it)

//let hBankMenu, hProgMenu;
let hMenu, hLayoutMenu, hGainMenu, hInstrumentMenu;
let d2d, brush, font, biggerfont, /*testBmp,*/ dragging;
let width = 1280;
let height = 720;
let scrollPos = 0.5;
let scrollBar, scrollBarX;
let scrollWidth = 10000;
let scrollPosX = 0;
let i = 1;
let tempo = 130;
let playStart = 0;
let playing = false;
let playJ = 0;
let sortedNotes;
let noteEndTimes;

let pianoKeys = [];

const readMidi = eval(require("fs").read(`${__dirname}/readmidi.js`));

const NEW_COMMAND = 1;
const OPEN_COMMAND = 2;
const SAVE_COMMAND = 3;
const EXIT_COMMAND = 4;

const GAINSTART_COMMAND = 5;

const LOADSF2_COMMAND = 21;
const STOPSOUND_COMMAND = 22;

const FLLAYOUT_COMMAND = 50;
const VPLAYOUT_COMMAND = 51;

const INSTRUMENTPRESETSTART_COMMAND = 100;

//                  aw shit if you use the forward slash it won't work!!!
//const fluidsynth = DllLoad(__dirname+"\\fluidsynth\\libfluidsynth-3.dll", LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR | LOAD_LIBRARY_SEARCH_SYSTEM32); //aw damn i had to use procmon to figure out why this wasn't working and it was because it was looking for system32's DSOUND.dll in the fluidsynth directory (i had only specified LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR)
//
//function callfs(name, returnType, ...args) { //since most fluidsynth functions don't use floats im using this function to tell what the types are
//    const types = {"boolean": VAR_BOOLEAN, "number": VAR_INT, "string": VAR_CSTRING}; //cstring probably
//    let argTypes = [];
//    for(let i = 0; i < args.length; i++) {
//        //print(name, typeof(args[i]));
//        argTypes[i] = types[typeof(args[i])];
//    }
//    //print(argTypes);
//    return fluidsynth(name, args.length, args, argTypes, returnType);
//}

//wait lemme make a class
class fluidsynth {
    settings = 0;
    synth = 0;
    adriver = 0;
    valid = true;
    instrumentIndex = 0;
    constructor(sf2) {
        //                  aw shit if you use the forward slash it won't work!!!
        this.fsdll = DllLoad(__dirname+"\\fluidsynth\\libfluidsynth-3.dll", LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR | LOAD_LIBRARY_SEARCH_SYSTEM32); //aw damn i had to use procmon to figure out why this wasn't working and it was because it was looking for system32's DSOUND.dll in the fluidsynth directory (i had only specified LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR)
        this.settings = this.fsdll("new_fluid_settings", 0, [], [], RETURN_NUMBER);
        if(this.settings == NULL) {
            print("Failed to create the settings!");
            return this.cleanup();
        }

        this.synth = this.fsdll("new_fluid_synth", 1, [this.settings], [VAR_INT], RETURN_NUMBER);
        if(this.synth == NULL) {
            print("Failed to create the synth!");
            return this.cleanup();
        }

        this.sfont_id = this.fsdll("fluid_synth_sfload", 3, [this.synth, sf2, 1], [VAR_INT, VAR_CSTRING, VAR_INT], RETURN_NUMBER);
        if(this.sfont_id == -1) { //FLUID_FAILED
            print("Loading the SoundFont failed!");
            return this.cleanup();
        }

        this.adriver = this.fsdll("new_fluid_audio_driver", 2, [this.settings, this.synth], [VAR_INT, VAR_INT], RETURN_NUMBER);
        if(this.adriver == NULL) {
            print("Failed to create the audio driver!");
            return this.cleanup();
        }

        this.getPresets();

        //this shit too quiet my boy
        this.fsdll("fluid_synth_set_gain", 2, [this.synth, 2.0], [VAR_INT, VAR_FLOAT], RETURN_VOID);

        print(`fluidsynth done loading my boy (${this.valid})`);
    }

    getPresets() {
        const sfont = this.fsdll("fluid_synth_get_sfont_by_id", 2, [this.synth, this.sfont_id], [VAR_INT, VAR_INT], RETURN_NUMBER);
        if(sfont != NULL) {
            //fluid_preset_t *preset;
            //fluid_sfont_iteration_start(sfont);
            //while ((preset = fluid_sfont_iteration_next(sfont)) != NULL) {
            //    int bank = fluid_preset_get_banknum(preset);
            //    int prog = fluid_preset_get_num(preset);
            //    const char* name = fluid_preset_get_name(preset);
            //    printf("bank: %d prog: %d name: %s\n", bank, prog, name);
            //}
            RemoveMenu(hMenu, hInstrumentMenu, MF_BYCOMMAND);
            DestroyMenu(hInstrumentMenu);
            hInstrumentMenu = CreateMenu();
            AppendMenu(hMenu, MF_POPUP, hInstrumentMenu, "Select Instrument");
            this.presets = [];
            this.fsdll("fluid_sfont_iteration_start", 1, [sfont], [VAR_INT], RETURN_VOID);
            let preset;
            while((preset = this.fsdll("fluid_sfont_iteration_next", 1, [sfont], [VAR_INT], RETURN_NUMBER)) != NULL) { //oops had that shit as RETURN_VOID and libffi did NOT like that
                const bank = this.fsdll("fluid_preset_get_banknum", 1, [preset], [VAR_INT], RETURN_NUMBER);
                const prog = this.fsdll("fluid_preset_get_num", 1, [preset], [VAR_INT], RETURN_NUMBER);
                const name = this.fsdll("fluid_preset_get_name", 1, [preset], [VAR_INT], RETURN_CSTRING); //lol this helped me realize that i didn't test returning strings with libffi and i had to fix it
                //this.presets[name] = {bank, prog};
                let i = this.presets.push({bank, prog});
                //print(`bank: ${bank} prog: ${prog} name: ${name}`);
                AppendMenu(hInstrumentMenu, MF_STRING | (i-1 == this.instrumentIndex && MF_CHECKED), INSTRUMENTPRESETSTART_COMMAND+(i-1), name); //using id of 100 because idgaf i just need to know the name of the preset (oh hold on wait no i thought the lp was a handle to the submenu object)
            }
            print("done");
        }
    }

    selectProgram(id) {
        this.instrumentIndex = id;
        const {bank, prog} = this.presets[id];
        print(bank, prog);
        //                              wait wtf inputbox is the only way to get text from the user without a window! (just realized i never added like a get console line or cin) ok i just adde dgetline
        //this.fsdll("fluid_synth_program_select", 5, [this.synth, 0, this.sfont_id, ...[getline("Choose the bank: "), getline("Preset (prog) num: ")]], [VAR_INT, VAR_INT, VAR_INT, VAR_INT, VAR_INT], RETURN_NUMBER);
        return this.fsdll("fluid_synth_program_select", 5, [this.synth, 0, this.sfont_id, bank, prog], [VAR_INT, VAR_INT, VAR_INT, VAR_INT, VAR_INT], RETURN_NUMBER);
    }

    loadNewSf2(sf2) { //im assuming here that deleting the synth also gets rid of the sfont too? (ok wait im just gonna call fluid_synth_sfload)
        //this.fsdll("delete_fluid_synth", 1, [this.synth], [VAR_INT], RETURN_VOID);

        //this.synth = this.fsdll("new_fluid_synth", 1, [this.settings], [VAR_INT], RETURN_NUMBER);
        //if(this.synth == NULL) {
        //    print("Failed to create the new synth!");
        //    return this.cleanup();
        //}

        //let res = this.fsdll("fluid_synth_stop", 2, [this.synth, this.sfont_id], [VAR_INT, VAR_INT], RETURN_NUMBER); //oops i was actually looking for fluid_synth_all_sounds_off (this function stops notes for a given note event voice ID (which i don't have))
        let res = this.fsdll("fluid_synth_all_sounds_off", 2, [this.synth, -1], [VAR_INT, VAR_INT], RETURN_NUMBER); //synth, channel (-1 means every channel)
        let resagain = this.fsdll("fluid_synth_sfunload", 3, [this.synth, this.sfont_id, 1], [VAR_INT, VAR_INT, VAR_INT], RETURN_NUMBER); //synth, sfont_id, reset presets
        print(res, resagain);
        if(res == -1 || resagain == -1) { //FLUID_FAILED
            //idgaf it's probaly still gonna work maybre?
        }

        this.sfont_id = this.fsdll("fluid_synth_sfload", 3, [this.synth, sf2, 1], [VAR_INT, VAR_CSTRING, VAR_INT], RETURN_NUMBER); //synth, filename, reset presets
        if(this.sfont_id == -1) { //FLUID_FAILED
            print("Loading the new SoundFont failed!");
            return this.cleanup();
        }

        this.getPresets();

        //this.fsdll("fluid_synth_set_gain", 2, [this.synth, 2.0], [VAR_INT, VAR_FLOAT], RETURN_VOID);
        print(`fluidsynth done loading my boy (${this.valid})`);
    }

    noteon(chan, key, vel) {
        return this.fsdll("fluid_synth_noteon", 4, [this.synth, chan, key, vel], [VAR_INT, VAR_INT, VAR_INT, VAR_INT], RETURN_NUMBER); //synth, channel, key, velocity
    }

    noteoff(chan, key) {
        return this.fsdll("fluid_synth_noteoff", 3, [this.synth, chan, key], [VAR_INT, VAR_INT, VAR_INT], RETURN_NUMBER); //synth, channel, key
    }

    cleanup() {
        print(this.fsdll("delete_fluid_audio_driver", 1, [this.adriver], [VAR_INT], RETURN_VOID)); //oops these should be void but i don't really have a thing for that
        print(this.fsdll("delete_fluid_synth", 1, [this.synth], [VAR_INT], RETURN_VOID)); //oops these should be void but i don't really have a thing for that
        print(this.fsdll("delete_fluid_settings", 1, [this.settings], [VAR_INT], RETURN_VOID)); //oops these should be void but i don't really have a thing for that
        this.valid = false;
    }
}

let fluidsynthinst;

//const fluidsynthinst = new fluidsynth(__dirname+"\\fluidsynth\\TimGM6mb.sf2");
//const fluidsynthinst = new fluidsynth("E:\\Program Files\\Image-Line\\FL Studio 20\\Data\\Patches\\Soundfonts\\Series_40_5th_edition_FP1__GM_.sf2");
//fluidsynthinst.valid = false; //hmm i'm still not totally sure why Beep and spawn don't work 100% of the time but i think it's related to v8

function readAndPrepareMidi(file) {
    fluidsynthinst.valid && fluidsynthinst.fsdll("fluid_synth_all_sounds_off", 2, [fluidsynthinst.synth, -1], [VAR_INT, VAR_INT], RETURN_NUMBER);

    pianoRollNotes = [];
    let midi = readMidi(file);
    tempo = midi[0];
    let maxX = 0;
    //scrollWidth = (92*(midi[1].at(-1).start)*tempo)/60000 + 70;
    //for(let i = midi[1].length-1; i > 0; i--) {
    //    if(midi[1][i])
    //}
    for(const note of midi[1]) {
        //print(note);
        //Math.floor((note.x - 70)/91)*(60/tempo)*1000;
        //ok symbolab told me that to find note.x it's (91*note.start*tempo)/60000 + 70
        let x = (92*note.start*tempo)/60000 + 70;
        print(note.start, tempo, x, note.key, note.vel, "erm...");                                  //oops i thought midi max velocity was 100!
        let pRN = new ABSDraggable(x, ((131-note.key)*21), (note.beats*4)*23, 20, channelColors[note.channel].map(val => (note.vel/127)*(val/255)), pianoRollNoteDrag); //haha prn
        pRN.key = note.key;
        pRN.channel = note.channel;
        pRN.AltInteract = pianoRollNoteAlt;
        pRN.vel = note.vel;
        pianoRollNotes.push(pRN);
        if(x > maxX) {
            maxX = x;
        }
    }
    scrollWidth = maxX;
}

class Interactable {
    constructor(x, y, width, height, color, interact) {//, DragCallback) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        if(interact) {
            this.Interact = interact; //this breaks the Draggable's interact func so i gotta put it in the if stanteemtn
        }
        //this.Drag = DragCallback//.bind(this); //haha imma JS jenius (ok for some reason it didn't work) OH it was because i was using an anonymous function!
        //this.dragOffset = {x: 0, y: 0};
    }
    Update(mouse) {
        let realcolor = this.color;
        if(mouse.x > this.x && mouse.x < this.x+this.width && mouse.y > this.y && mouse.y < this.y+this.height) {
            //realcolor = realcolor.map((val) => Math.min(val+.1, 1));
            //print(this);
            realcolor = this.Interact(realcolor, mouse);
        }
        brush.SetColor(...realcolor);
        d2d.FillRectangle(this.x, this.y, this.x+this.width, this.y+this.height, brush);
    }
}

class Draggable extends Interactable {
    constructor(x, y, width, height, color, DragCallback) {
        super(x, y, width, height, color);
        this.Drag = DragCallback;
        this.dragOffset = {x: 0, y: 0};
    }
    Interact(realcolor, mouse) {
        if(GetKey(VK_LBUTTON) && !dragging) {
            dragging = this;
            this.dragOffset = {x: mouse.x-this.x, y: mouse.y-this.y};
        }else if(GetKey(VK_RBUTTON)) {
            this.AltInteract(mouse);
        }
        return realcolor.map((val) => Math.min(val+.1, 1));
    }
}

class ABSDraggable extends Draggable { //affected by scroll
    constructor(x, y, width, height, color, DragCallback) {
        super(x, y, width, height, color, DragCallback);
    }
    Interact(realcolor, mouse) {
        if(GetKey(VK_LBUTTON) && !dragging) {
            dragging = this;
            let scrolledX = this.x-scrollPosX*scrollWidth;
            let scrolledY = this.y-scrollPos*(131*21);
            this.dragOffset = {x: mouse.x-scrolledX, y: mouse.y-scrolledY};
        }else if(GetKey(VK_RBUTTON)) {
            this.AltInteract(mouse);
        }
        return realcolor.map((val) => Math.min(val+.1, 1));
    }
    Update(mouse) {
        let realcolor = this.color;
        let scrolledX = this.x-scrollPosX*scrollWidth;
        let scrolledY = this.y-scrollPos*(131*21);
        if(mouse.x > scrolledX && mouse.x < scrolledX+this.width && mouse.y > scrolledY && mouse.y < scrolledY+this.height) {
            //realcolor = realcolor.map((val) => Math.min(val+.1, 1));
            //print(this);
            realcolor = this.Interact(realcolor, mouse);
        }
        brush.SetColor(...realcolor);
        d2d.FillRoundedRectangle(scrolledX, scrolledY, scrolledX+this.width, scrolledY+this.height, 2, 2, brush);
        //d2d.FillRectangle(this.x, scrolledY, this.x+this.width, scrolledY+this.height, brush);
    }
}

function DrawPianoKeys(mouse) {
    for(let i = 0; i < 132; i++) {
        let blackkey = (i%12 < 5 ? (i%12) % 2 == 1 : (i%12) % 2 == 0);
        let c = blackkey ? 0.0 : 1.0;

        pianoKeys[i].y = ((131-i)*21)-(scrollPos*(131*21));
        pianoKeys[i].Update(mouse);

        //if(!blackkey) {
            //brush.SetColor(c,c,c);
            //d2d.FillRectangle(0, ((131-i)*21)-(scrollPos*(131*21)), 70, ((131-i)*21 + 20)-(scrollPos*(131*21)), brush);
        //}
        if(i%12 == 0) {
            c = 1.0-c;
            brush.SetColor(c,c,c);
            d2d.DrawText("C"+i/12, font, 45, pianoKeys[i].y, 70, ((131-i)*21 + 20)-(scrollPos*(131*21)), brush);
        }
        brush.SetColor(42/255, 58/255, 68/255);
        d2d.DrawLine(70, pianoKeys[i].y, width, pianoKeys[i].y, brush);

        if(blackkey) {
            brush.SetColor(0.0, 0.0, 0.0, 0.1);
            d2d.FillRectangle(70, pianoKeys[i].y, width, ((131-i)*21 + 20)-(scrollPos*(131*21)), brush);
        }
    }
}

function GetClientCursorPos(rect) {
    let mouse = GetCursorPos();
    return {x: mouse.x-rect.left-8, y: mouse.y-rect.top-33/*-20*/}; //uh oh the menu bar is messing up my calculations!
}

const tones = [
    16.35,
    17.32,
    18.35,
    19.45,
    20.6,
    21.83,
    23.12,
    24.5,
    25.96,
    27.5,
    29.14,
    30.87
]; //im using https://muted.io/note-frequencies/ 
//apparently every octave's tone is just the 0th octave's tone multiplied by 2 to the power of the octave

function playTone(key, pitch, up = false) {
    //print(key, pitch);
    if(!fluidsynthinst.valid && !up) {
        let tone = tones[key]*(2**pitch);
        Beep(tone, 500);//.then(any => console.log("promise: ", any)); //ok for some reason it keeps randomly crashing and idk what the error is saying
    }else {
        const note = pitch*12 + key;
        if(!up) {
            if(!pianoKeys[note].lastColor) {
                pianoKeys[note].lastColor = pianoKeys[note].color; //luckily this is js and i can just add properties (i could just add it directly to interactable but i only need this property for the piano keys)
            }
            pianoKeys[note].color = [1, 155/255, 0];
            fluidsynthinst.noteon(0, note, 100);
        }else {
            pianoKeys[note].color = pianoKeys[note].lastColor;
            delete pianoKeys[note].lastColor; //delete this property so i can check if it already exists when you call playTone (because to fire playTone again with up being false means you held the key for too long and it started sending repeat messages lmao)
            fluidsynthinst.noteoff(0, note);
        }
    }
}

const FLKeyNotes = { //fl studio piano roll
    "Z": [0, 4],
    "S": [1, 4],
    "X": [2, 4],
    "D": [3, 4],
    "C": [4, 4],
    "V": [5, 4],
    "G": [6, 4],
    "B": [7, 4],
    "H": [8, 4],
    "N": [9, 4],
    "J": [10, 4],
    "M": [11, 4],
    ",": [0, 5],
    "L": [1, 5],
    ".": [2, 5],
    ";": [3, 5],
    "/": [4, 5],

    "Q": [0, 5],
    "2": [1, 5],
    "W": [2, 5],
    "3": [3, 5],
    "E": [4, 5],
    "R": [5, 5],
    "5": [6, 5],
    "T": [7, 5],
    "6": [8, 5],
    "Y": [9, 5],
    "7": [10, 5],
    "U": [11, 5],
    "I": [0, 6],
    "9": [1, 6],
    "O": [2, 6],
    "0": [3, 6],
    "P": [4, 6],
    "[": [5, 6],
    "=": [6, 6],
    "]": [7, 6],
};

//virtual piano notes
/*
let i = 0;
const VPKeyNotes = {};
let v = "1!2@34$5%6^78*9(0qQwWeErtTyYuiIoOpPasSdDfgGhHjJklLzZxcCvVbBnm".split("").forEach(function(str) {
    VPKeyNotes[str] = [i%12, Math.floor(i/12)+2];
    i++;
});
*/
const VPKeyNotes = {"0":[4,3],"1":[0,2],"2":[2,2],"3":[4,2],"4":[5,2],"5":[7,2],"6":[9,2],"7":[11,2],"8":[0,3],"9":[2,3],"!":[1,2],"@":[3,2],"$":[6,2],"%":[8,2],"^":[10,2],"*":[1,3],"(":[3,3],"q":[5,3],"Q":[6,3],"w":[7,3],"W":[8,3],"e":[9,3],"E":[10,3],"r":[11,3],"t":[0,4],"T":[1,4],"y":[2,4],"Y":[3,4],"u":[4,4],"i":[5,4],"I":[6,4],"o":[7,4],"O":[8,4],"p":[9,4],"P":[10,4],"a":[11,4],"s":[0,5],"S":[1,5],"d":[2,5],"D":[3,5],"f":[4,5],"g":[5,5],"G":[6,5],"h":[7,5],"H":[8,5],"j":[9,5],"J":[10,5],"k":[11,5],"l":[0,6],"L":[1,6],"z":[2,6],"Z":[3,6],"x":[4,6],"c":[5,6],"C":[6,6],"v":[7,6],"V":[8,6],"b":[9,6],"B":[10,6],"n":[11,6],"m":[0,7]}

let pianoLayout = FLKeyNotes;
let pianoRollNotes = [];

const channelColors = [[158, 209, 165], [159, 211, 186], [161, 214, 208], [163, 202, 216], [165, 184, 219], [168, 167, 222], [188, 167, 222], [209, 167, 222], [221, 167, 214], [219, 165, 192], [217, 163, 169], [214, 175, 162], [212, 193, 160], [209, 210, 158], [189, 209, 158], [169, 209, 157]];

function pianoRollNoteDrag(mouse) {
    this.x = /*Math.min(*/Math.max(Math.floor((mouse.x-this.dragOffset.x+scrollPosX*scrollWidth)/23)*23, 70);//, width-20);
    this.y = Math.floor((mouse.y-this.dragOffset.y+scrollPos*(131*21))/21)*21;// - (Math.floor((mouse.y-this.dragOffset.y)/23));
    //print((scrollPos*(131*21))/this.y);
    //((131-i)*21)-(scrollPos*(131*21))
    this.key = 131-this.y/21;
    //print(131-this.y/21);
}

function pianoRollNoteAlt(mouse) {
    pianoRollNotes.splice(pianoRollNotes.findIndex((note) => note.x == this.x && note.y == this.y), 1);
    //oops this is causing a pseudo concurrent modification exception type problem where i don't draw the last note because i skip one after splicing (it's not a big enough problem to fix LO!)
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        DragAcceptFiles(hwnd, true); //you can just use WS_EX_ACCEPTFILES

        d2d = createCanvas("d2d", ID2D1DeviceContext, hwnd);  //DComposition
        brush = d2d.CreateSolidColorBrush(1.0, 1.0, 0.0);
        
        font = d2d.CreateFont("arial", 12);
        biggerfont = d2d.CreateFont("arial", 30);
        
        print(d2d.backBitmap, d2d.targetBitmap);

        //testBmp = d2d.CreateBitmapFromDxgiSurface(D2D1_BITMAP_OPTIONS_TARGET | D2D1_BITMAP_OPTIONS_CANNOT_DRAW);
        
        //print(testBmp);

        scrollBar = new Draggable(width-20, 0, 20, 70, [80/255, 89/255, 94/255], function(mouse) {
            scrollPos = Math.min(Math.max(mouse.y-this.dragOffset.y, 0), height-70) / (height-70);
            print(scrollPos);
        });
        scrollBarX = new Draggable(70, height-20, 70, 20, [80/255, 89/255, 94/255], function(mouse) {
            scrollPosX = Math.min(Math.max(mouse.x-this.dragOffset.x-70, 0), width-70) / (width-70);
            print(scrollPosX);
        });

        for(let i = 0; i < 132; i++) {
            let blackkey = (i%12 < 5 ? (i%12) % 2 == 1 : (i%12) % 2 == 0);
            let c = blackkey ? 0.0 : 1.0;
            
            pianoKeys.push(new Interactable(0, ((131-i)*21), 70, 20, [c,c,c], function(realcolor, mouse) {
                if(GetKeyDown(VK_LBUTTON) && GetForegroundWindow() == hwnd) {
                    playTone(i%12, Math.floor(i/12));
                }
                return [1.0, 205/255, 145/255];
            }));

                //brush.SetColor(c,c,c);
                //d2d.FillRectangle(0, ((131-i)*21)-(scrollPos*(131*21)), 70, ((131-i)*21 + 20)-(scrollPos*(131*21)), brush);

            //brush.SetColor(42/255, 58/255, 68/255);
            //d2d.DrawLine(70, ((131-i)*21)-(scrollPos*(131*21)), width, ((131-i)*21)-(scrollPos*(131*21)), brush);
        }

        hMenu = CreateMenu();
        let hFileMenu = CreateMenu();
        hLayoutMenu = CreateMenu();
        hGainMenu = CreateMenu();
        hInstrumentMenu = CreateMenu();
        AppendMenu(hFileMenu, MF_STRING, NEW_COMMAND, "New");
        AppendMenu(hFileMenu, MF_STRING, OPEN_COMMAND, "Open...");
        AppendMenu(hFileMenu, MF_STRING, SAVE_COMMAND, "Save As...");
        AppendMenu(hFileMenu, MF_STRING, EXIT_COMMAND, "Exit");
        AppendMenu(hFileMenu, MF_SEPARATOR, NULL, "NULL");
        AppendMenu(hMenu, MF_POPUP, hFileMenu, "File");

        AppendMenu(hLayoutMenu, MF_STRING | MF_CHECKED, FLLAYOUT_COMMAND, "FL studio layout");
        AppendMenu(hLayoutMenu, MF_STRING, VPLAYOUT_COMMAND, "Virtual Piano layout");
        AppendMenu(hMenu, MF_POPUP, hLayoutMenu, "Select Layout"); //if fluidsynthinst failed then gray this bih out (actually nevermind)

        //AppendMenu(hMenu, MF_STRING | (!fluidsynthinst.valid && MF_GRAYED), 21, "Load SoundFont"); //if fluidsynthinst failed then gray this bih out (actually nevermind)
        //ModifyMenu(hMenu, 21, MF_BYCOMMAND | MF_STRING | MF_GRAYED, 21, NULL);
        AppendMenu(hMenu, MF_STRING, LOADSF2_COMMAND, "Load SoundFont..."); //if fluidsynthinst failed then gray this bih out (actually nevermind)
        
        AppendMenu(hMenu, MF_STRING, STOPSOUND_COMMAND, "Stop all sounds");
        
        for(let i = 0; i < 11; i++) {
            AppendMenu(hGainMenu, MF_STRING | (i == 2 ? MF_CHECKED : MF_UNCHECKED), GAINSTART_COMMAND+i, i+".0"); //in lua you would do tostring(i)..".0";
        }
        AppendMenu(hMenu, MF_POPUP, hGainMenu, "Set gain level");

        AppendMenu(hMenu, MF_POPUP, hInstrumentMenu, "Select Instrument");

        fluidsynthinst = new fluidsynth(__dirname+"\\fluidsynth\\TimGM6mb.sf2"); //i gotta create this shit here so i can change hBankMenu and hProgMenu

        SetMenu(hwnd, hMenu);

        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        d2d.BeginDraw();
        d2d.Clear(52/255, 68/255, 78/255);

        let rect = GetWindowRect(hwnd);
        let mouse = GetClientCursorPos(rect);
        //print(mouse.y, scrollBarX.y);
        //let {width, height} = d2d.GetSize();

        brush.SetColor(42/255, 58/255, 68/255);
        let dark = false;
        for(let i = /*4*/0; i <= Math.floor(width/23); i++) { //dang my math is brazy
            if((i+1)%4 == 0) {
                brush.SetColor(34/255, 50/255, 60/255);
                dark = true;
            }else if(dark) {
                brush.SetColor(42/255, 58/255, 68/255);
                dark = false;
            }
            let x = (23*i)-scrollPosX*scrollWidth;
            //while(x < 0) {
            //    x = x < 0 ? width+x : x; //i SWEAR there is an easier way to do this but im trying really hard and i can't figure it out
            //}
            //WAIT I THINK I GOT IT
            x = x < 0 ? (width*(Math.ceil(Math.abs(x)/width))+x) : x;
            d2d.DrawLine(x, 0, x, height, brush);
        }

        DrawPianoKeys(mouse);

        //print(dragging);

        dragging?.Drag(mouse); //goated operator for times like these

        scrollBar.y = scrollPos * (height-70);
        scrollBar.Update(mouse);

        scrollBarX.x = (scrollPosX*(width-140)) + 70;
        scrollBarX.Update(mouse);

        for(let note of pianoRollNotes) {
            note.Update(mouse);
        }

        if(mouse.x > 70 && GetKeyDown(VK_LBUTTON) && !dragging) {
            let note = new ABSDraggable(mouse.x, mouse.y, 4*23, 20, [158/255, 209/255, 165/255], pianoRollNoteDrag);
            //note.beats = 1;
            //note.key = 0;
            note.vel = 80;
            note.channel = 0;
            note.AltInteract = pianoRollNoteAlt;
            pianoRollNotes.push(note);
            dragging = note;
        }

        //brush.SetColor(80/255, 89/255, 94/255);
        //d2d.FillRectangle(width-20, scrollPos, width, scrollPos+70, brush);
        brush.SetColor(1.0, 1.0, 1.0);
        d2d.DrawText("Tempo: "+tempo, biggerfont, width-200, 0, width-20, height, brush);

        if(playing) {
            const time = Date.now()-playStart;
            const playheadX = ((92*time*tempo)/60000 + 70)-scrollPosX*scrollWidth;//(70+time)-scrollPosX*scrollWidth;
            brush.SetColor(0.0, 1.0, 0.2);
            d2d.DrawLine(playheadX, 0, playheadX, height, brush, 2);
            //if(time > sortedNotes[playJ].timing) { //this system can't do more than one note at a time so if there are 4 notes on a beat that shit is getting rolled out with AT LEAST an 16 ms delay! (SetTimer is set to 16ms!) 1st note: 0ms, 2nd note: ~16ms, 3rd note: ~32ms, 4th note: ~48ms!!!
            while(playJ < sortedNotes.length && time > sortedNotes[playJ].timing) { //damn im a genius!
                if(!fluidsynthinst.valid) {
                    Beep(tones[sortedNotes[playJ].key%12]*(2**Math.floor(sortedNotes[playJ].key/12)), sortedNotes[playJ].beats*(60/tempo)*(1000), true); //ok for some reason the thread created by beep crashes randomly
                }else {
                    fluidsynthinst.noteon(sortedNotes[playJ].channel, sortedNotes[playJ].key, sortedNotes[playJ].vel);
                }
                noteEndTimes.push(playJ);


                //spawn(() => {
                //    Beep(tones[sortedNotes[playJ].key%12]*(2**Math.floor(sortedNotes[playJ].key/12)), sortedNotes[playJ].beats*(60/tempo)*(1000), false); //OK THIS CRASHED MORE OFTEN THAN BEEP(..., ..., true);
                //});
                //milliseconds.push(note.beats*(60/tempo)*(1000));
                //hertz.push(tones[note.key%12]*(2**Math.floor(note.key/12)));

                //if(playJ > 0) {
                //    //print(playJ, sortedNotes[playJ-1]);
                //    //doing this is kinda weird because im not waiting for the note to end
                //    sortedNotes[playJ-1].color = channelColors[sortedNotes[playJ-1].channel].map(val => val/255);
                //    fluidsynthinst.noteoff(sortedNotes[playJ-1].channel, sortedNotes[playJ-1].key);
                //}
                sortedNotes[playJ].color = channelColors[10].map(val => (sortedNotes[playJ].vel/127)*(val/255));
                playJ++;
                //if(playJ >= sortedNotes.length) {
                //    playing = false;
                //}
            }

            const delist = [];
            for(let i = 0; i < noteEndTimes.length; i++) {
                const note = sortedNotes[noteEndTimes[i]];
                if(time > note.timing + (note.beats*(60/tempo)*(1000))) { //timing (note start time in ms) + beats in ms = note end timing
                    note.color = channelColors[note.channel].map(val => (note.vel/127)*(val/255)); //lowkey why am i calculating the color here
                    delist.push(noteEndTimes[i]);
                    if(fluidsynthinst.valid) {
                        fluidsynthinst.noteoff(note.channel, note.key);
                    }

                    if(noteEndTimes[i] >= sortedNotes.length-1) {
                        playing = false;
                    }
                }
            }

            delist.forEach(e => {
                noteEndTimes.splice(noteEndTimes.indexOf(e), 1);
            });
            ////while((Date.now() - start) < sorted.at(-1).timing+(sorted.at(-1).beats*(60/tempo)*(1000))) { //bruh i think the beeps are blocking the thread for so long that it runs out of time
            //while(true) {
            //    if((Date.now() - start) > sorted[j].timing) {
            //        //print(hertz[j], milliseconds[j]);
            //        Beep(hertz[j], milliseconds[j]); //, true);
            //        j++;
            //        if(j >= sorted.length) {
            //            break;
            //        }
            //    }
            //    Sleep(16);
            //}
        }

        d2d.EndDraw();

        i++;
    }else if(msg == WM_SIZE) {
        let [nWidth, nHeight] = [LOWORD(lp), HIWORD(lp)];
        nHeight += 20; //idk something about the menu bar is messing my shit up
        //testBmp.Release(); //oh shoot bitmaps created from the dxgisurface MUST be released BEFORE resizing that's really important!
        d2d.Resize(nWidth, nHeight);
        scrollBar.x = nWidth-20;
        scrollBarX.y = nHeight-20;
        //testBmp = d2d.CreateBitmapFromDxgiSurface(D2D1_BITMAP_OPTIONS_TARGET | D2D1_BITMAP_OPTIONS_CANNOT_DRAW); //recreate
        width = nWidth;
        height = nHeight;
    }else if(msg == WM_LBUTTONDOWN) {
        SetCapture(hwnd); //window still receives mouse events even when the mouse is off the window
    }else if(msg == WM_LBUTTONUP) {
        ReleaseCapture();
        dragging = undefined;
    }else if(msg == WM_MOUSEWHEEL) {
        //print(GET_WHEEL_DELTA_WPARAM(wp), lp);
        const wheel = GET_WHEEL_DELTA_WPARAM(wp)/-2400;
        if((LOWORD(wp) & MK_SHIFT) == MK_SHIFT) {
            scrollPosX = Math.min(Math.max(scrollPosX+wheel, 0), 1);
        }else {
            scrollPos = Math.min(Math.max(scrollPos+wheel, 0), 1);
        }    
    }else if(msg == WM_KEYDOWN) {
        print(String.fromCharCode(wp), wp);
        let args;
        if(pianoLayout == FLKeyNotes) {
            args = pianoLayout[String.fromCharCode(wp)];
        }else {
            /*static*/ const shifted = { //i asked chat what i should do and he gave me the answer i wasn't tryna do so im just gonna do it anyways
                0x30: 0x29,  // '0' -> ')'
                0x31: 0x21,  // '1' -> '!'
                0x32: 0x40,  // '2' -> '@'
                0x33: 0x23,  // '3' -> '#'
                0x34: 0x24,  // '4' -> '$'
                0x35: 0x25,  // '5' -> '%'
                0x36: 0x5E,  // '6' -> '^'
                0x37: 0x26,  // '7' -> '&'
                0x38: 0x2A,  // '8' -> '*'
                0x39: 0x28,  // '9' -> '('
            }
            //args = pianoLayout[String.fromCharCode(shifted[wp] || (wp+(GetKey(VK_SHIFT) == 0)*32))]; //write dumb code bruh (wait this was actually dumb because it was wrong haha)
            if(GetKey(VK_SHIFT)) {
                args = pianoLayout[String.fromCharCode(shifted[wp] || wp)];
            }else {
                args = pianoLayout[String.fromCharCode(shifted[wp] ? wp : wp+32)];
            }
        }
        if(args) {
            playTone(...args);
        }
        if(wp == VK_UP || wp == VK_RIGHT) {
            //print(wp, lp);
            let mul = (GetKey(VK_SHIFT)) ? 1/5 : (GetKey(VK_CONTROL)) ? 10 : 1
            tempo += 5*mul;
        }else if(wp == VK_DOWN || wp == VK_LEFT) {
            let mul = (GetKey(VK_SHIFT)) ? 1/5 : (GetKey(VK_CONTROL)) ? 10 : 1
            tempo -= 5*mul;
        }else if(wp == VK_SPACE && !playing) {
            playing = true;
            playStart = Date.now();
            playJ = 0;
            //let ms = beats*(60/tempo)*(1000);
            //let milliseconds = [];
            //let hertz = [];
            noteEndTimes = [];
            sortedNotes = pianoRollNotes.sort((noteL, noteR) => noteL.x - noteR.x); //ascending by x value
//
            for(let note of sortedNotes) {
                note.beats = note.width/92;
                //milliseconds.push(note.beats*(60/tempo)*(1000));
                //hertz.push(tones[note.key%12]*(2**Math.floor(note.key/12)));
                note.timing = /*Math.floor*/((note.x - 70)/92)*(60/tempo)*1000; //yo wait wtf i think my floor here is fucking it up
                //print(note.timing);
            }
            //print("Using asynchronous Beep(, , true); sometimes crashes jbs for some reason so watch out for that"); //wait running it in the debugger shows that d2d is actually crashing it
//
            //let j = 0;
//
            //let start = Date.now();
            //print("start",start);
//
            ////while((Date.now() - start) < sorted.at(-1).timing+(sorted.at(-1).beats*(60/tempo)*(1000))) { //bruh i think the beeps are blocking the thread for so long that it runs out of time
            //while(true) {
            //    if((Date.now() - start) > sorted[j].timing) {
            //        //print(hertz[j], milliseconds[j]);
            //        Beep(hertz[j], milliseconds[j]); //, true);
            //        j++;
            //        if(j >= sorted.length) {
            //            break;
            //        }
            //    }
            //    Sleep(16);
            //}

            //for(let i = 0; i < sorted.length; i++) {
            //    print(i, hertz[i], milliseconds[i]);
            //    Beep(hertz[i], milliseconds[i]);
            //}

            //for(let note of pianoRollNotes) {
            //    
            //}
        }
    }else if(msg == WM_KEYUP) {
        let args;
        if(pianoLayout == FLKeyNotes) {
            args = pianoLayout[String.fromCharCode(wp)];
        }else {
            /*static*/ const shifted = { //i asked chat what i should do and he gave me the answer i wasn't tryna do so im just gonna do it anyways
                0x30: 0x29,  // '0' -> ')'
                0x31: 0x21,  // '1' -> '!'
                0x32: 0x40,  // '2' -> '@'
                0x33: 0x23,  // '3' -> '#'
                0x34: 0x24,  // '4' -> '$'
                0x35: 0x25,  // '5' -> '%'
                0x36: 0x5E,  // '6' -> '^'
                0x37: 0x26,  // '7' -> '&'
                0x38: 0x2A,  // '8' -> '*'
                0x39: 0x28,  // '9' -> '('
            }
            //args = pianoLayout[String.fromCharCode(shifted[wp] || (wp+(GetKey(VK_SHIFT) == 0)*32))]; //write dumb code bruh (wait this was actually dumb because it was wrong haha)
            if(GetKey(VK_SHIFT)) {
                args = pianoLayout[String.fromCharCode(shifted[wp] || wp)];
            }else {
                args = pianoLayout[String.fromCharCode(shifted[wp] ? wp : wp+32)];
            }
        }
        if(args) {
            playTone(...args, true);
        }
    }else if(msg == WM_COMMAND) {
                                        //wp == id
        //AppendMenu(hFileMenu, MF_STRING, 1, "New");
        //AppendMenu(hFileMenu, MF_STRING, 2, "Open...");
        //AppendMenu(hFileMenu, MF_STRING, 3, "Save As...");
        //AppendMenu(hFileMenu, MF_STRING, 4, "Exit");
        
        if(wp == NEW_COMMAND) {
            pianoRollNotes = [];
        }else if(wp == OPEN_COMMAND) {
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
                readAndPrepareMidi(file[0]);
            }
        }else if(wp == SAVE_COMMAND) {
            //uh idk yet about that yet
            print(pianoRollNotes);
        }else if(wp == EXIT_COMMAND) {
            DestroyWindow(hwnd);
        }else if(wp >= GAINSTART_COMMAND && wp < GAINSTART_COMMAND+11) {
            print(wp-GAINSTART_COMMAND);
            for(let i = 0; i < 11; i++) {
                //ModifyMenu(hGainMenu, GAINSTART_COMMAND+i, MF_BYCOMMAND | (wp==GAINSTART_COMMAND+i && MF_CHECKED), GAINSTART_COMMAND+i, NULL);
                //let iteminfo = {fMask: MIIM_ID | MIIM_CHECKMARKS | MIIM_STRING, wID: ID_TROLL2, hbmpChecked: bruhchecked, hbmpUnchecked: bruhunchecked, dwTypeData: "troll mode max:", cch: 15} //https://learn.microsoft.com/en-us/windows/win32/api/winuser/ns-winuser-menuiteminfow
                //print(InsertMenuItem(hPopupMenu, 0, true, iteminfo));
        
                SetMenuItemInfo(hGainMenu, i, true, {fMask: MIIM_STATE, fState: wp == GAINSTART_COMMAND+i ? MFS_CHECKED : MFS_UNCHECKED});
            }
            fluidsynthinst.fsdll("fluid_synth_set_gain", 2, [fluidsynthinst.synth, wp-GAINSTART_COMMAND], [VAR_INT, VAR_FLOAT], RETURN_VOID);
        }else if(wp == LOADSF2_COMMAND) { //load soundfont
            let file = showOpenFilePicker({ //yo wait sometimes this shit doesn't work?
                multiple: false,
                excludeAcceptAllOption: true,
                types: [
                    {
                        description: "SoundFont files",
                        accept: [".sf2", ".sf3"] //i can't be bothered to implement the mime types :sob:
                    }
                ]
            });
            print(file);
            if(file) {
                fluidsynthinst.loadNewSf2(file[0]);
            }
        }else if(wp == STOPSOUND_COMMAND) {
            fluidsynthinst.valid && fluidsynthinst.fsdll("fluid_synth_all_sounds_off", 2, [fluidsynthinst.synth, -1], [VAR_INT, VAR_INT], RETURN_NUMBER);
        }else if(wp == FLLAYOUT_COMMAND || wp == VPLAYOUT_COMMAND) {
            pianoLayout = wp == FLLAYOUT_COMMAND ? FLKeyNotes : VPKeyNotes;

            SetMenuItemInfo(hLayoutMenu, 0, true, {fMask: MIIM_STATE, fState: wp == FLLAYOUT_COMMAND ? MFS_CHECKED : MFS_UNCHECKED});
            SetMenuItemInfo(hLayoutMenu, 1, true, {fMask: MIIM_STATE, fState: wp == VPLAYOUT_COMMAND ? MFS_CHECKED : MFS_UNCHECKED});
        }
        else if(wp >= INSTRUMENTPRESETSTART_COMMAND) { //one of the preset names in hInstrumentMenu
            print(wp-INSTRUMENTPRESETSTART_COMMAND);
            SetMenuItemInfo(hInstrumentMenu, fluidsynthinst.instrumentIndex, true, {fMask: MIIM_STATE, fState: MFS_UNCHECKED});
            SetMenuItemInfo(hInstrumentMenu, wp, false, {fMask: MIIM_STATE, fState: MFS_CHECKED});
            
            fluidsynthinst.selectProgram(wp-INSTRUMENTPRESETSTART_COMMAND);

            //for(let i = 0; i < fluidsynthinst.presets.length; i++) {
            //    SetMenuItemInfo(hInstrumentMenu, i, true, {fMask: MIIM_STATE, fState: wp == INSTRUMENTPRESETSTART_COMMAND+i ? MFS_CHECKED : MFS_UNCHECKED});
            //}
        }
        print(wp, lp);
    }else if(msg == WM_DROPFILES) {
        const filename = DragQueryFile(wp, 0);
        readAndPrepareMidi(filename);
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        font.Release();
        biggerfont.Release();
        brush.Release();
        //testBmp.Release();
        d2d.Release();
        if(fluidsynthinst.valid) {
            fluidsynthinst.cleanup();
        }
        print(fluidsynthinst.fsdll("__FREE"), "== 1 (FREE)");
    }
}

const wc = CreateWindowClass("jbstudio", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "jbstudio3.js (use arrows to edit tempo)", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, width+20, height+42+20, NULL, NULL, hInstance);