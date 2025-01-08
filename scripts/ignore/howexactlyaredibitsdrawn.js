//well here's what i've come up with here:
//gdi swaps the blue and red channels of device independent bits (DIB) when you draw them ANYWHERE
//when using DIBits the data is arranged by 0xAARRGGBB\
//FUCKINNG OK: THE DISCONNECT HERE IS THAT THE RGB MACRO IS 0xAABBGGRR BUT DIBITS ARE ORGANIZED BY 0xAARRGGBB AND WHEN THE DIBITS ARE DRAWN, THEY ARE SHOWN AS 0xAABBGGRR
//https://stackoverflow.com/questions/30883102/why-does-windows-gdi-use-rgba-format-for-colorref-instead-of-bgra
//https://cplusplus.com/forum/general/283044/

class Bitmap { //i kinda like this system but i worry that it might be a little confusing (maybe i should see how gdi+ does it)
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

const dc = GetDC(NULL);

            //should be blue...
const color = RGB(0, 0, 255); //0x00ff0000; //even to prove it im gonna use the RGB macro instead of actually writing it out

const wxh = 1;//width and height of dibitmap and dibit

const dibit = new Uint32Array([color]); //gdi is 0xAABBGGRR (so wtf is happening? does gdi swizzle them shits right before drawing?)

print(color, `{r: ${GetRValue(color)}, g: ${GetGValue(color)}, b: ${GetBValue(color)}}`); //blue (but shows as RED with DIBits!)

const dibitmap = CreateDIBSection(dc, CreateDIBitmapSimple(wxh, -wxh, 32), DIB_RGB_COLORS);
dibitmap.SetBits(dibit);

const compatiblebmp = new Bitmap(dc, CreateCompatibleBitmap(dc, wxh, wxh)); //i use and draw a compatible bitmap because i thought the color would come out differently when using one (like maybe the compatible bitmap is what swaps b and r)
compatiblebmp.draw((techbmp) => { //technically the bmp but actually the memDC
    const memDC = CreateCompatibleDC(dc);
    SelectObject(memDC, dibitmap);
    BitBlt(techbmp, 0, 0, wxh, wxh, memDC, 0, 0, SRCCOPY);
    DeleteDC(memDC);
});

const testcompatiblebmp = new Bitmap(dc, CreateCompatibleBitmap(dc, wxh, wxh));
testcompatiblebmp.draw((bmp) => {
    //SelectObject(bmp, GetStockObject(DC_BRUSH));
    //SetDCBrushColor(bmp, color); //seemingly only this shows the color expected
    const brush = CreateSolidBrush(color);
    FillRect(bmp, 0, 0, wxh, wxh, brush); //only shows as blue here (im assuming that since color is already 0xAABBGGRR no conversion is done and it straight draws that shit no swizzle)
    DeleteObject(brush);
    //so since this one is blue lets use GetDIBits
    const bitsfromcompat = GetDIBits(dc, testcompatiblebmp.bmp, 0, wxh, wxh, wxh, 32, BI_RGB); //i gotta use testcompatiblebmp.bmp here because you need to pass the actual compatible bitmap
    print(bitsfromcompat);
    const returnedcolor = bitsfromcompat[0]; //when you get the color back though it's 0xAARRGGBB (remember color is 0x00ff0000) so the R value is 255 instead (but when it's drawn gdi shows it as 0xAABBGGRR (remember 0x00ff0000) and the B value is again 255)
    print(returnedcolor, `{r: ${GetRValue(returnedcolor)}, g: ${GetGValue(returnedcolor)}, b: ${GetBValue(returnedcolor)}}`); //red (but shows as BLUE!)
    //MI SO LA DO!
});

while(!GetKey(VK_ESCAPE)) {
    StretchDIBits(dc, 0, 0, 50, 50, 0, 0, wxh, wxh, dibit, wxh, wxh, 32, BI_RGB, SRCCOPY); //direct dibits to screen (red)
    const memDC = CreateCompatibleDC(dc);
    SelectObject(memDC, dibitmap);
    StretchBlt(dc, 50, 0, 50, 50, memDC, 0, 0, wxh, wxh, SRCCOPY); //DIB bitmap in memDC to screen (red)
    DeleteDC(memDC);
    compatiblebmp.draw((bmp) => {
        StretchBlt(dc, 50, 50, 50, 50, bmp, 0, 0, wxh, wxh, SRCCOPY); //Compatible bitmap (from DIB bitmap) to screen (red)
        //but it doesn't and they're the same color
    });
    testcompatiblebmp.draw((bmp) => {
        StretchBlt(dc, 0, 50, 50, 50, bmp, 0, 0, wxh, wxh, SRCCOPY); //Compatible bitmap (filled with `color` using gdi) to screen (blue)
        //but it doesn't and they're the same color
    });
    Sleep(16);
}

ReleaseDC(NULL, dc);