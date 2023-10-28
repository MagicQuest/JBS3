let window;
let dc;
let screen;

let mouse = {x: 0,y: 0};

const bounds = 800;

let bitmap;
let b = false;

let font;

let size = 32;

function init(hwnd) {
    print("init")
    dc = GetDC(hwnd);
    screen = GetDC(NULL);
    window = hwnd;
    font = CreateFontSimple("Impact", 20, 40);
    bitmap = CreateCompatibleBitmap(screen, 16, 16);
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }else if(msg == WM_MOUSEWHEEL) {//if(WM_MOUSEWHEEL) { //WAIT HAS IT ALWAYS BEEN LKE THAT
        let wheel = HIWORD(wp);
        if(wheel) {
            if(wheel % 120 == 0) {
                //print("WHEEL", wheel);
                size += 16;
            }else if(wheel % 136 == 0) { //this doesn't seem 100% but it works like 80% so like
                size -= 16;
            }
        }
    }else if(msg == WM_CREATE) {
        init(hwnd);
    }
}

let i = 1;

let start = Date.now();

function loop() {
    if(GetKey(VK_ESCAPE)) {
        DestroyWindow(window);
    }else if((Date.now()-start) % 16 == 0){
        //FillRect(dc, 0, 0, bounds, bounds, NULL);
        mouse = GetCursorPos();

        let lastFont = SelectObject(dc, font);
        TextOut(dc, mouse.x, mouse.y, "NUMBER->"+i);
        TextOut(dc, 0, 250, "scroll up/down on this window to set the \"size\" of the icon"+i);
        SelectObject(dc, lastFont);

        //if(GetKeyDown("C")) {
            const memDC = CreateCompatibleDC(screen);
            SelectObject(memDC, bitmap);
            SetStretchBltMode(memDC, HALFTONE);
            //copying screen to bitmap
            StretchBlt(memDC, 0, 0, 16, 16, screen, mouse.x, mouse.y, size, size, SRCCOPY); //https://stackoverflow.com/questions/3144340/how-to-draw-on-given-bitmap-handle-c-win32
            const icon = HICONFromHBITMAP(bitmap);
            SendMessage(window, WM_SETICON, ICON_SMALL, icon); //haha dynamic icon??? -> dynamicicon.js
            SendMessage(GetConsoleWindow(), WM_SETICON, ICON_SMALL, icon); //setting icons
            //SelectObject(memDC, GetStockObject(DC_PEN));
            //SetDCPenColor(memDC, RGB(255,0,0));
            //FillRect(memDC, 0, 0, 32, 32)
            //SelectObject(memDC, GetStockObject(NULL_BRUSH));
            //Rectangle(memDC, 0, 0, 32, 32);
            //BitBlt(screen, mouse.x, mouse.y, 32, 32, memDC, 0, 0, SRCCOPY);
            //DestroyIcon(icon);
            DeleteDC(memDC);
            //if(i % 10 == 0) {
                InvalidateRect(NULL, mouse.x-1,mouse.y-1,mouse.x+size+1,mouse.y+size+1,true); //this part is really slow (rectangle, invalidaterect)
                
                    //i thought this would be faster but it was basically the same speed
                //const mDC = CreateCompatibleDC(screen);
                //SelectObject(mDC, CreateCompatibleBitmap(screen, size+1, size+1)); //LO
                //SelectObject(mDC, GetStockObject(DC_PEN));
                //SetDCPenColor(mDC, RGB(255,mouse.y/1080*255,mouse.x/1920*255));
                ////SelectObject(mDC, GetStockObject(NULL_BRUSH));
                //Rectangle(mDC, 0, 0, size+1, size+1);
                ////BitBlt(screen, mouse.x, mouse.y, size+1, size+1, mDC, 0, 0, SRCCOPY);
                //TransparentBlt(screen, mouse.x-1, mouse.y-1, size+1, size+1, mDC, 0, 0, size+1, size+1, RGB(255,255,255));
                //DeleteDC(mDC);

                let oldPen = SelectObject(screen, GetStockObject(DC_PEN));
                SetDCPenColor(screen, RGB(255,mouse.y/1080*255,mouse.x/1920*255));
                let oldBrush = SelectObject(screen, GetStockObject(NULL_BRUSH));
                Rectangle(screen, mouse.x-1, mouse.y-1, mouse.x+size+1, mouse.y+size+1);
                SelectObject(screen, oldBrush);
                SelectObject(screen, oldPen);
            //}
        //}
    
        i++;
    }
}

const WINCLASSEX = CreateWindowClass("WinClass"/*, init*/, windowProc, loop);
const icon = LoadIcon(NULL, IDI_ERROR);
WINCLASSEX.hCursor = LoadCursor(NULL, IDC_HAND);
WINCLASSEX.hIcon = icon;
WINCLASSEX.hIconSm = icon;

//print(WINCLASSEX);

CreateWindow(WS_EX_OVERLAPPEDWINDOW, WINCLASSEX, "dynamic icons?", WS_OVERLAPPEDWINDOW | WS_VISIBLE, 200, 200, bounds+16, bounds+39, NULL, NULL, hInstance);