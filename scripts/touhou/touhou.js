//making a bullet hell in JBS
//also i should probably use deltatime in my calculations so maybe stay tuned for that

//const icon = LoadImage(NULL,);

let wic;
let d2d, font, scoreFont, brush, starPng;

var score = 0, power = 0, pointCount = 0, lifes = 4, bombs = 3, continues = 3, powerstreak = 0, powerLevel = 0; //lives/lifes

const cpip = [10,20,30,40,50,60,70,80,90,100,
    200,300,400,500,600,700,800,900,1000,
    2000,3000,4000,5000,6000,7000,8000,9000,10000,
    11000,12000,51200];//consecutive power item pickups https://en.touhouwiki.net/index.php?title=User:Arknarok/Touhou_Strategy_Guide/TH06/Scoring_Guide&mobileaction=toggle_view_desktop

const powerlevels = [0,8,16,32,48,64,80,96,128];

let window;
const width = 640; //+16; //16 because IDK OK GOOGLE IT LO!
const height = 480; //+39; //+39 because titlebar takes up 39 pixels or something

const gameWidth = 430;

let lastTime = Date.now();
let startTime = Date.now()/1000;

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

function random(min, max) {
    return Math.floor(Math.random() * (max-min+1)+min); //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
}

function getMagnitude(x,y) {
    return Math.sqrt(x**2 + y**2);
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
            //del.push(this); //i need some kind of queue or something so i don't double push the same elemnet
            return true;
        }
    }
}

class CircleEffect { //no extend because it doesn't need it (also now that im thinking about it inheritance doesn't really matter as much in JS as c++ or java because there are no strict types (ok yeah but can't you inherit like methods and stuff that's convenient))
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
            //print("kill effect");
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
            //print("kill fade out effect"); //haha when there is a 1000 bullets on screen and you reach max power this print actually single handedly freezes the game for a second
        }

        return opacity;
    }
}

class TextEnt extends FadeOutEffect {
    constructor(x,y,text,time,color = [1.0,1.0,1.0]) {
        super(x,y,time,1,0);
        this.vy = -1;        
        //this.scorenumber = scorenumber;
        this.text = text;
        this.color = color;
        //this.color = [1.0,1.0, (scorenumber == 100000 || scorenumber == 51200) ? 0.0 : 1.0];
    }

    update(d2d) {
        this.y+=this.vy;
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
        //bruh brayden messing this shi- up
        //setTimeout(()=>{print("NIGGER t")}, 1000);
    }

    update(d2d) {
        super.update(d2d);
    }
}

class TitleTextEnt extends TextEnt {
    constructor(x,y,text,color = [1.0,1.0,1.0]) {
        super(gameWidth,y,text,1,color);
        this.endX = x;
        this.fadeSec *= 2;
        this.vy = 0;
    }

    update(d2d) {
        //print(this.creation);
        if((Date.now()/1000-this.creation) < .5) {
            this.x = lerp(gameWidth, this.endX, (Date.now()/1000-this.creation)*2);
        }
        super.update(d2d);
    }
}

function addPower(newpower) {
    power += newpower; //score var is alreay 
    powerlevels.forEach((pl,i) => {
        if(power == pl) {
            if(pl == 128) {
                entities.push(new TitleTextEnt(0, height/2, "FULL POWER MODE! !", [.8,.8,1.0]));
                plr.reachedFullPower = true;
                setTimeout(() => {
                    plr.reachedFullPower = false;
                }, 100);
            }else {
                entities.push(new TextEnt(plr.x+20, plr.y+20, "PowerUp", 1, [.8,.8,1.0]));
            }
            powerLevel = i;
            //print("yo pwoer up NIGGER YRAHH");
        }
    });
    power = clamp(power, 0, 128);
}

function useBomb() {
    if(bombs) {
        bombs--;
        entities.push(new CircleEffect(plr.x, plr.y, 10, 200, .5, 0, 2));
    }
    try {
        let d = Date.now()/1000;
        setTimeout(() => {
            print("HELP",Date.now()/1000-d);
        }, 1000);
    }catch(e) {
        print(e);
    }
}

function killPlayer(x, y) {
    //print("lose life or kill player");
    entities.push(new CircleEffect(x,y,10 , 50, .25, 0, .5));
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

class Bullet extends Entity {
    constructor(x,y,width,height,vx = 0,vy = 0) {
        super(x,y,width,height);
        this.vx = vx;
        this.vy = vy;
        //this.color = color;
        //this.color = [Math.random(), Math.random(), Math.random()]; //genius
    }

    update() {
        //this.vy += .1;
        //let alreadyDestroying = super.update();
        let destroy = super.update() || (this.x < -this.width || this.x > gameWidth || this.y < -this.height);
        //if(this.x < -this.width || this.x > gameWidth || this.y < -this.height) {
            //del.push(this);
            //destroy = true;
        //}
        //brush.SetColor(...this.color);
        //d2d.FillRectangle(this.x, this.y, this.x+this.width, this.y+this.height, brush);
        //ok im not gonna lie i would start rotating these bullets like touhou BUT
        //my d2d wrapper doesn't do transforms YET :sob:
        //i gotta implement it like a regular browser canvas context

        //if(contains(plr, this)) { //touhou hitbox is pretty small so im just gonna use this
        if(plr.reachedFullPower) {
            //del.push(this);
            destroy = true;
            entities.push(new Item(this.x, this.y, 6));
        }else if(contains(this, {x: plr.x+(plr.width/2), y: plr.y+(2*plr.height/3), width: 2,height: 2})) {
            killPlayer(this.x,this.y);
        }

        if(destroy/* && !alreadyDestroying*/) del.push(this); //i don't return true here because the bullet's child classes probably don't need to handle this themselves
    }
}

class DiamondBullet extends Bullet {
    constructor(x,y,vx,vy) {
        super(x,y,8,16,vx,vy);
        this.color = [Math.random(), Math.random(), Math.random()];
    }

    update(d2d) {
        this.vy += .1;
        super.update();
        brush.SetColor(...this.color);
        d2d.FillRectangle(this.x, this.y, this.x+this.width, this.y+this.height, brush);
        //ok im not gonna lie i would start rotating these bullets like touhou BUT
        //my d2d wrapper doesn't do transforms YET :sob:
        //i gotta implement it like a regular browser canvas context
    }
}

class FairyBullet extends Bullet {
    constructor(x,y,vx,vy) {
        super(x,y,8,8,vx,vy);
    }

    update(d2d) {
        super.update();
        brush.SetColor(1.0,.5,.5);
        d2d.FillEllipse(this.x+this.width,this.y+this.height,this.width,this.height,brush);
        brush.SetColor(1.0,0.0,0.0);
        d2d.DrawEllipse(this.x+this.width,this.y+this.height,this.width,this.height,brush,3);
    }
}

class Item extends Entity { //powerup/scoreitem
    constructor(x, y, type) {//, width = 16, height = 16) {
        let size = type == 5 ? 24 : 16; //type 5 is big power up
        super(x,y, size, size);
        this.type = type;
        this.vy = -2;
    }

    static colors = [
        [1.0,0.0,0.0],
        [0.0,0.0,1.0],
        [0.0,1.0,0.0],
        [1.0,0.0,1.0],
        [1.0,1.0,0.0],
        [1.0,0.0,0.0],
        [0.0,0.8,0.0],
    ]; //haha this is gemus https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/static

    update(d2d) {
        this.vy += this.vy < 7 ? .05 : 0; //.1; //uh wait terminal velocity
        let destroy = super.update();
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
        if((power == 128 && plr.y < 100) || this.type == 6) {
            let magnitude = getMagnitude(plr.x-this.x, plr.y-this.y)/10; //FINALLY, LINEAR ATTRACTION
            this.x += (plr.x-this.x)/magnitude; //clamp((plr.x-this.x)/8,-10,10); //huh thats kinda what im going for i guess (it is pretty linear!)
            this.y += (plr.y-this.y)/magnitude; //clamp((plr.y-this.y)/8,-10,10);
            this.vy = 0;
            this.vx = 0;
        }
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
            if(this.type == 0 || this.type == 5) {
                if(power == 128) {
                    //do some math ykykyk
                    powerstreak += powerstreak < cpip.length-1 ? 1 : 0;
                    scorenumber = cpip[powerstreak];
                }else {
                    addPower(this.type == 5 ? 8 : 1);
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
            }else if(this.type == 6) {
                scorenumber;//uhh idk it's dependent on shit
            }
            entities.push(new ScoreEnt(this.x, this.y, scorenumber));

            del.push(this);
        }else if(destroy) {
            del.push(this);
        }
        //brush.SetColor(1,1,1);
        //d2d.DrawText(this.type, font, this.x-this.width,this.y-this.height, this.x+this.width,this.y+this.height, brush);
    }
}

class Enemy extends Entity {
    constructor(x,y,width,height,health) {
        super(x,y,width,height);
        this.health = health;
        this.creation = Date.now()/1000;
        //this.leaving = false;
    }

    update() {
        if(super.update() || (this.x < -this.width || this.x > gameWidth || this.y < -this.height)) {
            return true;
        }else if(this.health <= 0) {
            this.die();
            return true;
        }
        //if(super.update()) {
        //    return true;
        //}else if(this.x < -this.width || this.x > gameWidth || this.y < -this.height) {
        //    del.push(this);
        //    return true;
        //}else if(this.health == 0) {
        //    del.push(this);
        //    return true;
        //}
    }

    die() {
        if(Math.random() > .5) {
            print(Math.random() > .5);
            entities.push(new Item(this.x, this.y, +(Math.random() > .5)));
        }
    }
}

class Fairy extends Enemy {
    constructor(x,y,width,height,fireRate,health = 5,timeAlive) {
        super(x,y,width,height,health);
        //this.vy = 1;
        this.timer = setInterval(this.shoot.bind(this), fireRate); //haha i wanted to see if i had to bind this and when i didn't it printed EVERY global
        //this.timeAlive = timeAlive;
        setTimeout(() => {
            this.vy = -2;
            print("UP");
        },timeAlive*1000); print(timeAlive);
    }

    //shoot() {
    //    entities.push(new FairyBullet(this.x, this.y, clamp((plr.x-this.x)/100, -10, 10), clamp((plr.y-this.y)/100, -10, 10)));
    //}

    //die() {
    //    entities.push(new Item(this.x, this.y, 5));
    //    entities.push(new Item(this.x+random(-50,50), this.y+random(-50,50), 1));
    //    entities.push(new Item(this.x+random(-50,50), this.y+random(-50,50), 1));
    //    entities.push(new Item(this.x+random(-50,50), this.y+random(-50,50), 1));
    //    entities.push(new Item(this.x+random(-50,50), this.y+random(-50,50), 1));
    //    entities.push(new Item(this.x+random(-50,50), this.y+random(-50,50), 1));
    //}

    update(d2d) {
        //if(Date.now()/1000-this.creation > this.timeAlive) {
        //    this.vy = -2;
        //}
        if(super.update()) {
            del.push(this);
            clearInterval(this.timer);
        }
        brush.SetColor(1.0,0.0,1.0);
        //sekaI
        d2d.FillRectangle(this.x, this.y, this.x+this.width, this.y+this.height, brush);
    }
}

class HardFairy extends Fairy {
    constructor(x,y) {
        super(x,y,20,30,100,20,20);
    }
    
    shoot() {
        entities.push(new FairyBullet(this.x, this.y, clamp((plr.x-this.x)/100, -10, 10), clamp((plr.y-this.y)/100, -10, 10)));
    }

    die() {
        entities.push(new Item(this.x, this.y, 5));
        entities.push(new Item(this.x+random(-50,50), this.y+random(-50,50), 1));
        entities.push(new Item(this.x+random(-50,50), this.y+random(-50,50), 1));
        entities.push(new Item(this.x+random(-50,50), this.y+random(-50,50), 1));
        entities.push(new Item(this.x+random(-50,50), this.y+random(-50,50), 1));
        entities.push(new Item(this.x+random(-50,50), this.y+random(-50,50), 1));
    }
}

class NormalFairy extends Fairy {
    constructor(x,y) {
        super(x,y,20,30,2000,5,2);
        this.vy = 2;
        //this.cutoff = random(50,100);
        setTimeout(() => {
            this.vy = 0;
        }, 1000);
    }
    //function *fib(x) {
    //    for(let i = 0; i < x; i++) {
    //        yield i;
    //    }
    //}
    //[...fib(10)] //cool
    shoot() {
        for(let i = 0; i < 8; i++) {
            let radians = (i/4)*Math.PI; //honestly im sorta suprised i thought of this solution because it's actually really good
            entities.push(new FairyBullet(this.x, this.y, Math.sin(radians)*2, Math.cos(radians)*2));
        }
    }

    update(d2d) {
        //if(this.y > this.cutoff) {
        //    this.vy = 0;
        //}
        super.update(d2d);
    }

    //no die override because a default is already in the Enemy class
}

class PlrShot extends Entity {
    constructor(x,y,vx = 0) {
        super(x,y, 20, 20);
        this.vx = vx;
        this.vy = -30;
        this.rotation = 0;
    }

    update(d2d) {
        //somehow rotate LO!
        let destroy = super.update() || this.y < 0;

        //unfortunately i need to loop through the enemies to check if i hit one or not (which means i need a new list and it's gonna get HAIRY)
        for(let fairy of fairies) { //oof
            if(overlaps(this, fairy)) {
                fairy.health--;
                destroy = true;
                entities.push(new CircleEffect(fairy.x, fairy.y, 10, 40, .5, 0, .5));
            }
        }

        brush.SetColor(0.396078431, 0.262745098, 0.129411765, .8); //101,67,33
        d2d.FillRectangle(this.x, this.y, this.x+this.width, this.y+this.height, brush);
        
        if(destroy) {
            del.push(this);
        }
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
    reachedFullPower = false;

    update(d2d) {
        if(GetKey(VK_SHIFT)) { //apparently i should actually use WM_KEYDOWN however i already wrote all this LO! (oh yeah another thing about getkey is that it works even if you aren't focused on the window)
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
            //entities.push(new PlrShot(this.x, this.y, 0)); //oh shoot i haven't even made this yet
            //entities.push(new PlrShot(this.x, this.y, 10)); //oh shoot i haven't even made this yet
            //entities.push(new PlrShot(this.x, this.y, -10)); //oh shoot i haven't even made this yet
            if(powerLevel == 0 || powerLevel == 1) { //powerLevel == 1 because it adds your perk kimda thing like the spikes
                entities.push(new PlrShot(this.x, this.y, 0));
            }else if(powerLevel == 2) {
                entities.push(new PlrShot(this.x-10, this.y, 0));
                entities.push(new PlrShot(this.x+10, this.y, 0));
            }
            //print(powerLevel);
        }
        if(GetKeyDown("X")) {
            useBomb();
        }
        this.x = clamp(this.x, 0, gameWidth-this.width);
        this.y = clamp(this.y, 0, height-this.height);
        //super.update(); //ahh thats how thaht works (updates the position shit) (ahh nevermind)
        brush.SetColor(1.0,0.0,0.0);
        d2d.FillRectangle(this.x, this.y, this.x+this.width, this.y+this.height, brush);
        //print("fill rectangle at ", this.x-this.speed, this.y);
    }
}

class Stage {
    constructor(interval) {
        this.timer = setInterval(this.tick.bind(this),interval)
    }

    destroy() {
        clearInterval(this.timer);
    }
}

class Stage0 extends Stage {
    constructor() {
        super(500);
    }

    tick() {
        let time = (Date.now()/1000-startTime)/15;
        fairies.push(new NormalFairy(time*gameWidth, 0)); //oops i did entities.push and i wasn't allowed to shoot  them
    }
}

class StageSequencer {
    constructor() {
        this.level = 0;
        this.currentStage = new Stage0(startTime);
    }

    static stages = [Stage0]; //uhhh instead of doing this i COULD use globalThis but which would be weirder/easier

    update() {
        const lastLevel = this.level;
        this.level = Math.floor((Date.now()/1000-startTime)/15);
        if(this.level != lastLevel) {
            this.currentStage.destroy(); //bruh i was still in that c++ mindset and thought i would cause a memory leak if i didn't "delete" this object (which in JS will get picked up by the GC) (OH WAIT I HAVE TO CLEAR THE TIMER)
            this.currentStage = new (StageSequencer.stages[this.level])(); //haha this is kinda weird ALSO in python this dude had a line that looked like -> random.choice((str.lower, str.upper))(password) and it was kinda genius like
            entities.push(new TitleTextEnt(0, height/2, "Stage "+this.level, [1.0,1.0,0.0]));
        }
    }
}

const plr = new Player(width/2, height/2, 20, 30);
const stage = new StageSequencer();
const entities = [];
const fairies = []; //uhh im just gonna call the enemies array fairies because thats what 90% of all enemies in touhou 6 are
let del = [];

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        wic = InitializeWIC();
        d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd, wic);
        font = d2d.CreateFont("impact", 40);
        scoreFont = d2d.CreateFont("Comic sans ms", 20);
        brush = d2d.CreateSolidColorBrush(1.0,1.0,1.0);
        starPng = d2d.CreateBitmapFromFilename(__dirname+"/star.png"); //"/boxside.png");
        PlaySound(__dirname+"/TOUHOU21.wav", hInstance, SND_FILENAME | SND_ASYNC | SND_LOOP);
        SetTimer(hwnd, 1, 16); //16.66666 -> 60fps (decimals aren't allowed for SetTimer though) 1000/16.6666666
        let iid = 0;
        let interval = 0;
        print(iid = setInterval(() => {
            print("SET INTERVAL WOAH");
            interval++;
            if(interval == 100) {
                clearInterval(iid);
            }
        }, 100));
            //also if i wanted consistant fps i might have to use a loop and i might do it
    }else if(msg == WM_TIMER) {
        d2d.BeginDraw();
        d2d.Clear(0,0,0,.6); //in touhou 6 the weird trails effect was caused by the background changing or something lol
        //do waves kinda yk yky k
        if(GetKeyDown("J")) {
            startTime += 5;
        }else if(GetKeyDown("K")) {
            startTime -= 5;
        }
        
        //if(Date.now()/1000-startTime < 15) { //(nevermind i actually divided LO!) miliseconds because i don't divide Date.now()/1000 and startTime/1000
        //    let time = Date.now()/1000-startTime; //as time goes on this variable will range from 0-15 seconds
        //    //print(Math.floor(time%2)==0, "wave 1");
        //    if(Math.floor(time%2) == 0) { //returns true every other second for an entire second
        //        let i = time%1; //0 -> 1
        //        //print(i, plr.x-width*i);
        //        //entities.push(new Bullet(width*(i/2), 0, 2, 0));
        //        //entities.push(new Bullet(width*(i/2+.5), 0, -2, 0));
        //        entities.push(new DiamondBullet(gameWidth*i, 0, (plr.x-gameWidth*i)/100, plr.y/100));
        //        brush.SetColor(0.0,i,0.0);
        //    }else {
        //        brush.SetColor(1.0,0.0,0.0);
        //    }
        //    d2d.FillRectangle(0, 0, 20, 20, brush);
        //}else if(Date.now()/1000-startTime < 30) {
        //    let time = Date.now()/1000-startTime-15; //must subtract 15 seconds because 15 seconds already passed
        //    //print(time, "wave2");
        //    if(Math.floor(time%4) != 0) {
        //        entities.push(new DiamondBullet(gameWidth*Math.random(), 0, 0, 0));
        //        brush.SetColor(0.0,1.0,0.0);
        //    }else {
        //        brush.SetColor(1.0,0.0,0.0);
        //    }
        //    d2d.FillRectangle(0, 0, 20, 20, brush);
        //}

        stage.update();

        SetWindowText(hwnd, `Touhou 6 - ${Date.now()/1000-startTime}`)

        plr.update(d2d);
        
        if(GetKey(VK_LSHIFT)) { //oops double getkey check (i check the shift key in plr.update) (i will probably return it from plr.update LO!)
            brush.SetColor(0.0,0.0,1.0);
            d2d.FillRectangle(plr.x+(plr.width/2), plr.y+(2*plr.height/3), plr.x+(plr.width/2)+2,plr.y+(2*plr.height/3)+2,brush); //also this is NOT in touhou 6 but apparently in the other games so im adding it >:3
        }
        //entities.forEach(ent => {
        for(let ent of entities) {
            ent.update(d2d);
        }//);
        for(let fairy of fairies) {
            fairy.update(d2d);
        }
        brush.SetColor(0.670588235,0.788235294,0.894117647); //light blue 171,201,228
        d2d.FillRectangle(430, 0, width, height, brush);
        brush.SetColor(1.0,0.5,0.5);        
        d2d.FillRectangle(505, 200, 505+(power*1.0546875), 230, brush); //1.0546875 came from the math 505+135 == width (640) so i did 135/128 and got 1.0546875
        brush.SetColor(1.0,0.0,0.0);
        d2d.DrawText("Score: "+score, scoreFont, 440, 0, width, height, brush);
        d2d.DrawText("Power: "+(power >= 128 ? "MAX" : power), scoreFont, 440, 200, width, height, brush); //oops power silently goes above 128 sometimes (ok nevermind i changed how that part works)
        d2d.DrawText("Lives: ", scoreFont, 440, 120, width, height, brush); //use stars
        for(let i = 0; i < lifes; i++) {
            let x = 500+(i*16);
            d2d.DrawBitmap(starPng, x, 130, x+14, 144);
        }
        d2d.DrawText("Bombs: ", scoreFont, 440, 160, width, height, brush); //use stars
        for(let i = 0; i < bombs; i++) {
            let x = 510+(i*16);
            d2d.DrawBitmap(starPng, x, 170, x+14, 184);
        }
        d2d.DrawText("Point items: "+pointCount, scoreFont, 440, 240, width, height, brush);
        d2d.DrawText((entities.length+fairies.length)+" Entities/Effects", scoreFont, 440, 340, width, height, brush);
        d2d.DrawText((del.length)+" Delete Queue", scoreFont, 440, 380, width, height, brush);
        brush.SetColor(1.0,1.0,1.0);
                                //truncate the fps by 2 decimal places
        d2d.DrawText(`${Math.floor(100000/(Date.now()-lastTime))/100} fps`, font, width-200, height-50, width, height, brush); //switch to using text format/text layout idk internal d2d stuff i gotta figure it out
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
        //ACTUALLY i have no idea what to believe because i used https://web.archive.org/web/20180621043849/https://jsperf.com/fast-array-foreach and somehow forEach was faster? idk
        for(let ent of del) { //using for of because it's literally the same as for each (BASICALLY) no index count tho
            //print(entities.findIndex(element => element.x == ent.x && element.y == ent.y));
            //let i = entities.findIndex(element => element.x == ent.x && element.y == ent.y && element.constructor.name == ent.constructor.name); //simply ahh check because it prolly doesn't need to be that specific ykykyk also you cannot use indexOf on an array of objects (shit = [{...}, {...}]) because all objects are unique so {x: 21} != {x: 21} (my reasoning is a bit off here...)
            let i = entities.indexOf(ent); //i think what made me think that indexOf wouldn't work with objects is the fact that while it's true identical objects aren't equal to each other, objects are passed by reference and so instead of the objects being identical, the objects are actually each other and js can tell that both of these variables reference the same underlying object
            if(i != -1) {
                entities.splice(i, 1);
            }else {
                if(!(ent instanceof Enemy)) {//INSTANCEOF IS CRAZY!?
                    throw ent; //this line is actually bonkers
                }
                //let findex = fairies.findIndex(element => element.x == ent.x && element.y == ent.y && element.constructor.name == ent.constructor.name);
                ////delete fairies[findex];
                //if(findex == -1) {
                //    print(ent, ent.constructor.name);
                //}
                //print(findex,"findedx");
                fairies.splice(fairies.findIndex(element => element.x == ent.x && element.y == ent.y && element.constructor.name == ent.constructor.name), 1);
            }
        }//);
        //print(del.length);
        del = []; //haha this goofy ahh line FROZE jbs3 and i wish it just flat out told me no const assignment but for some reason it doesn't like to tell me stuff like that (maybe i should try catch the whole thing (ok i tried to try catch the whole thing but nothing happened (probably because of the window loop) so im only `try`ing the windowProc func))
        lastTime = Date.now();
    }else if(msg == WM_LBUTTONDOWN) {
        let mouse = MAKEPOINTS(lp);
        entities.push(new Item(mouse.x, mouse.y, 5));
        entities.push(new CircleEffect(mouse.x, mouse.y, 10, 50, .5, 0, .5));
        entities.push(new TextEnt(mouse.x, mouse.y, "HELP", .1)); //well damn the consequences of deleting objects based on position (this TextEnt was created in the same place as the CircleEffect and since the TextEnt is destroyed in .1 seconds it destroys both the circle and text because it checked only position)
        entities.push(new TitleTextEnt(mouse.x, mouse.y, "TITLE! !", [.8,.8,1.0]));
    }else if(msg == WM_RBUTTONDOWN) {
        let mouse =  MAKEPOINTS(lp);
        fairies.push(new NormalFairy(mouse.x, mouse.y));//, 20, 30));
        //fairies.push(new Fairy(mouse.x+10, mouse.y, 10, 10));
        //fairies.push(new Fairy(mouse.x+20, mouse.y, 10, 10));
        //fairies.push(new Fairy(mouse.x-10, mouse.y, 10, 10));
        //entities.push(new FairyBullet(mouse.x, mouse.y, Math.random(),Math.random()));
    }else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
        font.Release();
        scoreFont.Release();
        brush.Release();
        starPng.Release();
        d2d.Release();
        wic.Release();
    }
}

const wc = CreateWindowClass("ZUN", windowProc);
//wc.hIcon = wc.hIconSm = icon; //assigns both to the same value just in case you didn't know (my comments are kinda sparse LO!)
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "Touhou 6", WS_SYSMENU | WS_MINIMIZEBOX | WS_VISIBLE, screenWidth/2-(width+16)/2, screenHeight/2-(height+39)/2, width+16, height+39, NULL, NULL, hInstance);