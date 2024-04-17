let d2d, image;
let font, smallFont, brush;

let window;//, button;

let position = {x: 500, y: 500, vx: 0, vy: 0};

let scale = 1;

let edited = false;
let filepicking = false;

let bBCH = -1; //bounces Before Corner Hit

function calculateBouncesToMaxWin() {
    if(!edited) {
        return;
    }
    let calcBounces = 0;
    let cornerHit = false;
    let tempP = {x: position.x, y: position.y, vx: position.vx, vy: position.vy};
    while(calcBounces < 1000) { //yeah sometimes it just don't get it idk
        tempP.x += tempP.vx;
        tempP.y += tempP.vy;
        let tempOldVel = {vx: tempP.vx, vy: tempP.vy};
        //print(tempP);
        if(tempP.x < 0) {
            tempP.x = 0;
            tempP.vx *= -1;
        }else if(tempP.x > screenWidth-(256*scale)) {
            tempP.x = screenWidth-(256*scale);
            tempP.vx *= -1;
        }
        if(tempP.y < 0) {
            tempP.y = 0;
            tempP.vy *= -1;
        }else if(tempP.y > screenHeight-(256*scale)) {
            tempP.y = screenHeight-(256*scale);
            tempP.vy *= -1;
        }
        if(tempOldVel.vx != tempP.vx || tempOldVel.vy != tempP.vy) {
            calcBounces++;
            //print(calcBounces);
            if(tempOldVel.vx != tempP.vx && tempOldVel.vy != tempP.vy) {
                cornerHit = true;
                break;
            }
        }
    }
    bBCH = calcBounces;
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd);
        
        font = d2d.CreateFont("impact", 40);
        smallFont = d2d.CreateFont("impact", 18);
        brush = d2d.CreateSolidColorBrush(1.0,1.0,1.0);
        
        image = d2d.CreateBitmapFromFilename(__dirname+"/boxside.png");

        InvalidateRect(hwnd, 0, 0, 256*scale, 256*scale, true);
        UpdateWindow(hwnd); //draw immediately

        SetTimer(hwnd, 1, 16);
    }else if(msg == WM_KEYDOWN) {
        if(wp == VK_ESCAPE) {
            DestroyWindow(hwnd);
        }/*else if(wp == 'P'.charCodeAt(0)) {
            options = {
                multiple: false,
                excludeAcceptAllOption: true,
                types: [
                    {
                        description: "Images",
                        accept: [".png", ".jpg", ".bmp", ".jpeg"]
                    }
                ]
            }

            image = d2d.CreateBitmapFromFilename(showOpenFilePicker(options)[0]); //showOpenFilePicker always returns a list so im choosing the first element (just like the browser version of this function)
            edited = true;
            position.vx = Math.random() > .5 ? -5 : 5;
            position.vy = Math.random() > .5 ? -5 : 5;
        }*/
        else if(wp == 'C'.charCodeAt(0)) { //it's gotta be a capital letter
            calculateBouncesToMaxWin();
            InvalidateRect(hwnd, 0, (256-18)*scale, 256*scale, 256*scale, true);
            UpdateWindow(hwnd); //draw immediatelyf        
            //idk why but it was hard to close the message box so ig i wont use it
            //Msgbox("calculated "+bBCH+" bounces left until corner hit", "showOpenFilePicker.js", MB_OK | MB_ICONINFORMATION);
        }
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }else if(msg == WM_PAINT) {
        d2d.BeginDraw();
        //d2d.Clear(0,1,0);
        d2d.DrawBitmap(image, 0, 0, 256*scale, 256*scale);
        if(!edited) {
            d2d.DrawText("press P to choose another image!", font, 0, 0, 256*scale, 256*scale, brush);
        }
        if(bBCH >= 0) {
            d2d.DrawText(bBCH + " bounces", smallFont, 0, 256*scale, 256*scale, (256-18)*scale, brush);
        }
        d2d.EndDraw();
    }else if(msg == WM_TIMER && !filepicking) {
        let movewindow = true;
        let resize = false;
        if(GetKey(VK_LCONTROL)) {
            //position = GetMousePos();
            mouse = GetMousePos();
            position.x = mouse.x;
            position.y = mouse.y;
            //SetWindowPos(hwnd, HWND_TOPMOST, position.x, position.y, 256*scale, 256*scale, SWP_NOZORDER);
            movewindow = true;
            bBCH = -1;
        }
        if(GetKey("P")) {
            filepicking = true;
            options = {
                multiple: false,
                excludeAcceptAllOption: true,
                types: [
                    {
                        description: "Images",
                        accept: [".png", ".jpg", ".bmp", ".jpeg"] //i can't be bothered to implement the mime types :sob:
                    }
                ]
            }

            file = showOpenFilePicker(options);
            if(file) { //showOpenFilePicker returns undefined if yuo cancel
                edited = true;
                image = d2d.CreateBitmapFromFilename(file[0]); //showOpenFilePicker always returns a list so im choosing the first element (just like the browser version of this function)
                position.vx = Math.random() > .5 ? -5 : 5;
                position.vy = Math.random() > .5 ? -5 : 5;
            }
            filepicking = false;
        }
        if(GetKey(VK_UP)) {
            scale += .1;

            movewindow = true;
            resize = true;
        }else if(GetKey(VK_DOWN)) {
            scale -= .1;
            
            movewindow = true;
            resize = true;
        }
        if(GetKey(VK_LEFT)) {
            position.vx/=1.1;
            position.vy/=1.1;
            bBCH = -1;
        }else if(GetKey(VK_RIGHT)) {
            position.vx*=1.1;
            position.vy*=1.1;
            bBCH = -1;
        }
        position.x += position.vx;
        position.y += position.vy;
        let oldVel = {vx: position.vx, vy: position.vy}; //huh i forgor let
        if(position.x < 0) {
            position.x = 0;
            position.vx *= -1;
        }else if(position.x > screenWidth-(256*scale)) {
            position.x = screenWidth-(256*scale);
            position.vx *= -1;
        }
        if(position.y < 0) {
            position.y = 0;
            position.vy *= -1;
        }else if(position.y > screenHeight-(256*scale)) {
            position.y = screenHeight-(256*scale);
            position.vy *= -1;
        }
        if(oldVel.vx != position.vx || oldVel.vy != position.vy) {
            if(bBCH >= 0) {
                bBCH--;
                print(bBCH + "bounces left before corner hit!");
            }else {
                calculateBouncesToMaxWin();
            }
            InvalidateRect(hwnd, 0, (256-18)*scale, 256*scale, 256*scale, true);
            UpdateWindow(hwnd); //draw immediately
            if(oldVel.vx != position.vx && oldVel.vy != position.vy) {
                //let p = PlaySoundSpecial("E:/Users/megal/source/repos/JBS3/scripts/corner hit 2.mp3", `nigga`, NULL, false);
                //PlaySound(__dirname+"/corner hit 2.wav", hInstance, SND_FILENAME | SND_ASYNC); //use PlaySound for wav (playsound does not cause memory leaks but wont play more than once at a time)
                //PLAYSOUNDSPECIAL DOESN'T CAUSE MEMORY LEAKS ANYMORE GRAAAAHHHH (before this update i had to randomize the sound id (so it would play more than once) which lowkey caused a memory leak but not anymore)
                PlaySoundSpecial(__dirname+"/corner hit 2.wav", `cornerhit`, NULL, false);
                PlaySoundSpecial(__dirname+"/nice shot.mp3", `niceshot`, NULL, false);
            }
        }
        if(movewindow) {
            SetWindowPos(hwnd, HWND_TOPMOST, position.x, position.y, 256*scale, 256*scale, SWP_NOZORDER);
            if(resize) {
                d2d.Resize(256*scale, 256*scale);
                bBCH = -1;
            }
        }
        //make icon/cursor
        RedrawWindow(hwnd, 0, 0, 256*scale, 256*scale, NULL,RDW_INVALIDATE | RDW_UPDATENOW);
    }
}

const wc = CreateWindowClass("winclassniggassofp", windowProc);
wc.hCursor = LoadCursor(NULL, IDC_HAND);
wc.hbrBackground = CreateSolidBrush(RGB(0,255,0));

CreateWindow(WS_EX_TOOLWINDOW | WS_EX_TOPMOST, wc, "", WS_POPUP | WS_VISIBLE, position.x, position.y, 256*scale, 256*scale, NULL, NULL, hInstance);