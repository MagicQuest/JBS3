let d2d, brush, gradient, gstop; //bmpBrush, temp;
let i;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd);
        brush = d2d.CreateSolidColorBrush(1.0, 1.0, 0.0);
        gstop = d2d.CreateGradientStopCollection([0.0, 1.0, 0.0, 0.0], [0.5, 0.0, 1.0, 0.0], [1.0, 0.0, 0.0, 1.0]);
        gradient = d2d.CreateLinearGradientBrush(0,0,256,256,gstop);
        //temp = d2d.CreateBitmapFromFilename(__dirname+"/box.bmp"); //"/boxside.png");
        //bmpBrush = d2d.CreateBitmapBrush(temp); //hold on bitmapbrushes work too weird for this example lemme use a gradient
        //brush.SetTransform(d2d.Matrix3x2F.Translation(0, 256)); //only used by bitmap brushes or gradient brushes
        i = 0;
        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        d2d.BeginDraw();
        d2d.Clear(0.0, 0.0, 0.0, 0.1);

        //bmpBrush.SetTransform(d2d.Matrix3x2F.Translation(i, i));
        //watch out bruh Matrix3x2F is global
        gradient.SetTransform(Matrix3x2F.Multiply(Matrix3x2F.Translation(100+Math.sin(i/100)*100, 0), Matrix3x2F.Rotation(i, 128+(100+Math.sin(i/100)*100), 128)));

        d2d.SaveDrawingState();

        //d2d.SetTransform(d2d.Matrix3x2F.Rotation(i, 256, 256));
        //const transPtr = d2d.Matrix3x2F.FromMatrix(d2d.Matrix3x2F.Translation(256, 256)); //yeah this system is too weird i gotta change it
        //const rotPtr = d2d.Matrix3x2F.FromMatrix(d2d.Matrix3x2F.Rotation(i, 256, 256));
        //d2d.SetTransform(d2d.Matrix3x2F.SetProduct(transPtr, rotPtr));
        d2d.SetTransform(Matrix3x2F.Multiply(Matrix3x2F.Translation(256, 256), Matrix3x2F.Rotation(i, 256, 256))); //oh yeah that's better

        //gradient.SetTransform(d2d.Matrix3x2F.SetProduct(d2d.Matrix3x2F.Translation(256, 256), d2d.Matrix3x2F.Rotation(i, 256, 256)));

        d2d.FillRectangle(-128,-128,128,128,gradient);

        d2d.RestoreDrawingState();

        d2d.FillRectangle(100+Math.sin(i/100)*100,0,256+(100+Math.sin(i/100)*100),256,gradient);

        d2d.EndDraw();

        //d2d.Matrix3x2F.DeleteMatrix(transPtr); //oops i was wondering why the memory was still climbing but i forgot that FromMatrix returns a pointer (unfortunately a really weird system)
        //d2d.Matrix3x2F.DeleteMatrix(rotPtr);

        ////if(GetKey(VK_LBUTTON)) {
        ////    d2d.SetTransform(d2d.Matrix3x2F.Rotation(i, 256, 256));
        ////}
        ////d2d.SaveDrawingState();
        ////d2d.Matrix3x2F.Translation(256, 256);
        //d2d.FillRectangle(-25, -25, 25, 25, brush);
        //let transPtr = d2d.Matrix3x2F.FromMatrix(d2d.Matrix3x2F.Translation(256, 256));
        //let rotPtr = d2d.Matrix3x2F.FromMatrix(d2d.Matrix3x2F.Rotation(i, 256, 256));
        //d2d.SetTransform(d2d.Matrix3x2F.SetProduct(transPtr, rotPtr));
        ////d2d.SetTransform(d2d.Matrix3x2F.Translation(256,256));
        ////d2d.RestoreDrawingState(); //passing nothing uses internal drawing state
        ////d2d.FillRectangle(100+Math.sin(i/100)*50, 100, 200, 200, brush); //BRO I WAS DRAWING THE RECTANGLE AFTER THE TRANSFORMATION IM ENDING ITALL (i was so stumped i had to ask chatgpt (and he gave a totally wrong example))
        ////d2d.SetTransform(d2d.Matrix3x2F.Identity());
        //brush = d2d.CreateSolidColorBrush(1.0, 1.0, 0.0);

        ///d2d.SaveDrawingState();
        ///
        ///    d2d.FillRectangle(0, 100, 100, 250, brush);
///
        ///    brush.SetColor(1.0, 0.0, 1.0);
///
        ///    d2d.FillRectangle(100, 100, 250, 250, brush);
///
        ///d2d.RestoreDrawingState();
///
        ///d2d.FillRectangle(250, 100, 512, 250, brush);
///
        ///d2d.EndDraw();
        //brush.Release(); //oops you couldn't release this object before (apparently?)!
        i++;
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        gstop.Release();
        gradient.Release();
        brush.Release();
        d2d.Release();
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_HAND);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "d2doverhaul.js", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 512+16, 512+39, NULL, NULL, hInstance);