const window = NULL;//FindWindow(NULL, "scripts");
const dc = GetDC(window); //this one draws to the screen :)
const wic = InitializeWIC();
ScopeGUIDs(wic); //im not gonna lie i might just get rid of thos functojn and add it into wic
const wicBitmap = wic.LoadBitmapFromFilename(__dirname+"/bitdepth.bmp", wic.GUID_WICPixelFormat32bppPBGRA, 0);
const {width, height} = wicBitmap.GetSize();
const dib = CreateDIBSection(dc, CreateDIBitmapSimple(width, -height), DIB_RGB_COLORS); //biSizeImage can be 0 for uncompressed rgb bitmaps (negative height flips the bitmap)
print(dib);
const bits = wicBitmap.GetPixels(wic);
dib.SetBits(bits);
//wait instead of DIBSection i can just directly use CreateBitmap (YOU CAN?)
//const hbm = CreateBitmap(width, height, 32, bits);
//print(width, height, hbm);
wic.Release();
wicBitmap.Release();
//const memDC = CreateCompatibleDC(dc);
//SelectObject(dib.bitmap);
//StretchDIBits(memDC, 0, 0, width, height, 0, 0, width, height, bits, width, height, 32, BI_RGB, SRCCOPY);
//DeleteDC(memDC);
while(!GetKey(VK_ESCAPE)) {
    const {x, y} = GetCursorPos();
    const memDC = CreateCompatibleDC(dc);
    SelectObject(memDC, dib.bitmap);
    //SelectObject(memDC, hbm); //BRO IF UKCING PUT DC INSTEAD OF MEMDC
    //StretchDIBits(dc, x, y, width, height, 0, 0, width, height, bits, width, height, 32, BI_RGB, SRCCOPY);
    //BitBlt(dc, x, y, width, height, memDC, 0, 0, SRCCOPY);
    //const memDC = CreateCompatibleDC(dc);
    //SelectObject(dib.bitmap);
    //AlphaBlend(dc, x, y, width*4, height*4, memDC, 0, 0, width, height, 255, AC_SRC_ALPHA);
    StretchBlt(dc, x, y, width*4, height*4, memDC, 0, 0, width, height, SRCCOPY);
    DeleteDC(memDC);
}
ReleaseDC(window, dc);