//extraordinary resource on wiimote hid reports: https://wiibrew.org/wiki/Wiimote
//my hid knowledge has expanded since the last time i used the hidapi (because i wrote that driver lol)

//now we gotta "import" le hid_wiimote class! (just like good ole marshallib!)
eval(require("fs").read(__dirname+"/hid_wiimote.js"));

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

const wiimote = new hid_wiimote(handle);

let taps = 0;
wiimote.addEventListener("onSpecificButtonDown", A_BUTTON, () => {
    if(!wiimote.status.IRcamera) {
        taps = (taps + 1) % 0b1111;
        wiimote.setLEDs(taps);
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