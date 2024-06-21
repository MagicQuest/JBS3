eval(require("fs").read(`${__dirname}/p2.js`));

//print(globalThis);

let width = height = 512;

let world = new p2.World();
world.defaultContactMaterial.restitution = 1.25;

let context;
let i = 0;
let player, floor;
let start;
let time = lastTime = Date.now();

function createBox(position, size, color, anchored) {
    let shape = new p2.Box({
        width: size[0]*.025,
        height: size[1]*.025,
    });
    let body = new p2.Body({
        mass: +!anchored,
        position: position,
    });
    body.addShape(shape);
    //body.type = anchored ? p2.Body.STATIC : body.type;
    world.addBody(body);
    body.color = color;
    return body;
}

function drawBox(body, shape) {
    context.beginPath();
    let x = body.interpolatedPosition[0], y = body.interpolatedPosition[1];
    //console.log(x, y);
    context.save();
    context.translate(x, y);        // Translate to the center of the box
    context.rotate(body.angle);  // Rotate to the box body frame
    //if(body.color == "phiggle") {
    //    context.drawImage(phiggle,-shape.width/2, -shape.height/2, shape.width, shape.height);
    //}else {
        context.fillStyle = body.color;
        context.fillRect(-shape.width/2, -shape.height/2, shape.width, shape.height);
    //}
    //context.fill();
    context.stroke();
    context.restore();
}

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        context = createCanvas("2d", NULL, hwnd);
        context.fillStyle = "#ff0000";
        print(context);

        player = createBox([0,5], [50,50], "#ff00ff");
        floor = createBox([-7,-10], [6/.025, 2/.025], "#ff0000", true);

        SetTimer(hwnd, 0, 16);

        start = Date.now();
    }else if(msg == WM_TIMER) {
        context.BeginDraw(); //idk how tf there is no BeginDraw for canvas (OR WEBGL) in html

        context.fillStyle = "#000000";
        context.fillRect(0, 0, width, height);

        time = (Date.now() - start)/1000;
        
        context.fillStyle = "#ff0000";

        context.save();

        context.fillStyle = "#00ff00";
        
        //context.scale(2, 2);
        context.translate(width/2+i, height/2);
        context.rotate(i/(Math.PI*2));

        context.fillRect(25/-2, 25/-2, 25, 25);

        context.translate(50, 0);
        context.fillRect(25/-2, 25/-2, 25, 25);

        context.restore();

        context.fillRect(0, 0, 10, 10);

        //let dt = lastTime ? (time - lastTime) / 1000 : 0;
        //dt = Math.min(1 / 10, dt);
        //lastTime = time;
        //world.step(1/60, dt, 5);
//
        //context.save();
        ////context.resetTransform();
        //context.translate(width/2, height/2);
        ////print(context);
        //context.scale(40, -40);
//
        //drawBox(player, player.shapes[0]);
        //drawBox(floor, floor.shapes[0]);
        ////context.fillStyle = "#ff00ff";
        ////context.fillRect(-5, -5, 10, 10);
//
        //context.restore();

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

window = CreateWindow(WS_EX_NOREDIRECTIONBITMAP, wc, "using p2.js", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, width+20, height+42, NULL, NULL, hInstance);