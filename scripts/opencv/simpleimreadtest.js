let opencv_world, opencvhelper; //no ffmpeg because im only using imread

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

function BGR_To_ARGB(data, w, h, alpha = false) {
    let addr = 0;

    const bitmapBits = new Uint32Array(w*h);

    const bpp = !alpha ? 3 : 4; //bytes per pixel

    for(let i = 0; i < h; i++) {
        for(let j = 0; j < w*bpp; j+=bpp) { //since the data from opencv uses 3 individual values to represent a pixel i add 3 here
            const b = data[addr];
            const g = data[addr+1];
            const r = data[addr+2];
            const a = alpha ? data[addr+3] : 255;
            
            const fAlphaFactor = a / 0xff;
            
            /*if(alpha) {
                bitmapBits[(j/bpp) + (i*w)] = (a << 24) | (b) << 16 | (g) << 8 | (r); //RGB(b, g, r); //i think?
            }else {
                bitmapBits[(j/bpp) + (i*w)] = RGB(b, g, r); //i think?
            }*/
            bitmapBits[(j/bpp) + (i*w)] = (a << 24) | (r * fAlphaFactor) << 16 | (g * fAlphaFactor) << 8 | (b * fAlphaFactor);
            addr+=bpp;
        }
    }

    return bitmapBits;
}

//opencv_ffmpeg = DllLoad(__dirname+"/opencv_videoio_ffmpeg4100_64.dll");

opencv_world = DllLoad(__dirname+"/opencv_world4100.dll"); //oh hell yeah no searching needed if i load opencv_world myself first it doesn't have to search for my shiat and it works!
//print(__dirname+"/opencomputervisiondllforjbs.dll");
opencvhelper = DllLoad(__dirname+"/opencomputervisiondllforjbs.dll"); //oh boy... i had to use procmon to figure out why this wasn't working and it turns out it can't find opencv_world4100.dll because it searches through the PATH and where the JBS3 binary is (i was hoping it would search where this dll was)

const mat = call("imreadMatFromFilename", __dirname+"/chomik.jfif", -1); //for imread the default flags are 1 but -1 allows alpha (this chomik picture doesn't have alpha though so feel free the change this and see it work)

const height = call("getMatRows", mat); //idk if i made BGR_To_ARGB wrong or if rows and cols are swapped?
const width = call("getMatCols", mat);

print(`rows: ${call("getMatRows", mat)}, cols: ${call("getMatCols", mat)}`); //yeah it seems like they're swapped

const channels = call("getMatChannels", mat); //channels is like the amount of bytes per pixel so bgr is 3 and bgra is 4
print(channels);

const pixelbits = BGR_To_ARGB(ArrayBufferFromPointer(1, 8, call("getDataFromMat", mat, false), width*height*channels), width, height, channels > 3); //you don't have to release the data from getDataFromMat

//print(pixelbits);

call("releaseMat", mat); //you gotta releaseMat tho


const dc = GetDC(NULL);

const compatible = CreateCompatibleBitmap(dc, width, height); //i gotta make a bitmap if i want to AlphaBlend...
SetBitmapBits(compatible, pixelbits.byteLength, pixelbits); //apparently you aren't supposed to use SetBitmapBits anymore (supposed use SetDIBits) but it's way simpler
const memDC = CreateCompatibleDC(dc);
SelectObject(memDC, compatible);

while(!GetKey(VK_ESCAPE)) {
    const mouse = GetCursorPos();
    //BitBlt(dc, 0, 0, width, height, memDC, 0, 0, SRCCOPY);
    print(AlphaBlend(dc, mouse.x, mouse.y, width, height, memDC, 0, 0, width, height, 255, AC_SRC_ALPHA));
    //StretchDIBits(dc, mouse.x, mouse.y, width, height, 0, 0, width, height, pixelbits, width, height, 32, BI_RGB, SRCCOPY);
}
DeleteDC(memDC);
ReleaseDC(NULL, dc);