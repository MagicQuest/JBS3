//well since i want to use this js file with other files i gotta eval it but since you can't declare new variables with eval im using globalThis
globalThis.sizeof = {
    CHAR : 1,
    UCHAR : 1, //BYTE is UCHAR
    UINT : 4,
    INT : 4,
    DWORD : 4,
    COLORREF : 4, //same as DWORD
    LONG : 4,
    ULONG : 4,
    UINT_PTR: 8,
    ULONG_PTR : 8,
    LONG_PTR : 8,
    HANDLE : 8,
    HWND : 8,
};

function defineProps(obj, data, key, i, datatype, bytes) {
    const reg = /([A-Za-z0-9]{2})/g;
    Object.defineProperty(obj, key, {
        get() { //THIS SHIT IS LITTLE ENDIAN!
            let fulltype = 0n;
            //wait i can automate all this
            for(let j = 0; j < bytes; j++){
                //print(i, j, bytes, data[i+j], key, datatype);
                //oh windows is little esndian
                //fulltype |= data[i+j] << (bytes-1-j)*8; //oh hell yeah this shit looks good :drooling: (whatchu you know about rolling dowjn in the deep when your brain goes numb (another medium: https://www.youtube.com/watch?v=DXuOAWnuMVY))
                fulltype |= BigInt(data[i+j]) << BigInt(j)*8n; //ok here we go (oops when the numbers go too big js couldn't keep up and would fuck em up i gotta use bigint)
            }

            fulltype = Number(fulltype);

            if(datatype[0] == "U") {
                return fulltype < 0 ? (2**(bytes*8))-fulltype : fulltype; //checking if it's unsigned and flipping it 
            }else {
                //print(fulltype, (2**(bytes*8-1)));
                return fulltype >= (2**(bytes*8-1)) ? fulltype-(2**(bytes*8)) : fulltype;
            }
        },
        set(newValue) { //oops idk if i wrote the get part wrong or you aren't allowed to set signed correctly (going over doesn't flip to negative) (hey look at that i fixed it)
            /*
            if(datatype[0] == "U") {
                //newValue = newValue < 0 ? (2**(bytes*8))-newValue : newValue;
                if(newValue < 0) {
                    newValue += (2**(bytes*8));
                }else if(newValue >= 2**(bytes*8)) {
                    newValue -= (2**(bytes*8));
                }
            }else {
                if(newValue < 0) {
                    newValue += (2**(bytes*8));
                }else if(newValue >= 2**(bytes*8-1)) {
                    newValue -= (2**(bytes*8));
                }
            }
            */
            //if(newValue < 0) {
            //    newValue += 2**(bytes*8);
            //}else if(datatype[0] == "U" && newValue >= 2**(bytes*8)) {
            //    //newValue = newValue < 0 ? (2**(bytes*8))-newValue : newValue;
            //    newValue -= 2**(bytes*8);
            //}else if(newValue >= 2**(bytes*8-1)) { //oops i had it 2**(bytes*8-1) but it wasn't working 100% of the time and i actually didn't even need this branch...
            //    newValue -= 2**(bytes*8);
            //}
            if(newValue < 0) {
                newValue += 2**(bytes*8);
            }else if(newValue >= 2**(bytes*8)) {
                newValue -= 2**(bytes*8);
            }
            let hex = newValue.toString(16);
            //for(let j = 0; j < hex.length; j++) { //bruh i accidently was creating an infinite loop here but for some reason v8 would instantly crash (i had to test this hoe on another website bruh)
            //    hex = "00"+hex;
            //}
            if(hex.length % 2 == 1) {
                hex = "0"+hex;
            }
            const hl = hex.length;
            for(let j = 0; j < bytes-(hl/2); j++) {
                hex = "00"+hex;
            }
            //console.log(hex.length, bytes*2);
            //if(hex.length > bytes*2) {
            //    console.log("too large nigga");
            //    hex = Object.keys(new Array(bytes*2).toString()+1).map(e => "00").join(""); //bruh i KNOW i had some bullshit like this somewhere and i spent like 20 minutes trying to find it and i couldn't :(   (where would i have possibly put a function like this (equivalent to python's range or something idk))
            //}
            //print(bytes, hex, i);

            const hexBytes = hex.match(reg);
            for(let j = 0; j < bytes; j++) {
                //data[i+j] = parseInt(hexBytes[j], 16);
                //console.log(i, j, hexBytes[bytes-1-j])
                data[i+j] = parseInt(hexBytes[bytes-1-j], 16); //swizzle
            }
        },
        enumerable: true,
        configurable: true,
    });
}

//class memoobjectidk { //i was really trying to make this inheritance work but i just can't seem to modify the child and read this.types from it
globalThis.objFromTypes = (obj, data) => { //replacing every this. with obj.
    //types = {};
    //constructor(data) {
        let i = 0;
        for(const key in obj.constructor.types) { //using constructor now because types is static
            const datatype = obj.constructor.types[key];
            const bytes = sizeof[datatype];
            if(bytes == undefined) {
                print(key, datatype, ":fucked up");
            }
            //let fulltype = 0;
            ////wait i can automate all this
            //for(let j = 0; j < bytes; j++){
            //    //oh windows is little esndian
            //    //fulltype |= data[i+j] << (bytes-1-j)*8; //oh hell yeah this shit looks good :drooling: (whatchu you know about rolling dowjn in the deep when your brain goes numb (another medium: https://www.youtube.com/watch?v=DXuOAWnuMVY))
            //    fulltype |= data[i+j] << (j)*8; //ok here we go
            //}
            ////if(bytes == 1) { //CHAR/UCHAR
            ////    fulltype = data[i];
            ////}else if(bytes == 4) { //INT/UINT
            ////    fulltype = (data[i] << 24) | (data[i+1] << 16) | (data[i+2] << 8) | (data[i+3]); //i think?
            ////}
            //if(datatype[0] == "U") {
            //    obj[key] = fulltype < 0 ? (2**(bytes*8))-fulltype : fulltype; //checking if it's unsigned and flipping it 
            //}else {
            //    obj[key] = fulltype >= (2**(bytes*8)) ? fulltype-(2**(bytes*8)) : fulltype;
            //}
            defineProps(obj, data, key, i, datatype, bytes);
            i += bytes; //i guess you could call this addr too
        }
    //}
    //obj.sizeof = (function() {
    //    print(this);
    //    return Object.values(this.types).reduce((a, b) => a+sizeof[b], 0);
    //}).bind(obj); //haha bind! very fun! (this seems sarcastic but it's not lmao)
}

globalThis.__asm = function(arr, argc = 0, argv = [], argtypev = [], returntype = RETURN_NUMBER) {
    const asm = arr.constructor.name == "Uint8Array" ? arr : new Uint8Array(arr);

    //this ptr variable is the address of a portion of memory allocated by JS/V8 for my arraybuffer asm
    //this piece of memory can't be executed because of its memory protection flags type shit
    //so im gonna change that shit
    const ptr = PointerFromArrayBuffer(asm);

    //old is the previous memory protection flags
    const old = VirtualProtect(ptr, asm.byteLength, PAGE_EXECUTE_READWRITE);

    //apparently when changing code in memory you are supposed to use FlushInstructionCache but i might not have to because im not CHANGING code im making it (lowkey don't trust me on that)
    //FlushInstructionCache(hInstance, ptr, asm.byteLength); //im not sure if hInstance is also a valid process handle

    const res = Call(ptr, argc, argv, argtypev, returntype);
    VirtualProtect(ptr, asm.byteLength, old); //just in case
    return res;
}

//here we go this is a nice compromise
class memoobjectidk {
    static sizeof() {
        return Object.values(this.types).reduce((a, b) => a+sizeof[b], 0); //oh yeah
    }
}
class CString {
    constructor(string) {
        this._data = new Uint8Array([...string.split("").map(e => e.charCodeAt(0)), 0x00]);
        this.ptr = PointerFromArrayBuffer(this._data);
    }

    get value() {
        //return String.fromCharCode(...Object.values(this._data));
        let str = "";
        for(let i = 0; i < this._data.length; i++) {
            if(this._data[i] == 0) {
                break;
            }
            str += String.fromCharCode(this._data[i]);
        }
        return str;
    }
    set value(newValue) {
        if(newValue.length >= this._data.length) {
            //too big and i gotta make a new array
            //print("too big", newValue.length, ">=", this._data.length);
            this._data = new Uint8Array([...newValue.split("").map(e => e.charCodeAt(0)), 0x00]);
            this.ptr = PointerFromArrayBuffer(this._data);
        }else {
            for(let i = 0; i < this._data.length; i++) {
                if(newValue.length <= i) {
                    this._data[i] = 0;
                }else {
                    this._data[i] = newValue[i].charCodeAt(0);
                }
            }
        }
    }
}
class WString {
    constructor(wstring) {
        this._data = new Uint8Array([...wstring.split("").map(e => e+"\0").join("").split("").map(e => e.charCodeAt(0)), 0x00, 0x00]) //now that LoadIcon takes wchar_t i gotta add zeros because wchar is 2 bytes
        this.ptr = PointerFromArrayBuffer(this._data);
    }

    get value() {
        //return String.fromCharCode(...Object.values(this._data));
        let str = "";
        for(let i = 0; i < this._data.length; i += 2) {
            if(this._data[i] == 0) {
                break;
            }
            str += String.fromCharCode(this._data[i]);
        }
        return str;
    }
    set value(newValue) {
        if(newValue.length >= this._data.length/2) {
            //too big and i gotta make a new array
            print("too big", newValue.length, ">=", this._data.length/2);
            this._data = new Uint8Array([...newValue.split("").map(e => e+"\0").join("").split("").map(e => e.charCodeAt(0)), 0x00, 0x00]);
            this.ptr = PointerFromArrayBuffer(this._data);;
        }else {
            for(let i = 0; i < this._data.length; i++) {
                if(i % 2 == 1 || newValue.length*2 <= i) {
                    this._data[i] = 0;
                }else {
                    this._data[i] = newValue[(i/2)].charCodeAt(0);
                }
            }
        }
    }
}
globalThis.memoobjectidk = memoobjectidk;
globalThis.CString = CString;
globalThis.WString = WString;