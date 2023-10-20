const frontFace = LoadImage(NULL, __dirname+"/box.bmp", IMAGE_BITMAP, 0, 0, LR_SHARED | LR_LOADFROMFILE);
const sides = LoadImage(NULL, __dirname+"/boxside.bmp", IMAGE_BITMAP, 0, 0, LR_SHARED | LR_LOADFROMFILE);

const width = 500+16;
const height = 500+39;

let mouse = {x: 0, y: 0};

let a1 = 22.8;
let a2 = -.5;
let d = 1000;//4.9; //aw i have to use orthographic instead of perspective because i can't specify a 4th point with PlgBlt https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-plgblt

let scale = 50;

let offsetX = 5;
let offsetY = 5;

const impact = CreateFontSimple("impact", 20, 40);

let windowBmp; //for setting the icon LO!

let backBufferBmp;

let normalPen = CreatePen(PS_SOLID, 5, RGB(255,0,0)); //pen used to draw the normal vector

let lastMouse = GetMousePos();

function z(r,theta,h,x,y) {
    return (r*Math.sin(x+theta))*Math.cos(y)-h*Math.sin(y);
}

function D(r,theta,h,x,y) {
    return (2*d)/(d-z(r,theta,h,x,y));
}

function mpointfd(r,theta,h,x,y) { //math point from desoms
    //https://www.desmos.com/calculator/vahnkqibew
    let finalx = D(r,theta,h,x,y)*(r*Math.cos(theta+x));
    let finaly = D(r,theta,h,x,y)*(r*Math.sin(y)*Math.sin(x+theta)+h*Math.cos(y));
    return {x: (finalx+offsetX)*scale,y: (offsetY-finaly)*scale};
}

function getMagnitude(vec) { //yall i didn't have a real teacher (i had a long term sub) for physics so IDK WHAT IM DOING
    return Math.sqrt(vec.x**2 + vec.y**2);
}

function setMagnitude(vec, newMag) {
    let mag = getMagnitude(vec);
    vec.x = vec.x * newMag / mag;
    vec.y = vec.y * newMag / mag;
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        InvalidateRect(hwnd, 0, 0, width, height, true);
        UpdateWindow(hwnd); //draw immediately
        const dc = GetDC(hwnd);
        windowBmp = CreateCompatibleBitmap(dc, (width-16)/5, (height-39)/5);
        backBufferBmp = CreateCompatibleBitmap(dc, width, height);
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, windowBmp);
        SetStretchBltMode(dc, HALFTONE);
        StretchBlt(memDC, 0, 0, (width-16)/5, (height-39)/5, dc, 0, 0, width-16, height-39, SRCCOPY);
        DeleteDC(memDC);
        ReleaseDC(hwnd, dc);
    }else if(msg == WM_ERASEBKGND) {
        //const ps = BeginPaint(hwnd);
        //let s = SelectObject(ps.hdc, GetStockObject(DC_BRUSH));
        //SetDCBrushColor(ps.hdc, RGB(255,255,0));
        //FillRect(ps.hdc, 0, 0, width, height, NULL);
        //SelectObject(ps.hdc, s);
        //EndPaint(hwnd, ps);
    }else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);

        //const MMDC = CreateCompatibleDC(ps.hdc);

        //print("paint");

        //if(windowBmp) {
        //    DeleteObject(windowBmp);
        //    windowBmp = CreateCompatibleBitmap(ps.hdc, width, height);
        //}

        //const lastBrush = SelectObject(ps.hdc, GetStockObject(DC_BRUSH));
        //SetDCBrushColor(ps.hdc, RGB(255,255,0));
        //amongus(variablethatdoesntexist); why doesn't v8 tell me this is CAP
        const lastFont = SelectObject(ps.hdc, impact);
        SetBkColor(ps.hdc, RGB(255,255,0));
        let point = mpointfd(Math.sqrt(2), 0, 1, a1, a2);
        TextOut(ps.hdc, point.x, point.y, "A");
        //FillRect(ps.hdc, point.x, point.y, point.x+10, point.y+10, NULL);
        let point2 = mpointfd(Math.sqrt(2), Math.PI/2, 1, a1, a2);
        TextOut(ps.hdc, point2.x, point2.y, "B2");
        //FillRect(ps.hdc, point.x, point.y, point.x+10, point.y+10, NULL);
        let point3 = mpointfd(Math.sqrt(2), Math.PI, 1, a1, a2);
        TextOut(ps.hdc, point3.x, point3.y, "C3");
        //FillRect(ps.hdc, point.x, point.y, point.x+10, point.y+10, NULL);
        let point4 = mpointfd(Math.sqrt(2), (3*Math.PI)/2, 1, a1, a2);
        //FillRect(ps.hdc, point.x, point.y, point.x+10, point.y+10, NULL);
        TextOut(ps.hdc, point4.x, point4.y, "D4");

        let point5 = mpointfd(-Math.sqrt(2), 0, -1, a1, a2);
        TextOut(ps.hdc, point5.x, point5.y, "E5");

        let point6 = mpointfd(-Math.sqrt(2), -Math.PI/2, -1, a1, a2);
        TextOut(ps.hdc, point6.x, point6.y, "F6");
        //print(point6);

        let point7 = mpointfd(-Math.sqrt(2), -Math.PI, -1, a1, a2);
        TextOut(ps.hdc, point7.x, point7.y, "G7");

        let point8 = mpointfd(-Math.sqrt(2), -(3*Math.PI)/2, -1, a1, a2);
        TextOut(ps.hdc, point8.x, point8.y, "H8");
        SelectObject(ps.hdc, lastFont);

        //SelectObject(ps.hdc, lastBrush);

        const memDC = CreateCompatibleDC(ps.hdc);
        //BitBlt(ps.hdc, 0, 0, 256, 256, memDC, 0, 0, SRCCOPY);
        if(point.y-point7.y < 0) {
            SelectObject(memDC, frontFace);
            PlgBlt(ps.hdc, [point7, point6, point8, point5], memDC, 0, 0, 256, 256, NULL, 0, 0);
        }
        SelectObject(memDC, sides);
        PlgBlt(ps.hdc, [point4, point3, point8, point5], memDC, 0, 0, 256, 256, NULL, 0, 0);
        PlgBlt(ps.hdc, [point3, point2, point5, point6], memDC, 0, 0, 256, 256, NULL, 0, 0);
        PlgBlt(ps.hdc, [point, point4, point7, point8], memDC, 0, 0, 256, 256, NULL, 0, 0);
        PlgBlt(ps.hdc, [point2, point, point6, point7], memDC, 0, 0, 256, 256, NULL, 0, 0);
        SelectObject(memDC, frontFace);
        //aw man PlgBlt doesn't read the 4th point (windows defined)
        PlgBlt(ps.hdc, [point, point2, point4, point3], memDC, 0, 0, 256, 256, NULL, 0, 0);
        //TextOut(ps.hdc, point.x+(point3.x-point.x)/2, point.y+(point3.y-point.y)/2, "ABCD");
        let v1 = {x: point.x+(point3.x-point.x)/2, y: point.y+(point3.y-point.y)/2};
        let v2 = {x: point7.x+(point5.x-point7.x)/2, y: point7.y+(point5.y-point7.y)/2};
        MoveTo(ps.hdc, v1.x, v1.y);
        let lastPen = SelectObject(ps.hdc, normalPen);//GetStockObject(DC_PEN));
        //SetDCPenColor(ps.hdc, RGB(255,255,0));
        LineTo(ps.hdc, v1.x, (v2.y+(v1.y-v2.y)/2)-(v2.y-v1.y)); //what is the math for that (WAIT)
        SelectObject(ps.hdc, lastPen);
        //let line = {x: point.x+(point2.x-point.x)/2, y: point.y+(point2.y-point.y)/2}//mpointfd(Math.sqrt(2), Math.PI/4, 1, a1, a2);
        //LineTo(ps.hdc, line.x, line.y);//mpointfd(Math.sqrt(2), Math.PI/4, 1, a1, a2).x,(v2.y+(v1.y-v2.y)/2)-(v2.y-v1.y));
        //MoveTo(ps.hdc, v1.x, (v2.y+(v1.y-v2.y)/2)-(v2.y-v1.y));
        //let line2 = {x: point4.x+(point3.x-point4.x)/2, y: point4.y+(point3.y-point4.y)/2};
        //LineTo(ps.hdc, line2.x, line2.y);
        //MoveTo(ps.hdc, v1.x, (v2.y+(v1.y-v2.y)/2)-(v2.y-v1.y));
        //let line3 = {x: point2.x+(point3.x-point2.x)/2, y: point2.y+(point3.y-point2.y)/2};
        //LineTo(ps.hdc, line3.x, line3.y);
        //MoveTo(ps.hdc, v1.x, (v2.y+(v1.y-v2.y)/2)-(v2.y-v1.y));
        //let line4 = {x: point.x+(point4.x-point.x)/2, y: point.y+(point4.y-point.y)/2};
        //LineTo(ps.hdc, line4.x, line4.y);
        
        if(point.y-point7.y > 0) {
            PlgBlt(ps.hdc, [point7, point6, point8, point5], memDC, 0, 0, 256, 256, NULL, 0, 0);
            //LineTo(ps.hdc, vector.x, vector.y+100);
        }else {
            //LineTo(ps.hdc, vector.x, vector.y-100);
        }
        //PlgBlt(ps.hdc, [point7, point6, point8, point5], memDC, 0, 0, 256, 256, NULL, 0, 0);
        //BitBlt(ps.hdc, 256, 256, 256, 256, memDC, 0, 0, SRCCOPY);
        DeleteDC(memDC);
        const mdc = CreateCompatibleDC(ps.hdc);
        SelectObject(mdc, windowBmp);
        SetStretchBltMode(mdc, HALFTONE);
        StretchBlt(mdc, 0, 0, (width-16)/5, (height-39)/5, ps.hdc, 0, 0, width-16, height-39, SRCCOPY);
        //BitBlt(mdc, 0, 0, width-16, height-39, ps.hdc, 0, 0, SRCCOPY);
        DeleteDC(mdc);

        const mdc2 = CreateCompatibleDC(ps.hdc);
        SelectObject(mdc2, windowBmp);
        //SetStretchBltMode(ps.hdc, HALFTONE);
        //StretchBlt(ps.hdc, 0, 0, (width-16)/2, (height-39)/2, mdc2, 0, 0, width-16, height-39, SRCCOPY);
        BitBlt(ps.hdc, 0, 0, (width-16)/5, (height-39)/5, mdc2, 0, 0, SRCCOPY);
        DeleteDC(mdc2);

        EndPaint(hwnd, ps);

        let lastIcon = SendMessage(hwnd, WM_SETICON, ICON_SMALL, HICONFromHBITMAP(windowBmp));
        if(lastIcon) DeleteObject(lastIcon);
    }else if(msg == WM_KEYDOWN) {
        if(wp == VK_ESCAPE) {
            DestroyWindow(hwnd);
        }else if(wp == VK_LEFT) {
            a1-=.1;
        }else if(wp == VK_RIGHT) {
            a1+=.1;
        }else if(wp == VK_UP) {
            a2-=.1;
        }else if(wp == VK_DOWN) {
            a2+=.1;
        }
        RedrawWindow(hwnd, 0, 0, width, height, NULL, RDW_ERASE | RDW_INVALIDATE | RDW_UPDATENOW);
    }else if(msg == WM_DESTROY) {
        PostQuitMessage();
    }else if(msg == WM_HELP) {
        print("HELLP HELLP ME");
        //Msgbox("arrow keys->change angle\nidk how to decide which faces to draw first so the sides are messed up but the top and bottom are drawn correctly", "fake3d", MB_OK);
    }else if(msg == WM_LBUTTONDOWN) {
        SetCapture(hwnd);
    }else if(msg == WM_MOUSEMOVE) {
        let mouse = MAKEPOINTS(lp);
        if(wp & MK_LBUTTON) {
            print(mouse.x, lastMouse.x);
            a1-=(mouse.x-lastMouse.x)/100;
            a2-=(mouse.y-lastMouse.y)/100;
            RedrawWindow(hwnd, 0, 0, width, height, NULL, RDW_ERASE | RDW_INVALIDATE | RDW_UPDATENOW);
        }
        lastMouse = MAKEPOINTS(lp);
    }else if(msg == WM_LBUTTONUP) {
        ReleaseCapture();
    }
}

const winclass = CreateWindowClass("WinClass", /*init, */windowProc);
winclass.hIcon = winclass.hIconSm = LoadIcon(NULL, IDI_APPLICATION);
winclass.hbrBackground = COLOR_BACKGROUND;
winclass.hCursor = LoadCursor(NULL, IDC_ARROW);
print(winclass);
CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_CONTEXTHELP, winclass, "Fake 3d using PlgBlt", WS_CAPTION | WS_SYSMENU | WS_VISIBLE, screenWidth/2-width/2, screenHeight/2-height/2, width, height, 0, 0, hInstance);