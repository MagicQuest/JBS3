//yep, you heard that right. i've made a custom usb device driver so that i can use my wii guitar (plugged into the raphnet adapter) to control the mouse

//my custom driver defined ioctls
const VHID_FUNCTION_NEXT_MODE = 0x800;
const VHID_FUNCTION_SET_MODE = 0x801;
const VHID_FUNCTION_GET_MODE = 0x802;

const IOCTL_VHID_NEXT_MODE = CTL_CODE(FILE_DEVICE_CONTROLLER, VHID_FUNCTION_NEXT_MODE, METHOD_BUFFERED, FILE_WRITE_DATA | FILE_READ_DATA);
const IOCTL_VHID_SET_MODE = CTL_CODE(FILE_DEVICE_CONTROLLER, VHID_FUNCTION_SET_MODE, METHOD_BUFFERED, FILE_WRITE_DATA);
const IOCTL_VHID_GET_MODE = CTL_CODE(FILE_DEVICE_CONTROLLER, VHID_FUNCTION_GET_MODE, METHOD_BUFFERED, FILE_READ_DATA);

const GUID_DEVINTERFACE_USB_DEVICE = DEFINE_GUID(0xA5DCBF10, 0x6530, 0x11D2, 0x90, 0x1F, 0x00, 0xC0, 0x4F, 0xB9, 0x51, 0xED);
const GUID_DEVINTERFACE_VirtualHIDivinations = DEFINE_GUID(0x941b6880,0xa120,0x4a9a,0x9a,0x6b,0x4b,0x40,0xd1,0xe6,0xfc,0x5d);
const GUID_DEVINTERFACE_TDFIOCTL = DEFINE_GUID(0x6737d927, 0x94bf, 0x4350, 0x97, 0x47, 0x56, 0xc2, 0xf5, 0x9c, 0x4e, 0xde); //a test driver device interface i made (Test Device For IOCTL)

let handle; //not exactly sure how to get this yet...
//let mode = undefined;

let window, impact, text;

//lowkey we doing this the lazy way
//i can't be bothered to change every time i set mode so we'll just do it here lol!
//i want the text to change every time mode changes
Object.defineProperty(globalThis, "mode", {
    get() {
        return this._mode;
    },
    set(val) {
        this._mode = val;
        SetWindowText(text, "Mode: "+val);
    }
});

function ChangeMode() {
    //DeviceIoControl(handle, IOCTL_VHID_NEXT_MODE, undefined, undefined, undefined); //this ioctl takes and returns no data (the moment i wrote this comment i realized i wanted it to do that)
    //__debugbreak();
    //const buffer = new ArrayBuffer(1);
    const buffer = new Uint8Array(1);
    if(DeviceIoControl(handle, IOCTL_VHID_NEXT_MODE, undefined, buffer, undefined)) { //this ioctl returns the new mode
        print("mode successfully changed to " + buffer[0]);
        mode = buffer[0];
    }else {
        const g = GetLastError();
        print(`mode unsuccessfully changed! (${_com_error(g)}) [${g}]`);
    }
}

function SetMode() {
    //const buffer = new ArrayBuffer(1);
    const buffer = new Uint8Array(1);
    SetForegroundWindow(GetConsoleWindow());
    const newMode = getline("Set the next mode: ");
    buffer[0] = parseInt(newMode);
    if(DeviceIoControl(handle, IOCTL_VHID_SET_MODE, buffer, undefined, undefined)) { //this ioctl takes the new mode and returns nothing
        print("mode successfully changed to " + newMode);
        mode = newMode;
    }else {
        const g = GetLastError();
        print(`mode unsuccessfully changed! (${_com_error(g)}) [${g}]`);
    }
    SetForegroundWindow(window);
}

function GetMode() {
    //const buffer = new ArrayBuffer(1);
    const buffer = new Uint8Array(1);
    if(DeviceIoControl(handle, IOCTL_VHID_GET_MODE, undefined, buffer, undefined)) { //this ioctl returns the new mode
        print("current mode: " + buffer[0]);
        mode = buffer[0];
    }else {
        const g = GetLastError();
        print(`mode unsuccessfully changed! (${_com_error(g)}) [${g}]`);
    }
}

const buttons = [];
const callbacks = [undefined,
    ChangeMode,
    SetMode,
    GetMode,
];

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        window = hwnd;
        impact = CreateFontSimple("impact", 20, 40);
        text = CreateWindow(NULL, "STATIC", "Mode: --", WS_CHILD | WS_VISIBLE, 0, 0, 425, 40, hwnd, NULL, hInstance);
        SendMessage(text, WM_SETFONT, impact, true);

        //hard way to use CM_Get_Device_Interface_List

        //const {errorCode, length} = CM_Get_Device_Interface_List_Size(GUID_DEVINTERFACE_VirtualHIDivinations, NULL, CM_GET_DEVICE_INTERFACE_LIST_PRESENT);
        //const list = [];
        //if(length) {
        //    const buffer = new Uint8Array(length * 2); //oh boy since it's a wstring you'd have to multiply it by 2 if you were using a uint8array
        //    //const buffer = new Uint16Array(length); //life hacked! (i really thought that was about to work but i'd have to change my loop)
        //    //just call CM_Get_Device_Interface_List(..., ..., ..., ..., true); bro
        //    const result = CM_Get_Device_Interface_List(GUID_DEVINTERFACE_VirtualHIDivinations, NULL, buffer, CM_GET_DEVICE_INTERFACE_LIST_PRESENT, false);
        //    if(!(result instanceof Uint8Array)) { //when CM_Get_Device_Interface_List works, it returns the buffer. if it fails, it returns the error code
        //        print(`CM_Get_Device_Interface_List failed!~ (${result})`);
        //    }
        //    print(buffer);
        //    //PZZWSTR to js array (kinda weird technique but whatever)
        //    let zeros = 0;
        //    let index = 0;
        //    list[index] = "";
        //    for(let i = 0; i < buffer.length; i++) {
        //        const byte = buffer[i];
        //        if(byte == 0) {
        //            zeros++;
        //        }else {
        //            zeros = 0;
        //            list[index] += String.fromCharCode(byte);
        //        }
        //        if(zeros == 2) {
        //            index++;
        //            list[index] = "";
        //        }
        //    }
        //}else {
        //    print(`CM_Get_Device_Interface_List_Size failed! (c: ${errorCode})`);
        //}

        //easy way to use CM_Get_Device_Interface_List

        //oh wait using the specific guid is way better than just checking usb devices what was i doing lol
        const correctlist = CM_Get_Device_Interface_List(GUID_DEVINTERFACE_VirtualHIDivinations, NULL, NULL, CM_GET_DEVICE_INTERFACE_LIST_PRESENT, true);
        print(correctlist);
        //const correctlist = [];
        //for(const str of list) {
        //    if(str.toLowerCase().includes("vid_289b&pid_0080")) {
        //        //handle = CreateFile(str, GENERIC_READ | GENERIC_WRITE, FILE_SHARE_READ | FILE_SHARE_WRITE, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
        //        correctlist.push(str);
        //        break;
        //    }
        //}
        let str;
        if(correctlist.length > 1) {
            //do input shit
            for(let i = 0; i < correctlist.length; i++) {
                print(`[${i}]: ${correctlist[i]}`);
            }
            const selection = getline("Choose which device to open: ");
            str = correctlist[selection];
        }else if(correctlist.length == 1) {
            str = correctlist[0];
        }else {
            print("no rapgnet usb things found bruh (vid: 0x289B pid: 0x0080)");
        }

        handle = CreateFile(str, GENERIC_READ | GENERIC_WRITE, FILE_SHARE_READ | FILE_SHARE_WRITE, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
        if(handle == INVALID_HANDLE_VALUE) {
            if(str) {
                const g = GetLastError();
                print(`CreateFile failed! (${_com_error(g)}) [${g}]`);
            }else {
                print("no string was found so CreateFile failed.");
            }
        }else {
            GetMode();
        }

        buttons.push(CreateWindow(NULL, "BUTTON", "Change mode", WS_CHILD | WS_VISIBLE, 25, 75, 100, 20, hwnd, 1, hInstance));
        buttons.push(CreateWindow(NULL, "BUTTON", "Set mode", WS_CHILD | WS_VISIBLE, 25+125, 75, 100, 20, hwnd, 2, hInstance));
        buttons.push(CreateWindow(NULL, "BUTTON", "Get mode", WS_CHILD | WS_VISIBLE, 25+125+125, 75, 100, 20, hwnd, 3, hInstance));
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
    }else if(msg == WM_COMMAND) {
        callbacks[wp](); //ok
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        CloseHandle(handle);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_HAND);

CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "customdriverconfigure.js", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 425, 150, NULL, NULL, hInstance);