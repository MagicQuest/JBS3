//https://learn.microsoft.com/en-us/windows/win32/gdi/alpha-blending-a-bitmap (why does this example omit every curly bracket and then on top of that this shit says fucking endif; after a statement)

const w = 512;
const h = 512;

const screen = GetDC(NULL);

function DrawAlphaBlend (hwnd, dc)
{
    let memDC;               // handle of the DC we will create  
    let bf = {};      // structure for alpha blending 
    let hbitmap;       // bitmap handle 
    let bmi;        // bitmap header 
    let pvBits;          // pointer to DIB section 
    let ulWindowWidth, ulWindowHeight;      // window width/height 
    let ulBitmapWidth, ulBitmapHeight;      // bitmap width/height 
    let rt;            // used for getting window dimensions 
    let x,y;          // stepping variables 
    let ubAlpha;         // used for doing transparent gradient 
    let ubRed;        
    let ubGreen;
    let ubBlue;
    let fAlphaFactor;    // used to do premultiply 
            
    // get window dimensions 
    rt = GetClientRect(hwnd);
    
    // calculate window width/height 
    ulWindowWidth = rt.right - rt.left;  
    ulWindowHeight = rt.bottom - rt.top;  

    // make sure we have at least some window size 
    if ((!ulWindowWidth) || (!ulWindowHeight))
        return;

    // divide the window into 3 horizontal areas 
    ulWindowHeight = Math.trunc(ulWindowHeight / 3); //ahh there were a lot of weird visual glitches but it was because these had decimals

    // create a DC for our bitmap -- the source DC for AlphaBlend  
    memDC = CreateCompatibleDC(dc);
    
    // zero the memory for the bitmap info 
    //ZeroMemory(&bmi, sizeof(BITMAPINFO)); //no need for that LO!

    // setup bitmap info  
    // set the bitmap width and height to 60% of the width and height of each of the three horizontal areas. Later on, the blending will occur in the center of each of the three areas. 
    //bmi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
    //bmi.bmiHeader.biWidth = ulBitmapWidth = ulWindowWidth - (ulWindowWidth/5)*2;
    //bmi.bmiHeader.biHeight = ulBitmapHeight = ulWindowHeight - (ulWindowHeight/5)*2;
    //bmi.bmiHeader.biPlanes = 1;
    //bmi.bmiHeader.biBitCount = 32;         // four 8-bit components 
    //bmi.bmiHeader.biCompression = BI_RGB;
    //bmi.bmiHeader.biSizeImage = ulBitmapWidth * ulBitmapHeight * 4;
    //CreateDIBitmapSimple can actually do all of this
    bmi = CreateDIBitmapSimple(
        ulBitmapWidth = Math.trunc(ulWindowWidth - (ulWindowWidth/5)*2),
        ulBitmapHeight = Math.trunc(ulWindowHeight - (ulWindowHeight/5)*2),
        32, // four 8-bit components 
        1,
        //BI_RGB,
        //ulBitmapWidth * ulBitmapHeight * 4,
    );

    print(ulBitmapWidth, ulBitmapHeight);

    // create our DIB section and select the bitmap into the dc 
    hbitmap = CreateDIBSection(dc, bmi, DIB_RGB_COLORS); //, &pvBits, NULL, 0x0);
    pvBits = hbitmap.GetBits(); //well instead of using pvBits you could just use hbitmap.SetBit() individually in each for loop but im just gonna follow it how they do it (hold on soon im about to proxy max and you'll be able to directly set pixel values like a pointer)
    SelectObject(memDC, hbitmap);

    // in top window area, constant alpha = 50%, but no source alpha 
    // the color format for each pixel is 0xaarrggbb  
    // set all pixels to blue and set source alpha to zero 
    for (y = 0; y < ulBitmapHeight; y++) {
        for (x = 0; x < ulBitmapWidth; x++) {
            pvBits[x + y * ulBitmapWidth] = 0x000000ff;
            //hbitmap.SetBit(x + y * ulBitmapWidth, 0x000000ff);
        }
    }
    hbitmap.SetBits(pvBits); //gotta apply the changes (or instead of directly changing pvBits you could do hbitmap.SetBit(x + y * ulBitmapWidth, color))

    //bf.BlendOp = AC_SRC_OVER;
    //bf.BlendFlags = 0;
    bf.SourceConstantAlpha = 0x7f;  // half of 0xff = 50% transparency 
    bf.AlphaFormat = 0;             // ignore source alpha channel 

    if (!AlphaBlend(dc, ulWindowWidth/5, ulWindowHeight/5, 
                    ulBitmapWidth, ulBitmapHeight, 
                    memDC, 0, 0, ulBitmapWidth, ulBitmapHeight, bf.SourceConstantAlpha, bf.AlphaFormat)) //my AlphaBlend doesn't use a BLENDFUNCTION object and you just pass the SourceConstantAlpha and AlphaFormat parameters yourself (as the last 2 parameters)
        return;                     // alpha blend failed 
    
    // in middle window area, constant alpha = 100% (disabled), source  
    // alpha is 0 in middle of bitmap and opaque in rest of bitmap  
    for (y = 0; y < ulBitmapHeight; y++) {
        for (x = 0; x < ulBitmapWidth; x++) {
            if ((x > Math.trunc(ulBitmapWidth/5)) && (x < Math.trunc(ulBitmapWidth-ulBitmapWidth/5)) &&
                (y > Math.trunc(ulBitmapHeight/5)) && (y < Math.trunc(ulBitmapHeight-ulBitmapHeight/5))) {
                //in middle of bitmap: source alpha = 0 (transparent). 
                // This means multiply each color component by 0x00. 
                // Thus, after AlphaBlend, we have a, 0x00 * r,  
                // 0x00 * g,and 0x00 * b (which is 0x00000000) 
                // for now, set all pixels to red

                pvBits[x + y * ulBitmapWidth] = 0x00ff0000; 
                //hbitmap.SetBit(x + y * ulBitmapWidth, 0x00ff0000); //wait they don't premultiply the alpha here (so what exactly is this doing?)
            }else {
                // in the rest of bitmap, source alpha = 0xff (opaque)  
                // and set all pixels to blue  

                pvBits[x + y * ulBitmapWidth] = 0xff0000ff; 
                //hbitmap.SetBit(x + y * ulBitmapWidth, 0xff0000ff);
            } //endif; //what the fuck do you mean endif; msdn????
        }
    }
    hbitmap.SetBits(pvBits); //gotta apply the changes (or instead of directly changing pvBits you could do hbitmap.SetBit(x + y * ulBitmapWidth, color))
    
    //bf.BlendOp = AC_SRC_OVER;
    //bf.BlendFlags = 0;
    bf.SourceConstantAlpha = 0xff;  // opaque (disable constant alpha) 
    bf.AlphaFormat = AC_SRC_ALPHA;  // use source alpha  
   
    if (!AlphaBlend(dc, ulWindowWidth/5, ulWindowHeight/5+ulWindowHeight, ulBitmapWidth, ulBitmapHeight, memDC, 0, 0, ulBitmapWidth, ulBitmapHeight, bf.SourceConstantAlpha, bf.AlphaFormat))
        return;

    // bottom window area, use constant alpha = 75% and a changing 
    // source alpha. Create a gradient effect using source alpha, and  
    // then fade it even more with constant alpha 
    ubRed = 0x00;
    ubGreen = 0x00;
    ubBlue = 0xff;
    
    for (y = 0; y < ulBitmapHeight; y++) {
        for (x = 0; x < ulBitmapWidth; x++) {
            // for a simple gradient, base the alpha value on the x  
            // value of the pixel  
            ubAlpha = (x / ulBitmapWidth * 255);
            //calculate the factor by which we multiply each component 
            fAlphaFactor = ubAlpha / 0xff; 
            // multiply each pixel by fAlphaFactor, so each component  
            // is less than or equal to the alpha value. 

            //hbitmap.SetBit(x + y * ulBitmapWidth, (ubAlpha << 24) | (ubRed * fAlphaFactor) << 16 | (ubGreen * fAlphaFactor) << 8 | (ubBlue   * fAlphaFactor));
            pvBits[x + y * ulBitmapWidth] 
                = (ubAlpha << 24) |                       //0xaa000000 
                 (ubRed * fAlphaFactor) << 16 |  //0x00rr0000 
                 (ubGreen * fAlphaFactor) << 8 | //0x0000gg00 
                 (ubBlue   * fAlphaFactor);      //0x000000bb 
        }
    }
    hbitmap.SetBits(pvBits); //gotta apply the changes (or instead of directly changing pvBits you could do hbitmap.SetBit(x + y * ulBitmapWidth, color))

    //bf.BlendOp = AC_SRC_OVER;
    //bf.BlendFlags = 0;
    bf.SourceConstantAlpha = 0xbf;   // use constant alpha, with  
    bf.AlphaFormat = AC_SRC_ALPHA;   // use source alpha  
                                     // 75% opaqueness 

    AlphaBlend(dc, ulWindowWidth/5, 
               ulWindowHeight/5+2*ulWindowHeight, ulBitmapWidth, 
               ulBitmapHeight, memDC, 0, 0, ulBitmapWidth, 
               ulBitmapHeight, bf.SourceConstantAlpha, bf.AlphaFormat);

    //StretchDIBits(screen, 0, 0, w, h, 0, 0, w, h, hbitmap.GetBits(), w, h, 32, BI_RGB, SRCCOPY);
    StretchBlt(screen, 0, 0, w, h, memDC, 0, 0, w, h, SRCCOPY);

    // do cleanup 
    DeleteObject(hbitmap);
    DeleteDC(memDC);
    
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
       let dc = GetDC(hwnd);
       DrawAlphaBlend(hwnd, dc);
       ReleaseDC(hwnd, dc);
    }else if(msg == WM_PAINT) {
        const ps = BeginPaint(hwnd);
        DrawAlphaBlend(hwnd, ps.hdc);
        EndPaint(hwnd, ps);
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);
wc.style = CS_HREDRAW | CS_VREDRAW; //automatically redraws the window when resizing!

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "hopefully this one works", WS_OVERLAPPEDWINDOW | WS_VISIBLE, 500, 500, w+20, h+43, NULL, NULL, hInstance);