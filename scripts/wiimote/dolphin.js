//don't get too excited im only doing the gui part

//im probably gonna use gdi lol
eval(require("fs").read(__dirname+"/hid_wiimote.js"));

let window, font, hand, boldFont, bigFont, connectButton, deviceDropdown, batteryText, irButton/*, irModeDropdown*/, irSensitivityDropdown, extensionStatusText;
const wiimotebuttonButtons = {}; //object for O(1) performance :smirk:
let extensionbuttonButtons = {};
let wiimotes = [];
let currentWiimote;
let statusTimer = 0;
const clickareas = []; //i can't be bothered to use my mastercontrols or anything so instead im just gonna make click areas
const ledRectangles = [];
const variousButtonsThatShouldBeEnabledWhenAWiimoteIsConnected = [];
const dotDisplays = [];
const dotBmps = [];

const irlegendwidth = 300;

let waitingforextensionbuttons = false;

const sensitivities = [];
for(const key in globalThis) {
    if(key.startsWith("IR_SENSITIVITY_")) {
        const temp = {};
        temp.value = globalThis[key];
        temp.key = key;
        sensitivities.push(temp);
    }
}

let w = 975;
let h = 787;

let i = 1;
const callbacks = {}; //[undefined]; //wait lol it doesn't need to be an array i never use the array functions
const elements = [];

function withinBoundsWH({x, y, width, height}, pair) { //ptsd seeing this function
    return pair.x > x && pair.y > y && pair.x < x+width && pair.y < y+height;
}

function withinBoundsTLRB({left, top, right, bottom}, pair) {
    return pair.x > left && pair.y > top && pair.x < right && pair.y < bottom;
}

//these classes stolen from ignore/autotyperdriverconfigure.js!

class Text {
    static new(dc, text, x, y, font) {
        const old = SelectObject(dc, font);
        const {width, height} = GetTextExtentPoint32(dc, text);
        SelectObject(dc, old);
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
        //RedrawWindow(this.text, this.left, this.top, this.right, this.bottom, undefined, RDW_UPDATENOW | RDW_INVALIDATE); //[prolly] (i don't think i need this lol)
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
        RedrawWindow(window, this.left, this.top, this.right, this.bottom, undefined, RDW_UPDATENOW | RDW_INVALIDATE); //oh you need invalidate for it to actually work lol
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
        //EnableWindow(rumbleButton, false);
        for(const button of variousButtonsThatShouldBeEnabledWhenAWiimoteIsConnected) {
            EnableWindow(button, false);
        }
        EnableWindow(irButton, false);
        ShowWindow(extensionStatusText, SW_SHOW);
        destroyExtensionButtonButtons();
        //for(const key in wiimotebuttonButtons) {
        //    const button = wiimotebuttonButtons[key];
        //    EnableWindow(button, true);
        //}
    }else {
        statusTimer = Date.now() + 10000;
        currentWiimote = new hid_wiimote(handle, (status) => {
            //WiimoteHandleStatusUpdate(status); //don't worry we call this in the loop function
            //extra stuff that doesn't need to happen over and over
            print("first status", status);
            currentWiimote.setDataReportingMode(false, 0x35);
            if(status.extension) {
                waitingforextensionbuttons = true;
            }
            if(status.IRcamera) {
                //lowkey i gotta change the reporting mode real quick because the ir mode goes so fast i can't read the memory
                //let lastmode = currentWiimote.reportingMode;
                //currentWiimote.setDataReportingMode(false, 0x30);
                //uhhh we're just gonna wait like 100 ms lmao
                //hmm ts not working bruh
                //ok im not sure about any of the stuff i just said lol idk what was going on
                /*const data = */currentWiimote.readMemory(0x04, 0xb00000, 9, (success, data) => { //reading sensitivity block 1 from the ir camera
                    if(success) {
                        print(data);
                        //instead of hardcoding these i could just use Object.keys(globalThis) to find the IR_SENSITIVITY variables (which now that im writing that out loud it doesn't seem like a bad idea)
                        //const sensitivitiestocheck = [IR_SENSITIVITY_MARCAN, IR_SENSITIVITY_MAX, IR_SENSITIVITY_HIGH, IR_SENSITIVITY_WII_LEVEL_1, IR_SENSITIVITY_WII_LEVEL_2, IR_SENSITIVITY_WII_LEVEL_3, IR_SENSITIVITY_WII_LEVEL_4, IR_SENSITIVITY_WII_LEVEL_5];
                        let str, index; //i don't have to use index but since im using sensitivities for the irSensitivityDropdown too they SHOULD be in the same order
                        // for(const {key, value} of sensitivities) {
                        for(let i = 0; i < sensitivities.length; i++) {
                            const {key, value} = sensitivities[i];
                            if(value.slice(0,9).every((v,i)=>v==data[i])) { //chill
                                str = key;
                                index = i;
                                break;
                            }
                        }

                        print(str, index);

                        if(str) {
                            SendMessage(irSensitivityDropdown, CB_SETCURSEL, index, 0);
                            //currentWiimote.setDataReportingMode(false, lastmode);
                            if(currentWiimote.IR.mode != IR_MODE_FULL) {
                                //re open ts because idgaf about the other modes because they don't have the blobs lol
                                currentWiimote.enableIR(globalThis[str], IR_MODE_FULL);
                            }
                        }
                    }
                });
                //currentWiimote.setDataReportingMode(false, 0x3e);
                //EnableWindow(irButton, true);
            }//else if(GetWindowText(irSensitivityDropdown)) {
                //EnableWindow(irButton, true);
            //}
        });
        //EnableWindow(rumbleButton, true);
        for(const button of variousButtonsThatShouldBeEnabledWhenAWiimoteIsConnected) {
            EnableWindow(button, true);
        }
        EnableWindow(irButton, true);
        //for(const key in wiimotebuttonButtons) {
        //    const button = wiimotebuttonButtons[key];
        //    EnableWindow(button, true);
        //}
        currentWiimote.addEventListener("onButtonDown", undefined, (button) => {
            SendMessage(wiimotebuttonButtons[button], WM_SETFONT, boldFont, true);
        });
        currentWiimote.addEventListener("onButtonUp", undefined, (button) => {
            SendMessage(wiimotebuttonButtons[button], WM_SETFONT, font, true);
        });
        currentWiimote.addEventListener("onIRdata", undefined, WiimoteIRCallback);
        currentWiimote.addEventListener("onIRdotlost", undefined, WiimoteIRDotLostCallback);
        currentWiimote.addEventListener("onextensionchange", undefined, WiimoteExtensionChangeCallback);
        currentWiimote.addEventListener("onextensionbuttondown", undefined, (curId, extensionObj, button) => {
            /*if(!extensionbuttonButtons[button]) {
                //yeah we're just gonna initialize it right now lol
                let i = 0;
                const dc = GetDC(window);
                SelectObject(dc, font);
                for(const name in extensionObj.buttons) {
                    const textWindow = Text.new(dc, name, 254 + irlegendwidth + 7 + 8, 137 + (30*i) + 4, font);
                    const buttonWindow = Button.new(name, NULL, 254 + irlegendwidth + 7 + 51, 137 + (30*i), 163, 24, keybindcallback, true);
                    extensionbuttonButtons[name] = {buttonWindow, textWindow};
                    i++;
                }
                ReleaseDC(window, dc);
            }*/
            SendMessage(extensionbuttonButtons[button].buttonWindow, WM_SETFONT, boldFont, true);
        });
        currentWiimote.addEventListener("onextensionbuttonup", undefined, (curId, extensionObj, button) => {
            SendMessage(extensionbuttonButtons[button].buttonWindow, WM_SETFONT, font, true);
        });
    }
}

function WiimoteHandleStatusUpdate(status) {
    //statusTimer = Date.now() + 10000;
    SetWindowText(batteryText, status.batteryLevel+"%");
    for(let i = 0; i < 4; i++) {
        ledRectangles[i].SetColor(status.leds[i] ? RGB(0x33, 0x77, 0xff) : RGB(0x44, 0x44, 0x44));
    }
    if(status.IRcamera) {
        SetWindowText(irButton, "Disable IR"); //why is this not updating the button immediately? (oh wait a second when you press the button i don't ask for a new status >:( )
    }else {
        SetWindowText(irButton, "Enable IR");
    }
    if(status.extension) {
        ShowWindow(extensionStatusText, SW_HIDE);
    }
    //dang it how could i forget that i only update the irbutton when a status comes in >:(
    //ShowWindow(irButton, SW_SHOW);
    //RedrawWindow(irButton, 0, 0, 0, 0, NULL, )
    //InvalidateRect(irButton, 0, 0, w, h);
    //RedrawWindow(window, 254 + (300/2) - (254/2), 137 + 22 + 8, 254 + (300/2) - (254/2) + 254, 137 + 22 + 8 + 24, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
}

//function WiimoteButtonDownCallback(button) {
//    SendMessage(wiimotebuttonButtons[button], WM_SETFONT, boldFont, true);
//}
//
//function WiimoteButtonUpCallback(button) {
//    SendMessage(wiimotebuttonButtons[button], WM_SETFONT, font, true);
//}

function WiimoteIRCallback(IR) {
    const dc = GetDC(window); //you already know
    const mouse = GetCursorPos();
    ScreenToClient(window, mouse);
    // const oldbrush = SelectObject(dc, GetStockObject(DC_BRUSH));
    // const oldpen = SelectObject(dc, GetStockObject(DC_PEN));
    switch(IR.mode) {
        case IR_MODE_BASIC:
            break;
        case IR_MODE_EXTENDED:
            break;
        case IR_MODE_FULL:
            for(let i = 0; i < 4; i++) {
                if(IR.dots[i]) {
                    const memDC = CreateCompatibleDC(dc); //good ole gdi
                    SelectObject(memDC, dotBmps[i]);
                    SelectObject(memDC, GetStockObject(DC_BRUSH));
                    SelectObject(memDC, GetStockObject(DC_PEN));
                    SelectObject(memDC, font);
                    FillRect(memDC, 0, 0, 128, 96, NULL);
                    Rectangle(memDC, 0, 0, 128, 96);
                    const {minX, minY, maxX, maxY} = IR.dots[i].blob;
                    const display = dotDisplays[i];
                    const offsetX = (display.right-display.left-128)/2;
                    const intensity = IR.dots[i].intensity;
                    SetDCBrushColor(memDC, RGB(intensity, intensity, intensity));
                    //Ellipse(memDC, display.left + minX, display.top + minY, display.left + minX + maxX, display.top + minY + maxY);
                    //TextOut(memDC, display.left + minX, display.top + minY, i); //""+i); //for some reason TextOut crashed when i passed the number directly (but now it doesn't :smirk:)
                    Ellipse(memDC, minX, minY, maxX, maxY);
                    TextOut(memDC, 7-offsetX, -7, "Dot " + i);
                    //TextOut(memDC, minX, minY, i); //""+i); //for some reason TextOut crashed when i passed the number directly (but now it doesn't :smirk:)
                    //FillRect(memDC, minX, minY, maxX, maxY, NULL);
                    //if(i == 0) {
                        //print(IR.dots[i]);
                        //TextOut(dc, 400, 600, objtostr(IR.dots[i]));
                        //DrawText(dc, objtostr(IR.dots[i]), 255, 400, w, h, DT_EXPANDTABS);
                    //}
                    DrawText(memDC, `Size: ${IR.dots[i].size}\nIntensity: ${intensity}`, mouse.x-display.left-offsetX, mouse.y-display.top, 128, 96, DT_EXPANDTABS);
                    BitBlt(dc, display.left + offsetX, display.top, 128, 96, memDC, 0, 0, SRCCOPY);
                    DeleteDC(memDC);
                }
            }
            break;
    }
    // SelectObject(dc, oldpen);
    // SelectObject(dc, oldbrush);
    ReleaseDC(window, dc); //oh my GLOB i forgot this line
}

function WiimoteIRDotLostCallback(IR, index) {
    const dot = IR.dots[index];
}

function WiimoteExtensionChangeCallback(extensionPluggedInMyBoy, prevId) {
    if(extensionPluggedInMyBoy) {
        ShowWindow(extensionStatusText, SW_HIDE);
        extensionbuttonButtons = {};
        waitingforextensionbuttons = true;
        //uhhh we'll initialize extensionbuttonButtons the first time the onExtensionButtonDown callback is hit
    }else {
        ShowWindow(extensionStatusText, SW_SHOW);
        destroyExtensionButtonButtons();
    }
}

function createExtensionButtonButtons() {
    let i = 0;
    const dc = GetDC(window);
    SelectObject(dc, font);
    const obj = currentWiimote.extension[currentWiimote.currentExtensionId].buttons;
    for(const name in obj) {
        const textWindow = Text.new(dc, name, 254 + irlegendwidth + 7 + 8, 137 + (30*i) + 4, font);
        const buttonWindow = Button.new(name, NULL, 254 + irlegendwidth + 7 + 51, 137 + (30*i), 163, 24, keybindcallback, false);
        extensionbuttonButtons[name] = {buttonWindow, textWindow};
        i++;
    }
    ReleaseDC(window, dc);
}

function destroyExtensionButtonButtons() {
    for(const name in extensionbuttonButtons) {
        const {buttonWindow, textWindow} = extensionbuttonButtons[name];
        print(GetMenu(buttonWindow));
        delete callbacks[GetMenu(buttonWindow)]; //lol i gotta cleanup
        DestroyWindow(buttonWindow);
        DestroyWindow(textWindow);
    }
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

            elements.push(new LegendElement(dc, "IR", 254, 119, irlegendwidth, irlegendwidth, RGB(249, 249, 249)));
            irButton = Button.new("Enable IR", NULL, 254 + (300/2) - (254/2), 137 + 22 + 8, 254, 24, (ts) => {
                if(currentWiimote) {
                    if(GetWindowText(ts).startsWith("Enable")) {
                        //if(GetWindowText(irSensitivityDropdown)) {
                            print(globalThis[GetWindowText(irSensitivityDropdown)], "globalThis 01");
                                                    //javascript god
                            currentWiimote.enableIR(globalThis[GetWindowText(irSensitivityDropdown)], IR_MODE_FULL);
                        //}else {
                        //    SetActiveWindow(irSensitivityDropdown);
                        //}
                    }else {
                        currentWiimote.disableIR();
                        currentWiimote.setDataReportingMode(false, 0x35);
                    }
                }
            }, true);
            // irSensitivityDropdown = ComboBox.new(["IR_SENSITIVITY_MARCAN", "IR_SENSITIVITY_MAX", "IR_SENSITIVITY_HIGH", "IR_SENSITIVITY_WII_LEVEL_1", "IR_SENSITIVITY_WII_LEVEL_2", "IR_SENSITIVITY_WII_LEVEL_3", "IR_SENSITIVITY_WII_LEVEL_4", "IR_SENSITIVITY_WII_LEVEL_5"], WS_VSCROLL | CBS_DROPDOWNLIST, 254 + (300/2) - (254/2), 137, 254+1, 22+100, (ts, msg) => {
            irSensitivityDropdown = ComboBox.new(sensitivities.map(({key})=>key), WS_VSCROLL | CBS_DROPDOWNLIST, 254 + (300/2) - (254/2), 137, 254+1, 22+100, (ts, msg) => {
                if(msg == CBN_SELENDOK && currentWiimote) {
                    //EnableWindow(irButton, true);
                }
            });
            SendMessage(irSensitivityDropdown, CB_SETCURSEL, 0, 0);
            //variousButtonsThatShouldBeEnabledWhenAWiimoteIsConnected.push(irButton);
            for(let i = 0; i < 4; i++) {
                const x = 254 + (i%2)*(irlegendwidth/2);
                //const y = (i > 2) ? ; //nah fuclk that
                const y = 199+Math.max(Math.round((i-1)/2), 0)*((irlegendwidth-81)/2); //BRANCHLESS CODE GOD
                const legend = new LegendElement(dc, "Dot " + i, x, y, irlegendwidth/2, (irlegendwidth-81)/2, RGB(0xff, 0xff, 0xff));
                elements.push(legend);
                dotDisplays.push(legend);
                dotBmps.push(CreateCompatibleBitmap(dc, 128, 96));
                //elements.push(new RectangleElement(x, y, 128, 96, RGB(0x33, 0x77, 0xff)));
            }
            //elements.push(new LegendElement(dc, "Dot 0", 254, 141, 300, 300, RGB(249, 249, 249)));
            //elements.push(new LegendElement(dc, "Dot 1", 254, 141, 300, 300, RGB(249, 249, 249)));
            //elements.push(new LegendElement(dc, "Dot 2", 254, 141, 300, 300, RGB(249, 249, 249)));
            //elements.push(new LegendElement(dc, "Dot 3", 254, 141, 300, 300, RGB(249, 249, 249)));

            elements.push(new LegendElement(dc, "Extension", 254 + irlegendwidth + 7, 119, 226, 614, RGB(249, 249, 249)));
            SelectObject(dc, bigFont);
            const tsshitmustard = GetTextExtentPoint32(dc, "N/A");
            extensionStatusText = Text.newOverloadWithWidthHeight("N/A", 254 + irlegendwidth + 7 + (226/2) - tsshitmustard.width/2, 119+32, tsshitmustard.width, tsshitmustard.height, bigFont);
            SelectObject(dc, font);

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
                const button = Button.new(name, NULL, 74, 137 + (30*i/2), 163, 24, keybindcallback, true);
                wiimotebuttonButtons[buttonsList[i]] = button;
                variousButtonsThatShouldBeEnabledWhenAWiimoteIsConnected.push(button);
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
                    ClickArea.create(22 + (226/2) - (overallwidth/2) + i*(8+padding), 614-16, 8+padding, 8+16+8, (mouse, down) => {
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
        /*rumbleButton = */variousButtonsThatShouldBeEnabledWhenAWiimoteIsConnected.push(Button.new("Rumble", NULL, 22 + (226/2) - (150/2), 614 - 119/2, 150, 36, () => {
            currentWiimote.toggleRumble();
        }, true));

        // ComboBox.new(["nigga", "skibidi", "toilet"], WS_VSCROLL | CBS_DROPDOWN, 21, 38+293, 293, 22+100, (idk) => {
        //     print(idk);
        // });

        //SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        //if(currentWiimote) {
        //    currentWiimote.poll(16);
        //    if(statusTimer - Date.now() < 0) {
        //        statusTimer = Date.now() + 10000;
        //        currentWiimote.requestStatus(WiimoteHandleStatusUpdate);
        //    }
        //}
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
        hid_exit();
    }
}

//well i'll be
//you don't see the loop function nowadays
function loop() {
    if(currentWiimote) {
        const raw = currentWiimote.poll(16);
        //if(raw) {
        //    print("Data read: ");
        //    let str = "";
        //    for(let i = 0; i < raw.length; i++) {
        //        str += `0x${raw[i].toString(16)} `;
        //    }
        //    print(str);
        //}
        if(statusTimer - Date.now() < 0) {
            statusTimer = Date.now() + 10000;
            currentWiimote.requestStatus();
        }
        if(raw[0] == 0x20) { //lowkey just handle every status update lol
            WiimoteHandleStatusUpdate(currentWiimote.status);
        }
        if(waitingforextensionbuttons && Object.keys(currentWiimote.extension[currentWiimote.currentExtensionId] || {}).length != 0) {
            createExtensionButtonButtons();
            waitingforextensionbuttons = false;
        }
    }
}

const wc = CreateWindowClass("winclass", windowProc, loop);
wc.hbrBackground = COLOR_WINDOW;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "dolphin controls gui", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+42, NULL, NULL, hInstance);