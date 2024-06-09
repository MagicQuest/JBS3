//fixed

let d2d, brush;
let i = 1;

//function sus() {
//    let t = d2d.CreateEffect(NULL);
//    //print(t.Release());
//    t.Release();
//}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1DeviceContext, hwnd);  //DComposition
        brush = d2d.CreateSolidColorBrush(1.0, 1.0, 0.0);
        
        print(d2d.backBitmap, d2d.targetBitmap);
        
        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        d2d.BeginDraw();
        d2d.Clear(0.0, 0.0, 0.0, 0.1);

        //for(let j = 0; j < 200; j++) {
        //    let t = d2d.CreateEffect(NULL);
        //    //print(t.Release());
        //    t.Release();
        //    //delete t;
        //}

        let {width, height} = d2d.GetSize();

        brush.SetColor(1.0, 1.0, 0.0);

        d2d.FillRectangle(0, 0, Math.abs(Math.sin(i/100))*width, Math.abs(Math.cos(i/100))*height, brush);

        d2d.EndDraw();

        i++;
    }else if(msg == WM_SIZE) {
        let [width, height] = [LOWORD(lp), HIWORD(lp)];
        d2d.Resize(width, height);
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
window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "d2d1createeffectmemoryproblem.js", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, 512+20, 512+42, NULL, NULL, hInstance);