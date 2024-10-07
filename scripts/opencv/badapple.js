let opencv_ffmpeg, opencv_world, opencvhelper, cap; //lol im letting this up here so i can use it with call
let fps, vwidth, vheight, start;
let dc, tempBmp, DDB;

function releaseMyShit(hwnd) {
    print(call("releaseVideoCapture", cap));

    print(opencvhelper("__FREE"));
    print(opencv_world("__FREE"));
    print(opencv_ffmpeg("__FREE"));

    ReleaseDC(hwnd, dc);
}

function call(name, ...args) {
    const types = {"boolean": VAR_BOOLEAN, "number": VAR_INT, "string": VAR_CSTRING}; //cstring probably
    let argTypes = [];
    for(let i = 0; i < args.length; i++) {
        //print(name, typeof(args[i]));
        argTypes[i] = types[typeof(args[i])];
    }
    //print(argTypes);
    return opencvhelper(name, args.length, args, argTypes, RETURN_NUMBER);
}

function BGR_To_ARGB(data, w, h) {
    let addr = 0;

    const bitmapBits = new Uint32Array(w*h);

    for(let i = 0; i < h; i++) {
        for(let j = 0; j < w*3; j+=3) { //since the data from opencv uses 3 individual values to represent a pixel i add 3 here
            //well since this is bad apple i knew it should be monochromatic so fuck all these im just checking b (actually it looks kinda better if there's still a little white)
            const b = data[addr];
            //const g = data[addr+1];
            //const r = data[addr+2];
            bitmapBits[(j/3) + (i*w)] = b > 220 ? RGB(b, b, b) : RGB(0,0,0); //RGB(b, g, r); //i think?
            addr+=3;
        }
    }

    return bitmapBits;
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        SetLayeredWindowAttributes(hwnd, RGB(255, 255, 255), 255, LWA_COLORKEY);

        dc = GetDC(hwnd);

        opencv_ffmpeg = DllLoad(__dirname+"/opencv_videoio_ffmpeg4100_64.dll"); //oh i have to use this dll too if i want to load an mp4 

        opencv_world = DllLoad(__dirname+"/opencv_world4100.dll"); //oh hell yeah no searching needed if i load opencv_world myself first it doesn't have to search for my shiat and it works!
        //print(__dirname+"/opencomputervisiondllforjbs.dll");
        opencvhelper = DllLoad(__dirname+"/opencomputervisiondllforjbs.dll"); //oh boy... i had to use procmon to figure out why this wasn't working and it turns out it can't find opencv_world4100.dll because it searches through the PATH and where the JBS3 binary is (i was hoping it would search where this dll was)
        
        cap = call("getVideoCaptureFromFilename", __dirname+"/badapple.mp4");

        print("sigma,",call("isVideoCaptureOpened", cap));
        if(!call("isVideoCaptureOpened", cap)) {
            print("failed to open the video");
        
            //releaseMyShit();
        
            //quit;
            DestroyWindow(hwnd);
            return;
        }

        fps = call("getCapProp", cap, 5) || 60;
        vwidth = call("getCapProp", cap, 3);
        vheight = call("getCapProp", cap, 4);

        tempBmp = CreateCompatibleBitmap(dc, vwidth, vheight); //bruh i put these before i actually set vwidth and vheight so this shit was undefined?
        DDB = CreateCompatibleBitmap(dc, vwidth, vheight);

        print(fps, "fps");
        print(vwidth, vheight, "dim");
        print(cap);

        SetTimer(hwnd, 0, 16);

        //PlaySoundSpecial(__dirname+"/badappl.mp3", "bapple", hwnd, false); //bruh the audio loads just a little too late (if only i could load the mp4 and audio at the same time (like ffmpeg 🧐 (not gonna happen)))
        //PlaySound(__dirname+"/badappl.ogg", NULL, SND_FILENAME);

        start = Date.now();
    }else if(msg == WM_TIMER) {
        
        const framenumber = Math.floor(((Date.now()/1000.0)-(start/1000.0))*fps);
        const dataptr = call("getFrameDataFromCapture", cap, framenumber, false); //you gotta free the data returned from both getFrameDatas
        print(framenumber, dataptr);
        const rgbdata = BGR_To_ARGB(ArrayBufferFromPointer(1, 8, dataptr, vwidth*vheight*3), vwidth, vheight);
        call("freeData", dataptr); //internally delete[]s thatt shit
        SetBitmapBits(DDB, rgbdata.byteLength, rgbdata); //width*height*4 is bytelength i think
        
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, tempBmp);
        SelectObject(memDC, GetStockObject(DC_BRUSH));
        SetDCBrushColor(memDC, RGB(255,255,255));
        FillRect(memDC, 0, 0, vwidth, vheight, NULL);
        
        const memDC2 = CreateCompatibleDC(dc);
        SelectObject(memDC2, DDB);
        BitBlt(memDC, 0, 0, vwidth, vheight, memDC2, 0, 0, SRCAND);
        DeleteDC(memDC2);
        //BitBlt(screen, mouse.x, mouse.y, width, height, memDC, 0, 0, SRCCOPY);
        //well since im doing bad apple i might as well do it funny
        StretchBlt(dc, 0, 0, screenWidth, screenHeight, memDC, 0, 0, vwidth, vheight, SRCCOPY);
        //TransparentBlt(screen, 0, 0, screenWidth, screenHeight, memDC, 0, 0, width, height, RGB(255,255,255)); //wait im moving this to badapple.js
        DeleteDC(memDC);
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        releaseMyShit(hwnd);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_LAYERED | WS_EX_TOPMOST, wc, "transparent window hell yeah", WS_POPUP | WS_VISIBLE, 0, 0, screenWidth, screenHeight, NULL, NULL, hInstance);