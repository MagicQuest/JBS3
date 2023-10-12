//creative way of loading PNGs into an HBITMAP using d2d

const width = 600;
const height = 600;

let button;

let pngBitmap;

let mouse = {x: 0, y: 0};

function init(hwnd) {
    InvalidateRect(hwnd, 0, 0, width, height, true);
    UpdateWindow(hwnd); //draw immediately
    button = CreateWindow("BUTTON", "OK NIGGA", WS_CHILD | WS_VISIBLE, (width-146)/2, height/2+36, 146, 36, hwnd);
    SendMessage(button, WM_SETFONT, CreateFontSimple("impact", 20, 40), true); //lol

    const d2d = createCanvas("d2d", ID2D1DCRenderTarget, hwnd);
    const png = d2d.CreateBitmapFromFilename(__dirname+"/msnexample.png");
    d2d.BeginDraw();
    d2d.DrawBitmap(png, 0, 0, 507, 516);
    d2d.EndDraw();
    png.Release();
    d2d.Release(); //immediately releases d2d after drawing

    const dc = GetDC(hwnd);
    const memDC = CreateCompatibleDC(dc);
    pngBitmap = CreateCompatibleBitmap(dc, 507, 516); //oops forgot that
    SelectObject(memDC, pngBitmap);
    BitBlt(memDC, 0, 0, 507, 516, dc, 0, 0, SRCCOPY);
    DeleteDC(memDC);
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_MOUSEMOVE) {
        mouse = MAKEPOINTS(lp);
        InvalidateRect(hwnd, 0, 0, width, height, true);
        UpdateWindow(hwnd);
    }else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);
        
        const memDC = CreateCompatibleDC(ps.hdc);
        SelectObject(memDC, pngBitmap);
        BitBlt(ps.hdc, mouse.x, mouse.y, 507, 516, memDC, 0, 0, SRCCOPY); //pure gdi
        DeleteDC(memDC);

        EndPaint(hwnd, ps);
    }else if(msg == WM_KEYDOWN) {
        if(wp == VK_ESCAPE) {
            DestroyWindow(hwnd);
        }else if(wp == "L".charCodeAt(0)) {
            //openfiledialog
            Msgbox("implement open file dialog", "openfiledialog", MB_OK | MB_SYSTEMMODAL | MB_ICONERROR); //uhh non blocking in windowProc?
        }
    }else if(msg == WM_DESTROY) {
        PostQuitMessage();
    }
}

const winclass = CreateWindowClass("WinClass", init, windowProc); //loop is not required y'all
winclass.hIcon = winclass.hIconSm = LoadIcon(NULL, IDI_APPLICATION);
winclass.hbrBackground = COLOR_BACKGROUND;
winclass.hCursor = LoadCursor(NULL, IDC_ARROW);
                                                                                                //math
CreateWindow(winclass, "using direct2d to read a png", WS_CAPTION | WS_SYSMENU | WS_VISIBLE, screenWidth/2-width/2, screenHeight/2-height/2, width, height);