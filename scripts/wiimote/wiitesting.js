//extraordinary resource on wiimote hid reports: https://wiibrew.org/wiki/Wiimote
//my hid knowledge has expanded since the last time i used the hidapi (because i wrote that driver lol)

//const dc = GetDC(NULL);

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

class hid_wiimote {
    #rumbling = false;
    #requestingStatus = false;
    #readMemoryListeners = [];
    //#writeMemoryListeners = []; //rip
    buttons = 0; //WORD
    lastButtons = 0; //WORD
    #eventListeners = {};
    #reportingMode = 0x30;
    status = {
        batteryLevel: 0,
        batteryLow: 0,
        extension: 0,
        speaker: 0,
        IRcamera: 0,
        leds: [0, 0, 0, 0]
    };
    currentExtensionId = EXTENSION_NONE;
    extensionBytes = []; //extension bytes returned from input reports
    extension = {
        //[currentExtensionId]: {
            //...
        //}
    }; //parsed properties of the current extension (only one extension id (the current one) will be defined in this object)

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
                this.initializeExtension();
            }else {
                this.readCurrentExtensionFromWiimote();
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
        if((id & 0x30) == 0x30) { //we'll handle all the 0x30 input reports here
            this.#reportingMode = id;
            //if(id == 0x32 || id == 0x34 || id == 0x36 || id == 0x37 || id == 0x3d) { //each of these report ids sends some extension bytes
            const reportInfo = hid_wiimote.inputReportInfo[id];
            if(reportInfo.extensionByteCount != 0 && this.currentExtensionId) {
                const byteCount = reportInfo.extensionByteCount;
                const temp = []; //so i can clear the extensionBytes list (just in case the amount of extension bytes in this report was less than the previous one)
                //the extension bytes are always the last set of bytes
                const pos = reportInfo.buttonByteCount + reportInfo.accelerometerByteCount + reportInfo.IRByteCount + 1; // + 1 because if the report id (i forgot about that part)
                for(let i = 0; i < byteCount; i++) {
                    temp[i] = raw[pos + i];
                }
                this.extensionBytes = temp;
                this.#parseExtensionBytes();
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
                        this.initializeExtension();
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
                    properties.lastTouchBar = properties.touchBar;
                    properties.touchBar = this.extensionBytes[2]; //touch bar (that only exists on GHWT guitars (lucky for me!))
                    if(firstTick) {
                        properties.lastTouchBar = properties.touchBar;
                    }
                    properties.whammyBar = this.extensionBytes[3];
                    properties.lastButtons = properties.buttons; //kinda error prone to taking buttons by reference but i remedy this by setting buttons to a new object created in the next line lol
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
            }

            this.extension[this.currentExtensionId] = properties;

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

    addEventListener(event, extra, callback) {
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

        if(!this.#eventListeners[event]) { //if nobody is listening to this event then we'll just return (otherwise you get a TypeError lol)
            return;
        }
        if(event == "onSpecificButtonDown" || event == "onSpecificButtonUp") {
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
        }else if(event == "onButtonDown" || event == "onButtonUp") {
            this.#fireEvent("onSpecific"+event.substring(2), eventExtra);
            for(const {callback} of this.#eventListeners[event]) {
                //extension status, previous extension id
                callback(eventExtra);
            }
        }else if(event == "onExtensionChange") {
            for(const {callback} of this.#eventListeners[event]) {
                //extension status, previous extension id
                callback(this.status.extension, eventExtra);
            }
        }else if(event == "onExtensionButtonDown" || event == "onExtensionButtonUp") { //no specific version because the extensions are all different
            for(const {callback} of this.#eventListeners[event]) {
                //extension id, extension object,
                callback(this.currentExtensionId, this.extension[this.currentExtensionId], eventExtra);
            }
        }else if(event == "onGuitarTouchBarChange") {
            for(const {callback} of this.#eventListeners[event]) {
                //extension id, extension object,
                callback(this.extension[this.currentExtensionId].touchBar);
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

    initializeExtension() {
        //                                                     i think the (4) means the addressSpace mode
        this.writeMemorySync(0x04, 0xA400F0, 1, [0x55]); //write 0x55 to 0x(4)A400F0
        this.writeMemorySync(0x04, 0xA400FB, 1, [0x00]); //write 0x00 to 0x(4)A400FB
        this.readCurrentExtensionFromWiimote();
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
        this.write(new Uint8Array([0x17, addressSpace | this.#rumbling, (offset & 0xff0000) >> 16, (offset & 0xff00) >> 8, offset & 0xff, size >> 8, size & 0xff]), "readMemory");
        let raw;
        let data = [];
        while(true) {
            raw = hid_read(this.handle);
            if(raw[0] == 0x21) {
                //print(raw, raw[3] >> 4, "FACK");
                const byteLength = (raw[3] >> 4) + 1;           //it seems like when there's an error byteLength just defaults to 16?
                //making sure we're reading the correct response by checking the two offset bytes at raw[4] and raw[5]
                if((raw[4] << 8 | raw[5]) == (offset & 0xffff) && (byteLength == size || raw[3] & 0b1111 != 0)) {
                    //print(raw, raw[3] >> 4, (raw[4] << 8 | raw[5]));
                    for(let i = 0; i < byteLength; i++) {
                        data.push(raw[i+6]);
                    }
                    break;
                }
            }
            this.onData(raw);
        }
        if((raw[3] & 0b1111) == 0) { //no error
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
    }

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

    playSoundData(data) {
        if(!this.status.speaker) {
            printNoHighlight("the speaker hasn't been enabled yet but we'll try anyways");
        }
        this.write(new Uint8Array([0x18, (data.length << 3) | this.#rumbling, ...data]));
    }

    //callback param signature is Function(success : boolean, data : Array<Number>) : void
    readMemory(addressSpace, offset, size, callback) {
        this.#readMemoryListeners.push({callback: callback, data: [], size});
        //this.write(new Uint8Array([0x17, addressSpace & this.#rumbling, offset & 0xff, (offset & 0xff00) >> 8, (offset & 0xff0000) >> 16, size & 0xff, (size & 0xff00) >> 8]), "readMemory");
        //oops i think i was writing the values backwards!
        this.write(new Uint8Array([0x17, addressSpace | this.#rumbling, (offset & 0xff0000) >> 16, (offset & 0xff00) >> 8, offset & 0xff, size >> 8, size & 0xff]), "readMemory");
    }

    waitForReport(reportId) {
        let raw;
        while(true) {
            raw = hid_read(this.handle);
            if(raw[0] == reportId) {
                break;
            }
            this.onData(raw);
        }
        return raw;
    }

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
    taps = (taps + 1) % 0b1111;
    wiimote.setLEDs(taps << 4);
});

wiimote.addEventListener("onSpecificButtonDown", B_BUTTON, () => {
    wiimote.toggleRumble();
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

wiimote.addEventListener("onExtensionButtonDown", undefined, (id, extension, buttonName) => {
    if(id == EXTENSION_NUNCHUK) {
        if(buttonName == "c") {
            SendInput(MakeMouseInput(0,0,0,MOUSEEVENTF_LEFTDOWN));
        }else if(buttonName == "z") {
            SendInput(MakeMouseInput(0,0,0,MOUSEEVENTF_RIGHTDOWN));
        }
    }else if(id == EXTENSION_GUITAR) {
        if(buttonName == "minus") {
            printNoHighlight("starpower!");
        }else {
            printNoHighlight(buttonName + " DOWN");
        }
    }
});

wiimote.addEventListener("onExtensionButtonUp", undefined, (id, extension, buttonName) => {
    if(id == EXTENSION_NUNCHUK) {
        if(buttonName == "c") {
            SendInput(MakeMouseInput(0,0,0,MOUSEEVENTF_LEFTUP));
        }else if(buttonName == "z") {
            SendInput(MakeMouseInput(0,0,0,MOUSEEVENTF_RIGHTUP));
        }
    }else if(id == EXTENSION_GUITAR) {
        printNoHighlight(buttonName + " UP");    
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