//based off a cpp project i made like a year ago lol
//in the original project i lowkey had to cheat to get the audio (i CreateProccess'd ffplay.exe -vn -fast -autoexit -nodisp) so im definately not getting it here
//press T to choose a new video and hit G for greenscreen mode (which is bad)

//i had to add SendMessageTimeout and FindWindowEx for this (even though yk i could've just dll called it) 


//snatched from win32dropfilesvideosupport.js
let opencv_ffmpeg, opencv_world, opencvhelper;

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

function callWithType(name, returntype, ...args) {
    const types = {"boolean": VAR_BOOLEAN, "number": VAR_INT, "string": VAR_CSTRING}; //cstring probably
    let argTypes = [];
    for(let i = 0; i < args.length; i++) {
        //print(name, typeof(args[i]));
        argTypes[i] = types[typeof(args[i])];
    }
    //print(argTypes);
    return opencvhelper(name, args.length, args, argTypes, returntype);
}

function call(name, ...args) {
    return callWithType(name, RETURN_NUMBER, ...args);
}

class Mat {
    constructor(mat) {
        this.mat = mat;
    }

    getChannels() {
        return call("getMatChannels", this.mat);
    }

    //it was really bothering me that i called getRows/getCols every time even though im pretty sure it doesn't change
    get rows() {
        if(!this._rows) {
            return this._rows = this.getRows();
        }else {
            return this._rows;
        }
    }

    get cols() {
        if(!this._cols) {
            return this._cols = this.getCols();
        }else {
            return this._cols;
        }
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

    get(prop) {//, float) {
        //if(float || prop == cv.CAP_PROP_FPS) {
            return callWithType("getCapProp", RETURN_FLOAT, this.cap, prop);
        //}else {
        //    return call("getCapProp", this.cap, prop);
        //}
    }

    set(prop, value) { //VideoCapture->set takes a float as the second parameter/argument whtaver
        //if(prop == cv.CAP_PROP_POS_FRAMES) {
            return opencvhelper("setCapProp", 3, [this.cap, prop, value], [VAR_INT, VAR_INT, VAR_FLOAT], RETURN_NUMBER);
        //}else {
        //    return call("setCapProp", this.cap, prop, value);
        //}
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

class GDI {
    static toCOLOR16s(r, g, b) {
        return [(r << 8) | r, (g << 8) | g, (b << 8) | b];
    }
    static Matrix3x2FToXFORM(matrix) {
        //print(matrix);
        return {
            "eM11": matrix._11,
            "eM12": matrix._12,
            "eM21": matrix._21,
            "eM22": matrix._22,
            "eDx": matrix.dx,
            "eDy": matrix.dy,
        };
    }
    static BGR_To_ARGB(data, w, h, channels) { //ok no lie this only works for images with 1, 3, or 4 channels lol
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
    static matDataToCompatible(dc, mat, dim) {
        const channels = mat.getChannels(); //i think channels is the amount of bytes per pixel so bgr is 3 and bgra is 4
        //print(mat, dim, channels, "shites");
        const pixelbits = GDI.BGR_To_ARGB(ArrayBufferFromPointer(1, 8, mat.getData(false), dim.width*dim.height*channels), dim.width, dim.height, channels); //*4 because alpha
    
        //call("releaseMat", mat);
        //mat.release();
    
        const compatibleForAlpha = CreateCompatibleBitmap(dc, dim.width, dim.height);
        SetDIBits(dc, compatibleForAlpha, 0, dim.height, pixelbits, CreateDIBitmapSimple(dim.width, -dim.height, 32), DIB_RGB_COLORS); //oh no im suddenly realizing that i can't specify WHERE these bits are going (no destX/destY :( ) //welcome back setdibits (jesus)
        //let addx = (100-Math.random()*200)*(files>1); //that damn js coercion is incredible
        //let addy = (100-Math.random()*200)*(files>1);
        //images.push({bitmap : compatibleForAlpha, width: dim.width, height: dim.height, type: "image", x: pt.x+addx, y: pt.y+addy});
        return compatibleForAlpha;
    }
}

function releaseMyShit(cap, hwnd, dc) {
    print(cap.release());

    print(opencvhelper("__FREE")); //returns 1 if success
    print(opencv_world("__FREE"));
    print(opencv_ffmpeg("__FREE"));

    ReleaseDC(hwnd, dc);
}

let wallpaper_hwnd = NULL;

//honestly idk how this be working i found this on The Stack:tm: when i made my wallpaper engine
function acquire_wallpaper_window()
{
    // Fetch the Progman window
    const progman = FindWindow("ProgMan", NULL);
    // Send 0x052C to Progman. This message directs Progman to spawn a
    // WorkerW behind the desktop icons. If it is already there, nothing
    // happens.
    print(SendMessageTimeout(progman, 0x052C, 0, 0, SMTO_NORMAL, 1000));
    // We enumerate all Windows, until we find one, that has the SHELLDLL_DefView
    // as a child.
    // If we found that window, we take its next sibling and assign it to workerw.

    function EnumWindowsProc(hwnd)
    {
        let p = FindWindowEx(hwnd, NULL, "SHELLDLL_DefView", NULL);
    
        if (p)
        {
            // Gets the WorkerW Window after the current one.
            wallpaper_hwnd = FindWindowEx(NULL, hwnd, "WorkerW", NULL);
    
        }
        return true;
    }

    EnumWindows(EnumWindowsProc);
    // Return the handle you're looking for.
}

let framePos = {x: 100, y: 100};
let offset; // = {x: 0, y: 0};

//honestly it feels weird not having a main function or something (usually i would use windowProc but i don't actually make a window here)
function main() {
    opencv_ffmpeg = DllLoad(__dirname+"/opencv_videoio_ffmpeg4100_64.dll"); //oh i have to use this dll too if i want to load an mp4 

    opencv_world = DllLoad(__dirname+"/opencv_world4100.dll"); //oh hell yeah no searching needed if i load opencv_world myself first it doesn't have to search for my shiat and it works!

    opencvhelper = DllLoad(__dirname+"/opencomputervisiondllforjbs.dll"); //oh boy... i had to use procmon to figure out why this wasn't working and it turns out it can't find opencv_world4100.dll because it searches through the PATH and where the JBS3 binary is (i was hoping it would search where this dll was)

    acquire_wallpaper_window(); //comment this line out if you want to draw directly to screen :)

    let dc = GetDC(wallpaper_hwnd);

    //print(__dirname+"\\badapple.mp4");

    let cap = new VideoCapture(call("getVideoCaptureFromFilename", __dirname+"/badapple.mp4"));
    //let cap = new VideoCapture(call("getVideoCapture", 0, 0)); //uncomment this line to use your camera instead!
    
    //const frames = cap.get(cv.CAP_PROP_FRAME_COUNT);
    let fps = cap.get(cv.CAP_PROP_FPS);

    //let t = false;
    let greenscreen = false;

    let SCALE = 1;

    print(fps);

    now = Date.now(); //used to figure out which frame to show
    start = Date.now(); //used to figure out which frame to show
    deltatime = Date.now(); //used for approximate fps

    //const dim = {width: cap.get(cv.CAP_PROP_FRAME_WIDTH), height: cap.get(cv.CAP_PROP_FRAME_HEIGHT)};

    while(true) {
        const fpstring = `FPS: [${1000. / (Date.now()-deltatime)}] (${fps})`;
        TextOut(dc, framePos.x, framePos.y - 18, fpstring);
        deltatime = Date.now();
        now = Date.now();

        if(GetKey(VK_ESCAPE)) { //GetAsyncKeyState(VK_ESCAPE) & 0x8000
            break;
        }

        if(GetKeyDown('G')) { //GetAsyncKeyState('G') & 0x01
            greenscreen = !greenscreen;
            if(greenscreen) {
                ReleaseDC(wallpaper_hwnd, dc);
                wallpaper_hwnd = GetForegroundWindow();
                dc = GetDC(wallpaper_hwnd);
            }
        }

        //why did i write it like this in the original file instead of using GetAsyncKeyState('T') & 0x01 (equivalent to JBS's GetKeyDown)
        //if(GetKey('T')) { //GetAsyncKeyState('T') & 0x8000
        //    if(!t) {
        if(GetKeyDown('T')) {
                print("t");
                const files = showOpenFilePicker(
                    {
                        multiple: false,
                        excludeAcceptAllOption: false,
                        types: [
                            {
                                description: "videos",
                                accept: [".mp4", ".webm"] //i can't be bothered to implement the mime types :sob:
                            }
                        ]
                    }
                );
                if(files?.[0]) {
                    cap.release();
                    print(files[0]);
                    cap = new VideoCapture(call("getVideoCaptureFromFilename", files[0]));
                    fps = cap.get(cv.CAP_PROP_FPS);
                    start = Date.now();
                }
        //    }else {
        //        t = true;
        //    }
        //}else {
        //    t = false;
        //}
        }

        cap.set(cv.CAP_PROP_POS_FRAMES, Math.floor(((now/1000.0) - (start/1000.0))*fps)); //it took a WHILE for this math to kick in when i first made this (opencv isn't really made for playback i think that's why you have to do this weird method to play it at the right speed)
        const frame = cap.getMatForNextFrame();
        //const frame = cap.getMatAtFrame(Math.floor(((now/1000.0) - (start/1000.0))*fps)); //this is a custom function i wrote in opencvhelper that does exactly what the 2 lines above this one does (#true)
        const shit = `FRAME ${Math.floor(((now/1000.0) - (start/1000.0))*fps)}`;
        TextOut(dc, framePos.x, framePos.y+frame.rows/SCALE, shit);

        const mPos = GetCursorPos();
        if(GetKey(VK_LCONTROL)) {
            if(offset) {
                framePos = {x: mPos.x - offset.x, y: mPos.y - offset.y};
            }else {
                if(mPos.x > framePos.x && mPos.x < framePos.x+frame.cols/SCALE) {
                    if(mPos.y > framePos.y && mPos.y < framePos.y+frame.rows/SCALE) {
                        //framePos = mPos;
                        //cout << mPos.x - framePos.x << endl;
                        offset = {x: mPos.x - framePos.x, y: mPos.y - framePos.y};
                    }
                }
            }
        }else if(offset) {
            offset = undefined;
        }

        const dcMem = CreateCompatibleDC(dc);
        
        const hbm = GDI.matDataToCompatible(dc, frame, {height: frame.rows, width: frame.cols});
        
        SelectObject(dcMem, hbm);

        //draw all the points to the screen device context directly
        //treat blue as a transparent color
        if(!greenscreen) {
            BitBlt(dc, framePos.x, framePos.y, frame.cols / SCALE, frame.rows / SCALE, dcMem, 0, 0, SRCCOPY);
        }else {
            InvalidateRect(wallpaper_hwnd, framePos.x, framePos.y, frame.cols/SCALE+framePos.x, frame.rows/SCALE+framePos.y, true);
            TransparentBlt(dc, framePos.x, framePos.y, frame.cols/SCALE, frame.rows/SCALE, dcMem, 0, 0, frame.cols/SCALE, frame.rows/SCALE, RGB(0, 0, 255));
        }

        DeleteObject(hbm);
        DeleteDC(dcMem);

        //oh DAMN i forgot to release the mat object
        frame.release(); //jbs was taking 1.5 GB of memory!!!!!!!!

        //Sleep((1000/fps) - (Date.now()-deltatime));
        //Sleep(1000/fps);
    }

    releaseMyShit(cap, wallpaper_hwnd, dc);
    return 0;
}

main();