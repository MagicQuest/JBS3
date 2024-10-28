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

function closure() { //this gotta be the only good reason to use a closure
    const wm = {}; //with a closure im using wm like it's static!!!
    Object.entries(globalThis).filter(([key, value]) => {
        let k = key.indexOf("WM_") == 0;
        k && (wm[value] = key); //since Object.entries returns stuff like [["WM_PAINT", 0], ["WM_CREATE", 1]] im just setting the values directly (also im swapping key and value here so it's easier to get the name of the message by the number)
        return k;
    });

    function Int_To_WM(msg) {
        return wm[msg];
    }
    return Int_To_WM;
}

const Int_To_WM = closure();

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

class GDI {
    static toCOLOR16s(r, g, b) {
        return [(r << 8) | r, (g << 8) | g, (b << 8) | b];
    }
    static Matrix3x2FToXFORM(matrix) {
        //print(matrix);
        return {
            "eM11": matrix._11,
            "eM12": matrix._12,
            "eM21": matrix._21,
            "eM22": matrix._22,
            "eDx": matrix.dx,
            "eDy": matrix.dy,
        };
    }    
}

class OtherWindow { //https://www.youtube.com/watch?v=24Eh2-DZTgQ
    hover = false;
    hoverTimer = 0;
    static resizeHeight = 10;
    
    static gradientRectVertices = [
        [0, 0, ...GDI.toCOLOR16s(0, 255, 0), 0], //im using (0, 0) here and (1, resizeHeight) as the upper-left and bottom-right so i can transform these hoes later (with SaveDC)
        [1, OtherWindow.resizeHeight, ...GDI.toCOLOR16s(0, 0, 255), 0],
    ];
    static gRect = [
        [0, 1], //indexes of the upper-left and bottom-right vertices (of gradientRectVertices)
    ];

    constructor(hwnd) {
        this.parent = hwnd;
        let otherwc = CreateWindowClass("otherw", this.windowProc.bind(this)); //OOPS i didn't bind this and my variables were global?! (i was gonna make em static but it looked ugly lmao)
        otherwc.hbrBackground = COLOR_BACKGROUND;
        otherwc.hCursor = LoadCursor(NULL, IDC_HAND);
        otherwc.DefWindowProc = false;
        otherwc.style = CS_HREDRAW | CS_VREDRAW;

        CreateWindow(NULL, otherwc, NULL, (WS_SIZEBOX | WS_CHILD | WS_VISIBLE) ^ (WS_BORDER | WS_THICKFRAME), 0, 325, w, h-325, hwnd, NULL, hInstance); //why can'yt you do WS_POPUP with WS_CHILD
        print("closed otherwnd");
    }

    windowProc(hwnd, msg, wp, lp) { //OK LOWKEY i decided not to use WM_NCPAINT because i can just use WM_NCHITTEST to say when it's resizable
        //let change = 0;
        let lastHover = this.hover;
        if(msg == WM_CREATE) {
            //DwmExtendFrameIntoClientArea(hwnd, -1, -1, -1, -1); //nothing happened lol
            //DwmExtendFrameIntoClientArea(hwnd, 530, 50, 50, 50); //nothing happened lol
        }//else if(msg == WM_MOUSEHOVER) { //bruh you need to use TrackMouseEvent if i want to receive this event https://learn.microsoft.com/en-us/windows/win32/inputdev/wm-mousehover
        else if(msg == WM_MOUSEMOVE) { //im using mousemove instead of mousehover because when you use TrackMouseEvent the mouse has to already be over the window according to MSDN: This flag (TME_HOVER) is ignored if the mouse pointer is not over the specified window or area.
            //SetWindowLongPtr(hwnd, GWL_STYLE, GetWindowLongPtr(hwnd, GWL_STYLE) | WS_THICKFRAME);
            this.hover = true;
        }else if(msg == WM_MOUSELEAVE) {
            //SetWindowLongPtr(hwnd, GWL_STYLE, GetWindowLongPtr(hwnd, GWL_STYLE) ^ (WS_THICKFRAME));
            this.hover = false;
        }/*else if(msg == WM_NCPAINT) { //nonclient paint! https://learn.microsoft.com/en-us/windows/win32/gdi/wm-ncpaint
            //const {left, right, top, bottom, complexity} = GetRgnBox(wp);
            //if(complexity > NULLREGION) { //NULLREGION is 1 but complexity can be 0 if it failed
                //const hdc = GetDCEx(hwnd, wp, DCX_WINDOW | DCX_INTERSECTRGN); //nah the google says to use GetWindowDC() https://stackoverflow.com/questions/5409354/getdcex-returns-null-before-form-show-drawing-on-the-non-client-area
                DefWindowProc(hwnd, msg, wp, lp);
                
                const hdc = GetWindowDC(hwnd);
                if(hdc) { //nothing happens if hdc is 0 but im adding the check anyway
                    const {left, right, top, bottom} = GetWindowRect(hwnd);
                    //const topleft = {x: left, y: top};
                    //ScreenToClient(hwnd, topleft);
                    //print(left, right, top, bottom, topleft);
                    const oldbrush = SelectObject(hdc, GetStockObject(DC_BRUSH));
                    SetDCBrushColor(hdc, RGB(127, 255, 127));
                    FillRect(hdc, 0, 0, right, bottom, NULL); //COLOR_BACKGROUND+1); //lol idk what that was doing
                    //print(wp, GetRgnBox(wp), FillRgn(hdc, wp, NULL), "fillrgn");
                    SelectObject(hdc, oldbrush);
                    ReleaseDC(hwnd, hdc);
                }

                return 0;
            //}
            //print(GetRgnBox(wp));
        }*/else if(msg == WM_PAINT) {
            const {left, right, top, bottom} = GetWindowRect(hwnd);

            const ps = BeginPaint(hwnd);
            FillRect(ps.hdc, 0, 0, right, bottom, COLOR_BACKGROUND); //sometimes it doesn't automagically draw the background color
            SaveDC(ps.hdc);
            SetGraphicsMode(ps.hdc, GM_ADVANCED);
            SetWorldTransform(ps.hdc, GDI.Matrix3x2FToXFORM(Matrix3x2F.Scale(w, 1, 0, 0))); //hell yeah        
            GradientFill(ps.hdc, OtherWindow.gradientRectVertices, OtherWindow.gRect, GRADIENT_FILL_RECT_V); //lowkey i did all this but i'm probably not gonna use gdi for this lmao
            RestoreDC(ps.hdc);
            EndPaint(hwnd, ps);
        }/*else if(msg == WM_TIMER) {
            KillTimer(hwnd, 1);
            this.hoverTimer = 0;
            const rect = GetWindowRect(hwnd);
            //SetWindowLongPtr(hwnd, GWL_STYLE, GetWindowLongPtr(hwnd, GWL_STYLE) ^ (WS_THICKFRAME));
            //SetWindowPos(hwnd, NULL, rect.left, rect.top+5, rect.right-rect.left, rect.bottom-rect.top-10, SWP_NOMOVE | SWP_NOZORDER);
        }*/else if(msg == WM_NCHITTEST) { //https://learn.microsoft.com/en-us/windows/win32/inputdev/wm-nchittest       https://devblogs.microsoft.com/oldnewthing/20110218-00/?p=11453
            const mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)};
            ScreenToClient(hwnd, mouse); //[in] hwnd, [out] mouse!!! this function returns nothing!!! (lowkey i did it this way because i wanted to know if i could (which i mean since javascript objects are taken by reference of course it works lol))
            print(mouse.y, OtherWindow.resizeHeight);
            if(mouse.y < OtherWindow.resizeHeight) {
                return HTTOP;
            }else {
                return HTCLIENT;
            }
        }
        else if(msg == WM_DESTROY) {
            print("quit?");
            //SetWindowPos(hwnd, NULL, Math.random()*300, Math.random()*300, NULL, NULL, SWP_NOSIZE | SWP_NOZORDER);
            //return -1; //aw man i thought that i could stop DefWindowProc and it wouldn't close the window (but the only times i've ever "done" that was 3 years ago when i used SFML's events to move the window instead of calling RenderWindow::close())
            PostQuitMessage(0);
        }
        
        //print(msg, Int_To_WM(msg));//"rvents?");
        
        if(this.hover != lastHover) {
            //print(this.hover);
            if(this.hover) {
                const rect = GetWindowRect(hwnd);
                //KillTimer(hwnd, 1); //i don't think anything bad happens if you call KillTimer without a valid timer id
                //this.hoverTimer = 0;
                TrackMouseEvent(TME_LEAVE, hwnd, NULL); //track mouse event only works when the mouse is over the window! (also: The application must call TrackMouseEvent when the mouse reenters its window if it requires further tracking of mouse hover behavior.)
                //print(TrackMouseEvent(TME_LEAVE | TME_QUERY, hwnd, NULL));
                SetWindowPos(hwnd, NULL, rect.left, rect.top+5, rect.right-rect.left, rect.bottom-rect.top+10, SWP_NOMOVE | SWP_NOZORDER);
            }else {
                //KillTimer(hwnd, 1); //i don't think anything bad happens if you call KillTimer without a valid timer id
                //this.hoverTimer = SetTimer(hwnd, 1, 200);
                //SetWindowPos(hwnd, NULL, rect.left, rect.top+5, rect.right-rect.left, rect.bottom-rect.top-10, SWP_NOMOVE | SWP_NOZORDER);
            }
        }

        return DefWindowProc(hwnd, msg, wp, lp);
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
        
        otherwnd = new OtherWindow(hwnd);
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