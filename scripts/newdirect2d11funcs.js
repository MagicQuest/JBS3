let d2d, brush;
let i = 0;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1DeviceContextDComposition, hwnd);
        brush = d2d.CreateSolidColorBrush(1.0, 1.0, 0.0);
        
        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        d2d.BeginDraw();
        d2d.Clear(0.0, 0.0, 0.0, 0.0);
        //brush.SetColor(1.0, 1.0, 1.0, 0.1);
        let {width, height} = d2d.GetSize();
        //print(width, height);
        //d2d.FillRectangle(0,0, width, height, brush);
        //brush.SetColor(1.0, 1.0, 0.0);
        d2d.FillRectangle(0, 0, Math.abs(Math.sin(i/100))*width, Math.abs(Math.cos(i/100))*height, brush);
        d2d.EndDraw();

        i++;
    }else if(msg == WM_SIZE) {
        d2d.Resize(LOWORD(lp), HIWORD(lp));
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        d2d.Release();
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_HAND);
    //for DirectComposition you NEED to specify WS_EX_NOREDIRECTIONBITMAP
window = CreateWindow(WS_EX_NOREDIRECTIONBITMAP, wc, "newdirect2d11funcs.js", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 512+20, 512+42, NULL, NULL, hInstance);