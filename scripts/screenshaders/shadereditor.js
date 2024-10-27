//for later:
//https://learn.microsoft.com/en-us/windows/win32/controls/create-a-list-view-control
//https://learn.microsoft.com/en-us/windows/win32/api/commctrl/nf-commctrl-initcommoncontrolsex
//https://github.com/MicrosoftDocs/win32/blob/docs/desktop-src/Controls/create-an-owner-drawn-list-box.md
//https://learn.microsoft.com/en-us/windows/win32/shell/datascenarios#copying-the-contents-of-a-dropped-file-into-an-application
//https://learn.microsoft.com/en-us/windows/win32/dataxchg/using-the-clipboard <-----

//https://stackoverflow.com/questions/12345435/drag-and-drop-support-for-win32-gui
//https://learn.microsoft.com/en-us/windows/win32/controls/list-view-control-reference?redirectedfrom=MSDN
//https://www.codeproject.com/Articles/1298/Rearrange-rows-in-a-ListView-control-by-drag-and-d
//https://devblogs.microsoft.com/oldnewthing/20080311-00/?p=23153

//https://www.youtube.com/watch?v=GAFZHOpFWIo
//https://www.youtube.com/watch?v=LKXAIuCaKAQ
//https://www.youtube.com/watch?v=VEnglRKNHjU

//https://youtu.be/VEnglRKNHjU?t=273

//https://stackoverflow.com/questions/39731497/create-window-without-titlebar-with-resizable-border-and-without-bogus-6px-whit
//https://stackoverflow.com/questions/2398746/removing-window-border?rq=3

const w = 800;
const h = 600;

//whachu fucking know about 

function loadwicawndfuggetaboutit() {
    const wic = InitializeWIC(); ScopeGUIDs(wic);
    const bitmp = wic.LoadBitmapFromFilename(__dirname+"/shadereditor.png", wic.GUID_WICPixelFormat32bppPBGRA, 0);
    const bits = bitmp.GetPixels(wic);
    bitmp.Release();
    wic.Release();

    return bits;
}

const drawing = loadwicawndfuggetaboutit();

function OtherWindowProc(hwnd, msg, wp, lp) {
    let change = 0;
    if(msg == WM_CREATE) {
        //DwmExtendFrameIntoClientArea(hwnd, -1, -1, -1, -1); //nothing happened lol
    }else if(msg == WM_MOUSEHOVER) { //bruh you need to use TrackMouseEvent if i want to receive this event https://learn.microsoft.com/en-us/windows/win32/inputdev/wm-mousehover
        SetWindowLongPtr(hwnd, GWL_STYLE, GetWindowLongPtr(hwnd, GWL_STYLE) | WS_BORDER | WS_THICKFRAME);
        change = 1;
    }else if(msg == WM_MOUSELEAVE) {
        SetWindowLongPtr(hwnd, GWL_STYLE, GetWindowLongPtr(hwnd, GWL_STYLE) ^ (WS_BORDER | WS_THICKFRAME));
        change = true;
    }
    else if(msg == WM_DESTROY) {
        print("quit?");
        //SetWindowPos(hwnd, NULL, Math.random()*300, Math.random()*300, NULL, NULL, SWP_NOSIZE | SWP_NOZORDER);
        //return -1; //aw man i thought that i could stop DefWindowProc and it wouldn't close the window (but the only times i've ever "done" that was 3 years ago when i used SFML's events to move the window instead of calling RenderWindow::close())
        PostQuitMessage(0);
    }

    print(msg, "rvents?");

    if(change) {
        print(change);
        const rect = GetWindowRect(hwnd);
        SetWindowPos(hwnd, NULL, rect.left, rect.top+5, rect.right-rect.left, rect.bottom-rect.top+5, SWP_NOMOVE);
    }
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        //DragAcceptFiles(hwnd, true); //you can just use WS_EX_ACCEPTFILES
        uxtheme = DllLoad("UxTheme.dll");
        print(uxtheme("IsAppThemed", 0, [], [], RETURN_NUMBER)); //oh hell yeah it's one (https://learn.microsoft.com/en-us/windows/win32/api/uxtheme/nf-uxtheme-isappthemed)
        print(uxtheme("IsThemeActive", 0, [], [], RETURN_NUMBER));
        let result = uxtheme("SetWindowTheme", 3, [hwnd, NULL, NULL], [VAR_INT, VAR_WSTRING, VAR_WSTRING], RETURN_NUMBER); //NO FUCKING WAY?!
        print(result, "result");
        DwmSetWindowAttribute(hwnd, DWMWA_CAPTION_COLOR, RGB(24, 24, 24)); //hell yeah this shit tuff asf (dark title bar)[doesn't work if you get rid of the window theme tho]
        
        let otherwc = CreateWindowClass("otherw", OtherWindowProc);
        otherwc.hbrBackground = COLOR_BACKGROUND+1;
        otherwc.hCursor = LoadCursor(NULL, IDC_HAND);

        otherwnd = CreateWindow(NULL, otherwc, NULL, (WS_SIZEBOX | WS_CHILD | WS_VISIBLE) ^ (WS_BORDER | WS_THICKFRAME), 0, 325, w, h-325, hwnd, NULL, hInstance); //why can'yt you do WS_POPUP with WS_CHILD
        print("closed otherwnd");
    }else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);
        StretchDIBits(ps.hdc, 0, 0, w, h, 0, 0, w, h, drawing, w, h, 32, BI_RGB, SRCCOPY); //using stretchdibits because i didn't add SetDIBitsToDevice lol
        EndPaint(hwnd, ps);
    }else if(msg == WM_DROPFILES) { //according to this you can't drag and drop from a 32 bit app to a 64 bit one with WM_DROPFILES https://stackoverflow.com/questions/51204851/dragdrop-event-wm-dropfiles-in-c-gui
        //also yeah there's COM drag&drop stuff but idk if i can be bothered to do all that just yet 
        print(wp, lp); //wp is the HDROP parameter we're looking for 👀
        const pt = DragQueryPoint(wp);
        print(pt);
        const files = DragQueryFile(wp, -1); //oh hell yeah'
        print(files);
        const filenames = [];
        for(let i = 0; i < files; i++) {
            filenames[i] = DragQueryFile(wp, i);
        }

        print(filenames);

        DragFinish(wp); //DragFinish to HDROP is as DeleteDC is to memDC (analogymaxxing)
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0); //but it refused.
    }
}

const wc = CreateWindowClass("winclass", windowProc);
print(COLOR_BACKGROUND);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_ACCEPTFILES, wc, "shadereditor like renderdoc", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);
//print("sigma?");