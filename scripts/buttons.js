const width = 512;
const height = 512;

let buttons = [];
let impact;
let i = 1;
//let image;

function SetFont(button) {
    SendMessage(button, WM_SETFONT, impact, true); //lol
    return button;
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        impact = CreateFontSimple("impact", 20, 40);
        buttons.push({i: 1, button: SetFont(CreateWindow(NULL,"BUTTON", "CLICK ME!", WS_CHILD | WS_VISIBLE, 0, 0, width, height, hwnd, 1, hInstance)), x: 0, y: 0, width, height});
        //const wic = InitializeWIC();
        //ScopeGUIDs(wic);
        //print(wic.GUID_WICPixelFormat32bppPBGRA);
        //const wicBitmap = wic.LoadBitmapFromFilename(__dirname+"/troll.bmp", wic.GUID_WICPixelFormat32bppPBGRA, 0);
        //print(wicBitmap);
        //wicBitmap.Resize(wic, width, height, WICBitmapInterpolationModeNearestNeighbor);
        //image = wicBitmap.GetPixels(wic);
        //wicBitmap.Release();
        //wic.Release();
    }else if(msg == WM_KEYDOWN) {
        if(wp == VK_ESCAPE) {
            DestroyWindow(hwnd);
        }
    }else if(msg == WM_COMMAND) {
        print(wp, lp);
        let b = buttons.findIndex(button => (button.i == wp));
        const buttonObj = buttons[b];
        DestroyWindow(buttonObj.button);
        buttons.splice(b, 1);
        const newWidth = buttonObj.width/2;
        const newHeight = buttonObj.height/2;

        buttons.push({button: SetFont(CreateWindow(NULL,"BUTTON", i, WS_CHILD | WS_VISIBLE, buttonObj.x, buttonObj.y, newWidth, newHeight, hwnd, ++i, hInstance)), i, x: buttonObj.x, y: buttonObj.y, width: newWidth, height: newHeight});
        buttons.push({button: SetFont(CreateWindow(NULL,"BUTTON", i, WS_CHILD | WS_VISIBLE, buttonObj.x+newWidth, buttonObj.y, newWidth, newHeight, hwnd, ++i, hInstance)), i, x: buttonObj.x+newWidth, y: buttonObj.y, width: newWidth, height: newHeight});
        buttons.push({button: SetFont(CreateWindow(NULL,"BUTTON", i, WS_CHILD | WS_VISIBLE, buttonObj.x, buttonObj.y+newHeight, newWidth, newHeight, hwnd, ++i, hInstance)), i, x: buttonObj.x, y: buttonObj.y+newHeight, width: newWidth, height: newHeight});
        buttons.push({button: SetFont(CreateWindow(NULL,"BUTTON", i, WS_CHILD | WS_VISIBLE, buttonObj.x+newWidth, buttonObj.y+newHeight, newWidth, newHeight, hwnd, ++i, hInstance)), i, x: buttonObj.x+newWidth, y: buttonObj.y+newHeight, width: newWidth, height: newHeight});
        //print(buttons);
    }else if(msg == WM_PAINT) {
        //const ps = {hdc: GetDC(hwnd)}//BeginPaint(hwnd);
        //const last = SelectObject(ps.hdc, DC_BRUSH);
        //SetDCBrushColor(ps.hdc, RGB(0,0,0));
        //FillRect(ps.hdc, 0, 0, width, height, NULL);
        //SelectObject(ps.hdc, last);
        ////EndPaint(hwnd, ps);
        //ReleaseDC(hwnd, ps.hdc);

        //const dc = GetDC(hwnd);
        ////StretchDIBits(dc, 0, 0, width, height, 0, 0, width, height, image, width, height, 32, BI_RGB, SRCCOPY);
        //ReleaseDC(hwnd, dc);
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const winclass = CreateWindowClass("WinClass"/*, init*/, windowProc); //loop is not required y'all
winclass.hIcon = winclass.hIconSm = LoadIcon(NULL, IDI_APPLICATION);
winclass.hbrBackground = COLOR_BACKGROUND;
winclass.hCursor = LoadCursor(NULL, IDC_ARROW);
                                                                                                //math
CreateWindow(WS_EX_OVERLAPPEDWINDOW, winclass, "buttons subdividing thingy", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, width+20, height+42, NULL, NULL, hInstance);