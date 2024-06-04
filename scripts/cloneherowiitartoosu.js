//const systemFont = GetDefaultFont();

Msgbox("in this script i'm assuming you're using a wii guitar connected with WiitarThing to emulate an xbox 360 controller.\r\nif you are using a regular controller the keybinds might be weird", "don't worry you only need one working controller", MB_OK | MB_ICONINFORMATION | MB_SYSTEMMODAL);

let controllers;
let state = undefined;
//let DPAD_UP, DPAD_DOWN, DPAD_LEFT, DPAD_RIGHT, START, BACK, LEFT_THUMB, RIGHT_THUMB, LEFT_SHOULDER, RIGHT_SHOULDER, A, B, X, Y;
let buttons = {DPAD_UP: 0, DPAD_DOWN: 0, DPAD_LEFT: 0, DPAD_RIGHT: 0, START: 0, BACK: 0, LEFT_THUMB: 0, RIGHT_THUMB: 0, LEFT_SHOULDER: 0, RIGHT_SHOULDER: 0, A: 0, B: 0, X: 0, Y: 0};

//const backBuffer = CreateBitmap(256, 192, 32, NULL);

let keys = [
    "START", VK_ESCAPE,
    "DPAD_UP", VK_DOWN, //swapped?
    "DPAD_DOWN", VK_UP,
    "BACK", VK_RETURN,
];

keys.push( //5 key
    "A", "A",
    "B", "S",
    "Y", "F",
    "X", "G",
    "LEFT_SHOULDER", "H",
);

//keys.push( //6 key borderline impossible
//    "A", "S",
//    "B", "D",
//    "Y", "F",
//    "X", "J",
//    "LEFT_SHOULDER", "K",
//    "LEFT_SHOULDER", "L",
//);

for(const name of Object.keys(buttons)) {
    buttons[`LAST_${name}`] = buttons[name];
}

//let j = 0;
//let time = Date.now();

controllers = GetControllers();
if(controllers[0] != undefined) {
    print("Found controller!");
}else {
    print("Found no controllers (if you plug one in it will still work)");
}

while(true) {
    controllers = GetControllers();
    if(controllers[0] != undefined) { //using the first controller available
        //print(controllers[0]);
        //try {
            state = XInputGetState(controllers[0]).Gamepad.wButtons;
        //}catch(e) {
        //    print(e, "E");
        //}
    }else {
        print("Found no controllers (waiting...)");
    }

    for(const name of Object.keys(buttons)) {
        if(name.includes("LAST")) {
            buttons[name] = buttons[name.replace("LAST_", "")];
        }
    }
    //for(const name of Object.keys(buttons)) { //yo wtf this causes some weird memory shits (memory just starts climbing and climbing and it slows down the while loop tremendously)
    //    //oh FUCKING SHIT! IM MAKIGN LAST_LAST_LAST_ VERSIONS OF THIS SHIT NO WAY
    //    //I THOUGHT MY LACK OF HANDLE_SCOPES WERE FINALLY CATCHING UP TO ME
    //    buttons[`LAST_${name}`] = buttons[name];
    //}

    buttons.DPAD_UP = ((state & XINPUT_GAMEPAD_DPAD_UP) == XINPUT_GAMEPAD_DPAD_UP); //regexr $1 = ((state & $&) == $&);
    buttons.DPAD_DOWN = ((state & XINPUT_GAMEPAD_DPAD_DOWN) == XINPUT_GAMEPAD_DPAD_DOWN);
    buttons.DPAD_LEFT = ((state & XINPUT_GAMEPAD_DPAD_LEFT) == XINPUT_GAMEPAD_DPAD_LEFT);
    buttons.DPAD_RIGHT = ((state & XINPUT_GAMEPAD_DPAD_RIGHT) == XINPUT_GAMEPAD_DPAD_RIGHT);
    buttons.START = ((state & XINPUT_GAMEPAD_START) == XINPUT_GAMEPAD_START);
    buttons.BACK = ((state & XINPUT_GAMEPAD_BACK) == XINPUT_GAMEPAD_BACK);
    buttons.LEFT_THUMB = ((state & XINPUT_GAMEPAD_LEFT_THUMB) == XINPUT_GAMEPAD_LEFT_THUMB);
    buttons.RIGHT_THUMB = ((state & XINPUT_GAMEPAD_RIGHT_THUMB) == XINPUT_GAMEPAD_RIGHT_THUMB);
    buttons.LEFT_SHOULDER = ((state & XINPUT_GAMEPAD_LEFT_SHOULDER) == XINPUT_GAMEPAD_LEFT_SHOULDER);
    buttons.RIGHT_SHOULDER = ((state & XINPUT_GAMEPAD_RIGHT_SHOULDER) == XINPUT_GAMEPAD_RIGHT_SHOULDER);
    buttons.A = ((state & XINPUT_GAMEPAD_A) == XINPUT_GAMEPAD_A);
    buttons.B = ((state & XINPUT_GAMEPAD_B) == XINPUT_GAMEPAD_B);
    buttons.X = ((state & XINPUT_GAMEPAD_X) == XINPUT_GAMEPAD_X);
    buttons.Y = ((state & XINPUT_GAMEPAD_Y) == XINPUT_GAMEPAD_Y);
    
    //print(buttons.A, j, 1000/(Date.now()-time));

    //time = Date.now();

    for(let i = 0; i < keys.length; i+=2) {
        const key = keys[i];
        if(buttons[key]) {
            if(!buttons["LAST_"+key]) {
                print("SEND", key);
                //bruh i fr thought that there was a delay with SendInput and then keybd_event just to realize that problem was completely unrelated to jbs 
                //SendInput(MakeKeyboardInput(keys[i+1], false));
                keybd_event(keys[i+1], NULL);
            }
        }else {
            if(buttons["LAST_"+key]) {
                print("RELEASE", key);
                keybd_event(keys[i+1], KEYEVENTF_KEYUP);
                //SendInput(MakeKeyboardInput(keys[i+1], true));
            }
        }
    }
    
    //j++;
}

//function windowProc(hwnd, msg, wp, lp) {
//    if(msg == WM_CREATE) {
//        SetTimer(hwnd, NULL, 16);
//    }else if(msg == WM_PAINT) {
//        const ps = BeginPaint(hwnd);
//        const dc = ps.hdc;
//
//        const memDC = CreateCompatibleDC(dc);
//        const bmp = CreateCompatibleBitmap(dc, 256, 192);
//        SelectObject(memDC, bmp); //drawing to a bitmap first as a weird way to clear the background (because regular gdi32 has no clear function for some reason)
//        
//        const last = SelectObject(memDC, systemFont);
//        let i = 1;
//        TextOut(memDC, 0, 0, (state == undefined) ? "Unable to find any connected controllers" : `Controller ${controllers[0]}: `);
//        TextOut(memDC, 0, 12*i, `XINPUT_GAMEPAD_DPAD_UP: ${+(buttons.DPAD_UP)}`); i++;
//        TextOut(memDC, 0, 12*i, `XINPUT_GAMEPAD_DPAD_DOWN: ${+(buttons.DPAD_DOWN)}`); i++;
//        TextOut(memDC, 0, 12*i, `XINPUT_GAMEPAD_DPAD_LEFT: ${+(buttons.DPAD_LEFT)}`); i++;
//        TextOut(memDC, 0, 12*i, `XINPUT_GAMEPAD_DPAD_RIGHT: ${+(buttons.DPAD_RIGHT)}`); i++;
//        TextOut(memDC, 0, 12*i, `XINPUT_GAMEPAD_START: ${+(buttons.START)}`); i++;
//        TextOut(memDC, 0, 12*i, `XINPUT_GAMEPAD_BACK: ${+(buttons.BACK)}`); i++;
//        TextOut(memDC, 0, 12*i, `XINPUT_GAMEPAD_LEFT_THUMB: ${+(buttons.LEFT_THUMB)}`); i++;
//        TextOut(memDC, 0, 12*i, `XINPUT_GAMEPAD_RIGHT_THUMB: ${+(buttons.RIGHT_THUMB)}`); i++;
//        TextOut(memDC, 0, 12*i, `XINPUT_GAMEPAD_LEFT_SHOULDER: ${+(buttons.LEFT_SHOULDER)}`); i++;
//        TextOut(memDC, 0, 12*i, `XINPUT_GAMEPAD_RIGHT_SHOULDER: ${+(buttons.RIGHT_SHOULDER)}`); i++;
//        TextOut(memDC, 0, 12*i, `XINPUT_GAMEPAD_A: ${+(buttons.A)}`); i++;
//        TextOut(memDC, 0, 12*i, `XINPUT_GAMEPAD_B: ${+(buttons.B)}`); i++;
//        TextOut(memDC, 0, 12*i, `XINPUT_GAMEPAD_X: ${+(buttons.X)}`); i++;
//        TextOut(memDC, 0, 12*i, `XINPUT_GAMEPAD_Y: ${+(buttons.Y)}`); i++;
//                
//        BitBlt(dc, 0, 0, 256, 192, memDC, 0, 0, SRCCOPY);
//
//        SelectObject(memDC, last);
//        DeleteDC(memDC);
//        DeleteObject(bmp);
//
//        EndPaint(hwnd, ps);
//    }else if(msg == WM_TIMER) {
//        controllers = GetControllers();
//        if(controllers[0] != undefined) { //using the first controller available
//            state = XInputGetState(controllers[0]).Gamepad.wButtons;
//        }
//
//        for(const name of Object.keys(buttons)) {
//            buttons[`LAST_${name}`] = buttons[name];
//        }
//        
//        buttons.DPAD_UP = ((state & XINPUT_GAMEPAD_DPAD_UP) == XINPUT_GAMEPAD_DPAD_UP); //regexr $1 = ((state & $&) == $&);\n
//        buttons.DPAD_DOWN = ((state & XINPUT_GAMEPAD_DPAD_DOWN) == XINPUT_GAMEPAD_DPAD_DOWN);
//        buttons.DPAD_LEFT = ((state & XINPUT_GAMEPAD_DPAD_LEFT) == XINPUT_GAMEPAD_DPAD_LEFT);
//        buttons.DPAD_RIGHT = ((state & XINPUT_GAMEPAD_DPAD_RIGHT) == XINPUT_GAMEPAD_DPAD_RIGHT);
//        buttons.START = ((state & XINPUT_GAMEPAD_START) == XINPUT_GAMEPAD_START);
//        buttons.BACK = ((state & XINPUT_GAMEPAD_BACK) == XINPUT_GAMEPAD_BACK);
//        buttons.LEFT_THUMB = ((state & XINPUT_GAMEPAD_LEFT_THUMB) == XINPUT_GAMEPAD_LEFT_THUMB);
//        buttons.RIGHT_THUMB = ((state & XINPUT_GAMEPAD_RIGHT_THUMB) == XINPUT_GAMEPAD_RIGHT_THUMB);
//        buttons.LEFT_SHOULDER = ((state & XINPUT_GAMEPAD_LEFT_SHOULDER) == XINPUT_GAMEPAD_LEFT_SHOULDER);
//        buttons.RIGHT_SHOULDER = ((state & XINPUT_GAMEPAD_RIGHT_SHOULDER) == XINPUT_GAMEPAD_RIGHT_SHOULDER);
//        buttons.A = ((state & XINPUT_GAMEPAD_A) == XINPUT_GAMEPAD_A);
//        buttons.B = ((state & XINPUT_GAMEPAD_B) == XINPUT_GAMEPAD_B);
//        buttons.X = ((state & XINPUT_GAMEPAD_X) == XINPUT_GAMEPAD_X);
//        buttons.Y = ((state & XINPUT_GAMEPAD_Y) == XINPUT_GAMEPAD_Y);
//
//        for(let i = 0; i < keys.length; i+=2) {
//            const key = keys[i];
//            if(buttons[key]) {
//                if(!buttons["LAST_"+key]) {
//                    SendInput(MakeKeyboardInput(keys[i+1], false));
//                }
//            }else {
//                if(buttons["LAST_"+key]) {
//                    SendInput(MakeKeyboardInput(keys[i+1], true));
//                }
//            }
//        }
//
//        RedrawWindow(hwnd, 0, 0, 256, 192, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
//    }
//    else if(msg == WM_DESTROY) {
//        PostQuitMessage(0);
//        DeleteObject(systemFont);
//    }
//}
//
//const winclass = CreateWindowClass("WinClass"/*, init*/, windowProc); //loop is not required y'all
//winclass.hIcon = winclass.hIconSm = LoadIcon(NULL, IDI_APPLICATION);
//winclass.hbrBackground = COLOR_BACKGROUND;
//winclass.hCursor = LoadCursor(NULL, IDC_ARROW);
//
//CreateWindow(WS_EX_OVERLAPPEDWINDOW, winclass, "controller remappningthign", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 256+20, 192+42, NULL, NULL, hInstance);