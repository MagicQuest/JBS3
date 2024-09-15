//this one is also based off a a project i made to test dcomposition (it's way less laggy than this one though)
//lowkey idk what it is but something about this stops you from going to your desktop, if you hit Windows+D it does NOT like that (wait now it worked idk what's happening)

let d2d, gaussianBlur, desktopBmp, desktopBackgroundBmp;

let window = false;

function initBackgroundBmp(hwnd) {
    const dc = GetDC(hwnd);
    
    const tempBackground = CreateDIBSection(dc, CreateDIBitmapSimple(screenWidth, -screenHeight), DIB_RGB_COLORS);//nah this gotta be a dib section or whatever so i can transfer the bits to a d2d bitmap (rubbing hands together)
    
    const tempDC = CreateCompatibleDC(dc);
    SelectObject(tempDC, tempBackground); //i think i forgot enough times to where if you pass the object for a dibsection (tempBackground) it will work anyways instead of having to do tempBackground.bitmap
    print(PaintDesktop(tempDC) == 1);

    //print(tempBackground);

    desktopBackgroundBmp.CopyFromMemory(0, 0, screenWidth, screenHeight, tempBackground.GetBits());//tempBackground._bits); //LO! (wait _bits is just a pointer to the location?!)

    DeleteDC(tempDC);
    ReleaseDC(hwnd, dc);
    DeleteObject(tempBackground);
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1DeviceContextDComposition, hwnd);  //DComposition
        //brush = d2d.CreateSolidColorBrush(1.0, 1.0, 0.0);
        gaussianBlur = d2d.CreateGaussianBlurEffect();
        gaussianBlur.SetStandardDeviation(10.0);
        gaussianBlur.SetBorderMode(D2D1_BORDER_MODE_HARD);

        d2d.SetDCompEffect(gaussianBlur);
        d2d.Commit(); //you gotta commit after applying an effect

        desktopBmp = d2d.CreateBitmap(screenWidth, screenHeight);

        //doing some bullshit here
        desktopBackgroundBmp = d2d.CreateBitmap(screenWidth, screenHeight);
        initBackgroundBmp(hwnd);

        SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE); //MY GOAT
        
        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER || msg == WM_MOVE) {
        d2d.BeginDraw();

        d2d.Clear(0.0, 0.0, 0.0, 0.0);

        let {left, top, right, bottom} = GetWindowRect(hwnd);
        let {width, height} = d2d.GetSize();

        //brush.SetColor(1.0, 1.0, 0.0);

        if(!window) {
            d2d.AcquireNextFrame(desktopBmp); //ONLY WORKS WITH D2D11
            //print(left, top);
            d2d.DrawBitmap(desktopBmp, -left-8, -top-31, -left+screenWidth-8, -top+screenHeight-31); //weird math
        }else {
            d2d.DrawBitmap(desktopBackgroundBmp, -left-8, -top-31, -left+screenWidth-8, -top+screenHeight-31); //weird math
        }

        d2d.EndDraw();
    }else if(msg == WM_SIZE) {
        let [width, height] = [LOWORD(lp), HIWORD(lp)];
        d2d.Resize(width, height);
    }else if(msg == WM_MOUSEMOVE) {
        if((wp & MK_LBUTTON) == MK_LBUTTON) {
            let {left, top, right, bottom} = GetClientRect(hwnd);
            print((LOWORD(lp)/right)*100);
            gaussianBlur.SetStandardDeviation((LOWORD(lp)/right)*100);
            d2d.Commit(); //commit after changing effects
        }
    }else if(msg == WM_RBUTTONDOWN) {
        window = !window;
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        //brush.Release();
        gaussianBlur.Release();
        desktopBmp.Release();
        d2d.Release();
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_HAND);
    //for DirectComposition you NEED to specify WS_EX_NOREDIRECTIONBITMAP
window = CreateWindow(WS_EX_NOREDIRECTIONBITMAP, wc, "diy dwm blur (d2d11desktopduplication.js) - right click for desktop", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 512+20, 512+42, NULL, NULL, hInstance);