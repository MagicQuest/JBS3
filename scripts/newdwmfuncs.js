//dedicated to the brave new functions added on this fine day
//https://learn.microsoft.com/en-us/windows/win32/dwm/dwm-sample-customizethumbnail

//DwmSetWindowAttribute(GetConsoleWindow(), DWMWA_USE_IMMERSIVE_DARK_MODE, false); //haha
//DwmSetWindowAttribute(GetConsoleWindow(), DWMWA_SYSTEMBACKDROP_TYPE, DWMSBT_TRANSIENTWINDOW); //YO ACRYLIC BACKGROUND???? (i have no idea why but this line by itself make the title bar for the console acrylic and idk why)
SetWindowCompositionAttribute(GetConsoleWindow(), ACCENT_ENABLE_BLURBEHIND, NULL, 0, NULL); //GOOD GOD DON'T RESIZE THE WINDOW (adds the acrylic affect without needing transparency???)
//SetWindowLongPtr(GetConsoleWindow(), GWL_EXSTYLE, WS_EX_LAYERED);
//SetLayeredWindowAttributes(GetConsoleWindow(), RGB(12,12,12), 0, LWA_COLORKEY); //LO!

let i = 0;
let j = 0;
let consoleGradient = false;
const icon = LoadIcon(NULL, IDI_ERROR);
let gdiFont, gdiFont2;
let imagineBMP = LoadImage(NULL, __dirname+"/imagine.bmp", IMAGE_BITMAP, 528, 566, LR_LOADFROMFILE | LR_SHARED);
let trollBMP = LoadImage(NULL, __dirname+"/troll.bmp", IMAGE_BITMAP, 220, 183, LR_LOADFROMFILE | LR_SHARED);

let mwidth;
let mheight;

let freaky = false;

function rngcolor() {
    return RGB(Math.random()*255, Math.random()*255, Math.random()*255); //lol i didn't round these numbers but i guess using v8::Number does it automagically
}

//why does hsl to rgb require all this bruh
function hslToRgb(h, s, l) { //https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        function hueToRgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hueToRgb(p, q, h + 1/3);
        g = hueToRgb(p, q, h);
        b = hueToRgb(p, q, h - 1/3);
    }

    return RGB(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        SetLayeredWindowAttributes(hwnd, RGB(255,0,0), 0, LWA_COLORKEY); //full green is transparent
        DwmSetWindowAttribute(hwnd, DWMWA_BORDER_COLOR, RGB(255,0,0)); //DWMWA_BORDER_COLOR only supported in windows 11! (https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/ne-dwmapi-dwmwindowattribute#:~:text=the%20border%20color.-,This%20value%20is%20supported%20starting%20with%20Windows%2011%20Build%2022000,-.)
        //honestly im utterly shocked this works (i've NEVER seen a different colored border)
        DwmSetWindowAttribute(hwnd, DWMWA_TEXT_COLOR, RGB(0,255,0)); //title color
        DwmSetWindowAttribute(hwnd, DWMWA_CAPTION_COLOR, RGB(0, 0, 255)); //title bar color!
        DwmSetWindowAttribute(hwnd, DWMWA_WINDOW_CORNER_PREFERENCE, DWMWCP_DONOTROUND);
        DwmSetWindowAttribute(hwnd, DWMWA_SYSTEMBACKDROP_TYPE, DWMSBT_TRANSIENTWINDOW); //LAYERED WINDOW + DWMSBT_TRANSIENTWINDOW = ACRYLIC BACKGROUND!
        //DwmSetWindowAttribute(hwnd, DWMWA_USE_IMMERSIVE_DARK_MODE, false);
        //print("blur?", DwmEnableBlurBehindWindow(hwnd, true, DWM_BB_ENABLE | DWM_BB_BLURREGION, 0, 0, 500, 500)); //aw damn the google says DwmEnableBlurBehindWindow does NOT blur anymore :sob:
        //print("dwm ncpaint?", DwmGetWindowAttribute(hwnd, DWMWA_NCRENDERING_ENABLED));
        InvalidateRect(hwnd, 0, 0, 500, 500, true);
        UpdateWindow(hwnd); //draw immediately

        DwmSetWindowAttribute(hwnd, DWMWA_FORCE_ICONIC_REPRESENTATION, true);
        DwmSetWindowAttribute(hwnd, DWMWA_HAS_ICONIC_BITMAP, true);

        gdiFont = CreateFontSimple("Consolas", 12, 24); //oh man i was about to use CreateFontIndirect and make a whole custom object and everything
        gdiFont2 = CreateFontSimple("impact", 24, 24);
        SetTimer(hwnd, 0, 32);
    }else if(msg == WM_LBUTTONDOWN) {
        //DwmSetWindowAttribute(hwnd, DWMWA_BORDER_COLOR, rngcolor());
        //DwmSetWindowAttribute(hwnd, DWMWA_TEXT_COLOR, rngcolor());
        //DwmSetWindowAttribute(hwnd, DWMWA_CAPTION_COLOR, rngcolor());
        DwmSetWindowAttribute(hwnd, DWMWA_WINDOW_CORNER_PREFERENCE, i < 4 ? i : Math.round(Math.random()*3));
        consoleGradient = !consoleGradient;
        if(!consoleGradient) {
            SetWindowCompositionAttribute(GetConsoleWindow(), ACCENT_ENABLE_BLURBEHIND, NULL, 0, NULL);
        }
        i++;
    }else if(msg == WM_PAINT) {
        ps = BeginPaint(hwnd);
        //how do i do another font again? (minesweeper.js has an ANSWER!)
        let oldFont = SelectObject(ps.hdc, gdiFont);
        TextOut(ps.hdc, 50, 50, "TEXTOUTE HNJTIGFVKWNMGVWSDgv🤫🧏‍♂️ 😂😂😂😂😂"); //why are emojis stretched as shit
        
        //wprint("SetWindowCompositionAttribute blur (console) vs DwmSetWindowAttribute DWMSBT_TRANSIENTWINDOW's blur (dwm test window)");
        TextOut(ps.hdc, 50, 100, "SetWindowCompositionAttribute blur (console) vs DwmSetWindowAttribute DWMSBT_TRANSIENTWINDOW's blur (dwm test window)");
        SelectObject(ps.hdc, oldFont);

        //const memDC = CreateCompatibleDC(ps.hdc);
        //SelectObject(memDC, imagineBMP);
        //BitBlt(ps.hdc, 0, 0, 100, 100, memDC, 0, 0, SRCCOPY);
        //DeleteDC(memDC);
        
        EndPaint(hwnd, ps);
    }else if(msg == WM_DWMSENDICONICTHUMBNAIL) { //shows when you alt+tab and hover over taskbar icon
        mwidth = HIWORD(lp);
        mheight = LOWORD(lp);
        print(mwidth, mheight, wp, "creating iconic thumbnail");
        //hbm = false;
        const screen = GetDC(hwnd);
        //oh the docs say hbm must be 32-bit
        //let hbm = CreateCompatibleBitmap(screen, mwidth-10, mheight-10);//CreateDIB(mwidth, mheight); https://learn.microsoft.com/en-us/windows/win32/api/Dwmapi/nf-dwmapi-dwmseticonicthumbnail
        //print(CreateDIBitmapSimple(mwidth-10, mheight-10, 32));
        let hbm = CreateDIBSection(screen, CreateDIBitmapSimple(mwidth, mheight, 32), DIB_RGB_COLORS); //WTF THIS ACTUALLY WORKED????
        //hbm = CreateBitmapIndirect(GetObjectHBITMAP(hbm)); //wow this line lowkey actually works
        const memDC = CreateCompatibleDC(screen);
        SelectObject(memDC, hbm.bitmap); //memDC points to missingTextureBmp and drawing to memDC will also draw onto missingTextureBmp!
        SelectObject(memDC, GetStockObject(DC_BRUSH));
        SetDCBrushColor(memDC, RGB(255,127,255));
        FillRect(memDC, 0, 0, mwidth, mheight, NULL);
        let oldFont = SelectObject(memDC, gdiFont2);
        TextOut(memDC, 10, 10, "HELP! 😃🤫🧏‍♂️🗣️🥴");
        TextOut(memDC, 10, 34, "CUSTOM");
        TextOut(memDC, 10, 58, "ICONIC THUMBNAIL");
        SelectObject(memDC, oldFont);

        const memDC2 = CreateCompatibleDC(screen); //for drawing another bmp
        SelectObject(memDC2, trollBMP);
        SetStretchBltMode(memDC, HALFTONE);
        StretchBlt(memDC, Math.random()*mwidth, Math.random()*mheight, 44, 36, memDC2, 0, 0, 220, 183, SRCCOPY);
        //BitBlt(screen, 0, 0, mwidth, mheight, memDC, 0, 0, SRCCOPY);
        DeleteDC(memDC);    
        DeleteDC(memDC2);    
        if(hbm && hbm.bitmap) {
            print(e=DwmSetIconicThumbnail(hwnd, hbm.bitmap, 0), "set"); //it seems like you can call this anywhere but if it's outside of the given width and height it freaks out (so i save HIWORD(lp) and LOWORD(lp) to mwidth and mheight so i can use them elsewhere)
            print(_com_error(e));
            DeleteObject(hbm.bitmap);
        }
        ReleaseDC(hwnd, screen);
    }else if(msg == WM_DWMSENDICONICLIVEPREVIEWBITMAP) { //updated every time you peek (hover over the window on the taskbar)
        let rect = GetClientRect(hwnd);
        let mwidth = rect.right - rect.left;
        let mheight = rect.bottom - rect.top;
        const screen = GetDC(hwnd);
        let hbm = CreateDIBSection(screen, CreateDIBitmapSimple(mwidth, mheight, 32), DIB_RGB_COLORS);
        const memDC = CreateCompatibleDC(screen);
        SelectObject(memDC, hbm.bitmap); //memDC points to missingTextureBmp and drawing to memDC will also draw onto missingTextureBmp!
        SelectObject(memDC, GetStockObject(DC_BRUSH));
        SetDCBrushColor(memDC, RGB(0,255,127));
        FillRect(memDC, 0, 0, mwidth, mheight, NULL);
        let oldFont = SelectObject(memDC, gdiFont2);
        TextOut(memDC, 10, 10, "HELP! 😃🤫🧏‍♂️🗣️🥴");
        TextOut(memDC, 10, 34, "CUSTOM ICONIC (PREVIEW)");
        TextOut(memDC, 10, 58, "THUMBNAIL");
        SelectObject(memDC, oldFont);
        const memDC2 = CreateCompatibleDC(screen); //for drawing another bmp
        SelectObject(memDC2, imagineBMP);
        SetStretchBltMode(memDC, HALFTONE);
        StretchBlt(memDC, Math.random()*mwidth-128, Math.random()*mheight-128, 256, 256, memDC2, 0, 0, 528, 528, SRCCOPY);
        //BitBlt(screen, 0, 0, mwidth, mheight, memDC, 0, 0, SRCCOPY);
        DeleteDC(memDC);
        DeleteDC(memDC2);
        if (hbm && hbm.bitmap)
        {
            print(e=DwmSetIconicLivePreviewBitmap(hwnd, hbm.bitmap, NULL, 1),"im feeling it");
            print(_com_error(e));
            DeleteObject(hbm.bitmap);
        }
        ReleaseDC(hwnd, screen);
    }else if(msg == WM_TIMER) {
        j = j%100;
        let maincolor = hslToRgb(j/100.0, 1.0, 0.5);
        let anticolor = hslToRgb(1.0-j/100.0, 1.0, 0.5);
        DwmSetWindowAttribute(hwnd, DWMWA_BORDER_COLOR, anticolor);
        DwmSetWindowAttribute(hwnd, DWMWA_TEXT_COLOR, anticolor);
        DwmSetWindowAttribute(hwnd, DWMWA_CAPTION_COLOR, maincolor);
        if(consoleGradient) {
            SetWindowCompositionAttribute(GetConsoleWindow(), ACCENT_ENABLE_GRADIENT, NULL, hslToRgb(j/100.0, 1.0, 0.5), NULL);
        }
        j++;
        let alttab = GetForegroundWindow() == FindWindow(NULL, "Task Switching"); //idk if it's called the same thing in windows 10
        //(GetKey(VK_MENU) && GetKey(VK_TAB) && mwidth)
        if((freaky && mwidth) || (mwidth && alttab)) { //how can i tell if you are alt+tabbing
            print(mwidth, mheight, wp, "creating iconic thumbnail");
            //hbm = false;
            const screen = GetDC(hwnd);
            //oh the docs say hbm must be 32-bit
            //let hbm = CreateCompatibleBitmap(screen, mwidth-10, mheight-10);//CreateDIB(mwidth, mheight); https://learn.microsoft.com/en-us/windows/win32/api/Dwmapi/nf-dwmapi-dwmseticonicthumbnail
            //print(CreateDIBitmapSimple(mwidth-10, mheight-10, 32));
            let hbm = CreateDIBSection(screen, CreateDIBitmapSimple(mwidth, mheight, 32), DIB_RGB_COLORS); //WTF THIS ACTUALLY WORKED????
            //hbm = CreateBitmapIndirect(GetObjectHBITMAP(hbm)); //wow this line lowkey actually works
            const memDC = CreateCompatibleDC(screen);
            SelectObject(memDC, hbm.bitmap); //memDC points to missingTextureBmp and drawing to memDC will also draw onto missingTextureBmp!
            SelectObject(memDC, GetStockObject(DC_BRUSH));
            SetDCBrushColor(memDC, RGB(255,127,255));
            FillRect(memDC, 0, 0, mwidth, mheight, NULL);
            let oldFont = SelectObject(memDC, gdiFont2);
            TextOut(memDC, 10, 10, "HELP! 😃🤫🧏‍♂️🗣️🥴");
            TextOut(memDC, 10, 34, "CUSTOM");
            TextOut(memDC, 10, 58, "ICONIC THUMBNAIL");
            SelectObject(memDC, oldFont);

            const memDC2 = CreateCompatibleDC(screen); //for drawing another bmp
            SelectObject(memDC2, trollBMP);
            SetStretchBltMode(memDC, HALFTONE);
            StretchBlt(memDC, Math.random()*mwidth, Math.random()*mheight, 44, 36, memDC2, 0, 0, 220, 183, SRCCOPY);
            //BitBlt(screen, 0, 0, mwidth, mheight, memDC, 0, 0, SRCCOPY);
            DeleteDC(memDC);
            DeleteDC(memDC2);
            if(hbm && hbm.bitmap) {
                print(e=DwmSetIconicThumbnail(hwnd, hbm.bitmap, 0), "set");
                print(_com_error(e));
                DeleteObject(hbm.bitmap);
            }
            ReleaseDC(hwnd, screen);
        }
    }
    //else if(msg == WM_NCPAINT) {
    //    //print("PAINT",hwnd, wp, DCX_WINDOW | DCX_INTERSECTRGN);
    //    const dc = GetWindowDC(hwnd);//GetDCEx(hwnd, wp, DCX_WINDOW|DCX_INTERSECTRGN); //https://learn.microsoft.com/en-us/windows/win32/gdi/wm-ncpaint
    //    TextOut(dc, 12, 0, "click ot ranrenaifasf ran yakumos");
    //    TextOut(dc, 12, 12, "click ot ranrenaifasf ran yakumos");
    //    TextOut(dc, 12, 24, "click ot ranrenaifasf ran yakumos");
    //    DrawIcon(dc, 0, 0, icon);
    //    ReleaseDC(hwnd, dc);
    //    //ps = BeginPaint(hwnd);
    //    //
    //    //TextOut(ps.hdc, 12, 12, "click to randomize colorz!");
    //    //
    //    //EndPaint(hwnd, ps);
    //}
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }//else {
    //    return DefWindowProc(hwnd, msg, wp, lp);
    //}
}

const wc = CreateWindowClass("dwnmfdbssfyk", windowProc);
wc.hCursor = LoadCursor(NULL, IDC_HAND);
wc.hbrBackground = CreateSolidBrush(RGB(255,0,0));//COLOR_WINDOW+1; //i think you are supposed to delete solid brushes but i can never be bothered here
//wc.DefWindowProc = false;

CreateWindow(WS_EX_LAYERED, wc, "dwm test", WS_OVERLAPPEDWINDOW | WS_VISIBLE, 500, 500, 500, 500, NULL, NULL, hInstance);

DeleteObject(gdiFont);
DeleteObject(gdiFont2);