//i was trying to do this at the bottom of CALLASM.js but i gave up and i want to try again lol

eval(require("fs").read(__dirname+"/marshallib.js")); //damn this marshalling go HARD

//lowkey i couldn't figure out how to jle relatively lol (but i got it)
//https://stackoverflow.com/questions/14921735/write-a-jump-command-to-a-x86-64-binary-file?noredirect=1&lq=1
//https://stackoverflow.com/questions/14889643/how-encode-a-relative-short-jmp-in-x86?rq=2
//https://stackoverflow.com/questions/63648708/a-relative-jmp-in-x64

function shit(a, b = 10) {
    return b > 0 ? shit(a+a, b-1) : a;
}

const loopasm = new Uint8Array( //i can't seem to figure out how to make this work...
[
    0x55,                                //push rbp
    0x48, 0x89, 0xe5,                    //mov rbp, rsp
    0x31, 0xd2,                          //xor edx, edx     ;set edx to 0

    //0xcc,                              //int 3
    
    0x01, 0xc9,                          //add ecx, ecx
    0xff, 0xc2,                          //inc edx          ;inc loop variable (using edx)
    0x83, 0xfa, 0x0a,                    //cmp edx, 10      ;compare
    
    //0xcc,                              //int 3            ;interupt because i want to make sure my loop is looping
    //0x7e, 0x80,                        //jle 0xffffffffffffff8b (-9 bytes)     (im using the jle rel8 opcode here (i think) anyways it's 0x7e (jle) and 0x89 (-9) to jmp -9 bytes back) ) https://stackoverflow.com/questions/14889643/how-encode-a-relative-short-jmp-in-x86?rq=2
    
    //                                   for some reason i had to use the rel32 version of jle because the rel8 one wouldn't jump correctly
    0x0f, 0x8e, 0xf3, 0xff, 0xff, 0xff,  //jle rel32 0xfffffffffffffff9 (-13 bytes (including the jle instruction)) (to turn -13 into 0xfffffffffffffff9 you have to cast to unsigned int)
    
    //0xcc,                              //int 3
    //0x0f, 0x8e, ...int64_to_little_endian_hex(PointerFromArrayBuffer(loopasm)),  //jle addr (you CANNOT do it this way because i think all jmp type commands cannot take immediate values (so you'd have to mov it to a register))
    0x89, 0xc8,                          //mov eax, ecx    ;gotta move the result into eax so it is returned
    0x5d,                                //pop rbp
    0xc3,                                //ret
]);//.forEach((e, i) => loopasm[i] = e);
print(PointerFromArrayBuffer(loopasm));
print(__asm(loopasm, 1, [5], [VAR_INT], RETURN_NUMBER), "asm loop");
print(shit(10), "js equivalent");

//const str = "idk how long im allowed to have this string so im gonna keep typing until it seems like it's too long";
const str = "idk how long im allowed to have this string so im gonna keep typing until it seems like it's too long 🍷🗿 yeah thi nigga finna get popped";

const str_out = NewCharStrPtr(Object.keys(new Array(str.length).toString()+1).map(e => "#").join(""));

print(__asm([ //i didn't include the standard push rbp, mov, and pop rbp because i don't change rbp so i don't think it's required (i think idk it works fine without it)
    0x4d, 0x31, 0xc9,                    //xor r9, r9     ;set r9 to 0    
    0x31, 0xc0,                          //xor eax, eax (set the eax register to 0 just in case...)

    //0xcc,                              //test interrupt lol

    0x8a, 0x01,                          //mov al, BYTE PTR [rcx] (im dereferencing rcx (the first 64 bit integer parameter) and putting the first byte into al)
    0xfe, 0xc0,                          //inc al
    0x88, 0x02,                          //mov BYTE PTR [rdx], al
    0x48, 0xff, 0xc1,                    //inc rcx
    0x48, 0xff, 0xc2,                    //inc rdx
    0x49, 0xff, 0xc1,                    //inc r9          ;inc loop variable (using edx)
    0x49, 0x39, 0xc1,                    //cmp r9, r8      ;compare

    //                                   for some reason i had to use the rel32 version of jle because the rel8 one wouldn't jump correctly
    0x0f, 0x8e, 0xe8, 0xff, 0xff, 0xff,  //jle rel32 0xffffffffffffffee (-24 bytes (including the jle instruction)) (to turn -24 into 0xffffffffffffffee you have to cast to unsigned int)
    
    //0x0f, 0x8e, 0xea, 0xff, 0xff, 0xff,  //jle rel32 0xfffffffffffffff0 (-22 bytes (including the jle instruction)) (to turn -22 into 0xfffffffffffffff0 you have to cast to unsigned int)

    0xc3,                                //ret
], 3, [str, str_out, str.length], [VAR_CSTRING, VAR_INT, VAR_INT], RETURN_NUMBER));

print(str, str_out, str.length); //__debugbreak();
print(StringFromPointer(str_out));