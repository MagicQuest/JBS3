//lowkey just made this one for fun but it's really not that great because how could i infer the return type
//one idea i have is just appending it to the end of the function name
//SetWindowPosI or SetWindowPosN for int/number but idk if i like that solution

const LoadDll = function() {//function LoadDllClosure() {
    class DLL {
        constructor(path) {
            this.dll = LoadLibraryEx(path, NULL);
            this.memoized = {};
        }
    
        EasyCall(prop, ...args) {
            const types = {"boolean": VAR_BOOLEAN, "number": [VAR_FLOAT, VAR_INT], "string": VAR_CSTRING}; //cstring probably
            let argTypes = [];
            for(let i = 0; i < args.length; i++) {
                //print(name, typeof(args[i]));
                if(typeof(args[i]) == "number") {
                    argTypes[i] = types["number"][+Number.isInteger(args[i])]; //returns false if float so the first element of types["number"] is VAR_FLOAT (the cheeky + before the Number.isInteger converts the bool to a number)
                }else {
                    argTypes[i] = types[typeof(args[i])];
                }
            }
            //print(argTypes);
            return Call(this.memoized[prop], args.length, args, argTypes, RETURN_NUMBER); //bruhhh there is no easy/good way to infer the return type and whether or not the args are floats or not
        }
    }
    
    const handler = {
        get(target, prop, receiver) {
            //print(target, prop, receiver);
            let res = Reflect.get(...arguments); //this part is REQUIRED if you don't want a recursive loop when i use target.memoized like 6 lines down
            if(res != undefined) { //if you put something like dll.constructor (or dll.dll) it checks if it returned something and if so it sends that out
                //print(res, prop);
                return res;
            }

            const memo = target.memoized; //since trying to get any property of target will call this get function im gonna make sure that happens as little as possible

            if(memo[prop] == undefined) { //checking if target.memoized[prop] is undefined
                memo[prop] = GetProcAddress(target.dll, prop); //we assume prop is the name of a function in the dll
            }
            if(memo[prop]) { //if target.memoized[prop] is valid we return a function so you can call it like dll.Function(...args);
                //Call(target[prop], )
                return function(...args) {
                    return target.EasyCall(prop, ...args);
                };
            }
        },
    };

    return function(path) {return new Proxy(new DLL(path), handler)};
}();
//globalThis.LoadDll = LoadDll;
const user32 = LoadDll("user32.dll");
print(user32);
print(user32.SetWindowPos(GetConsoleWindow(), NULL, 100, 100, 500, 500, SWP_NOZORDER), "== 1?");