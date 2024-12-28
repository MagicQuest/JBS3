const w = 800;
const h = 600;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        print(hwnd);
    }else if(msg == WM_KEYDOWN) {
        if(wp == "E".charCodeAt(0)) {
            print("e");
            if(GetKey(VK_CONTROL)) {
                SetForegroundWindow(GetConsoleWindow());
                try {
                    printNoHighlight(eval(getline("Ctrl+E -> Eval some code: ")));
                }catch(e) {
                    printNoHighlight(e.toString());
                }
                SetForegroundWindow(hwnd);
            }
        }
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);

wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "generic window so i can draw to it from jbsblueprints as a test l mao", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);