let d2d, brush, gaussianBlur, hueEffect, compositeEffect;
let i = 1;
let blur = false;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1DeviceContextDComposition, hwnd);  //DComposition
        brush = d2d.CreateSolidColorBrush(1.0, 1.0, 0.0);
        gaussianBlur = d2d.CreateGaussianBlurEffect();
        gaussianBlur.SetStandardDeviation(10.0);
        gaussianBlur.SetBorderMode(D2D1_BORDER_MODE_HARD);

        hueEffect = d2d.CreateHueRotationEffect();
        hueEffect.SetAngle(Math.random()*360);

        compositeEffect = d2d.CreateCompositeEffect();

        compositeEffect.SetInput(0, gaussianBlur);
        compositeEffect.SetInput(1, hueEffect);

        d2d.SetEffect(compositeEffect); //oh shoot i didn't realize the compositeEffect would put them on top of eachother but it looks kinda cool
        d2d.Commit(); //you gotta commit after applying an effect
        
        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        d2d.BeginDraw();
        //d2d.Clear(0.0, 0.0, 0.0, 0.1);
        d2d.Clear(0.0, 0.0, 0.0, 0.0);

        let {width, height} = d2d.GetSize();

        brush.SetColor(1.0, 1.0, 0.0);
        d2d.FillRectangle(0, 0, Math.abs(Math.sin(i/100))*width, Math.abs(Math.cos(i/100))*height, brush);

        d2d.SaveDrawingState();
        
        d2d.SetTransform(Matrix3x2F.SetProduct(Matrix3x2F.Translation(width/4, height/2), Matrix3x2F.Rotation(i, width/2, height/2)));
        
        brush.SetColor(0.0, 1.0, 1.0);
        d2d.FillRectangle(0, 0, 100, 100, brush);

        d2d.RestoreDrawingState();

        d2d.EndDraw();

        i++;
    }else if(msg == WM_SIZE) {
        let [width, height] = [LOWORD(lp), HIWORD(lp)];
        d2d.Resize(width, height);
    }else if(msg == WM_MOUSEMOVE) {
        if((wp & MK_LBUTTON) == MK_LBUTTON) {
            let {left, top, right, bottom} = GetClientRect(hwnd);
            print((LOWORD(lp)/right)*100, (HIWORD(lp)/bottom)*360);
            gaussianBlur.SetStandardDeviation((LOWORD(lp)/right)*100);
            hueEffect.SetAngle((HIWORD(lp)/bottom)*360);
            d2d.Commit(); //commit after changing effects
        }
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        d2d.Release();
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_HAND);
    //for DirectComposition you NEED to specify WS_EX_NOREDIRECTIONBITMAP
window = CreateWindow(WS_EX_NOREDIRECTIONBITMAP, wc, "newdcompfuncs.js (click and drag to change blur and hue!)", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 512+20, 512+42, NULL, NULL, hInstance);