eval(require("fs").read(__dirname+"/marshallib.js")); //damn this marshalling go HARD

const changeEndianness = (string) => { //https://stackoverflow.com/questions/5320439/how-do-i-swap-endian-ness-byte-order-of-a-variable-in-javascript
    const result = [];
    let len = string.length - 2;
    while (len >= 0) {
      result.push(string.substr(len, 2));
      len -= 2;
    }
    return result.join('');
}

function int_to_little_endian_hex(int, size) {
    let hex = int.toString(16);
    if(hex.length % 2 == 1) {
        hex = "0"+hex;
    }
    const len = hex.length;
    for(let i = len; i < size/4; i++) {
        hex = "0"+hex;
    }
    //print(hex);
    return changeEndianness(hex).match(/([a-z0-9]{2})/g).map(e => parseInt(e, 16));
}

const user32 = LoadLibraryEx("user32.dll", NULL);

const MessageBoxW = GetProcAddress(user32, "MessageBoxW");

print(MessageBoxW);

const text = new WString("what the sigma");
let caption = new WString("phonk trollface (using Call)");

print(Call(MessageBoxW, 4, [NULL, text.ptr, caption.ptr, MB_OK | MB_ICONQUESTION], [VAR_INT, VAR_INT, VAR_INT, VAR_INT], RETURN_NUMBER), "call MessageBoxW");

caption = new WString("phonk trollface (using asm to call)");

print(__asm([ //oops i was having an error here and it was because i didn't include the standard push rbp, mov rbp<-rsp, and pop rbp (oops)
    //rcx, rdx, r8, r9
    //0x58,                                        //pop rax    (since i'm taking the pointer to MessageBoxW as a 5th argument, i must pop it from the stack type shit (for the 5th parameter and higher the values are pushed onto the stack)) (ok everything i said was true BUT i don't think you are supposed to pop it from the stack (and it didn't work lmao) )
    
    0x48, 0x8b, 0x44, 0x24, 0x28,                  //mov rax, QWORD PTR [rbp+0x28] (chatgpt's solution for accessing the 5th parameter (since each parameter is an integer (assumed to be 64 bit) each parameter is taking 8 bytes so 8*5 == 40 (or 0x28)))     if i wanted to be more efficient i would directly call QWORD PTR [rbp+0x30] instead of moving it to rax (which i think you can do) (mind the 0x30 change because after pushing rbp the stack changes)
    
    0x55,                                          //push rbp
    0x48, 0x89, 0xe5,                              //mov rbp, rsp

    //if you try to access the 5th parameter after pushing rbp, the push puts the 5th parameter another 8 bytes forward in the stack type shit
    //so you'd have to do                            mov rax, QWORD PTR [rbp+0x30] (48)

    //0x51,                                        //push rcx   (nevermind i thought i had to push these because it wasn't working)
    //0x52,                                        //push rdx
    //0x41, 0x50,                                  //push r8
    //0x41, 0x51,                                  //push r9

    //0x48, 0xb8,                                  //movabs rax, ...
    //no longer hardcoding the pointer to MessageBoxW (im taking it as a variable in the stack...)
    //...int_to_little_endian_hex(MessageBoxW, 64),//...MessageBoxW

    0xff, 0xd0,                                    //call rax
    0x5d,                                          //pop rbp
    0xc3,                                          //ret
], 5, [NULL, text.ptr, caption.ptr, MB_OK | MB_ICONEXCLAMATION, MessageBoxW], [VAR_INT, VAR_INT, VAR_INT, VAR_INT, VAR_INT], RETURN_NUMBER), "call through asm")