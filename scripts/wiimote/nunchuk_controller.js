//this is a version x360_emulation that just uses the nunchuk and wiimote as a full* controller (i also don't gaf about ds4 because i don't need all that l,ol) (*there's no right thumbstick so if you need one you're cooked lol)

eval(require("fs").read(__dirname+"/hid_wiimote.js")); //ml
eval(require("fs").read(__dirname+"/../ViGEmBus/ViGEmHelper.js")); //TUFFFFF

print("ViGEmBus v1.22.0 -> https://github.com/nefarius/ViGEmBus/releases/tag/v1.22.0");
const console = GetStdHandle(STD_OUTPUT_HANDLE);
SetConsoleTextAttribute(console, FOREGROUND_RED);
printNoHighlight("Note: According to device manager, the version of ViGEmBus I'm currently using to test this script is only 1.14.3.0 (which i got from https://epigramx.github.io/WiimoteHook/ (download link is at the bottom))"); //WiimoteHook is actually the reason i used ViGEm because i already had it loaded lol
SetConsoleTextAttribute(console, 7); //white
Msgbox("This script requires that you have the ViGEmBus driver loaded on your machine. (If you don't, go to the url in the console and download and run the installer, if you want.)", "x360_emulation.js", MB_OK | MB_ICONINFORMATION | MB_SYSTEMMODAL);

//custom defined for my file
const LEFT_TRIGGER_DOWN = -1;
const RIGHT_TRIGGER_DOWN = -2;

let wiimotes = [];
let currentWiimote = undefined;
let previousThumbData = {};
let controller;

const nunchukKeybinds = new Keybinds({
    c: XUSB_GAMEPAD_LEFT_SHOULDER,
    z: LEFT_TRIGGER_DOWN,
}, {
    c: DS4_BUTTON_CROSS,
    z: DS4_BUTTON_SQUARE,
});

// const wiimoteKeybinds = new Keybinds({}, {}); //empty because you can't define (ok NEVERMIND i just learned you can actually do that!)

//normal
//const wiimoteKeybinds = new Keybinds({
//    [LEFT_BUTTON]: XUSB_GAMEPAD_DPAD_LEFT, //oh yeah using square brackets around variable names will use the value of the variable as the property name
//    [RIGHT_BUTTON]: XUSB_GAMEPAD_DPAD_RIGHT,
//    [DOWN_BUTTON]: XUSB_GAMEPAD_DPAD_DOWN,
//    [UP_BUTTON]: XUSB_GAMEPAD_DPAD_UP,
//    [PLUS_BUTTON]: XUSB_GAMEPAD_B,
//    [TWO_BUTTON]: XUSB_GAMEPAD_Y,
//    [ONE_BUTTON]: XUSB_GAMEPAD_X,
//    [B_BUTTON]: RIGHT_TRIGGER_DOWN,
//    [A_BUTTON]: XUSB_GAMEPAD_A,
//    [MINUS_BUTTON]: XUSB_GAMEPAD_BACK,
//    [HOME_BUTTON]: XUSB_GAMEPAD_RIGHT_SHOULDER,
//});

const wiimoteKeybinds = new Keybinds({
    [LEFT_BUTTON]: XUSB_GAMEPAD_DPAD_LEFT, //oh yeah using square brackets around variable names will use the value of the variable as the property name
    [RIGHT_BUTTON]: XUSB_GAMEPAD_DPAD_RIGHT,
    [DOWN_BUTTON]: XUSB_GAMEPAD_DPAD_DOWN,
    [UP_BUTTON]: XUSB_GAMEPAD_DPAD_UP,
    [PLUS_BUTTON]: XUSB_GAMEPAD_Y,
    [TWO_BUTTON]: XUSB_GAMEPAD_BACK,
    [ONE_BUTTON]: XUSB_GAMEPAD_START,
    [B_BUTTON]: RIGHT_TRIGGER_DOWN,
    [A_BUTTON]: XUSB_GAMEPAD_A,
    [MINUS_BUTTON]: XUSB_GAMEPAD_X,
    [HOME_BUTTON]: XUSB_GAMEPAD_B,
});

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
        print("Couldn't find any wiimotes!\x07");
        print("Press 'R' to retry!");
        return;
    }

    const handle = hid_get_handle_from_info(wiimotes[0]); //just gonna use the first one

    print(handle);

    if(!CreateWiimote(handle)) {
        
    }
}

function CreateWiimote(handle) {
    if(!handle) {
        print("Couldn't open handle!");
        return false;
    }else {
        currentWiimote = new hid_wiimote(handle, (status) => {
            //WiimoteHandleStatusUpdate(status); //don't worry we call this in the loop function
            //extra stuff that doesn't need to happen over and over
            print("first status", status);
            currentWiimote.setDataReportingMode(false, 0x34);
        });

        currentWiimote.addEventListener("onextensionchange", undefined, onExtensionChange);
        currentWiimote.addEventListener("onextensionbuttondown", undefined, (curId, extensionObj, button) => {
            switch(curId) {
                case EXTENSION_NUNCHUK:
                    //print(`Nunchuk ${button} button down`);
                    const k = nunchukKeybinds.keybinds(controller.type)[button];
                    if(k < 0) { //one of the custom triggers
                        controller.setTrigger(Math.abs(k)-1, 255); //haha by taking the absolute value, LEFT_TRIGGER_DOWN == 1 and by subtracting one we can coerce that value to false!
                    }else {
                        controller.setButton(k, true);
                    }
                    controller.update();
                    break;
            }
        });
        currentWiimote.addEventListener("onextensionbuttonup", undefined, (curId, extensionObj, button) => {
            switch(curId) {
                case EXTENSION_NUNCHUK:
                    //print(`Nunchuk ${button} button up`);
                    const k = nunchukKeybinds.keybinds(controller.type)[button];
                    if(k < 0) { //one of the custom triggers
                        controller.setTrigger(Math.abs(k)-1, 0); //haha by taking the absolute value, LEFT_TRIGGER_DOWN == 1 and by subtracting one we can coerce that value to false!
                    }else {
                        controller.setButton(k, false);
                    }
                    controller.update();
                    break;
            }
        });
        currentWiimote.addEventListener("onbuttondown", undefined, (button) => {
            const k = wiimoteKeybinds.keybinds(controller.type)[button];
            if(k != undefined) {
                if(k < 0) { //one of the custom triggers
                    controller.setTrigger(Math.abs(k)-1, 255); //haha by taking the absolute value, LEFT_TRIGGER_DOWN == 1 and by subtracting one we can coerce that value to false!
                }else {
                    controller.setButton(k, true);
                }
                controller.update();
            }
        });
        currentWiimote.addEventListener("onbuttonup", undefined, (button) => {
            const k = wiimoteKeybinds.keybinds(controller.type)[button];
            if(k != undefined) {
                if(k < 0) { //one of the custom triggers
                    controller.setTrigger(Math.abs(k)-1, 0); //haha by taking the absolute value, LEFT_TRIGGER_DOWN == 1 and by subtracting one we can coerce that value to false!
                }else {
                    controller.setButton(k, false);
                }
                controller.update();
            }
        });
        return true;
    }
}

function onExtensionChange(hasExtension, previousExtensionId) {
    if(!hasExtension) {
        printNoHighlight("Extension: None");
        controller.resetReport();
        previousThumbData = {};
    }else {
        SetConsoleTextAttribute(console, FOREGROUND_GREEN);
        switch(currentWiimote.currentExtensionId) {
            case EXTENSION_NUNCHUK:
                printNoHighlight("Extension: Nunchuk");
                break;
        }
        SetConsoleTextAttribute(console, 7);
    }
}

//CODE START

if(!ViGEmBus.init()) {
    quit;
}

function x360_notification(Client, Target, LargeMotor, SmallMotor, LedNumber) {
    print("> Notification {");
    print(">     LargeMotor: "+LargeMotor);
    print(">     SmallMotor: "+SmallMotor);
    print(">     LedNumber: "+LedNumber);
    print("> };");

    if(currentWiimote) {
        if((LargeMotor+SmallMotor) > 0) { //lol quick way of checking both (hold on lets benchmark that rq) (ok according to the benchmark this was faster than checking if one of them was greater than 0 but if i didn't use the parenthesis around LargeMotor+SmallMotor it would've became 11% slower (allegedly, but also the difference is totally negligable because it still hit 97M ops/s lol))
            if(!currentWiimote.rumbling) {
                currentWiimote.toggleRumble();
            }
        }else {
            if(currentWiimote.rumbling) {
                currentWiimote.toggleRumble();
            }
        }
        currentWiimote.setLEDs(1 << LedNumber);
    }
}

controller = ViGEmBus.addController(CONTROLLER_X360);
if(!controller) {
    quit;
}

controller.register_notification(x360_notification);

GetFirstWiimote();

while(true) {
    if(currentWiimote) {
        const raw = currentWiimote.poll(16);

        if(currentWiimote.currentExtensionId != EXTENSION_NONE) {
            //get axis from thumbsticks + guitar whammy
            const extension = currentWiimote.extension[currentWiimote.currentExtensionId];
            if(!extension) {
                print("extension is undefined??? \x07");
            }else if(currentWiimote.currentExtensionId == EXTENSION_NUNCHUK) {
                if(previousThumbData.sX != extension.sX || previousThumbData.sY != extension.sY) {
                    //print("n:",((extension.sX/127) - 1)*32767, ((extension.sY/127) - 1)*32767);
                    //my controller implementation expects the thumbstick's x and y to be a signed value between -32768 and 32767 where 0 is center
                    //the nunchuk has a range of like X: 35 to 228 , Y: 27 to 220 where 127 is the center (source: https://wiibrew.org/wiki/Wiimote/Extension_Controllers/Nunchuck)
                    controller.setThumbXY(nunchukKeybinds.thumbsticks[0], ((extension.sX/127) - 1)*32767, ((extension.sY/127) - 1)*32767);
                    controller.update();
                    previousThumbData.sX = extension.sX;
                    previousThumbData.sY = extension.sY;
                }
            }
        }
    }else {
        Sleep(16);
    }
    if(GetForegroundWindow() == GetConsoleWindow()) {
        if(GetKeyDown('R')) {
            GetFirstWiimote();
        }else if(GetKey('E') && GetKey(VK_LCONTROL)) {
            SetForegroundWindow(GetConsoleWindow());
            try {
                print(eval(getline("Ctrl+E -> Eval some code: ")));
            }catch(e) {
                print(e.toString());
            }
        }else if(GetKey(VK_ESCAPE)) {
            break;
        }
    }
    ViGEmBus.dispatchNotifications(); //if there are any lol (fyi: if you create a window, you won't have to call this function)
}

ViGEmBus.Release();