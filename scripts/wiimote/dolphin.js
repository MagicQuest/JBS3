//don't get too excited im only doing the gui part

//im probably gonna use gdi lol
eval(require("fs").read(__dirname+"/hid_wiimote.js"));

let window, font, hand, boldFont, bigFont, connectButton, rumbleButton, deviceDropdown, batteryText;
let wiimotebuttonButtons = {}; //object for O(1) performance :smirk:
let wiimotes = [];
let currentWiimote;
let statusTimer = 0;
let clickareas = []; //i can't be bothered to use my mastercontrols or anything so instead im just gonna make click areas
let ledRectangles = [];

let w = 975;
let h = 787;

let i = 1;
const callbacks = [undefined];
const elements = [];

function withinBoundsWH({x, y, width, height}, pair) { //ptsd seeing this function
    return pair.x > x && pair.y > y && pair.x < x+width && pair.y < y+height;
}

function withinBoundsTLRB({left, top, right, bottom}, pair) {
    return pair.x > left && pair.y > top && pair.x < right && pair.y < bottom;
}

//these classes stolen from ignore/autotyperdriverconfigure.js!

class Text {
    static new(dc, text, x, y, font = font) {
        const {width, height} = GetTextExtentPoint32(dc, text);
        const t = CreateWindow(NULL, "STATIC", text, WS_CHILD | WS_VISIBLE, x, y, width, height, window, NULL, hInstance); //wtf?? static is a strict mode keyword? (lol why am i surprised i just used it two lines ago)
        SendMessage(t, WM_SETFONT, font, true);
        return t;
    }

    static newOverloadWithWidthHeight(text, x, y, width, height, font = font) {
        const t = CreateWindow(NULL, "STATIC", text, WS_CHILD | WS_VISIBLE, x, y, width, height, window, NULL, hInstance); //wtf?? static is a strict mode keyword? (lol why am i surprised i just used it two lines ago)
        SendMessage(t, WM_SETFONT, font, true);
        return t;
    }
}

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

class ComboBox {
    static new(strings, styles, x, y, width, height, callback) {
        const combobox = CreateWindow(NULL, "COMBOBOX", NULL, styles | WS_CHILD | WS_VISIBLE, x, y, width, height, window, i, hInstance);
        SendMessage(combobox, WM_SETFONT, font, true);
        for(const str of strings) {
            print(SendMessage(combobox, CB_ADDSTRING, NULL, str));
        }
        callbacks[i] = callback;
        i++;
        return combobox;
    }
}

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
    constructor(dc, text, x, y, width, height, bkColor = RGB(240, 240, 240)) {
        super(x, y, width, height);
        this.text = CreateWindow(NULL, "STATIC", text, WS_CHILD | WS_VISIBLE, x+7, y-7, GetTextExtentPoint32(dc, text).width, 16, window, NULL, hInstance);
        SendMessage(this.text, WM_SETFONT, font, true);
        this.bkColor = bkColor;
    }

    paint(dc) {
        const oldpen = SelectObject(dc, GetStockObject(DC_PEN));
        const oldbrush = SelectObject(dc, GetStockObject(DC_BRUSH));
        SetDCPenColor(dc, RGB(220, 220, 220));
        SetDCBrushColor(dc, this.bkColor); //why GetBkColor give me white
        //uhhh idk why but using Rectangle basically filled the inside with white so i'll just use the real fill rect so i can do it myself
        FillRect(dc, this.left, this.top, this.right, this.bottom, NULL)
        Rectangle(dc, this.left, this.top, this.right, this.bottom);
        RedrawWindow(this.text, this.left, this.top, this.right, this.bottom, undefined, RDW_UPDATENOW); //[prolly]
        SelectObject(dc, oldbrush);
        SelectObject(dc, oldpen);
    }
}

class RectangleElement extends Element {
    constructor(x, y, width, height, bkColor) {
        super(x, y, width, height);
        this.bkColor = bkColor;
    }

    SetColor(newColor) {
        this.bkColor = newColor;
        RedrawWindow(window, this.left, this.top, this.right, this.bottom, undefined, RDW_UPDATENOW | RDW_INVALIDATE);
    }

    paint(dc) {
        const oldbrush = SelectObject(dc, GetStockObject(DC_BRUSH));
        SetDCBrushColor(dc, this.bkColor);
        FillRect(dc, this.left, this.top, this.right, this.bottom, NULL);
        SelectObject(dc, oldbrush);
    }
}

class ClickArea {
    constructor(x, y, width, height, callback) {
        this.left = x;
        this.top = y;
        this.right = x+width;
        this.bottom = y+height;
        //this.mouseButtonDown = mouseButtonDown;
        //this.mouseButtonUp = mouseButtonUp;
        this.callback = callback;
    }

    static create(x, y, width, height, callback) {
        clickareas.push(new ClickArea(x, y, width, height, callback));
    }
}

//class CanvasElement extends Element {
//    constructor(x, y, width, height) {
//        super(x, y, width, height);
//        
//    }
//
//    paint(dc) {
//        
//    }
//}

function UpdateDeviceList() {
    wiimotes = [];
    //057e is the vendor id of nintendo
    hid_enumerate(0x057e, 0x0, (ts) => {
        //0306 is the product id for the standard white wiimote (the version i have)
        //0330 is the product id for the "new" wiimote (guaranteed to have wii motion plus according to wherever i found that information)
        if(ts.product_id == 0x0306 || ts.product_id == 0x0330) {
            wiimotes.push(ts);
        }
    });
}

function GetFirstWiimote() {
    UpdateDeviceList();

    if(!wiimotes.length) {
        print("no wiimotes found! \x07");
        return;
    }

    const handle = hid_get_handle_from_info(wiimotes[0]); //just gonna use the first one lol unless you specify a different one in the dtropdown

    print(handle);

    CreateWiimote(handle);
}

function CreateWiimote(handle) {
    if(!handle) {
        print("uhhh we failed to open that one (?)");
        EnableWindow(rumbleButton, false);
        for(const key in wiimotebuttonButtons) {
            const button = wiimotebuttonButtons[key];
            EnableWindow(button, true);
        }
    }else {
        currentWiimote = new hid_wiimote(handle, WiimoteHandleStatusUpdate);
        EnableWindow(rumbleButton, true);
        for(const key in wiimotebuttonButtons) {
            const button = wiimotebuttonButtons[key];
            EnableWindow(button, true);
        }
        currentWiimote.addEventListener("onButtonDown", undefined, WiimoteButtonDownCallback);
        currentWiimote.addEventListener("onButtonUp", undefined, WiimoteButtonUpCallback);
    }
}

function WiimoteHandleStatusUpdate(status) {
    statusTimer = Date.now() + 10000;
    SetWindowText(batteryText, status.batteryLevel+"%");
    for(let i = 0; i < 4; i++) {
        ledRectangles[i].SetColor(status.leds[i] ? RGB(0x33, 0x77, 0xff) : RGB(0x44, 0x44, 0x44));
    }
}

function WiimoteButtonDownCallback(button) {
    SendMessage(wiimotebuttonButtons[button], WM_SETFONT, boldFont, true);
}

function WiimoteButtonUpCallback(button) {
    SendMessage(wiimotebuttonButtons[button], WM_SETFONT, font, true);
}

function keybindcallback() {

}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        window = hwnd;
        font = GetDefaultFont();
        hand = LoadCursor(NULL, IDC_HAND);
        print(GetObjectHFONT(font));
        systemFontProperties = GetObjectHFONT(font);
        systemFontProperties.lfWeight = 600;
        boldFont = CreateFontIndirect(systemFontProperties);
        // systemFontProperties = GetObjectHFONT(font);
        // systemFontProperties.lfWidth *= 3;
        // systemFontProperties.lfHeight *= 3;
        // bigFont = CreateFontIndirect(systemFontProperties);

        bigFont = CreateFont(-36, 0, 0, 0, 400, 0, 0, 0, 1, 0, 0, 0, 0, "Consolas");

        print("Init:",hid_init(),"(0 is good)");

        UpdateDeviceList();
        //GetFirstWiimote();

        print(wiimotes);

        deviceDropdown = ComboBox.new(wiimotes.map(info=>info.product_string), WS_VSCROLL | CBS_DROPDOWNLIST, 21, 38, 293, 22+100, (ts, msg) => {
            if(msg == CBN_SELENDOK) {
                if(currentWiimote) {
                    hid_close(currentWiimote);
                }
                const i = SendMessage(ts, CB_GETCURSEL, NULL, NULL);
                print(i, wiimotes[i]);
                CreateWiimote(hid_get_handle_from_info(wiimotes[i]));
            }
        });

        Button.new("Refresh", NULL, 321, 38, 62, 22, () => {
            SendMessage(deviceDropdown, CB_RESETCONTENT, 0, 0);
            UpdateDeviceList();
            wiimotes.map(info=>info.product_string).forEach(str => {
                print(SendMessage(deviceDropdown, CB_ADDSTRING, NULL, str));
            });
        }, false);

        {
            const dc = GetDC(hwnd);
            SelectObject(dc, bigFont);
            // batteryText = Text.new(dc, "--%", w/2, 3/4 * h, bigFont);
            batteryText = Text.new(dc, "--%", 22 + (226/2) - (30), 614 - 119, bigFont);
            
            SelectObject(dc, font);
            elements.push(new LegendElement(dc, "General / Buttons", 22, 119, 226, 614, RGB(249, 249, 249)));

            elements.push(new LegendElement(dc, "Device", 11, 19, 383, 51));

            const buttonsList = [ //ok im just gonna do this a lazy way so i don't have to write like 13 lines of wiimotebuttonButtons[A_BUTTON] = Button.new("A", NULL, 74, 137, 163, 24, keybindcallback, false);
                A_BUTTON, "A",
                B_BUTTON, "B",
                ONE_BUTTON, "1",
                TWO_BUTTON, "2",
                MINUS_BUTTON, "-",
                PLUS_BUTTON, "+",
                HOME_BUTTON, "HOME",
                UP_BUTTON, "Up",
                DOWN_BUTTON, "Down",
                LEFT_BUTTON, "Left",
                RIGHT_BUTTON, "Right",
            ];

            //wiimotebuttonButtons[A_BUTTON] = Button.new("A", NULL, 74, 137, 163, 24, keybindcallback, false);
            for(let i = 0; i < buttonsList.length; i+=2) {
                const name = buttonsList[i+1];
                Text.new(dc, name, 23 + 8, 137 + (30*i/2) + 4, font);
                wiimotebuttonButtons[buttonsList[i]] = Button.new(name, NULL, 74, 137 + (30*i/2), 163, 24, keybindcallback, true);
            }

            let str = ".";
            let padding = 10;
            let overallwidth = (8+padding)*4;
            for(let i = 0; i < 4; i++) {
                const {width, height} = GetTextExtentPoint32(dc, str);
                Text.newOverloadWithWidthHeight(str, 22 + (226/2) - (overallwidth/2) + i*(8+padding) - width/2 + 4.5, 614-16, width, height, font);
                const rect = new RectangleElement(22 + (226/2) - (overallwidth/2) + i*(padding+8), 614, 8, 8, RGB(0x44, 0x44, 0x44)); //#444444
                elements.push(rect);
                ledRectangles.push(rect); // for use with the wire system. (actually crazy to pull that quote from nowhere, hint: hl-zasm!)
                (function(i) {
                    ClickArea.create(22 + (226/2) - (overallwidth/2) + i*(8+padding), 614-16, 8+padding, 8+16, (mouse, down) => {
                        if(currentWiimote && down) {
                            const newState = !currentWiimote.status.leds[i];
                            currentWiimote.setLED(i, newState);
                            rect.SetColor(newState ? RGB(0x33, 0x77, 0xff) : RGB(0x44, 0x44, 0x44));
                        }
                    });
                })(i); //hmm where else was i trying to do something dumb like this? oh yeah it was ignore/autotyperdriverconfigure.js
                str += ".";
            }

            ReleaseDC(hwnd, dc);
        }

        //rumbleButton = Button.new("Rumble", NULL, w/2 - 75, 3/4*h + 36, 150, 36, () => {
        rumbleButton = Button.new("Rumble", NULL, 22 + (226/2) - (150/2), 614 - 119/2, 150, 36, () => {
            currentWiimote.toggleRumble();
        }, true);

        // ComboBox.new(["nigga", "skibidi", "toilet"], WS_VSCROLL | CBS_DROPDOWN, 21, 38+293, 293, 22+100, (idk) => {
        //     print(idk);
        // });

        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        if(currentWiimote) {
            currentWiimote.poll(16);
            if(statusTimer - Date.now() < 0) {
                //statusTimer = Date.now() + 10000;
                currentWiimote.requestStatus(WiimoteHandleStatusUpdate);
            }
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
    }else if(msg == WM_LBUTTONDOWN) {
        const mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)};
        for(const area of clickareas) {
            if(withinBoundsTLRB(area, mouse)) {
                area.callback(mouse, true);
            }
        }
    }else if(msg == WM_LBUTTONUP) {
        const mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)};
        for(const area of clickareas) {
            if(withinBoundsTLRB(area, mouse)) {
                area.callback(mouse, false);
            }
        }
    }else if(msg == WM_COMMAND) {
        const classname = GetClassName(lp);
        print(classname, wp, lp);
        try {
            if(classname == "Edit" || classname == "ComboBox") {
                callbacks[LOWORD(wp)](lp, HIWORD(wp));
            }else {
                callbacks[wp](lp); //ok
            }
        }catch(e) {
            print(e); //shhhhhh
        }
    }else if(msg == WM_SETCURSOR) {
        const mouse = GetCursorPos();//{x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //i was originally using WM_MOUSEMOVE which passed the mouse position in the lp
        ScreenToClient(hwnd, mouse); //fun (returns nothing and modifies the object)

        for(const area of clickareas) {
            if(withinBoundsTLRB(area, mouse)) {
                SetCursor(hand);
                return true;
            }
        }
    }else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);
        for(const element of elements) {
            element.paint(ps.hdc);
        }
        EndPaint(hwnd, ps);
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        if(currentWiimote) {
            hid_close(currentWiimote);
            currentWiimote = undefined;
        }
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_WINDOW;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "dolphin controls gui", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+42, NULL, NULL, hInstance);