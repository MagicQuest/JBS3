//a lot of things related to AlphaBlend recommend using FreeImage for loading pngs with alpha but i think WIC can do that nowadays so we straight but just in case -> http://jwezorek.com/2012/02/blitting-with-per-pixel-in-alpha-in-win32/

class Bitmap {
    constructor(dc, bmp) {
        this.dc = dc;
        this.bmp = bmp;
    }

    draw(callback) {
        const memDC = CreateCompatibleDC(this.dc);
        const last = SelectObject(memDC, this.bmp);
        callback(memDC);
        SelectObject(memDC, last);
        DeleteDC(memDC);
    }
}

function RGBA(r, g, b, a) {
    //calculate the factor by which we multiply each component 
    const fAlphaFactor = a / 0xff; 
    // multiply each pixel by fAlphaFactor, so each component  
    // is less than or equal to the alpha value.
    return (a << 24) | (r * fAlphaFactor) << 16 | (g * fAlphaFactor) << 8 | (b * fAlphaFactor); //from this example https://learn.microsoft.com/en-us/windows/win32/gdi/alpha-blending-a-bitmap
}

const dc = GetDC(NULL);
const brush = CreateSolidBrush(RGBA(0, 0, 255, 255)); //you can't do fillrect with alpha

const bmp = CreateDIBSection(dc, CreateDIBitmapSimple(500, -500, 32), DIB_RGB_COLORS);
const memDC = CreateCompatibleDC(dc);
SelectObject(memDC, bmp);

const temp = CreateDIBSection(dc, CreateDIBitmapSimple(1, -1, 32), DIB_RGB_COLORS);
temp.SetBit(0, RGBA(143, 143, 143, 255));
const TmemDC = CreateCompatibleDC(dc);
SelectObject(TmemDC, temp);

AlphaBlend(memDC, 0, 0, 500, 500, TmemDC, 0, 0, 1, 1, 255, AC_SRC_OVER);

temp.SetBit(0, RGBA(255, 0, 0, 128));

AlphaBlend(memDC, 100, 100, 50, 50, TmemDC, 0, 0, 1, 1, 255, AC_SRC_OVER);

DeleteDC(TmemDC);

print(temp.GetBit(0));
print(bmp.GetBit(0));

FillRect(memDC, 0, 0, 1, 1, brush);

print(bmp.GetBit(0), bmp.GetBit(0).toString(2));

let bmp2 = new Bitmap(dc, CreateCompatibleBitmap(dc, 500, 500));
bmp2.draw(temp => {
    SelectObject(temp, GetStockObject(DC_BRUSH));
    SetDCBrushColor(temp, RGB(1, 1, 1));
    FillRect(temp, 0, 0, 500, 500, NULL);
    SetDCBrushColor(temp, RGBA(0, 0, 255, 255));
    FillRect(temp, 0, 0, 50, 50, NULL);

    SetBkColor(temp, RGBA(243, 243, 243, 255));
    TextOut(temp, 10, 10, "what the sigma (freak session cancelled)");
    //                                                        LOL! using RGB(0, 0, 0) seemingly only draws the text!
    TransparentBlt(memDC, 0, 0, 500, 500, temp, 0, 0, 500, 500, RGB(1, 1, 1)); //transparentblt correctly gets the colors from bmp2 into bmp (dib) but most gdi functions clear alpha so when the colors that are put into bmp2 don't count (ok wait lemme not fill this time)
    //AlphaBlend(memDC, 0, 0, 500, 500, temp, 0, 0, 500, 500, 255, AC_SRC_ALPHA);
});

//while(!GetKey(VK_ESCAPE)) {
    AlphaBlend(dc, 1920-500, 1080-500, 500, 500, memDC, 0, 0, 500, 500, 255, AC_SRC_ALPHA);
//}

ReleaseDC(NULL, dc);
DeleteObject(brush);