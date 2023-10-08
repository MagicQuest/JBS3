print(version(), nigg);

child_process("echo ECNONIGGERS");

const fs = require("fs");
print(fs.read(file.name));

print(Msgbox("title", "caption", MB_OK));

fs.write("nigger.txt", Inputbox("k", "y", "s -> filename"));

const dc = GetDC(FindWindow(null, "JBS3"));

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
    const pen = CreatePen(PS_SOLID, 5, 255, 0, 255);

    //let windowDC;
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
            //windowDC = ps.hdc;
            //}
            let oldObj = SelectObject(ps.hdc, GetDefaultFont());

            SetBkMode(ps.hdc, TRANSPARENT);

            TextOut(ps.hdc, 200, 100, "reallymigga");

            const bpxcalc = (bitPos.x / (1920 - sizeX)) * 500;
            const bpycalc = (bitPos.y / (1080 - sizeY)) * 500;

            //print(bpxcalc, bpycalc);

            Rectangle(ps.hdc, bpxcalc, bpycalc, 100, 100); //500 window size

            SelectObject(ps.hdc, oldObj);

            oldObj = SelectObject(ps.hdc, GetStockObject(DC_PEN));

            //LineTo(ps.hdc, 256, 256);
            MoveTo(ps.hdc, 100, 0);
            LineTo(ps.hdc, 256 + 100, 256);
            MoveTo(ps.hdc, 0, 100);
            LineTo(ps.hdc, 256, 256 +100);
            MoveTo(ps.hdc, 100, 100);
            LineTo(ps.hdc, 256 + 100, 256 + 100);

            Rectangle(ps.hdc, 256, 256,356, 356);

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

        SetTextColor(dc, ((bitPos.x) / (1920 - sizeX)) * 255, 0, 0)

        TextOut(dc, 300 + bitPos.x, 200 + bitPos.y, "looped!");

        SelectObject(dc, oldObj);

        if (GetKeyDown(VK_LBUTTON)) {
            const mouse = GetMousePos();
            bitVel = { x: (mouse.x - bitPos.x) / 10, y: (mouse.y - bitPos.y) / 10 };
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

        oldObj = SelectObject(dc, pen);//GetStockObject(DC_PEN));//pen);
        //
        //SetDCPenColor(dc, Math.random() * 255, Math.random() * 255, Math.random() * 255);
        ////SetDCBrushColor(dc, Math.random() * 255, Math.random() * 255, Math.random() * 255);
        //
        ////Rectangle(dc, bitPos.x, bitPos.y, bitPos.x + sizeX, bitPos.y + sizeY);
        //
        MoveTo(dc, bitPos.x, bitPos.y);
        LineTo(dc, bitPos.x + sizeX, bitPos.y);
        LineTo(dc, bitPos.x + sizeX, bitPos.y + sizeY);
        LineTo(dc, bitPos.x, bitPos.y + sizeY);
        LineTo(dc, bitPos.x, bitPos.y);
        
        SelectObject(dc, oldObj);

        //StretchBlt(dc, bitPos.x, bitPos.y, sizeX, sizeY, dc, bitPos.x + bitVel.x, bitPos.y + bitVel.y, bitVel.x*sizeX, bitVel.y*sizeY, NOTSRCCOPY);
        BitBlt(dc, bitPos.x, bitPos.y, sizeX, sizeY, dc, bitPos.x + bitVel.x, bitPos.y + bitVel.y, SRCCOPY);//NOTSRCCOPY);
        StretchBlt(dc, 0, 0, sizeX, sizeY, dc, bitPos.x + bitVel.x, bitPos.y + bitVel.y, 500, 500, SRCCOPY);

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