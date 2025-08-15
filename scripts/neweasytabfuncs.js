//aw shit i think this is wacom ONLY (yeah i have an XP-PEN i'm cooked (but not out, how does blender do it 🤔🤔🤔🤔 (the answer is probably hid)))

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        if(EasyTab_Load(hwnd) != EASYTAB_OK) {
            print("aw meeeeeeaaaaaaannnn this easytab shit didn't work");
            quit;
        }
    }else if(EasyTab_HandleEvent(hwnd, msg, lp, wp) == EASYTAB_OK) { //for some reason EasyTab_HandleEvent takes LPARAM and then WPARAM even though windows does WPARAM and then LPARAM
        let x, y, pressure, maxdp, buttons = [EasyTab_GetPosX(), EasyTab_GetPosY(), EasyTab_GetPressure(), EasyTab_GetMaxPressure(), EasyTab_GetButtons()];
        print(x, y, pressure, maxdp, buttons);
    }
    else if(msg == WM_DESTROY) {
        EasyTab_Unload();
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("wintab32lol", windowProc); //max classname length is 256 lol
wc.hCursor = LoadCursor(NULL, IDC_HAND); //LoadIcon(NULL, IDI_APPLICATION); //haha just learned that you can use icons instead
wc.hbrBackground = COLOR_WINDOW+1;

CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "just got a drawing pad thingy", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 512, 512, NULL, NULL, hInstance);