let d2d;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1DeviceContextDComposition, hwnd);
        brush = d2d.CreateSolidColorBrush(1.0, 1.0, 1.0, 1.0);
        let fontname = "";
        d2d.EnumFonts((fontFamily) => {
            print(fontFamily);
            if(fontFamily.includes("Operator")) {
                fontname = fontFamily;
            }
        }, false); //specifying false passes the names of the font families and specifiying true passes IDWriteFontFamily objects (which you have to release)
        //d2d.EnumFonts((fontFamily) => {
        //    let name = fontFamily.GetFamilyName();
        //    if(name.includes("Operator")) {
        //        fontname = name;
        //    }
        //    fontFamily.Release(); //unfortunately you have to release if you're done with this shit
        //});
        print(fontname, "8-bit Operator+ Bold"); //yeah lol i've got 8-bit operator (maybe soon i'll add a thing so you can use customfonts like sfml)
        font = d2d.CreateFont(fontname, 32);
        SetTimer(hwnd, NULL, 100);
    }else if(msg == WM_TIMER) {
        d2d.BeginDraw();
        d2d.Clear(0.0, 0.0, 0.0, 0.0);
        d2d.DrawText("0 / 1 Skibidi fortnite", font, 0, 0, 512, 128, brush);
        d2d.EndDraw();
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("wintilemanager", windowProc); //max classname length is 256 lol
wc.hCursor = LoadCursor(NULL, IDC_HAND);//LoadIcon(NULL, IDI_APPLICATION); //haha just learned that you can use icons instead
wc.hbrBackground = COLOR_WINDOW+1;

CreateWindow(WS_EX_NOREDIRECTIONBITMAP | WS_EX_TOPMOST | WS_EX_TRANSPARENT, wc, "", /*WS_BORDER |*/ WS_POPUP | WS_VISIBLE, screenWidth-512-32, 512+64, 512, 128, NULL, NULL, hInstance);