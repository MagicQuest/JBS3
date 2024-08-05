class Window {
    constructor(exf, classname, title, dwf, x, y, w, h, proc) {
        this.realWinProc = proc;
        //this.winProc = proc;
        const wc = CreateWindowClass(classname, this.winProc.bind(this));
        wc.hbrBackground = COLOR_WINDOW+1;
        wc.hCursor = LoadCursor(NULL, IDC_ARROW);
        this.winClass = wc;
        this.internalTitle = title;
        this.hwnd = CreateWindow(exf, this.winClass, title, dwf, x, y, w, h, NULL, NULL, hInstance);
        print("hwnd", this.hwnd); //oops CreateWindow blocks the thread so this.hwnd is undefined
    }
    get title() {
        return this.internalTitle;
    }
    set title(x) { //aw hell yeah this is crazy
        this.internalTitle = x;
        SetWindowText(this.hwnd, x);
        print(this.hwnd, x);
    }
    winProc(hwnd, msg, wp, lp) {
        //this.realWinProc(this, hwnd, msg, wp, lp);
        this.realWinProc(this, hwnd, msg, wp, lp);
    }
}

function secondwindowproc(js, hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        print("HELLO FROM SECOND WINDOW!");
        js.hwnd = hwnd;
        js.d2d = createCanvas("d2d", ID2D1DeviceContextDComposition, hwnd);
        js.font = js.d2d.CreateFont("comic sans ms", 32);
        js.brush = js.d2d.CreateSolidColorBrush(0.0, 1.0, 1.0, 1.0);
        //SetLayeredWindowAttributes(hwnd, RGB(255, 255, 255), 0, LWA_COLORKEY);
        js.d2d.Commit();
        SetTimer(hwnd, NULL, 30);
    }else if(msg == WM_TIMER) {
        let {d2d, brush, font} = js;
        d2d.BeginDraw();
        d2d.Clear(0.0, 0.0, 0.0, 0.0);
        d2d.DrawText("skibidi babye", font, 0, 0, 256, 256, brush);
        d2d.EndDraw();
    }
}

let d = Date.now();
new Window(WS_EX_OVERLAPPEDWINDOW, "winjsclazz", Math.random() > .5 ? "https://www.youtube.com/watch?v=EEbZuIFzdb8" : "https://www.youtube.com/watch?v=m91d4ck8tKM", WS_OVERLAPPEDWINDOW | WS_VISIBLE, screenWidth / 2, screenHeight / 2, 512, 512,
(jswindow, hwnd, msg, wp, lp) => {
    if(msg == WM_CREATE) {
        print("hell yeah");
        jswindow.hwnd = hwnd;
        SetTimer(hwnd, NULL, 30);
        new Window(WS_EX_NOREDIRECTIONBITMAP/* | WS_EX_LAYERED*/, "winjsclazz2", "erm... a second window???", WS_POPUP | WS_VISIBLE, 0, 0, 256, 256, secondwindowproc);
    }else if(msg == WM_TIMER) {
        //print(jswindow);
        jswindow.title = Date.now()-d;
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
});
print("wait this doesn't fire yet? (oops there are TWO reasons why you couldn't have 2 windows)")