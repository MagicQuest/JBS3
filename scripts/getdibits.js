let troll = LoadImage(NULL, __dirname+(Math.random() > .5 ? "/troll.bmp" : "/imagine.bmp"), IMAGE_BITMAP, 0, 0, LR_LOADFROMFILE | LR_CREATEDIBSECTION);
let tobject = GetObjectHBITMAP(troll)

let hbm;

let cx = 640;
let cy = 360;

let trollDIBits;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        const dc = GetDC(hwnd);
        //hbm = CreateDIBSection(dc, CreateDIBitmapSimple(220, -183, 32), DIB_RGB_COLORS);
        const trollDC = CreateCompatibleDC(dc);
        SelectObject(trollDC, troll);

        const memDC = CreateCompatibleDC(dc);

        const ddb = CreateCompatibleBitmap(dc, tobject.bmWidth, tobject.bmHeight);
        SelectObject(memDC, ddb);
        BitBlt(memDC, 0, 0, tobject.bmWidth, tobject.bmHeight, trollDC, 0, 0, SRCCOPY);
    
        //print(GetDIBits(dc, ddb, 0, 183, 220, 183, 32, BI_RGB));
        
        trollDIBits = GetDIBits(dc, ddb, 0, tobject.bmHeight, tobject.bmWidth, tobject.bmHeight, 32, BI_RGB);

        DeleteObject(ddb);
        DeleteDC(trollDC);
        DeleteDC(memDC);
        ReleaseDC(hwnd, dc);
    }else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);

        StretchDIBits(ps.hdc, 0, 0, cx, cy, 0, 0, tobject.bmWidth, tobject.bmHeight, trollDIBits, tobject.bmWidth, tobject.bmHeight, 32, BI_RGB, SRCCOPY);

        EndPaint(hwnd, ps);
    }else if(msg == WM_LBUTTONDOWN) {// || msg == WM_TIMER) {

    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_HAND);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "getdibits.js", WS_OVERLAPPEDWINDOW | WS_VISIBLE, (1920-cx)/2, (1080-cy)/2, cx+16, cy+39, NULL, NULL, hInstance);