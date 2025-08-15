let context;
let i = 0;

let points = [];

const w = 512;
const h = 512;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        context = createCanvas("2d", NULL, hwnd);
        print(context.fillStyle, context.strokeStyle);
        //context.fillStyle = "rgb(255, 255, 0)";
        context.strokeStyle = "#ffaa00";
        //print(context.fillStyle, context.strokeStyle);
        print(context);

        for(let i = 0; i < 4; i++) {
            points.push({x: Math.random()*512, y: Math.random()*512, vx: (Math.random()-.5)*8, vy: (Math.random()-.5)*8});
        }

        SetTimer(hwnd, 0, 16);
    }else if(msg == WM_TIMER) {
        context.BeginDraw(); //idk how tf there is no BeginDraw for canvas (OR WEBGL) in html
        //context.clearRect(); //idk if i can make clearRect because there's just no function in d2d for that (and a transparent brush is NOT gonna do it) (maybe i should try to use a layer? ok that didn't work lol)
        //WAIT A SEC I WAS WORRIED ABOUT ALL THE PATH TYPE FUNCTIONS D2D MIGHT HAVE SOMETHING FOR THAT ID2D1PathGeometry1?!
        //context.clearRect(0, 0, w, h);
        context.clear();
        
        context.fillStyle = "#ffff00";
        context.fillRect(0, 0, 128, 128);
        
        context.fillStyle = `rgb(255, ${255-Math.abs(Math.sin(i/100)*255)}, ${(i)%255}, 0.1)`;
        context.fillRect(128, 128, 128, 128);
        
        context.lineWidth = i%10;
        context.strokeStyle = "#ffaa00";
        context.strokeRect(0, 256, 256, 256);
        
        //if(i <= 1) {
            context.lineWidth = 10;
            context.beginPath(256, 512);//, D2D1_FIGURE_BEGIN_HOLLOW); //unfortunately you need to pass the starting position as well as if it's filled or hollow
            //context.moveTo(256, 512);
            context.lineTo(512, (128-Math.sin(i/50)*128)+256);//(i%256)+256);
            context.lineTo(512, 512);
            //context.closePath();//D2D1_FIGURE_END_CLOSED);
            context.fill(); //using D2D1_FIGURE_BEGIN_HOLLOW stops fill from working
            context.stroke();
        //}

        context.strokeStyle = "#ff0000";
        context.beginPath(); //aw snap i don't need to pass arguments anymore
        context.moveTo(128, 128);
        context.lineTo(256+128, 256);
        context.moveTo(256, 0);
        context.lineTo(256, 256);
        //context.closePath();
        context.stroke();
        //context.fill();

        context.strokeStyle = `rgb(${Math.abs(Math.sin(i/50))*255}, ${255-Math.abs(Math.sin(i/100))*255}, 255)`;
        context.beginPath(points[0].x, points[0].y);//, D2D1_FIGURE_BEGIN_FILLED); //defaults to filled (now)
        //context.moveTo(points[0].x, points[0].y); //wait passing nothing for beginPath and immediately using a moveTo still doesn't let the path get filled... erm what the s (wait maybe if i use a different d2d1 fill mode)
        for(let point of points) {
            point.x+=point.vx;
            point.y+=point.vy;
            if(point.x < 0 || point.x > 512) {
                point.vx = -point.vx;
                point.x = Math.max(Math.min(point.x, 512), 0);
            }
            if(point.y < 0 || point.y > 512) {
                point.vy = -point.vy;
                point.y = Math.max(Math.min(point.y, 512), 0);
            }
            context.lineTo(point.x, point.y);
        }
        context.closePath();
        context.fillStyle = `rgba(${Math.abs(Math.sin(i/50))*255}, ${255-Math.abs(Math.sin(i/100))*255}, 255, 0.1)`; //oops this wasn't working because i was accidently setting the strokeBrush's color instead
        context.fill();
        context.stroke();

        context.beginPath(128+64, 256+128);
        context.arc(128+64, 256+128, 50, 0);
        context.closePath();
        context.stroke();
        context.fill();

        context.EndDraw();
        i++;
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        context.Release();
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_WINDOW+1;
wc.hCursor = LoadCursor(NULL, IDC_HAND);

window = CreateWindow(WS_EX_NOREDIRECTIONBITMAP, wc, "new2dcanvasfuncs.js", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+42, NULL, NULL, hInstance);