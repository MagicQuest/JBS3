const fs = require("fs");

let dc, compat;

const w = 512;
const h = 200;


function incTextOut() {
    let i = 0;
    return function(memDC, str) {
        TextOut(memDC, 0, i*16, str); i++;
    }
}


//const TextOutI = incTextOut();

function readanddrawmyshit(hwnd) {
    const TextOut = incTextOut();
    const memDC = CreateCompatibleDC(dc);
    SelectObject(memDC, compat);
    //SelectObject(memDC, GetDefaultFont());
    FillRect(memDC, 0, 0, w, h, COLOR_BACKGROUND);
    const contents = fs.read(__dirname+"/challenges.txt").split("\n");
    for(const line of contents) {
        print(line);
        TextOut(memDC, line);
    }
    DeleteDC(memDC);

    print("redraw m bokrdvvrrs");

    RedrawWindow(hwnd, 0, 0, w, h, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
}

function waitforfuturechangesnigga(hwnd) {
    const handle = FindFirstChangeNotification(__dirname+"/", 0, FILE_NOTIFY_CHANGE_LAST_WRITE);
    while(true) {
        const res = WaitForSingleObject(handle, 0xFFFFFFFF, true);
        print(handle, res);
        readanddrawmyshit(hwnd);
        FindNextChangeNotification(handle);
    }
    print("frengind");
    FindCloseChangeNotification(handle);
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        //print(COLOR_BACKGROUND, GetSysColor(COLOR_BACKGROUND), RGB(200, 200, 200))
        SetLayeredWindowAttributes(hwnd, RGB(200, 200, 200), 200, LWA_COLORKEY | LWA_ALPHA);
        dc = GetDC(hwnd);
        compat = CreateCompatibleBitmap(dc, w, h);
        //const memDC = CreateCompatibleDC(dc);
        //SelectObject(memDC, compat);
        ////SelectObject(memDC, GetDefaultFont());
        //FillRect(memDC, 0, 0, w, h, COLOR_BACKGROUND);
        //DeleteDC(memDC);
        readanddrawmyshit(hwnd);
        //FindFirstChangeNotification("")
        //TextOut(memDC, "Investigate the redline rig nigga for evidence");
        //TextOut(memDC, "land at doomstatd");
        //TextOut(memDC, "damage opponents while airborne");
        //TextOut(memDC, "get a monmarch pistol");
        //TextOut(memDC, "sprint distance after taking damage");
        //TextOut(memDC, "gain health by hurting yourself");
        ////TextOut(memDC, "kill with a headshost");
        //TextOut(memDC, "drive to 3 different locations");
        //TextOut(memDC, "hit up freaky fields and the underworld");
        //TextOut(memDC, "accept a shadow breifing armorotug NIGGAS");
        //DeleteDC(memDC);
        SetTimer(hwnd, 1, 0);
    }else if(msg == WM_TIMER) {
        KillTimer(hwnd, 1);
        waitforfuturechangesnigga(hwnd);
    }
    else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);
        const memDC = CreateCompatibleDC(ps.hdc);
        SelectObject(memDC, compat);
        BitBlt(ps.hdc, 0, 0, w, h, memDC, 0, 0, SRCCOPY);
        DeleteDC(memDC);
        EndPaint(hwnd, ps);
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("iwannainspiresomsigmastonight", windowProc);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

CreateWindow(WS_EX_LAYERED | WS_EX_TOOLWINDOW | WS_EX_TRANSPARENT | WS_EX_TOPMOST, wc, "sigma", WS_VISIBLE | WS_POPUP, 200, 750, w, h, NULL, NULL, hInstance);