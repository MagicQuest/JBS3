const w = 512;
const h = 512;

let dc, bmp;

const b = RGB(255,0,0); //stretchdibits is bgr! (red is swapped with blue so RGB(255, 0, 0) is full blue instead of red!) https://stackoverflow.com/questions/12908685/wrong-colors-when-using-stretchdibits
const g = RGB(0,255,0);
const r = RGB(0,0,255);

const image = new Uint32Array([b, r, b, r, g, r, b, r, b]); //3x3 https://stackoverflow.com/questions/53958727/performance-efficient-way-of-setting-pixels-in-gdi
const imgwidth = 3;
const imgheight = 3;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        dc = GetDC(hwnd);
        bmp = CreateCompatibleBitmap(dc, imgwidth, imgheight);
        //let dibsection = CreateDIBSection(dc, CreateDIBitmapSimple(imgwidth, -imgheight, 32), DIB_RGB_COLORS);
        //dibsection.SetBits(image);
        print(SetDIBits(dc, bmp, 0, imgheight, image, CreateDIBitmapSimple(imgwidth, -imgheight, 32), DIB_RGB_COLORS)); //SetDIBits takes a compatible bitmap as its second argument
        //SetDIBits(dc, bmp, 0, imgheight, dibsection); //oh yeah now if you are using a dibsection you don't have to put allat
        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        //StretchDIBits(dc, 0, 0, w, h, 0, 0, imgwidth, imgheight, image, imgwidth, imgheight, 32, BI_RGB, SRCCOPY);
        
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, bmp);
        //SetDIBits(dc, bmp, 0, imgheight, image, CreateDIBitmapSimple(imgwidth, -imgheight, 32), DIB_RGB_COLORS)
        StretchBlt(dc, 0, 0, w, h, memDC, 0, 0, imgwidth, imgheight, SRCCOPY);
        //BitBlt(dc, 0, 0, imgwidth, imgheight, memDC, 0, 0, SRCCOPY);
        DeleteDC(memDC);
    }
    else if(msg == WM_DESTROY) {
        ReleaseDC(hwnd, dc);
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "just added SetDIBits", WS_OVERLAPPEDWINDOW | WS_VISIBLE, 500, 500, w+20, h+43, NULL, NULL, hInstance);