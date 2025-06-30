//JBS3 if it was written in Java:

class Main {
    static width = 800;
    static height = 600;
    static window = undefined;
    static instance = undefined;

    constructor(name) {
        if(Main.instance) {
            print("Main instance already exists!");
            quit;
        }
        Main.instance = this;

        const wc = CreateWindowClass("winclass", this.windowProc);
        wc.hbrBackground = COLOR_BACKGROUND;
        wc.hCursor = LoadCursor(NULL, IDC_ARROW);

        CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, name, WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, Main.width, Main.height, NULL, NULL, hInstance);
    }

    //now it's a property like c#
    get title() {
        return GetWindowText(Main.window);
    }

    set title(text) {
        SetWindowText(Main.window, text);
    }

    windowProc(hwnd, msg, wp, lp) {
        if(msg == WM_CREATE) {
            Main.window = hwnd;
        }else if(msg == WM_SIZE) {
            Main.width = LOWORD(lp);
            Main.height = HIWORD(lp);
            print(Main.width, Main.height);
            //wait can you not automatically call your own getters/setters?
            this.title = `Main window - (${Main.width}, ${Main.height})`;
        }else if(msg == WM_DESTROY) {
            PostQuitMessage(0);
        }
    }
}

new Main("Main window");