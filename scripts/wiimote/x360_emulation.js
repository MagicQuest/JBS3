//__require_extension(__dirname+"/x64/Release/JBS3_ViGEmClient.dll"); //nevermind lol

//print(vigem_alloc);

//__debugbreak();

//let's be honest guys... im making this for fortnite festival lol
//for some reason fortnite festival has weird keybind glitches and certain buttons just stop working randomly (so i need a way to remap my wii guitar inputs to different buttons on the emulated controller if they stop working)

eval(require("fs").read(__dirname+"/hid_wiimote.js")); //ml

print("ViGEmBus v1.22.0 -> https://github.com/nefarius/ViGEmBus/releases/tag/v1.22.0");
const console = GetStdHandle(STD_OUTPUT_HANDLE);
SetConsoleTextAttribute(console, FOREGROUND_RED);
printNoHighlight("Note: According to device manager, the version of ViGEmBus I'm currently using to test this script is only 1.14.3.0 (which i got from https://epigramx.github.io/WiimoteHook/ (download link is at the bottom))"); //WiimoteHook is actually the reason i used ViGEm because i already had it loaded lol
SetConsoleTextAttribute(console, 7); //white
Msgbox("This script requires that you have the ViGEmBus driver loaded on your machine. (If you don't, go to the url in the console and download and run the installer, if you want.)", "x360_emulation.js", MB_OK | MB_ICONINFORMATION | MB_SYSTEMMODAL);

//im only writing keybinds for the guitar and the nunchuk because these are the only extensions i have lol

//old school
//const client = vigem_alloc();
//
//print(client);
//
//if(!client) {
//    print("vigem_alloc failed?!");
//    quit;
//}
//
//let res = vigem_connect(client);
//
//if(res != VIGEM_ERROR_NONE) {
//    Msgbox(`vigem_connect failed for some reason! (error code: ${res})`);
//    vigem_free(client);
//    quit;
//}
//
//const pad = vigem_target_x360_alloc();
//if(!pad) {
//    print("vigem_target_x360_alloc failed?!");
//    cleanup();
//    quit;
//}
//
//res = vigem_target_add(client, pad);
//
//if(res != VIGEM_ERROR_NONE) {
//    print("Target plugin failed with error code: " + res);
//    cleanup();
//    quit;
//}
//
////__debugbreak();
//vigem_disconnect(client);
//vigem_free(client);

const CONTROLLER_X360 = Xbox360Wired;
const CONTROLLER_DS4 = DualShock4Wired;

/*abstract*/ class VirtualController {
    constructor(type, opaque, report) {
        this.type = type;
        this.opaque = opaque;
        this.notifications = false;
        //this.report = this.resetReport();
        this.resetReport();
    }

    setButton(button, enable) {
        if(button == undefined) return; //just in case some keybinds are unbound

        if(enable) {
            this.report.wButtons |= button;
        }else {
            this.report.wButtons &= ~button;
        }
    }

    //my controller implementation expects x and y to be between -32768 and 32767 where 0 is the center but the actual value set in the report is defined by each subclass (X360Controller has the same bounds but DS4Controller converts this range to 0 - 255)
    setThumbXY(left, x, y) {}; 
    
    //for both types of controllers, value is a number between 0 - 255 where 255 is the trigger fully pulled
    setTrigger(left, value) {}; 

    update() {};

    register_notification(callback) {};

    unregister_notification() {};

    resetReport() {};

    Release() {
        if(this.notifications) {
            this.unregister_notification(); //we gotta unregister it manually or else there will be a memory leak on the jbs side lol
        }
        vigem_target_remove(ViGEmBus.client, this.opaque); //returns VIGEM_ERROR but idgaf if it fails probably lokl
        vigem_target_free(this.opaque);
        this.opaque = NULL;
    }
}

class X360Controller extends VirtualController {
    constructor(opaque) {
        super(CONTROLLER_X360, opaque);
    }

    //x and y between -32768 and 32767 where 0 is centered
    setThumbXY(left, x, y) {
        if(left) {
            this.report.sThumbLX = x;
            this.report.sThumbLY = y;
        }else {
            this.report.sThumbRX = x;
            this.report.sThumbRY = y;
        }
    }

    //value between 0 and 255 where 255 is when the trigger is fully pulled
    setTrigger(left, value) {
        if(left) {
            this.report.bLeftTrigger = value;
        }else {
            this.report.bRightTrigger = value;
        }
    }
    
    update() {
        const res = vigem_target_x360_update(ViGEmBus.client, this.opaque, this.report);
        if(res != VIGEM_ERROR_NONE) {
            printNoHighlight("vigem_target_x360_update failed! error code: "+res);
        }
    }

    register_notification(callback) {
        let res;
        if((res = vigem_target_x360_register_notification(ViGEmBus.client, this.opaque, callback)) != VIGEM_ERROR_NONE) {
            printNoHighlight("vigem_target_x360_register_notification failed with error code: " + res);
        }else {
            this.notifications = true;
        }
    }

    unregister_notification() {
        vigem_target_x360_unregister_notification(this.opaque);
        this.notifications = false;
    }

    resetReport() {
        this.report = new XUSB_REPORT();
    }
}

class DS4Controller extends VirtualController {
    static dpadMap = {
        0b0000: DS4_BUTTON_DPAD_NONE,
        0b0001: DS4_BUTTON_DPAD_NORTH,
        0b0011: DS4_BUTTON_DPAD_NORTHEAST,
        0b0010: DS4_BUTTON_DPAD_EAST,
        0b0110: DS4_BUTTON_DPAD_SOUTHEAST,
        0b0100: DS4_BUTTON_DPAD_SOUTH,
        0b1100: DS4_BUTTON_DPAD_SOUTHWEST,
        0b1000: DS4_BUTTON_DPAD_WEST,
        0b1001: DS4_BUTTON_DPAD_NORTHWEST,
    }

    constructor(opaque) {
        super(CONTROLLER_DS4, opaque);
        this.dpad = 0b0000; //each bit corresponds to north, east, south, and west respectively starting from the least significant bit
        //this.report = new XUSB_REPORT();
    }

    //x and y between -32768 and 32767 where 0 is centered but the DS4_REPORT object expects them to be between 0 - 255 so we convert them here
    setThumbXY(left, x, y) {
        x = ((x + 32768)/(65535))*255;
        y = ((-y + 32767)/(65535))*255;
        if(left) {
            this.report.bThumbLX = x;
            this.report.bThumbLY = y; //for some reason it's flipped lol
        }else {
            this.report.bThumbRX = x;
            this.report.bThumbRY = y;
        }
    }

    //value between 0 and 255 where 255 is when the trigger is fully pulled
    setTrigger(left, value) {
        if(left) {
            this.report.bTriggerL = value;
        }else {
            this.report.bTriggerR = value;
        }
    }

    //not handling any of the combination dpad inputs because it would be too much effort lol
    setButton(button, enable) {
        if(button == undefined) return; //just in case some keybinds are unbound

        if(button <= 0x8) { //one of the dpad buttons (idk why they;re so weird)
            if(enable) {
                this.dpad |= 1 << (button/2); //dividing by two because each whole direction is even
            }else {
                this.dpad &= ~(1 << (button/2));
            }
            print(this.dpad);
            DS4_SET_DPAD(this.report, DS4Controller.dpadMap[this.dpad]);
        }else {
            if(enable) {
                this.report.wButtons |= button;
            }else {
                this.report.wButtons &= ~button;
            }
        }
    }

    update() {
        const res = vigem_target_ds4_update(ViGEmBus.client, this.opaque, this.report);
        if(res != VIGEM_ERROR_NONE) {
            printNoHighlight("vigem_target_ds4_update failed! error code: "+res);
        }
    }
    
    register_notification(callback) {
        let res;
        if((res = vigem_target_ds4_register_notification(ViGEmBus.client, this.opaque, callback)) != VIGEM_ERROR_NONE) {
            printNoHighlight("vigem_target_ds4_register_notification failed with error code: " + res);
        }else {
            this.notifications = true;
        }
    }

    unregister_notification() {
        vigem_target_ds4_unregister_notification(this.opaque);
        this.notifications = false;
    }

    resetReport() {
        this.report = new DS4_REPORT(); //not using the EX version because it's way easier to use the regular version lol
    }
}

//class DS4ControllerEx extends DS4Controller {
//    constructor(opaque) {
//        super(opaque);
//    }
//}

const controllernameslolimlazy = {};
controllernameslolimlazy[CONTROLLER_X360] = "x360";
controllernameslolimlazy[CONTROLLER_DS4] = "ds4";

const controllertypes = {};
controllertypes[CONTROLLER_X360] = X360Controller;
controllertypes[CONTROLLER_DS4] = DS4Controller;


class ViGEmBus {
    static client;
    static controllers = [];

    static init() {
        this.client = vigem_alloc();
        if(!this.client) {
            printNoHighlight("vigem_alloc failed?!");
            quit;
        }

        let res = vigem_connect(this.client);
        if(res != VIGEM_ERROR_NONE) {
            Msgbox(`vigem_connect failed for some reason! (error code: ${res})`, "x360_emulation.js", MB_OK | MB_ICONERROR | MB_SYSTEMMODAL);
            vigem_free(this.client);
            quit;
        }
    }

    static addController(type) {
        let pad, controller;

        switch(type) {
            case CONTROLLER_X360:
                pad = vigem_target_x360_alloc();
                break;
            case CONTROLLER_DS4:
                pad = vigem_target_ds4_alloc();
                break;
        }

        if(!pad) {
            Msgbox(`vigem_target_${controllernameslolimlazy[type]}_alloc failed?!`, "x360_emulation.js", MB_OK | MB_ICONWARNING | MB_SYSTEMMODAL);
            //vigem_free(this.instance);
        }else {
            const res = vigem_target_add(this.client, pad);
            if(res != VIGEM_ERROR_NONE) {
                Msgbox("Target plugin failed with error code: " + res, "x360_emulation.js", MB_OK | MB_ICONERROR | MB_SYSTEMMODAL);
                quit;
            }else {
                controller = new controllertypes[type](pad);
                this.controllers.push(controller); //yep ;)
            }
        }
        
        return controller;
    }

    static dispatchNotifications() {
        PerformMicrotaskCheckpoint(); //yep...
    }

    static Release() {
        for(const controller of this.controllers) {
            controller.Release();
        }
        this.controllers = [];
        vigem_disconnect(this.client);
        vigem_free(this.client);
    }
}

let wiimotes = [];
let currentWiimote = undefined;
let previousThumbData = {};
let controller;

//const guitarKeybinds = {
//    green: 12,  //1
//    red: 13,    //2
//    yellow: 14, //3
//    blue: 15,   //4
//    orange: 8,  //5
//    up: 5,      //8
//    down: 6,    //10
//    plus: 7,    //7
//    minus: 9,   //6
//};

class Keybinds {
    constructor(x360_keybinds, ds4_keybinds) {
        this.x360 = x360_keybinds;
        this.ds4 = ds4_keybinds;
        this.thumbsticks = [true, false]; //left, right
        this.triggers = [true, false];
    }

    keybinds(type) {
        return this[controllernameslolimlazy[type]]; //tuff
    }

    rebind(type, name, bind) {
        this.keybinds(type)[name] = bind; //TUFFFF
    }

    swapThumbsticks() {
        this.thumbsticks[0] = !this.thumbsticks[0];
        this.thumbsticks[1] = !this.thumbsticks[1];
    }

    swapTriggers() {
        this.triggers[0] = !this.triggers[0];
        this.triggers[1] = !this.triggers[1];
    }
}

const nunchukKeybinds = new Keybinds({
    c: XUSB_GAMEPAD_B,
    z: XUSB_GAMEPAD_A,
}, {
    c: DS4_BUTTON_CROSS,
    z: DS4_BUTTON_SQUARE,
});

//oh wait there's constants for all of these i don't have to bit shift myself lol

//normal xbox keybinds
//const guitarKeybinds = new Keybinds({
//    green: XUSB_GAMEPAD_A,
//    red: XUSB_GAMEPAD_B,
//    yellow: XUSB_GAMEPAD_X,
//    blue: XUSB_GAMEPAD_Y,
//    orange: XUSB_GAMEPAD_LEFT_SHOULDER,
//    up: XUSB_GAMEPAD_START,
//    down: XUSB_GAMEPAD_LEFT_THUMB,
//    plus: XUSB_GAMEPAD_BACK,
//    minus: XUSB_GAMEPAD_RIGHT_SHOULDER,
//}, {

//fortnite festival keybinds (because it doesn't like the X button)
const guitarKeybinds = new Keybinds({
    green: XUSB_GAMEPAD_A,
    red: XUSB_GAMEPAD_B,
    yellow: XUSB_GAMEPAD_DPAD_LEFT,
    blue: XUSB_GAMEPAD_Y,
    orange: XUSB_GAMEPAD_LEFT_SHOULDER,
    up: XUSB_GAMEPAD_DPAD_UP,
    down: XUSB_GAMEPAD_DPAD_DOWN,
    plus: XUSB_GAMEPAD_BACK,
    minus: XUSB_GAMEPAD_RIGHT_SHOULDER,
}, {
    green: DS4_BUTTON_SQUARE,
    red: DS4_BUTTON_CROSS,
    yellow: DS4_BUTTON_CIRCLE,
    blue: DS4_BUTTON_TRIANGLE,
    orange: DS4_BUTTON_SHOULDER_LEFT,
    up: DS4_BUTTON_TRIGGER_RIGHT,
    down: DS4_BUTTON_SHARE,
    plus: DS4_BUTTON_TRIGGER_LEFT,
    minus: DS4_BUTTON_SHOULDER_RIGHT,
});

// const wiimoteKeybinds = new Keybinds({}, {}); //empty because you can't define (ok NEVERMIND i just learned you can actually do that!)

const wiimoteKeybinds = new Keybinds({
    [LEFT_BUTTON]: XUSB_GAMEPAD_DPAD_LEFT,
    [RIGHT_BUTTON]: XUSB_GAMEPAD_DPAD_RIGHT,
    [DOWN_BUTTON]: XUSB_GAMEPAD_DPAD_DOWN,
    [UP_BUTTON]: XUSB_GAMEPAD_DPAD_UP,
    [PLUS_BUTTON]: undefined,
    [TWO_BUTTON]: undefined,
    [ONE_BUTTON]: undefined,
    [B_BUTTON]: undefined,
    [A_BUTTON]: undefined,
    [MINUS_BUTTON]: undefined,
    [HOME_BUTTON]: undefined,
}, {
    [LEFT_BUTTON]: DS4_BUTTON_DPAD_WEST,
    [RIGHT_BUTTON]: DS4_BUTTON_DPAD_EAST,
    [DOWN_BUTTON]: DS4_BUTTON_DPAD_SOUTH,
    [UP_BUTTON]: DS4_BUTTON_DPAD_NORTH,
    [PLUS_BUTTON]: undefined,
    [TWO_BUTTON]: undefined,
    [ONE_BUTTON]: undefined,
    [B_BUTTON]: undefined,
    [A_BUTTON]: undefined,
    [MINUS_BUTTON]: undefined,
    [HOME_BUTTON]: undefined,
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
                    controller.setButton(nunchukKeybinds.keybinds(controller.type)[button], true);
                    controller.update();
                    break;
                //case EXTENSION_CLASSIC_CONTROLLER:
                //    print(`Controller ${button} button down`);
                //    break;
                case EXTENSION_GUITAR:
                    //print(`Guitar ${button} button down`);
                    //controller.report.wButtons |= 1 << guitarKeybinds[button]; //both ds4 and x360 have the wButtons property :))))
                    controller.setButton(guitarKeybinds.keybinds(controller.type)[button], true);
                    // controller.report.wButtons |= guitarKeybinds[button];
                    controller.update();
                    break;
            }
        });
        currentWiimote.addEventListener("onextensionbuttonup", undefined, (curId, extensionObj, button) => {
            switch(curId) {
                case EXTENSION_NUNCHUK:
                    //print(`Nunchuk ${button} button up`);
                    controller.setButton(nunchukKeybinds.keybinds(controller.type)[button], false);
                    controller.update();
                    break;
                //case EXTENSION_CLASSIC_CONTROLLER:
                //    print(`Controller ${button} button up`);
                //    break;
                case EXTENSION_GUITAR:
                    //print(`Guitar ${button} button up`);
                    //controller.report.wButtons &= ~(1 << guitarKeybinds[button]); //clear bit
                    //controller.report.wButtons &= ~(guitarKeybinds[button]);
                    controller.setButton(guitarKeybinds.keybinds(controller.type)[button], false);
                    controller.update();
                    break;
            }
        });
        currentWiimote.addEventListener("onbuttondown", undefined, (button) => {
            const b = wiimoteKeybinds.keybinds(controller.type)[button];
            if(b != undefined) {
                controller.setButton(b, true);
                controller.update();
            }
        });
        currentWiimote.addEventListener("onbuttonup", undefined, (button) => {
            const b = wiimoteKeybinds.keybinds(controller.type)[button];
            if(b != undefined) {
                controller.setButton(b, false);
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
            //case EXTENSION_CLASSIC_CONTROLLER:
            //    printNoHighlight("Extension: Controller");
            //    break;
            case EXTENSION_GUITAR:
                printNoHighlight("Extension: Guitar");
                break;
        }
        SetConsoleTextAttribute(console, 7);
    }
}

//CODE START

ViGEmBus.init();

function generic_notification(Client, Target, LargeMotor, SmallMotor, TypeDependant) {
    print("> Notification {");
    print(">     LargeMotor: "+LargeMotor);
    print(">     SmallMotor: "+SmallMotor);
    switch(controller.type) {
        case CONTROLLER_X360:
            print(">     LedNumber: "+TypeDependant);
            //LedNumber is a value from 0 - 3 corresponding to the id of the controller so we can just do that for the wiimote too
            currentWiimote.setLEDs(1 << TypeDependant);
            break;
        case CONTROLLER_DS4:
            print(">     LightbarColor:",TypeDependant);
            break;
    }
    print("> };");

    if((LargeMotor+SmallMotor) > 0) { //lol quick way of checking both (hold on lets benchmark that rq) (ok according to the benchmark this was faster than checking if one of them was greater than 0 but if i didn't use the parenthesis around LargeMotor+SmallMotor it would've became 11% slower (allegedly, but also the difference is totally negligable because it still hit 97M ops/s lol))
        if(!currentWiimote.rumbling) {
            currentWiimote.toggleRumble();
        }
    }else {
        if(currentWiimote.rumbling) {
            currentWiimote.toggleRumble();
        }
    }
}

controller = ViGEmBus.addController(CONTROLLER_X360);
//uh oh... do the notifications happen on a different thread?! (if so, it's cooked OR i could enqueue a microtask or something like that but that requires more manual setup unfortunately)
//if(controller.type == CONTROLLER_X360) {
//    controller.register_notification(function(Client, Target, LargeMotor, SmallMotor, LedNumber) {
//        print("> NotificationX360 {");
//        print(">     LargeMotor: "+LargeMotor);
//        print(">     SmallMotor: "+SmallMotor);
//        print(">     LedNumber: "+LedNumber);
//        print("> };");
//
//        if((LargeMotor+SmallMotor) > 0) { //lol quick way of checking both (hold on lets benchmark that rq) (ok according to the benchmark this was faster than checking if one of them was greater than 0 but if i didn't use the parenthesis around LargeMotor+SmallMotor it would've became 11% slower (allegedly, but also the difference is totally negligable because it still hit 97M ops/s lol))
//            if(!currentWiimote.rumbling) {
//                currentWiimote.toggleRumble();
//            }
//        }else {
//            if(currentWiimote.rumbling) {
//                currentWiimote.toggleRumble();
//            }
//        }
//
//        //LedNumber is a value from 0 - 3 corresponding to the id of the controller so we can just do that for the wiimote too
//        currentWiimote.setLEDs(1 << LedNumber);
//    });
//}else if(controller.type == CONTROLLER_DS4) {
//    controller.register_notification(function(Client, Target, LargeMotor, SmallMotor, LightbarColor) {
//        print("> NotificationDS4 {");
//        print(">     LargeMotor: "+LargeMotor);
//        print(">     SmallMotor: "+SmallMotor);
//        print(">     LightbarColor:",LightbarColor);
//        print("> };");
//    });
//}

controller.register_notification(generic_notification);

GetFirstWiimote();

while(true) {
    if(currentWiimote) {
        const raw = currentWiimote.poll(16);

        if(currentWiimote.currentExtensionId != EXTENSION_NONE) {
            //get axis from thumbsticks + guitar whammy
            const extension = currentWiimote.extension[currentWiimote.currentExtensionId];
            if(!extension) {
                print("extension is undefined??? \x07");
            }else {
                switch(currentWiimote.currentExtensionId) {
                    case EXTENSION_NUNCHUK:
                        if(previousThumbData.sX != extension.sX || previousThumbData.sY != extension.sY) {
                            //print("n:",((extension.sX/127) - 1)*32767, ((extension.sY/127) - 1)*32767);
                            //my controller implementation expects the thumbstick's x and y to be a signed value between -32768 and 32767 where 0 is center
                            //the nunchuk has a range of like X: 35 to 228 , Y: 27 to 220 where 127 is the center (source: https://wiibrew.org/wiki/Wiimote/Extension_Controllers/Nunchuck)
                            controller.setThumbXY(nunchukKeybinds.thumbsticks[0], ((extension.sX/127) - 1)*32767, ((extension.sY/127) - 1)*32767);
                            controller.update();
                            previousThumbData.sX = extension.sX;
                            previousThumbData.sY = extension.sY;
                        }
                        break;
                    case EXTENSION_GUITAR:
                        if(previousThumbData.sX != extension.sX || previousThumbData.sY != extension.sY || previousThumbData.whammyBar != extension.whammyBar) {
                            //print("g:",((extension.sX/32) - 1)*32767, ((extension.sY/32) - 1)*32767, ((extension.whammyBar-15)/11)*255); //, ((extension.whammyBar-15)/11)*-32767);
                            //my guitar has a range of like X: 2 - 58 , Y: 3 - 58 where 32 is the center (source: i just tested it myself lol)
                            //the whammy has a range of 15 (all the way up) - 26 (all the way down)
                            controller.setThumbXY(guitarKeybinds.thumbsticks[0], ((extension.sX/32) - 1)*32767, ((extension.sY/32) - 1)*32767);
                            //                                                                    dividing by 11 because (26 - 15) = 11
                            //                                                                    also negating 32767 because that's what the raphnet adapter does lol
                            //controller.setThumbXY(guitarKeybinds.thumbsticks[1], 0, ((extension.whammyBar-15)/11)*-32767); //uhhh however that works lol

                            //wait no i just realized the raphnet adapter actually uses the triggers instead lol
                            controller.setTrigger(guitarKeybinds.triggers[0], ((extension.whammyBar-15)/11)*255);
                            controller.update();

                            previousThumbData.sX = extension.sX;
                            previousThumbData.sY = extension.sY;
                            previousThumbData.whammyBar = extension.whammyBar; //thumb enough ¯\_(ツ)_/¯
                        }
                        break;
                }
            }
        }

        //if(raw) {
        //    print("Data read: ");
        //    let str = "";
        //    for(let i = 0; i < raw.length; i++) {
        //        str += `0x${raw[i].toString(16)} `;
        //    }
        //    print(str);
        //}
        //if(statusTimer - Date.now() < 0) {
        //    statusTimer = Date.now() + 10000;
        //    currentWiimote.requestStatus();
        //}
        //if(raw[0] == 0x20) { //lowkey just handle every status update lol
        //    WiimoteHandleStatusUpdate(currentWiimote.status);
        //}
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
    ViGEmBus.dispatchNotifications(); //if there are any lol
}

ViGEmBus.Release();