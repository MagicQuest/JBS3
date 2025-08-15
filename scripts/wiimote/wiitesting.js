//extraordinary resource on wiimote hid reports: https://wiibrew.org/wiki/Wiimote
//my hid knowledge has expanded since the last time i used the hidapi (because i wrote that driver lol)

const dc = GetDC(NULL);

print("Init: " + hid_init());

let wiimoteinfo;

//057e is the vendor id of nintendo
hid_enumerate(0x057e, 0x0, (ts) => {
    //0306 is the product id for the standard white wiimote (the version i have)
    //0330 is the product id for the "new" wiimote (guaranteed to have wii motion plus according to wherever i found that information)
    if(ts.product_id == 0x0306 || ts.product_id == 0x0330) {
        wiimoteinfo = ts;
    }
});

if(!wiimoteinfo) {
    print("no wiimotes found! \x07");
    quit;
}

const handle = hid_get_handle_from_info(wiimoteinfo);

print(handle);

const LEFT_BUTTON = 0;
const RIGHT_BUTTON = 1;
const DOWN_BUTTON = 2;
const UP_BUTTON = 3;
const PLUS_BUTTON = 4;
const TWO_BUTTON = 8;
const ONE_BUTTON = 9;
const B_BUTTON = 10;
const A_BUTTON = 11;
const MINUS_BUTTON = 12;
const HOME_BUTTON = 15;

const ADPCM = 0x00;
const PCM = 0x40;

const EXTENSION_NONE = null;
const EXTENSION_NUNCHUK = 0x0000_A420_0000;
const EXTENSION_CLASSIC_CONTROLLER = 0x0000_A420_0101;
//apparently the pro classic controller uses the same "id"
const EXTENSION_DRAWSOME_GRAPHICS_TABLET = 0xFF00_A420_0013;
const EXTENSION_GUITAR = 0x0000_A420_0103;
const EXTENSION_GUITAR_DRUMS = 0x0100_A420_0103;
const EXTENSION_TURNTABLE = 0x0300_A420_0103;
const EXTENSION_TAIKO_DRUM = 0x0000_A420_0111;
const EXTENSION_UDRAW_GAME_TABLET = 0xFF00_A420_0112;
const EXTENSION_SHINKASEN_CONTROLLER = 0x0000_A420_0310;
const EXTENSION_BALANCE_BOARD = 0x0000_A420_0402; //also has 0x2A2C?
const EXTENSION_MOTIONPLUS_INACTIVE = 0x0000_A420_0005;
const EXTENSION_MOTIONPLUS_ACTIVATE = 0x0000_A420_0405;
const EXTENSION_MOTIONPLUS_PASSTHROUGH_NUNCHUK = 0x0000_A420_0505;
const EXTENSION_MOTIONPLUS_PASSTHROUGH_CLASSIC_CONTROLLER = 0x0000_A420_0705;

const MOTIONPLUS_TIMEOUT_MS = 1000;

const PASSTHROUGH_NONE = 0x04;
const PASSTHROUGH_NUNCHUK = 0x05;
const PASSTHROUGH_CLASSIC_CONTROLLER = 0x07;

//                                                         block 1                                 block 2
const IR_SENSITIVITY_MARCAN =      [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x90, 0x00, 0xC0,        0x40, 0x00];
const IR_SENSITIVITY_MAX =         [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0x00, 0x0C,        0x00, 0x00];
const IR_SENSITIVITY_HIGH =        [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x90, 0x00, 0x41,        0x40, 0x00]; //lowkey i've only tested this one haha
const IR_SENSITIVITY_WII_LEVEL_1 = [0x02, 0x00, 0x00, 0x71, 0x01, 0x00, 0x64, 0x00, 0xfe,        0xfd, 0x05];
const IR_SENSITIVITY_WII_LEVEL_2 = [0x02, 0x00, 0x00, 0x71, 0x01, 0x00, 0x96, 0x00, 0xb4,        0xb3, 0x04];
const IR_SENSITIVITY_WII_LEVEL_3 = [0x02, 0x00, 0x00, 0x71, 0x01, 0x00, 0xaa, 0x00, 0x64,        0x63, 0x03];
const IR_SENSITIVITY_WII_LEVEL_4 = [0x02, 0x00, 0x00, 0x71, 0x01, 0x00, 0xc8, 0x00, 0x36,        0x35, 0x03];
const IR_SENSITIVITY_WII_LEVEL_5 = [0x07, 0x00, 0x00, 0x71, 0x01, 0x00, 0x72, 0x00, 0x20,        0x1f, 0x03];

//if the wiimote's reporting mode doesn't send exactly the amount of ir data for the ir mode, it doesn't send any ir data!

const IR_MODE_BASIC = 1; //10 bytes of ir data (use the 0x36 or 0x37 reporting modes)
const IR_MODE_EXTENDED = 3; //12 bytes of ir data (use the 0x33 reporting mode)
const IR_MODE_FULL = 5; //36 (18) bytes of ir data (use the 0x3e/0x3f reporting modes)

//for debugging lel
function objtostr(obj, str = "", i = 0) {
    i++;
    let tabs = "";
    for(let j = 0; j < i; j++) {
        tabs += "\t";
    }
    if(typeof obj == "object") {
        str += "\r\n"+tabs.substring(0, tabs.length-1)+"{";
        for(const prop in obj) {
            const val = obj[prop];
            str += "\r\n";
            str += tabs+prop+": " + objtostr(val, "", i);
        }
        str += "\r\n"+tabs.substring(0, tabs.length-1)+"},";
    }else {
        str += obj+",";
    }
    return str;
}

class hid_wiimote {
    #rumbling = false;
    #requestingStatus = false;
    #readMemoryListeners = [];
    //#writeMemoryListeners = []; //rip
    buttons = 0; //WORD
    lastButtons = 0; //WORD
    #eventListeners = {
        //built in listeners
        //onMotionPlusExtensionChange: [
        //    {
        //        callback: (lastExtensionStatus) => {
        //            if(lastExtensionStatus) {
        //                if(this.currentExtensionId == EXTENSION_MOTIONPLUS_PASSTHROUGH_NUNCHUK || this.currentExtensionId == EXTENSION_MOTIONPLUS_PASSTHROUGH_CLASSIC_CONTROLLER) {
        //                    
        //                }
        //            }
        //        },
        //        extra: undefined,
        //    },
        //]
    };
    #reportingMode = 0x30;
    status = {
        batteryLevel: 0,
        batteryLow: 0,
        extension: 0,
        speaker: 0,
        IRcamera: 0,
        leds: [0, 0, 0, 0]
    };
    IRBytes = []; //ir camera bytes returned from input reports
    IR = undefined;
    currentExtensionId = EXTENSION_NONE;
    extensionBytes = []; //extension bytes returned from input reports
    extension = {
        //[currentExtensionId]: {
            //...
        //}
    }; //parsed properties of the current extension (only one extension id (the current one) will be defined in this object at once)
    expectingMotionPlus = false;
    expectingMotionPlusTimer = 0; //we wait MOTIONPLUS_TIMEOUT_MS for the wiimote to send a status report before giving up on motion plus

    static periodicallyCheckForMotionPlus = true;

    static #makeInfo(accelerometerByteCount = 0, IRByteCount = 0, extensionByteCount = 0, hasButtonBytes = true) {
        //if button bytes are present, it's always two bytes
        return {buttonByteCount: hasButtonBytes*2, accelerometerByteCount, IRByteCount, extensionByteCount};
    }

    static inputReportInfo = {
        0x30: hid_wiimote.#makeInfo(),
        0x31: hid_wiimote.#makeInfo(3),
        0x32: hid_wiimote.#makeInfo(0, 0, 8),
        0x33: hid_wiimote.#makeInfo(3, 12, 0),
        0x34: hid_wiimote.#makeInfo(0, 0, 19),
        0x35: hid_wiimote.#makeInfo(3, 0, 16),
        0x36: hid_wiimote.#makeInfo(0, 10, 9),
        0x37: hid_wiimote.#makeInfo(3, 10, 6),
        0x3d: hid_wiimote.#makeInfo(0, 0, 21, false),
        0x3e: hid_wiimote.#makeInfo(1, 18, 0), //, true),
        0x3f: hid_wiimote.#makeInfo(1, 18, 0), //, true),
    }

    //wait i could just shift all of these instead (ok wait a minute that's still not foolproofe)
    get a() {
        //return (this.buttons & 0x800) == 0x800;
        return (this.buttons >> 11) & 1;
    }

    get b() {
        return (this.buttons >> 10) & 1;
    }

    get up() {
        return (this.buttons >> 3) & 1;
    }

    get down() {
        return (this.buttons >> 2) & 1;
    }

    get left() {
        return (this.buttons & 0x1);
    }

    get right() {
        return (this.buttons >> 1) & 1;
    }

    get minus() {
        return (this.buttons >> 12) & 1;
    }

    get plus() {
        return (this.buttons >> 4) & 1;
    }

    get home() {
        return (this.buttons >> 15) & 1;
    }

    get one() {
        return (this.buttons >> 9) & 1;
    }

    get two() {
        return (this.buttons >> 8) & 1;
    }

    constructor(handle) {
        this.handle = handle;
        this.requestStatus(() => {
            print(this.status);
            if(this.status.extension) {
                //aw damn we gotta check if it's motion plus
                this.readCurrentExtensionFromWiimote();
                if(this.currentExtensionId == EXTENSION_MOTIONPLUS_ACTIVATE || this.currentExtensionId == EXTENSION_MOTIONPLUS_PASSTHROUGH_NUNCHUK || this.currentExtensionId == EXTENSION_MOTIONPLUS_PASSTHROUGH_CLASSIC_CONTROLLER) {
                    printNoHighlight("WAIT A SECOND THERE'S [[MotionPlus]]");
                }else {
                    this.initializeExtension();
                }
            }else {
                this.maybeSetupMotionPlus();
                if(!this.expectingMotionPlus) {
                    this.readCurrentExtensionFromWiimote();
                }
            }
            if(this.status.IRcamera) {
                if(!this.IR) {
                    this.IR = {mode: undefined};
                }
                //print(this.readMemorySync(0x04, 0xb00033, 1), "ir mode");
                this.IR.mode = this.readMemorySync(0x04, 0xb00033, 1)[0];
            }
        });
    }

    //instead of calling hid_read in a while loop yourself, you can use this handy function
    poll(timeout) {
        let raw;
        if(timeout) {
            raw = hid_read_timeout(this.handle, timeout);
        }else {
            raw = hid_read(this.handle);
        }
        
        if(raw) {
            this.onData(raw);
        }
        return raw;
    }

    onData(raw) {
        const id = raw[0];
        if(this.expectingMotionPlus && (Date.now() - this.expectingMotionPlusTimer) > MOTIONPLUS_TIMEOUT_MS) {
            this.expectingMotionPlus = false;
            this.expectingMotionPlusTimer = 0;
            printNoHighlight("(expected motion plus but wiimote didn't send status report)"); //maybe we should assume an extension is plugged into it?

        }
        if((id & 0x30) == 0x30) { //we'll handle all the 0x30 input reports here
            this.#reportingMode = id;
            //if(id == 0x32 || id == 0x34 || id == 0x36 || id == 0x37 || id == 0x3d) { //each of these report ids sends some extension bytes
            const reportInfo = hid_wiimote.inputReportInfo[id];
            if(reportInfo.extensionByteCount != 0 && this.currentExtensionId) {
                const byteCount = reportInfo.extensionByteCount;
                const temp = []; //so i can clear the extensionBytes list (just in case the amount of extension bytes in this report was less than the previous one)
                //the extension bytes are always the last set of bytes
                const pos = 1 + reportInfo.buttonByteCount + reportInfo.accelerometerByteCount + reportInfo.IRByteCount; // + 1 because if the report id (i forgot about that part)
                for(let i = 0; i < byteCount; i++) {
                    temp[i] = raw[pos + i];
                }
                this.extensionBytes = temp;
                this.#parseExtensionBytes();
            }
            if(this.status.IRcamera && reportInfo.IRByteCount) {
                if(!this.IR) {
                    this.IR = {};
                }

                const byteCount = reportInfo.IRByteCount;
                const temp = [];
                const pos = 1 + reportInfo.buttonByteCount + reportInfo.accelerometerByteCount;
                for(let i = 0; i < byteCount; i++) {
                    temp[i] = raw[pos + i];
                }
                this.IRBytes = temp;
                this.#parseIRbytes(id);
            }
            if(reportInfo.buttonByteCount) {
                this.buttons = raw[2] << 8 | raw[1];
                if(this.lastButtons != this.buttons) {
                    const changedButtons = [];
                    //this.#fireEvent("onSpecificButtonDown");
                    //we're gonna check each bit of both to see which buttons were pressed/released
                    for(let i = 0; i < 16; i++) { //since the buttons data is 2 bytes, that's 16 bits
                        if(((this.lastButtons >> i) & 1) != ((this.buttons >> i) & 1)) {
                            changedButtons.push({button: i, down: (this.buttons >> i) & 1});
                        }
                    }

                    for(const {button, down} of changedButtons) {
                        if(down) {
                            this.#fireEvent("onButtonDown", button);
                        }else {
                            this.#fireEvent("onButtonUp", button);
                        }
                    }
                }
                this.lastButtons = this.buttons;
            }
        }else if(id == 0x20) { //0x20 is the status report id and the wiimote will stop sending certain reports when an extension controller (like a nunchuk) was plugged in (and we have to do some bs to fix it)
            this.buttons = raw[2] << 8 | raw[1];
            //if(this.buttons) {
            //    this.#fireEvent("onSpecificButtonDown");
            //}

            const lastExtension = this.status.extension;

            this.status = {
                batteryLevel: raw[6],
                batteryLow: raw[3] & 1,
                extension: (raw[3] >> 1) & 1,
                speaker: (raw[3] >> 2) & 1,
                IRcamera: (raw[3] >> 3) & 1,
                leds: [(raw[3] >> 4) & 1, (raw[3] >> 5) & 1, (raw[3] >> 6) & 1, (raw[3] >> 7) & 1]
            }

            if(!this.#requestingStatus) {
                printNoHighlight("unexpected status!");
                this.setDataReportingMode(false, this.#reportingMode); //go back to whatever the reporting mode was before lol
                /*this.readMemory(0x04, 0xa400fe, 2, (data) => {
                    print(data);
                    });*/
                    
                if(lastExtension != this.status.extension) { //just making sure it actually changed lol (this check is kinda pointless unless you have two things trying to talk to the wiimote at once)
                    const prevId = this.currentExtensionId;
                    if(this.status.extension) {
                        //initialize the extension
                        if(!this.expectingMotionPlus) {
                            this.initializeExtension();
                        }else {
                            this.expectingMotionPlus = false;
                            this.expectingMotionPlusTimer = 0;
                            this.readCurrentExtensionFromWiimote();
                        }
                        //this.readCurrentExtensionFromWiimote();
                        /*SetForegroundWindow(GetConsoleWindow());
                        if(getline("An extension was detected. Change reporting mode to 0x34? (16 extension bytes) [Y/N] -> ").toLowerCase()[0] == "y") {
                            this.setDataReportingMode(false, 0x34);
                        }else {
                            this.setDataReportingMode(false, this.#reportingMode);
                        }*/
                    }else {
                        //this.setDataReportingMode(false, this.#reportingMode);
                        delete this.extension[this.currentExtensionId];
                        this.readCurrentExtensionFromWiimote(); //to reset currentExtension to zero (or, if you have wii motion plus inside, do that)
                    }
                    this.#fireEvent("onExtensionChange", prevId);
                }
            }else {
                if(this.#requestingStatus instanceof Function) {
                    //this.#requestingStatus(raw);
                    this.#requestingStatus(this.status);
                }
                this.#requestingStatus = false;
            }
        }else if(id == 0x21) {
            this.buttons = raw[2] << 8 | raw[1];

            const current = this.#readMemoryListeners[0];

            if((raw[3] & 0b1111) != 0) {
                const g = raw[3] & 0b1111;
                const console = GetStdHandle(STD_OUTPUT_HANDLE);
                SetConsoleTextAttribute(console, 4);
                printNoHighlight("read memory error! code:", g);
                if(g == 7) {
                    printNoHighlight("(attempting to read from a write-only register)");
                    this.#readMemoryListeners.splice(0, 1);
                    //return;
                }else if(g == 8) {
                    printNoHighlight("(attempting to read from nonexistant memory)");
                    this.#readMemoryListeners.splice(0, 1);
                    //return;
                }
                SetConsoleTextAttribute(console, 7);
                current.callback(false, undefined);
                return;
            }

            //this.#readMemoryListeners[0].callback(raw);
            const bytes_read = (raw[3] >> 4) + 1;
            for(let i = 0; i < bytes_read; i++) {
                current.data.push(raw[i+6]);
            }
            current.size -= bytes_read;
            print(bytes_read, current.size);
            if(current.size <= 0) {
                print("all bytes received");
                current.callback(true, current.data);
                this.#readMemoryListeners.splice(0, 1);
            }
        }else if(id == 0x22) {
            this.buttons = raw[2] << 8 | raw[1];

            //const current = this.#writeMemoryListeners[0];

            if(raw[4] != 0) {
                print("some output report failed!",raw[4]);
                //current?.reject(raw[4]);
            }else {
                print("output report successfully received!");
                //current?.resolve();
            }
            //this.#writeMemoryListeners.splice(0, 1);
        }
    }

    //TODO: add more (i would've already but i only have these two extensions lol
    #parseExtensionBytes() {
        if(this.currentExtensionId == EXTENSION_NONE) {
            printNoHighlight("calling #parseExtensionBytes but currentExtension is null? (ts shouldn't happen lol i'm throwing)"); //i love ts
        }else {
            let properties = this.extension[this.currentExtensionId];
            let firstTick;
            if(!properties) {
                properties = {};
                firstTick = true;
                this.extension[this.currentExtensionId] = properties;
            }

            //let fireButtonEvent = false;
            //let changedButtons = [];
            switch(this.currentExtensionId) {
                case EXTENSION_NUNCHUK:
                    properties.sX = this.extensionBytes[0]; //analog x
                    properties.sY = this.extensionBytes[1]; //analog y
                    properties.aX = this.extensionBytes[2] << 2 | ((this.extensionBytes[5] >> 2) & 0b11); //10 bit accelerometer x (i think?)
                    properties.aY = this.extensionBytes[3] << 2 | ((this.extensionBytes[5] >> 4) & 0b11); //10 bit accelerometer y (i think?)
                    properties.aZ = this.extensionBytes[4] << 2 | ((this.extensionBytes[5] >> 6) & 0b11); //10 bit accelerometer z (i think?)
                    properties.lastButtons = properties.buttons; //kinda error prone to taking buttons by reference but i remedy this by setting buttons to a new object created in the next line lol
                    properties.buttons = {
                        c: !((this.extensionBytes[5] >> 1) & 1), //c button (for some reason, 0 means it's pressed)
                        z: !(this.extensionBytes[5] & 1), //z button (for some reason, 0 means it's pressed)
                    };
                    
                    //DrawText(dc, `{\r\n\tsX: ${properties.sX},\t\r\n\tsY: ${properties.sY},\t\r\n\taX: ${properties.aX},\t\r\n\taY: ${properties.aY},\t\r\n\taZ: ${properties.aZ},\t\r\n}`, 904, screenHeight/2, screenWidth, screenHeight, DT_EXPANDTABS);
                    break;
                
                case EXTENSION_GUITAR:
                    properties.type = (this.extensionBytes[0] >> 7) & 1; //1 for GH3 les pauls, 0 for GHWT guitars
                    properties.sX = this.extensionBytes[0]; //analog x
                    properties.sY = this.extensionBytes[1]; //analog y
                    properties.lastTouchBar = properties.touchBar; //i should make these an actual separate javascript class so the "last" members can be private
                    properties.touchBar = this.extensionBytes[2]; //touch bar (that only exists on GHWT guitars (lucky for me!))
                    if(firstTick) {
                        properties.lastTouchBar = properties.touchBar;
                    }
                    properties.whammyBar = this.extensionBytes[3];
                    properties.lastButtons = properties.buttons; //kinda error prone by taking buttons by reference but i remedy this by setting buttons to a new object created in the next line lol
                    //for some reason yet again, the buttons are 0 when pressed
                    properties.buttons = {
                        green:  !((this.extensionBytes[5] >> 4) & 1),
                        red:    !((this.extensionBytes[5] >> 6) & 1),
                        yellow: !((this.extensionBytes[5] >> 3) & 1),
                        blue:   !((this.extensionBytes[5] >> 5) & 1),
                        orange: !((this.extensionBytes[5] >> 7) & 1),
                        down:   !(this.extensionBytes[5] & 1),
                        up:     !((this.extensionBytes[4] >> 6) & 1),
                        pedal:  !((this.extensionBytes[5] >> 2) & 1),
                        plus:   !((this.extensionBytes[4] >> 2) & 1),
                        minus:  !((this.extensionBytes[4] >> 4) & 1), //starpower for GHWT
                    };

                    if(properties.lastTouchBar != properties.touchBar) {
                        this.#fireEvent("onGuitarTouchBarChange");
                    }
                    break;
                
                case EXTENSION_MOTIONPLUS_PASSTHROUGH_NUNCHUK:
                case EXTENSION_MOTIONPLUS_PASSTHROUGH_CLASSIC_CONTROLLER:
                case EXTENSION_MOTIONPLUS_ACTIVATE:
                    //let properties = properties;
                    if(!(this.extensionBytes[5] >> 1 & 1)) { //bit 1 of byte 5 tells us if this is motion plus data
                        //all the motion plus passthrough data has the extension bit in byte 4 so let's just handle that rn
                        //properties.lastHasExtension = properties.hasExtension; //i should make these an actual separate javascript class so the "last" members can be private
                        //properties.hasExtension = this.extensionBytes[4] & 1;
                        //if(firstTick) {
                        //    properties.lastHasExtension = properties.hasExtension;
                        //}
                        ////DrawText(dc, objtostr(properties), 904, screenHeight/2, screenWidth, screenHeight, DT_EXPANDTABS);
                        //if(properties.lastHasExtension != properties.hasExtension) {
                        //    this.#fireEvent("onMotionPlusExtensionChange", properties.lastHasExtension);
                        //}
                        //continue; //if not, continue (ok wait switch statements don't do continue i have to actually if else the whole thing)
                    }else {
                        if(this.currentExtensionId != EXTENSION_MOTIONPLUS_ACTIVATE) {
                            if(firstTick) {
                                //print("firstick");
                                properties.motionplus = {};
                                if(this.currentExtensionId == EXTENSION_MOTIONPLUS_PASSTHROUGH_NUNCHUK) {
                                    properties.nunchuk = {};
                                    //print("[ro[erties nunchuk", properties);
                                }else {
                                    properties.classicController = {};
                                }
                                //print("p[roerties.motionplus", properties.motionplus);
                            }
                            properties = properties.motionplus;
                            //print(properties, "m", this.extension[this.currentExtensionId]);
                        }
                        properties.raw = {
                            yaw: (this.extensionBytes[3] >> 2) << 8 | this.extensionBytes[0],
                            roll: (this.extensionBytes[4] >> 2) << 8 | this.extensionBytes[1],
                            pitch: (this.extensionBytes[5] >> 2) << 8 | this.extensionBytes[2],
                        }
                        properties.slowMode = {
                            yaw: (this.extensionBytes[3] >> 1 & 1),
                            roll: (this.extensionBytes[4] >> 1 & 1),
                            pitch: (this.extensionBytes[3] & 1),
                        };
                        //properties.yawSlowMode = (this.extensionBytes[3] >> 1 & 1);
                        //properties.rollSlowMode = (this.extensionBytes[4] >> 1 & 1);
                        //properties.pitchSlowMode = (this.extensionBytes[3] & 1);
                        properties.yaw = properties.raw.yaw/(8192/595);
                        if(!properties.slowMode.yaw) {
                            properties.yaw *= 2000/440;
                        }
                        properties.roll = properties.raw.roll/(8192/595);
                        if(!properties.slowMode.roll) {
                            properties.roll *= 2000/440;
                        }
                        properties.pitch = properties.raw.pitch/(8192/595);
                        if(!properties.slowMode.pitch) {
                            properties.pitch *= 2000/440;
                        }
                        properties.lastHasExtension = properties.hasExtension; //i should make these an actual separate javascript class so the "last" members can be private
                        properties.hasExtension = this.extensionBytes[4] & 1;
                        if(firstTick) {
                            properties.lastHasExtension = properties.hasExtension;
                        }
                        //DrawText(dc, objtostr(properties), 904, screenHeight/2, screenWidth, screenHeight, DT_EXPANDTABS);
                        if(properties.lastHasExtension != properties.hasExtension) {
                            this.#fireEvent("onMotionPlusExtensionChange", properties.lastHasExtension);
                        }
                        break;
                    }
                
                //i've already handled the cases where passthrough sends motion plus data so this is all nunchuk baby
                case EXTENSION_MOTIONPLUS_PASSTHROUGH_NUNCHUK:
                    //let properties = properties.nunchuk;
                    //print("passthrougbn nunchuk", this.currentExtensionId == EXTENSION_MOTIONPLUS_PASSTHROUGH_NUNCHUK, properties);
                    if(firstTick) {
                        properties.nunchuk = {};
                        properties.motionplus = {};
                    }
                    properties = properties.nunchuk;
                    properties.sX = this.extensionBytes[0]; //analog x
                    properties.sY = this.extensionBytes[1]; //analog y
                    properties.aX = this.extensionBytes[2] << 2 | (((this.extensionBytes[5] >> 4) & 0b1) << 1); //10 bit accelerometer x (i think?)
                    properties.aY = this.extensionBytes[3] << 2 | (((this.extensionBytes[5] >> 5) & 0b1) << 1); //10 bit accelerometer y (i think?)
                    properties.aZ = this.extensionBytes[4] << 2 | ((this.extensionBytes[5] >> 6) & 0b11); //10 bit accelerometer z (i think?)
                    properties.lastButtons = properties.buttons; //kinda error prone to take buttons by reference but i remedy this by setting buttons to a new object created in the next line lol
                    if(!properties.lastButtons) { //this motion plus passthrough stuff is kinda weird and i can't use first tick if they do the motion plus data first then the nunchuk data
                        properties.lastButtons = {
                            c: !((this.extensionBytes[5] >> 3) & 1), //c button (for some reason, 0 means it's pressed)
                            z: !((this.extensionBytes[5] >> 2) & 1), //z button (for some reason, 0 means it's pressed)
                        };
                    }
                    properties.buttons = {
                        c: !((this.extensionBytes[5] >> 3) & 1), //c button (for some reason, 0 means it's pressed)
                        z: !((this.extensionBytes[5] >> 2) & 1), //z button (for some reason, 0 means it's pressed)
                    };
                    //DrawText(dc, objtostr(properties), 904, screenHeight/2, screenWidth, screenHeight, DT_EXPANDTABS);
                    break;

                case EXTENSION_MOTIONPLUS_PASSTHROUGH_CLASSIC_CONTROLLER:
                    //lowkey i don't have a classic controller so i'll just put this here
                    if(firstTick) {
                        properties.classicController = {};
                        properties.motionplus = {};
                    }
            }

            //this.extension[this.currentExtensionId] = properties; //wait i don't have to do this i only directly set properties once

            if(properties.buttons) {
                if(firstTick) {
                    //if this was the first time we've received bytes from this extension since it was connected, properties.lastButtons would be undefined and the for in loop below would give me a type error lol
                    properties.lastButtons = properties.buttons;
                }
                const changedButtons = [];
                //fireButtonEvent = (this.extensionBytes[5] & 0b11) ^ 0b11; //the first and second bits of the 6th byte are both buttons on the nunchuk (xor since 0 means they're pressed)
                for(const prop in properties.buttons) {
                    //just benchmarked using firstTick vs an optional chaining operator here to avoid the TypeError that comes from properties.lastButtons being undefined
                    //the firstTick solution was actually ever so slightly faster than optional chaining
                    //https://jsbm.dev/axZHeQCu2lBbE
                    if(properties.lastButtons[prop] != properties.buttons[prop]) {
                        changedButtons.push({button: prop, down: properties.buttons[prop]})
                    }
                }
                //this.#fireEvent("onExtensionButtonDown");
                for(const {button, down} of changedButtons) {
                    if(down) {
                        this.#fireEvent("onExtensionButtonDown", button);
                    }else {
                        this.#fireEvent("onExtensionButtonUp", button);
                    }
                }
            }
        }
    }

    #parseIRbytes(id) {
        let dots = [];
        let dotindex = 0;
        switch(this.IR.mode) {
            case IR_MODE_BASIC:
                //example data: [0x29 0xdd 0x21 0xe0 0x9c 0xff 0xff 0xff 0xff 0xff]
                for(let i = 0; i < 2; i++) { //only looping two times because im trying to read each pair of dots (each pair is 5 bytes)
                    const offset = 5*i;
                    if(this.IRBytes[0+offset] != 0xff && this.IRBytes[1+offset] != 0xff) {
                        //not empty
                        //additional two bytes of x position stored in bits 4 and 5 of byte 2 + offset
                        //additional two bytes of y position stored in bits 6 and 7 ! of byte 2 + offset
                        const x = ((this.IRBytes[2+offset] >> 4 & 0b11) << 8) | this.IRBytes[0+offset];
                        const y = ((this.IRBytes[2+offset] >> 6) << 8) | this.IRBytes[1+offset];
                        
                        //ok yeah it was clearly not like this lol, this additional two bytes must be put after the most significant bit of the value (so in our case, after the 7th bit)
                        // const x = this.IRBytes[0+offset] << 2 | (this.IRBytes[2+offset] >> 4 & 0b11);
                        // const y = this.IRBytes[1+offset] << 2 | (this.IRBytes[2+offset] >> 6);
                        
                        //dots.push({x, y}); //wait no if i push the order might be wrong!
                        dots[dotindex] = {x, y};
                    }
                    dotindex++;
                    if(this.IRBytes[3+offset] != 0xff && this.IRBytes[4+offset] != 0xff) {
                        const x = ((this.IRBytes[2+offset] & 0b11) << 8) | this.IRBytes[3+offset];
                        const y = ((this.IRBytes[2+offset] >> 2 & 0b11) << 8) | this.IRBytes[4+offset];
                        
                        //ok yeah it was clearly not like this lol, this additional two bytes must be put after the most significant bit of the value (so in our case, after the 7th bit)
                        //const x = this.IRBytes[3+offset] << 2 | (this.IRBytes[2+offset] & 0b11);
                        //const y = this.IRBytes[4+offset] << 2 | (this.IRBytes[2+offset] >> 2 & 0b11);

                        //dots.push({x, y});
                        dots[dotindex] = {x, y};
                    }
                    dotindex++;
                }
                break;
            case IR_MODE_EXTENDED:
                for(let i = 0; i < 4; i++) {
                    const offset = 3*i;
                    if(this.IRBytes[0+offset] != 0xff && this.IRBytes[1+offset] != 0xff) {
                        //not empty
                                                //additional two bytes of x position stored in bits 4 and 5 of byte 2 + offset
                        //additional two bytes of y position stored in bits 6 and 7 ! of byte 2 + offset
                        const x = ((this.IRBytes[2+offset] >> 4 & 0b11) << 8) | this.IRBytes[0+offset];
                        const y = ((this.IRBytes[2+offset] >> 6) << 8) | this.IRBytes[1+offset];
                        const size = this.IRBytes[2+offset] & 0b1111;

                        //i don't use dotindex here because i loop 4 times lel
                        dots[i] = {x, y, size};
                    }
                }
                break;
            case IR_MODE_FULL:
                //we gotta check the report id because 0x3e sends the first 2 pairs of ir dots and 0x3f sends the last 2
                //ok we're gonna do this kinda differently since it returns dots in TWO reports instead of one
                if(this.IR.dots) {
                    dots = this.IR.dots; //by doing it like this i keep the dot data of the last report
                }
                dotindex = 2*(id - 0x3e); //if the id == 0x3e dotindex starts at 0, else dotindex starts at 2 (if id == 0x3f) (branchless code god (they call me doctor runtime, call me doctor optimization haha))
                for(let i = 0; i < 2; i++) {
                    const offset = 9*i;
                    if(this.IRBytes[0+offset] != 0xff && this.IRBytes[1+offset] != 0xff) {
                        const x = ((this.IRBytes[2+offset] >> 4 & 0b11) << 8) | this.IRBytes[0+offset];
                        const y = ((this.IRBytes[2+offset] >> 6) << 8) | this.IRBytes[1+offset];
                        const size = this.IRBytes[2+offset] & 0b1111;

                        const minX = this.IRBytes[3+offset];
                        const minY = this.IRBytes[4+offset];
                        const maxX = this.IRBytes[5+offset];
                        const maxY = this.IRBytes[6+offset];

                        const intensity = this.IRBytes[8+offset];

                        const blob = {minX, minY, maxX, maxY}
                        dots[dotindex] = {x, y, blob, size, intensity};
                    }else {
                        //delete the old entry
                        delete dots[dotindex];
                    }
                    dotindex++;
                }
                break;
        }
        this.IR.dots = dots;
        DrawText(dc, objtostr(this.IR), 904, screenHeight/2, screenWidth, screenHeight, DT_EXPANDTABS);
        this.#fireEvent("onIRData");
    }

    addEventListener(event, extra, callback) {
        event = event.toLowerCase();
        if(!this.#eventListeners[event]) {
            this.#eventListeners[event] = [];
        }
        this.#eventListeners[event].push({callback, extra});
    }

    #fireEvent(event, eventExtra) {
        //i could make this even more generic if i did (but technically it would be slower since i'd be calling a function every loop)
        //for(const {callback, extra} of this.#eventListeners[event]) {
            //this.#eventDispatchers[event](callback, extra);
        //}
        event = event.toLowerCase();
        if(!this.#eventListeners[event]) { //if nobody is listening to this event then we'll just return (otherwise you get a TypeError lol)
            return;
        }
        if(event == "onspecificbuttondown" || event == "onspecificbuttonup") {
            /*for(const {callback, extra} of this.#eventListeners[event]) {
              if((this.buttons >> extra) & 1) {
                    callback();
                }
            }*/
           for(const {callback, extra} of this.#eventListeners[event]) {
              if(extra == eventExtra) {
                    callback();
                }
            }
        }else if(event == "onbuttondown" || event == "onbuttonup") {
            this.#fireEvent("onSpecific"+event.substring(2), eventExtra);
            for(const {callback} of this.#eventListeners[event]) {
                //extension status, previous extension id
                callback(eventExtra);
            }
        }else if(event == "onextensionchange") {
            for(const {callback} of this.#eventListeners[event]) {
                //extension status, previous extension id
                callback(this.status.extension, eventExtra);
            }
        }else if(event == "onmotionplusextensionchange") {
            for(const {callback} of this.#eventListeners[event]) {
                //extension status, previous extension id
                callback(eventExtra);
            }
        }else if(event == "onextensionbuttondown" || event == "onextensionbuttonup") { //no specific version because the extensions are all different
            for(const {callback} of this.#eventListeners[event]) {
                //extension id, extension object,
                callback(this.currentExtensionId, this.extension[this.currentExtensionId], eventExtra);
            }
        }else if(event == "onguitartouchbarchange") {
            for(const {callback} of this.#eventListeners[event]) {
                //extension id, extension object,
                callback(this.extension[this.currentExtensionId].touchBar);
            }
        }else if(event == "onirdata") {
            for(const {callback} of this.#eventListeners[event]) {
                //extension id, extension object,
                callback(this.IR);
            }
        }
    }

    write(buffer, msg) {
        return this.#errorCheck(hid_write(this.handle, buffer), msg + ` (hid_write -> id: ${buffer[0].toString(16)})`);
    }

    requestStatus(callback) {
        //print(callback ?? true);
        this.#requestingStatus = callback ?? true;
        this.write(new Uint8Array([0x15, this.#rumbling], "requestStatus"));
    }

    waitForReport(reportId) {
        let raw;
        while(true) {
            raw = hid_read(this.handle);
            if(raw[0] == reportId) {
                break;
            }
            print("0x"+raw[0].toString(16)+" reported while waiting for 0x"+reportId.toString(16));
            this.onData(raw);
        }
        return raw;
    }
    
    //reportCallback param signature is Function(report : Uint8Array) : boolean | undefined
    //the value you return determines whether to return (true), continue (false), or let the the wiimote handle it (undefined)
    waitForReportWithPredicate(reportId, reportCallback) {
        let raw;
        while(true) {
            raw = hid_read(this.handle);
            if(raw[0] == reportId) {
                const val = reportCallback(raw);
                if(val) {
                    return raw;
                }else if(val == false) {
                    continue;
                }
            }
            print("0x"+raw[0].toString(16)+" reported while waiting for 0x"+reportId.toString(16));
            this.onData(raw);
        }
    }

    initializeExtension(motionplus = false) {
        //                                                     i think the (4) means the addressSpace mode
        this.writeMemorySync(0x04, 0xA400F0 + (motionplus*0x020000), 1, [0x55]); //write 0x55 to 0x(4)A400F0 (or if motion plus, 0x(4)A600F0)
        if(!motionplus) { //there's one more step to activating motionplus so it won't show up yet...
            this.writeMemorySync(0x04, 0xA400FB, 1, [0x00]); //write 0x00 to 0x(4)A400FB (you don't need to actually do this for motion plus)
            this.readCurrentExtensionFromWiimote();
        }
    }

    //updates the currentExtension property
    readCurrentExtensionFromWiimote() {
        /*this.readMemory(0x04, 0xa400fa, 6, (success, data) => { //the register is unreadable when there's no extensions
            if(success) {
                let val = 0n; //i gotta use a big int because javascript starts tweaking (turning numbers negative) when shifting 32 bits or something like that
                //for(let i = 0; i < 6; i++) {
                //    this.currentExtension |= data[i] << (6-i)*8;
                //}
                for(let i = 0; i < 6; i++) {
                    val |= (BigInt(data[i]) << ((5n-BigInt(i))*8n));
                }
                this.currentExtensionId = Number(val); //lel!
            }else {
                printNoHighlight("(no extension was found)");
                this.currentExtensionId = EXTENSION_NONE;
            }
        });*/

        //synchronous read memory
        const addressSpace = 0x04;
        const offset = 0xa400fa;
        const size = 6;
        //this.write(new Uint8Array([0x17, addressSpace | this.#rumbling, (offset & 0xff0000) >> 16, (offset & 0xff00) >> 8, offset & 0xff, size >> 8, size & 0xff]), "readMemory");
        //let raw;
        //let data = [];
        //while(true) {
        //    raw = hid_read(this.handle);
        //    if(raw[0] == 0x21) {
        //        //print(raw, raw[3] >> 4, "FACK");
        //        const byteLength = (raw[3] >> 4) + 1;           //it seems like when there's an error byteLength just defaults to 16?
        //        //making sure we're reading the correct response by checking the two offset bytes at raw[4] and raw[5]
        //        if((raw[4] << 8 | raw[5]) == (offset & 0xffff) && (byteLength == size || raw[3] & 0b1111 != 0)) {
        //            //print(raw, raw[3] >> 4, (raw[4] << 8 | raw[5]));
        //            for(let i = 0; i < byteLength; i++) {
        //                data.push(raw[i+6]);
        //            }
        //            break;
        //        }
        //    }
        //    this.onData(raw);
        //}

        //oh wait i wrote this when i was in the middle of writing readMemorySync
        //const raw = this.waitForReportWithPredicate(0x21, (raw) => {
        //    //print(raw, raw[3] >> 4, "FACK");
        //    const byteLength = (raw[3] >> 4) + 1;           //it seems like when there's an error byteLength just defaults to 16?
        //    //making sure we're reading the correct response by checking the two offset bytes at raw[4] and raw[5]
        //    if((raw[4] << 8 | raw[5]) == (offset & 0xffff) && (byteLength == size || raw[3] & 0b1111 != 0)) {
        //        //print(raw, raw[3] >> 4, (raw[4] << 8 | raw[5]));
        //        for(let i = 0; i < byteLength; i++) {
        //            data.push(raw[i+6]);
        //        }
        //        return true;
        //    }
        //});

        const data = this.readMemorySync(addressSpace, offset, size);
        if(data) {
            let val = 0n; //i gotta use a big int because when using bitwise operations, javascript converts the value into a 32bit signed integer (don't question this source: https://en.wikipedia.org/wiki/Asm.js#:~:text=In%20JavaScript%2C%20bitwise%20operators%20convert%20their%20operands%20to%2032%2Dbit%20signed%20integers%20and%20give%20integer%20results)
            //for(let i = 0; i < 6; i++) {
            //    this.currentExtension |= data[i] << (6-i)*8;
            //}
            for(let i = 0; i < 6; i++) {
                val |= (BigInt(data[i]) << ((5n-BigInt(i))*8n));
            }
            this.currentExtensionId = Number(val); //lel!
        }else {
            printNoHighlight("(no extension was found)");
            this.currentExtensionId = EXTENSION_NONE;
        }
    }

    maybeSetupMotionPlus(passthrough_mode = PASSTHROUGH_NONE) {
        //this.readMemory(0x04, 0xa600fa, 0x6, (success, data) => {
        //    if(!success) {
        //        printNoHighlight("(no )")
        //    }
        //});
        const data = this.readMemorySync(0x04, 0xa600fe, 0x2); //reading the "two-byte expansion identifier" at 0xa600fe
        if(!data) { //read memory fails with error code 7 if there's no motion plus extension (or if it's already active)
            printNoHighlight("(no motion plus detected)");
        }else {
            //init motion plus
            this.initializeExtension(true);
            this.expectingMotionPlus = true;
            this.expectingMotionPlusTimer = Date.now();
            //activate motion plus
            this.writeMemorySync(0x04, 0xA600FE, 1, [passthrough_mode]);
            //after this point the wiimote should send a status report telling us the motion plus connected
            //const data = this.readMemorySync(0x04, 0xA400FA, 6);
            //if(data) {
            //    let val = 0n; //i gotta use a big int because when using bitwise operations, javascript converts the value into a 32bit signed integer (don't question this source: https://en.wikipedia.org/wiki/Asm.js#:~:text=In%20JavaScript%2C%20bitwise%20operators%20convert%20their%20operands%20to%2032%2Dbit%20signed%20integers%20and%20give%20integer%20results)
            //    //for(let i = 0; i < 6; i++) {
            //    //    this.currentExtension |= data[i] << (6-i)*8;
            //    //}
            //    for(let i = 0; i < 6; i++) {
            //        val |= (BigInt(data[i]) << ((5n-BigInt(i))*8n));
            //    }
            //    if(Number(val) == EXTENSION_MOTIONPLUS_ACTIVATE) {
            //        printNoHighlight("(motion plus successfully activated)");
            //    }
            //}else {
            //    printNoHighlight("(motion plus failed to activate (perhaps it was already active?))")
            //}
        }
    }

    setMotionPlusPassthroughMode(passthrough_mode) {
        //you lowkey gotta disable motion plus first
        this.deactivateMotionPlus();
        this.maybeSetupMotionPlus(passthrough_mode)
    }

    //deactivates motion plus and activates the extension plugged into it
    deactivateMotionPlus() {
        this.writeMemorySync(0x04, 0xA400F0, 1, [0x55]);
    }

    //valid line of js consisting of three keywords!
    //void delete this

    setDataReportingMode(continuous, mode) {
        //this.#errorCheck(hid_write(this.handle, new Uint8Array([0x12, continuous << 2, mode])), "setDataReportingMode (hid_write -> id: 0x12)");
        if(this.write(new Uint8Array([0x12, (continuous << 2) | this.#rumbling, mode]), "setDataReportingMode")) {
            this.#reportingMode = mode;
        }
    }

    toggleRumble() {
        this.#rumbling = !this.#rumbling;
        const buffer = new Uint8Array([0x10, this.#rumbling]);
        //this.#errorCheck(hid_write(this.handle, buffer), "set rumble");
        this.write(buffer, "toggleRumble");
    }

    //wow this code worked first try
    setLED(index, value) {
        let flags = this.status.leds[3] << 7 | this.status.leds[2] << 6 | this.status.leds[1] << 5 | this.status.leds[0] << 4;
        if(value) {
            flags |= 1 << (index+4);
        }else {
            const temp = 0xff ^ (1 << (index+4));
            flags &= temp;
        }
        if(this.write(new Uint8Array([0x11, flags | this.#rumbling]), "setLED")) {
            this.status.leds[index] = value;
        }
    }

    setLEDs(value) {
        if(this.write(new Uint8Array([0x11, value | this.#rumbling]), "setLEDs")) {
            this.status.leds = [(value >> 4) & 1, (value >> 5) & 1, (value >> 6) & 1, (value >> 7) & 1];
        }
    }

    //the default parameters specify 8-bit PCM at 1500Hz (which means you could send 20 bytes of audio every 13.333 milliseconds)
    //see the math here: https://www.desmos.com/calculator/85qverswwb
    /*async*/ enableSpeaker(format = PCM, sampleRate = 0x1f40, volume = 0x40) {
        //for some reason you gotta do a decent amount to enable the speaker
        print(format, sampleRate, volume);
        this.write(new Uint8Array([0x14, 0x04 | this.#rumbling]), "enableSpeaker"); //actually enables the speaker
        this.write(new Uint8Array([0x19, 0x04 | this.#rumbling]), "enableSpeaker (mute)"); //mutes the speaker
        print("first write memory");
        /*await*/ this.writeMemorySync(0x04, 0xa20009, 0x01, [0x01]); //writes 0x01 to register 0xa20009
        print("second write memory");
        /*await*/ this.writeMemorySync(0x04, 0xa20001, 0x01, [0x08]); //writes 0x08 to register 0xa20001
        const speakerConfig = [0x00, format, sampleRate & 0xff, sampleRate >> 8, volume, 0x00, 0x00];
        print(speakerConfig);
        //wiimote.writeMemorySync(0x04, 0xa20001, 0x07, [0x00, 0x40, 0x40, 0x1f, 0x40, 0x00, 0x00]);
        print("third writeMemory");
        /*await*/ this.writeMemorySync(0x04, 0xa20001, 0x07, speakerConfig); //writes the 7-byte speaker configuration to registers 0xa20001-0xa20008
        print("fourth write memory");
        /*await*/ this.writeMemorySync(0x04, 0xa20008, 0x01, [0x01]); //writes 0x01 to register 0xa20008
        this.write(new Uint8Array([0x19, 0x00 | this.#rumbling]), "enableSpeaker (unmute)"); //unmutes the speaker

        this.requestStatus(print); //genius level java type shi
    }

    //the default parameters specify 8-bit PCM at 1500Hz (which means you could send 20 bytes of audio every 13.333 milliseconds)
    //see the math here: https://www.desmos.com/calculator/85qverswwb
    //use this function to specify the sample rate in hertz instead of the weird math you'd have to do manually
    enableSpeakerInHz(format = PCM, sampleRateHz = 1500, volume = 0x40) {
        let sampleRate;
        if(format == PCM) {
            sampleRate = 12000000 / sampleRateHz;
        }else if(format == ADPCM) {
            sampleRate = 6000000 / sampleRateHz;
        }
        this.enableSpeaker(format, sampleRate, volume);
    }

    //use one of the IR_SENSITIVITY consts my boy
    enableIR(sensitivityArr, mode) {
        if(mode == IR_MODE_BASIC) { //10 bytes required
            this.setDataReportingMode(false, 0x36);
        }else if(mode == IR_MODE_EXTENDED) { //12 bytes required
            this.setDataReportingMode(false, 0x33);
        }else if(mode == IR_MODE_FULL) { //36 (18) bytes required
            this.setDataReportingMode(false, 0x3e);
        }
        this.write(new Uint8Array([0x13, 0b110 | this.#rumbling]), "enabling ir camera (1)");
        let report = this.waitForReport(0x22);
        this.onData(report);
        if(report[4] != 0) {
            return;
        }
        this.write(new Uint8Array([0x1a, 0b110 | this.#rumbling]), "enabling ir camera (2)");
        report = this.waitForReport(0x22);
        this.onData(report);
        if(report[4] != 0) {
            return;
        }
        // this.writeMemorySync(0x04, 0xb00000, 9, sensitivityArr.reduce((a,b,i)=>i<9?(a.push(b),a):a,[])); //although this code looks like ass it does get the job done (of course we're supposed to be writing dumb code so i won't use it)
        let value;
        if(Math.random() > .5) {
            value = 0x01;
            print("doing wiimote init method")
        }else {
            value = 0x08;
            print("doing wiki method");
        }
        //                   0x04 since this is the ir camera's register or whatever
        this.writeMemorySync(0x04, 0xb00030, 1, [value]);
        this.writeMemorySync(0x04, 0xb00000, 9, sensitivityArr.slice(0, 9)); //writing to sensitivity block 1 (9 bytes)
        this.writeMemorySync(0x04, 0xb0001a, 2, sensitivityArr.slice(9)); //writing to sensitivity block 2 (2 bytes);
        this.writeMemorySync(0x04, 0xb00033, 1, [mode]);
        this.writeMemorySync(0x04, 0xb00030, 1, [0x08]);
        this.requestStatus(print);
        this.IR = {mode};
    }

    disableIR() {
        this.write(new Uint8Array([0x13, this.#rumbling]), "disabling ir camera (1)");
        this.write(new Uint8Array([0x1a, this.#rumbling]), "disabling ir camera (2)");
        this.requestStatus(print);
        this.IR = undefined;
    }

    playSoundData(data) {
        if(!this.status.speaker) {
            printNoHighlight("the speaker hasn't been enabled yet but we'll try anyways");
        }
        this.write(new Uint8Array([0x18, (data.length << 3) | this.#rumbling, ...data]), "playSoundData");
    }

    //callback param signature is Function(success : boolean, data : Array<Number>) : void
    readMemory(addressSpace, offset, size, callback) {
        this.#readMemoryListeners.push({callback: callback, data: [], size});
        //this.write(new Uint8Array([0x17, addressSpace & this.#rumbling, offset & 0xff, (offset & 0xff00) >> 8, (offset & 0xff0000) >> 16, size & 0xff, (size & 0xff00) >> 8]), "readMemory");
        //oops i think i was writing the values backwards!
        this.write(new Uint8Array([0x17, addressSpace | this.#rumbling, (offset & 0xff0000) >> 16, (offset & 0xff00) >> 8, offset & 0xff, size >> 8, size & 0xff]), "readMemory");
    }

    //returns data (if success) or undefined (if not)
    readMemorySync(addressSpace, offset, size) {
        this.write(new Uint8Array([0x17, addressSpace | this.#rumbling, (offset & 0xff0000) >> 16, (offset & 0xff00) >> 8, offset & 0xff, size >> 8, size & 0xff]), "readMemory");
        let data = [];
        this.waitForReportWithPredicate(0x21, (raw) => {
            //print(raw, raw[3] >> 4, "FACK");
            const byteLength = (raw[3] >> 4) + 1;           //it seems like when there's an error byteLength just defaults to 16?
            //making sure we're reading the correct response by checking the two offset bytes at raw[4] and raw[5] (unfortunately it doesn't include the most significant byte (and also changes by 16 if you request more than 16 bytes))
            print((raw[4] << 8 | raw[5]), offset & 0xffff);
            if((raw[4] << 8 | raw[5]) == (offset & 0xffff)) {
                //print(raw, raw[3] >> 4, (raw[4] << 8 | raw[5]));
                if(raw[3] & 0b1111 != 0) { //if the error bits are set then return undefined
                    const console = GetStdHandle(STD_OUTPUT_HANDLE);
                    SetConsoleTextAttribute(console, 4);
                    printNoHighlight("readMemorySync failed with error code", raw[3]&0b1111);
                    SetConsoleTextAttribute(console, 7);
                    data = undefined;
                    return true; //return true from the predicate callback will stop the loop and return control
                }
                for(let i = 0; i < byteLength; i++) {
                    data.push(raw[i+6]);
                }
                size -= byteLength;
                offset += byteLength;
                if(size == 0) {
                    return true; //return true from the predicate callback will stop the loop and return control
                }

                return false; //return false to continue the loop but stop the wiimote from handling the report (because we've already done that ourselves here)
            }

            //returning undefined will continue the loop and let the wiimote handle the report
        });
        return data;
    }

    //waits until the wiimote acknowledges our write memory report
    writeMemorySync(addressSpace, offset, size, byteArray) { //yeah something weird was happening when i was trying to enable the speaker and i think it's because you have to wait for the wiimote's response
        //return new Promise((resolve, reject) => {
            //this.#writeMemoryListeners.push({resolve, reject});
            this.write(new Uint8Array([0x16, addressSpace | this.#rumbling, (offset & 0xff0000) >> 16, (offset & 0xff00) >> 8, offset & 0xff, size & 0xff, ...byteArray]), "writeMemory");
            const raw = this.waitForReport(0x22);
            if(raw[4] != 0) {
                print("writeMemory output report failed!",raw[4]);
                //reject(raw[4]);
            }else {
                print("writeMemory output report successfully received!");
                //resolve();
            }
        //});
    }

    #errorCheck(code, action) {
        if(code == -1) {
            printNoHighlight(`${action} failed! (${hid_error(this.handle)})`);
            return false;
        }
        return true;
    }
}

const wiimote = new hid_wiimote(handle);

let taps = 0;
wiimote.addEventListener("onSpecificButtonDown", A_BUTTON, () => {
    if(!wiimote.status.IRcamera) {
        taps = (taps + 1) % 0b1111;
        wiimote.setLEDs(taps << 4);
    }
});

wiimote.addEventListener("onSpecificButtonDown", B_BUTTON, () => {
    if(!wiimote.status.IRcamera) {
        wiimote.toggleRumble();
    }else {
        SendInput(MakeMouseInput(0,0,0,MOUSEEVENTF_LEFTDOWN));
    }
});

wiimote.addEventListener("onSpecificButtonUp", B_BUTTON, () => {
    if(wiimote.status.IRcamera) {
        SendInput(MakeMouseInput(0,0,0,MOUSEEVENTF_LEFTUP));
    }
});

wiimote.addEventListener("onSpecificButtonDown", HOME_BUTTON, () => {
    SetForegroundWindow(GetConsoleWindow());
    try {
        print(eval(getline("Ctrl+E -> Eval some code: ")));
    }catch(e) {
        print(e.toString());
    }
});

wiimote.addEventListener("onSpecificButtonDown", PLUS_BUTTON, () => {
    wiimote.requestStatus(print);
});

wiimote.addEventListener("onExtensionChange", undefined, (hasExtension, previousExtensionId) => {
    print("prevExtension:", previousExtensionId, "curExtension:", wiimote.currentExtensionId);
    if(hasExtension) {
        SetForegroundWindow(GetConsoleWindow());
        if(getline("An extension was connected. Change reporting mode to 0x34? (16 extension bytes) [Y/N] -> ").toLowerCase()[0] == "y") {
            wiimote.setDataReportingMode(false, 0x34);
        }
    }else {
        printNoHighlight("An extension was disconnected!");
    }
});

//lel almost like wiimoteshit.js and WUSBMote for osu!mania.js
const guitarButtonToKey = {
    green:  'A'.charCodeAt(0),
    red:    'S'.charCodeAt(0),
    yellow: 'F'.charCodeAt(0),
    blue:   'G'.charCodeAt(0),
    orange: 'H'.charCodeAt(0),
    down:   VK_DOWN,
    up:     VK_UP,
    pedal:  'I'.charCodeAt(0),
    plus:   VK_RETURN,
    minus:  VK_LMENU,
};

wiimote.addEventListener("onExtensionButtonDown", undefined, (id, extension, buttonName) => {
    if(id == EXTENSION_NUNCHUK) {
        if(buttonName == "c") {
            //SendInput(MakeMouseInput(0,0,0,MOUSEEVENTF_LEFTDOWN));
        }else if(buttonName == "z") {
            //SendInput(MakeMouseInput(0,0,0,MOUSEEVENTF_RIGHTDOWN));
        }
    }else if(id == EXTENSION_GUITAR) {
        if(buttonName == "minus") {
            printNoHighlight("starpower!");
        }else {
            printNoHighlight(buttonName + " DOWN");
        }
        SendInput(MakeKeyboardInput(guitarButtonToKey[buttonName], false));
    }else if(id == EXTENSION_MOTIONPLUS_PASSTHROUGH_NUNCHUK) {
        printNoHighlight(buttonName);
    }
});

wiimote.addEventListener("onMotionPlusExtensionChange", undefined, (lastExtensionStatus) => {
    if(lastExtensionStatus) { //if the last extension status was 1, then something was disconnected
        printNoHighlight("something was disconnected from the motion plus extension");
    }else {
        printNoHighlight("something was connected to the motion plus extension!");
    }
});

wiimote.addEventListener("onExtensionButtonUp", undefined, (id, extension, buttonName) => {
    if(id == EXTENSION_NUNCHUK) {
        if(buttonName == "c") {
            //SendInput(MakeMouseInput(0,0,0,MOUSEEVENTF_LEFTUP));
        }else if(buttonName == "z") {
            //SendInput(MakeMouseInput(0,0,0,MOUSEEVENTF_RIGHTUP));
        }
    }else if(id == EXTENSION_GUITAR) {
        printNoHighlight(buttonName + " UP");
        SendInput(MakeKeyboardInput(guitarButtonToKey[buttonName], true));
    }else if(id == EXTENSION_MOTIONPLUS_PASSTHROUGH_NUNCHUK) {
        printNoHighlight(buttonName);
    }
});

wiimote.addEventListener("onButtonDown", undefined, (button) => {
    if(button == ONE_BUTTON) {
        //SendInput(MakeKeyboardInput('1'.charCodeAt(0), false));
        keybd_event('1'.charCodeAt(0), NULL);
    }else if(button == TWO_BUTTON) {
        SendInput(MakeKeyboardInput('2'.charCodeAt(0), false));
    }
});

wiimote.addEventListener("onButtonUp", undefined, (button) => {
    if(button == ONE_BUTTON) {
        //SendInput(MakeKeyboardInput('1'.charCodeAt(0), true));
        keybd_event('1'.charCodeAt(0), KEYEVENTF_KEYUP);
    }else if(button == TWO_BUTTON) {
        SendInput(MakeKeyboardInput('2'.charCodeAt(0), true));
    }
});

wiimote.addEventListener("onGuitarTouchBarChange", undefined, (touchbar) => {
    print(touchbar);
});

wiimote.addEventListener("onIRdata", undefined, (ir) => {
    if(ir.dots[0]) {
        //this is an extremely basic way of moving the mouse to the wiimote lol i don't have my sensor bar turned on so i'm using a light instead
        //the range of each dot is 0 - 1023 on the x axis and 0 - 767 on the y axis so we'll scale the value to our screen's width and height
        //for some reason the x was flipped for me so i just do a little of that
        SendInput(MakeMouseInput(((1023 - ir.dots[0].x)/1023)*screenWidth, (ir.dots[0].y/767)*screenHeight, 0, MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_MOVE));
        //mouse_event(MOUSEEVENTF_ABSOLUTE, , , 0);
    }
});

let x = 0;

//without poll
while(true) {
    const raw = hid_read_timeout(handle, 13.3333);
    if(raw) {
        wiimote.onData(raw);
        //print("A:", wiimote.a);
        //print("B:", wiimote.b);
        //print("Up:", wiimote.up);
        //print("Down:", wiimote.down);
        //print("Left:", wiimote.left);
        //print("Right:", wiimote.right);
        //print("minus:", wiimote.minus);
        //print("plus:", wiimote.plus);
        //print("home:", wiimote.home);
        //print("one:", wiimote.one);
        //print("two:", wiimote.two);
        print("Data read: ");
        let str = "";
        for(let i = 0; i < raw.length; i++) {
            str += `0x${raw[i].toString(16)} `;
        }
        print(str);
    }
    if(GetKey(VK_SHIFT)) {
        //play music!
        if(wiimote.status.speaker) {
            //https://www.desmos.com/calculator/yt38a1reef
            const sampleRate = 1500;
            const bytesPerMillisecond = sampleRate/1000;
            const amplitude = 127;
            const freq = 523.25;
        
            //while(GetKey(VK_SHIFT)) {
                const data = [];
                for(let i = 0; i < 20; i++) {
                    x += bytesPerMillisecond/1000;
                    // const wav = Math.floor(amplitude * Math.sin(2*Math.PI*x*freq) * );
                    let wav = amplitude * Math.sin(2*Math.PI*x*freq);
                    if(wav < 0) {
                        wav = 255+wav;
                    }
                    data[i] = Math.floor(wav);
                }
                //print(data);
                wiimote.playSoundData(data);
                //print("SOUNDING");
                //Sleep(13.33333);
            //}
        }
    }else if(GetKeyDown(VK_DELETE)) {
        wiimote.setDataReportingMode(false, 0x30);
    }
}

//with poll
/*
while(true) {
    const raw = wiimote.poll(13.3333);
    if(raw) {
        print("Data read: ");
        let str = "";
        for(let i = 0; i < raw.length; i++) {
            str += `0x${raw[i].toString(16)} `;
        }
        print(str);
    }
    if(GetKey(VK_SHIFT)) {
        //play music!
        if(wiimote.status.speaker) {
            //https://www.desmos.com/calculator/yt38a1reef
            const sampleRate = 1500;
            const bytesPerMillisecond = sampleRate/1000;
            const amplitude = 127;
            const freq = 523.25;
        
            //while(GetKey(VK_SHIFT)) {
                const data = [];
                for(let i = 0; i < 20; i++) {
                    x += bytesPerMillisecond/1000;
                    // const wav = Math.floor(amplitude * Math.sin(2*Math.PI*x*freq) * );
                    let wav = amplitude * Math.sin(2*Math.PI*x*freq);
                    if(wav < 0) {
                        wav = 255+wav;
                    }
                    data[i] = Math.floor(wav);
                }
                //print(data);
                wiimote.playSoundData(data);
                //print("SOUNDING");
                //Sleep(13.33333);
            //}
        }
    }else if(GetKeyDown(VK_DELETE)) {
        wiimote.setDataReportingMode(false, 0x30);
    }
}
*/

hid_exit();

//const winclass = CreateWindowClass("WinClass"/*, init*/, windowProc); //loop is not required y'all
//winclass.hIcon = winclass.hIconSm = LoadIcon(NULL, IDI_APPLICATION);
//winclass.hbrBackground = COLOR_BACKGROUND;
//winclass.hCursor = LoadCursor(NULL, IDC_ARROW);
//
//CreateWindow(WS_EX_OVERLAPPEDWINDOW, winclass, "wii testing", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 400+20, 400+42, NULL, NULL, hInstance);