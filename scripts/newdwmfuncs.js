//dedicated to the brave new functions added on this fine day

DwmSetWindowAttribute(GetConsoleWindow(), DWMWA_USE_IMMERSIVE_DARK_MODE, false); //haha
// DwmSetWindowAttribute(GetConsoleWindow(), DWMWA_SYSTEMBACKDROP_TYPE, DWMSBT_TRANSIENTWINDOW); //YO ACRYLIC BACKGROUND????
SetWindowLongPtr(GetConsoleWindow(), GWL_EXSTYLE, WS_EX_LAYERED);
SetLayeredWindowAttributes(GetConsoleWindow(), RGB(12,12,12), 0, LWA_COLORKEY); //LO!

let i = 0;
const icon = LoadIcon(NULL, IDI_ERROR);

function rngcolor() {
    return RGB(Math.random()*255, Math.random()*255, Math.random()*255); //lol i didn't round these numbers but i guess using v8::Number does it automagically
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        SetLayeredWindowAttributes(hwnd, RGB(255,0,0), 0, LWA_COLORKEY); //full green is transparent
        DwmSetWindowAttribute(hwnd, DWMWA_BORDER_COLOR, RGB(255,0,0)); //DWMWA_BORDER_COLOR only supported in windows 11! (https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/ne-dwmapi-dwmwindowattribute#:~:text=the%20border%20color.-,This%20value%20is%20supported%20starting%20with%20Windows%2011%20Build%2022000,-.)
        //honestly im utterly shocked this works (i've NEVER seen a different colored border)
        DwmSetWindowAttribute(hwnd, DWMWA_TEXT_COLOR, RGB(0,255,0)); //title color
        DwmSetWindowAttribute(hwnd, DWMWA_CAPTION_COLOR, RGB(0, 0, 255)); //title bar color!
        DwmSetWindowAttribute(hwnd, DWMWA_WINDOW_CORNER_PREFERENCE, DWMWCP_DONOTROUND);
        //DwmSetWindowAttribute(hwnd, DWMWA_SYSTEMBACKDROP_TYPE, DWMSBT_TRANSIENTWINDOW); //LAYERED WINDOW + DWMSBT_TRANSIENTWINDOW = ACRYLIC BACKGROUND!
        DwmSetWindowAttribute(hwnd, DWMWA_USE_IMMERSIVE_DARK_MODE, false);
        //print("blur?", DwmEnableBlurBehindWindow(hwnd, true, DWM_BB_ENABLE | DWM_BB_BLURREGION, 0, 0, 500, 500)); //aw damn the google says DwmEnableBlurBehindWindow does NOT blur anymore :sob:
        //print("dwm ncpaint?", DwmGetWindowAttribute(hwnd, DWMWA_NCRENDERING_ENABLED));
        InvalidateRect(hwnd, 0, 0, 500, 500, true);
        UpdateWindow(hwnd); //draw immediately

    }else if(msg == WM_LBUTTONDOWN) {
        DwmSetWindowAttribute(hwnd, DWMWA_BORDER_COLOR, rngcolor());
        DwmSetWindowAttribute(hwnd, DWMWA_TEXT_COLOR, rngcolor());
        DwmSetWindowAttribute(hwnd, DWMWA_CAPTION_COLOR, rngcolor());
        DwmSetWindowAttribute(hwnd, DWMWA_WINDOW_CORNER_PREFERENCE, i < 4 ? i : Math.round(Math.random()*3));
        i++;
    }else if(msg == WM_PAINT) {
        ps = BeginPaint(hwnd);
        TextOut(ps.hdc, 50, 50, "TEXTOUTE HNJTIGFVKWNMGVWSDgv🤫🧏‍♂️ 😂😂😂😂😂"); //why are emojis stretched as shit
        EndPaint(hwnd, ps);
    }
    /*else if(msg == WM_NCPAINT) {
        //print("PAINT",hwnd, wp, DCX_WINDOW | DCX_INTERSECTRGN);
        const dc = GetDCEx(hwnd, wp, DCX_WINDOW|DCX_INTERSECTRGN); //https://learn.microsoft.com/en-us/windows/win32/gdi/wm-ncpaint
        TextOut(dc, 12, 0, "click ot ranrenaifasf ran yakumos");
        TextOut(dc, 12, 12, "click ot ranrenaifasf ran yakumos");
        TextOut(dc, 12, 24, "click ot ranrenaifasf ran yakumos");
        DrawIcon(dc, 0, 0, icon);
        ReleaseDC(hwnd, dc);
        //ps = BeginPaint(hwnd);
        //
        //TextOut(ps.hdc, 12, 12, "click to randomize colorz!");
        //
        //EndPaint(hwnd, ps);
    }*/
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }//else {
    //    return DefWindowProc(hwnd, msg, wp, lp);
    //}
}

const wc = CreateWindowClass("dwnmfdbssfyk", windowProc);
wc.hCursor = LoadCursor(NULL, IDC_HAND);
wc.hbrBackground = CreateSolidBrush(RGB(255,0,0));//COLOR_WINDOW+1;
//wc.DefWindowProc = false;

CreateWindow(WS_EX_LAYERED, wc, "dwm test", WS_OVERLAPPEDWINDOW | WS_VISIBLE, 500, 500, 500, 500, NULL, NULL, hInstance);