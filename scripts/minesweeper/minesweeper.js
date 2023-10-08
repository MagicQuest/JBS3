//based off a similar c++ program i made in SFML

let window;
let windowDC;
const screen = GetDC(null);

const bounds = 500;
const res = 25;
const BB = bounds/res;

const tiles = [];

let d2d;
let tileBmp, bombBmp, flagBmp, revealedBmp;//, tileBmpBrush;
let font, colorBrush;

            //number colors i.e
            //#1 is blue    #2 is green    #3 is red     #4 dark blue           etc
const colors = [[0.0,0.0,1.0],[0.0,.5,0.0],[1.0,0.0,0.0],[0.0,0.0,.5],[.5,0.0,0.0],[0.0,.5,.5],[0.0,0.0,0.0],[.5,.5,.5]];

let mousePos = {x: 0, y: 0};

let lost = false;

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
                    d2d.DrawBitmap(revealedBmp, x*BB, y*BB, x*BB+BB, y*BB+BB, 1.0);
                //}else {
                if(this.neighbors) {
                    colorBrush.SetColor(...colors[this.neighbors-1]);
                    d2d.DrawText(this.neighbors, font, x*BB, y*BB-5, x*BB+BB, y*BB+BB, colorBrush);
                    return;
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
    if(tile.bomb) {
        SetWindowText(window, `Minesweeper - JBS (YOU LOST!!!)`);
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

function init(hwnd) {   
    d2d = createCanvas("d2d", ID2D1DCRenderTarget, hwnd); //with ID2D1DCRenderTarget you are allowed to draw to the desktop by setting hwnd to null!
                        //just created __dirname for this example
    tileBmp = d2d.CreateBitmapFromFilename(`${__dirname}/tile.png`);//"D:/scripts/jbs/minesweeper/tile.png");
    bombBmp = d2d.CreateBitmapFromFilename(`${__dirname}/tile_bomb.png`);
    flagBmp = d2d.CreateBitmapFromFilename(`${__dirname}/tile_flag.png`);
    revealedBmp = d2d.CreateBitmapFromFilename(`${__dirname}/tile_revealed.png`);
    colorBrush = d2d.CreateSolidColorBrush(1.0,0.0,0.0,1.0);
    font = d2d.CreateFont("Comic Sans ms", BB);
    font.SetTextAlignment(DWRITE_TEXT_ALIGNMENT_CENTER);
    print(font.GetFontFamilyNameLength());
    print(font.GetFontFamilyName());
    print(d2d.GetSize(), BB);
    windowDC = GetDC(window);
    //tileBmpBrush = d2d.CreateBitmapBrush(tileBmp);
}

const pointer = LoadCursor(null, IDC_HAND);
const defaultCursor = LoadCursor(null, IDC_ARROW);

function windowProc(hwnd, msg, wp, lp) {
    window = hwnd;
    if(msg == WM_LBUTTONDOWN) {
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
            SetWindowText(window, `Minesweeper - JBS (${bombs} bombs left)`);
        }
    }else if(msg == WM_PAINT) {
        const bp = BeginPaint(hwnd);
        SetTextColor(bp.hdc, RGB(Math.random()*255, Math.random()*255, Math.random()*255));
        TextOut(bp.hdc, 100, 100, "niger"); //lol this is hidden behind the tiles
        EndPaint(hwnd, bp);
    }else if(msg == WM_DESTROY) {
        PostQuitMessage();
    }
}

const windowMovement = {x: 250, y: 0, vx: 1, vy: 0};

let date = Date.now()/1000;
let i = 0;

//const mouseMovement = {x: 0, y: 0, vx: 1, vy: 0};

function loop() {
    if(GetKey(VK_ESCAPE)) {
        //PostQuitMessage();
        DestroyWindow(window);
    }else if(d2d){

        let dt = Date.now()/1000-date;

        d2d.BeginDraw();

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
        StretchBlt(screen, windowMovement.vx,(1080-bounds/2)+windowMovement.vy,bounds/2,bounds/2,windowDC,0,0,bounds,bounds,SRCCOPY);
        TextOut(screen, bounds/4-25, 1080-bounds/2-17, "Minimap!");
        //SelectObject(screen, oldFont);

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

const WINCLASSEXA = CreateWindowClass("WinClass", init, windowProc, loop);
WINCLASSEXA.hCursor = defaultCursor;

window = CreateWindow(WINCLASSEXA/*A*/, `Minesweeper - JBS (${bombs} bombs left)`, WS_OVERLAPPEDWINDOW | WS_VISIBLE, 250, 0, bounds+16, bounds+39);

console.log(window);