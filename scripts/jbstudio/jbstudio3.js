let d2d, brush, font, testBmp, dragging;
let width = 1280;
let height = 720;
let scrollPos = 0;
let i = 1;

class Interactable {
    constructor(x, y, width, height, color, DragCallback) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.Drag = DragCallback;//.bind(this); //haha imma JS jenius (ok for some reason it didn't work)
    }
    Update(mouse) {
        let realcolor = this.color;
        if(mouse.x > this.x && mouse.x < this.x+this.width && mouse.y > this.y && mouse.y < this.y+this.height) {
            realcolor = realcolor.map((val) => Math.min(val+.1, 1));
            if(GetKey(VK_LBUTTON)) {
                dragging = this;
            }
        }
        brush.SetColor(...realcolor);
        d2d.FillRectangle(this.x, this.y, this.x+this.width, this.y+this.height, brush);
    }
}

function DrawPianoKeys() {
    for(let i = 0; i < 132; i++) {
        let blackkey = (i%12 < 5 ? (i%12) % 2 == 1 : (i%12) % 2 == 0);
        let c = blackkey ? 0.0 : 1.0;
        //if(!blackkey) {
            brush.SetColor(c,c,c);
            d2d.FillRectangle(0, ((131-i)*21)-(scrollPos*(131*21)), 70, ((131-i)*21 + 20)-(scrollPos*(131*21)), brush);
        //}
        if(i%12 == 0) {
            c = 1.0-c;
            brush.SetColor(c,c,c);
            d2d.DrawText("C"+i/12, font, 50, (131-i)*21-(scrollPos*(131*21)), 70, ((131-i)*21 + 20)-(scrollPos*(131*21)), brush);
        }
    }
}

function GetClientCursorPos(rect) {
    let mouse = GetCursorPos();
    return {x: mouse.x-rect.left-8, y: mouse.y-rect.top-33};
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1DeviceContext, hwnd);  //DComposition
        brush = d2d.CreateSolidColorBrush(1.0, 1.0, 0.0);
        
        font = d2d.CreateFont("impact", 12);
        
        print(d2d.backBitmap, d2d.targetBitmap);

        testBmp = d2d.CreateBitmapFromDxgiSurface(D2D1_BITMAP_OPTIONS_TARGET | D2D1_BITMAP_OPTIONS_CANNOT_DRAW);
        
        print(testBmp);

        scrollBar = new Interactable(1280-20, 0, 20, 70, [80/255, 89/255, 94/255], (mouse) => {
            scrollPos = Math.min(Math.max(mouse.y, 0), height-70) / (height-70);
            scrollBar.y = scrollPos * (height-70);
            print(scrollPos);
        });

        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        d2d.BeginDraw();
        d2d.Clear(52/255, 68/255, 78/255);

        let rect = GetWindowRect(hwnd);
        let mouse = GetClientCursorPos(rect);
        //let {width, height} = d2d.GetSize();

        DrawPianoKeys();

        //print(dragging);

        dragging?.Drag(mouse); //goated operator for times like these

        scrollBar.Update(mouse);

        //brush.SetColor(80/255, 89/255, 94/255);
        //d2d.FillRectangle(width-20, scrollPos, width, scrollPos+70, brush);

        d2d.EndDraw();

        i++;
    }else if(msg == WM_SIZE) {
        let [nWidth, nHeight] = [LOWORD(lp), HIWORD(lp)];
        testBmp.Release(); //oh shoot bitmaps created from the dxgisurface MUST be released BEFORE resizing that's really important!
        d2d.Resize(nWidth, nHeight);
        scrollBar.x = nWidth-20;
        testBmp = d2d.CreateBitmapFromDxgiSurface(D2D1_BITMAP_OPTIONS_TARGET | D2D1_BITMAP_OPTIONS_CANNOT_DRAW); //recreate
        width = nWidth;
        height = nHeight;
    }else if(msg == WM_LBUTTONDOWN) {
        SetCapture(hwnd);
    }else if(msg == WM_LBUTTONUP) {
        ReleaseCapture(hwnd);
        dragging = undefined;
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        d2d.Release();
    }
}

const wc = CreateWindowClass("jbstudio", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "jbstudio3.js", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, width+20, height+42, NULL, NULL, hInstance);