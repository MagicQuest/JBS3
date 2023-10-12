let window = NULL;//FindWindow(NULL, "scripts");
print(GetWindowText(window), "FOREGND");
let dc = GetDC(window);//GetDC(NULL);
let size = {right : 1920, bottom: 1080};//GetClientRect(window);

let lastScreenBmp = CreateCompatibleBitmap(dc, size.right/4, size.bottom/4);

print(size.right/4, size.bottom/4);

let lSBB;

function updateBmp() {
    const mem = CreateCompatibleDC(dc);
    SelectObject(mem, lastScreenBmp);
    SetStretchBltMode(mem, HALFTONE);
    StretchBlt(mem, 0, 0, size.right/4, size.bottom/4, dc, 0, 0, size.right, size.bottom, SRCCOPY);
    //BitBlt(mem, 0, 0, size.right/4, size.bottom/4, dc, 0, 0, SRCCOPY);
    //TextOut(mem, 10,10, "nigger");
    DeleteDC(mem);
    //return mem;
    if(lSBB) {
        DeleteObject(lSBB);
        lSBB = CreatePatternBrush(lastScreenBmp);
    }
}
//AND I NEVER CALL UPDATE BITMAP NO WONDER
updateBmp(); //my code was right the WHOLE time

lSBB = CreatePatternBrush(lastScreenBmp);

let start = Date.now();

while(!GetKey(VK_ESCAPE)) {
    if((Date.now()-start) % 166 == 0) {
        //bruh how do i erase the screen

        //InvalidateRect(window, 0, 0, size.right, size.bottom, true);
        //InvalidateRect(window, 0, 0, size.right, size.bottom, true); //have to call invalide on school vdi
        //InvalidateRect(window, 0, 0, size.right, size.bottom, true);
        //print(window, UpdateWindow(window), _com_error(GetLastError())); //yo it might work on get last error too?
        updateBmp();
        //const mem = CreateCompatibleDC(dc);
        //SelectObject(mem, lastScreenBmp);
        //BitBlt(dc, 10, 200, size.right/4, size.bottom/4, mem, 0, 0, SRCCOPY);
        //DeleteDC(mem);
        const lastBrush = SelectObject(dc, lSBB);
        PatBlt(dc, 0, 0, size.right, size.bottom, PATCOPY);
        SelectObject(dc, lastBrush);
    }
}