//for burn2 im making all textures on the fly so i need to create white and black rectangles as big as the screen
const dc = GetDC(NULL);
const white = CreateDIBSection(dc, CreateDIBitmapSimple(screenWidth, screenHeight, 32, 1, 0), DIB_RGB_COLORS);
//const whitebrush = CreateSolidBrush(RGB(255, 255, 255));
const memDC = CreateCompatibleDC(dc);
SelectObject(memDC, white); //oh wait i need to do .bitmap (well not anymore!)
SelectObject(memDC, WHITE_BRUSH);
//SetDCBrushColor(memDC, RGB(255, 255, 255));
FillRect(memDC, 0, 0, screenWidth, screenHeight, NULL);//whitebrush);
DeleteDC(memDC);

const black = CreateDIBSection(dc, CreateDIBitmapSimple(screenWidth, screenHeight, 32, 1, 0), DIB_RGB_COLORS); //ha this ones probably already black!

const whitebits = white.GetBits();
const blackbits = black.GetBits();

//print(whitebits);

while(!GetKey(VK_ESCAPE)) {
    StretchDIBits(dc, 0, 0, screenWidth/2, screenHeight/2, 0, 0, screenWidth, screenHeight, whitebits, screenWidth, screenHeight, 32, BI_RGB, SRCCOPY);//, GetLastError(), _com_error(GetLastError()));
    StretchDIBits(dc, screenWidth/2, screenHeight/2, screenWidth/2, screenHeight/2, 0, 0, screenWidth, screenHeight, blackbits, screenWidth, screenHeight, 32, BI_RGB, SRCCOPY);//, GetLastError(), _com_error(GetLastError()));
}

ReleaseDC(NULL, dc);