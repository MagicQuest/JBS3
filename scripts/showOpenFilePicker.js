let d2d, image;
let font, brush;

let window;//, button;

let position = {x: 500, y: 500, vx: 0, vy: 0};

let scale = 1;

let edited = false;
let filepicking = false;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd);
        
        font = d2d.CreateFont("impact", 40);
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
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }else if(msg == WM_PAINT) {
        d2d.BeginDraw();
        //d2d.Clear(0,1,0);
        d2d.DrawBitmap(image, 0, 0, 256*scale, 256*scale);
        if(!edited) {
            d2d.DrawText("press P to choose another image!", font, 0, 0, 256*scale, 256*scale, brush);
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
        }
        if(GetKey("P")) {
            filepicking = true;
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
        position.x += position.vx;
        position.y += position.vy;
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
        if(movewindow) {
            SetWindowPos(hwnd, HWND_TOPMOST, position.x, position.y, 256*scale, 256*scale, SWP_NOZORDER);
            if(resize) {
                d2d.Resize(256*scale, 256*scale);
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