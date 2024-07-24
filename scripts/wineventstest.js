//aw shoot i thought SetWinEventHook would automagically block the thread (so im using CreateWindow to block the thread)
//print("open any new window and it will appear in the log")

let g_hook;

function winEventProc(hook, event, hwnd, isObject, isChild, dwEventThread, dwmsEventTime) {
    let title = GetWindowText(hwnd);
    if(title) {
        print(hook, event, hwnd+": "+title, isObject, isChild, dwEventThread, dwmsEventTime);
    }
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        g_hook = SetWinEventHook(EVENT_OBJECT_NAMECHANGE, EVENT_OBJECT_NAMECHANGE, NULL, winEventProc, 0, 0, WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS); //i think these flags are right
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        UnhookWinEvent(g_hook)
    }
}

const wc = CreateWindowClass("wineventstestbuddy", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);
window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "wineventstest.js - open any new window!", WS_OVERLAPPEDWINDOW | WS_VISIBLE, screenWidth/2 - (512/2), screenHeight/2 - (512/2), 512, 512, NULL, NULL, hInstance);

//const hook = SetWinEventHook(EVENT_OBJECT_CREATE, EVENT_OBJECT_CREATE, NULL, winEventProc, 0, 0, WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS); //i think these flags are right
//
//print(hook)
//
//print(UnhookWinEvent(hook));