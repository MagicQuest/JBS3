//based off a similar c++ program i made in SFML (minus the minimap and ifoundamongus)
//bruh i just realized i included deez.TTF but i didn't use it because you can't load fonts and after trying to figure out how i learned it was lowkey way too hard and stupid i ain't doiong all that nananana 
//hold on i just learned a gdi way of loading fonts so lets see... (spoiler alert it didn't work with d2d) https://learn.microsoft.com/en-us/answers/questions/1282086/how-to-use-other-fonts-in-gdi

let window;
let windowDC;
const screen = GetDC(null);

const bounds = 600;
const res = 25; // how many tiles across
const BB = bounds/res;

const tiles = [];

const trolIcon = LoadImage(NULL, `${__dirname}/troll.ico`, IMAGE_ICON, 0, 0, LR_SHARED | LR_LOADFROMFILE);

let wic;
let d2d;
let tileBmp, bombBmp, flagBmp, revealedBmp, backgroundImg;//, tiledRevealedBmp, revealedBmpBrush;//, tileBmpBrush;
let font, colorBrush;

            //number colors i.e
            //#1 is blue    #2 is green    #3 is red     #4 dark blue           etc
const colors = [[0.0,0.0,1.0],[0.0,.5,0.0],[1.0,0.0,0.0],[0.0,0.0,.5],[.5,0.0,0.0],[0.0,.5,.5],[0.0,0.0,0.0],[.5,.5,.5]];

let mousePos = {x: 0, y: 0};

let lost = false;

//print(Inputbox("description", "titpole", "placeholderr!"));

class Tile {
    constructor() {
        this.revealed = false;
        this.neighbors = 0;
        this.bomb = Math.random() < .05;
        this.flagged = false;
    }

    Draw(x, y) {
        if(this.revealed) {
            if(!this.bomb) {
                //if(!this.neighbors) {
                    //bmp = revealedBmp;
                    //d2d.DrawBitmap(revealedBmp, x*BB, y*BB, x*BB+BB, y*BB+BB, 1.0);
                    //print("revealBmp");
                    //}else {
                if(!backgroundImg) {
                    d2d.DrawBitmap(revealedBmp, x*BB, y*BB, x*BB+BB, y*BB+BB, 1.0);
                }
                if(this.neighbors) {
                    colorBrush.SetColor(...colors[this.neighbors-1]);
                    d2d.DrawText(this.neighbors, font, x*BB, y*BB-5, x*BB+BB, y*BB+BB, colorBrush);
                    //return;
                }
            }else {
                d2d.DrawBitmap(bombBmp, x*BB, y*BB, x*BB+BB, y*BB+BB, 1.0);
            }
        }else {
            if(this.flagged) {
                d2d.DrawBitmap(flagBmp, x*BB, y*BB, x*BB+BB, y*BB+BB, 1.0);
            }else {
                d2d.DrawBitmap(tileBmp, x*BB, y*BB, x*BB+BB, y*BB+BB, 1.0);
            }
        }
    }
}

function getNeighbors(x, y) {
    let neighbors = 0;
    for(let i = -1; i < 2; i++) {
        for(let j = -1; j < 2; j++) {
            if(x+i >= 0 && x+i < res && y+j >= 0 && y+j < res) {
                neighbors += tiles[x+i][y+j].bomb;
            }
        }
    }
    tiles[x][y].neighbors = neighbors;
}

function revealTile(x, y) {
    const tile = tiles[x][y];
    if(!tile.revealed && !tile.flagged && !lost) {
        tile.revealed = true;
        for(let i = -1; i < 2; i++) {
            for(let j = -1; j < 2; j++) {
                if(x+i >= 0 && x+i < res && y+j >= 0 && y+j < res) {
                    if(!tiles[x+i][y+j].bomb && !tile.neighbors) {
                        revealTile(x+i, y+j);
                    }
                }
            }
        }
    }
    if(tile.bomb && !tile.flagged) {
        SetWindowText(window, `Minesweeper - JBS (YOU LOST!!!)`);
        //print(GetClassLongPtr(window, GCLP_HICONSM));
        SetClassLongPtr(window, GCLP_HICONSM, trolIcon);
        SetClassLongPtr(window, GCLP_HICON, trolIcon);
        lost = true;
    }
}

for(let i = 0; i < res; i++) {
    tiles.push([]);
    for (let j = 0; j < res; j++) {
        tiles[i][j] = new Tile();
    }
}

let bombs = 0;

for(let i = 0; i < res; i++) {
    for (let j = 0; j < res; j++) {
        getNeighbors(i,j);
        bombs += tiles[i][j].bomb;
    }
}

//print(tiles);

const gdiFonts = [];

function init(hwnd) {
    wic = InitializeWIC(); ScopeGUIDs(wic);
                    //for some reason using ID2D1DCRenderTarget started glitching out (it wouldn't show minesweeper it would just copy a frame of the desktop? (windows 11))
    d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd, wic); //with ID2D1DCRenderTarget you are allowed to draw to the desktop by setting hwnd to null!
    //d2d.BindDC(hwnd, dc = GetDC(hwnd)); ReleaseDC(hwnd, dc);                
                        //just created __dirname for this example
    tileBmp = d2d.CreateBitmapFromFilename(`${__dirname}/tile.png`);//"D:/scripts/jbs/minesweeper/tile.png");
    bombBmp = d2d.CreateBitmapFromFilename(`${__dirname}/tile_bomb.png`);
    flagBmp = d2d.CreateBitmapFromFilename(`${__dirname}/tile_flag.png`);
    revealedBmp = d2d.CreateBitmapFromFilename(`${__dirname}/tile_revealed.png`);
    //just found out that d2d.CreateBitmap() created it slightly wrong
    //tiledRevealedBmp = d2d.CreateBitmap(BB, BB);//d2d.CreateBitmapFromFilename(`${__dirname}/tile_revealed.png`);
    //print(revealedBmp.GetPixelFormat(), tiledRevealedBmp.GetPixelFormat());
    //print(_com_error(tiledRevealedBmp.CopyFromBitmap(0, 0, revealedBmp, 0, 0, BB,BB)), GetLastError());
    //revealedBmpBrush = d2d.CreateBitmapBrush(tiledRevealedBmp);
    //revealedBmpBrush.SetExtendMode(D2D1_EXTEND_MODE_WRAP);
    //revealedBmpBrush.SetOpacity(.01);
    
                            //this fonts real name is Pixel Arial 11
    print(AddFontResourceEx(__dirname+"/deez.TTF", FR_PRIVATE), "added fonts"); //using FR_PRIVATE means that only this app has access to this font (for some reason the regular AddFontResource would add the font for every process)

    colorBrush = d2d.CreateSolidColorBrush(1.0,0.0,0.0,1.0);
    font = d2d.CreateFont("Comic Sans ms", BB);
    //font = d2d.CreateFont("Pixel Arial 11", BB); //damn it ain't working like that (i was hoping that it would work anyways despite AddFontResourceEx being for GDI)
    font.SetTextAlignment(DWRITE_TEXT_ALIGNMENT_CENTER);
    print(font.GetFontFamilyNameLength());
    print(font.GetFontFamilyName());
    print(d2d.GetSize(), BB);
    windowDC = GetDC(window);
    
    EnumFontFamilies(windowDC, (font, textMetric, FontType) => {
        //print(font.lfFaceName);
        font.lfHeight = 50;
        font.lfWidth = 25;
        gdiFonts.push(CreateFontIndirect(font));
    });

    newFont = gdiFonts[0];//CreateFontSimple("Troika", 20, 40);

    //print(EnumFontFamilies(windowDC, (font, textMetric, FontType) => {
    //    print(font, textMetric, FontType);
    //}));
    
    //tileBmpBrush = d2d.CreateBitmapBrush(tileBmp);
}

const pointer = LoadCursor(null, IDC_HAND);
const defaultCursor = LoadCursor(null, IDC_ARROW);
//const gdiFont = CreateFont(48,0,0,0,FW_DONTCARE,false,true,false,DEFAULT_CHARSET,OUT_OUTLINE_PRECIS,
//    CLIP_DEFAULT_PRECIS,CLEARTYPE_QUALITY, VARIABLE_PITCH,"Impact");

function windowProc(hwnd, msg, wp, lp) {
    window = hwnd;
    if(msg == WM_CREATE) {
        init(hwnd);
    }else if(msg == WM_LBUTTONDOWN) {
        mousePos = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)}; //nowadays you can use mousePos = MAKEPOINTS(lp);

        revealTile(Math.floor(mousePos.x/BB),Math.floor(mousePos.y/BB));

    }else if(msg == WM_MOUSEMOVE) {
        mousePos = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)};
        if(!tiles[Math.floor(mousePos.x/BB)][Math.floor(mousePos.y/BB)].revealed) {
            SetCursor(pointer);
        }else {
            SetCursor(defaultCursor);
        }
        //print(mousePos, wp, lp);
    }else if(msg == WM_RBUTTONDOWN && !lost) {
        mousePos = {x: GET_X_LPARAM(lp), y: GET_Y_LPARAM(lp)};
        const tile = tiles[Math.floor(mousePos.x/BB)][Math.floor(mousePos.y/BB)];
        if(tile.bomb) {
            if(!tile.flagged) {
                bombs--;
            }else {
                bombs++;
            }
        }
        tile.flagged = !tile.flagged;
        if(bombs == 0) {
            SetWindowText(window, `Minesweeper - JBS (YOU WON!!!)`);
        }else {
            SetWindowText(window, `Minesweeper - JBS (${bombs} bombs left)${!backgroundImg ? " - Press 'P' to change the background image!" : ""}`);
        }
    }else if(msg == WM_PAINT) {
        const bp = BeginPaint(hwnd);
        SetTextColor(bp.hdc, RGB(Math.random()*255, Math.random()*255, Math.random()*255));
        TextOut(bp.hdc, 100, 100, "niger"); //lol this is hidden behind the tiles
        EndPaint(hwnd, bp);
    }else if(msg == WM_KEYDOWN) {
        if(wp == "P".charCodeAt(0)) {
            img = showOpenFilePicker({types: [{description: "Images", accept: [".png", ".jp*", ".bmp"]}]});
            if(img) {
                if(backgroundImg) {
                    backgroundImg.Release();
                }
                backgroundImg = d2d.CreateBitmapFromFilename(img);
            }
        }else if(wp == "V".charCodeAt(0) && GetKey(VK_CONTROL)) {
            //i had to upgrade the system function for this one
            const clipboard = system("powershell -command \"Get-Clipboard\"", "rt"); //rt for read text (rt is implied)
            print(`curl "${clipboard.replaceAll("\n", "")}" -o "${__dirname}/gyatt"`);
                                    //idk how but there must have been a newline right at the end causing this to not work
            /*const image = */system(`curl "${clipboard.replaceAll("\n", "")}" -o "${__dirname}/gyatt"`, "rt"); //rb for read binary (--output - for curl to output to console anyways)
            //print(clipboard, "CLIPBOARD");
            //print(image, "IMAGE");
            //aw shit no way i need to add LoadBitmapFromFilestream im MAD (DAMN it does NOT work the way i thought it did (i have to save the file with curl :( )))
            //const wicBitmap = wic.LoadBitmapFromStream(image, wic.GUID_WICPixelFormat32bppPBGRA, 0);
            const fileinbinary = require("fs").readBinary(__dirname+"/gyatt");
            //const wicBitmap = wic.LoadBitmapFromFilename(__dirname+"/gyatt", wic.GUID_WICPixelFormat32bppPBGRA, 0);
            const wicBitmap = wic.LoadBitmapFromBinaryData(fileinbinary, wic.GUID_WICPixelFormat32bppPBGRA, 0, wic.GUID_ContainerFormatJpeg);
            print(wicBitmap);
            if(backgroundImg) {
                backgroundImg.Release();
            }
            backgroundImg = d2d.CreateBitmapFromWicBitmap(wicBitmap, true);
            //wicBitmap.Release();
        }
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        print(RemoveFontResourceEx(__dirname+"/deez.TTF", FR_PRIVATE),"== 1?");
    }
}

const windowMovement = {x: 250, y: 0, vx: 1, vy: 0};

let date = Date.now()/1000;
let i = 0;

let newFont;

//const mouseMovement = {x: 0, y: 0, vx: 1, vy: 0};

const bmpTest = LoadImage(null, __dirname+"/ifoundamongus.bmp", IMAGE_BITMAP, 200, 200, LR_SHARED | LR_LOADFROMFILE);

function loop() {
    if(GetKey(VK_ESCAPE)) {
        //PostQuitMessage();
        DestroyWindow(window);
    }else if(d2d){

        let dt = Date.now()/1000-date;

        d2d.BeginDraw();

        if(backgroundImg) {
            d2d.DrawBitmap(backgroundImg, 0, 0, bounds, bounds);
        }

        //d2d.DrawBitmap(tiledRevealedBmp, 0, 0, bounds, bounds);
        //d2d.FillRectangle(0,0,bounds,bounds,revealedBmpBrush);

        //d2d.Clear(1.0,1.0,1.0,.1);

        for(let x = 0; x < res; x++) {
            for(let y = 0; y < res; y++) {
                tiles[x][y].Draw(x, y);
            }
        }
        //print(1/dt);
        d2d.DrawText("fps: "+1/dt, font, 0,0,bounds,bounds,colorBrush)
        d2d.DrawText("dt: "+dt, font, 0,BB,bounds,bounds,colorBrush)
        d2d.EndDraw();

        //PrintWindow(window, null, PW_RENDERFULLCONTENT); // -> kinda cool idk

        //TransparentBlt(screen, 0,0,bounds,bounds,windowDC,0,0,bounds,bounds,RGB(198,198,198));
        
        //on my machine constantly bltting to the screen will actually slow down ALT+TABBING which is really weird (but not weird enough to stop doing it)
        //let oldFont = SelectObject(screen, GetDefaultFont()); //font too small bruh i wanna change size https://stackoverflow.com/questions/72324284/how-do-i-change-the-font-size-of-textout-win32-api-in-c
        //print(gdiFonts.length, Math.floor(Math.random()*gdiFonts.length), gdiFonts[Math.floor(Math.random()*gdiFonts.length)]);
        if(i % 250 == 0) {
            newFont = gdiFonts[Math.floor(Math.random()*gdiFonts.length)];//CreateFontIndirect(gdiFonts[Math.floor(Math.random()*gdiFonts.length)]);
        }
        //print("umbrage",newFont);
        let oldFont = SelectObject(screen, newFont);
        StretchBlt(screen, windowMovement.vx,(1080-bounds/2)+windowMovement.vy,bounds/2,bounds/2,windowDC,0,0,bounds,bounds,SRCCOPY);
        TextOut(screen, /*bounds/4-25*/0, (1080-bounds/2-50)+windowMovement.vy, "Minimap!");
        SelectObject(screen, oldFont);

        const memDC = CreateCompatibleDC(screen);
        SelectObject(memDC, bmpTest);
        BitBlt(screen, 100, 100, 200, 200, memDC, 0, 0, SRCCOPY); //https://learn.microsoft.com/en-us/windows/win32/gdi/scaling-an-image
        //RotateImage(screen, mousePos.x, mousePos.y, 200, 200, i, memDC, NULL, 0, 0); //im not gonna lie WTF is this doing
        DeleteDC(memDC);
        //DeleteObject(newFont);

        if(bombs == 0) {
            windowMovement.vy += .1;
            windowMovement.y += windowMovement.vy;
            
            windowMovement.x += windowMovement.vx;
            if(windowMovement.y > 1080-bounds) {
                windowMovement.y = 1080-bounds;
                windowMovement.vy *= -1.01;
            }
            if(windowMovement.x > 1920-bounds) {
                windowMovement.x = 1920-bounds;
                windowMovement.vx *= -1;
            }
            if(windowMovement.x < 0) {
                windowMovement.x = 0;
                windowMovement.vx *= -1;
            }

            SetWindowPos(window, HWND_TOPMOST, windowMovement.x, windowMovement.y, bounds, bounds, SWP_NOSIZE);
            //SetMousePos(windowMovement.x, windowMovement.y);
            
            //haha uncomment if you dare

            //const lastM = GetMousePos();
            //if(Math.floor(lastM.x) != mouseMovement.x && Math.floor(lastM.y) != mouseMovement.y) {
            //    //BitBlt(screen, lastM.x, lastM.y, 100,100,screen,0,0,SRCCOPY);
            //    print(lastM.x, mouseMovement.x);
            //    print(lastM.y, mouseMovement.y);
            //    //oop the y value got decimals
            //    print("deviation");
            //    mouseMovement.vx = (lastM.x-mouseMovement.x)*2;
            //    mouseMovement.vy = (lastM.y-mouseMovement.y)*2;
            //}
            //mouseMovement.vy += .1;
            //mouseMovement.x += mouseMovement.vx;
            //mouseMovement.y += mouseMovement.vy;
            //if(mouseMovement.y > 1080) {
            //    mouseMovement.y = 1080;
            //    mouseMovement.vy *= -.9;
            //}
            //if(mouseMovement.x > 1920) {
            //    mouseMovement.x = 1920;
            //    mouseMovement.vx *= -1;
            //}
            //SetMousePos(mouseMovement.x, mouseMovement.y);
        }
        //if(i%2 ==0) {
        //    //print(Math.abs(Math.sin(i/255))*255);
        //    print(AlphaBlend(screen, 0,0,bounds,bounds,windowDC,0,0,bounds,bounds,1));
        //}
    }

    date = Date.now()/1000;
    i++;
}

const WINCLASSEXW = CreateWindowClass("WinClass", /*init, */windowProc, loop); //we don't go to ravenholm (loop)
WINCLASSEXW.hCursor = defaultCursor;
//WINCLASSEXA.hIcon = trolIcon;
//WINCLASSEXA.hIconSm = trolIcon;

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, WINCLASSEXW/*A*/, `😂Minesweeper - JBS (${bombs} bombs left)${!backgroundImg ? " - Press 'P' to change the background image!" : ""}`, WS_OVERLAPPEDWINDOW | WS_VISIBLE, 250, 0, bounds+16, bounds+39, NULL, NULL, hInstance);

console.log(window, args);

//clean up (yeah this is kinda weird i could've put all of this in the WM_DESTROY if in winproc but it's fine)
for(const font of gdiFonts) {
    DeleteObject(font);
}
font.Release();
colorBrush.Release();
tileBmp.Release();
bombBmp.Release();
flagBmp.Release();
revealedBmp.Release();
if(backgroundImg) {
    backgroundImg.Release();
}
d2d.Release();
wic.Release();