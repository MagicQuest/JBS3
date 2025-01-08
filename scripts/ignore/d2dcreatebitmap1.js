let w = 500;
let h = 500;

let d2d, bmp;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1DeviceContext, hwnd);

        const bmpwidth = 2;
        const bmpheight = 2;

        const bits = new Uint32Array([
            0xffff0000,
            0xc000ff00,
            0x800000ff,
            0x40000000,
        ]);
        const pitch = 4*bmpwidth; //4*width because 4 is the number of channels in the image (and each channel takes 1 byte)

        bmp = d2d.CreateBitmap1(bmpwidth, bmpheight, D2D1_BITMAP_OPTIONS_NONE, NULL, NULL, bits, pitch);  //:3 you couldn't use Uint32Array bits before!
    }else if(msg == WM_PAINT) {
        d2d.BeginDraw();
        d2d.Clear(0.0, 0.0, 0.0);
        d2d.DrawBitmap(bmp, 0, 0, w, h);
        d2d.EndDraw();
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}


const wc = CreateWindowClass("winclass", windowProc);

wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "create bitmap indirect testing", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);