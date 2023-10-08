let window = GetConsoleWindow();
SetCapture(window);
let clientDC = GetDC(window);
let windowDC = GetWindowDC(window);

let clientRect = GetClientRect(window);
let windowRect = GetWindowRect(window);

//SetCapture(window);
//print(ClipCursor(windowRect.left, windowRect.top, windowRect.right, windowRect.bottom));
//print(MAKEPOINTS(0b00000000000000100000000000000001))

function setWindow(hwnd) {
    ReleaseDC(window, clientDC);
    ReleaseDC(window, windowDC);
    window = hwnd;
    clientDC = GetDC(hwnd);
    windowDC = GetWindowDC(hwnd);
    clientRect = GetClientRect(hwnd);
    windowRect = GetWindowRect(hwnd);
}

class D2D {
    constructor() {
        this.direct2d = createCanvas("d2d", ID2D1DCRenderTarget, FindWindow(NULL, "osu!"));
        this.font = this.direct2d.CreateFont("Consolas", 50);
        this.brush = this.direct2d.CreateSolidColorBrush(1.0, 1.0, 1.0, 0.0);
        this.white = this.direct2d.CreateSolidColorBrush(.5,.5,.5,.9);
    }

    drawForMe(dt, i) {
        this.direct2d.BeginDraw();
        //this.direct2d.Clear(0,0,0);
        this.brush.SetColor((Math.sin(i/200)+1)/2, (Math.cos(i/200)+1)/2, 0);
        this.direct2d.FillRectangle(200,700,200+(30*("dt: " + dt).length),775, this.white);
        this.direct2d.DrawText("dt: " + dt, this.font, 200, 700, 1920, 1080, this.brush);
        this.direct2d.EndDraw();
    }
}

//const yellow = CreateSolidBrush(RGB(255,255,0));
//const red = CreateSolidBrush(RGB(255,0,0));

let i = 0;

let pen;

let j = 97;

//let w = false;

let t = false;
let x = false;
let radius = 64;

const dx = new D2D();

let time = Date.now()/1000;
let start = Date.now();
let dt = Date.now()/1000;

while(!GetKey(VK_ESCAPE)) {
    //const time = Date.now()/1000;
    const mouse = GetMousePos();
    if(GetKeyDown(VK_CONTROL)) {
        setWindow(WindowFromPoint(mouse.x, mouse.y));
    }
    //haha playing osu!
    //if(GetKey("W")) {
    //    if(!w) {
    //        SendInput(MakeMouseInput(0,0,0,MOUSEEVENTF_LEFTDOWN));
    //    }
    //    w = true;
    //}else {
    //    if(w) {
    //        SendInput(MakeMouseInput(0,0,0,MOUSEEVENTF_LEFTUP));
    //    }
    //    w = false;
    //}

    if(GetKeyDown("W")) {
        print(MakeKeyboardInput("D", false), MakeMouseInput(100,100,0,MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_ABSOLUTE));
        SendInput(MakeKeyboardInput("D", false), MakeKeyboardInput("D", true));
        //SendInput({type: 1, wVk: String.fromCharCode(j), dwFlags : 0}, {type: 1, wVk: String.fromCharCode(j), dwFlags : KEYEVENTF_KEYUP});
        j++;
    }
    //if(GetKey("t")) {
    //    SendInput(MakeMouseInput(((Math.sin(i*5)+1)*128)+((1920/2)-128),((Math.cos(i*5)+1)*128)+((1080/2)-128),0,MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_MOVE), MakeMouseInput(0,0,0,MOUSEEVENTF_LEFTUP));
    //}
    if(GetKey(VK_LSHIFT)) {
        if(!t) {
            SendInput(MakeMouseInput(0,0,0,MOUSEEVENTF_LEFTDOWN), MakeKeyboardInput("C", false));
        }
        SendInput(MakeMouseInput(((Math.sin(i*10)+1)*radius)+((1920/2)-radius),((Math.cos(i*10)+1)*radius)+((1080/2)-radius),0,MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_MOVE));
        t = true;
    }else {
        if(t) {
            SendInput(MakeMouseInput(0,0,0,MOUSEEVENTF_LEFTUP), MakeKeyboardInput("C", true));
        }
        t = false;
    }
    if(GetKey("x")) {
        if(!x) {
            SendInput(MakeKeyboardInput("C", false));
        }
        x = true;
    }else {
        if(x) {
            SendInput(MakeKeyboardInput("C", true));
        }
        x = false;
    }
    clientRect = GetClientRect(window);
    windowRect = GetWindowRect(window);
    //{
    pen = CreatePen(PS_SOLID, 5, RGB((Math.sin(i/200)+1)*128, (Math.cos(i/200)+1)*128, 0));
    const oldPen = SelectObject(clientDC, pen);//GetStockObject(DC_PEN));
    const oldBrush = SelectObject(clientDC, GetStockObject(NULL_BRUSH));
    //SetDCPenColor(clientDC, RGB((Math.sin(i/200)+1)*128, (Math.cos(i/200)+1)*128, 0));    // red
    //FillRect(clientDC, 0, 0, clientRect.right, clientRect.bottom, red);
    //FillRect(windowDC, 0, 0, windowRect.right, windowRect.bottom, yellow);
    //SetBkMode(clientDC, TRANSPARENT);
    Rectangle(clientDC, clientRect.left, clientRect.top, clientRect.right, clientRect.bottom);
    //Rectangle(windowDC, windowRect.left, windowRect.top, windowRect.right, windowRect.bottom);
    SelectObject(clientDC, oldPen);
    SelectObject(clientDC, oldBrush);
    //}
    //{
    //    const oldPen = SelectObject(windowDC, GetStockObject(DC_PEN));
    //    const oldBrush = SelectObject(windowDC, GetStockObject(NULL_BRUSH));
    //    SetDCPenColor(windowDC, RGB(255, 255, 0));    // red
//
    //    //print(windowRect.right-windowRect.left, windowRect.bottom-windowRect.top);
    //    Rectangle(windowDC, 0, 0, windowRect.right-windowRect.left, windowRect.bottom-windowRect.top);
//
    //    SelectObject(windowDC, oldPen);
    //    SelectObject(windowDC, oldBrush);
    //}
    //DrawText(clientDC, "yhea", mouse.x-windowRect.left, mouse.y-windowRect.top, mouse.x-windowRect.left+100,mouse.y-windowRect.top+100, DT_CENTER | DT_SINGLELINE);
    //TextOut(windowDC, mouse.x-windowRect.left, mouse.y-windowRect.top, "uyea");
    DeleteObject(pen);
    GetStockObject(WHITE_BRUSH);
    GetStockObject(DC_PEN);
    //if(i*100 % 2 == 0) {
    if((Date.now() - start) % 16 == 0) {
        //print(Date.now()/1000, dt, Date.now()/1000-dt);
        print("should be 60fps -> "+1/(Date.now()/1000-dt));
        dx.drawForMe(1/(Date.now()/1000-dt),i)
        dt = Date.now()/1000;
    }
    i += .01;
    time = Date.now()/1000;
}
ReleaseCapture(GetConsoleWindow());