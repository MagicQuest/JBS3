//this only took like 4 minutes

let w = 1000;
let h = 500;

function windowProc(hwnd, msg, wp, lp) {
    OutputDebugString("MESSAGW!~\r\n");
    if(msg == WM_CREATE) {
        OutputDebugString("whatthesigma hello from WM_CREATE\r\n");

        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        const dc = GetDC(hwnd);
        const screenDC = GetDC(NULL);

        SetStretchBltMode(dc, HALFTONE);
        StretchBlt(dc, 0, 0, w, h, screenDC, 0, 0, screenWidth, screenHeight, SRCCOPY);

        ReleaseDC(hwnd, dc);
        ReleaseDC(NULL, screenDC);
    }
    else if(msg == WM_DESTROY) {
        OutputDebugString("whatthesigma destoying the window from WM_DESTROY\r\n");
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("mywndclassname", windowProc);

wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadIcon(NULL, IDC_ARROW); //lol forgot that detaile

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "mango", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);