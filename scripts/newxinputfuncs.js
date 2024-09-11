//renamed from controllers.js because why did i name it that lmao

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

//const systemFont = GetDefaultFont();

let d2d, brush, font;
let lowfreqrumble = 0; //according to msdn the left motor is low frequency
let highfreqrumble = 0; //and the right motor is high frequency (and their values are from 0-65535)
let mouse = {button: 0};

function GetClientCursorPos(rect) {
    let mouse = GetCursorPos();
    return {x: mouse.x-rect.left-8, y: mouse.y-rect.top-33/*-20*/};
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd);
        brush = d2d.CreateSolidColorBrush(0.0, 0.0, 0.0);
        font = d2d.CreateFont(NULL, 12); //oh putting nothing gives you the default windows font
        SetTimer(hwnd, NULL, 16);
    }/*else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);
        const dc = ps.hdc;
        
        let buttons = undefined;
        let gamepad = undefined;
        const controllers = GetControllers();
        if(controllers[0] != undefined) { //using the first controller available
            gamepad = XInputGetState(controllers[0]).Gamepad;
            buttons = gamepad.wButtons;
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
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_LEFT_THUMB_POS: [${gamepad.sThumbLX}, ${gamepad.sThumbLY}]`); i++;
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_RIGHT_THUMB_POS: [${gamepad.sThumbRX}, ${gamepad.sThumbRY}]`); i++;
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_LEFT_SHOULDER: ${+((buttons & XINPUT_GAMEPAD_LEFT_SHOULDER) == XINPUT_GAMEPAD_LEFT_SHOULDER)}`); i++;
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_RIGHT_SHOULDER: ${+((buttons & XINPUT_GAMEPAD_RIGHT_SHOULDER) == XINPUT_GAMEPAD_RIGHT_SHOULDER)}`); i++;
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_LEFT_TRIGGER: ${gamepad.bLeftTrigger}`); i++;
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_RIGHT_TRIGGER: ${gamepad.bRightTrigger}`); i++;
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_A: ${+((buttons & XINPUT_GAMEPAD_A) == XINPUT_GAMEPAD_A)}`); i++;
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_B: ${+((buttons & XINPUT_GAMEPAD_B) == XINPUT_GAMEPAD_B)}`); i++;
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_X: ${+((buttons & XINPUT_GAMEPAD_X) == XINPUT_GAMEPAD_X)}`); i++;
        TextOut(dc, 0, 12*i, `XINPUT_GAMEPAD_Y: ${+((buttons & XINPUT_GAMEPAD_Y) == XINPUT_GAMEPAD_Y)}`); i++;
        print(i);
        SelectObject(dc, last);

        EndPaint(hwnd, ps);
    }*/else if(msg == WM_TIMER) {
        //RedrawWindow(hwnd, 0, 0, 312, 240, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
        d2d.BeginDraw();
        d2d.Clear(.8, .8, .8);

        let buttons = -1;
        let gamepad = {sThumbLX: 0, sThumbLY: 0, sThumbRX: 0, sThumbRY: 0};
        const controllers = GetControllers();
        if(controllers[0] != undefined) { //using the first controller available
            gamepad = XInputGetState(controllers[0]).Gamepad;
            buttons = gamepad.wButtons;
        }

        let i = 1;
        d2d.DrawText((buttons == -1) ? "Unable to find any connected controllers" : `Controller ${controllers[0]}: `, font, 0, 0, 312, 240, brush);
        d2d.DrawText(`XINPUT_GAMEPAD_DPAD_UP: ${+((buttons & XINPUT_GAMEPAD_DPAD_UP) == XINPUT_GAMEPAD_DPAD_UP)}`, font, 0, 12*i, 312, 240, brush); i++;
        d2d.DrawText(`XINPUT_GAMEPAD_DPAD_DOWN: ${+((buttons & XINPUT_GAMEPAD_DPAD_DOWN) == XINPUT_GAMEPAD_DPAD_DOWN)}`, font, 0, 12*i, 312, 240, brush); i++;
        d2d.DrawText(`XINPUT_GAMEPAD_DPAD_LEFT: ${+((buttons & XINPUT_GAMEPAD_DPAD_LEFT) == XINPUT_GAMEPAD_DPAD_LEFT)}`, font, 0, 12*i, 312, 240, brush); i++;
        d2d.DrawText(`XINPUT_GAMEPAD_DPAD_RIGHT: ${+((buttons & XINPUT_GAMEPAD_DPAD_RIGHT) == XINPUT_GAMEPAD_DPAD_RIGHT)}`, font, 0, 12*i, 312, 240, brush); i++;
        d2d.DrawText(`XINPUT_GAMEPAD_START: ${+((buttons & XINPUT_GAMEPAD_START) == XINPUT_GAMEPAD_START)}`, font, 0, 12*i, 312, 240, brush); i++;
        d2d.DrawText(`XINPUT_GAMEPAD_BACK: ${+((buttons & XINPUT_GAMEPAD_BACK) == XINPUT_GAMEPAD_BACK)}`, font, 0, 12*i, 312, 240, brush); i++;
        d2d.DrawText(`XINPUT_GAMEPAD_LEFT_THUMB: ${+((buttons & XINPUT_GAMEPAD_LEFT_THUMB) == XINPUT_GAMEPAD_LEFT_THUMB)}`, font, 0, 12*i, 312, 240, brush); i++;
        d2d.DrawText(`XINPUT_GAMEPAD_RIGHT_THUMB: ${+((buttons & XINPUT_GAMEPAD_RIGHT_THUMB) == XINPUT_GAMEPAD_RIGHT_THUMB)}`, font, 0, 12*i, 312, 240, brush); i++;
        d2d.DrawText(`XINPUT_GAMEPAD_LEFT_THUMB_POS: [${gamepad.sThumbLX}, ${gamepad.sThumbLY}]`, font, 0, 12*i, 312, 240, brush); i++;
        d2d.DrawText(`XINPUT_GAMEPAD_RIGHT_THUMB_POS: [${gamepad.sThumbRX}, ${gamepad.sThumbRY}]`, font, 0, 12*i, 312, 240, brush); i++;
        d2d.DrawText(`XINPUT_GAMEPAD_LEFT_SHOULDER: ${+((buttons & XINPUT_GAMEPAD_LEFT_SHOULDER) == XINPUT_GAMEPAD_LEFT_SHOULDER)}`, font, 0, 12*i, 312, 240, brush); i++;
        d2d.DrawText(`XINPUT_GAMEPAD_RIGHT_SHOULDER: ${+((buttons & XINPUT_GAMEPAD_RIGHT_SHOULDER) == XINPUT_GAMEPAD_RIGHT_SHOULDER)}`, font, 0, 12*i, 312, 240, brush); i++;
        d2d.DrawText(`XINPUT_GAMEPAD_LEFT_TRIGGER: ${gamepad.bLeftTrigger}`, font, 0, 12*i, 312, 240, brush); i++;
        d2d.DrawText(`XINPUT_GAMEPAD_RIGHT_TRIGGER: ${gamepad.bRightTrigger}`, font, 0, 12*i, 312, 240, brush); i++;
        d2d.DrawText(`XINPUT_GAMEPAD_A: ${+((buttons & XINPUT_GAMEPAD_A) == XINPUT_GAMEPAD_A)}`, font, 0, 12*i, 312, 240, brush); i++;
        d2d.DrawText(`XINPUT_GAMEPAD_B: ${+((buttons & XINPUT_GAMEPAD_B) == XINPUT_GAMEPAD_B)}`, font, 0, 12*i, 312, 240, brush); i++;
        d2d.DrawText(`XINPUT_GAMEPAD_X: ${+((buttons & XINPUT_GAMEPAD_X) == XINPUT_GAMEPAD_X)}`, font, 0, 12*i, 312, 240, brush); i++;
        d2d.DrawText(`XINPUT_GAMEPAD_Y: ${+((buttons & XINPUT_GAMEPAD_Y) == XINPUT_GAMEPAD_Y)}`, font, 0, 12*i, 312, 240, brush); i++;

        brush.SetColor(.6, .6, .6);
        
        d2d.FillRectangle(400-96, 24, 440-96, 216, brush);
        d2d.FillRectangle(440-48, 24, 480-48, 216, brush);
        
        brush.SetColor(.4, .4, .4);

        d2d.FillRectangle(405-96, 29, 435-96, 211, brush);
        d2d.FillRectangle(445-48, 29, 475-48, 211, brush);

        brush.SetColor(.7, .3, .3);

        let {x, y} = GetClientCursorPos(GetWindowRect(hwnd));
        //print(((lowfreqrumble/65535)*182), ((highfreqrumble/65535)*182));
        d2d.FillRectangle(405-96, 211-((lowfreqrumble/65535)*182), 435-96, 211-12-((lowfreqrumble/65535)*182), brush);
        d2d.FillRectangle(445-48, 211-((highfreqrumble/65535)*182), 475-48, 211-12-((highfreqrumble/65535)*182), brush);

        if(mouse.button) {
            if(x > 400-96 && x < 440-96) {
                lowfreqrumble = Math.min(Math.max((1-((y-24)/(216-24)))*65535, 0), 65535);
            }else if(x > 440-48 && x < 480-48) {
                highfreqrumble = Math.min(Math.max((1-((y-24)/(216-24)))*65535, 0), 65535);
            }
        }else {
            lowfreqrumble = Math.min(Math.max(gamepad.bLeftTrigger*257/*.sThumbLY*2*/, 0), 65535);
            highfreqrumble = Math.min(Math.max(gamepad.bRightTrigger*257/*.sThumbRY*2*/, 0), 65535);
        }

        XInputSetState(0, lowfreqrumble, highfreqrumble);

        brush.SetColor(0.0, 0.0, 0.0);

        d2d.DrawText(`left motor speed: ${lowfreqrumble}`, font, 400-96, 0, 440-96, 24, brush);
        d2d.DrawText(`right motor speed: ${highfreqrumble}`, font, 440-48, 0, 480-48, 24, brush);

        d2d.EndDraw();
    }else if(msg == WM_LBUTTONDOWN) {
        SetCapture(hwnd);
        mouse.button = 1;
    }else if(msg == WM_LBUTTONUP) {
        ReleaseCapture();
        mouse.button = 0;
    }
    else if(msg == WM_DESTROY) {
        font.Release();
        brush.Release();
        d2d.Release();
        PostQuitMessage(0);
        //DeleteObject(systemFont);
    }
}

const winclass = CreateWindowClass("WinClass"/*, init*/, windowProc); //loop is not required y'all
winclass.hIcon = winclass.hIconSm = LoadIcon(NULL, IDI_APPLICATION);
winclass.hbrBackground = COLOR_BACKGROUND;
winclass.hCursor = LoadCursor(NULL, IDC_ARROW);

CreateWindow(WS_EX_OVERLAPPEDWINDOW, winclass, "controller remappningthign (pull triggers or use mouse to change motor speeds)", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 480+20, 240+42, NULL, NULL, hInstance);