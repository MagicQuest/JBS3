//lol i only added paths for the 2d rendering context

const w = 768;
const h = 512;

let d2d, path, sink, colorBrush, dashStrokeStyle;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd);
        dashStrokeStyle = d2d.CreateStrokeStyle(D2D1_CAP_STYLE_SQUARE, D2D1_CAP_STYLE_SQUARE, D2D1_CAP_STYLE_SQUARE, D2D1_LINE_JOIN_MITER, 100, D2D1_DASH_STYLE_DASH, 0, D2D1_STROKE_TRANSFORM_TYPE_NORMAL, NULL);
        colorBrush = d2d.CreateSolidColorBrush(1.0, 1.0, 1.0, 1.0);

        path = d2d.CreatePathGeometry();
        sink = path.Open();
        print(path, sink);
        
        sink.SetFillMode(D2D1_FILL_MODE_WINDING);
        sink.BeginFigure(100, 100, D2D1_FIGURE_BEGIN_HOLLOW);
        sink.AddBezier(
            [100, 100],
            [95, 94],
            [86, 96],
        );
        sink.AddBezier(
            [77, 97],
            [73, 91],
            [73, 91],
        );
        sink.EndFigure(D2D1_FIGURE_END_OPEN);
        sink.Close();
        print(sink.Release());
        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        d2d.BeginDraw();
        d2d.Clear(.2, .2, .2);
        d2d.DrawGeometry(path, colorBrush, 5);//, 5, dashStrokeStyle);
        d2d.EndDraw();
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);

wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "d2d path stuff", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);