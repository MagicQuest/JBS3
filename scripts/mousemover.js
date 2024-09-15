const screen = GetDC(NULL);

let mouse = GetMousePos();
let velocity = {x: 0, y: 0};
let now = Date.now();

let hide = false;

//print(GetKeyboardState());

//let activeWindow = GetActiveWindow();
//let aWDC = GetDC(activeWindow);

                        //bruh who was gonna tell me i had this hardcoded icon here dawg
const icon = LoadImage(NULL, __dirname+"/minesweeper/troll.ico"/*"E:/CPP/Randumb/cmake-build-debug/troll.ico"*/, IMAGE_ICON, 0, 0, LR_LOADFROMFILE);//LoadImage(NULL, IDI_WINLOGO, IMAGE_ICON, 64, 64, LR_SHARED);//LoadIcon(NULL, IDI_APPLICATION);
print(icon, GetLastError());

const console = GetConsoleWindow();

const icons = [icon, LoadIcon(NULL, IDI_APPLICATION),LoadIcon(NULL, IDI_ERROR),LoadIcon(NULL, IDI_INFORMATION),LoadIcon(NULL, IDI_QUESTION),LoadIcon(NULL, IDI_SHIELD),LoadIcon(NULL, IDI_WARNING),LoadIcon(NULL, IDI_WINLOGO)];
//const icons2 = [IDI_APPLICATION, IDI_ERROR, IDI_INFORMATION, IDI_QUESTION, IDI_SHIELD, IDI_WARNING, IDI_WINLOGO];

const iconobjs = [];

print("troll dimensions -> ", GetIconDimensions(icon));

const hBrush = CreateSolidBrush(RGB(Math.random()*255,Math.random()*255,Math.random()*255));

class IconObj {
    constructor(obj, velocity, icon) {
        this.x = obj.x;
        this.y = obj.y;
        this.vx = velocity.x;
        this.vy = velocity.y;
        this.icon = icon;
        let dim = GetIconDimensions(this.icon);
        //if(dim.cx < 100) {
        //    dim.cx += 32;
        //    dim.cy += 32;
        //}
        if(dim.width < 100) {
            dim.width += 32;
            dim.height += 32;
        }
        this.cx = dim.width;
        this.cy = dim.height;
    }

    update(rect, window) {
        this.vy += .1;
        this.x += this.vx;
        this.y += this.vy;
        if(this.x > rect.right-this.cx) {
            SetWindowPos(window, NULL, rect.left+this.vx, rect.top+this.vy, rect.right, rect.bottom, SWP_NOSIZE | SWP_NOZORDER);
            this.x = rect.right-this.cx;
            this.vx *= -1;
        }else if(this.x < rect.left) {
            SetWindowPos(window, NULL, rect.left+this.vx, rect.top+this.vy, rect.right, rect.bottom, SWP_NOSIZE | SWP_NOZORDER);
            this.x = rect.left;
            this.vx *= -1;
        }
        if(this.y > rect.bottom-this.cy) {
            SetWindowPos(window, NULL, rect.left+this.vx, rect.top+this.vy, rect.right, rect.bottom, SWP_NOSIZE | SWP_NOZORDER);
            this.y = rect.bottom-this.cy;
            this.vy *= -1;
        }else if(this.y < rect.top) {
            SetWindowPos(window, NULL, rect.left+this.vx, rect.top+this.vy, rect.right, rect.bottom, SWP_NOSIZE | SWP_NOZORDER);
            this.y = rect.top;
            this.vy *= -1;
        }
        !hide && DrawIconEx(screen, this.x, this.y, this.icon, this.cx, this.cy, 0, hBrush, DI_NORMAL | DI_COMPAT);
    }
}

let window = GetForegroundWindow();

print("PRESS E TO CHANGE TROLLED WINDOW"); //because i keep forgetting
print("PRESS H TO HIDE ICONS");

while (!GetKey(VK_ESCAPE)) {
    //if(GetKeyDown("e")) {
    //    SetForegroundWindow(FindWindow(NULL, "jbs"));
    //}
    now = Date.now();

    //if(GetKeyboardState()[VK_RBUTTON]) {
        //print(GetAsyncKeyboardState()[VK_RBUTTON]);
    //} //this looks really weird

    //if(GetActiveWindow() != activeWindow) {
    //    ReleaseDC(activeWindow, aWDC);
    //    activeWindow = GetActiveWindow();
    //    aWDC = GetDC(activeWindow);
    //}
    //const aWRect = GetWindowRect(activeWindow);
    //TextOut(aWDC, aWRect.left+100, aWRect.top+100, "ACTIVE WINDOW! "+GetWindowText(activeWindow));

    const lastM = GetMousePos();
    velocity.y += .1;
    if(lastM.x != Math.floor(mouse.x) || lastM.y != Math.floor(mouse.y)) {
        //print("deviation");
        velocity.x += (lastM.x - mouse.x)/10;
        velocity.y += (lastM.y - mouse.y)/10;
    }
    mouse = {x: (mouse.x+velocity.x), y: (mouse.y+velocity.y)};
    //const window = GetForegroundWindow();
    const rect = GetWindowRect(window);
    //print(GetWindowText(GetForegroundWindow()));
    //let valid = {left: rect.left != 0, right: rect.right != 1080, top: rect.top != 0, bottom: rect.bottom != 1920};
    if(mouse.x > rect.right) {
        //if(valid.right) {
            SetWindowPos(window, NULL, rect.left+velocity.x, rect.top+velocity.y, rect.right, rect.bottom, SWP_NOSIZE | SWP_NOZORDER);
        //}
        mouse.x = rect.right;
        velocity.x *= -.9;
    }else if(mouse.x < rect.left) {
        //if(valid.left) {
            SetWindowPos(window, NULL, rect.left+velocity.x, rect.top+velocity.y, rect.right, rect.bottom, SWP_NOSIZE | SWP_NOZORDER);
        //}
        mouse.x = rect.left;
        velocity.x *= -.9;
    }
    if(mouse.y > rect.bottom) {
        //if(valid.bottom) {
            SetWindowPos(window, NULL, rect.left+velocity.x, rect.top+velocity.y, rect.right, rect.bottom, SWP_NOSIZE | SWP_NOZORDER);
        //}
        mouse.y = rect.bottom;
        velocity.y *= -.9;
    }else if(mouse.y < rect.top) {
        //if(valid.top) {
            SetWindowPos(window, NULL, rect.left+velocity.x, rect.top+velocity.y, rect.right, rect.bottom, SWP_NOSIZE | SWP_NOZORDER);
        //}
        mouse.y = rect.top;
        velocity.y *= -.9;
    }
    if(GetKeyDown("e")) {
        window = WindowFromPoint(mouse.x, mouse.y);
        print(GetWindowText(window));
    }
    if(GetKeyDown("h")) { //wait you can do that? bruhhhhhhh
        hide = !hide;
    }
    if(GetKey(VK_LBUTTON)) {
        iconobjs.push(new IconObj(mouse,velocity, icons[Math.floor(Math.random()*icons.length)]));
        //print(iconobjs);
    }
    //SetMousePos(mouse.x, mouse.y);
    !hide && DrawIconEx(screen, mouse.x, mouse.y, icons[Math.floor(Math.random()*icons.length)], 64, 64, 0, hBrush, DI_NORMAL | DI_COMPAT);
    for(let i of iconobjs) {
        i.update(rect, window);
    }
    //print(Math.floor(Math.random()*icons.length), icons[Math.floor(Math.random()*icons.length)]);
    //print(GetWindowLongPtr(window, GWLP_HINSTANCE), hInstance);
    //print(icons[Math.floor(Math.random()*icons.length)]);
    //const newIcon = LoadIcon(/*GetWindowLongPtr(window, GWLP_HINSTANCE)*/NULL, icons2[Math.floor(Math.random()*icons2.length)]);
    //print(newIcon, SetClassLongPtr(window, GCLP_HICON, newIcon));
    //SetCursor(NULL);
    Sleep(1.6);
    //TextOut(screen, lastM.x, lastM.y, "dt: "+(1/(Date.now()/1000-now/1000)));
    TextOut(screen, 500, 500, "dt: "+(1/(Date.now()/1000-now/1000)));
}