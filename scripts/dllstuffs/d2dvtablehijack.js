//in this script i'll change the pointer to ID2D1HwndRenderTarget::FillRectangle to point to my custom asm code that will print and then call the function
//oooouuuuhhhh im not sure if i can do this one boys
//calling OutputDebugString totally thrashes the stack... (lowkey after i wrote this i gave up for like a day and then felt determined)
//ok nah fuck that we're not done here
//somehow we are gonna figure out how to call without bombing the stack
//ok im actually reading the x64 calling convension msdn pages more closely and it actually clearly says that when calling regular functions there should be space in the stack for 4 parameters even if the function you want to call doesn't have that many (https://learn.microsoft.com/en-us/cpp/build/x64-calling-convention?view=msvc-170#calling-convention-defaults)

//alright so what hijackasmcode does is call OutputDebugStringW, modify the D2D1_RECT_F struct passed as a pointer through rdx, and finally call the original method
//another cool thing you could do is call GetCursorPos (don't forget to allocate space for the POINT object (8 bytes)) and add the x to the left and right properties of D2D1_RECT_F and add the y to the top and bottom (ok wait i might just do this myself)

//when do you have to push parameters to the stack??? it seems like it never works that way https://stackoverflow.com/questions/3911578/how-to-call-c-functions-in-my-assembly-code
//the answer to that previous question is: in x64, if the function has more than 4 parameters, the first 4 arguments are passed through rcx, rdx, r8, and r9. Any other arguments must be passed through the stack (in a certain order probably backwards where the last argument is pushed first)

eval(require("fs").read(__dirname+"/marshallib.js"));

class ULONG_PTR extends memoobjectidk {
    static types = {
        value: "ULONG_PTR",
    };
    constructor(data, ...vargs) { //data must be a Uint8Array
        super(data, ...vargs);
    }
}

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

function FindMethodPtrFromVtable(__vtptr, vtablelist, methodname, index=false) { //gets the latest version of the method (so no overloading to call earlier definitions of the method in the inheritance chain type shit)
    for(let i = vtablelist.length-1; i >= 0; i--) {
        const method = vtablelist[i];
        //print(method, vtablenames == name, i);
        if(method == methodname) {
            print(i, "mony for fun", methodname);
            if(index) {
                return i;
            }else {
                return dereference(__vtptr, "ULONG_PTR")+(i*8);
            }
        }
    }
    return 0;
}

const protectconsts = [
    "PAGE_NOACCESS",
    "PAGE_READONLY",
    "PAGE_READWRITE",
    "PAGE_WRITECOPY",
    "PAGE_EXECUTE",
    "PAGE_EXECUTE_READ",
    "PAGE_EXECUTE_READWRITE",
    "PAGE_EXECUTE_WRITECOPY",
    "PAGE_GUARD",
    "PAGE_NOCACHE",
    "PAGE_WRITECOMBINE",
    "PAGE_GRAPHICS_NOACCESS",
    "PAGE_GRAPHICS_READONLY",
    "PAGE_GRAPHICS_READWRITE",
    "PAGE_GRAPHICS_EXECUTE",
    "PAGE_GRAPHICS_EXECUTE_READ",
    "PAGE_GRAPHICS_EXECUTE_READWRITE",
    "PAGE_GRAPHICS_COHERENT",
    "PAGE_GRAPHICS_NOCACHE",
    "PAGE_ENCLAVE_THREAD_CONTROL",
    "PAGE_REVERT_TO_FILE_MAP",
    "PAGE_TARGETS_NO_UPDATE",
    "PAGE_TARGETS_INVALID",
    "PAGE_ENCLAVE_UNVALIDATED",
    "PAGE_ENCLAVE_MASK",
    "PAGE_ENCLAVE_DECOMMIT",
    "PAGE_ENCLAVE_SS_FIRST",
    "PAGE_ENCLAVE_SS_REST",
];

const stateconsts = [
    "MEM_COMMIT",
    "MEM_RESERVE",
    "MEM_FREE",
];

const typeconsts = [
    "MEM_PRIVATE",
    "MEM_MAPPED",
    "MEM_IMAGE",
]

function PrintFormattedVirtualQuery(process, address) {
    const mbi = VirtualQueryEx(process, address);
    print(`VirtualQueryEx(${process}, ${address}) {`);
    for(const key in mbi) {
        const value = mbi[key];
        let formatted = "";
        if(key.includes("Protect")) {
            for(const $enum of protectconsts) { //enum is reserved...
                const aenuml = globalThis[$enum]; //actual enum lol
                if((value & aenuml) == aenuml) {
                    formatted += formatted.length ? " | "+$enum : $enum;
                }
            }
        }else if(key == "State") {
            for(const $enum of stateconsts) { //enum is reserved...
                const aenuml = globalThis[$enum]; //actual enum lol
                if((value & aenuml) == aenuml) {
                    formatted += formatted.length ? " | "+$enum : $enum;
                }
            }
        }else if(key == "Type") {
            for(const $enum of typeconsts) { //enum is reserved...
                const aenuml = globalThis[$enum]; //actual enum lol
                if((value & aenuml) == aenuml) {
                    formatted += formatted.length ? " | "+$enum : $enum;
                }
            }
        }else {
            formatted = value;
        }
        if(value == 0) {
            formatted = value;
        }
        print(`    ${key}:`, formatted);
    }
    print("}");
}

function uint32_to_little_endian_hex(uint) {
    //lowkey i could just get the DataView to do this for me
    const a = new ArrayBuffer(4); //uint is 4 bytes
    const d = new DataView(a);
    d.setUint32(0, uint, true);
    return Array.from(new Uint8Array(a));
}

let w = 500;
let h = 500;

let d2d, colorBrush;
let hijackstr, hijackasmcode;

function windowProc(hwnd, msg, wp, lp) {
    if(msg == WM_CREATE) {
        d2d = createCanvas("d2d", ID2D1RenderTarget, hwnd);
        colorBrush = d2d.CreateSolidColorBrush(1.0, 1.0, 1.0);

        const methodname = "FillRectangle";
        const methodptr = FindMethodPtrFromVtable(d2d.renderTarget, __vtptr_ID2D1HwndRenderTarget, methodname);
        print(d2d.renderTarget, methodname, methodptr);
        if(methodptr) {
            const methodAddress = dereference(methodptr, "ULONG_PTR");
            PrintFormattedVirtualQuery(GetCurrentProcess(), methodptr); //ouuuhhh yeah the protection is read only
            //yeah lets just try to change that lol
            print(VirtualProtect(methodptr, 8, PAGE_READWRITE));
            PrintFormattedVirtualQuery(GetCurrentProcess(), methodptr); //ouuuhhh yeah

            //methodptr is a pointer to the method (obviously)
            //so we'll write the pointer to our method here

            //sadly the easiest print function to call seems to be OutputDebugString because idk about printf and cout is NOT normal lmao
            //OutputDebugString lives in kernel32.dll so lets loadlibrary that
            //__debugbreak();
            const kernel32 = LoadLibraryEx("Kernel32.dll");
            const OutputDebugStringWPtr = GetProcAddress(kernel32, "OutputDebugStringW"); //OutputDebugString is just the name of the macro
            print("kernel32:",kernel32);
            print("OutputDebugStringWPtr:",OutputDebugStringWPtr);
            const isolate = GetCurrentIsolate();
            hijackstr = new WString(`hello from hijacked ${methodname}! (called from asm my boys)\n`); //global so the garbage collector doesn't sweep away my variable
            hijackasmcode = new Uint8Array([ //global so the garbage collector doesn't sweep away the code lmao
                //i was gonna try to get the address of the function by dereferencing rcx (the this pointer) and dereferencing the value at vtable+index
                //0x41, 0x52,                                                 //push r10
                //0x4c, 0x8b, 0x11,                                           //mov r10, QWORD PTR [rcx]
                //0x4d, 0x8b, 0x92, ...int32_to_little_endian_hex(FindMethodPtrFromVtable(d2d.renderTarget, __vtptr_ID2D1HwndRenderTarget, "FillRectangle")), //mov r10, QWORD PTR [rcx+imm32]
                //0xcc,                                                   //interrupt 3 (debugbreak)
                //0x55,                                                   //push rbp
                
                //rsp alignment apparently only really matters when you want to call a function yourself (which we do...)
                //so ok apparently (since the pointer to return execution is pushed onto the stack when this function is called), rsp is only 8 bytes away from the 16 byte boundary
                //source -> https://www.reddit.com/r/Assembly_language/comments/10zpojy/comment/j851mbv/
                //so lemme label each push (since i push all the 64 bit registers im subtracting rsp by 8)

                //push each parameter for FillRectangle (rcx is the "this" pointer (for windows at least), rdx is the pointer to the rect to draw, and r8 is the pointer to the brush)
                0x51,                                                   //push rcx      //rsp is now 16 byte aligned
                0x52,                                                   //push rdx      //rsp is now unaligned
                0x41, 0x50,                                             //push r8       //rsp is now 16 byte aligned again

                //0x41, 0x51,                                             //push r9
                

                //no way! i didn't include the standard prolog (push rbp -> mov rbp, rsp) and my code still worked but when i tried to put it in, it crashed (it tried to deference something like 0xFFFFFFFFFFFFFFFF)
                //i think it failed because rsp wasn't aligned to a 16 byte boundary (so i've just been lucky this whole time)
                //i fixed it by subtracting rsp by 40 (0x28) instead of 32 (0x20) and then adding it back after calling OutputDebugStringW
                //0x55,                                                   //push rbp
                //0x48, 0x89, 0xe5,                                       //mov rbp, rsp

                0x48, 0x83, 0xec, 0x20,                                 //sub rsp, 0x20 (32) im assuming that when MSDN says that the caller function must allocate space for 4 register parameters (), the size of each parameter would be 8 so 4*8=32
                                                                        //rsp is still 16 byte aligned because 32%16 is 0 (and it was already aligned before we did this)
                
                0x48, 0xb9, ...int64_to_little_endian_hex(hijackstr.ptr),//movabs rcx, imm64
                
                //um... why did i do this? (did i forget that i pushed all the parameters earlier?)
                //0x48, 0x89, 0x4c, 0x24, 0x18,                           //mov QWORD PTR [rsp+0x18], rcx     ("pushing" rcx into rsp + 24 because the last parameter is pushed first (for __cdecl)) (instead of doing it like this, i could just push rcx after i changed it and then subtracted 24 from rsp)
                
                0x48, 0xb8, ...int64_to_little_endian_hex(OutputDebugStringWPtr),   //movabs rax, imm64
                0xff, 0xd0,                                             //call rax

                //wait how can i be sure that after i call OutputDebugStringW the parameters are still preserved... (by pushing and popping them)
                0x48, 0x83, 0xc4, 0x20,                                 //add rsp, 0x20 (32)

                //haha oops i left pop rbp on!
                //0x5d,                                                   //pop rbp
                //0x41, 0x59,                                             //pop r9
                0x41, 0x58,                                             //pop r8
                0x5a,                                                   //pop rdx
                0x59,                                                   //pop rcx
                
                //and you know what, while we're here...
                //lets modify the D2D1_RECT_F rect struct passed as a pointer through rdx
                //lets loop 4 times so we can add 10 to each float in the struct (for the lolz)
                //im gonna use r10 to hold how many times we've looped
                //NOTE: i'm actually directly modifying the D2D1_RECT_F that's been passed so if you use the same rect again with FillRectangle/the function you want to call it will be changed, again!
                //i could allocate a copy on the stack (and pass it into FillRectangle/the function you want to call) but i don't feel like it since jbs will create the rect when you call d2d.FillRectangle so it doesn't matter
                //hold on are there any vector extension or SiMD functions that let me do this in like one instruction? (add scalar value to 4 floats in 128 xmm register?)
                //0x4d, 0x31, 0xd2,                                       //xor r10, r10
                //0x49, 0xc7, 0xc3, ...int32_to_little_endian_hex(50),    //mov r11, imm32           ;lol im using int32 to little endian so i can change the number easily
                //0xf3, 0x49, 0x0f, 0x2a, 0xcb,                           //cvtsi2ss xmm1, r11       ;convert r11 to a float and store it in xmm1
                //0xf3, 0x42, 0x0f, 0x10, 0x04, 0x92,                     //movss xmm0, DWORD PTR [rdx+r10*4]         ;dereference rdx (rect struct) + r10 (loop index) * 4 (sizeof float)
                //0xf3, 0x0f, 0x58, 0xc1,                                 //addss xmm0, xmm1                          ;add le value
                //0xf3, 0x42, 0x0f, 0x11, 0x04, 0x92,                     //movss DWORD PTR [rdx+r10*4], xmm0         ;put that shit back in the struct
                //0x49, 0xff, 0xc2,                                       //inc r10
                //0x49, 0x83, 0xfa, 0x04,                                 //cmp r10, 0x4 (4)
                ////UINT32 TO LITTLE ENDIAN HEX HERE!!!
                //0x0f, 0x85, ...uint32_to_little_endian_hex(-29),           //jne rel32                                 ;when using an immediate for any jmp, it's relative 

                //guys the answer to that previous query was YES!
                //we're pretty lucky that it's four continous floats in memory!
                0x0f, 0x10, 0x02,                                       //movups xmm0, XMMWORD PTR [rdx] ;loads the rect (four floats) into xmm0 (im using movups here because idk if it's gonna be aligned lol)
                0x49, 0xc7, 0xc3, ...int32_to_little_endian_hex(50),    //mov r11, imm32                 ;lol im using int32 to little endian so i can change the number easily
                0xf3, 0x49, 0x0f, 0x2a, 0xcb,                           //cvtsi2ss xmm1, r11             ;convert r11 to a float and store it in xmm1
                0x0f, 0xc6, 0xc9, 0x00,                                 //shufps xmm1, xmm1, 0x0         ;copy scalar float into each 32 byte section of xmm1 (so it's added to each float in rect)
                0x0f, 0x58, 0xc1,                                       //addps xmm0, xmm1               ;add scalar to rect floats
                0x0f, 0x11, 0x02,                                       //movups XMMWORD PTR [rdx], xmm0 ;put changed floats back into rect
                
                //anyways wouldn't it be cooler if i could call a js function INSIDE this hijacked function?!
                //yeah im not sure about that lol but it's definitely possible since we're on the same thread!
                
                // 0x48, 0xb9, ...int64_to_little_endian_hex(isolate),     //movabs rcx, [isolate] ; using rcx because calling GetCurrentContext
                //uh oh how could i call GetCurrentContext since Isolate has no vtable...                

                //0x5d,                                                   //pop rbp
                0x48, 0xb8, ...int64_to_little_endian_hex(methodAddress),   //movabs rax, imm64        //oops i wrote methodptr instead here and didn't realize why it wasn't working lmao
                0xff, 0xe0,                                             //jmp rax (we're jumping here because im assuming that when this asm code is called, everything is already setup to call the original d2d function so instead of calling it myself, i'll just jmp there as if i didn't hijack it)
            ]);
            //OHHHHH it was crashing because i forgot to change the protection of hijackasmcode's data!
            PrintFormattedVirtualQuery(GetCurrentProcess(), PointerFromArrayBuffer(hijackasmcode)); //ouuuhhh yeah the protection is writeread only
            VirtualProtect(PointerFromArrayBuffer(hijackasmcode), hijackasmcode.byteLength, PAGE_EXECUTE_READWRITE); //idk about the bytelength but
            PrintFormattedVirtualQuery(GetCurrentProcess(), PointerFromArrayBuffer(hijackasmcode));
            //print(FreeLibrary(kernal32)); //lol misspelded

            const data = new ULONG_PTR(PointerFromArrayBuffer(hijackasmcode)); //temp object so i can copy the memory from the arraybuffer to methodptr
            memcpy(methodptr, PointerFromArrayBuffer(data.data), data.data.byteLength); //oh no i got an access violation... is the vtable's page read only??? (lets virtual query this...)
        }else {
            print("oooouuuuhhhh so we couldn't find that method apparently...");
        }
        SetTimer(hwnd, 0, 64);
    }else if(msg == WM_TIMER) {
        d2d.BeginDraw();
        d2d.Clear(0.0, 0.0, 0.0);
        //print("colorBrush:",colorBrush.internalPtr);
        print("move your mouse over the window and check the debug output log!");
        const mouse = GetCursorPos();
        ScreenToClient(hwnd, mouse);
        colorBrush.SetColor(0.0, 1.0, 0.0);
        d2d.DrawRectangle(mouse.x, mouse.y, mouse.x+100, mouse.y+100, colorBrush); //draw rectangle not modified (draws in the right spot)
        colorBrush.SetColor(1.0, 0.0, 1.0);
        d2d.FillRectangle(mouse.x, mouse.y, mouse.x+100, mouse.y+100, colorBrush); //fill rectangle hijacked
        d2d.EndDraw();
    }
    else if(msg == WM_DESTROY) {
        PostQuitMessage(0);
    }
}

const wc = CreateWindowClass("winclass", windowProc);

wc.hbrBackground = COLOR_BACKGROUND;
wc.hCursor = LoadCursor(NULL, IDC_ARROW);

window = CreateWindow(WS_EX_OVERLAPPEDWINDOW, wc, "d2dvtablehijack.js", WS_OVERLAPPEDWINDOW | WS_VISIBLE, CW_USEDEFAULT, CW_USEDEFAULT, w+20, h+43, NULL, NULL, hInstance);