const window = FindWindow(NULL, "scripts");
print(window);
const dc = GetDC(window);
//const bitmap = CreateCompatibleBitmap(dc, 1920/4, 1080/4);
const latticeBrush = CreateHatchBrush(HS_BDIAGONAL, RGB(255,255,0));

const funnyBmp = LoadImage(NULL, __dirname+"/minesweeper/ifoundamongus.bmp", IMAGE_BITMAP, 200, 200, LR_SHARED | LR_LOADFROMFILE);
const amogusBrush = CreatePatternBrush(funnyBmp);

const textBmp = CreateCompatibleBitmap(dc, 80, 40);

const missingTextureBmp = CreateCompatibleBitmap(dc, 100, 100);

function drawBitmap(bmp, x, y, width, height) {
    const memDC = CreateCompatibleDC(dc);
    SelectObject(memDC, bmp);
    BitBlt(dc, x, y, width, height, memDC, 0, 0, SRCCOPY);
    DeleteDC(memDC);
}

(function() {
    //const fonts = [];
    //EnumFontFamilies(dc, (font, textMetric, fontType) => {
    //    fonts.push(font.lfFaceName); //uhhh whats the props on this object yo
    //});
    const memDC = CreateCompatibleDC(dc);
    const impact = CreateFontSimple("Impact" /*fonts[Math.floor(Math.random()*fonts.length)]*/, 20, 40);
    SelectObject(memDC, textBmp);
    SelectObject(memDC, impact);
    TextOut(memDC, 0, 0, "nigga");
    DeleteDC(memDC);
    DeleteObject(impact);
})();
const textBmpBrush = CreatePatternBrush(textBmp);

(function() {
    const memDC = CreateCompatibleDC(dc);
    SelectObject(memDC, missingTextureBmp);
    SelectObject(memDC, GetStockObject(DC_BRUSH));
    SetDCBrushColor(memDC, RGB(255,0,255)); //instead of creating new brushes i could just use the DC_BRUSH (i thought about it but i didn't think it would work)
    
    FillRect(memDC, 0, 0, 50, 50, NULL); //oh i didn't know i could do that
    //SetDCBrushColor(memDC, RGB(255,0,255));
    FillRect(memDC, 50, 50, 100, 100, NULL);
    
    const memDC2 = CreateCompatibleDC(dc); //im not sure if this is correct but i (kinda) googled it and didn't REALLY find anything soo
    SelectObject(memDC2, funnyBmp); // i want to draw the funnyBmp to the missingTextureBmp
    SetStretchBltMode(memDC, HALFTONE);
    StretchBlt(memDC, 0, 50, 50, 50, memDC2, 0, 0, 200, 200, SRCCOPY);
    

    //const color = CreateSolidBrush(RGB(0,255,0));
    //FillRect(memDC, 0, 0, 50, 50, color);
    //const color2 = CreateSolidBrush(RGB(255,0,255));
    //FillRect(memDC, 50, 50, 100, 100, color2);
    //DeleteObject(color);
    //DeleteObject(color2);
    DeleteDC(memDC2);
    DeleteDC(memDC);
})();
const missingTextureBrush = CreatePatternBrush(missingTextureBmp);

//(function() {
//    //draw screen to bitmap
//    const memDC = CreateCompatibleDC(dc);
//    SelectObject(memDC, bitmap);
//    SetStretchBltMode(memDC, HALFTONE);
//    StretchBlt(memDC, 0, 0, 1920/4, 1920/4, dc, 0, 0, 1920, 1080, SRCCOPY);
//    DeleteDC(memDC);
//})();

while(!GetKey(VK_ESCAPE)) {
    const mouse = GetCursorPos();
    //draw bitmap to screen
    //drawBitmap(bitmap, mouse.x, mouse.y, 1920/4, 1080/4);
    //drawBitmap(funnyBmp, mouse.x-200, mouse.y-200, 200, 200);

    //let oldBrush = SelectObject(dc, latticeBrush);
    //PatBlt(dc, mouse.x+160,mouse.y+320,160,160,PATCOPY);
    //SelectObject(oldBrush);
//
    //oldBrush = SelectObject(dc, amogusBrush);
    //PatBlt(dc, mouse.x+100,mouse.y-200,200,200,PATCOPY);
    //SelectObject(oldBrush);
    //drawBitmap(textBmp, mouse.x, mouse.y, 100, 100);

    oldBrush = SelectObject(dc, missingTextureBrush);
    PatBlt(dc, mouse.x-150,mouse.y-150,300,300,PATCOPY);
    SelectObject(oldBrush);

    oldBrush = SelectObject(dc, textBmpBrush);
    PatBlt(dc, mouse.x-100,mouse.y-100,200,200,PATCOPY);
    SelectObject(oldBrush);
}

//DeleteObject(bitmap);
DeleteObject(missingTextureBrush);
DeleteObject(missingTextureBmp);
DeleteObject(textBmpBrush);
DeleteObject(textBmp);
DeleteObject(latticeBrush);