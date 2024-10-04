//aw i thought that when i moved my mouse it would keep shaking but it stops ;(  (OHHHH printing the input data was slowing my shit down nevermind!)

let mouse = GetCursorPos();

let rawinputdevicelist = []; //defined out here so we can unregister these fellas

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        rawinputdevicelist.push(MakeRAWINPUTDEVICE(0x0001, 0x0002, RIDEV_INPUTSINK, hwnd)); //usage page and usage for mouse devices!

        print(RegisterRawInputDevices(rawinputdevicelist) == 1, "ijustlostmygawggs");

        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        if(GetKey(VK_ESCAPE)) {
            DestroyWindow(hwnd);
        }else {
            SetCursorPos(mouse.x+(50-(Math.random()*100)), mouse.y+(50-(Math.random()*100)));
        }
    }else if(msg == WM_INPUT) {
        const input = GetRawInputData(lp, RID_INPUT);

        if((input.data.usFlags & MOUSE_MOVE_RELATIVE) == MOUSE_MOVE_RELATIVE) { //lol i left this one as if(input.data.usFlags & MOUSE_MOVE_RELATIVE) {} but since MOUSE_MOVE_RELATIVE is 0 this was falsy
            mouse.x += input.data.lLastX;
            mouse.y += input.data.lLastY;
        }else if(input.data.usFlags & MOUSE_MOVE_ABSOLUTE) {
            mouse.x = (input.data.lLastX/65535)*screenWidth; //for some reason absolute movements are mapped from 0-65535 https://learn.microsoft.com/en-us/windows/win32/api/winuser/ns-winuser-rawmouse#remarks
            mouse.y = (input.data.lLastY/65535)*screenHeight;
        }

        //print(input.data); //logging is SLOW! (seriously i think logging is one of the most common slowest things to do)
    }
    else if(msg == WM_DESTROY) {
        print(GetRegisteredRawInputDevices());
        //oops i forgot to unregistser the shits
        for(const device of rawinputdevicelist) {
            let flag = RIDEV_REMOVE;
            if((device.dwFlags & RIDEV_PAGEONLY) == RIDEV_PAGEONLY) {
                flag = flag | RIDEV_PAGEONLY;
            }
            device.dwFlags = flag;
            device.hwndTarget = NULL;
        }
        print(RegisterRawInputDevices(rawinputdevicelist) == 1); //wait how do i unregister PAGEONLY shits (i got over it)

        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "random idea i had", WS_OVERLAPPEDWINDOW, 500, 500, 100, 100, NULL, NULL, hInstance); //im not using WS_VISIBLE because you need the window for WM_INPUT events but im not using the window for anything else so off you pop