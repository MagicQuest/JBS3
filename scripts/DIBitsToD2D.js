const w = 500;
const h = 500;

let wic, d2d, d2dBmpFromBits, d2dBmpSetBits, d2dBmpFromTestBits, d2dShowBmp;
let dc;
let d2dbitdepthbits, d2ddibitstest;

function ARGB(a, r, g, b) {
    //calculate the factor by which we multiply each component 
    const fAlphaFactor = a / 0xff; //no premultiply this time (wait i should just use this inline instead of making a function here)
    // multiply each pixel by fAlphaFactor, so each component  
    // is less than or equal to the alpha value.
    return (a << 24) | (b * fAlphaFactor) << 16 | (g * fAlphaFactor) << 8 | (r * fAlphaFactor); //wait the actual RGB is bgr no alpha (bruh this whole thing has me CONFUSED)
}

let b = ARGB(255, 255, 0, 0); //the red and blue channels are flipped when drawing dibits so the color (0x000000ff) (as seen through gdi 0xAABBGGRR is full red) but when interpreted by dibits it becomes (0xAARRGGBB which now makes it full blue when drawn)
let g = ARGB(128, 0, 255, 0);
let r = ARGB(255, 0, 0, 255);

print(b & 0xff, GetRValue(b));

const dibits = new Uint32Array([b, r, b, r, g, r, b, r, b]);

//const gdibmp = LoadImage(NULL, __dirname+"/bitdepth.bmp", IMAGE_BITMAP, 0, 0, LR_LOADFROMFILE); //for some reason this is the only bitmap i have that's 32 bits with alpha (oh shoot apparently i shouldn't be using LR_SHARED with LR_LOADFROMFILE)

//ok it has come to my attention that LoadImage does not like 32bpp bitmaps so i MIGHT have to use wic to load one (like i did in createdibsection.js) unfortunately

//const bmpdim = GetBitmapDimensions(gdibmp);
//const trollDIB = LoadImage(NULL, __dirname+"/minesweeper/troll.ico", IMAGE_ICON, 0, 0, LR_LOADFROMFILE); //nevermind troll.ico has alpha too!
//LR_CREATEDIBSECTION returns the pointer to a dibsection so im gonna use GetDIBits to get those shits (bars) (wait nevermind hold on)

//print(trollDIB, "where my shit at", gls=GetLastError(), _com_error(gls));

//const dc = GetDC(NULL);
//print("siht", GetBitmapDimensions(gdibmp));
//print(GetBitmapDimensionEx(gdibmp))
//const bits = GetDIBits(dc, bitdepthbmp, 0, );
//print(bits);

function DIBitsToB8G8R8A8(width, dibits) {
    const BGRA = new Uint8Array(dibits.length*4);

    for(let i = 0; i < dibits.length; i++) {
        const pixel = dibits[i];
        const j = i*4;
        //remember, the colors in dibits are 0xAARRGGBB but are swapped (treated as 0xAABBGGRR) when drawing so to get the right color here i have to swap (red and blue) now
        let b = GetRValue(pixel); //(pixel) & 0xff
        let g = GetGValue(pixel); //(pixel >> 8) & 0xff
        let r = GetBValue(pixel); //(pixel >> 16) & 0xff
        let a = (pixel >> 24) & 0xff; //oh yeah the alpha's coming through
        BGRA[j] = b;
        BGRA[j+1] = g;
        BGRA[j+2] = r;
        BGRA[j+3] = a;
    }

    //well since i don't add any padding the pitch should just be the width of the bitmap in bytes

    return {pitch: width*4, bits: BGRA}; //pitch is the width*4 because there are 4 values per pixel [B, G, R, A] and `width` amount of pixels per column
}

const screen = GetDC(NULL);

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        wic = InitializeWIC(); ScopeGUIDs(wic);
        d2d = createCanvas("d2d", ID2D1DeviceContext, hwnd); //i gotta use ID2D1DeviceContext>= to use SetTarget
        dc = GetDC(hwnd);
        //mi fa so -> ti so re mi
        const wicBitmap = wic.LoadBitmapFromFilename(__dirname+"/bitdepth.bmp", wic.GUID_WICPixelFormat32bppPBGRA, 0);
        const {width, height} = wicBitmap.GetSize();
        dib = CreateDIBSection(dc, CreateDIBitmapSimple(width, -height), DIB_RGB_COLORS); //biSizeImage can be 0 for uncompressed rgb bitmaps (negative height flips the bitmap)
        print(dib);
        dib.SetBits(wicBitmap.GetPixels(wic));

        wicBitmap.Release();
        wic.Release();

        d2dbitdepthbits = DIBitsToB8G8R8A8(width, new Uint32Array(dib.GetBits().buffer.transfer())); //back in the day, GetBits used to return a Uint32Array and now it returns a Uint8Array! (since i don't want that we'll just "translate" it back to Uint32 here!)
        d2dBmpFromBits = d2d.CreateBitmap1(width, height, D2D1_BITMAP_OPTIONS_NONE, NULL, NULL, d2dbitdepthbits.bits, d2dbitdepthbits.pitch);
        
        d2ddibitstest = DIBitsToB8G8R8A8(3, dibits);
        d2dBmpFromTestBits = d2d.CreateBitmap1(3, 3, D2D1_BITMAP_OPTIONS_NONE, NULL, NULL, d2ddibitstest.bits, d2ddibitstest.pitch);
        
        d2dBmpSetBits = d2d.CreateBitmap1(width, height, D2D1_BITMAP_OPTIONS_CPU_READ | D2D1_BITMAP_OPTIONS_CANNOT_DRAW, NULL, NULL, NULL, NULL);
        
        d2dShowBmp = d2d.CreateBitmap(width, height); //in order to show d2dBmpSetBits i gotta copy into this bitmap

        //delete d2dbitdepthbits;

        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        let data = d2dBmpSetBits.Map(D2D1_MAP_OPTIONS_READ); //yeah i think msdn says you can't use write https://learn.microsoft.com/en-us/windows/win32/api/d2d1_1/ne-d2d1_1-d2d1_map_options?redirectedfrom=MSDN#remarks
        data.SetBits(d2dbitdepthbits.bits); //oh wow setbits still works though even if you only open it with read? (wait how is this even working i didn't account for pitch or tell it what the pitch was)
        d2dBmpSetBits.Unmap();

        d2dShowBmp.CopyFromBitmap(0, 0, d2dBmpSetBits, 0, 0, 64, 64);

        d2d.BeginDraw();
        d2d.Clear(0.5, 0.5, 0.5, 1.0);
        d2d.DrawBitmap(d2dBmpFromBits, 0, 0, w/2, h/2, 1.0, NULL, 0, 0, 64, 64);
        d2d.DrawBitmap(d2dBmpFromTestBits, w/2, 0, w, h/2, 1.0, NULL, 0, 0, 3, 3);
        d2d.DrawBitmap(d2dShowBmp, w/2, h/2, w, h, 1.0, NULL, 0, 0, 64, 64); //how is this one drawing correctly im kinda suprised
        d2d.EndDraw();

        StretchDIBits(screen, 0, 0, w/2, h/2, 0, 0, 3, 3, dibits, 3, 3, 32, BI_RGB, SRCCOPY);
        //const memDC = CreateCompatibleDC(dc);
        //SelectObject(memDC, gdibmp);
        //BitBlt(dc, 0, 0, bmpdim.width, bmpdim.height, memDC, 0, 0, SRCCOPY);
        //DeleteDC(memDC);
    }
    else if(msg == WM_DESTROY) {
        d2d.Release();
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "hopefully this one works", WS_OVERLAPPEDWINDOW | WS_VISIBLE, 500, 500, w+20, h+43, NULL, NULL, hInstance);