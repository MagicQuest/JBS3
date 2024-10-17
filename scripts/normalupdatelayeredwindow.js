//damn this is crazy maybe at some point i'll investigate: https://parnassus.co/transparent-graphics-with-pure-gdi-part-1/
//https://stefanwick.com/2018/12/19/creating-chromeless-non-rectangular-windows-from-uwp/
//https://www.codeproject.com/Articles/251892/Guide-to-Image-Composition-with-Win32-MsImg32-dll
//https://learn.microsoft.com/en-us/windows/win32/dwm/customframe?redirectedfrom=MSDN
//https://stackoverflow.com/questions/7773771/how-do-i-implement-dragging-a-window-using-its-client-area
//http://www.winprog.org/tutorial/transparency.html

let windowWidth = 512; //current width (for when you resize it)
let windowHeight = 512;

let cx = windowWidth; //original width
let cy = windowHeight;

const screen = GetDC(NULL);

let hbm, opaquetonot, whitefullalpha;

function drawHBMtoCompatibleAndAlsoDrawTitlebar(hwnd, memDC) {
    const hbmDC = CreateCompatibleDC(screen);
    SelectObject(hbmDC, hbm);

    const whiteDC = CreateCompatibleDC(screen);
    SelectObject(whiteDC, whitefullalpha);

    //drawing a titlebar (into hbmDC) because i think WS_EX_LAYERED stops drawing it
    //SelectObject(hbmDC, GetStockObject(DC_BRUSH));
    //SetDCBrushColor(hbmDC, RGBA(255, 0, 0, 128));
    //FillRect(hbmDC, 0, 0, windowWidth, 33, NULL); //33 pixels tall i think
    //let lastFont = SelectObject(hbmDC, GetDefaultFont());
    //TextOut(hbmDC, 9, 9, GetWindowText(hwnd)); //lol lazy GetWindowText
    //SelectObject(hbmDC, lastFont);

    //unfortunately i still don't know how to draw regular gdi stuff like TextOut with alpha too so we just gonna draw the titlebar using AlphaBlend
    //wait nevermind i have to AlphaBlend into hbm
    //AlphaBlend(hbmDC, 0, 0, windowWidth, 33, whitefullalpha, 0, 0, 1, 1, 255, AC_SRC_OVER);
    //nah the problem was i forgot to use a memory dc for whitefullalpha lol
    AlphaBlend(hbmDC, 0, 0, windowWidth, 30, whiteDC, 0, 0, 1, 1, 255, AC_SRC_OVER); //oh wait the titlebar might only be like 30 or 31 pixels tall
    DeleteDC(whiteDC);
    
    StretchBlt(memDC, 0, 0, windowWidth, windowHeight, hbmDC, 0, 0, cx, cy, SRCCOPY);
    DeleteDC(hbmDC);
}

function ULW(hwnd) { //this revelation of a function comes from (https://stackoverflow.com/questions/67689087/correct-way-to-handle-and-redraw-a-layered-window-with-a-bitmap)
    const rect = GetWindowRect(hwnd);

    //const dc = GetDC(NULL); //for some reason it doesn't use the hwnd's DC AT ALL?
    const memDC = CreateCompatibleDC(screen);

    const newBitmap = CreateCompatibleBitmap(screen, windowWidth, windowHeight); //ok i have NO IDEA WHY you have to create a compatible bitmap, draw the real bitmap (hbm.bitmap) into the compatible bitmap and use THAT memDC for UpdateLayeredWindow (oh ok i think it's because hbm is a dib section and not a regular compatible bitmap lol)
    const oldBitmap = SelectObject(memDC, newBitmap);
    
    drawHBMtoCompatibleAndAlsoDrawTitlebar(hwnd, memDC);

    //drawHBMToNew(dc, memDC);
    //paint(memDC); //paint into memDC so it shows up in UpdateLayeredWindow()

    UpdateLayeredWindow(hwnd, screen, {x: rect.left, y: rect.top}, {width: windowWidth, height: windowHeight}, memDC, {x: 0, y: 0}, RGB(0,0,0), 255, AC_SRC_ALPHA, ULW_ALPHA);
    //print(UpdateLayeredWindow(hwnd, dc, {x: rect.left, y: rect.top}, {width: windowWidth, height: windowHeight}, memDC, {x: 0, y: 0}, RGB(0,0,0), 255, AC_SRC_ALPHA, ULW_ALPHA), GetLastError(), _com_error(GetLastError()));
    SelectObject(memDC, oldBitmap);
    DeleteObject(newBitmap);
    DeleteDC(memDC);

    //ReleaseDC(NULL, dc);
}

function RGBA(r, g, b, a) { //hmm i probably should've made this ARGB
    //calculate the factor by which we multiply each component 
    const fAlphaFactor = a / 0xff; 
    // multiply each pixel by fAlphaFactor, so each component  
    // is less than or equal to the alpha value.
    return (a << 24) | (r * fAlphaFactor) << 16 | (g * fAlphaFactor) << 8 | (b * fAlphaFactor); //from this example https://learn.microsoft.com/en-us/windows/win32/gdi/alpha-blending-a-bitmap
}

//function RGBA3(r, g, b, a) { //bruh ain't no damn way js has a thing where if you left shift an int << 24 it does some weird sign flip thing idk bruh but who knew the original function lowkey hasn't been actually working correctly (ok wait scratch everything i just said im not sure if THIS function works correctly the old version actually might've been correct? idk maybe something about how COLORREF is a DWORD)
//    r = BigInt(r);
//    g = BigInt(g);
//    b = BigInt(b);
//    a = BigInt(a);
//    //calculate the factor by which we multiply each component 
//    const fAlphaFactor = a / 0xffn; 
//    // multiply each pixel by fAlphaFactor, so each component  
//    // is less than or equal to the alpha value.
//
//    //... v8 crashes because im assuming that every number passed into my custom functions is a regular number so i gotta cast (which is fine lol)
//    return Number((a << 24n) | (r * fAlphaFactor) << 16n | (g * fAlphaFactor) << 8n | (b * fAlphaFactor)); //from this example https://learn.microsoft.com/en-us/windows/win32/gdi/alpha-blending-a-bitmap
//}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        hbm = CreateDIBSection(screen, CreateDIBitmapSimple(cx, -cy, 32), DIB_RGB_COLORS); //oh yeah i used a dib section so that in updateHBM i could edit the pixels manually (to add the alpha)

        opaquetonot = CreateDIBSection(screen, CreateDIBitmapSimple(cx, -1, 32), DIB_RGB_COLORS);

        whitefullalpha = CreateDIBSection(screen, CreateDIBitmapSimple(1, -1, 32), DIB_RGB_COLORS);
        whitefullalpha.SetBit(0, RGBA(255, 255, 255, 255));

        for(let i = 0; i < cx; i++) {
            //opaquetonot.SetBit(i, Number(BigInt(Math.round((i/cx)*255)) << 24n));//RGBA3(0, 0, 0, Math.round(255-((i/cx)*255))));
            //print(Math.round(255-((i/cx)*255)));
            //opaquetonot.SetBit(i, RGBA(0, 128, 128, Math.round(255-((i/cx)*255))));
            opaquetonot.SetBit(i, RGBA(200, 200, 200, Math.round(255-((i/cx)*255))));
            //opaquetonot.SetBit(i, 0x00000000);
        }

        SetTimer(hwnd, 0, 64);
    }else if(msg == WM_TIMER) {
        const memDC = CreateCompatibleDC(screen); //screen because hbm was created with screen too
        SelectObject(memDC, hbm);
        //SelectObject(memDC, GetStockObject(DC_BRUSH));
        ////SetDCBrushColor(memDC, RGBA(0, 255, 0, 128)); //honestly idk if you can use rgba here lol (ok suprisingly it worked (ok well idk it's not working working but sorta (ok final note it only works sometimes because it isn't supposed to work ;(    (anybody feel free to prove me wrong tho just in case)    ))))
//
        //ohhhh i wanted to get the COLORREF of COLOR_BACKGROUND and (if i implemented GetSysColor) i would be able to (but most colors don't work past windows 10? (actually im not sure how true this is)) https://stackoverflow.com/questions/75042403/win32-getsyscolor-many-colours-now-say-windows-10-or-greater-this-value-is https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getsyscolor 
        //FillRect(memDC, 0, 0, cx, cy, COLOR_BACKGROUND); //using fill rect because i don't want an outline

        const memDC2 = CreateCompatibleDC(screen);
        SelectObject(memDC2, opaquetonot);
        AlphaBlend(memDC, 0, 0, cx, cy, memDC2, 0, 0, cx, 1, 255, AC_SRC_OVER);
        DeleteDC(memDC2);

        //seeing if i can blt alpha (because only like 3 gdi functions can do that)
        
        DeleteDC(memDC);

        ULW(hwnd); //update!
    }else if(msg == WM_SIZE) {
        const rect = GetWindowRect(hwnd);
        windowWidth = rect.right - rect.left;
        windowHeight = rect.bottom - rect.top;
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_LAYERED | WS_EX_TOPMOST, wc, "a normal version for update layered window", WS_OVERLAPPEDWINDOW | WS_VISIBLE, 500, 500, cx+20, cy+43, NULL, NULL, hInstance);