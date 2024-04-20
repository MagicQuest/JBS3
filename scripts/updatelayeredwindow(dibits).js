//lets be honest i can't be bothered to do any fancy importing or requiring or what have so im eval ing
const perlin = eval(require("fs").read(__dirname+"/perlin.js")); //https://gist.github.com/surusek/4c05e4dcac6b82d18a1a28e6742fc23e (if i can be bothered) https://v8.dev/features/modules
perlin.seed(Math.random());

const screen = GetDC(NULL);

const b = RGB(255,0,0); //stretchdibits is bgr! (red is swapped with blue so RGB(255, 0, 0) is full blue instead of red!) https://stackoverflow.com/questions/12908685/wrong-colors-when-using-stretchdibits
const g = RGB(0,255,0);
const r = RGB(0,0,255);

const image = new Uint32Array([b, r, b, r, g, r, b, r, b]); //3x3 https://stackoverflow.com/questions/53958727/performance-efficient-way-of-setting-pixels-in-gdi

let hbm;

let windowWidth = 500;
let windowHeight = 500;

let cx = 500;
let cy = 500;

console.log("NIGGER"); //bruh you gotta do something stupid for console.log to wrrk

function paint(dc) {
    TextOut(dc, 50, 83, "🥴🥴🥴🥴🥴🥴🥴🗣️🧏‍♂️🤫 GYATT");
    StretchDIBits(dc, 100 ,133, 50, 50, 0, 0, 3, 3, image, 3, 3, 32, BI_RGB, SRCCOPY); // wait wtf StretchDIBits is BGR ?????
    TextOut(dc, 150, 158-8, "<- StretchDIBits test");
    const memDC = CreateCompatibleDC(dc);
    SelectObject(memDC, hbm.bitmap);
    AlphaBlend(dc, 0, 38, 50, 50, memDC, 0, 0, cx, cy, 255, AC_SRC_ALPHA); //oh shit it actuallly worked
    TextOut(dc, 50, 66-8, "<- CreateDIBSection bitmap test");
    DeleteDC(memDC);
}

function drawHBMToNew(dc, memDC) {
    const memDC2 = CreateCompatibleDC(dc);
    SelectObject(memDC2, hbm.bitmap);
    let lastFont = SelectObject(memDC2, GetDefaultFont());
    //SelectObject(memDC2, GetStockObject(DC_BRUSH));
    //SetDCBrushColor(memDC2, RGBA(255, 255, 255, 255));
    //FillRect(memDC2, 0, 0, 50, 50, NULL);
    TextOut(memDC2, 9, 9, "fake title bar (dibits.js) 😂🤫🧏‍♂️🥴💯"); //got 9 from (title bar height - default font height)/2 = (33-16)/2
    SelectObject(memDC2, lastFont);
    StretchBlt(memDC, 0, 0, windowWidth, windowHeight, memDC2, 0 , 0, cx, cy, SRCCOPY);
    DeleteDC(memDC2);
}

function ULW(hwnd) { //this revelation of a function comes from (https://stackoverflow.com/questions/67689087/correct-way-to-handle-and-redraw-a-layered-window-with-a-bitmap)
    const rect = GetWindowRect(hwnd);

    const dc = GetDC(NULL); //for some reason it doesn't use the hwnd's DC AT ALL?
    const memDC = CreateCompatibleDC(dc);
    //const memDC2 = CreateCompatibleDC(dc);
    //SelectObject(memDC2, hbm.bitmap);
    const newBitmap = CreateCompatibleBitmap(dc, windowWidth, windowHeight); //ok i have NO IDEA WHY you have to create a compatible bitmap, draw the real bitmap (hbm.bitmap) into the compatible bitmap and use THAT memDC for UpdateLayeredWindow
    const oldBitmap = SelectObject(memDC, newBitmap);
    
    drawHBMToNew(dc, memDC);
    //TextOut(memDC, 50, 50, "🥴🥴🥴🥴🥴🥴🥴🗣️🧏‍♂️🤫 GYATT");
    paint(memDC); //paint into memDC so it shows up in UpdateLayeredWindow()

    UpdateLayeredWindow(hwnd, dc, {x: rect.left, y: rect.top}, {width: windowWidth, height: windowHeight}, memDC, {x: 0, y: 0}, RGB(0,0,0), 255, AC_SRC_ALPHA, ULW_ALPHA);
    //print(UpdateLayeredWindow(hwnd, dc, {x: rect.left, y: rect.top}, {width: windowWidth, height: windowHeight}, memDC, {x: 0, y: 0}, RGB(0,0,0), 255, AC_SRC_ALPHA, ULW_ALPHA), GetLastError(), _com_error(GetLastError()));
    SelectObject(memDC, oldBitmap);
    DeleteObject(newBitmap);
    DeleteDC(memDC);
    //DeleteDC(memDC2);
    ReleaseDC(NULL, dc);
}

//print(...[H(), e(), l(), l(), o(), space(), W(), o(), r(), l(), d()])

function RGBA(r, g, b, a) {
    //calculate the factor by which we multiply each component 
    const fAlphaFactor = a / 0xff; 
    // multiply each pixel by fAlphaFactor, so each component  
    // is less than or equal to the alpha value.
    return (a << 24) | (r * fAlphaFactor) << 16 | (g * fAlphaFactor) << 8 | (b * fAlphaFactor); //from this example https://learn.microsoft.com/en-us/windows/win32/gdi/alpha-blending-a-bitmap
}

function updateHBM(t) {
    let theorycolors = [];
    for(let y = 0; y < cy; y++) {
        if(y < 33) {
            theorycolors.push([]);
        }
        for(let x = 0; x < cx; x++) {
            let color;
            if(y < 33) { //custom title bar height
                //color = RGBA(Math.random()*255,Math.random()*255,Math.random()*255,255);
                theorycolors[y].push([(x/cx)*255, Math.abs(Math.sin(t/5)*255), Math.round(Math.random()*255)]);
            }else {
                color = RGBA(Math.abs(Math.sin(x+y*cx))*255, 0, Math.abs(perlin.simplex2(x/200, y/200))*255, Math.abs(perlin.perlin3(x/200, y/200, t/5))*255);
            }
            hbm.SetBit(x + y * cx, color); //ah shoot remember dibits is bgr
        }
    }

    //print(GetRValue(hbm.GetBit(100000)));

    let blurSize = 1;//Math.round(t);
    const blurAmount = (Math.abs(-blurSize)*2+1)**2;

    for(let y = 0; y < 33; y++) {
        for(let x = 0; x < cx; x++) {
            //convolution average blur (i think?)
            let color = [0,0,0];
            
            if(blurSize == 0) {
                color = theorycolors[y][x];
            }else {
                for(let i = -blurSize; i <= blurSize; i++) {
                    for(let j = -blurSize; j <= blurSize; j++) {
                        //print(Math.max(0, Math.min(32-1, y+i)), Math.max(0, Math.min(cx-1, x+j)));
                        color = color.map((v, k) => v+theorycolors[Math.max(0, Math.min(32-1, y+i))][Math.max(0, Math.min(cx-1, x+j))][k]);
                    }
                }
                color = color.map((v) => v/blurAmount);
            }

            hbm.SetBit(x+y*cx, RGBA(...color, 255));
        }
    }
}

let st = Date.now()/1000;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        hbm = CreateDIBSection(screen, CreateDIBitmapSimple(cx, -cy, 32), DIB_RGB_COLORS);
        print(hbm);

        //ubRed = 0x00;
        //ubGreen = 0x00;
        //ubBlue = 0xff;    

        //entire thing ripped from https://learn.microsoft.com/en-us/shows/pdc-pdc08/pc43 (40:26)
        updateHBM(0);
        //for(let y = 0; y < cy; y++) {
        //    for(let x = 0; x < cx; x++) {
        //        //let alpha = x * x * 255 / cx / cx;
        //        //let alpha = RGB((x/cx)*255, 255, (y/cy)*255); //wtf is happening when you do these lines
        //        //let dw = (alpha << 24) | (alpha << 16) | alpha;
        //        //hbm.SetBit(y*cx + x, RGB(255, 0, 255)); // HOW TF DOES ALPHA WORK???? (hold on) https://github.com/northern/Win32Bitmaps
        //        //if(y == 0) {
        //        //    print(dw, GetRValue(dw), GetGValue(dw), GetBValue(dw));
        //        //}
        //        //let ubAlpha = Math.abs(perlin.get(x/100, y/100)*255); //Math.round(Math.random()*255)//x / cx * 255;
        //        ////calculate the factor by which we multiply each component 
        //        //let fAlphaFactor = ubAlpha / 0xff; 
        //        //// multiply each pixel by fAlphaFactor, so each component  
        //        //// is less than or equal to the alpha value.
        //        //let color = (ubAlpha << 24) | (ubRed * fAlphaFactor) << 16 | (ubGreen * fAlphaFactor) << 8 | (ubBlue * fAlphaFactor); //from this example https://learn.microsoft.com/en-us/windows/win32/gdi/alpha-blending-a-bitmap
        //        hbm.SetBit(x + y * cx, RGBA(Math.abs(Math.sin(x+y*cx))*255, 0, 0, Math.abs(perlin.perlin2(x/200, y/200))*255)); //ah shoot remember dibits is bgr
        //        //((UINT32 *)pvBits)[x + y * ulBitmapWidth] 
        //        //    = (ubAlpha << 24) |                       //0xaa000000 
        //        //     ((UCHAR)(ubRed * fAlphaFactor) << 16) |  //0x00rr0000 
        //        //     ((UCHAR)(ubGreen * fAlphaFactor) << 8) | //0x0000gg00 
        //        //     ((UCHAR)(ubBlue   * fAlphaFactor));      //0x000000bb
        //    }
        //}
        ULW(hwnd);
        //SetLayeredWindowAttributes(hwnd, RGB(0,255,0), 0, LWA_COLORKEY);
        SetTimer(hwnd, 0, 64);
        //hbm.SetBit(0, b);
    }/*else if(msg == WM_PAINT) {
        //const rect = GetWindowRect(hwnd);
        const ps = BeginPaint(hwnd);
        TextOut(ps.hdc, 50, 50, "🥴🥴🥴🥴🥴🥴🥴🗣️🧏‍♂️🤫 GYATT");
        StretchDIBits(ps.hdc, 100 ,100, 50, 50, 0, 0, 3, 3, image, 3, 3, 32, BI_RGB, SRCCOPY); // wait wtf StretchDIBits is BGR ?????
        TextOut(ps.hdc, 150, 125-8, "<- StretchDIBits test");
        const memDC = CreateCompatibleDC(ps.hdc);
        SelectObject(memDC, hbm.bitmap);
        //StretchBlt(ps.hdc, 0, 0, 50, 50, memDC, 0, 0, 32, 32, SRCCOPY);
        AlphaBlend(ps.hdc, 0, 0, 50, 50, memDC, 0, 0, cx, cy, 255, AC_SRC_ALPHA); //oh shit it actuallly worked
        //print(UpdateLayeredWindow(hwnd, screen, {x: rect.left, y: rect.top}, {width: cx, height: cy}, memDC, {x: 0, y: 0}, RGB(0,0,0), 255, AC_SRC_ALPHA, ULW_ALPHA), GetLastError(), _com_error(GetLastError()));
        TextOut(ps.hdc, 50, 25-8, "<- CreateDIBSection bitmap test");
        DeleteDC(memDC);
        EndPaint(hwnd, ps);
    }*//*else if(msg == WM_TIMER) {
        const mouse = GetMousePos();
        const dc = GetDC(hwnd);
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, hbm.bitmap);
        AlphaBlend(screen, mouse.x, mouse.y, 500, 500, memDC, 0, 0, cx, cy, 255, AC_SRC_ALPHA);
        DeleteDC(memDC);
        ReleaseDC(NULL, dc);
    }*/
    else if(msg == WM_SIZING || msg == WM_SIZE) {
        const rect = GetWindowRect(hwnd);
        windowWidth = rect.right - rect.left;
        windowHeight = rect.bottom - rect.top;
        console.log(windowWidth, windowHeight);
    }
    else if(msg == WM_TIMER) {
        let t = (Date.now()/1000)-st;
        updateHBM(t);

        ULW(hwnd);
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_LAYERED | WS_EX_TOPMOST, wc, "dibits.js", WS_OVERLAPPEDWINDOW | WS_VISIBLE, 500, 500, windowWidth, windowHeight, NULL, NULL, hInstance);