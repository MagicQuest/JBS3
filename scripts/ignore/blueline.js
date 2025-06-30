//lowkey my monitor is kinda old and now there's a vertical cyan line going down the center of the screen (so now im replicating it so i can have it show when i stream stuff)

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        SetLayeredWindowAttributes(hwnd, RGB(0, 255, 0), NULL, LWA_COLORKEY);
    }else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);
        print(ps);
        const oldbrush = SelectObject(ps.hdc, GetStockObject(DC_BRUSH));
        const oldpen = SelectObject(ps.hdc, GetStockObject(DC_PEN));
        SetDCBrushColor(ps.hdc, RGB(0, 255, 0));
        SetDCPenColor(ps.hdc, RGB(0, 255, 255));
        FillRect(ps.hdc, 0, 0, screenWidth, screenHeight, NULL);
        MoveTo(ps.hdc, 908, 0);
        LineTo(ps.hdc, 908, screenHeight);
        SelectObject(ps.hdc, oldbrush);
        SelectObject(ps.hdc, oldpen);
        EndPaint(hwnd, ps);
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_WINDOW;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

//oooh i was accidently using WS_EX_OVERLAPPEDWINDOW and it left the popup border on my screen
window = CreateWindow(/*WS_EX_OVERLAPPEDWINDOW | */WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOPMOST | WS_EX_TOOLWINDOW, wc, "hopefully this one works", WS_POPUP | WS_VISIBLE, 0, 0, screenWidth, screenHeight, NULL, NULL, hInstance);