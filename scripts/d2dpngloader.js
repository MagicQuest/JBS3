//creative way of loading PNGs into an HBITMAP using d2d (now that WIC is no longer connected to d2d this is only for historical purposes (idk what im talking bout))

const width = 900;
const height = 900;

let button;

let pngBitmap;
let patbltBitmap;

let mouse = {x: 0, y: 0};

let loadedPng = true;

const wic = InitializeWIC();

function init(hwnd) {
    InvalidateRect(hwnd, 0, 0, width, height, true);
    UpdateWindow(hwnd); //draw immediately
    button = CreateWindow(NULL,"BUTTON", "OK NIGGA", WS_CHILD | WS_VISIBLE, (width-146)/2, height/2+36, 146, 36, hwnd, NULL, hInstance);
    SendMessage(button, WM_SETFONT, CreateFontSimple("impact", 20, 40), true); //lol

    loadedPng = false;
    //too early?
}

function loadPng(hwnd, dc, filename) {
    const d2d = createCanvas("d2d", ID2D1DCRenderTarget, hwnd, wic); //this also works with ID2D1RenderTarget instead
    d2d.BindDC(hwnd, dc); //oh shoot i was wondering why this (ID2D1DCRenderTarget) wouldn't work but the dc that's passed in this function is not one from GetDC(hwnd) (createCanvas internally calls BindDC on window's dc)
    print(filename);
    const png = d2d.CreateBitmapFromFilename(filename);
    const size = png.GetPixelSize();
    print(size, "NISGG");
    d2d.BeginDraw();
    d2d.DrawBitmap(png, 0, 0, size.width, size.height);
    d2d.EndDraw();
    png.Release();
    d2d.Release(); //immediately releases d2d after drawing

    //const dc = GetDC(hwnd);
    const memDC = CreateCompatibleDC(dc);
    const bmp = CreateCompatibleBitmap(dc, size.width, size.height); //oops forgot that
    SelectObject(memDC, bmp);
    BitBlt(memDC, 0, 0, size.width, size.height, dc, 0, 0, SRCCOPY);
    DeleteDC(memDC);
    return bmp;
    //loadedPng = true;
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        init(hwnd);
    }else if(msg == WM_MOUSEMOVE) {
        mouse = MAKEPOINTS(lp);
        print("MPOVE");
        InvalidateRect(hwnd, 0, 0, width, height, true);
        UpdateWindow(hwnd);
    }else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);
        
        if(!loadedPng) {
            pngBitmap = loadPng(hwnd, ps.hdc, __dirname+"/msnexample.png");
            patbltBitmap = loadPng(hwnd, ps.hdc, __dirname+"/patblt.png");
            loadedPng = true;
        }

        let memDC = CreateCompatibleDC(ps.hdc);
        SelectObject(memDC, pngBitmap);
        BitBlt(ps.hdc, mouse.x+306, mouse.y, 507, 516, memDC, 0, 0, SRCCOPY); //pure gdi
        DeleteDC(memDC);

        memDC = CreateCompatibleDC(ps.hdc);
        SelectObject(memDC, patbltBitmap);
        //                (patblt.png is 306, 936)
        BitBlt(ps.hdc, mouse.x, mouse.y, 306, 936, memDC, 0, 0, SRCCOPY); //pure gdi
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
        PostQuitMessage(0);
    }
}

const winclass = CreateWindowClass("WinClass"/*, init*/, windowProc); //loop is not required y'all
winclass.hIcon = winclass.hIconSm = LoadIcon(NULL, IDI_APPLICATION);
winclass.hbrBackground = COLOR_BACKGROUND;
winclass.hCursor = LoadCursor(NULL, IDC_ARROW);
                                                                                                //math
CreateWindow(WS_EX_OVERLAPPEDWINDOW, winclass, "using direct2d to read a png", WS_CAPTION | WS_SYSMENU | WS_VISIBLE, screenWidth/2-width/2, screenHeight/2-height/2, width, height, NULL, NULL, hInstance);