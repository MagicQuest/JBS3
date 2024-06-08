//const frontFace = LoadImage(NULL, __dirname+"/box.bmp", IMAGE_BITMAP, 0, 0, LR_SHARED | LR_LOADFROMFILE);
//const sides = LoadImage(NULL, __dirname+"/boxside.bmp", IMAGE_BITMAP, 0, 0, LR_SHARED | LR_LOADFROMFILE);

let mouse = GetMousePos();

let d2d, brush, font;

let stats = {mouse: {left: 0 , right: 0, middle: 0}};

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        //SetWindowPos(hwnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOSIZE | SWP_NOMOVE | SWP_NOACTIVATE);
        SetLayeredWindowAttributes(hwnd, RGB(0,255,0), 5, LWA_COLORKEY);
        //SetCapture(hwnd);
        //SetTimer(hwnd, 1, 16);

        d2d = createCanvas("d2d", ID2D1DCRenderTarget, hwnd);
        brush = d2d.CreateSolidColorBrush(1.0,1.0,0.0,1.0);
        font = d2d.CreateFont("Consolas", 40); //lol impact is just the best default one
        
        InvalidateRect(hwnd, 0, 0, 1920, 1080, true);
        UpdateWindow(hwnd); //draw immediately

        //d2d.BindDC(hwnd);

    //}else if(msg == WM_PAINT) {
    //    d2d.BeginDraw();
    //    //d2d.Clear(0, 255, 0);
    //    d2d.FillEllipse(mouse.x, mouse.y, 2, 2, brush); //this is evil
    //    d2d.DrawText("clicks: "+stats.mouse.left, font, 0, 1080/2, 1920, 1080, brush);
    //    d2d.EndDraw();
    //    //const ps = BeginPaint(hwnd);
    //    ////FillRect(ps.hdc, 0, 0, 1920, 400, NULL);
    //    //FillRect(ps.hdc, mouse.x-10, mouse.y-10, mouse.x+10, mouse.y+10, NULL);
    //    //EndPaint(hwnd, ps);
    }else if(msg == WM_KEYDOWN) {
        if(wp == VK_ESCAPE) {
            DestroyWindow(hwnd);
        }
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }//else if(msg == WM_MOUSEMOVE) {
        //mouse = GetMousePos();
        //print("mouse move");
        //if(wp & MK_LBUTTON) {
        //    RedrawWindow(hwnd, 0, 0, 1920, 1080, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
        //}
    //}else if(msg == WM_KILLFOCUS) {
        //SetWindowPos(hwnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOSIZE | SWP_NOMOVE | SWP_NOACTIVATE); //force on top
    //}else if(msg == WM_TIMER) {
        //SetCapture(hwnd);
        //if(GetKey(VK_LBUTTON)) {
        //mouse = GetMousePos();
        //RedrawWindow(hwnd, 0, 0, 1920, 1080, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
        //}

    //}
}

function GatherData() {
    if(GetKeyDown(VK_LBUTTON)) {
        stats.mouse.left++;
    }
    if(GetKeyDown(VK_RBUTTON)) {
        stats.mouse.right++;
    }
    if(GetKeyDown(VK_MBUTTON)) {
        stats.mouse.middle++;
    }
}

let start = Date.now();

function loop() {
    mouse = GetMousePos();
    GatherData();
    if((Date.now()-start) % 32 == 0) {
        //RedrawWindow(hwnd, 0, 0, 1920, 1080, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
        d2d.BeginDraw();
        //d2d.Clear(0, 1, 0, .5);
        brush.SetColor(.25,.25,.25, 0.1);
        d2d.FillRectangle(0, 1080/1.25, 400, 1080/1.25+120, brush);
        brush.SetColor(1, 1, 0);
        //d2d.FillEllipse(mouse.x, mouse.y, 2, 2, brush); //this is evil
        d2d.DrawText("left clicks: "+stats.mouse.left, font, 0, 1080/1.25, 1920, 1080, brush);
        d2d.DrawText("right clicks: "+stats.mouse.right, font, 0, 1080/1.25+40, 1920, 1080, brush);
        d2d.DrawText("middle clicks: "+stats.mouse.middle, font, 0, 1080/1.25+80, 1920, 1080, brush);

        d2d.EndDraw();
        //const ps = BeginPaint(hwnd);
        ////FillRect(ps.hdc, 0, 0, 1920, 400, NULL);
        //FillRect(ps.hdc, mouse.x-10, mouse.y-10, mouse.x+10, mouse.y+10, NULL);
        //EndPaint(hwnd, ps);
    }
}

const winclass = CreateWindowClass("WinClass", /*init, */windowProc, loop); //i just remembered i could loop
winclass.hIcon = winclass.hIconSm = LoadIcon(NULL, IDI_APPLICATION);
winclass.hbrBackground = CreateSolidBrush(RGB(0,255,0));
winclass.hCursor = LoadCursor(NULL, IDC_HANDWRITING);
winclass.style = CS_HREDRAW | CS_VREDRAW;
print(winclass);        //toolwindow to hide it from alt+tab ;)
CreateWindow(WS_EX_LAYERED | WS_EX_TOOLWINDOW | WS_EX_TOPMOST, winclass, "", WS_POPUP | WS_VISIBLE, 0,0,1920,1080, NULL, NULL, hInstance);
ReleaseCapture();