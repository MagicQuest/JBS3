let troll = LoadImage(NULL, __dirname+"/troll.bmp", IMAGE_BITMAP, 0, 0, LR_LOADFROMFILE | LR_CREATEDIBSECTION);
let tobject = GetObjectHBITMAP(troll)

let hbm;

let windowcx = screenWidth;
let windowcy = screenHeight;

let trollDIBits;

let spreading = [];

//function RGBA(r, g, b, a) {
//    //calculate the factor by which we multiply each component 
//    const fAlphaFactor = a / 0xff; 
//    // multiply each pixel by fAlphaFactor, so each component  
//    // is less than or equal to the alpha value.
//    return (a << 24) | (r * fAlphaFactor) << 16 | (g * fAlphaFactor) << 8 | (b * fAlphaFactor); //from this example https://learn.microsoft.com/en-us/windows/win32/gdi/alpha-blending-a-bitmap
//}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) { //honestly i should prolly just use a switch statement for this
        
        const dc = GetDC(hwnd);
        //hbm = CreateDIBSection(dc, CreateDIBitmapSimple(220, -183, 32), DIB_RGB_COLORS);
        const trollDC = CreateCompatibleDC(dc);
        SelectObject(trollDC, troll);
        
        const memDC = CreateCompatibleDC(dc);
        
        const ddb = CreateCompatibleBitmap(dc, tobject.bmWidth, tobject.bmHeight); //ok i have NO IDEA WHY you have to create a compatible bitmap, draw the real bitmap (hbm.bitmap) into the compatible bitmap and use THAT memDC for UpdateLayeredWindow
        SelectObject(memDC, ddb);
        BitBlt(memDC, 0, 0, tobject.bmWidth, tobject.bmHeight, trollDC, 0, 0, SRCCOPY);
        
        //print(GetDIBits(dc, ddb, 0, 183, 220, 183, 32, BI_RGB));
        
        trollDIBits = GetDIBits(dc, ddb, 0, tobject.bmHeight, tobject.bmWidth, tobject.bmHeight, 32, BI_RGB);
        
        DeleteObject(ddb);
        DeleteDC(trollDC);
        DeleteDC(memDC);
        ReleaseDC(hwnd, dc);
        
        SetTimer(hwnd, 0, 32);

        SetLayeredWindowAttributes(hwnd, RGB(0,255,0), 0, LWA_COLORKEY);
        RedrawWindow(hwnd, 0, 0, windowcx, windowcy, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
    }else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);

        StretchDIBits(ps.hdc, 0, 0, windowcx, windowcy, 0, 0, tobject.bmWidth, tobject.bmHeight, trollDIBits, tobject.bmWidth, tobject.bmHeight, 32, BI_RGB, SRCCOPY);

        EndPaint(hwnd, ps);
    }else if(msg == WM_LBUTTONDOWN) {// || msg == WM_TIMER) {
        let {x, y} = MAKEPOINTS(lp);
        //print(x,y);
        x = Math.round((x/windowcx)*tobject.bmWidth); //trollDIBits is 220x183 so i have to convert the window 640x360 coordinates -> 220x183
        y = Math.round((y/windowcy)*tobject.bmHeight);
        spreading.push({x,y, color: trollDIBits[x+y*tobject.bmWidth]});
        //print(x,y, trollDIBits[x+y*tobject.bmWidth], RGB(246,246,246));
    }else if(msg == WM_RBUTTONDOWN) {
        if(GetLayeredWindowAttributes(hwnd).dwFlags == LWA_COLORKEY) {
            SetLayeredWindowAttributes(hwnd, RGB(0,0,0), 255, LWA_ALPHA);
        }else {
            SetLayeredWindowAttributes(hwnd, RGB(0,255,0), 0, LWA_COLORKEY);
        }
    }else if(msg == WM_KEYDOWN) {
        if(wp == VK_ESCAPE) {
            DestroyWindow(hwnd);
        }
    }else if(msg == WM_TIMER) {
        if(GetKey(VK_ESCAPE)) {
            DestroyWindow(hwnd);
            return;
        }
                                                       //these extra 4 checks makes it look cool 😎
        const checks = [[0,-1], [1,0], [-1,0], [0, 1], [0, -3], [3, 0], [-3, 0], [0,3]];
        //const lastSpreading = [];
        //print(spreading.length);
        const nextSpreading = [];
        for(let i = 0; i < spreading.length; i++) {
            const point = spreading[i];
            if(point.color == RGB(0,255,0)) {
                continue;
            }
            trollDIBits[point.x+point.y*tobject.bmWidth] = RGB(0, 255, 0);
            //lastSpreading.push(i);
            for(const cp of checks) {
                const nx = Math.max(0, Math.min(point.x+cp[0], tobject.bmWidth)); //i had to clamp it because it would start going insane (idk what was happening)
                const ny = Math.max(0, Math.min(point.y+cp[1], tobject.bmHeight));
                const c = trollDIBits[nx+ny*tobject.bmWidth];
                //const rgb = GetRValue(c)+GetGValue(c)+GetBValue(c);
                //const prgb = GetRValue(point.color)+GetGValue(point.color)+GetBValue(point.color);

                if((c == point.color /*|| (rgb < prgb+30 && rgb > prgb-30)*/) && nextSpreading.findIndex((p) => p.x==nx && p.y==ny) == -1) { //oops if 2 points in spreading were close enough to eachother they added the same point into nextSpreading and it got exponential
                    //trollDIBits[(point.x+cp[0])+(point.y+cp[1])*tobject.bmWidth] = RGB(0,255,0);
                    //spreading.length > 1000 && print(GetRValue(c),GetGValue(c),GetBValue(c))
                    nextSpreading.push({x: nx, y: ny, color: point.color});
                }
            }
        }
        //lastSpreading.sort((a,b) => b-a); //why is sort applied to the array
        //print(lastSpreading);
        //for(const i of lastSpreading) {
        //    spreading.splice(i, 1);
        //}
        //print(spreading);
        //spreading = spreading.concat(nextSpreading); //but concat is not
        //print(spreading);
        spreading = nextSpreading;

        RedrawWindow(hwnd, 0, 0, windowcx, windowcy, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
    }
    else if(msg == WM_DESTROY) {
        //print("HELP \x07");
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_HAND);

window = CreateWindow(WS_EX_LAYERED | WS_EX_TOPMOST, wc, "clicktotrans.js", WS_POPUP | WS_VISIBLE, (screenWidth-windowcx)/2, (screenHeight-windowcy)/2, windowcx/*+16*/, windowcy/*+39*/, NULL, NULL, hInstance);