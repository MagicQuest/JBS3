//im bout to CHANGE THE GAME with this one (NO WAY IT ACTUALLY WORKED)

const blurRGBA = eval(require("fs").read(__dirname+"/fastblur.js"));

const screen = GetDC(NULL);
let scale = 1;
let bScale = 1;
let scaleTime = 0;
let nodraw = false;

let windowcx = screenWidth;
let windowcy = screenHeight;

let bitmap;

//function DWORDtoRGB(dword) {
//    return [GetRValue(dword), GetGValue(dword), GetBValue(dword)];
//}

function ease(x) {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x); //https://easings.net/#easeOutExpo
}

function lerp(a, b, t) {
    return a + t * ( b - a );
}

function blur(blurSize) {
    const cx = windowcx/scale; //bitmap width hegiht
    const cy = windowcy/scale;

    const bits = bitmap.GetBits();

    blurRGBA(bits, cx, cy, blurSize); //lowkey still kinda slow so at some point im gonna finally add direct2d + D11 so you can use effects

    //const blurAmount = (Math.abs(-blurSize)*2+1)**2;
//
    //for(let y = 0; y < cy; y++) {
    //    for(let x = 0; x < cx; x++) {
    //        //convolution average blur (i think?)
    //        let color = [0,0,0];
    //        for(let i = -blurSize; i <= blurSize; i++) {
    //            for(let j = -blurSize; j <= blurSize; j++) {
    //                //print(Math.max(0, Math.min(32-1, y+i)), Math.max(0, Math.min(cx-1, x+j)));
    //                const dwordtorgb = DWORDtoRGB(bits[Math.max(0, Math.min(cx-1, x+j))+(Math.max(0, Math.min(cy-1, y+i)))*cx]);
    //                color = color.map((v, k) => v+dwordtorgb[k]);
    //            }
    //        }
    //        color = color.map((v) => v/blurAmount);
//
    //        bits[x+y*cx] = RGB(...color);
    //        //hbm.SetBit(x+y*cx, RGB(...color));
    //    }
    //}

    bitmap.SetBits(bits); //i assume this is faster than repeated bitmap.SetBit()s

    //return bits;
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        const dc = GetDC(hwnd);
        bitmap = CreateDIBSection(dc, CreateDIBitmapSimple(windowcx/scale, -windowcy/scale, 32), DIB_RGB_COLORS);

        SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE); //it's gonna work steve....

        SetTimer(hwnd, 0, 16);

        SetLayeredWindowAttributes(hwnd, NULL, 255, LWA_ALPHA);
        RedrawWindow(hwnd, 0, 0, windowcx, windowcy, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
    }else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);

        //BitBlt(ps.hdc, 0, 0, windowcx, windowcy, screen, 0, 0, SRCCOPY);
        const memDC = CreateCompatibleDC(ps.hdc);
        SelectObject(memDC, bitmap.bitmap);
        //SetStretchBltMode(memDC, modes[Math.floor(Math.random()*modes.length)]);
        SetStretchBltMode(memDC, HALFTONE);
        StretchBlt(memDC, 0, 0, windowcx/scale, windowcy/scale, screen, 0, 0, windowcx, windowcy, SRCCOPY);
        //blur(bScale);
        StretchBlt(ps.hdc, 0, 0, windowcx, windowcy, memDC, 0, 0, windowcx/scale, windowcy/scale, SRCCOPY);
        DeleteDC(memDC);

        EndPaint(hwnd, ps);
    }else if(msg == WM_LBUTTONDOWN || msg == WM_TIMER) {
        if(GetKey(VK_ESCAPE)) {
            DestroyWindow(hwnd);
            return;
        }
        //print(ease(Math.min(1, Math.max(Date.now()/1000-scaleTime, 0))));
        scale = lerp(10, 1, ease(Math.min(1, Math.max(Date.now()/1000-scaleTime, 0))));
        if(GetKey(VK_CONTROL)) {
            //scale = 5;
            if(nodraw) {
                SetLayeredWindowAttributes(hwnd, NULL, 255, LWA_ALPHA);
                //ShowWindow(hwnd, SW_SHOW); //bruh apparently i had ShowWindow but i didn't import any of the SW_ consts
            }
            nodraw = false;
            scaleTime = Date.now()/1000;
        }
        if(scale > 1) {
            RedrawWindow(hwnd, 0, 0, windowcx, windowcy, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
        }else {
            if(!nodraw) {
                //ShowWindow(hwnd, SW_HIDE);
                SetLayeredWindowAttributes(hwnd, NULL, 0, LWA_ALPHA);
                //RedrawWindow(hwnd, 0, 0, windowcx, windowcy, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
            }
            nodraw = true;
        }
        /*if(scale > 1) {
            scale -= .1;
        }*/
        //const dc = GetDC(NULL);
        //i think GetDIBits should be faster than using GetBit for every pixel (but you gotta do something stupid to use it (WAIT A MINUTE AM I A FOOL))
        //suddenly CreateDIBSection returns an object with a few more keys

        //StretchDIBits(dc, 0, 0, 100, 100, 0, 0, windowcx/scale, windowcy/scale, blur(1), windowcx/scale, windowcy/scale, 32, BI_RGB, SRCCOPY);

        //bits = GetDIBits(dc, bitmap.bitmap, 0, windowcy/scale, windowcx/scale, windowcy/scale, 32, BI_RGB);
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_HAND);

window = CreateWindow(WS_EX_LAYERED | WS_EX_TOPMOST | WS_EX_TRANSPARENT, wc, "displayaffinity.js", WS_POPUP | WS_VISIBLE, (screenWidth-windowcx)/2, (screenHeight-windowcy)/2, windowcx/*+16*/, windowcy/*+39*/, NULL, NULL, hInstance);