let dc;
let bmp;

let w = 512;
let h = 512;

//finna add polypolygon tomorrow

const polypoly = [
    [512-75, 0], [512-100, 50], [512-50, 50], //shape 1
    [512-100, 50], [512-75, 100], [512-125, 100], //shape 2
    [512-50, 50], [512-25, 100], [512-75, 100], //shape 3
]; //triforce just because idk easy shape
const polypolyints = [3, 3, 3]; //each shape has 3 points

//function toCOLOR16(uchar) {
//    return (uchar << 8) | uchar;
//}

function toCOLOR16s(r, g, b) {
    return [(r << 8) | r, (g << 8) | g, (b << 8) | b];
}

const gradientTriVertices = [ //this array goes [x, y, r, g, b, a] (alpha is ignored by GradientFill) but the rgba values are unsigned shorts so you gotta do something stupid to get them right (https://stackoverflow.com/questions/18905761/c-unicode-for-color16-values)
    //[350, 200, toCOLOR16(255), toCOLOR16(127), toCOLOR16(0), 0],
    //[400, 300, toCOLOR16(0), toCOLOR16(255), toCOLOR16(0), 0],
    //[300, 300, toCOLOR16(0), toCOLOR16(0), toCOLOR16(255), 0],
    [350, 200, ...toCOLOR16s(255, 127, 0), 0],
    [400, 300, ...toCOLOR16s(0, 255, 0), 0],
    [300, 300, ...toCOLOR16s(0, 0, 255), 0],
];
const gTriangle = [
    [0, 1, 2], //indexes of the vertices in the triangle (gradientTriVertices)
];

const gradientRectVertices = [
    [128, 425, ...toCOLOR16s(0, 255, 0), 0],
    [512-128, 475, ...toCOLOR16s(0, 0, 255), 0],
];
const gRect = [
    [0, 1], //indexes of the upper-left and bottom-right vertices (of gradientRectVertices)
];

let op = SRCCOPY;

function initDesktopBmp(memDC) {
    const desktopBmp = CreateCompatibleBitmap(dc, screenWidth, screenHeight);

    const tempDC = CreateCompatibleDC(dc);
    SelectObject(tempDC, desktopBmp);
    PaintDesktop(tempDC); //oh hell yeah
    
    SetStretchBltMode(memDC, HALFTONE);
    StretchBlt(memDC, 0, 0, w, h, tempDC, 0, 0, screenWidth, screenHeight, SRCCOPY);

    DeleteDC(tempDC);
    DeleteObject(desktopBmp);
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        dc = GetDC(hwnd);
        bmp = CreateCompatibleBitmap(dc, w, h);
        //print(GetClientRect(hwnd));
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, bmp);

        initDesktopBmp(memDC);
        //FillRect(memDC, 0, 0, w, h, COLOR_BACKGROUND);
        //PaintDesktop(memDC); //idk what this does exactly

        SelectObject(memDC, GetStockObject(DC_BRUSH));
        SelectObject(memDC, GetStockObject(DC_PEN));
        SelectObject(memDC, GetDefaultFont());

        SetDCBrushColor(memDC, RGB(255, 0, 255));
        Chord(memDC, 50, 50, 200, 200, 50, 50, 80, 25); //idk what the hell this does dawg
        SetBkColor(memDC, GetDCBrushColor(memDC));
        TextOut(memDC, 50, 50-16, "Chord");
        
        SetDCBrushColor(memDC, RGB(255, 255, 0));
        Ellipse(memDC, 200, 200, 250, 250);
        SetBkColor(memDC, GetDCBrushColor(memDC));
        TextOut(memDC, 200, 200-16, "Ellipse");

        SetDCPenColor(memDC, RGB(255, 255, 0));
        SetDCBrushColor(memDC, RGB(0, 255, 255));
        FillRect(memDC, 0, 400, 512, 512, NULL); //i think FillRect (when passing NULL as the brush) is the same as Rectangle in JBS3 (wait a minute! i don't think fillrect outlines the shape!)
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

        SetDCBrushColor(memDC, RGB(255, 243, 253)); //l,ol
        SetDCPenColor(memDC, RGB(255, 0, 0));
        PolyPolygon(memDC, polypoly, polypolyints);
        SetBkColor(memDC, GetDCBrushColor(memDC));
        TextOut(memDC, 512-125, 0, "PolyPolygon");

        GradientFill(memDC, gradientTriVertices, gTriangle, GRADIENT_FILL_TRIANGLE);
        SetBkColor(memDC, GetDCBrushColor(memDC));
        TextOut(memDC, 300, 300, "GradientFill [Triangle]");

        GradientFill(memDC, gradientRectVertices, gRect, GRADIENT_FILL_RECT_H);
        SetBkColor(memDC, GetDCBrushColor(memDC));
        TextOut(memDC, 128, 475, "GradientFill [Rectangle]");

        DeleteDC(memDC);
        ReleaseDC(hwnd, dc);
        print(RGB(255, 255, 255));
    }else if(msg == WM_PAINT) {
        const paint = BeginPaint(hwnd);
        //print(paint);
        
        const memDC = CreateCompatibleDC(paint.hdc); //lol i was using dc here instead of the paint provided one (which your supposed to do i think idk i did it in fake3donflicker.js)
        SelectObject(memDC, bmp);

        //i had all the drawing here but just realized that i only have to draw this stuff once into the bitmap and then just draw the bitmap

        SetStretchBltMode(memDC, HALFTONE);
        StretchBlt(paint.hdc, 0, 0, w, h, memDC, 0, 0, 512, 512, op);

        const troll = GetDC(NULL);
        StretchBlt(troll, 0, 0, 100, 100, memDC, 0, 0, 512, 512, op);
        FrameRect(troll, 0, 0, 100, 100, NULL);
        ReleaseDC(NULL, troll);

        DeleteDC(memDC);
        EndPaint(hwnd, paint);
    }else if(msg == WM_LBUTTONDOWN) {
        print(LOWORD(lp), HIWORD(lp));
        op = op == SRCCOPY ? NOTSRCCOPY : SRCCOPY;
        RedrawWindow(hwnd, 0, 0, w, h, NULL, RDW_INVALIDATE | RDW_UPDATENOW); //apparently i don't need updatenow?
    }else if(msg == WM_SIZE) { //for some reason the window is repainted automatically when sizing up but not sizing down
        w = LOWORD(lp);
        h = HIWORD(lp);
        RedrawWindow(hwnd, 0, 0, w, h, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
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