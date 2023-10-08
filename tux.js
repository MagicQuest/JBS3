const add = (x, y) => x + y; //oops almost left return like a regular function but this anonymous nigga
//like c++ []() {}

class fuck {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

const f = new fuck(9, 10);
print(console, console.log);
print("21");
print(add(f.x, f.y));
print(version());

//const fs = require("fs");
//print(nigg);
//print(fs, fs.v, nigg);
//print(fs.read("tux.js"));
//let curFile = fs.read(file.name);
//let numb = file.name.match(/[0-9]/);
//print(file.name.substring(0, numb.index) + (numb[0] + 1) + ".js");
//fs.write(file.name.substring(0, numb.index)+(numb[0]+1)+".js", curFile);
//print(fs, file, file.name);

print(Msgbox("caption", "title", MB_ABORTRETRYIGNORE), "msgbox!");
print(Inputbox("desc", "title", "input"));

const dc = GetDC(FindWindow(null, "WD3"));

(async function () { //anonymous async immediate function
    const WNDCLASS = CreateWindowClass();
    WNDCLASS.className = "Window!";
    let bitPos = { x: 0, y: 0 };
    let bitVel = { x: 1, y: 0 };
    //const sizeX = 1080;//1920;
    //const sizeY = 1080;
    //const sizeX = sizeY = 1080; //WOW THIS IS VALID?! (only sizeX is const though)
    const sizeX = 256;
    const sizeY = 256;
    //const pen = CreatePen(PS_SOLID, 5, 255,0,255);
    //print("dc! ", dc);
    WNDCLASS.windowProc = (hwnd, msg) => {
        print("CALLED?!", hwnd, msg);
        if (msg == WM_PAINT) { //WM_PAINT
            const ps = BeginPaint(hwnd);
            //for (let i in ps) {
            //    for(let y in ps[i]) {
            //        print(y, ps[i][y]);
            //    }
            //    print(i, ps[i]);
            //}
            const oldObj = SelectObject(ps.hdc, GetDefaultFont());

            SetBkMode(ps.hdc, TRANSPARENT);

            TextOut(ps.hdc, 200, 100, "reallymigga");

            SelectObject(ps.hdc, oldObj);

            print(EndPaint(hwnd, ps.ps));
        }
        //return "21!";
    };
    WNDCLASS.loop = () => {
        if (GetKey(VK_ESCAPE)) {
            print("QUIT!");
            PostQuitMessage();
        }

        let oldObj = SelectObject(dc, GetDefaultFont());
        //print("TEXTOUTLOOPOER");
        //TextOut(dc, 300, 200, "looped!");
        SetBkColor(dc, Math.random() * 255, Math.random() * 255, Math.random() * 255);


        TextOut(dc, 300 + bitPos.x, 200 + bitPos.y, "looped!");

        SelectObject(dc, oldObj);

        if (GetKeyDown(VK_LBUTTON)) {
            const mouse = GetMousePos();
            bitVel = { x: (mouse.x - bitPos.x) / 10, y: (mouse.y - bitPos.y)/10 };
        }

        bitVel.y += .1;
        bitPos = { x: bitPos.x + bitVel.x, y: bitPos.y + bitVel.y };
        if (bitPos.y > 1080 - sizeY) {
            bitPos.y = 1080 - sizeY;
            bitVel.y *= -.9;
        }
        if (bitPos.x < 0) {
            bitPos.x = 0;
            bitVel.x *= -.9;
        }
        if (bitPos.x > 1920 - sizeX) {
            bitPos.x = 1920 - sizeX;
            bitVel.x *= -.9;
        }

        //oldObj = SelectObject(dc, GetStockObject(DC_PEN));//pen);
        //
        //SetDCPenColor(dc, Math.random() * 255, Math.random() * 255, Math.random() * 255);
        ////SetDCBrushColor(dc, Math.random() * 255, Math.random() * 255, Math.random() * 255);
        //
        ////Rectangle(dc, bitPos.x, bitPos.y, bitPos.x + sizeX, bitPos.y + sizeY);
        //
        //MoveTo(dc, bitPos.x, bitPos.y);
        //LineTo(dc, bitPos.x + sizeX, bitPos.y);
        //LineTo(dc, bitPos.x + sizeX, bitPos.y + sizeY);
        //LineTo(dc, bitPos.x, bitPos.y + sizeY);
        //LineTo(dc, bitPos.x, bitPos.y);
        //
        //SelectObject(dc, oldObj);

        //StretchBlt(dc, bitPos.x, bitPos.y, sizeX, sizeY, dc, bitPos.x + bitVel.x, bitPos.y + bitVel.y, bitVel.x*sizeX, bitVel.y*sizeY, NOTSRCCOPY);
        BitBlt(dc, bitPos.x, bitPos.y, sizeX, sizeY, dc, bitPos.x + bitVel.x, bitPos.y + bitVel.y, SRCCOPY);//NOTSRCCOPY);

        //BitBlt(dc, bitPos.x, bitPos.y, sizeX, sizeY, dc, 1,1)//bitPos.x+bitVel.x, bitPos.y+bitVel.y);
    }
    /* () => {
        print("I:VE BEEN CALLED!");
    });*/

    //print(WNDCLASS, WNDCLASS.className, WNDCLASS.windowProc);

    await CreateWindow(WNDCLASS, "HELLO FROM JBS::v8", 100, 100, 500, 500);
    print("window over!");
    ReleaseDC(dc);
    DeleteObject(pen);
})();

for (const i in globalThis) {
    print(i);
}

if (Msgbox("press w 3 times to quit :3", "yo what if he is lying tho?", MB_YESNO) == IDYES) {
    //(async function () {
    //    await new Promise(function (resolve, reject) {
    while (!GetKeyDown("W")) {
        const mouse = GetMousePos();
        TextOut(dc, mouse.x+20, mouse.y+20, "lol look i follow you");
            }
            print("W")
            while (!GetKeyDown("W")) {

            }
            print("w")
            while (!GetKeyDown("W")) {

            }
            print("W QUIT")
            //blt spectacular
    //bruh i forgot to resolve the promise
    //    });
    //})();
} else {
    Msgbox("kys", "end yha life", MB_ABORTRETRYIGNORE | MB_ICONERROR);
}