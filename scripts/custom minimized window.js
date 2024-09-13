//based on -> https://learn.microsoft.com/en-us/windows/win32/gdi/drawing-a-minimized-window
//i already did this in newdmwfuncs.js (which you should really check out because it's jamPACKED with a lot of random things)
//but this time it's gdi

//aw man this one doesn't seem to work
//maybe it's because the console is still visible and it's messing up my messages lemme try that
//yeah idk lemme see what it looks like in a new c++ project legit (ok i still couldn't get this to do anything)

//SetWindowLongPtr(GetConsoleWindow(), GWL_STYLE, GetWindowLongPtr(GetConsoleWindow(), GWL_STYLE) ^ WS_VISIBLE);

const aptStar = [[50,2], [2,98], [98,33], [2,33], [98,98], [50,2]];
//const aptStar = [{x: 50, y: 2},{x: 2, y: 98},{x: 98, y: 33},{x: 2, y: 33},{x: 98, y: 98},{x: 50, y: 2}];

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {

    }else if(msg == WM_PAINT) {
        const paint = BeginPaint(hwnd);
        
        if(IsIconic(hwnd)) {
            print("minimaized");
            let rect = GetClientRect(hwnd);
            SetMapMode(paint.hdc, MM_ANISOTROPIC);
            SetWindowExtEx(paint.hdc, 100, 100);
            SetViewportExtEx(paint.hdc, rect.right, rect.bottom);
            Polyline(paint.hdc, aptStar);
        }else {
            TextOut(paint.hdc, 0, 0, "Hello, Windows!");
            Polygon(paint.hdc, aptStar); //testing to see if polyline actually works (it does!)
        }

        EndPaint(hwnd, paint);
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        //SetWindowLongPtr(GetConsoleWindow(), GWL_STYLE, GetWindowLongPtr(GetConsoleWindow(), GWL_STYLE) | WS_VISIBLE);
    }
}

const winclass = CreateWindowClass("WinClass"/*, init*/, windowProc); //loop is not required y'all (but her timing is getting better)
winclass.hIcon = NULL; //LoadIcon(NULL, IDI_APPLICATION);
winclass.hbrBackground = COLOR_BACKGROUND;
winclass.hCursor = LoadCursor(NULL, IDC_ARROW);

CreateWindow(WS_EX_OVERLAPPEDWINDOW, winclass, "hold alt+tab or hover over this window's icon in the taskbar to see this!", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 512+20, 512+43, NULL, NULL, hInstance);