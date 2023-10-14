
const troll = LoadImage(NULL, __dirname+"/troll.bmp", IMAGE_BITMAP, 0, 0, LR_SHARED | LR_LOADFROMFILE | LR_MONOCHROME);
const trollIco = HICONFromHBITMAP(troll);

//print(troll, _com_error(GetLastError()));

const mask = CreateBitmap(220, 183, 1);

const width = 220+16;
const height = 183+39;

//function init(hwnd) {
//    //const dc = GetDC(hwnd);
//    //const memDC = CreateCompatibleDC(dc);
//    //SelectObject(memDC, mask);
//    ////SelectObject(memDC, GetStockObject(DC_BRUSH));
//    ////SetDCBrushColor(memDC, RGB(255,255,255));
//    //FillRect(memDC, 0, 0, 220, 183, NULL);
//    //ReleaseDC(hwnd, dc);
//
//    InvalidateRect(hwnd, 0, 0, width, height, true);
//    UpdateWindow(hwnd); //draw immediately
//}

let mouse = {x: -5, y: -5};

function updateMask(dc) {
    const memDC = CreateCompatibleDC(dc);
    SelectObject(memDC, mask);
    FillRect(memDC, mouse.x-10, mouse.y-10, mouse.x+10, mouse.y+10, NULL);
    DeleteDC(memDC);
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        print(hwnd, msg, wp, lp, "INIT! WM_CREATE?");
        InvalidateRect(hwnd, 0, 0, width, height, true);
        UpdateWindow(hwnd); //draw immediately
    }else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);

        updateMask();

        const memDC = CreateCompatibleDC(ps.hdc);
        SelectObject(memDC, troll);

        //BitBlt(ps.hdc, 0, 0, 220, 183, memDC, 0, 0, SRCCOPY);
        //print(MaskBlt(ps.hdc,0,0, 220, 183, memDC,0,0,mask, 0, 0, MAKEROP4(SRCCOPY, 0x00AA0029)), _com_error(GetLastError())); //forgot to add MAKEROP4 as a function and v8 didn't say SHIT he just smiled and waved (yo my power just turned off for a SPLIT second and my computer is still on lets go) (haha i forgot to build it)
        MaskBlt(ps.hdc,0,0, 220, 183, memDC,0,0,mask, 0, 0, MAKEROP4(SRCCOPY, 0x00AA0029));

        DeleteDC(memDC);
        EndPaint(hwnd, ps);
    }else if(msg == WM_LBUTTONDOWN) {
        SetCapture(hwnd);
        let rect = GetWindowRect(hwnd);
        //ClipCursor(rect.left, rect.top, rect.right, rect.bottom); //yo this scared me i didn't expect it to actually do that
    }else if(msg == WM_MOUSEMOVE) {
        
        //print(wp, MAKEPOINTS(lp));
        //if(GetKey(VK_LBUTTON)) { //works but not required
        if(wp & MK_LBUTTON) { //works even if holding shift or sumn
            //print("MOUSEDOWNMOVING");
            //const dc = GetDC(hwnd);
            //const memDC = CreateCompatibleDC(dc);
            //SelectObject(memDC, mask);
            ////SelectObject(memDC, GetStockObject(DC_BRUSH));
            ////SetDCBrushColor(memDC, RGB(255,255,255)); //optional because apparently passing NULL as the brush is already white
            //FillRect(memDC, mouse.x-5, mouse.y-5, mouse.x+5, mouse.y+5, NULL);
            //ReleaseDC(hwnd, dc);
            //DeleteDC(memDC); //oh shoot it wasn't working because i forgot to delete
            
            mouse = MAKEPOINTS(lp);

            InvalidateRect(hwnd, 0, 0, width, height, false); //oh the flickering was caused by me erasing the window by setting the last value to true
            UpdateWindow(hwnd); //draw immediately        
        }
    }else if(msg == WM_KEYDOWN) {
        if(wp == VK_ESCAPE) {
            DestroyWindow(hwnd);
        }
    }else if(msg == WM_DESTROY) {
        PostQuitMessage();
    }else if(msg == WM_LBUTTONUP) {
        SendMessage(hwnd, WM_SETICON, ICON_SMALL, trollIco); //ok i didn't have to do all that
        ReleaseCapture();
        ClipCursor(NULL);
        //let lastIcon = SendMessage(hwnd, WM_SETICON, ICON_SMALL, HICONFromHBITMAP(troll)); //might be causing a leak if you do this like 100000 times
        //if(lastIcon) {
        //    DeleteObject(lastIcon); //if last icon was not 0 then it was probably the last troll face icon lol
        //}
    }
}

const winclass = CreateWindowClass("WinClass", /*init, */windowProc);
winclass.hIcon = winclass.hIconSm = LoadIcon(NULL, IDI_APPLICATION);
winclass.hbrBackground = COLOR_BACKGROUND;
winclass.hCursor = LoadCursor(NULL, IDC_ARROW);
print(winclass);
CreateWindow(WS_EX_OVERLAPPEDWINDOW, winclass, "Drag click to reveal a bitmap!", WS_CAPTION | WS_SYSMENU | WS_VISIBLE, screenWidth/2-width/2, screenHeight/2-height/2, width, height, 0, 0, hInstance);