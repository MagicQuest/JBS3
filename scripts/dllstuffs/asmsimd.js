//this is actually a benchmark to see if using the sse simd functions are faster than just looping four times (the reason im doing this is because of d2dvtablehijack where i do, in fact, loop four times)
//this benchmark isn't 100% accurate though because in d2dvtablehijack i have to hardcode the scalar value

eval(require("fs").read(__dirname+"/marshallib.js")); //of course

function uint32_to_little_endian_hex(uint) {
    //lowkey i could just get the DataView to do this for me
    const a = new ArrayBuffer(4); //uint is 4 bytes
    const d = new DataView(a);
    d.setUint32(0, uint, true);
    return Array.from(new Uint8Array(a));
}

class Region extends memoobjectidk {
    static types = {
        left: "FLOAT",
        top: "FLOAT",
        right: "FLOAT",
        bottom: "FLOAT",
    };
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

let r = new Region(1, 2, 3, 4);
//r.left = 1;
//r.top = 2;
//r.right = 3;
//r.bottom = 4;

const scalar = 10;

print(r);

const kernel32 = LoadLibraryEx("Kernel32.dll");
const LPQueryPerformanceCounter = GetProcAddress(kernel32, "QueryPerformanceCounter");

//const q = QueryPerformanceCounter();
//Sleep(1000);
//print((QueryPerformanceCounter() - q)/10000000);

const SIMD = new Uint8Array([
    //first param (scalar) is passed in rcx (hey wait a second i changed it to a float and yet it's still passed as rcx! it's also passed through xmm0)
    //second param (pointer to floats) is passed in rdx
    //0xcc,

    //damn since we call QueryPerformanceCounter we need the prolog
    0x55,                           //push rbp
    0x48, 0x89, 0xe5,               //mov rbp, rsp
    
    //we're gonna use the ole rdtsc instruction so i can benchmark (rdtsc clobbers rdx so we gotta save that)
    // 0x52,                           //push rdx
    //wait a second i'm just gonna move it to r8
    //0x49, 0x89, 0xd0,               //mov r8, rdx
    //oh dang it now that i call query performance counter i neede to save rdx
    0x52,                           //push rdx

    //ok nevermind lol im gonna use QueryPerformanceCounter since (allegedly) rdtsc's accuracy is kinda washed https://en.wikipedia.org/wiki/Time_Stamp_Counter
    //we need to push some dummy data to the stack so QueryPerformanceCounter can populate it
    0x57,                           //push rdi (dummy)
    0x48, 0xb8, ...int64_to_little_endian_hex(LPQueryPerformanceCounter), //movabs rax, QueryPerformanceCounter
    0x48, 0x8d, 0x0c, 0x24,         //lea rcx, [rsp] ; im using lea instead of move here because it just feels right ok
    0x48, 0x83, 0xec, 0x20,         //sub rsp, 0x20  ; now that we've subtracted rsp the LARGE_INTEGER that QueryPerformanceCounter writes is at [rsp+0x20]

    0xff, 0xd0,                     //call rax (QueryPerformanceCounter)(OUT ULONGLONG* rcx)

    //0x0f, 0xae, 0xe8,               //lfence
    //0x0f, 0x31,                     //rdtsc
    //// 0x5a,                           //pop rdx
    //0x48, 0xc1, 0xe2, 0x20,         //shl rdx, 0x20 (32)
    //0x48, 0x09, 0xd0,               //or rax, rdx

    //0x50,                           //push rax

    //we're gonna load the four floats into the xmm1 register! (because xmm0 holds the scalar value)
    //since i pushed it (rdx) to the stack earlier lets read it
    0x48, 0x8b, 0x54, 0x24, 0x28,   //mov rdx, [rsp+0x28] (rsp+40) ; we're adding 0x28 here since i allocated 0x20 bytes of stack space + the dummy push for QPC (8 bytes)
    0x0f, 0x28, 0x0a,               //movaps xmm1, [rdx]           ; we're using movaps here because i think we can assume that javascript will put the array buffer memory on a 16 byte boundary (this is just an assumption lol)
    //hmm do i really have to dereference for movss (i think so lol)
    //i'm gonna push the scalar value (rcx) to the stack so i can dereference it for movss
    //0x51,                         //push rcx
    //0xf3, 0x0f, 0x10, 0x0c, 0x24, //movss xmm1, DWORD PTR [rsp]
    //0x59,                         //pop rcx (so we don't fuck shit up when we return from this function)
    
    //ok now since im passing scalar as a float, it is already in xmm0 (since it's the first parameter)
    
    0x0f, 0xc6, 0xc0, 0x00,         //shufps xmm0, xmm0, 0x0         ; write the scalar into each 32 byte section of xmm0 (so it adds the scalar to each float in xmm1)
    0x0f, 0x58, 0xc8,               //addps xmm1, xmm0               ; add xmm0 to xmm1
    0x0f, 0x29, 0x0a,               //movaps XMMWORD PTR [rdx], xmm1 ; write the result back to rdx
    
    //0x0f, 0xae, 0xe8,               //lfence
    //0x0f, 0x31,                     //rdtsc
    //0x48, 0xc1, 0xe2, 0x20,         //shl rdx, 0x20 (32)
    //0x48, 0x09, 0xd0,               //or rax, rdx
    // 0x5a,                           //pop rdx
    // 0x48, 0x29, 0xd0,               //sub rax, rdx
    0x57,                           //push rdi (dummy)
    0x48, 0xb8, ...int64_to_little_endian_hex(LPQueryPerformanceCounter), //movabs rax, QueryPerformanceCounter
    0x48, 0x8d, 0x0c, 0x24,         //lea rcx, [rsp] ; im using lea instead of move here because it just feels right ok
    0x48, 0x83, 0xec, 0x20,         //sub rsp, 0x32  ; now that we've subtracted rsp the LARGE_INTEGER that QueryPerformanceCounter writes to is at [rsp+32]

    0xff, 0xd0,                     //call rax (QueryPerformanceCounter)(OUT ULONGLONG* rcx)
    0x48, 0x83, 0xc4, 0x20,         //add rsp, 0x20 (32) ; i add 0x20 here so i can easily pop the timestamp from the stack
    //rsp now points to the latest time stamp
    //rsp+40 points to the earlier time stamp
    //0x48, 0x8b, 0x04, 0x24,         //mov rax, [rsp]
    //oh wait i can just pop that lol
    0x58,                           //pop rax (since rsp points to the latest time stamp)
    //now that i popped the value, the earlier time stamp is now at rsp+32 (0x20)
    0x48, 0x8b, 0x4c, 0x24, 0x20,   //mov rcx, [rsp+0x20] (32)
    0x48, 0x29, 0xc8,               //sub rax, rcx
    //rax now holds the difference in time :)

    //0xcc,

    //we add 48 to rsp since i subtracted 32 for the shadow space of the first QueryPerformanceCounter call + 8 bytes because of pushing rdi + 8 bytes because of pushing rdx
    0x48, 0x83, 0xc4, 0x30,         //add rsp, 0x30 (48)
    0x5d,                           //pop rbp
    0xc3                            //ret
]);

const FORLOOP = new Uint8Array([
    //0xcc,
        //damn since we call QueryPerformanceCounter we need the prolog
    0x55,                           //push rbp
    0x48, 0x89, 0xe5,               //mov rbp, rsp
    
    //oh dang it now that i call query performance counter i neede to save rdx
    0x52,                           //push rdx

    //ok nevermind lol im gonna use QueryPerformanceCounter since (allegedly) rdtsc's accuracy is kinda washed https://en.wikipedia.org/wiki/Time_Stamp_Counter
    //we need to push some dummy data to the stack so QueryPerformanceCounter can populate it
    0x57,                           //push rdi (dummy)
    0x48, 0xb8, ...int64_to_little_endian_hex(LPQueryPerformanceCounter), //movabs rax, QueryPerformanceCounter
    0x48, 0x8d, 0x0c, 0x24,         //lea rcx, [rsp] (im using lea instead of move here because it just feels right ok)
    0x48, 0x83, 0xec, 0x20,         //sub rsp, 0x32 (now that we've subtracted rsp the LARGE_INTEGER that QueryPerformanceCounter writes to is at [rsp+32])

    0xff, 0xd0,                     //call rax (QueryPerformanceCounter)

    //since i pushed it to the stack earlier lets read it
    0x48, 0x8b, 0x54, 0x24, 0x28,   //mov rdx, [rsp+0x28] (rsp+40)

    0x4d, 0x31, 0xc0,                                       //xor r8, r8
    0xf3, 0x42, 0x0f, 0x10, 0x0c, 0x82,                     //movss xmm1, DWORD PTR [rdx+r8*4]         ;dereference rdx (rect struct) + r8 (loop index) * 4 (sizeof float)
    0xf3, 0x0f, 0x58, 0xc8,                                 //addss xmm1, xmm0                          ;add le value
    0xf3, 0x42, 0x0f, 0x11, 0x0c, 0x82,                     //movss DWORD PTR [rdx+r8*4], xmm1         ;put that shit back in the struct
    0x49, 0xff, 0xc0,                                       //inc r8
    0x49, 0x83, 0xf8, 0x04,                                 //cmp r8, 0x4 (4)
    //UINT32 TO LITTLE ENDIAN HEX HERE!!!
    0x0f, 0x85, ...uint32_to_little_endian_hex(-29),        //jne rel32                                 ;when using an immediate for any jmp, it's relative 
    
    0x57,                           //push rdi (dummy)
    0x48, 0xb8, ...int64_to_little_endian_hex(LPQueryPerformanceCounter), //movabs rax, QueryPerformanceCounter
    0x48, 0x8d, 0x0c, 0x24,         //lea rcx, [rsp] (im using lea instead of move here because it just feels right ok)
    0x48, 0x83, 0xec, 0x20,         //sub rsp, 0x20 (now that we've subtracted rsp the LARGE_INTEGER that QueryPerformanceCounter writes to is at [rsp+32])

    0xff, 0xd0,                     //call rax (QueryPerformanceCounter)
    0x48, 0x83, 0xc4, 0x20,         //add rsp, 0x20 (32)
    //rsp now points to the lastest time stamp
    //rsp+40 points to the earlier time stamp
    //0x48, 0x8b, 0x04, 0x24,         //mov rax, [rsp]
    //oh wait i can just pop that lol
    0x58,                           //pop rax (since rsp points to the lastest time stamp)
    0x48, 0x8b, 0x4c, 0x24, 0x20,   //mov rcx, [rsp+0x20] (32)
    0x48, 0x29, 0xc8,               //sub rax, rcx
    //rax now holds the difference :)

    //0xcc,
//0000002BAF4FE578
    //we add 48 to rsp since i subtracted 32 for the shadow space of the first QueryPerformanceCounter call + 8 bytes because of pushing rdi + 8 bytes because of pushing rdx
    0x48, 0x83, 0xc4, 0x30,         //add rsp, 0x30 (48)
    0x5d,                           //pop rbp
    0xc3                            //ret

    //scalar must be a float when used with addps to make sure it actually works lol as a float lol
]);

//const benchmark = __asm(, 2, [scalar, PointerFromArrayBuffer(r.data)], [VAR_FLOAT, VAR_INT], RETURN_NUMBER);

function benchmark(asm, r, name) {
    //print("BEGIN!");
    const ptr = PointerFromArrayBuffer(asm);
    
    //old is the previous memory protection flags
    const old = VirtualProtect(ptr, asm.byteLength, PAGE_EXECUTE_READWRITE);
    
    //apparently when changing code in memory you are supposed to use FlushInstructionCache but i might not have to because im not CHANGING code im making it (lowkey don't trust me on that)
    //FlushInstructionCache(hInstance, ptr, asm.byteLength); //im not sure if hInstance is also a valid process handle (use the value returned from GetCurrentProcess instead of using hInstance bruh!)
    
    const iterations = 100000;
    let average = 0;
    
    //const start = Date.now();
    for(let i = 0; i < iterations; i++) {
                                                                            //scalar must be a float when used with addps to make sure it actually works lol as a float lol (note that i don't do this with d2dvtablehijack because i can't pass any custom parameters, i just hardcode the scalar value as an integer and convert it to a float)
        const res = Call(ptr, 2, [scalar, PointerFromArrayBuffer(r.data)], [VAR_FLOAT, VAR_INT], RETURN_NUMBER);

        //print(res);
        average += res;
    }
    //print(`END! (${Date.now()-start}ms!)`);
    //divide by 10000000 to get seconds
    //print(r.left, r.top, r.right, r.bottom);
    print(name,(average/iterations)); //, average/iterations);

    VirtualProtect(ptr, asm.byteLength, old); //just in case
}

benchmark(FORLOOP, r, "For loop:");

r = new Region(1, 2, 3, 4);
//r.left = 1;
//r.top = 2;
//r.right = 3;
//r.bottom = 4;

//print(r);

//Sleep(1000);

benchmark(SIMD, r, "Single instruction multiple data:");

//ok thank god i was about to be mad if the single instruction version wasn't as good but i've run it like 10 times and the single instruction average duration was always lower than the for loop's average

// const b = __asm(FORLOOP, 2, [scalar, PointerFromArrayBuffer(r.data)], [VAR_FLOAT, VAR_INT], RETURN_NUMBER);
// print(b, "b");

//print(r);
//print(r);
//print(benchmark, benchmark/10000000);