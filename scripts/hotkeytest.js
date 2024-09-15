//randomly found the RegisterHotKey function so we finna see whwat that's about

const randomid = 0x251B1D1; //haha oops on msdn they say that the id can be any number from 0 to 0xBFFF and this is a little bigger than that (no problem though apparently so maybe msdn was lying)

let trollmode = 0;
let troll = LoadImage(NULL, __dirname+"/troll.bmp", IMAGE_BITMAP, 0, 0, LR_LOADFROMFILE);
let trolldim = GetBitmapDimensions(troll);
let dc;
let bmp;

let w = 512;
let h = 512;

//SetBitmapDimensionEx(troll, 512, 512); //i don't think this actually does anything...

//print(GetBitmapDimensions(troll), GetBitmapDimensionEx(troll));

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        dc = GetDC(hwnd);
        bmp = CreateCompatibleBitmap(dc, w, h);

        print(RegisterHotKey(hwnd, randomid, MOD_ALT | MOD_CONTROL | MOD_SHIFT, 'T'.charCodeAt(0)) == 1);
    }else if(msg == WM_HOTKEY) {
        //wp is the id of the hotkey hit while the LOWORD of lp is the modifiers and the HIWORD of the lp is the keycode
        print(wp, LOWORD(lp), HIWORD(lp));
        print("Hotkey hit! Deploying payload...");
        SetForegroundWindow(hwnd);
        if(!trollmode) {
            SetTimer(hwnd, NULL, 32);
            trollmode = 1;
            //print("trolling engaged");
        }
    }else if(msg == WM_TIMER) {
        //print(trollmode);
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, bmp);

        const trollDC = CreateCompatibleDC(dc);
        SelectObject(trollDC, troll);

        //if(trollmode < 10) {
            StretchBlt(memDC, 0, 0, 512, (trollmode/160)*512, trollDC, 0, 0, trolldim.width, trollmode, SRCCOPY);
        //}

        StretchBlt(dc, 0, 0, w, (trollmode/512)*h, memDC, 0, 0, 512, trollmode, SRCCOPY);

        DeleteDC(trollDC);
        DeleteDC(memDC);

        trollmode++;
    }else if(msg == WM_SIZE) { //bruh i was having problems resizing the window and it was because instead of copy and pasting the windowProc function i wrote it manually and i swapped the wp and lp variables :(
        w = LOWORD(lp);
        h = HIWORD(lp);
    }
    else if(msg == WM_DESTROY) {
        ReleaseDC(dc, hwnd);
        print(UnregisterHotKey(hwnd, randomid) == 1);
        PostQuitMessage(0);
    }
}

const winclass = CreateWindowClass("WinClass"/*, init*/, windowProc); //loop is not required y'all (but her timing is getting better)
winclass.hIcon = winclass.hIconSm = LoadIcon(NULL, IDI_QUESTION);
winclass.hbrBackground = COLOR_BACKGROUND;
winclass.hCursor = LoadCursor(NULL, IDC_HAND);

CreateWindow(WS_EX_OVERLAPPEDWINDOW, winclass, "press Alt+Shift+Control+T for a suprise!", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);