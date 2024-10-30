const bounds = 500;//240;
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

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        //window = hwnd;
        runs++;
        if(runs == 1) { //oops i was causing an infinite loop by createing windows
            //for(let i = 0; i < rows; i++) {
            //    for(let j = 0; j < cols; j++) {
            //        print(rows, cols, i*bounds, j*bounds, bounds, bounds);
            //        //windows.push(CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_TOOLWINDOW/* | WS_EX_TOPMOST*/, DefWindowClass(), "", WS_POPUP | WS_VISIBLE, i*bounds, j*bounds, bounds, bounds, NULL, NULL, hInstance));
            //    }
            //}
            print(runs);
        }
        windows.push(hwnd);
    }else if(msg == WM_KEYDOWN) {
        if(wp == VK_ESCAPE) {
            for(const window of windows) {
                DestroyWindow(window);
            }
        }else if(wp == 'T'.charCodeAt(0)) {
            print(windows, runs, "shite");
            let i = 500; let j = 500;
            CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_TOOLWINDOW/* | WS_EX_TOPMOST*/, DefWindowClass(), "", WS_POPUP | WS_VISIBLE, i*bounds, j*bounds, bounds, bounds, NULL, NULL, hInstance);
            print(windows, runs, "shite 2");
        }
    }else if(msg == WM_DESTROY) {
        print("wm");
        PostQuitMessage(0);
    }

    //print(hwnd, msg);
}

const DefWindowClass = function() {//function DefWindowClassClosure() {
    let i = 0;
    function DefWindowClass() {
        const wc = CreateWindowClass("winclass"+i, windowProc);//, loop);
        wc.hbrBackground = COLOR_BACKGROUND;
        wc.hCursor = LoadCursor(NULL, IDC_ARROW);
        i++;
        return wc;    
    }
    return DefWindowClass; //(); //oops i left the parenthesis >:|
}();

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

                                                                                    //using WS_DLGFRAME makes the border even THICKER
window = CreateWindow(WS_EX_OVERLAPPEDWINDOW | /*WS_EX_TOOLWINDOW |*/ WS_EX_TOPMOST, DefWindowClass(), "miner", WS_POPUP | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, bounds, bounds, NULL, NULL, hInstance);
print("loop over???")