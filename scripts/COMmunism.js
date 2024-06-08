//based on a visual studio project i made for testing direct2d11 (like 5 months ago HOLY)

let wic;
let d2d, brush, gaussianBlur, blurBmp, bluebrush;
let i = 1;
let blur = false;
const fazepngs = [];
let frame = 0;
let lastFrameTime = 0;

let shadowEffect, affineTransformEffect, compositeEffect, tintEffect, hueEffect, scaleEffect, transEffect;

let vlone;

let pointer = LoadCursor(NULL, IDC_HAND);
let def = LoadCursor(NULL, IDC_ARROW);

const miniVlones = [];

class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    Add(PosRHS) {
        this.x += PosRHS.x;
        this.y += PosRHS.y;
        return this;
    }

    Equal(PosRHS) {
        return (this.x == PosRHS.x && this.y == PosRHS.y);
    }
}

class VLONE {
    constructor(x, y) {
        this.pos = new Vector2(x-128, y-128);

        this.vel = new Vector2(((Math.random()-.5)*2)*20, ((Math.random()-.5)*2)*20); //generating random velocities from -20 to 20

        this.faze = (Math.round(Math.random()*10) == 0);
    }
}

//function ApplyDropShadow(bitmap) { //im suprised with function worked without much error (i took it straight from the aforementioned COMmunism project and had to js-ify it)
//    let shadowEffect = d2d.CreateEffect(d2d.CLSID_D2D1Shadow);
//
//    shadowEffect.SetInput(0, bitmap);
//
//    let affineTransformEffect = d2d.CreateEffect(d2d.CLSID_D2D12DAffineTransform);
//
//    affineTransformEffect.SetInputEffect(0, shadowEffect);
//
//    let matrix = Matrix3x2F.Translation(5, 5);
//
//    affineTransformEffect.SetValue("D2D1_2DAFFINETRANSFORM_PROP_TRANSFORM_MATRIX", matrix);
//
//    let compositeEffect = d2d.CreateEffect(d2d.CLSID_D2D1Composite);
//
//    //compositeEffect->SetInputEffect(0, floodEffect.Get());
//    compositeEffect.SetInputEffect(0, affineTransformEffect);
//    compositeEffect.SetInput(1, bitmap);
//
//    //d2dcontext->DrawImage(compositeEffect.Get());
//    return compositeEffect;
//}

function ApplyDropShadow(bitmap) {
    shadowEffect.SetInput(0, bitmap);
    compositeEffect.SetInput(1, bitmap);
    return compositeEffect;
}

function DrawVlone(x = 500, y = 128, scale = 1.0) {
    //let transEffect = d2d.CreateEffect(d2d.CLSID_D2D12DAffineTransform); //ok i have no idea why but creating this every frame fucks up the memory even though im calling release
    if (scale == 1.0) {
        //let ds = ApplyDropShadow(vlone);
        //ComPtr<ID2D1Effect> scalar; d2dcontext->CreateEffect(CLSID_D2D1Scale, &scalar);
        transEffect.SetInputEffect(0, ApplyDropShadow(vlone));
    }
    else {
        transEffect.SetInput(0, vlone);
    }
    let matrix = Matrix3x2F.Scale(scale + (Math.sin(i / 50) / (4/scale)), scale + (Math.cos(i / 50 - 1) / (4/scale)), 128, 128);
    transEffect.SetValue("D2D1_2DAFFINETRANSFORM_PROP_TRANSFORM_MATRIX", matrix);

    tintEffect.SetInputEffect(0, transEffect);
    tintEffect.SetValue("D2D1_TINT_PROP_COLOR", 1.0, (Math.sin(i / 80) + 1)/2, (Math.sin(i / 80)+1)/2, 1.0); //D2D1_VECTOR_XF values are set with X+1 amount of parameters 

    hueEffect.SetInputEffect(0, tintEffect)
    let angle = i%360;
    hueEffect.SetValue("D2D1_HUEROTATION_PROP_ANGLE", angle);

    d2d.DrawImage(hueEffect, x, y);//, 0, 0, 256*scale, 256*scale, D2D1_INTERPOLATION_MODE_LINEAR);

    //transEffect.SetInputEffect(0, NULL);
    //transEffect.SetInput(0, NULL);
    //tintEffect.SetInputEffect(0, NULL);
    //hueEffect.SetInputEffect(0, compositeEffect);

    //transEffect.Release(); //idk why this isn't working
    //transEffect = NULL;

    //print(transEffect.internalPtr.toString(16), transEffect.Release(), "skibi");
    //PostQuitMessage(0);

    //let t = d2d.CreateEffect(NULL);
    //t.Release();
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        wic = InitializeWIC();
        d2d = createCanvas("d2d", ID2D1DeviceContext, hwnd, wic);  //DComposition
        brush = d2d.CreateSolidColorBrush(1.0, 1.0, 0.0);
        bluebrush = d2d.CreateSolidColorBrush(0.0, 0.0, 1.0);

        gaussianBlur = d2d.CreateEffect(d2d.CLSID_D2D1GaussianBlur);

        gaussianBlur.SetValue("D2D1_GAUSSIANBLUR_PROP_BORDER_MODE", D2D1_BORDER_MODE_HARD); //unfortunately i have to make the first argument a string
        gaussianBlur.SetValue("D2D1_GAUSSIANBLUR_PROP_STANDARD_DEVIATION", 5.0);
        
        blurBmp = d2d.CreateBitmap(1280, 720);
        gaussianBlur.SetInput(0, blurBmp);

        print(d2d.backBitmap, d2d.targetBitmap, blurBmp);
        
        for(let i = 1; i < 25; i++) {
            print(`${__dirname}/faze/hdpng00${i < 10 ? "0"+i : i}.png`);
            fazepngs.push(d2d.CreateBitmapFromFilename(`${__dirname}/faze/hdpng00${i < 10 ? "0"+i : i}.png`));
        }

        shadowEffect = d2d.CreateEffect(d2d.CLSID_D2D1Shadow);

        affineTransformEffect = d2d.CreateEffect(d2d.CLSID_D2D12DAffineTransform);
        affineTransformEffect.SetInputEffect(0, shadowEffect);

        matrix = Matrix3x2F.Translation(5, 5);
        affineTransformEffect.SetValue("D2D1_2DAFFINETRANSFORM_PROP_TRANSFORM_MATRIX", matrix);

        compositeEffect = d2d.CreateEffect(d2d.CLSID_D2D1Composite);
        //compositeEffect->SetInputEffect(0, floodEffect.Get());
        compositeEffect.SetInputEffect(0, affineTransformEffect);

        vlone = d2d.CreateBitmapFromFilename(`${__dirname}/VShapeBanner.png`);

        tintEffect = d2d.CreateEffect(d2d.CLSID_D2D1Tint); //BRUH CLSID_D2D1Tint was NOT defined because i didn't know there was ANOTHER d2d1 effects header
        hueEffect = d2d.CreateEffect(d2d.CLSID_D2D1HueRotation);
        hueEffect.SetInputEffect(0, tintEffect);

        scaleEffect = d2d.CreateEffect(d2d.CLSID_D2D12DAffineTransform);
        scaleEffect.SetValue("D2D1_2DAFFINETRANSFORM_PROP_TRANSFORM_MATRIX", Matrix3x2F.Scale(.5, .5, 128, 128));
        scaleEffect.SetInputEffect(0, hueEffect);

        transEffect = d2d.CreateEffect(d2d.CLSID_D2D12DAffineTransform);

        for (let j = 0; j < 100; j++) {
            miniVlones.push(new VLONE(628, 256));
        }

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
        
        miniVlones.push(new VLONE(628, 256));

        d2d.DrawImage(ApplyDropShadow(fazepngs[frame]));

        const deletevlones = [];

        for(let minivlone of miniVlones) {
            if(minivlone.pos.y > height - 128) {
                deletevlones.push(minivlone);
            }else {
                minivlone.vel.y += .1;
                minivlone.pos.Add(minivlone.vel);
                //ok no lie everything past this point in this if statement causes climbing memory and idk why yet
                if(!minivlone.faze) {
                    DrawVlone(minivlone.pos.x, minivlone.pos.y, .25);
                }else {
                    
                    //let scale = d2d.CreateEffect(d2d.CLSID_D2D12DAffineTransform);
                    //scale.SetValue("D2D1_2DAFFINETRANSFORM_PROP_TRANSFORM_MATRIX", Matrix3x2F.Scale(.5, .5, 128, 128));

                    hueEffect.SetInputEffect(0, compositeEffect);
                    let angle = i%360;
                    hueEffect.SetValue("D2D1_HUEROTATION_PROP_ANGLE", angle);
                    
                    scaleEffect.SetInputEffect(0, hueEffect); //already set earlier in WM_CREATE
                    
                    d2d.DrawImage(scaleEffect, minivlone.pos.x, minivlone.pos.y);

                    //scale.Release();
                }
            }
        }

        print(miniVlones.length, `delete queue: ${deletevlones.length}`);

        for(let minivlone of deletevlones) {
            miniVlones.splice(miniVlones.findIndex((vlone) => vlone.pos.Equal(minivlone.pos)), 1);
        }

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
    }else if(msg == WM_MOUSEMOVE || msg == WM_LBUTTONDOWN) {
        const width = 128 * (1.0 + (Math.sin(i / 50) / 4));
        const height = 128 * (1.0 + (Math.cos(i / 50 - 1) / 4));

        //ok so the math goes like this 500+128 (128 because i scale at 128xy center) -> 628 and i would normally have done 500+128 + (width/2) but i can cut out the divide by only multiplying width and height by 128 istead of 256

        if (LOWORD(lp) > 628 - width && LOWORD(lp) < 628 + width && HIWORD(lp) > 256 - height && HIWORD(lp) < 256 + height) {
            SetCursor(pointer);
            if(msg == WM_LBUTTONDOWN) {
                for (let j = 0; j < 100; j++) {
                    miniVlones.push(new VLONE(LOWORD(lp), HIWORD(lp)));
                }
            }
            //WNDCLASS* wc = (WNDCLASS*)GetWindowLongPtr(hwnd, GWLP_WNDPROC);
            //wc->hCursor = pointer;
            //SetWindowLongPtr(hwnd, GWLP_WNDPROC, (LONG_PTR)&wc);
        }
        else {
            SetCursor(def);
        }
    }else if(msg == WM_KEYDOWN) {
        if(wp == 'B'.charCodeAt(0)) {
            blur = !blur;
        }
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        for(const png of fazepngs) {
            png.Release();
        }
        brush.Release();
        gaussianBlur.Release();
        blurBmp.Release();
        bluebrush.Release();
        shadowEffect.Release();
        affineTransformEffect.Release();
        compositeEffect.Release();
        tintEffect.Release();
        hueEffect.Release();
        vlone.Release();
        d2d.Release();
        wic.Release();
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = NULL;
    //for DirectComposition you NEED to specify WS_EX_NOREDIRECTIONBITMAP
window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "COMmunism.js", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 1280+20, 720+42, NULL, NULL, hInstance);