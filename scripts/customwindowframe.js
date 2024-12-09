//https://stackoverflow.com/questions/56222386/drawtext-on-windows-title-bar-no-longer-works
//https://learn.microsoft.com/en-us/windows/win32/dwm/customframe
//this where i got my INFO from

//the viena soundfont editor looks kida lit with their nonclient area drawing (plus i guess unreal does it too)

let window;
const width = 500;
const height = 500;

const icon = LoadIcon(NULL, IDI_QUESTION);

function DWMWindowProc(hwnd, msg, wp, lp) {
    let [fCallDWP, lRet] = DwmDefWindowProc(hwnd, msg, wp, lp);
    fCallDWP = !fCallDWP;
    //print(fCallDWP, lRet);

    if(msg == WM_CREATE) {
        window = hwnd;
        let r = GetWindowRect(hwnd);
        SetWindowPos(hwnd, NULL, r.left, r.top, r.right-r.left, r.bottom-r.top, SWP_FRAMECHANGED);

        fCallDWP = true;
        lRet = 0;
    }

    if(msg == WM_ACTIVATE) {
        print(DwmExtendFrameIntoClientArea(hwnd, 8,27,8,20), "should be 0");
        fCallDWP = true;
        lRet = 0;
    }

    if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);
        DrawIcon(ps.hdc, 0, 0, icon); //LO!
        EndPaint(hwnd, ps);
        fCallDWP = true;
        lRet = 0;
    }

    if ((msg == WM_NCCALCSIZE) && (wp == true))
    {
        // Calculate new NCCALCSIZE_PARAMS based on custom NCA inset.
       //NCCALCSIZE_PARAMS* pncsp = reinterpret_cast<NCCALCSIZE_PARAMS*>(lParam);

       //pncsp->rgrc[0].left = pncsp->rgrc[0].left + 0;
       //pncsp->rgrc[0].top = pncsp->rgrc[0].top + 0;
       //pncsp->rgrc[0].right = pncsp->rgrc[0].right - 0;
       //pncsp->rgrc[0].bottom = pncsp->rgrc[0].bottom - 0;

       NCCALCSIZE_PARAMS(lp);

       lRet = 0;

       //// No need to pass the message on to the DefWindowProc.
       fCallDWP = false;
       print("no call");
    }
    
    if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }

    return [fCallDWP, lRet];
}

function appWinProc(hwnd,msg,wp,lp) {
    switch(msg) {
        case WM_PAINT:
            print("[aiont")
            break;
        default:
            return DefWindowProc(hwnd,msg,wp,lp);
    }
    return 0;
}

function windowProc(hwnd, msg, wp, lp) {
    let [fCallDWP, lRet] = DWMWindowProc(hwnd,msg,wp,lp);
    if(fCallDWP) {
        //real window proc
        //print(DefWindowProc(hwnd, msg, wp, lp));
        lRet = appWinProc(hwnd,msg,wp,lp)
    }
    //print(lRet);
    return lRet;
}

const wc = CreateWindowClass("DWM", windowProc);
wc.DefWindowProc = false; //jbs automatically returns DefWindowProcW so i might actually disable that fully and expose the function
//not doing hIcon because apparently i'd have to draw it myself
wc.hCursor = LoadCursor(NULL, IDC_HANDWRITING);
print(CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "custom window frame dwm", WS_OVERLAPPEDWINDOW | WS_VISIBLE, screenWidth/2-width/2, screenHeight/2-height/2, width, height, NULL, NULL, hInstance), "window");