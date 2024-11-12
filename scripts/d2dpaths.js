//lol i only added paths for the 2d rendering context

const w = 768;
const h = 512;

let d2d, path, sink, colorBrush, dashStrokeStyle;
let geometries = {};

//lowkey didn't add the radial brush for the sun because i just couldn't be bothered lol
function createFunGeometry() { //https://learn.microsoft.com/en-us/windows/win32/direct2d/path-geometries-overview
    const leftMountain = d2d.CreatePathGeometry();
    let tempSink = leftMountain.Open();
    tempSink.SetFillMode(D2D1_FILL_MODE_WINDING);

    tempSink.BeginFigure(
        346,255,
        D2D1_FIGURE_BEGIN_FILLED
        );
    let points = [
        [267, 177],
        [236, 192],
        [212, 160],
        [156, 255],
        [346, 255], 
    ];
    tempSink.AddLines(points);
    tempSink.EndFigure(D2D1_FIGURE_END_CLOSED);
    tempSink.Close();
    print(tempSink.Release());
    
    const rightMountain = d2d.CreatePathGeometry();
    tempSink = rightMountain.Open();
    tempSink.SetFillMode(D2D1_FILL_MODE_WINDING);

    tempSink.BeginFigure(
        575,263,
        D2D1_FIGURE_BEGIN_FILLED
        );
    points = [
       [481, 146],
       [449, 181],
       [433, 159],
       [401, 214],
       [381, 199], 
       [323, 263], 
       [575, 263]
    ];
    tempSink.AddLines(points);
    tempSink.EndFigure(D2D1_FIGURE_END_CLOSED);
    tempSink.Close();
    print(tempSink.Release());

    const sun = d2d.CreatePathGeometry();
    tempSink = sun.Open();
    tempSink.SetFillMode(D2D1_FILL_MODE_WINDING);
            
    tempSink.BeginFigure(
        270, 255,
        D2D1_FIGURE_BEGIN_FILLED
        );
    tempSink.AddArc(
            440, 255, // end point
            85, 85,
            0.0, // rotation angle
            D2D1_SWEEP_DIRECTION_CLOCKWISE,
            D2D1_ARC_SIZE_SMALL
            );            
    tempSink.EndFigure(D2D1_FIGURE_END_CLOSED);

    tempSink.BeginFigure(
        299, 182,
        D2D1_FIGURE_BEGIN_HOLLOW
        );
    tempSink.AddBezier(
       
           [299, 182],
           [294, 176],
           [285, 178]
           );
    tempSink.AddBezier(
           [276, 179],
           [272, 173],
           [272, 173]
           );
    tempSink.EndFigure(D2D1_FIGURE_END_OPEN);

    tempSink.BeginFigure(
        354, 156,
        D2D1_FIGURE_BEGIN_HOLLOW
        );
    tempSink.AddBezier(
           [354, 156],
           [358, 149],
           [354, 142]
           );
    tempSink.AddBezier(
           [349, 134],
           [354, 127],
           [354, 127]
           );
    tempSink.EndFigure(D2D1_FIGURE_END_OPEN);

    tempSink.BeginFigure(
        322,164,
        D2D1_FIGURE_BEGIN_HOLLOW
        );
    tempSink.AddBezier(
           [322, 164],
           [322, 156],
           [314, 152]
           );
    tempSink.AddBezier(
           [306, 149],
           [305, 141],
           [305, 141]
           );              
    tempSink.EndFigure(D2D1_FIGURE_END_OPEN);

    tempSink.BeginFigure(
        385, 164,
        D2D1_FIGURE_BEGIN_HOLLOW
        );
    tempSink.AddBezier(
           [385,164],
           [392,161],
           [394,152]
           );
    tempSink.AddBezier(
           [395,144],
           [402,141],
           [402,142]
           );                
    tempSink.EndFigure(D2D1_FIGURE_END_OPEN);

    tempSink.BeginFigure(
        408,182,
        D2D1_FIGURE_BEGIN_HOLLOW
        );
    tempSink.AddBezier(
           [408,182],
           [416,184],
           [422,178]
           );
    tempSink.AddBezier(
           [428,171],
           [435,173],
           [435,173]
           );
    tempSink.EndFigure(D2D1_FIGURE_END_OPEN);
    tempSink.Close();
    print(tempSink.Release());

    const river = d2d.CreatePathGeometry();
    tempSink = river.Open();
    tempSink.SetFillMode(D2D1_FILL_MODE_WINDING);
    tempSink.BeginFigure(
        183, 392,
        D2D1_FIGURE_BEGIN_FILLED
        );
    tempSink.AddBezier(
           [238, 284],
           [472, 345],
           [356, 303]
        );
    tempSink.AddBezier(
           [237, 261],
           [333, 256],
           [333, 256]
           );
    tempSink.AddBezier(
           [335, 257],
           [241, 261],
           [411, 306]
           );
    tempSink.AddBezier(
           [574, 350],
           [288, 324],
           [296, 392]
           );
    tempSink.EndFigure(D2D1_FIGURE_END_OPEN);
    tempSink.Close();
    print(tempSink.Release());

    return {sun: {geometry: sun, color: ColorF.Orange}, leftMountain: {geometry: leftMountain, color: ColorF.OliveDrab}, river: {geometry: river, color: ColorF.LightSkyBlue}, rightMountain: {geometry: rightMountain, color: ColorF.YellowGreen}};
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd);
        dashStrokeStyle = d2d.CreateStrokeStyle(D2D1_CAP_STYLE_SQUARE, D2D1_CAP_STYLE_SQUARE, D2D1_CAP_STYLE_SQUARE, D2D1_LINE_JOIN_MITER, 100, D2D1_DASH_STYLE_DASH, 0, D2D1_STROKE_TRANSFORM_TYPE_NORMAL, NULL);
        colorBrush = d2d.CreateSolidColorBrush(1.0, 1.0, 1.0, 1.0);

        //path = d2d.CreatePathGeometry();
        //sink = path.Open();
        //print(path, sink);

        geometries = createFunGeometry();
        
        //sink.SetFillMode(D2D1_FILL_MODE_WINDING);
        //sink.BeginFigure(100, 100, D2D1_FIGURE_BEGIN_HOLLOW);
        //sink.AddBezier( //both functions are valid
        //    [100, 100],
        //    [95, 94],
        //    [86, 96],
        //);
        //sink.AddBezier(
        //    [
        //        [77, 97],
        //        [73, 91],
        //        [73, 91]
        //    ],
        //);
        //sink.EndFigure(D2D1_FIGURE_END_OPEN);
        ////sink.BeginFigure(128, 256, D2D1_FIGURE_BEGIN_HOLLOW);
        ////sink.EndFigure(D2D1_FIGURE_END_OPEN);
        //sink.Close();
        //print(sink.Release());
        print(geometries);
        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        d2d.BeginDraw();
        d2d.Clear(.2, .2, .2);
        //d2d.DrawGeometry(path, colorBrush, 5);//, 5, dashStrokeStyle);
        for(const {geometry, color} of Object.values(geometries)) {
            //print(color);
            colorBrush.SetColor(color); //SetColor can now take 0xRRGGBB as the only parameter (alpha doesn't count)
            d2d.FillGeometry(geometry, colorBrush);
            colorBrush.SetColor(0.0, 0.0, 0.0);
            d2d.DrawGeometry(geometry, colorBrush, 2.0, dashStrokeStyle);
        }
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