let window;
const icon = LoadIcon(NULL, IDI_QUESTION);
//let mouse;
//let mouse = {x: 0, y: 0};

function init(hwnd) {
    //DrawIcon(GetDC(NULL), 500, 500, icon);
    print(InvalidateRect(hwnd, 0, 0, 500, 500, true));
    print(GetClassLongPtr(window, GCLP_HBRBACKGROUND));//SetClassLongPtr(window, GCLP_HICON, icon), GetLastError());
}

let ptsBegin;        // beginning point 
let ptsEnd;          // new endpoint 
let ptsPrevEnd;      // previous endpoint 
fPrevLine = false;

function windowProc(hwndMain, uMsg, wParam, lParam) {
    let hdc;                       // handle to device context 
    let rcClient;                 // client area rectangle 
    let ptClientUL = {x: 0, y: 0};              // client upper left corner 
    let ptClientLR = {x: 0, y: 0};              // client lower right corner
    //haha this wasn't working and i just didn't initialize these!
    switch (uMsg) 
    { 
        case WM_LBUTTONDOWN: 
            // Capture mouse input. 
 
            SetCapture(hwndMain); 
 
            // Retrieve the screen coordinates of the client area, 
            // and convert them into client coordinates. 

            rcClient = GetClientRect(hwndMain);//, &rcClient);

            ptClientUL.x = rcClient.left; 
            ptClientUL.y = rcClient.top; 

            // Add one to the right and bottom sides, because the 
            // coordinates retrieved by GetClientRect do not 
            // include the far left and lowermost pixels. 

            ptClientLR.x = rcClient.right + 1; 
            ptClientLR.y = rcClient.bottom + 1;

            //print("before cliemt to screen");

            ClientToScreen(hwndMain, ptClientUL);//, &ptClientUL); 
            ClientToScreen(hwndMain, ptClientLR);//, &ptClientLR); 

            //print("after client to screen");

            // Copy the client coordinates of the client area 
            // to the rcClient structure. Confine the mouse cursor 
            // to the client area by passing the rcClient structure 
            // to the ClipCursor function. 

            SetRect(/*&*/rcClient, ptClientUL.x, ptClientUL.y, ptClientLR.x, ptClientLR.y); 

            //rcClient = {left: ptClientUL.x, top: ptClientUL.y, right: ptClientLR.x, bottom: ptClientLR.y};
            
            ClipCursor(rcClient.left, rcClient.top, rcClient.right, rcClient.bottom);//&rcClient); 
            
            // Convert the cursor coordinates into a POINTS 
            // structure, which defines the beginning point of the 
            // line drawn during a WM_MOUSEMOVE message. 
            
            ptsBegin = MAKEPOINTS(lParam);
            return 0;

        case WM_MOUSEMOVE: 
 
            // When moving the mouse, the user must hold down 
            // the left mouse button to draw lines. 
 
            if (wParam & MK_LBUTTON) 
            { 
 
                // Retrieve a device context (DC) for the client area. 
 
                hdc = GetDC(hwndMain); 
 
                // The following function ensures that pixels of 
                // the previously drawn line are set to white and 
                // those of the new line are set to black. 
 
                SetROP2(hdc, R2_NOTXORPEN); 
 
                // If a line was drawn during an earlier WM_MOUSEMOVE 
                // message, draw over it. This erases the line by 
                // setting the color of its pixels to white. 
 
                if (fPrevLine) 
                { 
                    MoveTo/*Ex*/(hdc, ptsBegin.x, ptsBegin.y);//(LPPOINT) NULL); 
                    LineTo(hdc, ptsPrevEnd.x, ptsPrevEnd.y); 
                }
 
                // Convert the current cursor coordinates to a 
                // POINTS structure, and then draw a new line. 
 
                ptsEnd = MAKEPOINTS(lParam); 
                MoveTo/*Ex*/(hdc, ptsBegin.x, ptsBegin.y);//, (LPPOINT) NULL); 
                LineTo(hdc, ptsEnd.x, ptsEnd.y); 
 
                // Set the previous line flag, save the ending 
                // point of the new line, and then release the DC. 
 
                fPrevLine = true; 
                ptsPrevEnd = ptsEnd; 
                ReleaseDC(hwndMain, hdc); 
            } 
            break; 
 
        case WM_LBUTTONUP: 
 
            // The user has finished drawing the line. Reset the 
            // previous line flag, release the mouse cursor, and 
            // release the mouse capture. 
 
            fPrevLine = false; 
            ClipCursor(NULL); 
            ReleaseCapture(); 
            return 0; 
 
        case WM_DESTROY: 
            PostQuitMessage(); 
            break; 
    }
    //if(msg == WM_LBUTTONDOWN) {
    //    mouse = MAKEPOINTS(lp);
    //    //print("CLICK NIGGA");
    //    print(MAKEPOINTS(lp), wp & MK_SHIFT);
    //}
    //if(msg == WM_MOUSEMOVE) {
    //    mouse = MAKEPOINTS(lp);//{x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)};
    //    //print(mouse);
    //    print("update", InvalidateRect(hwnd, 0, 0, 500, 500, false));
    //    //print(InvalidateRect(hwnd, 0, 0, 500, 500, false));
    //}
    //if(msg == WM_PAINT) {
    //    const ps = BeginPaint(hwnd);
    //    DrawIconEx(ps.hdc, mouse.x, mouse.y, icon, 64, 64, 0, NULL, DI_NORMAL);
    //    EndPaint(hwnd, ps);
    //}else if(msg == WM_KEYDOWN) {
    //if(msg == WM_KEYDOWN) {
    //    if(wp == VK_ESCAPE) {
    //        DestroyWindow(hwnd);
    //    }
    //}else if(msg == WM_DESTROY) {
    //    PostQuitMessage();
    //}
}

//function loop() {
//    if(GetKey(VK_ESCAPE)) {
//        
//    }
//}

const WINCLASS = CreateWindowClass("sNIGGER", init, windowProc);//, loop);
WINCLASS.hIcon = LoadIcon(NULL, IDI_QUESTION);
WINCLASS.hbrBackground = COLOR_WINDOW;
WINCLASS.hCursor = LoadCursor(NULL, IDC_HAND);
WINCLASS.hIconSm = LoadIcon(NULL, IDI_ERROR);

window = CreateWindow(WINCLASS, "paint example msn", /*WS_POPUPWINDOW*/ WS_OVERLAPPEDWINDOW | WS_VISIBLE, 200, 200, 500, 500);

//window = CreateWindow(WINCLASSA, "paint example msn", WS_, 200, 200, 500, 500);