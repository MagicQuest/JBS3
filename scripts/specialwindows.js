const font = CreateFontSimple("impact", 20, 40);

let window;

let x = 0;

let lastInteraction = Date.now();

const screen = GetDC(NULL);

let text = "HELLO FROM THIS NON-SUSPICIOUS TOOLBAR!";

let tween = true;

//let stats = {mouse: {left: 0, right: 0, middle: 0}, kbd: GetAsyncKeyboardState(), windows: {}};

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        SetWindowPos(hwnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);
        SetTimer(hwnd, 1, 16); //60 fps LO 1000/16 (ok real number is 1000/16.666666666) (doesn't use decimals though)
    }else if(msg == WM_KEYDOWN) {
        if(wp == VK_ESCAPE) {
            DestroyWindow(hwnd);
        }else if(wp == VK_BACK) {
            text = text.substring(0, text.length-1);
            if(GetKey(VK_LCONTROL)) {
                text = text.split(" ").map((str, i) => i < text.split(" ").length-1 ? str+" " : []).join("");
            }
            x = (1920/2)-(8*text.length);
        }//else if(wp > 65 && wp < 91) { //all lower case characters (hold alt and press numpad 100 then let go of alt)
        //    text += String.fromCharCode(wp);
        //}
        else if(wp == VK_SPACE) {
            text += " ";
        }
        RedrawWindow(hwnd, 0, 0, 1920, 64, NULL, RDW_INVALIDATE | RDW_ERASE | RDW_UPDATENOW);
        lastInteraction = Date.now();
    }else if(msg == WM_CHAR) {
        if((wp > 64 && wp < 91) || (wp > 96 && wp < 123)) {
            text += String.fromCharCode(wp);
            x = (1920/2)-(text.length*8);
        }
    }else if(msg == WM_PAINT && Date.now()-lastInteraction < 6000) {
        const ps = BeginPaint(hwnd);

        const oldFont = SelectObject(ps.hdc, font);
        SetTextColor(ps.hdc, RGB(255,0,0));//RGB(x/1920*255,0,0))
        TextOut(ps.hdc, x, 10, text);
        SelectObject(ps.hdc, oldFont);

        //interesting i might have to do some fake 3d stuff with this but i need to find out the formulas (exactly what im talking about https://www.desmos.com/calculator/vahnkqibew)
        //PlgBlt(screen, [{x: 0, y: 0}, {x:1920, y: 0}, {x:10,y:64}], ps.hdc, 0, 0, 1920, 64, NULL, 0, 0);

        print("DRAW", x);

        EndPaint(hwnd, ps);
    }else if(msg == WM_TIMER) {
        x += 2; //scroll speed
        if(x % 1920 == 0 && x != 0) {
            x = -20*text.length;
        }
        if(GetMousePos().y == 0) {
            if(Date.now()-lastInteraction > 5000) {
                tween = true;
                lastInteraction = Date.now();
            }
        }
        //print(x);

        if(Date.now()-lastInteraction > 5000 && Date.now()-lastInteraction < 6000) {
            //print(lastInteraction, Date.now(), lastInteraction-Date.now(), (lastInteraction-Date.now()+5000), (lastInteraction-Date.now()+5000)/15.62500);
            //print(Math.max((lastInteraction-Date.now()+5000)/15.62500, -64));
            print("moving up", (lastInteraction-Date.now()+5000)/8.33333333);
            SetWindowPos(hwnd, NULL, 0, Math.max((lastInteraction-Date.now()+5000)/8.33333333 /*15.62500*/, -64), 0, 0, SWP_NOSIZE | SWP_NOZORDER);
        }else if(Date.now()-lastInteraction <= 1000) {
            //assuming that windows doesn't get mad that i keep setting the position of this window (task manager says 0% cpu (ok yeah idk about that))
            if(tween) {
                //print((Date.now()-lastInteraction)/15.62500);
                print("moving down", (Date.now()-lastInteraction)/8.33333333-72);
                SetWindowPos(hwnd, NULL, 0, Math.min((Date.now()-lastInteraction)/8.33333333-72,0), 0, 0, SWP_NOSIZE | SWP_NOZORDER);
            }//else {
            //    SetWindowPos(hwnd, NULL, 0, 0, 0, 0, SWP_NOSIZE | SWP_NOZORDER);
            //}
        }else {
            tween = false;
            //SetWindowPos(hwnd, NULL, 0, 0, 0, 0, SWP_NOSIZE | SWP_NOZORDER);
        }

        RedrawWindow(hwnd, 0, 0, 1920, 64, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
    }else if(msg == WM_MOUSEMOVE) {
        //RedrawWindow(hwnd, 0, 0, 1920, 64, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
        //lastInteraction = Date.now();
        if(!tween) {
            lastInteraction = Date.now();
        }
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
    //i gotta disable automatic DefWindowProcW
}

const wc = CreateWindowClass("WinClass", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_HANDWRITING);
wc.hIcon = wc.hIconSm = LoadIcon(NULL, IDI_QUESTION);

window = CreateWindow(WS_EX_TOOLWINDOW, wc, "toolbar ;)", WS_POPUP | WS_SYSMENU | WS_VISIBLE, 0, 0, 1920, 64, NULL, NULL, hInstance);