Msgbox("im not gonna lie this one will only work if you have a wii guitar plugged into the computer with a raphnet adapter (WUSBMote v2.2)", "sorry bruh", MB_OK | MB_SYSTEMMODAL);

print("Init: " + hid_init());

let wiimotes = [];

hid_enumerate(0x0, 0x0, (device) => {
    //print(device);
    //if(device.product_string.includes("WUSBMote") || device.manufacturer_string.includes("raphnet")) {
    print(device.product_string);
    if(device.product_string.includes("WUSBMote")) {
        //wiimote = device;
        wiimotes.push(device);
    }
});

print(wiimotes);
//print(wiimote.serial_number == "(null)" ? NULL : wiimote.serial_number);
//print(0x046d, 0x0a66, wiimote.vendor_id, wiimote.product_id);
//let handle = hid_open(wiimote.vendor_id, wiimote.product_id, NULL); //serial number is option (and keeps not working anyways) //wiimote.serial_number == "(null)" ? NULL : wiimote.serial_number);
//let handle = hid_open(0x046d, 0x0a66, NULL);
//print(handle);
if(wiimotes.length == 0) {
    Msgbox("found NO wiimote guitars bruh", "JBS3 WILL CRASH AFTER THIS MESSAGE (HELP!)", MB_ICONERROR);
}
let handle = hid_get_handle_from_info(wiimotes[wiimotes.findIndex(mote => mote.usage>1)]);//wiimotes[1].handle;
if(!handle) {
    Msgbox("no handle kys", handle, MB_OK | MB_SYSTEMMODAL);
    quit; //cheeky reference error because an Illegal Return Statement is an immediate error
}
//print("0x"+wiimote.vendor_id.toString(16), "0x"+wiimote.product_id.toString(16));
print(handle, "handle");
let manufacturer = hid_get_manufacturer_string(handle);
if(manufacturer < 0) {
    print("Unable to read manufacturer string");
}else {
    print("Manufacturer String: " + manufacturer);
}
let product = hid_get_product_string(handle);
if(product < 0) {
    print("Unable to read product string");
}else {
    print("Product String: " + product);
}
let serial = parseInt(hid_get_serial_number_string(handle));
if(serial < 0) {
    print("Unable to read serial number string");
}else {
    print(`Serial Number String: (0x${serial.toString(16)}) ${serial}`);
}

for(let i = 0; i < 255; i++) {
    let indexed = hid_get_indexed_string(handle, i);
    if(indexed < 0) {
        print("Unable to read indexed string "+i, hid_error(handle));
        break;
    }else {
        if(indexed == " ") {
            break;
        }
        print(`Indexed String ${i}: ${indexed}`);
    }
}

//let buf = new Uint32Array([0x2, 0xa0, 0x0a, 0x00, 0x00]);
let buf = new Uint32Array(HID_BUFFER_SIZE);
buf[0] = 0x2;
buf[1] = 0xa0;
buf[2] = 0x0a;
buf[3] = 0x00;
buf[4] = 0x00;

let feature_report = hid_send_feature_report(handle, buf, 17);

if(feature_report < 0) {
    print("Unable to send a feature report.", hid_error(handle));
}

buf = new Uint32Array(HID_BUFFER_SIZE);
buf[0] = 0x2;

feature_report = hid_get_feature_report(handle, buf);

if(feature_report < 0) {
    print("Unable to get a feature report.");
    print(hid_error(handle));
}else {
    print("Feature Report");
    let str = "";
    for(let i = 0; i < feature_report.length; i++) {
        str += `0x${feature_report[i].toString(16)} `;
    }
    print(str);
}

buf = new Uint32Array(HID_BUFFER_SIZE);
buf[0] = 0x1;
buf[1] = 0x80;
// Toggle LED (cmd 0x80). The first byte is the report number (0x1).
let res = hid_write(handle, buf, 17);
if(res < 0) {
    print("Unable to write() (toggle LED)", hid_error(handle));
}

buf = new Uint32Array(HID_BUFFER_SIZE);
buf[0] = 0x1;
buf[1] = 0x81;
// Request state (cmd 0x81). The first byte is the report number (0x1).
res = hid_write(handle, buf, 17);
if (res < 0)
    print("Unable to write() (request state)", hid_error(handle));

res = 0;

//const VOLUME_UP = 0x100;
//const VOLUME_DOWN = 0x200;

//hid_set_nonblocking(handle, 1);

//const GREEN = 0x10;
//const RED = 0x20;
//const YELLOW = 0x40;
//const BLUE = 0x80;
//const ORANGE = 0x100;

let lastKeycode = 0;
let keycodes = {GREEN: 0x100, RED: 0x200, YELLOW: 0x400, BLUE: 0x800, ORANGE: 0x1000, START: 0x4000, STRUM_UP: 0x2000, STRUM_DOWN: 0x10000, STARPOWER: 0x8000};

let bools = {};
for(let key of Object.keys(keycodes)) bools[key] = false;

let keys = {GREEN: "A", RED: "S", YELLOW: "F", BLUE: "G", ORANGE: "H", START: VK_ESCAPE, STRUM_UP: VK_UP, STRUM_DOWN: VK_DOWN, STARPOWER: VK_RETURN};
//i need to add strumming
//let keys = {GREEN: "S", RED: "D", YELLOW: "F", BLUE: "J", ORANGE: "K", START: VK_ESCAPE, STRUM_UP: VK_UP, STRUM_DOWN: VK_DOWN, STARPOWER: "L"};

function checkBit(bit, mask) {
    return ((bit & mask) == mask)
}

while(true) {//!GetKey(VK_ESCAPE)) {
    let result = hid_read(handle);//, buf, HID_BUFFER_SIZE); //returns 0 or 1 if no read and returns an uint32array
    if(result == 0) {
        print("waiting");
    }else if(result < 0) {
        print("Unable to read: ", hid_error(handle));
    }else {
        //if((result[0] & VOLUME_UP) == VOLUME_UP) {
        //    print("volume up!");
        //}else if((result[0] & VOLUME_DOWN) == VOLUME_DOWN) {
        //    print("volume down!");
        //}else {
        for(const key in keycodes) {
            const code = keycodes[key];
            if(checkBit(result[3], code)) {
                //print("hit "+key);
                if(!bools[key]) {
                    print("first hit "+key);
                    keybd_event(keys[key], NULL);
                }
                bools[key] = true;
            }else {
                if(checkBit(lastKeycode, code)) {
                    bools[key] = false;
                    keybd_event(keys[key], KEYEVENTF_KEYUP);
                    print("released "+key);
                }
            }
        }
        //print(result[3] & 0x100, "0x"+result[3].toString(16));
        //print("0x"+result[3].toString(16));
            print("Data read: ");
            let str = "";
            for(let i = 0; i < result.length; i++) {
                str += `0x${result[i].toString(16)} `;
            }
            print(str);
        //}
        lastKeycode = result[3];
    }
}

hid_close(handle);

print("Exit: " + hid_exit());