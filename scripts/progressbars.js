//aw it doesn't look like a normal progress bar because i have to enable common controls 6 when compiling

let prog;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        //EnableVisualStyles();
        //InitCommonControlsEx(ICC_WIN95_CLASSES);
                        //oopsie i was missing the progress related macros/consts
        prog = CreateWindow(NULL, PROGRESS_CLASS, "", WS_VISIBLE | WS_CHILD | PBS_SMOOTH | PBS_MARQUEE, 0, 256, 512, 64, hwnd, 0, hInstance);
        SendMessage(prog, PBM_SETRANGE, 0, MAKELPARAM(0, 100));
        SendMessage(prog, PBM_SETSTEP, 10, 0);
        SendMessage(prog, PBM_SETPOS, 25, 0);
    }else if(msg == WM_LBUTTONDOWN) {
        SendMessage(prog, PBM_STEPIT, 0, 0); 
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("pgbrsfj", windowProc); //max classname length is 256 lol
wc.hCursor = LoadCursor(NULL, IDC_HAND); //LoadIcon(NULL, IDI_APPLICATION); //haha just learned that you can use icons instead
wc.hbrBackground = COLOR_WINDOW+1;

CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "just realized that i've never made a win32 progress bar (aw idk why it doesn't show up like normal)", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 512, 512, NULL, NULL, hInstance);