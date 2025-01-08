#include <windows.h>
#include <iostream>
#include <comdef.h>

using namespace std;

#define print(msg) cout << msg << endl

class Base { //16 bytes? (oh i was right the vtptr is only 8 and v is 4) the padding made it 16
public:
    //hidden __vtptr   8 bytes
    int v = NULL; //   4 bytes
    Base(int a) : v(a) {};
    ~Base() {};
    virtual void __stdcall doshit() { //i changed these to __stdcall because i think all of the virtual d2d functions use __stdcall so i was trying to get as close as possible (nothing changed though when i added it)
        DebugBreak();
        print(this->v);
    }
    virtual void __stdcall doshit1(int r) { //i had to make this function because i realized passing parameters for some reason made it more complicated
        DebugBreak();
        print(this->v << " passed: " << r);
    }
};

class Derived : public Base {
public:
    Derived(int a) : Base(a) {};
    ~Derived() {};
    void __stdcall doshit() {
        DebugBreak();
        print("derived " << this->v);
    }
    void __stdcall doshit1(int r) {
        DebugBreak();
        print("derived " << this->v << " also: " << r);
    }
};

//typedefs so i can call the asm code without ffi
typedef void (asmexec)(LONG_PTR); //, LONG_PTR);
typedef void (asmexec1)(LONG_PTR, int);

//template <class T>
//T __asmcall()
void __asmcall(LONG_PTR thisptr, LONG_PTR vtablefunc) {
    //BYTE code[] = {
    //    0xcc,                //interrupt (dbugbreak)
    //    0x55,                //push rbp
    //    0x48, 0x89, 0xe5,    //mov rbp, rsp
    //    0xff, 0xd2,          //call rdx  (i guess idk if i havve to dereference the pointer i want to call)
    //    0x5d,                //pop rbp
    //    0xc3                 //ret
    //};

    BYTE* vti = (BYTE*)&vtablefunc; //im getting the address of the pointer to the vtablefunc so that i can turn it into a byte array so i can put each value into the assembly code as an immediate for movabs (equivalent to jbs marshallib's ...int64_to_little_endian_hex(&vtablefunc))
    print((LONG_PTR)&vtablefunc);

    //i guess i could've made this a stack variable and gotten the pointer to it that way but whatever lol
    BYTE* $RBP = (BYTE*)new ULONG_PTR{0};//malloc(sizeof(ULONG_PTR)); //$RBP is a pointer to 8 bytes of data (a ULONG_PTR)
    BYTE* $RBP_PTR = (BYTE*) & $RBP; //doing the same thing that i did with vti here so i can put the pointer in the asm code as an immediate64

    //what i actually do in ffid2d.js (minus the part where i store what's pointed to at RSP because for some reason i only had that problem in JBS (maybe it was just the d2d functions that did that))
    BYTE code[] = {
        0xcc,                   //interrupt (dbugbreak)

        //0x55,                 //push rbp
        //0x48, 0x89, 0xe5,     //mov rbp, rsp

        0x48, 0xb8, $RBP_PTR[0], $RBP_PTR[1], $RBP_PTR[2], $RBP_PTR[3], $RBP_PTR[4], $RBP_PTR[5], $RBP_PTR[6], $RBP_PTR[7],         //movabs rax, imm64
        0x48, 0x89, 0x28,       //mov QWORD PTR [rax], rbp
        0xc8, 0x00, 0x00, 0x00, //enter 0x0, 0x0
        0x48, 0xb8, vti[0], vti[1], vti[2], vti[3], vti[4], vti[5], vti[6], vti[7],         //movabs rax, imm64
        0xff, 0xd0,             //call rax  (i guess idk if i havve to dereference the pointer i want to call)

        //0x5d,                 //pop rbp (wait what should rbp be??)
        //0x58,                 //pop rax (um it says the default calling convention is __cdecl and that the calling function cleans the stack (or like pops arguments from the stack idk))
        //0x58,                 //pop rax

        0xc9,                   //leave

        //0x48, 0xbd, $RBP[0], $RBP[1], $RBP[2], $RBP[3], $RBP[4], $RBP[5], $RBP[6], $RBP[7], //movabs rbp, imm64
        //kinda dangerous but
        //0x50,                 //push rax
        //nah fuck that i could just use rcx now because im not calling the method anymore!

        0x48, 0xb9, $RBP_PTR[0], $RBP_PTR[1], $RBP_PTR[2], $RBP_PTR[3], $RBP_PTR[4], $RBP_PTR[5], $RBP_PTR[6], $RBP_PTR[7],         //movabs rcx, imm64
        0x48, 0x8b, 0x29,       //mov rbp, QWORD PTR [rcx]

        //0x58,                 //pop rax
        0xc3                    //ret
    };
    //print(sizeof(code) << " 9 right? (DDOS niggas)");
    asmexec1* exec = (asmexec1*)VirtualAlloc(NULL, sizeof(code), MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE); //using VirtualAlloc so i can make a chunk of memory for code and execute it with the PAGE_EXECUTE_READWRITE protection flag
    //derivedasmexec* exec = (derivedasmexec*)VirtualAlloc(NULL, sizeof(code), MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
    memcpy(exec, &code, sizeof(code));
    exec(thisptr, 21); //call!
    delete $RBP; //don't forget.
    BOOL success = VirtualFree((void*)exec, 0, MEM_RELEASE); //free le mem and make sure it worked
    DWORD g = GetLastError();
    _com_error err(g);
    print(success << " 1 right :) " << g << " " << err.ErrorMessage());

    //hold on it would be really funny if i could change the stack's protection
    //ok it wouldn't let me reset the protection and the stack was FUCKED (actually the stack might've been fucked because my asm code was wrong lol i should retry this method)
    //DWORD oldp = NULL;
    //BOOL success = VirtualProtect(&code, sizeof(code), PAGE_EXECUTE_READWRITE, &oldp);
    //print(success << " " << oldp);
    //asmexec* exec = (asmexec*)&code;
    //exec(thisptr, vtablefunc); //this is some GENUINE BULLSHIT
    //DWORD oldp2 = NULL;
    //success = VirtualProtect(&code, sizeof(code), oldp, &oldp2); //VirtualProtect apparently fails if the fourth argument is NULL :(
    //print(success);
}

int main() {
    //Base b{ 5 };
    //print("sizeof(Base): " << sizeof(Base));
    //DWORD* rngdata = (DWORD*)&b;
    //void (Base:: * ptr)() = &Base::doshit;
    ////(b.*ptr)();
    //__asmcall((LONG_PTR) &b, **(LONG_PTR**)&b); //lmao

    Base* d = new Derived(5);
    print("sizeof(\"Base\"): " << sizeof(*d));
    DWORD* rngdata = (DWORD*)d;
    d->doshit1(21); //a test to see how the disassembly looks when calling it normally (not very interesting lol)
    __asmcall((LONG_PTR)d, (*(LONG_PTR**)d)[1]);
    for (DWORD i = 0; i < sizeof(*d) / 4; i++) {
        print(rngdata[i]);
    }
    print("real data? " << d->v);
    delete d;
    return 0;
}