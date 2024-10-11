//lowkey im not sure if imread is better than just using WIC but just in case here it is
//https://docs.opencv.org/4.10.0/d4/da8/group__imgcodecs.html#gab32ee19e22660912565f8140d0f675a8 (formats that imread can read)
//i just learned that you can open images with VideoCapture too so now it's easier to load both images and videos
//ok i think im gonna make it so actually it plays gifs and videos
//it seems like it can't read .ico? (yeah i guess it's not on the list... fyi im using opencv 4.10.0)
//.heic didn't work but it didn't crash
//ok if you open too many videos your whole computer starts getting slower 😂
//OH HELL NAH I OPENED LIKE 20 VIDEOS AND MY COMPUTER WQAS AT 95% memory (16 GB) but none of the apps i had open went above 500 MB (WHEN I CLOSED JBS3 THE MEMORY WHEN BACK DOWN TO 60% (JBS3 WAS SOMEHOW USING 30% BUT IT DIDN'T SAY IT (i wonder if this was a gdi thing or a DllLoad thing)))

let opencv_ffmpeg, opencv_world, opencvhelper; //no ffmpeg because im only using imread (ok nevermind)

const cv = {
    CAP_PROP_POS_MSEC :0,
    CAP_PROP_POS_FRAMES :1,
    CAP_PROP_POS_AVI_RATIO :2,
    CAP_PROP_FRAME_WIDTH :3,
    CAP_PROP_FRAME_HEIGHT :4,
    CAP_PROP_FPS :5,
    CAP_PROP_FOURCC :6,
    CAP_PROP_FRAME_COUNT :7,
    CAP_PROP_FORMAT :8,
    CAP_PROP_MODE :9,
    CAP_PROP_BRIGHTNESS :10,
    CAP_PROP_CONTRAST :11,
    CAP_PROP_SATURATION :12,
    CAP_PROP_HUE :13,
    CAP_PROP_GAIN :14,
    CAP_PROP_EXPOSURE :15,
    CAP_PROP_CONVERT_RGB :16,
    CAP_PROP_WHITE_BALANCE_BLUE_U :17,
    CAP_PROP_RECTIFICATION :18,
    CAP_PROP_MONOCHROME :19,
    CAP_PROP_SHARPNESS :20,
    CAP_PROP_AUTO_EXPOSURE :21,
    CAP_PROP_GAMMA :22,
    CAP_PROP_TEMPERATURE :23,
    CAP_PROP_TRIGGER :24,
    CAP_PROP_TRIGGER_DELAY :25,
    CAP_PROP_WHITE_BALANCE_RED_V :26,
    CAP_PROP_ZOOM :27,
    CAP_PROP_FOCUS :28,
    CAP_PROP_GUID :29,
    CAP_PROP_ISO_SPEED :30,
    CAP_PROP_BACKLIGHT :32,
    CAP_PROP_PAN :33,
    CAP_PROP_TILT :34,
    CAP_PROP_ROLL :35,
    CAP_PROP_IRIS :36,
    CAP_PROP_SETTINGS :37,
    CAP_PROP_BUFFERSIZE :38,
    CAP_PROP_AUTOFOCUS :39,
    CAP_PROP_SAR_NUM :40,
    CAP_PROP_SAR_DEN :41,
    CAP_PROP_BACKEND :42,
    CAP_PROP_CHANNEL :43,
    CAP_PROP_AUTO_WB :44,
    CAP_PROP_WB_TEMPERATURE :45,
    CAP_PROP_CODEC_PIXEL_FORMAT :46,
    CAP_PROP_BITRATE :47,
    CAP_PROP_ORIENTATION_META :48,
    CAP_PROP_ORIENTATION_AUTO :49,
    CAP_PROP_OPEN_TIMEOUT_MSEC :53,
    CAP_PROP_READ_TIMEOUT_MSEC :54
};

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

function BGR_To_ARGB(data, w, h, channels) { //ok no lie this only works for images with 1, 3, or 4 channels lol
    let addr = 0;

    const bitmapBits = new Uint32Array(w*h);

    const alpha = channels > 3;

    //print(channels, alpha);

    for(let i = 0; i < h; i++) {
        for(let j = 0; j < w*channels; j+=channels) { //since the data from opencv uses 3 individual values to represent a pixel i add 3 here (4 if you specify -1 and the image has alpha!)
            const b = data[addr];
            const g = channels >= 3 ? data[addr+1] : b;
            const r = channels >= 3 ? data[addr+2] : b;
            const a = !alpha ? 255 : data[addr+3];

            const fAlphaFactor = a / 0xff; //oopsies yeah you gotta premultiply that shit or else AlphaBlend will draw it weirdly

            //let a = 255;
            //if(alpha) {
            //    a = data[addr+3];
            //    //bitmapBits[(j/channels) + (i*w)] = (a << 24) | (b) << 16 | (g) << 8 | (r); //RGB(b, g, r); //i think?
            //}else {
            //    //bitmapBits[(j/channels) + (i*w)] = //RGB(b, g, r); //i think?
            //}
            //hold on wait is this premultiplied automatically or do i gotta do that myself?
            //when i loaded scripts/fluid.png it was kinda weird

            bitmapBits[(j/channels) + (i*w)] = (a << 24) | (r * fAlphaFactor) << 16 | (g * fAlphaFactor) << 8 | (b * fAlphaFactor);
            addr+=channels;
        }
    }

    return bitmapBits; //damn it i was having some weird problems around here when i realized: i was AlphaBlend-ing these bitmaps and if they don't have alpha (using RGB zeros the alpha) nothing gets drawn...
}

//oh wait i could create classes for these that's more helpful
class Mat {
    constructor(mat) {
        this.mat = mat;
    }

    getChannels() {
        return call("getMatChannels", this.mat);
    }

    getRows() {
        return call("getMatRows", this.mat);
    }

    getCols() {
        return call("getMatCols", this.mat);
    }

    getData(length) {
        return call("getDataFromMat", this.mat, length);
    }

    release() {
        call("releaseMat", this.mat);
    }
}

class VideoCapture {
    constructor(cap) {
        this.cap = cap;
    }

    getMatAtFrame(frameNumber) {
        return new Mat(call("getMatFromCapture", this.cap, frameNumber));
    }
    
    getMatForNextFrame() {
        return new Mat(call("getNextMatFromCapture", this.cap));
    }

    isOpened() {
        return call("isVideoCaptureOpened", this.cap);
    }

    get(prop) {
        return call("getCapProp", this.cap, prop);
    }

    set(prop, value) {
        return call("setCapProp", this.cap, prop, value);
    }

    getDataAtFrame(frameNumber, length, callback) {
        const data = call("getFrameDataFromCapture", this.cap, frameNumber, length);
        if(length) {
            return data;
        }else {
            callback(data);
            call("freeData", data);
        }
    }

    getDataForNextFrame(length, callback) {
        const data = call("getNextFrameDataFromCapture", this.cap, length);
        if(length) {
            return data;
        }else {
            callback(data);
            call("freeData", data);
        }
    }

    release() {
        call("releaseVideoCapture", this.cap);
    }
}

const w = 800;
const h = 600;

let actualSize = {width: w, height: h};

let compatible;

const images = []; //bitmaps of the images that were dragged and dropped (also frames of videos that were dropped)

let dragging = undefined;
let hovered = undefined;

function redraw(hwnd) {
    //const ps = BeginPaint(hwnd);
    const dc = GetDC(hwnd);
        
    const memDC = CreateCompatibleDC(dc); //ps.hdc);
    SelectObject(memDC, compatible);
    FillRect(memDC, 0, 0, actualSize.width, actualSize.height, COLOR_BACKGROUND); //"clear" compatible bitmap
    //StretchBlt(ps.hdc, 0, 0, actualSize.width, actualSize.height, memDC, 0, 0, w, h, SRCCOPY);

    const tempDC = CreateCompatibleDC(dc);
    for(const image of images) {
        if(image.type == "image") {
            //well i was gonna make tempDC in here but i don't think anything happens if i reuse it
            SelectObject(tempDC, image.bitmap);
            //BitBlt(memDC, image.x, image.y, image.width, image.height, tempDC, 0, 0, SRCCOPY); //oh wait no i need the alpha
            //AlphaBlend(memDC, image.x, image.y, image.width, image.height, tempDC, 0, 0, image.width, image.height, 255, AC_SRC_ALPHA);
        }else { //videos
            
            const framenumber = Math.floor(((Date.now()/1000.0)-(image.start/1000.0))*image.fps)%image.totalFrames;
            SelectObject(tempDC, image.bitmaps[framenumber]);

            //image.frame = (image.frame+1)%image.totalFrames;
        }
        AlphaBlend(memDC, image.x, image.y, image.width, image.height, tempDC, 0, 0, image.width, image.height, 255, AC_SRC_ALPHA);

        if(image == hovered) {
            SelectObject(memDC, GetStockObject(DC_BRUSH));
            SetDCBrushColor(memDC, RGB(255, 127, 127));
            FrameRect(memDC, image.x, image.y, image.x+image.width, image.y+image.height, NULL);
        }
    }
    DeleteDC(tempDC);

    BitBlt(dc, 0, 0, actualSize.width, actualSize.height, memDC, 0, 0, SRCCOPY);
    DeleteDC(memDC);

    ReleaseDC(hwnd, dc);
    //EndPaint(hwnd, ps);
}

function matDataToCompatible(dc, mat, dim) {
    const channels = mat.getChannels(); //i think channels is the amount of bytes per pixel so bgr is 3 and bgra is 4
    //print(mat, dim, channels, "shites");
    const pixelbits = BGR_To_ARGB(ArrayBufferFromPointer(1, 8, mat.getData(false), dim.width*dim.height*channels), dim.width, dim.height, channels); //*4 because alpha

    //call("releaseMat", mat);
    //mat.release();

    const compatibleForAlpha = CreateCompatibleBitmap(dc, dim.width, dim.height);
    SetDIBits(dc, compatibleForAlpha, 0, dim.height, pixelbits, CreateDIBitmapSimple(dim.width, -dim.height, 32), DIB_RGB_COLORS); //oh no im suddenly realizing that i can't specify WHERE these bits are going (no destX/destY :( ) //welcome back setdibits (jesus)
    //let addx = (100-Math.random()*200)*(files>1); //that damn js coercion is incredible
    //let addy = (100-Math.random()*200)*(files>1);
    //images.push({bitmap : compatibleForAlpha, width: dim.width, height: dim.height, type: "image", x: pt.x+addx, y: pt.y+addy});
    return compatibleForAlpha;
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        //DragAcceptFiles(hwnd, true); //you can just use WS_EX_ACCEPTFILES
        const dc = GetDC(hwnd);
        compatible = CreateCompatibleBitmap(dc, screenWidth, screenHeight);//w, h); //before i just stretched the bitmap but i want it to be as big as the screen
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, compatible);
        //SelectObject(memDC, GetStockObject(DC_BRUSH)); //i always use the stock dc brush because i don't feel like creating my own brush and having to delete it >:P
        //SetDCBrushColor(memDC, GetSysColor(COLOR_BACKGROUND)); //oh wait i just realized why i was using GetSysColor... (COLOR_BACKGROUND IS a brush)
        FillRect(memDC, 0, 0, screenWidth, screenHeight, COLOR_BACKGROUND);
        DeleteDC(memDC);
        ReleaseDC(hwnd, dc);

        opencv_ffmpeg = DllLoad(__dirname+"/opencv_videoio_ffmpeg4100_64.dll"); //oh i have to use this dll too if i want to load an mp4 

        opencv_world = DllLoad(__dirname+"/opencv_world4100.dll"); //oh hell yeah no searching needed if i load opencv_world myself first it doesn't have to search for my shiat and it works!

        opencvhelper = DllLoad(__dirname+"/opencomputervisiondllforjbs.dll"); //oh boy... i had to use procmon to figure out why this wasn't working and it turns out it can't find opencv_world4100.dll because it searches through the PATH and where the JBS3 binary is (i was hoping it would search where this dll was)
    
        SetTimer(hwnd, 0, 16);
    }/*else if(msg == WM_PAINT) {
        redraw(hwnd); //environmental story telling skeleton
    }*/else if(msg == WM_DROPFILES) { //according to this you can't drag and drop from a 32 bit app to a 64 bit one with WM_DROPFILES https://stackoverflow.com/questions/51204851/dragdrop-event-wm-dropfiles-in-c-gui
        print(wp, lp); //wp is the HDROP parameter we're looking for 👀
        const pt = DragQueryPoint(wp);
        print(pt);
        const files = DragQueryFile(wp, -1); //oh hell yeah'
        print(files);
        //const filenames = [];
        const dc = GetDC(hwnd); //oh i still need the dc for createcompatiblebitmap
        //const memDC = CreateCompatibleDC(dc); //well damn using SetDIBits actually gets rid of this middleman (nevermind im still using StretchDIBits)
        //SelectObject(memDC, compatible);
        for(let i = 0; i < files; i++) {
            //filenames[i] = DragQueryFile(wp, i);
            const filename = DragQueryFile(wp, i);
            print(filename);
            //if(accept.some((ext) => filename.endsWith(ext))) { //bruh i just said out loud "i think lua has some weird endsWith thing" but it was actually javascript instead...
                //write dumb code guys don't be like this guy
                //Array.some tests each value until one satisfies the predicate wherein it immediately returns true (lol wherein im saying bullshti)
                
                //let bitmap;
                //try {
                //    bitmap = wic.LoadBitmapFromFilename(filename, wic.GUID_WICPixelFormat32bppPBGRA, 0); //ok i changed LoadBitmapFormFilename so that you can catch the error
                //}catch(e) {
                //    print(e);
                //    continue;
                //}
                //print(bitmap);
                //const dim = bitmap.GetSize();
                //const cap = new VideoCapture(call("getVideoCaptureFromFilename", filename)); //im using cap and frames to check if the loaded file is a video (aw shit nevermind i tried loading a bmp and it crashed)
                //const frames = cap.get(cv.CAP_PROP_FRAME_COUNT); //it seems like this returns something totally random if it's not actually a video file
                const mat = new Mat(call("imreadMatFromFilename", filename, -1));
                //print(mat.getRows(), mat.getCols());
                const addx = (100-Math.random()*200)*(files>1); //that damn js coercion is incredible
                const addy = (100-Math.random()*200)*(files>1);
                if(mat.getRows() != 0 && mat.getCols() != 0) {
                    //image
                    //cap.release(); //im releasing cap here because although you can get a Mat from a VideoCapture i don't think it can have alpha so...
                    //const mat = new Mat(call("imreadMatFromFilename", filename, -1)); //IMREAD_UNCHANGED is defined as -1 (allows alpha if the image has it)
                    const dim = {height: mat.getRows(), width: mat.getCols()}; //rows and cols seem to be swapped
                    const bitmap = matDataToCompatible(dc, mat, dim);
                    images.push({bitmap, width: dim.width, height: dim.height, type: "image", x: pt.x+addx, y: pt.y+addy});
                    mat.release(); //im releasing here instead of inside matDataToCompatible so it isn't confusing
                }else { //when rows and cols are 0 it's probably a video
                    //video
                    mat.release();

                    const cap = new VideoCapture(call("getVideoCaptureFromFilename", filename));
                    const frames = cap.get(cv.CAP_PROP_FRAME_COUNT);

                    const dim = {width: cap.get(cv.CAP_PROP_FRAME_WIDTH), height: cap.get(cv.CAP_PROP_FRAME_HEIGHT)};

                    const video = {bitmaps: [], width: dim.width, height: dim.height, type: "video", x: pt.x+addx, y: pt.y+addy, fps: cap.get(cv.CAP_PROP_FPS), totalFrames: frames};

                    for(let frame = 0; frame < frames; frame++) {
                        print(frame);
                        //oh i guess here i could just use get next frame
                        const mat = cap.getMatForNextFrame();
                        //const dim = {height: mat.getRows(), width: mat.getCols()};
                        const bitmap = matDataToCompatible(dc, mat, dim);
                        video.bitmaps.push(bitmap);
                        mat.release();
                    }

                    video.start = Date.now();

                    images.push(video);

                    cap.release(); //oops i forgot this...
                }

                //since im using images/videos i will draw all of them in WM_PAINT (so that i can animate the videos) (ok i think using RedrawWindow and WM_PAINT was lagging my computer so imma use a regular function)
                
                //const memDC2 = CreateCompatibleDC(dc);
                //SelectObject(memDC2, compatibleForAlpha);
                //
                //AlphaBlend(memDC, pt.x+addx, pt.y+addy, dim.width, dim.height, memDC2, 0, 0, dim.width, dim.height, 255, AC_SRC_ALPHA);
                ////StretchDIBits(memDC, pt.x+addx, pt.y+addy, dim.width, dim.height, 0, 0, dim.width, dim.height, bitmap.GetPixels(wic), dim.width, dim.height, 32, BI_RGB, SRCCOPY); //im using StretchDIBits {because i don't have SetDIBits-}(ok halfway through typing this i realized that yes, i have a form of SetDIBits (i say a form because i was actually thinking of SetDIBitsToDevice (which is the BitBlt of the DIBits world))) ok stretchdibits is back
                ////ok dude don't get mad but im gonna have to use SetDIBits if i want alpha (by creating a 32bpp compatible bitmap, copying the bits into that, then alphablending to the spot i want to)
                //DeleteDC(memDC2);
            //}
        }
        //DeleteDC(memDC);
        ReleaseDC(hwnd, dc);

        //print(filenames);

        DragFinish(wp); //DragFinish to HDROP is as DeleteDC is to memDC (analogymaxxing)

        //RedrawWindow(hwnd, 0, 0, actualSize.width, actualSize.height, NULL, RDW_INVALIDATE | RDW_UPDATENOW); //apparently i don't need updatenow?
        redraw(hwnd);
    }else if(msg == WM_SIZE) {
        const [width, height] = [LOWORD(lp), HIWORD(lp)];
        actualSize = {width, height};
        //RedrawWindow(hwnd, 0, 0, actualSize.width, actualSize.height, NULL, RDW_INVALIDATE | RDW_UPDATENOW); //apparently i don't need updatenow?
        redraw(hwnd);
    }else if(msg == WM_TIMER) {
        //RedrawWindow(hwnd, 0, 0, actualSize.width, actualSize.height, NULL, RDW_INVALIDATE | RDW_UPDATENOW);
        if(dragging) {
            const mouse = GetCursorPos(); //oopsies this is screen position 
            ScreenToClient(hwnd, mouse); //huh im suprised i had a function like this (wait what it's not defined...) (ok apparently when i added ClientToScreen i anticipated making ScreenToClient but i guess i forgor? (i wonder how many functions i put in the extension aren't actually in jbs))
            dragging.x = mouse.x;
            dragging.y = mouse.y;
        }
        redraw(hwnd);
    }else if(msg == WM_LBUTTONDOWN) {
        const [x, y] = [LOWORD(lp), HIWORD(lp)];
        print(x, y);
        dragging = images.findLast((img) => { //im using findLast because order matters when drawing the images. The last image of images is drawn on top of all the other images. So when i want to know which image i clicked on, it GOTS to be the closest to the top
            const diffx = x-img.x;
            const diffy = y-img.y;
            return diffx > 0 && diffx < img.width && diffy > 0 && diffy < img.height;
        }); //reduce(); //i was gonna use reduce but that would've been kinda weird to work with so i googled the Array class and found findLast
        hovered = dragging;
    }else if(msg == WM_LBUTTONUP) {
        dragging = undefined;
    }else if(msg == WM_MOUSEMOVE) {
        if(!dragging) {
            const [x, y] = [LOWORD(lp), HIWORD(lp)];
            hovered = images.findLast((img) => { //im using findLast because order matters when drawing the images. The last image of images is drawn on top of all the other images. So when i want to know which image i clicked on, it GOTS to be the closest to the top
                const diffx = x-img.x;
                const diffy = y-img.y;
                return diffx > 0 && diffx < img.width && diffy > 0 && diffy < img.height;
            }); //reduce(); //i was gonna use reduce but that would've been kinda weird to work with so i googled the Array class and found findLast
        }
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0); //but it refused.
        //function releaseMyShit() {
            print(opencvhelper("__FREE")); //returns 1 if success
            print(opencv_world("__FREE"));
            print(opencv_ffmpeg("__FREE"));
        //}
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW | WS_EX_ACCEPTFILES, wc, "(WM_DROPFILES but with opencv) | drag and drop images/videos onto the canvas!", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);