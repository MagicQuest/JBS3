const w = 800;
const h = 600;

let controls = [];
let s = CreateSolidBrush(RGB(24, 24, 24)); //GetSysColor(COLOR_BACKGROUND));

const ID_EXIT = 2100; //random number lol
const ID_RESET = 2101; //random number lol

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        SetSysColors(2, [COLOR_WINDOW, COLOR_BACKGROUND], [RGB(0, 127, 127), RGB(24, 24, 192)]);//GetSysColor(COLOR_BACKGROUND), GetSysColor(COLOR_WINDOW)]);
        SoundSentry(); //does this do anything?
        //print(InitCommonControlsEx(ICC_ANIMATE_CLASS), "gell yeh"); //idk if you have to use this anymore in this day and age
        controls.push(CreateWindow(NULL, ANIMATE_CLASS, NULL, ACS_AUTOPLAY | ACS_TIMER | WS_BORDER | WS_CHILD | WS_VISIBLE | WS_CAPTION, 0, 0, 0, 0, hwnd, 1, hInstance)); //oops this wasn't working earlier because i forgot WS_CHILD and WS_VISIBLE
        SendMessage(controls[controls.length-1], ACM_OPEN, 0, __dirname+"/chomik_msrle.avi"); //Animate_Open //"E:/KoolStuff/KoolTemp/faze20001-0024.avi");
        print(__dirname+"/chomik.avi"); //faze20001-0024.avi
        //damn this chomik.avi i had to use an older version of blender (before 4.2) because they got rid of the [AVI Raw] file format export option
        //nah this damn raw avi shit is way too big bruh it's 68x89 (30 fps) and STILL 3.7 MB
        controls.push(CreateWindow(NULL, ANIMATE_CLASS, NULL, ACS_AUTOPLAY | ACS_TIMER | ACS_TRANSPARENT | WS_CHILD | WS_VISIBLE, w-256, 0, 0, 0, hwnd, 2, hInstance)); //ACS_TRANSPARENT only seems to work on like totally magenta backgrounds (https://forums.codeguru.com/showthread.php?108274-CAnimateCtrl-problem-with-AVI-not-having-a-transparent-background) (https://learn.microsoft.com/en-us/windows/win32/controls/animation-control-styles)
        SendMessage(controls[controls.length-1], ACM_OPEN, 0, __dirname+"/upload.avi"); //__dirname+"/faze/faze20001-0024.avi");
        //controls.push(CreateWindow(WS_EX_LAYERED, ANIMATE_CLASS, NULL, ACS_AUTOPLAY | ACS_TIMER | WS_CHILD | WS_VISIBLE, w-256, 0, 0, 0, hwnd, 2, hInstance)); //ACS_TRANSPARENT only seems to work on like totally magenta backgrounds (https://forums.codeguru.com/showthread.php?108274-CAnimateCtrl-problem-with-AVI-not-having-a-transparent-background) (https://learn.microsoft.com/en-us/windows/win32/controls/animation-control-styles)
        //SetLayeredWindowAttributes(controls[controls.length-1], RGB(255, 0, 255), 127, LWA_ALPHA);
        
        let hMenu = CreateMenu();
        let hFileMenu = CreateMenu();

        AppendMenu(hFileMenu, MF_STRING, ID_EXIT, "Exit");
        AppendMenu(hFileMenu, MF_SEPARATOR, NULL, "NULL");
        AppendMenu(hMenu, MF_POPUP, hFileMenu, "File");
        AppendMenu(hMenu, MF_STRING, ID_RESET, "Reset System Colors LMAO");

        SetMenu(hwnd, hMenu);

        //oh hell yeah i found upload.avi from (https://github.com/microsoftarchive/msdn-code-gallery-microsoft/tree/master/OneCodeTeam/Windows%20common%20controls%20demo%20(CppWindowsCommonControls)/%5BC%2B%2B%5D-Windows%20common%20controls%20demo%20(CppWindowsCommonControls)/C%2B%2B) at the bottom of this page https://learn.microsoft.com/en-us/windows/win32/controls/create-rebar-controls#related-topics
        //upload.avi uses msrle instead of rawvideo and i think it's smaller (aw damn i thought it wouldn't come with a cost that shit look worse than rawvideo LMAO)
    }else if(msg == WM_CTLCOLORSTATIC) { //using ACS_TRANSPARENT calls WM_CTLCOLORSTATIC (you don't actually have to handle it tho!)
        //wp is HDC
        //lp is the hwnd of the control
        print(lp, controls[1]);
        if(lp == controls[1]) { //idk how this works bruh nothing is happening
            SetBkColor(wp, GetSysColor(COLOR_BACKGROUND)); //hmmm this only works some of the time
            return 1; //idk what to return
        }
    }else if(msg == WM_COMMAND) {
        if(wp == ID_EXIT) {
            DestroyWindow(hwnd);
        }else if(wp == ID_RESET) {
            SetSysColors(2, [COLOR_BACKGROUND, COLOR_WINDOW], [0x00d4d0c8, RGB(255, 255, 255)]); //uh oh i already fucked my shit up and i don't know the default background color
        }
    }
    else if(msg == WM_DESTROY) {
        //SetSysColors(2, [COLOR_BACKGROUND, COLOR_WINDOW], [RGB(0, 127, 127), RGB(24, 24, 192)]);//GetSysColor(COLOR_BACKGROUND), GetSysColor(COLOR_WINDOW)]);
        PostQuitMessage(0);
    }

    //DefWindowProc(hwnd, msg, wp, lp);
    //return 0;
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);
//wc.DefWindowProc = false;

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "every common control", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);