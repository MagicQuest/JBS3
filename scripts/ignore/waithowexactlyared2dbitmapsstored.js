//i made this because i wanted to make sure i knew how the data returned from ID2D1Bitmap1->Map was formatted (BGRA) and i was confused with DIBits' format (apparently ABGR?)
//well after further questions i feel like the real question is: howexactlyaredibitsdrawn.js?

const w = 512;
const h = 512;

let d2d, special, target;

//let i = 0;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1DeviceContext, hwnd); 
    
        special = d2d.CreateBitmap1(4, 4, D2D1_BITMAP_OPTIONS_CPU_READ | D2D1_BITMAP_OPTIONS_CANNOT_DRAW, NULL, NULL, NULL, NULL);

        target = d2d.CreateBitmap1(4, 4, D2D1_BITMAP_OPTIONS_TARGET | D2D1_BITMAP_OPTIONS_CANNOT_DRAW, NULL, NULL, NULL, NULL);

        d2d.SetTarget(target);
    }else if(msg == WM_PAINT) {
        d2d.BeginDraw();
        d2d.Clear(0.8, 0.5, 0.0, 1.0); //filling the target bitmap with red
        d2d.EndDraw();

        //special.CopyFromBitmap(0, 0, i % 2 == 0 ? d2d.backBitmap : d2d.targetBitmap, 0, 0, 4, 4); //this only works half the time because dxgi swaps buffers or some shit idk lmao i tried to figure out exactly how
        special.CopyFromBitmap(0, 0, target, 0, 0, 4, 4); //so does that mean using my own target works 100% of the time (honestly i don't think so (in theory) but d2dxupdatelayeredwindow.js has been working fine the whole time) ok yeah that's true

        const data = special.Map(D2D1_MAP_OPTIONS_READ);
        print(data._bits, data.GetBits()); //imma see in the debugger where these bits are                 B     G     R     A
        //ok CLEARLY with the memory it's BGRA 0xBBGGRRAA and d2d.Clear(0.8, 0.5, 0.0, 1.0) translates to [0x00, 0x80, 0xcc, 0xff]
        //there's a lot of padding though but yeah
        special.Unmap();

        //i++;
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        print("quit;")
        d2d.SetTarget(NULL); //oops i think i should put this in the d2d destructor?
        d2d.Release();
        print(special.Release());
        print(target.Release());
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "hmm...", WS_OVERLAPPEDWINDOW | WS_VISIBLE, 500, 500, w+20, h+43, NULL, NULL, hInstance);