class Bitmap { //helper function for drawing to the screen easy becaue seinrrffnkjenfknenf nekfnfk
    constructor(hwnd, width, height) {
        this.hwnd = hwnd;
        this.width = width;
        this.height = height;
        this.dc = GetDC(this.hwnd);
        this.bitmap = CreateCompatibleBitmap(this.dc, this.width, this.height);
        this.i = 0; //for drawText
    }

    static asDrawable(dc, bitmap, callback) {
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, bitmap);
        callback(memDC);
        DeleteDC(memDC);
    }

    getDrawable(callback) {
        Bitmap.asDrawable(this.dc, this.bitmap, callback);
    }

    drawText(text) {
        //GetTextExtentPoint32()
        this.getDrawable((function(memDC) {
            //print(this);
            TextOut(memDC, 0, this.i*16, text);
        }).bind(this));
        this.i++;
    }

    resize(nw, nh) {
        //old = this.bitmap;
        //const newBitmap = new Bitmap(this.hwnd, nw, nh);
        const newBitmap = CreateCompatibleBitmap(this.dc, nw, nh);
        Bitmap.asDrawable(this.dc, newBitmap, (function(newMDC) { 
            this.getDrawable(function(memDC) { //lowkey this part is kinda ugly but i guess it's better than making 2 memDCs inline here
                BitBlt(newMDC, 0, 0, nw, nh, memDC, 0, 0, SRCCOPY);
            });
        }).bind(this));

        this.width = nw;
        this.height = nh;

        DeleteObject(this.bitmap);
        this.bitmap = newBitmap;

        //this = newBitmap; //oh yeah about that hold on...
        //this.draw
        //this.width = nw;
        //this.height = nh;
    }

    destroy() {
        DeleteObject(this.bitmap);
        ReleaseDC(this.hwnd, this.dc);
    }
}

let screenBitmap;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE);
        //SetLayeredWindowAttributes(hwnd, RGB(0, 255, 0), NULL, LWA_COLORKEY);
        screenBitmap = new Bitmap(hwnd, screenWidth, screenHeight);
        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        //const mouse = GetCursorPos();
        const dc = GetDC(hwnd);
        screenBitmap.getDrawable(bitmapMDC => {
            const ci = GetCursorInfo();
            print(ci);
            BitBlt(bitmapMDC, 0, 0, screenBitmap.width, screenBitmap.height, dc, 0, 0, SRCCOPY);
            DrawIcon(bitmapMDC, ci.ptScreenPos.x, ci.ptScreenPos.y, ci.hCursor);
            BitBlt(dc, 0, 0, screenBitmap.width, screenBitmap.height, bitmapMDC, 0, 0, SRCCOPY);
        });
        ReleaseDC(hwnd, dc);
    }
    else if(msg == WM_DESTROY) { 
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);

wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_TRANSPARENT, wc, "mouse shadow.js", WS_POPUP | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, screenWidth, screenHeight, NULL, NULL, hInstance);