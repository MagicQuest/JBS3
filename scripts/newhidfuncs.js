//keyboard and mouse devices are opened in "exclusive" mode by windows so you can't read from them

if(hid_init() != 0) {
    Msgbox("failed to init hid for some reason", "newhidfuncs.js", MB_OK);
}

let list;
let devices = {};
let connected;
let connect, diconnect, label, input;
let inputStr = "";
const systemFont = GetDefaultFont();

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        //combo = CreateWindow(NULL, "COMBOBOX", "skibidi?", WS_CHILD | WS_VISIBLE, 0, 0, 200, 300, hwnd, 1, hInstance);
        list = CreateWindow(NULL, "LISTBOX", "", WS_CHILD | WS_VISIBLE | WS_VSCROLL, 0, 0, 700, 100, hwnd, 1, hInstance);
        hid_enumerate(0x0, 0x0, (device_info) => {
            let str = `0x${device_info.vendor_id.toString(16)}:0x${device_info.product_id.toString(16)} - ${device_info.manufacturer_string} ${device_info.product_string} (usage: ${device_info.usage_page.toString(16)}:${device_info.usage.toString(16)})`;
            devices[str] = device_info;
            SendMessage(list, LB_ADDSTRING, 0, str);    
        });
        SendMessage(list, WM_SETFONT, systemFont, true); //lol

        SendMessage(list, LB_SETCURSEL, 0, 0); //highlight/select the first option
                                                                // (425/2)-(100/2)
        connect = CreateWindow(NULL,"BUTTON", "Connect", WS_CHILD | WS_VISIBLE, 12, 100, 100, 25, hwnd, 2, hInstance);
        SendMessage(connect, WM_SETFONT, systemFont, true);

        disconnect = CreateWindow(NULL,"BUTTON", "Disconnect", WS_CHILD | WS_VISIBLE | WS_DISABLED, 12, 125+(25/2), 100, 25, hwnd, 3, hInstance);
        SendMessage(disconnect, WM_SETFONT, systemFont, true);

        let rescan = CreateWindow(NULL,"BUTTON", "Rescan devices", WS_CHILD | WS_VISIBLE, 12, 175, 100, 25, hwnd, 4, hInstance);
        SendMessage(rescan, WM_SETFONT, systemFont, true);

        label = CreateWindow(NULL, "STATIC", "Disconnected", WS_CHILD | WS_VISIBLE, 12, 225+(25/2), 6*("Disconnected".length), 14, hwnd, 0, hInstance);
        SendMessage(label, WM_SETFONT, systemFont, true);

        input = CreateWindow(NULL, "EDIT", "", WS_CHILD | WS_VISIBLE | ES_READONLY | ES_MULTILINE | WS_VSCROLL, 118, 100, 700-118, 125, hwnd, 0, hInstance);
        SendMessage(input, WM_SETFONT, systemFont, true);

        SetTimer(hwnd, NULL, 16);
    }else if(msg == WM_COMMAND) {
        //print(`wp: ${wp} lp: ${lp} hiwp: ${HIWORD(wp)} lowp: ${LOWORD(wp)} hilp: ${HIWORD(lp)} lolp: ${LOWORD(lp)}`);
        //let i = SendMessage(list, LB_GETCURSEL, 0, 0);
        //print(SendMessageStr(list, LB_GETTEXT, i));
        if(wp == 2) {
            let i = SendMessage(list, LB_GETCURSEL, 0, 0);
            let str = SendMessageStr(list, LB_GETTEXT, i);
            print(str);
            let device_info = devices[str];
            print(device_info);
            connected = hid_open_path(device_info.path);//hid_get_handle_from_info(device_info); //suprisingly this didn't work correctly
            hid_set_nonblocking(connected, true);
            EnableWindow(disconnect, true);
            EnableWindow(connect, false);
            str = "Connected to: "+str;
            SetWindowText(label, str);
            SetWindowPos(label, NULL, (700/2)-(3*(str.length)), 225+(25/2), 6*(str.length), 14, SWP_NOZORDER);
            inputStr = "waiting...";
            SetWindowText(input, inputStr);
            //hid_close(device);
        }else if(wp == 3) {
            EnableWindow(connect, true);
            EnableWindow(disconnect, false);
            hid_close(connected);
            connected = undefined;
            SetWindowText(label, "Disconnected");
            SetWindowPos(label, NULL, (700/2)-(3*("Disconnected".length)), 225+(25/2), 6*("Disconnected".length), 14, SWP_NOZORDER);
            //SetWindowText(input, "");
        }else if(wp == 4) {
            SendMessage(list, LB_RESETCONTENT, 0, 0);
            devices = {};
            hid_enumerate(0x0, 0x0, (device_info) => {
                let str = `0x${device_info.vendor_id.toString(16)}:0x${device_info.product_id.toString(16)} - ${device_info.manufacturer_string} ${device_info.product_string} (usage: ${device_info.usage_page.toString(16)}:${device_info.usage.toString(16)})`;
                devices[str] = device_info;
                SendMessage(list, LB_ADDSTRING, 0, str);    
            });
        }
    }else if(msg == WM_KEYDOWN) {
        const ctrl = GetKey(VK_CONTROL);
        if(wp == "E".charCodeAt(0)) {
            print("e");
            if(ctrl) {
                SetForegroundWindow(GetConsoleWindow());
                try {
                    print(eval(getline("Ctrl+E -> Eval some code: ")));
                }catch(e) {
                    print(e.toString());
                }
                SetForegroundWindow(hwnd);
            }
        }
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        DeleteObject(systemFont);
    }

    if(msg == WM_TIMER) {
        if(connected) {
            //const buf = new Uint8Array(HID_BUFFER_SIZE);
            let result = hid_read(connected); //buf, HID_BUFFER_SIZE); //returns 0 or 1 if no read and returns an uint8array
            if(result == 0) {
                print("waiting");
            }else if(result < 0) {
                //unfortunately i don't think keyboards and mouses can be read that good
                let str = "Unable to read: "+hid_error(connected);
                inputStr += `${str}\r\n`;
                SetWindowText(input, inputStr);//oops GetWindowText is capped at 255 letters (whcar_t shit[255])
                //print("Unable to read: ", hid_error(connected));
            }else {
                let str = `Received ${result.length} bytes: \r\n`;
                for(let i = 0; i < result.length; i++) {
                    str+=`0x${result[i].toString(16)} `;
                }
                inputStr += `${str}\r\n`;
                SetWindowText(input, inputStr);
            }
            //let si = GetScrollInfo(input, SB_VERT);
            //let range = GetScrollRange(input, SB_VERT);
            ////print(si, range);
            //si.fMask = SIF_POS;
            //si.nPos = range.max;
            //SetScrollInfo(input, SB_VERT, si, true);
            
            //bruh no way SetScrollInfo doesn't even do what i thought it did
            //this one SendMessage does exactly what i need it to
            SendMessage(input, WM_VSCROLL, SB_BOTTOM, 0);
        }
    }
}

const winclass = CreateWindowClass("WinClass"/*, init*/, windowProc); //loop is not required y'all
winclass.hIcon = winclass.hIconSm = LoadIcon(NULL, IDI_APPLICATION);
winclass.hbrBackground = COLOR_BACKGROUND;
winclass.hCursor = LoadCursor(NULL, IDC_ARROW);

CreateWindow(WS_EX_OVERLAPPEDWINDOW, winclass, "hidapi's testgui but in jbs", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 700+20, 252+42, NULL, NULL, hInstance);