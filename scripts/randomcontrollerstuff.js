let d2d, brush, font;
let triggers = {LEFT_TRIGGER: 0, RIGHT_TRIGGER: 0};
let bools = {};
for(let key of Object.keys(triggers)) bools[key] = false;

let keys = {LEFT_TRIGGER: MOUSEEVENTF_LEFTDOWN, RIGHT_TRIGGER: MOUSEEVENTF_RIGHTDOWN};

function checkBit(bit, mask) {
    return ((bit & mask) == mask);
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd);
        brush = d2d.CreateSolidColorBrush(0.0, 0.0, 0.0);
        font = d2d.CreateFont(NULL, 12); //oh putting nothing gives you the default windows font
        SetTimer(hwnd, NULL, 16);
    }else if(msg == WM_TIMER) {
        d2d.BeginDraw();
        d2d.Clear(.8, .8, .8);

        let gamepad = undefined;
        const controllers = GetControllers();
        if(controllers[0] != undefined) { //using the first controller available
            gamepad = XInputGetState(controllers[0]).Gamepad;
            triggers = {LEFT_TRIGGER: gamepad.bLeftTrigger, RIGHT_TRIGGER: gamepad.bRightTrigger};
        }

        let mouse = GetCursorPos();

        let nTLX = gamepad.sThumbLX/(2**15);
        let nTLY = gamepad.sThumbLY/(2**15);
        let nTRX = gamepad.sThumbRX/(2**15);
        let nTRY = gamepad.sThumbRY/(2**15);

        d2d.DrawText("left thumb", font, 64, 128, 640, 480, brush);
        d2d.DrawText(`[${gamepad.sThumbLX}, ${gamepad.sThumbLY}]`, font, 64, 128+12, 640, 480, brush);
        d2d.DrawText(`[${nTLX}, ${nTLY}]`, font, 64, 128+24, 640, 480, brush);
        d2d.DrawLine(128, 256, 128+(nTLX*100), 256+(-nTLY*100), brush, 16);
        d2d.DrawText("right thumb", font, 384, 128, 640, 480, brush);
        d2d.DrawText(`[${gamepad.sThumbRX}, ${gamepad.sThumbRY}]`, font, 384, 128+12, 640, 480, brush);
        d2d.DrawText(`[${nTRX}, ${nTRY}]`, font, 384, 128+24, 640, 480, brush);
        d2d.DrawLine(448, 256, 448+(nTRX*100), 256+(-nTRY*100), brush, 16);

        let lb = checkBit(gamepad.wButtons, XINPUT_GAMEPAD_LEFT_SHOULDER) ? 4 : 1;
        let rb = checkBit(gamepad.wButtons, XINPUT_GAMEPAD_RIGHT_SHOULDER) ? 4 : 1;

        SetCursorPos(mouse.x+Math.round(nTLX+nTRX)*lb, mouse.y-(Math.round(nTLY+nTRY)*rb));

        for(let trigger in triggers) {
            let value = triggers[trigger]; //the trigger's range is from 0-255
            if(value > 8) { //just incase yo shit sticky or sumnb
                if(!bools[trigger]) {
                    print("first hit "+trigger);
                    SendInput(MakeMouseInput(0, 0, 0, keys[trigger]));
                }
                bools[trigger] = true;
            }else {
                if(bools[trigger]) {
                    SendInput(MakeMouseInput(0, 0, 0, keys[trigger]*2)); //since i'm using the MOUSEEVENTF_....DOWN consts i multiply the value by 2 because MOUSEEVENTF_LEFTDOWN is 0x0002 and MOUSEEVENTF_LEFTUP is 0x0004
                    print("released "+trigger);
                }
                bools[trigger] = false;
            }
            //bools[i] = ; //yeah using i is weird here but there's no problem with it lo!
        }

        d2d.EndDraw();
    }
    else if(msg == WM_DESTROY) {
        font.Release();
        brush.Release();
        d2d.Release();
        PostQuitMessage(0);
        //DeleteObject(systemFont);
    }
}

const winclass = CreateWindowClass("randomcontrollerstuff"/*, init*/, windowProc); //loop is not required y'all
winclass.hIcon = winclass.hIconSm = LoadIcon(NULL, IDI_APPLICATION);
winclass.hbrBackground = COLOR_BACKGROUND;
winclass.hCursor = LoadCursor(NULL, IDC_ARROW);

CreateWindow(WS_EX_OVERLAPPEDWINDOW, winclass, "analog stick view", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 640+20, 480+43, NULL, NULL, hInstance);