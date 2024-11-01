//aw man i can't make this the way i imagined
//i wanted to use like 100+ windows but now i gotta use 1 window with a lot of child windows

const bounds = 64;//240;
const rows = Math.ceil(screenWidth/bounds);
const cols = Math.ceil(screenHeight/bounds);
let hash = [];

//let window;
let windows = [];

let runs = 0;

//spawn(function() {
//    print("skibidi");
//    //__debugbreak();
//    print(bounds);
//
//    //for(let i = 0; i < rows; i++) {
//    //    for(let j = 0; j < cols; j++) {
//    //        //i was gonna use windows.push here at CreateWindow but CreateWindow lowkey blocks the thread so that would NOT work (i have to put them in WM_CREATE)
//    //        //i was ALSO gonna use CreateWindow itself here but since it blocks the thread i gotta use a promise or something (i'd love to use spawn but boy i feel like im way in over my head with all that)
//    //        //CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_TOOLWINDOW | WS_EX_TOPMOST, DefWindowClass(), "", WS_POPUP | WS_VISIBLE, i*bounds, j*bounds, bounds, bounds, NULL, NULL, hInstance);
//    //        //new Promise(function(resolve, reject) {
//    //        //print(`${rows} , ${cols}, ${bounds} js doesn';t klike this asnyc shit `);
//    //            CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_TOOLWINDOW | WS_EX_TOPMOST, DefWindowClass(), "", WS_POPUP | WS_VISIBLE, i*bounds, j*bounds, bounds, bounds, NULL, NULL, hInstance);
//    //        //}); //this shit lowkey crashed visual studio
//    //    }
//    //}
//});

//ok NEW windows (that use the CreateWindowClass object) NO LONGER block the thread! (BUT WAIT!!! the FIRST window you create (that uses the CreateWindowClass object) DOES block the thread!!!)
//NEVERMIND this shit doesn't really work idk man

class Miner {
    constructor(hwnd) {
        this.x = screenWidth/2;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.visual = CreateWindow(NULL, "BUTTON", "", WS_VISIBLE | WS_CHILD, this.x, this.y, bounds, bounds, hwnd, NULL, hInstance);//button;
    }

    Update() {
        let mouse = GetCursorPos();
        this.x = mouse.x;
        this.y = mouse.y;
        //this.vy += 0.01;
        //this.x += this.vx;
        //this.y += this.vy;

        //const maf = Math.floor(this.x/3) + Math.floor(this.y/3)*Math.floor(rows/3);
        //const maf = Math.floor((Math.floor(this.x/bounds)*bounds)/3) + Math.floor((Math.floor(this.y/bounds)*bounds)/3)*Math.floor(rows/3); //i gotta snap the values at the bounds

        //print(Math.floor(this.x/3), Math.floor(this.y/3), Math.floor(rows/3), maf);
        //print(Math.floor((Math.floor(this.x/bounds)*bounds)/3), Math.floor((Math.floor(this.y/bounds)*bounds)/3), maf);

        const snappedX = Math.floor(this.x/bounds)*bounds;
        const snappedY = Math.floor(this.y/bounds)*bounds;

        print(snappedX, snappedY);

        if(hash[Math.floor(snappedX)/3] && hash[Math.floor(snappedX)/3][Math.floor(snappedY)/3]) {
            for(const [wx, wy] of hash[Math.floor(snappedX)/3][Math.floor(snappedY)/3]) {
                const button = windows[(wx/bounds) + (wy/bounds)*rows];
                SetWindowText(button, "near");
            }
        }
        //if(hash[maf]) {
        //    print(hash[maf], "hash[maf]");
        //    for(const [wx, wy] of hash[maf]) {
        //        //this.vx += wx-this.x;
        //        //this.vy += wy-this.y;
        //        const button = windows[(wx/bounds) + (wy/bounds)*rows];
        //        SetWindowText(button, "near");
        //    }
        //}

        SetWindowPos(this.visual, NULL, this.x, this.y, NULL, NULL, SWP_NOSIZE | SWP_NOZORDER);
    }
}

let miner;// = new Miner();

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        SetLayeredWindowAttributes(hwnd, RGB(1,1,1), NULL, LWA_COLORKEY);
        //window = hwnd;
        //runs++;
        //if(runs == 1) { //oops i was causing an infinite loop by createing windows
        //    //for(let i = 0; i < rows; i++) {
        //    //    for(let j = 0; j < cols; j++) {
        //    //        print(rows, cols, i*bounds, j*bounds, bounds, bounds);
        //    //        //windows.push(CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_TOOLWINDOW/* | WS_EX_TOPMOST*/, DefWindowClass(), "", WS_POPUP | WS_VISIBLE, i*bounds, j*bounds, bounds, bounds, NULL, NULL, hInstance));
        //    //    }
        //    //}
        //    print(runs);
        //}
        //windows.push(hwnd);
        miner = new Miner(hwnd);

        for(let i = 0; i < rows; i++) {
            const clampx = Math.floor((i*bounds)/3);
            if(!hash[clampx]) {
                hash[clampx] = [];
            }
            for(let j = 5; j < cols; j++) {
                const clampy = Math.floor(j*bounds)/3;
                const maf = clampx + clampy*Math.floor(rows/3);
                if(!hash[clampx][clampy]) {
                    hash[clampx][clampy] = [];
                }
                hash[clampx][clampy].push([i*bounds, j*bounds]);
                //if(!hash[maf]) {
                //    hash[maf] = [];
                //}
                //hash[maf].push([i*bounds, j*bounds]);
                //print(maf);
                windows[i + j*rows] = CreateWindow(NULL, "BUTTON", "", WS_VISIBLE | WS_CHILD, i*bounds, j*bounds, bounds, bounds, hwnd, NULL, hInstance);
                //print(rows, cols, i*bounds, j*bounds, bounds, bounds);
                //windows.push(CreateWindow(NULL, "BUTTON", "", WS_VISIBLE | WS_CHILD, i*bounds, j*bounds, bounds, bounds, hwnd, NULL, hInstance));
                //windows.push(CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_TOOLWINDOW/* | WS_EX_TOPMOST*/, DefWindowClass(), "", WS_POPUP | WS_VISIBLE, i*bounds, j*bounds, bounds, bounds, NULL, NULL, hInstance));
            }
        }
        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_KEYDOWN) {
        //if(wp == VK_ESCAPE) {
        //    for(const window of windows) {
        //        DestroyWindow(window);
        //    }
        //}else if(wp == 'T'.charCodeAt(0)) {
        //    print(windows, runs, "shite");
        //    let i = 500; let j = 500;
        //    CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_TOOLWINDOW/* | WS_EX_TOPMOST*/, DefWindowClass(), "", WS_POPUP | WS_VISIBLE, i*bounds, j*bounds, bounds, bounds, NULL, NULL, hInstance);
        //    print(windows, runs, "shite 2");
        //}
        if(wp == VK_ESCAPE) {
            DestroyWindow(hwnd);
        }
    }else if(msg == WM_TIMER) {
        miner.Update();
    }
    else if(msg == WM_DESTROY) {
        print("wm");
        PostQuitMessage(0);
    }

    //print(hwnd, msg);
}

//const DefWindowClass = function() {//function DefWindowClassClosure() {
//    let i = 0;
//    function DefWindowClass() {
//        const wc = CreateWindowClass("winclass"+i, windowProc);//, loop);
//        wc.hbrBackground = COLOR_BACKGROUND;
//        wc.hCursor = LoadCursor(NULL, IDC_ARROW);
//        i++;
//        return wc;    
//    }
//    return DefWindowClass; //(); //oops i left the parenthesis >:|
//}();

//function loop() {//...args) { //oh loop doesn't have any params
//    //print(args);
//    if(window) {
//        const screen = GetDC(NULL);
//        const self = GetWindowDC(window); //lol i just wanted to know what GetWindowDC would blt to the screen (it's the entire window including nonclient but it's kinda messed up) nah but imagine a screen shader where i make a window offscreen or someshit (or draw the theme stuff) and put it on the screen with whatever transformation i want
//        const mouse = GetCursorPos();
//        BitBlt(screen, mouse.x, mouse.y, bounds, bounds, self, 0, 0, SRCCOPY);
//        ReleaseDC(window, self);
//        ReleaseDC(NULL, screen);
//    }
//}

const wc = CreateWindowClass("winclass", windowProc);//, loop);
wc.hbrBackground = CreateSolidBrush(RGB(1,1,1));
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

                                                                                    //using WS_DLGFRAME makes the border even THICKER
window = CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_LAYERED /* | WS_EX_TOOLWINDOW | WS_EX_TOPMOST*/, /*DefWindowClass()*/wc, "miner", WS_POPUP | WS_VISIBLE, 0, 0, screenWidth, screenHeight, NULL, NULL, hInstance);
print("loop over???")