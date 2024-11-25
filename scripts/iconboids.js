//watching this video https://www.youtube.com/watch?v=6dJlhv3hfQ0
//about boids and i wanna recreate it here for the lols (ok he barely explained shit after the steering so im looking here https://www.youtube.com/watch?v=mhjuuHl6qHM -> https://www.red3d.com/cwr/boids/)
//also dropping this here just incase https://www.youtube.com/watch?v=IoKfQrlQ7rA

//const dc = GetDC(NULL);
//SelectObject(dc, GetStockObject(HOLLOW_BRUSH));
//SelectObject(dc, GetStockObject(WHITE_PEN));
const troll = LoadImage(NULL, __dirname+"/minesweeper/troll.ico"/*"E:/CPP/Randumb/cmake-build-debug/troll.ico"*/, IMAGE_ICON, 0, 0, LR_LOADFROMFILE);
const iconIcons = [LoadIcon(NULL, IDI_APPLICATION), LoadIcon(NULL, IDI_ERROR), LoadIcon(NULL, IDI_INFORMATION), LoadIcon(NULL, IDI_QUESTION), LoadIcon(NULL, IDI_SHIELD), LoadIcon(NULL, IDI_WARNING), LoadIcon(NULL, IDI_WINLOGO)];
const iconObjs = [];

const size = 16;
const separationRadius = 10; //not totally sure if this really does anything

let window, d2d;

function random(x) {
    return Math.floor(Math.random()*x);
}

function getMagnitude(x, y) {
    return Math.sqrt(x**2 + y**2);
}

function enumProcessesForIcons(pid) {//PrintProcessNameAndID(pid) { //https://learn.microsoft.com/en-us/windows/win32/psapi/enumerating-all-processes
    let handle = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, false, pid);

    if(handle) {
        let [hMod, cbNeeded, success] = EnumProcessModules(handle);

        if(success) {
            //let name = GetModuleBaseName(handle, hMod);

            let path = GetModuleFileNameEx(handle, hMod);
            let {icon, id} = ExtractAssociatedIcon(hInstance, path);
            print(icon, id);
            iconIcons.push(icon);
        }
    }
    //OOPS I FORGOT CLOSE HANDLE
    CloseHandle(handle);
}

EnumProcesses(enumProcessesForIcons);

class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    get magnitude() {
        return Math.sqrt(this.x**2 + this.y**2);
    }

    set magnitude(value) {
        const old = this.magnitude;
        if(old != 0) {
            const ratio = value/old;
            this.x = this.x*ratio;
            this.y = this.y*ratio;    
        }
    }

    static Dot(v1, v2) {
        const v3 = new Vector2(v1.x-v2.x, v1.y-v2.y);
        const a = v1.magnitude;
        const b = v2.magnitude;
        const c = v3.magnitude;//Math.sqrt(a**2 + b**2); //a^2 + b^2 = c^2 (wait what the fuck you could say im getting the magnitude of these magnitudes) (nah for some reason this wont work)
        const cTheta = Math.acos((a**2 + b**2 - c**2)/(2*a*b));
        return a*b*Math.cos(cTheta); //oh boy im hoping that's right
    }
}

const maxspeed = Math.sqrt((5**2)*2);

class Icon {
    constructor(index, i) {
        this.iconIndex = index;
        this.i = i;
        this.x = random(screenWidth);
        this.y = random(screenHeight);
        //this.vx = random(10)-5; //lol i can't be bothered to do nothing special so this makes it a random value from -5 to 5
        //this.vy = random(10)-5;
        //this.vx = Math.random() > .5 ? 5 : -5;
        //this.vy = Math.random() > .5 ? 5 : -5;
        this.velocity = new Vector2(Math.random() > .5 ? 5 : -5, Math.random() > .5 ? 5 : -5);
        this.radius = 50;
    }

    //SteerMyShit(iconsInRange) {
    DoAllMyShit(iconsInRange) {
        //let mousepresent = false;
        let dir = new Vector2(0, 0);
        if(iconsInRange.length == 0) {
            return dir;
        }
        let aligndir = new Vector2(0, 0);
        let coheredir = new Vector2(0, 0);
        for(let icon of iconsInRange) {
            let vec = new Vector2(icon.x-this.x, icon.y-this.y);
            let ratio = Math.min(1, Math.max(0, (vec.magnitude)/separationRadius));
            //if(icon.i == -1) {
            //    ratio = ratio*50;
            //    print(ratio, "ratio");
            //    mousepresent = true;
            //}
            dir.x -= ratio*(vec.x);
            dir.y -= ratio*(vec.y);

            aligndir.x += icon.velocity.x;
            aligndir.y += icon.velocity.y;

            coheredir.x += icon.x;
            coheredir.y += icon.y;
        }
        aligndir.x /= iconsInRange.length;
        aligndir.y /= iconsInRange.length;

        coheredir.x /= iconsInRange.length;
        coheredir.y /= iconsInRange.length;

        coheredir = new Vector2(coheredir.x-this.x, coheredir.y-this.y);

        
        dir.magnitude = 1;//1.05;//mousepresent ? 5000 : 1; //amazing...
        aligndir.magnitude = 1;
        coheredir.magnitude = 1;

        dir.x += aligndir.x + coheredir.x;
        dir.y += aligndir.y + coheredir.y;
        if(this.i == 0) {
            print(dir);
        }
        return dir;
    }

    //AlignMyShit(iconsInRange, dir) {
    //    let localDir = new Vector2(0, 0);
    //    for(let icon of iconsInRange) {
    //        
    //    }
    //    dir.x += localDir.x;
    //    dir.y += localDir.y;
    //    //no return dir because im directly modifying it (and objects are by reference)
    //}

    WithinVision(iconx, icony) {
        //let us = new Vector2(this.vx, this.vy);
        let them = new Vector2(iconx-this.x, icony-this.y);
        const something = -100;
        //if(this.i == 0) {
        //    print(us, them, Vector2.Dot(us, them));
        //}
        return Vector2.Dot(this.velocity, them) > something;
    }

    Update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        if(this.x+size < 0 || this.x > screenWidth) {
            this.x = screenWidth-(this.x+size); //damn im a geniusx
        }
        if(this.y+size < 0 || this.y > screenHeight) {
            this.y = screenHeight-(this.y+size); //damn im a geniusx
        }
        
        d2d.DrawBitmap(iconIcons[this.iconIndex], this.x, this.y, this.x+size, this.y+size);
        if(this.i == 0) {
            brush.SetColor(1.0, 1.0, 0.0);
            d2d.DrawEllipse(this.x, this.y, this.radius, this.radius, brush);
            brush.SetColor(0.0, 0.2, 1.0);
            d2d.DrawEllipse(this.x, this.y, separationRadius, separationRadius, brush);
            brush.SetColor(1.0, 1.0, 1.0);
        }
        //DrawIconEx(dc, this.x, this.y, this.i == 0 ? troll : iconIcons[this.iconIndex], size, size, 0, NULL, DI_COMPAT | DI_NORMAL);

        //if(this.i == 0) {
        //    MoveTo(dc, this.x, this.y);
        //    LineTo(dc, this.x+this.vx, this.y+this.vy);
        //}

        let iconsInRange = [];

        for(let icon of iconObjs) {
            if(icon.i == this.i) {
                continue;
            }
            if(getMagnitude(icon.x - this.x, icon.y - this.y) <= this.radius && this.WithinVision(icon.x, icon.y)) {
                //some how some way i think i've actually done this correctly and it might be working!
                //bruh it took me so long to do this dot product shit that i'm mad there's still 11 minutes left of the video dawg FDUCK
                //here's the part where i do steering separation (well hold on i need every icon in range)
                //MoveTo(dc, this.x, this.y);
                //LineTo(dc, icon.x, icon.y);
                iconsInRange.push(icon);
                if(icon.i == -1) {
                    d2d.DrawLine(this.x, this.y, icon.x, icon.y, brush);
                }
            }
        }
        let dir = this.DoAllMyShit(iconsInRange);//SteerMyShit(iconsInRange);
        //this.AlignMyShit(iconsInRange, dir);
        //this.CohereMyShit(iconsInRange, dir); //i didn't even know this was a word
        this.velocity.x += dir.x;
        this.velocity.y += dir.y;
        if(this.velocity.magnitude > maxspeed) {
            this.velocity.magnitude = maxspeed;
        }
        //this.velocity.magnitude = Math.sqrt((5**2)*2); //i thinks
        //[this.vx, this.vy] = this.SteerMyShit(iconsInRange); //there's no way you can do that (you can!)
    }
}

let brush;

let lastMouse = {x: 0, y: 0};
let mouse = {x: 0, y: 0, velocity: new Vector2(0, 0), Update: ()=>{}, i: -1};

function windowProc(hwnd, msg, lp, wp) {
    if(msg == WM_CREATE) {
        window = hwnd;
        const wic = InitializeWIC(); ScopeGUIDs(wic);
        d2d = createCanvas("d2d", ID2D1DeviceContextDComposition, hwnd); //pulling out the big guns
        brush = d2d.CreateSolidColorBrush(1.0, 1.0, 0.0);
        for(let i = 0; i < iconIcons.length; i++) {
            const icon = iconIcons[i];
            let wicBmp = wic.CreateBitmapFromHICON(iconIcons[i], wic.GUID_WICPixelFormat32bppPBGRA);
            //iconIcons[i] = d2d.CreateBitmapFromWicBitmap(wicBmp, true); //son this shit is not working apparently im using the wrong pixel format and im not sure which one i should use so im just gonna copy the memory lo!
            let {width, height} = wicBmp.GetSize();
            print(width, height);
            let d2dBmp = d2d.CreateBitmap(width, height);
            d2dBmp.CopyFromMemory(0, 0, width, height, wicBmp.GetPixels(wic));
            
            wicBmp.Release();
            DestroyIcon(icon);
            iconIcons[i] = d2dBmp;
        }
        //iconIcons.push(d2d.CreateBitmapFromWicBitmap(wic.LoadBitmapFromFilename(__dirname+"/ant.png", wic.GUID_WICPixelFormat32bppPBGRA, 0))); //lol i gotta make em rotate
        wic.Release();

        for(let i = 0; i < 500; i++) {
            iconObjs.push(new Icon(random(iconIcons.length), i));
        }

        iconObjs.push(mouse);

        //not using SetTimer because im using the old school loop haha you can't stop me
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        d2d.Release();
    }
}

function loop() {
//while(!GetKey(VK_ESCAPE)) {
if(GetKey(VK_ESCAPE)) {
    DestroyWindow(window);
}else if(d2d) {
    d2d.BeginDraw();
    d2d.Clear(0.0, 0.0, 0.0, 0.0);
    let {x, y} = GetCursorPos();
    //mouse = {x, y, velocity: new Vector2(x-lastMouse.x, y-lastMouse.y)}; //oopsies this was causing problems silently for some reason?
    mouse.x = x;
    mouse.y = y;
    mouse.velocity = new Vector2(x-lastMouse.x, y-lastMouse.y);
    //print(mouse.velocity, "mouse velocity");
    //d2d.DrawBitmap(iconIcons[0], x, y, x+32, y+32, 1.0, D2D1_BITMAP_INTERPOLATION_MODE_LINEAR, 0, 0, 32, 32);
    for(let icon of iconObjs) {
        icon.Update();
    }
    lastMouse = {x, y};
    d2d.EndDraw();
    Sleep(16);
}
//}
}

const wc = CreateWindowClass("iconboids", /*init, */windowProc, loop); //we don't go to ravenholm (loop)
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_NOREDIRECTIONBITMAP | WS_EX_TRANSPARENT | WS_EX_TOPMOST | WS_EX_LAYERED, wc, "", WS_POPUP | WS_VISIBLE, 0, 0, screenWidth, screenHeight, NULL, NULL, hInstance);
