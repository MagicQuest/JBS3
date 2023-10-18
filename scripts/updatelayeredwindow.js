//yeah idk how this works so we about to find out!

const screen = GetDC(NULL);

let windowBmp;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        //SetLayeredWindowAttributes(hwnd, RGB(0,255,0), 0, LWA_COLORKEY);

        const dc = GetDC(hwnd);
        //wait a minute i might not need CreateDIBSection
        const bmi = {};
        bmi.bmWidth = 500;
        bmi.bmHeight = 500;
        bmi.bmWidthBytes = ((500*32+31)/32)*4; //https://stackoverflow.com/questions/29039289/bmwidthbytes-unexpected-size-monochromatic-bitmap ??
        bmi.bmPlanes = 1;
        bmi.bmBitsPixel = 32;
        bmi.bmBits = new ArrayBuffer(1000000);
        for(let i = 0; i < 1000000; i++) { //got 1000000 from ((((nWidth * nPlanes * nBitCount + 15) >> 4) << 1) * nHeight) //https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createbitmap
            bmi.bmBits[i] = 0x00;
        }
        windowBmp = CreateBitmapIndirect(bmi);
        print(GetObjectHBITMAP(windowBmp).bmBits.byteLength, "DMBIT");
        //const bmih = {};
        //bmih.biWidth = 500;
        //bmih.biHeight = 500;
        //bmih.biPlanes = 1;
        //bmih.biBitCount = 32;
        //bmih.biCompression = BI_RGB;
        //bmih.biSizeImage = 500*500*32;
//
        //windowBmp = CreateDIBSection(dc, bmih, DIB_RGB_COLORS);
        //const memDC = CreateCompatibleDC(dc);
        //SelectObject(memDC, windowBmp);
        ////print(SetPixelV(memDC, RGB(255,255,255)), "Dababy"); //RGB(255,255,255) is equal to 0xFFFFFF i think LO!L
        //StretchBlt(memDC, 0, 0, 500, 500, screen, 0, 0, 1920, 1080, SRCCOPY);
        //BitBlt(screen, 0, 0, 500, 500, memDC, 0, 0, SRCCOPY);
        //DeleteDC(memDC);
        //print(GetObjectDIBITMAP(windowBmp));
        ReleaseDC(dc);
    }else if(msg == WS_DESTROY) {
        PostQuitMessage();
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = CreateSolidBrush(RGB(0,255,0));
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_TOPMOST, wc, "", WS_POPUP | WS_BORDER | WS_VISIBLE, 500, 500, 500, 500, NULL, NULL, hInstance);