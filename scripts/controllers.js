//let time = Date.now();
//while(true) {
//    //print(1000/(Date.now()-time));
//    const controllers = GetControllers();
//    if(controllers[0] != undefined) {
//        const buttons = XInputGetState(controllers[0]).Gamepad.wButtons;
//        print(`XINPUT_GAMEPAD_DPAD_UP: ${+((buttons & XINPUT_GAMEPAD_DPAD_UP) == XINPUT_GAMEPAD_DPAD_UP)}`);
//        print(`XINPUT_GAMEPAD_DPAD_DOWN: ${+((buttons & XINPUT_GAMEPAD_DPAD_DOWN) == XINPUT_GAMEPAD_DPAD_DOWN)}`);
//        print(`XINPUT_GAMEPAD_DPAD_LEFT: ${+((buttons & XINPUT_GAMEPAD_DPAD_LEFT) == XINPUT_GAMEPAD_DPAD_LEFT)}`);
//        print(`XINPUT_GAMEPAD_DPAD_RIGHT: ${+((buttons & XINPUT_GAMEPAD_DPAD_RIGHT) == XINPUT_GAMEPAD_DPAD_RIGHT)}`);
//        print(`XINPUT_GAMEPAD_START: ${+((buttons & XINPUT_GAMEPAD_START) == XINPUT_GAMEPAD_START)}`);
//        print(`XINPUT_GAMEPAD_BACK: ${+((buttons & XINPUT_GAMEPAD_BACK) == XINPUT_GAMEPAD_BACK)}`);
//        print(`XINPUT_GAMEPAD_LEFT_THUMB: ${+((buttons & XINPUT_GAMEPAD_LEFT_THUMB) == XINPUT_GAMEPAD_LEFT_THUMB)}`);
//        print(`XINPUT_GAMEPAD_RIGHT_THUMB: ${+((buttons & XINPUT_GAMEPAD_RIGHT_THUMB) == XINPUT_GAMEPAD_RIGHT_THUMB)}`);
//        print(`XINPUT_GAMEPAD_LEFT_SHOULDER: ${+((buttons & XINPUT_GAMEPAD_LEFT_SHOULDER) == XINPUT_GAMEPAD_LEFT_SHOULDER)}`);
//        print(`XINPUT_GAMEPAD_RIGHT_SHOULDER: ${+((buttons & XINPUT_GAMEPAD_RIGHT_SHOULDER) == XINPUT_GAMEPAD_RIGHT_SHOULDER)}`);
//        print(`XINPUT_GAMEPAD_A: ${+((buttons & XINPUT_GAMEPAD_A) == XINPUT_GAMEPAD_A)}`);
//        print(`XINPUT_GAMEPAD_B: ${+((buttons & XINPUT_GAMEPAD_B) == XINPUT_GAMEPAD_B)}`);
//        print(`XINPUT_GAMEPAD_X: ${+((buttons & XINPUT_GAMEPAD_X) == XINPUT_GAMEPAD_X)}`);
//        print(`XINPUT_GAMEPAD_Y: ${+((buttons & XINPUT_GAMEPAD_Y) == XINPUT_GAMEPAD_Y)}`);
//        //SendInput(MakeKeyboardInput("S", false));
//    }
//    //time = Date.now();
//    Sleep(16);
//}

const systemFont = GetDefaultFont();

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        SetTimer(hwnd, NULL, 16);
    }else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);
        const dc = ps.hdc;
        
        let buttons = undefined;
        const controllers = GetControllers();
        if(controllers[0] != undefined) { //using the first controller available
            buttons = XInputGetState(controllers[0]).Gamepad.wButtons;
        }
        const last = SelectObject(dc, systemFont);
        let i = 1;
        TextOut(dc, 0, 0, (buttons == undefined) ? "Unable to find any connected controllers" : `Controller ${controllers[0]}: `);
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_DPAD_UP: ${+((buttons & XINPUT_GAMEPAD_DPAD_UP) == XINPUT_GAMEPAD_DPAD_UP)}`); i++;
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_DPAD_DOWN: ${+((buttons & XINPUT_GAMEPAD_DPAD_DOWN) == XINPUT_GAMEPAD_DPAD_DOWN)}`); i++;
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_DPAD_LEFT: ${+((buttons & XINPUT_GAMEPAD_DPAD_LEFT) == XINPUT_GAMEPAD_DPAD_LEFT)}`); i++;
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_DPAD_RIGHT: ${+((buttons & XINPUT_GAMEPAD_DPAD_RIGHT) == XINPUT_GAMEPAD_DPAD_RIGHT)}`); i++;
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_START: ${+((buttons & XINPUT_GAMEPAD_START) == XINPUT_GAMEPAD_START)}`); i++;
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_BACK: ${+((buttons & XINPUT_GAMEPAD_BACK) == XINPUT_GAMEPAD_BACK)}`); i++;
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_LEFT_THUMB: ${+((buttons & XINPUT_GAMEPAD_LEFT_THUMB) == XINPUT_GAMEPAD_LEFT_THUMB)}`); i++;
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_RIGHT_THUMB: ${+((buttons & XINPUT_GAMEPAD_RIGHT_THUMB) == XINPUT_GAMEPAD_RIGHT_THUMB)}`); i++;
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_LEFT_SHOULDER: ${+((buttons & XINPUT_GAMEPAD_LEFT_SHOULDER) == XINPUT_GAMEPAD_LEFT_SHOULDER)}`); i++;
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_RIGHT_SHOULDER: ${+((buttons & XINPUT_GAMEPAD_RIGHT_SHOULDER) == XINPUT_GAMEPAD_RIGHT_SHOULDER)}`); i++;
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_A: ${+((buttons & XINPUT_GAMEPAD_A) == XINPUT_GAMEPAD_A)}`); i++;
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_B: ${+((buttons & XINPUT_GAMEPAD_B) == XINPUT_GAMEPAD_B)}`); i++;
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_X: ${+((buttons & XINPUT_GAMEPAD_X) == XINPUT_GAMEPAD_X)}`); i++;
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_Y: ${+((buttons & XINPUT_GAMEPAD_Y) == XINPUT_GAMEPAD_Y)}`); i++;

        SelectObject(dc, last);

        EndPaint(hwnd, ps);
    }else if(msg == WM_TIMER) {
        RedrawWindow(hwnd, 0, 0, 256, 192, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        DeleteObject(systemFont);
    }
}

const winclass = CreateWindowClass("WinClass"/*, init*/, windowProc); //loop is not required y'all
winclass.hIcon = winclass.hIconSm = LoadIcon(NULL, IDI_APPLICATION);
winclass.hbrBackground = COLOR_BACKGROUND;
winclass.hCursor = LoadCursor(NULL, IDC_ARROW);

CreateWindow(WS_EX_OVERLAPPEDWINDOW, winclass, "controller remappningthign", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 256+20, 192+42, NULL, NULL, hInstance);