let troll = LoadImage(NULL, __dirname+(Math.random() > .5 ? "/troll.bmp" : "/imagine.bmp"), IMAGE_BITMAP, 0, 0, LR_LOADFROMFILE);
let tobject = GetObjectHBITMAP(troll)

let hbm;
let trollDIB = [];

let cx = 640;
let cy = 360;

function random(max) {
    let sign = Math.random() > .5 ? 1 : -1;
    return sign*Math.round(Math.random()*max);
}

function blurHBM(blurSize) {
    trollDIB = [];

    for(let y = 0; y < cy; y++) {
        trollDIB.push([]);
        for(let x = 0; x < cx; x++) {
            const color = hbm.GetBit(x+y*cx);
            trollDIB[y].push([GetRValue(color), GetGValue(color), GetBValue(color)]);
        }
    }

    const blurAmount = (Math.abs(-blurSize)*2+1)**2;

    for(let y = 0; y < cy; y++) {
        for(let x = 0; x < cx; x++) {
            //convolution average blur (i think?)
            let color = [0,0,0];
            
            if(blurSize == 0) {
                color = trollDIB[y][x];
            }else {
                for(let i = -blurSize; i <= blurSize; i++) {
                    for(let j = -blurSize; j <= blurSize; j++) {
                        //print(Math.max(0, Math.min(32-1, y+i)), Math.max(0, Math.min(cx-1, x+j)));
                        color = color.map((v, k) => v+trollDIB[Math.max(0, Math.min(cy-1, y+i))][Math.max(0, Math.min(cx-1, x+j))][k]);
                    }
                }
                color = color.map((v) => v/blurAmount);
            }

            hbm.SetBit(x+y*cx, RGB(...color));
        }
    }
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        const dc = GetDC(hwnd);
        hbm = CreateDIBSection(dc, CreateDIBitmapSimple(cx, -cy, 32), DIB_RGB_COLORS);
        for(let y = 0; y < cy; y++) {
            for(let x = 0; x < cx; x++) {
                hbm.SetBit(x+y*cx, RGB(0,0,0));
            }
        }

        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, hbm.bitmap);
        const memDC2 = CreateCompatibleDC(dc);
        SelectObject(memDC2, troll);
        StretchBlt(memDC, 0, 0, cx, cy, memDC2, 0, 0, tobject.bmWidth, tobject.bmHeight, SRCCOPY);
        //print(hbm.GetBit(0), "getbit");
        DeleteDC(memDC);
        DeleteDC(memDC2);

        //use GetDIBits prolly idk
        blurHBM(5);

        ReleaseDC(hwnd, dc);

        //SetTimer(hwnd, 0, 5000);
    }else if(msg == WM_PAINT) {
        print("whatchunoaibaot");

        const ps = BeginPaint(hwnd);

        const memDC = CreateCompatibleDC(ps.hdc);
        SelectObject(memDC, hbm.bitmap);
        BitBlt(ps.hdc, 0, 0, cx, cy, memDC, 0, 0, SRCCOPY);
        DeleteDC(memDC);

        EndPaint(hwnd, ps);
        //const ps = BeginPaint(hwnd);
        //const memDC = CreateCompatibleDC(ps.hdc);
        //SelectObject(memDC, troll);
        //print(GetDIBits(memDC, troll, 0, 183, 220, 183, 1, BI_RGB));
        //BitBlt(ps.hdc, 0, 0, 220, 183, memDC, 0, 0, SRCCOPY);
        //DeleteDC(memDC);
        //EndPaint(hwnd, ps);
    }else if(msg == WM_LBUTTONDOWN) {// || msg == WM_TIMER) {
        const dc = GetDC(hwnd);
        const screen = GetDC(NULL);

        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, hbm.bitmap);
        SetStretchBltMode(memDC, HALFTONE)
        StretchBlt(memDC, 0, 0, cx, cy, screen, 0, 0, 1920, 1080, SRCCOPY);
        DeleteDC(memDC);

        blurHBM(5);

        ReleaseDC(hwnd, dc);
        ReleaseDC(NULL, screen);

        //InvalidateRect(hwnd, 0, 0, 500, 500, true);
        //UpdateWindow(hwnd); //draw immediately
        RedrawWindow(hwnd, 0, 0, cx, cy, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_HAND);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "dibits2.js", WS_OVERLAPPEDWINDOW | WS_VISIBLE, (1920-cx)/2, (1080-cy)/2, cx+16, cy+39, NULL, NULL, hInstance);