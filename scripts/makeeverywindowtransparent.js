let id = Msgbox("this is fr gonna make every window open layered + transparent so yk", "gyatt", MB_OKCANCEL);

if(id == IDCANCEL) {
    quit;
}

let windows = {};

spawn(() => {
    Sleep(10000);
    print(id);
});

EnumWindows(hwnd => {
    const title = GetWindowText(hwnd);
    const pos = GetWindowRect(hwnd);
    if(title && (pos.right != 0 && pos.bottom != 0)) {// && title != "GlobalHiddenWindow" ) {
        print(title, "-", GetClassName(hwnd), pos);
        windows[hwnd] = GetWindowLongPtr(hwnd, GWL_EXSTYLE); //storing the style before we change it
        print(windows[hwnd]);
        //hold on for some reason SetWindowLongPtr keeps hanging and apparently you aren't supposed to set GWL_EXSTYLE to layered if the window class is something specific
        const style = GetClassLongPtr(hwnd, GCL_STYLE);
        if((style & CS_CLASSDC) == CS_CLASSDC || (style & CS_PARENTDC) == CS_PARENTDC) {
            print("classdc or parentdc don't do no styles lil bro");
        }else {
            print(style);

            //for some reason on certain windows SetWindowLongPtr hangs and nothing happens and the google has got nothing (so now all my windows are transparent and i can't undo them)
            print(SetWindowLongPtr(hwnd, GWL_EXSTYLE, windows[hwnd] | WS_EX_LAYERED)); //you gotta make the window layered before you can transparent it
            print(SetLayeredWindowAttributes(hwnd, NULL, 127, LWA_ALPHA));
        }
    }
});

id = Msgbox("revert changes?", "makeeverywindowtransparent.js", MB_YESNO);
if(id == IDYES) {
    for(const hwnd in windows) {
        const exstyle = windows[hwnd];
        SetLayeredWindowAttributes(hwnd, NULL, 255, LWA_ALPHA);
        SetWindowLongPtr(hwnd, GWL_EXSTYLE, exstyle);
    }
}