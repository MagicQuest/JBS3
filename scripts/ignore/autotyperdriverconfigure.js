//yep, you heard that right. i've made another driver so that i can autotype stuff (without using SendInput or keybd_event)

//my custom driver defined ioctls
const AUTOTYPER_FUNCTION_SET_KEYS = 0x800;
const AUTOTYPER_FUNCTION_SET_N_KEY = 0x801;
const AUTOTYPER_FUNCTION_SET_MODIFIER_KEYS = 0x802;
const AUTOTYPER_FUNCTION_START = 0x803;
const AUTOTYPER_FUNCTION_SET_PERIOD = 0x804;
const AUTOTYPER_FUNCTION_STOP = 0x805;

const IOCTL_AUTOTYPER_SET_KEYS = CTL_CODE(FILE_DEVICE_KEYBOARD, AUTOTYPER_FUNCTION_SET_KEYS, METHOD_BUFFERED, FILE_WRITE_DATA);
const IOCTL_AUTOTYPER_SET_N_KEY = CTL_CODE(FILE_DEVICE_KEYBOARD, AUTOTYPER_FUNCTION_SET_N_KEY, METHOD_BUFFERED, FILE_WRITE_DATA);
const IOCTL_AUTOTYPER_SET_MODIFIER_KEYS = CTL_CODE(FILE_DEVICE_KEYBOARD, AUTOTYPER_FUNCTION_SET_MODIFIER_KEYS, METHOD_BUFFERED, FILE_WRITE_DATA);
const IOCTL_AUTOTYPER_START = CTL_CODE(FILE_DEVICE_KEYBOARD, AUTOTYPER_FUNCTION_START, METHOD_BUFFERED, FILE_WRITE_DATA);
const IOCTL_AUTOTYPER_SET_PERIOD = CTL_CODE(FILE_DEVICE_KEYBOARD, AUTOTYPER_FUNCTION_SET_PERIOD, METHOD_BUFFERED, FILE_WRITE_DATA);
const IOCTL_AUTOTYPER_STOP = CTL_CODE(FILE_DEVICE_KEYBOARD, AUTOTYPER_FUNCTION_STOP, METHOD_BUFFERED, FILE_WRITE_DATA);

const GUID_DEVINTERFACE_AUTOTYPER = DEFINE_GUID(0x4e8b1a42, 0x55bc, 0x455f, 0xb6, 0x80, 0x0, 0x19, 0x29, 0xf0, 0xcd, 0xc);

const MAX_KEYS = 8; //my driver can only send up to 8 keys so changing this variable won't actually do anything

const conversionMap = {};

//see the ASCII_to_HID.js to see how i made this long list
conversionMap[NULL] = NULL;
conversionMap["a".charCodeAt(0)] = 4;
conversionMap["A".charCodeAt(0)] = 4;
conversionMap["b".charCodeAt(0)] = 5;
conversionMap["B".charCodeAt(0)] = 5;
conversionMap["c".charCodeAt(0)] = 6;
conversionMap["C".charCodeAt(0)] = 6;
conversionMap["d".charCodeAt(0)] = 7;
conversionMap["D".charCodeAt(0)] = 7;
conversionMap["e".charCodeAt(0)] = 8;
conversionMap["E".charCodeAt(0)] = 8;
conversionMap["f".charCodeAt(0)] = 9;
conversionMap["F".charCodeAt(0)] = 9;
conversionMap["g".charCodeAt(0)] = 10;
conversionMap["G".charCodeAt(0)] = 10;
conversionMap["h".charCodeAt(0)] = 11;
conversionMap["H".charCodeAt(0)] = 11;
conversionMap["i".charCodeAt(0)] = 12;
conversionMap["I".charCodeAt(0)] = 12;
conversionMap["j".charCodeAt(0)] = 13;
conversionMap["J".charCodeAt(0)] = 13;
conversionMap["k".charCodeAt(0)] = 14;
conversionMap["K".charCodeAt(0)] = 14;
conversionMap["l".charCodeAt(0)] = 15;
conversionMap["L".charCodeAt(0)] = 15;
conversionMap["m".charCodeAt(0)] = 16;
conversionMap["M".charCodeAt(0)] = 16;
conversionMap["n".charCodeAt(0)] = 17;
conversionMap["N".charCodeAt(0)] = 17;
conversionMap["o".charCodeAt(0)] = 18;
conversionMap["O".charCodeAt(0)] = 18;
conversionMap["p".charCodeAt(0)] = 19;
conversionMap["P".charCodeAt(0)] = 19;
conversionMap["q".charCodeAt(0)] = 20;
conversionMap["Q".charCodeAt(0)] = 20;
conversionMap["r".charCodeAt(0)] = 21;
conversionMap["R".charCodeAt(0)] = 21;
conversionMap["s".charCodeAt(0)] = 22;
conversionMap["S".charCodeAt(0)] = 22;
conversionMap["t".charCodeAt(0)] = 23;
conversionMap["T".charCodeAt(0)] = 23;
conversionMap["u".charCodeAt(0)] = 24;
conversionMap["U".charCodeAt(0)] = 24;
conversionMap["v".charCodeAt(0)] = 25;
conversionMap["V".charCodeAt(0)] = 25;
conversionMap["w".charCodeAt(0)] = 26;
conversionMap["W".charCodeAt(0)] = 26;
conversionMap["x".charCodeAt(0)] = 27;
conversionMap["X".charCodeAt(0)] = 27;
conversionMap["y".charCodeAt(0)] = 28;
conversionMap["Y".charCodeAt(0)] = 28;
conversionMap["z".charCodeAt(0)] = 29;
conversionMap["Z".charCodeAt(0)] = 29;
conversionMap["1".charCodeAt(0)] = 30;
conversionMap["!".charCodeAt(0)] = 30;
conversionMap["2".charCodeAt(0)] = 31;
conversionMap["@".charCodeAt(0)] = 31;
conversionMap["3".charCodeAt(0)] = 32;
conversionMap["#".charCodeAt(0)] = 32;
conversionMap["4".charCodeAt(0)] = 33;
conversionMap["$".charCodeAt(0)] = 33;
conversionMap["5".charCodeAt(0)] = 34;
conversionMap["%".charCodeAt(0)] = 34;
conversionMap["6".charCodeAt(0)] = 35;
conversionMap["^".charCodeAt(0)] = 35;
conversionMap["7".charCodeAt(0)] = 36;
conversionMap["&".charCodeAt(0)] = 36;
conversionMap["8".charCodeAt(0)] = 37;
conversionMap["*".charCodeAt(0)] = 37;
conversionMap["9".charCodeAt(0)] = 38;
conversionMap["(".charCodeAt(0)] = 38;
conversionMap["0".charCodeAt(0)] = 39;
conversionMap[")".charCodeAt(0)] = 39;
conversionMap[VK_RETURN] = 40;          //i had to add these myself lol
conversionMap[VK_ESCAPE] = 41;          //#
conversionMap[VK_BACK] = 42;            //#
conversionMap[VK_TAB] = 43;             //#
conversionMap[" ".charCodeAt(0)] = 44;  //#
conversionMap["-".charCodeAt(0)] = 45;
conversionMap["=".charCodeAt(0)] = 46;
conversionMap["+".charCodeAt(0)] = 46;
conversionMap["[".charCodeAt(0)] = 47;
conversionMap["{".charCodeAt(0)] = 47;
conversionMap["]".charCodeAt(0)] = 48;
conversionMap["}".charCodeAt(0)] = 48;
conversionMap["\\".charCodeAt(0)] = 49;
conversionMap["|".charCodeAt(0)] = 49;
conversionMap[";".charCodeAt(0)] = 51;
conversionMap[":".charCodeAt(0)] = 51;
conversionMap["'".charCodeAt(0)] = 52;
conversionMap["\"".charCodeAt(0)] = 52;
conversionMap[",".charCodeAt(0)] = 54;
conversionMap["<".charCodeAt(0)] = 54;
conversionMap[".".charCodeAt(0)] = 55;
conversionMap[">".charCodeAt(0)] = 55;
conversionMap["/".charCodeAt(0)] = 56;
conversionMap["?".charCodeAt(0)] = 56;

let autotyper;

let window, font, startButton, stopButton, keyTextBox, insertEnterCheckbox;

const hotkeyId = 21000; //number from 0 to 0xBFFF

let hourTB;
let minuteTB;
let secondTB;
let milliTB;

let hours = 0;
let mins = 0;
let secs = 0;
let milli = 100;

function UpdateTime(ts, code) {
    if(code == EN_CHANGE) {
        print("UpdateTime:",ts);
        switch(ts) {
            case hourTB.textBox: {
                hours = parseInt(GetWindowText(ts)) || 0;
                break;
            }
            case minuteTB.textBox: {
                mins = parseInt(GetWindowText(ts)) || 0;
                break;
            }
            case secondTB.textBox: {
                secs = parseInt(GetWindowText(ts)) || 0;
                break;
            }
            case milliTB.textBox: {
                print(GetWindowText(ts));
                milli = parseInt(GetWindowText(ts)) || 0;
                break;
            }
            default: {
                break;
            }
        }

        //autotyper.calculatePeriod();
        autotyper.period = (hours*1000*60*60)+(mins*1000*60)+(secs*1000)+milli;
    }
}

let i = 1;
const callbacks = [undefined];

class Button {
    //static i = 1; //im pretty sure there's a reason you shouldn't set a button's hmenu to 0 for wm_command lol
    //static callbacks = [undefined];

    static new(text, styles, x, y, width, height, callback, disabled) {
        const button = CreateWindow(NULL, "BUTTON", text, styles | WS_CHILD | WS_VISIBLE, x, y, width, height, window, i, hInstance);
        SendMessage(button, WM_SETFONT, font, true);
        //SendMessage(button, WM_ENABLE, !disabled, NULL);
        EnableWindow(button, !disabled);
        callbacks[i] = callback;
        i++;
        return button;
    }
}

class Text {
    static new(dc, text, x, y) {
        const {width, height} = GetTextExtentPoint32(dc, text);
        const t = CreateWindow(NULL, "STATIC", text, WS_CHILD | WS_VISIBLE, x, y, width, height, window, NULL, hInstance); //wtf?? static is a strict mode keyword? (lol why am i surprised i just used it two lines ago)
        SendMessage(t, WM_SETFONT, font, true);
        return t;
    }
}

class TextBox {
    static new(text, x, y, width, height, styles, onEdit) {
        let id = NULL;
        if(onEdit) {
            id = i;
            callbacks[i] = onEdit;
            i++;
        }
        const tb = CreateWindow(NULL, "EDIT", text, styles | WS_BORDER | WS_CHILD | WS_VISIBLE, x, y, width, height, window, id, hInstance);
        SendMessage(tb, WM_SETFONT, font, true);
        return tb;
    }
}

class AutoTyper {
    #period = 100; //ULONG
    #modifierKeys = 0; //BYTE
    started = false;

    constructor(handle) {
        this.handle = handle;
    }

    SetKeys(stringofmax8keys) {
        const keyData = new Uint8Array(MAX_KEYS);
        const len = Math.min(MAX_KEYS, stringofmax8keys.length);
        //const conversionMap = {};
        //for(let i = "1".charCodeAt(0); i < "9".charCodeAt(0); i++) {
        //    conversionMap[i] = 0x1E+i-"1".charCodeAt(0);
        //}
        //conversionMap["0".charCodeAt(0)] = 0x27;
        for(let i = 0; i < len; i++) {
            const keycode = stringofmax8keys[i].toLowerCase().charCodeAt(0);
            //hmm how to convert keyname to weird keycode thing they have in the usb hid spec on pdf page 90 https://www.usb.org/sites/default/files/hut1_4.pdf (oops i was looking at an older version! the latest is hut1_6.pdf)
            //if(keycode >= 97) { //'a'
            //    keyData[i] = keycode-93; // 97 -> 4 (because for some reason 4 is the a key for the hid spec)
            //}else {
            //    
            //}
            keyData[i] = conversionMap[keycode];
        }
        print("keys:", keyData);
        if(DeviceIoControl(this.handle, IOCTL_AUTOTYPER_SET_KEYS, keyData, undefined, undefined)) { //honestly imma keep it real, you will probably crash if you send more than MAX_KEYS bytes! (ok nevermind! i didn't plan on fixing it lol but the way i was doing it before crashed anyways even if you did MAX_KEYS bytes)
            print("autotyper keys successfully written!");
        }else {
            const g = GetLastError();
            print(`autotyper keys unsuccessfully written! (${_com_error(g)}) [${g}]`);
        }
    }

    SetNKey(keycode, n) {
        const buffer = new Uint8Array(2);
        buffer[0] = n;
        buffer[1] = conversionMap[keycode];
        if (DeviceIoControl(this.handle, IOCTL_AUTOTYPER_SET_N_KEY, buffer, undefined, undefined)) { //honestly imma keep it real, you will probably crash if you send more than MAX_KEYS bytes! (ok nevermind! i didn't plan on fixing it lol but the way i was doing it before crashed anyways even if you did MAX_KEYS bytes)
            print(`autotyper set key[${n}] successfully written!`);
        } else {
            const g = GetLastError();
            print(`autotyper set key[${n}] unsuccessfully written! (${_com_error(g)}) [${g}]`);
        }
    }

    Start() {
        //print(this);
        //const buffer = new ArrayBuffer(1);
        //buffer[0] = parseInt(this.#period);
        const buffer = new Uint32Array(1);
        buffer[0] = parseInt(this.#period);
        if(DeviceIoControl(this.handle, IOCTL_AUTOTYPER_START, buffer, undefined, undefined)) { //period is optional
            print("autotyper timer successfully started");
            EnableWindow(startButton, false);
            EnableWindow(stopButton, true);
            this.started = true;
        }else {
            const g = GetLastError();
            print(`autotyper timer unsuccessfully started! (${_com_error(g)}) [${g}]`);
        }
    }

    get period() {
        return this.#period;
    }

    set period(newval) {
        //const buffer = new ArrayBuffer(1);
        //buffer[0] = parseInt(newval);
        //print(buffer[0]);
        //oops wait i just remembered the period is actually an unsigned long (4 bytes!)
        const buffer = new Uint32Array(1);
        buffer[0] = parseInt(newval);
        if(DeviceIoControl(this.handle, IOCTL_AUTOTYPER_SET_PERIOD, buffer, undefined, undefined)) {
            print("period successfully changed");
            this.#period = newval;
        }else {
            const g = GetLastError();
            print(`period unsuccessfully changed! (${_com_error(g)}) [${g}]`);
        }
    }

    get modifierKeys() {
        return this.#modifierKeys;
    }

    set modifierKeys(newval) {
        const buffer = new Uint8Array(1);
        buffer[0] = newval;
        if(DeviceIoControl(this.handle, IOCTL_AUTOTYPER_SET_MODIFIER_KEYS, buffer, undefined, undefined)) { //honestly imma keep it real, you will probably crash if you send more than 1 byte!
            print("modifierKeys have been successfully changed");
            this.#modifierKeys = newval;
        }else {
            const g = GetLastError();
            print(`modifierKeys have been unsuccessfully changed! (${_com_error(g)}) [${g}]`);
        }
    }

    Stop() {
        if(DeviceIoControl(this.handle, IOCTL_AUTOTYPER_STOP, undefined, undefined, undefined)) {
            print("autotyper timer successfully stopped");
            EnableWindow(startButton, true);
            EnableWindow(stopButton, false);
            this.started = false;
        }else {
            const g = GetLastError();
            print(`autotyper timer unsuccessfully stopped (because it probably didn't exist!@) (${_com_error(g)}) [${g}]`);
        }
    }

    Release() {
        CloseHandle(this.handle);
        this.handle = NULL;
    }
}

/*class GDI {
    static drawTo(dc, callback) {
        const memDC = CreateCompatibleDC(dc);
        callback(memDC);
        DeleteDC(memDC);
    }
}*/

class Element {
    constructor(x, y, width, height) {
        this.left = x;
        this.right = x+width;
        this.top = y;
        this.bottom = y+height;
    }

    paint(dc) {

    }
}

class LegendElement extends Element { //win forms has sumn like this but we gotta do it ourselves (somehow) (wait this thing is called a group box?)
    constructor(dc, text, x, y, width, height) {
        super(x, y, width, height);
        this.text = CreateWindow(NULL, "STATIC", text, WS_CHILD | WS_VISIBLE, x+7, y-7, GetTextExtentPoint32(dc, text).width, 16, window, NULL, hInstance);
        SendMessage(this.text, WM_SETFONT, font, true);
    }

    paint(dc) {
        const oldpen = SelectObject(dc, GetStockObject(DC_PEN));
        const oldbrush = SelectObject(dc, GetStockObject(DC_BRUSH));
        SetDCPenColor(dc, RGB(220, 220, 220));
        SetDCBrushColor(dc, RGB(240, 240, 240)); //why GetBkColor give me white
        //uhhh idk why but using Rectangle basically filled the inside with white so i'll just use the real fill rect so i can do it myself
        FillRect(dc, this.left, this.top, this.right, this.bottom, NULL)
        Rectangle(dc, this.left, this.top, this.right, this.bottom);
        RedrawWindow(this.text, this.left, this.top, this.right, this.bottom, undefined, RDW_UPDATENOW); //[prolly]
        SelectObject(dc, oldbrush);
        SelectObject(dc, oldpen);
    }
}

class TextBoxAndLabel extends Element {
    constructor(dc, tbText, label, x, y, tbStyles, onEdit) {
        super(x, y, 0, 0);
        //this.textBox = CreateWindow(NULL, "EDIT", tbText, tbStyles | WS_BORDER  | WS_CHILD | WS_VISIBLE, x, y, 49, 21, window, NULL, hInstance);
        this.textBox = TextBox.new(tbText, x, y, 49, 21, tbStyles, onEdit);
        //const labelSize = GetTextExtentPoint32(dc, label);
        //this.label = CreateWindow(NULL, "STATIC", label, WS_CHILD | WS_VISIBLE, x+49+7, y, labelSize.width, labelSize.height, window, NULL, hInstance);
        this.label = Text.new(dc, label, x+49+7-1, y+2);
        //SendMessage(this.textBox, WM_SETFONT, font, true);
    }
}

const elements = [];

function windowProc(hwnd, msg, wp, lp) {
    if (msg == WM_CREATE) {
        window = hwnd;
        font = GetDefaultFont();

        const correctlist = CM_Get_Device_Interface_List(GUID_DEVINTERFACE_AUTOTYPER, NULL, NULL, CM_GET_DEVICE_INTERFACE_LIST_PRESENT, true);
        print(correctlist);

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
            print("no autotyper driver devices found!");
        }

        const handle = CreateFile(str, GENERIC_READ | GENERIC_WRITE, FILE_SHARE_READ | FILE_SHARE_WRITE, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
        if(handle == INVALID_HANDLE_VALUE) {
            if(str) {
                const g = GetLastError();
                print(`CreateFile failed! (${_com_error(g)}) [${g}]`);
            }else {
                print("no string was found so CreateFile failed.");
            }
            //autotyper = new AutoTyper(NULL); //for testing ;)
        }else {
            autotyper = new AutoTyper(handle);
        }

        const dc = GetDC(hwnd);
        SelectObject(dc, font);
        startButton = Button.new("Start (F8)", NULL, 17-1, 269-33, 193, 39, autotyper.Start.bind(autotyper), false);
        stopButton = Button.new("Stop (F8)", NULL, 233-1, 269-33, 193, 39, autotyper.Stop.bind(autotyper), true);
        Button.new("Hotkey setting", NULL, 17-1, 317-33, 193, 39, () => {

        }, false);
        Button.new("Record & Playback", NULL, 233-1, 317-33, 193, 39, () => {
            //not yet little buddy.
        }, false);

        hourTB = new TextBoxAndLabel(dc, hours, "hours", 17-1, 58-33, ES_RIGHT | ES_NUMBER, UpdateTime);
        minuteTB = new TextBoxAndLabel(dc, mins, "mins", 113-1, 58-33, ES_RIGHT | ES_NUMBER, UpdateTime);
        secondTB = new TextBoxAndLabel(dc, secs, "secs", 201-1, 58-33, ES_RIGHT | ES_NUMBER, UpdateTime);
        milliTB = new TextBoxAndLabel(dc, milli, "milliseconds", 297-1, 58-33, ES_RIGHT | ES_NUMBER, UpdateTime);

        elements.push(
            new LegendElement(dc, "Type interval", 9-1, 40-33, 425, 50),
                hourTB,
                minuteTB,
                secondTB,
                milliTB,
            
            //new LegendElement(dc, "N/A", 9-1, 201-33, 425, 53),
        );

        elements.push(new LegendElement(dc, "Type options", 9-1, 104-33, 193, 82));
            Text.new(dc, "Keys (8 max): ", 17-1, 122-33+1);
            keyTextBox = TextBox.new("", 105-1, 122-33, 81, 21, ES_LOWERCASE, (ts, code) => {
                print(ts, code);
                if(code == EN_CHANGE) { //bruh i haven't defined any of the edit control notification codes (ok now i did)
                    if (GetWindowTextLength(ts) > MAX_KEYS) {
                        SetWindowText(ts, GetWindowText(ts).substring(0, MAX_KEYS)); //calling SetWindowText will trigger EN_CHANGE on the text box so we return early!
                        debugger;
                        return;
                    }
                    autotyper.SetKeys(GetWindowText(ts));
                    if (IsDlgButtonChecked(hwnd, GetMenu(insertEnterCheckbox))) {
                        autotyper.SetNKey(VK_RETURN, MAX_KEYS - 1);
                    }
                }
            });
            insertEnterCheckbox = Button.new("Insert Enter after typing", BS_AUTOCHECKBOX, 17-1, 153-33, 169, 21, (ts) => {
                const checked = IsDlgButtonChecked(hwnd, GetMenu(ts)); //lol
                if (checked) {
                    autotyper.SetNKey(VK_RETURN, MAX_KEYS - 1);
                } else {
                    //autotyper.SetNKey(NULL, MAX_KEYS - 1);
                    autotyper.SetKeys(GetWindowText(keyTextBox)); //reset the keys to how they were before lol
                }
            }, false);

        elements.push(new LegendElement(dc, "Type repeat", 217-1, 104-33, 217, 82))
            Button.new("Repeat", BS_AUTORADIOBUTTON, 233-1, 124-33, 81, 13, (ts) => {
                print("fuck nah \x07");
            }, false);
            //ok lowkey this is looking kind complicated
            SendMessage(Button.new("Repeat until stopped", BS_AUTORADIOBUTTON | BS_DEFPUSHBUTTON, 233-1, 156-33, 185, 13, (ts) => {
                
            }, false), BM_SETCHECK, BST_CHECKED, 1);

        elements.push(new LegendElement(dc, "Modifier keys", 9-1, 201-33, 425, 53));
        {
            const modifiers = [
                "Left Ctrl",
                "Left Shift",
                "Left Alt",
                "Left GUI",
                "Right Ctrl",
                "Right Shift",
                "Right Alt",
                "Right GUI",
            ];
            let shift = 0;
            let width = 0;
            let y = 212;
            for(const modifier of modifiers) {
                const calculatedWidth = GetTextExtentPoint32(dc, modifier).width+50;
                if(shift == 4) { //shift the things down
                    width = 0;
                    y = 230;
                }
                const x = 17-1+width;
                (function(shift) { //closure shit for shift capture
                    Button.new(modifier, BS_AUTOCHECKBOX, x, y-33, calculatedWidth, 16, (ts) => {
                        const checked = IsDlgButtonChecked(hwnd, GetMenu(ts)); //lol
                        //autotyper.updateModifierKeys();
                        //broskis, i thought since i made a function here it should capture the value of shift? (ok nah)
                        print(shift);
                        if(checked) {
                            autotyper.modifierKeys |= 1 << shift;
                        }else {
                            autotyper.modifierKeys ^= 1 << shift;
                        }
                        print(autotyper.modifierKeys.toString(2));
                    }, false);
                })(shift);
                shift++;
                width += calculatedWidth;
            }
            /*Button.new("Left Ctrl", BS_AUTOCHECKBOX, 17-1, 221-33, GetTextExtentPoint32(dc, "Left Ctrl").width+20, 13, (ts) => {

            }, false);*/
        }

        ReleaseDC(hwnd, dc);

        //CreateWindow(NULL, "BUTTON", "Change mode", WS_CHILD | WS_VISIBLE, 25, 75, 100, 20, hwnd, 1, hInstance);
        //CreateWindow(NULL, "BUTTON", "Set mode", WS_CHILD | WS_VISIBLE, 25+125, 75, 100, 20, hwnd, 2, hInstance);
        //CreateWindow(NULL, "BUTTON", "Get mode", WS_CHILD | WS_VISIBLE, 25+125+125, 75, 100, 20, hwnd, 3, hInstance);
        //CreateWindow(NULL, "BUTTON", "Start (F8)", WS_CHILD | WS_VISIBLE, 17, 269, 193, 39, hwnd, 1, hInstance);
        if (!RegisterHotKey(hwnd, hotkeyId, NULL, VK_F8)) {
            const g = GetLastError();
            print(`RegisterHotKey failed? (${_com_error(g)}) [${g}]`);
        }
    } else if (msg == WM_HOTKEY) {
        //wp is the id of the hotkey hit while the LOWORD of lp is the modifiers and the HIWORD of the lp is the keycode
        print(wp, LOWORD(lp), HIWORD(lp));
        print("Autotyper hit!");

        if (autotyper.started) {
            autotyper.Stop();
        } else {
            autotyper.Start();
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
    }else if(msg == WM_COMMAND) {
        const classname = GetClassName(lp);
        print(classname, wp, lp);
        try {
            if(classname == "Edit") {
                callbacks[LOWORD(wp)](lp, HIWORD(wp));
            }else {
                callbacks[wp](lp); //ok
            }
        }catch(e) {
            print(e); //shhhhhh
        }
    }else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);
        for(const element of elements) {
            element.paint(ps.hdc);
        }
        EndPaint(hwnd, ps);
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        autotyper?.Release();
        print(UnregisterHotKey(hwnd, hotkeyId) == 1);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = CreateSolidBrush(RGB(240, 240, 240));
wc.hCursor = LoadCursor(NULL, IDC_ARROW);
wc.style = CS_VREDRAW;

CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_TOPMOST, wc, "OP Auto Typer 3.0", WS_OVERLAPPED | WS_CAPTION | WS_POPUP | WS_VISIBLE | WS_CLIPSIBLINGS | WS_SYSMENU | WS_MINIMIZEBOX, CW_USEDEFAULT, CW_USEDEFAULT, 448+14, 369+7, NULL, NULL, hInstance);