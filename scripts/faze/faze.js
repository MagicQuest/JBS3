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
        //button = CreateWindow(NULL, "BUTTON", "AnimateWindow", WS_CHILD | WS_VISIBLE, 1920/2, 1080/2, 192*1.5, 108/2, hwnd, NULL, hInstance); //testing animate window
        //SendMessage(button, WM_SETFONT, CreateFontSimple("Impact", 20, 40), true); //you should DeleteObject but i can't be bothered to do it
        SetLayeredWindowAttributes(hwnd, RGB(0,255,0), 0, LWA_COLORKEY); //full green is transparent
        //RedrawWindow(hwnd, 0, 0, 1920, 1080, NULL, RDW_INVALIDATE | RDW_UPDATENOW);

        d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd); //both ID2D1RenderTarget and ID2D1DCRenderTarget works but while resizing, ID2D1RenderTarget doesn't freeze
        keyBrush = d2d.CreateSolidColorBrush(0.0,1.0,0.0); //green screen brush

        for(let i = 1; i < 25; i++) {
            print(`${__dirname}/hdpng00${i < 10 ? "0"+i : i}.png`);
            pngs.push(d2d.CreateBitmapFromFilename(`${__dirname}/hdpng00${i < 10 ? "0"+i : i}.png`));
        }

        InvalidateRect(hwnd, 0, 0, 256*scale, 256*scale, true);
        UpdateWindow(hwnd); //draw immediately

        SetTimer(hwnd, 1, 32); //~30 fps (1000/32) because it starts destroying shit at 60 (16ms)
    }else if(msg == WM_KEYDOWN) {
        if(wp == VK_ESCAPE) {
            DestroyWindow(hwnd);
        }
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    //}else if(msg == WM_COMMAND) {
    //    if(lp == button) {
    //        print("cick?");
    //        AnimateWindow(button, 10000, AW_SLIDE | AW_HIDE | AW_HOR_POSITIVE | AW_VER_POSITIVE);
    //    }
    }else if(msg == WM_PAINT) {
        d2d.BeginDraw();
        d2d.Clear(0,1,0); //clear to green because full green == transparent
        //d2d.FillRectangle(position.x, position.y, position.x+256*scale, position.y+256*scale, keyBrush);
        d2d.DrawBitmap(pngs[Math.floor(frame)], 0, 0, 256*scale, 256*scale);
        d2d.EndDraw();
    }else if(msg == WM_TIMER) {
        let movewindow = false;
        let resize = false;
        if(GetKey(VK_LCONTROL)) {
            position = GetMousePos();
            //SetWindowPos(hwnd, HWND_TOPMOST, position.x, position.y, 256*scale, 256*scale, SWP_NOZORDER);
            movewindow = true;
        }
        if(GetKey(VK_LEFT)) {
            speed -=.01;
        }else if(GetKey(VK_RIGHT)) {
            speed +=.01;
        }else if(GetKey(VK_UP)) {
            scale += .1;

            movewindow = true;
            resize = true;
        }else if(GetKey(VK_DOWN)) {
            scale -= .1;
            
            movewindow = true;
            resize = true;
        }
        if(movewindow) {
            SetWindowPos(hwnd, HWND_TOPMOST, position.x, position.y, 256*scale, 256*scale, SWP_NOZORDER);
            if(resize) {
                d2d.Resize(256*scale, 256*scale);
            }
        }
        //make icon/cursor
        RedrawWindow(hwnd, 0, 0, 256*scale, 256*scale, NULL,RDW_INVALIDATE | RDW_UPDATENOW);
        frame = (frame+speed)%24;
        
        //everything beyond this is creating an icon as a cursor when you hover over the logo
        const dc = GetDC(hwnd);
        const bmp = CreateCompatibleBitmap(dc, 32, 32);
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, bmp);
        //BitBlt(memDC, 0, 0, 256*scale, 256*scale, dc, position.x, position.y, SRCCOPY); //too big LOL
        SetStretchBltMode(memDC, HALFTONE);
        StretchBlt(memDC, 0, 0, 32, 32, dc, 0, 0, 256*scale, 256*scale, SRCCOPY);
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
        let lastCursor = SetCursor(icon); //icons technically cursors! -> https://learn.microsoft.com/en-us/windows/win32/menurc/using-cursors#creating-a-cursor           // SendMessage(hwnd, WM_SETCURSOR, CURSOR_, icon);
        DestroyIcon(lastCursor);
        DeleteObject(maskBmp);
        DeleteObject(bmp);
        ReleaseDC(hwnd, dc);
    }
}

const wc = CreateWindowClass("winclassniggasfaze", windowProc); //max classname length is 256 lol
wc.hCursor = LoadCursor(NULL, IDC_HAND);//LoadIcon(NULL, IDI_APPLICATION); //haha just learned that you can use icons instead
wc.hbrBackground = CreateSolidBrush(RGB(0,255,0));

CreateWindow(WS_EX_LAYERED | WS_EX_TOOLWINDOW | WS_EX_TOPMOST, wc, "", WS_BORDER | WS_POPUP | WS_VISIBLE, position.x, position.y, 256*scale, 256*scale, NULL, NULL, hInstance); //now the window is only as big as the faze logo (therefore lagging my computer less)
//"For best drawing performance by the layered window and any underlying windows, the layered window should be as small as possible. An application should also process the message and re-create its layered windows when the display's color depth changes" https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-updatelayeredwindow https://learn.microsoft.com/en-us/previous-versions/ms997507(v=msdn.10)?redirectedfrom=MSDN