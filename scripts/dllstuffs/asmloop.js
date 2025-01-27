//i was trying to do this at the bottom of CALLASM.js but i gave up and i want to try again lol
//im STILL using this banger to turn my asm into le bytes https://defuse.ca/online-x86-assembler.htm

//https://sonictk.github.io/asm_tutorial/#windows:thewindowtothehardware/themicrosoftx64callingconvention/functionparametersandreturnvalues

eval(require("fs").read(__dirname+"/marshallib.js")); //damn this marshalling go HARD

//lowkey i couldn't figure out how to jle relatively lol (but i got it)
//https://stackoverflow.com/questions/14921735/write-a-jump-command-to-a-x86-64-binary-file?noredirect=1&lq=1
//https://stackoverflow.com/questions/14889643/how-encode-a-relative-short-jmp-in-x86?rq=2
//https://stackoverflow.com/questions/63648708/a-relative-jmp-in-x64
//https://stackoverflow.com/questions/54745872/how-do-rip-relative-variable-references-like-rip-a-in-x86-64-gas-intel-sy
//https://stackoverflow.com/questions/14925104/opcode-for-negative-jump

function loopasmjs(a, b = 10) { //no jump in js so i thought it would be fun to make it recursive
    //if(b >= 0) {
    //    return loopasmjs(a+a, b-1);
    //}else {
    //    return a;
    //}
    return b > 0 ? loopasmjs(a+a, b-1) : a;
}

function strmanipoutjs(str, out) { //in js you lowkey can't change a direct string by reference like that but you CAN use an object so
    //str is rcx
    //str_out is rdx
    let str_out = "";//Object.keys(new Array(str.length).toString()+1).map(e => "#").join("");
    const r8 = str.length;
    for(let r9 = 0; r9 < r8; r9++) { //i use r9 as the count register (because it's volatile and i don't have to preserve its original value (keep in mind though that its value is the fourth integer parameter (for windows)))
        //oh wait i guess i've never tried to set an individual character
        //since strings are immutable i don't think you can...
        //out.str_out[r9] = String.fromCharCode(str[r9].charCodeAt(0)+1);
        let albyte = str[r9].charCodeAt(0);    //mov al, BYTE PTR [rcx]
        albyte++;                              //inc al
        str_out += String.fromCharCode(albyte);//mov BYTE PTR [rdx], al
    }
    out.str_out = str_out;
    //return str_out;
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
    //                                   lol i was using the JLE instruction and i didn't realize it was less or equal so i had to change it here so that loopasmjs would work correctly
    0x0f, 0x8c, 0xf3, 0xff, 0xff, 0xff,  //jl rel32 0xfffffffffffffff9 (-13 bytes (including the jl instruction)) (to turn -13 into 0xfffffffffffffff9 you have to cast to unsigned int)
    
    //0xcc,                              //int 3
    //0x0f, 0x8e, ...int64_to_little_endian_hex(PointerFromArrayBuffer(loopasm)),  //jle addr (you CANNOT do it this way because i think all jmp type commands cannot take immediate values (so you'd have to mov it to a register))
    0x89, 0xc8,                          //mov eax, ecx    ;gotta move the result into eax so it is returned
    0x5d,                                //pop rbp
    0xc3,                                //ret
]);//.forEach((e, i) => loopasm[i] = e);
print(PointerFromArrayBuffer(loopasm));
print(__asm(loopasm, 1, [5], [VAR_INT], RETURN_NUMBER), "asm loop");
print(loopasmjs(5), "js equivalent"); //no jump in js so i thought it would be fun to make it recursive

//const str = "idk how long im allowed to have this string so im gonna keep typing until it seems like it's too long";
                                                                        //🍷🗿 lol i had these 2 characters in the string but after i started reading files as wchar_t*s it stopped working with emojis i need to google that  
const str = "idkp how long im allowed to have this string so im gonna keep typing until it seems like it's too long yeah thi nigga finna get popped";

const str_out = NewCharStrPtr(Object.keys(new Array(str.length).toString()+1).map(e => "#").join("")); //basically equivalent to std::vector<char> vstr(str.length, '#');

//print(str, str_out, str.length); //__debugbreak();
//print(StringFromPointer(str_out), StringFromPointer(str_out).length);

//this asm code takes 3 integer parameters: [in] const char* str, [out] void* str_out, [in] int len
//str - (technically an integer because using VAR_CSTRING will get its pointer)
//str_out - the pointer to a piece of memory to write to
//len - the length of the string (we're assuming the length of the string is the same amount of memory allocated for str_out)

//im using the r9 register as the count for the loop (i think i could also just push to the stack and once i looped back i could pop it out)

//it gets the byte (character) at [rcx], increments that value, and stores it into [rdx]   (if the first character in str is "d" (100) then it is incremented and "e" (101) is stored in str_out as the first character)
//[rcx] and [rdx] are pointers so i increment their value so that in the next loop i get/set the next byte/character
//i increment r9 and check if it's greater than r8 (string length)
//if it's less than r8 then loop back to the mov instruction (-24 bytes)

//apparently there are some weird string manipulation operations you can use that could probably do this (like rep)

print(__asm([ //i didn't include the standard push rbp, mov, and pop rbp because i don't change rbp so i don't think it's required (i think idk it works fine without it)
    0x4d, 0x31, 0xc9,                    //xor r9, r9     ;set r9 to 0 (because im using it to could how many times it has looped)
    0x31, 0xc0,                          //xor eax, eax (set the eax register to 0 just in case because im moving [rcx] into eax's lower 16's lower byte al)

    //0xcc,                              //test interrupt lol

    /*
    0x8a, 0x01,                          //mov al, BYTE PTR [rcx] (im dereferencing rcx (the first 64 bit integer parameter) and putting the byte into al)
    0xfe, 0xc0,                          //inc al         ;incrementing al 
    0x88, 0x02,                          //mov BYTE PTR [rdx], al
    0x48, 0xff, 0xc1,                    //inc rcx        ;incrementing rcx to get the next byte when it loops
    0x48, 0xff, 0xc2,                    //inc rdx        ;incrementing rdx to set the next byte when it loops
    0x49, 0xff, 0xc1,                    //inc r9         ;inc loop variable
    */

    //slightly (-2 bytes and -2 instructions) more efficient way of doing the above commented code
    //i figured this out when i was reading these banger sites
    //https://sonictk.github.io/asm_tutorial/          <------- this one is really good
    //https://stackoverflow.com/questions/1658294/whats-the-purpose-of-the-lea-instruction
    //https://stackoverflow.com/questions/4534617/lea-instruction?noredirect=1&lq=1
    0x42, 0x8a, 0x04, 0x09,              //mov al, BYTE PTR [rcx + 1*r9] (im dereferencing rcx (the first 64 bit integer parameter) PLUS the value of r9 and putting the byte into al)
    0xfe, 0xc0,                          //inc al         ;incrementing al 
    0x42, 0x88, 0x04, 0x0a,              //mov BYTE PTR [rdx + 1*r9], al (putting the incremented al into str_out (rdx) PLUS the value of r9)
    0x49, 0xff, 0xc1,                    //inc r9         ;inc loop variable

    //OOPS! i had the first byte as 0x49 and i was actually doing cmp r9, rax!!!! (so that's why the string would be cut off after a while)
    0x4d, 0x39, 0xc1,                    //cmp r9, r8     ;compare

    //0x0f, 0x8c, 0xe8, 0xff, 0xff, 0xff,  //jl rel32 0xffffffffffffffee (-24 bytes (including the jl instruction)) (to turn -24 into 0xffffffffffffffee you have to cast to unsigned int)
    
    //                                   for some reason i had to use the rel32 version of jl because the rel8 one wouldn't jump correctly
    //                                   lol i was using the JLE instruction and i didn't realize it was less or equal so i had to change it
    0x0f, 0x8c, 0xea, 0xff, 0xff, 0xff,  //jl rel32 0xfffffffffffffff0 (-22 bytes (including the jl instruction)) (to turn -22 into 0xfffffffffffffff0 you have to cast to unsigned int(-22) )

    0xc3,                                //ret
], 3, [str, str_out, str.length], [VAR_CSTRING, VAR_INT, VAR_INT], RETURN_NUMBER));

print(str, str_out, str.length); //__debugbreak();
print(StringFromPointer(str_out), StringFromPointer(str_out).length);

DeleteArrayPtr(str_out);

const jsout = {str_out: ""}; //using an object to change str_out in strmanipoutjs

strmanipoutjs(str, jsout);

print("js str_out equivalent ->", jsout.str_out);