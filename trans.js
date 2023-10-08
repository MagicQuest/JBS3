const window = FindWindow(null, "Documents");//"JBS3 (Running) - Microsoft Visual Studio");
const d2d = createCanvas("d2d", ID2D1DCRenderTarget, window);

const brush = d2d.CreateSolidColorBrush(1.0, 0.0, 1.0, 1.0);

const bitmap = d2d.CreateBitmapFromFilename("E:/Users/megal/OneDrive/Desktop/bruh box.png");

const bitmapBrush = d2d.CreateBitmapBrush(bitmap);
bitmapBrush.SetExtendMode(D2D1_EXTEND_MODE_WRAP, D2D1_EXTEND_MODE_WRAP);

const bitmapSize = bitmap.GetSize();

const dc = GetDC(GetConsoleWindow());

let time = Date.now()/1000;

print(brush.GetColor());

print(D2D1_EXTEND_MODE_FORCE_DWORD, D2D1_BITMAP_INTERPOLATION_MODE_LINEAR);

print("rendertarget->", d2d.renderTarget);
//print(globalThis);

//print(d2d.GetTransform());

//const transform = d2d.GetTransform();
//
//print(transform);
//
//d2d.SetTransform(transform);

let i = 0;
let j = 0;

while (!GetKey(VK_ESCAPE)) {
    let dt = Date.now() / 1000 - time;

    d2d.BeginDraw();

    const mouse = GetMousePos();
    
    d2d.Clear(1.0, 1.0, 1.0, .1);

    brush.SetColor(Math.random(), Math.random(), Math.random(), 1);//, .1);//Math.random());

    d2d.FillRectangle(mouse.x - 256, mouse.y - 256, mouse.x + 256, mouse.y + 256, brush);

    d2d.EndDraw();

    TextOut(dc, 100, 100, `dt: ${dt}`);
    TextOut(dc, 100, 116, `fps: ${1/dt}`);

    time = Date.now()/1000;

    i++;

    j += i;

    Sleep(16);
}

brush.Release();
d2d.Release();
bitmap.Release();
bitmapBrush.Release();