const Int_To_WM = function() { //this gotta be the only good reason to use a closure
    const wm = {}; //with a closure im using wm like it's static!!!
    Object.entries(globalThis).filter(([key, value]) => { //wait why am i doing a filter instead of just forEach
        let k = key.indexOf("WM_") == 0;
        k && (wm[value] = key); //since Object.entries returns stuff like [["WM_PAINT", 0], ["WM_CREATE", 1]] im just setting the values directly (also im swapping key and value here so it's easier to get the name of the message by the number)
        return k;
    });

    function Int_To_WM(msg) {
        return wm[msg];
    }
    return Int_To_WM;
}();

let dirty = false;

const contextmenu = LoadCursor(NULL, IDC_HELP);

function windowProc(hwnd, msg, wp, lp) {
    print(Int_To_WM(msg));
    if(msg == WM_CREATE) {
        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        dirty = true;
    }else if(msg == WM_SETCURSOR) {
        //SetCursor(hwnd, );
        const mouse = GetCursorPos();//{x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //i was originally using WM_MOUSEMOVE which passed the mouse position in the lp
        ScreenToClient(hwnd, mouse); //fun (returns nothing and modifies the object)

        if(mouse.y < 512/2) {
            SetCursor(contextmenu);
            dirty = true;
            return 1;
        }
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }

    if(dirty) {
        //print("dirty", Int_To_WM(msg));
        print(msg);
        dirty = false;
    }
}

const wc = CreateWindowClass("tfjs"/*, init*/, windowProc); //loop is not required y'all
wc.hIcon = wc.hIconSm = LoadIcon(NULL, IDI_APPLICATION);
//wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "tHELP", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 512+20, 512+43, NULL, NULL, hInstance);