//wic to DIBits

const fs = require("fs");
//let png = fs.read(file.name);//fs.read(__dirname+"/msnexample.png");
//print("EYESAREGREENIEATMYVEGTABLES",png.length, png);
//HELP("LO!");
//HELP(png);
//let thise = fs.read(file.name);
//print(thise, file, "faile");

//const png = fs.readBinary("E:/Downloads/a1510199068_65.jpg");//__dirname+"/msnexample.png");
//print(png);
const wic = InitializeWIC();
ScopeGUIDs(wic);
const bitmap = wic.LoadBitmapFromFilename(__dirname+"/mark.jpg", wic.GUID_WICPixelFormat32bppPBGRA, 0);
const dim = bitmap.GetSize();
const jpg = bitmap.GetPixels(wic);
bitmap.Release();
wic.Release();
const width = 700;
const height = 700;
const window = FindWindow(NULL, "Documents");
print(window);
const dc = GetDC(window); //if there is no "Documents" window it's just gonna draw to the screen LO!
while(!GetKey(VK_ESCAPE)) {
    const mouse = GetCursorPos();
    //print(StretchDIBits(dc, 0, 0, width, height, 0, 0, width, height, png, width, height, 32, BI_JPEG, SRCCOPY), GetLastError(), _com_error(GetLastError()));
    StretchDIBits(dc, mouse.x, mouse.y, width, height, 0, 0, dim.width, dim.width, jpg, dim.width, dim.width, 32, BI_RGB, SRCCOPY);//, GetLastError(), _com_error(GetLastError()));
}
//HELP(png);    