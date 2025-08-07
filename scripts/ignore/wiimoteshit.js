//don't expect this to work for you because i'm using a real wiimote connected to my computer with bluetooth (and with a little bit of help from Dolphin)

//wait wtf i forgot to call hid_init!
print("Init: " + hid_init());

let wiimote;

hid_enumerate(0x0, 0x0, (device) => {
    print(device.product_string);
    if(device.manufacturer_string.includes("Nintendo")) {
        wiimote = device;
    }
});

let handle = hid_get_handle_from_info(wiimote);

let lastKeycode = 0;
let keycodes = {A: 0x80000, B: 0x40000, DPAD_UP: 0x800, DPAD_DOWN: 0x400, DPAD_LEFT: 0x100, DPAD_RIGHT: 0x200, "1": 0x20000, "2": 0x10000};

let bools = {};
for(let key of Object.keys(keycodes)) bools[key] = false;

let keys = {A: VK_MEDIA_PLAY_PAUSE, B: VK_LBUTTON, DPAD_UP: VK_UP, DPAD_DOWN: VK_DOWN, DPAD_LEFT: VK_LEFT, DPAD_RIGHT: VK_RIGHT, "1": /*VK_SPACE*/"Z", "2": "X"};

function checkBit(bit, mask) {
    return ((bit & mask) == mask)
}

while(true) {
    let result = hid_read(handle); //welp since i changed hid_read to return a Uint8Array instead, we'll just do the ole' transfer trick
    if(result == 0) {
        print("waiting");
    }else if(result < 0) {
        print("Unable to read: ", hid_error(handle));
    }else {
        //back in the day hid_read returned a Uint32Array on success so we'll just "convert" it back here
        //result = new Uint32Array(result.buffer.transfer());
        //uh wait a minute i was doing some genuine bullshit to make hid_read spit out a Uint32Array...
        //we'll just turn the first 4 bytes into a 32 bit value so i can read it (instead of using result[-])
        const dword = result[3] << 24 | result[2] << 16 | result[1] << 8 | result[0];
        print(dword);
        for(const key in keycodes) {
            const code = keycodes[key];
            //if(checkBit(result[0], code)) {
            if(checkBit(dword, code)) {
                //print("hit "+key);
                if(!bools[key]) {
                    print("first hit "+key);
                    //if(keys[key] != VK_LBUTTON) {
                        SendInput(MakeKeyboardInput(keys[key], false)); //sendinput AND keybd_event don't work on roblox but apparently in AutoHotKey there's a ControlSend function that works (so i need to investigate that (even though i think i did a pretty long while ago)) https://www.reddit.com/r/AutoHotkey/comments/p72g7h/tutorial_how_to_use_autohotkey_in_roblox_how_to/
                    //}else {
                        //SendInput(MakeMouseInput(0,0,0,MOUSEEVENTF_LEFTDOWN));
                    //    SendInput(MakeMouseInput(0,0,0,MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_ABSOLUTE)); //wtf this keeps putting me back to my lock screen and disconnecting me from the call in discord?
                    //}
                    //keybd_event(keys[key], NULL);
                }
                bools[key] = true;
            }else {
                if(checkBit(lastKeycode, code)) {
                    bools[key] = false;
                    //keybd_event(keys[key], KEYEVENTF_KEYUP);
                    //if(keys[key] != VK_LBUTTON) {
                        SendInput(MakeKeyboardInput(keys[key], true)); //sendinput AND keybd_event don't work on roblox but apparently in AutoHotKey there's a ControlSend function that works (so i need to investigate that (even though i think i did a pretty long while ago)) https://www.reddit.com/r/AutoHotkey/comments/p72g7h/tutorial_how_to_use_autohotkey_in_roblox_how_to/
                    //}else {
                    //    SendInput(MakeMouseInput(0,0,0,MOUSEEVENTF_LEFTUP));
                    //}
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

        lastKeycode = dword; //result[0];
    }
}