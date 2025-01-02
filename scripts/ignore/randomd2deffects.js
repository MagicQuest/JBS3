let w = 800;
let h = 600;

const wic = InitializeWIC();

let d2d, imagine, tiled, colorBrush;
let lighting, noise, composite;
let focus = 1;
let mouse;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        //ScopeGUIDs(wic);
        d2d = createCanvas("d2d", ID2D1DeviceContext, hwnd, wic);
        imagine = d2d.CreateBitmapFromFilename(__dirname+"/../imagine.bmp", 0);
        tiled = d2d.CreateBitmapBrush(imagine);
        tiled.SetExtendMode(D2D1_EXTEND_MODE_WRAP, D2D1_EXTEND_MODE_WRAP);
        colorBrush = d2d.CreateSolidColorBrush(1.0, 1.0, 1.0, 1.0);
        tiled.SetTransform(Matrix3x2F.Scale(.25, .25, 0, 0));

        lighting = d2d.CreateEffect(d2d.CLSID_D2D1SpotSpecular);
        lighting.SetValue("D2D1_SPOTSPECULAR_PROP_LIGHT_POSITION", w/2, h/2, 1);
        lighting.SetValue("D2D1_SPOTSPECULAR_PROP_POINTS_AT", 0, 0);
        //lighting.SetInput(0, imagine); //yes

        noise = d2d.CreateEffect(d2d.CLSID_D2D1Turbulence);
        noise.SetValue("D2D1_TURBULENCE_PROP_SIZE", w, h);

        composite = d2d.CreateEffect(d2d.CLSID_D2D1Composite);
        composite.SetValue("D2D1_COMPOSITE_PROP_MODE", D2D1_COMPOSITE_MODE_PLUS);
        composite.SetInput(0, imagine);
        composite.SetInputEffect(1, noise);

        lighting.SetInputEffect(0, composite);

        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_MOUSEMOVE) {
        mouse = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)};
        lighting.SetValue("D2D1_SPOTSPECULAR_PROP_POINTS_AT", mouse.x, mouse.y);
        print(mouse.x, mouse.y);
    }else if(msg == WM_MOUSEWHEEL) {
        const scrollY = GET_WHEEL_DELTA_WPARAM(wp)/-120;
        focus += scrollY;
        print(scrollY, focus);
        lighting.SetValue("D2D1_SPOTSPECULAR_PROP_FOCUS", focus);
    }else if(msg == WM_TIMER) {
        d2d.BeginDraw();
        d2d.Clear(0.0, 0.0, 0.0, 1.0); 
        //d2d.FillRectangle(0, 0, w, h, tiled);
        //d2d.DrawImage(lighting);
        d2d.DrawImage(composite);
        d2d.EndDraw();
    }else if(msg == WM_SIZE) {
        w = LOWORD(lp);
        h = HIWORD(lp);
        d2d.Resize(w, h);
        noise.SetValue("D2D1_TURBULENCE_PROP_SIZE", w, h);
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("randomd2deffects.js", windowProc);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "randomd2deffects.js", WS_OVERLAPPEDWINDOW | WS_VISIBLE, 0, 0, w, h, NULL, NULL, hInstance);