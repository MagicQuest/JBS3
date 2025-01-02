let w = 800;
let h = 600;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        
    }else if(msg == WM_KEYDOWN) {
        if(wp == "C".charCodeAt(0) && GetKey(VK_CONTROL)) {
            //copy dc
            let success = OpenClipboard(hwnd);
            if(success) {
                print("copying text...");
                EmptyClipboard();
                
                SetClipboardData(CF_TEXT, NULL); //delayed rendering (now this window must handle the WM_RENDERFORMAT and WM_RENDERALLFORMATS messages when this data is needed)
                SetClipboardData(CF_UNICODETEXT, NULL); //delayed rendering (now this window must handle the WM_RENDERFORMAT and WM_RENDERALLFORMATS messages when this data is needed)

                CloseClipboard();
            }else {
                print(`OpenClipboard failded for some reason (maybe because a window (${c=GetClipboardOwner()} - ${GetWindowText(c) }) already had it open)`, g=GetLastError(), _com_error(g));
            }
        }
    }else if(msg == WM_RENDERFORMAT) {
        //wp is the format
        print("WM_RENDERFORMAT called!");
        if(wp == CF_TEXT) {
            SetClipboardData(wp, "WM_RENDERFORMAT DELAYED RENDERING! (CF_TEXT)");
        }else if(wp == CF_UNICODETEXT) {
            SetClipboardData(wp, "WM_RENDERFORMAT DELAYED RENDERING! (CF_UNICODETEXT)");
        }
    }else if(msg == WM_RENDERALLFORMATS) {
        print("WM_RENDERALLFORMATS called!");
        if (OpenClipboard(hwnd)) {
            if (GetClipboardOwner() == hwnd) {
                SetClipboardData(CF_TEXT, "WM_RENDERFORMAT DELAYED RENDERING!");
                SetClipboardData(CF_UNICODETEXT, "WM_RENDERFORMAT DELAYED RENDERING! (CF_UNICODETEXT)");
            }
            CloseClipboard();
        }
    }else if(msg == WM_DESTROYCLIPBOARD) { //i think this gets called when you copy something else after your delayed rendered one
        print("WM_DESTROYCLIPBOARD called!");
    }
    else if(msg == WM_DESTROY) {
        RemoveClipboardFormatListener(hwnd);
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("clipboardviewer.js", windowProc);

wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "control + c to copy data", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);