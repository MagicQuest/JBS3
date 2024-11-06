//loqkwyt it's not working bruh
//it gives you the cool windows 7 title bar tho 

let d2d, brush, mouse = {x: 0, y: 0};

const w = 512;
const h = 512;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1DCRenderTarget, hwnd); //automatically calls BindDC using GetDC(hwnd)
        brush = d2d.CreateSolidColorBrush(0.0, .5, 0.5);
    }else if(msg == WM_NCPAINT) {
        let def = DefWindowProc(hwnd, msg, wp, lp);
        
        d2d.BindDC(GetWindowDC(hwnd));

        d2d.BeginDraw();
        d2d.FillEllipse(mouse.x, mouse.y, 24, 24, brush);
        d2d.EndDraw();

        return def;
    }else if(msg == WM_MOUSEMOVE) {
        mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)};
        RedrawWindow(hwnd, 0, 0, w, h, NULL, RDW_FRAME | RDW_INVALIDATE);
        //const hrgn = CreateRectRgn(0, 0, w, h);
        //RedrawWindow(hwnd, NULL, NULL, NULL, NULL, hrgn, RDW_FRAME | RDW_INVALIDATE);
        //DeleteObject(hrgn);
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
    return DefWindowProc(hwnd, msg, wp, lp);
}

const wc = CreateWindowClass("winclass", windowProc);

wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);
wc.DefWindowProc = false;

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "drawing on the window dc in WM_NCPAINT", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);
