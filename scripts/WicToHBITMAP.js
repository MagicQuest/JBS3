//let d2d, bitmap;
let bits;
let size;
let bitmap;
//let skibidi = {};
let i = 0;
//let backBufferBmp;

function Matrix3x2ToXFORM(matrix) {
    //print(matrix);
    return {
        "eM11": matrix._11,
        "eM12": matrix._12,
        "eM21": matrix._21,
        "eM22": matrix._22,
        "eDx": matrix.dx,
        "eDy": matrix.dy,
    };
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        const wic = InitializeWIC();
        ScopeGUIDs(wic);
        //print(GUID_WICPixelFormat32bppPBGRA);
        const wicBitmap = wic.LoadBitmapFromFilename(__dirname+"/box.bmp", wic.GUID_WICPixelFormat32bppPBGRA, 0); //third is optional if 0
        print(wicBitmap.GetResolution(), "dpi resolution");
        size = wicBitmap.GetSize();
        print(size, "bmp dimensions");
        bits = wicBitmap.GetPixels(wic);
        bitmap = CreateBitmap(size.width, size.height, 32, bits); //RETURNS HBITMAP (WE'RE RIGHT THERE)
        //print(wicBitmap.GetPixels(wic));
        wicBitmap.Release();

        //const temp = wic.LoadDecoder("E:/Downloads/19e7b240-s.jpg", wic.GUID_WICPixelFormat32bppPBGRA, 0);//wic.LoadBitmapFromFilename(__dirname+"/minesweeper/ifoundamongus.bmp", wic.GUID_WICPixelFormat32bppPBGRA, 0);
        //const thumb = temp.GetThumbnail();
        //skibidi = thumb.GetSize();
        //skibidi.bits = thumb.GetPixels(wic);
        //temp.Release();
        //thumb.Release();
        wic.Release(); //after calling release any subsequent use of wic will result in error

        const dc = GetDC(hwnd);
        //backBufferBmp = CreateCompatibleBitmap(dc, 512, 512);
        //bruhs = CreateSolidBrush(RGB(0,0,0));
        ReleaseDC(hwnd, dc);
        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        const dc = GetDC(hwnd);

        //const noflicker = CreateCompatibleDC(dc);
        //SelectObject(noflicker, backBufferBmp);
        ////let last = SelectObject(noflicker, DC_BRUSH);
        ////SetDCBrushColor(noflicker, RGB(0,0,0)); //why the gyatt isn't this black
        //FillRect(dc, 0, 0, 512, 512, bruhs);
        //SelectObject(noflicker, last);
        //StretchDIBits(dc, 0, 0, 512, 512, 0, 0, skibidi.width, skibidi.height, skibidi.bits, skibidi.width, skibidi.height, 32, BI_RGB, SRCCOPY); //long ahh function
        
        let mouse = GetCursorPos();
        let window = GetWindowRect(hwnd);
        //print(GetClientRect(hwnd)); //wait a sec +16 and +39 were wrong?>
        mouse.x -= window.left+10;
        mouse.y -= window.top+32;

        SetGraphicsMode(dc, GM_ADVANCED);
        SetWorldTransform(dc, Matrix3x2ToXFORM(Matrix3x2.SetProduct(Matrix3x2.Translation(mouse.x, mouse.y), Matrix3x2.Rotation(i, mouse.x, mouse.y)))); //hell yeah
        
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, bitmap);
        StretchBlt(dc, -128, -128, 256, 256, memDC, 0, 0, size.width, size.height, SRCCOPY); //AND SCORE THIS IS CRAZY
        DeleteDC(memDC);

        //BitBlt(dc, 0, 0, 512, 512, noflicker, 0, 0, SRCCOPY);
        //DeleteDC(noflicker);
        ReleaseDC(hwnd, dc);
        i++;
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_HAND);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "this is pure gdi baby (move your mouse over the window)", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 512+20, 512+43, NULL, NULL, hInstance);