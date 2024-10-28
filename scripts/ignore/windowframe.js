let w = 512;
let h = 512;

let mouse = {x: 0, y: 0};

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        //uxtheme = DllLoad("UxTheme.dll");
        //print(uxtheme("IsAppThemed", 0, [], [], RETURN_NUMBER)); //oh hell yeah it's one (https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-isappthemed)
        //print(uxtheme("IsThemeActive", 0, [], [], RETURN_NUMBER));
        //let result = uxtheme("SetWindowTheme", 3, [hwnd, " ", " "], [VAR_INT, VAR_WSTRING, VAR_WSTRING], RETURN_NUMBER); //NO FUCKING WAY?!
        //print(result, "result"); //strangly enough this works more reliably than not
        DwmSetWindowAttribute(hwnd, DWMWA_CAPTION_COLOR, RGB(24, 24, 24)); //hell yeah this shit tuff asf (dark title bar)[doesn't work if you get rid of the window theme tho]

        //DwmExtendFrameIntoClientArea(hwnd, -1, -1, -1, -1);
    }else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);
        FillRect(ps.hdc, 0, 0, w, h, COLOR_BACKGROUND); //sometimes it doesn't automagically draw the background color
        const oldbrush = SelectObject(ps.hdc, GetStockObject(DC_BRUSH));
        SetDCBrushColor(ps.hdc, RGB(0, 128, 128));
        //FillRect(ps.hdc, 100, 100, 200, 200, NULL);
        FillRect(ps.hdc, mouse.x, mouse.y, mouse.x+200, mouse.y+200, NULL);
        SelectObject(ps.hdc, oldbrush);
        EndPaint(hwnd, ps);

        //DefWindowProc(hwnd, msg, wp, lp);
    }else if(msg == WM_NCPAINT) {
        DefWindowProc(hwnd, msg, wp, lp); //IMPORTANT (i think????)
        
        //const hdc = GetDCEx(hwnd, wp, DCX_WINDOW | DCX_INTERSECTRGN); //the google say GetDCEx is kinda weird and i should use GetWindowDC() https://stackoverflow.com/questions/5409354/getdcex-returns-null-before-form-show-drawing-on-the-non-client-area
        const hdc = GetWindowDC(hwnd);
        if(hdc) {
            const oldbrush = SelectObject(hdc, GetStockObject(DC_BRUSH));
            print(hdc, oldbrush);
            SetDCBrushColor(hdc, RGB(255, 127, 127));
            //FillRect(hdc, 100, 0, 200, 200, NULL);
            FillRect(hdc, mouse.x-100, mouse.y-100, mouse.x+100, mouse.y+100, NULL);
            SelectObject(hdc, oldbrush);
            ReleaseDC(hwnd, hdc);
        }

        return 0;
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }else if(msg == WM_MOUSEMOVE) {
        mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)};
        RedrawWindow(hwnd, 0, 0, w, h, NULL, RDW_FRAME | RDW_INVALIDATE);
        //const hrgn = CreateRectRgn(0, 0, w, h);
        //RedrawWindow(hwnd, NULL, NULL, NULL, NULL, hrgn, RDW_FRAME | RDW_INVALIDATE);
        //DeleteObject(hrgn);
    }else {
        if(msg == WM_SIZE) {
            let [nWidth, nHeight] = [LOWORD(lp), HIWORD(lp)];
            w = nWidth;
            h = nHeight;
        }
        //return DefWindowProc(hwnd, msg, wp, lp);
    }
    //return 0;
    return DefWindowProc(hwnd, msg, wp, lp);
}

const wc = CreateWindowClass("winclass", windowProc);

wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);
wc.style = CS_OWNDC | CS_VREDRAW | CS_HREDRAW;
wc.DefWindowProc = false;

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "testing dwm frame stuff", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);
