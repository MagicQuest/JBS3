const functions = {};
const consts = {};

for(const key in globalThis) {
    if(typeof(globalThis[key])=="function") {
        functions[key] = false;
    }else {
        consts[key] = false;
    }
}

delete functions["registerFunc"];
delete functions["registerGlobalObject"];

function registerFunc(name, signature, desc) {
    if(functions[name] != undefined) {
        functions[name] = true;
    }
    if(consts[name] != undefined) {
        delete consts[name];
    }
}
function registerGlobalObject(name, signature, desc) {
    if(consts[name] != undefined) {
        printNoHighlight("oops", name);
        consts[name] = true;
    }
}
function registerGlobalObjectSignature(name, signature, desc) {
    if(consts[name] != undefined) {
        printNoHighlight("oops", name);
        consts[name] = true;
    }
}

const extension = system("curl -i https://raw.githubusercontent.com/MagicQuest/JBS3Extension/refs/heads/main/src/extension.ts").split("\n"); //well i would use fetch but right now it only works with HTTP bruh
let i = 0;
for(let line of extension) {
    if(line.includes("register") || i > 1894) {
        try {
            if(i > 1894) {
                line = line.replaceAll(",", "");
            }
            r = eval(line);
            if(consts[r] != undefined) {
                consts[r] = true;
            }
        }catch(e) {
            //print(e.toString(), line);
        }
    }
    i++;
}

for(const key in functions) {
    if(!functions[key]) {
        print(key, "not registered in extension.ts! (function)");
    }
}

for(const key in consts) {
    if(!consts[key]) {
        print(key, "not registered in extension.ts! (const)");
    }
}