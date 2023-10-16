//i was about to make this with GDI but i remembered that d2d can load pngs soooo
//const bitmaps = [];
//const masks = [];

let d2d, keyBrush;
const pngs = [];

let window;//, button;

let position = {x: 500, y: 500};

let frame = 0;
let speed = 1;
let scale = 1;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        //button = CreateWindow(NULL, "BUTTON", "AnimateWindow", WS_CHILD | WS_VISIBLE, 1920/2, 1080/2, 192*1.5, 108/2, hwnd, NULL, hInstance);
        //SendMessage(button, WM_SETFONT, CreateFontSimple("Impact", 20, 40), true); //you should DeleteObject but i can't be bothered to do it
        SetLayeredWindowAttributes(hwnd, RGB(0,255,0), 0, LWA_COLORKEY);
        //RedrawWindow(hwnd, 0, 0, 1920, 1080, NULL, RDW_INVALIDATE | RDW_UPDATENOW);

        d2d = createCanvas("d2d", ID2D1DCRenderTarget, hwnd);
        keyBrush = d2d.CreateSolidColorBrush(0.0,1.0,0.0);

        for(let i = 1; i < 25; i++) {
            print(`${__dirname}/hdpng00${i < 10 ? "0"+i : i}.png`);
            pngs.push(d2d.CreateBitmapFromFilename(`${__dirname}/hdpng00${i < 10 ? "0"+i : i}.png`));
        }

        InvalidateRect(hwnd, 0, 0, 1920, 1080, true);
        UpdateWindow(hwnd); //draw immediately

        SetTimer(hwnd, 1, 32);
    }else if(msg == WM_KEYDOWN) {
        if(wp == VK_ESCAPE) {
            DestroyWindow(hwnd);
        }
    }else if(msg == WM_DESTROY) {
        PostQuitMessage();
    //}else if(msg == WM_COMMAND) {
    //    if(lp == button) {
    //        print("cick?");
    //        AnimateWindow(button, 10000, AW_SLIDE | AW_HIDE | AW_HOR_POSITIVE | AW_VER_POSITIVE);
    //    }
    }else if(msg == WM_PAINT) {
        d2d.BeginDraw();
        d2d.Clear(0,1,0);
        //d2d.FillRectangle(position.x, position.y, position.x+256*scale, position.y+256*scale, keyBrush);
        d2d.DrawBitmap(pngs[Math.floor(frame)], position.x, position.y, position.x+256*scale, position.y+256*scale);
        d2d.EndDraw();
    }else if(msg == WM_TIMER) {
        if(GetKey(VK_LCONTROL)) {
            position = GetMousePos();
        }
        if(GetKey(VK_LEFT)) {
            speed -=.01;
        }else if(GetKey(VK_RIGHT)) {
            speed +=.01;
        }else if(GetKey(VK_UP)) {
            scale += .1;
        }else if(GetKey(VK_DOWN)) {
            scale -= .1;
        }
        //make icon/cursor
        RedrawWindow(hwnd, position.x, position.y, position.x+256*scale, position.y+256*scale, NULL,RDW_INVALIDATE | RDW_UPDATENOW);
        frame = (frame+speed)%24;
        
        const dc = GetDC(hwnd);
        const bmp = CreateCompatibleBitmap(dc, 32, 32);
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, bmp);
        //BitBlt(memDC, 0, 0, 256*scale, 256*scale, dc, position.x, position.y, SRCCOPY); //too big LOL
        SetStretchBltMode(memDC, HALFTONE);
        StretchBlt(memDC, 0, 0, 32, 32, dc, position.x, position.y, 256*scale, 256*scale, SRCCOPY);
        const maskBmp = CreateCompatibleBitmap(dc, 32, 32); //empty mask bmp -> https://learn.microsoft.com/en-us/windows/win32/menurc/using-cursors#creating-a-cursor
        //const memMaskDC = CreateCompatibleDC(dc);
        //SelectObject(memMaskDC, maskBmp);
        //    //SelectObject(memDC, GetStockObject(DC_BRUSH));
        //    //FillRect(memDC, 0, 0, 20, 20, NULL);                  //can't get the mask to work for some reason ;( (NEVERMIND https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createiconindirect) I HAD TO DESELECT THE MASK FROM THE MEMDC (or DELETE THE DC)
        //TransparentBlt(memMaskDC, 0, 0, 32, 32, memDC, 0, 0, 32, 32, RGB(0,255,0));
        //BitBlt(dc, 32, 32, 32, 32, memMaskDC, 0, 0, SRCCOPY); //if i really wanted transparency i think i'd have to create a DIB section and manipulate the pixels and idk even know if CreateDIBSection works in JBS so nah 
        //DeleteDC(memMaskDC);
        DeleteDC(memDC); //i ain't leaking NO MEMORY
        const icon = CreateIconIndirect({fIcon: false, xHotspot: 16, yHotspot: 16, hbmMask: maskBmp, hbmColor: bmp});
        //DrawIcon(GetDC(NULL), 0, 0, icon);
        let lastCursor = SetCursor(icon);// SendMessage(hwnd, WM_SETCURSOR, CURSOR_, icon);
        DestroyIcon(lastCursor);
        DeleteObject(maskBmp);
        DeleteObject(bmp);
        ReleaseDC(dc);
    }
}

const wc = CreateWindowClass("winclassniggasfaze", windowProc); //max classname length is like 256 lol
wc.hCursor = LoadCursor(NULL, IDC_HAND);//LoadIcon(NULL, IDI_APPLICATION); //haha just learned that you can use icons instead
wc.hbrBackground = CreateSolidBrush(RGB(0,255,0));

CreateWindow(WS_EX_LAYERED | WS_EX_TOOLWINDOW | WS_EX_TOPMOST, wc, "", WS_POPUP | WS_VISIBLE, 0, 0, 1920, 1080, NULL, NULL, hInstance);