const dc = GetDC(NULL);
const bmp = CreateCompatibleBitmap(dc, 1920, 1080);
const memDC = CreateCompatibleDC(dc);

print(GetObjectHBITMAP(bmp));

//const troll = LoadImage(NULL, __dirname+"/bitdepth.bmp", IMAGE_BITMAP, 220, 183, LR_LOADFROMFILE | LR_SHARED | LR_LOADTRANSPARENT);
//print(troll, GetObjectDIBITMAP(troll).dsBm.bmBits, "TROLL!");

// const d2d = createCanvas("d2d", ID2D1RenderTarget, NULL); //screen
// d2d.BindDC(NULL, dc);
// while(!GetKey(VK_ESCAPE)) {
//     d2d.BeginDraw();
//     d2d.Clear(1.0,1.0,1.0);
//     d2d.EndDraw();
// }
// d2d.Release();