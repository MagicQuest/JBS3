print(CommandLineToArgv(GetCommandLine()));

//i honestly could use a fake object for d2d so nothing actually happens
//like hijacking an object so that when you call a fake function nothing happens
//faked2d.CreateBitmap() -> Proxy -> nothing lmao

let next; //next blueprint to fire (global so i can change it in the meta functions like branch/IF)
let loopStack = [];

function notverydeepcopy(object) { //only goes down 1 level lol
    const result = {};
    for(const key in object) {
        const obj = object[key];
        if(typeof(obj) == "object") {
            if(Array.isArray(obj)) {
                result[key] = Array.from(obj);
            }else {
                result[key] = Object.assign({}, obj); //lowkey assuming that there are no more deep things to copy past this (this would be a problem if i defined properties to have another object in it like {properties: {variableLengthInPins: 21, variable: {name: "sigma", defaultvalue: "yk"...}}})
            }
        }else {
            result[key] = obj;
        }
    }
    return result; //lol forgot this line
}

const PRIMITIVE_TOGGLE = 0;
const PRIMITIVE_INPUT = 1;
const PRIMITIVE_DROPDOWN = 2; //maybe...

//yeah PrimitiveControl is totally deprecated and im only using it for validPrimitives now
class PrimitiveControl {
    static validPrimitives = {string: [PRIMITIVE_INPUT], number: [PRIMITIVE_INPUT, "number"], bigint: [PRIMITIVE_INPUT, "bigint"], boolean: [PRIMITIVE_TOGGLE], BOOL: [PRIMITIVE_TOGGLE], float: [PRIMITIVE_INPUT, "float"]};
}

function createControlBasedOnType(type, width, height, ...args) {
    if(PrimitiveControl.validPrimitives[type]) {
        const [primitivetype, additional] = PrimitiveControl.validPrimitives[type];
        if(primitivetype == PRIMITIVE_TOGGLE) {
            return {value: args[2]};
        }else if(primitivetype == PRIMITIVE_INPUT) {
            return {value: args[3]}; //[specil]
        }else if(primitivetype == PRIMITIVE_DROPDOWN) {
            return {value: args[3]};
        }
    }else {
        return {value: args[2]};
    }
}

//only implementing it here in jbsblueprintsexec because i don't want it to error lol
class Gradient {
    static LinearGradientBrush(gradientStop, ...args) {
        return {Release: ()=>{}}; //new Gradient(gradientStop, d2d.CreateLinearGradientBrush(...args, gradientStop));
    }

    static RadialGradientBrush(gradientStop, ...args) {
        return {Release: ()=>{}}; //new Gradient(gradientStop, d2d.CreateRadialGradientBrush(...args, gradientStop));
    }

    //constructor(gradientStop, gradient) {
    //    this.gradientStop = gradientStop;
    //    this.gradient = gradient;
    //    //haha lowkey i just remembered that if i actually made an internalPtr property on this object it would be valid to pass this object directly into a d2d function!
    //    this.internalPtr = this.gradient.internalPtr; //LNMAO
    //}

    //Release() {
    //    this.gradient.Release();
    //    this.gradientStop.Release();
    //}
}

function loadBlueprintsJSON(str) {
    const bpids = {}; //using an object here instead because im just doing [id] = Blueprint
    const json = JSON.parse(str); // {variables : [], blueprints: []}
    //oh shoot i gotta get rid of old variables in the commandList
    for(let i = 0; i < BlueprintMenu.commandList.length; i++) { //get rid of variables in command list
        const commandInList = BlueprintMenu.commandList[i];
        for(const varname in Blueprint.variables) {
            if(commandInList.name == `Get ${varname}` || commandInList.name == `Set ${varname}`) {
                //const scrollBox = BlueprintMenu.singleton.scrollBox; //nevermind i've decided to recreate every element in scrollBox instead of replacing some of them because i don't want to make elements anywhere else because it would be weird yk i guess idk man
                //const elementIndex = scrollBox.elements.findIndex(({command}) => command==commandInList);
                //if(elementIndex != -1) {
                //    scrollBox.elements[elementIndex].destroy();
                //    BlueprintMenu.singleton.scrollBox.elements.splice(elementIndex, 1);
                //}
                BlueprintMenu.commandList.splice(i, 1);
                i--; //man this is goated and im kinda mad i've never thought of this before
            }
        }
    }
    for(const varname in Blueprint.variables) { //release the textlayouts before getting rid of references
        const $var = Blueprint.variables[varname];
        $var.textlayout.Release(); //lo!
    }

    Blueprint.variables = {};

    for(const varname in json.variables) { //add variables
        const $var = json.variables[varname];
        //Blueprint.variables[varname] = $var;
        //Blueprint.variables[varname].textlayout = d2d.CreateTextLayout(varname, font, w, h); //oh yeah
        $var.textlayout = d2d.CreateTextLayout(varname, font, w, h); //setting it directly on $var for Blueprint.addNewVariable to work lol

        //BlueprintMenu.commandList.push({name: `Get ${varname}`, desc: $var.desc, parameters: [], out: [`${varname} : ${$var.type}`], type: BPTYPE_BARE, parent: "variable"});
        //BlueprintMenu.commandList.push({name: `Set ${varname}`, desc: $var.desc, parameters: [`${varname} : ${$var.type}`], out: [` : ${$var.type}`], type: BPTYPE_NOTPURE, parent: "variable"});
        
        Blueprint.addNewVariable($var, varname, $var.desc, $var.type); //, false); //since im in a loop here it probably would make sense to update the scrollbox AFTER the loop so im passing false (nah so i just realized that BlueprintMenu.singleton is only valid while it's on screen and that also means that the scrollbox is created every time the BlueprintMenu is opened so basically what imtryna say here is that i probably don't have to update teh scrollbox anywayas)
    }

    //update scrollbox (just in case the BlueprintMenu is open?)
    if(BlueprintMenu.singleton) {
        BlueprintMenu.singleton.scrollBox.clear();
        BlueprintMenu.singleton.scrollBox.elements = Blueprint.newElementsFromCommandList();
    }

    Blueprint.active = undefined;
    for(let i = 0; i < panes.length; i++) { //delete previous blueprints
        const pane = panes[i];
        if(pane instanceof Blueprint) {
            pane.destroy(); //oops i modify panes in Blueprint#destroy
            i--;
        }
    }

    //create em yk
    for(const blueprint of json.blueprints) { //create blueprints, set ids, and set parameter control values
        const cli = BlueprintMenu.commandList.findIndex(({name}) => name == blueprint.title);
        let newbp;
        if(cli != -1) {
            //const newbp = Blueprint.recreate(blueprint, BlueprintMenu.commandList[cli], true);
            //const {name, desc, parameters, out, parent, constant, targettype} = BlueprintMenu.commandList[cli]; //we don't need type as we save it in the json
            const cl = notverydeepcopy(BlueprintMenu.commandList[cli]);
            for(const key in blueprint.command) {
                const obj = blueprint.command[key];
                cl[key] = obj;
            }
            const {name, desc, parameters, out, parent, constant, targettype, properties} = cl; //lololo
            newbp = Blueprint.create(/*undefined, */name, blueprint.x, blueprint.y, {name,desc,parameters,out,type: blueprint.type, parent,constant,targettype, properties}); //parameters, out, blueprint.type, desc, parent, constant, targettype);
            //print(name, parameters, out, newbp.parameters);
            for(let i = 0; i < newbp.parameters.length; i++) {
                const {control} = newbp.parameters[i];
                if(control) {
                    //print(`contorl found for ${name}'s ${i} pin`);
                    control.value = blueprint.parameters[i].control.value;
                }
            }
        }else {
            print(`${cli} (${blueprint.title}) not found in BlueprintMenu.commandList! (it's probably the event start node)`);
            if(blueprint.id == 0 || blueprint.title == "Event Start") {
                //newbp = new Blueprint(/*undefined, */"Event Start", [162/255, 38/255, 30/255], blueprint.x, blueprint.y, 190, 72, [], [], BPTYPE_EVENT);
                newbp = new Blueprint(/*hwnd, */"Event Start", [162/255, 38/255, 30/255], 0, 0, 190, 72, {name: "Event Start", parameters: [], out: [], type: BPTYPE_EVENT});
                panes.splice(0, 0, newbp);
            }else {
                newbp = Blueprint.create(blueprint.title, blueprint.x, blueprint.y, blueprint.command);
            }
        }
        bpids[blueprint.id] = newbp;
    }

    for(const blueprint of json.blueprints) { //fix connections
        const newbp = bpids[blueprint.id];
        for(let i = 0; i < blueprint.connections.in.length; i++) {
            const maybe = blueprint.connections.in[i];
            if(maybe) {
                //if(newbp.parameters[i].type == "exec") {
                    for(const key in maybe) {
                        const pin = maybe[key];
                        pin.source = bpids[pin.source];
                    }
                //}else {
                //    maybepin.source = bpids[maybepin.source];
                //}
            }else {
                blueprint.connections.in[i] = {}; //just in case?
            }                                                      
        }
        newbp.connections.in = blueprint.connections.in;

        for(let i = 0; i < blueprint.connections.out.length; i++) {
            const maybe = blueprint.connections.out[i];
            if(maybe) {
                for(const key in maybe) {
                    const pin = maybe[key];
                    pin.source = bpids[pin.source];
                }
            }
        }
        newbp.connections.out = blueprint.connections.out;
        
    }

    dirty = true;
}

loadBlueprintsJSON(CommandLineToArgv(GetCommandLine())[1]);