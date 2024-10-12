const w = 800;
const h = 600;

let controls = [];

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        SoundSentry();
        controls.push(CreateWindow(NULL, ANIMATE_CLASS, NULL, ACS_AUTOPLAY | ACS_TIMER | WS_BORDER | WS_CHILD | WS_VISIBLE, 0, 0, 0, 0, hwnd, 1, hInstance)); //oops this wasn't working earlier because i forgot WS_CHILD and WS_VISIBLE
        SendMessage(controls[controls.length-1], ACM_OPEN, 0, __dirname+"/chomik.avi"); //Animate_Open //"E:/KoolStuff/KoolTemp/faze20001-0024.avi");
        print(__dirname+"/chomik.avi"); //faze20001-0024.avi
        //damn this chomik.avi i had to use an older version of blender (before 4.2) because they got rid of the [AVI Raw] file format export option
        //nah this damn raw avi shit is way too big bruh it's 68x89 (30 fps) and STILL 3.7 MB
        controls.push(CreateWindow(NULL, ANIMATE_CLASS, NULL, ACS_AUTOPLAY | ACS_TIMER | WS_BORDER | WS_CHILD | WS_VISIBLE, w-256   , 0, 0, 0, hwnd, 2, hInstance));
        SendMessage(controls[controls.length-1], ACM_OPEN, 0, __dirname+"/faze/faze20001-0024.avi");
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);
wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "every common control", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);