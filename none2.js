const window = FindWindow(null, "Documents");//"JBS3 (Running) - Microsoft Visual Studio");
const d2d = createCanvas("d2d", ID2D1DCRenderTarget, window);

print("window:", window);
print(d2d, d2d.internalDXPtr);

const brush = d2d.CreateSolidColorBrush(1.0, 0.0, 1.0, 1.0);
print("brush:", brush);

const font = d2d.CreateFont("Comic Sans ms", 50);

const bitmap = d2d.CreateBitmapFromFilename("E:/Users/megal/OneDrive/Desktop/bruh box.png");
const screenBitmap = d2d.CreateBitmap(1920,1080);//d2d.CreateBitmapFromFilename("E:/Users/megal/OneDrive/Desktop/bruh box.png");
//ok who knew that https://learn.microsoft.com/en-us/windows/win32/api/d2d1/nf-d2d1-id2d1bitmap-copyfromrendertarget tells you that it fails if the bitmap is NOT big enough
const bitmapBrush = d2d.CreateBitmapBrush(bitmap);
bitmapBrush.SetExtendMode(D2D1_EXTEND_MODE_WRAP, D2D1_EXTEND_MODE_WRAP);

let screenBitmapBrush;

//const screenBitmapBrush = d2d.CreateBitmapBrush(screenBitmap);
//bitmapBrush.SetExtendModeX(D2D1_EXTEND_MODE_WRAP);
//bitmapBrush.SetExtendModeY(D2D1_EXTEND_MODE_WRAP);
//print(bitmap, "CUM");
//for (let i in bitmap) {
//    print(i, bitmap[i]);
//}
const bitmapSize = bitmap.GetSize();
//d2d.BeginDraw();

//setInterval(() => {

const dc = GetDC(GetConsoleWindow());

let time = Date.now()/1000;

print(time);
print("dxsize ->", d2d.GetSize().width, d2d.GetSize().height);

const GSC = d2d.CreateGradientStopCollection([0,1,0,0],[.5,0,1,0],[1,0,0,1]);//d2d.CreateGradientStopCollection([0.0, 1.0, .05, 1.0, .1], [.5, 1.0, .5, 1.0]);//,2);
const gradientBrush = d2d.CreateLinearGradientBrush(1920-256, 0, 1920, 100, GSC);
const radialGradient = d2d.CreateGradientStopCollection([0, 1, 0, 0],[1,1,1,0]);//d2d.CreateGradientStopCollection([0.0, 1.0, .05, 1.0, .1], [.5, 1.0, .5, 1.0]);//,2);
const radialBrush = d2d.CreateRadialGradientBrush(0, 0, 0, 0, 200, 200, radialGradient);
//print(brush.GetOpacity(), brush.SetOpacity(.5), brush.GetOpacity());

//print(...[21, "youstupid", "noinot"]);

//FUCK THEY FIGURED OUT IM USING FAKE ARRAYS
//print(...brush.GetColor(), brush.SetColor(0.0,0.0,0.0, .5), ...brush.GetColor());
//ok so i fixed the fake arrays then realized that i wanted to just implement the color thing
print(brush.GetColor());

print(D2D1_EXTEND_MODE_FORCE_DWORD, D2D1_BITMAP_INTERPOLATION_MODE_LINEAR);

print("rendertarget->", d2d.renderTarget);
//print(globalThis);

let i = 0;
let j = 0;

while (!GetKey(VK_ESCAPE)) {
    let dt = Date.now() / 1000 - time;

    //if (GetKey(VK_ESCAPE)) {
    //    break;
    //}
        
    d2d.BeginDraw();

    const mouse = GetMousePos();
    //const rect = GetWindowRect(window);

    //mouse.x -= rect.right;
    //mouse.y -= rect.bottom;

    d2d.Clear(1.0, 1.0, 1.0, .1);

    //brush.SetColor(1.0,1.0,1.0,.1);

    //d2d.FillRectangle(0,0,1920,1080,brush);

    //print(rect.left, rect.top, rect.right, rect.bottom);
    brush.SetColor(Math.random(), Math.random(), Math.random(), .1);//, .1);//Math.random());

    //d2d.DrawEllipse(mouse.x, mouse.y, 100, 200, brush, 10);//when i lose constrol AHHH AH H AH  UH UH AHHH AHH AHH UH UHI NEED YU LOVE
    d2d.FillEllipse(mouse.x, 200, 100, 200, bitmapBrush);
    //d2d.DrawRectangle(720, 540, mouse.x, mouse.y, brush, 10);
    d2d.FillRectangle(720, 540, 50, 50, brush);
    d2d.DrawGradientText("lol" + Math.random(), font, 200, 800, 1920-200, 1080-800, gradientBrush);
    d2d.DrawBitmap(bitmap, mouse.x-(bitmapSize.width/2), mouse.y-(bitmapSize.height/2), bitmapSize.width, bitmapSize.height, 0.1);

    d2d.DrawRoundedRectangle(800, 800, 100, 100, (mouse.x / 1920) * 20, (mouse.y / 1080) * 20, brush);
    d2d.FillRoundedRectangle(810, 810, 80, 80, (mouse.x / 1920) * 20, (mouse.y / 1080) * 20, brush);

    d2d.FillRectangle(1920 - 256, 1000 - 256, 256, 256, gradientBrush);

    d2d.FillGradientEllipse(mouse.x, mouse.y, Math.sin(i / 10) * 50, Math.sin(i / 10) * 50, gradientBrush, j / 50);//i*50);
    d2d.DrawGradientText("sped: "+Math.round(j/5000), font, mouse.x-75,mouse.y+25, 1920-(mouse.x-75), 1080-(mouse.y+25), radialBrush);

    //if (i == 0) {
    //    screenBitmapBrush.SetBitmap(screenBitmap);
    //}

    screenBitmap.CopyFromRenderTarget(0, 0, d2d.renderTarget, 0, 0, 1920, 1080);
    if (!screenBitmapBrush) {
        screenBitmapBrush = d2d.CreateBitmapBrush(screenBitmap);
    } else {
        //print(screenBitmapBrush, screenBitmap);
        screenBitmapBrush.SetBitmap(screenBitmap);
    }

    
    d2d.DrawGradientEllipse(mouse.x - 256, mouse.y - 256, 256, 256, gradientBrush, j / 50, 5);//i*50);
    d2d.FillGradientEllipse(mouse.x - 256, mouse.y - 256, 100, 100, gradientBrush, j / 50);//i*50);
    d2d.DrawGradientRectangle(mouse.x, mouse.y, 256, 256, gradientBrush, j / 50);
    d2d.FillGradientRectangle(mouse.x + 25, mouse.y + 25, 206, 206, gradientBrush, j/50);

    //d2d.DrawBitmap(screenBitmap, 0, 0, mouse.x, mouse.y, 1, D2D1_BITMAP_INTERPOLATION_MODE_LINEAR, 0,0, mouse.x, mouse.y-1);

    //d2d.FillRectangle(mouse.x, mouse.y, 1920, 1080, screenBitmapBrush || bitmapBrush);

    //radialBrush.SetCenter(mouse.x, mouse.y);

    //radialBrush.SetGradientOriginOffset(50, 50);
    //radialBrush.SetRadius(400, 400);
    //d2d./*Draw*/FillEllipse(mouse.x, mouse.y, 200, 200, radialBrush);//, 100);

    //d2d.DrawGradientRoundedRectangle(mouse.x - 256, mouse.y - 256, mouse.x + 256, mouse.y + 256, 100, 100, gradientBrush, i, 10);//(mouse.x / 1920)*45);
    //d2d.FillGradientRoundedRectangle((Math.cos(i / 500) + .5) * (1920) - 100, 700, (Math.cos(i / 500) + .5) * (1920)+100, 900, 50, 50, gradientBrush, i);//(mouse.x / 1920)*45);
    d2d.FillGradientRoundedRectangle(Math.abs(Math.sin(i / 100))*1920-90, 710, 180, 180, 25, 25, gradientBrush, i*5);//(mouse.x / 1920)*45);
    d2d.DrawGradientRoundedRectangle(Math.abs(Math.sin(i / 100))*1920-100, 700, 200, 200, 25, 25, gradientBrush, i*5 , 5);//(mouse.x / 1920)*45);

    //d2d.DrawRectangle(0, 0, 1920, 1080, bitmapBrush, 100);

    d2d.DrawGradientLine(0, 1000, mouse.x, mouse.y, radialBrush, 10);

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
font.Release();
bitmap.Release();
bitmapBrush.Release();
GSC.Release();
gradientBrush.Release();
radialBrush.Release();
radialGradient.Release();
screenBitmap.Release();
screenBitmapBrush.Release();
//}, 16);

//d2d.DrawEllipse(100,100,100,100,brush,50);//when i lose constrol AHHH AH H AH  UH UH AHHH AHH AHH UH UHI NEED YU LOVE

//d2d.EndDraw();