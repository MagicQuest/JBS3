//lmao this file isn't so random anymore

//https://github.com/malortie/Tutorials/blob/master/tutorials/cpp/win32/controls/progressbar/ProgressBar.cpp
//https://www.codeproject.com/Articles/620045/Custom-Controls-in-Win-API-Visual-Styles
//https://stackoverflow.com/questions/39319441/parts-drawn-with-drawthemebackground-on-windows-10-are-not-correct
//https://stackoverflow.com/questions/34004819/windows-10-close-minimize-and-maximize-buttons
//https://stackoverflow.com/questions/2841180/how-to-add-an-extra-button-to-the-windows-title-bar/2841197#2841197
//https://learn.microsoft.com/en-us/windows/win32/controls/using-visual-styles
//https://learn.microsoft.com/en-us/windows/win32/controls/uxctl-ref

eval(require("fs").read(__dirname+"/marshallib.js"));

class Rect extends memoobjectidk {
    //oh shoot these types have to be in the right order
    static types = {left: "LONG", top: "LONG", right: "LONG", bottom: "LONG"}; //strings because i want to know if they are unsigned (when the first letter is U (i can't be bothered to make each key in sizeof an object))
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}


print(EnableVisualStyles(), "visual styles", gl=GetLastError(), _com_error(gl));

const w = 800;
const h = 600;

let uxtheme, comctl32;//, USER32;
let prog, butt;
let htheme;

//const BP_PUSHBUTTON = 1; //per line 64 of <vsstyle.h>

//enum BUTTONPARTS {
	BP_PUSHBUTTON = 1 //per line 64 of <vsstyle.h>
	BP_RADIOBUTTON = 2
	BP_CHECKBOX = 3
	BP_GROUPBOX = 4
	BP_USERBUTTON = 5
	BP_COMMANDLINK = 6
	BP_COMMANDLINKGLYPH = 7
	BP_RADIOBUTTON_HCDISABLED = 8
	BP_CHECKBOX_HCDISABLED = 9
	BP_GROUPBOX_HCDISABLED = 10
	BP_PUSHBUTTONDROPDOWN = 11
//};

//enum PUSHBUTTONSTATES {
	PBS_NORMAL = 1
	PBS_HOT = 2
	PBS_PRESSED = 3
	PBS_DISABLED = 4
	PBS_DEFAULTED = 5
	PBS_DEFAULTED_ANIMATING = 6
//};


const DFC_BUTTON = 4;
const DFCS_BUTTONPUSH = 0x0010;
const DFCS_PUSHED = 0x0200;

let ab = new Uint32Array([8, ICC_PROGRESS_CLASS]); //dwSize is sizeof(INITCOMMONCONTROLSEX) which is 8
/*
typedef struct tagINITCOMMONCONTROLSEX { //what's the alignment tho
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
        //USER32 = DllLoad("user32.dll");
        print(uxtheme("IsAppThemed", 0, [], [], RETURN_NUMBER)); //oh hell yeah it's one (https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-isappthemed)
        print(uxtheme("IsThemeActive", 0, [], [], RETURN_NUMBER));
        
        let blankstr = "#######################################################################";

        const wchar_t = NewWCharStrPtr(blankstr);
        uxtheme("GetCurrentThemeName", 6, [wchar_t, blankstr.length, NULL, NULL, NULL, NULL], [VAR_INT, VAR_INT, VAR_INT, VAR_INT, VAR_INT, VAR_INT], RETURN_NUMBER);
        print("theme name", WStringFromPointer(wchar_t));
        DeleteArrayPtr(wchar_t);

                                                                //oops, since im passing [hwnd, NULL, NULL] it should be [VAR_INT, VAR_INT, VAR_INT] as using VAR_WSTRING will convert the value passed into a string
        let result = uxtheme("SetWindowTheme", 3, [hwnd, NULL, NULL], [VAR_INT, VAR_WSTRING, VAR_WSTRING], RETURN_NUMBER); //NO FUCKING WAY?!
                                        //passing both NULLs removed the current theme or some shit (https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-setwindowtheme#remarks)
        print(result, "S_OK?");
        // DwmSetWindowAttribute(hwnd, DWMWA_CAPTION_COLOR, RGB(24, 24, 24)); //aw you aren't allowed to change the titlebar like this when using themes (or something idk lol)
        //DwmExtendFrameIntoClientArea(hwnd, -1, -1, -1, -1); //wtf why did this make the window slightly transparent           https://learn.microsoft.com/en-us/windows/win32/dwm/customframe
        prog = CreateWindow(NULL, PROGRESS_CLASS, "", WS_VISIBLE | WS_CHILD | PBS_SMOOTH /*| PBS_MARQUEE*/, 0, 256, 512, 64, hwnd, 0, hInstance);
        SendMessage(prog, PBM_SETRANGE, 0, MAKELPARAM(0, 100));
        SendMessage(prog, PBM_SETSTEP, 10, 0);
        SendMessage(prog, PBM_SETPOS, 25, 0);
        butt = CreateWindow(NULL, WC_BUTTON, "OK!", WS_VISIBLE | WS_CHILD, 0, 0, 200, 100, hwnd, 1, hInstance);

        htheme = uxtheme("OpenThemeData", 2, [NULL, "BUTTON"], [VAR_INT, VAR_WSTRING], RETURN_NUMBER);
    }else if(msg == WM_COMMAND) {
        if(wp == 1) {
            SendMessage(prog, PBM_STEPIT, 0, 0); 
        }
    }else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);
        const lprect = new Rect(new Uint8Array([
            0, 0, 0, 0, 
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
        ]));
        lprect.left = 200; //assignments directly change data
        lprect.top = 0;
        lprect.right = 200+200;
        lprect.bottom = 100;
        print(lprect);
        //https://stackoverflow.com/questions/31270821/are-we-responsible-for-drawing-the-caption-when-using-windows-api-to-draw-a-butt
        //https://github.com/RRUZ/vcl-styles-utils/blob/master/Docs/AeroStyle.xml
        //https://stackoverflow.com/questions/2764120/custom-draw-button-using-uxtheme-dll
        //uxtheme("DrawThemeBackground", 6, [htheme, ps.hdc, BP_PUSHBUTTON, PBS_NORMAL, PointerFromArrayBuffer(lprect.data), NULL], [VAR_INT, VAR_INT, VAR_INT, VAR_INT, VAR_INT, VAR_INT], RETURN_NUMBER);
        //print(USER32("DrawFrameControl", 4, [ps.hdc, PointerFromArrayBuffer(lprect.data), DFC_BUTTON, DFCS_BUTTONPUSH | DFCS_PUSHED], [VAR_INT, VAR_INT, VAR_INT, VAR_INT], RETURN_NUMBER));
        DrawFrameControl(ps.hdc, lprect.left, lprect.top, lprect.right, lprect.bottom, DFC_BUTTON, DFCS_BUTTONPUSH); //lol i just added it
        let rect = GetClientRect(hwnd); //https://stackoverflow.com/questions/14994012/how-draw-caption-in-alttab-switcher-when-paint-custom-captionframe
        rect.top += 100;
        rect.bottom = rect.top + GetSystemMetrics(SM_CYCAPTION) + GetSystemMetrics(SM_CYEDGE)*2;
        DrawCaption(hwnd, ps.hdc, rect.left, rect.top, rect.right, rect.bottom, DC_GRADIENT | DC_TEXT | DC_ACTIVE | DC_ICON); //lowkey don['t know exactly what this do]es
        EndPaint(hwnd, ps);
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "visual styles test?", /*WS_POPUP | WS_CAPTION |*/ WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);