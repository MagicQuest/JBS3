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
    ULONG_PTR : 8,
    LONG_PTR : 8,
    HANDLE : 8,
};

//class memoobjectidk { //i was really trying to make this inheritance work but i just can't seem to modify the child and read this.types from it
globalThis.objFromTypes = (obj, data) => { //replacing every this. with obj.
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
globalThis.memoobjectidk = memoobjectidk;