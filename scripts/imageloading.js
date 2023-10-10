const fs = require("fs");
//let png = fs.read(file.name);//fs.read(__dirname+"/msnexample.png");
//print("EYESAREGREENIEATMYVEGTABLES",png.length, png);
//HELP("LO!");
//HELP(png);
//let thise = fs.read(file.name);
//print(thise, file, "faile");

const png = fs.readBinary("E:/Downloads/a1510199068_65.jpg");//__dirname+"/msnexample.png");
//print(png);
const width = 700;
const height = 700;
const window = FindWindow(NULL, "Documents");
print(window);
const dc = GetDC(FindWindow(NULL, "Documents"));
while(!GetKey(VK_ESCAPE)) {
    print(StretchDIBits(dc, 0, 0, width, height, 0, 0, width, height, png, width, height, BI_JPEG, SRCCOPY), GetLastError());
}
//HELP(png);    