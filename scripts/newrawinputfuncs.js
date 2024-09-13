const types = ["RIM_TYPEMOUSE", "RIM_TYPEKEYBOARD", "RIM_TYPEHID"];

let dc, bmp;

let w = 800;
let h = 252;

let rawmouseinfo = {x: 0, y: 0, cursor: LoadCursor(NULL, IDC_ARROW)}; //wow the icon actually looks just like your current mouse (it even inverts the shit too)

let rawinputdevicelist = []; //defined out here so we can unregister these fellas in WM_DESTROY

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        //const len = GetRawInputDeviceListLength();
        const devices = GetRawInputDeviceList();//len); //returns an array with {hDevice, dwType} elements (hDevice is a HANDLE and dwType is what kind of device it is (RIM_TYPEMOUSE, RIM_TYPEKEYBOARD, or RIM_TYPEHID))
        //print(devices);
        for(const device of devices) {
            device.name = GetRawInputDeviceInfo(device.hDevice, RIDI_DEVICENAME);
            //print(device.name, device.hDevice, types[device.dwType]);
            print(`${device.name} (${device.hDevice}) is a ${types[device.dwType]}`, GetRawInputDeviceInfo(device.hDevice, RIDI_DEVICEINFO)?.deviceInfo);
        }
        //let rawinputdevicelist = [];
        //rawinputdevicelist.push(MakeRAWINPUTDEVICE(0x0001, 0x0001, NULL, hwnd)); //https://learn.microsoft.com/en-us/windows-hardware/drivers/hid/hid-architecture#hid-clients-supported-in-windows
        rawinputdevicelist.push(MakeRAWINPUTDEVICE(0x0001, 0x0002, NULL, hwnd)); //usage page and usage for mouse devices!
        rawinputdevicelist.push(MakeRAWINPUTDEVICE(0x0001, 0x0005, NULL, hwnd)); //controller
        rawinputdevicelist.push(MakeRAWINPUTDEVICE(0x0001, 0x0006, NULL, hwnd)); //keyboard
        //rawinputdevicelist.push(MakeRAWINPUTDEVICE(0x000D, 0x0001, NULL, hwnd)); //external pen
        //rawinputdevicelist.push(MakeRAWINPUTDEVICE(0x000D, 0x0002, NULL, hwnd)); //internal pen
        //bruh i gotta use device manager to figure out which device is my pen tablet thing and what is it's usage and usage page
        //rawinputdevicelist.push(MakeRAWINPUTDEVICE(65290, 0x0000, RIDEV_PAGEONLY, hwnd)); //for some reason i gotta use this for my pen (the usage number is only 1 but just incase im doing PAGEONLY)
        print(RegisterRawInputDevices(rawinputdevicelist) == 1, "ijustlostmygawggs");

        dc = GetDC(hwnd);
        bmp = CreateCompatibleBitmap(dc, w, h);
    }else if(msg == WM_INPUT) {
        const inputinfo = GET_RAWINPUT_CODE_WPARAM(wp); //https://learn.microsoft.com/en-us/windows/win32/inputdev/wm-input
        const hRawInput = lp;
        print("input info: ", inputinfo);
        print("extra info? ", GetMessageExtraInfo());
        //const header = GetRawInputData(hRawInput, RID_HEADER); //no need to specify size
        //print("header: ", header);
        const input = GetRawInputData(hRawInput, RID_INPUT);
        //print("full input: ", input.data);

        const memDC = CreateCompatibleDC(dc);
        //const bmp = CreateCompatibleBitmap(dc, 700, 252);
        SelectObject(memDC, bmp);
        SelectObject(memDC, GetStockObject(DC_BRUSH)); //plus i think i've been using this wrong and kept forgetting to use GetStockObject so i would just pass DC_BRUSH which wouldn't really work (but it would kinda work which is why i didn't realize this until later)
        SetDCBrushColor(memDC, RGB(255, 255, 0));
        
        let x = input.header.dwType*182;
        FillRect(memDC, x, 0, x+182, 252, NULL); //HAH! in newxinputfuncs.js i abandoned gdi drawing because i realized you couldn't clear and fill was unreliable (but it's because drawing straight to the dc for some reason causes flickering and so drawing that shit to a bitmap with a memDC draws all that shit at once yk yk yk and it's faster)

        TextOut(memDC, x, 0, "type: "+types[input.header.dwType]);

        i = 1;
        for(const prop in input.data) {
            TextOut(memDC, x, i*16, `${prop}: ${input.data[prop]}`);
            i++;
        }

        if(input.header.dwType == RIM_TYPEMOUSE) {
            rawmouseinfo.x = Math.min(w, Math.max(0, rawmouseinfo.x+input.data.lLastX));
            rawmouseinfo.y = Math.min(h, Math.max(0, rawmouseinfo.y+input.data.lLastY));
        }//else if(input.header.dwType == RIM_TYPEHID) {
            //print(input.data);
        //}
        DrawIcon(memDC, rawmouseinfo.x, rawmouseinfo.y, rawmouseinfo.cursor);

        StretchBlt(dc, 0, 0, w, h, memDC, 0, 0, 800, 252, SRCCOPY); //now that feels just right

        DeleteDC(memDC);
        //DeleteObject(bmp);
    }else if(msg == WM_SIZE) {
        w = LOWORD(lp);
        h = HIWORD(lp);
    }
    else if(msg == WM_DESTROY) {
        ReleaseDC(dc, hwnd);
        //quick GetRegisteredRawInputDevices check
        print(GetRegisteredRawInputDevices());
        //oops i forgot to unregistser the shits
        for(const device of rawinputdevicelist) {
            let flag = RIDEV_REMOVE;
            if((device.dwFlags & RIDEV_PAGEONLY) == RIDEV_PAGEONLY) {
                flag = flag | RIDEV_PAGEONLY;
            }
            device.dwFlags = flag;
            device.hwndTarget = NULL;
        }
        print(RegisterRawInputDevices(rawinputdevicelist) == 1); //wait how do i unregister PAGEONLY shits
        PostQuitMessage(0);
    }
}

const winclass = CreateWindowClass("WinClass"/*, init*/, windowProc); //loop is not required y'all (but her timing is getting better)
winclass.hIcon = winclass.hIconSm = LoadIcon(NULL, IDI_APPLICATION);
winclass.hbrBackground = COLOR_BACKGROUND;
winclass.hCursor = LoadCursor(NULL, IDC_ARROW);

CreateWindow(WS_EX_OVERLAPPEDWINDOW, winclass, "new raw input funcs because i just learned about raw input when i was trying to make a custom driver for my controller to see if i could 'fake' inputs for roblox because using SendInput doesn't work so im thinking it's deeper than that", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);