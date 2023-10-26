//broke fella's set timeout because i haven't implemented it yet
//setTimeout (in JBS3.cpp) is gonna use SetTimer like this one but BETTER + SetTimer is getting an upgrade (yeah ok idk if i can do that anymore)
//also created this one at school

let window;

let timers = [];
let id = 0;

function setTimeout(func, time) {
    //print(window, "WINDOW");
    //let t = SetTimer(window, ids, time);
    SetTimer(window,id,time);
    //print(t, "TEE");
    timers[id] = func; //ok now i know that sounds BAD
    print(timers);
    id++;
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        window = hwnd;
        let start = Date.now()/1000;
        setTimeout(() => {
            print("FASTER");
        }, 500);
        setTimeout(() => {
            print("AASYNC", `time: ${Date.now()/1000-start}`);
        },1000);
        
        //print(SetTimer(hwnd, 21, 16), "SETTIMER");
    }else if(msg == WM_TIMER) {
        //print(wp, "WP!", timers[wp], lp);
        timers[wp]();
        KillTimer(hwnd, wp);
        //timers.splice(wp, 1); //nah wait splice might shift the list
        delete timers[wp];
        print(timers);
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("js", windowProc);
wc.hIcon = wc.hIconSm = wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "making set timeout without making set timeout", WS_OVERLAPPEDWINDOW | WS_VISIBLE, screenWidth/2-500, screenHeight/2-500, 500, 500, NULL, NULL, hInstance);