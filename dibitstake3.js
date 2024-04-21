const screen = GetDC(NULL);
const scale = 5;

let windowcx = 640;
let windowcy = 360;

let bitmap;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        const dc = GetDC(hwnd);
        bitmap = CreateDIBSection(dc, CreateDIBitmapSimple(windowcx/scale, -windowcy/scale, 32), DIB_RGB_COLORS);
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, bitmap.bitmap);
        TextOut(memDC, 0, 0, "whats going on guys dan here from the diamond minecart and today me and dr trayouraus are gonna be playing with the NUKE mod for minecraft lets just indo it");
        DeleteDC(memDC);
        ReleaseDC(hwnd, dc);

        SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE); //it's gonna work steve....

        RedrawWindow(hwnd, 0, 0, windowcx, windowcy, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
    }else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);

        const bits = bitmap.GetBits();
        StretchDIBits(ps.hdc, 0, 0, windowcx, windowcy, 0, 0, windowcx/scale, windowcy/scale, bits, windowcx/scale, windowcy/scale, 32, BI_RGB, SRCCOPY);

        EndPaint(hwnd, ps);
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_HAND);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "dibitstake3.js", WS_OVERLAPPEDWINDOW | WS_VISIBLE, (screenWidth-windowcx)/2, (screenHeight-windowcy)/2, windowcx+16, windowcy+39, NULL, NULL, hInstance);