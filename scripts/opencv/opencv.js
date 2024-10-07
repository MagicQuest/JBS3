let opencvhelper; //lol im letting this up here so i can use it with call

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
            const b = data[addr];
            const g = data[addr+1];
            const r = data[addr+2];
            bitmapBits[(j/3) + (i*w)] = RGB(b, g, r); //i think?
            addr+=3;
        }
    }

    return bitmapBits;
}

const opencv_ffmpeg = DllLoad(__dirname+"/opencv_videoio_ffmpeg4100_64.dll"); //oh i have to use this dll too if i want to load an mp4 

const opencv_world = DllLoad(__dirname+"/opencv_world4100.dll"); //oh hell yeah no searching needed if i load opencv_world myself first it doesn't have to search for my shiat and it works!
//print(__dirname+"/opencomputervisiondllforjbs.dll");
opencvhelper = DllLoad(__dirname+"/opencomputervisiondllforjbs.dll"); //oh boy... i had to use procmon to figure out why this wasn't working and it turns out it can't find opencv_world4100.dll because it searches through the PATH and where the JBS3 binary is (i was hoping it would search where this dll was)
print(opencvhelper, "opencvhelper");

//opencvhelper("getVideoCaptureFromFilename", 1, ["E:/CPP/WallpaperEngine/cmake-build-debug-posixmingw/badapple.mp4"], [VAR_CSTRING], RETURN_NUMBER, false)
let p = Date.now()/1000;
//"E:/00zOhfcgLincmDO3SQ.mp4"
            //get video capture uses a camera for the video (the first parameter is which camera to use)
const cap = call("getVideoCapture", 0, 0); //opencvhelper("getVideoCaptureFromFilename", 1, ["E:/KoolStuff/parkour/Download (73).mp4"], [VAR_CSTRING], RETURN_NUMBER);
//const cap = call("getVideoCaptureFromFilename", __dirname+"/badapple.mp4"); //"E:/KoolStuff/parkour/Download (73).mp4"); //cloud119112!
print((Date.now()/1000)-p);
//call("skibidi", cap);
print("sigma,",call("isVideoCaptureOpened", cap));
if(!call("isVideoCaptureOpened", cap)) {
    print("failed to open the video");

    print(call("releaseVideoCapture", cap));

    print(opencvhelper("__FREE"));
    print(opencv_world("__FREE"));
    print(opencv_ffmpeg("__FREE"));

    quit;
}
//Sleep(5000);
//const cap = opencvhelper("getVideoCapture", 2, [0, 0], [VAR_INT, VAR_INT], RETURN_NUMBER, false);
const fps = call("getCapProp", cap, 5) || 60; //when using getVideoCapture, fps is 0    //opencvhelper("getCapProp", 2, [cap, 5], [VAR_INT, VAR_INT], RETURN_NUMBER); //5 is the CAP_PROP_FPS enum value (https://docs.opencv.org/4.10.0/d4/d15/group__videoio__flags__base.html)
const width = call("getCapProp", cap, 3);
const height = call("getCapProp", cap, 4);
print(fps, "fps"); //oouuuuuhhhhhh getCapProp returns a float my shit can't handle allat (yeah i had to change that shit so if the CAP_PROP you looking for actually returns a float you're cooked (that shit gets TRUNCATED))
print(width, height, "dim");
//oh wait i could've calculated the byteLength using width*height*3
const byteLength = call("getNextFrameDataFromCapture", cap, true); //opencvhelper("getNextFrameDataFromCapture", 2, [cap, true], [VAR_INT, VAR_BOOLEAN], RETURN_NUMBER);
print(cap, byteLength, "shits");
//const dataptr = call("getNextFrameDataFromCapture", cap, false); //opencvhelper("getNextFrameDataFromCapture", 2, [cap, false], [VAR_INT, VAR_BOOLEAN], RETURN_NUMBER);
//print(dataptr, "ptr");
//const actualuseabledata = ArrayBufferFromPointer(1, 8, dataptr, byteLength);
//print(actualuseabledata);
//i have another opencv program i made where i did this same thing (SetBitmapBits)

//now with all that out of the way...
let start = Date.now();

const screen = GetDC(NULL);
const DDB = CreateCompatibleBitmap(screen, width, height);

while (!GetKey(VK_ESCAPE)) {
    const mouse = GetCursorPos();

    const framenumber = Math.floor(((Date.now()/1000.0)-(start/1000.0))*fps);
    print(framenumber);
    const dataptr = call("getFrameDataFromCapture", cap, framenumber, false); //you gotta free the data returned from both getFrameDatas
    const rgbdata = BGR_To_ARGB(ArrayBufferFromPointer(1, 8, dataptr, byteLength), width, height);
    call("freeData", dataptr);
    SetBitmapBits(DDB, rgbdata.byteLength, rgbdata); //width*height*4 is bytelength i think
    
    const memDC = CreateCompatibleDC(screen);
    SelectObject(memDC, DDB);
    BitBlt(screen, mouse.x, mouse.y, width, height, memDC, 0, 0, SRCCOPY);
    //well since im doing bad apple i might as well do it funny
    //StretchBlt(screen, 0, 0, screenWidth, screenHeight, memDC, 0, 0, width, height, SRCAND);
    //TransparentBlt(screen, 0, 0, screenWidth, screenHeight, memDC, 0, 0, width, height, RGB(255,255,255)); //wait im moving this to badapple.js
    DeleteDC(memDC);

    //Sleep(1000/fps); //sleep is kinda inaccurate so im calculating framenumber based on actual time
}
ReleaseDC(NULL, screen);

print(call("releaseVideoCapture", cap));

print(opencvhelper("__FREE"));
print(opencv_world("__FREE"));
print(opencv_ffmpeg("__FREE"));