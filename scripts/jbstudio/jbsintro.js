let wic, d2d, shadow, scale, composite, gaussian, jbs;
let i = 1;

//function sus() {
//    let t = d2d.CreateEffect(NULL);
//    //print(t.Release());
//    t.Release();
//}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        wic = InitializeWIC();
        d2d = createCanvas("d2d", ID2D1DeviceContextDComposition, hwnd, wic);  //DComposition        
        print(d2d.backBitmap, d2d.targetBitmap);
        
        jbs = d2d.CreateBitmapFromFilename(`${__dirname}/jbs3render.png`);

        shadow = d2d.CreateEffect(d2d.CLSID_D2D1Shadow);
        shadow.SetInput(0, jbs);
        shadow.SetValue("D2D1_SHADOW_PROP_BLUR_STANDARD_DEVIATION", 10);
        scale = d2d.CreateEffect(d2d.CLSID_D2D12DAffineTransform);
        scale.SetValue("D2D1_2DAFFINETRANSFORM_PROP_TRANSFORM_MATRIX", Matrix3x2F.Scale(1.05, 1.05, 256, 256));
        scale.SetInputEffect(0, shadow);
        composite = d2d.CreateEffect(d2d.CLSID_D2D1Composite);
        composite.SetInputEffect(0, scale);
        composite.SetInput(1, jbs);
        gaussian = d2d.CreateEffect(d2d.CLSID_D2D1GaussianBlur);
        gaussian.SetInputEffect(0, composite);
        gaussian.SetValue("D2D1_GAUSSIANBLUR_PROP_STANDARD_DEVIATION", 0.0);

        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        d2d.BeginDraw();
        d2d.Clear(0.0, 0.0, 0.0, 0.0);

        d2d.SetTransform(Matrix3x2F.Multiply(Matrix3x2F.Scale(200/(i+200), 200/(i+200), 256, 256), Matrix3x2F.Rotation(i/10, 256, 256)));

        d2d.DrawImage(gaussian);

        d2d.EndDraw();

        if(i > 40) {
            gaussian.SetValue("D2D1_GAUSSIANBLUR_PROP_STANDARD_DEVIATION", i-40);
            if(i > 75) {
                DestroyWindow(hwnd);
            }
        }

        i++;
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        composite.Release();
        scale.Release();
        shadow.Release();
        jbs.Release();
        d2d.Release();
        wic.Release();
    }
}

const wc = CreateWindowClass("jbsintro", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);
                                                                     //oh yeah forgot that one
window = CreateWindow(WS_EX_NOREDIRECTIONBITMAP | WS_EX_TOOLWINDOW | WS_EX_TOPMOST, wc, "jbstudio3.js", WS_POPUP | WS_VISIBLE, screenWidth/2 - (512/2), screenHeight/2 - (512/2), 512, 512, NULL, NULL, hInstance);

{
    eval(require("fs").read(`${__dirname}/jbstudio3.js`));
}