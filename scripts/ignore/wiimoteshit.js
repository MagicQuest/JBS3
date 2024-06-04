//don't expect this to work for you because i'm using a real wiimote connected to my computer with bluetooth (and with a little bit of help from Dolphin)

let wiimote;

hid_enumerate(0x0, 0x0, (device) => {
    print(device.product_string);
    if(device.manufacturer_string.includes("Nintendo")) {
        wiimote = device;
    }
});

let handle = hid_get_handle_from_info(wiimote);

let lastKeycode = 0;
let keycodes = {A: 0x80000, B: 0x40000, DPAD_UP: 0x800, DPAD_DOWN: 0x400, DPAD_LEFT: 0x100, DPAD_RIGHT: 0x200};

let bools = {};
for(let key of Object.keys(keycodes)) bools[key] = false;

let keys = {A: /*VK_MEDIA_PLAY_PAUSE*/VK_SPACE, B: VK_LBUTTON, DPAD_UP: VK_UP, DPAD_DOWN: VK_DOWN, DPAD_LEFT: VK_LEFT, DPAD_RIGHT: VK_RIGHT};

function checkBit(bit, mask) {
    return ((bit & mask) == mask)
}

while(true) {
    let result = hid_read(handle);
    if(result == 0) {
        print("waiting");
    }else if(result < 0) {
        print("Unable to read: ", hid_error(handle));
    }else {
        for(const key in keycodes) {
            const code = keycodes[key];
            if(checkBit(result[0], code)) {
                //print("hit "+key);
                if(!bools[key]) {
                    print("first hit "+key);
                    SendInput(MakeKeyboardInput(keys[key], false)); //sendinput AND keybd_event don't work on roblox but apparently in AutoHotKey there's a ControlSend function that works (so i need to investigate that (even though i think i did a pretty long while ago)) https://www.reddit.com/r/AutoHotkey/comments/p72g7h/tutorial_how_to_use_autohotkey_in_roblox_how_to/
                    //keybd_event(keys[key], NULL);
                }
                bools[key] = true;
            }else {
                if(checkBit(lastKeycode, code)) {
                    bools[key] = false;
                    //keybd_event(keys[key], KEYEVENTF_KEYUP);
                    SendInput(MakeKeyboardInput(keys[key], true));
                    print("released "+key);
                }
            }
        }

        print("Data read: ");
        let str = "";
        for(let i = 0; i < result.length; i++) {
            str += `0x${result[i].toString(16)} `;
        }
        print(str);

        lastKeycode = result[0];
    }
}