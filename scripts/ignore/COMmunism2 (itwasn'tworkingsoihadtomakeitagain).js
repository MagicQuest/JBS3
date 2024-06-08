let d2d, brush, gaussianBlur, blurBmp, bluebrush;
let i = 1;
let blur = false;
const fazepngs = [];
let frame = 0;
let lastFrameTime = 0;

let vlone;

function DrawVlone(x = 500, y = 128, scale = 1.0) {
    let trans = d2d.CreateEffect(d2d.CLSID_D2D12DAffineTransform);
    if (scale == 1.0) {
        let ds = ApplyDropShadow(vlone);
        //ComPtr<ID2D1Effect> scalar; d2dcontext->CreateEffect(CLSID_D2D1Scale, &scalar);
        trans.SetInputEffect(0, ds);
    }
    else {
        trans.SetInput(0, vlone);
    }
    let matrix = Matrix3x2F.Scale(scale + (Math.sin(i / 50) / (4/scale)), scale + (Math.cos(i / 50 - 1) / (4/scale)), 128, 128);
    trans.SetValue("D2D1_2DAFFINETRANSFORM_PROP_TRANSFORM_MATRIX", matrix);

    //ComPtr<ID2D1Effect> screen; d2dcontext->CreateEffect(CLSID_D2D1Blend, &screen);
    //screen->SetInputEffect(0, trans.Get());
    //screen->SetInput(, d2dTargetBitmap.Get());
    //screen->SetValue(D2D1_BLEND_PROP_MODE, D2D1_BLEND_MODE_SCREEN);
    
    //ComPtr<ID2D1Effect> hue; d2dcontext->CreateEffect(CLSID_D2D1HueRotation, &hue);
    //hue->SetInputEffect(0, trans.Get());
    //float angle = fmod(fabs(i), 360);
    //hue->SetValue(D2D1_HUEROTATION_PROP_ANGLE, angle);
    //
    //ComPtr<ID2D1Effect> grey; d2dcontext->CreateEffect(CLSID_D2D1Contrast, &grey);
    //grey->SetInputEffect(0, hue.Get());
    //grey->SetValue(D2D1_CONTRAST_PROP_CONTRAST, 1000.0f);
    //
    //ComPtr<ID2D1Effect> bright; d2dcontext->CreateEffect(CLSID_D2D1Exposure, &bright);
    //bright->SetInputEffect(0, grey.Get());
    //bright->SetValue(D2D1_EXPOSURE_PROP_EXPOSURE_VALUE, 1000.0f);
    let tint = d2d.CreateEffect(d2d.CLSID_D2D1Tint);
    tint.SetInputEffect(0, trans);
    tint.SetValue("D2D1_TINT_PROP_COLOR", 1.0, (Math.sin(i / 80) + 1)/2, (Math.sin(i / 80)+1)/2, 1.0);

    let hue = d2d.CreateEffect(d2d.CLSID_D2D1HueRotation);
    hue.SetInputEffect(0, tint);
    let angle = i%360;
    hue.SetValue("D2D1_HUEROTATION_PROP_ANGLE", angle);

    //scalar->SetInputEffect(0, ds.Get());
    //scalar->SetValue(D2D1_SCALE_PROP_SCALE, D2D1::Vector2F(1.0f+(sin(i/100.f)/2.f), 1.0f+(cos(i/100.f-1)/2.f)));
    d2d.DrawImage(hue, x, y);

    trans.Release();
    tint.Release();
    hue.Release();
}

function ApplyDropShadow(ff) {
    let shadowEffect = d2d.CreateEffect(d2d.CLSID_D2D1Shadow);

    shadowEffect.SetInput(0, ff);

    // Shadow is composited on top of a white surface to show opacity.
    //ComPtr<ID2D1Effect> floodEffect;
    //d2dcontext->CreateEffect(CLSID_D2D1Flood, &floodEffect);
    //
    //floodEffect->SetValue(D2D1_FLOOD_PROP_COLOR, D2D1::Vector4F(1.0f, 1.0f, 1.0f, 1.0f));

    let affineTransformEffect = d2d.CreateEffect(d2d.CLSID_D2D12DAffineTransform);

    affineTransformEffect.SetInputEffect(0, shadowEffect);

    let matrix = Matrix3x2F.Translation(5, 5);

    affineTransformEffect.SetValue("D2D1_2DAFFINETRANSFORM_PROP_TRANSFORM_MATRIX", matrix);

    let compositeEffect = d2d.CreateEffect(d2d.CLSID_D2D1Composite);

    //compositeEffect->SetInputEffect(0, floodEffect.Get());
    compositeEffect.SetInputEffect(0, affineTransformEffect);
    compositeEffect.SetInput(1, ff);

    //d2dcontext->DrawImage(compositeEffect.Get());
    return compositeEffect;
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        wic = InitializeWIC();
        d2d = createCanvas("d2d", ID2D1DeviceContext, hwnd, wic);  //DComposition
        brush = d2d.CreateSolidColorBrush(1.0, 1.0, 0.0);
        bluebrush = d2d.CreateSolidColorBrush(0.0, 0.0, 1.0);

        gaussianBlur = d2d.CreateEffect(d2d.CLSID_D2D1GaussianBlur);
	print(gaussianBlur, d2d.CLSID_D2D1GaussianBlur, D2D1_GAUSSIANBLUR_PROP_BORDER_MODE, D2D1_BORDER_MODE_HARD);
        gaussianBlur.SetValue("D2D1_GAUSSIANBLUR_PROP_BORDER_MODE", D2D1_BORDER_MODE_HARD); //unfortunately i have to make the first argument a string
        gaussianBlur.SetValue("D2D1_GAUSSIANBLUR_PROP_STANDARD_DEVIATION", 5.0);        
        
        blurBmp = d2d.CreateBitmap(1280, 720);
        gaussianBlur.SetInput(0, blurBmp);

        print(d2d.backBitmap, d2d.targetBitmap, blurBmp);
        
        for(let i = 1; i < 25; i++) {
            print(`${__dirname}/faze/hdpng00${i < 10 ? "0"+i : i}.png`);
            fazepngs.push(d2d.CreateBitmapFromFilename(`${__dirname}/faze/hdpng00${i < 10 ? "0"+i : i}.png`));
        }

        vlone = d2d.CreateBitmapFromFilename(`${__dirname}/VShapeBanner.png`);

        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        frame = (frame+1)%24;

        SetWindowText(hwnd, `COMmunism.js (${Math.round(1000/(Date.now()-lastFrameTime))}~ fps)`);
        lastFrameTime = Date.now();

        d2d.BeginDraw();
        d2d.Clear(1.0, 1.0, 0.0);
        
        let mouse = GetCursorPos();

        d2d.DrawEllipse(mouse.x, mouse.y, 100, 100, bluebrush, 180);

        let {width, height} = d2d.GetSize();

        d2d.DrawImage(ApplyDropShadow(fazepngs[frame]));

        //d2d.EndDraw();

        if(blur) {
            d2d.SetTarget(d2d.backBitmap); //can't set blurBmp as target because target bitmaps must be created with the D2D1_BITMAP_OPTIONS_TARGET flag
        }else {
            DrawVlone();
        }
        d2d.EndDraw(blur); //passing true doesn't call swapChain->Present() (also i set the target to the backbitmap so i can copy the drawings from the backBitmap to the blur bitmap)

        if(blur) {
            d2d.SetTarget(d2d.targetBitmap);
            d2d.BeginDraw();
            blurBmp.CopyFromBitmap(0, 0, d2d.backBitmap, 0, 0, width, height); //copy the previous drawings into the blur bitmap so it can be blurred by the gaussian blur effect (for some reason you can't put d2d.backBitmap as an input)
            //gaussianBlur.SetInput(0, blurBmp); //haha i thought you had to call this every update
            d2d.DrawImage(gaussianBlur);//, 0, 0, 0, 0, width, height, D2D1_INTERPOLATION_MODE_LINEAR);
            DrawVlone();
            d2d.EndDraw();
        }

        i++;
    }else if(msg == WM_SIZE) {
        let [width, height] = [LOWORD(lp), HIWORD(lp)];
        d2d.Resize(width, height);
        
        blurBmp.Release();
        blurBmp = d2d.CreateBitmap(width, height);
        gaussianBlur.SetInput(0, blurBmp);
    }else if(msg == WM_KEYDOWN) {
        if(wp == 'B'.charCodeAt(0)) {
            blur = !blur;
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
window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "COMmunism2.js", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 1280+20, 720+42, NULL, NULL, hInstance);