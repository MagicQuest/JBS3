//making a bullet hell in JBS
//also i should probably use deltatime in my calculations so maybe stay tuned for that

//const icon = LoadImage(NULL,);

let d2d, font, scoreFont, brush;

var score = 0, power = 0, pointCount = 0, lifes = 4, bombs = 3, continues = 3, powerstreak = 0, powerLevel; //lives/lifes

const cpip = [10,20,30,40,50,60,70,80,90,100,
    200,300,400,500,600,700,800,900,1000,
    2000,3000,4000,5000,6000,7000,8000,9000,10000,
    11000,12000,51200];//consecutive power item pickups https://en.touhouwiki.net/index.php?title=User:Arknarok/Touhou_Strategy_Guide/TH06/Scoring_Guide&mobileaction=toggle_view_desktop

const powerlevels = [8,16,32,48,64,80,96,128];

let window;
const width = 640; //+16; //16 because IDK OK GOOGLE IT LO!
const height = 480; //+39; //+39 because titlebar takes up 39 pixels or something

const gameWidth = 430;

function clamp(x, min, max) {
    return Math.max(min, Math.min(x, max));
}

function lerp( a, b, t ) {
    return a + t * ( b - a );
}

function contains(ent1, ent2) {
    return ent1.x-ent1.width < ent2.x-ent2.width && ent1.x+ent1.width > ent2.x+ent2.width && ent1.y-ent1.height < ent2.y-ent2.height && ent1.y+ent1.height > ent2.y+ent2.height;
}

function overlaps(ent1,ent2) {
    //yeah oops this version checked if entity 2 was COMPLETELY inside entity 1 (which is not what i meant by overlap)
    //if(ent1.x-ent1.width < ent2.x-ent2.width && ent1.x+ent1.width > ent2.x+ent2.width) {
    //    if(ent1.y-ent1.height < ent2.y-ent2.height && ent1.y+ent1.height > ent2.y+ent2.height) {
    //        return true;
    //    }
    //}
    //return false;

    //yeah nah i gotta do some research i already wrote or found something like this before in a few of my websites (talking about DOMRect.contains in https://github.com/MagicQuest/MagicQuest.github.io/blob/master/games/full%20canvas.html ) aw nevermind this just CONTAINS the object I NEED OVERLAP??
    //if(ent1.x-ent1.width < ent2.x-ent2.width && ent1.x+ent1.width > ent2.x-ent2.width) {
    //    if(ent1.y-ent1.height < ent2.y-ent2.height && ent1.y+ent1.height > ent2.y-ent2.height) {
    //        return true;
    //    }
    //}
    //return false;

    //if(ent1.x < ent2.x && ent1.x+ent1.width > ent2.x && ent1.y < ent2.y && ent1.y+ent1.height > ent2.y) {
    //    return true;
    //}
    //return false;

    //ok it seems like i've never actually tried to calculate this before (huh) so i found some stuff about it -> https://stackoverflow.com/questions/16005136/how-do-i-see-if-two-rectangles-intersect-in-javascript-or-pseudocode
    let aLeftOfB = (ent1.x+ent1.width) < (ent2.x);
    let aRightOfB = (ent1.x) > (ent2.x+ent2.width);
    let aAboveB = (ent1.y) > (ent2.y+ent2.height);
    let aBelowB = (ent1.y+ent1.height) < (ent2.y);

    return !( aLeftOfB || aRightOfB || aAboveB || aBelowB );
}

class Entity { //crazy thing JBS2 didn't have -> ES6!
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = width;
        this.height = height;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;

        if(this.y > height) {
            del.push(this);
        }
    }
}

class CircleEffect { //no extend because it doesn't need it (also now that im thinking about it inheritance doesn't really matter as much in JS as c++ or java because there are no strict types)
    constructor(x, y, startRadius, endRadius, startOpacity, endOpacity = 0, fadeSec) {
        this.x = x;
        this.y = y;
        this.startRadius = startRadius;
        this.endRadius = endRadius;
        this.color = [Math.random(), Math.random(), Math.random()];//color;
        this.startOpacity = startOpacity;
        this.endOpacity = endOpacity;
        this.fadeSec = fadeSec;
        this.creation = Date.now()/1000;
    }

    update(d2d) {
        let opacity = lerp(this.startOpacity, this.endOpacity, (Date.now()/1000-this.creation)/this.fadeSec);
        let radius = lerp(this.startRadius, this.endRadius, (Date.now()/1000-this.creation)/this.fadeSec);
        //this.opacity -= this.fadeOut;
        //this.radius += this.fadeSec*20;
        
        if(opacity <= this.endOpacity) {
            del.push(this);
            print("kill effect");
        }
        //print("HELP NIGGA",opacity);
        brush.SetColor(...this.color, opacity);
        d2d.FillEllipse(this.x, this.y, radius, radius, brush);
    }
}

class FadeOutEffect extends Entity {
    constructor(x,y,fade,startOpacity,endOpacity) {
        super(x,y,0,0); //width,height do not matter
        this.fadeSec = fade;
        this.startOpacity = startOpacity;
        this.endOpacity = endOpacity;
        this.creation = Date.now()/1000;
    }

    update() {
        let opacity = lerp(this.startOpacity, this.endOpacity, (Date.now()/1000-this.creation)/this.fadeSec);

        if(opacity <= this.endOpacity) {
            del.push(this);
            print("kill fade out effect");
        }

        return opacity;
    }
}

class TextEnt extends FadeOutEffect {
    constructor(x,y,text,time,color = [1.0,1.0,1.0]) {
        super(x,y,time,1,0);
        
        //this.scorenumber = scorenumber;
        this.text = text;
        this.color = color;
        //this.color = [1.0,1.0, (scorenumber == 100000 || scorenumber == 51200) ? 0.0 : 1.0];
    }

    update(d2d) {
        let opacity = super.update(); //now it's getting good
        brush.SetColor(...this.color,opacity);
        d2d.DrawText(this.text, scoreFont, this.x, this.y, width, height, brush);
    }
}

class ScoreEnt extends TextEnt {
    constructor(x,y,scorenumber) {
        super(x,y,scorenumber,.5,[1.0,1.0, (scorenumber == 100000 || scorenumber == 51200) ? 0.0 : 1.0]);
        //real score
        score += scorenumber;
    }
}

function addPower(newpower) {
    power += newpower; //score var is alreay 
    powerlevels.forEach((pl,i) => {
        if(power == pl) {
            entities.push(new TextEnt(plr.x+20, plr.y+20, pl == 128 ? "full power achieved!!" : "power up!!", 1));
            powerLevel = i;
            //print("yo pwoer up NIGGER YRAHH");
        }
    });
    power = clamp(power, 0, 128);
}

class Bullet extends Entity {
    constructor(x,y,vx = 0,vy = 0) {
        super(x,y,8,16);
        this.vx = vx;
        this.vy = vy;
        this.color = [Math.random(), Math.random(), Math.random()]; //genius
    }

    update(d2d) {
        this.vy += .1;
        super.update();
        brush.SetColor(...this.color);
        d2d.FillRectangle(this.x, this.y, this.x+this.width, this.y+this.height, brush);
        //ok im not gonna lie i would start rotating these bullets like touhou BUT
        //my d2d wrapper doesn't do transforms YET :sob:
        //i gotta implement it like a regular browser canvas context

        //if(contains(plr, this)) { //touhou hitbox is pretty small so im just gonna use this
        if(contains(this, {x: plr.x+(plr.width/2), y: plr.y+(2*plr.height/3), width: 2,height: 2})) {
            print("lose life or kill player");
            entities.push(new CircleEffect(this.x,this.y,10 , 50, .25, 0, .5));
            plr.x = gameWidth/2;
            plr.y = height/2;
            powerstreak = 0;
            if(lifes == 0) {
                lifes = 4;
            }else {
                lifes--;
            }
            bombs = 3; //so i only learned this after googling but when you die your bombs get reset
            addPower(-16); //uhh spawn power up items randomly after
        }
    }
}

class Item extends Entity { //powerup/scoreitem
    constructor(x, y, type, width = 16, height = 16) {
        super(x,y, width, height);
        this.type = type;
        this.vy = -2;
    }

    static colors = [
        [1.0,0.0,0.0],
        [0.0,0.0,1.0],
        [0.0,1.0,0.0],
        [1.0,0.0,1.0],
        [1.0,1.0,0.0],
    ]; //haha this is gemus https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/static

    update(d2d) {
        this.vy += this.vy < 7 ? .05 : 0; //.1; //uh wait terminal velocity
        super.update();
        //let $var;//haha $ (variable to update when touched);
        //if(this.type == 0) {
        //    $var = "power";
        //    brush.SetColor(1.0,0.0,0.0);
        //}else if(this.type == 1) {
        //    $var = "pointCount";
        //    brush.SetColor(0.0,0.0,1.0);
        //}else if(this.type == 2) {
        //    $var = "bombs";
        //    brush.SetColor(0.0,1.0,0.0);
        //}else if(this.type == 3) {
        //    $var = "lifes";
        //    brush.SetColor(1.0,0.0,1.0);
        //}else if(this.type == 4) {
        //    //$var = "power";
        //    brush.SetColor(1.0,1.0,0.0);
        //}
        //if(this.vy >= 7) {
        //    brush.SetColor(1.0,1.0,1.0);
        //}
        brush.SetColor(...Item.colors[this.type]);
        d2d.FillRoundedRectangle(this.x, this.y, this.x+this.width, this.y+this.height, 2, 2, brush);
        if(overlaps(plr, this)) { //haha this!
            //delete this; //lol i didn't really think this would do any thing
            //print("overlap?");
            //brush.SetColor(1.0,1.0,0.0);
            
            //im gonna assume that this doesn't cause some sort of concurrent modification exception type error or whatever
            //entities.splice(i, 1); //nevermind im not tryna get the index of the element so
            //print(delete this, "dlete");
            
            //print($var, globalThis, power);
            //if(this.type == 4) {
            //    power = 128;
            //}else {
            //    globalThis[$var]++; //yeah this is sketchy BUT it totally works
            //    //damn it i thought it worked because i didn't test it yet but for some reason 
            //    //ok yeah thats what i thought it didn't work because i actually didn't use var (i always use let)
            //}
            let scorenumber = 10;
            if(this.type == 0) {
                if(power == 128) {
                    //do some math ykykyk
                    powerstreak += powerstreak < cpip.length-1 ? 1 : 0;
                    scorenumber = cpip[powerstreak];
                }else {
                    addPower(1);
                }
            }else if(this.type == 1) {
                pointCount++;
                //using normal difficulty scoring (because it's all i can do for now)
                if(plr.y < 100) {
                    scorenumber = 100000;
                }else {
                    //scorenumber = 50000-(height-plr.y)*100; //kinda random lemme check
                    //scorenumber = Math.floor(lerp(50000, 10000, (plr.y-100)/height)); //goated
                    scorenumber = Math.floor(lerp(60000, 10000, (plr.y-100)/height)); //just played the game and realized
                }
            }else if(this.type == 2) {
                bombs++;
                scorenumber = 100;
            }else if(this.type == 3) {
                lifes++;
                scorenumber = 100; //idk i can't be bothered to check
            }else if(this.type == 4) {
                addPower(128-power); //maf
                //power = 128;
                //entities.push(new TextEnt(this.x+20, this.y+20, "full power achieved!!"))
                scorenumber = 1000; //i think
            }
            entities.push(new ScoreEnt(this.x, this.y, scorenumber));

            del.push(this);
        }
        //brush.SetColor(1,1,1);
        //d2d.DrawText(this.type, font, this.x-this.width,this.y-this.height, this.x+this.width,this.y+this.height, brush);
    }
}

class PlrShot extends Entity {
    constructor(x,y,vx = 0) {
        super(x,y, 20, 20);
        this.vx = vx;
        this.vy = -30;
        this.rotation = 0;
    }

    update(d2d) {
        //some how rotate LO!
        super.update();
        if(this.y < 0) {
            del.push(this);
        }

        //unfortunately i need to loop through the enemies to check if i hit one or not (which means i need a new list and it's gonna get HAIRY)

        brush.SetColor(0.396078431, 0.262745098, 0.129411765); //101,67,33
        d2d.FillRectangle(this.x, this.y, this.x+this.width, this.y+this.height, brush);
    }
}

class Player extends Entity {
    //constructor(x,y,vx,vy) { //constructor not needed because extends i think
    //    super(x,y,vx,vy);
    //    //this.speed = 10;
    //}
    //constructor(x,y,width,height) {
    //    super(x,y,width,height);
    //}
    update(d2d) {
        if(GetKey(VK_SHIFT)) { //apparently i should actually use WM_KEYDOWN however i already wrote all this LO!
            this.speed = 3;
        }else {
            this.speed = 7;
        }
        if(GetKey(VK_UP) || GetKey("w")) {
            this.y += -this.speed; //i could just add x directly but i already made all these classes so (ahh nevermind)
        }else if(GetKey(VK_DOWN) || GetKey("s")) {
            this.y += this.speed;
        }
        if(GetKey(VK_LEFT) || GetKey("a")) {
            this.x += -this.speed;
        }else if(GetKey(VK_RIGHT) || GetKey("d")) {
            this.x += this.speed;
        }
        if(GetKey("Z")) {
            //SHOOT
            entities.push(new PlrShot(this.x, this.y, 0)); //oh shoot i haven't even made this yet
        }
        this.x = clamp(this.x, 0, gameWidth-this.width);
        this.y = clamp(this.y, 0, height-this.height);
        //super.update(); //ahh thats how thaht works (updates the position shit) (ahh nevermind)
        brush.SetColor(1.0,0.0,0.0);
        d2d.FillRectangle(this.x, this.y, this.x+this.width, this.y+this.height, brush);
        //print("fill rectangle at ", this.x-this.speed, this.y);
    }
}

const plr = new Player(width/2, height/2, 20, 30);
const entities = [];
let del = [];

let lastTime = Date.now();
let startTime = Date.now()/1000;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd);
        font = d2d.CreateFont("impact", 40);
        scoreFont = d2d.CreateFont("Comic sans ms", 20);
        brush = d2d.CreateSolidColorBrush(1.0,1.0,1.0);
        SetTimer(hwnd, 1, 16); //16.66666 -> 60fps (decimals aren't allowed for SetTimer though) 1000/16.6666666
            //also if i wanted consistant fps i might have to use a loop and i might do it
    }else if(msg == WM_TIMER) {
        d2d.BeginDraw();
        d2d.Clear(0,0,0,.6); //in touhou 6 the weird trails effect was caused by the background changing or something lol
        
        //do waves kinda yk yky k
        if(Date.now()/1000-startTime < 30) { //(nevermind i actually divided LO!) miliseconds because i don't divide Date.now()/1000 and startTime/1000
            let time = Date.now()/1000-startTime; //as time goes on this variable will range from 0-30 seconds
            //print(Math.floor(time%2)==0, "wave 1");
            if(Math.floor(time%2) == 0) { //returns true every other second for an entire second
                let i = time%1; //0 -> 1
                //print(i, plr.x-width*i);
                //entities.push(new Bullet(width*(i/2), 0, 2, 0));
                //entities.push(new Bullet(width*(i/2+.5), 0, -2, 0));
                entities.push(new Bullet(gameWidth*i, 0, (plr.x-gameWidth*i)/100, plr.y/100));
                brush.SetColor(0.0,i,0.0);
            }else {
                brush.SetColor(1.0,0.0,0.0);
            }
            d2d.FillRectangle(0, 0, 20, 20, brush);
        }else if(Date.now()/1000-startTime < 60) {
            let time = Date.now()/1000-startTime-30; //must subtract 30 seconds because 30 seconds already passed
            //print(time, "wave2");
        }

        brush.SetColor(1.0,1.0,1.0);
                                //truncate the fps by 2 decimal places
        d2d.DrawText(`${Math.floor(100000/(Date.now()-lastTime))/100} fps`, font, width-200, height-100, width, height, brush); //switch to using text format/text layout idk internal d2d stuff i gotta figure it out
        plr.update(d2d);
        
        if(GetKey(VK_LSHIFT)) { //oops double getkey check (i check the shift key in plr.update) (i will probably return it from plr.update LO!)
            brush.SetColor(0.0,0.0,1.0);
            d2d.FillRectangle(plr.x+(plr.width/2), plr.y+(2*plr.height/3), plr.x+(plr.width/2)+2,plr.y+(2*plr.height/3)+2,brush); //also this is NOT in touhou 6 but apparently in the other games so im adding it >:3
        }
        //entities.forEach(ent => {
        for(let ent of entities) {
            ent.update(d2d);
        }//);
        brush.SetColor(0.670588235,0.788235294,0.894117647); //light blue 171,201,228
        d2d.FillRectangle(430, 0, width, height, brush);
        brush.SetColor(1.0,0.5,0.5);        
        d2d.FillRectangle(505, 120, 505+(power*1.1015625), 150, brush); //1.1015625 came from the math 515+141 == width (656) so i did 141/128 and got 1.1015625
        brush.SetColor(1.0,0.0,0.0);
        d2d.DrawText("Score: "+score, scoreFont, 440, 0, width, height, brush);
        d2d.DrawText("Power: "+(power >= 128 ? "MAX" : power), scoreFont, 440, 120, width, height, brush); //oops power silently goes above 128 sometimes (ok nevermind i changed how that part works)
        d2d.DrawText("Lives: ", scoreFont, 440, 160, width, height, brush); //use stars
        d2d.DrawText("Bombs: ", scoreFont, 440, 200, width, height, brush); //use stars
        d2d.DrawText("Point items: "+pointCount, scoreFont, 440, 240, width, height, brush);
        d2d.DrawText(entities.length+" Entities/Effects", scoreFont, 440, 340, width, height, brush);
        //print(1000/(Date.now()-lastTime));
        //let scorenumber;
        //if(plr.y < 100) {
        //    scorenumber = 100000;
        //}else {
        //    scorenumber = lerp(50000, 10000, (plr.y-100)/height);
        //}
        //d2d.DrawText(scorenumber, scoreFont, plr.x+100, plr.y, width, height, brush);
        d2d.EndDraw();
        //del.forEach(ent => { //usually i don't use forEach anyways but i googled today if a standard for loop was quicker and it was (https://blog.bitsrc.io/finding-the-fastest-loop-type-in-javascript-38af16fe7b4f?gi=ce4403a5508c https://stackoverflow.com/questions/43031988/javascript-efficiency-for-vs-foreach)
        for(let ent of del) { //using for of because it's literally the same as for each (BASICALLY) no index count tho
            //print(entities.findIndex(element => element.x == ent.x && element.y == ent.y));
            entities.splice(entities.findIndex(element => element.x == ent.x && element.y == ent.y && element.constructor.name == ent.constructor.name), 1); //simply ahh check because it prolly doesn't need to be that specific ykykyk also you cannot use indexOf on an array of objects (shit = [{...}, {...}]) because all objects are unique so {x: 21} != {x: 21}
        }//);
        //print(del.length);
        del = []; //haha this goofy ahh line FROZE jbs3 and i wish it just flat out told me no const assignment but for some reason it doesn't like to tell me stuff like that (maybe i should try catch the whole thing)
        lastTime = Date.now();
    }else if(msg == WM_LBUTTONDOWN) {
        entities.push(new Item(LOWORD(lp), HIWORD(lp), 0));
        entities.push(new CircleEffect(LOWORD(lp), HIWORD(lp), 10, 50, .5, 0, .5));
        entities.push(new TextEnt(LOWORD(lp), HIWORD(lp), "HELP", .1)); //well damn the consequences of deleting objects based on position (this TextEnt was created in the same place as the CircleEffect and since the TextEnt is destroyed in .1 seconds it destroys both the circle and text because it checked only position)
    }else if(msg == WM_DESTROY) {
        PostQuitMessage();
    }
}

const wc = CreateWindowClass("ZUN", windowProc);
//wc.hIcon = wc.hIconSm = icon; //assigns both to the same value just in case you didn't know (my comments are kinda sparse LO!)
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "Touhou 6", WS_SYSMENU | WS_MINIMIZEBOX | WS_VISIBLE, screenWidth/2-(width+16)/2, screenHeight/2-(height+39)/2, width+16, height+39, NULL, NULL, hInstance);