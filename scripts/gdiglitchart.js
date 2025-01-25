//lowkey inspired by https://x.com/cuzsie/status/1878917794093510948

class Bitmap {
    constructor(dc, width, height) {
        this.bitmap = CreateCompatibleBitmap(dc, width, height);
        this.dc = dc;
        this.width = width;
        this.height = height;
    }

    static asDrawable(dc, bitmap, callback) {
        const memDC = CreateCompatibleDC(dc);
        SelectObject(memDC, bitmap);
        callback(memDC);
        DeleteDC(memDC);
    }

    getDrawable(callback) {
        Bitmap.asDrawable(this.dc, this.bitmap, callback);
    }

    Resize(newwidth, newheight, stretchmode = HALFTONE) {
        const thisdc = this.dc; //defining this here so i can use it in this.Draw's callback (because i can't be bothered to bind the function like i did in mailslots.js's Bitmap::resize)
        const oldw = this.width;
        const oldh = this.height;
        let newbitmap = CreateCompatibleBitmap(this.dc, newwidth, newheight);
        this.getDrawable(function(memDC) { //lol
            SetStretchBltMode(memDC, stretchmode);
            Bitmap.asDrawable(thisdc, newbitmap, function(newMDC) {
                StretchBlt(newMDC, 0, 0, newwidth, newheight, memDC, 0, 0, oldw, oldh, SRCCOPY);
            });
        });
        this.Release();
        this.width = newwidth;
        this.height = newheight;
        this.bitmap = newbitmap;
    }

    Release() {
        DeleteObject(this.bitmap);
        this.bitmap = 0;
    }
}

//goated (but flashing) args: 200, .1, 64
const MAX_BREADTH = 200;
const GLITCH_RECT_CHANCE = 1; //percentage% (i got .78125 because i was using .1 for 64 ms so i ran (1000/64)/(1000/500) to get 7.8125 then multiplied it by the old chance (.1))
const SLEEP_MS = 1000;

const dc = GetDC(NULL);
const bmp = new Bitmap(dc, screenWidth, screenHeight);

const icons = [];
for(let i = IDI_APPLICATION; i < IDI_SHIELD; i++) {
    icons.push(LoadIcon(NULL, i));
}
//the SHSTOCKICONID enum has random spaces in it so im just gonna do a little js trickery to get em all
const stockiconidnames = Object.keys(globalThis).filter(v => v.startsWith("SIID_"));
for(const varname of stockiconidnames) {
    const iconid = globalThis[varname];
    const iconinfo = SHGetStockIconInfo(iconid, SHGSI_ICON); //aw shit i forgot to set cbSize in JBS3.cpp... (ok i fixed itlol)
    print(iconinfo, `${varname}: ${iconid}`);
    if(iconinfo.hIcon) { //oh lol one of them was NULL because it was SIID_MAX_ICONS (which is just the end of the enum)
        icons.push(iconinfo.hIcon);
    }
} 

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

while(!GetKey(VK_ESCAPE)) {
    bmp.getDrawable(function(memDC) {
        //SelectObject(memDC, GetStockObject(DC_BRUSH));
        //SetDCBrushColor(memDC, random(0, RGB(255, 255, 255))); //RGB(255, 255, 255) is (2**24)-1

        const len = random(0, 10);
        //const len = 10;
        for(let i = 0; i < len; i++) {
            DrawIcon(memDC, random(0, screenWidth), random(0, screenHeight), icons[Math.floor(Math.random()*icons.length)]);
        }

        let invertrect = false;

        if(Math.random()<GLITCH_RECT_CHANCE) {
            /*const left = random(0, screenWidth); //too random just restrict it to bars
            const top = random(0, screenHeight);
            const right = random(left, screenWidth);
            const bottom = random(top, screenHeight);*/
            //maybe i should make a max width
            let left, top, right, bottom;
            if(Math.random()>.5) { //vertical
                left = random(0, screenWidth);
                top = 0;
                right = random(left, left+MAX_BREADTH);
                bottom = screenHeight;
            }else { //horizontal
                left = 0;
                top = random(0, screenHeight);
                right = screenWidth;
                bottom = random(top, top+MAX_BREADTH);
            }
            //FillRect(memDC, left, top, right, bottom, NULL);
            invertrect = Math.random()<.1;
            print(`glitch rect ! (invertrect ${invertrect ? "yes" : "no"})`);
            if(!invertrect) {
                const temprectbmp = new Bitmap(dc, right-left, bottom-top);
                BitBlt(memDC, left, top, right-left, bottom-top, dc, left+(Math.random() > .5 ? -5 : 5), top+(Math.random() > .5 ? -5 : 5), SRCINVERT);
                temprectbmp.getDrawable(function(tempMemDC) {
                    SelectObject(tempMemDC, GetStockObject(DC_BRUSH));
                    SetDCBrushColor(tempMemDC, random(0, RGB(255, 255, 255))); //RGB(255, 255, 255) is (2**24)-1

                    FillRect(tempMemDC, 0, 0, temprectbmp.width, temprectbmp.height, NULL);
                    BitBlt(memDC, left, top, temprectbmp.width, temprectbmp.height, tempMemDC, 0, 0, SRCPAINT);
                });
                temprectbmp.Release(); //tufff
            }//else {
            //    InvertRect(memDC, left, top, right, bottom);
            //}
        }
        if(invertrect) {
            InvertRect(dc, 0, 0, screenWidth, screenHeight);
            BitBlt(memDC, Math.random() > .5 ? -5 : 5, Math.random() > .5 ? -5 : 5, screenWidth, screenHeight, dc, 0, 0, SRCCOPY); //yeah who knows (yo this line is crazy here)
        }
        
        //BitBlt(memDC, Math.random() > .5 ? -5 : 5, Math.random() > .5 ? -5 : 5, screenWidth, screenHeight, dc, 0, 0, SRCCOPY); //yeah who knows (yo this line is crazy here)
        BitBlt(dc, 0, 0, screenWidth, screenHeight, memDC, 0, 0, SRCINVERT); //Math.random()>.9 ? SRCINVERT : SRCPAINT);
    }); 
    Sleep(SLEEP_MS);
}