//just researched UpdateLayeredWindow https://www.nuonsoft.com/blog/2009/05/27/how-to-use-updatelayeredwindow/
//yeah nevermind idk what to do aboot this one
//if i used Gdi+ then it might work so i might add support for that one at some point but im out for now
//(i need Gdi+ so i can read pngs/transparent images) also -> https://www.vbforums.com/showthread.php?888761-UpdateLayeredWindow()-Drove-Me-Crazy
//https://stackoverflow.com/questions/9748142/my-code-which-uses-updatelayeredwindow-doesnt-work
//https://www.youtube.com/watch?v=kEBja3DcbTI
//https://learn.microsoft.com/en-us/previous-versions/ms997507(v=msdn.10)?redirectedfrom=MSDN
//https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-updatelayeredwindow

let d2d;//, keyBrush;
const pngs = [];

let window;

let position = {x: 500, y: 500};

let frame = 0;
let speed = 1;
let scale = 1;

const screen = GetDC(NULL);

function drawHBMToDC(dc, memDC, x, y) {
    const memDC2 = CreateCompatibleDC(dc);
    SelectObject(memDC2, pngs[Math.floor(frame)]);
    StretchBlt(memDC, 0, 0, x, y, memDC2, 0 , 0, 256, 256, SRCCOPY);
    DeleteDC(memDC2);
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {  
        //SetLayeredWindowAttributes(hwnd, RGB(0,255,0), 0, LWA_COLORKEY); //replaced with updatelayeredwindow later
        const wic = InitializeWIC();
        ScopeGUIDs(wic);
        for(let i = 1; i < 25; i++) {
            print(`${__dirname}/hdpng00${i < 10 ? "0"+i : i}.png`);
            //pngs.push(d2d.CreateBitmapFromFilename(`${__dirname}/hdpng00${i < 10 ? "0"+i : i}.png`)); //oof i MIGHT need gdi+ for this one NOOOO
            const wicBitmap = wic.LoadBitmapFromFilename(`${__dirname}/hdpng00${i < 10 ? "0"+i : i}.png`, wic.GUID_WICPixelFormat32bppPBGRA, 0);
            pngs.push(CreateBitmap(256, 256, 32, wicBitmap.GetPixels(wic)));
            wicBitmap.Release();
        }
        wic.Release();

        InvalidateRect(hwnd, 0, 0, 256*scale, 256*scale, true);
        UpdateWindow(hwnd); //draw immediately

        SetTimer(hwnd, 1, 32); //~30 fps (1000/32) because it starts destroying shit at 60 (16ms)
    }else if(msg == WM_KEYDOWN) {
        if(wp == VK_ESCAPE) {
            DestroyWindow(hwnd);
        }
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        for(const png of pngs) {
            //png.Release();
            DeleteObject(png);
        }
    }else if(msg == WM_PAINT) { //wow this actually works like a charm
        const rect = GetWindowRect(hwnd);

        const dc = GetDC(NULL); //for some reason it doesn't use the hwnd's DC AT ALL?
        const memDC = CreateCompatibleDC(dc);
        //const memDC2 = CreateCompatibleDC(dc);
        //SelectObject(memDC2, hbm.bitmap);
        const newBitmap = CreateCompatibleBitmap(dc, 256*scale, 256*scale); //ok i have NO IDEA WHY you have to create a compatible bitmap, draw the real bitmap (hbm.bitmap) into the compatible bitmap and use THAT memDC for UpdateLayeredWindow
        const oldBitmap = SelectObject(memDC, newBitmap);
        
        //drawHBMToNew(dc, memDC);
        drawHBMToDC(dc, memDC, 256*scale, 256*scale);

        //TextOut(memDC, 50, 50, "🥴🥴🥴🥴🥴🥴🥴🗣️🧏‍♂️🤫 GYATT");
        //paint(memDC); //paint into memDC so it shows up in UpdateLayeredWindow()
    
        UpdateLayeredWindow(hwnd, dc, {x: rect.left, y: rect.top}, {width: 256*scale, height: 256*scale}, memDC, {x: 0, y: 0}, RGB(0,0,0), 255, AC_SRC_ALPHA, ULW_ALPHA);
        //print(UpdateLayeredWindow(hwnd, dc, {x: rect.left, y: rect.top}, {width: windowWidth, height: windowHeight}, memDC, {x: 0, y: 0}, RGB(0,0,0), 255, AC_SRC_ALPHA, ULW_ALPHA), GetLastError(), _com_error(GetLastError()));
        SelectObject(memDC, oldBitmap);
        DeleteObject(newBitmap);
        DeleteDC(memDC);
        //DeleteDC(memDC2);
        ReleaseDC(NULL, dc);    
    }else if(msg == WM_TIMER) {
        let movewindow = false;
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
        }else if(GetKey(VK_DOWN)) {
            scale -= .1;
            
            movewindow = true;
        }
        if(movewindow) {
            SetWindowPos(hwnd, HWND_TOPMOST, position.x, position.y, 256*scale, 256*scale, SWP_NOZORDER);
        }
        //let e = GetDC(hwnd);
        //ReleaseDC(hwnd, e);
        //make icon/cursor
        RedrawWindow(hwnd, 0, 0, 256*scale, 256*scale, NULL,RDW_INVALIDATE | RDW_UPDATENOW);
        frame = (frame+speed)%24;
        
        //everything beyond this is creating an icon as a cursor when you hover over the logo
        const dc = GetDC(hwnd);
        //UpdateLayeredWindow(hwnd, screen, NULL, {width: 256*scale, height:256*scale}, dc, {x:0,y:0}, RGB(0,255,0), 255, 0, ULW_COLORKEY);
        const bmp = CreateCompatibleBitmap(dc, 128*scale, 128*scale);
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, bmp);
        //SetStretchBltMode(memDC, HALFTONE); //weirdly this gets rid of the alpha
        drawHBMToDC(dc, memDC, 128*scale, 128*scale);
        //BitBlt(memDC, 0, 0, 256*scale, 256*scale, dc, position.x, position.y, SRCCOPY); //too big LOL
        //SetStretchBltMode(memDC, HALFTONE);
        //StretchBlt(memDC, 0, 0, 32, 32, dc, 0, 0, 256*scale, 256*scale, SRCCOPY);
        const maskBmp = CreateCompatibleBitmap(dc, 128*scale, 128*scale); //empty mask bmp -> https://learn.microsoft.com/en-us/windows/win32/menurc/using-cursors#creating-a-cursor
        //const memMaskDC = CreateCompatibleDC(dc);
        //SelectObject(memMaskDC, maskBmp);
        //    //SelectObject(memDC, GetStockObject(DC_BRUSH));
        //    //FillRect(memDC, 0, 0, 20, 20, NULL);                  //can't get the mask to work for some reason ;( (NEVERMIND https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createiconindirect) I HAD TO DESELECT THE MASK FROM THE MEMDC (or DELETE THE DC)
        //TransparentBlt(memMaskDC, 0, 0, 32, 32, memDC, 0, 0, 32, 32, RGB(0,255,0));
        //BitBlt(dc, 32, 32, 32, 32, memMaskDC, 0, 0, SRCCOPY); //if i really wanted transparency i think i'd have to create a DIB section and manipulate the pixels and idk even know if CreateDIBSection works in JBS so nah 
        //DeleteDC(memMaskDC);
        DeleteDC(memDC); //i ain't leaking NO MEMORY
        const icon = CreateIconIndirect({fIcon: false, xHotspot: (128*scale)/2, yHotspot: (128*scale)/2, hbmMask: maskBmp, hbmColor: bmp});
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

CreateWindow(WS_EX_LAYERED | WS_EX_TOPMOST, wc, "", WS_BORDER | WS_POPUP | WS_VISIBLE, position.x, position.y, 256*scale, 256*scale, NULL, NULL, hInstance); //now the window is only as big as the faze logo (therefore lagging my computer less)
//"For best drawing performance by the layered window and any underlying windows, the layered window should be as small as possible. An application should also process the message and re-create its layered windows when the display's color depth changes" https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-updatelayeredwindow https://learn.microsoft.com/en-us/previous-versions/ms997507(v=msdn.10)?redirectedfrom=MSDN