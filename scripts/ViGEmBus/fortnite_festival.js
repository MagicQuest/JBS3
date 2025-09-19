//yeah ok idk if this is really related enough to be in the wiimote folder but ViGEmHelper is goated
//actually wait im gonna move this and ViGEmHelper to its own folder

//closure that uses fs like a static variable so i don't have to keep requiring it (even though it's not like expensive or anything)
//after writing this, i thought about the require function and how i'll probably repurpose it for extensions once i fragment jbs (1000% i'm still gonna be making a monolith version though dw)
const fs = (function() {
    let fs;
    return () => {
        if(!fs) {
            fs = require("fs");
        }
        return fs;
    }
})();

eval(fs().read(__dirname+"/ViGEmHelper.js")); //TUFFFFF
eval(fs().read(__dirname+"/../dllstuffs/marshallib.js")); //for the REPORT class

Msgbox("im not gonna lie this one will only work if you have a wii guitar plugged into the computer with a raphnet adapter (WUSBMote v2.2)", "sorry bruh", MB_OK | MB_SYSTEMMODAL);

print("ViGEmBus v1.22.0 -> https://github.com/nefarius/ViGEmBus/releases/tag/v1.22.0");
const console = GetStdHandle(STD_OUTPUT_HANDLE);
SetConsoleTextAttribute(console, FOREGROUND_RED);
printNoHighlight("Note: According to device manager, the version of ViGEmBus I'm currently using to test this script is only 1.14.3.0 (which i got from https://epigramx.github.io/WiimoteHook/ (download link is at the bottom))"); //WiimoteHook is actually the reason i used ViGEm because i already had it loaded lol
SetConsoleTextAttribute(console, 7); //white
Msgbox("This script requires that you have the ViGEmBus driver loaded on your machine. (If you don't, go to the url in the console and download and run the installer, if you want.)", "fortnite_festival.js", MB_OK | MB_ICONINFORMATION | MB_SYSTEMMODAL);

//only like halfway through writing this script did i realize (one of my fellas told me) that i could've just mapped the raphnet hid device to keyboard buttons instead of into controller buttons (like i do in this script)
//i've already done that though, so i wasn't gonna let ViGEmHelper go to waste and finished writing this anyways

print("HID Init: " + hid_init());

class RAPHNET_REPORT extends memoobjectidk {
    static types = {
        id: "BYTE", //report id
        x: "WORD",
        y: "WORD",
        Rx: "WORD",
        Ry: "WORD",
        Rz: "WORD",
        z: "WORD",
        buttons: "WORD",
    };
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

let devices = [];
let currentDevice = undefined;
let controller = undefined;

function UpdateDeviceList() {
    devices = [];
    //289B is the vendor id for DRACAL technologies (?)
    //0080 is the product id for this specific raphnet adapter (?)
    hid_enumerate(0x289b, 0x0080, (ts) => {
        //if(ts.usage == 5) {

        //}
        //print(ts);
        if(ts.usage_page < 0xff00) { //the raphnet adapter has a vendor defined interface so we only want the normal one
            devices.push(ts);
        }
    });
}

function GetFirstWiimote() {
    UpdateDeviceList();

    if(!devices.length) {
        print("Couldn't find any raphnet devices!\x07");
        print("Press 'R' to retry!");
        return;
    }

    const handle = hid_get_handle_from_info(devices[0]); //just gonna use the first one

    print(handle);

    currentDevice = handle;
}

if(!ViGEmBus.init()) {
    quit;
}

controller = ViGEmBus.addController(CONTROLLER_X360);
if(!controller) {
    quit;
}

GetFirstWiimote();

let lastButtons = {

};

let buttons = {

};

/*let mappings = {
    0x1: "green",
    0x2: "red",
    0x4: "yellow",
    0x8: "blue",
    0x10: "orange",
    0x20: "down",
    0x40: "plus",
    0x80: "minus",
    0x100: "up",
};*/

let mappings = [
    "green",
    "red",
    "yellow",
    "blue",
    "orange",
    "down",
    "plus",
    "minus",
    "up"
];

let buttonMappings = [
    XUSB_GAMEPAD_A,
    XUSB_GAMEPAD_B,
    XUSB_GAMEPAD_DPAD_LEFT,
    XUSB_GAMEPAD_Y,
    XUSB_GAMEPAD_LEFT_SHOULDER,
    XUSB_GAMEPAD_DPAD_DOWN,
    XUSB_GAMEPAD_BACK,
    XUSB_GAMEPAD_RIGHT_SHOULDER,
    XUSB_GAMEPAD_DPAD_UP,
];

let lastWhammy;

while(true) {
    if(currentDevice) {
        const raw = hid_read_timeout(currentDevice, 16);
        if(raw == 0) {
            //print("waiting");
        }else if(raw < 0) {
            print("Unable to read: ", hid_error(currentDevice));
        }else {
            const report = new RAPHNET_REPORT(raw);
            //print(report); //wow this works great!
            //for(const prop of Object.keys(report)) {
            //    if(prop != "data") {
            //        print(`${prop}: `, report[prop]);
            //    }
            //}
            
            buttons = {};
            for(let i = 0; i < 9; i++) {
                const name = mappings[i];
                buttons[name] = (report.buttons & (1 << i)) != 0; //ts wasn't working because i wrote "== 1" :|
                // print(name, lastButtons[name], buttons[name]);
                if(lastButtons[name] != buttons[name]) {
                    // print("WTRC??", name, buttons[name]);
                    controller.setButton(buttonMappings[i], buttons[name]);
                    controller.update();
                }
            }
            // print(lastButtons);
            lastButtons = buttons;
            if(report.z != lastWhammy) {
                print(((report.z-13500)/16500)*255);
                controller.setTrigger(true, ((report.z-13500)/16500)*255); //mapping raphnet whammy report to 0 - 255
                controller.update();
            }
            lastWhammy = report.z;
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
    //ViGEmBus.dispatchNotifications(); //idgaf about notifications in this script lol since the guitar can't rumble or light up there's no point
}
ViGEmBus.Release();

if(currentDevice) {
    hid_close(currentDevice);
    currentDevice = undefined;
}

print("Exit: " + hid_exit());