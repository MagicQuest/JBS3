//ok lmao i made this file then immediately realized that idk how i'll actually do this
//i wanted to use ffi to make a d2d1 factory but im not sure HOW i'll actually execute the functions of the pointer to an ID2D1Factory7 object
//lets try anyways
//when i started making this i actually thought it was impossible but im pretty surprised i was able to make it work  https://blog.holbertonschool.com/hack-virtual-memory-stack-registers-assembly-code/    https://stackoverflow.com/questions/22263890/virtual-table-layout-on-msvc-wheres-the-type-info
//i would've done this kind of thing sooner if i had thought this was possible because i didn't want to make the opencvhelper dll (seriously i genuinely thought there was no way because it SEEMED like objects didn't even store methods on them (we outa methods) (i guess i was slacking on my vtable knowledge idk))

//what i use to generate the assembly bytes is: https://defuse.ca/online-x86-assembler.htm#disassembly (make sure to use x64 tho)

//im including a test file i made in c++ to figure how exactly i could call an object's method in asm (inheritanceandthevtptr.cpp)

//one problem with the GenericPtrObject is that you can't call specific overloaded versions of a method you can only call the latest overload (i guess it wouldn't be that hard to change that but it wouldn't be that intuahtive)

//it seems like im really lucky that (most?) COM objects don't use multiple inheritance because it starts getting weird -> https://www.openrce.org/articles/full_view/23

//just in case i want to get a little more serious... https://blog.quarkslab.com/visual-c-rtti-inspection.html    https://www.blackhat.com/presentations/bh-dc-07/Sabanal_Yason/Presentation/bh-dc-07-Sabanal_Yason.pdf    https://www.openrce.org/articles/full_view/23    https://devblogs.microsoft.com/oldnewthing/20150320-00/?p=44423    https://blog.quarkslab.com/resources/2013-07-12_visualcpp-rtti-inspection/scripts/parse-rtti.zip

eval(require("fs").read(__dirname+"/marshallib.js"));
eval(require("fs").read(__dirname+"/ffigetexportedfunctions.js")); //for some reason if i want this one to work i gotta "import" it after marshallib.js

const D2D1_FACTORY_TYPE_SINGLE_THREADED = 0;
const D2D1_FACTORY_TYPE_MULTI_THREADED = 1;

class GUID extends memoobjectidk {
    static types = {
        Data1: "ULONG",
        Data2: "USHORT",
        Data3: "USHORT",
        Data4: "UCHAR",
    };
    static arrayLengths = {
        Data4: 8,
    };
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

class ULONG_PTR extends memoobjectidk {
    static types = {
        value: "ULONG_PTR",
    };
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

const D2D1_RENDER_TARGET_TYPE_DEFAULT = 0; //d2d1.h (line 783)
const D2D1_RENDER_TARGET_TYPE_SOFTWARE = 1;
const D2D1_RENDER_TARGET_TYPE_HARDWARE = 2;

const D3D_FEATURE_LEVEL_9_1 = 0x9100; //d3dcommon.h (line 98)
const D3D_FEATURE_LEVEL_10_0 = 0xa000; //d3dcommon.h (line 101)

const D2D1_FEATURE_LEVEL_DEFAULT = 0; //d2d1.h (line 809)
const D2D1_FEATURE_LEVEL_9 = D3D_FEATURE_LEVEL_9_1;
const D2D1_FEATURE_LEVEL_10 = D3D_FEATURE_LEVEL_10_0;

const D2D1_RENDER_TARGET_USAGE_NONE = 0; //d2d1.h (line 836)
const D2D1_RENDER_TARGET_USAGE_FORCE_BITMAP_REMOTING = 1;
const D2D1_RENDER_TARGET_USAGE_GDI_COMPATIBLE = 2;

const D2D1_PRESENT_OPTIONS_NONE = 0; //d2d1.h (line 861)
const D2D1_PRESENT_OPTIONS_RETAIN_CONTENTS = 1;
const D2D1_PRESENT_OPTIONS_IMMEDIATELY = 2;

class D2D1_PIXEL_FORMAT extends memoobjectidk {
    static types = {
        format: "DWORD", //DXGI_FORMAT enum
        alphaMode: "DWORD", //D2D1_ALPHA_MODE enum
    };
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

class D2D1_RENDER_TARGET_PROPERTIES extends memoobjectidk {
    static types = {
        type: "DWORD", //actual type is the D2D1_RENDER_TARGET_TYPE enum (but it's basically a dword dawg)
        pixelFormat: D2D1_PIXEL_FORMAT,
        dpiX: "FLOAT", //this value is actually a FLOAT!!!!! (i have almost ZERO idea on how floats work so im for sure not adding the float type to marshallib today)
        dpiY: "FLOAT", //FLOAT!!!!!
        usage: "DWORD", //D2D1_RENDER_TARGET_USAGE enum
        minLevel: "DWORD", //D2D1_FEATURE_LEVEL enum
    };
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

class D2D1_SIZE_U extends memoobjectidk {
    static types = {
        width: "UINT",
        height: "UINT",
    };
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

class D2D1_HWND_RENDER_TARGET_PROPERTIES extends memoobjectidk {
    static types = {
        hwnd: "HWND",
        pixelSize: D2D1_SIZE_U,
        presentOptions: "DWORD", //D2D1_PRESENT_OPTIONS enum
    }
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

class D2D1_COLOR_F extends memoobjectidk {
    static types = {
        r: "FLOAT",
        g: "FLOAT",
        b: "FLOAT",
        a: "FLOAT",
    };
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

class D2D1_RECT_F extends memoobjectidk {
    static types = {
        left: "FLOAT",
        top: "FLOAT",
        right: "FLOAT",
        bottom: "FLOAT",
    }
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

//const IID_ID2D1Factory7 = new GUID(new Uint8Array(GUID.sizeof())); //bdc2bdd3-b96c-4de6-bdf7-99d4745454de (line 1765 of d2d1_3.h)
//IID_ID2D1Factory7.Data1 = 0xbdc2bdd3;
//IID_ID2D1Factory7.Data2 = 0xb96c;
//IID_ID2D1Factory7.Data3 = 0x4de6;
//IID_ID2D1Factory7.Data4[0] = 0xbd;
//IID_ID2D1Factory7.Data4[1] = 0xf7;
//IID_ID2D1Factory7.Data4[2] = 0x99;
//IID_ID2D1Factory7.Data4[3] = 0xd4;
//IID_ID2D1Factory7.Data4[4] = 0x74;
//IID_ID2D1Factory7.Data4[5] = 0x54;
//IID_ID2D1Factory7.Data4[6] = 0x54;
//IID_ID2D1Factory7.Data4[7] = 0xde;

//now you can do it all in one line!
const IID_ID2D1Factory7 = new GUID(0xbdc2bdd3, 0xb96c, 0x4de6, 0xbd, 0xf7, 0x99, 0xd4, 0x74, 0x54, 0x54, 0xde); //basically equivalent to the above code but maybe 1% faster?

print(IID_ID2D1Factory7);

let w = 500;
let h = 500;

let lib;

const __vtptr_IUnknown = [ //Unknwnbase.h (line 117)
    "QueryInterface",
    "AddRef",
    "Release",
];

const __vtptr_ID2D1Resource = [ //d2d1.h (line 1082)
    ...__vtptr_IUnknown, //I FORGOT!!! (the way i realized that something was messed up was when i tried to call ID2D1HwndRenderTarget::CreateSolidColorBrush and it kept crashing with an access violation and when i looked at the call stack it was trying to call the wrong function! it was off by 3 names in the vtable (because i forgot to include IUnknown's 3 methods))
    "GetFactory",
];

const __vtptr_ID2D1Factory = [ //d2d1.h (line 3341)
    ...__vtptr_IUnknown, //extends (no Array.from since im not modifying just spread (which i guess is kind of a shallow copy))
    "ReloadSystemMetrics",
    "GetDesktopDpi",
    "CreateRectangleGeometry",
    "CreateRoundedRectangleGeometry",
    "CreateEllipseGeometry",
    "CreateGeometryGroup",
    "CreateTransformedGeometry",
    "CreatePathGeometry",
    "CreateStrokeStyle",
    "CreateDrawingStateBlock",
    "CreateWicBitmapRenderTarget",
    "CreateHwndRenderTarget",
    "CreateDxgiSurfaceRenderTarget",
    "CreateDCRenderTarget",
];

const __vtptr_ID2D1Factory1 = [ //d2d1_1.h (line 2223)
    ...__vtptr_ID2D1Factory, //extends
    "CreateDevice",
    "CreateStrokeStyle",
    "CreatePathGeometry",
    "CreateDrawingStateBlock",
    "CreateGdiMetafile",
    "RegisterEffectFromStream",
    "RegisterEffectFromString",
    "UnregisterEffect",
    "GetRegisteredEffects",
    "GetEffectProperties",
];

const __vtptr_ID2D1Factory2 = [ //d2d1_2.h (line 130)
    ...__vtptr_ID2D1Factory1,
    "CreateDevice",
];

const __vtptr_ID2D1Factory3 = [ //d2d1_3.h (line 1000)
    ...__vtptr_ID2D1Factory2,
    "CreateDevice",
];

const __vtptr_ID2D1Factory4 = [ //d2d1_3.h (line 1213)
    ...__vtptr_ID2D1Factory3,
    "CreateDevice",
];

const __vtptr_ID2D1Factory5 = [ //d2d1_3.h (line 1524)
    ...__vtptr_ID2D1Factory4,
    "CreateDevice",
];

const __vtptr_ID2D1Factory6 = [ //d2d1_3.h (line 1681)
    ...__vtptr_ID2D1Factory5,
    "CreateDevice",
];

const __vtptr_ID2D1Factory7 = [ //d2d1_3.h (line 1765)
    ...__vtptr_ID2D1Factory6,
    "CreateDevice",
];

const __vtptr_ID2D1Factory8 = [ //d2d1_3.h (line 1865)
    ...__vtptr_ID2D1Factory7,
    "CreateDevice",
];

const __vtptr_ID2D1RenderTarget = [ //d2d1.h (line 2392)
    ...__vtptr_ID2D1Resource,
    "CreateBitmap",
    "CreateBitmapFromWicBitmap",
    "CreateSharedBitmap",
    "CreateBitmapBrush",
    "CreateSolidColorBrush",
    "CreateGradientStopCollection",
    "CreateLinearGradientBrush",
    "CreateRadialGradientBrush",
    "CreateCompatibleRenderTarget",
    "CreateLayer",
    "CreateMesh",
    "DrawLine",
    "DrawRectangle",
    "FillRectangle",
    "DrawRoundedRectangle",
    "FillRoundedRectangle",
    "DrawEllipse",
    "FillEllipse",
    "DrawGeometry",
    "FillGeometry",
    "FillMesh",
    "FillOpacityMask",
    "DrawBitmap",
    "DrawText",
    "DrawTextLayout",
    "DrawGlyphRun",
    "SetTransform",
    "GetTransform",
    "SetAntialiasMode",
    "GetAntialiasMode",
    "SetTextAntialiasMode",
    "GetTextAntialiasMode",
    "SetTextRenderingParams",
    "GetTextRenderingParams",
    "SetTags",
    "GetTags",
    "PushLayer",
    "PopLayer",
    "Flush",
    "SaveDrawingState",
    "RestoreDrawingState",
    "PushAxisAlignedClip",
    "PopAxisAlignedClip",
    "Clear",
    "BeginDraw",
    "EndDraw",
    "GetPixelFormat",
    "SetDpi",
    "GetDpi",
    "GetSize",
    "GetPixelSize",
    "GetMaximumBitmapSize",
    "IsSupported",
];

const __vtptr_ID2D1HwndRenderTarget = [ //d2d1.h (line 3262)
    ...__vtptr_ID2D1RenderTarget,
    "CheckWindowState",
    "Resize",
    "GetHwnd",
];

const __vtptr_ID2D1Brush = [ //d2d1.h (line 1190)
    ...__vtptr_ID2D1Resource,
    "SetOpacity",
    "SetTransform",
    "GetOpacity",
    "GetTransform",
];

const __vtptr_ID2D1SolidColorBrush = [ //d2d1.h (line 1279)
    "SetColor",
    "GetColor",
];

//class __vtptr_IUnknown {
//    static table = [
//        "QueryInterface",
//        "AddRef",
//        "Release",
//    ];
//}
//
//class __vtptr_ID2D1Factory extends __vtptr_IUnknown {
//    static table = [
//        ...Array.from(super.table),
//        "ReloadSystemMetrics",
//        "CreateRectangleGeometry",
//        "CreateRoundedRectangleGeometry",
//        "CreateEllipseGeometry",
//        "CreateGeometryGroup",
//        "CreateTransformedGeometry",
//        "CreatePathGeometry",
//        "CreateStrokeStyle",
//        "CreateDrawingStateBlock",
//        "CreateWicBitmapRenderTarget",
//        "CreateHwndRenderTarget",
//        "CreateDxgiSurfaceRenderTarget",
//        "CreateDCRenderTarget",
//    ];
//}

//ooooooouuuuuhhhh we might have to do some asm dereference
function dereferenceULONG_PTR(ptr, index = 0) { //returns *(ULONG_PTR*)ptr
    print("dereferencing", ptr+(index*sizeof["ULONG_PTR"]));
    if(ptr == 0) {
        print("dereferencing NULL ptr!\x07");
        return 0;
    }
    return __asm([
        0x48, 0x8b, 0x01,   //mov rax, QWORD PTR [rcx]      ;remember, rcx is the first integer parameter and rax is the return value register (for x64 windows https://learn.microsoft.com/en-us/cpp/build/x64-software-conventions?view=msvc-170)
        0xc3,               //ret
    ], 1, [ptr+(index*sizeof["ULONG_PTR"])], [VAR_INT], RETURN_NUMBER);
}

class GenericPtrObject { //lowkey i guess there's really no need to extend this object (you could just make the vtablenames a constructor argument and set it as a property of GenericPtrObject)
    constructor(ptr) {
        this.ptr = ptr;
        this.__vtptr = dereferenceULONG_PTR(ptr, 0);
    }

    findMethodAddressByName(vtablenames, name) {
        //well since this is an ID2D1Factory7 we'll (obviously) use that vtable array
        //to find the pointer to the specific method we'll iterate backwards through __vtptr_ID2D1Factory7 until we find the method name we're looking for
        //with the index of the found method name we'll dereference __vtptr at that index (i guess idk how to explain it you'll see)
        //we're gonna loop through it backwards though because the latest redefinition would be the one to be called (what im trying to say here is that if IUnknown had a method named Increment and ID2D1Factory6 overloaded that with its own Increment function i would want to find the pointer to ID2D1Factory6's implementation because it's the latest)
        for(let i = vtablenames.length-1; i >= 0; i--) {
            const method = vtablenames[i];
            //print(method, vtablenames == name, i);
            if(method == name) {
                print(i, "mony for fun", name);
                return dereferenceULONG_PTR(this.__vtptr, i);
            }
        }
    }

    callMethodByName(methodptr, argc = 0, argv = [], argtypev = [], returntype = RETURN_NUMBER) {
        //const methodptr = this.findMethodAddressByName(vtablenames, name);

        //const RBPHOLDER = new ULONG_PTR(); //unsigned long long
        //const RSPPOINTERHOLDER = new ULONG_PTR(); //unsigned long long

        //hmmm d2d functions use __stdcall...
        //hmmmm https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/x64-architecture#calling-conventions

        //ok this asm code was written for my test project in c++ (inheritanceandthevtptr.cpp) and the method i was calling was void but this time it could be anything so im MOVABS-ing the method pointer as an immediate value to be passed into CALL because you can't CALL an absolute immediate 64 bit value
        //ok a HUGE problem i've been having is that for some reason when you try to call a method with parameters it works but the RBP register is messed up once you leave the function (the pop doesn't return the same value) so we get an access violation like just after the method is called
        //so to fix this problem im gonna actually write down what rbp was before and then get it again
        //ok ANOTHER thing that's going wrong is that for some reason right after the call instruction rsp+8 keeps pointing to 0 (which could mean rsp gets changed or something keeps clearing it) and so after the leave instruction (leave pops rbp which adds 8 to rsp) when i use RET, it dereferences rsp to transfer control back to the caller (libffi's ffi_call_win64 (because i use JBS' Call function to run the asm code)) and i get an access violation
        //https://stackoverflow.com/questions/20129107/what-is-the-x86-ret-instruction-equivalent-to    https://stackoverflow.com/questions/62364368/what-is-the-difference-between-the-ret-instruction-in-x86-and-x64?rq=3
        //ok i might have to copy what rsp points to too
        //ngl this solution took like 2 days to cook up
        //ok i 100% comprehend the issue now i swear: for some reason after i call the method, the values at rsp through rsp+8
        //i think the fact that i have to call my asm code makes this a little more complicated
        /*return __asm([ //im not gonna lie i don't think i know enough about asm to solve this in the "correct" way so im just doing what i think is gonna work
            //0xcc,                                                                             //interrupt (dbugbreak for testing)

            //store the value of rbp since for some reason this technique doesn't pop the correct value at the end...
            0x48, 0xb8, ...int64_to_little_endian_hex(PointerFromArrayBuffer(RBPHOLDER.data)),  //movabs rax, imm64 (pointer to RBPHOLDER)
            0x48, 0x89, 0x28,                                                                   //mov QWORD PTR [rax], rbp  (dereference rax and place rbp's value into it)
            0x48, 0xb8, ...int64_to_little_endian_hex(PointerFromArrayBuffer(RSPPOINTERHOLDER.data)), //movabs rax, imm64 (pointer to RSPPOINTERHOLDER)
            //oh fuck i gotta use another register here... (lets try using r10 because technically it's volatile...) (i guess i could push and pop a random register but i no wanna)
            0x4c, 0x8b, 0x14, 0x24,                                                             //mov r10, QWORD PTR [rsp]
            0x4c, 0x89, 0x10,                                                                   //mov QWORD PTR [rax], r10
            
            0xc8, 0x00, 0x00, 0x00,                                                             //enter 0, 0 (https://stackoverflow.com/questions/5858996/enter-and-leave-in-assembly)
            0x48, 0x83, 0xec, 0x20,                                                             //sub rsp, 0x20 (32) 
            0x48, 0xb8, ...int64_to_little_endian_hex(methodptr),                               //movabs rax, ...imm64 (https://www.reddit.com/r/Assembly_language/comments/141bi1i/comment/jmz6z2y/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button)
            0xff, 0xd0,                                                                         //call rax
            //for some reason after calling rax it clears the top of the stack ([rsp])
            0xc9,                                                                               //leave

            0x48, 0xb9, ...int64_to_little_endian_hex(PointerFromArrayBuffer(RSPPOINTERHOLDER.data)), //movabs rcx, imm64
            0x4c, 0x8b, 0x11,                                                                   //mov r10, QWORD PTR [rcx]
            0x4c, 0x89, 0x14, 0x24,                                                             //mov QWORD PTR [rsp], r10

            //im using rcx here instead of rax because rax is the return value register and i want to return the correct value lol
            //plus rcx is a free register here since it's used as the first integer parameter and i don't need it to be anything specific anymore since i've already done what i needed to
            0x48, 0xb9, ...int64_to_little_endian_hex(PointerFromArrayBuffer(RBPHOLDER.data)),  //movabs rcx, imm64 (pointer to RBPHOLDER)
            0x48, 0x8b, 0x29, //movabs rbp, QWORD PTR [rcx] (dereference rcx and place the QWORD (long long 8 byte) value into rbp)
            0xc3,                                                                               //ret
        ], argc+1, [this.ptr, ...argv], [VAR_INT, ...argtypev], returntype);*/
        //return __asm([ //for some reason this worked in inheritanceandthevtptr but it's NOT working here...
        //    0xcc,                                                                             //interrupt (dbugbreak for testing)
        //    0x48, 0xb8, ...int64_to_little_endian_hex(methodptr),                             //movabs rax, ...imm64 (https://www.reddit.com/r/Assembly_language/comments/141bi1i/comment/jmz6z2y/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button)
        //    0xff, 0xe0,                                                                       //jmp rax
        //]);
        
        //I SEE WITH THE EYES WIDE OPEN (i've actually taken the time to understand the stack and the x64 calling convention)
        //i think all of my problems were caused by not knowing that the default calling convention for x64 on windows is entirely described at https://learn.microsoft.com/en-us/cpp/build/x64-calling-convention?view=msvc-170 (this page confused me because it doesn't seem to give this convention a name and i thought when the docs said __cdecl was the default, it was the default for x64 too!)
        //infact, almost every calling convention is just ignored on x64!
        //this page describes the shadow space (which would have solved my stack issues and would\ve eliminate the need for the RBP & RSPPOINTER HOLDER js variables) and the fact that rsp MUST be on a 16 byte boundary (which i also had 0 idea about)
        //so lets try to rewrite this so it actually works like normal code
        return __asm([ //im not gonna lie i can't believe it was this easy (this literally took only took 5 minutes to write)
            //0xcc,                                                                             //int 3

            //standard prolog you already know
            0x55,                                                                               //push rbp      //rsp now aligned to 16 byte boundary (https://www.reddit.com/r/Assembly_language/comments/10zpojy/comment/j851mbv/)
            0x48, 0x89, 0xe5,                                                                   //mov rbp, rsp
            
            //shadow space for the call (stated on the x64 calling convention page but it was kinda vague so im assuming it's 32 bytes)
            //not allocating the shadow space was 99% of the reason why i had to store rbp and rsp in custom js object lmao
            //https://sonictk.github.io/asm_tutorial/#windows:thewindowtothehardware/themicrosoftx64callingconvention/theshadowspace (this section also mentions rsp alignment)
            0x48, 0x83, 0xec, 0x20,                                                             //sub rsp, 0x20 (32)            //rsp still aligned because 32%16 == 0
            
            //using movabs to put the pointer to the method into the asm code (so i don't have to pass it as a parameter)
            0x48, 0xb8, ...int64_to_little_endian_hex(methodptr),                               //movabs rax, ...imm64 (https://www.reddit.com/r/Assembly_language/comments/141bi1i/comment/jmz6z2y/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button)
            
            //call 
            0xff, 0xd0,                                                                         //call rax

            //epilog
            0x48, 0x83, 0xc4, 0x20,                                                             //add rsp, 0x20 (32)
            0x5d,                                                                               //pop rbp
            
            //return :)
            0xc3,                                                                               //ret
        ], argc+1, [this.ptr, ...argv], [VAR_INT, ...argtypev], returntype);
    }
}

//helper class for this shit lmao
class ID2D1Factory7 extends GenericPtrObject {
    constructor(ptr) {
        super(ptr);
    }

    findMethodAddressByName(name) {
        return super.findMethodAddressByName(__vtptr_ID2D1Factory7, name);
    }

    callMethodByName(name, ...args) {
        const methodptr = this.findMethodAddressByName(name);
        return super.callMethodByName(methodptr, ...args);
    }
    /*findMethodAddressByName(name) {
        //well since this is an ID2D1Factory7 we'll (obviously) use that vtable array
        //to find the pointer to the specific method we'll iterate backwards through __vtptr_ID2D1Factory7 until we find the method name we're looking for
        //with the index of the found method name we'll dereference __vtptr at that index (i guess idk how to explain it you'll see)
        //we're gonna loop through it backwards though because the latest redefinition would be the one to be called (what im trying to say here is that if IUnknown had a method named Increment and ID2D1Factory6 overloaded that with its own Increment function i would want to find the pointer to ID2D1Factory6's implementation because it's the latest)
        for(let i = __vtptr_ID2D1Factory7.length-1; i >= 0; i--) {
            const method = __vtptr_ID2D1Factory7[i];
            if(method == name) {
                print(i, "mony for fun");
                return dereferenceULONG_PTR(this.__vtptr, i);
            }
        }
    }

    callMethodByName(name, argc = 0, argv = [], argtypev = [], returntype = RETURN_NUMBER) {
        const methodptr = this.findMethodAddressByName(name);

        //ok this asm code was written for my test project in c++ (inheritanceandthevtptr.cpp) and the method i was calling was void but this time it could be anything so im MOVABS-ing the method pointer as an immediate value to be passed into CALL because you can't CALL an absolute immediate 64 bit value
        return __asm([
            //0xcc,              //interrupt (dbugbreak)

            0x55,                                                  //push rbp
            0x48, 0x89, 0xe5,                                      //mov rbp, rsp
            0x48, 0xb8, ...int64_to_little_endian_hex(methodptr),  //movabs rax, ...__imm64 (https://www.reddit.com/r/Assembly_language/comments/141bi1i/comment/jmz6z2y/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button)
            0xff, 0xd0,                                            //call rax
            0x5d,                                                  //pop rbp
            0xc3                                                   //ret
        ], argc+1, [this.ptr, ...argv], [VAR_INT, ...argtypev], returntype);
    }*/
}

class ID2D1HwndRenderTarget extends GenericPtrObject {
    constructor(ptr) {
        super(ptr);
    }

    findMethodAddressByName(name) {
        return super.findMethodAddressByName(__vtptr_ID2D1HwndRenderTarget, name);
    }

    callMethodByName(name, ...args) {
        const methodptr = this.findMethodAddressByName(name);
        return super.callMethodByName(methodptr, ...args);
    }
}

class ID2D1SolidColorBrush extends GenericPtrObject {
    constructor(ptr) {
        super(ptr);
    }

    findMethodAddressByName(name) {
        return super.findMethodAddressByName(__vtptr_ID2D1SolidColorBrush, name);
    }

    callMethodByName(name, ...args) {
        const methodptr = this.findMethodAddressByName(name);
        return super.callMethodByName(methodptr, ...args);
    }
}

let factory, hwndRenderTarget, colorBrush;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        lib = LoadLibraryEx("d2d1.dll");
        print(GetExportedFunctions(lib));
        const cfpa = GetProcAddress(lib, "D2D1CreateFactory");

        let factoryptr = new ULONG_PTR(); //IID_ID2D1Factory7 is bdc2bdd3-b96c-4de6-bdf7-99d4745454de
        
        print(D2D1_FACTORY_TYPE_SINGLE_THREADED, PointerFromArrayBuffer(IID_ID2D1Factory7.data), NULL, PointerFromArrayBuffer(factoryptr.data));

        //lol it wasn't working because i forgot it was 4 parameters (the 4 parameter version is exported at line 3667 of d2d1.h)
        let hr = Call(cfpa, 4, [D2D1_FACTORY_TYPE_SINGLE_THREADED, PointerFromArrayBuffer(IID_ID2D1Factory7.data), NULL, PointerFromArrayBuffer(factoryptr.data)], [VAR_INT, VAR_INT, VAR_INT, VAR_INT], RETURN_NUMBER);

        if(hr != S_OK) {
            print(hr, _com_error(hr));
        }

        //factory.value MIGHT be a pointer to the ID2D1Factory __vtptr (allegedly msvc sticks it at the start of an object https://www.reddit.com/r/cpp_questions/comments/z55xlh/comment/ixxqw9e/)
        //but really what do you do after that?
        //there's lowkey no way to get any specific function though (like i think you'd actually have to just get lucky)
        //maybe im not locked in enough so we'll see...

        //ok apparently msvc expects the pointer to "this" to be in ECX (https://stackoverflow.com/questions/12194083/visual-c-inline-x86-assembly-accessing-this-pointer  https://learn.microsoft.com/en-us/cpp/cpp/argument-passing-and-naming-conventions?view=msvc-170  https://learn.microsoft.com/en-us/cpp/cpp/thiscall?view=msvc-170)
        //also pretty good -> https://kaisar-haque.blogspot.com/2008/07/c-accessing-virtual-table.html
        //ok i've made an example that can run virtual method on an object so IT'S POSSIBLE... BUT
        //there's still no way to know WHICH function i'm gonna call...
        //OK I THINK I'VE GOT IT BUT IT'S NOT PRETTY

        //we're gonna have to traverse the entire inheritance tree (backwards starting from the base class)
        //i think the vtable is sorted by the methods defined in the base class (and that class's base class and so on)
        //IUnknown -> ID2D1Factory -> ID2D1Factory1 -> ID2D1Factory2 -> ID2D1Factory3 -> ID2D1Factory4 -> ID2D1Factory5 -> ID2D1Factory6 -> ID2D1Factory7
        //so really what im trying to say is the first function in ID2D1Factory7's vtable would be QueryInterface as it's the first virtual function defined in IUnknown

        print(factoryptr.value, factoryptr.data);

        factory = new ID2D1Factory7(factoryptr.value);
        //print(factory, __vtptr_ID2D1Factory7);
        //print(factory.findMethodAddressByName("QueryInterface")); //CORRECT~!
        
        //ok now all that's left between us and drawing is calling CreateHwndRenderTarget and making a brush (renderTarget->CreateSolidColorBrush)
        let rendertargetptr = new ULONG_PTR();

        let properties = new D2D1_RENDER_TARGET_PROPERTIES();
        //default properties
        properties.type = D2D1_RENDER_TARGET_TYPE_DEFAULT;
        properties.pixelFormat.format = DXGI_FORMAT_UNKNOWN; //already defined in jbs
        properties.pixelFormat.alphaMode = D2D1_ALPHA_MODE_UNKNOWN; //already defined in jbs
        properties.dpiX = 0.0;
        properties.dpiY = 0.0;
        properties.usage = D2D1_RENDER_TARGET_USAGE_NONE;
        properties.minLevel = D2D1_FEATURE_LEVEL_DEFAULT;
        print(properties);

        let hwndproperties = new D2D1_HWND_RENDER_TARGET_PROPERTIES();
        hwndproperties.hwnd = hwnd;
        hwndproperties.pixelSize.width = w;
        hwndproperties.pixelSize.height = h;
        hwndproperties.presentOptions = D2D1_PRESENT_OPTIONS_NONE;
        print(hwndproperties);

        //aw damn... it seems like adding parameters messes it up (i gotta research)
        hr = factory.callMethodByName("CreateHwndRenderTarget", 3, [PointerFromArrayBuffer(properties.data), PointerFromArrayBuffer(hwndproperties.data), PointerFromArrayBuffer(rendertargetptr.data)], [VAR_INT, VAR_INT, VAR_INT], RETURN_NUMBER);
        if(hr != S_OK) {
            print(hr, _com_error(hr));
        }

        print("hwndRenderTarget:", rendertargetptr.value);
        
        hwndRenderTarget = new ID2D1HwndRenderTarget(rendertargetptr.value);

        let colorbrushptr = new ULONG_PTR();
        
        let color = new D2D1_COLOR_F(1.0, 0.0, 1.0, 1.0);
        //color.r = 1.0;
        //color.g = 0.0;
        //color.b = 1.0;
        //color.a = 1.0;
        print(color);

        //oops! the legit CreateSolidColorBrush has 3 parameters (d2d1.h line 2439)!
        //a lot of the d2d classes have overloads that handle some parameters for you (these overloads aren't virtual though so they don't show up in the vtable)
        //for example take a look at line 2923 of d2d1.h, it just calls the virtual CreateSolidColorBrush but with NULL (so that's what im gonna do) 
        print([PointerFromArrayBuffer(color.data), NULL, PointerFromArrayBuffer(colorbrushptr.data)]);
        hr = hwndRenderTarget.callMethodByName("CreateSolidColorBrush", 3, [PointerFromArrayBuffer(color.data), NULL, PointerFromArrayBuffer(colorbrushptr.data)], [VAR_INT, VAR_INT, VAR_INT], RETURN_NUMBER);
        if(hr != S_OK) {
            print(hr, _com_error(hr));
        }

        colorBrush = new ID2D1SolidColorBrush(colorbrushptr.value);

        print("colorBrush: ", colorbrushptr.value);

        SetTimer(hwnd, NULL, 16);
    }else if(msg == WM_TIMER) { //ok don't be alarmed but i think that using the Uint8Arrays makes the memory climb a little bit but once the garbage collector kicks in it goes back down (the memory climbed from 69 MB to like 100 MB then im assuming the GC swept that shit up and it went back to ~77)
        print("DRAWING!!!");

        hwndRenderTarget.callMethodByName("BeginDraw", 0, [], [], RETURN_VOID);

        const rect = new D2D1_RECT_F();
        rect.left = 100;
        rect.top = 100;
        rect.right = rect.left+100;
        rect.bottom = rect.top+100;

        hwndRenderTarget.callMethodByName("FillRectangle", 2, [PointerFromArrayBuffer(rect.data), colorBrush.ptr], [VAR_INT, VAR_INT], RETURN_VOID);
                                  //OOPS LOL! I HAD ARGC SET TO 0
        hr = hwndRenderTarget.callMethodByName("EndDraw", 2, [NULL, NULL], [VAR_INT, VAR_INT], RETURN_NUMBER); //2 optional parameters EndDraw has
        
        print("ENDDRAW!!!");
    }
    else if(msg == WM_DESTROY) {
        FreeLibrary(lib);
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);

wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "ffid2d", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);