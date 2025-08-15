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

let x = 0;

let start = Date.now();

const sampleRate = 2000+125; //? (for some reason when i put it at 2000 it was slightly too slow)
const bytesPerMillisecond = sampleRate/1000;
const bytes = 20;
//let amplitude = 127;
//let freq = 440;//523.25;
//
//let magic = 2;
//let milli = 1000;

//const raw = require("fs").readBinary(__dirname+"/Can You Hear The Music.raw");
// const raw = require("fs").readBinary(__dirname+"/tv_world (2000hz).raw");
// const raw = require("fs").readBinary("C:/Users/megal/Documents/Audacity/dirt rhodes jarvis9999 remix (2000hz).raw");
// const raw = require("fs").readBinary("C:/Users/megal/Documents/Audacity/Can You Hear The Music Full (2000hz).raw");
const raw = require("fs").readBinary("C:/Users/megal/Documents/Audacity/Travis Scott - 4X4 (Official Audio 2000hz).raw");
// const raw = require("fs").readBinary("C:/Users/megal/Documents/Audacity/Red Hot Champion.raw");

print(raw[0]);

while(true) { //busy wait to get the timing as best i can
    //if(wiimote.status.speaker) {
        //https://www.desmos.com/calculator/yt38a1reef
        if(Date.now() - start > bytes/(bytesPerMillisecond)) {
            start = Date.now();
        //while(GetKey(VK_SHIFT)) {
            //const data = [];
            //for(let i = 0; i < bytes; i++) {
            //    x += bytesPerMillisecond/milli;
            //    //x += freq/milli;
            //    //x = ((Date.now() - start)/1000) % 1;
            //    // const wav = Math.floor(amplitude * Math.sin(2*Math.PI*x*freq) * );
            //    let wav = amplitude * Math.sin(magic*Math.PI*x*freq);
            //    if(wav < 0) {
            //        wav = 255+wav;
            //    }
            //    //print(wav);
            //    data[i] = Math.floor(wav);
            //}

            const data = [];
            for(let i = 0; i < bytes; i++) {
                data[i] = raw[x];
                x++;
            }

            //https://www.desmos.com/calculator/25azqgr0k3

            //print(data);
            //wiimote.playSoundData(data);
            if(hid_write(handle, new Uint8Array([0x18, data.length << 3, ...data])) == -1) {
                printNoHighlight(`${action} failed! (${hid_error(this.handle)})`);
            }

            if(GetKey(VK_CONTROL) && GetKeyDown('E')) {
                SetForegroundWindow(GetConsoleWindow());
                try {
                    print(eval(getline("Ctrl+E -> Eval some code: ")));
                }catch(e) {
                    print(e.toString());
                }
            }

            //sending a single byte (bad idea)
            //const data = [];
            //x = ((Date.now() - start)/1000) % 1;
            //let wav = amplitude * Math.sin(2*Math.PI*x*freq);
            //if(wav < 0) {
            //    wav = 255+wav;
            //}
            ////print(wav);
            //data[0] = Math.floor(wav);
//
            //if(hid_write(handle, new Uint8Array([0x18, data.length << 3, ...data])) == -1) {
            //    printNoHighlight(`${action} failed! (${hid_error(this.handle)})`);
            //}

            //print("SOUNDING");
            //Sleep(13.33333);
        //}
    //}
            //if(GetKey(VK_DOWN)) {
            //    freq -= 1;
            //    print(freq);
            //}else if(GetKey(VK_UP)) {
            //    freq += 1;
            //    print(freq);
            //}
        }
    //Sleep(bytes/(bytesPerMillisecond));
}