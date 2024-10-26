eval(require("fs").read(__dirname+"/marshallib.js")); //damn this marshalling go HARD

class __int32 extends memoobjectidk {
    static types = {value: "INT"};
    constructor(data) { //data must be a Uint8Array
        super()
        objFromTypes(this, data);
        this.data = data;
    }
}

class __uint32 extends memoobjectidk {
    static types = {value: "UINT"};
    constructor(data) { //data must be a Uint8Array
        super()
        objFromTypes(this, data);
        this.data = data;
    }
}

class char_t extends memoobjectidk {
    static types = {value: "CHAR"};
    constructor(data) { //data must be a Uint8Array
        super()
        objFromTypes(this, data);
        this.data = data;
    }
}

const i32 = new __int32(new Uint8Array([0x00, 0x00, 0x00, 0x00]));
const u32 = new __uint32(new Uint8Array([0x00, 0x00, 0x00, 0x00]));
const c = new char_t(new Uint8Array([0x00]));

i32.value = 2147483648;
print(i32.value);

i32.value = 4294967296-10;//-10;
print(i32.value, "neg");

u32.value = -22;//2147483648;
print(u32.value, "valg", "0x"+Object.values(u32.data).map(e => e.toString(16)).join("")); //i used this to calculatw the relative 32 jump jle (0x0f, 0x8e, ....) 4 bytes

u32 .value = 4294967296;
print(u32.value);

c.value = 129;

print(c.value);
print("0x"+c.data[0].toString(16));