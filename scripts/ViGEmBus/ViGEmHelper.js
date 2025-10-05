//see scripts/wiimote/x360_emulation.js or scripts/ViGEmBus/fortnite_festival.js for actual use

//ViGEmBus.init now returns the error code if something went wrong (or false if it couldn't allocate memory or something like that)
//now to check if it succeeded use the following code
/*
    if(ViGEmBus.init() != VIGEM_ERROR_NONE) {
        //do something if it fails...
    }
*/

//ViGEmBus.addController now also returns an error code if something goes wrong so use the following code to correctly check if it worked
/*
    const controller = ViGEmBus.addController(CONTROLLER_X360); //controller type doesn't matter lol
    if(!controller.pad) { //if addController doesn't return a controller object, this property won't exist.
        //do something if no controller...
    }
*/

globalThis.CONTROLLER_X360 = Xbox360Wired;
globalThis.CONTROLLER_DS4 = DualShock4Wired;

/*abstract*/ class VirtualController {
    constructor(type, pad) {
        this.type = type;
        this.pad = pad;
        this.notifications = false;
        //this.report = this.resetReport();
        this.resetReport();
    }

    //i didn't add the set/get pid/vid functions in here but they're simple enough to add yourself if you really want em

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
        vigem_target_remove(ViGEmBus.client, this.pad); //returns VIGEM_ERROR but idgaf if it fails probably lokl
        vigem_target_free(this.pad);
        this.pad = NULL;
    }
}

class X360Controller extends VirtualController {
    constructor(pad) {
        super(CONTROLLER_X360, pad);
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
        const res = vigem_target_x360_update(ViGEmBus.client, this.pad, this.report);
        if(res != VIGEM_ERROR_NONE) {
            printNoHighlight("vigem_target_x360_update failed! error code: "+res);
        }
    }

    register_notification(callback) {
        let res;
        if((res = vigem_target_x360_register_notification(ViGEmBus.client, this.pad, callback)) != VIGEM_ERROR_NONE) {
            printNoHighlight("vigem_target_x360_register_notification failed with error code: " + res);
        }else {
            this.notifications = true;
        }
    }

    unregister_notification() {
        vigem_target_x360_unregister_notification(this.pad);
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

    constructor(pad) {
        super(CONTROLLER_DS4, pad);
        this.dpad = 0b0000; //each bit corresponds to north, east, south, and west respectively starting from the least significant bit
        //this.report = new XUSB_REPORT();
    }

    //x and y between -32768 and 32767 where 0 is centered
    setThumbXY(left, x, y) {
        //DS4_REPORT expects thumb values to be between 0 - 255 (where 127 is centered) so we convert them here
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

    //if button is one of the combination dpad inputs im cooked
    //@Override
    setButton(button, enable) {
        if(button <= 0x8) { //one of the dpad buttons (idk why they;re so weird)
            if(enable) {
                this.dpad |= 1 << (button/2); //dividing by two because each whole direction is even
            }else {
                this.dpad &= ~(1 << (button/2));
            }
            print(this.dpad);
            DS4_SET_DPAD(this.report, DS4Controller.dpadMap[this.dpad]); //correctly sets the combination dpad value based on this.dpad :)
        }else {
            super.setButton(button, enable);
        }
    }

    update() {
        const res = vigem_target_ds4_update(ViGEmBus.client, this.pad, this.report);
        if(res != VIGEM_ERROR_NONE) {
            printNoHighlight("vigem_target_ds4_update failed! error code: "+res);
        }
    }
    
    register_notification(callback) {
        let res;
        if((res = vigem_target_ds4_register_notification(ViGEmBus.client, this.pad, callback)) != VIGEM_ERROR_NONE) {
            printNoHighlight("vigem_target_ds4_register_notification failed with error code: " + res);
        }else {
            this.notifications = true;
        }
    }

    unregister_notification() {
        vigem_target_ds4_unregister_notification(this.pad);
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

globalThis.controllernameslolimlazy = {
    [CONTROLLER_X360]: "x360",
    [CONTROLLER_DS4]: "ds4"
};

globalThis.controllertypes = {
    [CONTROLLER_X360]: X360Controller,
    [CONTROLLER_DS4]: DS4Controller
};

class ViGEmBus {
    static client;
    static controllers = [];

    static init() {
        this.client = vigem_alloc();
        if(!this.client) {
            printNoHighlight("vigem_alloc failed?!");
            return false;
        }

        let res = vigem_connect(this.client);
        if(res != VIGEM_ERROR_NONE) {
            Msgbox(`vigem_connect failed for some reason! (error code: ${res})`, "ViGEmHelper", MB_OK | MB_ICONERROR | MB_SYSTEMMODAL);
            vigem_free(this.client);
            return res;
        }
        return VIGEM_ERROR_NONE;
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
            Msgbox(`vigem_target_${controllernameslolimlazy[type]}_alloc failed?!`, "ViGEmHelper", MB_OK | MB_ICONWARNING | MB_SYSTEMMODAL);
            //vigem_free(this.instance);
            return false;
        }else {
            const res = vigem_target_add(this.client, pad);
            if(res != VIGEM_ERROR_NONE) {
                Msgbox("Target plugin failed with error code: " + res, "ViGEmHelper", MB_OK | MB_ICONERROR | MB_SYSTEMMODAL);
                return res;
            }else {
                controller = new controllertypes[type](pad); //aura.
                this.controllers.push(controller); //yep ;)
            }
        }
        
        return controller;
    }

    //you must call this function frequently (like in a loop like i do in x360_emulation.js) to receive notifications (because i gotta do some trickery on the jbs side for it to work lol)
    //you do not have to call this function if you create a window!
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

globalThis.VirtualController = VirtualController;
globalThis.X360Controller = X360Controller;
globalThis.DS4Controller = DS4Controller;
globalThis.ViGEmBus = ViGEmBus;
globalThis.Keybinds = Keybinds;