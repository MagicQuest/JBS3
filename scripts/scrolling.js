let title = "local man charged with cookie robbery! forced to pay 1quad cookies!";
let len = 7;
let i = 0;

let d2d, font, brush;
let last = 0;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd);
        font = d2d.CreateFont("Comic sans ms", 20);
        brush = d2d.CreateSolidColorBrush(1.0,1.0,1.0);
        SetTimer(hwnd, 1, 64);
    }else if(msg == WM_TIMER) {
        d2d.BeginDraw();
        d2d.Clear(0,0,0,.6);
        d2d.DrawText(title, font, 100, 0, 500, 500, brush);
        //print(1000/(Date.now()-last));
        d2d.DrawText("fps: "+Math.round(1000/(Date.now()-last)), font, 400, 400, 500, 500, brush);
        d2d.EndDraw();
        str = title.split("").filter((elem, pos) => pos >= i && pos < i+len).join("");
        SetWindowText(hwnd, `😎🤞: [${str}]`)
        i++;
        last = Date.now();
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("titlte", windowProc);
//wc.hIcon = wc.hIconSm = icon; //assigns both to the same value just in case you didn't know (my comments are kinda sparse LO!)
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "TITLE", WS_OVERLAPPEDWINDOW | WS_VISIBLE, screenWidth/2-(500+16)/2, screenHeight/2-(500+39)/2, 500+16, 500+39, NULL, NULL, hInstance);