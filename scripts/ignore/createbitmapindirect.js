//no lie i think i wrote createbitmapindirect really inefficiently so lets test and see if it's even right first

let w = 500;
let h = 500;

let BITMAP, hbm, hbm2;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        //ok why the hell is CreateBitmapIndirect BGRA
        //but CreateBitmap is ARGB????
        //OHHHH IM WRONG!                                                                    0xAARRGGBB                               B  G  R    A
        //when using a Uint32Array, the whole thing is flipped (i guess?) so a Uint32Array's 0xffff0000 is drawn like a Uint8Array's [0, 0, 255, 255] 
        //OR (theory) javascript flips the bytes because it uses a different endianness (aw shit... this one might be true)
        //all this confusion MIGHT be caused by javascript and NOT gdi!

        //ok to recap: when making a Uint8Array it is B, G, R, A
        //when making a Uint32Array it is 0xAARRGGBB (because javascript flips the values)
        
        //both cbibits and cbbits are identical but they use 2 different objects to hold the data

        const cbibits = new Uint8Array([ //CreateBitmapIndirect is 0xBBGGRRAA!
            //B, G, R, A
            0, 0, 255, 255,
            0, 255, 0, 192,

            255, 0, 0, 128,
            0, 0, 0, 64,
        ]);
        
        BITMAP = {
            //bmType: 0,
            bmWidth: 2,
            bmHeight: 2,
            bmWidthBytes: 8, //(bmBitsPixel / 8)*bmWidth         the reason bmBitsPixel divided by 8 is that each unsigned int is 8 bits (32 unsigned ints used to denote the color of the pixel (ARGB))
            bmPlanes: 1,
            bmBitsPixel: 32,
            bmBits: cbibits,
        };
        hbm = CreateBitmapIndirect(BITMAP);
        //hbm = CreateBitmap(BITMAP.bmWidth, BITMAP.bmHeight, BITMAP.bmBitsPixel, bits); //gotta make sure these bits are correct lol

        const cbbits = new Uint32Array([
            //0xAARRGGBB                                                                                  B  G  R    A
            0xffff0000, //Uint32Array swizzles these values so the equivalent Uint8Array would look like [0, 0, 255, 255]
            0xc000ff00,
            0x800000ff,
            0x40000000,
        ]);

        hbm2 = CreateBitmap(2, 2, 32, cbbits);
    }else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);

        print("painting now...");

        const memDC = CreateCompatibleDC(ps.hdc);
        SelectObject(memDC, hbm);
        //StretchBlt(ps.hdc, 0, 0, w, h, memDC, 0, 0, BITMAP.bmWidth, BITMAP.bmHeight, SRCCOPY);
        AlphaBlend(ps.hdc, 0, 0, w/2, h/2, memDC, 0, 0, BITMAP.bmWidth, BITMAP.bmHeight, 255, AC_SRC_ALPHA);
        
        SelectObject(memDC, hbm2);
        AlphaBlend(ps.hdc, w/2, h/2, w/2, h/2, memDC, 0, 0, BITMAP.bmWidth, BITMAP.bmHeight, 255, AC_SRC_ALPHA); //lol assuming they're the same size
        //StretchBlt(ps.hdc, w/2, h/2, w, h, memDC, 0, 0, BITMAP.bmWidth, BITMAP.bmHeight, SRCCOPY);

        DeleteDC(memDC);

        EndPaint(hwnd, ps);
    }
    else if(msg == WM_DESTROY) {
        DeleteObject(hbm);
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);

wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "create bitmap indirect testing", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);