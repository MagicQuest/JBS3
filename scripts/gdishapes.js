let dc;
let bmp;

let w = 512;
let h = 512;

//finna add polypolygon tomorrow

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        dc = GetDC(hwnd);
        bmp = CreateCompatibleBitmap(dc, w, h);
        //print(GetClientRect(hwnd));
    }else if(msg == WM_PAINT) {
        const paint = BeginPaint(hwnd);
        //print(paint);
        
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, bmp);
        SelectObject(memDC, GetStockObject(DC_BRUSH));
        SelectObject(memDC, GetStockObject(DC_PEN));

        SetDCBrushColor(memDC, RGB(255, 0, 255));
        Chord(memDC, 50, 50, 200, 200, 50, 50, 80, 25); //idk what the hell this does dawg
        SetBkColor(memDC, GetDCBrushColor(memDC));
        TextOut(memDC, 50, 50-16, "Chord");
        
        SetDCBrushColor(memDC, RGB(255, 255, 0));
        Ellipse(memDC, 200, 200, 250, 250);
        SetBkColor(memDC, GetDCBrushColor(memDC));
        TextOut(memDC, 200, 200-16, "Ellipse");

        SetDCBrushColor(memDC, RGB(0, 255, 255));
        FillRect(memDC, 0, 400, 512, 512, NULL); //i think FillRect (when passing NULL as the brush) is the same as Rectangle in JBS3
        SetBkColor(memDC, GetDCBrushColor(memDC));
        TextOut(memDC, 0, 400-16, "FillRect");

        SetDCPenColor(memDC, RGB(0, 255, 0));
        SetDCBrushColor(memDC, RGB(255, 0, 0));
        Rectangle(memDC, 300, 100, 400, 200);
        SetBkColor(memDC, GetDCBrushColor(memDC));
        TextOut(memDC, 300, 100-16, "Rectangle");

        SetDCBrushColor(memDC, RGB(255, 0, 0));
        InvertRect(memDC, 100, 100, 150, 150);
        SetBkColor(memDC, GetDCBrushColor(memDC));
        TextOut(memDC, 100, 100-16, "InvertRect");

        SetDCBrushColor(memDC, RGB(255, 127, 127));
        RoundRect(memDC, 200, 300, 100, 200, 10, 10);
        SetBkColor(memDC, GetDCBrushColor(memDC));
        TextOut(memDC, 200, 300-16, "RoundRect");

        SetDCBrushColor(memDC, RGB(127, 255, 127));
        Pie(memDC, 350, 350, 400, 400, 350, 350, 375, 375);
        SetBkColor(memDC, GetDCBrushColor(memDC));
        TextOut(memDC, 350, 350-16, "Pie");

        SetDCBrushColor(memDC, RGB(127, 127, 255));
        SetDCPenColor(memDC, RGB(127, 127, 255));
        FrameRect(memDC, 128, 350, 128+64, 400, NULL);
        SetBkColor(memDC, GetDCBrushColor(memDC));
        TextOut(memDC, 128, 350-16, "FrameRect");

        BitBlt(dc, 0, 0, w, h, memDC, 0, 0, SRCCOPY);

        DeleteDC(memDC);
        EndPaint(hwnd, paint);
    }
    else if(msg == WM_DESTROY) {
        ReleaseDC(hwnd, dc);
        PostQuitMessage(0);
    }
}

const winclass = CreateWindowClass("WinClass"/*, init*/, windowProc); //loop is not required y'all (but her timing is getting better)
winclass.hIcon = winclass.hIconSm = LoadIcon(NULL, IDI_APPLICATION);
winclass.hbrBackground = COLOR_BACKGROUND;
winclass.hCursor = LoadCursor(NULL, IDC_HAND);

CreateWindow(WS_EX_OVERLAPPEDWINDOW, winclass, "gdi shapes", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);