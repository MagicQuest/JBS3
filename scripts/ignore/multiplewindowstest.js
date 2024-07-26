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

let d = Date.now();
new Window(WS_EX_OVERLAPPEDWINDOW, "winjsclazz", Math.random() > .5 ? "https://www.youtube.com/watch?v=EEbZuIFzdb8" : "https://www.youtube.com/watch?v=m91d4ck8tKM", WS_OVERLAPPEDWINDOW | WS_VISIBLE, screenWidth / 2, screenHeight / 2, 512, 512,
(jswindow, hwnd, msg, wp, lp) => {
    if(msg == WM_CREATE) {
        print("hell yeah");
        SetTimer(hwnd, NULL, 30);
    }else if(msg == WM_TIMER) {
        //print(jswindow);
        jswindow.title = Date.now()-d;
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
});
print("wait this doesn't fire yet? (oops there are TWO reasons why you couldn't have 2 windows)")