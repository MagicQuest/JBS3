eval(require("fs").read(__dirname+"/marshallib.js")); //damn this marshalling go HARD

class Rect extends memoobjectidk {
                //oh shoot these types have to be in the right order
    static types = {left: "LONG", top: "LONG", right: "LONG", bottom: "LONG"}; //strings because i want to know if they are unsigned (when the first letter is U (i can't be bothered to make each key in sizeof an object))
    constructor(data) { //data must be a Uint8Array
        super()
        objFromTypes(this, data);
    }
}

const user32 = DllLoad("user32.dll");
print(user32);
const hwnd = GetConsoleWindow();

const rectdata = new Uint8Array(Rect.sizeof());

print(user32("GetWindowRect", 2, [hwnd, PointerFromArrayBuffer(rectdata)], [VAR_INT, VAR_INT], RETURN_NUMBER));

print(new Rect(rectdata));

print(user32("__FREE"), "FREE?");