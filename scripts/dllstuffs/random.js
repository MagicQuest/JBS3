print(EnableVisualStyles(), "visual styles", gl=GetLastError(), _com_error(gl));

const w = 800;
const h = 600;

let uxtheme, comctl32;
let prog, butt;

let ab = new Uint32Array([8, ICC_PROGRESS_CLASS]); //dwSize is sizeof(INITCOMMONCONTROLSEX) which is 8
/*
typedef struct tagINITCOMMONCONTROLSEX {
    DWORD dwSize;             // size of this structure
    DWORD dwICC;              // flags indicating which classes to be initialized
} INITCOMMONCONTROLSEX, *LPINITCOMMONCONTROLSEX;
*/
comctl32 = DllLoad("Comctl32.dll");
print(comctl32("InitCommonControlsEx", 1, [PointerFromArrayBuffer(ab)], [VAR_INT], RETURN_NUMBER));
//print(InitCommonControlsEx(ICC_PROGRESS_CLASS));

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {

        uxtheme = DllLoad("UxTheme.dll");
        print(uxtheme("IsAppThemed", 0, [], [], RETURN_NUMBER)); //oh hell yeah it's one (https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-isappthemed)
        print(uxtheme("IsThemeActive", 0, [], [], RETURN_NUMBER));
        let result = uxtheme("SetWindowTheme", 3, [hwnd, NULL, NULL], [VAR_INT, VAR_WSTRING, VAR_WSTRING], RETURN_NUMBER); //NO FUCKING WAY?!
                                        //passing both NULLs removed the current theme or some shit (https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-setwindowtheme#remarks)
        print(result, "S_OK?");
        // DwmSetWindowAttribute(hwnd, DWMWA_CAPTION_COLOR, RGB(24, 24, 24)); //aw you aren't allowed to change the titlebar like this when using themes (or something idk lol)
        prog = CreateWindow(NULL, PROGRESS_CLASS, "", WS_VISIBLE | WS_CHILD | PBS_SMOOTH /*| PBS_MARQUEE*/, 0, 256, 512, 64, hwnd, 0, hInstance);
        SendMessage(prog, PBM_SETRANGE, 0, MAKELPARAM(0, 100));
        SendMessage(prog, PBM_SETSTEP, 10, 0);
        SendMessage(prog, PBM_SETPOS, 25, 0);
        butt = CreateWindow(NULL, WC_BUTTON, "OK!", WS_VISIBLE | WS_CHILD, 0, 0, 200, 100, hwnd, 1, hInstance);
    }else if(msg == WM_COMMAND) {
        if(wp == 1) {
            SendMessage(prog, PBM_STEPIT, 0, 0); 
        }
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "visual styles test?", /*WS_POPUP | WS_CAPTION |*/ WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);