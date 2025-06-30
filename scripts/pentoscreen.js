//twas feeling quirky and wanted to copy the blender feature where when you hold d, it lets you draw onto the viewport with your mouse
print("hold 'd' and click + drag to draw on the screen");
print("press ctrl to toggle if the text will be cleared or not");

class Wrapper {
    impl = undefined;
    location = undefined;
    constructor(implementation) {
        this.impl = implementation;
        this.internalPtr = implementation?.internalPtr;
        this.internalDXPtr = implementation?.internalDXPtr; //for d2d because i for some reason named it differently
    }
    GetImplementation() {
        return this.impl;
    }
    Release() {

    }
}

class AbstractBrush extends Wrapper {
    constructor(brush) { //0-255
        super(brush);
    }
    SetColor(r, g, b, a) { //0-255

    }
    /*{r: number, g: number, b: number, a: number}*/ GetColor() { //0-255

    }
}

class D2DSolidColorBrush extends AbstractBrush {
    constructor(r, g, b, a, d2d) {
        super(d2d.CreateSolidColorBrush(r/255, g/255, b/255, a/255));
    }
    SetColor(r, g, b, a) {
        this.impl.SetColor(r/255, g/255, b/255, a/255);
    }
    GetColor() {
        const {r, g, b, a} = this.impl.GetColor();
        return {r: r*255, g: g*255, b: b*255, a: a*255};
    }
    Release() {
        this.impl.Release();
    }
}

class GDIBrush extends AbstractBrush {
    constructor(r, g, b, a, unused) {
        super(CreateSolidBrush(RGB(r, g, b)));
        //this.brush =  //no alpha lol
    }
    SetColor(r,g,b,a) {
        //uhh wait a minute you can't set a gdi brush's color?
        //throw "gdi can't do allat";

        //nah hold on let's get smart
        DeleteObject(this.impl);
        this.impl = CreateSolidBrush(RGB(r, g, b));
    }
    GetColor() {
        const {lbColor: color} = GetObjectHBRUSH(this.impl); //insane syntax
        return {r: GetRValue(color), g: GetGValue(color), b: GetBValue(color), a: undefined};
    }
    Release() {
        DeleteObject(this.impl);
    }
}

class AbstractPainter extends Wrapper { //abstract
    constructor(painter) {
        super(painter);
    }
    BeginDraw() {

    }
    Clear(r, g, b, a) {

    }
    CreateSolidColorBrush(r, g, b, a) {

    }
    DrawLine(fromX, fromY, toX, toY, brush) {

    }
    EndDraw(options) {

    }
    Release() {

    }
}

class D2D extends AbstractPainter {
    constructor(hwnd) {
        super(createCanvas("d2d", ID2D1DeviceContextDComposition, hwnd));
    }
    BeginDraw() {
        this.impl.BeginDraw();
    }
    Clear(r, g, b, a = 255) {
        this.impl.Clear(r*255, g*255, b*255, a*255);
    }
    CreateSolidColorBrush(r, g, b, a = 255) {
        return new D2DSolidColorBrush(r, g, b, a, this.impl);
    }
    DrawLine(fromX, fromY, toX, toY, brush) {
        this.impl.DrawLine(fromX, fromY, toX, toY, brush.GetImplementation(), 2);
    }
    DrawLine(fromX, fromY, toX, toY, brush, width) {
        this.impl.DrawLine(fromX, fromY, toX, toY, brush.GetImplementation(), width);   
    }
    EndDraw(options) {
        this.impl.EndDraw(options);
    }
    Release() {
        this.impl.Release();
    }
}

class GDI extends AbstractPainter {
    constructor(hwnd) {
        super(GetDC(hwnd));
        this.hwnd = hwnd;
        //this.implementation = GetDC(hwnd);
    }
    BeginDraw() {};
    Clear(r, g, b, a) {
        //gdi actually can't clear so we'll just draw a rectangle that spans the entire window
        // const hwnd = WindowFromDC(this.impl);
        const {right: cx, bottom: cy} = GetClientRect(this.hwnd);
        const last = SelectObject(this.impl, GetStockObject(DC_BRUSH));
        SetDCBrushColor(RGB(r, g, b));
        FillRect(this.impl, 0, 0, cx, cy, NULL);
        SelectObject(this.impl, last);
    }
    CreateSolidColorBrush(r, g, b, a) {
        return new GDIBrush(r, g, b, a, undefined);
    }
    DrawLine(fromX, fromY, toX, toY, brush) {
        const last = SelectObject(this.impl, brush.GetImplementation());
        MoveTo(fromX, fromY);
        LineTo(toX, toY);
        SelectObject(this.impl, last);
    }
    EndDraw(options) {};
    Release() {
        //const hwnd = WindowFromDC(this.impl);
        ReleaseDC(this.hwnd, this.impl);
    }
}

let interactable = false;
let dontclear = false;
let mouse = {x: -1, y: -1, last: {x: -1, y: -1}};

let painter, brush;

//aw damn d2d's back buffer ruined my plan of just not erasing them (wait if i draw it twice it will be there for both buffers (inefficient!))

const randomid = 2000;

function DoMouseShit(x, y, flags) {
    mouse.last = {x: mouse.x, y: mouse.y};
    mouse.x = x;
    mouse.y = y;
    if((flags & MK_LBUTTON) == MK_LBUTTON) {
        const vec = {x: mouse.x - mouse.last.x, y: mouse.y - mouse.last.y};
        const mag = Math.sqrt(vec.x**2 + vec.y**2);
        const mathj = Math.max(Math.sqrt(vec.x**2 + vec.y**2), 50); //lol gotta clamp it to 50 so le math doesn't get mad lol
        print(mag, mathj, 2+(50-mathj)/50);
        painter.BeginDraw();
        painter.DrawLine(mouse.last.x, mouse.last.y, mouse.x, mouse.y, brush, 2+(50-mathj)/50);
        painter.EndDraw();
        painter.BeginDraw();
        painter.DrawLine(mouse.last.x, mouse.last.y, mouse.x, mouse.y, brush, 2+(50-mathj)/50);
        painter.EndDraw();
    }else if((flags & MK_RBUTTON) == MK_RBUTTON) {
        painter.BeginDraw();
        //wait how can i clear at a spot?
        //we're gonna try some bullshit
        const d2d = painter.GetImplementation();
        // const shape = d2d.CreateEllipseGeometry(D2D1.Ellipse(mouse.x - 10, mouse.y - 10, mouse.x + 10, mouse.y + 10));
        const shape = d2d.CreateEllipseGeometry(D2D1.Ellipse(mouse.x, mouse.y, 10, 10));
        const oldcolor = brush.GetColor();
        brush.SetColor(0, 0, 255, 1);
        d2d.PushLayer(new D2D1.LayerParameters(D2D1.InfiniteRect(), shape));
        d2d.Clear(0, 0, 0, 0);
        d2d.FillRectangle(0, 0, screenWidth, screenHeight, brush);
        d2d.PopLayer();
        brush.SetColor(oldcolor.r, oldcolor.g, oldcolor.b, oldcolor.a);
        d2d.FillGeometry(shape, brush);
        shape.Release();
        painter.EndDraw();
    }
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        painter = new D2D(hwnd);
        brush = painter.CreateSolidColorBrush(0, 96, 255);
        print(brush.GetColor());

        print(RegisterHotKey(hwnd, randomid, NULL, 'D'.charCodeAt(0)) == 1);

        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_HOTKEY) {
        if(!interactable) {
            print("D!");
            const flags = GetWindowLongPtr(hwnd, GWL_EXSTYLE);
            SetWindowLongPtr(hwnd, GWL_EXSTYLE, flags ^ WS_EX_TRANSPARENT);
            interactable = true;
            SetForegroundWindow(hwnd);
            //while(GetKey('D')) {
            //    const mouse = GetCursorPos();
            //    DoMouseShit(mouse.x, mouse.y, ((GetKey(VK_RBUTTON) != 0) << 1 | (GetKey(VK_LBUTTON)) != 0));
            //}
        }
    }else if(msg == WM_TIMER) {
        //if(GetKey('D')) {
        //    //if(!interactable) {
        //    //    SetWindowLongPtr(hwnd, GWL_EXSTYLE, WS_EX_NOREDIRECTIONBITMAP | WS_EX_LAYERED | WS_EX_TOPMOST);
        //    //    interactable = true;
        //    //}
        //}else if(interactable) {
        if(interactable) {
            if(!GetKey('D')) {
                const flags = GetWindowLongPtr(hwnd, GWL_EXSTYLE);
                SetWindowLongPtr(hwnd, GWL_EXSTYLE, flags | WS_EX_TRANSPARENT);
                interactable = false;
                //wait a second couldn't i just draw to another bitmap and draw that instead?
                if(dontclear) {
                    //dontclear = false;
                }else {
                    //clear
                    painter.BeginDraw();
                    painter.Clear(0, 0, 0, 0);
                    painter.EndDraw();
                    painter.BeginDraw();
                    painter.Clear(0, 0, 0, 0);
                    painter.EndDraw();
                }
            }
        }
        //if(GetKeyDown(VK_CONTROL)) {
        //    dontclear = !dontclear;
        //    print("contrl");
        //    //if(dontclear) {
        //    //    const screen = GetDC(NULL);
        //    //    BitBlt(screen, 0, 0, screenWidth, screenHeight, screen, 0, 0, NOTSRCCOPY);
        //    //    ReleaseDC(NULL, screen);
        //    //}
        //}
    }else if(msg == WM_MOUSEMOVE) {
        DoMouseShit(GET_X_LPARAM(lp), GET_Y_LPARAM(lp), wp);
    }else if(msg == WM_KEYDOWN) {
        print(wp, VK_CONTROL);
        if(wp == VK_CONTROL) {
            dontclear = !dontclear;
        }
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        brush.Release();
        painter.Release();
        print(UnregisterHotKey(hwnd, randomid) == 1);
    }
}

// let d2d, brush;

// function windowProc(hwnd, msg, wp, lp) {
//     if(msg == WM_CREATE) {
//         d2d = createCanvas("d2d", ID2D1DeviceContextDComposition, hwnd);  //DComposition
//         brush = d2d.CreateSolidColorBrush(0.0, 0.2, 1.0);
//         print(brush.GetColor());

//         SetTimer(hwnd, 0, 16);
//     }else if(msg == WM_TIMER) {
//         if(GetKey('D')) {
//             if(!interactable) {
//                 SetWindowLongPtr(hwnd, GWL_EXSTYLE, WS_EX_NOREDIRECTIONBITMAP | WS_EX_LAYERED | WS_EX_TOPMOST);
//                 interactable = true;
//             }
//         }else if(interactable) {
//             SetWindowLongPtr(hwnd, GWL_EXSTYLE, WS_EX_NOREDIRECTIONBITMAP | WS_EX_LAYERED | WS_EX_TOPMOST | WS_EX_TRANSPARENT);
//         }
//     }else if(msg == WM_MOUSEMOVE) {
//         mouse.last = {x: mouse.x, y: mouse.y};
//         mouse.x = GET_X_LPARAM(lp);
//         mouse.y = GET_Y_LPARAM(lp);
//         if((wp & MK_LBUTTON) == MK_LBUTTON) {
//             d2d.BeginDraw();
//             d2d.DrawLine(mouse.last.x, mouse.last.y, mouse.x, mouse.y, brush, 2);
//             d2d.EndDraw();
//         }
//     }
//     else if(msg == WM_DESTROY) {
//         PostQuitMessage(0);
//         brush.Release();
//         d2d.Release();
//     }
// }

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);
//wc.style = CS_HREDRAW | CS_VREDRAW;

//WS_EX_NOREDIRECTIONBITMAP for DirectComposition
//WS_EX_LAYERED | WS_EX_TRANSPARENT so my mouse can't interact with the window until i take off WS_EX_TRANSPARENT
//WS_EX_TOPMOST so i can always see the drawings (if you choose to not clear them with ctrl)
//WS_EX_TOOLWINDOW so you can't alt tab to the window accidentally lol it just gets in the way
CreateWindow(WS_EX_TOOLWINDOW | WS_EX_NOREDIRECTIONBITMAP | WS_EX_LAYERED | WS_EX_TOPMOST | WS_EX_TRANSPARENT, wc, "hold d to draw on the screen", WS_POPUP | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, screenWidth, screenHeight, NULL, NULL, hInstance);
