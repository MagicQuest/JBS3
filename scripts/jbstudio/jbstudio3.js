let d2d, brush, font, biggerfont, testBmp, dragging;
let width = 1280;
let height = 720;
let scrollPos = 0.5;
let scrollBar, scrollBarX;
let scrollWidth = 10000;
let scrollPosX = 0;
let i = 1;
let tempo = 130;

let pianoKeys = [];

const readMidi = eval(require("fs").read(`${__dirname}/readmidi.js`));

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

function playTone(key, pitch) {
    print(key, pitch);
    let tone = tones[key]*(2**pitch);
    Beep(tone, 500);//.then(any => console.log("promise: ", any)); //ok for some reason it keeps randomly crashing and idk what the error is saying
}

let keyNotes = {
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
    //oops this is causing a pseudo concurrent modification exception type problem where i don't draw the last note because i skip one after splicing (it's not a big enoug problem to fix LO!)
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1DeviceContext, hwnd);  //DComposition
        brush = d2d.CreateSolidColorBrush(1.0, 1.0, 0.0);
        
        font = d2d.CreateFont("arial", 12);
        biggerfont = d2d.CreateFont("arial", 30);
        
        print(d2d.backBitmap, d2d.targetBitmap);

        testBmp = d2d.CreateBitmapFromDxgiSurface(D2D1_BITMAP_OPTIONS_TARGET | D2D1_BITMAP_OPTIONS_CANNOT_DRAW);
        
        print(testBmp);

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
                if(GetKeyDown(VK_LBUTTON)) {
                    playTone(i%12, Math.floor(i/12));
                }
                return [1.0, 205/255, 145/255];
            }));

                //brush.SetColor(c,c,c);
                //d2d.FillRectangle(0, ((131-i)*21)-(scrollPos*(131*21)), 70, ((131-i)*21 + 20)-(scrollPos*(131*21)), brush);

            //brush.SetColor(42/255, 58/255, 68/255);
            //d2d.DrawLine(70, ((131-i)*21)-(scrollPos*(131*21)), width, ((131-i)*21)-(scrollPos*(131*21)), brush);
        }

        let hMenu = CreateMenu();
        let hFileMenu = CreateMenu();
        AppendMenu(hFileMenu, MF_STRING, 1, "New");
        AppendMenu(hFileMenu, MF_STRING, 2, "Open...");
        AppendMenu(hFileMenu, MF_STRING, 3, "Save As...");
        AppendMenu(hFileMenu, MF_STRING, 4, "Exit");
        AppendMenu(hFileMenu, MF_SEPARATOR, NULL, "NULL");
        AppendMenu(hMenu, MF_POPUP, hFileMenu, "File");

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
        for(let i = 4; i <= Math.floor(width/23)+2; i++) { //dang my math is brazy
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
            note.AltInteract = pianoRollNoteAlt;
            pianoRollNotes.push(note);
            dragging = note;
        }

        //brush.SetColor(80/255, 89/255, 94/255);
        //d2d.FillRectangle(width-20, scrollPos, width, scrollPos+70, brush);
        brush.SetColor(1.0, 1.0, 1.0);
        d2d.DrawText("Tempo: "+tempo, biggerfont, width-200, 0, width-20, height, brush);

        d2d.EndDraw();

        i++;
    }else if(msg == WM_SIZE) {
        let [nWidth, nHeight] = [LOWORD(lp), HIWORD(lp)];
        nHeight += 20; //idk something about the menu bar is messing my shit up
        testBmp.Release(); //oh shoot bitmaps created from the dxgisurface MUST be released BEFORE resizing that's really important!
        d2d.Resize(nWidth, nHeight);
        scrollBar.x = nWidth-20;
        scrollBarX.y = nHeight-20;
        testBmp = d2d.CreateBitmapFromDxgiSurface(D2D1_BITMAP_OPTIONS_TARGET | D2D1_BITMAP_OPTIONS_CANNOT_DRAW); //recreate
        width = nWidth;
        height = nHeight;
    }else if(msg == WM_LBUTTONDOWN) {
        SetCapture(hwnd); //window still recieves mouse events even when the mouse is off the window
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
        print(String.fromCharCode(wp));
        let args = keyNotes[String.fromCharCode(wp)];
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
        }else if(wp == VK_SPACE) {
            //let ms = beats*(60/tempo)*(1000);
            let milliseconds = [];
            let hertz = [];
            let sorted = pianoRollNotes.sort((noteL, noteR) => noteL.x - noteR.x); //ascending by x value

            for(let note of sorted) {
                note.beats = note.width/92;
                milliseconds.push(note.beats*(60/tempo)*(1000));
                hertz.push(tones[note.key%12]*(2**Math.floor(note.key/12)));
                note.timing = Math.floor((note.x - 70)/92)*(60/tempo)*1000;
            }

            let j = 0;

            let start = Date.now();

            //while((Date.now() - start) < sorted.at(-1).timing+(sorted.at(-1).beats*(60/tempo)*(1000))) { //bruh i think the beeps are blocking the thread for so long that it runs out of time
            while(true) {
                if((Date.now() - start) > sorted[j].timing) {
                    //print(hertz[j], milliseconds[j]);
                    Beep(hertz[j], milliseconds[j]); //, true);
                    j++;
                    if(j >= sorted.length) {
                        break;
                    }
                }
                Sleep(16);
            }

            //for(let i = 0; i < sorted.length; i++) {
            //    print(i, hertz[i], milliseconds[i]);
            //    Beep(hertz[i], milliseconds[i]);
            //}

            //for(let note of pianoRollNotes) {
            //    
            //}
        }
    }else if(msg == WM_COMMAND) {
                                        //wp == id
        //AppendMenu(hFileMenu, MF_STRING, 1, "New");
        //AppendMenu(hFileMenu, MF_STRING, 2, "Open...");
        //AppendMenu(hFileMenu, MF_STRING, 3, "Save As...");
        //AppendMenu(hFileMenu, MF_STRING, 4, "Exit");
        
        if(wp == 1) {
            pianoRollNotes = [];
        }else if(wp == 2) {
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
                pianoRollNotes = [];
                let midi = readMidi(file[0]);
                tempo = midi[0];
                scrollWidth = (92*(midi[1].at(-1).start)*tempo)/60000 + 70;
                //for(let i = midi[1].length-1; i > 0; i--) {
                //    if(midi[1][i])
                //}
                for(const note of midi[1]) {
                    //print(note);
                    //Math.floor((note.x - 70)/91)*(60/tempo)*1000;
                    //ok symbolab told me that to find note.x it's (91*note.start*tempo)/60000 + 70
                    let x = (92*note.start*tempo)/60000 + 70;
                    print(note.start, tempo, x, note.key, "erm...");
                    let pRN = new ABSDraggable(x, ((131-note.key)*21), (note.beats*4)*23, 20, channelColors[note.channel].map(val => val/255), pianoRollNoteDrag); //haha prn
                    pRN.key = note.key;
                    pRN.AltInteract = pianoRollNoteAlt;
                    pianoRollNotes.push(pRN);
                }
            }
        }else if(wp == 3) {
            //uh idk yet
        }else if(wp == 4) {
            DestroyWindow(hwnd);
        }
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        font.Release();
        biggerfont.Release();
        brush.Release();
        testBmp.Release();
        d2d.Release();
    }
}

const wc = CreateWindowClass("jbstudio", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "jbstudio3.js (use arrows to edit tempo)", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, width+20, height+42+20, NULL, NULL, hInstance);