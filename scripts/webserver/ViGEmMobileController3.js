//the three in the name don't mean shit lol
eval(require("fs").read(__dirname+"/webserver.js"));
eval(require("fs").read(__dirname+"/../ViGEmBus/ViGEmHelper.js"));

//paths are '/' and '/kbdmouse'

const port = 25565;

Msgbox(`This script will host a server at port ${port} :)`, "ViGEmMobileController3.js", MB_OK | MB_ICONINFORMATION | MB_SYSTEMMODAL);

const CONTROLLER_EVENT_THUMB = 1;
const CONTROLLER_EVENT_BUTTON = 2;
const CONTROLLER_EVENT_NOTIFICATION = 4;
const CONTROLLER_EVENT_TRIGGER = 8;

if(!Server.listen(port)) {
    quit;
}

if(ViGEmBus.init() != VIGEM_ERROR_NONE) {
    Server.cleanup();
    quit;
}

Server.get("/", function(req, res) {
    //return res.sendFile(__dirname+"/VMC3.html"); //TUFFFFFFFFFFFF
    //you don\t have to return anymore lol
    res.sendFile(__dirname+"/VMC3.html"); //TUFFFFFFFFFFFF
});

WebSocketManager.onConnect("/", function(socket) {
    print("hello websocket!",socket.socket);
    let rumbling = false;
    let color = {Red: 0, Green: 0, Blue: 0};
    const controller = ViGEmBus.addController(CONTROLLER_X360); //using ds4 this time because it can do accelerometer stuff (which i haven't added yet...)
    if(!controller.pad) { //if the return value is false or an error code, the "pad" property will be undefined
        quit; //lol
    }
    //controller.register_notification(function(Client, Target, LargeMotor, SmallMotor, LightbarColor) {
    //    let queue = [`${CONTROLLER_EVENT_NOTIFICATION}`];
    //    if((LargeMotor+SmallMotor) > 0) {
    //        if(!rumbling) {
    //            queue[1] = +true;
    //            rumbling = true;
    //        }
    //    }else {
    //        if(rumbling) {
    //            queue[1] = +false;
    //            rumbling = false;
    //        }
    //    }
    //    if(LightbarColor.Red != color.Red || LightbarColor.Green != color.Green || LightbarColor.Blue != color.Blue) {
    //        //queue.push(`${LightbarColor.Red},${LightbarColor.Green},${LightbarColor.Blue}`);
    //        queue[2] = `${LightbarColor.Red},${LightbarColor.Green},${LightbarColor.Blue}`;
    //        color = {Red: LightbarColor.Red, Green: LightbarColor.Green, Blue: LightbarColor.Blue};
    //    }
    //    if(queue.length != 1) {
    //        const msg = queue.join("|")+"|";
    //        print(`Notification with actual content, sending: \"${msg}\"`);
    //        socket.send(msg);
    //    }
    //});

    socket.on("message", function(msg) {
        print("Socket", socket.socket, "says \""+msg+"\" (",msg.length,")");
        if(msg == "!ping") {
            socket.emit("pong!");
        }else {
            const messages = msg.split("&"); //if i send more than one message in one go i'll separate them by ampersands
            for(const info of messages) {
                const split = info.split("|");
                //commands[split[0]](split); //ok chill on the maps bruh (it's O(1) tho.)
                switch(parseInt(split[0])) { //switch don't do type coercion? (vital can't slide?)
                    case CONTROLLER_EVENT_THUMB:
                        print("Setting controller thumbXY");
                        // print("\tX:", Number(split[2]),(split[2]-0.5)*2*32767);
                        // print("\tY:", Number(split[3]),(split[3]-0.5)*2*32767);
                        //the client sends a value from 0 -> 1 where 0.5 is the center but my controller implementation expects it to be between -32768 to 32767
                        //controller.setThumbXY(split[1], (split[2]-0.5)*2*32767, (split[3]-0.5)*2*32767);
                        //ok lol idk why i did that the client now sends the expected -32768 to 32767 range (no conversion needed)
                        print("\tX:", Number(split[2]));
                        print("\tY:", Number(split[3]));
                        controller.setThumbXY(+split[1], Number(split[2]), Number(split[3]));
                        break;
                    case CONTROLLER_EVENT_BUTTON:
                        //controller.setButton(+split[1]);
                        controller.report.wButtons = +split[1];
                        break;
                    case CONTROLLER_EVENT_TRIGGER:
                        controller.setTrigger(+split[1], +split[2]);
                        break;
                }
            }

            controller.update();
        }
    });
    socket.on("disconnect", function() {
        print("bye bye websocket...", socket.socket);
        controller.Release();
    });
});

const EVENT_KBD_KEY = 1;
const EVENT_KBD_KEYUP = 2;
const EVENT_MOUSE_DOWN = 3;
const EVENT_MOUSE_MOVE = 4;
const EVENT_MOUSE_UP = 5;

const MOUSE_LEFT = VK_LBUTTON;   //1
const MOUSE_RIGHT = VK_RBUTTON;  //2
const MOUSE_MIDDLE = VK_MBUTTON; //4
const MOUSE_X1 = VK_XBUTTON1;    //5
const MOUSE_X2 = VK_XBUTTON2;    //6

Server.get("/kbdmouse", function(req, res) {
    //return res.sendFile(__dirname+"/VMC3.html"); //TUFFFFFFFFFFFF
    //you don\t have to return anymore lol
    res.sendFile(__dirname+"/vmckbdmouse.html"); //TUFFFFFFFFFFFF
});

WebSocketManager.onConnect("/kbdmouse", function(socket) {
    //using keybd_event instead of sendinput because i just am ok. lol.
    const eventHandlers = {
        [EVENT_KBD_KEY]: (keycode) => {
            keybd_event(+keycode, NULL);
        },
        [EVENT_KBD_KEYUP]: (keycode) => {
            keybd_event(+keycode, KEYEVENTF_KEYUP);
        },
        [EVENT_MOUSE_DOWN]: (mousecode) => {
            keybd_event(+mousecode, NULL);
        },
        [EVENT_MOUSE_MOVE]: (x, y) => {
            SendInput(MakeMouseInput(+x, +y, 0, MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_MOVE)); //lol
        },
        [EVENT_MOUSE_UP]: (mousecode) => {
            keybd_event(+mousecode, KEYEVENTF_KEYUP);
        }
    };

    socket.on("message", function(msg) {
        print("Socket", socket.socket, "says \""+msg+"\" (",msg.length,")");
        if(msg == "!ping") {
            socket.emit("pong!");
        }else {
            const messages = msg.split("&"); //if i send more than one message in one go i'll separate them by ampersands
            for(const info of messages) {
                const split = info.split("|");
                if(!eventHandlers[+split[0]]) return;
                eventHandlers[+split[0]](...split.slice(1)); //tuff
            }
        }
    });

    socket.on("disconnect", function() {
        print("bye bye websocket...", socket.socket);
    });
});

while(!GetKey(VK_ESCAPE)) {
    // Server.poll(100 * 1000); //100 ms timeout (multiplied by 1000 so it's in microseconds)
    print("blocking");
    Server.poll(NULL);
    //ViGEmBus.dispatchNotifications();
}

Server.cleanup();
ViGEmBus.Release();

//it's really as simple as that ;)