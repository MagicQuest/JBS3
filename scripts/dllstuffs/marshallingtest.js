eval(require("fs").read(__dirname+"/marshallib.js")); //damn this marshalling go HARD

class Rect extends memoobjectidk {
                //oh shoot these types have to be in the right order
    static types = {left: "LONG", top: "LONG", right: "LONG", bottom: "LONG"}; //strings because i want to know if they are unsigned (when the first letter is U (i can't be bothered to make each key in sizeof an object))
    constructor(data) { //data must be a Uint8Array
        super()
        objFromTypes(this, data);
    }
}

class HDLAYOUT extends memoobjectidk {
    static types = {prc: "LONG_PTR", pwpos: "LONG_PTR"};
    constructor(data) {
        super();
        objFromTypes(this, data);
        this.data = data; //apparently not a copy (i think)
    }
}

const user32 = DllLoad("user32.dll");
print(user32);
const hwnd = GetConsoleWindow();

const rectdata = new Uint8Array(Rect.sizeof());

print(user32("GetWindowRect", 2, [hwnd, PointerFromArrayBuffer(rectdata)], [VAR_INT, VAR_INT], RETURN_NUMBER));

const r = new Rect(rectdata);

print(r, rectdata);
r.left = 1;
print(r, rectdata);

const ld = new Uint8Array(HDLAYOUT.sizeof());
const layout = new HDLAYOUT(ld);
print(PointerFromArrayBuffer(ld), PointerFromArrayBuffer(layout.data));

print(user32("__FREE"), "FREE?");

const cstr = new CString("what the sigma!"); //you don't gotta free this memory hurray!
print(cstr.ptr, StringFromPointer(cstr.ptr));
const wstr = new WString("skibidi toilet will be mine yuh");
print(wstr.ptr, WStringFromPointer(wstr.ptr));
//DeleteArrayPtr(cstr.ptr); //do NOT call delete on this ptr lmao

//const ptr = NewCharStrPtr("what the sigma!"); //you gotta free this memory when you done
//print(ptr, StringFromPointer(ptr));
//DeleteArrayPtr(ptr);