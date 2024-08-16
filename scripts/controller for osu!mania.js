let lastKeycode = 0;
let keycodes = {LEFT_SHOULDER: XINPUT_GAMEPAD_LEFT_SHOULDER, RIGHT_SHOULDER: XINPUT_GAMEPAD_RIGHT_SHOULDER, START: XINPUT_GAMEPAD_START, X: XINPUT_GAMEPAD_X, Y: XINPUT_GAMEPAD_Y, A: XINPUT_GAMEPAD_A, B: XINPUT_GAMEPAD_B};//{DPAD_LEFT: XINPUT_GAMEPAD_DPAD_LEFT, DPAD_RIGHT: XINPUT_GAMEPAD_DPAD_RIGHT, X: XINPUT_GAMEPAD_X, B: XINPUT_GAMEPAD_B};
let triggers = {LEFT_TRIGGER: 0, RIGHT_TRIGGER: 0};

let bools = {};
for(let key of Object.keys(keycodes)) bools[key] = false;

//4 key            not sure why but i feel like left trigger and left shoulder should be swapped?
let keys = {LEFT_SHOULDER: "S", LEFT_TRIGGER: "A", RIGHT_SHOULDER: "F", RIGHT_TRIGGER: "G", START: VK_ESCAPE}; //controller buttons -> keyboard keys

//5 key                                                         yeah
//let keys = {LEFT_SHOULDER: "S", LEFT_TRIGGER: "A", X: "F", Y: "F", A: "F", B: "F", RIGHT_SHOULDER: "G", RIGHT_TRIGGER: "H", START: VK_ESCAPE}; //controller buttons -> keyboard keys

function checkBit(bit, mask) {
    return ((bit & mask) == mask);
}

let buttons = undefined;
const controllers = GetControllers();
if(controllers[0] != undefined) { //using the first controller available
    buttons = XInputGetState(controllers[0]).Gamepad.wButtons;
}
print((buttons == undefined) ? "Unable to find any connected controllers" : `Controller ${controllers[0]}: `);

while(true) {
    let gamepad = undefined;
    const controllers = GetControllers();
    if(controllers[0] != undefined) { //using the first controller available
        gamepad = XInputGetState(controllers[0]).Gamepad;
        triggers = {LEFT_TRIGGER: gamepad.bLeftTrigger, RIGHT_TRIGGER: gamepad.bRightTrigger};
    }else {
        print("No controllers found");
        print(MessageBeep(MB_ICONERROR));
        quit;
    }
    
    //snatched from WUSBMote for osu!mania.js
    for(const key in keycodes) {
        const code = keycodes[key];
        if(checkBit(gamepad.wButtons, code)) {
            //print("hit "+key);
            if(!bools[key]) {
                print("first hit "+key);
                keybd_event(keys[key], NULL);
            }
            bools[key] = true;
        }else {
            if(checkBit(lastKeycode, code)) { //why did i do this instead of checking bools? idk i guess this is just another way of doing it
                bools[key] = false;
                keybd_event(keys[key], KEYEVENTF_KEYUP);
                print("released "+key);
            }
        }
    }

    //unfortunately the triggers are handled differently    

    for(let trigger in triggers) {
        let value = triggers[trigger]; //the trigger's range is from 0-255
        if(value > 8) { //just incase yo shit sticky or sumnb
            if(!bools[trigger]) {
                print("first hit "+trigger);
                keybd_event(keys[trigger], NULL);
            }
            bools[trigger] = true;
        }else {
            if(bools[trigger]) {
                keybd_event(keys[trigger], KEYEVENTF_KEYUP);
                print("released "+trigger);
            }
            bools[trigger] = false;
        }
        //bools[i] = ; //yeah using i is weird here but there's no problem with it lo!
    }

    lastKeycode = gamepad.wButtons;
}