//i wonder what happens if i create a memory bitmap and draw it immediately without putting anything in it
//hopefully it doesn't automatically zero the memory like i think it does (yeah ok it seems like it does i'm mad)

let screen, dc, cbit, cmem;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        screen = GetDC(NULL);
        dc = GetDC(hwnd);
        cbit = CreateBitmap(1920, 1080, 32);
        cmem = CreateCompatibleBitmap(screen, 1920, 1080);
    }else if(msg == WM_KEYDOWN) {
        if(wp == "T".charCodeAt(0)) {
            print("T");
            const memDC = CreateCompatibleDC(screen);
            SelectObject(memDC, cbit);
            BitBlt(screen, 0, 0, 1920/2, 1080, memDC, 0, 0, SRCCOPY);
            SelectObject(memDC, cmem);
            BitBlt(screen, 1920/2, 0, 1920/2, 1080, memDC, 1920/2, 0, SRCCOPY);
            DeleteDC(memDC);
        }
    }
    else if(msg == WM_DESTROY) {
        ReleaseDC(NULL, screen);
        ReleaseDC(hwnd, dc);
        DeleteObject(cbit);
        DeleteObject(cmem);
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "membmp.js", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 512+20, 512+43, NULL, NULL, hInstance);