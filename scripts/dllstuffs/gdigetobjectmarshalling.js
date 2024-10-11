//im not "requiring" marshallib in this file because this is what the marshal thing originally looked like before i put it into a separate file

const sizeof = {
    CHAR : 1,
    UCHAR : 1,
    UINT : 4,
    INT : 4,
    DWORD : 4,
    COLORREF : 4, //same as DWORD
    LONG : 4,
    ULONG_PTR : 8,
    LONG_PTR : 8,
    HANDLE : 8,
};

//class memoobjectidk { //i was really trying to make this inheritance work but i just can't seem to modify the child and read this.types from it
function objFromTypes(obj, data) { //replacing every this. with obj.
    //types = {};
    //constructor(data) {
        let i = 0;
        for(const key in obj.constructor.types) { //using constructor now because types is static
            const datatype = obj.constructor.types[key];
            const bytes = sizeof[datatype];
            let fulltype = 0;
            //wait i can automate all this
            for(let j = 0; j < bytes; j++){
                //oh windows is little esndian
                //fulltype |= data[i+j] << (bytes-1-j)*8; //oh hell yeah this shit looks good :drooling: (whatchu you know about rolling dowjn in the deep when your brain goes numb (another medium: https://www.youtube.com/watch?v=DXuOAWnuMVY))
                fulltype |= data[i+j] << (j)*8; //ok here we go
            }
            //if(bytes == 1) { //CHAR/UCHAR
            //    fulltype = data[i];
            //}else if(bytes == 4) { //INT/UINT
            //    fulltype = (data[i] << 24) | (data[i+1] << 16) | (data[i+2] << 8) | (data[i+3]); //i think?
            //}
            if(datatype[0] == "U") {
                obj[key] = fulltype < 0 ? (2**(bytes*8))-fulltype : fulltype; //checking if it's unsigned and flipping it 
            }else {
                obj[key] = fulltype >= (2**(bytes*8)) ? fulltype-(2**(bytes*8)) : fulltype;
            }
            i += bytes; //i guess you could call this addr too
        }
    //}
    //obj.sizeof = (function() {
    //    print(this);
    //    return Object.values(this.types).reduce((a, b) => a+sizeof[b], 0);
    //}).bind(obj); //haha bind! very fun! (this seems sarcastic but it's not lmao)
}

//here we go this is a nice compromise
class memoobjectidk {
    static sizeof() {
        return Object.values(this.types).reduce((a, b) => a+sizeof[b], 0); //oh yeah
    }
}

class LOGBRUSH extends memoobjectidk { //this shit just like c#'s marshalling (without the offsets)
    static types = {lbStyle: "UINT", lbColor: "COLORREF", lbHatch: "ULONG_PTR"}; //strings because i want to know if they are unsigned (when the first letter is U (i can't be bothered to make each key in sizeof an object))
    constructor(data) { //data must be a Uint8Array
        super()
        objFromTypes(this, data);
        //super(data);
        //this.lbStyle = data[0] < 0 ? 128-data[0] : data[0]; //lbStyle is actually a uint so this probably covers that
        //this.lbColor = (data[1] << 24) | (data[2] << 16) | (data[3] << 8) | (data[4]);
    }
}

const data = new Uint8Array(LOGBRUSH.sizeof()); //data MUST be a Uint8Array as regular memory is like 0x00 to 0xFF or something idk it's important (you gotta initialize that shit too because if you don't, nothing happens lmao and data isn't filled with any data)

//GetObjectHBRUSH is already defined in JBS3 but i want to test if this is possible using DllLoad (ok i have spent so much time on the setup instead of the actual important part)
const Gdi32 = DllLoad("Gdi32.dll");
const brush = CreateSolidBrush(0x0021B1D1); //haha skibidi 0xAARRGGBB

let bytesstored = Gdi32("GetObjectW", 3, [brush, LOGBRUSH.sizeof(), PointerFromArrayBuffer(data)], [VAR_INT, VAR_INT, VAR_INT], RETURN_NUMBER); //everything else looks totally valid so im gonna be mad if this doesn't work (but im PRETTY sure it will)
print(bytesstored);

const log = new LOGBRUSH(data);

print(log, log.lbColor, 0x0021B1D1);

print(Gdi32("__FREE"));