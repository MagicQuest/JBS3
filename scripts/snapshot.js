const width = screenWidth/2;
const height = screenHeight/2;
let wic, snapshot, rotation = NULL;
let i = 1;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        wic = InitializeWIC(); ScopeGUIDs(wic);

        impact = CreateFontSimple("impact", 20, 40);
        button = CreateWindow(NULL,"BUTTON", "take a snapshot", WS_CHILD | WS_VISIBLE, width/2 - (height/8), height-height/4, width/4, height/8, hwnd, 1, hInstance)
        button2 = CreateWindow(NULL,"BUTTON", "rotate!", WS_CHILD | WS_VISIBLE, width/2 - (height/8), (height-height/4)+(height/8), width/4, height/8, hwnd, 2, hInstance)
        SendMessage(button, WM_SETFONT, impact, true); //lol
        SendMessage(button2, WM_SETFONT, impact, true); //lol

        //InvalidateRect(hwnd, 0, 0, width, height, true);
        //UpdateWindow(hwnd); //draw immediately
        RedrawWindow(hwnd, 0, 0, width, height, NULL, RDW_INVALIDATE | RDW_UPDATENOW); //redraw window doesn't work in wm_create? (nah you have to use BeginPaint for it to work?)
        //SetTimer(hwnd, 0, 16);
    }else if(msg == WM_PAINT) {
        //const dc = GetDC(hwnd);
        const ps = BeginPaint(hwnd);
        const dc = ps.hdc;
        if(snapshot) {
            //SetStretchBltMode(dc, HALFTONE); //not setting the stretch blt mode gives some weird results when you rotate it (some how it starts reading pixels from task manager, obs, and resmon)
            //if(rotation == WICBitmapTransformRotate90 || rotation == WICBitmapTransformRotate270) {
                //snapshot.Resize(wic, screenWidth, screenHeight); 
            //    StretchDIBits(dc, 0, 0, width/2, height/2, 0, 0, screenHeight, screenWidth, snapshot.GetPixels(wic, rotation), screenHeight, screenWidth, 32, BI_RGB, SRCCOPY);
            //}else {
                                                                                            //idk why it doesn't like the rotation
                StretchDIBits(dc, width/4, height/4, width/2, height/2, 0, 0, screenWidth, screenHeight, snapshot.GetPixels(wic, rotation), screenWidth, screenHeight, 32, BI_RGB, SRCCOPY);
            //}
        }else {
            let last = SelectObject(dc, GetDefaultFont());
            TextOut(dc, 100, 100, "CLICK TAKE A SNAPSHOT FOR INFINITE WEALTH :) 😩😩🔫");
            SelectObject(dc, last);
        }
        //ReleaseDC(hwnd, dc);
        EndPaint(hwnd, ps);
    }else if(msg == WM_COMMAND) {
        //handles button clicks and shit like that
        if(wp == 1) {
            //if(!snapshot) {
                const dc = GetDC(NULL);
                const temp = CreateBitmap(screenWidth, screenHeight, 32, NULL);
                const memDC = CreateCompatibleDC(dc);
                SelectObject(memDC, temp);
                BitBlt(memDC, 0, 0, screenWidth, screenHeight, dc, 0, 0, SRCCOPY); //copies the screen to the temp bitmap through memDC
                DeleteDC(memDC);
                ReleaseDC(NULL, dc);
                if(snapshot) {
                    snapshot.Release();
                }
                snapshot = wic.CreateBitmapFromHBITMAP(temp, NULL, WICBitmapIgnoreAlpha, wic.GUID_WICPixelFormat32bppPBGRA);
            //}
        }else {
            const options = [WICBitmapTransformRotate0, WICBitmapTransformRotate90, WICBitmapTransformRotate180, WICBitmapTransformRotate270, WICBitmapTransformFlipVertical, WICBitmapTransformFlipHorizontal];
            rotation = options[i];
            //wait wait does rotating actually change the height and width of the image??
            i++; i = i%options.length;
        }
        RedrawWindow(hwnd, 0, 0, width, height, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_HAND);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "newwicfuncs2?", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, width+20, height+43, NULL, NULL, hInstance);