//obviously i could've just done with with hidapi but it's easier to get the input of every drawing tablet by using the usages and shit with raw input i think
//and hey it works with my specific device even when i use it with a virtual machine i thik

let w = 1280;
let h = 720;

let wic, dc, bmp;

let rawmouseinfo = {x: 0, y: 0, buttons: 0, pressure: 0, lastX: 0, lastY: 0};

let rawinputdevicelist = [];

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        //                                              oh wait i thought inputsink would capture the input lol but you can only do that with RIDEV_CAPTUREMOUSE (inputsink will let this window still receive WM_INPUT events when it's not in the foreground)
        rawinputdevicelist.push(MakeRAWINPUTDEVICE(65290, 0x0000, RIDEV_PAGEONLY | RIDEV_INPUTSINK, hwnd)); //for some reason i gotta use this for my pen (the usage number is only 1 but just incase im doing PAGEONLY)
        rawinputdevicelist.push(MakeRAWINPUTDEVICE(0x000D, 0x0001, RIDEV_INPUTSINK, hwnd)); //external pen
        rawinputdevicelist.push(MakeRAWINPUTDEVICE(0x000D, 0x0002, RIDEV_INPUTSINK, hwnd)); //internal pen

        print(RegisterRawInputDevices(rawinputdevicelist) == 1, "ijustlostmygawggs");

        dc = GetDC(hwnd);
        bmp = CreateCompatibleBitmap(dc, w, h);

        Msgbox("probably don't get your hopes up because this seems pretty specific to my pen device but hopefully these pen tablets follow the same rules or whatever so this might work for another tablet (i'm using an XPPEN Deco 01 V2)", "idk if this gone work for you")
    }else if(msg == WM_INPUT) {
        //const inputinfo = GET_RAWINPUT_CODE_WPARAM(wp); //https://learn.microsoft.com/en-us/windows/win32/inputdev/wm-input
        const hRawInput = lp;

        const input = GetRawInputData(hRawInput, RID_INPUT);
    
        const memDC = CreateCompatibleDC(dc);

        SelectObject(memDC, bmp);
        SelectObject(memDC, GetStockObject(DC_BRUSH)); //plus i think i've been using this wrong and kept forgetting to use GetStockObject so i would just pass DC_BRUSH which wouldn't really work (but it would kinda work which is why i didn't realize this until later)
        SelectObject(memDC, GetStockObject(DC_PEN));
        SetDCBrushColor(memDC, RGB(255, 255, 0));

        FillRect(memDC, 0, 0, 324, 128, NULL);

        rawmouseinfo.buttons = (GetKey(VK_LBUTTON)!=0) | ((GetKey(VK_RBUTTON)!=0)*2) | ((GetKey(VK_MBUTTON)!=0)*4); //big brain teehee (oops i forgot that GetKey returns big number instead of just 1)

        let color = RGB(255, 0, 255);

        if((rawmouseinfo.buttons & 2) == 2) { //right mouse button
            color = RGB(0, 0, 0);
        }

        //print(rawmouseinfo.buttons, GetKey(VK_RBUTTON), color);

        SetDCBrushColor(memDC, color);
        SetDCPenColor(memDC, color);

        i = 1;
        for(const prop in input.data) {
            TextOut(memDC, 0, i*16, `${prop}: ${input.data[prop]}`);
            i++;
        }

        //rawmouseinfo.lastX = input.data.bRawData[2];
        //rawmouseinfo.lastY = input.data.bRawData[4];
        //i think that bRawData[2 -> 3] are supposed to be one value so how do i combine em (from BYTE to SHORT ?)

        //let lox = input.data.bRawData[2];
        //let hix = input.data.bRawData[3];
        //let loy = input.data.bRawData[4];
        //let hiy = input.data.bRawData[5];
//
        //let x = ((hix & 0xFF) << 8) | (lox & 0xFF);
        //let y = ((hiy & 0xFF) << 8) | (loy & 0xFF); //https://stackoverflow.com/questions/736815/2-bytes-to-short

        //rawmouseinfo.x = (x/(2**16 - 1))*w; //although this is a cool discovery idrgaf because i just wanted the pressure lol
        //rawmouseinfo.y = (y/(2**16 - 1))*h; //although this is a cool discovery idrgaf because i just wanted the pressure lol

        let lop = input.data.bRawData[6];
        let hip = input.data.bRawData[7];

        //input.data.bRawData[7]/2;
        rawmouseinfo.pressure = (((hip & 0xFF) << 8) | (lop & 0xFF))/500; //my pen's max pressure is 8192 so

        print(rawmouseinfo.pressure, MAKEWORD(lop, hip)/500); //lol the windows macro MAKEWORD is actually useful here (if only i found out about it before)

        //print(rawmouseinfo);

        if(rawmouseinfo.buttons) {
            if((rawmouseinfo.buttons & 4) != 4) { //if not hitting middle mouse
                Ellipse(memDC, rawmouseinfo.x-rawmouseinfo.pressure, rawmouseinfo.y-rawmouseinfo.pressure, rawmouseinfo.x+rawmouseinfo.pressure, rawmouseinfo.y+rawmouseinfo.pressure);
            }else if((rawmouseinfo.buttons & 1) == 1){ //left mouse
                const right = ((rawmouseinfo.buttons & 2) == 2);
                print(ExtFloodFill(memDC, rawmouseinfo.x, rawmouseinfo.y, !right ? RGB(255, 0, 255) : RGB(0, 0, 0), FLOODFILLBORDER) == 1);
            }
        }

        BitBlt(dc, 0, 0, w, h, memDC, 0, 0, SRCCOPY);

        DeleteDC(memDC);
    }else if(msg == WM_KEYDOWN) {
        print("char", wp, String.fromCharCode(wp), GetKey(VK_CONTROL));
        if(wp == VK_ESCAPE) {
            DestroyWindow(hwnd);
        }else if(wp == "S".charCodeAt(0) && GetKey(VK_CONTROL)) {
            const picker = showOpenFilePicker({
                multiple: false,
                excludeAcceptAllOption: false,
                types: [
                    {
                        description: "Images",
                        accept: [".png"]
                    }
                ]
            });
            if(picker) {
                const filename = picker[0];
                if(!wic) {
                    wic = InitializeWIC(); ScopeGUIDs(wic);
                }
                const wicbmp = wic.CreateBitmapFromHBITMAP(bmp, NULL, WICBitmapIgnoreAlpha, wic.GUID_WICPixelFormat32bppPBGRA);
                wic.SaveBitmapToFilename(wicbmp, wic.GUID_ContainerFormatPng, filename); //keep in mind you can do other types of images but i just want a png lol
                wicbmp.Release();
            }
        }
    }else if(msg == WM_MOUSEMOVE) {
        rawmouseinfo.x = LOWORD(lp);
        rawmouseinfo.y = HIWORD(lp);
    }
    else if(msg == WM_DESTROY) {
        ReleaseDC(dc, hwnd);

        for(const device of rawinputdevicelist) {
            let flag = RIDEV_REMOVE;
            if((device.dwFlags & RIDEV_PAGEONLY) == RIDEV_PAGEONLY) {
                flag = flag | RIDEV_PAGEONLY;
            }
            device.dwFlags = flag;
            device.hwndTarget = NULL;
        }
        print(RegisterRawInputDevices(rawinputdevicelist) == 1);
        wic?.Release();
        PostQuitMessage(0);
    }
}

const winclass = CreateWindowClass("rawmspaint"/*, init*/, windowProc); //loop is not required y'all (but her timing is getting better)
winclass.hIcon = winclass.hIconSm = LoadIcon(NULL, IDI_APPLICATION);
winclass.hbrBackground = COLOR_BACKGROUND;
winclass.hCursor = LoadCursor(NULL, IDC_CROSS);

CreateWindow(WS_EX_OVERLAPPEDWINDOW, winclass, "using raw input to get my drawing pad's pressure", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);