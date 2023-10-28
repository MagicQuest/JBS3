const width = 500+16;
const height = 500+39;

const impact = CreateFontSimple("impact", 20, 40);

const screen = GetDC(NULL);

let mouse = GetMousePos();

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        InvalidateRect(hwnd, 0, 0, width, height, true);
        UpdateWindow(hwnd); //draw immediately
    }else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);
        SetGraphicsMode(ps.hdc, GM_ADVANCED); //yeah i did NOT know you could do this and idk even know how to use matrixes like i need some easy functions to use
        const transform = GetWorldTransform(ps.hdc);
        print(transform); //im im sky hugh
        transform.eM11 = 1.0;
        transform.eM12 = 0.05; //yeah fuck all that i don't really know what's going on and im not in calculus or trig so im boned you can figure out how to shear and rotate yourself
        transform.eM22 = 1.0; //https://learn.microsoft.com/en-us/windows/win32/gdi/using-coordinate-spaces-and-transformations

        SetWorldTransform(ps.hdc, transform);

        TextOut(ps.hdc, 0, height/2, "get a load of this guy");

        EndPaint(hwnd, ps);
    }else if(msg == WM_KEYDOWN) {
        if(wp == VK_ESCAPE) {
            DestroyWindow(hwnd);
        }
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }else if(msg == WM_MOUSEMOVE) {
        mouse = GetMousePos();
        RedrawWindow(hwnd, 0, 0, width, height, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
    }
}

const winclass = CreateWindowClass("WinClass", /*init, */windowProc);
winclass.hIcon = winclass.hIconSm = LoadIcon(NULL, IDI_APPLICATION);
winclass.hbrBackground = COLOR_BACKGROUND;
winclass.hCursor = LoadCursor(NULL, IDC_ARROW);

CreateWindow(WS_EX_OVERLAPPEDWINDOW, winclass, "using gdi transform shits idk", WS_CAPTION | WS_SYSMENU | WS_VISIBLE, screenWidth/2-width/2, screenHeight/2-height/2, width, height, 0, 0, hInstance);