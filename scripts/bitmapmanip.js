let window;
let dc;
let screen;

let mouse = {x: 0,y: 0};

const bounds = 800;

let bitmap;// = LoadImage(NULL, `${__dirname}/minesweeper/ifoundamongus.bmp`, IMAGE_BITMAP, 0, 0, LR_SHARED | LR_LOADFROMFILE);
let b = false;

let font;

let scale = 2;
let runs = Math.max();

function init(hwnd) {
    print("init")
    dc = GetDC(hwnd);
    screen = GetDC(NULL);
    window = hwnd;
    font = CreateFontSimple("Impact", 20, 40);
    bitmap = CreateCompatibleBitmap(screen, 1920/scale,1080/scale);//200, 200);
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        init(hwnd);
    }else if(msg == WM_MOUSEMOVE) {
        mouse = MAKEPOINTS(lp);
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

let i = 1;
let j = 0;

let start = Date.now();

let modes = [NULL, HALFTONE, COLORONCOLOR];

function loop() {
    if(GetKey(VK_ESCAPE)) {
        DestroyWindow(window);
    }else if((Date.now()-start) % 16 == 0){
        //FillRect(dc, 0, 0, bounds, bounds, NULL);

        let lastFont = SelectObject(dc, font);
        TextOut(dc, mouse.x, mouse.y, "NUMBER->"+i);
        SelectObject(dc, lastFont);

        if(j % runs == 0) {
            InvalidateRect(NULL, 0, 0, 1920, 1080, true);
            j = 0;
        }

        scale = i/100;

        const memDC = CreateCompatibleDC(screen);
        SelectObject(memDC, bitmap);
        //SetStretchBltMode(memDC, modes[Math.floor(Math.random()*modes.length)]);
        SetStretchBltMode(memDC, HALFTONE);
        StretchBlt(memDC, 0, 0, 1920/scale, 1080/scale, screen, 0, 0, 1920, 1080, SRCCOPY);
        StretchBlt(screen, 0, 0, 1920, 1080, memDC, 0, 0, 1920/scale, 1080/scale, SRCCOPY);
        DeleteDC(memDC);
        //print("IGOTTATESTIFY");
        //print(ICON_BIG, ICON_SMALL);
        //print(ICON_SMALL, "ICONSMALL");
        SendMessage(window, WM_SETICON, ICON_SMALL, HICONFromHBITMAP(bitmap)); //haha dynamic icon??? -> dynamicicon.js
        

        //if(GetKeyDown("C")) {
        //    b = true;
        //    const memDC = CreateCompatibleDC(screen);
        //    SelectObject(memDC, bitmap);
        //    const rect = GetWindowRect(window);
        //    SetStretchBltMode(memDC, HALFTONE);
        //    StretchBlt(memDC, 0, 0, 200, 200, screen, rect.left, rect.top, bounds, bounds, SRCCOPY); //https://stackoverflow.com/questions/3144340/how-to-draw-on-given-bitmap-handle-c-win32
        //    DeleteDC(memDC); //screenshot basically!
        //}
        //if(b) {
        //    const memDC = CreateCompatibleDC(screen);
        //    SelectObject(memDC, bitmap);
        //    StretchBlt(screen, 0, 0, bounds, bounds, memDC, 0, 0, 200, 200, SRCCOPY);
        //    DeleteDC(memDC);
        //}
    
        //const memDC = CreateCompatibleDC(dc);
        //SelectObject(memDC, bitmap);
        //BitBlt(memDC, 0, 0, 200, 200, dc, mouse.x, mouse.y, SRCCOPY);
        ////SetClassLongPtr(window, GCLP_HICONSM, HICONFromHBITMAP(bitmap));
        //DrawIcon(dc, mouse.x, mouse.y, HICONFromHBITMAP(bitmap));
        ////BitBlt(dc, 0, 0, 200, 200, memDC, 0, 0, SRCCOPY);
        //DeleteDC(memDC);
        j++;
        i++;
    }
}

const WINCLASSEX = CreateWindowClass("WinClass"/*, init*/, windowProc, loop);
const icon = LoadIcon(NULL, IDI_ERROR);
WINCLASSEX.hCursor = LoadCursor(NULL, IDC_HAND);
WINCLASSEX.hIcon = icon;
WINCLASSEX.hIconSm = icon;

//print(WINCLASSEX);

CreateWindow(WS_EX_OVERLAPPEDWINDOW, WINCLASSEX, "random bitmap gdi testins", WS_OVERLAPPEDWINDOW | WS_VISIBLE, 200, 200, bounds+16, bounds+39, NULL, NULL, hInstance);