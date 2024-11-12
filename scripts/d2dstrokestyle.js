//lowkey never actually implemented this one this whole time for some reason

//cool tool if i can ever be bothered to recreate it: https://codexpertro.wordpress.com/2023/05/28/direct2d-line-stroke-styles/

const w = 1000;
const h = 512;

let d2d, dashStrokeStyle, customStrokeStyle, colorBrush, gradientBrush, gradientStop;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd);
        dashStrokeStyle = d2d.CreateStrokeStyle(D2D1_CAP_STYLE_SQUARE, D2D1_CAP_STYLE_SQUARE, D2D1_CAP_STYLE_SQUARE, D2D1_LINE_JOIN_MITER, 100, D2D1_DASH_STYLE_DASH, 0, D2D1_STROKE_TRANSFORM_TYPE_NORMAL, NULL);
        colorBrush = d2d.CreateSolidColorBrush(1.0, 1.0, 1.0, 1.0);
        gradientStop = d2d.CreateGradientStopCollection([0.0, 1.0, 0.0, 0.0], [0.33, 0.0, 1.0, 0.0], [0.66, 0.0, 0.0, 1.0]);
        gradientBrush = d2d.CreateLinearGradientBrush(5, 5, 55, 55, gradientStop);
        
        //using this random list from https://learn.microsoft.com/en-us/windows/win32/Direct2D/id2d1factory-createstrokestyle
        const dashes = [1.0, 2.0, 2.0, 3.0, 2.0, 2.0]; //idk what these numbers mean or how to make a custom dash thing
        customStrokeStyle = d2d.CreateStrokeStyle(D2D1_CAP_STYLE_SQUARE, D2D1_CAP_STYLE_SQUARE, D2D1_CAP_STYLE_SQUARE, D2D1_LINE_JOIN_MITER, 100, D2D1_DASH_STYLE_CUSTOM, 0, D2D1_STROKE_TRANSFORM_TYPE_NORMAL, dashes);
        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        d2d.BeginDraw();
        d2d.Clear(.2, .2, .2);
        let i = 0;
        d2d.DrawRectangle((i*50 + i*10)+5, 5, (i*50+i*10+5)+50, 50+5, colorBrush, 5, dashStrokeStyle); i++; //bruh for some reason (since it's left top right bottom instead of left top width height) it was really confusing me how to pad these out automagically
        d2d.DrawRectangle((i*50 + i*10)+5, 5, (i*50+i*10+5)+50, 50+5, colorBrush, 5, customStrokeStyle); i++;
        d2d.DrawGradientRectangle((i*50 + i*10)+5, 5, (i*50+i*10+5)+50, 50+5, gradientBrush, 0, 5, dashStrokeStyle); i++;
        d2d.DrawGradientRectangle((i*50 + i*10)+5, 5, (i*50+i*10+5)+50, 50+5, gradientBrush, 0, 5, customStrokeStyle); i++;
        d2d.DrawEllipse((i*50 + i*10)+5+25, 5+25, 50/2, 50/2, colorBrush, 5, dashStrokeStyle); i++;
        d2d.DrawEllipse((i*50 + i*10)+5+25, 5+25, 50/2, 50/2, colorBrush, 5, customStrokeStyle); i++;
        d2d.DrawGradientEllipse((i*50 + i*10)+5+25, 5+25, 50/2, 50/2, gradientBrush, 0, 5, dashStrokeStyle); i++;
        d2d.DrawGradientEllipse((i*50 + i*10)+5+25, 5+25, 50/2, 50/2, gradientBrush, 0, 5, customStrokeStyle); i++;
        d2d.DrawRoundedRectangle((i*50 + i*10)+5, 5, (i*50+i*10+5)+50, 50+5, 5, 5, colorBrush, 5, customStrokeStyle); i++;
        d2d.DrawRoundedRectangle((i*50 + i*10)+5, 5, (i*50+i*10+5)+50, 50+5, 5, 5, colorBrush, 5, customStrokeStyle); i++;
        d2d.DrawGradientRoundedRectangle((i*50 + i*10)+5, 5, (i*50+i*10+5)+50, 50+5, 5, 5, gradientBrush, 0, 5, customStrokeStyle); i++;
        d2d.DrawGradientRoundedRectangle((i*50 + i*10)+5, 5, (i*50+i*10+5)+50, 50+5, 5, 5, gradientBrush, 0, 5, customStrokeStyle); i++;
        d2d.DrawLine((i*50 + i*10)+5, 5, (i*50+i*10+5)+50, 50+5, colorBrush, 5, dashStrokeStyle); i++;
        d2d.DrawLine((i*50 + i*10)+5, 5, (i*50+i*10+5)+50, 50+5, colorBrush, 5, customStrokeStyle); i++;
        d2d.DrawGradientLine((i*50 + i*10)+5, 5, (i*50+i*10+5)+50, 50+5, gradientBrush, 0, 5, dashStrokeStyle); i++;
        d2d.DrawGradientLine((i*50 + i*10)+5, 5, (i*50+i*10+5)+50, 50+5, gradientBrush, 0, 5, customStrokeStyle); i++;
        //no draw geometry here but just trust the process (and by that i mean see d2dpaths.js !)
        //d2d.DrawRectangle(5, 5, 50+5, 50+5, colorBrush, 5, dashStrokeStyle); i++;
        //d2d.DrawRectangle(50+10+5, 5, (50+10+5)+50, 50+5, colorBrush, 5, customStrokeStyle); i++;
        //d2d.DrawRectangle(100+20+5, 5, (100+20+5)+50, 50+5, colorBrush, 5, dashStrokeStyle); i++;
        //d2d.DrawRectangle((i*55)+5, 5, (i*50)+55, 55, colorBrush, 5, dashStrokeStyle); i++;
        //d2d.DrawRectangle((i*55)+5, 5, (i*50)+55, 55, colorBrush, 5, customStrokeStyle); i++;
        //d2d.DrawGradientRectangle((i*55)+5, 5, (i*50)+55, 55, gradientBrush, 0, 5, dashStrokeStyle); i++;
        //d2d.DrawGradientRectangle((i*55)+5, 5, (i*50)+55, 55, gradientBrush, 0, 5, customStrokeStyle); i++;
        d2d.EndDraw();
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        //all these should print 0 i think
        print(dashStrokeStyle.Release());
        print(customStrokeStyle.Release());
        print(colorBrush.Release());
        print(gradientBrush.Release());
        print(gradientStop.Release());
        print(d2d.Release());
    }
}

const wc = CreateWindowClass("winclass", windowProc);

wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_ACCEPTFILES, wc, "d2d stroek styel", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);