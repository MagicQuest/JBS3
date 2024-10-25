//i need to take libffi out of DllLoad like how i took WIC out of d2d

//you know what this isn't working (access violation executing at location) and i just realized that maybe it's because they don't want you executing arbitrary code in memory but c'mon there has GYATT to be a way...

//well what do you know my guess was totally wrong and the problem was actually the fact that the memory that TypedArrays/ArrayBuffers allocate is not executable (so i have to make it executable)
//using VirtualAlloc you can set the protection for the region of pages allocated and all i had to do was allocate a piece with the PAGE_EXECUTE (or PAGE_EXECUTE_READWRITE) to run my shit!
//since im not allocating the memory myself (v8 is handling that) with PointerFromArrayBuffer i will use the returned pointer with VirtualProtect to change the memory protection
//this is what actually helped me figure this out (https://learn.microsoft.com/en-us/answers/questions/90734/inline-assembly-call-to-compiled-subroutine-gives)
//WOW THIS LINK HAS EXACTLY WHAT I'VE BEEN TRYING TO DO https://stackoverflow.com/a/40937610 (IF ONLY I KNEW HOW TO ASK THIS QUESTION WHEN I STARTED (i didn't even know pages of memory could not be executed like that))
//lol i had this one open right before i found the solution (i was actually striking gold https://learn.microsoft.com/en-us/shows/inside/access-violation-c0000005-execute)

//im using https://defuse.ca/online-x86-assembler.htm#disassembly to convert my asm to hex binsry (i could use godbolt or run gcc on my own computer but, 1. godbolt is actually pretty good but sometimes it doesn't want to give you the opcodes for the asm, and 2. sometimes that shit don't work)

const user32 = LoadLibraryEx("user32.dll", NULL); //using NULL will make LoadLibraryEx work just like LoadLibrary

const swp = GetProcAddress(user32, "SetWindowPos");

print(swp);

print(Call(swp, 7, [GetConsoleWindow(), NULL, 0, 0, 612, 512, SWP_NOZORDER], [VAR_INT, VAR_INT, VAR_INT, VAR_INT, VAR_INT, VAR_INT, VAR_INT], RETURN_NUMBER));

print(FreeLibrary(user32), "== 1?"); //just had to make sure GetProcAddress and Call worked

//const asm = new Uint8Array([ //intel asm syntax for comments
//    //0x55,                         //push rbp
//    //0x48, 0x89, 0xe5,             //mov rbp, rsp
//    0xb8, 0x05, 0x00, 0x00, 0x00, //mov eax, 0x5            //movs 5 into eax (eax is the 32 bit return value)
//    //0x5d,                         //pop rbp
//    0xc3,                         //ret
//]);

//https://learn.microsoft.com/en-us/cpp/build/x64-calling-convention?view=msvc-170
//https://learn.microsoft.com/en-us/cpp/build/x64-software-conventions?view=msvc-170&source=recommendations#register-volatility-and-preservation
//https://stackoverflow.com/questions/23032409/understanding-hex-opcodes
//const asm = new Uint8Array([ //simply returns 5 (basically the same thing https://stackoverflow.com/a/40937610)
//    0xB8, 0x05, 0x00, 0x00, 0x00, //mov eax, 0x5
//    //0xCC,                       //__debugbreak() int 3
//    0xC3,                         //ret
//
//    //0xCB,                       //far ret (ok i thought the problem was that when i returned, the piece of memory i was executing from was too far from the main area (which i mean it seemed to be but that isn't the problem))
//    //0xcc, 0xcc, 0xcc, 0xcc, 0xcc, 0xcc, 0xcc, 0xcc, 0xcc, 0xcc, //0xcc is put as padding in memory and it's the break interupt (according to stackoverflow https://stackoverflow.com/a/40997957)
//]);

//const asm = new Uint8Array([
//    0xEA, 0xCP, //i wanted to jump to coolfunc but i wasn't sure how to write the assembly for that (i knew where coolfunc was)
//]);

//https://stackoverflow.com/questions/58229838/how-to-convert-javascript-code-to-human-readable-opcodes-or-asm

function __asm(arr, argc = 0, argv = [], argtypev = [], returntype = RETURN_NUMBER) {
    const asm = arr.constructor.name == "Array" ? new Uint8Array(arr) : arr;

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

for(let i = 0; i < 100; i++) {
                //returns a 32 bit random integer (seemingly unsigned)
    print(__asm([0x0F, 0xC7, 0xF0, 0xc3]), "__asm 32 bit rdrand test"); //rdrand eax     ret
}

const changeEndianness = (string) => { //https://stackoverflow.com/questions/5320439/how-do-i-swap-endian-ness-byte-order-of-a-variable-in-javascript
    const result = [];
    let len = string.length - 2;
    while (len >= 0) {
      result.push(string.substr(len, 2));
      len -= 2;
    }
    return result.join('');
}

function int64_to_little_endian_hex(int) {
    let hex = int.toString(16);
    if(hex.length % 2 == 1) {
        hex = "0"+hex;
    }
    const len = hex.length;
    for(let i = len; i < 16; i++) {
        hex = "0"+hex;
    }
    //print(hex);
    return changeEndianness(hex).match(/([a-z0-9]{2})/g).map(e => parseInt(e, 16));
}

print(...int64_to_little_endian_hex(0xdeadbeef21B1)); //lol i did 0xdeadbeef21B1D1 at first but since it's greater than 2**53 the floating point precision e3rror was catching up to it

print(__asm([
    0x48, 0xb8,                                                   //movabs rax, ...
    ...int64_to_little_endian_hex(0xdeadbeef21B1),                //...0xdeadbeef21B1D1
    0xc3                                                          //ret
]), "int64_to_little_endian (should print", 0xdeadbeef21B1, ")");

const jmpasm = new Uint8Array([
    0x89, 0xc8,     //mov eax, ecx (ecx is the first integer argument (32 bit))
    //0x01, 0xd0,     //add eax, edx (adding a random register to eax lmao)
    0xc3,           //ret
]);

print(__asm([
    0x48, 0xb8,                                                   //movabs rax, ...
    ...int64_to_little_endian_hex(PointerFromArrayBuffer(jmpasm)),//...pointer to another function
    0xb9, 0x0a, 0x00, 0x00, 0x00,                                 //mov ecx, 10 (ecx is used as the first parameter in jmpasm)
    0xff, 0xd0,                                                   //call rax
    0xc3                                                          //ret (because im calling instead of jmping)
]), "int64_to_little_endian (test2)"); //jmpasm returns 10

print(__asm(
[
    //actually i want to see what happens if i JUST return ebx (by moving it into eax)
    //0xbb, 0x05, 0x00, 0x00, 0x00, //mov ebx, 5       (apparently you must preserve the value of rbx so im changing that shit to see what happens)
    0x89, 0xd8,                   //mov eax, ebx     (just for good measure im putting ebx into eax to return it)
    0xc3,                         //ret
]
), "might crash?"); //might crash (nothing happened)

const squareasm = new Uint8Array([ //squares the first integer parameter
    0x89, 0xc8,           //mov eax, ecx (ecx holds the leftmost integer parameter https://learn.microsoft.com/en-us/cpp/build/x64-calling-convention?view=msvc-170#example-of-argument-passing-1---all-integers)
    0x0f, 0xaf, 0xc0,     //imul eax, eax
    0xc3,                 //ret
]);

const ptr = PointerFromArrayBuffer(squareasm);
//const ptr = 0x00007FF78F283210;

//this ptr variable is the address of a portion of memory allocated by JS/V8 for my arraybuffer asm
//this piece of memory can't be executed because of its memory protection flags type shit
//so im gonna change that shit
print(old = VirtualProtect(ptr, squareasm.byteLength, PAGE_EXECUTE_READWRITE), "old protection"); //i lowkey don't know EXACTLY about the size so im just gonna wing it

print(ptr);

//apparently when changing code in memory you are supposed to use FlushInstructionCache but i might not have to because im not CHANGING code im making it (lowkey don't trust me on that)
//FlushInstructionCache(hInstance, ptr, asm.byteLength); //im not sure if hInstance is also a valid process handle

//__debugbreak();

//print(Call(ptr, 0, [], [], RETURN_NUMBER)); //prints 5!
print(Call(ptr, 1, [21], [VAR_INT], RETURN_NUMBER), "call!"); //prints x**2!
//callmyshitforme(ptr); //i was using a custom function here to make sure ffi wasn't the problem (it wasn't)

VirtualProtect(ptr, squareasm.byteLength, old); //put that shit back to normal JUST IN CASE

print(squareasm);

//ok this HAS to crash my shit (yeah it did)
//print(__asm([
//    0x48, 0x0f, 0xc7, 0xf0, //rdrand rax
//    //0xcc,                 //breakpoint i wanna see my shit in the disassembly (aw shoot idk what rax is before it tries to JMP)
//    0xff, 0xe0,             //jmp rax
//    //0xc3,
//]), "rng64");

/*
push rbp
mov rbp, rsp
xor edx, edx
add ecx, ecx
inc edx
cmp edx, 10
jle (beginning) #; conditional jumps don't support relative addresses so i gotta use an immediate...
pop rbp
ret
*/

//const loopasm = new Uint8Array(25); //i can't seem to figure out how to make this work...
//[
//    0x55,                                //push rbp
//    0x48, 0x89, 0xe5,                    //mov rbp, rsp
//    0x31, 0xd2,                          //xor edx, edx
//    0x01, 0xc9,                          //add ecx, ecx
//    0xff, 0xc2,                          //inc edx
//    0x83, 0xfa, 0x0a,                    //cmp edx, 10
//    0x0f, 0x8e, ...int64_to_little_endian_hex(PointerFromArrayBuffer(loopasm)),  //jle addr
//    0x5d,                                //pop rbp
//    0xc3,                                //ret
//].forEach((e, i) => loopasm[i] = e);
//print(PointerFromArrayBuffer(loopasm)); __debugbreak();
//print(__asm(loopasm, 1, [5], [VAR_INT], RETURN_NUMBER), "asm loop");