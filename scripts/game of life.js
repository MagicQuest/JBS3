let window;
let dc;

let d2d, tileBrush, blackBrush;

let mouse = {x: 0,y: 0};

let tiles = [];

const bounds = 800;
const res = 50; // how many tiles across
const BB = bounds/res;

let bitmap = LoadImage(NULL, `${__dirname}/minesweeper/ifoundamongus.bmp`, IMAGE_BITMAP, 0, 0, LR_SHARED | LR_LOADFROMFILE);

for(let i = 0; i < res; i++) {
    tiles.push([]);
    for(let j = 0; j < res; j++) {
        tiles[i][j] = Math.random()>.5;
    }
}

let newTiles =  tiles.map((tile) => tile.slice());  //structuredClone(tiles);

function init(hwnd) {
    print("whifnswf");
    d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd);
    dc = GetDC(hwnd);
    window = hwnd;

    tileBrush = d2d.CreateSolidColorBrush(1.0,1.0,0.0);
    blackBrush = d2d.CreateSolidColorBrush(0.0,0.0,0.0);
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        init(hwnd);
    }else if(msg == WM_MOUSEMOVE) {
        mouse = MAKEPOINTS(lp);
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

function getNeighbors(x, y) {
    let neighbors = 0;
    //print(neighbors, "slipped");
    for(let i = -1; i < 2; i++) {
        for(let j = -1; j < 2; j++) {
            if(x+i >= 0 && x+i < res && y+j >= 0 && y+j < res && !(i == 0 && j == 0)){
                neighbors += tiles[x+i][y+j];
            }
        }
    }
    return neighbors;
}

let start = Date.now();
let now = Date.now()/1000;

function loop() {
    if(GetKey(VK_ESCAPE)) {
        DestroyWindow(window);
    }else if((Date.now()-start) % 16 == 0){
        const dt = Date.now()/1000-now;
        now = Date.now()/1000;
        d2d.BeginDraw();

        d2d.Clear(1.0,1.0,1.0);//,.1);
        
        //print(mouse);
        //print("YES KING");

        for(let x = 0; x < res; x++) {
            for(let y = 0; y < res; y++) {
                const neighbors = getNeighbors(x, y);
                d2d.DrawRectangle(x*BB, y*BB, x*BB+BB, y*BB+BB, blackBrush);
                if(tiles[x][y]) {
                    if(neighbors < 2 || neighbors > 3) {
                        newTiles[x][y] = 0;
                    }else if(neighbors == 2 || neighbors == 3) {
                        newTiles[x][y] = 1;
                    }
                    d2d.FillRectangle(x*BB, y*BB, x*BB+BB, y*BB+BB, tileBrush);
                }else if(neighbors == 3){
                    newTiles[x][y] = 1;
                }
            }
        }
        tiles = newTiles.map((tile) => tile.slice());

        //d2d.FillRectangle(mouse.x, mouse.y, mouse.x+10, mouse.y+10,tileBrush);

        d2d.EndDraw();

        TextOut(dc, 100, 100, "dt: "+1/dt);
        
        //const memDC = CreateCompatibleDC(dc);  //moved to bitmapmanip.js
        //SelectObject(memDC, bitmap);
        //BitBlt(memDC, 0, 0, 200, 200, dc, mouse.x, mouse.y, SRCCOPY);
        ////SetClassLongPtr(window, GCLP_HICONSM, HICONFromHBITMAP(bitmap));
        ////DrawIcon(dc, mouse.x, mouse.y, HICONFromHBITMAP(bitmap));
        //BitBlt(dc, 0, 0, 200, 200, memDC, 0, 0, SRCCOPY);
        //DeleteDC(memDC);
    }
}

const WINCLASSEX = CreateWindowClass("WinClass"/*, init*/, windowProc, loop);
const icon = LoadIcon(NULL, IDI_ERROR);
WINCLASSEX.hCursor = LoadCursor(NULL, IDC_HAND);
WINCLASSEX.hIcon = icon;
WINCLASSEX.hIconSm = icon;

//print(WINCLASSEX);

CreateWindow(WS_EX_OVERLAPPEDWINDOW ,WINCLASSEX, "conway's game of life", WS_OVERLAPPEDWINDOW | WS_VISIBLE, 200, 200, bounds+16, bounds+39, NULL, NULL, hInstance);