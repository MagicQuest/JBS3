let d2d, brush, layout, font, gaussianBlur, blurBmp;
let i = 1;
let blur = false;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1DeviceContext, hwnd);  //DComposition
        brush = d2d.CreateSolidColorBrush(1.0, 1.0, 0.0);
        font = d2d.CreateFont("impact", 40);
        layout = d2d.CreateTextLayout("im dropping dick off\nnigga and other effects!", font, 512, 512);
        gaussianBlur = d2d.CreateEffect(d2d.CLSID_D2D1GaussianBlur);
	print(gaussianBlur, d2d.CLSID_D2D1GaussianBlur, D2D1_GAUSSIANBLUR_PROP_BORDER_MODE, D2D1_BORDER_MODE_HARD);
        gaussianBlur.SetValue("D2D1_GAUSSIANBLUR_PROP_BORDER_MODE", D2D1_BORDER_MODE_HARD); //unfortunately i have to make the first argument a string
        gaussianBlur.SetValue("D2D1_GAUSSIANBLUR_PROP_STANDARD_DEVIATION", 5.0);
        print(font.GetFontFamilyName());
        print(layout.GetFontFamilyName());
        let blue = d2d.CreateSolidColorBrush(1.0, 0.0, 0.0);
        let codegreen = d2d.CreateSolidColorBrush(147/255, 206/255, 168/255);
        let magenta = d2d.CreateSolidColorBrush(1.0, 0.0, 1.0);
        //print(layout.GetLineMetrics(10));
        //print(layout.GetMetrics());
        //print(layout.GetOverhangMetrics());
        layout.SetUnderline(true, "im dropping ".length, "dick".length);
        layout.SetDrawingEffect(blue, "im dropping ".length, "dick".length);
        layout.SetStrikethrough(true, "im dropping dick off\n".length, "nigga".length);
        layout.SetFontFamilyName("gabriola", "im dropping dick off\n".length, "nigga".length);
        layout.SetDrawingEffect(magenta, "im dropping dick off\n".length, "nigga".length);
        layout.SetFontFamilyName("consolas", "im dropping dick off\nand other ".length);
        layout.SetDrawingEffect(codegreen, "im dropping dick off\nand other ".length);
	    //layout.SetDrawingEffect(gaussianBlur, "im ".length, "dropping".length); //idk if this is gonna work lowkey (aw it tried to work but the text just disappeared)
        
        
        blurBmp = d2d.CreateBitmap(512, 512);
        gaussianBlur.SetInput(0, blurBmp);

        print(d2d.backBitmap, d2d.targetBitmap, blurBmp);
        
        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        d2d.BeginDraw();
        d2d.Clear(0.0, 0.0, 0.0, 0.1);
        //brush.SetColor(1.0, 1.0, 1.0, 0.1);
        let {width, height} = d2d.GetSize();
        //print(width, height);
        //d2d.FillRectangle(0,0, width, height, brush);
        //brush.SetColor(1.0, 1.0, 0.0);
        brush.SetColor(1.0, 1.0, 0.0);

        d2d.FillRectangle(0, 0, Math.abs(Math.sin(i/100))*width, Math.abs(Math.cos(i/100))*height, brush);

        d2d.SaveDrawingState();
        
        d2d.SetTransform(Matrix3x2.SetProduct(Matrix3x2.Translation(width/4, height/2), Matrix3x2.Rotation(i, width/2, height/2)));
        
        brush.SetColor(0.0, 1.0, 1.0);
        //print(i);
        font.SetFontSize(i); //oops just found out the hard way that the font size can't be equal to or less than 0
        d2d.DrawText("im dropping dick off", font, 0, 0, width, height, brush);

        d2d.RestoreDrawingState();

        brush.SetColor(0.0, 0.0, 1.0);
        d2d.DrawTextLayout(20, height-132, layout, brush); //apparently DrawTextLayout is more efficient than DrawText (insert lenny face here)
        
        if(blur) {
            d2d.SetTarget(d2d.backBitmap); //can't set blurBmp as target because target bitmaps must be created with the D2D1_BITMAP_OPTIONS_TARGET flag
        }
        d2d.EndDraw(blur); //passing true doesn't call swapChain->Present() (also i set the target to the backbitmap so i can copy the drawings from the backBitmap to the blur bitmap)

        if(blur) {
            d2d.SetTarget(d2d.targetBitmap);
            d2d.BeginDraw();
            blurBmp.CopyFromBitmap(0, 0, d2d.backBitmap, 0, 0, width, height); //copy the previous drawings into the blur bitmap so it can be blurred by the gaussian blur effect (for some reason you can't put d2d.backBitmap as an input)
            //gaussianBlur.SetInput(0, blurBmp); //haha i thought you had to call this every update
            d2d.DrawImage(gaussianBlur, 0, 0, 0, 0, width, height, D2D1_INTERPOLATION_MODE_LINEAR);
            d2d.EndDraw();
        }

        i++;
    }else if(msg == WM_SIZE) {
        let [width, height] = [LOWORD(lp), HIWORD(lp)];
        d2d.Resize(width, height);
        layout.SetMaxWidth(width);
        layout.SetMaxHeight(height);
        
        blurBmp.Release();
        blurBmp = d2d.CreateBitmap(width, height);
        gaussianBlur.SetInput(0, blurBmp);
    }else if(msg == WM_LBUTTONDOWN) {
        blur = !blur;
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
window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "newdirect2d11funcs.js (click to apply d2d11 blur effect!)", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 512+20, 512+42, NULL, NULL, hInstance);