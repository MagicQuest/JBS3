//let window = FindWindow(NULL, "scripts");
let dc = GetDC(NULL);//GetDC(window);
let size = {right: screenWidth, bottom: screenHeight};//GetClientRect(window);

let lastScreenBmp = CreateCompatibleBitmap(dc, 1920, 1080);

function updateBmp() {
    const mem = CreateCompatibleDC(dc);
    SelectObject(mem, lastScreenBmp);
    BitBlt(mem, 0, size.bottom/2, size.right, size.bottom/2, dc, 0, 0, SRCCOPY);
    BitBlt(mem, 0, 0, size.right, size.bottom/2, dc, 0, size.bottom/2, SRCCOPY);
    //DeleteDC(mem);
    return mem;
}

let start = Date.now();

while(!GetKey(VK_ESCAPE)) {
    if((Date.now()-start) % 16 == 0) {
        //InvalidateRect(NULL, 0, 0, 1920, 1080, true); //have to call invalide on school computers for some reason (they are virtual machines vdi)
        //BitBlt(dc, 0, 1080/2, 1920, 1080/2, dc, 0, 0, SRCCOPY);
        //BitBlt(dc, 0, 0, 1920, 1080/2, dc, 0, 1080/2, SRCCOPY);
        const mem = updateBmp();
        BitBlt(dc, 0, 0, size.right, size.bottom, mem, 0, 0, SRCCOPY);
        DeleteDC(mem);
        //BitBlt(dc, 1, 1, 1920, 1080, dc, 0, 0, SRCCOPY);
    }
}