let d2d, bitmap;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd);
        const wic = InitializeWIC();
        ScopeGUIDs(this);
        print(wic);
        print(GUID_WICPixelFormat32bppPBGRA);
        const wicBitmap = wic.LoadBitmapFromFilename(__dirname+"/box.bmp", GUID_WICPixelFormat32bppPBGRA, 0); //third is optional if 0
        bitmap = d2d.CreateBitmapFromWicBitmap(wicBitmap, true);
        wic.Release(); //after calling release any subsequent use of wic will result in error
        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        d2d.BeginDraw();
        d2d.Clear(); //don't clear because gifs are weird?
        d2d.DrawBitmap(bitmap, 0, 0, 512, 512, 1.0);
        d2d.EndDraw();
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        d2d.Release();
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_HAND);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "WicToHBITMAP.js", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 512+16, 512+39, NULL, NULL, hInstance);