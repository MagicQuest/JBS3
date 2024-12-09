//honestly im not sure if this is actually worth it
//i guess you could just use DirectComposition but you can't draw your own titlebar doing that so idk
//oh yeah you can click through fully transparent parts of the window with updatelayeredwindow
//oh yeah there MIGHT be a more efficient way by using ID2D1HwndRenderTarget but then you can't use SetTarget so you'll have to copy from the regular shits
//oh shit i just learned that you might be able to use QueryInterface on any ID2D1RenderTarget type shits to get an ID2D1DeviceContext! https://stackoverflow.com/questions/9021244/how-to-work-with-pixels-using-direct2d/22217372#comment54979996_22217372
//this is also pretty cool https://katyscode.wordpress.com/2013/01/23/migrating-existing-direct2d-applications-to-use-direct2d-1-1-functionality-in-windows-7/

//the viena soundfont editor looks kida lit with their nonclient area drawing (plus i guess unreal does it too)

let windowWidth = 512; //current width (for when you resize it)
let windowHeight = 512;

const w = windowWidth;
const h = windowHeight;

let wic, d2d, sysfont, font, funnyfont, brush, loadinggif, fluidpng;//, unnamedgif;
let d2dTempTarget, d2dTargetBFULW, d2dEmptyBitmap; //d2d target bitmap for update layered window

let tempTargetSize; //for some reason the bitmaps returned by CreateBitmapFromDxgiSurface are 4 more pixels bigger than w and h (its size is {width: 516, height: 516}) (ok it doesn't matter anymore but imma still use this anyways)

const dc = GetDC(NULL);

function toHexLazyLol(uchar) {
    const hex = uchar.toString(16);
    return hex.length == 1 ? "0"+hex : hex;
}

//function ARGB(a, r, g, b) { //hmm i probably should've made this ARGB
//    //calculate the factor by which we multiply each component 
//    //const fAlphaFactor = f ? a / 0xff : 1.0; //no premultiply this time (wait i should just use this inline instead of making a function here)
//    // multiply each pixel by fAlphaFactor, so each component  
//    // is less than or equal to the alpha value.
//    return (a << 24) | (r) << 16 | (g) << 8 | (b);
//}

//let timer;

let datafordibits;
let bmpfrombits;

function d2dBGRA_To_ARGB(data) { //so finally to answer my own questions, yes, i am converting d2d's BGRA to ARGB for my dibsection and yes, gdi is 0xAABBGGRR so when my dibsection is drawn, the red and blue channels are swapped
    //with d2d mapped data the bits returned are like html canvas' ImageData
    //each pixel is represented by 4 values [B, G, R, A] 0-255
    //and there is padding between each column of pixels
    const weirdpaddedbits = data.GetBits();

    //with dibits the data is arranged where the first pixel is the first element [0] (and each pixel is represented by 1 value, [0xAARRGGBB]) FUCKING BUT (VERY IMPORTANT) WHEN THE BITS ARE DRAWN IT SWAPS THE BLUE AND RED BITS 
    //and the first pixel of the second column is [x + (y*width)] or [0 + (1*width)] = [width]
    datafordibits = new Uint32Array(tempTargetSize.width*tempTargetSize.height);
    
    const skippadding = data.pitch-(tempTargetSize.width*4); //data.pitch is the amount of bytes (including padding) in one row of pixels (width*4 (multiplied by 4 because there are 4 eight bit color components B8G8R8A8) is the amount of bytes in a row without padding)
    //skippading is the amount of padding in each column

    let addr = 0;

    for(let i = 0; i < tempTargetSize.height; i++) {
        for(let j = 0; j < tempTargetSize.width*4; j+=4) { //since the data from weirdpaddedbits uses 4 individual values to represent a pixel i add 4 here
            const b = weirdpaddedbits[addr]; //default pixel format is B8G8R8A8_UNORM for my d2d
            const g = weirdpaddedbits[addr+1];
            const r = weirdpaddedbits[addr+2];
            const a = weirdpaddedbits[addr+3];
            //damn if this were c++ and the data was already ARGB i could cast to a DWORD or something i think to get these values
            //if(a != 255) {
            //    print(`[${j/4}, ${i}] = ${(j/4) + (i*tempTargetSize.width)}`, addr, b, g, r, a);
            //}
            //if(addr > 1065016) { //lol i wasn't sending the entire picture through data.GetBits() so it would fail at (size.width*size.height*4) = (1065024)
            //    print((j/4) + (i*tempTargetSize.width), addr, b, g, r, a);
            //}

            
            //dibsections and functions using dibits are ARGB
            //(j/4) is the x coordinate for the pixel
            //i is the y coordinate for the pixel
            //man now im really confused as to why this works too how does 0xAARRBBGG work correctly
            //datafordibits[(j/4) + (i*tempTargetSize.width)] = Number(`0x${toHexLazyLol(a)}${toHexLazyLol(r)}${toHexLazyLol(g)}${toHexLazyLol(b)}`); //im just gonna do the lazy way (oh shit for gdi and dibits it's ARGB)
            datafordibits[(j/4) + (i*tempTargetSize.width)] = (a << 24) | (r) << 16 | (g) << 8 | (b); //OK gdi color is 0xAABBGGRR but why is this working even though these bgra variables should be right? (dibsection bits are 0xAARRGGBB but when drawn they are shown as 0xAABBGGRR)
            //if(addr == 0) {
            //    let end = (a << 24) | (r) << 16 | (g) << 8 | (b);
            //    print(b, g, r, a, " - ", GetBValue(end), GetGValue(end), GetRValue(end)); //these values don't line up and it's because gdi swaps the blue and red channels when they get drawn (so they're represented differently but drawn the same)
            //}
            addr+=4;
        }
        addr += skippadding;
    //print(addr);
    }
}

function convertDIBitsToCompatibleBitmapForULW(hwnd) { //for update layered window
    bmpfrombits.SetBits(datafordibits);

    const rect = GetWindowRect(hwnd);

    const compatibleDC = CreateCompatibleDC(dc);
    const newBitmapForULW = CreateCompatibleBitmap(dc, windowWidth, windowHeight);
    SelectObject(compatibleDC, newBitmapForULW);

    const memDC = CreateCompatibleDC(dc); //lol i just realized i can't remember why it's called a "mem" dc and it's short for memory
    SelectObject(memDC, bmpfrombits);
    //BitBlt(compatibleDC, 0, 0, w, h, memDC, 0, 0, SRCCOPY); //now that i added SetDIBits i could get rid of bmpfrombits and just use SetDIBits(dc, newBitmapForULW, 0, h, datafordibits, CreateDIBitmapSimple(w, -h, 32), DIB_RGB_COLORS); (well i think this is right but i haven't tested it (ok now since you can resize the window you can't really use this anymore for that))
    StretchBlt(compatibleDC, 0, 0, windowWidth, windowHeight, memDC, 0, 0, w, h, SRCCOPY);
    //AlphaBlend(dc, 0, 0, tempTargetSize.width, tempTargetSize.height, memDC, 0, 0, tempTargetSize.width, tempTargetSize.height, 255, AC_SRC_ALPHA);
                                            //wait what the fuck i accidently put memDC here and it was still working? i thought it wouldn't work with a DIBSection???
    UpdateLayeredWindow(hwnd, dc, {x: rect.left, y: rect.top}, {width: windowWidth, height: windowHeight}, compatibleDC, {x: 0, y: 0}, RGB(0,0,0), 255, AC_SRC_ALPHA, ULW_ALPHA);

    DeleteDC(memDC); //not calling delete actually fucks yo shit up
    DeleteDC(compatibleDC);
    DeleteObject(newBitmapForULW);
}

function loadGif(path) {
    const bitmaps = [];
    const wicDecoder = wic.LoadDecoder(path);
    const frameCount = wicDecoder.GetFrameCount();
    for(let i = 0; i < frameCount; i++) {
        const wicBitmap = wicDecoder.GetBitmapFrame(wic, i, wic.GUID_WICPixelFormat32bppPBGRA);
        bitmaps.push(d2d.CreateBitmapFromWicBitmap(wicBitmap, true)); //passing true as the second argument releases wicBitmap
    }
    wicDecoder.Release();
    return bitmaps;
}

let i = 0;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        wic = InitializeWIC(); ScopeGUIDs(wic);
        d2d = createCanvas("d2d", ID2D1DeviceContext, hwnd); //i gotta use ID2D1DeviceContext>= to use SetTarget

        //print(d2d); //aw shoot i haven't updated jbs3extention to differentiate between different types of canvases so i didn't even know i implemented CreateBitmapFromDxgiSurface

        sysfont = d2d.CreateFont(NULL, 12);
        font = d2d.CreateFont("impact", 40);
        
        let familynames = [];
        d2d.EnumFonts((names) => { //bruhhhh i made enum fonts for taskslifeifoundamongus (which im realizing now that i mispelt like) because CreateFont wasn't working and i thought the fonts were messed up but CreateFont was just geniuinely not working earlier like idk
            //print(fontFamily.GetFamilyName(), fontFamily.GetFontCount());
            //for some reason you can't use a fontFamily object to create the font itself for d2d so...
            //print(names);
            familynames.push(names);
        }, false); //specifying false only passes the names of the font families and specifiying true passes IDWriteFontFamily objects (which you have to release)

        funnyfont = d2d.CreateFont(name = familynames[Math.floor(Math.random()*familynames.length)], 20);
        print(name);

        brush = d2d.CreateSolidColorBrush(1.0, 1.0, 0.0);

        d2dTempTarget = d2d.CreateBitmap1(w, h, D2D1_BITMAP_OPTIONS_TARGET | D2D1_BITMAP_OPTIONS_CANNOT_DRAW, DXGI_FORMAT_B8G8R8A8_UNORM, D2D1_ALPHA_MODE_PREMULTIPLIED, NULL, NULL);//d2d.CreateBitmapFromDxgiSurface(D2D1_BITMAP_OPTIONS_TARGET | D2D1_BITMAP_OPTIONS_CANNOT_DRAW);
        print(d2dTempTarget.GetPixelSize(), d2dTempTarget.GetSize());
        tempTargetSize = d2dTempTarget.GetPixelSize();
        d2dTargetBFULW = d2d.CreateBitmap1(tempTargetSize.width, tempTargetSize.height, D2D1_BITMAP_OPTIONS_CPU_READ | D2D1_BITMAP_OPTIONS_CANNOT_DRAW, NULL, NULL, NULL, NULL); //d2d.CreateBitmapFromDxgiSurface(D2D1_BITMAP_OPTIONS_CPU_READ | D2D1_BITMAP_OPTIONS_CANNOT_DRAW); //bruh i gotta make 2 bitmaps because you can't have D2D1_BITMAP_OPTIONS_CPU_READ with anything other than D2D1_BITMAP_OPTIONS_CANNOT_DRAW

        d2dEmptyBitmap = d2d.CreateBitmap1(w, h, D2D1_BITMAP_OPTIONS_TARGET | D2D1_BITMAP_OPTIONS_CANNOT_DRAW, NULL, NULL, NULL, NULL);

        print(d2d.SetTarget(d2dTempTarget));
        print(d2dTempTarget, "temp");
        print(d2dTargetBFULW, "BFULW");

        bmpfrombits = CreateDIBSection(dc, CreateDIBitmapSimple(w, -h, 32), DIB_RGB_COLORS);

        loadinggif = loadGif(__dirname+"/loading1.gif");
        fluidpng = d2d.CreateBitmapFromWicBitmap(wic.LoadBitmapFromFilename(__dirname+"/fluid.png", wic.GUID_WICPixelFormat32bppPBGRA, 0), true); //true for release
        //unnamedgif = loadGif(__dirname+"/unnamed.gif"); //well i was gonna include this random undertale gif i got from one of the newsletters but it didn't come out right for some reason

        //dostupidshit(); //dostupidshit was what's in WM_TIMER but it failed when you ran it more than once so i had to test it a few times
        //dostupidshit();
        SetTimer(hwnd, 0, 64);
    }else if(msg == WM_TIMER) {
        d2d.BeginDraw();
        //d2d.Clear(0, 0, 0, 0); //i don't think you can really clear alpha the way i want to so im gonna copy from an empty bitmap...
        d2dTempTarget.CopyFromBitmap(0, 0, d2dEmptyBitmap, 0, 0, tempTargetSize.width, tempTargetSize.height);
        d2d.DrawBitmap(fluidpng, 0, 0, tempTargetSize.width, tempTargetSize.height, 1.0);
        brush.SetColor(Math.random(), Math.random(), Math.random(), 1);
        d2d.FillRectangle(0, 0, tempTargetSize.width, 31, brush);
        brush.SetColor(0, 0, 0, 1);
        d2d.DrawText(GetWindowText(hwnd), sysfont, 6, 6, w, h, brush);
        brush.SetColor(Math.random(), Math.random(), Math.random(), 0.5); //ouuuuhhhh alpha is premultiplied by default hmmmmmmmmm... (nevermind we straight (haha get it lol even though it's still premultiplied))
        d2d.DrawText("what the sigjma alpha working maqybe idk lol", font, 0, 40/2, w, h, brush);
        d2d.DrawBitmap(loadinggif[i % (loadinggif.length)], 0, h-57, 198, h, 1.0);
        d2d.Flush(); //oh i gotta flush before trying to copy into temp target
        d2dTempTarget.CopyFromBitmap(tempTargetSize.width/2-50, tempTargetSize.height/2-50, d2dEmptyBitmap, 0, 0, 100, 100); //draw a transparent hole in the middle
        brush.SetColor(1.0, 0.0, 0.0, 1.0); //ouuuuhhhh alpha is premultiplied by default hmmmmmmmmm... (nevermind we straight (haha get it lol even though it's still premultiplied))
        d2d.DrawRectangle(tempTargetSize.width/2-50, tempTargetSize.height/2-50, tempTargetSize.width/2+50, tempTargetSize.height/2+50, brush);
        d2d.DrawLine(tempTargetSize.width/2+75, tempTargetSize.height/2+75, tempTargetSize.width/2+55, tempTargetSize.height/2+55, brush, 5);
        d2d.DrawLine(tempTargetSize.width/2+75, tempTargetSize.height/2+55, tempTargetSize.width/2+55, tempTargetSize.height/2+55, brush, 5);
        d2d.DrawLine(tempTargetSize.width/2+55, tempTargetSize.height/2+75, tempTargetSize.width/2+55, tempTargetSize.height/2+55, brush, 5);
        d2d.DrawText("ALPHA HOLE", funnyfont, tempTargetSize.width/2+75, tempTargetSize.height/2+75, w, h, brush);
        //d2d.FillRectangle(0, 0, w, h, brush);
        //d2d.DrawBitmap(unnamedgif[i % (unnamedgif.length)], 300, 200, 300+(496/2), 200+(284/2), 1.0);
        d2d.EndDraw(true); //don't present (don't swap buffer and show drawing on window)
        
        
        print(d2dTargetBFULW.CopyFromBitmap(0, 0, d2dTempTarget, 0, 0, tempTargetSize.width, tempTargetSize.height));
    
        const data = d2dTargetBFULW.Map(D2D1_MAP_OPTIONS_READ); //hmmm adding the D2D1_MAP_OPTIONS_WRITE option gives an error and https://learn.microsoft.com/en-us/windows/win32/api/d2d1_1/ne-d2d1_1-d2d1_map_options#remarks seems to say that these options don't work with ID2D1DeviceContext??? idk
        //https://stackoverflow.com/questions/14791546/id2d1bitmap1map-when-can-you-use-it
    
        //print(data, "D2D1_MAP_OPTIONS_READ");
        //const weirdpaddedbits = data.GetBits();
        //data.SetBit(0, 255);
        //print(weirdpaddedbits); //boy this returns a big jumble of shit (basically returns something like html canvas' ImageData.data but there is a lot of padding unfortunately)

        d2dBGRA_To_ARGB(data);

        //print(tempTargetSize.width*tempTargetSize.height)
        //print(weirdpaddedbits.length, weirdpaddedbits.byteLength);
        //print(datafordibits);
        d2dTargetBFULW.Unmap();
        //quit;
    
        //StretchDIBits(dc, 0, 0, tempTargetSize.width, tempTargetSize.height, 0, 0, tempTargetSize.width, tempTargetSize.height, datafordibits, tempTargetSize.width, tempTargetSize.height, 32, BI_RGB, SRCCOPY);
    
        convertDIBitsToCompatibleBitmapForULW(hwnd);

        //KillTimer(hwnd, timer);
        i++;
    }else if(msg == WM_SIZE) {
        const rect = GetWindowRect(hwnd);
        windowWidth = rect.right - rect.left;
        windowHeight = rect.bottom - rect.top;
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        wic.Release();
        brush.Release();
        sysfont.Release();
        font.Release();
        funnyfont.Release();
        d2dTargetBFULW.Release();
        d2dTempTarget.Release();
        for(const bitmap of loadinggif) {
            bitmap.Release();
        }
        fluidpng.Release();
        //for(const bitmap of unnamedgif) {
        //    bitmap.Release();
        //}
        d2d.Release();
        DeleteObject(CreateSolidBrush(RGB(255, 255, 255)));
        DeleteObject(bmpfrombits); //you can now DeleteObject a dibsection without having to do .bitmap
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_LAYERED/* | WS_EX_TOPMOST*/, wc, "using d2d to draw alpha shit for update layered window (basically homemade DirectComposition)", WS_OVERLAPPEDWINDOW | WS_VISIBLE, 500, 500, w+20, h+43, NULL, NULL, hInstance);