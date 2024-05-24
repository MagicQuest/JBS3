// JBS3.cpp : This file contains the 'main' function. Program execution begins and ends there.

// Copyright 2015 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

//#define V8_COMPRESS_POINTERS
//#define V8_31BIT_SMIS_ON_64BIT_ARCH

//hopefully my INSANE use of macros doesn't hurt your mind

#define V8_ENABLE_SANDBOX
#define _CRT_SECURE_NO_WARNINGS

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <iostream>
//#include <tuple>



#include "include/libplatform/libplatform.h"
#include "include/v8-context.h"
#include "include/v8-initialization.h"
#include "include/v8-primitive.h"
#include "include/v8-script.h"
#include "include/v8-function.h"
#include "include/v8-container.h"
#include "include/v8-exception.h"

#ifdef LIBUV
#include "libuv/src/uv-common.h"


#pragma comment(lib, "Ws2_32.lib")
#pragma comment(lib, "Iphlpapi.lib")
#pragma comment(lib, "Userenv.lib")
#endif

#include <comdef.h> //_com_error

//user32.lib; advapi32.lib; iphlpapi.lib; userenv.lib; ws2_32.lib; dbghelp.lib; ole32.lib; uuid.lib; kernel32.lib; user32.lib; gdi32.lib; winspool.lib; shell32.lib; ole32.lib; oleaut32.lib; uuid.lib; comdlg32.lib; advapi32.lib
//#pragma comment(lib, "psapi.lib")

//https://medium.com/angular-in-depth/how-to-build-v8-on-windows-and-not-go-mad-6347c69aacd4
//https://v8.dev/docs/embed
//https://chromium.googlesource.com/v8/v8/+/branch-heads/6.8/samples/hello-world.cc

// the v8_base_without_compiler.lib was corrupt everytime i built it and i KEPT TRYING and eventually found out i had to build v8_monolith.lib (ninja -C out/x64.release v8_monolith)
//hopefully you can use my precompiled libs or figure out to build v8 for yourself because this was basically as hard as opencv
//speaking of opencv i had this strange error when i ran my opencv projects outside of CLion/mingw that said -> [The procedure entry point _ZNSt18condition_variable10notify_allEv could not be located in the dynamic link library libopencv_core452.dll]
//anyways i googled for a while and somebody said to use dependancy walker to see what it is missing and sure enough -> https://stackoverflow.com/questions/42438790/visual-studio-c-based-exe-doesnt-do-nothing
//i needed libstdc++-6.dll in the same folder as my exe and i guess CLion would automatically run with the dll loaded (IDK)

//#pragma comment(lib, "v8_base.lib")
//#pragma comment(lib, "v8_base_without_compiler.lib")

//#pragma comment(lib, "v8_init")
//#pragma comment(lib, "v8_bigint")
//#pragma comment(lib, "v8_heap_base")
//#pragma comment(lib, "v8_base_without_compiler")
//#pragma comment(lib, "v8_turboshaft")

//#pragma comment(lib, "v8_libbase")

//#pragma comment(lib, "v8_external_snapshot")
//#pragma comment(lib, "v8_snapshot")

//#pragma comment(lib, "v8_libplatform")
//#pragma comment(lib, "v8_compiler")

//#pragma comment(lib, "v8_libsampler")
//#pragma comment(lib, "icuuc.lib")
//#pragma comment(lib, "icui18n.lib")
//#pragma comment(lib, "inspector")

//#pragma comment(lib, "v8_snapshot")
////#pragma comment(lib, "v8_base_without_compiler")
//#pragma comment(lib, "v8_turboshaft")
//#pragma comment(lib, "v8_init")
//#pragma comment(lib, "v8_initializers")
//#pragma comment(lib, "v8_compiler")
//#pragma comment(lib, "torque_generated_initializers")
//#pragma comment(lib, "torque_generated_definitions")
//#pragma comment(lib, "inspector")
////#pragma comment(lib, "crdtp")
////#pragma comment(lib, "crdtp_platform")
//#pragma comment(lib, "icui18n")
//#pragma comment(lib, "icuuc")
////#pragma comment(lib, "compression_utils_portable")
////#pragma comment(lib, "zlib")
//
//#pragma comment(lib, "inspector_string_conversions")
//#pragma comment(lib, "torque_base")
//#pragma comment(lib, "cppgc_base")
//#pragma comment(lib, "v8_libplatform")
//#pragma comment(lib, "v8_heap_base")
//#pragma comment(lib, "v8_libbase")
//#pragma comment(lib, "v8_bigint")

//#pragma comment(lib, "v8_base_without_compiler_0")
//#pragma comment(lib, "v8_base_without_compiler_1")

//#pragma comment(lib, "v8_base_without_compiler")

#pragma comment(lib, "v8_monolith") //>ninja -C out/x64.release v8_monolith
#pragma comment(lib, "Msimg32.lib")

//https://medium.com/compilers/v8-javascript-engine-compiling-with-gn-and-ninja-8673e7c5e14a

#pragma comment(lib, "winmm.lib")
#pragma comment(lib, "dbghelp.lib")
#pragma comment(lib, "shlwapi.lib")

#define print(msg) std::cout << msg << std::endl
#define wprint(msg) std::wcout << msg << std::endl
//honestly im suprised this works (because i use a "custom" console i didn't think wcout would work)

#include <sstream>
#include <windows.h>
//#include "guicon.h"
#include "console2.h"
#include <shobjidl_core.h> //for showOpenFilePicker (IFileDialog)
//#include <wincodec.h> //wait why did i include this? (it was for Direct2D)

#pragma comment(lib, "windowscodecs.lib")

#define LITERAL(cstr) String::NewFromUtf8Literal(isolate, cstr)
#define CStringFI(e) *String::Utf8Value(isolate, e)
#define WStringFI(e) (const wchar_t*)*String::Value(isolate, e)
#define IntegerFI(e) e/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust()
#define FloatFI(e) e.As<Number>()->Value()

#define CHECKEXCEPTIONS(shit) if (shit.HasCaught()) {                                                                                                    \
                                  HANDLE console = GetStdHandle(STD_OUTPUT_HANDLE);                                                                      \
                                  SetConsoleTextAttribute(console, 4);                                                                                   \
                                  print("[LINE " << shit.Message()->GetLineNumber(isolate->GetCurrentContext()).FromJust() << "] " << CStringFI(shit.Message()->Get()) << "\007");    \
                                  SetConsoleTextAttribute(console, 7);                                                                                   \
                              }



//#include <map>
//#include "JSWindow.h"
//std::map<int, JSWindow*> JSWindow::jsWindows = {}; //bruh what is this line

int screenWidth, screenHeight;

namespace jsImpl {
    using namespace v8;
    Local<Object> createWinRect(Isolate* isolate, RECT r) {
        Local<Object> jsRect = Object::New(isolate);

        jsRect->Set(isolate->GetCurrentContext(), LITERAL("left"), Number::New(isolate, r.left));
        jsRect->Set(isolate->GetCurrentContext(), LITERAL("top"), Number::New(isolate, r.top));
        jsRect->Set(isolate->GetCurrentContext(), LITERAL("right"), Number::New(isolate, r.right));
        jsRect->Set(isolate->GetCurrentContext(), LITERAL("bottom"), Number::New(isolate, r.bottom));

        return jsRect;
    }

    template<class T>
    Local<Object> createWinPoint(Isolate* isolate, T p) {
        Local<Object> jsPoint = Object::New(isolate);

        jsPoint->Set(isolate->GetCurrentContext(), LITERAL("x"), Number::New(isolate, p.x));
        jsPoint->Set(isolate->GetCurrentContext(), LITERAL("y"), Number::New(isolate, p.y));

        return jsPoint;
    }

    //template<typename T>
    //void aDA(Isolate* isolate, Local<Object>& jsArray, T t) {
        //jsArray->Set(isolate->GetCurrentContext(), )
    //}

    //template<typename T, typename... Args>
    Local<Array> asNumberArray(Isolate* isolate, std::vector<double>& doubles) {// T t, Args... args) {
        Local<Array> jsArray = Array::New(isolate, doubles.size());

        for (int i = 0; i < doubles.size(); i++) {
            double d = doubles[i];
            jsArray->Set(isolate->GetCurrentContext(), i, Number::New(isolate, d));
        }

        return jsArray;
        //aDA(isolate, jsArray, args...);
    }

    Local<Array> asNumberArray(Isolate* isolate, double* doubles, int size) {// T t, Args... args) {
        Local<Array> jsArray = Array::New(isolate, size);

        for (int i = 0; i < size; i++) {
            double d = doubles[i];
            jsArray->Set(isolate->GetCurrentContext(), i, Number::New(isolate, d));
        }
        
        return jsArray;
        //aDA(isolate, jsArray, args...);
    }
}

//const char* ToCString(const v8::String::Utf8Value& value) {
//    return *value ? *value : "<string conversion failed>";
//}

const char* Highlight(v8::Isolate* isolate, HANDLE console, v8::Local<v8::Value> value) {
    using namespace v8;
    if (!value->IsString()) {
        if (value->IsNumber()) {//atoi(cstr)) {
            //color = "\033[35;0m";
            SetConsoleTextAttribute(console, 6);
        }
        else if (value->IsBoolean()) {
            SetConsoleTextAttribute(console, 5);
        }
        else if (value->IsFunction()) {
            SetConsoleTextAttribute(console, 7);
        }
        else if (value->IsNullOrUndefined()) {
            SetConsoleTextAttribute(console, 8);
        }
        else if (value->IsObject()) {
            SetConsoleTextAttribute(console, 8);
            //std::string obj = "{\n";
            printf("{\n");
            v8::Local<v8::Array> varNames = value.As<v8::Object>()->GetPropertyNames(isolate->GetCurrentContext()).ToLocalChecked();
            for (uint32_t j = 0; j < varNames->Length(); j++) {
                v8::Local<v8::Value> name = varNames->Get(isolate->GetCurrentContext(), j).ToLocalChecked()->ToString(isolate->GetCurrentContext()).ToLocalChecked();
                //obj += std::string("    ") + (*v8::String::Utf8Value(info.GetIsolate(), name)) + std::string(": ") + (*v8::String::Utf8Value(info.GetIsolate(), info[i].As<v8::Object>()->Get(info.GetIsolate()->GetCurrentContext(), name).ToLocalChecked())) + "\n";
                SetConsoleTextAttribute(console, 8);
                printf("    %s: ", (*v8::String::Utf8Value(isolate, name)));
                v8::Local<v8::Value> finalValue = value.As<v8::Object>()->Get(isolate->GetCurrentContext(), name).ToLocalChecked();
                printf("%s", Highlight(isolate, console, finalValue));
                printf("%s\n", (*v8::String::Utf8Value(isolate, finalValue)));
            }
            //obj += "}";
            return "} ";//obj.c_str();
        }
    }
    else {
        SetConsoleTextAttribute(console, 3);
    }
    return "";
}

void Print(const v8::FunctionCallbackInfo<v8::Value>& info) {
    bool first = true;
    HANDLE console = GetStdHandle(STD_OUTPUT_HANDLE);
    for (int i = 0; i < info.Length(); i++) {
        v8::HandleScope handle_scope(info.GetIsolate());
        if (first) {
            first = false;
        }
        else {
            printf(" ");
        }
        v8::String::Utf8Value str(info.GetIsolate(), info[i]);
        const char* cstr = *str ? *str: "<string conversion failed>";//ToCString(str);
        printf("%s", Highlight(info.GetIsolate(), console, info[i])); //print syntax colors for the console
        //const char* color = "";
        //if (!info[i]->IsString()) {
        //    if (info[i]->IsNumber()) {//atoi(cstr)) {
        //        //color = "\033[35;0m";
        //        SetConsoleTextAttribute(console, 6);
        //    }
        //    else if (info[i]->IsBoolean()) {
        //        SetConsoleTextAttribute(console, 5);
        //    }
        //    else if (info[i]->IsObject()) {
        //        SetConsoleTextAttribute(console, 8);
        //        //std::string obj = "{\n";
        //        printf("{\n");
        //        v8::Local<v8::Array> varNames = info[i].As<v8::Object>()->GetPropertyNames(info.GetIsolate()->GetCurrentContext()).ToLocalChecked();
        //        for (uint32_t j = 0; j < varNames->Length(); j++) {
        //            v8::Local<v8::Value> name = varNames->Get(info.GetIsolate()->GetCurrentContext(), j).ToLocalChecked()->ToString(info.GetIsolate()->GetCurrentContext()).ToLocalChecked();
        //            //obj += std::string("    ") + (*v8::String::Utf8Value(info.GetIsolate(), name)) + std::string(": ") + (*v8::String::Utf8Value(info.GetIsolate(), info[i].As<v8::Object>()->Get(info.GetIsolate()->GetCurrentContext(), name).ToLocalChecked())) + "\n";
        //            printf("    %s: ", (*v8::String::Utf8Value(info.GetIsolate(), name)));
        //            printf("%s\n", (*v8::String::Utf8Value(info.GetIsolate(), info[i].As<v8::Object>()->Get(info.GetIsolate()->GetCurrentContext(), name).ToLocalChecked())));
        //        }
        //        //obj += "}";
        //        cstr = "}";//obj.c_str();
        //    }
        //}
        //else {
        //    SetConsoleTextAttribute(console, 3);
        //}
        printf("%s", cstr);
        //printf("%s%s\033[0m",color,cstr);
    }
    printf("\n");
    fflush(stdout);
    SetConsoleTextAttribute(console, 7);
}

void Version(const v8::FunctionCallbackInfo<v8::Value>& info) {
    info.GetReturnValue().Set(
        v8::String::NewFromUtf8(info.GetIsolate(), v8::V8::GetVersion())
        .ToLocalChecked());
}

namespace fs {
    void read(const v8::FunctionCallbackInfo<v8::Value>& info) {
        using v8::String;
        std::wstringstream buffer;

        std::wstring shit;

        std::wifstream file((wchar_t*)*String::Value(info.GetIsolate(), info[0]));//, std::ios::binary);

        if (file.is_open()) {
            //i hate reading files in c++
            buffer << file.rdbuf();
            shit = buffer.str();
            //std::string tempstring(shit.size(), '#');
            //v8::Local<String> str = String::NewFromUtf8(info.GetIsolate(), tempstring.c_str()).ToLocalChecked();
            //str->WriteOneByte(info.GetIsolate(), (uint8_t*)(shit.c_str()), 0, shit.length(), v8::String::NO_NULL_TERMINATION);
            //str->WriteUtf8(info.GetIsolate(), (char*)shit.c_str(), shit.length(),nullptr, v8::String::NO_NULL_TERMINATION);
            //std::wcout << shit << std::endl;
            //wchar_t* memleak = new wchar_t[shit.size()];
            //memcpy(memleak, shit.c_str(), sizeof(wchar_t)*shit.size());

                info.GetReturnValue().Set(String::NewFromTwoByte(info.GetIsolate(), (const uint16_t*)shit.c_str()).ToLocalChecked());
                //info.GetReturnValue().Set(str);
            //print(shit << " youcanstandundermyinbrelela" << shit.size());
        }
        else {
            info.GetReturnValue().SetUndefined();
        }

        file.close();
    }

    void readBinary(const v8::FunctionCallbackInfo<v8::Value>& info) {
        using namespace v8;
        Isolate* isolate = info.GetIsolate();

        std::wstringstream buffer;

        std::wstring shit;

        std::wifstream file((wchar_t*)*String::Value(info.GetIsolate(), info[0]), std::ios::binary);

        if (file.is_open()) {

            buffer << file.rdbuf();
            shit = buffer.str();

            Local<ArrayBuffer> jsArrayBuffer = ArrayBuffer::New(isolate, shit.size());

            //Local<Array> jsArray = Array::New(isolate, shit.size());
            for (int i = 0; i < shit.size(); i++) {
                jsArrayBuffer->Set(isolate->GetCurrentContext(), i, Number::New(isolate, shit[i]));
            }

            //std::string* fuck = new std::string(shit); //it's giving undefined behavior

            //ok i works but i could just pass an array of chars (ints) //probably use arraybuffer because i think thats what browsers do for files maybe idk (yeah so the documentation for arraybuffer literally says a buffer full of bytes)

            //char* stringPtr = new char[shit.size()]; //uh oh
            //strcpy(stringPtr, shit.c_str());
            //strncpy(stringPtr, shit.c_str(), shit.size());
            //memcpy(stringPtr, shit.c_str(), shit.size()); //shit.c_str() gets cut off!
            //print(stringPtr << " shit->" << shit.c_str() << " " << shit);

            //info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)fuck/*stringPtr*/));//String::NewFromUtf8(info.GetIsolate(), shit.c_str()).ToLocalChecked());
            info.GetReturnValue().Set(jsArrayBuffer);
            //print(shit << " youcanstandundermyinbrelela" << shit.size());
        }
        else {
            info.GetReturnValue().SetUndefined();
        }

        file.close();
    }

    void write(const v8::FunctionCallbackInfo<v8::Value>& info) {
        using v8::String;
        std::wofstream file((wchar_t*)*String::Value(info.GetIsolate(), info[0]));

        if (file.is_open()) {
            //file.write(*String::Utf8Value(info.GetIsolate(), info[1]), );
            file << (wchar_t*)*String::Value(info.GetIsolate(), info[1]);
            info.GetReturnValue().Set(true);
        }
        else {
            info.GetReturnValue().Set(false);
        }

        file.close();
    }
}

void Require(const v8::FunctionCallbackInfo<v8::Value>& info) {
    const char* type = *v8::String::Utf8Value(info.GetIsolate(), info[0]); //insert tocstring here (dumb)
    v8::HandleScope handle_scope(info.GetIsolate());
    if (strcmp(type, "fs") == 0) {
        print("typenigger");
        using namespace v8; //lol idk why you can do this right here
        Isolate* isolate = info.GetIsolate();
        
        Local<ObjectTemplate> filesys = ObjectTemplate::New(isolate);
        filesys->Set(isolate, "read", FunctionTemplate::New(isolate, fs::read));
        filesys->Set(isolate, "readBinary", FunctionTemplate::New(isolate, fs::readBinary));
        filesys->Set(isolate, "write", FunctionTemplate::New(isolate, fs::write));
        //filesys->Set(isolate->GetCurrentContext(), String::NewFromUtf8(isolate, "open").ToLocalChecked(), v8::FunctionTemplate::New(isolate, fs::open));
        //filesys->Set(isolate, "v", String::NewFromUtf8(isolate, "KYS").ToLocalChecked());
        
        //print(filesys->IsValue() << " is value");

        //ok it took a while to figure out how to make an object WITH FUNCTIONS AND RETURNING IT and this was the solution i guess
        Local<Object> result = filesys->NewInstance(isolate->GetCurrentContext()).ToLocalChecked(); //why did i have to cap on this dawg
        
        info.GetReturnValue().Set(result);
    }
}

void setBackground(const v8::FunctionCallbackInfo<v8::Value>& info) {
    //ok so there are 2 versions of JBS and for some reason in the last one this was a function so im adding it again
    info.GetReturnValue().Set(SystemParametersInfo(SPI_SETDESKWALLPAPER, 0, (wchar_t*)*v8::String::Value(info.GetIsolate(), info[0]), SPIF_UPDATEINIFILE));
}

void Msgbox(const v8::FunctionCallbackInfo<v8::Value>& info) {
    using namespace v8;
    info.GetReturnValue().Set(MessageBox(NULL, (const wchar_t*)*String::Value(info.GetIsolate(), info[0]), (const wchar_t*)*String::Value(info.GetIsolate(), info[1]), info[2].As<Number>()->IntegerValue(info.GetIsolate()->GetCurrentContext()).FromJust()));
}

#include "resource.h"

//struct DialogData {
//    const char* description;
//    const char* title;
//    const char* input;
//};

INT_PTR CALLBACK DialogProc(HWND hwnd, UINT Message, WPARAM wParam, LPARAM lParam)
{
    switch (Message)
    {
    case WM_INITDIALOG:
        //print(((DialogData*)GetWindowLongPtr(hwnd, GWLP_USERDATA))->title);
        return TRUE;
    case WM_HELP: {
        //print();
        //DialogData dlg = *((DialogData*)lParam);
        const wchar_t** data = (const wchar_t**)lParam;
        print(data[0] << " " << data[1] << " " << data[2]);
        //print(dlg.title);
        //print(dlg.description);
        //print(dlg.input);
        SetWindowText(hwnd, data[1]);//dlg.title);
        //SetDlgItemTextA(hwnd, IDC_BUTTON1, dlg->description);
        SetDlgItemText(hwnd, IDC_STATIC1, data[0]);//dlg.description);
        SetDlgItemText(hwnd, IDC_EDIT1, data[2]);//dlg.input);

        return TRUE;
    }
    case WM_COMMAND:
        switch (LOWORD(wParam))
        {
        case IDOK:
            //wchar_t shit[100];
            //GetWindowTextA(GetDlgItem, shit, 100);
            //GetDlgItemText(hwnd, IDC_EDIT1, shit, 100);
            //print(shit);
            *(bool*)GetWindowLongPtr(hwnd, GWLP_USERDATA) = true; //this is crazy to read
            EndDialog(hwnd, IDOK);
            break;
        case IDCANCEL:
            *(bool*)GetWindowLongPtr(hwnd, GWLP_USERDATA) = true;
            EndDialog(hwnd, IDCANCEL);
            break;
        }
        break;
    default:
        return FALSE;
    }
    return TRUE;
}

HINSTANCE hInstance;

//custom dialog input box bruh
void Inputbox(const v8::FunctionCallbackInfo<v8::Value>& info) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    //long long result = DialogBox(hInstance, MAKEINTRESOURCE(IDD_DIALOG1), GetConsoleWindow(), DialogProc);
    //DialogData data{CStringFI(info[0]), CStringFI(info[1]), CStringFI(info[2])};
    //print(data.description << " " << data.title << " " << data.input);
    //print(result);
    //if (result == IDOK) {
    //    
    //    info.GetReturnValue().Set(String::NewFromUtf8(isolate, ));
    HWND dialog = CreateDialog(hInstance, MAKEINTRESOURCE(IDD_DIALOG1), GetConsoleWindow(), DialogProc);
    bool done = false; //haha bool pointer is crazy (waiot nevermidn)
    //}
    const wchar_t* data[3]{ WStringFI(info[0]), WStringFI(info[1]), WStringFI(info[2]) };
    print(data[0] << " " << data[1] << " " << data[2]);
    SendMessage(dialog, WM_HELP, NULL, (LPARAM) & data);
    //print(data.description << " " << data.title << " " << data.input);
    SetWindowLongPtr(dialog, GWLP_USERDATA, (LONG_PTR) &done);
    ShowWindow(dialog, SW_SHOW);
    //https://stackoverflow.com/questions/46890454/why-doesnt-message-box-block-the-thread
    //https://stackoverflow.com/questions/21180459/windows-api-createdialog-modeless-dialog-just-not-show-up
    while (!done) {
        MSG msg;
        GetMessage(&msg, dialog, NULL, NULL);
        if (IsDialogMessage(dialog, &msg))
            continue;
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
    wchar_t shit[100];
    //GetWindowTextA(GetDlgItem, shit, 100);
    GetDlgItemText(dialog, IDC_EDIT1, shit, 100);

    info.GetReturnValue().Set(String::NewFromTwoByte(isolate, (uint16_t*)shit).ToLocalChecked());
    //char shit[100];
    ////GetWindowTextA(GetDlgItem, shit, 100);
    //GetDlgItemTextA(dialog, IDC_EDIT1, shit, 100);
    //print(shit);

    //print(WaitForSingleObject(dialog, 100000) << " wait " << GetLastError());
}

#define V8FUNC(name) void name(const v8::FunctionCallbackInfo<v8::Value>& info)

#include "JSTimer.h" //You cannot give up just yet... MAGICQUEST3! Stay DETERMINED.

std::map<UINT_PTR, setTimeoutTimer*> setTimeoutTimer::timers = {};
std::map<UINT_PTR, setIntervalTimer*> setIntervalTimer::timers = {};

V8FUNC(setTimeout) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    //HandleScope handle_scope(info.GetIsolate());
    UINT time = IntegerFI(info[1]);
    //Local<Function> func = info[0].As<Function>();
    Persistent<Function> func = Persistent<Function>(isolate, info[0].As<Function>());
    setTimeoutTimer* t = new setTimeoutTimer(isolate, func); //THIS IS WHAT IT MEANS TO GO EVEN FURTHER BEYOND

    info.GetReturnValue().Set(Number::New(isolate, t->init(time)));
}

V8FUNC(setInterval) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    UINT time = IntegerFI(info[1]);

    Persistent<Function> func = Persistent<Function>(isolate, info[0].As<Function>());
    setIntervalTimer* t = new setIntervalTimer(isolate, func); //THIS IS WHAT IT MEANS TO GO EVEN FURTHER BEYOND

    info.GetReturnValue().Set(Number::New(isolate, t->init(time)));
}

//V8FUNC(clearTimerYKYKYK) { //clearTimeout clearInterval (aw sorry i can't do the same func for both of em)
//    using namespace v8;
//    Isolate* isolate = info.GetIsolate();
//
//    info.GetReturnValue().Set(Number::New(isolate, KillTimer(NULL, IntegerFI(info[0]))));
//}

//V8FUNC(setTimeout) { //yeah im sorry i can't do setTimeout i gotta read the nodejs repo (i might need libuv >:( ) yeah not only was libuv made for node.js BUT it even has a setTimeout example ON THE GITHUB! https://github.com/kiddkai/libuv-examples/blob/master/src/timer/README.md#simulate-the-settimeout-in-javascript
//    using namespace v8;
//    setTimeoutTimer* t = new setTimeoutTimer(info.GetIsolate(), info);
//}

V8FUNC(clearTimeout) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    UINT_PTR id = IntegerFI(info[0]);
    info.GetReturnValue().Set(Number::New(isolate, KillTimer(NULL, id)));
    if (setTimeoutTimer::timers.find(id) == setTimeoutTimer::timers.end()) {
        HANDLE console = GetStdHandle(STD_OUTPUT_HANDLE);
        SetConsoleTextAttribute(console, 4);
        print("you must use the timer's coresponding clear function (you are getting this error because you may have used clearTimeout on a setInterval timer which (in my version) will cause a small memory leak)" << "\007");
        SetConsoleTextAttribute(console, 7);
    }
    delete setTimeoutTimer::timers[id];
    setTimeoutTimer::timers.erase(id); //almost forgot that part
}

V8FUNC(clearInterval) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    UINT_PTR id = IntegerFI(info[0]);
    info.GetReturnValue().Set(Number::New(isolate, KillTimer(NULL, id)));
    if (setIntervalTimer::timers.find(id) == setIntervalTimer::timers.end()) {
        HANDLE console = GetStdHandle(STD_OUTPUT_HANDLE);
        SetConsoleTextAttribute(console, 4);
        print("you must use the timer's coresponding clear function (you are getting this error because you may have used clearInterval on a setTimeout timer which (in my version) will cause a small memory leak)" << "\007");
        SetConsoleTextAttribute(console, 7);
    }
    delete setIntervalTimer::timers[id];
    setIntervalTimer::timers.erase(id);
}

//V8FUNC(nigga) {
//    
//}

//namespace Window {
//    V8FUNC(addEventListener) { //haha
//
//    }
//}

//remade the CreateWindowClass and CreateWindow wrappers far below

//V8FUNC(CreateWindowClass) {
//    using namespace v8;
//
//    Isolate* isolate = info.GetIsolate();
//
//    //WNDCLASSA wc{ 0 };
//    //wc.hInstance = hInstance;
//    //wc.lpszClassName = *String::Utf8Value(info.GetIsolate(), info[0]);
//
//    //Local<ObjectTemplate> wndclass = ObjectTemplate::New(isolate);
//    Local<Object> wndclass = Object::New(isolate);
//    wndclass->Set(isolate->GetCurrentContext(), LITERAL("className"), info[0]);//Undefined(isolate));//info[0]);
//    wndclass->Set(isolate->GetCurrentContext(), LITERAL("style"), info[1]);//Undefined(isolate));//info[0]);
//    wndclass->Set(isolate->GetCurrentContext(), LITERAL("init"), info[2]);//Undefined(isolate));//info[1]);
//    wndclass->Set(isolate->GetCurrentContext(), LITERAL("windowProc"), info[3]);//Undefined(isolate));//info[1]);
//    wndclass->Set(isolate->GetCurrentContext(), LITERAL("loop"), info[4]);//Undefined(isolate));
//    //wndclass->Set(isolate, "write", FunctionTemplate::New(isolate, fs::write));
//
//    //Local<Object> result = wndclass->NewInstance(isolate->GetCurrentContext()).ToLocalChecked(); //why did i have to cap on this dawg
//
//    info.GetReturnValue().Set(wndclass);//result);
//
//}
//
//LRESULT CALLBACK WinProc(HWND hWnd, UINT msg, WPARAM wp, LPARAM lp);
//
//v8::Local<v8::Object> wndclass;
//
//V8FUNC(CreateWindowWrapper) {
//    //MessageBoxA(NULL, "aw shit another unfiinished hting", "ok so like no cap the only message you can resieve as of now is WM_PAINT", MB_OK | MB_ICONEXCLAMATION);
//    using namespace v8;
//
//    Isolate* isolate = info.GetIsolate();
//
//    wndclass = info[0].As<Object>();
//
//    //const char* className = *String::Utf8Value(isolate, wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), String::NewFromUtf8Literal(isolate, "className")).ToLocalChecked());
//    print(*String::Utf8Value(isolate, wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), String::NewFromUtf8Literal(isolate, "className")).ToLocalChecked()));
//    //WNDCLASSA wc{ 0 };
//    WNDCLASSEXA wc{ 0 };
//    wc.hIconSm = LoadIcon(NULL, IDI_QUESTION);
//    wc.hIcon = LoadIcon(NULL, IDI_SHIELD);
//    wc.cbSize = sizeof(WNDCLASSEX);
//    wc.style = wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), String::NewFromUtf8Literal(isolate, "style")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();
//    wc.hInstance = hInstance;
//    wc.lpszClassName = *String::Utf8Value(isolate, wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), String::NewFromUtf8Literal(isolate, "className")).ToLocalChecked());
//    wc.lpfnWndProc = WinProc;
//    wc.hbrBackground = (HBRUSH)COLOR_WINDOW;
//    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
//    print(*String::Utf8Value(isolate, wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), String::NewFromUtf8Literal(isolate, "className")).ToLocalChecked()));
//
//    //if (!RegisterClassA(&wc)) {
//        info.GetReturnValue().Set(false);
//        print("FAILED RegisteClassA "<<hInstance<< " " << GetModuleHandle(NULL));
//        MessageBoxA(NULL, "failed to register window class", (std::string("err: [") + std::to_string(GetLastError()) + "]").c_str(), MB_OK | MB_ICONERROR);
//    }
//
//    int x = info[2].As<Number>()->IntegerValue(isolate->GetCurrentContext()).FromJust();
//    int y = info[3].As<Number>()->IntegerValue(isolate->GetCurrentContext()).FromJust();
//    int width = info[4].As<Number>()->IntegerValue(isolate->GetCurrentContext()).FromJust();
//    int height = info[5].As<Number>()->IntegerValue(isolate->GetCurrentContext()).FromJust();
//
//    print(CStringFI(info[1]) << " " << x << " " << y << " " << width << " " << height);
//
//    HWND newWindow = CreateWindowA(*String::Utf8Value(isolate, wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), String::NewFromUtf8Literal(isolate, "className")).ToLocalChecked()), *String::Utf8Value(isolate, info[1]), WS_OVERLAPPEDWINDOW | WS_VISIBLE, x, y, width, height, NULL, NULL, hInstance, NULL);
//    print(*String::Utf8Value(isolate, wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), String::NewFromUtf8Literal(isolate, "className")).ToLocalChecked()));
//    MessageBoxA(NULL, (std::string("shit")+std::to_string(GetLastError())).c_str(), "titlke", MB_OKCANCEL);
//    SetWindowLongPtrW(newWindow, GWLP_USERDATA, (long long)isolate);//(size_t) & wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("windowProc")).ToLocalChecked().As<Function>());
//
//    ShowWindow(newWindow, SW_SHOW);
//
//    //types.d.ts
//
//    //HWND newWindow = CreateWindowA();
//    //
//    //Local<ObjectTemplate> window = ObjectTemplate::New(isolate);
//    //window->Set(isolate, "read", FunctionTemplate::New(isolate, fs::read));
//    //window->Set(isolate, "write", FunctionTemplate::New(isolate, fs::write));
//    ////filesys->Set(isolate->GetCurrentContext(), String::NewFromUtf8(isolate, "open").ToLocalChecked(), v8::FunctionTemplate::New(isolate, fs::open));
//    ////filesys->Set(isolate, "v", String::NewFromUtf8(isolate, "KYS").ToLocalChecked());
//    //
//    ////print(filesys->IsValue() << " is value");
//    //
//    //Local<Object> result = window->NewInstance(isolate->GetCurrentContext()).ToLocalChecked(); //why did i have to cap on this dawg
//    //
//    //info.GetReturnValue().Set(result);
//
//    MSG Message;
//    Message.message = ~WM_QUIT;
//
//    //Local<Promise::Resolver> uh = Promise::Resolver::New(isolate->GetCurrentContext()).ToLocalChecked();
//    //info.GetReturnValue().Set(uh->GetPromise());
//    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)newWindow));
//
//    Local<Value> args[] = { Number::New(isolate, (LONG_PTR)newWindow)};
//    wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("init")).ToLocalChecked().As<Function>()->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 1, args)/*.ToLocalChecked()*/;
//
//    Local<Function> looper = wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("loop")).ToLocalChecked().As<Function>();
//    print(looper.IsEmpty() << " " << looper->IsUndefined());
//
//    if (!looper->IsUndefined()) {
//        while (Message.message != WM_QUIT)
//        {
//            if (PeekMessage(&Message, NULL, 0, 0, PM_REMOVE))
//            {
//                // If a message was waiting in the message queue, process it
//                //print("wajt");
//                TranslateMessage(&Message);
//                DispatchMessage(&Message);
//            }
//            else
//            {
//                looper->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 0, nullptr);
//                //print("LOPER CALLED!");
//
//                isolate->PerformMicrotaskCheckpoint();
//            }
//        }
//    }
//    else {
//        while (Message.message != WM_QUIT)
//        {
//            if (GetMessage(&Message, NULL, 0, 0))
//            {
//                // If a message was waiting in the message queue, process it
//                //print("wajt");
//                TranslateMessage(&Message);
//                DispatchMessage(&Message);
//            }
//        }
//    }
//
//    print("loop over nigga");
//
//    //uh->Resolve(isolate->GetCurrentContext(), Undefined(isolate)); //https://gist.github.com/jupp0r/5f11c0ee2b046b0ab89660ce85ea480e
//}

V8FUNC(BeginPaintWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    LPPAINTSTRUCT lps = new PAINTSTRUCT{0}; //oh god
    HWND window = NULL;
    if (info[0]->IsNumber()) {
        window = (HWND)info[0].As<Number>()->IntegerValue(isolate->GetCurrentContext()).FromJust();
    }
    BeginPaint(window, lps);

    Local<Object> jsps = Object::New(isolate);

    jsps->Set(isolate->GetCurrentContext(), LITERAL("fErase"), Boolean::New(isolate, lps->fErase));
    jsps->Set(isolate->GetCurrentContext(), LITERAL("fIncUpdate"), Boolean::New(isolate, lps->fIncUpdate));
    jsps->Set(isolate->GetCurrentContext(), LITERAL("fRestore"), Boolean::New(isolate, lps->fRestore));
    jsps->Set(isolate->GetCurrentContext(), LITERAL("hdc"), Number::New(isolate, (long long)lps->hdc));

    Local<Object> rcPaintRect = jsImpl::createWinRect(isolate, lps->rcPaint);//Object::New(isolate);
    //rcPaintRect->Set(isolate->GetCurrentContext(), LITERAL("left"), Number::New(isolate, lps->rcPaint.left));
    //rcPaintRect->Set(isolate->GetCurrentContext(), LITERAL("right"), Number::New(isolate, lps->rcPaint.right));
    //rcPaintRect->Set(isolate->GetCurrentContext(), LITERAL("top"), Number::New(isolate, lps->rcPaint.top));
    //rcPaintRect->Set(isolate->GetCurrentContext(), LITERAL("bottom"), Number::New(isolate, lps->rcPaint.bottom));

    jsps->Set(isolate->GetCurrentContext(), LITERAL("rcPaint"), rcPaintRect);
    //jsps->Set(isolate->GetCurrentContext(), LITERAL("hdc"), Number::New(isolate, lps->rgbReserved));
    jsps->Set(isolate->GetCurrentContext(), LITERAL("ps"), Number::New(isolate, (long long)lps));

    info.GetReturnValue().Set(jsps);
}

V8FUNC(EndPaintWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    LPPAINTSTRUCT lps;
    HWND window = NULL;
    if (info[0]->IsNumber()) {
        window = (HWND)info[0].As<Number>()->IntegerValue(isolate->GetCurrentContext()).FromJust();
    }
    lps = (LPPAINTSTRUCT)info[1].As<Number>()->IntegerValue(isolate->GetCurrentContext()).FromJust();

    EndPaint(window, lps);

    //print("deleting lps");

    delete lps; //phew
}

V8FUNC(CreateRectRgnWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    info.GetReturnValue().Set(Number::New(isolate, (long long)CreateRectRgn(IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]))));
}

V8FUNC(GetDCWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    //HWND window = (HWND)IntegerFI(info[0]);
    //if (info[0]->IsNumber()) { //huh as it turns out i don't have to make this check apparently
    //    window = (HWND)IntegerFI(info[0]);
    //}
    //print(window << " get dc window == " << (HWND)NULL);
    info.GetReturnValue().Set(Number::New(isolate, (long long)GetDC((HWND)IntegerFI(info[0]))));
}

V8FUNC(GetDCExWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    info.GetReturnValue().Set(Number::New(isolate, (long long)GetDCEx((HWND)IntegerFI(info[0]), (HRGN)IntegerFI(info[1]), IntegerFI(info[2]))));
}

V8FUNC(ReleaseDCWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    //HWND window = (HWND)IntegerFI(info[0]); //yeah back in the day i think i thought it would error of there was no info[0th] argument
    //if (info[0]->IsNumber()) {
    //    window = (HWND)IntegerFI(info[0]);
    //}
    info.GetReturnValue().Set(Number::New(isolate, ReleaseDC((HWND)IntegerFI(info[0]), (HDC)IntegerFI(info[1]))));
}

V8FUNC(TextOutWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    HDC dc = (HDC)IntegerFI(info[0]);
    //const wchar_t* words = WStringFI(info[3]); //for some reason storing WStringFI into wchar_t* sometimes gets corrupted
    //print(words << " words");
    //print(wcslen(WStringFI(info[3])) << " " << info[3].As<String>()->Length());
    info.GetReturnValue().Set(TextOut(dc, IntegerFI(info[1]), IntegerFI(info[2]), WStringFI(info[3]), info[3].As<String>()->Length()));//wcslen(words)));
}

V8FUNC(BitBltWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    //HDC dc = (HDC)IntegerFI(info[0]);
    info.GetReturnValue().Set(BitBlt((HDC)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]), (HDC)IntegerFI(info[5]), IntegerFI(info[6]), IntegerFI(info[7]), IntegerFI(info[8])));
}

V8FUNC(StretchBltWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    info.GetReturnValue().Set(StretchBlt((HDC)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]), (HDC)IntegerFI(info[5]), IntegerFI(info[6]), IntegerFI(info[7]), IntegerFI(info[8]), IntegerFI(info[9]), IntegerFI(info[10])));
}

V8FUNC(GetKey) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    int key = IntegerFI(info[0]);
    if (info[0]->IsString()) {
        key = toupper((CStringFI(info[0]))[0]);
    }
    info.GetReturnValue().Set(GetAsyncKeyState(key) & 0x8000);
}

V8FUNC(GetKeyDown) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    int key = IntegerFI(info[0]);
    if (info[0]->IsString()) {
        key = toupper((CStringFI(info[0]))[0]);
    }
    info.GetReturnValue().Set(GetAsyncKeyState(key) & 0x1); //0x01 and 0x1 AND 0x001 work the same? (they all just mean 1)
}

V8FUNC(PostQuitMessageWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    PostQuitMessage(IntegerFI(info[0]));
}

V8FUNC(GetMousePos) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    POINT p{}; GetCursorPos(&p);

    Local<Object> mouse = Object::New(isolate);
    mouse->Set(isolate->GetCurrentContext(), LITERAL("x"), Number::New(isolate, p.x));
    mouse->Set(isolate->GetCurrentContext(), LITERAL("y"), Number::New(isolate, p.y));

    info.GetReturnValue().Set(mouse);
}

V8FUNC(SetMousePos) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(SetCursorPos(IntegerFI(info[0]), IntegerFI(info[1])));
}

V8FUNC(SetBkColorWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    info.GetReturnValue().Set(Number::New(isolate, SetBkColor((HDC)IntegerFI(info[0]), IntegerFI(info[1]))));//RGB(IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3])));
}

V8FUNC(SetBkModeWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    //SetBkColor((HDC)IntegerFI(info[0]), RGB(IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3])));
    info.GetReturnValue().Set(Number::New(isolate, SetBkMode((HDC)IntegerFI(info[0]), IntegerFI(info[1]))));
}

V8FUNC(DrawTextWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    //const char* text = CStringFI(info[1]);
    RECT r = RECT{ (long)IntegerFI(info[2]) ,(long)IntegerFI(info[3]) ,(long)IntegerFI(info[4]) ,(long)IntegerFI(info[5]) };
    info.GetReturnValue().Set(Number::New(isolate, DrawText((HDC)IntegerFI(info[0]), WStringFI(info[1]), -1, &r, IntegerFI(info[6]))));
}

//HFONT defaultfont = NULL;

V8FUNC(SelectObjectWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (long long)SelectObject((HDC)IntegerFI(info[0]), (HGDIOBJ)IntegerFI(info[1]))));
}

V8FUNC(CreatePenWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (long long)CreatePen(IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]))));//RGB(IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4])))));
}

V8FUNC(ExtCreatePenWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    Local<Object> jsLOGBRUSH = info[2].As<Object>();

    LOGBRUSH lpbrush{0};
    lpbrush.lbStyle = jsLOGBRUSH->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("lbStyle")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();
    lpbrush.lbColor = jsLOGBRUSH->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("lbColor")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();
    lpbrush.lbHatch = jsLOGBRUSH->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("lbHatch")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();

    if (IntegerFI(info[0]) & PS_USERSTYLE) {
        MessageBoxA(NULL, "my fault og but PS_USERSTYLE don't work rn because theres some data you gotta use and idk if i can bebotherd", "ExtCreatePenWrapper", MB_OK | MB_ICONERROR);
    }

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)ExtCreatePen(IntegerFI(info[0]), IntegerFI(info[1]), &lpbrush, NULL, nullptr)));
}

V8FUNC(DeleteObjectWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(DeleteObject((HGDIOBJ)IntegerFI(info[0])));
}

V8FUNC(DestroyCursorWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(DestroyCursor((HCURSOR)IntegerFI(info[0])));
}

V8FUNC(DestroyIconWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(DestroyIcon((HICON)IntegerFI(info[0])));
}

V8FUNC(SetDCPenColorWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    /*info.GetReturnValue().Set(*/SetDCPenColor((HDC)IntegerFI(info[0]), IntegerFI(info[1]));//RGB(IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3])));//);
}

V8FUNC(SetDCBrushColorWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    /*info.GetReturnValue().Set(*/SetDCBrushColor((HDC)IntegerFI(info[0]), IntegerFI(info[1]));//RGB(IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3])));//);
}

V8FUNC(CreateSolidBrushWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)CreateSolidBrush(IntegerFI(info[0]))));
}

V8FUNC(MoveToWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    //POINT point{IntegerFI(info[3]), IntegerFI(info[4])};
    //point is [out]

    info.GetReturnValue().Set(MoveToEx((HDC)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), NULL));//&point));
}

V8FUNC(LineToWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(LineTo((HDC)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2])));
}

V8FUNC(RectangleWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Rectangle((HDC)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4])));
}

V8FUNC(GetStockObjectWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)GetStockObject(IntegerFI(info[0]))));
}

V8FUNC(FindWindowWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    const wchar_t* className = NULL;
    if (!info[0]->IsNullOrUndefined() && info[0]->IsString()) {
        className = WStringFI(info[0]);
    }

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)FindWindow(className, WStringFI(info[1]))));
}

V8FUNC(SetTextColorWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    //https://learn.microsoft.com/en-us/windows/win32/gdi/drawing-a-minimized-window
    SetTextColor((HDC)IntegerFI(info[0]), IntegerFI(info[1]));//RGB(IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3])));
}

V8FUNC(CreateFontWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)CreateFontW(IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]), IntegerFI(info[5]), IntegerFI(info[6]), IntegerFI(info[7]), IntegerFI(info[8]), IntegerFI(info[9]), IntegerFI(info[10]), IntegerFI(info[11]), IntegerFI(info[12]), WStringFI(info[13]))));
}

V8FUNC(CreateFontSimpleWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)CreateFontW(IntegerFI(info[2]), IntegerFI(info[1]), 0, 0, FW_DONTCARE, FALSE, FALSE, FALSE, DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, WStringFI(info[0]))));
}

V8FUNC(CreateFontIndirectWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    LOGFONTW lplf{0};

    //print("logofnta");
    
    Local<Object> jsLOGFONT = info[0].As<Object>();
#define GetIntProperty(name) IntegerFI(jsLOGFONT->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL(name)).ToLocalChecked())
#define GetProperty(name) jsLOGFONT->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL(name)).ToLocalChecked()
    lplf.lfHeight = GetIntProperty("lfHeight");
    lplf.lfWidth = GetIntProperty("lfWidth");
    lplf.lfEscapement = GetIntProperty("lfEscapement");
    lplf.lfOrientation = GetIntProperty("lfOrientation");
    lplf.lfWeight = GetIntProperty("lfWeight");
    lplf.lfItalic = GetIntProperty("lfItalic");
    lplf.lfUnderline = GetIntProperty("lfUnderline");
    lplf.lfStrikeOut = GetIntProperty("lfStrikeOut");
    lplf.lfCharSet = GetIntProperty("lfCharSet");
    lplf.lfOutPrecision = GetIntProperty("lfOutPrecision");
    lplf.lfClipPrecision = GetIntProperty("lfClipPrecision");
    lplf.lfQuality = GetIntProperty("lfQuality");
    lplf.lfPitchAndFamily = GetIntProperty("lfPitchAndFamily");
    //print("lfFaceName");
    wcscpy(lplf.lfFaceName, WStringFI(GetProperty("lfFaceName")));
    //lplf.lfFaceName = CStringFI(GetProperty("lfFaceName"));

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)CreateFontIndirect(&lplf)));
}

int CALLBACK EnumFontFamExProc(const LOGFONTW* lpelfe, const TEXTMETRICW* lpntme, DWORD FontType, LPARAM lParam) {
    //print(*lpelfe->lfFaceName << " default char " << lpntme->tmDefaultChar);
    //print(lpelfe->lfFaceName  << " wa " << lpelfe->lfFaceName[0] << " " << *lpelfe->lfFaceName << " " << FontType);
    using namespace v8;
    v8::FunctionCallbackInfo<v8::Value> info = *(v8::FunctionCallbackInfo<v8::Value>*)lParam;
    Isolate* isolate = info.GetIsolate();

    Local<Object> jsLOGFONT = Object::New(isolate);
#define SetProperty(obj, name, value) obj->Set(isolate->GetCurrentContext(), LITERAL(name), Number::New(isolate, value))
#define SetPropertyRaw(obj, name, value) obj->Set(isolate->GetCurrentContext(), LITERAL(name), value)

    SetProperty(jsLOGFONT, "lfCharSet", lpelfe->lfCharSet);
    SetProperty(jsLOGFONT, "lfClipPrecision", lpelfe->lfClipPrecision);
    SetProperty(jsLOGFONT, "lfEscapement", lpelfe->lfEscapement);
    SetPropertyRaw(jsLOGFONT, "lfFaceName", String::NewFromTwoByte(isolate, (uint16_t*)lpelfe->lfFaceName).ToLocalChecked());
    SetProperty(jsLOGFONT, "lfHeight", lpelfe->lfHeight);
    SetProperty(jsLOGFONT, "lfItalic", lpelfe->lfItalic);
    SetProperty(jsLOGFONT, "lfOrientation", lpelfe->lfOrientation);
    SetProperty(jsLOGFONT, "lfOutPrecision", lpelfe->lfOutPrecision);
    SetProperty(jsLOGFONT, "lfPitchAndFamily", lpelfe->lfPitchAndFamily);
    SetProperty(jsLOGFONT, "lfQuality", lpelfe->lfQuality);
    SetProperty(jsLOGFONT, "lfStrikeOut", lpelfe->lfStrikeOut);
    SetProperty(jsLOGFONT, "lfUnderline", lpelfe->lfUnderline);
    SetProperty(jsLOGFONT, "lfWeight", lpelfe->lfWeight);
    SetProperty(jsLOGFONT, "lfWidth", lpelfe->lfWidth);

    Local<Object> jsTEXTMETRIC = Object::New(isolate);

    SetProperty(jsTEXTMETRIC, "tmHeight", lpntme->tmHeight);
    SetProperty(jsTEXTMETRIC, "tmAscent", lpntme->tmAscent);
    SetProperty(jsTEXTMETRIC, "tmDescent", lpntme->tmDescent);
    SetProperty(jsTEXTMETRIC, "tmInternalLeading", lpntme->tmInternalLeading);
    SetProperty(jsTEXTMETRIC, "tmExternalLeading", lpntme->tmExternalLeading);
    SetProperty(jsTEXTMETRIC, "tmAveCharWidth", lpntme->tmAveCharWidth);
    SetProperty(jsTEXTMETRIC, "tmMaxCharWidth", lpntme->tmMaxCharWidth);
    SetProperty(jsTEXTMETRIC, "tmWeight", lpntme->tmWeight);
    SetProperty(jsTEXTMETRIC, "tmOverhang", lpntme->tmOverhang);
    SetProperty(jsTEXTMETRIC, "tmDigitizedAspectX", lpntme->tmDigitizedAspectX);
    SetProperty(jsTEXTMETRIC, "tmDigitizedAspectY", lpntme->tmDigitizedAspectY);
    SetProperty(jsTEXTMETRIC, "tmFirstChar", lpntme->tmFirstChar);
    SetProperty(jsTEXTMETRIC, "tmLastChar", lpntme->tmLastChar);
    SetProperty(jsTEXTMETRIC, "tmDefaultChar", lpntme->tmDefaultChar);
    SetProperty(jsTEXTMETRIC, "tmBreakChar", lpntme->tmBreakChar);
    SetProperty(jsTEXTMETRIC, "tmItalic", lpntme->tmItalic);
    SetProperty(jsTEXTMETRIC, "tmUnderlined", lpntme->tmUnderlined);
    SetProperty(jsTEXTMETRIC, "tmStruckOut", lpntme->tmStruckOut);
    SetProperty(jsTEXTMETRIC, "tmPitchAndFamily", lpntme->tmPitchAndFamily);
    SetProperty(jsTEXTMETRIC, "tmCharSet", lpntme->tmCharSet);

    Local<Value> args[] = { jsLOGFONT, jsTEXTMETRIC, Number::New(isolate, FontType) };
    info[1].As<Function>()->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 3, args);

    return TRUE;
}

V8FUNC(EnumFontFamiliesWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    LOGFONTW digga{ 0 };
    digga.lfCharSet = DEFAULT_CHARSET;
    
    //digga.lfFaceName[0] = '\0';
    //digga.lfPitchAndFamily; //https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-enumfontfamiliesexa

    EnumFontFamiliesExW((HDC)IntegerFI(info[0]), &digga, EnumFontFamExProc, (LPARAM)&info, NULL);
}

V8FUNC(_com_errorWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    HRESULT hr = IntegerFI(info[0]);

    _com_error err(hr);

    //Local<Object> jsErr = Object::New(isolate);
    wchar_t* errMsg = (wchar_t*)err.ErrorMessage();
    const char* errMsgCStr = _bstr_t(errMsg);

    //jsErr->Set(isolate->GetCurrentContext(), LITERAL("ErrorMessage"), String::NewFromUtf8(isolate, errMsgCStr).ToLocalChecked());
    //jsErr->Set(isolate->GetCurrentContext(), LITERAL("Description"), String::NewFromUtf8(isolate, err.Description()).ToLocalChecked());

    info.GetReturnValue().Set(String::NewFromUtf8(isolate, errMsgCStr).ToLocalChecked());//jsErr);
}

V8FUNC(BeepWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Beep(IntegerFI(info[0]), IntegerFI(info[1])));
}

//weird how defining the macros in goodmacrosfordirect2dandwichelper.h right here caused visual studio to die

#include "Direct2D.h"
#include "WICHelper.h"

#pragma comment(lib, "d2d1.lib")
#pragma comment(lib, "dwrite.lib")

//float lerp(float a, float b, float f)
//{
//    return a * (1.0 - f) + (b * f);
//}

#include <v8-typed-array.h>  //wtf the one-argument version of static_asert is not enabled in this mode (DO I HAVE TO SWITCH TO C++ 17???)
//nah what the fuckl one of the lines (Ln: 26) said #if V8_ENABLE_SANDBOX had a weird error so i changed it to #ifdef V8_ENABLE_SANDBOX and it compiled?????
//yeah watch out my edit is NOT synced to github so if this is a problem you gotta change v8-typed-array.h yourself (also i think i changed another thing so that setTimeout would work)

namespace DIRECT2D {
    using namespace v8;
    Local<Object> getMatrixFImpl(Isolate* isolate, D2D1_MATRIX_3X2_F matrix) {
        Local<Object> jsMatrix = Object::New(isolate);

        Local<Context> context = isolate->GetCurrentContext();

        jsMatrix->Set(context, LITERAL("dx"), Number::New(isolate, matrix.dx));
        jsMatrix->Set(context, LITERAL("dy"), Number::New(isolate, matrix.dy));

        Local<Array> jsM = Array::New(isolate, 3);
        Local<Array> jsM1 = Array::New(isolate, 2);
        jsM1->Set(context, 0, Number::New(isolate, matrix.m[0][0]));
        jsM1->Set(context, 1, Number::New(isolate, matrix.m[0][1]));

        Local<Array> jsM2 = Array::New(isolate, 2);
        jsM2->Set(context, 0, Number::New(isolate, matrix.m[1][0]));
        jsM2->Set(context, 1, Number::New(isolate, matrix.m[1][1]));

        Local<Array> jsM3 = Array::New(isolate, 2);
        jsM3->Set(context, 0, Number::New(isolate, matrix.m[2][0]));
        jsM3->Set(context, 1, Number::New(isolate, matrix.m[2][1]));

        jsM->Set(context, 0, jsM1);
        jsM->Set(context, 1, jsM2);
        jsM->Set(context, 2, jsM3);

        jsMatrix->Set(context, LITERAL("m"), jsM);
        jsMatrix->Set(context, LITERAL("m11"), Number::New(isolate, matrix.m11));
        jsMatrix->Set(context, LITERAL("m12"), Number::New(isolate, matrix.m12));
        jsMatrix->Set(context, LITERAL("m21"), Number::New(isolate, matrix.m21));
        jsMatrix->Set(context, LITERAL("m22"), Number::New(isolate, matrix.m22));

        jsMatrix->Set(context, LITERAL("_11"), Number::New(isolate, matrix._11));
        jsMatrix->Set(context, LITERAL("_12"), Number::New(isolate, matrix._12));
        jsMatrix->Set(context, LITERAL("_21"), Number::New(isolate, matrix._21));
        jsMatrix->Set(context, LITERAL("_22"), Number::New(isolate, matrix._22));
        jsMatrix->Set(context, LITERAL("_31"), Number::New(isolate, matrix._31));
        jsMatrix->Set(context, LITERAL("_32"), Number::New(isolate, matrix._32));

        return jsMatrix;
    }

    D2D1_MATRIX_3X2_F fromJSMatrixF(Isolate* isolate, Local<Object> jsMatrix) {//D2D1_MATRIX_3X2_F matrix) {
        D2D1_MATRIX_3X2_F matrix{};

        Local<Context> context = isolate->GetCurrentContext();
        matrix.dx = FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("dx")).ToLocalChecked());
        matrix.dy = FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("dy")).ToLocalChecked());
        //FLOAT m[3][2] = { {10,10},{10,01},{10,10} };

        Local<Array> jsM = jsMatrix->GetRealNamedProperty(context, LITERAL("m")).ToLocalChecked().As<Array>();
        //matrix.m = { {10,10}, {10,10}, {10,10} };
#define randomidc(x,y) FloatFI(jsM->Get(context, x).ToLocalChecked().As<Array>()->Get(context, y).ToLocalChecked())
            //matrix.m = { {randomidc(0,0), randomidc(0, 1)}, {randomidc(1,0), randomidc(1,1)}, {randomidc(2,0), randomidc(2, 1)} };
        matrix.m[0][0] = randomidc(0, 0);
        matrix.m[0][1] = randomidc(0, 1);
        matrix.m[1][0] = randomidc(1, 0);
        matrix.m[1][1] = randomidc(1, 1);
        matrix.m[2][0] = randomidc(2, 0);
        matrix.m[2][1] = randomidc(2, 1);
#undef randomidc
        matrix.m11 = FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("m11")).ToLocalChecked());
        matrix.m12 = FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("m12")).ToLocalChecked());
        matrix.m21 = FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("m21")).ToLocalChecked());
        matrix.m22 = FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("m22")).ToLocalChecked());

        matrix._11 = FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("_11")).ToLocalChecked());
        matrix._12 = FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("_12")).ToLocalChecked());
        matrix._21 = FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("_21")).ToLocalChecked());
        matrix._22 = FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("_22")).ToLocalChecked());
        matrix._31 = FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("_31")).ToLocalChecked());
        matrix._32 = FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("_32")).ToLocalChecked());

        return matrix;
    }

    void setJSMatrixF(Isolate* isolate, D2D1_MATRIX_3X2_F matrix, Local<Object> jsMatrix) {//D2D1_MATRIX_3X2_F matrix) {
        Local<Context> context = isolate->GetCurrentContext();

        jsMatrix->Set(context, LITERAL("dx"), Number::New(isolate, matrix.dx));
        jsMatrix->Set(context, LITERAL("dy"), Number::New(isolate, matrix.dy));

        Local<Array> jsM = Array::New(isolate, 3);
        Local<Array> jsM1 = Array::New(isolate, 2);
        jsM1->Set(context, 0, Number::New(isolate, matrix.m[0][0]));
        jsM1->Set(context, 1, Number::New(isolate, matrix.m[0][1]));

        Local<Array> jsM2 = Array::New(isolate, 2);
        jsM2->Set(context, 0, Number::New(isolate, matrix.m[1][0]));
        jsM2->Set(context, 1, Number::New(isolate, matrix.m[1][1]));

        Local<Array> jsM3 = Array::New(isolate, 2);
        jsM3->Set(context, 0, Number::New(isolate, matrix.m[2][0]));
        jsM3->Set(context, 1, Number::New(isolate, matrix.m[2][1]));

        jsM->Set(context, 0, jsM1);
        jsM->Set(context, 1, jsM2);
        jsM->Set(context, 2, jsM3);

        jsMatrix->Set(context, LITERAL("m"), jsM);
        jsMatrix->Set(context, LITERAL("m11"), Number::New(isolate, matrix.m11));
        jsMatrix->Set(context, LITERAL("m12"), Number::New(isolate, matrix.m12));
        jsMatrix->Set(context, LITERAL("m21"), Number::New(isolate, matrix.m21));
        jsMatrix->Set(context, LITERAL("m22"), Number::New(isolate, matrix.m22));

        jsMatrix->Set(context, LITERAL("_11"), Number::New(isolate, matrix._11));
        jsMatrix->Set(context, LITERAL("_12"), Number::New(isolate, matrix._12));
        jsMatrix->Set(context, LITERAL("_21"), Number::New(isolate, matrix._21));
        jsMatrix->Set(context, LITERAL("_22"), Number::New(isolate, matrix._22));
        jsMatrix->Set(context, LITERAL("_31"), Number::New(isolate, matrix._31));
        jsMatrix->Set(context, LITERAL("_32"), Number::New(isolate, matrix._32));
    }

    D2D1::Matrix3x2F fromJSMatrix3x2(Isolate* isolate, Local<Object> jsMatrix) {//D2D1_MATRIX_3X2_F matrix) {
        Local<Context> context = isolate->GetCurrentContext();

        D2D1::Matrix3x2F matrix(FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("_11")).ToLocalChecked()), FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("_12")).ToLocalChecked()), FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("_21")).ToLocalChecked()), FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("_22")).ToLocalChecked()), FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("_31")).ToLocalChecked()), FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("_32")).ToLocalChecked()));
        return matrix;
    }

    Local<ObjectTemplate> getIUnknownImpl(Isolate* isolate, void* ptr) {
        Local<ObjectTemplate> jsGenericIU = ObjectTemplate::New(isolate);

        jsGenericIU->Set(isolate, "internalPtr", Number::New(isolate, (LONG_PTR)ptr));
        jsGenericIU->Set(isolate, "Release", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            IUnknown* ptr = (IUnknown*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            ptr->Release();
        }));

        return jsGenericIU;
    }

    Local<Object> getWICBitmapImpl(Isolate* isolate, /*IWICBitmapSource*/IWICBitmapSource* wicBitmap, GUID format) {
        Local<ObjectTemplate> jsConverter = getIUnknownImpl(isolate, wicBitmap);

        //{
            //Local<Value> elem[] = { Number::New(isolate, format.Data1), Number::New(isolate, format.Data2), Number::New(isolate, format.Data3), Number::New(isolate, format.Data4[0]), Number::New(isolate, format.Data4[1]), Number::New(isolate, format.Data4[2]), Number::New(isolate, format.Data4[3]), Number::New(isolate, format.Data4[4]), Number::New(isolate, format.Data4[5]), Number::New(isolate, format.Data4[6]), Number::New(isolate, format.Data4[7]) };
            //jsConverter->Set(isolate, "OKNIGGAWHAT", Array::New(isolate, elem, 11)); //for some reason can't pass jsGUID into getWICBitmapImpl or i get some vague ahh error (v8-template line 990)
        //}
        //HandleScope handle_scope(isolate); //aw shit chatgpt-4o just told me that handle_scopes are actually pretty important for memory management (and i haven't really been using any (BUT ALSO when i use jbs my memory doesn't go off the charts so im gonna act like it ain't no probrem)) 

        //Local<Array> su = Array::New(isolate, 1);
        //su->Set(isolate->GetCurrentContext(), 0, LITERAL("HELP"));
        //jsConverter->Set(isolate, "FUCKE", su);

        jsConverter->Set(isolate, "GetPixels", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Local<Context> context = isolate->GetCurrentContext();
            IWICBitmapSource* wicConverter = (IWICBitmapSource*)info.This()->GetRealNamedProperty(context, LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(context).FromJust();
            //ok im not gonna lie everytime i use GetPixels i forget i need to pass wic
            if (!info[0]->BooleanValue(isolate)) {
                MessageBoxA(NULL, "ay bro i think you forgot to pass wic as the first argument bro", "GetPixels", MB_OK | MB_ICONHAND);
            }
            WICHelper* wic = (WICHelper*)IntegerFI(info[0].As<Object>()->GetRealNamedProperty(context, LITERAL("internalPtr")).ToLocalChecked());

            UINT width, height;

            RetIfFailed(wicConverter->GetSize(&width, &height), "GetSize failed (i need to get the size of the bitmap to calculate the ArrayBuffer's length)");

            //bruh you gotta do some GYMNASTICS to get the bitcount from a GUID (https://stackoverflow.com/questions/25797536/getting-a-bitmap-bitsperpixel-from-iwicbitmapsource-iwicbitmap-iwicbitmapdecod)
            //lemme store the guid real quick
            Local<Array> id = info.This()->GetRealNamedProperty(context, LITERAL("GUID")).ToLocalChecked().As<Array>();
            GUID shit = { IntegerFI(id->Get(context, 0).ToLocalChecked()),
    IntegerFI(id->Get(context, 1).ToLocalChecked()),
    IntegerFI(id->Get(context, 2).ToLocalChecked()),
    IntegerFI(id->Get(context, 3).ToLocalChecked()),
    IntegerFI(id->Get(context, 4).ToLocalChecked()),
    IntegerFI(id->Get(context, 5).ToLocalChecked()),
    IntegerFI(id->Get(context, 6).ToLocalChecked()),
    IntegerFI(id->Get(context, 7).ToLocalChecked()),
    IntegerFI(id->Get(context, 8).ToLocalChecked()),
    IntegerFI(id->Get(context, 9).ToLocalChecked()),
    IntegerFI(id->Get(context, 10).ToLocalChecked()) };

            IWICComponentInfo* pIComponentInfo = NULL;
            RetIfFailed(wic->wicFactory->CreateComponentInfo(shit, &pIComponentInfo), "CreateComponentInfo failed (use to get bitcount to calculate ArrayBuffer length)");

            // Get IWICPixelFormatInfo from IWICComponentInfo
            IWICPixelFormatInfo* pIPixelFormatInfo;

            RetIfFailed(pIComponentInfo->QueryInterface(__uuidof(IWICPixelFormatInfo), reinterpret_cast<void**>(&pIPixelFormatInfo)), "QueryInterface failed");

            // Now get the Bits Per Pixel
            UINT bitCount;
            RetIfFailed(pIPixelFormatInfo->GetBitsPerPixel(&bitCount), "GetBitsPerPixel failed (literally right there what happened)");

            if (info[1]->BooleanValue(isolate)) {
                IWICBitmapFlipRotator* pIFlipRotator = NULL;
                RetIfFailed(wic->wicFactory->CreateBitmapFlipRotator(&pIFlipRotator), "CreateBitmapFlipRotator failed (GetPixels)");
                RetIfFailed(pIFlipRotator->Initialize(wicConverter, (WICBitmapTransformOptions)IntegerFI(info[1])), "pIFlipRotator->Initialize error");
                //pIFlipRotator->Release();
                wicConverter = pIFlipRotator; //luckily IWICBitmapFlipRotator is a child of IWICBitmapSource
            }

            auto stride = ((((width * bitCount) + 31) & ~31) >> 3);
            DWORD* bits = new DWORD[width * height]; //bruh i just had to initialize it with a chunk of mem

            RetIfFailed(wicConverter->CopyPixels(NULL, width*4, width*height*4, (BYTE*)bits), "CopyPixels failed bruh what happened"); //ok i know this sounds bad BUT IDC

            //print(bits[0]);
            Local<ArrayBuffer> ab = ArrayBuffer::New(isolate, height * stride); //honestly this math is a guess especially the sizeof part
            memcpy(ab->Data(), bits, height * stride); //GULP
            delete[] bits;
            Local<Uint32Array> arr = Uint32Array::New(ab, 0, width * height); //weird if i multiply this one by sizeof(DWORD) v8 spits out garbage and crashes bad
            info.GetReturnValue().Set(arr);
            if (info[1]->BooleanValue(isolate)) {
                wicConverter->Release(); //release the internal pIFlipRotator
            }
        }));

        jsConverter->Set(isolate, "GetResolution", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            IWICBitmapSource* wicConverter = (IWICBitmapSource*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

            double dpiX, dpiY;

            RetIfFailed(wicConverter->GetResolution(&dpiX, &dpiY), "GetResolution failed?!");

            Local<Object> jsPoint = Object::New(isolate);

            jsPoint->Set(isolate->GetCurrentContext(), LITERAL("x"), Number::New(isolate, dpiX));
            jsPoint->Set(isolate->GetCurrentContext(), LITERAL("y"), Number::New(isolate, dpiY));

            info.GetReturnValue().Set(jsPoint);
        }));

        jsConverter->Set(isolate, "GetSize", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            IWICBitmapSource* wicConverter = (IWICBitmapSource*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

            UINT width, height;

            RetIfFailed(wicConverter->GetSize(&width, &height), "GetSize failed?1");

            Local<Object> jsSize = Object::New(isolate);

            jsSize->Set(isolate->GetCurrentContext(), LITERAL("width"), Number::New(isolate, width));
            jsSize->Set(isolate->GetCurrentContext(), LITERAL("height"), Number::New(isolate, height));

            info.GetReturnValue().Set(jsSize);
        }));

        jsConverter->Set(isolate, "GetPixelFormat", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            IWICBitmapSource* wicConverter = (IWICBitmapSource*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            GUID format{};
            RetIfFailed(wicConverter->GetPixelFormat(&format), "GetPixelFormat failed LO!"); //bruh i don't even say LO! anymore i just put it around ironically now
            Local<Value> elem[] = { Number::New(isolate, format.Data1), Number::New(isolate, format.Data2), Number::New(isolate, format.Data3), Number::New(isolate, format.Data4[0]), Number::New(isolate, format.Data4[1]), Number::New(isolate, format.Data4[2]), Number::New(isolate, format.Data4[3]), Number::New(isolate, format.Data4[4]), Number::New(isolate, format.Data4[5]), Number::New(isolate, format.Data4[6]), Number::New(isolate, format.Data4[7]) };
            info.GetReturnValue().Set(Array::New(isolate, elem, 11));
        }));

        jsConverter->Set(isolate, "Resize", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Local<Context> context = isolate->GetCurrentContext();
            WICHelper* WICObj = (WICHelper*)IntegerFI(info[0].As<Object>()->GetRealNamedProperty(context, LITERAL("internalPtr")).ToLocalChecked());
            IWICBitmapSource* wicConverter = (IWICBitmapSource*)info.This()->GetRealNamedProperty(context, LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(context).FromJust();
            IWICBitmapScaler* pIScaler = NULL;
        
            RetIfFailed(WICObj->wicFactory->CreateBitmapScaler(&pIScaler), "CreateBitmapScaler (ResizeBitmap)");
            RetIfFailed(pIScaler->Initialize(
                wicConverter,                    // Bitmap source to scale.
                IntegerFI(info[1]),                         // Scale width to half of original.
                IntegerFI(info[2]),                        // Scale height to half of original.
                (WICBitmapInterpolationMode)IntegerFI(info[3])), "pIScaler Initialize");   // Use Fant mode interpolation.
            wicConverter->Release();
            info.This()->Set(context, LITERAL("internalPtr"), Number::New(isolate, (LONG_PTR)pIScaler)); //kinda crazy LO!
        }));
        //ok chatgpt said i should convert the objecttemplate to an object before setting an array?

        Local<Object> jsConverterObj = jsConverter->NewInstance(isolate->GetCurrentContext()).ToLocalChecked();
        Local<Value> elem[] = { Number::New(isolate, format.Data1), Number::New(isolate, format.Data2), Number::New(isolate, format.Data3), Number::New(isolate, format.Data4[0]), Number::New(isolate, format.Data4[1]), Number::New(isolate, format.Data4[2]), Number::New(isolate, format.Data4[3]), Number::New(isolate, format.Data4[4]), Number::New(isolate, format.Data4[5]), Number::New(isolate, format.Data4[6]), Number::New(isolate, format.Data4[7]) };
        jsConverterObj->Set(isolate->GetCurrentContext(), LITERAL("GUID"), Array::New(isolate, elem, 11)); //yeah ok v8 is just retarded bruh i can't do this (why tf did this work and why was the error so VAGEU)

        return jsConverterObj;
    }

    Local<ObjectTemplate> getDefaultBrushImpl(Isolate* isolate, ID2D1Brush* newBrush, const char* type = "solid") {
        Local<ObjectTemplate> jsBrush = DIRECT2D::getIUnknownImpl(isolate, newBrush);//ObjectTemplate::New(isolate);

        //jsBrush->Set(isolate, "internalPtr", Number::New(isolate, (LONG_PTR)newBrush));

        jsBrush->Set(isolate, "brush", String::NewFromUtf8(isolate, type).ToLocalChecked());

        jsBrush->Set(isolate, "SetOpacity", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            ID2D1Brush* newBrush = (ID2D1Brush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            
            newBrush->SetOpacity(FloatFI(info[0]));
        }));
        jsBrush->Set(isolate, "GetOpacity", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            ID2D1Brush* newBrush = (ID2D1Brush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            info.GetReturnValue().Set(newBrush->GetOpacity());
        }));
        jsBrush->Set(isolate, "GetTransform", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            ID2D1Brush* newBrush = (ID2D1Brush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            D2D1::Matrix3x2F::D2D_MATRIX_3X2_F matrix;
            newBrush->GetTransform(&matrix);
            info.GetReturnValue().Set(DIRECT2D::getMatrixFImpl(isolate, matrix));
        }));
        jsBrush->Set(isolate, "SetTransform", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            ID2D1Brush* newBrush = (ID2D1Brush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            newBrush->SetTransform(DIRECT2D::fromJSMatrixF(isolate, info[0].As<Object>()));
        }));

        return jsBrush;
    }

    Local<ObjectTemplate> getBitmapImpl(Isolate* isolate, ID2D1Bitmap* bmp) {
        Local<ObjectTemplate> jsBitmap = DIRECT2D::getIUnknownImpl(isolate, bmp);
        
        jsBitmap->Set(isolate, "GetDpi", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            ID2D1Bitmap* bmp = (ID2D1Bitmap*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

            float x, y;

            bmp->GetDpi(&x, &y);

            Local<Array> jsArray = Array::New(isolate, 2);
            jsArray->Set(isolate->GetCurrentContext(), 0, Number::New(isolate,x));
            jsArray->Set(isolate->GetCurrentContext(), 1, Number::New(isolate,y));

            info.GetReturnValue().Set(jsArray);
        }));

        jsBitmap->Set(isolate, "GetPixelFormat", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            ID2D1Bitmap* bmp = (ID2D1Bitmap*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

            D2D1_PIXEL_FORMAT pf = bmp->GetPixelFormat();
            
            
            Local<Object> jsPixelFormat = Object::New(isolate);
            jsPixelFormat->Set(isolate->GetCurrentContext(), LITERAL("format"), Number::New(isolate, pf.format));
            jsPixelFormat->Set(isolate->GetCurrentContext(), LITERAL("alphaMode"), Number::New(isolate, pf.alphaMode));
        
            info.GetReturnValue().Set(jsPixelFormat);
        }));

        jsBitmap->Set(isolate, "GetPixelSize", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            ID2D1Bitmap* bmp = (ID2D1Bitmap*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

            D2D1_SIZE_U size = bmp->GetPixelSize();

            Local<Object> jsPixelSize = Object::New(isolate);
            jsPixelSize->Set(isolate->GetCurrentContext(), LITERAL("width"), Number::New(isolate, size.width));
            jsPixelSize->Set(isolate->GetCurrentContext(), LITERAL("height"), Number::New(isolate, size.height));

            info.GetReturnValue().Set(jsPixelSize);
        }));
        //jsBitmap->Set(isolate, "internalPtr", Number::New(isolate, (LONG_PTR)bmp));
        jsBitmap->Set(isolate, "GetSize", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            ID2D1Bitmap* bmp = (ID2D1Bitmap*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

            D2D1_SIZE_F bmpSize = bmp->GetSize();

            Local<Object> sizeF = Object::New(isolate);
            sizeF->Set(isolate->GetCurrentContext(), LITERAL("width"), Number::New(isolate, bmpSize.width));
            sizeF->Set(isolate->GetCurrentContext(), LITERAL("height"), Number::New(isolate, bmpSize.height));
            info.GetReturnValue().Set(sizeF);
        }));
        jsBitmap->Set(isolate, "CopyFromBitmap", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            ID2D1Bitmap* bmp = (ID2D1Bitmap*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            
            D2D1_POINT_2U point = D2D1::Point2U(IntegerFI(info[0]), IntegerFI(info[1]));
            D2D1_RECT_U rect = D2D1::RectU(IntegerFI(info[3]), IntegerFI(info[4]), IntegerFI(info[5]), IntegerFI(info[6]));
            
            ID2D1Bitmap* copyFrom = (ID2D1Bitmap*)(IntegerFI(info[2].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()));

            //print(bmp << " " << point.x << "<-x  y->" << point.y << " left->" << rect.left << " top->" << rect.top << " right->" << rect.right << " bottom->" << rect.bottom << " " << copyFrom);

            //https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-erref/705fb797-2175-4a90-b5a3-3918024b10b8?redirectedfrom=MSDN
            //getting -2147024809
            //FFFF FFFF 8007 0057
            //0x80070057 -> E_INVALIDARG
            //it did NOT need all that effort to get the code
            //ok i just found the solution
		//https://stackoverflow.com/questions/22493524/decode-hresult-2147467259
            https://stackoverflow.com/questions/7008047/is-there-a-way-to-get-the-string-representation-of-hresult-value-using-win-api
            //IT THINKS MY UNCOMMENTED LINKS ARE LABELS FOR GOTO!
            info.GetReturnValue().Set(Number::New(isolate, bmp->CopyFromBitmap(&point, /*(ID2D1Bitmap*)IntegerFI(info[2])*/copyFrom, &rect)));
        }));
        jsBitmap->Set(isolate, "CopyFromRenderTarget", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            ID2D1Bitmap* bmp = (ID2D1Bitmap*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            
            D2D1_POINT_2U point = D2D1::Point2U(IntegerFI(info[0]), IntegerFI(info[1]));
            D2D1_RECT_U rect = D2D1::RectU(IntegerFI(info[3]), IntegerFI(info[4]), IntegerFI(info[5]), IntegerFI(info[6]));
            
            ID2D1RenderTarget* rt = (ID2D1RenderTarget*)IntegerFI(info[2]);//info[2].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();
            bmp->CopyFromRenderTarget(&point, rt, &rect);
        }));
        //jsBitmap->Set(isolate, "CopyFromMemory", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        //    Isolate* isolate = info.GetIsolate();
        //    ID2D1Bitmap* bmp = (ID2D1Bitmap*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
        //    
        //    D2D1_POINT_2U* point = &D2D1::Point2U(IntegerFI(info[0]), IntegerFI(info[1]));
        //    D2D1_RECT_U* rect = &D2D1::RectU(IntegerFI(info[3]), IntegerFI(info[4]), IntegerFI(info[5]), IntegerFI(info[6]));
        //    
        //    bmp->CopyFromMemory(point, (ID2D1Bitmap*)IntegerFI(info[2]), rect);
        //}));
        //jsBitmap->Set(isolate, "Release", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        //    Isolate* isolate = info.GetIsolate();
        //    ID2D1Bitmap* bmp = (ID2D1Bitmap*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
        //    bmp->Release();
        //}));

        return jsBitmap;
    }

    Local<Object> getColorFImpl(Isolate* isolate, D2D1_COLOR_F color) {
        Local<Object> jsColor = Object::New(isolate);

        jsColor->Set(isolate->GetCurrentContext(), LITERAL("r"), Number::New(isolate, color.r));
        jsColor->Set(isolate->GetCurrentContext(), LITERAL("g"), Number::New(isolate, color.g));
        jsColor->Set(isolate->GetCurrentContext(), LITERAL("b"), Number::New(isolate, color.b));
        jsColor->Set(isolate->GetCurrentContext(), LITERAL("a"), Number::New(isolate, color.a));

        return jsColor;
    }

    Local<Object> getPoint2FImpl(Isolate* isolate, D2D1_POINT_2F point) {
        Local<Object> jsPoint = Object::New(isolate);

        jsPoint->Set(isolate->GetCurrentContext(), LITERAL("x"), Number::New(isolate, point.x));
        jsPoint->Set(isolate->GetCurrentContext(), LITERAL("y"), Number::New(isolate, point.y));

        return jsPoint;
    }

    float f(float x) {
        if (x < .875) {
            return min((max(abs(6*x-1.5)-.75, 0))/1.5, 1);
        }
        else {
            return min((max(abs(6*x-7.5)-.75, 0))/1.5, 1);
        }
    }

    float f3(float x) {
        return max(min(-(abs(6*x-3)-2.25)/1.5, 1), 0);
    }

    ID2D1Brush* AdjustGradients(Isolate* isolate, Local<Object> jsBrush, D2D1_POINT_2F point0, D2D1_POINT_2F point1, float angle = 0.0F) { //unfortunately deprecated due to me finally added SetTransform (because i thought it would be too hard)
        const char* brushType = CStringFI(jsBrush->Get(isolate->GetCurrentContext(), LITERAL("brush")).ToLocalChecked());
        ID2D1Brush* bruh = (ID2D1Brush*)jsBrush->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();
        if (strcmp(brushType, "radial") == 0) {
            ID2D1RadialGradientBrush* brush = (ID2D1RadialGradientBrush*)bruh;
            brush->SetCenter(D2D1::Point2F(point0.x+(point1.x - point0.x) / 2, point0.y+(point1.y - point0.y) / 2));
            //print(((point1.x - point0.x) / 2) << ((point1.y - point0.y) / 2));
            //printf("point0: (%f,%f); point1: (%f,%f); p1-p2: (%f,%f);\n", point0.x, point0.y, point1.x, point1.y, point1.x - point0.x, point1.y - point0.y);
            //brush->SetGradientOriginOffset(D2D1::Point2F((point1.x - point0.x) / 2, (point1.y - point0.y) / 2));
            brush->SetRadiusX(point1.x - point0.x);
            brush->SetRadiusY((point1.y - point0.y));// +strokeWidth);
        }
        else if (strcmp(brushType, "linear") == 0) {
            //angle = (float)((int)angle % 360);
                        //damn it i lose precision (lol it donesn't reall y mater)
            angle = fmod(angle, 360.f);
            ID2D1LinearGradientBrush* brush = (ID2D1LinearGradientBrush*)bruh;
            D2D1_POINT_2F zeroRotP0 = D2D1::Point2F(point0.x+(point1.x-point0.x)*f3(angle/360), point1.y - (point1.y - point0.y) * f(angle / 360));
            D2D1_POINT_2F zeroRotP1 = D2D1::Point2F(point1.x + (point0.x - point1.x) * f3(angle / 360), point0.y - (point0.y - point1.y) * f(angle / 360));
            //https://www.desmos.com/calculator/erqmojpc7j   //absolutely insane math
            //desmos just saved my life
            //even though i probably didn't have to do any of that with D2D1::Matrix math (however idk what imdoing)
            //print(angle);
            //if (angle < 45) {
            //    zeroRotP0 = D2D1::Point2F(point0.x, lerp(point0.y + (point1.y-point0.y)/2, point0.y, angle / 45));
            //    zeroRotP1 = D2D1::Point2F(point1.x, lerp(point1.y - (point1.y - point0.y) / 2, point1.y, angle / 45));
            //}
            //if (angle < 45) {
            //    //print(angle << " " << max(2-angle/45,1));
            //    zeroRotP0 = D2D1::Point2F(point0.x, point0.y + (point1.y - point0.y) / /*max*/(2-angle / 45/*, 1*/));//(2/(angle/22.5)));
            //    zeroRotP1 = D2D1::Point2F(point1.x, point1.y + (point0.y - point1.y) / /*max*/(2-angle / 45/*, 1*/));//(2/(angle/22.5)));
            //}
            //else if (angle < 135) {
            //    angle = angle - 45;
            //    zeroRotP0 = D2D1::Point2F(point0.x + (point1.x - point0.x) * /*max*/(angle/90/*, 1*/), point1.y);//(2/(angle/22.5)));
            //    zeroRotP1 = D2D1::Point2F(point1.x + (point0.x - point1.x) * /*max*/(angle /90/*, 1*/), point0.y);//(2/(angle/22.5)));
            //}
            //else if (angle < 225) {
            //    angle = angle - 135;
            //    zeroRotP0 = D2D1::Point2F(point1.x, point1.y - (point1.y - point0.y) * /*max*/(angle / 90/*, 1*/));//(2/(angle/22.5)));
            //    zeroRotP1 = D2D1::Point2F(point0.x, point0.y - (point0.y - point1.y) * (angle/90));//(2/(angle/22.5)));
            //}
            //else if (angle < 315) {
            //    angle = angle - 225;
            //    zeroRotP0 = D2D1::Point2F(point1.x - (point1.x - point0.x) * /*max*/(angle / 90/*, 1*/), point0.y);//(2/(angle/22.5)));
            //    zeroRotP1 = D2D1::Point2F(point0.x - (point0.x - point1.x) * /*max*/(angle / 90/*, 1*/), point1.y);//(2/(angle/22.5)));
            //}
            //else if (angle < 360) {
            //    angle = angle - 315;
            //    zeroRotP0 = D2D1::Point2F(point0.x, point0.y + (point1.y - point0.y) * (angle / 90));
            //    zeroRotP1 = D2D1::Point2F(point1.x, point1.y + (point0.y - point1.y) * (angle / 90));
            //}
            brush->SetStartPoint(zeroRotP0);
            brush->SetEndPoint(zeroRotP1);
            //THIS ANGLE SHIT IS TRIG! (or is it (vsauce))
        }
        return bruh;
    }
}

//#include "GL/glew.c"
//wait hold on i didn't use GLEW_STATIC so lets just see
#include "GL/glew.h" //oh all i had to do was import glew.c (fix it) and include glew.h
//#pragma comment(lib, "glew/glew32.lib") //do i gotta link the dll too or am i linking this lib wrong ? $(ProjectDir)glew\glew32.dll
//#pragma comment(lib, "GL/libglew32.lib") //ok hold on i gotta do something weird so it's a static link
#pragma comment(lib, "opengl32.lib")

void GLAPIENTRY glMessageCallback(GLenum source, GLenum type, GLuint id, GLenum severity, GLsizei length, const GLchar* message, const void* userParam)
{
    MessageBoxA(NULL, (std::string("GL CALLBACK: ") + (type == GL_DEBUG_TYPE_ERROR ? "** GL ERROR **" : "") + " type = " + std::to_string(type) + ", severity = " + std::to_string(severity) + ", message = " + message).c_str(), NULL, MB_OK | MB_ICONERROR); //just learned that passing null for the title will just default to "Error"
    fprintf(stderr, "GL CALLBACK: %s type = 0x%x, severity = 0x%x, message = %s\n", (type == GL_DEBUG_TYPE_ERROR ? "** GL ERROR **" : ""), type, severity, message);
}

V8FUNC(createCanvas) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    
    Local<ObjectTemplate> context = ObjectTemplate::New(isolate);

    const char* contextType = CStringFI(info[0]);
    if (strcmp(contextType, "d2d") == 0 || strcmp(contextType, "direct2d") == 0) {
        //print("d2d");
        //https://cpp.sh/?source=%2F%2F+Example+program%0A%23include+%3Ciostream%3E%0A%23include+%3Cstring%3E%0A%0Aint+main()%0A%7B%0A++std%3A%3Astring+name%3B%0A++std%3A%3Acout+%3C%3C+%22What+is+your+name%3F+%22%3B%0A++getline+(std%3A%3Acin%2C+name)%3B%0A++std%3A%3Acout+%3C%3C+%22Hello%2C+%22+%3C%3C+name+%3C%3C+%22!%5Cn%22%3B%0A%7D
        //void* d2d;
        //if (IntegerFI(info[1]) == 0) {
        //    d2d = new Direct2D<ID2D1RenderTarget>();
        //    ((Direct2D<ID2D1RenderTarget>*)d2d)->Init((HWND)IntegerFI(info[2]));
        //    context->Set(isolate, "BeginDraw", d2d->BeginDraw);
        //    print("d2d render target");
        //}
        //else {
        //    d2d = new Direct2D<ID2D1DCRenderTarget>();
        //    ((Direct2D<ID2D1DCRenderTarget>*)d2d)->Init((HWND)IntegerFI(info[2]));
        //    print("d2d dc");
        //}
        //Direct2D<ID2D1RenderTarget>* d2d = new Direct2D<ID2D1RenderTarget>();
        Direct2D* d2d = new Direct2D();
        d2d->Init((HWND)IntegerFI(info[2]), IntegerFI(info[1]));
        if (!info[3]->IsNullOrUndefined()) {
            d2d->wicFactory = ((WICHelper*)IntegerFI(info[3].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()))->wicFactory;
        }
        context->Set(isolate, "internalDXPtr", Number::New(isolate, (LONG_PTR)d2d)); //lowkey should set these private but it PROBABLY doesn't matter just dont change it lol
        context->Set(isolate, "renderTarget", Number::New(isolate, (LONG_PTR)d2d->renderTarget));
        //context->Set(isolate, "type", info[1]);
        print("TRENDERTARF< " << d2d->renderTarget);
        context->Set(isolate, "BeginDraw", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //print((LONG_PTR)d2d);
            d2d->renderTarget->BeginDraw();
        }));//d2d->renderTarget->BeginDraw));
        context->Set(isolate, "EndDraw", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //print((LONG_PTR)d2d);
            d2d->renderTarget->EndDraw();
        }));
        context->Set(isolate, "Resize", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            
            if (d2d->type == 0) {
                ID2D1HwndRenderTarget* renderTarget = (ID2D1HwndRenderTarget*)d2d->renderTarget;
                info.GetReturnValue().Set(Number::New(isolate, renderTarget->Resize(D2D1::SizeU(IntegerFI(info[0]), IntegerFI(info[1])))));
            }
            else if(d2d->type == 1) {
                ID2D1DCRenderTarget* renderTarget = (ID2D1DCRenderTarget*)d2d->renderTarget;
                //i almost recreated the entire d2d object
                HDC dc = GetDC(d2d->window);
                RECT r{ 0, 0, IntegerFI(info[0]), IntegerFI(info[1])};
                info.GetReturnValue().Set(Number::New(isolate, renderTarget->BindDC(dc, &r)));
                ReleaseDC(d2d->window, dc);
            }
            else if (d2d->type == 2) {  //possibly dxgi if i can be bothered!

            }
        }));
	//#error BindDC!
        context->Set(isolate, "BindDC", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

            if (d2d->type == 1) {
                d2d->window = (HWND)IntegerFI(info[0]);
                ID2D1DCRenderTarget* renderTarget = (ID2D1DCRenderTarget*)d2d->renderTarget;
                RECT r{ 0 }; GetClientRect(d2d->window, &r);
                info.GetReturnValue().Set(Number::New(isolate, renderTarget->BindDC((HDC)IntegerFI(info[1]), &r)));
            }
            else {
                print("[D2D] -> BindDC() only works with Direct2D objects created with ID2D1DCRenderTarget ( createCanvas('d2d', ID2D1DCRenderTarget, hwnd) )");
            }
        }));
        context->Set(isolate, "CreateSolidColorBrush", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

            ID2D1SolidColorBrush* newBrush;

            d2d->renderTarget->CreateSolidColorBrush(D2D1::ColorF(FloatFI(info[0]), FloatFI(info[1]), FloatFI(info[2]), info[3]->IsNumber() ? FloatFI(info[3]) : 1.0F), & newBrush);//FloatFI(info[3])), &newBrush);

            Local<ObjectTemplate> jsBrush = DIRECT2D::getDefaultBrushImpl(isolate, newBrush);//ObjectTemplate::New(isolate);
            //FUCKING GAME CHANGER
            //jsBrush->Set(isolate, "internalPtr", Number::New(isolate, (LONG_PTR)newBrush));
            jsBrush->Set(isolate, "SetColor", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1SolidColorBrush* newBrush = (ID2D1SolidColorBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
                newBrush->SetColor(D2D1::ColorF(FloatFI(info[0]), FloatFI(info[1]), FloatFI(info[2]), info[3]->IsNumber() ? FloatFI(info[3]) : 1.0F));
            }));
            jsBrush->Set(isolate, "GetColor", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1SolidColorBrush* newBrush = (ID2D1SolidColorBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
                D2D1_COLOR_F color = newBrush->GetColor();

                //double darr[4]{color.r,color.g,color.b,color.a};

                Local<Object> jsColor = DIRECT2D::getColorFImpl(isolate, color);

                info.GetReturnValue().Set(jsColor);//jsImpl::asNumberArray(isolate, darr, 4));
            }));
            //jsBrush->Set(isolate, "SetOpacity", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            //    Isolate* isolate = info.GetIsolate();
            //    ID2D1SolidColorBrush* newBrush = (ID2D1SolidColorBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //    
            //    newBrush->SetOpacity(FloatFI(info[0]));
            //}));
            //jsBrush->Set(isolate, "GetOpacity", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            //    Isolate* isolate = info.GetIsolate();
            //    ID2D1SolidColorBrush* newBrush = (ID2D1SolidColorBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //    info.GetReturnValue().Set(newBrush->GetOpacity());
            //}));
            //jsBrush->Set(isolate, "Release", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            //    Isolate* isolate = info.GetIsolate();
            //    ID2D1SolidColorBrush* newBrush = (ID2D1SolidColorBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //    newBrush->Release();
            //}));

            info.GetReturnValue().Set(jsBrush->NewInstance(isolate->GetCurrentContext()).ToLocalChecked());
        }));
        context->Set(isolate, "DrawRectangle", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

            float strokeWidth = 1.0f;
            if (info[5]->IsNumber()) {
                strokeWidth = FloatFI(info[5]);
            }
            ID2D1StrokeStyle* strokeStyle = NULL;
            if (info[6]->IsNumber()) {
                strokeStyle = (ID2D1StrokeStyle*)IntegerFI(info[6]);
            }

            ID2D1Brush* brush = (ID2D1Brush*)info[4].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();
            d2d->renderTarget->DrawRectangle(D2D1::RectF(FloatFI(info[0]), FloatFI(info[1]), FloatFI(info[2]), FloatFI(info[3])), brush, strokeWidth, strokeStyle);
        }));
        context->Set(isolate, "DrawGradientRectangle", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

            float strokeWidth = 1.0f;
            if (info[6]->IsNumber()) {
                strokeWidth = FloatFI(info[6]);
            }
            ID2D1StrokeStyle* strokeStyle = NULL;
            if (info[7]->IsNumber()) {
                strokeStyle = (ID2D1StrokeStyle*)IntegerFI(info[7]);
            }

            D2D1_POINT_2F point0 = D2D1::Point2F(FloatFI(info[0]), FloatFI(info[1]));
            D2D1_POINT_2F point1 = D2D1::Point2F(FloatFI(info[2]), FloatFI(info[3]));

            ID2D1Brush* brush = DIRECT2D::AdjustGradients(isolate, info[4].As<Object>(), point0, point1, FloatFI(info[5]));
            d2d->renderTarget->DrawRectangle(D2D1::RectF(point0.x, point0.y, point1.x, point1.y), brush, strokeWidth, strokeStyle);
        }));
        context->Set(isolate, "FillRectangle", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            
            ID2D1Brush* brush = (ID2D1Brush*)info[4].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();
            d2d->renderTarget->FillRectangle(D2D1::RectF(FloatFI(info[0]), FloatFI(info[1]), FloatFI(info[2]), FloatFI(info[3])), brush);
        }));
        context->Set(isolate, "FillGradientRectangle", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

            D2D1_POINT_2F point0 = D2D1::Point2F(FloatFI(info[0]), FloatFI(info[1]));
            D2D1_POINT_2F point1 = D2D1::Point2F(FloatFI(info[2]), FloatFI(info[3]));

            ID2D1Brush* brush = DIRECT2D::AdjustGradients(isolate, info[4].As<Object>(), point0, point1, FloatFI(info[5]));
            d2d->renderTarget->FillRectangle(D2D1::RectF(point0.x, point0.y, point1.x, point1.y), brush);
        }));
        context->Set(isolate, "DrawGradientEllipse", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //print((LONG_PTR)d2d);
            float strokeWidth = 1.0f;
            if (info[6]->IsNumber()) {
                strokeWidth = FloatFI(info[6]);
            }
            ID2D1StrokeStyle* strokeStyle = NULL;
            if (info[7]->IsNumber()) {
                strokeStyle = (ID2D1StrokeStyle*)IntegerFI(info[7]);
            }
            D2D1_POINT_2F radius = D2D1::Point2F(FloatFI(info[2]), FloatFI(info[3]));
            D2D1_POINT_2F ogPoints = D2D1::Point2F(FloatFI(info[0]), FloatFI(info[1]));

            D2D1_POINT_2F point0 = D2D1::Point2F(ogPoints.x - (radius.x / 2), ogPoints.y - (radius.y / 2));
            D2D1_POINT_2F point1 = D2D1::Point2F(point0.x + (radius.x), point0.y + (radius.y));

            ID2D1Brush* brush = DIRECT2D::AdjustGradients(isolate, info[4].As<Object>(), point0, point1, FloatFI(info[5]));
            d2d->renderTarget->DrawEllipse(D2D1::Ellipse(ogPoints, radius.x, radius.y), brush, strokeWidth, strokeStyle);
        }));
        context->Set(isolate, "DrawEllipse", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //print((LONG_PTR)d2d);
            float strokeWidth = 1.0f;
            if (info[5]->IsNumber()) {
                strokeWidth = FloatFI(info[5]);
            }
            ID2D1StrokeStyle* strokeStyle = NULL;
            if (info[6]->IsNumber()) {
                strokeStyle = (ID2D1StrokeStyle*)IntegerFI(info[6]);
            }
            ID2D1Brush* brush = (ID2D1Brush*)info[4].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();
            d2d->renderTarget->DrawEllipse(D2D1::Ellipse(D2D1::Point2F(FloatFI(info[0]), FloatFI(info[1])), FloatFI(info[2]), FloatFI(info[3])), brush, strokeWidth, strokeStyle);
        }));
        context->Set(isolate, "FillEllipse", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

            ID2D1Brush* brush = (ID2D1Brush*)info[4].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();
            d2d->renderTarget->FillEllipse(D2D1::Ellipse(D2D1::Point2F(FloatFI(info[0]), FloatFI(info[1])), FloatFI(info[2]), FloatFI(info[3])), brush);
        }));
        context->Set(isolate, "FillGradientEllipse", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            D2D1_POINT_2F radius = D2D1::Point2F(FloatFI(info[2]), FloatFI(info[3]));
            D2D1_POINT_2F ogPoints = D2D1::Point2F(FloatFI(info[0]), FloatFI(info[1]));

            D2D1_POINT_2F point0 = D2D1::Point2F(ogPoints.x-(radius.x/2), ogPoints.y-(radius.y/2));
            D2D1_POINT_2F point1 = D2D1::Point2F(point0.x+(radius.x), point0.y+(radius.y));
            ID2D1Brush* brush = DIRECT2D::AdjustGradients(isolate, info[4].As<Object>(), point0, point1, FloatFI(info[5]));
            d2d->renderTarget->FillEllipse(D2D1::Ellipse(ogPoints, radius.x, radius.y), brush);
        }));
        context->Set(isolate, "CreateFont", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            static bool msg = false;
            if(!msg) MessageBoxA(NULL, "SetFontSize does NOT work yet", "CreateFont", MB_OK | MB_ICONWARNING);
            msg = true;
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

            IDWriteTextFormat* font;

            const char* fontFamily = CStringFI(info[0]);
            size_t length = strlen(fontFamily);
            std::wstring fFws(length, L'#');

            mbstowcs(&fFws[0], fontFamily, length);
            HRESULT shit = d2d->textfactory->CreateTextFormat(
                fFws.c_str(),
                NULL,
                DWRITE_FONT_WEIGHT_NORMAL,
                DWRITE_FONT_STYLE_NORMAL,
                DWRITE_FONT_STRETCH_NORMAL,
                FloatFI(info[1]),
                L"en-us", //locale
                &font
            );

            if (FAILED(shit)) {
                MessageBoxA(NULL, "failed to create text format", "damn", MB_OK | MB_ICONERROR);
            }

            //font->SetWordWrapping(DWRITE_WORD_WRAPPING_NO_WRAP);

            Local<ObjectTemplate> jsFont = ObjectTemplate::New(isolate);

            jsFont->Set(isolate, "internalPtr", Number::New(isolate, (LONG_PTR)font));
            //jsFont->Set(isolate, "family", String::NewFromUtf8(isolate, fontFamily).ToLocalChecked());
            jsFont->Set(isolate, "GetFontSize", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                info.GetReturnValue().Set(font->GetFontSize());
            }));
            jsFont->Set(isolate, "GetFlowDirection", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                info.GetReturnValue().Set(font->GetFlowDirection());
            }));
            //jsFont->Set(isolate, "GetFontCollection", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            //    Isolate* isolate = info.GetIsolate();
            //    IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //
            //    info.GetReturnValue().Set(font->GetFontCollection());
            //}));
            //font->GetFontCollection;
            jsFont->Set(isolate, "GetFontFamilyName", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
                UINT32 length = font->GetFontFamilyNameLength()+1;
                /*wchar_t* wfontfamily;*/std::wstring wfontfamily(length, '#'); font->GetFontFamilyName(&wfontfamily[0], length);
                //char fontfamily;
                std::string fontfamily(length, '#');
                wcstombs(&fontfamily[0], wfontfamily.c_str(), length); //FUCK THIS SHIT DAWG
                info.GetReturnValue().Set(String::NewFromUtf8(isolate, fontfamily.c_str()).ToLocalChecked());
            }));
            jsFont->Set(isolate, "GetFontFamilyNameLength", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
                
                info.GetReturnValue().Set(font->GetFontFamilyNameLength());
            }));
            jsFont->Set(isolate, "GetFontStretch", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                info.GetReturnValue().Set(font->GetFontStretch());
            }));
            jsFont->Set(isolate, "GetFontStyle", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                info.GetReturnValue().Set(font->GetFontStyle());
            }));
            jsFont->Set(isolate, "GetFontWeight", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                info.GetReturnValue().Set(font->GetFontWeight());
            }));
            jsFont->Set(isolate, "GetIncrementalTabStop", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                info.GetReturnValue().Set(font->GetIncrementalTabStop());
            }));
            jsFont->Set(isolate, "GetLineSpacing", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
                DWRITE_LINE_SPACING_METHOD lineSpacingMehtod; //keeping this mispelling LO!
                FLOAT lineSpacing, baseline;
                
                font->GetLineSpacing(&lineSpacingMehtod, &lineSpacing, &baseline);
                
                Local<Object> jsLineSpacingInfo = Object::New(isolate);

                jsLineSpacingInfo->Set(isolate->GetCurrentContext(), LITERAL("lineSpacingMethod"), Number::New(isolate, lineSpacingMehtod));
                jsLineSpacingInfo->Set(isolate->GetCurrentContext(), LITERAL("lineSpacing"), Number::New(isolate, lineSpacing));
                jsLineSpacingInfo->Set(isolate->GetCurrentContext(), LITERAL("baseline"), Number::New(isolate, baseline));

                info.GetReturnValue().Set(jsLineSpacingInfo);
            }));
            jsFont->Set(isolate, "GetParagraphAlignment", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                info.GetReturnValue().Set(font->GetParagraphAlignment());
            }));
            jsFont->Set(isolate, "GetReadingDirection", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                info.GetReturnValue().Set(font->GetReadingDirection());
            }));
            jsFont->Set(isolate, "GetTextAlignment", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                info.GetReturnValue().Set(font->GetTextAlignment());
            }));
            jsFont->Set(isolate, "GetWordWrapping", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                info.GetReturnValue().Set(font->GetWordWrapping());
            }));
            //font->GetLocaleName;
            //font->GetLocaleNameLength;
            jsFont->Set(isolate, "GetTrimming", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
                DWRITE_TRIMMING trimmingOptions;
                font->GetTrimming(&trimmingOptions, NULL);

                Local<Object> jsTrimmingOpt = Object::New(isolate);

                jsTrimmingOpt->Set(isolate->GetCurrentContext(), LITERAL("granularity"), Number::New(isolate, trimmingOptions.granularity));
                jsTrimmingOpt->Set(isolate->GetCurrentContext(), LITERAL("delimiter"), Number::New(isolate, trimmingOptions.delimiter));
                jsTrimmingOpt->Set(isolate->GetCurrentContext(), LITERAL("delimiterCount"), Number::New(isolate, trimmingOptions.delimiterCount));

                info.GetReturnValue().Set(jsTrimmingOpt);
            }));

            jsFont->Set(isolate, "SetFlowDirection", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                font->SetFlowDirection((DWRITE_FLOW_DIRECTION)IntegerFI(info[0]));
            }));
            jsFont->Set(isolate, "SetIncrementalTabStop", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                font->SetIncrementalTabStop(FloatFI(info[0]));
            }));
            jsFont->Set(isolate, "SetLineSpacing", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                font->SetLineSpacing((DWRITE_LINE_SPACING_METHOD)IntegerFI(info[0]), FloatFI(info[1]), FloatFI(info[2]));
            }));
            jsFont->Set(isolate, "SetParagraphAlignment", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                font->SetParagraphAlignment((DWRITE_PARAGRAPH_ALIGNMENT)IntegerFI(info[0]));
            }));
            jsFont->Set(isolate, "SetReadingDirection", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                font->SetReadingDirection((DWRITE_READING_DIRECTION)IntegerFI(info[0]));
            }));
            jsFont->Set(isolate, "SetTextAlignment", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                font->SetTextAlignment((DWRITE_TEXT_ALIGNMENT)IntegerFI(info[0]));
            }));
            jsFont->Set(isolate, "SetTrimming", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                DWRITE_TRIMMING trimmingOptions{(DWRITE_TRIMMING_GRANULARITY)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2])};

                font->SetTrimming(&trimmingOptions, nullptr);
                //WOAH JUST SAW THIS ON THE NET! https://stackoverflow.com/questions/51009082/display-text-in-a-specified-rectangle-with-directwrite
                //font->SetTrimming(&DWRITE_TRIMMING{ (DWRITE_TRIMMING_GRANULARITY)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]) }, nullptr);
                //nvm it didn't work :sob:
            }));
            jsFont->Set(isolate, "SetWordWrapping", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                font->SetWordWrapping((DWRITE_WORD_WRAPPING)IntegerFI(info[0]));
            }));
            jsFont->Set(isolate, "SetFontSize", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            

                //remakefontonbjecnts
            }));
            jsFont->Set(isolate, "Release", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
                
                font->Release();
            }));
            //jsFont->Set(isolate, "GetWidth", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            //    Isolate* isolate = info.GetIsolate();
            //    IDWriteTextFormat* font = (IDWriteTextFormat*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //
            //    DWRITE_TEXT_METRICS textMetrics{ 0 };
            //    DWRITE_OVERHANG_METRICS overhangMetrics;
            //    pST->m_pTextLayout->GetOverhangMetrics(&overhangMetrics); //https://github.com/castorix/Direct2D_CScrollingText/blob/master/CScrollingText.cpp
            //}));
            
            info.GetReturnValue().Set(jsFont->NewInstance(isolate->GetCurrentContext()).ToLocalChecked());

        }));
        context->Set(isolate, "DrawText", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
        
            const char* text = CStringFI(info[0]);
            size_t length = strlen(text);
            std::wstring textws(length, L'#');
            mbstowcs(&textws[0], text, length);

            IDWriteTextFormat* textFormat = (IDWriteTextFormat*)info[1].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();
            ID2D1Brush* brush = (ID2D1Brush*)info[6].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();

            d2d->renderTarget->DrawTextW(textws.c_str(), textws.length(), textFormat, D2D1::RectF(FloatFI(info[2]), FloatFI(info[3]), FloatFI(info[4]), FloatFI(info[5])), brush);
        }));
        context->Set(isolate, "DrawGradientText", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
        
            const char* text = CStringFI(info[0]);
            size_t length = strlen(text);
            std::wstring textws(length, L'#');
            mbstowcs(&textws[0], text, length);

            IDWriteTextFormat* textFormat = (IDWriteTextFormat*)info[1].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //ID2D1Brush* brush = (ID2D1Brush*)info[6].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();
            D2D1_POINT_2F point0 = D2D1::Point2F(FloatFI(info[2]), FloatFI(info[3]));
            D2D1_POINT_2F point1 = D2D1::Point2F(FloatFI(info[4]), FloatFI(info[5]));

            ID2D1Brush* brush = DIRECT2D::AdjustGradients(isolate, info[6].As<Object>(), point0, point1, FloatFI(info[7]));//, strokeWidth);

            d2d->renderTarget->DrawTextW(textws.c_str(), textws.length(), textFormat, D2D1::RectF(point0.x, point0.y, point1.x, point1.y), brush);
        }));
        context->Set(isolate, "CreateBitmap", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
        
            ID2D1Bitmap* bmp;
        
            HRESULT shit = d2d->renderTarget->CreateBitmap(D2D1::SizeU(IntegerFI(info[0]), IntegerFI(info[1])), D2D1::BitmapProperties(d2d->renderTarget->GetPixelFormat()), &bmp);
        
            if (shit != S_OK) {
                MessageBoxA(NULL, "aw shit we could NOT create that bitmap for you lemme try again", "renderTarget->CreateBitmap using renderTarget pixel format", MB_OK | MB_ICONHAND);
                shit = d2d->renderTarget->CreateBitmap(D2D1::SizeU(IntegerFI(info[0]), IntegerFI(info[1])), D2D1::BitmapProperties(D2D1::PixelFormat(DXGI_FORMAT_R8G8B8A8_UNORM, d2d->renderTarget->GetPixelFormat().alphaMode)), &bmp);
                if (shit != S_OK) {
                    MessageBoxA(NULL, "ok nah we tried again and we still couldn't create the bitmap", "renderTarget->CreateBitmap using R8G8B8A8 pixel format and renderTarget alpha", MB_OK | MB_ICONERROR);
                }
            }

            Local<ObjectTemplate> jsBitmap = DIRECT2D::getBitmapImpl(isolate, bmp);//DIRECT2D::getIUnknownImpl(isolate, bmp);//ObjectTemplate::New(isolate);
        
            info.GetReturnValue().Set(jsBitmap->NewInstance(isolate->GetCurrentContext()).ToLocalChecked());
        }));
        context->Set(isolate, "CreateBitmapFromWicBitmap", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            IWICFormatConverter* wicConverter = (IWICFormatConverter*)info[0].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();//IntegerFI(info[0]);
            ID2D1Bitmap* bmp;
        
            RetIfFailed(d2d->renderTarget->CreateBitmapFromWicBitmap(wicConverter, NULL, &bmp), "failed d2d->renderTarget->CreateBitmapFromWicBitmap");
            //if (shit != S_OK) {
            //    MessageBoxA(NULL, "failed d2d->renderTarget->CreateBitmapFromWicBitmap (probably use _com_error(GetLastError()) to learn more)", "load bitmap wicConverter", MB_OK | MB_ICONERROR);
            //    return;
            //}
            
            if (info[1]->BooleanValue(isolate)) {
                wicConverter->Release();
            }
        
            Local<ObjectTemplate> jsBitmap = DIRECT2D::getBitmapImpl(isolate, bmp);//DIRECT2D::getIUnknownImpl(isolate, bmp);//ObjectTemplate::New(isolate);
        
            info.GetReturnValue().Set(jsBitmap->NewInstance(isolate->GetCurrentContext()).ToLocalChecked());
        }));
        context->Set(isolate, "CreateBitmapFromFilename", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
        
            //IWICImagingFactory2* wicFactory = nullptr;
            //
            //HRESULT shit = CoCreateInstance(CLSID_WICImagingFactory, NULL, CLSCTX_INPROC_SERVER, IID_IWICImagingFactory, (LPVOID*)&wicFactory);
            //
            //if (shit != S_OK) {
            //    MessageBoxA(NULL, "yo shit FUCKED UP co create instance WIC image", "yeah we failed to create the wic factory (loading the bitmap)", MB_OK | MB_ICONERROR);
            //    return;
            //}
        
            IWICBitmapDecoder* wicDecoder = NULL;
        
            //const char* text = CStringFI(info[0]); //ayo WTF is this
            //size_t length = strlen(text);
            //std::wstring filenamews(length, L'#');
            //mbstowcs(&filenamews[0], text, length);
            
            const wchar_t* filenamews = WStringFI(info[0]);
        
            HRESULT shit = d2d->wicFactory->CreateDecoderFromFilename(filenamews/*.c_str()*/, NULL, GENERIC_READ, WICDecodeMetadataCacheOnLoad, &wicDecoder);
            if (shit != S_OK) {
                MessageBoxA(NULL, "NewWICBitmap likely failed because the file was not found", "yeah we failed that hoe (CreateDecoderFromFilename)", MB_OK | MB_ICONERROR);
                return;
            }
        
            IWICBitmapFrameDecode* wicFrame = NULL;
            shit = wicDecoder->GetFrame(IntegerFI(info[1]), &wicFrame);
        
            if (shit != S_OK) {
                MessageBoxA(NULL, "GetFirstFrameWiC", "yeah we failed the hoe (wicDecoder->GetFrame(0, &wicFrame))", MB_OK | MB_ICONERROR);
                wicDecoder->Release();
                return;
            }
        
            IWICFormatConverter* wicConverter = NULL;
            shit = d2d->wicFactory->CreateFormatConverter(&wicConverter);
        
            if (shit != S_OK) {
                MessageBoxA(NULL, "Wic converter", "failed wicFactory->CreateFormatConverter(&wicConverter)", MB_OK | MB_ICONERROR);
                wicDecoder->Release();
                wicFrame->Release();
                return;
            }
        
            shit = wicConverter->Initialize(wicFrame, GUID_WICPixelFormat32bppPBGRA, WICBitmapDitherTypeNone, NULL, 0.0, WICBitmapPaletteTypeCustom);
            if (shit != S_OK) {
                MessageBoxA(NULL, "WIC CONVERTER2", "failed wicConverter->Initialize", MB_OK | MB_ICONERROR);
                wicDecoder->Release();
                wicFrame->Release();
                wicConverter->Release();
                return;
            }
        
            ID2D1Bitmap* bmp;
        
            shit = d2d->renderTarget->CreateBitmapFromWicBitmap(wicConverter, NULL, &bmp);
            if (shit != S_OK) {
                MessageBoxA(NULL, "failed d2d->renderTarget->CreateBitmapFromWicBitmap (probably use _com_error(GetLastError()) to learn more)", "load bitmap wicConverter", MB_OK | MB_ICONERROR);
                wicDecoder->Release();
                wicConverter->Release();
                wicFrame->Release();
                return;
            }
            
        
            //wicFactory->Release();
            wicDecoder->Release();
            wicConverter->Release();
            wicFrame->Release();
        
            Local<ObjectTemplate> jsBitmap = DIRECT2D::getBitmapImpl(isolate, bmp);//DIRECT2D::getIUnknownImpl(isolate, bmp);//ObjectTemplate::New(isolate);
        
            info.GetReturnValue().Set(jsBitmap->NewInstance(isolate->GetCurrentContext()).ToLocalChecked());
        }));
        context->Set(isolate, "DrawBitmap", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            ID2D1Bitmap* bmp = (ID2D1Bitmap*)info[0].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();//IntegerFI(info[0]);
                                                                                                                //had the unfortunate realization that the alpha is not automatically set to 1
            d2d->renderTarget->DrawBitmap(bmp, D2D1::RectF(FloatFI(info[1]), FloatFI(info[2]), FloatFI(info[3]), FloatFI(info[4])), info[5]->IsNumber() ? FloatFI(info[5]) : 1.0, (D2D1_BITMAP_INTERPOLATION_MODE)IntegerFI(info[6]), D2D1::RectF(info[7]->IsNumber() ? FloatFI(info[7]) : 0.0F, info[8]->IsNumber() ? FloatFI(info[8]) : 0.0F, info[9]->IsNumber() ? FloatFI(info[9]) : bmp->GetSize().width, info[10]->IsNumber() ? FloatFI(info[10]) : bmp->GetSize().height));
        }));
        context->Set(isolate, "CreateBitmapBrush", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            ID2D1Bitmap* bmp = (ID2D1Bitmap*)info[0].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();//IntegerFI(info[0]);

            ID2D1BitmapBrush* bmpBrush;

            d2d->renderTarget->CreateBitmapBrush(bmp, &bmpBrush);

            Local<ObjectTemplate> jsBrush = DIRECT2D::getDefaultBrushImpl(isolate, bmpBrush, "bitmap");//ObjectTemplate::New(isolate);
            //jsBrush->Set(isolate, "internalPtr", Number::New(isolate, (LONG_PTR)bmpBrush));
            jsBrush->Set(isolate, "GetExtendModeX", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1BitmapBrush* bmpBrush = (ID2D1BitmapBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
                
                //unsigned int extend = bmpBrush->GetExtendModeX();
                info.GetReturnValue().Set(bmpBrush->GetExtendModeX());
            }));
            jsBrush->Set(isolate, "GetExtendModeY", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1BitmapBrush* bmpBrush = (ID2D1BitmapBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
                
                //unsigned int extend = bmpBrush->GetExtendModeX();
                info.GetReturnValue().Set(bmpBrush->GetExtendModeY());
            }));
            jsBrush->Set(isolate, "GetExtendMode", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1BitmapBrush* bmpBrush = (ID2D1BitmapBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
                
                //unsigned int extend = bmpBrush->GetExtendModeX();
                info.GetReturnValue().Set(DIRECT2D::getPoint2FImpl(isolate, D2D1::Point2F(bmpBrush->GetExtendModeX(), bmpBrush->GetExtendModeY())));
            }));
            jsBrush->Set(isolate, "GetInterpolationMode", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1BitmapBrush* bmpBrush = (ID2D1BitmapBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
                
                info.GetReturnValue().Set(bmpBrush->GetInterpolationMode());
            }));

            jsBrush->Set(isolate, "SetExtendModeX", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1BitmapBrush* bmpBrush = (ID2D1BitmapBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
                
                //unsigned int extend = bmpBrush->GetExtendModeX();
                bmpBrush->SetExtendModeX((D2D1_EXTEND_MODE)IntegerFI(info[0]));
            }));
            jsBrush->Set(isolate, "SetExtendModeY", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1BitmapBrush* bmpBrush = (ID2D1BitmapBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
                
                bmpBrush->SetExtendModeY((D2D1_EXTEND_MODE)IntegerFI(info[0]));
            }));
            jsBrush->Set(isolate, "SetExtendMode", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1BitmapBrush* bmpBrush = (ID2D1BitmapBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
                
                bmpBrush->SetExtendModeX((D2D1_EXTEND_MODE)IntegerFI(info[0]));
                bmpBrush->SetExtendModeY((D2D1_EXTEND_MODE)IntegerFI(info[0]));
            }));
            jsBrush->Set(isolate, "SetInterpolationMode", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1BitmapBrush* bmpBrush = (ID2D1BitmapBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
                
                bmpBrush->SetInterpolationMode((D2D1_BITMAP_INTERPOLATION_MODE)IntegerFI(info[0]));
            }));

            jsBrush->Set(isolate, "SetBitmap", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1BitmapBrush* bmpBrush = (ID2D1BitmapBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
                ID2D1Bitmap* bmp = (ID2D1Bitmap*)info[0].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();
                //print("bmpBrush->" << bmpBrush << " bmp->" << bmp);
                bmpBrush->SetBitmap(bmp);
            }));
            jsBrush->Set(isolate, "GetBitmap", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1BitmapBrush* bmpBrush = (ID2D1BitmapBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
                ID2D1Bitmap* bmp;
                bmpBrush->GetBitmap(&bmp);

                Local<ObjectTemplate> jsBitmap = DIRECT2D::getBitmapImpl(isolate, bmp);//DIRECT2D::getIUnknownImpl(isolate, bmp);//ObjectTemplate::New(isolate);

                info.GetReturnValue().Set(jsBitmap->NewInstance(isolate->GetCurrentContext()).ToLocalChecked());
                //info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)bmp));
            }));
            //jsBrush->Set(isolate, "SetOpacity", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            //    Isolate* isolate = info.GetIsolate();
            //    ID2D1BitmapBrush* bmpBrush = (ID2D1BitmapBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //    bmpBrush->SetOpacity(FloatFI(info[0]));
            //}));
            //jsBrush->Set(isolate, "GetOpacity", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            //    Isolate* isolate = info.GetIsolate();
            //    ID2D1BitmapBrush* bmpBrush = (ID2D1BitmapBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //    info.GetReturnValue().Set(bmpBrush->GetOpacity());
            //}));
            //jsBrush->Set(isolate, "Release", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            //    Isolate* isolate = info.GetIsolate();
            //    ID2D1BitmapBrush* bmpBrush = (ID2D1BitmapBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //    bmpBrush->Release();
            //}));

            info.GetReturnValue().Set(jsBrush->NewInstance(isolate->GetCurrentContext()).ToLocalChecked());

        }));
        //d2d->renderTarget->SetTransform;
        //d2d->renderTarget->GetTransform;
        context->Set(isolate, "CreateGradientStopCollection", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

            //D2D1_GRADIENT_STOP* gradientstops;
            std::vector<D2D1_GRADIENT_STOP> gradientstops;//((size_t)info.Length(), )//(size_t)info.Length(), nullptr);
            //ZeroMemory(gradientstops, sizeof(D2D1_GRADIENT_STOP)*info.Length());
            for (int i = 0; i < info.Length()/*-1*/; i++) {
                MaybeLocal<Value> fourth = info[i].As<Object>()->Get(isolate->GetCurrentContext(), 4);
                D2D1_COLOR_F color = D2D1::ColorF(info[i].As<Object>()->Get(isolate->GetCurrentContext(), 1).ToLocalChecked()->NumberValue(isolate->GetCurrentContext()).FromJust(), info[i].As<Object>()->Get(isolate->GetCurrentContext(), 2).ToLocalChecked()->NumberValue(isolate->GetCurrentContext()).FromJust(), info[i].As<Object>()->Get(isolate->GetCurrentContext(), 3).ToLocalChecked()->NumberValue(isolate->GetCurrentContext()).FromJust(), fourth.IsEmpty() ? 1.0F : fourth.ToLocalChecked()->IsNumber() ? fourth.ToLocalChecked()->NumberValue(isolate->GetCurrentContext()).FromJust() : 1.0F);
                /*for (uint32_t j = 0; j <= 3; j++) {
                    Local<Number> shit;
                    info[i].As<Object>()->Get(isolate->GetCurrentContext(), j).ToLocal(&shit);
                    if (!shit.IsEmpty()) {

                    }
                }*/
                print("i: " << i << " " << color.r << " " << color.g << " " << color.b << " " << color.a); //NAN IS A THING IN C++????
                //print("i:" << i << " " << color.r << " " << color.g << " " color.b << " " << color.a);
                //gradientstops[i] = D2D1::GradientStop(info[i].As<Object>()->Get(isolate->GetCurrentContext(), 0).ToLocalChecked()->NumberValue(isolate->GetCurrentContext()).FromJust(), color);
                gradientstops./*emplace*/push_back(D2D1::GradientStop(info[i].As<Object>()->Get(isolate->GetCurrentContext(), 0).ToLocalChecked()->NumberValue(isolate->GetCurrentContext()).FromJust(), color));//.emplace_back(); //uhh finsihe that
            }

            print("lengtrgh >> " << info.Length());//IntegerFI(info[info.Length() - 1]));

            ID2D1GradientStopCollection* gSC;

            d2d->renderTarget->CreateGradientStopCollection(gradientstops.data(), /*IntegerFI(info[info.Length() - 1])*/info.Length(), & gSC);

            Local<ObjectTemplate> jsGSC = DIRECT2D::getIUnknownImpl(isolate, gSC);//ObjectTemplate::New(isolate);

            //jsGSC->Set(isolate, "internalPtr", Number::New(isolate, (LONG_PTR)gSC));
            //jsGSC->Set(isolate, "Release", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            //    Isolate* isolate = info.GetIsolate();
            //    ID2D1GradientStopCollection* gSC = (ID2D1GradientStopCollection*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //    gSC->Release();
            //}));

            info.GetReturnValue().Set(jsGSC->NewInstance(isolate->GetCurrentContext()).ToLocalChecked());
        }));
        context->Set(isolate, "CreateLinearGradientBrush", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            //MessageBoxA(NULL, "if i can be bothered i might have to implement the transform methods", "buddy i ain't do that yet ok", MB_OK | MB_ICONASTERISK);
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            ID2D1LinearGradientBrush* newBrush;
            ID2D1GradientStopCollection* gSC = (ID2D1GradientStopCollection*)(info[4].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust());
            //print("gSC -> " << (LONG_PTR)gSC);
            //D2D1_GRADIENT_STOP stops[2]; gSC->GetGradientStops(stops, 2);
            //print("stops -> " << stops << " " << stops[0].color.r << " " << stops[0].color.g);
                                                                                                                                                                //HOW LONG HAS THAT BEEN LIKE THAT????
            d2d->renderTarget->CreateLinearGradientBrush(D2D1::LinearGradientBrushProperties(D2D1::Point2F(FloatFI(info[0]), FloatFI(info[1])), D2D1::Point2F(FloatFI(info[2]), FloatFI(info[3]))), gSC, &newBrush);//D2D1::ColorF(FloatFI(info[0]), FloatFI(info[1]), FloatFI(info[2]), info[3]->IsNumber() ? FloatFI(info[3]) : 1.0F), & newBrush);//FloatFI(info[3])), &newBrush);
        
            Local<ObjectTemplate> jsBrush = DIRECT2D::getDefaultBrushImpl(isolate, newBrush, "linear");//ObjectTemplate::New(isolate);
            //jsBrush->Set(isolate, "internalPtr", Number::New(isolate, (LONG_PTR)newBrush));
            //jsBrush->Set(isolate, "SetOpacity", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            //    Isolate* isolate = info.GetIsolate();
            //    ID2D1LinearGradientBrush* newBrush = (ID2D1LinearGradientBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //    
            //    newBrush->SetOpacity(FloatFI(info[0]));
            //}));
            jsBrush->Set(isolate, "GetStartPoint", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1LinearGradientBrush* newBrush = (ID2D1LinearGradientBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                D2D1_POINT_2F sp = newBrush->GetStartPoint();
            
                info.GetReturnValue().Set(DIRECT2D::getPoint2FImpl(isolate, sp));
            }));
            jsBrush->Set(isolate, "GetEndPoint", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1LinearGradientBrush* newBrush = (ID2D1LinearGradientBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
                
                D2D1_POINT_2F ep = newBrush->GetEndPoint();

                info.GetReturnValue().Set(DIRECT2D::getPoint2FImpl(isolate, ep));
            }));

            jsBrush->Set(isolate, "SetStartPoint", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1LinearGradientBrush* newBrush = (ID2D1LinearGradientBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                newBrush->SetStartPoint(D2D1::Point2F(FloatFI(info[0]), FloatFI(info[1])));
            }));
            jsBrush->Set(isolate, "SetEndPoint", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1LinearGradientBrush* newBrush = (ID2D1LinearGradientBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
                
                newBrush->SetEndPoint(D2D1::Point2F(FloatFI(info[0]), FloatFI(info[1])));
            }));
            jsBrush->Set(isolate, "SetPoints", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1LinearGradientBrush* newBrush = (ID2D1LinearGradientBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
                
                newBrush->SetStartPoint(D2D1::Point2F(FloatFI(info[0]), FloatFI(info[1])));
                newBrush->SetEndPoint(D2D1::Point2F(FloatFI(info[2]), FloatFI(info[3])));
            }));
            
            //jsBrush->Set(isolate, "Release", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            //    Isolate* isolate = info.GetIsolate();
            //    ID2D1LinearGradientBrush* newBrush = (ID2D1LinearGradientBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //    newBrush->Release();
            //}));
        
            info.GetReturnValue().Set(jsBrush->NewInstance(isolate->GetCurrentContext()).ToLocalChecked());
        }));
        context->Set(isolate, "CreateRadialGradientBrush", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            ID2D1RadialGradientBrush* newBrush;
            ID2D1GradientStopCollection* gSC = (ID2D1GradientStopCollection*)(info[6].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust());

            d2d->renderTarget->CreateRadialGradientBrush(D2D1::RadialGradientBrushProperties(D2D1::Point2F(FloatFI(info[0]), FloatFI(info[1])), D2D1::Point2F(FloatFI(info[2]), FloatFI(info[3])), FloatFI(info[4]), FloatFI(info[5])), gSC, &newBrush);

            Local<ObjectTemplate> jsBrush = DIRECT2D::getDefaultBrushImpl(isolate, newBrush, "radial");

            jsBrush->Set(isolate, "GetCenter", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1RadialGradientBrush* newBrush = (ID2D1RadialGradientBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                info.GetReturnValue().Set(DIRECT2D::getPoint2FImpl(isolate, newBrush->GetCenter()));
            }));
            jsBrush->Set(isolate, "GetGradientOriginOffset", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1RadialGradientBrush* newBrush = (ID2D1RadialGradientBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                info.GetReturnValue().Set(DIRECT2D::getPoint2FImpl(isolate, newBrush->GetGradientOriginOffset()));
            }));
            jsBrush->Set(isolate, "GetRadiusX", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1RadialGradientBrush* newBrush = (ID2D1RadialGradientBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                info.GetReturnValue().Set(newBrush->GetRadiusX());
            }));
            jsBrush->Set(isolate, "GetRadiusY", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1RadialGradientBrush* newBrush = (ID2D1RadialGradientBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                info.GetReturnValue().Set(newBrush->GetRadiusY());
            }));
            jsBrush->Set(isolate, "GetRadius", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1RadialGradientBrush* newBrush = (ID2D1RadialGradientBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                info.GetReturnValue().Set(DIRECT2D::getPoint2FImpl(isolate, D2D1::Point2F(newBrush->GetRadiusX(), newBrush->GetRadiusY())));
            }));
            
            jsBrush->Set(isolate, "SetCenter", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1RadialGradientBrush* newBrush = (ID2D1RadialGradientBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                newBrush->SetCenter(D2D1::Point2F(FloatFI(info[0]), FloatFI(info[1])));
            }));
            jsBrush->Set(isolate, "SetGradientOriginOffset", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1RadialGradientBrush* newBrush = (ID2D1RadialGradientBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                newBrush->SetGradientOriginOffset(D2D1::Point2F(FloatFI(info[0]), FloatFI(info[1])));
            }));
            jsBrush->Set(isolate, "SetRadiusX", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1RadialGradientBrush* newBrush = (ID2D1RadialGradientBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                newBrush->SetRadiusX(FloatFI(info[0]));
            }));
            jsBrush->Set(isolate, "SetRadiusY", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1RadialGradientBrush* newBrush = (ID2D1RadialGradientBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                newBrush->SetRadiusY(FloatFI(info[0]));
            }));
            jsBrush->Set(isolate, "SetRadius", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                ID2D1RadialGradientBrush* newBrush = (ID2D1RadialGradientBrush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                newBrush->SetRadiusX(FloatFI(info[0]));
                newBrush->SetRadiusY(FloatFI(info[0]));
            }));

            info.GetReturnValue().Set(jsBrush->NewInstance(isolate->GetCurrentContext()).ToLocalChecked());
        }));
        context->Set(isolate, "RestoreDrawingState", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            ID2D1DrawingStateBlock* drawingStateBlock;// = (ID2D1DrawingStateBlock*)IntegerFI(info[0]);
            
            //if (info[0]->IsNumber()) {
            //    drawingStateBlock = (ID2D1DrawingStateBlock*)info[0].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //}
            //else {
                drawingStateBlock = d2d->drawingStateBlock;
            //}
            d2d->renderTarget->RestoreDrawingState(drawingStateBlock);
        }));
        //context->Set(isolate, "CreateDrawingStateBlock", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        //    MessageBoxA(NULL, "warning probably not implemented correctly yet", "get to it lil nigga", MB_OK | MB_ICONEXCLAMATION);
        //    Isolate* isolate = info.GetIsolate();
        //    Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
        //    ID2D1DrawingStateBlock* drawingStateBlock;
        //    HRESULT result = d2d->factory->CreateDrawingStateBlock(D2D1::DrawingStateDescription(), &drawingStateBlock);//D2D1::DrawingStateDescription();
        //    
        //    if (result != S_OK) {
        //        MessageBoxA(NULL, "HELP create drawing state block did NOT work", "uhhhh we need some HELP!", MB_OK | MB_ICONERROR);
        //        return;
        //    }
        //
        //    Local<ObjectTemplate> jsDSB = DIRECT2D::getIUnknownImpl(isolate, d2d->drawingStateBlock);//ObjectTemplate::New(isolate);
        //
        //    info.GetReturnValue().Set(jsDSB->NewInstance(isolate->GetCurrentContext()).ToLocalChecked());
        //}));
        context->Set(isolate, "SaveDrawingState", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            //MessageBoxA(NULL, "warning probably not implemented correctly yet", "get to it lil nigga", MB_OK | MB_ICONEXCLAMATION); (wait i think i was actually cooking here (except why did i store it in d2d (and i just realized i was trying to replicate the html canvas' save and restore functions)))
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //ID2D1DrawingStateBlock* drawingStateBlock;
            //HRESULT result = d2d->factory->CreateDrawingStateBlock(D2D1::DrawingStateDescription(), &drawingStateBlock);//D2D1::DrawingStateDescription();
            
            //if (result != S_OK) {
            //    MessageBoxA(NULL, "HELP create drawing state block did NOT work", "uhhhh we need some HELP!", MB_OK | MB_ICONERROR);
            //    return;
            //}

            d2d->renderTarget->SaveDrawingState(d2d->drawingStateBlock);
            
            //Local<ObjectTemplate> jsDSB = DIRECT2D::getIUnknownImpl(isolate, d2d->drawingStateBlock);//ObjectTemplate::New(isolate);

            //jsDSB->Set(isolate, "internalPtr", Number::New(isolate, (LONG_PTR)drawingStateBlock));
            //jsDSB->Set(isolate, "Release", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            //    Isolate* isolate = info.GetIsolate();
            //    ID2D1DrawingStateBlock* drawingStateBlock = (ID2D1DrawingStateBlock*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //    drawingStateBlock->Release();
            //}));

            //info.GetReturnValue().Set(jsDSB->NewInstance(isolate->GetCurrentContext()).ToLocalChecked());
            //info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)drawingStateBlock));
        }));

        context->Set(isolate, "GetTransform", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            D2D1_MATRIX_3X2_F matrix; d2d->renderTarget->GetTransform(&matrix);
            info.GetReturnValue().Set(DIRECT2D::getMatrixFImpl(isolate, matrix));
            
            //D2D1_MATRIX_3X2_F* matrix = new D2D1_MATRIX_3X2_F(); d2d->renderTarget->GetTransform(matrix);
            
            //Local<Object> jsMatrixObj = Object::New(isolate);
            //jsMatrixObj->Set(isolate->GetCurrentContext(), LITERAL("dx"), Number::New(isolate, matrix.dx));
            //jsMatrixObj->Set(isolate->GetCurrentContext(), LITERAL("dy"), Number::New(isolate, matrix.dy));
        
            //Local<ObjectTemplate> jsMatrix = ObjectTemplate::New(isolate);
            //jsMatrix->Set(isolate, "internalPtr", Number::New(isolate, (LONG_PTR)matrix));
            //jsMatrix->Set(isolate, "Release", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            //    Isolate* isolate = info.GetIsolate();
            //    D2D1_MATRIX_3X2_F* matrix = (D2D1_MATRIX_3X2_F*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //    
            //    delete matrix;
            //}));
        
            //info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)matrix));//DIRECT2D::getMatrixImpl(isolate, matrix));
        }));
        context->Set(isolate, "SetTransform", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            
            d2d->renderTarget->SetTransform(DIRECT2D::fromJSMatrixF(isolate, info[0].As<Object>()));
            //d2d->renderTarget->SetTransform(matrix);
        }));
        context->Set(isolate, "DrawGradientRoundedRectangle", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //ID2D1Brush* brush = (ID2D1Brush*)info[6].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust
            D2D1_POINT_2F point0 = D2D1::Point2F(FloatFI(info[0]), FloatFI(info[1]));
            D2D1_POINT_2F point1 = D2D1::Point2F(FloatFI(info[2]), FloatFI(info[3]));
            ID2D1Brush* bruh = DIRECT2D::AdjustGradients(isolate, info[6].As<Object>(), point0, point1, FloatFI(info[7]));
            d2d->renderTarget->DrawRoundedRectangle(D2D1::RoundedRect(D2D1::RectF(point0.x, point0.y, point1.x, point1.y), FloatFI(info[4]), FloatFI(info[5])), bruh, info[8]->IsNumber() ? FloatFI(info[8]) : 1.0F, info[9]->IsNumber() ? (ID2D1StrokeStyle*)IntegerFI(info[9]) : NULL);
        }));
        context->Set(isolate, "DrawRoundedRectangle", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            ID2D1Brush* brush = (ID2D1Brush*)info[6].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();

            d2d->renderTarget->DrawRoundedRectangle(D2D1::RoundedRect(D2D1::RectF(FloatFI(info[0]), FloatFI(info[1]), FloatFI(info[2]), FloatFI(info[3])), FloatFI(info[4]), FloatFI(info[5])), brush, info[7]->IsNumber() ? FloatFI(info[7]) : 1.0F, info[8]->IsNumber() ? (ID2D1StrokeStyle*)IntegerFI(info[8]) : NULL);
        }));
        context->Set(isolate, "FillRoundedRectangle", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            ID2D1Brush* brush = (ID2D1Brush*)info[6].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();
            
            d2d->renderTarget->FillRoundedRectangle(D2D1::RoundedRect(D2D1::RectF(FloatFI(info[0]), FloatFI(info[1]), FloatFI(info[2]), FloatFI(info[3])), FloatFI(info[4]), FloatFI(info[5])), brush);
        }));
        context->Set(isolate, "Flush", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            //Local<Context> context = isolate->GetCurrentContext();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //D2D1_TAG tag1;
            //D2D1_TAG tag2;
            //HRESULT s = d2d->renderTarget->Flush(&tag1, &tag2);
            //Local<Array> jsArray = Array::New(isolate, 2);
            //jsArray->Set(context, 0, );
            info.GetReturnValue().Set(Number::New(isolate, d2d->renderTarget->Flush()));
        }));
        context->Set(isolate, "GetAntialiasMode", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            
            info.GetReturnValue().Set(d2d->renderTarget->GetAntialiasMode());
        }));
        context->Set(isolate, "SetAntialiasMode", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            
            d2d->renderTarget->SetAntialiasMode((D2D1_ANTIALIAS_MODE)IntegerFI(info[0]));
        }));
        context->Set(isolate, "SetDpi", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            
            d2d->renderTarget->SetDpi(FloatFI(info[0]), FloatFI(info[1]));
        }));
        context->Set(isolate, "GetMaximumBitmapSize", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            
            info.GetReturnValue().Set(d2d->renderTarget->GetMaximumBitmapSize());
        }));
        context->Set(isolate, "FillGradientRoundedRectangle", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //ID2D1Brush* brush = (ID2D1Brush*)info[6].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();
            D2D1_POINT_2F point0 = D2D1::Point2F(FloatFI(info[0]), FloatFI(info[1]));
            D2D1_POINT_2F point1 = D2D1::Point2F(FloatFI(info[2]), FloatFI(info[3]));
            ID2D1Brush* bruh = DIRECT2D::AdjustGradients(isolate, info[6].As<Object>(), point0, point1, FloatFI(info[7]));
            d2d->renderTarget->FillRoundedRectangle(D2D1::RoundedRect(D2D1::RectF(point0.x,point0.y,point1.x,point1.y), FloatFI(info[4]), FloatFI(info[5])), bruh);
        }));
        context->Set(isolate, "GetSize", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

            Local<Object> shit = Object::New(isolate);
            D2D1_SIZE_F sizeF = d2d->renderTarget->GetSize();
            shit->Set(isolate->GetCurrentContext(), LITERAL("width"), Number::New(isolate, sizeF.width));
            shit->Set(isolate->GetCurrentContext(), LITERAL("height"), Number::New(isolate, sizeF.height));
            info.GetReturnValue().Set(shit);
        }));
        context->Set(isolate, "GetPixelSize", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

            Local<Object> shit = Object::New(isolate);
            D2D1_SIZE_U sizeU = d2d->renderTarget->GetPixelSize();
            shit->Set(isolate->GetCurrentContext(), LITERAL("width"), Number::New(isolate, sizeU.width));
            shit->Set(isolate->GetCurrentContext(), LITERAL("height"), Number::New(isolate, sizeU.height));
            info.GetReturnValue().Set(shit);
        }));
        context->Set(isolate, "DrawLine", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            ID2D1Brush* brush = (ID2D1Brush*)info[4].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();

            d2d->renderTarget->DrawLine(D2D1::Point2F(FloatFI(info[0]), FloatFI(info[1])), D2D1::Point2F(FloatFI(info[2]), FloatFI(info[3])), brush, info[5]->IsNumber() ? FloatFI(info[5]) : 1.0F, info[6]->IsNumber() ? (ID2D1StrokeStyle*)IntegerFI(info[6]) : NULL);
        }));
        context->Set(isolate, "DrawGradientLine", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            Local<Object> jsBrush = info[4].As<Object>();//->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked();
            //ID2D1Brush* bruh = (ID2D1Brush*)jsBrush->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //const char* brushType = CStringFI(jsBrush->Get(isolate->GetCurrentContext(), LITERAL("brush")).ToLocalChecked());
            D2D1_POINT_2F point0 = D2D1::Point2F(FloatFI(info[0]), FloatFI(info[1]));
            D2D1_POINT_2F point1 = D2D1::Point2F(FloatFI(info[2]), FloatFI(info[3]));
            float strokeWidth = info[5]->IsNumber() ? FloatFI(info[5]) : 1.0F;
            ID2D1Brush* bruh = DIRECT2D::AdjustGradients(isolate, jsBrush, point0, point1, FloatFI(info[7]));//, strokeWidth);

            d2d->renderTarget->DrawLine(point0, point1, bruh, strokeWidth, info[6]->IsNumber() ? (ID2D1StrokeStyle*)IntegerFI(info[6]) : NULL);
        }));

        context->Set(isolate, "Clear", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            if (info[3]->IsNumber() && d2d->clearBrush != nullptr) {
                d2d->clearBrush->SetColor(D2D1::ColorF(FloatFI(info[0]), FloatFI(info[1]), FloatFI(info[2]), FloatFI(info[3])));
                D2D1_SIZE_F size = d2d->renderTarget->GetSize();
                d2d->renderTarget->FillRectangle(D2D1::RectF(0,0,size.width, size.height), d2d->clearBrush);
            }
            else {
                d2d->renderTarget->Clear(D2D1::ColorF(FloatFI(info[0]), FloatFI(info[1]), FloatFI(info[2]), info[3]->IsNumber() ? FloatFI(info[3]) : 1.0F));
            }
        }));

        context->Set(isolate, "Release", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            
            delete d2d;
        }));
        //context->Set(isolate, "EndDraw", d2d->EndDraw);
        //delete d2d;
    }
    else if (strcmp(contextType, "d3d") == 0 || strcmp(contextType, "direct3d") == 0 || strcmp(contextType, "directx") == 0) {
        print("d3d");
    }
    else if (strcmp(contextType, "gl") == 0 || strcmp(contextType, "webgl") == 0) {
        HWND window = (HWND)IntegerFI(info[2]);
        //RECT r{}; GetClientRect(window, &r);

        //print(r.left);
        //print(r.right);
        //print(r.top);
        //print(r.bottom);

        HDC hdc = GetDC(window);

        PIXELFORMATDESCRIPTOR pfd = {
            sizeof(PIXELFORMATDESCRIPTOR),   // size of this pfd  
            1,                     // version number  
            PFD_DRAW_TO_WINDOW |   // support window  
            PFD_SUPPORT_OPENGL |   // support OpenGL  
            PFD_DOUBLEBUFFER,      // double buffered  
            PFD_TYPE_RGBA,         // RGBA type  
            32,                    // 32-bit color depth  
            0, 0, 0, 0, 0, 0,      // color bits ignored  
            0,                     // no alpha buffer  
            0,                     // shift bit ignored  
            0,                     // no accumulation buffer  
            0, 0, 0, 0,            // accum bits ignored  
            32,                    // 32-bit z-buffer  
            0,                     // no stencil buffer  
            0,                     // no auxiliary buffer  
            PFD_MAIN_PLANE,        // main layer  
            0,                     // reserved  
            0, 0, 0                // layer masks ignored  
        };


        int format = ChoosePixelFormat(hdc, &pfd);

        SetPixelFormat(hdc, format, &pfd);

#define WGL_CONTEXT_MAJOR_VERSION_ARB     0x2091
#define WGL_CONTEXT_MINOR_VERSION_ARB     0x2092
#define WGL_CONTEXT_FLAGS_ARB             0x2094
#define WGL_CONTEXT_CORE_PROFILE_BIT_ARB  0x00000001
#define WGL_CONTEXT_PROFILE_MASK_ARB      0x9126

        //typedef HGLRC(WINAPI* PFNWGLCREATECONTEXTATTRIBSARBPROC) (HDC hDC, HGLRC hShareContext, const int* attribList);
        //
        //PFNWGLCREATECONTEXTATTRIBSARBPROC wglCreateContextAttribsARB =
        //    (PFNWGLCREATECONTEXTATTRIBSARBPROC)wglGetProcAddress("wglCreateContextAttribsARB");

        HGLRC tempRC = wglCreateContext(hdc);
        wglMakeCurrent(hdc, tempRC);

        glewExperimental = GL_TRUE;
        glewInit();

        //https://gist.github.com/nickrolfe/1127313ed1dbf80254b614a721b3ee9c

        typedef HGLRC WINAPI wglCreateContextAttribsARB_type(HDC hdc, HGLRC hShareContext,
            const int* attribList);
        wglCreateContextAttribsARB_type* wglCreateContextAttribsARB;
        wglCreateContextAttribsARB = (wglCreateContextAttribsARB_type*)wglGetProcAddress(
            "wglCreateContextAttribsARB");

        int gl33_attribs[] =
        {
            WGL_CONTEXT_MAJOR_VERSION_ARB, 3,
            WGL_CONTEXT_MINOR_VERSION_ARB, 3,
            //WGL_CONTEXT_PROFILE_MASK_ARB,  WGL_CONTEXT_CORE_PROFILE_BIT_ARB,
            0,
        };
        print(wglCreateContextAttribsARB);
        HGLRC hglrc = wglCreateContextAttribsARB(hdc, 0, gl33_attribs);//wglCreateContext(hdc);
        if (hglrc == NULL) {
            MessageBoxA(NULL, "KILLING MYSELF", "HELP BRO IM PLAYING FORTNITE", MB_CANCELTRYCONTINUE); //oh yeah i had to make an opengl 3.2+ context for RenderDoc to work (because i was about to end it)
        }
        wglMakeCurrent(NULL, NULL);
        wglDeleteContext(tempRC);
        wglMakeCurrent(hdc, hglrc);

        context->Set(isolate, "HGLRC", Number::New(isolate, (LONG_PTR)hglrc));
        context->Set(isolate, "HDC", Number::New(isolate, (LONG_PTR)hdc));
        

        glEnable(GL_DEBUG_OUTPUT);
        glDebugMessageCallback(glMessageCallback, 0);

        GLuint vao; glGenVertexArrays(1, &vao); glBindVertexArray(vao);

#define INFOLOG_LEN 512
#define V8GLFUNC(x) context->Set(isolate, x, FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) { \
                    Isolate* isolate = info.GetIsolate();
        V8GLFUNC("viewport") //ok this looks really weird but im tryna speed up this process
            glViewport(IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]));
        })); //this could have been a macro too like ENDGLFUNC but idgaf
        V8GLFUNC("clearColor")
            glClearColor(FloatFI(info[0]), FloatFI(info[1]), FloatFI(info[2]), FloatFI(info[3]));
        }));
        V8GLFUNC("clear")
            glClear(IntegerFI(info[0]));
        }));
        V8GLFUNC("clearDepth")
            glClearDepth(FloatFI(info[0]));
        }));
        V8GLFUNC("clearStencil")
            glClearStencil(IntegerFI(info[0]));
        }));
        V8GLFUNC("colorMask")
            glColorMask(IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]));
        }));
        V8GLFUNC("createShader")
            info.GetReturnValue().Set(glCreateShader(IntegerFI(info[0])));
        }));
        V8GLFUNC("shaderSource")
            //const char* source = CStringFI(info[1]);
            std::string source = std::string(CStringFI(info[1]));
            const char* lemmeputitinalanguageytoucanunderstand = source.c_str(); //this weird ass technique stopped the weird corruption garbage issue
            //GLint len = info[1].As<String>()->Utf8Length(isolate);
            glShaderSource(IntegerFI(info[0]), 1, &lemmeputitinalanguageytoucanunderstand, NULL);//&len);//NULL);
        }));
        V8GLFUNC("compileShader")
            glCompileShader(IntegerFI(info[0]));
        }));
        V8GLFUNC("getShaderParameter")
            GLint success;
            glGetShaderiv(IntegerFI(info[0]), IntegerFI(info[1]), &success);
            info.GetReturnValue().Set(success);
        }));
        V8GLFUNC("getShaderInfoLog")
            char infoLog[INFOLOG_LEN];
            glGetShaderInfoLog(IntegerFI(info[0]), INFOLOG_LEN, NULL, infoLog);
            info.GetReturnValue().Set(String::NewFromUtf8(isolate, infoLog).ToLocalChecked());
        }));
        V8GLFUNC("createProgram")
            info.GetReturnValue().Set(glCreateProgram());
        }));
        V8GLFUNC("attachShader")
            glAttachShader(IntegerFI(info[0]), IntegerFI(info[1]));
        }));
        V8GLFUNC("linkProgram")
            glLinkProgram(IntegerFI(info[0]));
        }));
        V8GLFUNC("detachShader")
            glDetachShader(IntegerFI(info[0]), IntegerFI(info[1]));
        }));
        V8GLFUNC("deleteShader")
            glDeleteShader(IntegerFI(info[0]));
        }));
        V8GLFUNC("getProgramParameter")
            GLint success;
            glGetProgramiv(IntegerFI(info[0]), IntegerFI(info[1]), &success);
            info.GetReturnValue().Set(success);
        }));
        V8GLFUNC("getProgramInfoLog")
            char infoLog[INFOLOG_LEN];
            glGetProgramInfoLog(IntegerFI(info[0]), INFOLOG_LEN, NULL, infoLog);
            info.GetReturnValue().Set(String::NewFromUtf8(isolate, infoLog).ToLocalChecked());
        }));
        V8GLFUNC("createBuffer")
            //bruh in gl on the c++ side there is no function called createBuffer BUT LUCKILY the webgl spec actually says it's related to glGenBuffers! (https://registry.khronos.org/webgl/specs/latest/1.0/#5.14.5)
            GLuint buffer; glGenBuffers(1, &buffer); //this boogie is for real got so much canneed heat in my heels yeah gone dance tgone dance my blues away to night YOU KNOW THIS BOOGIE IS FOR REAL GOT SO MUCH CANNED HEAT IN MY HEELS YEAH GONE DANCE GONE DACEN YBOOOOGES AWAY Y TO NIGHT DANCE ! COME ON GOT CANNED HEAT IN MY HEELS  TONIGHT
            info.GetReturnValue().Set(buffer);
        }));
        V8GLFUNC("bindBuffer")
            glBindBuffer(IntegerFI(info[0]), IntegerFI(info[1]));
        }));
        V8GLFUNC("bufferData")
            Local<Float32Array> jsData = info[1].As<Float32Array>();
            GLfloat* data = new GLfloat[jsData->Length()]; jsData->CopyContents(data, jsData->ByteLength());
            glBufferData(IntegerFI(info[0]), jsData->ByteLength(), data, IntegerFI(info[2]));
            //oops i forgot to delete data
            delete[] data;
        }));
        V8GLFUNC("blendColor")
            glBlendColor(FloatFI(info[0]), FloatFI(info[1]), FloatFI(info[2]), FloatFI(info[3]));
        }));
        V8GLFUNC("blendEquation")
            glBlendEquation(IntegerFI(info[0]));
        }));
        V8GLFUNC("blendEquationSeparate")
            glBlendEquationSeparate(IntegerFI(info[0]), IntegerFI(info[1]));
        }));
        V8GLFUNC("blendFunc")
            glBlendFunc(IntegerFI(info[0]), IntegerFI(info[1]));
        }));
        V8GLFUNC("blendFuncSeparate")
            glBlendFuncSeparate(IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]));
        }));
        V8GLFUNC("getAttribLocation")
            info.GetReturnValue().Set(glGetAttribLocation(IntegerFI(info[0]), CStringFI(info[1])));
        }));
        V8GLFUNC("vertexAttribPointer")
            glVertexAttribPointer(IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]), (void*)IntegerFI(info[5]));
        }));
        V8GLFUNC("enableVertexAttribArray")
            glEnableVertexAttribArray(IntegerFI(info[0]));
        }));
        V8GLFUNC("useProgram")
            glUseProgram(IntegerFI(info[0]));
        }));
        V8GLFUNC("validateProgram")
            glValidateProgram(IntegerFI(info[0]));
        }));
        V8GLFUNC("getUniformLocation")
            info.GetReturnValue().Set(glGetUniformLocation(IntegerFI(info[0]), CStringFI(info[1])));
        }));
        V8GLFUNC("checkFramebufferStatus")
            info.GetReturnValue().Set(glCheckFramebufferStatus(IntegerFI(info[0])));
        }));
        V8GLFUNC("createTexture")
            GLuint iChannel0;
            glCreateTextures(GL_TEXTURE_2D, 1, &iChannel0);//textures);
            info.GetReturnValue().Set(iChannel0);
            //GLuint iChannel0 = textures[0];
            //glActiveTexture(GL_TEXTURE0);
            //glBindTexture(GL_TEXTURE_2D, iChannel0);
        }));
        V8GLFUNC("createFramebuffer")
            GLuint framebuffer;
            glCreateFramebuffers(1, &framebuffer);
            info.GetReturnValue().Set(framebuffer);
        }));
        V8GLFUNC("createRenderbuffer")
            GLuint renderbuffer;
            glCreateRenderbuffers(1, &renderbuffer);
            info.GetReturnValue().Set(renderbuffer);
        }));
        V8GLFUNC("bindFramebuffer")
            glBindFramebuffer(IntegerFI(info[0]), IntegerFI(info[1]));
        }));
        V8GLFUNC("bindRenderbuffer")
            glBindRenderbuffer(IntegerFI(info[0]), IntegerFI(info[1]));
        }));
        V8GLFUNC("bindTexture")
            glBindTexture(IntegerFI(info[0]), IntegerFI(info[1]));
        }));
        V8GLFUNC("activeTexture")
            glActiveTexture(IntegerFI(info[0]));
        }));
        V8GLFUNC("texImage2D")
            void* data = nullptr;
            if (info[8]->BooleanValue(isolate)) {
                Local<Float32Array> jsData = info[8].As<Float32Array>();
                data = new void*[jsData->Length()]; //i swear earlier it told me that you couldn't do this
                jsData->CopyContents(data, jsData->ByteLength());
            }
            glTexImage2D(IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]), IntegerFI(info[5]), IntegerFI(info[6]), IntegerFI(info[7]), data);
            delete[] data;
        }));
        V8GLFUNC("texSubImage2D")
            void* data = nullptr;
            if (info[8]->BooleanValue(isolate)) {
                Local<Float32Array> jsData = info[8].As<Float32Array>();
                data = new void*[jsData->Length()]; //i swear earlier it told me that you couldn't do this
                jsData->CopyContents(data, jsData->ByteLength());
            }
            glTexSubImage2D(IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]), IntegerFI(info[5]), IntegerFI(info[6]), IntegerFI(info[7]), data);
            delete[] data;
        }));
        V8GLFUNC("readPixels")
            GLsizei width = IntegerFI(info[2]);
            GLsizei height = IntegerFI(info[3]);
            void* bits = new void*[width*height];
            GLenum type = IntegerFI(info[5]);
            glReadPixels(IntegerFI(info[0]), IntegerFI(info[1]), width, height, IntegerFI(info[4]), type, bits);
            int bitCount;
            if (type == GL_UNSIGNED_BYTE) {
                bitCount = 32; //?
            }
            else {
                MessageBoxA(NULL, "imma be real idk how to handle anything other than unsigned byte for this one chief", "gl.readPixels", MB_ABORTRETRYIGNORE);
            }
            auto stride = ((((width * bitCount) + 31) & ~31) >> 3);
            Local<ArrayBuffer> ab = ArrayBuffer::New(isolate, height * stride); //honestly this math is a guess especially the sizeof part
            memcpy(ab->Data(), bits, height* stride); //GULP
            delete[] bits;
            Local<Uint32Array> arr = Uint32Array::New(ab, 0, width * height); //weird if i multiply this one by sizeof(DWORD) v8 spits out garbage and crashes bad
            info.GetReturnValue().Set(arr);
        }));
        V8GLFUNC("readBuffer")
            glReadBuffer(IntegerFI(info[0]));
        }));
        V8GLFUNC("copyTexImage2D")
            //glReadBuffer(GL_FRONT);
            glCopyTexImage2D(IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]), IntegerFI(info[5]), IntegerFI(info[6]), IntegerFI(info[7]));
        }));
        //oh i just learned the TexSub functions are for updating textures
        V8GLFUNC("copyTexSubImage2D")
            //glReadBuffer(GL_FRONT);
            glCopyTexSubImage2D(IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]), IntegerFI(info[5]), IntegerFI(info[6]), IntegerFI(info[7]));
        }));
        V8GLFUNC("cullFace")
            glCullFace(IntegerFI(info[0]));
        }));
        V8GLFUNC("deleteBuffer")
            GLuint buffer = IntegerFI(info[0]);
            glDeleteBuffers(1, &buffer);
        }));
        V8GLFUNC("deleteFramebuffer")
            GLuint framebuffer = IntegerFI(info[0]);
            glDeleteFramebuffers(1, &framebuffer);
        }));
        V8GLFUNC("deleteRenderbuffer")
            GLuint renderbuffer = IntegerFI(info[0]);
            glDeleteRenderbuffers(1, &renderbuffer);
        }));
        V8GLFUNC("deleteTexture")
            GLuint texture = IntegerFI(info[0]);
            glDeleteTextures(1, &texture);
        }));
        V8GLFUNC("depthFunc")
            glDepthFunc(IntegerFI(info[0]));
        }));
        V8GLFUNC("depthMask")
            glDepthMask(IntegerFI(info[0]));
        }));
        V8GLFUNC("depthRange")
            glDepthRange(FloatFI(info[0]), FloatFI(info[1]));
        }));
        V8GLFUNC("disable")
            glDisable(IntegerFI(info[0]));
        }));
        V8GLFUNC("enable")
            glEnable(IntegerFI(info[0]));
        }));
        V8GLFUNC("finish")
            glFinish();
        }));
        V8GLFUNC("flush")
            glFlush();
        }));
        V8GLFUNC("framebufferRenderbuffer")
            glFramebufferRenderbuffer(IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]));
        }));
        V8GLFUNC("framebufferTexture2D")
            glFramebufferTexture2D(IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]));
        }));
        V8GLFUNC("frontFace")
            glFrontFace(IntegerFI(info[0]));
        }));
        V8GLFUNC("stencilFunc")
            glStencilFunc(IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]));
        }));
        V8GLFUNC("stencilFuncSeparate")
            glStencilFuncSeparate(IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]));
        }));
        V8GLFUNC("stencilMask")
            glStencilMask(IntegerFI(info[0]));
        }));
        V8GLFUNC("stencilMaskSeparate")
            glStencilMaskSeparate(IntegerFI(info[0]), IntegerFI(info[1]));
        }));
        V8GLFUNC("stencilOp")
            glStencilOp(IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]));
        }));
        V8GLFUNC("stencilOpSeparate")
            glStencilOpSeparate(IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]));
        }));
        V8GLFUNC("disableVertexAttribArray")
            glDisableVertexAttribArray(IntegerFI(info[0]));
        }));
        V8GLFUNC("generateMipmap")
            glGenerateMipmap(IntegerFI(info[0]));
        }));
        V8GLFUNC("texParameteri")
            glTexParameteri(IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]));
        }));
        V8GLFUNC("texParameterf")
            glTexParameterf(IntegerFI(info[0]), IntegerFI(info[1]), FloatFI(info[2]));
        }));
        V8GLFUNC("pixelStorei")
            glPixelStorei(IntegerFI(info[0]), IntegerFI(info[1]));
        }));
        V8GLFUNC("pixelStoref")
            glPixelStoref(IntegerFI(info[0]), FloatFI(info[1]));
        }));
#define ISWHATEVER(what) V8GLFUNC("is" #what) \
            info.GetReturnValue().Set(glIs##what(IntegerFI(info[0]))); \
        }))
        ISWHATEVER(Buffer);
        ISWHATEVER(Enabled);
        ISWHATEVER(Framebuffer);
        ISWHATEVER(Program);
        ISWHATEVER(Renderbuffer);
        ISWHATEVER(Shader);
        ISWHATEVER(Texture);
#undef ISWHATEVER

        V8GLFUNC("hint")
            glHint(IntegerFI(info[0]), IntegerFI(info[1]));
        }));
        //V8GLFUNC("getUniform") //lil complicated
        //    glGetUniformfv(IntegerFI(info[0]), IntegerFI(info[1]), )
        //}));


        //uhoh how tf am i gonna add all the uniformxxx functions bruh this is gonna take ->|forever (OHHHHHH IS THER SOME ONE ELSE IM NOT CUZ I WANNA KEEP YOU LCOSE I DON'T WANNA LOSE MY SPOT CAUSE I NEED TO KNOW IF YOUR HURTING HIM OR YOUR HURTING ME IF I AIN"T WIRTH YOU I DON"T WNNA BE)
        //ok wait i just saw the spec and maybe it wont take that long (https://registry.khronos.org/webgl/specs/latest/1.0/#5.14)
        //V8GLFUNC("uniform" #ext) //vs doesnt like the macro recursion type shit (oh shit wait i think my comment was messing it up) //ok bruh why does this -> ("among" "us") combine the strings to this -> ("amongus") (i mean i get it's really helpful for this case but why is that actually a thing)
#define V8UNIFORMFUNC(ext, ...) context->Set(isolate, "uniform" #ext, FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) { \
            Isolate* isolate = info.GetIsolate(); \
            glUniform##ext(IntegerFI(info[0]), __VA_ARGS__); \
        }))

        V8UNIFORMFUNC(1f, FloatFI(info[1]));
        V8UNIFORMFUNC(2f, FloatFI(info[1]), FloatFI(info[2]));
        V8UNIFORMFUNC(3f, FloatFI(info[1]), FloatFI(info[2]), FloatFI(info[3]));
        V8UNIFORMFUNC(4f, FloatFI(info[1]), FloatFI(info[2]), FloatFI(info[3]), FloatFI(info[4]));

        V8UNIFORMFUNC(1i, IntegerFI(info[1]));
        V8UNIFORMFUNC(2i, IntegerFI(info[1]), IntegerFI(info[2]));
        V8UNIFORMFUNC(3i, IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]));
        V8UNIFORMFUNC(4i, IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]));

        MessageBoxA(NULL, "watch out with these uniformxxv functions because idk how they work a lil bit", "chumbucket's a place that i'll never go", MB_OK | MB_ICONINFORMATION);

#define V8UNIFORMVFUNC(ext, type, typeagain) context->Set(isolate, "uniform" #ext, FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) { \
            Isolate* isolate = info.GetIsolate(); \
            Local<type##32Array> jsData = info[1].As<type##32Array>(); \
            GL##typeagain* value = new GL##typeagain[jsData->Length()]; jsData->CopyContents(value, jsData->ByteLength()); \
            glUniform##ext(IntegerFI(info[0]), 1, value); \
            delete[] value; \
        }))
        //V8GLFUNC("uniform1fv")
        //    Local<Float32Array> jsData = info[1].As<Float32Array>();
        //    GLfloat* value = new GLfloat[jsData->Length()]; jsData->CopyContents(value, jsData->ByteLength());
        //
        //    glUniform1fv(IntegerFI(info[0]), 1, value);
        //    delete[] value;
        //}));

        V8UNIFORMVFUNC(1fv, Float, float);
        V8UNIFORMVFUNC(2fv, Float, float);
        V8UNIFORMVFUNC(3fv, Float, float);
        V8UNIFORMVFUNC(4fv, Float, float);

        V8UNIFORMVFUNC(1iv, Int, int);
        V8UNIFORMVFUNC(2iv, Int, int);
        V8UNIFORMVFUNC(3iv, Int, int);
        V8UNIFORMVFUNC(4iv, Int, int);

#define V8MATRIXUNIFORM(ext) context->Set(isolate, "uniformMatrix" #ext, FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) { \
            Isolate* isolate = info.GetIsolate(); \
            Local<Float32Array> jsData = info[2].As<Float32Array>(); \
            GLfloat* value = new GLfloat[jsData->Length()]; jsData->CopyContents(value, jsData->ByteLength()); \
            glUniformMatrix##ext(IntegerFI(info[0]), 1, IntegerFI(info[1]), value); \
            delete[] value; \
        }))

        V8MATRIXUNIFORM(2fv);
        V8MATRIXUNIFORM(3fv);
        V8MATRIXUNIFORM(4fv);

#undef V8MATRIXUNIFORM
#undef V8UNIFORMVFUNC
#undef V8UNIFORMFUNC

        //we almost done bro
        V8GLFUNC("drawArrays")
            glDrawArrays(IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]));
            HDC hdc = (HDC)IntegerFI(info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("HDC")).ToLocalChecked());
            if (!info[3]->BooleanValue(isolate)) {
                print("SWAP");
                info.GetReturnValue().Set(SwapBuffers(hdc));//wglSwapLayerBuffers(hdc, WGL_SWAP_MAIN_PLANE));
            }
        }));
        //V8GLFUNC("drawElements")
        //    glDrawElements(IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), );
        //}));
        V8GLFUNC("swapBuffers")
            HDC hdc = (HDC)IntegerFI(info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("HDC")).ToLocalChecked());
            info.GetReturnValue().Set(SwapBuffers(hdc)); //ok in glfw they use this function to swapbuffers for win32 https://github.com/glfw/glfw/blob/master/src/wgl_context.c#L344
            //info.GetReturnValue().Set(wglSwapLayerBuffers(hdc, WGL_SWAP_MAIN_PLANE));
        }));

        V8GLFUNC("deleteProgram")
            glDeleteProgram(IntegerFI(info[0]));
        }));

        V8GLFUNC("GetString")
            const unsigned char* str = glGetString(IntegerFI(info[0])); //wtf do i do with an unsigned char string (how do i smuggle this into js)
            printf("GetString: %s\n", str); //testing
            info.GetReturnValue().Set(String::NewFromUtf8(isolate, (char*)str).ToLocalChecked()); //lets just do a simple cast (but wait wont some info get cut off (yeah probnably lets see))
        }));

        V8GLFUNC("Release")
            HDC hdc = (HDC)IntegerFI(info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("HDC")).ToLocalChecked());
            HGLRC hglrc = (HGLRC)IntegerFI(info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("HGLRC")).ToLocalChecked());
            ReleaseDC(WindowFromDC(hdc), hdc); //LO!
            wglMakeCurrent(NULL, NULL);
            wglDeleteContext(hglrc);
        }));

#define setGlConst(const) context->Set(isolate, #const, Number::New(isolate, GL_##const))

        //bruh not only are there so many of these GL_ macros but they are scattered within glew.h (so im just gonna add them when i need them)
        //wait i have an idea! the specs have a list of all the GLenums they use (https://registry.khronos.org/webgl/specs/latest/1.0/#5.14)
        //setGlConst(ZERO);setGlConst(FALSE);setGlConst(LOGIC_OP);setGlConst(NONE);setGlConst(TEXTURE_COMPONENTS);setGlConst(NO_ERROR);setGlConst(POINTS);setGlConst(CURRENT_BIT);setGlConst(TRUE);setGlConst(ONE);setGlConst(CLIENT_PIXEL_STORE_BIT);setGlConst(LINES);setGlConst(LINE_LOOP);setGlConst(POINT_BIT);setGlConst(CLIENT_VERTEX_ARRAY_BIT);setGlConst(LINE_STRIP);setGlConst(LINE_BIT);setGlConst(TRIANGLES);setGlConst(TRIANGLE_STRIP);setGlConst(TRIANGLE_FAN);setGlConst(QUADS);setGlConst(QUAD_STRIP);setGlConst(POLYGON_BIT);setGlConst(POLYGON);setGlConst(POLYGON_STIPPLE_BIT);setGlConst(PIXEL_MODE_BIT);setGlConst(LIGHTING_BIT);setGlConst(FOG_BIT);setGlConst(DEPTH_BUFFER_BIT);setGlConst(ACCUM);setGlConst(LOAD);setGlConst(RETURN);setGlConst(MULT);setGlConst(ADD);setGlConst(NEVER);setGlConst(ACCUM_BUFFER_BIT);setGlConst(LESS);setGlConst(EQUAL);setGlConst(LEQUAL);setGlConst(GREATER);setGlConst(NOTEQUAL);setGlConst(GEQUAL);setGlConst(ALWAYS);setGlConst(SRC_COLOR);setGlConst(ONE_MINUS_SRC_COLOR);setGlConst(SRC_ALPHA);setGlConst(ONE_MINUS_SRC_ALPHA);setGlConst(DST_ALPHA);setGlConst(ONE_MINUS_DST_ALPHA);setGlConst(DST_COLOR);setGlConst(ONE_MINUS_DST_COLOR);setGlConst(SRC_ALPHA_SATURATE);setGlConst(STENCIL_BUFFER_BIT);setGlConst(FRONT_LEFT);setGlConst(FRONT_RIGHT);setGlConst(BACK_LEFT);setGlConst(BACK_RIGHT);setGlConst(FRONT);setGlConst(BACK);setGlConst(LEFT);setGlConst(RIGHT);setGlConst(FRONT_AND_BACK);setGlConst(AUX0);setGlConst(AUX1);setGlConst(AUX2);setGlConst(AUX3);setGlConst(INVALID_ENUM);setGlConst(INVALID_VALUE);setGlConst(INVALID_OPERATION);setGlConst(STACK_OVERFLOW);setGlConst(STACK_UNDERFLOW);setGlConst(OUT_OF_MEMORY);setGlConst(2D);setGlConst(3D);setGlConst(3D_COLOR);setGlConst(3D_COLOR_TEXTURE);setGlConst(4D_COLOR_TEXTURE);setGlConst(PASS_THROUGH_TOKEN);setGlConst(POINT_TOKEN);setGlConst(LINE_TOKEN);setGlConst(POLYGON_TOKEN);setGlConst(BITMAP_TOKEN);setGlConst(DRAW_PIXEL_TOKEN);setGlConst(COPY_PIXEL_TOKEN);setGlConst(LINE_RESET_TOKEN);setGlConst(EXP);setGlConst(VIEWPORT_BIT);setGlConst(EXP2);setGlConst(CW);setGlConst(CCW);setGlConst(COEFF);setGlConst(ORDER);setGlConst(DOMAIN);setGlConst(CURRENT_COLOR);setGlConst(CURRENT_INDEX);setGlConst(CURRENT_NORMAL);setGlConst(CURRENT_TEXTURE_COORDS);setGlConst(CURRENT_RASTER_COLOR);setGlConst(CURRENT_RASTER_INDEX);setGlConst(CURRENT_RASTER_TEXTURE_COORDS);setGlConst(CURRENT_RASTER_POSITION);setGlConst(CURRENT_RASTER_POSITION_VALID);setGlConst(CURRENT_RASTER_DISTANCE);setGlConst(POINT_SMOOTH);setGlConst(POINT_SIZE);setGlConst(POINT_SIZE_RANGE);setGlConst(POINT_SIZE_GRANULARITY);setGlConst(LINE_SMOOTH);setGlConst(LINE_WIDTH);setGlConst(LINE_WIDTH_RANGE);setGlConst(LINE_WIDTH_GRANULARITY);setGlConst(LINE_STIPPLE);setGlConst(LINE_STIPPLE_PATTERN);setGlConst(LINE_STIPPLE_REPEAT);setGlConst(LIST_MODE);setGlConst(MAX_LIST_NESTING);setGlConst(LIST_BASE);setGlConst(LIST_INDEX);setGlConst(POLYGON_MODE);setGlConst(POLYGON_SMOOTH);setGlConst(POLYGON_STIPPLE);setGlConst(EDGE_FLAG);setGlConst(CULL_FACE);setGlConst(CULL_FACE_MODE);setGlConst(FRONT_FACE);setGlConst(LIGHTING);setGlConst(LIGHT_MODEL_LOCAL_VIEWER);setGlConst(LIGHT_MODEL_TWO_SIDE);setGlConst(LIGHT_MODEL_AMBIENT);setGlConst(SHADE_MODEL);setGlConst(COLOR_MATERIAL_FACE);setGlConst(COLOR_MATERIAL_PARAMETER);setGlConst(COLOR_MATERIAL);setGlConst(FOG);setGlConst(FOG_INDEX);setGlConst(FOG_DENSITY);setGlConst(FOG_START);setGlConst(FOG_END);setGlConst(FOG_MODE);setGlConst(FOG_COLOR);setGlConst(DEPTH_RANGE);setGlConst(DEPTH_TEST);setGlConst(DEPTH_WRITEMASK);setGlConst(DEPTH_CLEAR_VALUE);setGlConst(DEPTH_FUNC);setGlConst(ACCUM_CLEAR_VALUE);setGlConst(STENCIL_TEST);setGlConst(STENCIL_CLEAR_VALUE);setGlConst(STENCIL_FUNC);setGlConst(STENCIL_VALUE_MASK);setGlConst(STENCIL_FAIL);setGlConst(STENCIL_PASS_DEPTH_FAIL);setGlConst(STENCIL_PASS_DEPTH_PASS);setGlConst(STENCIL_REF);setGlConst(STENCIL_WRITEMASK);setGlConst(MATRIX_MODE);setGlConst(NORMALIZE);setGlConst(VIEWPORT);setGlConst(MODELVIEW_STACK_DEPTH);setGlConst(PROJECTION_STACK_DEPTH);setGlConst(TEXTURE_STACK_DEPTH);setGlConst(MODELVIEW_MATRIX);setGlConst(PROJECTION_MATRIX);setGlConst(TEXTURE_MATRIX);setGlConst(ATTRIB_STACK_DEPTH);setGlConst(CLIENT_ATTRIB_STACK_DEPTH);setGlConst(ALPHA_TEST);setGlConst(ALPHA_TEST_FUNC);setGlConst(ALPHA_TEST_REF);setGlConst(DITHER);setGlConst(BLEND_DST);setGlConst(BLEND_SRC);setGlConst(BLEND);setGlConst(LOGIC_OP_MODE);setGlConst(INDEX_LOGIC_OP);setGlConst(COLOR_LOGIC_OP);setGlConst(AUX_BUFFERS);setGlConst(DRAW_BUFFER);setGlConst(READ_BUFFER);setGlConst(SCISSOR_BOX);setGlConst(SCISSOR_TEST);setGlConst(INDEX_CLEAR_VALUE);setGlConst(INDEX_WRITEMASK);setGlConst(COLOR_CLEAR_VALUE);setGlConst(COLOR_WRITEMASK);setGlConst(INDEX_MODE);setGlConst(RGBA_MODE);setGlConst(DOUBLEBUFFER);setGlConst(STEREO);setGlConst(RENDER_MODE);setGlConst(PERSPECTIVE_CORRECTION_HINT);setGlConst(POINT_SMOOTH_HINT);setGlConst(LINE_SMOOTH_HINT);setGlConst(POLYGON_SMOOTH_HINT);setGlConst(FOG_HINT);setGlConst(TEXTURE_GEN_S);setGlConst(TEXTURE_GEN_T);setGlConst(TEXTURE_GEN_R);setGlConst(TEXTURE_GEN_Q);setGlConst(PIXEL_MAP_I_TO_I);setGlConst(PIXEL_MAP_S_TO_S);setGlConst(PIXEL_MAP_I_TO_R);setGlConst(PIXEL_MAP_I_TO_G);setGlConst(PIXEL_MAP_I_TO_B);setGlConst(PIXEL_MAP_I_TO_A);setGlConst(PIXEL_MAP_R_TO_R);setGlConst(PIXEL_MAP_G_TO_G);setGlConst(PIXEL_MAP_B_TO_B);setGlConst(PIXEL_MAP_A_TO_A);setGlConst(PIXEL_MAP_I_TO_I_SIZE);setGlConst(PIXEL_MAP_S_TO_S_SIZE);setGlConst(PIXEL_MAP_I_TO_R_SIZE);setGlConst(PIXEL_MAP_I_TO_G_SIZE);setGlConst(PIXEL_MAP_I_TO_B_SIZE);setGlConst(PIXEL_MAP_I_TO_A_SIZE);setGlConst(PIXEL_MAP_R_TO_R_SIZE);setGlConst(PIXEL_MAP_G_TO_G_SIZE);setGlConst(PIXEL_MAP_B_TO_B_SIZE);setGlConst(PIXEL_MAP_A_TO_A_SIZE);setGlConst(UNPACK_SWAP_BYTES);setGlConst(UNPACK_LSB_FIRST);setGlConst(UNPACK_ROW_LENGTH);setGlConst(UNPACK_SKIP_ROWS);setGlConst(UNPACK_SKIP_PIXELS);setGlConst(UNPACK_ALIGNMENT);setGlConst(PACK_SWAP_BYTES);setGlConst(PACK_LSB_FIRST);setGlConst(PACK_ROW_LENGTH);setGlConst(PACK_SKIP_ROWS);setGlConst(PACK_SKIP_PIXELS);setGlConst(PACK_ALIGNMENT);setGlConst(MAP_COLOR);setGlConst(MAP_STENCIL);setGlConst(INDEX_SHIFT);setGlConst(INDEX_OFFSET);setGlConst(RED_SCALE);setGlConst(RED_BIAS);setGlConst(ZOOM_X);setGlConst(ZOOM_Y);setGlConst(GREEN_SCALE);setGlConst(GREEN_BIAS);setGlConst(BLUE_SCALE);setGlConst(BLUE_BIAS);setGlConst(ALPHA_SCALE);setGlConst(ALPHA_BIAS);setGlConst(DEPTH_SCALE);setGlConst(DEPTH_BIAS);setGlConst(MAX_EVAL_ORDER);setGlConst(MAX_LIGHTS);setGlConst(MAX_CLIP_PLANES);setGlConst(MAX_TEXTURE_SIZE);setGlConst(MAX_PIXEL_MAP_TABLE);setGlConst(MAX_ATTRIB_STACK_DEPTH);setGlConst(MAX_MODELVIEW_STACK_DEPTH);setGlConst(MAX_NAME_STACK_DEPTH);setGlConst(MAX_PROJECTION_STACK_DEPTH);setGlConst(MAX_TEXTURE_STACK_DEPTH);setGlConst(MAX_VIEWPORT_DIMS);setGlConst(MAX_CLIENT_ATTRIB_STACK_DEPTH);setGlConst(SUBPIXEL_BITS);setGlConst(INDEX_BITS);setGlConst(RED_BITS);setGlConst(GREEN_BITS);setGlConst(BLUE_BITS);setGlConst(ALPHA_BITS);setGlConst(DEPTH_BITS);setGlConst(STENCIL_BITS);setGlConst(ACCUM_RED_BITS);setGlConst(ACCUM_GREEN_BITS);setGlConst(ACCUM_BLUE_BITS);setGlConst(ACCUM_ALPHA_BITS);setGlConst(NAME_STACK_DEPTH);setGlConst(AUTO_NORMAL);setGlConst(MAP1_COLOR_4);setGlConst(MAP1_INDEX);setGlConst(MAP1_NORMAL);setGlConst(MAP1_TEXTURE_COORD_1);setGlConst(MAP1_TEXTURE_COORD_2);setGlConst(MAP1_TEXTURE_COORD_3);setGlConst(MAP1_TEXTURE_COORD_4);setGlConst(MAP1_VERTEX_3);setGlConst(MAP1_VERTEX_4);setGlConst(MAP2_COLOR_4);setGlConst(MAP2_INDEX);setGlConst(MAP2_NORMAL);setGlConst(MAP2_TEXTURE_COORD_1);setGlConst(MAP2_TEXTURE_COORD_2);setGlConst(MAP2_TEXTURE_COORD_3);setGlConst(MAP2_TEXTURE_COORD_4);setGlConst(MAP2_VERTEX_3);setGlConst(MAP2_VERTEX_4);setGlConst(MAP1_GRID_DOMAIN);setGlConst(MAP1_GRID_SEGMENTS);setGlConst(MAP2_GRID_DOMAIN);setGlConst(MAP2_GRID_SEGMENTS);setGlConst(TEXTURE_1D);setGlConst(TEXTURE_2D);setGlConst(FEEDBACK_BUFFER_POINTER);setGlConst(FEEDBACK_BUFFER_SIZE);setGlConst(FEEDBACK_BUFFER_TYPE);setGlConst(SELECTION_BUFFER_POINTER);setGlConst(SELECTION_BUFFER_SIZE);setGlConst(TEXTURE_WIDTH);setGlConst(TRANSFORM_BIT);setGlConst(TEXTURE_HEIGHT);setGlConst(TEXTURE_INTERNAL_FORMAT);setGlConst(TEXTURE_BORDER_COLOR);setGlConst(TEXTURE_BORDER);setGlConst(DONT_CARE);setGlConst(FASTEST);setGlConst(NICEST);setGlConst(AMBIENT);setGlConst(DIFFUSE);setGlConst(SPECULAR);setGlConst(POSITION);setGlConst(SPOT_DIRECTION);setGlConst(SPOT_EXPONENT);setGlConst(SPOT_CUTOFF);setGlConst(CONSTANT_ATTENUATION);setGlConst(LINEAR_ATTENUATION);setGlConst(QUADRATIC_ATTENUATION);setGlConst(COMPILE);setGlConst(COMPILE_AND_EXECUTE);setGlConst(BYTE);setGlConst(UNSIGNED_BYTE);setGlConst(SHORT);setGlConst(UNSIGNED_SHORT);setGlConst(INT);setGlConst(UNSIGNED_INT);setGlConst(FLOAT);setGlConst(2_BYTES);setGlConst(3_BYTES);setGlConst(4_BYTES);setGlConst(DOUBLE);setGlConst(CLEAR);setGlConst(AND);setGlConst(AND_REVERSE);setGlConst(COPY);setGlConst(AND_INVERTED);setGlConst(NOOP);setGlConst(XOR);setGlConst(OR);setGlConst(NOR);setGlConst(EQUIV);setGlConst(INVERT);setGlConst(OR_REVERSE);setGlConst(COPY_INVERTED);setGlConst(OR_INVERTED);setGlConst(NAND);setGlConst(SET);setGlConst(EMISSION);setGlConst(SHININESS);setGlConst(AMBIENT_AND_DIFFUSE);setGlConst(COLOR_INDEXES);setGlConst(MODELVIEW);setGlConst(PROJECTION);setGlConst(TEXTURE);setGlConst(COLOR);setGlConst(DEPTH);setGlConst(STENCIL);setGlConst(COLOR_INDEX);setGlConst(STENCIL_INDEX);setGlConst(DEPTH_COMPONENT);setGlConst(RED);setGlConst(GREEN);setGlConst(BLUE);setGlConst(ALPHA);setGlConst(RGB);setGlConst(RGBA);setGlConst(LUMINANCE);setGlConst(LUMINANCE_ALPHA);setGlConst(BITMAP);setGlConst(POINT);setGlConst(LINE);setGlConst(FILL);setGlConst(RENDER);setGlConst(FEEDBACK);setGlConst(SELECT);setGlConst(FLAT);setGlConst(SMOOTH);setGlConst(KEEP);setGlConst(REPLACE);setGlConst(INCR);setGlConst(DECR);setGlConst(VENDOR);setGlConst(RENDERER);setGlConst(VERSION);setGlConst(EXTENSIONS);setGlConst(S);setGlConst(ENABLE_BIT);setGlConst(T);setGlConst(R);setGlConst(Q);setGlConst(MODULATE);setGlConst(DECAL);setGlConst(TEXTURE_ENV_MODE);setGlConst(TEXTURE_ENV_COLOR);setGlConst(TEXTURE_ENV);setGlConst(EYE_LINEAR);setGlConst(OBJECT_LINEAR);setGlConst(SPHERE_MAP);setGlConst(TEXTURE_GEN_MODE);setGlConst(OBJECT_PLANE);setGlConst(EYE_PLANE);setGlConst(NEAREST);setGlConst(LINEAR);setGlConst(NEAREST_MIPMAP_NEAREST);setGlConst(LINEAR_MIPMAP_NEAREST);setGlConst(NEAREST_MIPMAP_LINEAR);setGlConst(LINEAR_MIPMAP_LINEAR);setGlConst(TEXTURE_MAG_FILTER);setGlConst(TEXTURE_MIN_FILTER);setGlConst(TEXTURE_WRAP_S);setGlConst(TEXTURE_WRAP_T);setGlConst(CLAMP);setGlConst(REPEAT);setGlConst(POLYGON_OFFSET_UNITS);setGlConst(POLYGON_OFFSET_POINT);setGlConst(POLYGON_OFFSET_LINE);setGlConst(R3_G3_B2);setGlConst(V2F);setGlConst(V3F);setGlConst(C4UB_V2F);setGlConst(C4UB_V3F);setGlConst(C3F_V3F);setGlConst(N3F_V3F);setGlConst(C4F_N3F_V3F);setGlConst(T2F_V3F);setGlConst(T4F_V4F);setGlConst(T2F_C4UB_V3F);setGlConst(T2F_C3F_V3F);setGlConst(T2F_N3F_V3F);setGlConst(T2F_C4F_N3F_V3F);setGlConst(T4F_C4F_N3F_V4F);setGlConst(CLIP_PLANE0);setGlConst(CLIP_PLANE1);setGlConst(CLIP_PLANE2);setGlConst(CLIP_PLANE3);setGlConst(CLIP_PLANE4);setGlConst(CLIP_PLANE5);setGlConst(LIGHT0);setGlConst(COLOR_BUFFER_BIT);setGlConst(LIGHT1);setGlConst(LIGHT2);setGlConst(LIGHT3);setGlConst(LIGHT4);setGlConst(LIGHT5);setGlConst(LIGHT6);setGlConst(LIGHT7);setGlConst(HINT_BIT);setGlConst(POLYGON_OFFSET_FILL);setGlConst(POLYGON_OFFSET_FACTOR);setGlConst(ALPHA4);setGlConst(ALPHA8);setGlConst(ALPHA12);setGlConst(ALPHA16);setGlConst(LUMINANCE4);setGlConst(LUMINANCE8);setGlConst(LUMINANCE12);setGlConst(LUMINANCE16);setGlConst(LUMINANCE4_ALPHA4);setGlConst(LUMINANCE6_ALPHA2);setGlConst(LUMINANCE8_ALPHA8);setGlConst(LUMINANCE12_ALPHA4);setGlConst(LUMINANCE12_ALPHA12);setGlConst(LUMINANCE16_ALPHA16);setGlConst(INTENSITY);setGlConst(INTENSITY4);setGlConst(INTENSITY8);setGlConst(INTENSITY12);setGlConst(INTENSITY16);setGlConst(RGB4);setGlConst(RGB5);setGlConst(RGB8);setGlConst(RGB10);setGlConst(RGB12);setGlConst(RGB16);setGlConst(RGBA2);setGlConst(RGBA4);setGlConst(RGB5_A1);setGlConst(RGBA8);setGlConst(RGB10_A2);setGlConst(RGBA12);setGlConst(RGBA16);setGlConst(TEXTURE_RED_SIZE);setGlConst(TEXTURE_GREEN_SIZE);setGlConst(TEXTURE_BLUE_SIZE);setGlConst(TEXTURE_ALPHA_SIZE);setGlConst(TEXTURE_LUMINANCE_SIZE);setGlConst(TEXTURE_INTENSITY_SIZE);setGlConst(PROXY_TEXTURE_1D);setGlConst(PROXY_TEXTURE_2D);setGlConst(TEXTURE_PRIORITY);setGlConst(TEXTURE_RESIDENT);setGlConst(TEXTURE_BINDING_1D);setGlConst(TEXTURE_BINDING_2D);setGlConst(VERTEX_ARRAY);setGlConst(NORMAL_ARRAY);setGlConst(COLOR_ARRAY);setGlConst(INDEX_ARRAY);setGlConst(TEXTURE_COORD_ARRAY);setGlConst(EDGE_FLAG_ARRAY);setGlConst(VERTEX_ARRAY_SIZE);setGlConst(VERTEX_ARRAY_TYPE);setGlConst(VERTEX_ARRAY_STRIDE);setGlConst(NORMAL_ARRAY_TYPE);setGlConst(NORMAL_ARRAY_STRIDE);setGlConst(COLOR_ARRAY_SIZE);setGlConst(COLOR_ARRAY_TYPE);setGlConst(COLOR_ARRAY_STRIDE);setGlConst(INDEX_ARRAY_TYPE);setGlConst(INDEX_ARRAY_STRIDE);setGlConst(TEXTURE_COORD_ARRAY_SIZE);setGlConst(TEXTURE_COORD_ARRAY_TYPE);setGlConst(TEXTURE_COORD_ARRAY_STRIDE);setGlConst(EDGE_FLAG_ARRAY_STRIDE);setGlConst(VERTEX_ARRAY_POINTER);setGlConst(NORMAL_ARRAY_POINTER);setGlConst(COLOR_ARRAY_POINTER);setGlConst(INDEX_ARRAY_POINTER);setGlConst(TEXTURE_COORD_ARRAY_POINTER);setGlConst(EDGE_FLAG_ARRAY_POINTER);setGlConst(COLOR_INDEX1_EXT);setGlConst(COLOR_INDEX2_EXT);setGlConst(COLOR_INDEX4_EXT);setGlConst(COLOR_INDEX8_EXT);setGlConst(COLOR_INDEX12_EXT);setGlConst(COLOR_INDEX16_EXT);setGlConst(EVAL_BIT);setGlConst(LIST_BIT);setGlConst(TEXTURE_BIT);setGlConst(SCISSOR_BIT);setGlConst(ALL_ATTRIB_BITS);setGlConst(CLIENT_ALL_ATTRIB_BITS);
        //setGlConst(BLEND_EQUATION_RGB); setGlConst(VERTEX_ATTRIB_ARRAY_ENABLED); setGlConst(VERTEX_ATTRIB_ARRAY_SIZE); setGlConst(VERTEX_ATTRIB_ARRAY_STRIDE); setGlConst(VERTEX_ATTRIB_ARRAY_TYPE); setGlConst(CURRENT_VERTEX_ATTRIB); setGlConst(VERTEX_PROGRAM_POINT_SIZE); setGlConst(VERTEX_PROGRAM_TWO_SIDE); setGlConst(VERTEX_ATTRIB_ARRAY_POINTER); setGlConst(STENCIL_BACK_FUNC); setGlConst(STENCIL_BACK_FAIL); setGlConst(STENCIL_BACK_PASS_DEPTH_FAIL); setGlConst(STENCIL_BACK_PASS_DEPTH_PASS); setGlConst(MAX_DRAW_BUFFERS); setGlConst(DRAW_BUFFER0); setGlConst(DRAW_BUFFER1); setGlConst(DRAW_BUFFER2); setGlConst(DRAW_BUFFER3); setGlConst(DRAW_BUFFER4); setGlConst(DRAW_BUFFER5); setGlConst(DRAW_BUFFER6); setGlConst(DRAW_BUFFER7); setGlConst(DRAW_BUFFER8); setGlConst(DRAW_BUFFER9); setGlConst(DRAW_BUFFER10); setGlConst(DRAW_BUFFER11); setGlConst(DRAW_BUFFER12); setGlConst(DRAW_BUFFER13); setGlConst(DRAW_BUFFER14); setGlConst(DRAW_BUFFER15); setGlConst(BLEND_EQUATION_ALPHA); setGlConst(POINT_SPRITE); setGlConst(COORD_REPLACE); setGlConst(MAX_VERTEX_ATTRIBS); setGlConst(VERTEX_ATTRIB_ARRAY_NORMALIZED); setGlConst(MAX_TEXTURE_COORDS); setGlConst(MAX_TEXTURE_IMAGE_UNITS); setGlConst(FRAGMENT_SHADER); setGlConst(VERTEX_SHADER); setGlConst(MAX_FRAGMENT_UNIFORM_COMPONENTS); setGlConst(MAX_VERTEX_UNIFORM_COMPONENTS); setGlConst(MAX_VARYING_FLOATS); setGlConst(MAX_VERTEX_TEXTURE_IMAGE_UNITS); setGlConst(MAX_COMBINED_TEXTURE_IMAGE_UNITS); setGlConst(SHADER_TYPE); setGlConst(FLOAT_VEC2); setGlConst(FLOAT_VEC3); setGlConst(FLOAT_VEC4); setGlConst(INT_VEC2); setGlConst(INT_VEC3); setGlConst(INT_VEC4); setGlConst(BOOL); setGlConst(BOOL_VEC2); setGlConst(BOOL_VEC3); setGlConst(BOOL_VEC4); setGlConst(FLOAT_MAT2); setGlConst(FLOAT_MAT3); setGlConst(FLOAT_MAT4); setGlConst(SAMPLER_1D); setGlConst(SAMPLER_2D); setGlConst(SAMPLER_3D); setGlConst(SAMPLER_CUBE); setGlConst(SAMPLER_1D_SHADOW); setGlConst(SAMPLER_2D_SHADOW); setGlConst(DELETE_STATUS); setGlConst(COMPILE_STATUS); setGlConst(LINK_STATUS); setGlConst(VALIDATE_STATUS); setGlConst(INFO_LOG_LENGTH); setGlConst(ATTACHED_SHADERS); setGlConst(ACTIVE_UNIFORMS); setGlConst(ACTIVE_UNIFORM_MAX_LENGTH); setGlConst(SHADER_SOURCE_LENGTH); setGlConst(ACTIVE_ATTRIBUTES); setGlConst(ACTIVE_ATTRIBUTE_MAX_LENGTH); setGlConst(FRAGMENT_SHADER_DERIVATIVE_HINT); setGlConst(SHADING_LANGUAGE_VERSION); setGlConst(CURRENT_PROGRAM); setGlConst(POINT_SPRITE_COORD_ORIGIN); setGlConst(LOWER_LEFT); setGlConst(UPPER_LEFT); setGlConst(STENCIL_BACK_REF); setGlConst(STENCIL_BACK_VALUE_MASK); setGlConst(STENCIL_BACK_WRITEMASK);
        setGlConst(DEPTH_BUFFER_BIT); setGlConst(STENCIL_BUFFER_BIT); setGlConst(COLOR_BUFFER_BIT); setGlConst(POINTS); setGlConst(LINES); setGlConst(LINE_LOOP); setGlConst(LINE_STRIP); setGlConst(TRIANGLES); setGlConst(TRIANGLE_STRIP); setGlConst(TRIANGLE_FAN); setGlConst(ZERO); setGlConst(ONE); setGlConst(SRC_COLOR); setGlConst(ONE_MINUS_SRC_COLOR); setGlConst(SRC_ALPHA); setGlConst(ONE_MINUS_SRC_ALPHA); setGlConst(DST_ALPHA); setGlConst(ONE_MINUS_DST_ALPHA); setGlConst(DST_COLOR); setGlConst(ONE_MINUS_DST_COLOR); setGlConst(SRC_ALPHA_SATURATE); setGlConst(FUNC_ADD); setGlConst(BLEND_EQUATION); setGlConst(BLEND_EQUATION_RGB); setGlConst(BLEND_EQUATION_ALPHA); setGlConst(FUNC_SUBTRACT); setGlConst(FUNC_REVERSE_SUBTRACT); setGlConst(BLEND_DST_RGB); setGlConst(BLEND_SRC_RGB); setGlConst(BLEND_DST_ALPHA); setGlConst(BLEND_SRC_ALPHA); setGlConst(CONSTANT_COLOR); setGlConst(ONE_MINUS_CONSTANT_COLOR); setGlConst(CONSTANT_ALPHA); setGlConst(ONE_MINUS_CONSTANT_ALPHA); setGlConst(BLEND_COLOR); setGlConst(ARRAY_BUFFER); setGlConst(ELEMENT_ARRAY_BUFFER); setGlConst(ARRAY_BUFFER_BINDING); setGlConst(ELEMENT_ARRAY_BUFFER_BINDING); setGlConst(STREAM_DRAW); setGlConst(STATIC_DRAW); setGlConst(DYNAMIC_DRAW); setGlConst(BUFFER_SIZE); setGlConst(BUFFER_USAGE); setGlConst(CURRENT_VERTEX_ATTRIB); setGlConst(FRONT); setGlConst(BACK); setGlConst(FRONT_AND_BACK); setGlConst(CULL_FACE); setGlConst(BLEND); setGlConst(DITHER); setGlConst(STENCIL_TEST); setGlConst(DEPTH_TEST); setGlConst(SCISSOR_TEST); setGlConst(POLYGON_OFFSET_FILL); setGlConst(SAMPLE_ALPHA_TO_COVERAGE); setGlConst(SAMPLE_COVERAGE); setGlConst(NO_ERROR); setGlConst(INVALID_ENUM); setGlConst(INVALID_VALUE); setGlConst(INVALID_OPERATION); setGlConst(OUT_OF_MEMORY); setGlConst(CW); setGlConst(CCW); setGlConst(LINE_WIDTH); setGlConst(ALIASED_POINT_SIZE_RANGE); setGlConst(ALIASED_LINE_WIDTH_RANGE); setGlConst(CULL_FACE_MODE); setGlConst(FRONT_FACE); setGlConst(DEPTH_RANGE); setGlConst(DEPTH_WRITEMASK); setGlConst(DEPTH_CLEAR_VALUE); setGlConst(DEPTH_FUNC); setGlConst(STENCIL_CLEAR_VALUE); setGlConst(STENCIL_FUNC); setGlConst(STENCIL_FAIL); setGlConst(STENCIL_PASS_DEPTH_FAIL); setGlConst(STENCIL_PASS_DEPTH_PASS); setGlConst(STENCIL_REF); setGlConst(STENCIL_VALUE_MASK); setGlConst(STENCIL_WRITEMASK); setGlConst(STENCIL_BACK_FUNC); setGlConst(STENCIL_BACK_FAIL); setGlConst(STENCIL_BACK_PASS_DEPTH_FAIL); setGlConst(STENCIL_BACK_PASS_DEPTH_PASS); setGlConst(STENCIL_BACK_REF); setGlConst(STENCIL_BACK_VALUE_MASK); setGlConst(STENCIL_BACK_WRITEMASK); setGlConst(VIEWPORT); setGlConst(SCISSOR_BOX); setGlConst(COLOR_CLEAR_VALUE); setGlConst(COLOR_WRITEMASK); setGlConst(UNPACK_ALIGNMENT); setGlConst(PACK_ALIGNMENT); setGlConst(MAX_TEXTURE_SIZE); setGlConst(MAX_VIEWPORT_DIMS); setGlConst(SUBPIXEL_BITS); setGlConst(RED_BITS); setGlConst(GREEN_BITS); setGlConst(BLUE_BITS); setGlConst(ALPHA_BITS); setGlConst(DEPTH_BITS); setGlConst(STENCIL_BITS); setGlConst(POLYGON_OFFSET_UNITS); setGlConst(POLYGON_OFFSET_FACTOR); setGlConst(TEXTURE_BINDING_2D); setGlConst(SAMPLE_BUFFERS); setGlConst(SAMPLES); setGlConst(SAMPLE_COVERAGE_VALUE); setGlConst(SAMPLE_COVERAGE_INVERT); setGlConst(COMPRESSED_TEXTURE_FORMATS); setGlConst(DONT_CARE); setGlConst(FASTEST); setGlConst(NICEST); setGlConst(GENERATE_MIPMAP_HINT); setGlConst(BYTE); setGlConst(UNSIGNED_BYTE); setGlConst(SHORT); setGlConst(UNSIGNED_SHORT); setGlConst(INT); setGlConst(UNSIGNED_INT); setGlConst(FLOAT); setGlConst(DEPTH_COMPONENT); setGlConst(ALPHA); setGlConst(RGB); setGlConst(RGBA); setGlConst(LUMINANCE); setGlConst(LUMINANCE_ALPHA); setGlConst(UNSIGNED_SHORT_4_4_4_4); setGlConst(UNSIGNED_SHORT_5_5_5_1); setGlConst(UNSIGNED_SHORT_5_6_5); setGlConst(FRAGMENT_SHADER); setGlConst(VERTEX_SHADER); setGlConst(MAX_VERTEX_ATTRIBS); setGlConst(MAX_VERTEX_UNIFORM_VECTORS); setGlConst(MAX_VARYING_VECTORS); setGlConst(MAX_COMBINED_TEXTURE_IMAGE_UNITS); setGlConst(MAX_VERTEX_TEXTURE_IMAGE_UNITS); setGlConst(MAX_TEXTURE_IMAGE_UNITS); setGlConst(MAX_FRAGMENT_UNIFORM_VECTORS); setGlConst(SHADER_TYPE); setGlConst(DELETE_STATUS); setGlConst(LINK_STATUS); setGlConst(VALIDATE_STATUS); setGlConst(ATTACHED_SHADERS); setGlConst(ACTIVE_UNIFORMS); setGlConst(ACTIVE_ATTRIBUTES); setGlConst(SHADING_LANGUAGE_VERSION); setGlConst(CURRENT_PROGRAM); setGlConst(NEVER); setGlConst(LESS); setGlConst(EQUAL); setGlConst(LEQUAL); setGlConst(GREATER); setGlConst(NOTEQUAL); setGlConst(GEQUAL); setGlConst(ALWAYS); setGlConst(KEEP); setGlConst(REPLACE); setGlConst(INCR); setGlConst(DECR); setGlConst(INVERT); setGlConst(INCR_WRAP); setGlConst(DECR_WRAP); setGlConst(VENDOR); setGlConst(RENDERER); setGlConst(VERSION); setGlConst(NEAREST); setGlConst(LINEAR); setGlConst(NEAREST_MIPMAP_NEAREST); setGlConst(LINEAR_MIPMAP_NEAREST); setGlConst(NEAREST_MIPMAP_LINEAR); setGlConst(LINEAR_MIPMAP_LINEAR); setGlConst(TEXTURE_MAG_FILTER); setGlConst(TEXTURE_MIN_FILTER); setGlConst(TEXTURE_WRAP_S); setGlConst(TEXTURE_WRAP_T); setGlConst(TEXTURE_2D); setGlConst(TEXTURE); setGlConst(TEXTURE_CUBE_MAP); setGlConst(TEXTURE_BINDING_CUBE_MAP); setGlConst(TEXTURE_CUBE_MAP_POSITIVE_X); setGlConst(TEXTURE_CUBE_MAP_NEGATIVE_X); setGlConst(TEXTURE_CUBE_MAP_POSITIVE_Y); setGlConst(TEXTURE_CUBE_MAP_NEGATIVE_Y); setGlConst(TEXTURE_CUBE_MAP_POSITIVE_Z); setGlConst(TEXTURE_CUBE_MAP_NEGATIVE_Z); setGlConst(MAX_CUBE_MAP_TEXTURE_SIZE); setGlConst(TEXTURE0); setGlConst(TEXTURE1); setGlConst(TEXTURE2); setGlConst(TEXTURE3); setGlConst(TEXTURE4); setGlConst(TEXTURE5); setGlConst(TEXTURE6); setGlConst(TEXTURE7); setGlConst(TEXTURE8); setGlConst(TEXTURE9); setGlConst(TEXTURE10); setGlConst(TEXTURE11); setGlConst(TEXTURE12); setGlConst(TEXTURE13); setGlConst(TEXTURE14); setGlConst(TEXTURE15); setGlConst(TEXTURE16); setGlConst(TEXTURE17); setGlConst(TEXTURE18); setGlConst(TEXTURE19); setGlConst(TEXTURE20); setGlConst(TEXTURE21); setGlConst(TEXTURE22); setGlConst(TEXTURE23); setGlConst(TEXTURE24); setGlConst(TEXTURE25); setGlConst(TEXTURE26); setGlConst(TEXTURE27); setGlConst(TEXTURE28); setGlConst(TEXTURE29); setGlConst(TEXTURE30); setGlConst(TEXTURE31); setGlConst(ACTIVE_TEXTURE); setGlConst(REPEAT); setGlConst(CLAMP_TO_EDGE); setGlConst(MIRRORED_REPEAT); setGlConst(FLOAT_VEC2); setGlConst(FLOAT_VEC3); setGlConst(FLOAT_VEC4); setGlConst(INT_VEC2); setGlConst(INT_VEC3); setGlConst(INT_VEC4); setGlConst(BOOL); setGlConst(BOOL_VEC2); setGlConst(BOOL_VEC3); setGlConst(BOOL_VEC4); setGlConst(FLOAT_MAT2); setGlConst(FLOAT_MAT3); setGlConst(FLOAT_MAT4); setGlConst(SAMPLER_2D); setGlConst(SAMPLER_CUBE); setGlConst(VERTEX_ATTRIB_ARRAY_ENABLED); setGlConst(VERTEX_ATTRIB_ARRAY_SIZE); setGlConst(VERTEX_ATTRIB_ARRAY_STRIDE); setGlConst(VERTEX_ATTRIB_ARRAY_TYPE); setGlConst(VERTEX_ATTRIB_ARRAY_NORMALIZED); setGlConst(VERTEX_ATTRIB_ARRAY_POINTER); setGlConst(VERTEX_ATTRIB_ARRAY_BUFFER_BINDING); setGlConst(IMPLEMENTATION_COLOR_READ_TYPE); setGlConst(IMPLEMENTATION_COLOR_READ_FORMAT); setGlConst(COMPILE_STATUS); setGlConst(LOW_FLOAT); setGlConst(MEDIUM_FLOAT); setGlConst(HIGH_FLOAT); setGlConst(LOW_INT); setGlConst(MEDIUM_INT); setGlConst(HIGH_INT); setGlConst(FRAMEBUFFER); setGlConst(RENDERBUFFER); setGlConst(RGBA4); setGlConst(RGB5_A1); setGlConst(RGBA8); setGlConst(RGB565); setGlConst(DEPTH_COMPONENT16); setGlConst(STENCIL_INDEX8); setGlConst(DEPTH_STENCIL); setGlConst(RENDERBUFFER_WIDTH); setGlConst(RENDERBUFFER_HEIGHT); setGlConst(RENDERBUFFER_INTERNAL_FORMAT); setGlConst(RENDERBUFFER_RED_SIZE); setGlConst(RENDERBUFFER_GREEN_SIZE); setGlConst(RENDERBUFFER_BLUE_SIZE); setGlConst(RENDERBUFFER_ALPHA_SIZE); setGlConst(RENDERBUFFER_DEPTH_SIZE); setGlConst(RENDERBUFFER_STENCIL_SIZE); setGlConst(FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE); setGlConst(FRAMEBUFFER_ATTACHMENT_OBJECT_NAME); setGlConst(FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL); setGlConst(FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE); setGlConst(COLOR_ATTACHMENT0); setGlConst(DEPTH_ATTACHMENT); setGlConst(STENCIL_ATTACHMENT); setGlConst(DEPTH_STENCIL_ATTACHMENT); setGlConst(NONE); setGlConst(FRAMEBUFFER_COMPLETE); setGlConst(FRAMEBUFFER_INCOMPLETE_ATTACHMENT); setGlConst(FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT);
        setGlConst(FRAMEBUFFER_UNSUPPORTED); setGlConst(FRAMEBUFFER_BINDING); setGlConst(RENDERBUFFER_BINDING); setGlConst(MAX_RENDERBUFFER_SIZE); setGlConst(INVALID_FRAMEBUFFER_OPERATION);
        //idk if these links stay valid like desmos but here -> regexr.com/80n5s
        //unfortunately these don't work and double unfortunate is that UNPACK_FLIP_Y_WEBGL is important (and has no native gl equivalent (so i guess i'll just flip the images when i load them (some how)))
        //actually wait they're defined in the spec too
#define GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS 0x8CD9
#define GL_UNPACK_FLIP_Y_WEBGL 0x9240
#define GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL 0x9241
#define GL_CONTEXT_LOST_WEBGL 0x9242
#define GL_UNPACK_COLORSPACE_CONVERSION_WEBGL 0x9243
#define GL_BROWSER_DEFAULT_WEBGL 0x9244

        setGlConst(FRAMEBUFFER_INCOMPLETE_DIMENSIONS);
        setGlConst(UNPACK_FLIP_Y_WEBGL);
        setGlConst(UNPACK_PREMULTIPLY_ALPHA_WEBGL);
        setGlConst(CONTEXT_LOST_WEBGL);
        setGlConst(UNPACK_COLORSPACE_CONVERSION_WEBGL);
        setGlConst(BROWSER_DEFAULT_WEBGL);
#undef V8GLFUNC
#undef INFOLOG_LEN
    }
    //Local<Object> result = wndclass->NewInstance(isolate->GetCurrentContext()).ToLocalChecked();

    info.GetReturnValue().Set(context->NewInstance(isolate->GetCurrentContext()).ToLocalChecked());
}

V8FUNC(SleepWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    Sleep(IntegerFI(info[0]));
}

V8FUNC(GetClientRectWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    RECT r{ 0 }; GetClientRect((HWND)IntegerFI(info[0]), &r);

    Local<Object> jsRect = jsImpl::createWinRect(isolate, r);//Object::New(isolate);

    //jsRect->Set(isolate->GetCurrentContext(), LITERAL("left"), Number::New(isolate, r.left));
    //jsRect->Set(isolate->GetCurrentContext(), LITERAL("top"), Number::New(isolate, r.top));
    //jsRect->Set(isolate->GetCurrentContext(), LITERAL("right"), Number::New(isolate, r.right));
    //jsRect->Set(isolate->GetCurrentContext(), LITERAL("bottom"), Number::New(isolate, r.bottom));

    info.GetReturnValue().Set(jsRect);
}

V8FUNC(GetWindowRectWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    RECT r{ 0 }; GetWindowRect((HWND)IntegerFI(info[0]), &r);

    Local<Object> jsRect = jsImpl::createWinRect(isolate, r);//Object::New(isolate);

    //jsRect->Set(isolate->GetCurrentContext(), LITERAL("left"), Number::New(isolate, r.left));
    //jsRect->Set(isolate->GetCurrentContext(), LITERAL("top"), Number::New(isolate, r.top));
    //jsRect->Set(isolate->GetCurrentContext(), LITERAL("right"), Number::New(isolate, r.right));
    //jsRect->Set(isolate->GetCurrentContext(), LITERAL("bottom"), Number::New(isolate, r.bottom));

    info.GetReturnValue().Set(jsRect);
}

V8FUNC(GetConsoleWindowWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)GetConsoleWindow()));
}

V8FUNC(DestroyWindowWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    DestroyWindow((HWND)IntegerFI(info[0]));
}

V8FUNC(GET_X_LPARAMWRAPPER) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    info.GetReturnValue().Set(((int)(short)LOWORD(IntegerFI(info[0])))); //the reason i didn't use the actual GET_X_LPARAM macro was because i didn't know i had to include <windowsx.h> and so i just used LOWORD! (ok i just checked and idek if windowsx.h is a real header)
}

V8FUNC(GET_Y_LPARAMWRAPPER) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    info.GetReturnValue().Set(((int)(short)HIWORD(IntegerFI(info[0]))));
}

V8FUNC(HIWORDWRAPPER) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    info.GetReturnValue().Set(HIWORD(IntegerFI(info[0])));
}

V8FUNC(LOWORDWRAPPER) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    info.GetReturnValue().Set(LOWORD(IntegerFI(info[0])));
}

V8FUNC(GetWindowTextWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    wchar_t shit[255];
    GetWindowText((HWND)IntegerFI(info[0]), shit, 255);
    info.GetReturnValue().Set(String::NewFromTwoByte(isolate, (uint16_t*)shit).ToLocalChecked());
}

V8FUNC(SetWindowTextWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    
    info.GetReturnValue().Set(SetWindowText((HWND)IntegerFI(info[0]), WStringFI(info[1])));
}

V8FUNC(TransparentBltWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(TransparentBlt((HDC)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]), (HDC)IntegerFI(info[5]), IntegerFI(info[6]), IntegerFI(info[7]), IntegerFI(info[8]), IntegerFI(info[9]), IntegerFI(info[10])));
}

V8FUNC(AlphaBlendWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    BLENDFUNCTION ftn{0};
    ftn.BlendOp = AC_SRC_OVER;
    ftn.SourceConstantAlpha = IntegerFI(info[10]);
    ftn.AlphaFormat = IntegerFI(info[11]);

    info.GetReturnValue().Set(AlphaBlend((HDC)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]), (HDC)IntegerFI(info[5]), IntegerFI(info[6]), IntegerFI(info[7]), IntegerFI(info[8]), IntegerFI(info[9]), ftn));
}

V8FUNC(GetPixelWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    unsigned long rgb = GetPixel((HDC)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]));
    Local<Object> jsRGB = Object::New(isolate);
    jsRGB->Set(isolate->GetCurrentContext(), LITERAL("r"), Number::New(isolate, GetRValue(rgb)));
    jsRGB->Set(isolate->GetCurrentContext(), LITERAL("g"), Number::New(isolate, GetGValue(rgb)));
    jsRGB->Set(isolate->GetCurrentContext(), LITERAL("b"), Number::New(isolate, GetBValue(rgb)));
    info.GetReturnValue().Set(jsRGB);
}

V8FUNC(SetPixelWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    unsigned long rgb = SetPixel((HDC)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]));

    Local<Object> jsRGB = Object::New(isolate);
    jsRGB->Set(isolate->GetCurrentContext(), LITERAL("r"), Number::New(isolate, GetRValue(rgb)));
    jsRGB->Set(isolate->GetCurrentContext(), LITERAL("g"), Number::New(isolate, GetGValue(rgb)));
    jsRGB->Set(isolate->GetCurrentContext(), LITERAL("b"), Number::New(isolate, GetBValue(rgb)));

    info.GetReturnValue().Set(jsRGB);
}

V8FUNC(SetPixelVWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, SetPixelV((HDC)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]))));
}

V8FUNC(RGBWRAPPER) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, RGB(IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]))));
}

V8FUNC(GetRValueWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, GetRValue(IntegerFI(info[0]))));
}

V8FUNC(GetGValueWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, GetGValue(IntegerFI(info[0]))));
}

V8FUNC(GetBValueWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, GetBValue(IntegerFI(info[0]))));
}

V8FUNC(GetStretchBltModeWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(GetStretchBltMode((HDC)IntegerFI(info[0])));
}

V8FUNC(SetStretchBltModeWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(SetStretchBltMode((HDC)IntegerFI(info[0]), IntegerFI(info[1])));
}

V8FUNC(PrintWindowWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    PrintWindow((HWND)IntegerFI(info[0]), (HDC)IntegerFI(info[1]), IntegerFI(info[2]));
}

V8FUNC(SetWindowPosWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    
    SetWindowPos((HWND)IntegerFI(info[0]), (HWND)IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]), IntegerFI(info[5]), IntegerFI(info[6]));
}

V8FUNC(WindowFromDCWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)WindowFromDC((HDC)IntegerFI(info[0]))));
}

V8FUNC(WindowFromPointWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)WindowFromPoint(POINT{ (int)IntegerFI(info[0]), (int)IntegerFI(info[1]) })));
}

BOOL CALLBACK enumWindowCallback(HWND hWnd, LPARAM lparam) {
    //int length = GetWindowTextLengthA(hWnd);
    //char* buffer = new char[length + 1];
    //GetWindowTextA(hWnd, buffer, length + 1);
    //std::string windowTitle(buffer);
    //delete[] buffer;

    // List visible windows with a non-empty title
    //if (IsWindowVisible(hWnd) && length != 0) {
    //    std::cout << hWnd << ":  " << windowTitle << std::endl;
    //}
    using namespace v8;
    v8::FunctionCallbackInfo<v8::Value> info = *(v8::FunctionCallbackInfo<v8::Value>*)lparam;
    Isolate* isolate = info.GetIsolate();
    Local<Value> args[] = { Number::New(isolate, (LONG_PTR)hWnd) };
    info[0].As<Function>()->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 1, args);
    //return info[0].As<Function>()->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 1, args).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();
    return TRUE;
}

V8FUNC(EnumWindowsWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    EnumWindows(enumWindowCallback, (LONG_PTR)&info); //v8 would actually assert and crash at this line to "prevent inadvertent misuse" so i commented that part out and it works fine LO
    //EnumWindows((WNDENUMPROC)[&,isolate](HWND hwnd, LPARAM lParam) {
    //
    //    return TRUE;
    //}, NULL);
}

V8FUNC(keybd_eventWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    int key = IntegerFI(info[0]);
    if (info[0]->IsString()) {
        key = toupper((CStringFI(info[0]))[0]);
    }

    keybd_event(key, NULL, IntegerFI(info[1]), NULL);
}

V8FUNC(mouse_eventWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    mouse_event(IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), NULL); //https://stackoverflow.com/questions/28386029/how-to-simulate-mouse-click-using-c
}

V8FUNC(MakeKeyboardInput) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    Local<Object> jsKI = Object::New(isolate);
    jsKI->Set(isolate->GetCurrentContext(), LITERAL("type"), Number::New(isolate, INPUT_KEYBOARD));
    jsKI->Set(isolate->GetCurrentContext(), LITERAL("wVk"), info[0]);
    jsKI->Set(isolate->GetCurrentContext(), LITERAL("dwFlags"), Number::New(isolate, info[1]->BooleanValue(isolate) ? KEYEVENTF_KEYUP : 0));
    //jsKI->Set(isolate->GetCurrentContext(), LITERAL("time"), info[2]);

    info.GetReturnValue().Set(jsKI);
}

V8FUNC(MakeMouseInput) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    Local<Object> jsKI = Object::New(isolate);
    jsKI->Set(isolate->GetCurrentContext(), LITERAL("type"), Number::New(isolate, INPUT_MOUSE));
    jsKI->Set(isolate->GetCurrentContext(), LITERAL("dx"), info[0]);
    jsKI->Set(isolate->GetCurrentContext(), LITERAL("dy"), info[1]);
    jsKI->Set(isolate->GetCurrentContext(), LITERAL("mouseData"), info[2]);
    jsKI->Set(isolate->GetCurrentContext(), LITERAL("dwFlags"), info[3]);

    //jsKI->Set(isolate->GetCurrentContext(), LITERAL("time"), info[2]);

    info.GetReturnValue().Set(jsKI);
}

V8FUNC(SendInputWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    
    INPUT* inputs = new INPUT[info.Length()];
    //print(info.Length());
    //memset(inputs, 0, sizeof(INPUT)*info.Length());

    for (int i = 0; i < info.Length(); i++) {
#define GetProperty(obj, name) obj->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL(name)).ToLocalChecked()
        Local<Object> in = info[i].As<Object>();
        int type = in->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("type")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();
        int flags = in->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("dwFlags")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();
        inputs[i].type = type;
        if (type == INPUT_KEYBOARD) {
            Local<Value> wVkVal = in->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("wVk")).ToLocalChecked();
            int wVk = wVkVal->IntegerValue(isolate->GetCurrentContext()).FromJust();
            if (wVkVal->IsString()) {
                wVk = toupper((CStringFI(wVkVal))[0]);
            }

            inputs[i].ki.wVk = wVk;
            inputs[i].ki.dwFlags = flags;
            //inputs[i].ki.time = in->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("time")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();
            
            print(type << " " << wVk << " " << flags);
        }
        else if (type == INPUT_MOUSE) {
            long mouseX = IntegerFI(GetProperty(in, "dx"));
            long mouseY = IntegerFI(GetProperty(in, "dy"));
            if ((flags & MOUSEEVENTF_ABSOLUTE) == MOUSEEVENTF_ABSOLUTE) {
                if (mouseX < screenWidth) {
                    mouseX = 65535.f / ((float)screenWidth / mouseX);
                }
                if (mouseY < screenHeight) {
                    mouseY = 65535.f / ((float)screenHeight/mouseY);
                }
            }
            inputs[i].mi.dx = mouseX;
            inputs[i].mi.dy = mouseY;
            inputs[i].mi.mouseData = IntegerFI(GetProperty(in, "mouseData"));
            inputs[i].mi.dwFlags = flags;
        }
        //print(inputs[i].type << " " << inputs[i].ki.wVk << " " << inputs[i].ki.dwFlags);
    }

    UINT uSent = SendInput(info.Length(), inputs, sizeof(INPUT));
    print(HRESULT_FROM_WIN32(GetLastError()));
    if (uSent != info.Length())
    {
        
        print("SendInput failed: 0x%x\n" << HRESULT_FROM_WIN32(GetLastError()));
    }

    delete[] inputs; //honestly it's kinda of suprising that this SendInput actually works because i feel like it is hard to use just normally (idk why but i just feel it ok)
}

V8FUNC(MAKEINTRESOURCEWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (ULONG_PTR)MAKEINTRESOURCEA(IntegerFI(info[0]))));
}

V8FUNC(LoadCursorWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)LoadCursorA((HINSTANCE)IntegerFI(info[0]), (LPCSTR)IntegerFI(info[1]))));
}

V8FUNC(LoadCursorFromFileWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)LoadCursorFromFileA((LPCSTR)IntegerFI(info[0]))));
}

V8FUNC(LoadImageWrapper) { //https://www.youtube.com/watch?v=hNi_MEZ8X10
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)LoadImageW((HINSTANCE)IntegerFI(info[0]), WStringFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]), IntegerFI(info[5]))));
}

V8FUNC(SetCursorWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)SetCursor((HCURSOR)IntegerFI(info[0]))));
}

V8FUNC(GetForegroundWindowWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)GetForegroundWindow()));
}

V8FUNC(SetForegroundWindowWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, SetForegroundWindow((HWND)IntegerFI(info[0]))));
}

V8FUNC(GetActiveWindowWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)GetActiveWindow()));
}

V8FUNC(SetActiveWindowWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)SetActiveWindow((HWND)IntegerFI(info[0]))));
}

V8FUNC(DrawIconExWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, DrawIconEx((HDC)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), (HICON)IntegerFI(info[3]), IntegerFI(info[4]), IntegerFI(info[5]), IntegerFI(info[6]), (HBRUSH)IntegerFI(info[7]), IntegerFI(info[8]))));
}

V8FUNC(DrawIconWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, DrawIcon((HDC)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), (HICON)IntegerFI(info[3]))));
}

V8FUNC(LoadIconWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)LoadIconA((HINSTANCE)IntegerFI(info[0]), (LPCSTR)IntegerFI(info[1]))));
}

V8FUNC(GetLastErrorWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, GetLastError()));
}

V8FUNC(IsIconicWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, IsIconic((HWND)IntegerFI(info[0]))));
}

V8FUNC(IsChildWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, IsChild((HWND)IntegerFI(info[0]), HWND(IntegerFI(info[1]))))); //im still kind of suprised you can cast like that but i guess i shouldn't be
}

V8FUNC(GetParentWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)GetParent((HWND)IntegerFI(info[0])))); //im still kind of suprised you can cast like that but i guess i shouldn't be
}

V8FUNC(SetParentWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)SetParent((HWND)IntegerFI(info[0]), HWND(IntegerFI(info[1]))))); //im still kind of suprised you can cast like that but i guess i shouldn't be
}

V8FUNC(SetClassLongPtrWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, SetClassLongPtrA((HWND)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]))));
}

V8FUNC(SetWindowLongPtrWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, SetWindowLongPtrA((HWND)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]))));
}

V8FUNC(GetClassLongPtrWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, GetClassLongPtrA((HWND)IntegerFI(info[0]), IntegerFI(info[1]))));
}

V8FUNC(GetWindowLongPtrWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    //print(GetWindowLongPtrA(GetForegroundWindow(), GWLP_HINSTANCE));
    info.GetReturnValue().Set(Number::New(isolate, GetWindowLongPtrA((HWND)IntegerFI(info[0]), IntegerFI(info[1]))));
}

BOOL GetIconDimensions(__in HICON hico, __out SIZE* psiz)
{
    ICONINFO ii;
    BOOL fResult = GetIconInfo(hico, &ii);
    if (fResult) {
        BITMAP bm;
        fResult = GetObject(ii.hbmMask, sizeof(bm), &bm) == sizeof(bm);
        if (fResult) {
            psiz->cx = bm.bmWidth;
            psiz->cy = ii.hbmColor ? bm.bmHeight : bm.bmHeight / 2;
        }
        if (ii.hbmMask)  DeleteObject(ii.hbmMask);
        if (ii.hbmColor) DeleteObject(ii.hbmColor);
    }
    return fResult;
}

V8FUNC(GetIconDimensionsWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    SIZE size;

    GetIconDimensions(HICON(IntegerFI(info[0])), &size);

    Local<Object> jsSize = Object::New(isolate);
    jsSize->Set(isolate->GetCurrentContext(), LITERAL("width"), Number::New(isolate, size.cx)); //jbs is now 1.3.1 because i changed an existing function and had to update mousemover.js
    jsSize->Set(isolate->GetCurrentContext(), LITERAL("height"), Number::New(isolate, size.cy));

    info.GetReturnValue().Set(jsSize);
}

V8FUNC(GetBitmapDimensions) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    BITMAP bmp;
    GetObjectA((HBITMAP)IntegerFI(info[0]), sizeof(BITMAP), &bmp); //oof getobject wrapper gonna be hard (also i usually don't say oof anymore)
    
    Local<Object> jsSize = Object::New(isolate);
    jsSize->Set(isolate->GetCurrentContext(), LITERAL("width"), Number::New(isolate, bmp.bmWidth));
    jsSize->Set(isolate->GetCurrentContext(), LITERAL("height"), Number::New(isolate, bmp.bmHeight));

    info.GetReturnValue().Set(jsSize);
}

V8FUNC(SaveDCWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, SaveDC((HDC)IntegerFI(info[0]))));
}

V8FUNC(RestoreDCWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, RestoreDC((HDC)IntegerFI(info[0]), IntegerFI(info[1]))));
} //https://devblogs.microsoft.com/oldnewthing/20170920-00/?p=97055

V8FUNC(GetWindowDCWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)GetWindowDC((HWND)IntegerFI(info[0]))));
}

//V8FUNC(GetDesktopWindowWrapper) {
//    using namespace v8;
//    Isolate* isolate = info.GetIsolate();
//
//    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)GetDesktopWindow()));
//}

//V8FUNC(GetKeyboardStateWrapper) {
//    using namespace v8;
//    Isolate* isolate = info.GetIsolate();
//
//    //BYTE* keys = new BYTE[256]; //buddy this is FUCKED
//    BYTE keys[256];
//    memset(keys, 0, sizeof(BYTE));
//    //ahhh
//    GetKeyboardState(keys);
//
//    Local<Array> jsKeys = Array::New(isolate);
//    for (int i = 0; i < 256; i++) {
//        jsKeys->Set(isolate->GetCurrentContext(), i, Number::New(isolate, keys[i]));
//    }
//
//    //delete[] keys;
//
//    info.GetReturnValue().Set(jsKeys);
//}

V8FUNC(GetAsyncKeyboardState) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    Local<Array> jsKeys = Array::New(isolate);
    for (int i = 0; i < 256; i++) {
        jsKeys->Set(isolate->GetCurrentContext(), i, Number::New(isolate, GetAsyncKeyState(i) != 0));// & 0x8000));
    }
    info.GetReturnValue().Set(jsKeys);
}

V8FUNC(FillRectWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    RECT r = RECT{ (long)IntegerFI(info[1]) , (long)IntegerFI(info[2]) , (long)IntegerFI(info[3]) , (long)IntegerFI(info[4]) };
    info.GetReturnValue().Set(Number::New(isolate, FillRect((HDC)IntegerFI(info[0]), &r, (HBRUSH)IntegerFI(info[5]))));
}

V8FUNC(SetCaptureWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)SetCapture((HWND)IntegerFI(info[0]))));
}

V8FUNC(ReleaseCaptureWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, ReleaseCapture()));
}

V8FUNC(ClipCursorWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    print(info.Length());
    if (info.Length() == 0 || info.Length() == 1) {
        info.GetReturnValue().Set(Number::New(isolate, ClipCursor(NULL)));
    }
    else {
        RECT r = RECT{ (long)IntegerFI(info[0]),(long)IntegerFI(info[1]) ,(long)IntegerFI(info[2]) ,(long)IntegerFI(info[3]) };
        info.GetReturnValue().Set(Number::New(isolate, ClipCursor(&r)));
    }
}

V8FUNC(MAKEPOINTSWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    LPARAM lp = IntegerFI(info[0]);
    POINTS p = MAKEPOINTS(lp);
    info.GetReturnValue().Set(jsImpl::createWinPoint<POINTS>(isolate, p));
}

V8FUNC(GET_WHEEL_DELTA_WPARAMWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    info.GetReturnValue().Set(GET_WHEEL_DELTA_WPARAM(IntegerFI(info[0])));
}

V8FUNC(CreateWindowClass) {
    using namespace v8;

    Isolate* isolate = info.GetIsolate();

    //WNDCLASSEXA wc{ 0 };
    //wc.hbrBackground;
    //wc.hCursor;
    //wc.hIcon;
    //wc.hIconSm;
    //wc.hInstance;
    //wc.lpszClassName;
    //wc.lpszMenuName;
    //wc.style;

    Local<Object> wndclass = Object::New(isolate);
    wndclass->Set(isolate->GetCurrentContext(), LITERAL("hbrBackground"), Number::New(isolate, 0));
    wndclass->Set(isolate->GetCurrentContext(), LITERAL("hCursor"), Number::New(isolate, 0));
    wndclass->Set(isolate->GetCurrentContext(), LITERAL("hIcon"), Number::New(isolate, 0));
    wndclass->Set(isolate->GetCurrentContext(), LITERAL("hIconSm"), Number::New(isolate, 0));
    wndclass->Set(isolate->GetCurrentContext(), LITERAL("hInstance"), Number::New(isolate, 0));
    wndclass->Set(isolate->GetCurrentContext(), LITERAL("lpszClassName"), info[0]);//Number::New(isolate, 0));
    wndclass->Set(isolate->GetCurrentContext(), LITERAL("lpszMenuName"), Number::New(isolate, 0));
    wndclass->Set(isolate->GetCurrentContext(), LITERAL("style"), Number::New(isolate, 0));
    //wndclass->Set(isolate->GetCurrentContext(), LITERAL("init"), info[1]);
    wndclass->Set(isolate->GetCurrentContext(), LITERAL("windowProc"), info[1]);
    wndclass->Set(isolate->GetCurrentContext(), LITERAL("loop"), info[2]);
    wndclass->Set(isolate->GetCurrentContext(), LITERAL("DefWindowProc"), Number::New(isolate, 1));
    
    info.GetReturnValue().Set(wndclass);//result);
}

LRESULT CALLBACK WinProc(HWND hWnd, UINT msg, WPARAM wp, LPARAM lp);

v8::Local<v8::Object> wndclass;

//struct IsolateAndClazz { //maybe use a tuple? (if i have it imported already im using it)
//    v8::Isolate* isolate;
//    v8::Local<v8::Object> wndclass;
//};

V8FUNC(CreateWindowWrapper) {
    //MessageBoxA(NULL, "aw shit another unfiinished hting", "ok so like no cap the only message you can resieve as of now is WM_PAINT", MB_OK | MB_ICONEXCLAMATION);
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    HandleScope handle_scope(isolate); //throwing this bad boy in there sure oughta fix up these strange errors (i barely know what this does but it for sure does something)

    int x = IntegerFI(info[4]);
    int y = IntegerFI(info[5]);
    int width = IntegerFI(info[6]);
    int height = IntegerFI(info[7]);
    wprint(WStringFI(info[2]) << " " << x << " " << y << " " << width << " " << height);


    HWND newWindow;// = CreateWindowA(CStringFI(GetProperty("lpszClassName")), CStringFI(info[1]), IntegerFI(info[2]), x, y, width, height, NULL, NULL, hInstance, NULL);

    if (!info[1]->IsString()) {

        wndclass = info[1].As<Object>(); //aw damn i was pretty confused then i remembered the info[0] is the extended flags

        //JSWindow* window = new JSWindow(isolate, wndclass); //TRUST ME
        //window->Create(x, y, width, height, info, hInstance);
#define GetProperty(name) wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL(name)).ToLocalChecked()

        //const char* className = *String::Utf8Value(isolate, wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), String::NewFromUtf8Literal(isolate, "className")).ToLocalChecked());
        //wprint(WStringFI(GetProperty("lpszClassName")));
        //WNDCLASSA wc{ 0 };
        WNDCLASSEXW wc{ 0 };
        wc.cbSize = sizeof(WNDCLASSEXW);
        wc.hbrBackground = (HBRUSH)IntegerFI(GetProperty("hbrBackground"));
        wc.hCursor = (HCURSOR)IntegerFI(GetProperty("hCursor"));
        wc.hIcon = (HICON)IntegerFI(GetProperty("hIcon"));
        wc.hIconSm = (HICON)IntegerFI(GetProperty("hIconSm"));
        print(wc.cbSize << " " << wc.hbrBackground << " " << wc.hCursor << " " << wc.hIcon << " " << wc.hIconSm);
        HINSTANCE shit = hInstance;
        if (GetProperty("hInstance")->IntegerValue(isolate->GetCurrentContext()).FromJust() != 0) {
            shit = (HINSTANCE)IntegerFI(GetProperty("hInstance"));
            print(hInstance << " " << shit << " hInstance vs shit");
        }
        wc.hInstance = shit;
        //wc.lpszClassName = WStringFI(GetProperty("lpszClassName"));
        //print(WStringFI(GetProperty("lpszClassName")));
        //wprint(WStringFI(GetProperty("lpszClassName")));
        //memset((void*)wc.lpszClassName, 0, wcslen(WStringFI(GetProperty("lpszClassName"))));
        //wcscpy((wchar_t*)wc.lpszClassName, WStringFI(GetProperty("lpszClassName"))); //yeah i think it wasn't working because i was copying the pointer instead of the shit it was pointing to
        //OK FUCK
        wchar_t CLAZZ[256]; //https://learn.microsoft.com/en-us/windows/win32/api/winuser/ns-winuser-wndclassa#:~:text=The%20class%20name%20can%20be,the%20RegisterClass%20function%20will%20fail.
        
        wcscpy(CLAZZ, WStringFI(GetProperty("lpszClassName")));
        print(CLAZZ);
        wprint(CLAZZ);
        //print(CLAZZ << " " << WStringFI(GetProperty("lpszClassName")));
        wc.lpszClassName = CLAZZ;//WStringFI(GetProperty("lpszClassName"));//CLAZZ;
        //i think using CLAZZ actually makes CreateWindow and RegisterClass work 100% of the time because Local<Object>s just be getting filled with garbage sometimes
        if (GetProperty("lpszMenuName")->NumberValue(isolate->GetCurrentContext()).FromJust() != 0) {
            wc.lpszMenuName = WStringFI(GetProperty("lpszMenuName"));
            //wcscpy((wchar_t*)wc.lpszMenuName, WStringFI(GetProperty("lpszMenuName"))); //yeah i think it wasn't working because i was copying the pointer instead of the shit it was pointing to
        }
        wc.style = IntegerFI(GetProperty("style"));
        wc.lpfnWndProc = WinProc;

        //wc.lpfnWndProc = WinProc;
        //wc.hInstance = hInstance;
        //wc.cbSize = sizeof(WNDCLASSEXW);
        //wc.lpszClassName = L"WinClass";

        if (!RegisterClassExW(&wc)) {
            info.GetReturnValue().Set(false);
            print("FAILED RegisteClassExW " << hInstance << " " << GetModuleHandle(NULL));
            MessageBoxA(NULL, "failed to register window class (keep trying idk why CreateWindow is a little sketchy)", (std::string("err: [") + (const char*)_bstr_t(_com_error(GetLastError()).ErrorMessage()) + "]").c_str(), MB_OK | MB_ICONERROR);
            return;
        }
        //newWindow = CreateWindowA(CStringFI(GetProperty("lpszClassName")), CStringFI(info[1]), IntegerFI(info[2]), x, y, width, height, NULL, NULL, hInstance, NULL);
        //wprint(IntegerFI(info[0]) << " " << WStringFI(GetProperty("lpszClassName")) << " " << WStringFI(info[2]));
        //print(wc.lpszClassName);
        //wprint(wc.lpszClassName);
        //CREATESTRUCTW pukeData{ 0 };
        //pukeData.lpCreateParams = (LPVOID)isolate;
        //newWindow = CreateWindowExW(WS_EX_OVERLAPPEDWINDOW, wc.lpszClassName, L"TITLE NIGGA FUCK", WS_OVERLAPPEDWINDOW | WS_VISIBLE, 0, 0, 500, 500, NULL, NULL, hInstance, (LPVOID)isolate);
        //wprint(WStringFI(info[2]) << L" NIGGER");
        //print("what is happeneing here?");
        //wchar_t shits[100];
        //wcscpy(shits, WStringFI(info[2]));
        //std::tuple<Isolate*, Local<Object>> iac = std::make_pair(isolate, wndclass);
        newWindow = CreateWindowExW(IntegerFI(info[0]), //HOLY SHIT THIS LINE WAS FAILING EVERYTIME I EVEN USED BREAKPOINTS TO FIND THE ISSUE AND GUESS WHAT
            //THE ERROR WAS ACTUALLY IN THE WINPROC AND I WAS GETTING THE ISOLATE LPARAM WRONG (literally spent at minimum 30 minutes to figure this out (this is why JBS3 has me talking about banning it))
            wc.lpszClassName, //buddy idk what but something around here is KILLING M(Y/E) PROGRAM
            WStringFI(info[2]), //title was truncated because i was using DefWindowProcA https://stackoverflow.com/questions/11884021/c-why-this-window-title-gets-truncated
            IntegerFI(info[3]),
            x,
            y,
            width,
            height,
            (HWND)IntegerFI(info[8]),
            (HMENU)IntegerFI(info[9]),
            (HINSTANCE)IntegerFI(info[10]),
            (LPVOID)isolate);//(LPVOID)IntegerFI(info[10]));

        //https://rave.dj/xXjJ5rcPG5qLcQ (i made this like 4 years ago)

        if (GetLastError() != 0) {
            //std::string shit = std::string("RESTART JBS because there's a 99% chance that the window was NOT created ") + (const char*)_bstr_t(_com_error(GetLastError()).ErrorMessage()) + ")";
                                //ahhhhhhh
            if (MessageBoxA(NULL, /*&shit[0]*/"I'm not gonna lie something when wrong when we tried to create that window", (const char*)_bstr_t(_com_error(GetLastError()).ErrorMessage()), MB_OKCANCEL | MB_ICONWARNING | MB_DEFBUTTON2) == IDCANCEL) {
                return;
            }
        }


        SetWindowLongPtrW(newWindow, GWLP_USERDATA, (LONG_PTR)isolate);//(size_t) & wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("windowProc")).ToLocalChecked().As<Function>());

        ShowWindow(newWindow, SW_SHOW);

        //types.d.ts

        //HWND newWindow = CreateWindowA();
        //
        //Local<ObjectTemplate> window = ObjectTemplate::New(isolate);
        //window->Set(isolate, "read", FunctionTemplate::New(isolate, fs::read));
        //window->Set(isolate, "write", FunctionTemplate::New(isolate, fs::write));
        ////filesys->Set(isolate->GetCurrentContext(), String::NewFromUtf8(isolate, "open").ToLocalChecked(), v8::FunctionTemplate::New(isolate, fs::open));
        ////filesys->Set(isolate, "v", String::NewFromUtf8(isolate, "KYS").ToLocalChecked());
        //
        ////print(filesys->IsValue() << " is value");
        //
        //Local<Object> result = window->NewInstance(isolate->GetCurrentContext()).ToLocalChecked(); //why did i have to cap on this dawg
        //
        //info.GetReturnValue().Set(result);

        MSG Message;
        Message.message = ~WM_QUIT;

        //Local<Promise::Resolver> uh = Promise::Resolver::New(isolate->GetCurrentContext()).ToLocalChecked();
        //info.GetReturnValue().Set(uh->GetPromise());
        info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)newWindow));

        //Local<Value> args[] = { Number::New(isolate, (LONG_PTR)newWindow) };

        InvalidateRect(newWindow, NULL, true);
        UpdateWindow(newWindow);
        //GetProperty("init").As<Function>()->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 1, args)/*.ToLocalChecked()*/;

        Local<Function> looper = GetProperty("loop").As<Function>();
        print(looper.IsEmpty() << " " << looper->IsUndefined());

        if (!looper->IsUndefined()) {
            while (Message.message != WM_QUIT)
            {
                if (PeekMessage(&Message, NULL, 0, 0, PM_REMOVE))
                {
                    // If a message was waiting in the message queue, process it
                    //print("wajt");
                    TranslateMessage(&Message);
                    DispatchMessage(&Message);
                }
                else
                {
                    v8::HandleScope handle_scope(isolate); //apparently i needed this so good to know
                    v8::TryCatch shit(isolate);
                    looper->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 0, nullptr);
                    //print("LOPER CALLED!");
                    CHECKEXCEPTIONS(shit);
                    isolate->PerformMicrotaskCheckpoint();
                }
            }
        }
        else {
            while (Message.message != WM_QUIT)
            {
                if (GetMessage(&Message, NULL, 0, 0))
                {
                    // If a message was waiting in the message queue, process it
                    //print("wajt");
                    TranslateMessage(&Message);
                    DispatchMessage(&Message);
                }
            }
        }

        print("loop over nigga");

        //uh->Resolve(isolate->GetCurrentContext(), Undefined(isolate)); //https://gist.github.com/jupp0r/5f11c0ee2b046b0ab89660ce85ea480e
    }
    else {
        //newWindow = CreateWindowA(CStringFI(info[0]), CStringFI(info[1]), IntegerFI(info[2]), x, y, width, height, (HWND)IntegerFI(info[7]), NULL, hInstance, NULL);
        newWindow = CreateWindowExW(IntegerFI(info[0]), WStringFI(info[1]), WStringFI(info[2]), IntegerFI(info[3]), x, y, width, height, (HWND)IntegerFI(info[8]), (HMENU)IntegerFI(info[9]), (HINSTANCE)IntegerFI(info[10]), NULL);
        info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)newWindow));
    }
    //MessageBoxA(NULL, (std::string("shit")+std::to_string(GetLastError())).c_str(), "titlke", MB_OKCANCEL); //https://www.youtube.com/watch?v=58OhXFmTUo0
}

V8FUNC(RedrawWindowWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    RECT r = RECT{ (long)IntegerFI(info[1]) ,(long)IntegerFI(info[2]) ,(long)IntegerFI(info[3]) ,(long)IntegerFI(info[4]) };
    info.GetReturnValue().Set(Number::New(isolate, RedrawWindow((HWND)IntegerFI(info[0]), &r, (HRGN)IntegerFI(info[5]), IntegerFI(info[6]))));
}

V8FUNC(InvalidateRectWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    RECT r = RECT{ (long)IntegerFI(info[1]) ,(long)IntegerFI(info[2]) ,(long)IntegerFI(info[3]) ,(long)IntegerFI(info[4]) };
    info.GetReturnValue().Set(Number::New(isolate, InvalidateRect((HWND)IntegerFI(info[0]), &r, IntegerFI(info[5]))));
}

V8FUNC(ShowWindowWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, ShowWindow((HWND)IntegerFI(info[0]), IntegerFI(info[1]))));
}

V8FUNC(UpdateWindowWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, UpdateWindow((HWND)IntegerFI(info[0]))));
}

V8FUNC(EnableWindowWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, EnableWindow((HWND)IntegerFI(info[0]), IntegerFI(info[1]))));
}

V8FUNC(SendMessageWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, SendMessage((HWND)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]))));
}

V8FUNC(ClientToScreenWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    Local<Object> jsPoint = info[1].As<Object>();

    POINT p = POINT{ (long)jsPoint->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("x")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust(), (long)jsPoint->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("y")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust() };

    ClientToScreen((HWND)IntegerFI(info[0]), &p);

    jsPoint->Set(isolate->GetCurrentContext(), LITERAL("x"), Number::New(isolate, p.x));
    jsPoint->Set(isolate->GetCurrentContext(), LITERAL("y"), Number::New(isolate, p.y));

    info.GetReturnValue().SetUndefined();
    //info.GetReturnValue().Set(jsImpl::createWinPoint<POINT>(isolate, p));
}

V8FUNC(SetRectWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    Local<Object> jsRect = info[0].As<Object>();

#define SetProperty(name, value) jsRect->Set(isolate->GetCurrentContext(), LITERAL(name), Number::New(isolate, value));

    RECT r; SetRect(&r, IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]));

    SetProperty("left", r.left);
    SetProperty("top", r.top);
    SetProperty("right", r.right);
    SetProperty("bottom", r.bottom);

    info.GetReturnValue().SetUndefined();
}

V8FUNC(SetROP2Wrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, SetROP2((HDC)IntegerFI(info[0]), IntegerFI(info[1]))));
}

V8FUNC(GetSystemMetricsWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, GetSystemMetrics(IntegerFI(info[0]))));
}

V8FUNC(CreateCompatibleBitmapWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)CreateCompatibleBitmap((HDC)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2])))); //i need a return int macro
}

V8FUNC(CreateCompatibleDCWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)CreateCompatibleDC((HDC)IntegerFI(info[0])))); //i need a return int macro
}

V8FUNC(DeleteDCWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)DeleteDC((HDC)IntegerFI(info[0]))));
}

//V8FUNC(CreateDCWrapper) {
//    using namespace v8;
//    Isolate* isolate = info.GetIsolate();
//
//    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)CreateDC((HDC)IntegerFI(info[0]))));
//}

//https://stackoverflow.com/questions/14050919/hbitmap-to-bitmap-converting
//https://forums.codeguru.com/showthread.php?441251-CBitmap-to-HICON-or-HICON-from-HBITMAP
HICON HICONFromHBITMAP(HBITMAP bitmap)
{
    BITMAP bmp{0}; GetObject(bitmap, sizeof(BITMAP), &bmp);
    //bitmap.GetBitmap(&bmp);


    HBITMAP hbmMask = CreateCompatibleBitmap(GetDC(NULL),
        bmp.bmWidth, bmp.bmHeight);

    ICONINFO ii = { 0 };
    ii.fIcon = TRUE;
    ii.hbmColor = bitmap;
    ii.hbmMask = hbmMask;

    HICON hIcon = CreateIconIndirect(&ii);
    DeleteObject(hbmMask);

    return hIcon;
}

V8FUNC(HICONFromHBITMAPWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)HICONFromHBITMAP((HBITMAP)IntegerFI(info[0]))));
}

V8FUNC(CreateBitmapWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    DWORD* data = nullptr;//new DWORD[jsBits->Length()];
    if (!info[3]->IsNullOrUndefined()) {
        Local<Uint32Array> jsBits = info[3].As<Uint32Array>();
        data = new DWORD[jsBits->Length()]; //genius code stolen from my StretchDIBits func
        jsBits->CopyContents(data, jsBits->ByteLength()); //hell yeah (i was using jsBits->Length() instead of ByteLength)
    }

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)CreateBitmap(IntegerFI(info[0]), IntegerFI(info[1]), 1, info[2]->IsNumber() ? IntegerFI(info[2]) : 32, data)));
}

V8FUNC(MAKEROP4Wrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    info.GetReturnValue().Set(Number::New(info.GetIsolate(), MAKEROP4(IntegerFI(info[0]), IntegerFI(info[1]))));
}

//probably make GetDIBits
V8FUNC(StretchDIBitsWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    //Local<Context> context = isolate->GetCurrentContext();
    //std::string bits;
    //Local<Array> jsBits = info[9].As<Array>(); //hold on Array has an Iterate method that is allegedly faster than repeated Get()s
    //before i do that weird array thing i FEEL like something like Uint32Array can just copy the data over
    Local<Uint32Array> jsBits = info[9].As<Uint32Array>();
    DWORD* data = new DWORD[jsBits->Length()];
    jsBits->CopyContents(data, jsBits->ByteLength()); //hell yeah (i was using jsBits->Length() instead of ByteLength)

    //for (int i = 0; i < jsBits->Length(); i++) { //could lowkey be a bottleneck
    //    //bits.push_back((char)jsBits->Get(isolate->GetCurrentContext(), i).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust());
    //    data[i] = jsBits->Get(context, i).ToLocalChecked()->Uint32Value(context).FromJust();
    //}
    
    //HDC dc = (HDC)IntegerFI(info[0]);

    //int ul = CHECKJPEGFORMAT;
    //print(jsBits->Length() << " " << bits.length());
    //if (
    //    // Check if CHECKJPEGFORMAT exists: 
    //
    //    (ExtEscape(dc, QUERYESCSUPPORT,
    //        sizeof(ul), (LPCSTR) & ul, 0, 0) > 0) &&
    //
    //    // Check if CHECKJPEGFORMAT executed without error: 
    //
    //    (ExtEscape(dc, CHECKJPEGFORMAT,
    //        bits.length(), &bits[0], sizeof(ul), (LPSTR)&ul) > 0) &&
    //
    //    // Check status code returned by CHECKJPEGFORMAT: 
    //
    //    (ul == 1)
    //    )
    //{
    //    print("WORKING CHECK JPEG");
    //}
    //print(bits);

    BITMAPINFO bmi;//{0};
    memset(&bmi, 0, sizeof(bmi));
    bmi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
    bmi.bmiHeader.biWidth = IntegerFI(info[10]);
    bmi.bmiHeader.biHeight = -IntegerFI(info[11]); // top-down image 
    bmi.bmiHeader.biPlanes = 1;
    bmi.bmiHeader.biBitCount = IntegerFI(info[12]); //?????
    bmi.bmiHeader.biCompression = IntegerFI(info[13]);
    bmi.bmiHeader.biSizeImage = 0; //bits.length(); //IntegerFI(info[10])*IntegerFI(info[11]);
    
    info.GetReturnValue().Set(Number::New(isolate, StretchDIBits((HDC)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]), IntegerFI(info[5]), IntegerFI(info[6]), IntegerFI(info[7]), IntegerFI(info[8]), data/*&bits[0]*/, &bmi, DIB_RGB_COLORS, IntegerFI(info[14]))));
    delete[] data; //my fault og
}

//https://forums.codeguru.com/showthread.php?487633-32-bit-DIB-from-24-bit-bitmap
//
V8FUNC(GetDIBitsWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();


    long width = IntegerFI(info[4]);
    long height = IntegerFI(info[5]);
    int bitCount = IntegerFI(info[6]);
    auto stride = ((((width * bitCount) + 31) & ~31) >> 3);
    DWORD* bits = new DWORD[width*height]; //bruh i just had to initialize it with a chunk of mem

    BITMAPINFO bmi;//{0};
    memset(&bmi, 0, sizeof(bmi));
    bmi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
    bmi.bmiHeader.biWidth = width;
    bmi.bmiHeader.biHeight = -height;
    bmi.bmiHeader.biPlanes = 1;
    bmi.bmiHeader.biBitCount = bitCount;
    bmi.bmiHeader.biCompression = IntegerFI(info[7]);
    bmi.bmiHeader.biSizeImage = 0;

    //wait apparently you are supposed to call GetDIBits twice (if it ain't broken i aint fixing it) https://forums.codeguru.com/showthread.php?450748-Problem-with-GetDIBits-function

    if (GetDIBits((HDC)IntegerFI(info[0]), (HBITMAP)IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), bits, &bmi, DIB_RGB_COLORS)) {
        //print(bits[0]);
        Local<ArrayBuffer> ab = ArrayBuffer::New(isolate, height*stride); //honestly this math is a guess especially the sizeof part
        memcpy(ab->Data(), bits, height*stride); //GULP
        delete[] bits;
        Local<Uint32Array> arr = Uint32Array::New(ab, 0, width*height); //weird if i multiply this one by sizeof(DWORD) v8 spits out garbage and crashes bad
        info.GetReturnValue().Set(arr);
    }
    else {
        std::string str = (std::string("GetDIBits failed with code ") + std::to_string(GetLastError()));
        Local<Value> shit = Exception::Error(String::NewFromUtf8(isolate, str.c_str(), NewStringType::kNormal, str.length()).ToLocalChecked());
        info.GetReturnValue().Set(shit);
    }
}

V8FUNC(PatBltWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, PatBlt((HDC)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]), IntegerFI(info[5]))));
}

V8FUNC(CreatePatternBrushWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)CreatePatternBrush((HBITMAP)IntegerFI(info[0]))));
}

V8FUNC(CreateHatchBrushWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)CreateHatchBrush(IntegerFI(info[0]), IntegerFI(info[1]))));
}

V8FUNC(MaskBltWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    
    info.GetReturnValue().Set(Number::New(isolate, MaskBlt((HDC)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]), (HDC)IntegerFI(info[5]), IntegerFI(info[6]), IntegerFI(info[7]), (HBITMAP)IntegerFI(info[8]), IntegerFI(info[9]), IntegerFI(info[10]), IntegerFI(info[11]))));
}
//#define COUNT_OF(x) ((sizeof(x)/sizeof(0[x])) / ((size_t)(!(sizeof(x) % sizeof(0[x])))))

//https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-createbitmap
#define msnformula(nWidth, nHeight, nPlanes, nBitCount) ((((nWidth * nPlanes * nBitCount + 15) >> 4) << 1) * nHeight)

V8FUNC(GetObjectHBITMAP) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    BITMAP bmp; GetObject((HANDLE)IntegerFI(info[0]), sizeof(BITMAP), &bmp);

    Local<Object> jsBITMAP = Object::New(isolate);

    print(bmp.bmWidth << " " << bmp.bmHeight);

    jsBITMAP->Set(isolate->GetCurrentContext(), LITERAL("bmType"),       Number::New(isolate, bmp.bmType));
    jsBITMAP->Set(isolate->GetCurrentContext(), LITERAL("bmWidth"),      Number::New(isolate, bmp.bmWidth));
    jsBITMAP->Set(isolate->GetCurrentContext(), LITERAL("bmHeight"),     Number::New(isolate, bmp.bmHeight));
    jsBITMAP->Set(isolate->GetCurrentContext(), LITERAL("bmWidthBytes"), Number::New(isolate, bmp.bmWidthBytes));
    jsBITMAP->Set(isolate->GetCurrentContext(), LITERAL("bmPlanes"),     Number::New(isolate, bmp.bmPlanes));
    jsBITMAP->Set(isolate->GetCurrentContext(), LITERAL("bmBitsPixel"),  Number::New(isolate, bmp.bmBitsPixel));
    if (bmp.bmBits != NULL) {
        LONG_PTR count = msnformula(bmp.bmWidth, bmp.bmHeight, bmp.bmPlanes, bmp.bmBitsPixel);
        print(count);
        Local<ArrayBuffer> jsBits = ArrayBuffer::New(isolate, count);
        for (LONG_PTR i = 0; i < count; i++) {
            jsBits->Set(isolate->GetCurrentContext(), i, Number::New(isolate, ((BYTE*)bmp.bmBits)[i]));
        }
        jsBITMAP->Set(isolate->GetCurrentContext(), LITERAL("bmBits"), jsBits);
    }
    else {
        jsBITMAP->Set(isolate->GetCurrentContext(), LITERAL("bmBits"),       Number::New(isolate, (LONG_PTR)bmp.bmBits));
    }

    //print(bmp.bmBits);

    info.GetReturnValue().Set(jsBITMAP);
}

V8FUNC(CreateBitmapIndirectWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    Local<Object> jsBITMAP = info[0].As<Object>(); //aw damn i didn't even have to cast (NO THIS WAS WRONG AND I HAD TO EDIT LIKE 7 DIFFERENT LINES BECAUSE I DIDN'T CAST)

    BITMAP bmp{ 0 };

#define GetIntProperty(name) IntegerFI(jsBITMAP->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL(name)).ToLocalChecked())
#define GetProperty(name) jsBITMAP->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL(name)).ToLocalChecked()
    
    bmp.bmType = 0;//GetIntProperty("bmType");
    bmp.bmWidth = GetIntProperty("bmWidth");
    bmp.bmHeight = GetIntProperty("bmHeight");
    bmp.bmWidthBytes = GetIntProperty("bmWidthBytes");
    bmp.bmPlanes = GetIntProperty("bmPlanes");
    bmp.bmBitsPixel = GetIntProperty("bmBitsPixel");

    print(bmp.bmWidth << " CreateBitmap " << bmp.bmHeight);

    if (GetProperty("bmBits")->IsNumber()) {
        bmp.bmBits = (LPVOID)GetIntProperty("bmBits");
    }
    else {
        Local<ArrayBuffer> jsBits = GetProperty("bmBits").As<ArrayBuffer>();
        bmp.bmBits = new BYTE[jsBits->ByteLength()];
        //memset(bmp.bmBits, 0, jsBits->ByteLength()); //sure? (this memset was FOR SURE causing access violations and i realized it before i ran it)
        print(bmp.bmBits << " e " << jsBits->ByteLength());
        for (size_t i = 0; i < jsBits->ByteLength(); i++) {
            ((BYTE*)bmp.bmBits)[i] = IntegerFI(jsBits->Get(isolate->GetCurrentContext(), i).ToLocalChecked());
        }
    }

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)CreateBitmapIndirect(&bmp)));
}

V8FUNC(GetObjectDIBITMAP) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    DIBSECTION dib; GetObject((HANDLE)IntegerFI(info[0]), sizeof(DIBSECTION), &dib);

    Local<Context> context = isolate->GetCurrentContext();

    Local<Object> jsBITMAP = Object::New(isolate);

    jsBITMAP->Set(context, LITERAL("bmType"), Number::New(isolate, dib.dsBm.bmType));
    jsBITMAP->Set(context, LITERAL("bmWidth"), Number::New(isolate, dib.dsBm.bmWidth));
    jsBITMAP->Set(context, LITERAL("bmHeight"), Number::New(isolate, dib.dsBm.bmHeight));
    jsBITMAP->Set(context, LITERAL("bmWidthBytes"), Number::New(isolate, dib.dsBm.bmWidthBytes));
    jsBITMAP->Set(context, LITERAL("bmPlanes"), Number::New(isolate, dib.dsBm.bmPlanes));
    jsBITMAP->Set(context, LITERAL("bmBitsPixel"), Number::New(isolate, dib.dsBm.bmBitsPixel));
    //jsBITMAP->Set(context, LITERAL("bmBits"), Number::New(isolate, (LONG_PTR)dib.dsBm.bmBits));

    if (dib.dsBm.bmBits != NULL) {
        LONG_PTR count = msnformula(dib.dsBm.bmWidth, dib.dsBm.bmHeight, dib.dsBm.bmPlanes, dib.dsBm.bmBitsPixel);
        //print(count << " " << dib.dsBmih.biSizeImage << " " << dib.dsBmih.biSize << " " << dib.dsBm.bmWidth << " " << dib.dsBm.bmHeight << " " << dib.dsBm.bmPlanes << " " << dib.dsBm.bmBitsPixel);
        Local<ArrayBuffer> jsBits = ArrayBuffer::New(isolate, count);//dib.dsBmih.biSizeImage);
        for (LONG_PTR i = 0; i < count; i++) {
            jsBits->Set(isolate->GetCurrentContext(), i, Number::New(isolate, ((BYTE*)dib.dsBm.bmBits)[i]));
        }
        jsBITMAP->Set(isolate->GetCurrentContext(), LITERAL("bmBits"), jsBits);
    }
    else {
        jsBITMAP->Set(isolate->GetCurrentContext(), LITERAL("bmBits"), Number::New(isolate, (LONG_PTR)dib.dsBm.bmBits));
    }

    Local<Object> jsINFOHEADER = Object::New(isolate);

    jsINFOHEADER->Set(context, LITERAL("biSize"), Number::New(isolate,           dib.dsBmih.biSize));
    jsINFOHEADER->Set(context, LITERAL("biWidth"), Number::New(isolate,          dib.dsBmih.biWidth));
    jsINFOHEADER->Set(context, LITERAL("biHeight"), Number::New(isolate,         dib.dsBmih.biHeight));
    jsINFOHEADER->Set(context, LITERAL("biPlanes"), Number::New(isolate,         dib.dsBmih.biPlanes));
    jsINFOHEADER->Set(context, LITERAL("biBitCount"), Number::New(isolate,       dib.dsBmih.biBitCount));
    jsINFOHEADER->Set(context, LITERAL("biCompression"), Number::New(isolate,    dib.dsBmih.biCompression));
    jsINFOHEADER->Set(context, LITERAL("biSizeImage"), Number::New(isolate,      dib.dsBmih.biSizeImage));
    jsINFOHEADER->Set(context, LITERAL("biXPelsPerMeter"), Number::New(isolate,  dib.dsBmih.biXPelsPerMeter));
    jsINFOHEADER->Set(context, LITERAL("biYPelsPerMeter"), Number::New(isolate,  dib.dsBmih.biYPelsPerMeter));
    jsINFOHEADER->Set(context, LITERAL("biClrUsed"), Number::New(isolate,        dib.dsBmih.biClrUsed));
    jsINFOHEADER->Set(context, LITERAL("biClrImportant"), Number::New(isolate,   dib.dsBmih.biClrImportant));

    Local<Array> jsSECTIONS = Array::New(isolate);

    jsSECTIONS->Set(context, 0, Number::New(isolate, dib.dsBitfields[0]));
    jsSECTIONS->Set(context, 1, Number::New(isolate, dib.dsBitfields[1]));
    jsSECTIONS->Set(context, 2, Number::New(isolate, dib.dsBitfields[2]));

    Local<Object> jsDIBSECTION = Object::New(isolate);
    
    jsDIBSECTION->Set(context, LITERAL("dsBm"), jsBITMAP); //yeah idk how im doing intellisense with my extension for this one
    jsDIBSECTION->Set(context, LITERAL("dsBmih"), jsINFOHEADER);
    jsDIBSECTION->Set(context, LITERAL("dsBitfields"), jsSECTIONS);
    jsDIBSECTION->Set(context, LITERAL("dshSection"), Number::New(isolate, (LONG_PTR)dib.dshSection));
    jsDIBSECTION->Set(context, LITERAL("dsOffset"), Number::New(isolate, dib.dsOffset));

    info.GetReturnValue().Set(jsDIBSECTION);
}

V8FUNC(CreateDIBitmapSimple) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    v8::Local<v8::Context> context = isolate->GetCurrentContext();
    Local<Object> b = Object::New(isolate);
    Local<Object> BMIH = Object::New(isolate);
    BMIH->Set(context, LITERAL("biWidth"), info[0]);
    BMIH->Set(context, LITERAL("biHeight"), info[1]);
    BMIH->Set(context, LITERAL("biBitCount"), IntegerFI(info[2]) ? info[2].As<Number>() : Number::New(isolate, 32)); //for some reason i have to cast info to number in order to use '?'
    BMIH->Set(context, LITERAL("biPlanes"), IntegerFI(info[3]) ? info[3].As<Number>() : Number::New(isolate, 1));
    BMIH->Set(context, LITERAL("biSizeImage"), info[4]);
    BMIH->Set(context, LITERAL("biCompression"), info[5]);
    BMIH->Set(context, LITERAL("biXPelsPerMeter"), info[6]);
    BMIH->Set(context, LITERAL("biYPelsPerMeter"), info[7]);
    BMIH->Set(context, LITERAL("biClrUsed"), info[8]);
    BMIH->Set(context, LITERAL("biClrImportant"), info[9]);

    b->Set(context, LITERAL("dsBmih"), BMIH);
    info.GetReturnValue().Set(b);
}

//struct SMS {
//    DWORD* bits = NULL;
//};

V8FUNC(CreateDIBSectionWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    v8::Local<v8::Context> context = isolate->GetCurrentContext();

    Local<Object> jsBITMAP = info[1].As<Object>();

    //imma assume this all works and im closing VS
	//https://stackoverflow.com/questions/25713117/what-is-the-difference-between-bisizeimage-bisize-and-bfsize
    BITMAPINFO bmi{0};
    if(jsBITMAP->HasRealNamedProperty(context, LITERAL("dsBmih")).FromJust()) {
        Local<Object> jsBMIH = jsBITMAP->GetRealNamedProperty(context, LITERAL("dsBmih")).ToLocalChecked().As<Object>();
        bmi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);//IntegerFI(jsBMIH->GetRealNamedProperty(context, LITERAL("biSize")).ToLocalChecked());
        bmi.bmiHeader.biWidth = IntegerFI(jsBMIH->GetRealNamedProperty(context, LITERAL("biWidth")).ToLocalChecked());
        bmi.bmiHeader.biHeight = IntegerFI(jsBMIH->GetRealNamedProperty(context, LITERAL("biHeight")).ToLocalChecked());
        bmi.bmiHeader.biPlanes = IntegerFI(jsBMIH->GetRealNamedProperty(context, LITERAL("biPlanes")).ToLocalChecked());
        bmi.bmiHeader.biBitCount = IntegerFI(jsBMIH->GetRealNamedProperty(context, LITERAL("biBitCount")).ToLocalChecked());
        bmi.bmiHeader.biCompression = IntegerFI(jsBMIH->GetRealNamedProperty(context, LITERAL("biCompression")).ToLocalChecked());
        bmi.bmiHeader.biSizeImage = IntegerFI(jsBMIH->GetRealNamedProperty(context, LITERAL("biSizeImage")).ToLocalChecked());
        bmi.bmiHeader.biXPelsPerMeter = IntegerFI(jsBMIH->GetRealNamedProperty(context, LITERAL("biXPelsPerMeter")).ToLocalChecked());
        bmi.bmiHeader.biYPelsPerMeter = IntegerFI(jsBMIH->GetRealNamedProperty(context, LITERAL("biYPelsPerMeter")).ToLocalChecked());
        bmi.bmiHeader.biClrUsed = IntegerFI(jsBMIH->GetRealNamedProperty(context, LITERAL("biClrUsed")).ToLocalChecked());
        bmi.bmiHeader.biClrImportant = IntegerFI(jsBMIH->GetRealNamedProperty(context, LITERAL("biClrImportant")).ToLocalChecked());

        //Local<ArrayBuffer> jsArrayBuffer = jsBITMAP->GetRealNamedProperty(context, LITERAL("dsBm")).ToLocalChecked().As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("bmBits")).ToLocalChecked();
    
        //BYTE* bytes;
        //memset(bytes, 0, jsArrayBuffer->ByteLength());
        //
        //for (size_t i = 0; i < jsArrayBuffer->ByteLength(); i++) {
        //
        //}
        //DWORD* temp = new DWORD[bmi.bmiHeader.biWidth*bmi.bmiHeader.biHeight];
        //DWORD** bits = &temp;
        DWORD* bits = NULL; //https://learn.microsoft.com/en-us/shows/pdc-pdc08/pc43 (40:26) raymond uses DWORD instead of byte (for 32 bit)
        //SMS* bparent = new SMS;

        Local<ObjectTemplate> interf = ObjectTemplate::New(isolate);
        interf->Set(isolate, "bitmap", Number::New(isolate, (LONG_PTR)CreateDIBSection((HDC)IntegerFI(info[0]), &bmi, IntegerFI(info[2]), (void**)&bits, NULL, NULL)));
        
        //Local<ObjectTemplate> jsBobject = ObjectTemplate::New(isolate);
        interf->Set(isolate, "SetBit", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            //print(IntegerFI(info.This()->Get(isolate->GetCurrentContext(), LITERAL("bits")).ToLocalChecked()));
            DWORD* bits = (DWORD*)IntegerFI(info.This()->Get(isolate->GetCurrentContext(), LITERAL("_bits")).ToLocalChecked()); // -///-
            bits[IntegerFI(info[0])] = info[1].As<Uint32>()->Value();//IntegerFI(info[1]);
        }));
        interf->Set(isolate, "GetBit", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            //print(IntegerFI(info.This()->Get(isolate->GetCurrentContext(), LITERAL("bits")).ToLocalChecked()));
            DWORD* bits = (DWORD*)IntegerFI(info.This()->Get(isolate->GetCurrentContext(), LITERAL("_bits")).ToLocalChecked()); // -///-
            info.GetReturnValue().Set(Number::New(isolate, bits[IntegerFI(info[0])]));
            //bits[IntegerFI(info[0])] = info[1].As<Uint32>()->Value();//IntegerFI(info[1]);
        }));
        interf->Set(isolate, "GetBits", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            LONG width = IntegerFI(info.This()->Get(isolate->GetCurrentContext(), LITERAL("width")).ToLocalChecked());
            LONG height = IntegerFI(info.This()->Get(isolate->GetCurrentContext(), LITERAL("height")).ToLocalChecked());
            int bitCount = IntegerFI(info.This()->Get(isolate->GetCurrentContext(), LITERAL("bitCount")).ToLocalChecked());
            auto stride = ((((width * bitCount) + 31) & ~31) >> 3);
            //print(IntegerFI(info.This()->Get(isolate->GetCurrentContext(), LITERAL("bits")).ToLocalChecked()));
            DWORD* bits = (DWORD*)IntegerFI(info.This()->Get(isolate->GetCurrentContext(), LITERAL("_bits")).ToLocalChecked()); // -///-
            Local<ArrayBuffer> ab = ArrayBuffer::New(isolate, height*stride); //honestly this math is a guess especially the sizeof part
            memcpy(ab->Data(), bits, height*stride); //GULP
            //delete[] bits;
            Local<Uint32Array> arr = Uint32Array::New(ab, 0, width*height); //weird if i multiply this one by sizeof(DWORD) v8 spits out garbage and crashes bad
            info.GetReturnValue().Set(arr);
            //bits[IntegerFI(info[0])] = info[1].As<Uint32>()->Value();//IntegerFI(info[1]);
        }));
        interf->Set(isolate, "SetBits", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            LONG width = IntegerFI(info.This()->Get(isolate->GetCurrentContext(), LITERAL("width")).ToLocalChecked());
            LONG height = IntegerFI(info.This()->Get(isolate->GetCurrentContext(), LITERAL("height")).ToLocalChecked());
            int bitCount = IntegerFI(info.This()->Get(isolate->GetCurrentContext(), LITERAL("bitCount")).ToLocalChecked());
            auto stride = ((((width * bitCount) + 31) & ~31) >> 3);
            
            //print(IntegerFI(info.This()->Get(isolate->GetCurrentContext(), LITERAL("bits")).ToLocalChecked()));
            DWORD* bits = (DWORD*)IntegerFI(info.This()->Get(isolate->GetCurrentContext(), LITERAL("_bits")).ToLocalChecked()); // -///-
            Local<Uint32Array> jsBits = info[0].As<Uint32Array>();
            jsBits->CopyContents(bits, height * stride);
            //bits[IntegerFI(info[0])] = info[1].As<Uint32>()->Value();//IntegerFI(info[1]);
        }));

        interf->Set(isolate, "_bits", Number::New(isolate, (LONG_PTR)bits)); //oops i forgot how pointers worked and passed the pointer to bits (&bits) instead of just the pointer itself
        interf->Set(isolate, "bitCount", Number::New(isolate, bmi.bmiHeader.biBitCount));
        interf->Set(isolate, "width", Number::New(isolate, bmi.bmiHeader.biWidth)); //idk how to make read only lol.
        interf->Set(isolate, "height", Number::New(isolate, abs(bmi.bmiHeader.biHeight)));

        Local<Object> result = interf->NewInstance(context).ToLocalChecked(); // aw man

        info.GetReturnValue().Set(result);
    }
}

V8FUNC(GetObjectHPALETTE) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    WORD entries; GetObject((HANDLE)IntegerFI(info[0]), sizeof(WORD), &entries);

    info.GetReturnValue().Set(Number::New(isolate, entries));
}

//V8FUNC(CreatePaletteWrapper) {
//    using namespace v8;
//    Isolate* isolate = info.GetIsolate();
//
//    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)CreatePalette()))
//}

V8FUNC(GetObjectExtHPEN) {
    using namespace v8;

    Isolate* isolate = info.GetIsolate();

    EXTLOGPEN pen; GetObject((HANDLE)IntegerFI(info[0]), sizeof(EXTLOGPEN), &pen);

    Local<Object> jsPEN = Object::New(isolate);
    
    jsPEN->Set(isolate->GetCurrentContext(), LITERAL("elpPenStyle"), Number::New(isolate,   pen.elpPenStyle));
    jsPEN->Set(isolate->GetCurrentContext(), LITERAL("elpWidth"), Number::New(isolate,      pen.elpWidth));
    jsPEN->Set(isolate->GetCurrentContext(), LITERAL("elpBrushStyle"), Number::New(isolate, pen.elpBrushStyle));
    jsPEN->Set(isolate->GetCurrentContext(), LITERAL("elpColor"), Number::New(isolate,      pen.elpColor));
    jsPEN->Set(isolate->GetCurrentContext(), LITERAL("elpHatch"), Number::New(isolate,      pen.elpHatch));
    jsPEN->Set(isolate->GetCurrentContext(), LITERAL("elpNumEntries"), Number::New(isolate, pen.elpNumEntries));

    Local<Array> jsEntriesArray = Array::New(isolate); //still mad that i wanted to use arrays a while ago and i didn't import the v8-array thing so i thought it just wasn't the way to do it

    for (int i = 0; i < ARRAYSIZE(pen.elpStyleEntry); i++) {
    //for(DWORD entry : pen.elpStyleEntry) { //nvm i need i
        jsEntriesArray->Set(isolate->GetCurrentContext(), i, Number::New(isolate, pen.elpStyleEntry[i]));
    }

    jsPEN->Set(isolate->GetCurrentContext(), LITERAL("elpStyleEntry"), jsEntriesArray);//Number::New(isolate, pen.elpStyleEntry));

    info.GetReturnValue().Set(jsPEN);
}

V8FUNC(GetObjectHPEN) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    LOGPEN pen; GetObject((HANDLE)IntegerFI(info[0]), sizeof(LOGPEN), &pen);

    Local<Object> jsPEN = Object::New(isolate);

    jsPEN->Set(isolate->GetCurrentContext(), LITERAL("lopnStyle"), Number::New(isolate, pen.lopnStyle));

    jsPEN->Set(isolate->GetCurrentContext(), LITERAL("lopnWidth"), jsImpl::createWinPoint(isolate, pen.lopnWidth));

    jsPEN->Set(isolate->GetCurrentContext(), LITERAL("lopnColor"), Number::New(isolate, pen.lopnColor));

    info.GetReturnValue().Set(jsPEN);
}

V8FUNC(CreatePenIndirectWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    Local<Object> jsPEN = info[0].As<Object>();

    LOGPEN pen{0};

    pen.lopnStyle = IntegerFI(jsPEN->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("lopnStyle")).ToLocalChecked());
    
    Local<Object> jsPOINT = jsPEN->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("lopnStyle")).ToLocalChecked().As<Object>();

    POINT p{ IntegerFI(jsPOINT->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("x")).ToLocalChecked()), IntegerFI(jsPOINT->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("y")).ToLocalChecked())};

    pen.lopnWidth = p;
    pen.lopnColor = IntegerFI(jsPEN->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("lopnColor")).ToLocalChecked());

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)CreatePenIndirect(&pen)));
}

V8FUNC(GetObjectHBRUSH) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    LOGBRUSH brush; GetObject((HANDLE)IntegerFI(info[0]), sizeof(LOGBRUSH), &brush);

    Local<Object> jsBRUSH = Object::New(isolate);

    jsBRUSH->Set(isolate->GetCurrentContext(), LITERAL("lbStyle"), Number::New(isolate, brush.lbStyle));
    jsBRUSH->Set(isolate->GetCurrentContext(), LITERAL("lbColor"), Number::New(isolate, brush.lbColor));
    jsBRUSH->Set(isolate->GetCurrentContext(), LITERAL("lbHatch"), Number::New(isolate, brush.lbHatch));

    info.GetReturnValue().Set(jsBRUSH);
}

V8FUNC(CreateBrushIndirectWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    Local<Object> jsBrush = info[0].As<Object>();

    LOGBRUSH brush{0};
    brush.lbStyle = IntegerFI(jsBrush->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("lbStyle")).ToLocalChecked());
    brush.lbColor = IntegerFI(jsBrush->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("lbColor")).ToLocalChecked());
    brush.lbHatch = IntegerFI(jsBrush->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("lbHatch")).ToLocalChecked());

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)CreateBrushIndirect(&brush)));
}

V8FUNC(GetObjectHFONT) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    LOGFONTA font; GetObjectA((HANDLE)IntegerFI(info[0]), sizeof(LOGFONTA), &font);

    Local<Object> jsFONT = Object::New(isolate);

    jsFONT->Set(isolate->GetCurrentContext(), LITERAL("lfHeight"), Number::New(isolate, font.lfHeight));
    jsFONT->Set(isolate->GetCurrentContext(), LITERAL("lfWidth"), Number::New(isolate, font.lfWidth));
    jsFONT->Set(isolate->GetCurrentContext(), LITERAL("lfEscapement"), Number::New(isolate, font.lfEscapement));
    jsFONT->Set(isolate->GetCurrentContext(), LITERAL("lfOrientation"), Number::New(isolate, font.lfOrientation));
    jsFONT->Set(isolate->GetCurrentContext(), LITERAL("lfWeight"), Number::New(isolate, font.lfWeight));
    jsFONT->Set(isolate->GetCurrentContext(), LITERAL("lfItalic"), Number::New(isolate, font.lfItalic));
    jsFONT->Set(isolate->GetCurrentContext(), LITERAL("lfUnderline"), Number::New(isolate, font.lfUnderline));
    jsFONT->Set(isolate->GetCurrentContext(), LITERAL("lfStrikeOut"), Number::New(isolate, font.lfStrikeOut));
    jsFONT->Set(isolate->GetCurrentContext(), LITERAL("lfCharSet"), Number::New(isolate, font.lfCharSet));
    jsFONT->Set(isolate->GetCurrentContext(), LITERAL("lfOutPrecision"), Number::New(isolate, font.lfOutPrecision));
    jsFONT->Set(isolate->GetCurrentContext(), LITERAL("lfClipPrecision"), Number::New(isolate, font.lfClipPrecision));
    jsFONT->Set(isolate->GetCurrentContext(), LITERAL("lfQuality"), Number::New(isolate, font.lfQuality));
    jsFONT->Set(isolate->GetCurrentContext(), LITERAL("lfPitchAndFamily"), Number::New(isolate, font.lfPitchAndFamily));
    jsFONT->Set(isolate->GetCurrentContext(), LITERAL("lfFaceName"), String::NewFromUtf8(isolate, font.lfFaceName).ToLocalChecked());

    info.GetReturnValue().Set(jsFONT);
}

V8FUNC(GetIconInfoWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    ICONINFO ii;
    BOOL fResult = GetIconInfo((HICON)IntegerFI(info[0]), &ii);

    Local<Object> jsICONINFO = Object::New(isolate);
    jsICONINFO->Set(isolate->GetCurrentContext(), LITERAL("fIcon"), Number::New(isolate, ii.fIcon));
    jsICONINFO->Set(isolate->GetCurrentContext(), LITERAL("xHotspot"), Number::New(isolate, ii.xHotspot));
    jsICONINFO->Set(isolate->GetCurrentContext(), LITERAL("yHotspot"), Number::New(isolate, ii.yHotspot));
    jsICONINFO->Set(isolate->GetCurrentContext(), LITERAL("hbmMask"), Number::New(isolate, (LONG_PTR)ii.hbmMask));
    jsICONINFO->Set(isolate->GetCurrentContext(), LITERAL("hbmColor"), Number::New(isolate, (LONG_PTR)ii.hbmColor));

    info.GetReturnValue().Set(jsICONINFO);
}

V8FUNC(CreateIconIndirectWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    ICONINFO ii{0};

    Local<Object> jsICONINFO = info[0].As<Object>();
    ii.fIcon = IntegerFI(jsICONINFO->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("fIcon")).ToLocalChecked());
    ii.xHotspot = IntegerFI(jsICONINFO->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("xHotspot")).ToLocalChecked());
    ii.yHotspot = IntegerFI(jsICONINFO->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("yHotspot")).ToLocalChecked());
    ii.hbmMask = (HBITMAP)IntegerFI(jsICONINFO->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("hbmMask")).ToLocalChecked());
    ii.hbmColor = (HBITMAP)IntegerFI(jsICONINFO->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("hbmColor")).ToLocalChecked());

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)CreateIconIndirect(&ii)));
}

V8FUNC(PlaySoundWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, PlaySoundA(CStringFI(info[0]), (HINSTANCE)IntegerFI(info[1]), IntegerFI(info[2]))));
}

#include <thread>
#include <v8-locker.h>

V8FUNC(PlaySoundSpecial) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    //HandleScope handle_scope(isolate); //the problem with using a new thread is that i leave this function's scope the moment i return the promise and everything is thrown in the bin so how can i say when it gets destroyed

    if (info[1]->IsString()) {

        //int aliasLength = String::Utf8Value(isolate, info[1]).length();
        //print("aliasLength -0> ");
        //print(aliasLength);
        //print(strlen(CStringFI(info[1])));
        //char* alias = new char[aliasLength];
        //strcpy_s(alias, aliasLength, CStringFI(info[1])); //oh shoot i could've just used strcpy (instead of memcpy)
        std::string* alias = new std::string(CStringFI(info[1])); //this does NOT seem good but fuck it we ball (why did this actually work instead of strcpy)

        bool notify = info[2]->IsNumber() && IntegerFI(info[2]) != 0;
        
        bool wait = info[3]->IsBoolean() && info[3]->BooleanValue(isolate);
        
        HWND maybewindow = (HWND)IntegerFI(info[2]);
        
        std::string sound = std::string(CStringFI(info[0]));
        //std::string type = sound.substr(sound.length() - 3, 3);  //ok idk why i added the type bruh that was CAP
        sound = "open \"" + sound + "\" type mpegvideo alias " + alias->c_str();
        print(sound);
        //char* alias = CStringFI(info[1]);
        //print(info[2]->IsNumber() << " " << IntegerFI(info[2]));
        print((std::string("play ") + alias->c_str() + (wait ? " wait" : "") + (notify ? " notify" : "")).c_str());
        //had a bunch of stuff trying to get the short file name instead of using an alias but you have to enable short file names in the registry so that ain't happening (i could use SetShortFileName but idk if im doing all that)
        print(wait);
        if (!wait) {
            //char* soundcstr = new char[sound.size()];
            //strcpy_s(soundcstr, sound.size(), sound.c_str());
            std::string* soundcstr = new std::string(sound.c_str());
            //Local<Promise::Resolver> tempp; //?
            Persistent<Promise::Resolver> pp = Persistent<Promise::Resolver>(isolate, v8::Promise::Resolver::New(isolate->GetCurrentContext()).ToLocalChecked()); //ok so i think this should be persistent then instaed of local
            std::thread f([=] {//(auto info, Isolate* isolate, bool notify, bool wait, Local<Promise::Resolver> pp) {
                //v8::Locker lock(isolate);
                //v8::Isolate::Scope isolate_scope(isolate); //nigga wtf is this shit
                // //p = PlaySoundSpecial("E:/Users/megal/source/repos/JBS3/scripts/corner hit 2.mp3", `nigga`, NULL, false);
                //HandleScope handle_scope(isolate);
                //fuck all that lemme use a persistent thing (WAIT AM I RETARDED I COULD'VE JUST CALCULATED CStringFI and IntegerFI **BEFORE** THE NEW THREAD) <- i stayed up late asl just to wake up and realize that
                //int returned = mciSendStringA((std::string("play ") + CStringFI(info[1]) + " wait" + (notify ? " notify" : "")).c_str(), NULL, 0, (HWND)IntegerFI(info[2]));
                mciSendStringA(soundcstr->c_str(), NULL, 0, NULL);
                print((std::string("play ") + alias->c_str() + " wait" + (notify ? " notify" : "")).c_str());
                            //damn mciSendStringA aliases only work if open is called on the same thread! (idk how this was missing in the last push but i noticed it the next day)
                int returned = mciSendStringA((std::string("play ") + alias->c_str() + " wait" + (notify ? " notify" : "")).c_str(), NULL, 0, maybewindow);
                pp.Get(isolate)->Resolve(isolate->GetCurrentContext(), Number::New(isolate, returned));//Undefined(isolate));
                //do i have to delete the persistent object since im done (how tf do i do that)
                //mciSendStringA((std::string("close ") + CStringFI(info[1])).c_str(), NULL, 0, (HWND)IntegerFI(info[2]));
                mciSendStringA((std::string("close ") + *alias).c_str(), NULL, 0, maybewindow);
                print("closed i think");
                alias->clear();
                delete/*[]*/ alias;
                soundcstr->clear();
                delete/*[]*/ soundcstr;
                //print(wait);
            });
            //std::thread thread_object(f);//, info, isolate, notify, wait, pp);
            info.GetReturnValue().Set(pp.Get(isolate)->GetPromise());
            f.detach();
        }
        else {
            mciSendStringA(sound.c_str(), NULL, 0, NULL);
            //print((std::string("play ") + alias + (info[3]->IsBoolean() ? info[3]->BooleanValue(isolate) ? " wait" : "" : "") + (notify ? " notify" : "")).c_str());
            info.GetReturnValue().Set(Number::New(isolate, mciSendStringA((std::string("play ") + alias->c_str() + " wait" + (notify ? " notify" : "")).c_str(), NULL, 0, (HWND)IntegerFI(info[2]))));
            mciSendStringA((std::string("close ") + *alias).c_str(), NULL, 0, maybewindow);
        }
        //else {
            //info.GetReturnValue().Set()
        //}
        //info.GetReturnValue().Set(Number::New(isolate, mciSendStringA((std::string("play ") + CStringFI(info[1]) + (info[3]->IsBoolean() ? info[3]->BooleanValue(isolate) ? " wait" : "" : "") + (notify ? " notify" : "")).c_str(), NULL, 0, (HWND)IntegerFI(info[2]))));
        //mciSendStringA((std::string("close ") + CStringFI(info[1])).c_str(), NULL, 0, (HWND)IntegerFI(info[2]));
    }
    else {
        info.GetReturnValue().Set(Number::New(isolate, mciSendStringA(CStringFI(info[0]), NULL, 0, (HWND)IntegerFI(info[2]))));
    }
}

V8FUNC(StopSoundSpecial) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, mciSendStringA((std::string("stop ")+CStringFI(info[0])).c_str(), NULL, 0, NULL)+ mciSendStringA((std::string("close ") + CStringFI(info[0])).c_str(), NULL, 0, NULL)));
}

V8FUNC(InitiateSystemShutdownWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

                                        //THIS WARNING IS EVEN BETTER "Consider using 'a design alternative' instead of 'InitiateSystemShutdownExA'."
    info.GetReturnValue().Set(Number::New(isolate, InitiateSystemShutdownExA(CStringFI(info[0]), CStringFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]), IntegerFI(info[5]))));//ExitWindowsEx(IntegerFI(info[0]), IntegerFI(info[1]))); //hell no im not testing this (HAH WHAT IS THIS WARNING)
}

V8FUNC(AbortSystemShutdownWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, AbortSystemShutdownA(CStringFI(info[0]))));
}

V8FUNC(PlgBltWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    POINT p[4];

    Local<Array> jspoints = info[1].As<Array>();
    for (int i = 0; i < jspoints->Length(); i++) {
        Local<Object> jspoint = jspoints->Get(isolate->GetCurrentContext(), i).ToLocalChecked().As<Object>();
        p[i] = POINT{(long)IntegerFI(jspoint->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("x")).ToLocalChecked()),(long)IntegerFI(jspoint->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("y")).ToLocalChecked()) };
        //print(p[i].x << " " << p[i].y);
    }

    info.GetReturnValue().Set(Number::New(isolate, PlgBlt((HDC)IntegerFI(info[0]), p, (HDC)IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]), IntegerFI(info[5]), IntegerFI(info[6]), (HBITMAP)IntegerFI(info[7]), IntegerFI(info[8]), IntegerFI(info[9]))));
}

V8FUNC(SetTimerWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    //MessageBoxA(NULL, "i should probably implement some SetTimer timerproc thing", "yeah get on that", MB_OK); //yeah nevermind i can't make that work because i can't pass info from here to timerproc without global variables (and i already didn't like doing it for CreateWindow (wndclass is global))
    info.GetReturnValue().Set(Number::New(isolate, SetTimer((HWND)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), NULL)));
}

V8FUNC(KillTimerWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, KillTimer((HWND)IntegerFI(info[0]), IntegerFI(info[1]))));
}

V8FUNC(AnimateWindowWrapper) { //https://www.youtube.com/watch?v=meIci7gOTLk
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, AnimateWindow((HWND)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]))));
}

//#error update layered window
//https://stackoverflow.com/questions/18383681/setlayeredwindowattributes-to-make-a-window-transparent-is-only-working-part-of
//https://stackoverflow.com/questions/67689087/correct-way-to-handle-and-redraw-a-layered-window-with-a-bitmap
//https://www.purebasic.fr/english/viewtopic.php?t=49781
//http://www.blichmann.de/downloads/translucency_tutorial.pdf
V8FUNC(UpdateLayeredWindowWrapper) { //https://cplusplus.com/forum/windows/107905/
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    
    //LPPOINT pptdst = NULL;
    POINT dst{0};
    //memset(pptdst, 0, sizeof(POINT));
    if (!info[2]->IsNumber()) {
        Local<Object> jsPOINT = info[2].As<Object>();
        /*pptdst = new POINT*/dst = POINT{(long)IntegerFI(jsPOINT->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("x")).ToLocalChecked()), (long)IntegerFI(jsPOINT->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("y")).ToLocalChecked())};
        //print("point: [" << dst.x << "," << dst.y << "]l");
    }
    SIZE size{0};
    if (!info[3]->IsNumber()) {
        Local<Object> jsSIZE = info[3].As<Object>(); //info[2].As<Object>(); //OOPS
        //print(IntegerFI(jsSIZE->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("width")).ToLocalChecked()));
        //print(IntegerFI(jsSIZE->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("height")).ToLocalChecked()));
        /*psize = new SIZE*/size = SIZE{(long)IntegerFI(jsSIZE->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("width")).ToLocalChecked()), (long)IntegerFI(jsSIZE->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("height")).ToLocalChecked())};
        //print("size: [" << size.cx << "," << size.cy << "]l");
    }
    POINT src{0};// = NULL;
    if (!info[5]->IsNumber()) {
        Local<Object> jsPOINT = info[5].As<Object>();//info[2].As<Object>();
        /*ppsrc = new POINT*/src = POINT{(long)IntegerFI(jsPOINT->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("x")).ToLocalChecked()), (long)IntegerFI(jsPOINT->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("y")).ToLocalChecked())};
        //print("src point: [" << src.x << "," << src.y << "]l");
    }

    BLENDFUNCTION bfunc{ 0 };
    bfunc.BlendOp = AC_SRC_OVER;
    bfunc.SourceConstantAlpha = IntegerFI(info[7]);
    bfunc.AlphaFormat = IntegerFI(info[8]);

    //print(IntegerFI(info[0]) << " " << IntegerFI(info[1]) << " " << info[2]->IsNumber() << " " << info[3]->IsNumber() << " " << IntegerFI(info[4]) << " " << info[5]->IsNumber() << " " << IntegerFI(info[6]) << " " << IntegerFI(info[7]) << " " << IntegerFI(info[8]) << " " << IntegerFI(info[9]));
    
    info.GetReturnValue().Set(Number::New(isolate, UpdateLayeredWindow((HWND)IntegerFI(info[0]), (HDC)IntegerFI(info[1]), info[2]->IsNumber() ? NULL : &dst, info[3]->IsNumber() ? NULL : &size, (HDC)IntegerFI(info[4]), info[5]->IsNumber() ? NULL : &src, IntegerFI(info[6]), &bfunc, IntegerFI(info[9]))));
    //if (pptdst != NULL) {
    //    delete pptdst;
    //}
    //if (psize != NULL) {
    //    delete psize;
    //}
    //if (ppsrc != NULL) {
    //    delete ppsrc;
    //}
}

V8FUNC(SetLayeredWindowAttributesWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, SetLayeredWindowAttributes((HWND)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]))));
}

V8FUNC(GetLayeredWindowAttributesWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    COLORREF c;
    BYTE b;
    DWORD d;
    
    GetLayeredWindowAttributes((HWND)IntegerFI(info[0]), &c, &b, &d);

    Local<Object> jsAttrib = Object::New(isolate);
    jsAttrib->Set(isolate->GetCurrentContext(), LITERAL("transparencyColor"), Number::New(isolate, c));
    jsAttrib->Set(isolate->GetCurrentContext(), LITERAL("alpha"), Number::New(isolate, b));
    jsAttrib->Set(isolate->GetCurrentContext(), LITERAL("dwFlags"), Number::New(isolate, d));

    info.GetReturnValue().Set(jsAttrib);
}

//Function RotateImageA(theta As Single) As Long //stolen from this TOTALLY random website https://forum.powerbasic.com/forum/user-to-user-discussions/powerbasic-for-windows/47733-basic-image-rotation-iv-plgblt
V8FUNC(RotateImage) { //and i just found out that you can do even more shit with gdi https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-setgraphicsmode
    //300x300 image is rotated
    //Dim PlgPts(0 To 2) As PointAPI   //UL, UR, LL corners of source image
    //long XCenter, YCenter;
    //Local XCenter, YCenter As Long
    //XCenter = 149;
    //YCenter = 149;
    //   newx = XCenter + (x - XCenter) * Cos(theta) - (y - YCenter) * Sin(theta)
    //   newy = YCenter + (x - XCenter) * Sin(theta) + (y - YCenter) * Cos(theta)
    
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    POINT p[3];
    
    int x = IntegerFI(info[1]);
    int y = IntegerFI(info[2]);
    int width = IntegerFI(info[3]);
    int height = IntegerFI(info[4]);
    int theta = IntegerFI(info[5]);

    p[0].x = x + (0 - x) * cos(theta) - (0 - y) * sin(theta);  //upper-left in target
    p[0].y = y + (0 - x) * sin(theta) + (0 - y) * cos(theta);
    p[1].x = x + (width - x) * cos(theta) - (0 - y) * sin(theta);  //upper-right in target
    p[1].y = y + (width - x) * sin(theta) + (0 - y) * cos(theta);
    p[2].x = x + (0 - x) * cos(theta) - (height - y) * sin(theta);  //lower left in target
    p[2].y = y + (0 - x) * sin(theta) + (height - y) * cos(theta);
    info.GetReturnValue().Set(Number::New(isolate, PlgBlt((HDC)IntegerFI(info[0]), p, (HDC)IntegerFI(info[6]), x, y, width, height, (HBITMAP)IntegerFI(info[7]), IntegerFI(info[8]), IntegerFI(info[9]))));  // Draw rotated image
}
//End Function

V8FUNC(GetGraphicsModeWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, GetGraphicsMode((HDC)IntegerFI(info[0]))));
}

V8FUNC(SetGraphicsModeWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, SetGraphicsMode((HDC)IntegerFI(info[0]), IntegerFI(info[1]))));
}

V8FUNC(GetMapModeWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, GetMapMode((HDC)IntegerFI(info[0]))));
}

V8FUNC(SetMapModeWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, SetMapMode((HDC)IntegerFI(info[0]), IntegerFI(info[1]))));
}

V8FUNC(GetWorldTransformWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    Local<Object> jsTRANSFORM = Object::New(isolate);
    
    XFORM xForm; GetWorldTransform((HDC)IntegerFI(info[0]), &xForm);
    
    jsTRANSFORM->Set(isolate->GetCurrentContext(), LITERAL("eM11"), Number::New(isolate, xForm.eM11));
    jsTRANSFORM->Set(isolate->GetCurrentContext(), LITERAL("eM12"), Number::New(isolate, xForm.eM12));
    jsTRANSFORM->Set(isolate->GetCurrentContext(), LITERAL("eM21"), Number::New(isolate, xForm.eM21));
    jsTRANSFORM->Set(isolate->GetCurrentContext(), LITERAL("eM22"), Number::New(isolate, xForm.eM22));
    jsTRANSFORM->Set(isolate->GetCurrentContext(), LITERAL("eDx"), Number::New(isolate, xForm.eDx));
    jsTRANSFORM->Set(isolate->GetCurrentContext(), LITERAL("eDy"), Number::New(isolate, xForm.eDy));

    info.GetReturnValue().Set(jsTRANSFORM);
}

V8FUNC(SetWorldTransformWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    Local<Object> jsTRANSFORM = info[1].As<Object>();
    //https://www.vbforums.com/showthread.php?840377-2d-shape-(rectangle)-manipulation&p=5117971&viewfull=1#post5117971
    //https://www.vbforums.com/showthread.php?888707-API-what-is-the-best-function-for-draw-an-image-using-4-points
    XFORM xForm{ 0 };
    xForm.eM11 = FloatFI(jsTRANSFORM->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("eM11")).ToLocalChecked());
    xForm.eM12 = FloatFI(jsTRANSFORM->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("eM12")).ToLocalChecked());
    xForm.eM21 = FloatFI(jsTRANSFORM->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("eM21")).ToLocalChecked());
    xForm.eM22 = FloatFI(jsTRANSFORM->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("eM22")).ToLocalChecked());
    xForm.eDx = FloatFI(jsTRANSFORM->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("eDx")).ToLocalChecked());
    xForm.eDy = FloatFI(jsTRANSFORM->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("eDy")).ToLocalChecked());

    info.GetReturnValue().Set(Number::New(isolate, SetWorldTransform((HDC)IntegerFI(info[0]), &xForm)));
}

V8FUNC(ModifyWorldTransformWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    if (info[1]->IsNumber() || info[1]->IsNullOrUndefined()) {
        info.GetReturnValue().Set(Number::New(isolate, ModifyWorldTransform((HDC)IntegerFI(info[0]), (const XFORM*)IntegerFI(info[1]), IntegerFI(info[2]))));
    }
    else {
        Local<Object> jsTRANSFORM = info[1].As<Object>();
        XFORM xForm{ 0 };
        xForm.eM11 = FloatFI(jsTRANSFORM->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("eM11")).ToLocalChecked());
        xForm.eM12 = FloatFI(jsTRANSFORM->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("eM12")).ToLocalChecked());
        xForm.eM21 = FloatFI(jsTRANSFORM->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("eM21")).ToLocalChecked());
        xForm.eM22 = FloatFI(jsTRANSFORM->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("eM22")).ToLocalChecked());
        xForm.eDx = FloatFI(jsTRANSFORM->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("eDx")).ToLocalChecked());
        xForm.eDy = FloatFI(jsTRANSFORM->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("eDy")).ToLocalChecked());
        info.GetReturnValue().Set(Number::New(isolate, ModifyWorldTransform((HDC)IntegerFI(info[0]), &xForm, IntegerFI(info[2]))));
    }
}

#include <dwmapi.h>
#pragma comment(lib, "Dwmapi.lib") //oops i left a semicolon but it didn't stop it from compiling

V8FUNC(DwmExtendFrameIntoClientAreaWrapper) { //https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmextendframeintoclientarea?redirectedfrom=MSDN
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    MARGINS inset{-1};
    inset.cxLeftWidth = IntegerFI(info[1]);
    inset.cyTopHeight = IntegerFI(info[2]);
    inset.cxRightWidth = IntegerFI(info[3]);
    inset.cyBottomHeight = IntegerFI(info[4]);

    info.GetReturnValue().Set(Number::New(isolate, DwmExtendFrameIntoClientArea((HWND)IntegerFI(info[0]), &inset)));
}

//void TimeoutProc(HWND hwnd, UINT msg, UINT_PTR id, DWORD time) {
//    //this looks questionable lets hope it works (oh god)
//    print("TIMOEUT");
//    v8::FunctionCallbackInfo<v8::Value> info = *(v8::FunctionCallbackInfo<v8::Value>*)id;
//    using namespace v8;
//    Isolate* isolate = info.GetIsolate();
//    Local<Function> callback = info[0].As<Function>();
//    Local<Value> result;
//    /*Local<Value> result = */
//    //Local<TryCatch> shit(isolate);
//    if (callback->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 0, nullptr).ToLocal(&result)) { //   ;/*.ToLocalChecked()*/;
//
//    }
//    KillTimer(GetConsoleWindow(), id);
//}
//
//V8FUNC(setTimeout) {
//    using namespace v8;
//    Isolate* isolate = info.GetIsolate();
//    print("info->" << (LONG_PTR) & info << " " << IntegerFI(info[1]) << " " << GetConsoleWindow());
//    print(SetTimer(GetConsoleWindow(), (LONG_PTR)&info, IntegerFI(info[1]), TimeoutProc) << " setTimeout");
//}

//#include <thread>

//yo this is  a little harder than i thought lemme go back to JSTimer.h

//V8FUNC(setTimeout) {
//    using namespace v8;
//    //Isolate* isolate = info.GetIsolate();
//    std::thread t([&, info]() {
//        Isolate* isolate = info.GetIsolate();
//        Sleep(IntegerFI(info[1]));
//        Local<Function> callback = info[0].As<Function>();
//        callback->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 0, nullptr);
//    });
//    //std::thread t([](v8::FunctionCallbackInfo<v8::Value>* i) {
//    //    auto info = *i; //first time using auto
//    //    Isolate* isolate = info.GetIsolate();
//    //    Sleep(IntegerFI(info[1]));
//    //    Local<Function> callback = info[0].As<Function>();
//    //    callback->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 0, nullptr);
//    //}, &info);
//}
//
//V8FUNC(setInterval) {
//
//}

//uv_loop_t* uv_loop;
//
//V8FUNC(setTimeout) {
//    using namespace v8;
//    Isolate* isolate = info.GetIsolate();
//    uv_timer_t timer;
//    timer.data = (void*) & info; //sure i hope this works
//    uv_timer_init(uv_loop, &timer);
//    uv_timer_start(&timer, [](uv_timer_t* handle) { //and i might have to end it BRUH I MIGHT HAVE TO MAKE A SPECIAL CLASS AGAIN (WAIT JUST WAIT A MINUTE void* data is a public member of uv_timer_t)
//        print("timer end ykykyk");
//        FunctionCallbackInfo<Value> info = *(FunctionCallbackInfo<Value>*)handle->data; //i am trusting that this info pointer does not get garbaged by the time this lambda is called
//        Isolate* isolate = info.GetIsolate();
//        Local<Function> callback = info[0].As<Function>();
//        TryCatch shit(isolate);
//        callback->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 0, nullptr);
//        if (shit.HasCaught()) {
//            HANDLE console = GetStdHandle(STD_OUTPUT_HANDLE);
//            SetConsoleTextAttribute(console, 4);
//            print(CStringFI(shit.Message()->Get()) << "\007");
//            SetConsoleTextAttribute(console, 7);
//        }
//    }, IntegerFI(info[1]), 0);
//    uv_run(uv_loop, UV_RUN_DEFAULT);
//    print("uv_ran");
//}

V8FUNC(DwmDefWindowProcWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    LRESULT lRet; //idk why it is lRet
    BOOL shit = DwmDefWindowProc((HWND)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), &lRet);
    Local<Array> jsArray = Array::New(isolate, 2);
    jsArray->Set(isolate->GetCurrentContext(), 0, Number::New(isolate, shit)); //how is Number::New not a macro already?
    jsArray->Set(isolate->GetCurrentContext(), 1, Number::New(isolate, lRet));
    info.GetReturnValue().Set(jsArray); //which value should i return? (finally decided on both)
}

V8FUNC(DwmEnableBlurBehindWindowWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    DWM_BLURBEHIND bb{0};
    bb.dwFlags = IntegerFI(info[2]);
    bb.fEnable = IntegerFI(info[1]);
    if (!info[3].IsEmpty()) {
        HRGN rgn = CreateRectRgn(IntegerFI(info[3]), IntegerFI(info[4]), IntegerFI(info[5]) , IntegerFI(info[6])); //why do you have to destroy this object like gdi (im not doing that watch out)
        bb.hRgnBlur = rgn;
    }
    else {
        bb.hRgnBlur = NULL;
    }
    info.GetReturnValue().Set(Number::New(isolate, DwmEnableBlurBehindWindow((HWND)IntegerFI(info[0]), &bb)));
}

//V8FUNC(DwmEnableCompositionWrapper) { //dang it bruh i went to the docs and it DwmEnableComposition doesn't even work anymore
//    using namespace v8;
//    Isolate* isolate = info.GetIsolate();
//
//    info.GetReturnValue().Set(Number::New(isolate, DwmEnableComposition(IntegerFI(info[0]))));
//}

typedef enum {
    ACCENT_DISABLED = 0,
    ACCENT_ENABLE_GRADIENT = 1,
    ACCENT_ENABLE_TRANSPARENTGRADIENT = 2,
    ACCENT_ENABLE_BLURBEHIND = 3,
    ACCENT_INVALID_STATE = 4,
    _ACCENT_STATE_SIZE = 0xFFFFFFFF
} ACCENT_STATE;

struct ACCENTPOLICY
{
    int nAccentState;
    int nFlags;
    int nGradientColor;
    int nAnimationId;
};

struct WINCOMPATTRDATA
{
    int  nAttribute;
    void* pData;
    unsigned int ulSizeOfData;
};

//dang i had hella tabs related to SetWindowComposition and friends

//https://stackoverflow.com/questions/74582735/winapi-blurring-a-window-fails
//https://learn.microsoft.com/en-us/answers/questions/1123887/setwindowcompositionattribute-after-setting-transp
//https://stackoverflow.com/questions/63426740/what-are-the-requirements-for-window-to-be-blurred-except-setwindowcompositiona
//https://gist.github.com/riverar/fd6525579d6bbafc6e48
//https://www.reddit.com/r/AutoHotkey/comments/125b120/set_window_aero_translucentblur_effects_win_10/
//https://stackoverflow.com/questions/63426740/what-are-the-requirements-for-window-to-be-blurred-except-
//https://github.com/jdmansour/mintty/blob/glass/src/winmain.c#L683 
//https://stackoverflow.com/questions/32335945/blur-behind-window-with-titlebar-in-windows-10-stopped-working-after-windows-up
//https://stackoverflow.com/questions/32724187/how-do-you-set-the-glass-blend-colour-on-windows-10
//https://vhanla.codigobit.info/2015/07/enable-windows-10-aero-glass-aka-blur.html
//im honestly shocked this function works because DwmEnableBlurBehindWindow doesn't work past windows 8 and the replacement function (DwmSetWindowAttribute)'s acrylic is slightly different than SetWindowCompositionAttribute
V8FUNC(SetWindowCompositionAttributeWrapper) { //i was thinking to myself "huh i thought i already added this function" but then i looked it up and realized not only is it undocumented but i have to LOADLIBRARY IT from user32
    using namespace v8; //DWMACCENTPOLICY
    Isolate* isolate = info.GetIsolate();
    const HINSTANCE user32 = LoadLibrary(L"user32.dll");
    if (!user32) {
        info.GetReturnValue().Set(Number::New(isolate, 0)); //returns 0 if failed
    }
    else {
        typedef bool(WINAPI* pSetWindowCompositionAttribute)(HWND, WINCOMPATTRDATA*);

        const pSetWindowCompositionAttribute SetWindowCompositionAttribute = (pSetWindowCompositionAttribute)GetProcAddress(user32, "SetWindowCompositionAttribute");
        if (!SetWindowCompositionAttribute)
        {
            FreeLibrary(user32);
            info.GetReturnValue().Set(Number::New(isolate, 0)); //returns 0 if failed
            return; // Failed to get SetWindowCompositionAttribute function
        }

        ACCENTPOLICY    policy{ IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]) }; //https://www.unknowncheats.me/forum/general-programming-and-reversing/617284-blurring-imgui-basically-window-using-acrylic-blur.html
        WINCOMPATTRDATA data{ 19, &policy, sizeof(ACCENTPOLICY) }; //wait wait is it the sizeof ACCENTPOLICY or sizeof WINCOMPATTRDATA because this -> https://github.com/jdmansour/mintty/blob/glass/src/winmain.c#L683 says otherwise
        bool            success = SetWindowCompositionAttribute((HWND)IntegerFI(info[0]), &data);

        FreeLibrary(user32);
        info.GetReturnValue().Set(Boolean::New(isolate, success));
    }
}

V8FUNC(DwmSetWindowAttributeWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    //oooo this is lame i gotta make ifs
    HWND window = (HWND)IntegerFI(info[0]);
    int dwmwa = IntegerFI(info[1]);

    HRESULT result=S_OK;

    //switch (dwmwa) { //i do NOT fw switch statements like that but for some reason their performance is (allegedly) crazy 
        /*case DWMWA_NCRENDERING_ENABLED:*/ //get only
        //case DWMWA_TRANSITIONS_FORCEDISABLED:
        //case DWMWA_ALLOW_NCPAINT:
        //case DWMWA_NONCLIENT_RTL_LAYOUT:
        //case DWMWA_FORCE_ICONIC_REPRESENTATION:
        //case DWMWA_HAS_ICONIC_BITMAP:
        //case DWMWA_DISALLOW_PEEK:
        //case DWMWA_EXCLUDED_FROM_PEEK:
        //case DWMWA_CLOAK:
        //case DWMWA_FREEZE_REPRESENTATION:
        //case DWMWA_PASSIVE_UPDATE_MODE:
        //case DWMWA_USE_HOSTBACKDROPBRUSH:
        //case DWMWA_USE_IMMERSIVE_DARK_MODE:
    if (dwmwa == DWMWA_NCRENDERING_ENABLED || dwmwa == DWMWA_TRANSITIONS_FORCEDISABLED || dwmwa == DWMWA_ALLOW_NCPAINT || dwmwa == DWMWA_NONCLIENT_RTL_LAYOUT || dwmwa == DWMWA_FORCE_ICONIC_REPRESENTATION || dwmwa == DWMWA_HAS_ICONIC_BITMAP || dwmwa == DWMWA_DISALLOW_PEEK || dwmwa == DWMWA_EXCLUDED_FROM_PEEK || dwmwa == DWMWA_CLOAK || dwmwa == DWMWA_FREEZE_REPRESENTATION || dwmwa == DWMWA_PASSIVE_UPDATE_MODE || dwmwa == DWMWA_USE_HOSTBACKDROPBRUSH || dwmwa == DWMWA_USE_IMMERSIVE_DARK_MODE) {
        BOOL shits = info[2]->BooleanValue(isolate);
        result = DwmSetWindowAttribute(window, dwmwa, &shits, sizeof(shits));
    }else
            //break;

        //case DWMWA_SYSTEMBACKDROP_TYPE:
        //case DWMWA_NCRENDERING_POLICY:
        //case DWMWA_WINDOW_CORNER_PREFERENCE:
        //case DWMWA_FLIP3D_POLICY:
    if (dwmwa == DWMWA_SYSTEMBACKDROP_TYPE || dwmwa == DWMWA_NCRENDERING_POLICY || dwmwa == DWMWA_WINDOW_CORNER_PREFERENCE || dwmwa == DWMWA_FLIP3D_POLICY) {
        int shits = IntegerFI(info[2]);
        result = DwmSetWindowAttribute(window, dwmwa, &shits, sizeof(shits));
    }else
            //break;

        //case DWMWA_BORDER_COLOR:
        //case DWMWA_CAPTION_COLOR:
        //case DWMWA_TEXT_COLOR:
    if (dwmwa == DWMWA_BORDER_COLOR || dwmwa == DWMWA_CAPTION_COLOR || dwmwa == DWMWA_TEXT_COLOR) {
        COLORREF shits = info[2]->Uint32Value(isolate->GetCurrentContext()).ToChecked(); //im assuming here that unsigned long is equal to unsigned int (int and long MIGHT be the same size idk)
        result = DwmSetWindowAttribute(window, dwmwa, &shits, sizeof(shits));
    }
            //break;
            /*case DWMWA_VISIBLE_FRAME_BORDER_THICKNESS:
            UINT shits = info[1]->Uint32Value(isolate->GetCurrentContext()).ToChecked();
            result = DwmSetWindowAttribute(window, dwmwa, &shits, sizeof(shits));

            break;*/ //get only!
    //}

    info.GetReturnValue().Set(Number::New(isolate, result));
}

V8FUNC(DwmGetWindowAttributeWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    //oooo this is lame i gotta make ifs

    HWND window = (HWND)IntegerFI(info[0]);
    int dwmwa = IntegerFI(info[1]);

    HRESULT hr = S_OK;

    switch (dwmwa) { //oh come on the solution was just to add curly braces after every case statement (found this out after i converted DwmSetWindowAttribute whatever bruh)
        case DWMWA_NCRENDERING_ENABLED:
        {
            BOOL isNCRenderingEnabled{ FALSE };
            hr = DwmGetWindowAttribute(window,
                dwmwa,
                &isNCRenderingEnabled,
                sizeof(isNCRenderingEnabled));
            if (hr == S_OK) {
                info.GetReturnValue().Set(Boolean::New(isolate, isNCRenderingEnabled));
            }
            else {
                //how do i throw an error
                std::string errorcode = (std::string("HRESULT ERR: ") + std::to_string(hr));
                info.GetReturnValue().Set(Exception::Error(String::NewFromUtf8(isolate, errorcode.c_str(), NewStringType::kNormal, errorcode.size()).ToLocalChecked())); //idk why it wouldn't except utf8literal
            }
        }
            break;

        case DWMWA_CAPTION_BUTTON_BOUNDS:
        case DWMWA_EXTENDED_FRAME_BOUNDS:
        {
            RECT extendedFrameBounds{ 0,0,0,0 };
            hr = DwmGetWindowAttribute(window,
                dwmwa,
                &extendedFrameBounds,
                sizeof(extendedFrameBounds));

            if (hr == S_OK) {
                info.GetReturnValue().Set(jsImpl::createWinRect(isolate, extendedFrameBounds));
            }
            else {
                //how do i throw an error
                std::string errorcode = (std::string("HRESULT ERR: ") + std::to_string(hr));
                info.GetReturnValue().Set(Exception::Error(String::NewFromUtf8(isolate, errorcode.c_str(), NewStringType::kNormal, errorcode.size()).ToLocalChecked())); //idk why it wouldn't except utf8literal
            }
        }
            break;

        case DWMWA_SYSTEMBACKDROP_TYPE:
        case DWMWA_CLOAKED:
        {
            int cloaked = 0; //ignore this name LO!
            hr = DwmGetWindowAttribute(window,
                dwmwa,
                &cloaked,
                sizeof(cloaked));
            if (hr == S_OK) {
                info.GetReturnValue().Set(Number::New(isolate, cloaked));
            }
            else {
                //how do i throw an error
                std::string errorcode = (std::string("HRESULT ERR: ") + std::to_string(hr));
                info.GetReturnValue().Set(Exception::Error(String::NewFromUtf8(isolate, errorcode.c_str(), NewStringType::kNormal, errorcode.size()).ToLocalChecked())); //idk why it wouldn't except utf8literal
            }
        }
        break;

        case DWMWA_VISIBLE_FRAME_BORDER_THICKNESS:
        {
            UINT thickness = 0;
            hr = DwmGetWindowAttribute(window,
                dwmwa,
                &thickness,
                sizeof(thickness));
            if (hr == S_OK) {
                info.GetReturnValue().Set(Uint32::NewFromUnsigned(isolate, thickness));
            }
            else {
                //how do i throw an error
                std::string errorcode = (std::string("HRESULT ERR: ") + std::to_string(hr));
                info.GetReturnValue().Set(Exception::Error(String::NewFromUtf8(isolate, errorcode.c_str(), NewStringType::kNormal, errorcode.size()).ToLocalChecked())); //idk why it wouldn't except utf8literal
            }
        }
            break;

    }

}

V8FUNC(DwmSetIconicThumbnailWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, DwmSetIconicThumbnail((HWND)IntegerFI(info[0]), (HBITMAP)IntegerFI(info[1]), (DWORD)IntegerFI(info[2]))));
}

V8FUNC(DwmSetIconicLivePreviewBitmapWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    if (info[2]->IsNullOrUndefined()) {
        info.GetReturnValue().Set(Number::New(isolate, DwmSetIconicLivePreviewBitmap((HWND)IntegerFI(info[0]), (HBITMAP)IntegerFI(info[1]), NULL, (DWORD)IntegerFI(info[3]))));
    }
    else {
        POINT shits{ IntegerFI(info[2].As<Array>()->Get(isolate->GetCurrentContext(), 0).ToLocalChecked()) ,IntegerFI(info[2].As<Array>()->Get(isolate->GetCurrentContext(), 1).ToLocalChecked()) };
        info.GetReturnValue().Set(Number::New(isolate, DwmSetIconicLivePreviewBitmap((HWND)IntegerFI(info[0]), (HBITMAP)IntegerFI(info[1]), &shits, (DWORD)IntegerFI(info[3]))));
    }
}

V8FUNC(DwmInvalidateIconicBitmapsWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    info.GetReturnValue().Set(Number::New(isolate, DwmInvalidateIconicBitmaps((HWND)IntegerFI(info[0]))));
}

V8FUNC(SetWindowDisplayAffinityWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    info.GetReturnValue().Set(Number::New(isolate, SetWindowDisplayAffinity((HWND)IntegerFI(info[0]), (DWORD)IntegerFI(info[1]))));
}

V8FUNC(GetWindowDisplayAffinityWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    DWORD aff = -1;

    GetWindowDisplayAffinity((HWND)IntegerFI(info[0]), &aff);

    info.GetReturnValue().Set(Number::New(isolate, aff));
}

V8FUNC(NCCALCSIZE_PARAMSWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    NCCALCSIZE_PARAMS* pncsp = (NCCALCSIZE_PARAMS*)IntegerFI(info[0]);
    pncsp->rgrc[0].left = pncsp->rgrc[0].left + 0;
    pncsp->rgrc[0].top = pncsp->rgrc[0].top + 0;
    pncsp->rgrc[0].right = pncsp->rgrc[0].right - 0;
    pncsp->rgrc[0].bottom = pncsp->rgrc[0].bottom - 0;

}

V8FUNC(DefWindowProcWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, DefWindowProcW((HWND)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]))));
}

V8FUNC(SwitchToThisWindowWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    //#error lol i haven't added this func to the jbs extension so don't compuile this hoe
    SwitchToThisWindow((HWND)IntegerFI(info[0]), IntegerFI(info[1]));
}

void showFilePicker(const v8::FunctionCallbackInfo<v8::Value>& info, bool saveDialog) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    //i could use a promise but idk if i can be bothered
    Local<Object> options = info[0].As<Object>();

    bool multiple = false;
    //Local<Value> mult;
    //options->HasRealNamedProperty(isolate->GetCurrentContext(), LITERAL("multiple")).FromJust();
    if (options->HasRealNamedProperty(isolate->GetCurrentContext(), LITERAL("multiple")).FromJust()) {
        multiple = options->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("multiple")).ToLocalChecked()->BooleanValue(isolate); //this seems so weird they gotta have a better way but it kept crashing when i tried to do it
    }
    bool excludeAcceptAll = false;
    //Local<Value> exclude;
    //options->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("excludeAcceptAllOption")).ToLocal(&exclude);
    if (options->HasRealNamedProperty(isolate->GetCurrentContext(), LITERAL("excludeAcceptAllOption")).FromJust()) {
        excludeAcceptAll = options->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("excludeAcceptAllOption")).ToLocalChecked()->BooleanValue(isolate); //this seems so weird they gotta have a better way but it kept crashing when i tried to do it
    }

    bool hasTypes = options->HasRealNamedProperty(isolate->GetCurrentContext(), LITERAL("types")).FromJust();

    IFileDialog* pfd;

    // CoCreate the dialog object.
    HRESULT hr = CoCreateInstance((saveDialog ? CLSID_FileSaveDialog : CLSID_FileOpenDialog),//CLSID_FileOpenDialog,
        NULL,
        CLSCTX_INPROC_SERVER,
        IID_PPV_ARGS(&pfd));

    if (SUCCEEDED(hr))
    {
        DWORD dwOptions;
        // Specify multiselect.
        hr = pfd->GetOptions(&dwOptions);


        if (SUCCEEDED(hr))
        {
            if (multiple) {
                /*hr = */pfd->SetOptions(dwOptions | FOS_ALLOWMULTISELECT);
            }
            int saveTypesCount = excludeAcceptAll ? 0 : 1;
            Local<Array> types;
            if (hasTypes) { //ok bruh i learned a lot about this memory shit trying to make this work but honestly i don't think it's worth it (im actually just gonna use COM)
                types = options->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("types")).ToLocalChecked().As<Array>();
                saveTypesCount += types->Length();
            }
            COMDLG_FILTERSPEC* c_rgSaveTypes = new COMDLG_FILTERSPEC[saveTypesCount];
            if(hasTypes) { //this is really ugly but not as ugly as i originally had in mind (having 2 checks for hasTypes)
                for (int i = 0; i < types->Length(); i++) {
                    Local<Object> typeInfo = types->Get(isolate->GetCurrentContext(), i).ToLocalChecked().As<Object>();
                    Local<String> desc = typeInfo->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("description")).ToLocalChecked().As<String>();
                    Local<Array> acceptTypes = typeInfo->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("accept")).ToLocalChecked().As<Array>();
                    
                    std::wstring aTWS = std::wstring();

                    for (int j = 0; j < acceptTypes->Length(); j++) {
                        const wchar_t* aTS = WStringFI(acceptTypes->Get(isolate->GetCurrentContext(), j).ToLocalChecked());
                        if (aTS[0] == '.') {
                            aTWS += '*'; //gotta add the * because .png wont work but *.png will
                        }
                        aTWS += aTS;
                        //if (acceptTypes->Length() == 1 || acceptTypes->Length() - 1 == j) {
                            
                        //}
                        //else {
                        if(acceptTypes->Length() > 1 && acceptTypes->Length() - 1 != j) {
                            //aTWS += WStringFI(acceptTypes->Get(isolate->GetCurrentContext(), j).ToLocalChecked());
                            aTWS += L';';
                        }
                    }

                    c_rgSaveTypes[i] = { WStringFI(desc), aTWS.c_str()}; //lets hope this c_str() keeps working outside this scope
                }
            }
            if (!excludeAcceptAll) {
                c_rgSaveTypes[saveTypesCount - 1] = { L"All Files (*.*)", L"*.*" };
            }

            //pfd->SetFileTypes(ARRAYSIZE(c_rgSaveTypes), c_rgSaveTypes); //when using new for c_rgSaveTypes ARRAYSIZE gives me an error and it suggests _ARRAYSIZE so lets see
            //alright bruh this is all stupid the only thing arraysize did was literally say how many {}s were inside c_rgSaveTypes (which is saveTypesCount)
            pfd->SetFileTypes(saveTypesCount, c_rgSaveTypes);
            // Show the Open dialog.
            hr = pfd->Show(NULL);

            if (SUCCEEDED(hr))
            {
                // Obtain the result of the user interaction.
                if (!saveDialog) {
                    IShellItemArray* psiaResults;
                    IFileOpenDialog* ifod;
                    hr = pfd->QueryInterface(&ifod); //what the hell this is the only time i've ever used QueryInterface and it lowkey actually worked??? (it crashed when i tried casting pfd as IFileOpenDialog*)
                    if (SUCCEEDED(hr)) {
                        hr = ifod->GetResults(&psiaResults);

                        if (SUCCEEDED(hr))
                        {
                            DWORD items;
                            if (SUCCEEDED(psiaResults->GetCount(&items))) {
                                std::cout << items << std::endl;
                                Local<Array> jsArr = Array::New(isolate, items);
                                for (int i = 0; i < items; i++) {
                                    IShellItem* shellItem; //should i release this object? (for some reason they don't in the docs and maybe they are released when psiaResults are released that sorta thing)
                                    if (SUCCEEDED(psiaResults->GetItemAt(i, &shellItem))) {
                                        wchar_t* path = NULL; //it's so weird and kinda annoying how they use special types like PWSTR and half of them mean the exact same thing
                                        if (SUCCEEDED(shellItem->GetDisplayName(SIGDN_FILESYSPATH, &path))) {
                                            //info.GetReturnValue().Set(String::NewFromTwoByte(isolate, (const uint16_t*)path).ToLocalChecked());
                                            jsArr->Set(isolate->GetCurrentContext(), i, String::NewFromTwoByte(isolate, (const uint16_t*)path).ToLocalChecked());
                                        }
                                    }
                                    shellItem->Release();
                                }
                                info.GetReturnValue().Set(jsArr);
                            }
                            //
                            // You can add your own code here to handle the results.
                            //
                            psiaResults->Release();
                        }
                    }
                }else {
                    IShellItem* shellItem;
                    if (SUCCEEDED(pfd->GetResult(&shellItem))) {
                        wchar_t* path = NULL;
                        if (SUCCEEDED(shellItem->GetDisplayName(SIGDN_FILESYSPATH, &path))) {
                            info.GetReturnValue().Set(String::NewFromTwoByte(isolate, (const uint16_t*)path).ToLocalChecked());
                        }
                    }
                    shellItem->Release();
                }
            }
            delete[] c_rgSaveTypes;
        }
        pfd->Release();
    }

    /*OPENFILENAME ofn; //Starting with Windows Vista, the Open and Save As common dialog boxes have been superseded by the Common Item Dialog (im not using all that bruh IFileDialog uses COM and the "basic" example is complicated ASL)

    wchar_t file_name[MAX_PATH]{};

    ZeroMemory(&ofn, sizeof(OPENFILENAME));
    ofn.lStructSize = sizeof(OPENFILENAME);
    ofn.lpstrFile = file_name;
    ofn.lpstrFile[0] = L'\0';
    ofn.nMaxFile = MAX_PATH;
    wchar_t filter[MAX_PATH]{};
    if (!excludeAcceptAll) {
        //memcpy(filter, L"All Files (*.*)\0*.*\0", 20); //yeah this is sus as fuck lemme breakpoint (honestly wait i can just wcscat)
        wcscat(filter, L"All Files (*.*)\0*.*\0");
    }
    if (options->HasRealNamedProperty(isolate->GetCurrentContext(), LITERAL("types")).FromJust()) { //ok bruh i learned a lot about this memory shit trying to make this work but honestly i don't think it's worth it (im actually just gonna use COM)
        Local<Array> types = options->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("types")).ToLocalChecked().As<Array>();
        for (int i = 0; i < types->Length(); i++) {
            Local<Object> typeInfo = types->Get(isolate->GetCurrentContext(), i).ToLocalChecked().As<Object>();
            Local<String> desc = typeInfo->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("description")).ToLocalChecked().As<String>();
            Local<Array> acceptTypes = typeInfo->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("accept")).ToLocalChecked().As<Array>();
            
            //sorry buddy i don't think im doing mime types idk bruh we gonna have to see

            //int size = desc->Length() + acceptTypes->Length() + 2; //bruh last night right when i went to bed i realized im not calculating size right and idk how it's been working this whole time
            int size = desc->Length() + 2; //+2 because null char after description and after the types (desc\0types\0)
            if (acceptTypes->Length() > 1) {
                size += acceptTypes->Length() - 1;
            }

            //OMY GOD I JUST REALIZEDF I COULD'VE USED WSTRING RTHIS WHOLE TIME???? (i've already given up on this approach but THERE'S NO WAY) WHILKE I WAS WEARCHING FOR WCSCAT I SAW SOMEONE USE WSTRING AND IT DIDN'T EVEN PIERCE MY BRAIN

            //wchar_t* combined = nullptr; //bruh i gotta do this the old fashioned way
            //memset(combined, 0, size); //i was tryna be cheeky and use memset because i wanted a variable sized array but apparently i should've used calloc or not had combined be a pointer (ok this last one is cap)
            wchar_t* combined = new wchar_t[size];//(wchar_t*)calloc(0, size); //lol i just wanted to see if i could use calloc but honestly im just gonna use new
                                //what a fun line

            wcscat(combined, WStringFI(desc));
            //wcscat(combined, L"\0"); (ok it has come to my attention that appending null characters lowkey doesn't work with wcscat)
            combined[desc->Length()] = L'\0'; //seems right to me

            for (int j = 0; j < acceptTypes->Length(); j++) {
                if (acceptTypes->Length() == 1 || acceptTypes->Length() - 1 == j) {
                    wcscat(combined, WStringFI(acceptTypes->Get(isolate->GetCurrentContext(), j).ToLocalChecked()));
                }
                else {
                    wcscat(combined, WStringFI(acceptTypes->Get(isolate->GetCurrentContext(), j).ToLocalChecked()));
                    wcscat(combined, L";");
                }
            }

            combined[size-1]
            wcscat(filter, combined);
            //wcscat(filter, L"\0"); //now the last fix was easy but i might be cooked here

            //free(combined);
            delete[] combined;
        }
    }
    ofn.lpstrFilter = filter;
    //ofn.lpstrFilter = L"All Files (*.*)\0*.*\0niggers\0*.png;*.gif\0";
    ofn.nFilterIndex = 1;
    ofn.Flags = multiple ? OFN_ALLOWMULTISELECT | OFN_EXPLORER : 0;

    GetOpenFileName(&ofn);

    //could do (int) or + (nevermind i couldn't find anybody say it again lets try it tho)
    if (+file_name[0]) {
        info.GetReturnValue().Set(String::NewFromTwoByte(isolate, (uint16_t*)file_name, v8::NewStringType::kNormal, MAX_PATH).ToLocalChecked());
        //changePicture(file_name);
    }*/

}

void showOpenFilePicker(const v8::FunctionCallbackInfo<v8::Value>& info) {
    showFilePicker(info, false);
}

void showSaveFilePicker(const v8::FunctionCallbackInfo<v8::Value>& info) {
    showFilePicker(info, true);
}

void showDirectoryPicker(const v8::FunctionCallbackInfo<v8::Value>& info) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    //i could use a promise but idk if i can be bothered
    IFileDialog* pfd;

    // CoCreate the dialog object.
    HRESULT hr = CoCreateInstance(CLSID_FileOpenDialog,//CLSID_FileOpenDialog,
        NULL,
        CLSCTX_INPROC_SERVER,
        IID_PPV_ARGS(&pfd));

    if (SUCCEEDED(hr))
    {
        DWORD dwOptions;
        // Specify multiselect.
        hr = pfd->GetOptions(&dwOptions);

        if (SUCCEEDED(hr))
        {
            /*hr = */pfd->SetOptions(dwOptions | FOS_PICKFOLDERS);

            hr = pfd->Show(NULL);

            if (SUCCEEDED(hr))
            {
                // Obtain the result of the user interaction.

                IShellItem* shellItem;
                if (SUCCEEDED(pfd->GetResult(&shellItem))) {
                    wchar_t* path = NULL;
                    if (SUCCEEDED(shellItem->GetDisplayName(SIGDN_FILESYSPATH, &path))) {
                        info.GetReturnValue().Set(String::NewFromTwoByte(isolate, (const uint16_t*)path).ToLocalChecked());
                    }
                }
                shellItem->Release();
            }
        }
        pfd->Release();
    }
}

V8FUNC(GetClassNameWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    wchar_t* className = new wchar_t[256];
    int length = GetClassNameW((HWND)IntegerFI(info[0]), className, 256);
    info.GetReturnValue().Set(String::NewFromTwoByte(isolate, (const uint16_t*)className, NewStringType::kNormal, length).ToLocalChecked());
    delete[] className;
}

#include "DllCall.h" //oh yeah DLLCALL COMING THROUGH
#include "v8-external.h"

V8FUNC(DllCallWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    Local<Context> context = isolate->GetCurrentContext();

    //if (CStringFI(info[0]) == "__FREE") { //LO! //oops i forgot that c strings are angry
    if(strcmp(CStringFI(info[0]), "__FREE") == 0) {
        info.GetReturnValue().Set(FreeLibrary((HMODULE)info.Data().As<External>()->Value()));
        //somehow forgot to return
        return;
    }

    //HANDLE console = GetStdHandle(STD_OUTPUT_HANDLE);
    //
    ////Print(info.This()->GetOwnPropertyNames(isolate->GetCurrentContext()).ToLocalChecked())
    //v8::String::Utf8Value str(info.GetIsolate(), info.Holder());
    //const char* cstr = *str ? *str : "<string conversion failed>";//ToCString(str);
    //printf("%s", Highlight(info.GetIsolate(), console, info.Holder())); //print syntax colors for the console
    //printf("%s", cstr);
    //
    //printf("\n");
    //fflush(stdout);
    //SetConsoleTextAttribute(console, 7);
    ////print(CStringFI(info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("dll")).ToLocalChecked()));
    //
    //print(CStringFI(Local<String>::Cast(info.Data()))); //line partially from chat gpt

    //IM READY
    //wargaems
    //Local<Array> data = info.Data().As<Array>();
    //HMODULE dll = LoadLibrary(WStringFI(data->Get(context, 0).ToLocalChecked()));
    //if (!dll || dll == INVALID_HANDLE_VALUE) {
    //    MessageBoxA(NULL, "unabled to load/find dll", "maybe use get last error or sumth", MB_OK | MB_ICONERROR);
    //    return;
    //}
    void* argv[10]{}; //lazy man's method
    double* allocatedFloats[10]{};
    Local<Array> args = info[2].As<Array>();
    Local<Array> types = info[3].As<Array>();
    //args->Iterate(context, [](uint32_t index, Local<Value> element, void* data) {
    //    void** argv = *((void***)data); //ok i know this sounds bad BUT
    //    //argv[index] = element.As<External>()->Value(); //yeah maybe????
    //    void* value;
    //    if (element->IsString()) {
    //        
    //        value = (void*)CStringFI(element->);
    //    }
    //    argv[index] = (void*)value;
    //    return Array::CallbackResult::kContinue;
    //}, &argv);
    //im sorry bruh but the restrictions that Iterate puts on you is not worth it for like 10 arguments
    for (int i = 0; i < args->Length(); i++) { //well idk if this knowledge does anything but there is a private field in v8::IndirectHandleBase that holds a location_ ptr (but idk if that would work as void* because i would be passing for example, an int* to a function that expects int (so the address is used as the number))
        Local<Value> element = args->Get(context, i).ToLocalChecked();
        void* value = nullptr;
        //if (element->IsString()) {
        //    if (info[3]->BooleanValue(isolate)) {
        //        value = (void*)WStringFI(element);
        //    }
        //    else {
        //        value = (void*)CStringFI(element);
        //    }
        //}
        //else if (element->IsNumber()) {
        //    value = (void*)IntegerFI(element);
        //}
        if (types->Length() == 0) { //im just interpreting them all as ints
            value = (void*)IntegerFI(element);
        }
        else {
            int type = IntegerFI(types->Get(context, i).ToLocalChecked());
            //int,float,---,cstring,wstring
            if (type == 0) {
                value = (void*)IntegerFI(element);
            }
            else if (type == 1) {
                //uhoh how to send float?
                //allocatedFloats[i] = new double(FloatFI(element));
                //value = (void*)allocatedFloats[i];//(void*)FloatFI(element);
            }
            else if (type == 2) {
                value = (void*)CStringFI(element);
            }
            else if (type == 3) {
                value = (void*)WStringFI(element);
            }
        }
        argv[i] = value;
    }
    void* returned = DllCall((HMODULE)info.Data().As<External>()->Value(), CStringFI(info[0]), IntegerFI(info[1]), argv); //ok bro im not gonna lie floats completely destroy this ENTIRE process i got going on because passing a float through void* is UNDEFINED BEHAVOIR!
    //if (!data->Get(context, 1).ToLocalChecked()->BooleanValue(isolate)) {
    //    FreeLibrary(dll);
    //}
    int returnType = IntegerFI(info[4]);
    if (returnType == 0) {
        if (info[5]->BooleanValue(isolate)) {
            info.GetReturnValue().Set(String::NewFromTwoByte(isolate, (const uint16_t*)returned).ToLocalChecked());
        }
        else {
            info.GetReturnValue().Set(String::NewFromUtf8(isolate, (const char*)returned).ToLocalChecked());
        }
    }
    else if (returnType == 1) {
        info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)returned));
    }
    else if (returnType == 2) {
        //uh oh it might be hard to express a double as void* (in fact idk what it's returning)
        //info.GetReturnValue().Set(Number::New(isolate, *(double*)returned))
    }
    print(returned);
    //for (double* alloc : allocatedFloats) {
    //    if (alloc) {
    //        delete alloc;
    //    }
    //}
    //i might be COOKED, v8 won't give you the pointer to the value of an v8::object because it could be "moved around the heap" (buddy im dying here)

}

//V8FUNC(DllCallWrapper) {
V8FUNC(DllLoad) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    //info[0].As<External>()->Value()
    //const char* shit = info[0]->IntegerValue(isolate->GetCurrentContext()).FromJust();
    //Local<String> dllname = String::NewFromUtf8(isolate, CStringFI(info[0]), NewStringType::kNormal, info[0].As<String>()->Length()).ToLocalChecked();
    //Local<FunctionTemplate> closure = FunctionTemplate::New(isolate, DllCallWrapper);
    //Local<Function> closure = Function::New(isolate->GetCurrentContext(), DllCallWrapper).ToLocalChecked(); //ok wait so how long have i been using functiontemplates for no reason
    //closure->Set(isolate->GetCurrentContext(), LITERAL("dll"), info[0]);
    //maybe i'll return a closure (HOLD)
    //honestly i guess you could use a closure or an object
    
    HMODULE dll = LoadLibrary(WStringFI(info[0]));
    if (!dll || dll == INVALID_HANDLE_VALUE) {
        MessageBoxA(NULL, "unabled to load/find dll", "maybe use get last error or sumth", MB_OK | MB_ICONERROR);
        //info.GetReturnValue().Set(0);
        return;
    }

    //Local<Array> data = Array::New(isolate, 1);
    //data->Set(isolate->GetCurrentContext(), 0, info[0]);
    //data->Set(isolate->GetCurrentContext(), 0, External::New(isolate, dll));
    //data->Set(isolate->GetCurrentContext(), 1, info[1]);

    Local<External> data = External::New(isolate, dll);

    //OK HERE'S WHAT CHAT WAS COOKING
    Local<FunctionTemplate> closure = FunctionTemplate::New(isolate, DllCallWrapper, data); //good GOD that took WAY too long just for this to be the solution bruh WHY ARE THE DOCS ACTUAL GARBAGE https://news.ycombinator.com/item?id=6237562
    //closure->InstanceTemplate()->SetInternalFieldCount(1);
    //closure->SetCallHandler([](const FunctionCallbackInfo<Value>& args) {
    //    Isolate* isolate = args.GetIsolate();
    //    Local<Context> context = isolate->GetCurrentContext();
    //
    //    HANDLE console = GetStdHandle(STD_OUTPUT_HANDLE);
    //    
    //    //Print(info.This()->GetOwnPropertyNames(isolate->GetCurrentContext()).ToLocalChecked())
    //    v8::String::Utf8Value str(isolate, args.This());
    //    const char* cstr = *str ? *str : "<string conversion failed>";//ToCString(str);
    //    printf("%s", Highlight(isolate, console, args.This())); //print syntax colors for the console
    //    printf("%s", cstr);
    //    
    //    printf("\n");
    //    fflush(stdout);
    //    SetConsoleTextAttribute(console, 7);
    //
    //    //print(CStringFI(args.This().As<FunctionTemplate>()->GetFunction(context).ToLocalChecked()->Get(context, LITERAL("dll")).ToLocalChecked()));
    //    //DllCallWrapper(args);
    //    //Local<Object> obj = args.Holder();
    //    //Local<External> ext = Local<External>::Cast(obj->GetInternalField(0)); //wow just learned about the External class and that will actually be extremely helpful for when i ACTUALLY WRITE the DllCall v8 code
    //    //void* ptr = ext->Value();
    //    //Local<Value> data = Local<Value>::New(isolate, static_cast<External*>(ptr));
    //    //Local<Value> argv[] = { data };
    //    ////MyFunction.Call(context, Undefined(isolate), 1, argv).ToLocalChecked(); //chat gpt hallucination (oh wait MyFunction is supposed to be DllCallWrapper)
    //    //DllCallWrapper(args);
    //});
    //closure->SetCallHandler(DllCallWrapper);
    Local<Function> func = closure->GetFunction(isolate->GetCurrentContext()).ToLocalChecked();
    
    //func->Set(isolate->GetCurrentContext(), LITERAL("data"), info[0]);

    info.GetReturnValue().Set(func);//closure->InstanceTemplate()->NewInstance(isolate->GetCurrentContext()).ToLocalChecked()); //ohj
}

V8FUNC(InitializeWIC) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    Local<Context> context = isolate->GetCurrentContext();

    WICHelper* WICObj = new WICHelper();
    if (WICObj->Init()) {
        Local<ObjectTemplate> wic = ObjectTemplate::New(isolate);
        wic->Set(isolate, "internalPtr", Number::New(isolate, (LONG_PTR)WICObj));
        wic->Set(isolate, "LoadDecoder", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            //Local<Context> context = isolate->GetCurrentContext();
            WICHelper* WICObj = (WICHelper*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            IWICBitmapDecoder* wicDecoder = NULL;

            RetIfFailed(WICObj->wicFactory->CreateDecoderFromFilename(WStringFI(info[0]), NULL, GENERIC_READ, WICDecodeMetadataCacheOnLoad, &wicDecoder), "yeah we failed that hoe (CreateDecoderFromFilename)");
            Local<ObjectTemplate> jsDecoder = DIRECT2D::getIUnknownImpl(isolate, wicDecoder);//ObjectTemplate::New(isolate);
            
            jsDecoder->Set(isolate, "GetFrameCount", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                Local<Context> context = isolate->GetCurrentContext();
                IWICBitmapDecoder* wicDecoder = (IWICBitmapDecoder*)info.This()->GetRealNamedProperty(context, LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                UINT pCount; wicDecoder->GetFrameCount(&pCount);

                info.GetReturnValue().Set(pCount);
            }));
            jsDecoder->Set(isolate, "GetBitmapFrame", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                Local<Context> context = isolate->GetCurrentContext();
                IWICBitmapDecoder* wicDecoder = (IWICBitmapDecoder*)info.This()->GetRealNamedProperty(context, LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
                WICHelper* WICObj = (WICHelper*)info[0].As<Object>()->GetRealNamedProperty(context, LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
                
                IWICBitmapFrameDecode* wicFrame = NULL;
                HRESULT err = wicDecoder->GetFrame(IntegerFI(info[1]), &wicFrame);
                if (err != S_OK) {
                    //MessageBoxA(NULL, "GetFirstFrameWiC", "yeah we failed the hoe (wicDecoder->GetFrame(0, &wicFrame))", MB_OK | MB_ICONERROR);
                    ERRORMB(err, "yeah we failed the hoe (wicDecoder->GetFrame(frame, &wicFrame))");
                    //wicDecoder->Release();
                    return;// nullptr;
                }

                Local<Array> id = info[2].As<Array>();
                GUID shit = { IntegerFI(id->Get(context, 0).ToLocalChecked()),
                    IntegerFI(id->Get(context, 1).ToLocalChecked()),
                    IntegerFI(id->Get(context, 2).ToLocalChecked()),
                    IntegerFI(id->Get(context, 3).ToLocalChecked()),
                    IntegerFI(id->Get(context, 4).ToLocalChecked()),
                    IntegerFI(id->Get(context, 5).ToLocalChecked()),
                    IntegerFI(id->Get(context, 6).ToLocalChecked()),
                    IntegerFI(id->Get(context, 7).ToLocalChecked()),
                    IntegerFI(id->Get(context, 8).ToLocalChecked()),
                    IntegerFI(id->Get(context, 9).ToLocalChecked()),
                    IntegerFI(id->Get(context, 10).ToLocalChecked()) };

                IWICFormatConverter* wicConverter = WICObj->LoadBitmapFromFrame(wicDecoder, wicFrame, shit, false);
                info.GetReturnValue().Set(DIRECT2D::getWICBitmapImpl(isolate, wicConverter, shit));//(Number::New(isolate, (LONG_PTR)wicConverter));
            }));
            jsDecoder->Set(isolate, "GetThumbnail", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                Local<Context> context = isolate->GetCurrentContext();
                IWICBitmapDecoder* wicDecoder = (IWICBitmapDecoder*)info.This()->GetRealNamedProperty(context, LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                IWICBitmapSource* wicBitmap = nullptr;
                GUID shit{};
                RetIfFailed(wicDecoder->GetContainerFormat(&shit), "GetPixelFormat failed (GetThumbnail)");

                RetIfFailed(wicDecoder->GetThumbnail(&wicBitmap), "GetThumbnail failed");

                info.GetReturnValue().Set(DIRECT2D::getWICBitmapImpl(isolate, wicBitmap, shit));
            }));
            jsDecoder->Set(isolate, "GetPreview", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                Local<Context> context = isolate->GetCurrentContext();
                IWICBitmapDecoder* wicDecoder = (IWICBitmapDecoder*)info.This()->GetRealNamedProperty(context, LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

                IWICBitmapSource* wicBitmap = nullptr;
                GUID shit{};
                RetIfFailed(wicDecoder->GetContainerFormat(&shit), "GetPixelFormat failed (GetPreview)");

                RetIfFailed(wicDecoder->GetPreview(&wicBitmap), "GetPreview failed");

                info.GetReturnValue().Set(DIRECT2D::getWICBitmapImpl(isolate, wicBitmap, shit));
            }));
            jsDecoder->Set(isolate, "GetContainerFormat", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
                Isolate* isolate = info.GetIsolate();
                Local<Context> context = isolate->GetCurrentContext();
                IWICBitmapDecoder* wicDecoder = (IWICBitmapDecoder*)info.This()->GetRealNamedProperty(context, LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
                GUID format{}; RetIfFailed(wicDecoder->GetContainerFormat(&format), "GetContainerFormat failed");

                Local<Value> elem[] = { Number::New(isolate, format.Data1), Number::New(isolate, format.Data2), Number::New(isolate, format.Data3), Number::New(isolate, format.Data4[0]), Number::New(isolate, format.Data4[1]), Number::New(isolate, format.Data4[2]), Number::New(isolate, format.Data4[3]), Number::New(isolate, format.Data4[4]), Number::New(isolate, format.Data4[5]), Number::New(isolate, format.Data4[6]), Number::New(isolate, format.Data4[7]) };
                info.GetReturnValue().Set(Array::New(isolate, elem, 11)); //yeah ok v8 is just retarded bruh i can't do this (why tf did this work and why was the error so VAGEU)

            }));
            //jsDecoder->Set(isolate, "GetFrame", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            //    Isolate* isolate = info.GetIsolate();
            //    IWICBitmapDecoder* wicDecoder = (IWICBitmapDecoder*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            //    IWICBitmapFrameDecode* wicFrame = NULL;
            //    HRESULT shit = wicDecoder->GetFrame(IntegerFI(info[0]), &wicFrame);
            //
            //    if (shit != S_OK) {
            //        //MessageBoxA(NULL, "GetFirstFrameWiC", "yeah we failed the hoe (wicDecoder->GetFrame(0, &wicFrame))", MB_OK | MB_ICONERROR);
            //        ERRORMB(shit, "yeah we failed the hoe (wicDecoder->GetFrame(frame, &wicFrame))");
            //        //wicDecoder->Release();
            //        return;// nullptr;
            //    }
            //
            //    Local<ObjectTemplate> jsFrame = DIRECT2D::getIUnknownImpl(isolate, wicFrame);
            //
            //    jsFrame->Set(isolate, "CopyPixels", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            //        
            //    }));
            //
            //    info.GetReturnValue().Set(jsFrame->NewInstance(isolate->GetCurrentContext()).ToLocalChecked());
            //}));

            info.GetReturnValue().Set(jsDecoder->NewInstance(isolate->GetCurrentContext()).ToLocalChecked());
            //info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)wicDecoder));
        }));
        wic->Set(isolate, "LoadBitmapFromFilename", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Local<Context> context = isolate->GetCurrentContext();
            WICHelper* WICObj = (WICHelper*)info.This()->GetRealNamedProperty(context, LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            Local<Array> id = info[1].As<Array>();
            GUID shit = { IntegerFI(id->Get(context, 0).ToLocalChecked()),
                IntegerFI(id->Get(context, 1).ToLocalChecked()),
                IntegerFI(id->Get(context, 2).ToLocalChecked()),
                IntegerFI(id->Get(context, 3).ToLocalChecked()),
                IntegerFI(id->Get(context, 4).ToLocalChecked()),
                IntegerFI(id->Get(context, 5).ToLocalChecked()),
                IntegerFI(id->Get(context, 6).ToLocalChecked()),
                IntegerFI(id->Get(context, 7).ToLocalChecked()),
                IntegerFI(id->Get(context, 8).ToLocalChecked()),
                IntegerFI(id->Get(context, 9).ToLocalChecked()),
                IntegerFI(id->Get(context, 10).ToLocalChecked())};
            //unsigned long  Data1;
            //unsigned short Data2;
            //unsigned short Data3;
            //unsigned char  Data4[8];

            IWICFormatConverter* wicConverter = WICObj->LoadBitmapFromFilename(WStringFI(info[0]), shit, IntegerFI(info[2]));

            info.GetReturnValue().Set(DIRECT2D::getWICBitmapImpl(isolate, wicConverter, shit));//Number::New(isolate, (LONG_PTR)wicConverter));
        }));
        //wic->Set(isolate, "LoadBitmapFromStream", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        //    Isolate* isolate = info.GetIsolate();
        //    Local<Context> context = isolate->GetCurrentContext();
        //    WICHelper* WICObj = (WICHelper*)info.This()->GetRealNamedProperty(context, LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
        //    Local<Array> id = info[1].As<Array>();
        //    GUID shit = { IntegerFI(id->Get(context, 0).ToLocalChecked()),
        //        IntegerFI(id->Get(context, 1).ToLocalChecked()),
        //        IntegerFI(id->Get(context, 2).ToLocalChecked()),
        //        IntegerFI(id->Get(context, 3).ToLocalChecked()),
        //        IntegerFI(id->Get(context, 4).ToLocalChecked()),
        //        IntegerFI(id->Get(context, 5).ToLocalChecked()),
        //        IntegerFI(id->Get(context, 6).ToLocalChecked()),
        //        IntegerFI(id->Get(context, 7).ToLocalChecked()),
        //        IntegerFI(id->Get(context, 8).ToLocalChecked()),
        //        IntegerFI(id->Get(context, 9).ToLocalChecked()),
        //        IntegerFI(id->Get(context, 10).ToLocalChecked())};
        //    //unsigned long  Data1;
        //    //unsigned short Data2;
        //    //unsigned short Data3;
        //    //unsigned char  Data4[8];
        //
        //    IWICFormatConverter* wicConverter = WICObj->LoadBitmapFromStream(WStringFI(info[0]), shit, IntegerFI(info[2]));
        //
        //    info.GetReturnValue().Set(DIRECT2D::getWICBitmapImpl(isolate, wicConverter, shit));//Number::New(isolate, (LONG_PTR)wicConverter));
        //}));
        wic->Set(isolate, "ConvertBitmapSource", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Local<Context> context = isolate->GetCurrentContext();
            WICHelper* WICObj = (WICHelper*)info.This()->GetRealNamedProperty(context, LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            IWICBitmapSource* src = (IWICBitmapSource*)IntegerFI(info[1].As<Object>()->GetRealNamedProperty(context, LITERAL("internalPtr")).ToLocalChecked());
            Local<Array> id = info[0].As<Array>();
            GUID shit = { IntegerFI(id->Get(context, 0).ToLocalChecked()),
                IntegerFI(id->Get(context, 1).ToLocalChecked()),
                IntegerFI(id->Get(context, 2).ToLocalChecked()),
                IntegerFI(id->Get(context, 3).ToLocalChecked()),
                IntegerFI(id->Get(context, 4).ToLocalChecked()),
                IntegerFI(id->Get(context, 5).ToLocalChecked()),
                IntegerFI(id->Get(context, 6).ToLocalChecked()),
                IntegerFI(id->Get(context, 7).ToLocalChecked()),
                IntegerFI(id->Get(context, 8).ToLocalChecked()),
                IntegerFI(id->Get(context, 9).ToLocalChecked()),
                IntegerFI(id->Get(context, 10).ToLocalChecked()) };
            IWICBitmapSource* dst;
            RetIfFailed(WICConvertBitmapSource(shit, src, &dst), "ConvertBitmapSource failed LO!");

            info.GetReturnValue().Set(DIRECT2D::getWICBitmapImpl(isolate, dst, shit));
        }));
        //moved into getWICBitmapImpl
        //wic->Set(isolate, "ResizeBitmap", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        //    Isolate* isolate = info.GetIsolate();
        //    WICHelper* WICObj = (WICHelper*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
        //    IWICBitmapScaler* pIScaler = NULL;
        //
        //    RetIfFailed(WICObj->wicFactory->CreateBitmapScaler(&pIScaler), "CreateBitmapScaler (ResizeBitmap)");
        //    RetIfFailed(pIScaler->Initialize(
        //        pIDecoderFrame,                    // Bitmap source to scale.
        //        uiWidth / 2,                         // Scale width to half of original.
        //        uiHeight / 2,                        // Scale height to half of original.
        //        WICBitmapInterpolationModeFant));   // Use Fant mode interpolation.
        //}));
        wic->Set(isolate, "CreateBitmapFromHBITMAP", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Local<Context> context = isolate->GetCurrentContext();
            WICHelper* WICObj = (WICHelper*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            IWICBitmap* wicBitmap;

            RetIfFailed(WICObj->wicFactory->CreateBitmapFromHBITMAP((HBITMAP)IntegerFI(info[0]), (HPALETTE)IntegerFI(info[1]), (WICBitmapAlphaChannelOption)IntegerFI(info[2]), &wicBitmap), "wicFactory->CreateBitmapFromHBITMAP failed");
            Local<Array> id = info[3].As<Array>();
            GUID shit = { IntegerFI(id->Get(context, 0).ToLocalChecked()),
                IntegerFI(id->Get(context, 1).ToLocalChecked()),
                IntegerFI(id->Get(context, 2).ToLocalChecked()),
                IntegerFI(id->Get(context, 3).ToLocalChecked()),
                IntegerFI(id->Get(context, 4).ToLocalChecked()),
                IntegerFI(id->Get(context, 5).ToLocalChecked()),
                IntegerFI(id->Get(context, 6).ToLocalChecked()),
                IntegerFI(id->Get(context, 7).ToLocalChecked()),
                IntegerFI(id->Get(context, 8).ToLocalChecked()),
                IntegerFI(id->Get(context, 9).ToLocalChecked()),
                IntegerFI(id->Get(context, 10).ToLocalChecked()) };

            info.GetReturnValue().Set(DIRECT2D::getWICBitmapImpl(isolate, wicBitmap, shit));
        }));

        wic->Set(isolate, "CreateBitmapFromHICON", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Local<Context> context = isolate->GetCurrentContext();
            WICHelper* WICObj = (WICHelper*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            IWICBitmap* wicBitmap;

            RetIfFailed(WICObj->wicFactory->CreateBitmapFromHICON((HICON)IntegerFI(info[0]), &wicBitmap), "wicFactory->CreateBitmapFromHICON failed");
            Local<Array> id = info[1].As<Array>();
            GUID shit = { IntegerFI(id->Get(context, 0).ToLocalChecked()),
                IntegerFI(id->Get(context, 1).ToLocalChecked()),
                IntegerFI(id->Get(context, 2).ToLocalChecked()),
                IntegerFI(id->Get(context, 3).ToLocalChecked()),
                IntegerFI(id->Get(context, 4).ToLocalChecked()),
                IntegerFI(id->Get(context, 5).ToLocalChecked()),
                IntegerFI(id->Get(context, 6).ToLocalChecked()),
                IntegerFI(id->Get(context, 7).ToLocalChecked()),
                IntegerFI(id->Get(context, 8).ToLocalChecked()),
                IntegerFI(id->Get(context, 9).ToLocalChecked()),
                IntegerFI(id->Get(context, 10).ToLocalChecked()) };

            info.GetReturnValue().Set(DIRECT2D::getWICBitmapImpl(isolate, wicBitmap, shit));
        }));
        wic->Set(isolate, "Release", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            WICHelper* WICObj = (WICHelper*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            delete WICObj; //destructor releases wicFactory (in theory)
        }));
        info.GetReturnValue().Set(wic->NewInstance(context).ToLocalChecked());
    }
}

V8FUNC(ScopeGUIDs) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    Local<Context> context = isolate->GetCurrentContext();
    Local<Object> global = info[0].As<Object>(); //uhh idk about this one
    //global->Set(context, LITERAL("was"), LITERAL("GYTAT"));
    #define setGlobalGUID(id) { Local<Value> elem##id[] = {Number::New(isolate, id.Data1), Number::New(isolate, id.Data2), Number::New(isolate, id.Data3), Number::New(isolate, id.Data4[0]), Number::New(isolate, id.Data4[1]), Number::New(isolate, id.Data4[2]), Number::New(isolate, id.Data4[3]), Number::New(isolate, id.Data4[4]), Number::New(isolate, id.Data4[5]), Number::New(isolate, id.Data4[6]), Number::New(isolate, id.Data4[7])}; Local<Array> jsArr##id = Array::New(isolate, elem##id, 11); global->Set(context, LITERAL(#id), jsArr##id); }
    setGlobalGUID(GUID_WICPixelFormatDontCare); //i had a little regex help on this hoe /GUID_\w+/g regexr.com/80jco
    setGlobalGUID(GUID_WICPixelFormat1bppIndexed);
    setGlobalGUID(GUID_WICPixelFormat2bppIndexed);
    setGlobalGUID(GUID_WICPixelFormat4bppIndexed);
    setGlobalGUID(GUID_WICPixelFormat8bppIndexed);
    setGlobalGUID(GUID_WICPixelFormatBlackWhite);
    setGlobalGUID(GUID_WICPixelFormat2bppGray);
    setGlobalGUID(GUID_WICPixelFormat4bppGray);
    setGlobalGUID(GUID_WICPixelFormat8bppGray);
    setGlobalGUID(GUID_WICPixelFormat8bppAlpha);
    setGlobalGUID(GUID_WICPixelFormat16bppBGR555);
    setGlobalGUID(GUID_WICPixelFormat16bppBGR565);
    setGlobalGUID(GUID_WICPixelFormat16bppBGRA5551);
    setGlobalGUID(GUID_WICPixelFormat16bppGray);
    setGlobalGUID(GUID_WICPixelFormat24bppBGR);
    setGlobalGUID(GUID_WICPixelFormat24bppRGB);
    setGlobalGUID(GUID_WICPixelFormat32bppBGR);
    setGlobalGUID(GUID_WICPixelFormat32bppBGRA);
    setGlobalGUID(GUID_WICPixelFormat32bppPBGRA);
    setGlobalGUID(GUID_WICPixelFormat32bppGrayFloat);
    setGlobalGUID(GUID_WICPixelFormat32bppRGB);
    setGlobalGUID(GUID_WICPixelFormat32bppRGBA);
    setGlobalGUID(GUID_WICPixelFormat32bppPRGBA);
    setGlobalGUID(GUID_WICPixelFormat48bppRGB);
    setGlobalGUID(GUID_WICPixelFormat48bppBGR);
    setGlobalGUID(GUID_WICPixelFormat64bppRGB);
    setGlobalGUID(GUID_WICPixelFormat64bppRGBA);
    setGlobalGUID(GUID_WICPixelFormat64bppBGRA);
    setGlobalGUID(GUID_WICPixelFormat64bppPRGBA);
    setGlobalGUID(GUID_WICPixelFormat64bppPBGRA);
    setGlobalGUID(GUID_WICPixelFormat16bppGrayFixedPoint);
    setGlobalGUID(GUID_WICPixelFormat32bppBGR101010);
    setGlobalGUID(GUID_WICPixelFormat48bppRGBFixedPoint);
    setGlobalGUID(GUID_WICPixelFormat48bppBGRFixedPoint);
    setGlobalGUID(GUID_WICPixelFormat96bppRGBFixedPoint);
    setGlobalGUID(GUID_WICPixelFormat96bppRGBFloat);
    setGlobalGUID(GUID_WICPixelFormat128bppRGBAFloat);
    setGlobalGUID(GUID_WICPixelFormat128bppPRGBAFloat);
    setGlobalGUID(GUID_WICPixelFormat128bppRGBFloat);
    setGlobalGUID(GUID_WICPixelFormat32bppCMYK);
    setGlobalGUID(GUID_WICPixelFormat64bppRGBAFixedPoint);
    setGlobalGUID(GUID_WICPixelFormat64bppBGRAFixedPoint);
    setGlobalGUID(GUID_WICPixelFormat64bppRGBFixedPoint);
    setGlobalGUID(GUID_WICPixelFormat128bppRGBAFixedPoint);
    setGlobalGUID(GUID_WICPixelFormat128bppRGBFixedPoint);
    setGlobalGUID(GUID_WICPixelFormat64bppRGBAHalf);
    setGlobalGUID(GUID_WICPixelFormat64bppPRGBAHalf);
    setGlobalGUID(GUID_WICPixelFormat64bppRGBHalf);
    setGlobalGUID(GUID_WICPixelFormat48bppRGBHalf);
    setGlobalGUID(GUID_WICPixelFormat32bppRGBE);
    setGlobalGUID(GUID_WICPixelFormat16bppGrayHalf);
    setGlobalGUID(GUID_WICPixelFormat32bppGrayFixedPoint);
    setGlobalGUID(GUID_WICPixelFormat32bppRGBA1010102);
    setGlobalGUID(GUID_WICPixelFormat32bppRGBA1010102XR);
    setGlobalGUID(GUID_WICPixelFormat32bppR10G10B10A2);
    setGlobalGUID(GUID_WICPixelFormat32bppR10G10B10A2HDR10);
    setGlobalGUID(GUID_WICPixelFormat64bppCMYK);
    setGlobalGUID(GUID_WICPixelFormat24bpp3Channels);
    setGlobalGUID(GUID_WICPixelFormat32bpp4Channels);
    setGlobalGUID(GUID_WICPixelFormat40bpp5Channels);
    setGlobalGUID(GUID_WICPixelFormat48bpp6Channels);
    setGlobalGUID(GUID_WICPixelFormat56bpp7Channels);
    setGlobalGUID(GUID_WICPixelFormat64bpp8Channels);
    setGlobalGUID(GUID_WICPixelFormat48bpp3Channels);
    setGlobalGUID(GUID_WICPixelFormat64bpp4Channels);
    setGlobalGUID(GUID_WICPixelFormat80bpp5Channels);
    setGlobalGUID(GUID_WICPixelFormat96bpp6Channels);
    setGlobalGUID(GUID_WICPixelFormat112bpp7Channels);
    setGlobalGUID(GUID_WICPixelFormat128bpp8Channels);
    setGlobalGUID(GUID_WICPixelFormat40bppCMYKAlpha);
    setGlobalGUID(GUID_WICPixelFormat80bppCMYKAlpha);
    setGlobalGUID(GUID_WICPixelFormat32bpp3ChannelsAlpha);
    setGlobalGUID(GUID_WICPixelFormat40bpp4ChannelsAlpha);
    setGlobalGUID(GUID_WICPixelFormat48bpp5ChannelsAlpha);
    setGlobalGUID(GUID_WICPixelFormat56bpp6ChannelsAlpha);
    setGlobalGUID(GUID_WICPixelFormat64bpp7ChannelsAlpha);
    setGlobalGUID(GUID_WICPixelFormat72bpp8ChannelsAlpha);
    setGlobalGUID(GUID_WICPixelFormat64bpp3ChannelsAlpha);
    setGlobalGUID(GUID_WICPixelFormat80bpp4ChannelsAlpha);
    setGlobalGUID(GUID_WICPixelFormat96bpp5ChannelsAlpha);
    setGlobalGUID(GUID_WICPixelFormat112bpp6ChannelsAlpha);
    setGlobalGUID(GUID_WICPixelFormat128bpp7ChannelsAlpha);
    setGlobalGUID(GUID_WICPixelFormat144bpp8ChannelsAlpha);
    setGlobalGUID(GUID_WICPixelFormat8bppY);
    setGlobalGUID(GUID_WICPixelFormat8bppCb);
    setGlobalGUID(GUID_WICPixelFormat8bppCr);
    setGlobalGUID(GUID_WICPixelFormat16bppCbCr);
    setGlobalGUID(GUID_WICPixelFormat16bppYQuantizedDctCoefficients);
    setGlobalGUID(GUID_WICPixelFormat16bppCbQuantizedDctCoefficients);
    setGlobalGUID(GUID_WICPixelFormat16bppCrQuantizedDctCoefficients);
    
    #undef setGlobalGUID
}

void SystemWrapper(const v8::FunctionCallbackInfo<v8::Value>& info) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    FILE* f = _wpopen(WStringFI(info[0]), info[1]->BooleanValue(isolate) ? WStringFI(info[1]) : L"rt"); //https://learn.microsoft.com/en-us/cpp/c-runtime-library/reference/popen-wpopen?view=msvc-170
    wchar_t buffer[1024]; //does it matter how big this is?? (prob not)
    std::wstring ws = L"";
    //int length = 0;
    while (fgetws(buffer, 1024, f)) {
        //_putws(buffer);
        ws += buffer;
        //length++;
    }

    int endOfFileVal = feof(f);
    int closeReturnVal = _pclose(f);

    if (endOfFileVal)
    {
        printf("\nProcess returned %d\n", closeReturnVal);
    }
    else
    {
        printf("Error: Failed to read the pipe to the end.\n");
    }
    print(ws.length() << " HELP!");
    //info.GetReturnValue().Set(system(*v8::String::Utf8Value(info.GetIsolate(), info[0])));
    info.GetReturnValue().Set(String::NewFromTwoByte(isolate, (const uint16_t*)ws.data(), NewStringType::kNormal, ws.length()).ToLocalChecked());
}

v8::Local<v8::Context> InitGlobals(v8::Isolate* isolate, const char* filename) {
    using namespace v8;

    Local<ObjectTemplate> global = ObjectTemplate::New(isolate);
    // Bind the global 'print' function to the C++ Print callback.
    
    //Local<ObjectTemplate> console = ObjectTemplate::New(isolate);
    //console->Set(isolate, "log", FunctionTemplate::New(isolate, Print));
    //
    //global->Set(isolate, "console", console);

    global->Set(isolate, "print", FunctionTemplate::New(isolate, Print));
    // Bind the global 'read' function to the C++ Read callback.
    // Bind the 'version' function
    global->Set(isolate, "version", FunctionTemplate::New(isolate, Version));

    global->Set(isolate, "require", FunctionTemplate::New(isolate, Require));

    global->Set(isolate, "nigg", String::NewFromUtf8(isolate, "er").ToLocalChecked());

    global->Set(isolate, "system", FunctionTemplate::New(isolate, SystemWrapper)); //yeah idk why i wanted that to be something different even in JBS2 it was cmd instead of JUST system

    global->Set(isolate, "setBackground", FunctionTemplate::New(isolate, setBackground));

    global->Set(isolate, "hInstance", Number::New(isolate, (LONG_PTR)hInstance));

    Local<ObjectTemplate> file = ObjectTemplate::New(isolate);
    file->Set(isolate, "name", String::NewFromUtf8(isolate, filename).ToLocalChecked());

    global->Set(isolate, "file", file);

    {
        std::string tempStr(filename);
        std::string strFileName = tempStr.substr(0, tempStr.find_last_of('\\'));
        //print(tempStr << " " << strFileName);
        if (strFileName[0] == '"') {
            strFileName = strFileName.substr(1, strFileName.find('"', 1) - 1); //sounds right
            print("STRFILENAME::" << strFileName);
        }
        global->Set(isolate, "__dirname", String::NewFromUtf8(isolate, strFileName.c_str()).ToLocalChecked());
        
        global->Set(isolate, "args", String::NewFromUtf8(isolate, filename).ToLocalChecked());
        //tempStr
    }

    global->Set(isolate, "screenWidth", Number::New(isolate, screenWidth));
    global->Set(isolate, "screenHeight", Number::New(isolate, screenHeight));
    
    global->Set(isolate, "Msgbox", FunctionTemplate::New(isolate, Msgbox));
    global->Set(isolate, "Inputbox", FunctionTemplate::New(isolate, Inputbox));

    //https://stackoverflow.com/questions/4201399/prompting-a-user-with-an-input-box-c


#define setGlobal(name) global->Set(isolate, #name, FunctionTemplate::New(isolate, name)) //https://stackoverflow.com/questions/10507264/how-to-use-macro-argument-as-string-literal
#define setGlobalWrapper(name) global->Set(isolate, #name, FunctionTemplate::New(isolate, name####Wrapper)) //https://stackoverflow.com/questions/30113944/how-to-write-a-macro-that-will-append-text-to-a-partial-function-name-to-create

    global->Set(isolate, "BeginPaint", FunctionTemplate::New(isolate, BeginPaintWrapper));
    global->Set(isolate, "EndPaint", FunctionTemplate::New(isolate, EndPaintWrapper));

    global->Set(isolate, "GetDC", FunctionTemplate::New(isolate, GetDCWrapper));
    global->Set(isolate, "GetDCEx", FunctionTemplate::New(isolate, GetDCExWrapper));
    global->Set(isolate, "CreateRectRgn", FunctionTemplate::New(isolate, CreateRectRgnWrapper));
    global->Set(isolate, "ReleaseDC", FunctionTemplate::New(isolate, ReleaseDCWrapper));

    global->Set(isolate, "TextOut", FunctionTemplate::New(isolate, TextOutWrapper));

    global->Set(isolate, "BitBlt", FunctionTemplate::New(isolate, BitBltWrapper));
    global->Set(isolate, "StretchBlt", FunctionTemplate::New(isolate, StretchBltWrapper));
    setGlobalWrapper(StretchDIBits);
    setGlobalWrapper(GetDIBits);
    setGlobalWrapper(PatBlt);
    setGlobalWrapper(MaskBlt);
    setGlobalWrapper(PlgBlt);
    setGlobal(RotateImage);
    setGlobalWrapper(SetTimer);
    setGlobalWrapper(KillTimer);

    setGlobalWrapper(MAKEROP4);
    setGlobalWrapper(CreatePatternBrush);
    setGlobalWrapper(CreateHatchBrush);
    setGlobal(GetObjectHBITMAP);
    setGlobal(GetObjectDIBITMAP);
    setGlobal(GetObjectHPALETTE);
    setGlobal(GetObjectExtHPEN);
    setGlobal(GetObjectHPEN);
    setGlobal(GetObjectHBRUSH);
    setGlobal(GetObjectHFONT);
    global->Set(isolate, "GetObjectHICON", FunctionTemplate::New(isolate, GetIconInfoWrapper)); setGlobalWrapper(GetIconInfo); setGlobalWrapper(CreateIconIndirect);
    setGlobal(CreateDIBitmapSimple);
    setGlobalWrapper(CreateBitmapIndirect); //accidently had this written twice and v8 spit out some complete GARBAGE of an error (VERY LUCKILY i caught it after just a minute of thinking)
    setGlobalWrapper(CreatePenIndirect);
    setGlobalWrapper(CreateBrushIndirect);
    setGlobalWrapper(CreateDIBSection);
    setGlobalWrapper(CreateFontIndirect); //bruh i forgot this line and V8 didn't say SHIT   it just started gaining a ton memory and stopped running (ok wait i don't think i was error checking correctly)
    //next update (tomorrow) im adding all indirect funcs
    
    setGlobalWrapper(PlaySound);
    setGlobal(PlaySoundSpecial);
    setGlobal(StopSoundSpecial);
    setGlobalWrapper(InitiateSystemShutdown);
    setGlobalWrapper(AbortSystemShutdown);

    //setGlobalWrapper(DllCall);

    //https://stackoverflow.com/questions/6707148/foreach-macro-on-macros-arguments
#define setGlobalConst(g) global->Set(isolate, #g, Number::New(isolate, g))
    setGlobal(DllLoad);

#define RETURN_STRING 0
#define RETURN_NUMBER 1
#define VAR_INT 0
//#define VAR_FLOAT 1
#define VAR_BOOLEAN VAR_INT
#define VAR_CSTRING 2
#define VAR_WSTRING 3
    setGlobalConst(RETURN_STRING);
    setGlobalConst(RETURN_NUMBER);
    setGlobalConst(VAR_INT);
//    setGlobalConst(VAR_FLOAT);
    setGlobalConst(VAR_BOOLEAN);
    setGlobalConst(VAR_CSTRING);
    setGlobalConst(VAR_WSTRING);

//#define setGlobalGUID(id) { Local<Value> elem##id[] = {Number::New(isolate, id.Data1), Number::New(isolate, id.Data2), Number::New(isolate, id.Data3), Number::New(isolate, id.Data4[0]), Number::New(isolate, id.Data4[1]), Number::New(isolate, id.Data4[2]), Number::New(isolate, id.Data4[3]), Number::New(isolate, id.Data4[4]), Number::New(isolate, id.Data4[5]), Number::New(isolate, id.Data4[6]), Number::New(isolate, id.Data4[7])}; Local<Array> jsArr##id = Array::New(isolate, elem##id, 11); global->Set(isolate, #id, jsArr##id); }
    //setGlobalGUID(GUID_WICPixelFormat32bppPBGRA);
    setGlobal(ScopeGUIDs);
    setGlobal(InitializeWIC);

    setGlobalConst(WICBitmapTransformRotate0);
    setGlobalConst(WICBitmapTransformRotate90);
    setGlobalConst(WICBitmapTransformRotate180);
    setGlobalConst(WICBitmapTransformRotate270);
    setGlobalConst(WICBitmapTransformFlipHorizontal);
    setGlobalConst(WICBitmapTransformFlipVertical);
    setGlobalConst(WICBITMAPTRANSFORMOPTIONS_FORCE_DWORD);

    setGlobalConst(WICBitmapInterpolationModeNearestNeighbor);
    setGlobalConst(WICBitmapInterpolationModeLinear);
    setGlobalConst(WICBitmapInterpolationModeCubic);
    setGlobalConst(WICBitmapInterpolationModeFant);
    setGlobalConst(WICBitmapInterpolationModeHighQualityCubic);
    setGlobalConst(WICBITMAPINTERPOLATIONMODE_FORCE_DWORD);

    setGlobalConst(WICBitmapUseAlpha);
    setGlobalConst(WICBitmapUsePremultipliedAlpha);
    setGlobalConst(WICBitmapIgnoreAlpha);
    setGlobalConst(WICBITMAPALPHACHANNELOPTIONS_FORCE_DWORD);

    Local<ObjectTemplate> matrixhelper = ObjectTemplate::New(isolate);
    matrixhelper->Set(isolate, "Identity", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        Isolate* isolate = info.GetIsolate();
        info.GetReturnValue().Set(DIRECT2D::getMatrixFImpl(isolate, D2D1::Matrix3x2F::Identity()));
        }));
    matrixhelper->Set(isolate, "IsIdentity", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        Isolate* isolate = info.GetIsolate();
        D2D1::Matrix3x2F matrix = DIRECT2D::fromJSMatrix3x2(isolate, info[0].As<Object>());
        info.GetReturnValue().Set(matrix.IsIdentity());
        }));
    matrixhelper->Set(isolate, "IsInvertible", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        Isolate* isolate = info.GetIsolate();
        D2D1::Matrix3x2F matrix = DIRECT2D::fromJSMatrix3x2(isolate, info[0].As<Object>());
        info.GetReturnValue().Set(matrix.IsInvertible());
        }));
    matrixhelper->Set(isolate, "Determinant", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        Isolate* isolate = info.GetIsolate();
        D2D1::Matrix3x2F matrix = DIRECT2D::fromJSMatrix3x2(isolate, info[0].As<Object>());
        info.GetReturnValue().Set(matrix.Determinant());
        }));
    matrixhelper->Set(isolate, "Scale", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        Isolate* isolate = info.GetIsolate();
        info.GetReturnValue().Set(DIRECT2D::getMatrixFImpl(isolate, D2D1::Matrix3x2F::Scale(FloatFI(info[0]), FloatFI(info[1]), D2D1::Point2F(FloatFI(info[2]), FloatFI(info[3])))));
        }));
    matrixhelper->Set(isolate, "Skew", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        Isolate* isolate = info.GetIsolate();
        info.GetReturnValue().Set(DIRECT2D::getMatrixFImpl(isolate, D2D1::Matrix3x2F::Skew(FloatFI(info[0]), FloatFI(info[1]), D2D1::Point2F(FloatFI(info[2]), FloatFI(info[3])))));
        }));
    matrixhelper->Set(isolate, "Invert", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        Isolate* isolate = info.GetIsolate();
        D2D1::Matrix3x2F matrix = DIRECT2D::fromJSMatrix3x2(isolate, info[0].As<Object>());
        info.GetReturnValue().Set(matrix.Invert());
        DIRECT2D::setJSMatrixF(isolate, matrix, info[0].As<Object>()); //ok this seems kinda weird but not THAT weird
        }));
    matrixhelper->Set(isolate, "Rotation", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        Isolate* isolate = info.GetIsolate();
        info.GetReturnValue().Set(DIRECT2D::getMatrixFImpl(isolate, D2D1::Matrix3x2F::Rotation(FloatFI(info[0]), D2D1::Point2F(FloatFI(info[1]), FloatFI(info[2])))));
        }));
    matrixhelper->Set(isolate, "Translation", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        Isolate* isolate = info.GetIsolate();
        info.GetReturnValue().Set(DIRECT2D::getMatrixFImpl(isolate, D2D1::Matrix3x2F::Translation(FloatFI(info[0]), FloatFI(info[1]))));
        }));
    matrixhelper->Set(isolate, "SetProduct", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        Isolate* isolate = info.GetIsolate();

        D2D1::Matrix3x2F matrix = DIRECT2D::fromJSMatrix3x2(isolate, info[0].As<Object>());//D2D1::Matrix3x2F();
        D2D1::Matrix3x2F matrix2 = DIRECT2D::fromJSMatrix3x2(isolate, info[1].As<Object>());//D2D1::Matrix3x2F();
        info.GetReturnValue().Set(DIRECT2D::getMatrixFImpl(isolate, matrix * matrix2));
        //matrix.SetProduct(*(D2D1::Matrix3x2F*)IntegerFI(info[0]), *(D2D1::Matrix3x2F*)IntegerFI(info[1]));
        //info.GetReturnValue().Set(DIRECT2D::getMatrixImpl(isolate, matrix));
        }));
    matrixhelper->Set(isolate, "FromMatrix", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        Isolate* isolate = info.GetIsolate();
        Local<Context> context = isolate->GetCurrentContext();
        Local<Object> jsMatrix = info[0].As<Object>();

        D2D1::Matrix3x2F* matrix = new D2D1::Matrix3x2F(FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("_11")).ToLocalChecked()), FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("_12")).ToLocalChecked()), FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("_21")).ToLocalChecked()), FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("_22")).ToLocalChecked()), FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("_31")).ToLocalChecked()), FloatFI(jsMatrix->GetRealNamedProperty(context, LITERAL("_32")).ToLocalChecked()));
        info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)matrix));
        }));
    matrixhelper->Set(isolate, "DeleteMatrix", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        Isolate* isolate = info.GetIsolate();

        D2D1::Matrix3x2F* matrix = (D2D1::Matrix3x2F*)IntegerFI(info[0]);
        delete matrix;
        info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)matrix));
        }));

    global->Set(isolate, "Matrix3x2", matrixhelper);
    //yo wtf i don't think you can use Arrays without a context???
    //{ 
    //    Local<Value> elemid[11] = { Number::New(isolate, 1),
    //        Number::New(isolate, 2),
    //        Number::New(isolate, 3),
    //        Number::New(isolate, 40),
    //        Number::New(isolate, 41),
    //        Number::New(isolate, 42),
    //        Number::New(isolate, 43),
    //        Number::New(isolate, 44),
    //        Number::New(isolate, 45),
    //        Number::New(isolate, 46),
    //        Number::New(isolate, 47)
    //    };
    //    //Local<Array> jsArrid = Array::New(isolate, elemid, sizeof(double)*11);
    //    Local<Array> jsArrid = Array::New(isolate, elemid, 11);
    //    global->Set(isolate, "was", jsArrid);
    //}
    //Local<Array> jsArr = Array::New(isolate, elem##id, 13);

    setGlobalConst(DCX_WINDOW);
    setGlobalConst(DCX_CACHE);
    setGlobalConst(DCX_NORESETATTRS);
    setGlobalConst(DCX_CLIPCHILDREN);
    setGlobalConst(DCX_CLIPSIBLINGS);
    setGlobalConst(DCX_PARENTCLIP);
    setGlobalConst(DCX_EXCLUDERGN);
    setGlobalConst(DCX_INTERSECTRGN);
    setGlobalConst(DCX_EXCLUDEUPDATE);
    setGlobalConst(DCX_INTERSECTUPDATE);
    setGlobalConst(DCX_LOCKWINDOWUPDATE);
    setGlobalConst(DCX_VALIDATE);

    setGlobalConst(LWA_ALPHA); setGlobalConst(LWA_COLORKEY); //SetLayeredWindowAttributes
    setGlobalConst(ULW_ALPHA); setGlobalConst(ULW_COLORKEY); setGlobalConst(ULW_OPAQUE); setGlobalConst(ULW_EX_NORESIZE); setGlobalConst(AC_SRC_ALPHA); setGlobalConst(AC_SRC_OVER);//UpdateLayeredWindow
    setGlobalWrapper(SetGraphicsMode);
    setGlobalWrapper(GetGraphicsMode);
    setGlobalWrapper(GetMapMode);
    setGlobalWrapper(SetMapMode);
    setGlobalWrapper(SetWorldTransform);
    setGlobalWrapper(ModifyWorldTransform); setGlobalConst(MWT_IDENTITY); setGlobalConst(MWT_LEFTMULTIPLY); setGlobalConst(MWT_RIGHTMULTIPLY);
    setGlobalWrapper(GetWorldTransform);
    setGlobalConst(MM_ANISOTROPIC); setGlobalConst(MM_HIENGLISH); setGlobalConst(MM_HIMETRIC); setGlobalConst(MM_ISOTROPIC); setGlobalConst(MM_LOENGLISH); setGlobalConst(MM_LOMETRIC); setGlobalConst(MM_TEXT); setGlobalConst(MM_TWIPS);
    setGlobalConst(GM_COMPATIBLE); setGlobalConst(GM_ADVANCED); setGlobalConst(GM_LAST);
    setGlobalConst(PATCOPY); setGlobalConst(PATINVERT); setGlobalConst(DSTINVERT); setGlobalConst(BLACKNESS); setGlobalConst(WHITENESS);
    setGlobalConst(PATPAINT);
    setGlobalConst(MERGEPAINT);
    setGlobalConst(MERGECOPY);

    setGlobalWrapper(SetLayeredWindowAttributes);
    setGlobalWrapper(GetLayeredWindowAttributes);
    setGlobalWrapper(UpdateLayeredWindow);

    setGlobalWrapper(DwmExtendFrameIntoClientArea);
    setGlobalWrapper(DwmDefWindowProc);
    setGlobalWrapper(DwmEnableBlurBehindWindow);
    //setGlobalWrapper(DwmEnableComposition);
    setGlobalWrapper(DwmSetWindowAttribute);
    setGlobalWrapper(DwmGetWindowAttribute);
    setGlobalWrapper(DwmSetIconicThumbnail);
    setGlobalWrapper(DwmSetIconicLivePreviewBitmap);
    setGlobalWrapper(DwmInvalidateIconicBitmaps);
    setGlobalWrapper(SetWindowCompositionAttribute);
    setGlobalWrapper(NCCALCSIZE_PARAMS);

    setGlobalWrapper(SetWindowDisplayAffinity);
    setGlobalWrapper(GetWindowDisplayAffinity);

    setGlobalConst(WDA_NONE);
    setGlobalConst(WDA_MONITOR);
    setGlobalConst(WDA_EXCLUDEFROMCAPTURE);

    setGlobalConst(ACCENT_DISABLED);
    setGlobalConst(ACCENT_ENABLE_GRADIENT);
    setGlobalConst(ACCENT_ENABLE_TRANSPARENTGRADIENT);
    setGlobalConst(ACCENT_ENABLE_BLURBEHIND);
    setGlobalConst(ACCENT_INVALID_STATE);

    setGlobalConst(WM_CLIPBOARDUPDATE);
    setGlobalConst(WM_DWMCOMPOSITIONCHANGED);
    setGlobalConst(WM_DWMNCRENDERINGCHANGED);
    setGlobalConst(WM_DWMCOLORIZATIONCOLORCHANGED);
    setGlobalConst(WM_DWMWINDOWMAXIMIZEDCHANGE);
    setGlobalConst(WM_DWMSENDICONICTHUMBNAIL);
    setGlobalConst(WM_DWMSENDICONICLIVEPREVIEWBITMAP);
    setGlobalConst(WM_GETTITLEBARINFOEX);


    setGlobalConst(DWMWA_NCRENDERING_ENABLED);
    setGlobalConst(DWMWA_NCRENDERING_POLICY);
    setGlobalConst(DWMWA_TRANSITIONS_FORCEDISABLED);
    setGlobalConst(DWMWA_ALLOW_NCPAINT);
    setGlobalConst(DWMWA_CAPTION_BUTTON_BOUNDS);
    setGlobalConst(DWMWA_NONCLIENT_RTL_LAYOUT);
    setGlobalConst(DWMWA_FORCE_ICONIC_REPRESENTATION);
    setGlobalConst(DWMWA_FLIP3D_POLICY);
    setGlobalConst(DWMWA_EXTENDED_FRAME_BOUNDS);
    setGlobalConst(DWMWA_HAS_ICONIC_BITMAP);
    setGlobalConst(DWMWA_DISALLOW_PEEK);
    setGlobalConst(DWMWA_EXCLUDED_FROM_PEEK);
    setGlobalConst(DWMWA_CLOAK);
    setGlobalConst(DWMWA_CLOAKED);
    setGlobalConst(DWMWA_FREEZE_REPRESENTATION);
    setGlobalConst(DWMWA_PASSIVE_UPDATE_MODE);
    setGlobalConst(DWMWA_USE_HOSTBACKDROPBRUSH);
    setGlobalConst(DWMWA_USE_IMMERSIVE_DARK_MODE );
    setGlobalConst(DWMWA_WINDOW_CORNER_PREFERENCE );
    setGlobalConst(DWMWA_BORDER_COLOR);
    setGlobalConst(DWMWA_CAPTION_COLOR);
    setGlobalConst(DWMWA_TEXT_COLOR);
    setGlobalConst(DWMWA_VISIBLE_FRAME_BORDER_THICKNESS);
    setGlobalConst(DWMWA_SYSTEMBACKDROP_TYPE);
    //setGlobalConst(DWMWA_LAST);

    setGlobalConst(DWMFLIP3D_DEFAULT);
    setGlobalConst(DWMFLIP3D_EXCLUDEBELOW);
    setGlobalConst(DWMFLIP3D_EXCLUDEABOVE);
    //setGlobalConst(DWMFLIP3D_LAST);

    setGlobalConst(DWMWCP_DEFAULT);
    setGlobalConst(DWMWCP_DONOTROUND);
    setGlobalConst(DWMWCP_ROUND);
    setGlobalConst(DWMWCP_ROUNDSMALL);

    setGlobalConst(DWMWA_COLOR_NONE);
    setGlobalConst(DWMWA_COLOR_DEFAULT);

    setGlobalConst(DWMNCRP_USEWINDOWSTYLE);
    setGlobalConst(DWMNCRP_DISABLED);
    setGlobalConst(DWMNCRP_ENABLED);
    //setGlobalConst(DWMNCRP_LAST);

    setGlobalConst(DWMSBT_AUTO);
    setGlobalConst(DWMSBT_NONE);
    setGlobalConst(DWMSBT_MAINWINDOW);
    setGlobalConst(DWMSBT_TRANSIENTWINDOW);
    setGlobalConst(DWMSBT_TABBEDWINDOW);

    setGlobalWrapper(DefWindowProc);

    setGlobalWrapper(SwitchToThisWindow);

    setGlobal(showOpenFilePicker);
    setGlobal(showSaveFilePicker);
    setGlobal(showDirectoryPicker);

    setGlobalConst(DWM_BB_BLURREGION); setGlobalConst(DWM_BB_ENABLE); setGlobalConst(DWM_BB_TRANSITIONONMAXIMIZED);

    setGlobalConst(DIB_RGB_COLORS);
    setGlobalConst(DIB_PAL_COLORS);

    setGlobalWrapper(AnimateWindow); setGlobalConst(AW_ACTIVATE); setGlobalConst(AW_BLEND); setGlobalConst(AW_CENTER); setGlobalConst(AW_HIDE); setGlobalConst(AW_HOR_POSITIVE); setGlobalConst(AW_HOR_NEGATIVE); setGlobalConst(AW_SLIDE); setGlobalConst(AW_VER_POSITIVE); setGlobalConst(AW_VER_NEGATIVE);
    setGlobalConst(BI_RGB);
    setGlobalConst(BI_RLE8);
    setGlobalConst(BI_RLE4);
    setGlobalConst(BI_BITFIELDS);
    setGlobalConst(BI_JPEG);
    setGlobalConst(BI_PNG);

    setGlobalConst(SND_APPLICATION); setGlobalConst(SND_ALIAS); setGlobalConst(SND_ALIAS_ID); setGlobalConst(SND_ASYNC); setGlobalConst(SND_FILENAME); setGlobalConst(SND_LOOP); setGlobalConst(SND_MEMORY); setGlobalConst(SND_NODEFAULT); setGlobalConst(SND_NOSTOP); setGlobalConst(SND_NOWAIT); setGlobalConst(SND_PURGE); setGlobalConst(SND_RESOURCE); setGlobalConst(SND_SENTRY); setGlobalConst(SND_SYNC); setGlobalConst(SND_SYSTEM);
    setGlobalConst(MM_MCINOTIFY);
    
    global->Set(isolate, "CreateWindow", FunctionTemplate::New(isolate, CreateWindowWrapper));
    global->Set(isolate, "CreateWindowClass", FunctionTemplate::New(isolate, CreateWindowClass));
    setGlobalConst(WS_EX_ACCEPTFILES); setGlobalConst(WS_EX_APPWINDOW); setGlobalConst(WS_EX_CLIENTEDGE); setGlobalConst(WS_EX_COMPOSITED); setGlobalConst(WS_EX_CONTEXTHELP); setGlobalConst(WS_EX_CONTROLPARENT); setGlobalConst(WS_EX_DLGMODALFRAME); setGlobalConst(WS_EX_LAYERED); setGlobalConst(WS_EX_LAYOUTRTL); setGlobalConst(WS_EX_LEFT); setGlobalConst(WS_EX_LEFTSCROLLBAR); setGlobalConst(WS_EX_LTRREADING); setGlobalConst(WS_EX_MDICHILD); setGlobalConst(WS_EX_NOACTIVATE); setGlobalConst(WS_EX_NOINHERITLAYOUT); setGlobalConst(WS_EX_NOPARENTNOTIFY); setGlobalConst(WS_EX_NOREDIRECTIONBITMAP); setGlobalConst(WS_EX_OVERLAPPEDWINDOW); setGlobalConst(WS_EX_PALETTEWINDOW); setGlobalConst(WS_EX_RIGHT); setGlobalConst(WS_EX_RIGHTSCROLLBAR); setGlobalConst(WS_EX_RTLREADING); setGlobalConst(WS_EX_STATICEDGE); setGlobalConst(WS_EX_TOOLWINDOW); setGlobalConst(WS_EX_TOPMOST); setGlobalConst(WS_EX_TRANSPARENT); setGlobalConst(WS_EX_WINDOWEDGE);
    setGlobalConst(COLOR_ACTIVEBORDER); setGlobalConst(COLOR_ACTIVECAPTION); setGlobalConst(COLOR_APPWORKSPACE); setGlobalConst(COLOR_BACKGROUND); setGlobalConst(COLOR_BTNFACE); setGlobalConst(COLOR_BTNSHADOW); setGlobalConst(COLOR_BTNTEXT); setGlobalConst(COLOR_CAPTIONTEXT); setGlobalConst(COLOR_GRAYTEXT); setGlobalConst(COLOR_HIGHLIGHT); setGlobalConst(COLOR_HIGHLIGHTTEXT); setGlobalConst(COLOR_INACTIVEBORDER); setGlobalConst(COLOR_INACTIVECAPTION); setGlobalConst(COLOR_MENU); setGlobalConst(COLOR_MENUTEXT); setGlobalConst(COLOR_SCROLLBAR); setGlobalConst(COLOR_WINDOW); setGlobalConst(COLOR_WINDOWFRAME); setGlobalConst(COLOR_WINDOWTEXT);
    setGlobalConst(WS_BORDER); setGlobalConst(WS_CAPTION); setGlobalConst(WS_CHILD); setGlobalConst(WS_CHILDWINDOW); setGlobalConst(WS_CLIPCHILDREN); setGlobalConst(WS_CLIPSIBLINGS); setGlobalConst(WS_DISABLED); setGlobalConst(WS_DLGFRAME); setGlobalConst(WS_GROUP); setGlobalConst(WS_HSCROLL); setGlobalConst(WS_ICONIC); setGlobalConst(WS_MAXIMIZE); setGlobalConst(WS_MAXIMIZEBOX); setGlobalConst(WS_MINIMIZE); setGlobalConst(WS_MINIMIZEBOX); setGlobalConst(WS_OVERLAPPED); setGlobalConst(WS_OVERLAPPEDWINDOW); setGlobalConst(WS_POPUP); setGlobalConst(WS_POPUPWINDOW); setGlobalConst(WS_SIZEBOX); setGlobalConst(WS_SYSMENU); setGlobalConst(WS_TABSTOP); setGlobalConst(WS_THICKFRAME); setGlobalConst(WS_TILED); setGlobalConst(WS_TILEDWINDOW); setGlobalConst(WS_VISIBLE); setGlobalConst(WS_VSCROLL);
    setGlobalConst(CS_BYTEALIGNCLIENT); setGlobalConst(CS_BYTEALIGNWINDOW); setGlobalConst(CS_CLASSDC); setGlobalConst(CS_DBLCLKS); setGlobalConst(CS_DROPSHADOW); setGlobalConst(CS_GLOBALCLASS); setGlobalConst(CS_HREDRAW); setGlobalConst(CS_NOCLOSE); setGlobalConst(CS_OWNDC); setGlobalConst(CS_PARENTDC); setGlobalConst(CS_SAVEBITS); setGlobalConst(CS_VREDRAW);
    setGlobalConst(BS_3STATE); setGlobalConst(BS_AUTO3STATE); setGlobalConst(BS_AUTOCHECKBOX); setGlobalConst(BS_AUTORADIOBUTTON); setGlobalConst(BS_BITMAP); setGlobalConst(BS_BOTTOM); setGlobalConst(BS_CENTER); setGlobalConst(BS_CHECKBOX); /*setGlobalConst(BS_COMMANDLINK); setGlobalConst(BS_DEFCOMMANDLINK);*/ setGlobalConst(BS_DEFPUSHBUTTON); /*setGlobalConst(BS_DEFSPLITBUTTON);*/ setGlobalConst(BS_GROUPBOX); setGlobalConst(BS_ICON); setGlobalConst(BS_FLAT); setGlobalConst(BS_LEFT); setGlobalConst(BS_LEFTTEXT); setGlobalConst(BS_MULTILINE); setGlobalConst(BS_NOTIFY); setGlobalConst(BS_OWNERDRAW); setGlobalConst(BS_PUSHBUTTON); setGlobalConst(BS_PUSHLIKE); setGlobalConst(BS_RADIOBUTTON); setGlobalConst(BS_RIGHT); setGlobalConst(BS_RIGHTBUTTON); /*setGlobalConst(BS_SPLITBUTTON);*/ setGlobalConst(BS_TEXT); setGlobalConst(BS_TOP); setGlobalConst(BS_TYPEMASK); setGlobalConst(BS_USERBUTTON); setGlobalConst(BS_VCENTER);
    /*setGlobalConst(BCN_HOTITEMCHANGE);*/ setGlobalConst(BN_CLICKED); setGlobalConst(BN_DBLCLK); setGlobalConst(BN_DOUBLECLICKED); setGlobalConst(BN_DISABLE); setGlobalConst(BN_PUSHED); setGlobalConst(BN_HILITE); setGlobalConst(BN_KILLFOCUS); setGlobalConst(BN_PAINT); setGlobalConst(BN_SETFOCUS); setGlobalConst(BN_UNPUSHED); setGlobalConst(BN_UNHILITE);

    setGlobalConst(ES_LEFT);
    setGlobalConst(ES_CENTER);
    setGlobalConst(ES_RIGHT);
    setGlobalConst(ES_MULTILINE);
    setGlobalConst(ES_UPPERCASE);
    setGlobalConst(ES_LOWERCASE);
    setGlobalConst(ES_PASSWORD);
    setGlobalConst(ES_AUTOVSCROLL);
    setGlobalConst(ES_AUTOHSCROLL);
    setGlobalConst(ES_NOHIDESEL);
    setGlobalConst(ES_OEMCONVERT);
    setGlobalConst(ES_READONLY);
    setGlobalConst(ES_WANTRETURN);
    setGlobalConst(ES_NUMBER);

    setGlobalConst(CW_USEDEFAULT);

    setGlobalWrapper(RedrawWindow);
    setGlobalWrapper(InvalidateRect);
    setGlobalWrapper(ShowWindow);
    setGlobalWrapper(UpdateWindow);
    setGlobalWrapper(EnableWindow);
    setGlobalWrapper(ClientToScreen);
    setGlobalWrapper(SetRect);
    setGlobalWrapper(SetROP2);

    setGlobalConst(SW_HIDE           );
    setGlobalConst(SW_SHOWNORMAL     );
    setGlobalConst(SW_NORMAL         );
    setGlobalConst(SW_SHOWMINIMIZED  );
    setGlobalConst(SW_SHOWMAXIMIZED  );
    setGlobalConst(SW_MAXIMIZE       );
    setGlobalConst(SW_SHOWNOACTIVATE );
    setGlobalConst(SW_SHOW           );
    setGlobalConst(SW_MINIMIZE       );
    setGlobalConst(SW_SHOWMINNOACTIVE);
    setGlobalConst(SW_SHOWNA         );
    setGlobalConst(SW_RESTORE        );
    setGlobalConst(SW_SHOWDEFAULT    );
    setGlobalConst(SW_FORCEMINIMIZE  );
    setGlobalConst(SW_MAX);
    
    setGlobalConst(R2_BLACK); setGlobalConst(R2_COPYPEN); setGlobalConst(R2_MASKNOTPEN); setGlobalConst(R2_MASKPEN); setGlobalConst(R2_MASKPENNOT); setGlobalConst(R2_MERGENOTPEN); setGlobalConst(R2_MERGEPEN); setGlobalConst(R2_MERGEPENNOT); setGlobalConst(R2_NOP); setGlobalConst(R2_NOT); setGlobalConst(R2_NOTCOPYPEN); setGlobalConst(R2_NOTMASKPEN); setGlobalConst(R2_NOTMERGEPEN); setGlobalConst(R2_NOTXORPEN); setGlobalConst(R2_WHITE); setGlobalConst(R2_XORPEN);

    setGlobalConst(RDW_ERASE);
    setGlobalConst(RDW_FRAME);
    setGlobalConst(RDW_INTERNALPAINT);
    setGlobalConst(RDW_INVALIDATE);
    setGlobalConst(RDW_NOERASE);
    setGlobalConst(RDW_NOFRAME);
    setGlobalConst(RDW_NOINTERNALPAINT);
    setGlobalConst(RDW_VALIDATE);
    setGlobalConst(RDW_ERASENOW);
    setGlobalConst(RDW_UPDATENOW);
    setGlobalConst(RDW_ALLCHILDREN);
    setGlobalConst(RDW_NOCHILDREN);

    setGlobalConst(IDOK);
    setGlobalConst(IDCANCEL);
    setGlobalConst(IDABORT);
    setGlobalConst(IDRETRY);
    setGlobalConst(IDIGNORE);
    setGlobalConst(IDYES);
    setGlobalConst(IDNO);
    setGlobalConst(IDTRYAGAIN);
    setGlobalConst(IDCONTINUE);

    setGlobalConst(MB_OK);
    setGlobalConst(MB_OKCANCEL);
    setGlobalConst(MB_ABORTRETRYIGNORE);
    setGlobalConst(MB_YESNOCANCEL);
    setGlobalConst(MB_YESNO);
    setGlobalConst(MB_RETRYCANCEL);
    setGlobalConst(MB_CANCELTRYCONTINUE);
    setGlobalConst(MB_ICONERROR);
    setGlobalConst(MB_ICONQUESTION);
    setGlobalConst(MB_ICONEXCLAMATION);
    setGlobalConst(MB_ICONINFORMATION);
    setGlobalConst(MB_DEFBUTTON1);
    setGlobalConst(MB_DEFBUTTON2);
    setGlobalConst(MB_DEFBUTTON3);
    setGlobalConst(MB_DEFBUTTON4);
    setGlobalConst(MB_APPLMODAL);
    setGlobalConst(MB_SYSTEMMODAL);
    setGlobalConst(MB_TASKMODAL);

    setGlobalConst(WM_NULL); setGlobalConst(WM_CREATE); setGlobalConst(WM_DESTROY); setGlobalConst(WM_MOVE); setGlobalConst(WM_SIZE); setGlobalConst(WM_ACTIVATE); setGlobalConst(WM_SETFOCUS); setGlobalConst(WM_KILLFOCUS); setGlobalConst(WM_ENABLE); setGlobalConst(WM_SETREDRAW); setGlobalConst(WM_SETTEXT); setGlobalConst(WM_GETTEXT); setGlobalConst(WM_GETTEXTLENGTH); setGlobalConst(WM_PAINT); setGlobalConst(WM_CLOSE); setGlobalConst(WM_QUERYENDSESSION); setGlobalConst(WM_QUIT); setGlobalConst(WM_QUERYOPEN); setGlobalConst(WM_ERASEBKGND); setGlobalConst(WM_SYSCOLORCHANGE); setGlobalConst(WM_ENDSESSION); setGlobalConst(WM_SHOWWINDOW); setGlobalConst(WM_WININICHANGE); setGlobalConst(WM_DEVMODECHANGE); setGlobalConst(WM_ACTIVATEAPP); setGlobalConst(WM_FONTCHANGE); setGlobalConst(WM_TIMECHANGE); setGlobalConst(WM_CANCELMODE); setGlobalConst(WM_SETCURSOR); setGlobalConst(WM_MOUSEACTIVATE); setGlobalConst(WM_CHILDACTIVATE); setGlobalConst(WM_QUEUESYNC); setGlobalConst(WM_GETMINMAXINFO); setGlobalConst(WM_PAINTICON); setGlobalConst(WM_ICONERASEBKGND); setGlobalConst(WM_NEXTDLGCTL); setGlobalConst(WM_SPOOLERSTATUS); setGlobalConst(WM_DRAWITEM); setGlobalConst(WM_MEASUREITEM); setGlobalConst(WM_DELETEITEM); setGlobalConst(WM_VKEYTOITEM); setGlobalConst(WM_CHARTOITEM); setGlobalConst(WM_SETFONT); setGlobalConst(WM_GETFONT); setGlobalConst(WM_SETHOTKEY); setGlobalConst(WM_GETHOTKEY); setGlobalConst(WM_QUERYDRAGICON); setGlobalConst(WM_COMPAREITEM); setGlobalConst(WM_GETOBJECT); setGlobalConst(WM_COMPACTING); setGlobalConst(WM_COMMNOTIFY); setGlobalConst(WM_WINDOWPOSCHANGING); setGlobalConst(WM_WINDOWPOSCHANGED); setGlobalConst(WM_POWER); setGlobalConst(WM_COPYDATA); setGlobalConst(WM_CANCELJOURNAL); setGlobalConst(WM_NOTIFY); setGlobalConst(WM_INPUTLANGCHANGEREQUEST); setGlobalConst(WM_INPUTLANGCHANGE); setGlobalConst(WM_TCARD); setGlobalConst(WM_HELP); setGlobalConst(WM_USERCHANGED); setGlobalConst(WM_NOTIFYFORMAT); setGlobalConst(WM_CONTEXTMENU); setGlobalConst(WM_STYLECHANGING); setGlobalConst(WM_STYLECHANGED); setGlobalConst(WM_DISPLAYCHANGE); setGlobalConst(WM_GETICON); setGlobalConst(WM_SETICON); setGlobalConst(WM_NCCREATE); setGlobalConst(WM_NCDESTROY); setGlobalConst(WM_NCCALCSIZE); setGlobalConst(WM_NCHITTEST); setGlobalConst(WM_NCPAINT); setGlobalConst(WM_NCACTIVATE); setGlobalConst(WM_GETDLGCODE); setGlobalConst(WM_SYNCPAINT); setGlobalConst(WM_NCMOUSEMOVE); setGlobalConst(WM_NCLBUTTONDOWN); setGlobalConst(WM_NCLBUTTONUP); setGlobalConst(WM_NCLBUTTONDBLCLK); setGlobalConst(WM_NCRBUTTONDOWN); setGlobalConst(WM_NCRBUTTONUP); setGlobalConst(WM_NCRBUTTONDBLCLK); setGlobalConst(WM_NCMBUTTONDOWN); setGlobalConst(WM_NCMBUTTONUP); setGlobalConst(WM_NCMBUTTONDBLCLK); setGlobalConst(WM_NCXBUTTONDOWN); setGlobalConst(WM_NCXBUTTONUP); setGlobalConst(WM_NCXBUTTONDBLCLK); setGlobalConst(WM_INPUT); setGlobalConst(WM_KEYDOWN); setGlobalConst(WM_KEYFIRST); setGlobalConst(WM_KEYUP); setGlobalConst(WM_CHAR); setGlobalConst(WM_DEADCHAR); setGlobalConst(WM_SYSKEYDOWN); setGlobalConst(WM_SYSKEYUP); setGlobalConst(WM_SYSCHAR); setGlobalConst(WM_SYSDEADCHAR); setGlobalConst(WM_UNICHAR / WM_KEYLAST); setGlobalConst(WM_IME_STARTCOMPOSITION); setGlobalConst(WM_IME_ENDCOMPOSITION); setGlobalConst(WM_IME_COMPOSITION); setGlobalConst(WM_IME_KEYLAST); setGlobalConst(WM_INITDIALOG); setGlobalConst(WM_COMMAND); setGlobalConst(WM_SYSCOMMAND); setGlobalConst(WM_TIMER); setGlobalConst(WM_HSCROLL); setGlobalConst(WM_VSCROLL); setGlobalConst(WM_INITMENU); setGlobalConst(WM_INITMENUPOPUP); setGlobalConst(WM_MENUSELECT); setGlobalConst(WM_MENUCHAR); setGlobalConst(WM_ENTERIDLE); setGlobalConst(WM_MENURBUTTONUP); setGlobalConst(WM_MENUDRAG); setGlobalConst(WM_MENUGETOBJECT); setGlobalConst(WM_UNINITMENUPOPUP); setGlobalConst(WM_MENUCOMMAND); setGlobalConst(WM_CHANGEUISTATE); setGlobalConst(WM_UPDATEUISTATE); setGlobalConst(WM_QUERYUISTATE); setGlobalConst(WM_CTLCOLORMSGBOX); setGlobalConst(WM_CTLCOLOREDIT); setGlobalConst(WM_CTLCOLORLISTBOX); setGlobalConst(WM_CTLCOLORBTN); setGlobalConst(WM_CTLCOLORDLG); setGlobalConst(WM_CTLCOLORSCROLLBAR); setGlobalConst(WM_CTLCOLORSTATIC); setGlobalConst(WM_MOUSEFIRST); setGlobalConst(WM_MOUSEMOVE); setGlobalConst(WM_LBUTTONDOWN); setGlobalConst(WM_LBUTTONUP); setGlobalConst(WM_LBUTTONDBLCLK); setGlobalConst(WM_RBUTTONDOWN); setGlobalConst(WM_RBUTTONUP); setGlobalConst(WM_RBUTTONDBLCLK); setGlobalConst(WM_MBUTTONDOWN); setGlobalConst(WM_MBUTTONUP); setGlobalConst(WM_MBUTTONDBLCLK); setGlobalConst(WM_MOUSELAST); setGlobalConst(WM_MOUSEWHEEL); setGlobalConst(WM_XBUTTONDOWN); setGlobalConst(WM_XBUTTONUP); setGlobalConst(WM_XBUTTONDBLCLK); setGlobalConst(WM_MOUSEHWHEEL); setGlobalConst(WM_PARENTNOTIFY); setGlobalConst(WM_ENTERMENULOOP); setGlobalConst(WM_EXITMENULOOP); setGlobalConst(WM_NEXTMENU); setGlobalConst(WM_SIZING); setGlobalConst(WM_CAPTURECHANGED); setGlobalConst(WM_MOVING); setGlobalConst(WM_POWERBROADCAST); setGlobalConst(WM_DEVICECHANGE); setGlobalConst(WM_MDICREATE); setGlobalConst(WM_MDIDESTROY); setGlobalConst(WM_MDIACTIVATE); setGlobalConst(WM_MDIRESTORE); setGlobalConst(WM_MDINEXT); setGlobalConst(WM_MDIMAXIMIZE); setGlobalConst(WM_MDITILE); setGlobalConst(WM_MDICASCADE); setGlobalConst(WM_MDIICONARRANGE); setGlobalConst(WM_MDIGETACTIVE); setGlobalConst(WM_MDISETMENU); setGlobalConst(WM_ENTERSIZEMOVE); setGlobalConst(WM_EXITSIZEMOVE); setGlobalConst(WM_DROPFILES); setGlobalConst(WM_MDIREFRESHMENU); setGlobalConst(WM_IME_SETCONTEXT); setGlobalConst(WM_IME_NOTIFY); setGlobalConst(WM_IME_CONTROL); setGlobalConst(WM_IME_COMPOSITIONFULL); setGlobalConst(WM_IME_SELECT); setGlobalConst(WM_IME_CHAR); setGlobalConst(WM_IME_REQUEST); setGlobalConst(WM_IME_KEYDOWN); setGlobalConst(WM_IME_KEYUP); setGlobalConst(WM_NCMOUSEHOVER); setGlobalConst(WM_MOUSEHOVER); setGlobalConst(WM_NCMOUSELEAVE); setGlobalConst(WM_MOUSELEAVE); setGlobalConst(WM_CUT); setGlobalConst(WM_COPY); setGlobalConst(WM_PASTE); setGlobalConst(WM_CLEAR); setGlobalConst(WM_UNDO); setGlobalConst(WM_RENDERFORMAT); setGlobalConst(WM_RENDERALLFORMATS); setGlobalConst(WM_DESTROYCLIPBOARD); setGlobalConst(WM_DRAWCLIPBOARD); setGlobalConst(WM_PAINTCLIPBOARD); setGlobalConst(WM_VSCROLLCLIPBOARD); setGlobalConst(WM_SIZECLIPBOARD); setGlobalConst(WM_ASKCBFORMATNAME); setGlobalConst(WM_CHANGECBCHAIN); setGlobalConst(WM_HSCROLLCLIPBOARD); setGlobalConst(WM_QUERYNEWPALETTE); setGlobalConst(WM_PALETTEISCHANGING); setGlobalConst(WM_PALETTECHANGED); setGlobalConst(WM_HOTKEY); setGlobalConst(WM_PRINT); setGlobalConst(WM_PRINTCLIENT); setGlobalConst(WM_APPCOMMAND); setGlobalConst(WM_HANDHELDFIRST); setGlobalConst(WM_HANDHELDLAST); setGlobalConst(WM_AFXFIRST); setGlobalConst(WM_AFXLAST); setGlobalConst(WM_PENWINFIRST); setGlobalConst(WM_PENWINLAST); setGlobalConst(WM_PSD_PAGESETUPDLG); setGlobalConst(WM_USER); setGlobalConst(WM_CHOOSEFONT_GETLOGFONT); setGlobalConst(WM_PSD_FULLPAGERECT); setGlobalConst(WM_PSD_MINMARGINRECT); setGlobalConst(WM_PSD_MARGINRECT); setGlobalConst(WM_PSD_GREEKTEXTRECT); setGlobalConst(WM_PSD_ENVSTAMPRECT); setGlobalConst(WM_PSD_YAFULLPAGERECT); setGlobalConst(WM_CHOOSEFONT_SETLOGFONT); setGlobalConst(WM_CHOOSEFONT_SETFLAGS);

    setGlobalConst(SRCAND);
    setGlobalConst(SRCCOPY);
    setGlobalConst(SRCERASE);
    setGlobalConst(SRCINVERT);
    setGlobalConst(SRCPAINT);
    setGlobalConst(NOTSRCCOPY);
    setGlobalConst(NOTSRCERASE);

    setGlobalConst(VK_LBUTTON); setGlobalConst(VK_RBUTTON); setGlobalConst(VK_CANCEL); setGlobalConst(VK_MBUTTON); setGlobalConst(VK_XBUTTON1); setGlobalConst(VK_XBUTTON2); setGlobalConst(VK_BACK); setGlobalConst(VK_TAB); setGlobalConst(VK_CLEAR); setGlobalConst(VK_RETURN); setGlobalConst(VK_SHIFT); setGlobalConst(VK_CONTROL); setGlobalConst(VK_MENU); setGlobalConst(VK_PAUSE); setGlobalConst(VK_CAPITAL); setGlobalConst(VK_KANA); setGlobalConst(VK_HANGUL); setGlobalConst(VK_IME_ON); setGlobalConst(VK_JUNJA); setGlobalConst(VK_FINAL); setGlobalConst(VK_HANJA); setGlobalConst(VK_KANJI); setGlobalConst(VK_IME_OFF); setGlobalConst(VK_ESCAPE); setGlobalConst(VK_CONVERT); setGlobalConst(VK_NONCONVERT); setGlobalConst(VK_ACCEPT); setGlobalConst(VK_MODECHANGE); setGlobalConst(VK_SPACE); setGlobalConst(VK_PRIOR); setGlobalConst(VK_NEXT); setGlobalConst(VK_END); setGlobalConst(VK_HOME); setGlobalConst(VK_LEFT); setGlobalConst(VK_UP); setGlobalConst(VK_RIGHT); setGlobalConst(VK_DOWN); setGlobalConst(VK_SELECT); setGlobalConst(VK_PRINT); setGlobalConst(VK_EXECUTE); setGlobalConst(VK_SNAPSHOT); setGlobalConst(VK_INSERT); setGlobalConst(VK_DELETE); setGlobalConst(VK_HELP); setGlobalConst(VK_LWIN); setGlobalConst(VK_RWIN); setGlobalConst(VK_APPS); setGlobalConst(VK_SLEEP); setGlobalConst(VK_NUMPAD0); setGlobalConst(VK_NUMPAD1); setGlobalConst(VK_NUMPAD2); setGlobalConst(VK_NUMPAD3); setGlobalConst(VK_NUMPAD4); setGlobalConst(VK_NUMPAD5); setGlobalConst(VK_NUMPAD6); setGlobalConst(VK_NUMPAD7); setGlobalConst(VK_NUMPAD8); setGlobalConst(VK_NUMPAD9); setGlobalConst(VK_MULTIPLY); setGlobalConst(VK_ADD); setGlobalConst(VK_SEPARATOR); setGlobalConst(VK_SUBTRACT); setGlobalConst(VK_DECIMAL); setGlobalConst(VK_DIVIDE); setGlobalConst(VK_F1); setGlobalConst(VK_F2); setGlobalConst(VK_F3); setGlobalConst(VK_F4); setGlobalConst(VK_F5); setGlobalConst(VK_F6); setGlobalConst(VK_F7); setGlobalConst(VK_F8); setGlobalConst(VK_F9); setGlobalConst(VK_F10); setGlobalConst(VK_F11); setGlobalConst(VK_F12); setGlobalConst(VK_F13); setGlobalConst(VK_F14); setGlobalConst(VK_F15); setGlobalConst(VK_F16); setGlobalConst(VK_F17); setGlobalConst(VK_F18); setGlobalConst(VK_F19); setGlobalConst(VK_F20); setGlobalConst(VK_F21); setGlobalConst(VK_F22); setGlobalConst(VK_F23); setGlobalConst(VK_F24); setGlobalConst(VK_NUMLOCK); setGlobalConst(VK_SCROLL); setGlobalConst(VK_LSHIFT); setGlobalConst(VK_RSHIFT); setGlobalConst(VK_LCONTROL); setGlobalConst(VK_RCONTROL); setGlobalConst(VK_LMENU); setGlobalConst(VK_RMENU); setGlobalConst(VK_BROWSER_BACK); setGlobalConst(VK_BROWSER_FORWARD); setGlobalConst(VK_BROWSER_REFRESH); setGlobalConst(VK_BROWSER_STOP); setGlobalConst(VK_BROWSER_SEARCH); setGlobalConst(VK_BROWSER_FAVORITES); setGlobalConst(VK_BROWSER_HOME); setGlobalConst(VK_VOLUME_MUTE); setGlobalConst(VK_VOLUME_DOWN); setGlobalConst(VK_VOLUME_UP); setGlobalConst(VK_MEDIA_NEXT_TRACK); setGlobalConst(VK_MEDIA_PREV_TRACK); setGlobalConst(VK_MEDIA_STOP); setGlobalConst(VK_MEDIA_PLAY_PAUSE); setGlobalConst(VK_LAUNCH_MAIL); setGlobalConst(VK_LAUNCH_MEDIA_SELECT); setGlobalConst(VK_LAUNCH_APP1); setGlobalConst(VK_LAUNCH_APP2); setGlobalConst(VK_OEM_1); setGlobalConst(VK_OEM_PLUS); setGlobalConst(VK_OEM_COMMA); setGlobalConst(VK_OEM_MINUS); setGlobalConst(VK_OEM_PERIOD); setGlobalConst(VK_OEM_2); setGlobalConst(VK_OEM_3); setGlobalConst(VK_OEM_4); setGlobalConst(VK_OEM_5); setGlobalConst(VK_OEM_6); setGlobalConst(VK_OEM_7); setGlobalConst(VK_OEM_8); setGlobalConst(VK_OEM_102); setGlobalConst(VK_PROCESSKEY); setGlobalConst(VK_PACKET); setGlobalConst(VK_ATTN); setGlobalConst(VK_CRSEL); setGlobalConst(VK_EXSEL); setGlobalConst(VK_EREOF); setGlobalConst(VK_PLAY); setGlobalConst(VK_ZOOM); setGlobalConst(VK_NONAME); setGlobalConst(VK_PA1); setGlobalConst(VK_OEM_CLEAR);
    
    setGlobalConst(OPAQUE);
    setGlobalConst(TRANSPARENT);

    setGlobalConst(PS_SOLID);
    setGlobalConst(PS_DASH);
    setGlobalConst(PS_DOT);
    setGlobalConst(PS_DASHDOT);
    setGlobalConst(PS_DASHDOTDOT);
    setGlobalConst(PS_NULL);
    setGlobalConst(PS_INSIDEFRAME);

//#define D2D1_EXTEND_MODE_CLAMP D2D1_EXTEND_MODE_CLAMP
//#define D2D1_EXTEND_MODE_WRAP D2D1_EXTEND_MODE_WRAP
//#define D2D1_EXTEND_MODE_MIRROR D2D1_EXTEND_MODE_MIRROR
//#define D2D1_EXTEND_MODE_FORCE_DWORD D2D1_EXTEND_MODE_FORCE_DWORD

    setGlobalConst(D2D1_EXTEND_MODE_CLAMP);
    setGlobalConst(D2D1_EXTEND_MODE_WRAP);
    setGlobalConst(D2D1_EXTEND_MODE_MIRROR);
    setGlobalConst(D2D1_EXTEND_MODE_FORCE_DWORD);

    setGlobalConst(D2D1_ANTIALIAS_MODE_PER_PRIMITIVE);
    
    /// <summary>
    /// Each pixel is rendered if its pixel center is contained by the geometry.
    /// </summary>
    setGlobalConst(D2D1_ANTIALIAS_MODE_ALIASED);
        setGlobalConst(D2D1_ANTIALIAS_MODE_FORCE_DWORD);

//#define D2D1_BITMAP_INTERPOLATION_MODE_NEAREST_NEIGHBOR D2D1_BITMAP_INTERPOLATION_MODE_NEAREST_NEIGHBOR
//#define D2D1_BITMAP_INTERPOLATION_MODE_LINEAR D2D1_BITMAP_INTERPOLATION_MODE_LINEAR
//#define D2D1_BITMAP_INTERPOLATION_MODE_FORCE_DWORD D2D1_BITMAP_INTERPOLATION_MODE_FORCE_DWORD

    setGlobalConst(D2D1_BITMAP_INTERPOLATION_MODE_NEAREST_NEIGHBOR);
    setGlobalConst(D2D1_BITMAP_INTERPOLATION_MODE_LINEAR);
    setGlobalConst(D2D1_BITMAP_INTERPOLATION_MODE_FORCE_DWORD);


//string.replaceAll(" ", "").replaceAll("\t", "").split("\n").map(s = > "#define " + s + " " + s).map(s = > console.log(s));
//OK I DID ALL THIS THEN REALIZED I DIN'T HAVE TO
//IDK EVEN KNOW WHY I THOUGHT I HAD TO

//#define DXGI_FORMAT_UNKNOWN DXGI_FORMAT_UNKNOWN
//#define DXGI_FORMAT_R32G32B32A32_TYPELESS DXGI_FORMAT_R32G32B32A32_TYPELESS
//#define DXGI_FORMAT_R32G32B32A32_FLOAT DXGI_FORMAT_R32G32B32A32_FLOAT
//#define DXGI_FORMAT_R32G32B32A32_UINT DXGI_FORMAT_R32G32B32A32_UINT
//#define DXGI_FORMAT_R32G32B32A32_SINT DXGI_FORMAT_R32G32B32A32_SINT
//#define DXGI_FORMAT_R32G32B32_TYPELESS DXGI_FORMAT_R32G32B32_TYPELESS
//#define DXGI_FORMAT_R32G32B32_FLOAT DXGI_FORMAT_R32G32B32_FLOAT
//#define DXGI_FORMAT_R32G32B32_UINT DXGI_FORMAT_R32G32B32_UINT
//#define DXGI_FORMAT_R32G32B32_SINT DXGI_FORMAT_R32G32B32_SINT
//#define DXGI_FORMAT_R16G16B16A16_TYPELESS DXGI_FORMAT_R16G16B16A16_TYPELESS
//#define DXGI_FORMAT_R16G16B16A16_FLOAT DXGI_FORMAT_R16G16B16A16_FLOAT
//#define DXGI_FORMAT_R16G16B16A16_UNORM DXGI_FORMAT_R16G16B16A16_UNORM
//#define DXGI_FORMAT_R16G16B16A16_UINT DXGI_FORMAT_R16G16B16A16_UINT
//#define DXGI_FORMAT_R16G16B16A16_SNORM DXGI_FORMAT_R16G16B16A16_SNORM
//#define DXGI_FORMAT_R16G16B16A16_SINT DXGI_FORMAT_R16G16B16A16_SINT
//#define DXGI_FORMAT_R32G32_TYPELESS DXGI_FORMAT_R32G32_TYPELESS
//#define DXGI_FORMAT_R32G32_FLOAT DXGI_FORMAT_R32G32_FLOAT
//#define DXGI_FORMAT_R32G32_UINT DXGI_FORMAT_R32G32_UINT
//#define DXGI_FORMAT_R32G32_SINT DXGI_FORMAT_R32G32_SINT
//#define DXGI_FORMAT_R32G8X24_TYPELESS DXGI_FORMAT_R32G8X24_TYPELESS
//#define DXGI_FORMAT_D32_FLOAT_S8X24_UINT DXGI_FORMAT_D32_FLOAT_S8X24_UINT
//#define DXGI_FORMAT_R32_FLOAT_X8X24_TYPELESS DXGI_FORMAT_R32_FLOAT_X8X24_TYPELESS
//#define DXGI_FORMAT_X32_TYPELESS_G8X24_UINT DXGI_FORMAT_X32_TYPELESS_G8X24_UINT
//#define DXGI_FORMAT_R10G10B10A2_TYPELESS DXGI_FORMAT_R10G10B10A2_TYPELESS
//#define DXGI_FORMAT_R10G10B10A2_UNORM DXGI_FORMAT_R10G10B10A2_UNORM
//#define DXGI_FORMAT_R10G10B10A2_UINT DXGI_FORMAT_R10G10B10A2_UINT
//#define DXGI_FORMAT_R11G11B10_FLOAT DXGI_FORMAT_R11G11B10_FLOAT
//#define DXGI_FORMAT_R8G8B8A8_TYPELESS DXGI_FORMAT_R8G8B8A8_TYPELESS
//#define DXGI_FORMAT_R8G8B8A8_UNORM DXGI_FORMAT_R8G8B8A8_UNORM
//#define DXGI_FORMAT_R8G8B8A8_UNORM_SRGB DXGI_FORMAT_R8G8B8A8_UNORM_SRGB
//#define DXGI_FORMAT_R8G8B8A8_UINT DXGI_FORMAT_R8G8B8A8_UINT
//#define DXGI_FORMAT_R8G8B8A8_SNORM DXGI_FORMAT_R8G8B8A8_SNORM
//#define DXGI_FORMAT_R8G8B8A8_SINT DXGI_FORMAT_R8G8B8A8_SINT
//#define DXGI_FORMAT_R16G16_TYPELESS DXGI_FORMAT_R16G16_TYPELESS
//#define DXGI_FORMAT_R16G16_FLOAT DXGI_FORMAT_R16G16_FLOAT
//#define DXGI_FORMAT_R16G16_UNORM DXGI_FORMAT_R16G16_UNORM
//#define DXGI_FORMAT_R16G16_UINT DXGI_FORMAT_R16G16_UINT
//#define DXGI_FORMAT_R16G16_SNORM DXGI_FORMAT_R16G16_SNORM
//#define DXGI_FORMAT_R16G16_SINT DXGI_FORMAT_R16G16_SINT
//#define DXGI_FORMAT_R32_TYPELESS DXGI_FORMAT_R32_TYPELESS
//#define DXGI_FORMAT_D32_FLOAT DXGI_FORMAT_D32_FLOAT
//#define DXGI_FORMAT_R32_FLOAT DXGI_FORMAT_R32_FLOAT
//#define DXGI_FORMAT_R32_UINT DXGI_FORMAT_R32_UINT
//#define DXGI_FORMAT_R32_SINT DXGI_FORMAT_R32_SINT
//#define DXGI_FORMAT_R24G8_TYPELESS DXGI_FORMAT_R24G8_TYPELESS
//#define DXGI_FORMAT_D24_UNORM_S8_UINT DXGI_FORMAT_D24_UNORM_S8_UINT
//#define DXGI_FORMAT_R24_UNORM_X8_TYPELESS DXGI_FORMAT_R24_UNORM_X8_TYPELESS
//#define DXGI_FORMAT_X24_TYPELESS_G8_UINT DXGI_FORMAT_X24_TYPELESS_G8_UINT
//#define DXGI_FORMAT_R8G8_TYPELESS DXGI_FORMAT_R8G8_TYPELESS
//#define DXGI_FORMAT_R8G8_UNORM DXGI_FORMAT_R8G8_UNORM
//#define DXGI_FORMAT_R8G8_UINT DXGI_FORMAT_R8G8_UINT
//#define DXGI_FORMAT_R8G8_SNORM DXGI_FORMAT_R8G8_SNORM
//#define DXGI_FORMAT_R8G8_SINT DXGI_FORMAT_R8G8_SINT
//#define DXGI_FORMAT_R16_TYPELESS DXGI_FORMAT_R16_TYPELESS
//#define DXGI_FORMAT_R16_FLOAT DXGI_FORMAT_R16_FLOAT
//#define DXGI_FORMAT_D16_UNORM DXGI_FORMAT_D16_UNORM
//#define DXGI_FORMAT_R16_UNORM DXGI_FORMAT_R16_UNORM
//#define DXGI_FORMAT_R16_UINT DXGI_FORMAT_R16_UINT
//#define DXGI_FORMAT_R16_SNORM DXGI_FORMAT_R16_SNORM
//#define DXGI_FORMAT_R16_SINT DXGI_FORMAT_R16_SINT
//#define DXGI_FORMAT_R8_TYPELESS DXGI_FORMAT_R8_TYPELESS
//#define DXGI_FORMAT_R8_UNORM DXGI_FORMAT_R8_UNORM
//#define DXGI_FORMAT_R8_UINT DXGI_FORMAT_R8_UINT
//#define DXGI_FORMAT_R8_SNORM DXGI_FORMAT_R8_SNORM
//#define DXGI_FORMAT_R8_SINT DXGI_FORMAT_R8_SINT
//#define DXGI_FORMAT_A8_UNORM DXGI_FORMAT_A8_UNORM
//#define DXGI_FORMAT_R1_UNORM DXGI_FORMAT_R1_UNORM
//#define DXGI_FORMAT_R9G9B9E5_SHAREDEXP DXGI_FORMAT_R9G9B9E5_SHAREDEXP
//#define DXGI_FORMAT_R8G8_B8G8_UNORM DXGI_FORMAT_R8G8_B8G8_UNORM
//#define DXGI_FORMAT_G8R8_G8B8_UNORM DXGI_FORMAT_G8R8_G8B8_UNORM
//#define DXGI_FORMAT_BC1_TYPELESS DXGI_FORMAT_BC1_TYPELESS
//#define DXGI_FORMAT_BC1_UNORM DXGI_FORMAT_BC1_UNORM
//#define DXGI_FORMAT_BC1_UNORM_SRGB DXGI_FORMAT_BC1_UNORM_SRGB
//#define DXGI_FORMAT_BC2_TYPELESS DXGI_FORMAT_BC2_TYPELESS
//#define DXGI_FORMAT_BC2_UNORM DXGI_FORMAT_BC2_UNORM
//#define DXGI_FORMAT_BC2_UNORM_SRGB DXGI_FORMAT_BC2_UNORM_SRGB
//#define DXGI_FORMAT_BC3_TYPELESS DXGI_FORMAT_BC3_TYPELESS
//#define DXGI_FORMAT_BC3_UNORM DXGI_FORMAT_BC3_UNORM
//#define DXGI_FORMAT_BC3_UNORM_SRGB DXGI_FORMAT_BC3_UNORM_SRGB
//#define DXGI_FORMAT_BC4_TYPELESS DXGI_FORMAT_BC4_TYPELESS
//#define DXGI_FORMAT_BC4_UNORM DXGI_FORMAT_BC4_UNORM
//#define DXGI_FORMAT_BC4_SNORM DXGI_FORMAT_BC4_SNORM
//#define DXGI_FORMAT_BC5_TYPELESS DXGI_FORMAT_BC5_TYPELESS
//#define DXGI_FORMAT_BC5_UNORM DXGI_FORMAT_BC5_UNORM
//#define DXGI_FORMAT_BC5_SNORM DXGI_FORMAT_BC5_SNORM
//#define DXGI_FORMAT_B5G6R5_UNORM DXGI_FORMAT_B5G6R5_UNORM
//#define DXGI_FORMAT_B5G5R5A1_UNORM DXGI_FORMAT_B5G5R5A1_UNORM
//#define DXGI_FORMAT_B8G8R8A8_UNORM DXGI_FORMAT_B8G8R8A8_UNORM
//#define DXGI_FORMAT_B8G8R8X8_UNORM DXGI_FORMAT_B8G8R8X8_UNORM
//#define DXGI_FORMAT_R10G10B10_XR_BIAS_A2_UNORM DXGI_FORMAT_R10G10B10_XR_BIAS_A2_UNORM
//#define DXGI_FORMAT_B8G8R8A8_TYPELESS DXGI_FORMAT_B8G8R8A8_TYPELESS
//#define DXGI_FORMAT_B8G8R8A8_UNORM_SRGB DXGI_FORMAT_B8G8R8A8_UNORM_SRGB
//#define DXGI_FORMAT_B8G8R8X8_TYPELESS DXGI_FORMAT_B8G8R8X8_TYPELESS
//#define DXGI_FORMAT_B8G8R8X8_UNORM_SRGB DXGI_FORMAT_B8G8R8X8_UNORM_SRGB
//#define DXGI_FORMAT_BC6H_TYPELESS DXGI_FORMAT_BC6H_TYPELESS
//#define DXGI_FORMAT_BC6H_UF16 DXGI_FORMAT_BC6H_UF16
//#define DXGI_FORMAT_BC6H_SF16 DXGI_FORMAT_BC6H_SF16
//#define DXGI_FORMAT_BC7_TYPELESS DXGI_FORMAT_BC7_TYPELESS
//#define DXGI_FORMAT_BC7_UNORM DXGI_FORMAT_BC7_UNORM
//#define DXGI_FORMAT_BC7_UNORM_SRGB DXGI_FORMAT_BC7_UNORM_SRGB
//#define DXGI_FORMAT_AYUV DXGI_FORMAT_AYUV
//#define DXGI_FORMAT_Y410 DXGI_FORMAT_Y410
//#define DXGI_FORMAT_Y416 DXGI_FORMAT_Y416
//#define DXGI_FORMAT_NV12 DXGI_FORMAT_NV12
//#define DXGI_FORMAT_P010 DXGI_FORMAT_P010
//#define DXGI_FORMAT_P016 DXGI_FORMAT_P016
//#define DXGI_FORMAT_420_OPAQUE DXGI_FORMAT_420_OPAQUE
//#define DXGI_FORMAT_YUY2 DXGI_FORMAT_YUY2
//#define DXGI_FORMAT_Y210 DXGI_FORMAT_Y210
//#define DXGI_FORMAT_Y216 DXGI_FORMAT_Y216
//#define DXGI_FORMAT_NV11 DXGI_FORMAT_NV11
//#define DXGI_FORMAT_AI44 DXGI_FORMAT_AI44
//#define DXGI_FORMAT_IA44 DXGI_FORMAT_IA44
//#define DXGI_FORMAT_P8 DXGI_FORMAT_P8
//#define DXGI_FORMAT_A8P8 DXGI_FORMAT_A8P8
//#define DXGI_FORMAT_B4G4R4A4_UNORM DXGI_FORMAT_B4G4R4A4_UNORM
//#define DXGI_FORMAT_P208 DXGI_FORMAT_P208
//#define DXGI_FORMAT_V208 DXGI_FORMAT_V208
//#define DXGI_FORMAT_V408 DXGI_FORMAT_V408
//#define DXGI_FORMAT_SAMPLER_FEEDBACK_MIN_MIP_OPAQUE DXGI_FORMAT_SAMPLER_FEEDBACK_MIN_MIP_OPAQUE
//#define DXGI_FORMAT_SAMPLER_FEEDBACK_MIP_REGION_USED_OPAQUE DXGI_FORMAT_SAMPLER_FEEDBACK_MIP_REGION_USED_OPAQUE
//#define DXGI_FORMAT_FORCE_UINT DXGI_FORMAT_FORCE_UINT

setGlobalConst(DXGI_FORMAT_UNKNOWN); setGlobalConst(DXGI_FORMAT_R32G32B32A32_TYPELESS); setGlobalConst(DXGI_FORMAT_R32G32B32A32_FLOAT); setGlobalConst(DXGI_FORMAT_R32G32B32A32_UINT); setGlobalConst(DXGI_FORMAT_R32G32B32A32_SINT); setGlobalConst(DXGI_FORMAT_R32G32B32_TYPELESS); setGlobalConst(DXGI_FORMAT_R32G32B32_FLOAT); setGlobalConst(DXGI_FORMAT_R32G32B32_UINT); setGlobalConst(DXGI_FORMAT_R32G32B32_SINT); setGlobalConst(DXGI_FORMAT_R16G16B16A16_TYPELESS); setGlobalConst(DXGI_FORMAT_R16G16B16A16_FLOAT); setGlobalConst(DXGI_FORMAT_R16G16B16A16_UNORM); setGlobalConst(DXGI_FORMAT_R16G16B16A16_UINT); setGlobalConst(DXGI_FORMAT_R16G16B16A16_SNORM); setGlobalConst(DXGI_FORMAT_R16G16B16A16_SINT); setGlobalConst(DXGI_FORMAT_R32G32_TYPELESS); setGlobalConst(DXGI_FORMAT_R32G32_FLOAT); setGlobalConst(DXGI_FORMAT_R32G32_UINT); setGlobalConst(DXGI_FORMAT_R32G32_SINT); setGlobalConst(DXGI_FORMAT_R32G8X24_TYPELESS); setGlobalConst(DXGI_FORMAT_D32_FLOAT_S8X24_UINT); setGlobalConst(DXGI_FORMAT_R32_FLOAT_X8X24_TYPELESS); setGlobalConst(DXGI_FORMAT_X32_TYPELESS_G8X24_UINT); setGlobalConst(DXGI_FORMAT_R10G10B10A2_TYPELESS); setGlobalConst(DXGI_FORMAT_R10G10B10A2_UNORM); setGlobalConst(DXGI_FORMAT_R10G10B10A2_UINT); setGlobalConst(DXGI_FORMAT_R11G11B10_FLOAT); setGlobalConst(DXGI_FORMAT_R8G8B8A8_TYPELESS); setGlobalConst(DXGI_FORMAT_R8G8B8A8_UNORM); setGlobalConst(DXGI_FORMAT_R8G8B8A8_UNORM_SRGB); setGlobalConst(DXGI_FORMAT_R8G8B8A8_UINT); setGlobalConst(DXGI_FORMAT_R8G8B8A8_SNORM); setGlobalConst(DXGI_FORMAT_R8G8B8A8_SINT); setGlobalConst(DXGI_FORMAT_R16G16_TYPELESS); setGlobalConst(DXGI_FORMAT_R16G16_FLOAT); setGlobalConst(DXGI_FORMAT_R16G16_UNORM); setGlobalConst(DXGI_FORMAT_R16G16_UINT); setGlobalConst(DXGI_FORMAT_R16G16_SNORM); setGlobalConst(DXGI_FORMAT_R16G16_SINT); setGlobalConst(DXGI_FORMAT_R32_TYPELESS); setGlobalConst(DXGI_FORMAT_D32_FLOAT); setGlobalConst(DXGI_FORMAT_R32_FLOAT); setGlobalConst(DXGI_FORMAT_R32_UINT); setGlobalConst(DXGI_FORMAT_R32_SINT); setGlobalConst(DXGI_FORMAT_R24G8_TYPELESS); setGlobalConst(DXGI_FORMAT_D24_UNORM_S8_UINT); setGlobalConst(DXGI_FORMAT_R24_UNORM_X8_TYPELESS); setGlobalConst(DXGI_FORMAT_X24_TYPELESS_G8_UINT); setGlobalConst(DXGI_FORMAT_R8G8_TYPELESS); setGlobalConst(DXGI_FORMAT_R8G8_UNORM); setGlobalConst(DXGI_FORMAT_R8G8_UINT); setGlobalConst(DXGI_FORMAT_R8G8_SNORM); setGlobalConst(DXGI_FORMAT_R8G8_SINT); setGlobalConst(DXGI_FORMAT_R16_TYPELESS); setGlobalConst(DXGI_FORMAT_R16_FLOAT); setGlobalConst(DXGI_FORMAT_D16_UNORM); setGlobalConst(DXGI_FORMAT_R16_UNORM); setGlobalConst(DXGI_FORMAT_R16_UINT); setGlobalConst(DXGI_FORMAT_R16_SNORM); setGlobalConst(DXGI_FORMAT_R16_SINT); setGlobalConst(DXGI_FORMAT_R8_TYPELESS); setGlobalConst(DXGI_FORMAT_R8_UNORM); setGlobalConst(DXGI_FORMAT_R8_UINT); setGlobalConst(DXGI_FORMAT_R8_SNORM); setGlobalConst(DXGI_FORMAT_R8_SINT); setGlobalConst(DXGI_FORMAT_A8_UNORM); setGlobalConst(DXGI_FORMAT_R1_UNORM); setGlobalConst(DXGI_FORMAT_R9G9B9E5_SHAREDEXP); setGlobalConst(DXGI_FORMAT_R8G8_B8G8_UNORM); setGlobalConst(DXGI_FORMAT_G8R8_G8B8_UNORM); setGlobalConst(DXGI_FORMAT_BC1_TYPELESS); setGlobalConst(DXGI_FORMAT_BC1_UNORM); setGlobalConst(DXGI_FORMAT_BC1_UNORM_SRGB); setGlobalConst(DXGI_FORMAT_BC2_TYPELESS); setGlobalConst(DXGI_FORMAT_BC2_UNORM); setGlobalConst(DXGI_FORMAT_BC2_UNORM_SRGB); setGlobalConst(DXGI_FORMAT_BC3_TYPELESS); setGlobalConst(DXGI_FORMAT_BC3_UNORM); setGlobalConst(DXGI_FORMAT_BC3_UNORM_SRGB); setGlobalConst(DXGI_FORMAT_BC4_TYPELESS); setGlobalConst(DXGI_FORMAT_BC4_UNORM); setGlobalConst(DXGI_FORMAT_BC4_SNORM); setGlobalConst(DXGI_FORMAT_BC5_TYPELESS); setGlobalConst(DXGI_FORMAT_BC5_UNORM); setGlobalConst(DXGI_FORMAT_BC5_SNORM); setGlobalConst(DXGI_FORMAT_B5G6R5_UNORM); setGlobalConst(DXGI_FORMAT_B5G5R5A1_UNORM); setGlobalConst(DXGI_FORMAT_B8G8R8A8_UNORM); setGlobalConst(DXGI_FORMAT_B8G8R8X8_UNORM); setGlobalConst(DXGI_FORMAT_R10G10B10_XR_BIAS_A2_UNORM); setGlobalConst(DXGI_FORMAT_B8G8R8A8_TYPELESS); setGlobalConst(DXGI_FORMAT_B8G8R8A8_UNORM_SRGB); setGlobalConst(DXGI_FORMAT_B8G8R8X8_TYPELESS); setGlobalConst(DXGI_FORMAT_B8G8R8X8_UNORM_SRGB); setGlobalConst(DXGI_FORMAT_BC6H_TYPELESS); setGlobalConst(DXGI_FORMAT_BC6H_UF16); setGlobalConst(DXGI_FORMAT_BC6H_SF16); setGlobalConst(DXGI_FORMAT_BC7_TYPELESS); setGlobalConst(DXGI_FORMAT_BC7_UNORM); setGlobalConst(DXGI_FORMAT_BC7_UNORM_SRGB); setGlobalConst(DXGI_FORMAT_AYUV); setGlobalConst(DXGI_FORMAT_Y410); setGlobalConst(DXGI_FORMAT_Y416); setGlobalConst(DXGI_FORMAT_NV12); setGlobalConst(DXGI_FORMAT_P010); setGlobalConst(DXGI_FORMAT_P016); setGlobalConst(DXGI_FORMAT_420_OPAQUE); setGlobalConst(DXGI_FORMAT_YUY2); setGlobalConst(DXGI_FORMAT_Y210); setGlobalConst(DXGI_FORMAT_Y216); setGlobalConst(DXGI_FORMAT_NV11); setGlobalConst(DXGI_FORMAT_AI44); setGlobalConst(DXGI_FORMAT_IA44); setGlobalConst(DXGI_FORMAT_P8); setGlobalConst(DXGI_FORMAT_A8P8); setGlobalConst(DXGI_FORMAT_B4G4R4A4_UNORM); setGlobalConst(DXGI_FORMAT_P208); setGlobalConst(DXGI_FORMAT_V208); setGlobalConst(DXGI_FORMAT_V408); setGlobalConst(DXGI_FORMAT_SAMPLER_FEEDBACK_MIN_MIP_OPAQUE); setGlobalConst(DXGI_FORMAT_SAMPLER_FEEDBACK_MIP_REGION_USED_OPAQUE); setGlobalConst(DXGI_FORMAT_FORCE_UINT);

    //#define D2D1_ALPHA_MODE_FORCE_DWORD D2D1_ALPHA_MODE_FORCE_DWORD
    //#define D2D1_ALPHA_MODE_IGNORE D2D1_ALPHA_MODE_IGNORE
    //#define D2D1_ALPHA_MODE_PREMULTIPLIED D2D1_ALPHA_MODE_PREMULTIPLIED
    //#define D2D1_ALPHA_MODE_STRAIGHT D2D1_ALPHA_MODE_STRAIGHT
    //#define D2D1_ALPHA_MODE_UNKNOWN D2D1_ALPHA_MODE_UNKNOWN

    setGlobalConst(D2D1_ALPHA_MODE_FORCE_DWORD);
    setGlobalConst(D2D1_ALPHA_MODE_IGNORE);
    setGlobalConst(D2D1_ALPHA_MODE_PREMULTIPLIED);
    setGlobalConst(D2D1_ALPHA_MODE_STRAIGHT);
    setGlobalConst(D2D1_ALPHA_MODE_UNKNOWN);

    /*
    let codes = [];
    for(let child of $0.children) {
        let text = child.firstElementChild.innerText
        if(text && text != "-") {
        codes.push(`setGlobalConst(${text});`)
        console.log(text)
        }
    }
    codes.join(" ");
    */
    setGlobalConst(NULL);

    setGlobal(GetKey);
    setGlobal(GetKeyDown);
    //setGlobalWrapper(GetKeyboardState);
    setGlobal(GetAsyncKeyboardState);

    setGlobal(setTimeout);
    setGlobal(setInterval);
    setGlobal(clearTimeout);
    setGlobal(clearInterval);
    //global->Set(isolate, "clearTimeout", FunctionTemplate::New(isolate, clearTimerYKYKYK));
    //global->Set(isolate, "clearInterval", FunctionTemplate::New(isolate, clearTimerYKYKYK));

    setGlobalWrapper(PostQuitMessage);

    setGlobal(GetMousePos);
    global->Set(isolate, "GetCursorPos", FunctionTemplate::New(isolate, GetMousePos));

    setGlobal(SetMousePos);
    global->Set(isolate, "SetCursorPos", FunctionTemplate::New(isolate, SetMousePos));

    setGlobalWrapper(LoadCursor);
    setGlobalWrapper(LoadCursorFromFile);
    setGlobalWrapper(LoadImage);
    setGlobalWrapper(MAKEINTRESOURCE);
    setGlobalWrapper(SetCursor);

    setGlobalWrapper(DrawIconEx);
    setGlobalWrapper(DrawIcon);
    setGlobalWrapper(LoadIcon);
    setGlobalWrapper(HICONFromHBITMAP);
    setGlobalWrapper(GetIconDimensions);
    setGlobal(GetBitmapDimensions);

    setGlobalConst(IMAGE_BITMAP);
    setGlobalConst(IMAGE_CURSOR);
    setGlobalConst(IMAGE_ICON);

    setGlobalConst(LR_CREATEDIBSECTION); setGlobalConst(LR_DEFAULTCOLOR); setGlobalConst(LR_DEFAULTSIZE); setGlobalConst(LR_LOADFROMFILE); setGlobalConst(LR_LOADMAP3DCOLORS); setGlobalConst(LR_LOADTRANSPARENT); setGlobalConst(LR_MONOCHROME); setGlobalConst(LR_SHARED); setGlobalConst(LR_VGACOLOR);
    
    setGlobalConst(DI_COMPAT);
    setGlobalConst(DI_DEFAULTSIZE);
    setGlobalConst(DI_IMAGE);
    setGlobalConst(DI_MASK);
    setGlobalConst(DI_NOMIRROR);
    setGlobalConst(DI_NORMAL);

#define MAKEINTRESOURCE(i) i //lol makeintresource messes with setGlobalConst so i gotta "remove" it
    setGlobalConst(IDI_APPLICATION); setGlobalConst(IDI_ERROR); setGlobalConst(IDI_QUESTION); setGlobalConst(IDI_WARNING); setGlobalConst(IDI_INFORMATION); setGlobalConst(IDI_WINLOGO); setGlobalConst(IDI_SHIELD);

    setGlobalConst(IDC_ARROW); setGlobalConst(IDC_IBEAM); setGlobalConst(IDC_WAIT); setGlobalConst(IDC_CROSS); setGlobalConst(IDC_UPARROW); setGlobalConst(IDC_SIZENWSE); setGlobalConst(IDC_SIZENESW); setGlobalConst(IDC_SIZEWE); setGlobalConst(IDC_SIZENS); setGlobalConst(IDC_SIZEALL); setGlobalConst(IDC_NO); setGlobalConst(IDC_HAND); setGlobalConst(IDC_APPSTARTING); setGlobalConst(IDC_HELP); setGlobalConst(IDC_PIN); setGlobalConst(IDC_PERSON);
#define IDC_HANDWRITING MAKEINTRESOURCE(32631)
    setGlobalConst(IDC_HANDWRITING);

    setGlobalWrapper(SetBkColor);
    setGlobalWrapper(SetBkMode);
    
    setGlobalWrapper(EnumFontFamilies);
    setGlobalWrapper(CreateFont);
    setGlobalWrapper(CreateFontSimple);
    setGlobalConst(FW_DONTCARE); setGlobalConst(FW_THIN); setGlobalConst(FW_EXTRALIGHT); setGlobalConst(FW_ULTRALIGHT); setGlobalConst(FW_LIGHT); setGlobalConst(FW_NORMAL); setGlobalConst(FW_REGULAR); setGlobalConst(FW_MEDIUM); setGlobalConst(FW_SEMIBOLD); setGlobalConst(FW_DEMIBOLD); setGlobalConst(FW_BOLD); setGlobalConst(FW_EXTRABOLD); setGlobalConst(FW_ULTRABOLD); setGlobalConst(FW_HEAVY); setGlobalConst(FW_BLACK);
    setGlobalConst(ANSI_CHARSET); setGlobalConst(BALTIC_CHARSET); setGlobalConst(CHINESEBIG5_CHARSET); setGlobalConst(DEFAULT_CHARSET); setGlobalConst(EASTEUROPE_CHARSET); setGlobalConst(GB2312_CHARSET); setGlobalConst(GREEK_CHARSET); setGlobalConst(HANGUL_CHARSET); setGlobalConst(MAC_CHARSET); setGlobalConst(OEM_CHARSET); setGlobalConst(RUSSIAN_CHARSET); setGlobalConst(SHIFTJIS_CHARSET); setGlobalConst(SYMBOL_CHARSET); setGlobalConst(TURKISH_CHARSET); setGlobalConst(VIETNAMESE_CHARSET);
    setGlobalConst(JOHAB_CHARSET); setGlobalConst(ARABIC_CHARSET); setGlobalConst(HEBREW_CHARSET); setGlobalConst(THAI_CHARSET);
    setGlobalConst(OUT_CHARACTER_PRECIS); setGlobalConst(OUT_DEFAULT_PRECIS); setGlobalConst(OUT_DEVICE_PRECIS); setGlobalConst(OUT_OUTLINE_PRECIS); setGlobalConst(OUT_PS_ONLY_PRECIS); setGlobalConst(OUT_RASTER_PRECIS); setGlobalConst(OUT_STRING_PRECIS); setGlobalConst(OUT_STROKE_PRECIS); setGlobalConst(OUT_TT_ONLY_PRECIS); setGlobalConst(OUT_TT_PRECIS);
    setGlobalConst(CLIP_CHARACTER_PRECIS); setGlobalConst(CLIP_DEFAULT_PRECIS); setGlobalConst(CLIP_DFA_DISABLE); setGlobalConst(CLIP_EMBEDDED); setGlobalConst(CLIP_LH_ANGLES); setGlobalConst(CLIP_MASK); /*setGlobalConst(CLIP_DFA_OVERRIDE);*/ setGlobalConst(CLIP_STROKE_PRECIS); setGlobalConst(CLIP_TT_ALWAYS);
    setGlobalConst(ANTIALIASED_QUALITY); setGlobalConst(CLEARTYPE_QUALITY); setGlobalConst(DEFAULT_QUALITY); setGlobalConst(DRAFT_QUALITY); setGlobalConst(NONANTIALIASED_QUALITY); setGlobalConst(PROOF_QUALITY);
    setGlobalConst(DEFAULT_PITCH); setGlobalConst(FIXED_PITCH); setGlobalConst(VARIABLE_PITCH);
    setGlobalConst(FF_DECORATIVE); setGlobalConst(FF_DONTCARE); setGlobalConst(FF_MODERN); setGlobalConst(FF_ROMAN); setGlobalConst(FF_SCRIPT); setGlobalConst(FF_SWISS);

    setGlobalWrapper(SelectObject);
    setGlobalWrapper(DeleteObject);
    setGlobalWrapper(DestroyCursor);
    setGlobalWrapper(DestroyIcon);
    setGlobalWrapper(SetDCPenColor);
    setGlobalWrapper(SetDCBrushColor);
    setGlobalWrapper(CreateSolidBrush);
    setGlobalWrapper(MoveTo);
    setGlobalWrapper(LineTo);
    setGlobalWrapper(DrawText);
    setGlobalConst(DT_BOTTOM); setGlobalConst(DT_CALCRECT); setGlobalConst(DT_CENTER); setGlobalConst(DT_EDITCONTROL); setGlobalConst(DT_END_ELLIPSIS); setGlobalConst(DT_EXPANDTABS); setGlobalConst(DT_EXTERNALLEADING); setGlobalConst(DT_HIDEPREFIX); setGlobalConst(DT_INTERNAL); setGlobalConst(DT_LEFT); setGlobalConst(DT_MODIFYSTRING); setGlobalConst(DT_NOCLIP); setGlobalConst(DT_NOFULLWIDTHCHARBREAK); setGlobalConst(DT_NOPREFIX); setGlobalConst(DT_PATH_ELLIPSIS); setGlobalConst(DT_PREFIXONLY); setGlobalConst(DT_RIGHT); setGlobalConst(DT_RTLREADING); setGlobalConst(DT_SINGLELINE); setGlobalConst(DT_TABSTOP); setGlobalConst(DT_TOP); setGlobalConst(DT_VCENTER); setGlobalConst(DT_WORDBREAK); setGlobalConst(DT_WORD_ELLIPSIS);

    setGlobalWrapper(GetWindowDC);
    setGlobalWrapper(SaveDC);
    setGlobalWrapper(RestoreDC);
    setGlobalWrapper(DeleteDC);
    setGlobalWrapper(CreateCompatibleBitmap);
    setGlobalWrapper(CreateCompatibleDC);
    setGlobalWrapper(CreateBitmap);
    setGlobalWrapper(GetClassName);

    setGlobalWrapper(Rectangle);

    global->Set(isolate, "GetDefaultFont", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        static HFONT defaultfont = NULL; //lowkey still genius
        if (defaultfont == NULL) {
            NONCLIENTMETRICS ncm;
            ncm.cbSize = sizeof(NONCLIENTMETRICS);
            SystemParametersInfo(SPI_GETNONCLIENTMETRICS, sizeof(NONCLIENTMETRICS), &ncm, 0);
            defaultfont = CreateFontIndirect(&ncm.lfMessageFont);

            print("creating static defaultfont");
        }
        info.GetReturnValue().Set(Number::New(info.GetIsolate(), (long long)defaultfont)); //honestly this is a REALLY weird solution but it works suprisingly
    }));
    //https://cpp.sh/?source=%2F%2F+Example+program%0A%23include+%3Ciostream%3E%0A%23include+%3Cstring%3E%0A%0Aint+main()%0A%7B%0A++std%3A%3Astring+name%3B%0A++std%3A%3Acout+%3C%3C+%22What+is+your+name%3F+%22%3B%0A++getline+(std%3A%3Acin%2C+name)%3B%0A++std%3A%3Acout+%3C%3C+%22Hello%2C+%22+%3C%3C+name+%3C%3C+%22!%5Cn%22%3B%0A%7D
    
    setGlobalWrapper(CreatePen);
    setGlobalConst(PS_GEOMETRIC);
    setGlobalConst(PS_COSMETIC);
    //setGlobalConst(PS_ALTERNATIVE);
    setGlobalConst(PS_USERSTYLE);
    setGlobalConst(PS_ENDCAP_ROUND); setGlobalConst(PS_ENDCAP_SQUARE); setGlobalConst(PS_ENDCAP_FLAT); setGlobalConst(PS_JOIN_BEVEL); setGlobalConst(PS_JOIN_MITER); setGlobalConst(PS_JOIN_ROUND);
    setGlobalWrapper(GetStockObject);

    setGlobalConst(BLACK_BRUSH); setGlobalConst(DKGRAY_BRUSH); setGlobalConst(DC_BRUSH); setGlobalConst(GRAY_BRUSH); setGlobalConst(HOLLOW_BRUSH); setGlobalConst(LTGRAY_BRUSH); setGlobalConst(NULL_BRUSH); setGlobalConst(WHITE_BRUSH); setGlobalConst(BLACK_PEN); setGlobalConst(DC_PEN); setGlobalConst(NULL_PEN); setGlobalConst(WHITE_PEN); setGlobalConst(ANSI_FIXED_FONT); setGlobalConst(ANSI_VAR_FONT); setGlobalConst(DEVICE_DEFAULT_FONT); setGlobalConst(DEFAULT_GUI_FONT); setGlobalConst(OEM_FIXED_FONT); setGlobalConst(SYSTEM_FONT); setGlobalConst(SYSTEM_FIXED_FONT); setGlobalConst(DEFAULT_PALETTE);
    //setGlobal(GetKeyUp);

    setGlobalWrapper(FindWindow);

    setGlobalWrapper(SetTextColor);

    setGlobal(createCanvas);

#define ID2D1RenderTarget 0
#define ID2D1DCRenderTarget 1

    setGlobalConst(ID2D1RenderTarget);
    setGlobalConst(ID2D1DCRenderTarget);

    setGlobalConst(MK_CONTROL);
    setGlobalConst(MK_LBUTTON);
    setGlobalConst(MK_MBUTTON);
    setGlobalConst(MK_RBUTTON);
    setGlobalConst(MK_SHIFT);
    setGlobalConst(MK_XBUTTON1);
    setGlobalConst(MK_XBUTTON2);


    setGlobalWrapper(Sleep);
    setGlobalWrapper(GetClientRect);
    setGlobalWrapper(GetWindowRect);

    setGlobalWrapper(FillRect);

    setGlobalWrapper(GetConsoleWindow);
    //setGlobalWrapper(GetDesktopWindow);

    setGlobalWrapper(DestroyWindow);

    global->Set(isolate, "GET_X_LPARAM", FunctionTemplate::New(isolate, GET_X_LPARAMWRAPPER));
    global->Set(isolate, "GET_Y_LPARAM", FunctionTemplate::New(isolate, GET_Y_LPARAMWRAPPER));
    global->Set(isolate, "HIWORD", FunctionTemplate::New(isolate, HIWORDWRAPPER));
    global->Set(isolate, "LOWORD", FunctionTemplate::New(isolate, LOWORDWRAPPER));

    //#define DWRITE_FLOW_DIRECTION_TOP_TO_BOTTOM DWRITE_FLOW_DIRECTION_TOP_TO_BOTTOM
    //#define DWRITE_FLOW_DIRECTION_BOTTOM_TO_TOP DWRITE_FLOW_DIRECTION_BOTTOM_TO_TOP
    //#define DWRITE_FLOW_DIRECTION_LEFT_TO_RIGHT DWRITE_FLOW_DIRECTION_LEFT_TO_RIGHT
    //#define DWRITE_FLOW_DIRECTION_RIGHT_TO_LEFT DWRITE_FLOW_DIRECTION_RIGHT_TO_LEFT
    setGlobalConst(DWRITE_FLOW_DIRECTION_TOP_TO_BOTTOM);
    setGlobalConst(DWRITE_FLOW_DIRECTION_BOTTOM_TO_TOP);
    setGlobalConst(DWRITE_FLOW_DIRECTION_LEFT_TO_RIGHT);
    setGlobalConst(DWRITE_FLOW_DIRECTION_RIGHT_TO_LEFT);
    //#define DWRITE_FONT_STRETCH_UNDEFINED       DWRITE_FONT_STRETCH_UNDEFINED
    //#define DWRITE_FONT_STRETCH_ULTRA_CONDENSED DWRITE_FONT_STRETCH_ULTRA_CONDENSED
    //#define DWRITE_FONT_STRETCH_EXTRA_CONDENSED DWRITE_FONT_STRETCH_EXTRA_CONDENSED
    //#define DWRITE_FONT_STRETCH_CONDENSED       DWRITE_FONT_STRETCH_CONDENSED
    //#define DWRITE_FONT_STRETCH_SEMI_CONDENSED  DWRITE_FONT_STRETCH_SEMI_CONDENSED
    //#define DWRITE_FONT_STRETCH_NORMAL          DWRITE_FONT_STRETCH_NORMAL
    //#define DWRITE_FONT_STRETCH_MEDIUM          DWRITE_FONT_STRETCH_MEDIUM
    //#define DWRITE_FONT_STRETCH_SEMI_EXPANDED   DWRITE_FONT_STRETCH_SEMI_EXPANDED
    //#define DWRITE_FONT_STRETCH_EXPANDED        DWRITE_FONT_STRETCH_EXPANDED
    //#define DWRITE_FONT_STRETCH_EXTRA_EXPANDED  DWRITE_FONT_STRETCH_EXTRA_EXPANDED
    //#define DWRITE_FONT_STRETCH_ULTRA_EXPANDED  DWRITE_FONT_STRETCH_ULTRA_EXPANDED
    setGlobalConst(DWRITE_FONT_STRETCH_UNDEFINED);
    setGlobalConst(DWRITE_FONT_STRETCH_ULTRA_CONDENSED);
    setGlobalConst(DWRITE_FONT_STRETCH_EXTRA_CONDENSED);
    setGlobalConst(DWRITE_FONT_STRETCH_CONDENSED);
    setGlobalConst(DWRITE_FONT_STRETCH_SEMI_CONDENSED);
    setGlobalConst(DWRITE_FONT_STRETCH_NORMAL);
    setGlobalConst(DWRITE_FONT_STRETCH_MEDIUM);
    setGlobalConst(DWRITE_FONT_STRETCH_SEMI_EXPANDED);
    setGlobalConst(DWRITE_FONT_STRETCH_EXPANDED);
    setGlobalConst(DWRITE_FONT_STRETCH_EXTRA_EXPANDED);
    setGlobalConst(DWRITE_FONT_STRETCH_ULTRA_EXPANDED);
    //#define DWRITE_FONT_STYLE_NORMAL  DWRITE_FONT_STYLE_NORMAL
    //#define DWRITE_FONT_STYLE_OBLIQUE DWRITE_FONT_STYLE_OBLIQUE
    //#define DWRITE_FONT_STYLE_ITALIC  DWRITE_FONT_STYLE_ITALIC
    setGlobalConst(DWRITE_FONT_STYLE_NORMAL);
    setGlobalConst(DWRITE_FONT_STYLE_OBLIQUE);
    setGlobalConst(DWRITE_FONT_STYLE_ITALIC);
    
        //#define DWRITE_FONT_WEIGHT_THIN          DWRITE_FONT_WEIGHT_THIN
        //#define DWRITE_FONT_WEIGHT_EXTRA_LIGHT   DWRITE_FONT_WEIGHT_EXTRA_LIGHT
        //#define DWRITE_FONT_WEIGHT_ULTRA_LIGHT   DWRITE_FONT_WEIGHT_ULTRA_LIGHT
        //#define DWRITE_FONT_WEIGHT_LIGHT         DWRITE_FONT_WEIGHT_LIGHT
        //#define DWRITE_FONT_WEIGHT_SEMI_LIGHT    DWRITE_FONT_WEIGHT_SEMI_LIGHT
        //#define DWRITE_FONT_WEIGHT_NORMAL        DWRITE_FONT_WEIGHT_NORMAL
        //#define DWRITE_FONT_WEIGHT_REGULAR       DWRITE_FONT_WEIGHT_REGULAR
        //#define DWRITE_FONT_WEIGHT_MEDIUM        DWRITE_FONT_WEIGHT_MEDIUM
        //#define DWRITE_FONT_WEIGHT_DEMI_BOLD     DWRITE_FONT_WEIGHT_DEMI_BOLD
        //#define DWRITE_FONT_WEIGHT_SEMI_BOLD     DWRITE_FONT_WEIGHT_SEMI_BOLD
        //#define DWRITE_FONT_WEIGHT_BOLD          DWRITE_FONT_WEIGHT_BOLD
        //#define DWRITE_FONT_WEIGHT_EXTRA_BOLD    DWRITE_FONT_WEIGHT_EXTRA_BOLD
        //#define DWRITE_FONT_WEIGHT_ULTRA_BOLD    DWRITE_FONT_WEIGHT_ULTRA_BOLD
        //#define DWRITE_FONT_WEIGHT_BLACK         DWRITE_FONT_WEIGHT_BLACK
        //#define DWRITE_FONT_WEIGHT_HEAVY         DWRITE_FONT_WEIGHT_HEAVY
        //#define DWRITE_FONT_WEIGHT_EXTRA_BLACK   DWRITE_FONT_WEIGHT_EXTRA_BLACK
        //#define DWRITE_FONT_WEIGHT_ULTRA_BLACK   DWRITE_FONT_WEIGHT_ULTRA_BLACK
    setGlobalConst(DWRITE_FONT_WEIGHT_THIN);
    setGlobalConst(DWRITE_FONT_WEIGHT_EXTRA_LIGHT);
    setGlobalConst(DWRITE_FONT_WEIGHT_ULTRA_LIGHT);
    setGlobalConst(DWRITE_FONT_WEIGHT_LIGHT);
    setGlobalConst(DWRITE_FONT_WEIGHT_SEMI_LIGHT);
    setGlobalConst(DWRITE_FONT_WEIGHT_NORMAL);
    setGlobalConst(DWRITE_FONT_WEIGHT_REGULAR);
    setGlobalConst(DWRITE_FONT_WEIGHT_MEDIUM);
    setGlobalConst(DWRITE_FONT_WEIGHT_DEMI_BOLD);
    setGlobalConst(DWRITE_FONT_WEIGHT_SEMI_BOLD);
    setGlobalConst(DWRITE_FONT_WEIGHT_BOLD);
    setGlobalConst(DWRITE_FONT_WEIGHT_EXTRA_BOLD);
    setGlobalConst(DWRITE_FONT_WEIGHT_ULTRA_BOLD);
    setGlobalConst(DWRITE_FONT_WEIGHT_BLACK);
    setGlobalConst(DWRITE_FONT_WEIGHT_HEAVY);
    setGlobalConst(DWRITE_FONT_WEIGHT_EXTRA_BLACK);
    setGlobalConst(DWRITE_FONT_WEIGHT_ULTRA_BLACK);

//#define DWRITE_PARAGRAPH_ALIGNMENT_NEAR   DWRITE_PARAGRAPH_ALIGNMENT_NEAR
//#define DWRITE_PARAGRAPH_ALIGNMENT_FAR    DWRITE_PARAGRAPH_ALIGNMENT_FAR
//#define DWRITE_PARAGRAPH_ALIGNMENT_CENTER DWRITE_PARAGRAPH_ALIGNMENT_CENTER

    setGlobalConst(DWRITE_PARAGRAPH_ALIGNMENT_NEAR);
    setGlobalConst(DWRITE_PARAGRAPH_ALIGNMENT_FAR);
    setGlobalConst(DWRITE_PARAGRAPH_ALIGNMENT_CENTER);

//#define DWRITE_READING_DIRECTION_TOP_TO_BOTTOM DWRITE_READING_DIRECTION_TOP_TO_BOTTOM
//#define DWRITE_READING_DIRECTION_BOTTOM_TO_TOP DWRITE_READING_DIRECTION_BOTTOM_TO_TOP
//#define DWRITE_READING_DIRECTION_LEFT_TO_RIGHT DWRITE_READING_DIRECTION_LEFT_TO_RIGHT
//#define DWRITE_READING_DIRECTION_RIGHT_TO_LEFT DWRITE_READING_DIRECTION_RIGHT_TO_LEFT
    setGlobalConst(DWRITE_READING_DIRECTION_TOP_TO_BOTTOM);
    setGlobalConst(DWRITE_READING_DIRECTION_BOTTOM_TO_TOP);
    setGlobalConst(DWRITE_READING_DIRECTION_LEFT_TO_RIGHT);
    setGlobalConst(DWRITE_READING_DIRECTION_RIGHT_TO_LEFT);

    //#define DWRITE_TEXT_ALIGNMENT_LEADING   DWRITE_TEXT_ALIGNMENT_LEADING
    //#define DWRITE_TEXT_ALIGNMENT_TRAILING  DWRITE_TEXT_ALIGNMENT_TRAILING
    //#define DWRITE_TEXT_ALIGNMENT_CENTER    DWRITE_TEXT_ALIGNMENT_CENTER
    //#define DWRITE_TEXT_ALIGNMENT_JUSTIFIED DWRITE_TEXT_ALIGNMENT_JUSTIFIED
    setGlobalConst(DWRITE_TEXT_ALIGNMENT_LEADING);
    setGlobalConst(DWRITE_TEXT_ALIGNMENT_TRAILING);
    setGlobalConst(DWRITE_TEXT_ALIGNMENT_CENTER);
    setGlobalConst(DWRITE_TEXT_ALIGNMENT_JUSTIFIED);

    //#define DWRITE_WORD_WRAPPING_WRAP            DWRITE_WORD_WRAPPING_WRAP
    //#define DWRITE_WORD_WRAPPING_NO_WRAP         DWRITE_WORD_WRAPPING_NO_WRAP
    //#define DWRITE_WORD_WRAPPING_EMERGENCY_BREAK DWRITE_WORD_WRAPPING_EMERGENCY_BREAK
    //#define DWRITE_WORD_WRAPPING_WHOLE_WORD      DWRITE_WORD_WRAPPING_WHOLE_WORD
    //#define DWRITE_WORD_WRAPPING_CHARACTER       DWRITE_WORD_WRAPPING_CHARACTER
    setGlobalConst(DWRITE_WORD_WRAPPING_WRAP);
    setGlobalConst(DWRITE_WORD_WRAPPING_NO_WRAP);
    setGlobalConst(DWRITE_WORD_WRAPPING_EMERGENCY_BREAK);
    setGlobalConst(DWRITE_WORD_WRAPPING_WHOLE_WORD);
    setGlobalConst(DWRITE_WORD_WRAPPING_CHARACTER);

    //#define DWRITE_TRIMMING_GRANULARITY_NONE      DWRITE_TRIMMING_GRANULARITY_NONE
    //#define DWRITE_TRIMMING_GRANULARITY_CHARACTER DWRITE_TRIMMING_GRANULARITY_CHARACTER
    //#define DWRITE_TRIMMING_GRANULARITY_WORD      DWRITE_TRIMMING_GRANULARITY_WORD
    setGlobalConst(DWRITE_TRIMMING_GRANULARITY_NONE);
    setGlobalConst(DWRITE_TRIMMING_GRANULARITY_CHARACTER);
    setGlobalConst(DWRITE_TRIMMING_GRANULARITY_WORD);

    setGlobalWrapper(GetWindowText);
    setGlobalWrapper(SetWindowText);
    setGlobalWrapper(TransparentBlt);
    setGlobalWrapper(AlphaBlend);
    setGlobalWrapper(GetPixel);
    setGlobalWrapper(SetPixel);
    setGlobalWrapper(SetPixelV);
    setGlobalWrapper(GetStretchBltMode);
    setGlobalWrapper(SetStretchBltMode);
    setGlobalWrapper(SendMessage);

    setGlobalConst(ICON_BIG);
    setGlobalConst(ICON_SMALL);

    setGlobalConst(BLACKONWHITE); setGlobalConst(COLORONCOLOR); setGlobalConst(HALFTONE); setGlobalConst(STRETCH_ANDSCANS); setGlobalConst(STRETCH_DELETESCANS); setGlobalConst(STRETCH_HALFTONE); setGlobalConst(STRETCH_ORSCANS); setGlobalConst(WHITEONBLACK);
    
    setGlobalWrapper(PrintWindow);

    setGlobalConst(PW_CLIENTONLY);
    setGlobalConst(PW_RENDERFULLCONTENT);

    setGlobalWrapper(SetWindowPos);

    //setGlobalConst(HWND_BOTTOM);
    //setGlobalConst(HWND_NOTOPMOST);
    //setGlobalConst(HWND_TOP);
    //setGlobalConst(HWND_TOPMOST);

    global->Set(isolate, "HWND_BOTTOM", Number::New(isolate, (LONG_PTR)HWND_BOTTOM));
    global->Set(isolate, "HWND_NOTOPMOST", Number::New(isolate, (LONG_PTR)HWND_NOTOPMOST));
    global->Set(isolate, "HWND_TOP", Number::New(isolate, (LONG_PTR)HWND_TOP));
    global->Set(isolate, "HWND_TOPMOST", Number::New(isolate, (LONG_PTR)HWND_TOPMOST));

    setGlobalConst(SWP_ASYNCWINDOWPOS); setGlobalConst(SWP_DEFERERASE); setGlobalConst(SWP_DRAWFRAME); setGlobalConst(SWP_FRAMECHANGED); setGlobalConst(SWP_HIDEWINDOW); setGlobalConst(SWP_NOACTIVATE); setGlobalConst(SWP_NOCOPYBITS); setGlobalConst(SWP_NOMOVE); setGlobalConst(SWP_NOOWNERZORDER); setGlobalConst(SWP_NOREDRAW); setGlobalConst(SWP_NOREPOSITION); setGlobalConst(SWP_NOSENDCHANGING); setGlobalConst(SWP_NOSIZE); setGlobalConst(SWP_NOZORDER); setGlobalConst(SWP_SHOWWINDOW);

    global->Set(isolate, "RGB", FunctionTemplate::New(isolate, RGBWRAPPER));
    global->Set(isolate, "GetRValue", FunctionTemplate::New(isolate, GetRValueWrapper));
    global->Set(isolate, "GetGValue", FunctionTemplate::New(isolate, GetGValueWrapper));
    global->Set(isolate, "GetBValue", FunctionTemplate::New(isolate, GetBValueWrapper));

    setGlobalWrapper(WindowFromDC);
    setGlobalWrapper(WindowFromPoint);

    setGlobalWrapper(EnumWindows);

    setGlobalWrapper(keybd_event);
    setGlobalWrapper(mouse_event);
    setGlobalWrapper(SendInput);
    setGlobal(MakeKeyboardInput);
    setGlobal(MakeMouseInput);

    setGlobalConst(INPUT_MOUSE);
    setGlobalConst(INPUT_KEYBOARD);
    setGlobalConst(INPUT_HARDWARE);
    //setGlobalWrapper(SendInput);ww

    setGlobalConst(KEYEVENTF_EXTENDEDKEY);
    setGlobalConst(KEYEVENTF_KEYUP);
    setGlobalConst(KEYEVENTF_SCANCODE);
    setGlobalConst(KEYEVENTF_UNICODE);

    //TOO MANY GLOBALS???? (THERE WERE 2 MOUSEEVENTF_WHEEL S FOR SOME REAOSN!)
    setGlobalConst(MOUSEEVENTF_ABSOLUTE); setGlobalConst(MOUSEEVENTF_LEFTDOWN); setGlobalConst(MOUSEEVENTF_LEFTUP); setGlobalConst(MOUSEEVENTF_MIDDLEDOWN); setGlobalConst(MOUSEEVENTF_MIDDLEUP); setGlobalConst(MOUSEEVENTF_MOVE); setGlobalConst(MOUSEEVENTF_RIGHTDOWN); setGlobalConst(MOUSEEVENTF_RIGHTUP); setGlobalConst(MOUSEEVENTF_WHEEL); setGlobalConst(MOUSEEVENTF_XDOWN); setGlobalConst(MOUSEEVENTF_XUP); setGlobalConst(MOUSEEVENTF_HWHEEL);
    
    setGlobalWrapper(GetForegroundWindow);
    setGlobalWrapper(SetForegroundWindow);
    setGlobalWrapper(GetActiveWindow);
    setGlobalWrapper(SetActiveWindow);

    setGlobalWrapper(SetCapture);
    setGlobalWrapper(ReleaseCapture);
    setGlobalWrapper(ClipCursor);
    setGlobalWrapper(MAKEPOINTS);
    setGlobalWrapper(GET_WHEEL_DELTA_WPARAM);

    setGlobalWrapper(IsIconic);
    setGlobalWrapper(IsChild);
    setGlobalWrapper(SetParent);
    setGlobalWrapper(GetParent);
    setGlobalWrapper(SetClassLongPtr);
    setGlobalWrapper(SetWindowLongPtr);
    setGlobalWrapper(GetClassLongPtr);
    setGlobalWrapper(GetWindowLongPtr);
    
    setGlobalWrapper(GetLastError);
    setGlobalWrapper(_com_error);
    setGlobalWrapper(Beep);

    setGlobalConst(DWLP_DLGPROC);
    setGlobalConst(DWLP_MSGRESULT);
    setGlobalConst(DWLP_USER);

    setGlobalConst(GCL_CBCLSEXTRA); setGlobalConst(GCL_CBWNDEXTRA); setGlobalConst(GCLP_HBRBACKGROUND); setGlobalConst(GCLP_HCURSOR); setGlobalConst(GCLP_HICON); setGlobalConst(GCLP_HICONSM); setGlobalConst(GCLP_HMODULE); setGlobalConst(GCLP_MENUNAME); setGlobalConst(GCL_STYLE); setGlobalConst(GCLP_WNDPROC);

    setGlobalConst(GWL_EXSTYLE); setGlobalConst(GWLP_HINSTANCE); setGlobalConst(GWLP_ID); setGlobalConst(GWL_STYLE); setGlobalConst(GWLP_USERDATA); setGlobalConst(GWLP_WNDPROC);
    setGlobalWrapper(GetSystemMetrics);
    setGlobalConst(SM_ARRANGE); setGlobalConst(SM_CLEANBOOT); setGlobalConst(SM_CMONITORS); setGlobalConst(SM_CMOUSEBUTTONS); setGlobalConst(SM_CONVERTIBLESLATEMODE); setGlobalConst(SM_CXBORDER); setGlobalConst(SM_CXCURSOR); setGlobalConst(SM_CXDLGFRAME); setGlobalConst(SM_CXDOUBLECLK); setGlobalConst(SM_CXDRAG); setGlobalConst(SM_CXEDGE); setGlobalConst(SM_CXFIXEDFRAME); setGlobalConst(SM_CXFOCUSBORDER); setGlobalConst(SM_CXFRAME); setGlobalConst(SM_CXFULLSCREEN); setGlobalConst(SM_CXHSCROLL); setGlobalConst(SM_CXHTHUMB); setGlobalConst(SM_CXICON); setGlobalConst(SM_CXICONSPACING); setGlobalConst(SM_CXMAXIMIZED); setGlobalConst(SM_CXMAXTRACK); setGlobalConst(SM_CXMENUCHECK); setGlobalConst(SM_CXMENUSIZE); setGlobalConst(SM_CXMIN); setGlobalConst(SM_CXMINIMIZED); setGlobalConst(SM_CXMINSPACING); setGlobalConst(SM_CXMINTRACK); setGlobalConst(SM_CXPADDEDBORDER); setGlobalConst(SM_CXSCREEN); setGlobalConst(SM_CXSIZE); setGlobalConst(SM_CXSIZEFRAME); setGlobalConst(SM_CXSMICON); setGlobalConst(SM_CXSMSIZE); setGlobalConst(SM_CXVIRTUALSCREEN); setGlobalConst(SM_CXVSCROLL); setGlobalConst(SM_CYBORDER); setGlobalConst(SM_CYCAPTION); setGlobalConst(SM_CYCURSOR); setGlobalConst(SM_CYDLGFRAME); setGlobalConst(SM_CYDOUBLECLK); setGlobalConst(SM_CYDRAG); setGlobalConst(SM_CYEDGE); setGlobalConst(SM_CYFIXEDFRAME); setGlobalConst(SM_CYFOCUSBORDER); setGlobalConst(SM_CYFRAME); setGlobalConst(SM_CYFULLSCREEN); setGlobalConst(SM_CYHSCROLL); setGlobalConst(SM_CYICON); setGlobalConst(SM_CYICONSPACING); setGlobalConst(SM_CYKANJIWINDOW); setGlobalConst(SM_CYMAXIMIZED); setGlobalConst(SM_CYMAXTRACK); setGlobalConst(SM_CYMENU); setGlobalConst(SM_CYMENUCHECK); setGlobalConst(SM_CYMENUSIZE); setGlobalConst(SM_CYMIN); setGlobalConst(SM_CYMINIMIZED); setGlobalConst(SM_CYMINSPACING); setGlobalConst(SM_CYMINTRACK); setGlobalConst(SM_CYSCREEN); setGlobalConst(SM_CYSIZE); setGlobalConst(SM_CYSIZEFRAME); setGlobalConst(SM_CYSMCAPTION); setGlobalConst(SM_CYSMICON); setGlobalConst(SM_CYSMSIZE); setGlobalConst(SM_CYVIRTUALSCREEN); setGlobalConst(SM_CYVSCROLL); setGlobalConst(SM_CYVTHUMB); setGlobalConst(SM_DBCSENABLED); setGlobalConst(SM_DEBUG); setGlobalConst(SM_DIGITIZER); setGlobalConst(SM_IMMENABLED); setGlobalConst(SM_MAXIMUMTOUCHES); setGlobalConst(SM_MEDIACENTER); setGlobalConst(SM_MENUDROPALIGNMENT); setGlobalConst(SM_MIDEASTENABLED); setGlobalConst(SM_MOUSEPRESENT); setGlobalConst(SM_MOUSEHORIZONTALWHEELPRESENT); setGlobalConst(SM_MOUSEWHEELPRESENT); setGlobalConst(SM_NETWORK); setGlobalConst(SM_PENWINDOWS); setGlobalConst(SM_REMOTECONTROL); setGlobalConst(SM_REMOTESESSION); setGlobalConst(SM_SAMEDISPLAYFORMAT); setGlobalConst(SM_SECURE); setGlobalConst(SM_SERVERR2); setGlobalConst(SM_SHOWSOUNDS); setGlobalConst(SM_SHUTTINGDOWN); setGlobalConst(SM_SLOWMACHINE); setGlobalConst(SM_STARTER); setGlobalConst(SM_SWAPBUTTON); setGlobalConst(SM_SYSTEMDOCKED); setGlobalConst(SM_TABLETPC); setGlobalConst(SM_XVIRTUALSCREEN); setGlobalConst(SM_YVIRTUALSCREEN);
    setGlobalConst(ARW_BOTTOMLEFT); setGlobalConst(ARW_BOTTOMRIGHT); setGlobalConst(ARW_TOPLEFT); setGlobalConst(ARW_TOPRIGHT);
    setGlobalConst(ARW_DOWN); setGlobalConst(ARW_HIDE); setGlobalConst(ARW_LEFT); setGlobalConst(ARW_RIGHT); setGlobalConst(ARW_UP);

    setGlobalConst(HS_BDIAGONAL); setGlobalConst(HS_CROSS); setGlobalConst(HS_DIAGCROSS); setGlobalConst(HS_FDIAGONAL); setGlobalConst(HS_HORIZONTAL); setGlobalConst(HS_VERTICAL);

    //global->Set(isolate, "HELP", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
    //    using namespace v8;
    //    Isolate* isolate = info.GetIsolate();
    //    HandleScope handle_scope(isolate);
    //    //print(CStringFI(info[0]));
    //    //const char* shit = (const char*)IntegerFI(info[0]);
    //    std::string shit = *(std::string*)IntegerFI(info[0]);
    //    print(shit);
    //}));

    global->Set(isolate, "wprint", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        using namespace v8;
        Isolate* isolate = info.GetIsolate();
        HandleScope handle_scope(isolate);
        //when you forgot your headphones at home and you gotta listen to DELTARUNE music (chillin on thuh weekend like USUAL,  watching spongebob and scobydobydo)
        //Local<String> shit = info[0].As<String>();
        // 
        //std::wstring shit = std::wstring((const wchar_t*)(*String::Value(isolate, info[0])));

        wprint(WStringFI(info[0]));
        MessageBox(NULL, WStringFI(info[0]), L"wprint using Utf16 (wchar_t)", MB_OK);
    }));
    
//#define setGlobal(name) global->Set(isolate, "name", v8::FunctionTemplate::New(isolate, name));
    //wait a funking mineite i was on to ssomething
    //setGlobalWrapper(BitBlt);
    //setGlobal(Msgbox);

    //https://stackoverflow.com/questions/37385102/failed-to-draw-on-desktopwindow GRRRRR (why are people so against drawing to the screen JUST EXPLAIN IT (i might have to make a youtube video talking abaout drawing to the desktop))

    return Context::New(isolate, NULL, global);

}

//int main(int argc, char* argv[]) {
class outbuf : public std::streambuf {
public:
    outbuf() {
        setp(0, 0);
    }

    virtual int_type overflow(int_type c = traits_type::eof()) {
        return fputc(c, stdout) == EOF ? traits_type::eof() : c;
    }
};

int WINAPI WinMain(HINSTANCE hInst, HINSTANCE hPrevInstance, char* nCmdList, int nCmdShow)
{
    hInstance = hInst;
    screenWidth = GetSystemMetrics(SM_CXSCREEN); //only used for SendInput
    screenHeight = GetSystemMetrics(SM_CYSCREEN); //only used for SendInput
    //uv_loop = uv_default_loop(); //LO!
    //RedirectIOToConsole();
    
    //if (AllocConsole()) {
    //    freopen("CONOUT$", "w", stdout);
    //    SetConsoleTitle(L"Ligature Debug Console");
    //    SetConsoleTextAttribute(GetStdHandle(STD_OUTPUT_HANDLE), FOREGROUND_GREEN | FOREGROUND_BLUE | FOREGROUND_RED);
    //}

    //outbuf ob;
    //std::streambuf* sb = std::cout.rdbuf(&ob);

    AllocConsole();

    BindCrtHandlesToStdHandles(true, true, true);

    SetConsoleTextAttribute(GetStdHandle(STD_OUTPUT_HANDLE), 4); //https://stackoverflow.com/questions/4053837/colorizing-text-in-the-console-with-c

    //print("uhhh i need to define like 300 globals like MB_OK SRCCOPY and all WM macros kthxbai");

    //print("uhhh i need to define like 100 WM_ global macros kthxbai");
    print(sizeof(int) << " " << sizeof(long) << " " << sizeof(LONG_PTR));
    print("also i MUST consider adding convenience functions like setting the color of objects that don't support it (by creating new ones)");
    print("[D2D] UNFORTUNATELY i need to use create text layout some where for font boldness and the like");
    //print("replace all using of RGB() with a js function");
    //print("figure out win timers"); //i couldn't be bothered to immediately figure it out because the param names seems so weird that i couldn\'t be beothereed
    //print("maybe do send input but if i can't i can't");
    //print("investigate 3/11 -> why does SetClassLongPtr AND GetWindowLongPtr not work?"); //haha i can change the icons now! (it wasn't working because i was using WINCLASS instead of the EX versions)
    print(/*"GDI CreateFont and CreateWindowExA AND */"use ID2D1BitmapBrush1!");

    SetConsoleTextAttribute(GetStdHandle(STD_OUTPUT_HANDLE), 7);

    //ok 1.3.2 because i changed child_process to system
    //1.3.3 because i finally figured out how to get Utf16 strings as wchars
    //1.4.3 because i finally figured out how to get Utf16 strings as wchars (and completely changed how CreateWindow works)
    //1.4.7 because i added loads of Dwm functions aswell as SetWindowCompositionAttribute
    //1.4.99 finally figured out UpdateLayeredWindow
    //1.5.99 because i totally changed how WIC works (and had to update like half the scripts) and we are SO close to getting DXGI, DIRECT3D, AND OPENGL (it's about to be brazy)
    //1.5.33 because i realized 1.6.0 should be when i add all of them (i've only added OPENGL)
    print("JBS3 -> Version 1.5.33"); //so idk how normal version things work so the first number will probably stay one --- i will increment the second number if i change an existing function like when i remade the CreateWindowClass and CreateWindow functions --- i might random increment the third number if i feel like it
    print(screenWidth << "x" << screenHeight);
    

    CoInitialize(NULL);

    //system("pause");
    //print(SetClassLongPtr(FindWindow(NULL, L"jbs"),          // window handle 
    //    GCLP_HICON,              // changes icon 
    //    (LONG_PTR)LoadIcon(hInstance, (LPCWSTR)IDI_INFORMATION)
    //));
    //print(GetLastError());
    //https://learn.microsoft.com/en-us/windows/win32/menurc/using-icons
    //print(GetWindowLongPtrA(GetConsoleWindow(), GWLP_HINSTANCE) << " " << hInstance << " " << GetLastError());
    // 
    //NIGGA WHAT THIS ISN"T A COMMENT???????????
https://forums.codeguru.com/showthread.php?69236-How-to-obtain-HINSTANCE-using-HWND
    //NONCLIENTMETRICS ncm;
    //ncm.cbSize = sizeof(NONCLIENTMETRICS);
    //SystemParametersInfo(SPI_GETNONCLIENTMETRICS, sizeof(NONCLIENTMETRICS), &ncm, 0);
    ////defaultfont = CreateFontIndirect(&ncm.lfMessageFont);


    //int iVar;

    //fprintf(stdout, "Test output to stdout\n");
    //fprintf(stderr, "Test output to stderr\n");
    //fprintf(stdout, "Enter an integer to test stdin: ");
    //scanf_s("%d", &iVar);
    //printf("You entered %d\n", iVar);
    //using namespace std;
    //cout << "Test output to cout" << endl;
    //cerr << "Test output to cerr" << endl;
    //clog << "Test output to clog" << endl;
    //cout << "Enter an integer to test cin: ";
    //cin >> iVar;
    //cout << "You entered " << iVar << endl;

    //LPWSTR* argv;
    //int argCount;
    //
    //argv = CommandLineToArgvW(GetCommandLineW(), &argCount);
    //
    //print(nCmdList);
    //
    //printf("nigge %d\n", nCmdShow);
    //if (argCount) {
    //    print(argCount << " " << *argv[0] << " " << *argv[1] << " " << nCmdShow << " NIGGEr");
    //}
    //Sleep(20000);

    //std::cout.rdbuf(sb);
    //return 0;
    print("CMDS-> [" << nCmdList);


    // Initialize V8.
    if (strlen(nCmdList) == 0) {
        std::cout << "PATH, NIGGA! (bellunicode\x07)" << std::endl;
        print("but wait a minute, lemme pull out that node.js");
        //system("pause");
        //return -1;
    }
    else if (strcmp(nCmdList,"--help")==0) {
        print("yo we got functions like require and and child_process and and uhhh setBackground idk man just do for in globalThis :sob:");
        system("pause");
        return -1;
    }

    char exe[MAX_PATH]; GetModuleFileNameA(NULL, exe, MAX_PATH);
    print(exe);

    v8::V8::InitializeICUDefaultLocation(exe);//argv[0]); //is this even doing anything ???
    v8::V8::InitializeExternalStartupData(exe);//argv[0]);
    std::unique_ptr<v8::Platform> platform = v8::platform::NewDefaultPlatform();
    v8::V8::InitializePlatform(platform.get());
    v8::V8::Initialize();
    
    // Create a new Isolate and make it the current one.
    v8::Isolate::CreateParams create_params;
    create_params.array_buffer_allocator =
        v8::ArrayBuffer::Allocator::NewDefaultAllocator();
    v8::Isolate* isolate = v8::Isolate::New(create_params);
    {
        v8::Isolate::Scope isolate_scope(isolate);
    
        // Create a stack-allocated handle scope.
        v8::HandleScope handle_scope(isolate);
    
       // v8::TryCatch trycatch(isolate);
        // Create a new context.
        v8::Local<v8::Context> context = InitGlobals(isolate, nCmdList);//argv[1]);//v8::Context::New(isolate, NULL, global);
    
        // Enter the context for compiling and running the hello world script.
        v8::Context::Scope context_scope(context);
    
        {
            // Create a string containing the JavaScript source code.
            
            //char* shit = nullptr;
            //
            //std::cin >> shit;
            //
            //std::cout << shit << std::endl;
            std::stringstream buffer;
    
            std::string shit;
    
            std::string args(nCmdList);
            if (args[0] == '"') {
                args = args.substr(1, args.find('"', 1)-1); //sounds right
                print("ARGS::" << args);
            }


            std::ifstream file(args);//argv[1]);
    
            if (file.is_open()) {
                print("working file ok good " << args << " ;");
                //i hate reading files in c++
                buffer << file.rdbuf();
                shit = buffer.str();
    
                //while (file) {
                //    getline(file, shit);
                //    print(shit);
                //}
                //print(shit);
            }
            else {
                print("ok buddy what is this file dumb nass nigasg " << nCmdList);
                print("lemme hear you out tho for a second");
                shit = nCmdList; //i did not know that equals sign was overloaded
            }
    
            file.close();

            //allow me to pull a node.js
            if (strlen(nCmdList) != 0) {

                v8::Local<v8::String> source = v8::String::NewFromUtf8(isolate, shit.c_str(), v8::NewStringType::kNormal, shit.length()).ToLocalChecked();//v8::String::NewFromUtf8(isolate, (const char*)shit, v8::NewStringType::kNormal, strlen(shit)).ToLocalChecked();
                //v8::String::NewFromUtf8Literal(isolate, shit);//"'Hello' + ', World!'");

            // Compile the source code.
                //v8::Local<v8::Script> script =
                //    v8::Script::Compile(context, source).ToLocalChecked();
                //
                //// Run the script to get the result.
                //v8::Local<v8::Value> result = script->Run(context).ToLocalChecked();
                //
                //// Convert the result to an UTF8 string and print it.
                //v8::String::Utf8Value utf8(isolate, result);
                //printf("%s\n", *utf8);

                v8::Local<v8::Script> script;
                if (v8::Script::Compile(context, source).ToLocal(&script)) {
                    // Run the script to get the result.
                    v8::Local<v8::Value> result;
                    if (script->Run(context).ToLocal(&result)) {
                        // Convert the result to an UTF8 string and print it.
                        //v8::String::Utf8Value utf8(isolate, result);
                        //printf("%s\n", *utf8);
                        using namespace v8;
                        //if (!result->IsNullOrUndefined()) { //huh i wonder why i included this
                            printf("%s", Highlight(isolate, GetStdHandle(STD_OUTPUT_HANDLE), result));
                            printf("%s", CStringFI(result));

                            printf("\n");
                            fflush(stdout);
                            SetConsoleTextAttribute(GetStdHandle(STD_OUTPUT_HANDLE), 7);
                        //}
                    }
                }
                //using namespace v8;
                //print(CStringFI(trycatch.Message()->Get()));
            }
            else {
                while (true) {
                    char scriptcstr[256];
                    std::cout << ">>> ";
                    std::cin.getline(scriptcstr, 256);

                    if (strcmp(scriptcstr, "exit") == 0 || strcmp(scriptcstr, "quit") == 0) {
                        break;
                    }

                    //std::string scriptstring = "try {\n"+std::string(scriptcstr)+"\n}catch(e) {\nprint(e);\n}";

                    v8::Local<v8::String> source = v8::String::NewFromUtf8(isolate, scriptcstr, v8::NewStringType::kNormal, strlen(scriptcstr)).ToLocalChecked();//v8::String::NewFromUtf8(isolate, (const char*)shit, v8::NewStringType::kNormal, strlen(shit)).ToLocalChecked();
                    //v8::String::NewFromUtf8Literal(isolate, shit);//"'Hello' + ', World!'");

                // Compile the source code.
                    v8::Local<v8::Script> script;
                    if (v8::Script::Compile(context, source).ToLocal(&script)) {
                        // Run the script to get the result.
                        v8::Local<v8::Value> result;
                        if (script->Run(context).ToLocal(&result)) {
                            // Convert the result to an UTF8 string and print it.
                            //v8::String::Utf8Value utf8(isolate, result);
                            //printf("%s\n", *utf8);
                            using namespace v8;
                            //if (!result->IsNullOrUndefined()) {
                                printf("%s", Highlight(isolate, GetStdHandle(STD_OUTPUT_HANDLE), result));
                                printf("%s", CStringFI(result));

                                printf("\n");
                                fflush(stdout);
                                SetConsoleTextAttribute(GetStdHandle(STD_OUTPUT_HANDLE), 7);
                            //}
                        }
                    }
                }
            }
        }
    
//        {
//            // Use the JavaScript API to generate a WebAssembly module.
//            //
//            // |bytes| contains the binary format for the following module:
//            //
//            //     (func (export "add") (param i32 i32) (result i32)
//            //       get_local 0
//            //       get_local 1
//            //       i32.add)
//            //
//            const char csource[] = R"(
//        let bytes = new Uint8Array([
//          0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x07, 0x01,
//          0x60, 0x02, 0x7f, 0x7f, 0x01, 0x7f, 0x03, 0x02, 0x01, 0x00, 0x07,
//          0x07, 0x01, 0x03, 0x61, 0x64, 0x64, 0x00, 0x00, 0x0a, 0x09, 0x01,
//          0x07, 0x00, 0x20, 0x00, 0x20, 0x01, 0x6a, 0x0b
//        ]);
//        let module = new WebAssembly.Module(bytes);
//        let instance = new WebAssembly.Instance(module);
//        instance.exports.add(3, 4);
//      )";
//  
//            // Create a string containing the JavaScript source code.
//            v8::Local<v8::String> source =
//                v8::String::NewFromUtf8Literal(isolate, csource);
//  
//            // Compile the source code.
//            v8::Local<v8::Script> script =
//                v8::Script::Compile(context, source).ToLocalChecked();
//  
//            // Run the script to get the result.
//            v8::Local<v8::Value> result = script->Run(context).ToLocalChecked();
//  
//            // Convert the result to a uint32 and print it.
//            uint32_t number = result->Uint32Value(context).ToChecked();
//            printf("3 + 4 = %u\n", number);
//        }
    }
    
    // Dispose the isolate and tear down V8.
    isolate->Dispose();
    v8::V8::Dispose();
    v8::V8::DisposePlatform();
    delete create_params.array_buffer_allocator;

    system("pause");

    return 0;
}
//#include "include/v8-exception.h"
//#include <windowsx.h>
LRESULT CALLBACK WinProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
    using namespace v8;
    Isolate* isolate = (Isolate*)GetWindowLongPtr(hwnd, GWLP_USERDATA);

    //Local<Function> listener = wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("windowProc")).ToLocalChecked().As<Function>();
    //Local<Value> args[] = { Number::New(isolate, (size_t)hwnd), Number::New(isolate, msg) };
    //Local<Value> result = listener->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 1, args).ToLocalChecked();
    //print(CStringFI(result));
    if (isolate != nullptr || msg == WM_CREATE) {
        if (msg == WM_CREATE) isolate = (Isolate*)(((CREATESTRUCTW*)lp)->lpCreateParams);  //usually i don't do single line if statements but im feeling quirky
        //print(isolate << " " << lp << " " << (msg == WM_CREATE));// << " random data " << isolate->GetCurrentContext()->IsContext());
        HandleScope handle_scope(isolate); //slapping this bad boy in here
                 //oof im still mad about this global i gotta fix that at some point (you cannot create 2 main windows (idk when you would want to but))
        Local<Function> listener = wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("windowProc")).ToLocalChecked().As<Function>();
        Local<Value> args[] = { Number::New(isolate, (LONG_PTR)hwnd),  Number::New(isolate, msg), Number::New(isolate, wp), Number::New(isolate, lp)};
       // Local<Value> result;
        v8::TryCatch shit(isolate);
        /*Local<Value> result = */
        //Local<TryCatch> shit(isolate);
        MaybeLocal<Value> returnedValue = listener->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 4, args);
        //                                   the point of the ToLocal &result thing was because i thought it would do error checking and tell me
        //if (listener->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 4, args).ToLocal(&result)) { //   ;/*.ToLocalChecked()*/;
            //print(CStringFI(result));
            //print("valid")
        //}
        //if (shit.HasCaught()) {
        //    HANDLE console = GetStdHandle(STD_OUTPUT_HANDLE);
        //    SetConsoleTextAttribute(console, 4);
        //    print(CStringFI(shit.Message()->Get()) << "\007"); //ok WAIT in the last push i talked about "performance loss" from using trycatch but apparently since v8 version 6 (im using 11.9.0) try catch doesn't affect performance UNTIL there is an exception https://stackoverflow.com/questions/19727905/in-javascript-is-it-expensive-to-use-try-catch-blocks-even-if-an-exception-is-n
        //    SetConsoleTextAttribute(console, 7);
        //    //last time i googled "v8 try catch performance" i saw the first link and it said "there will always be some sort of performance hit" but that was probably written years ago (yeah the <meta> tags say it was published in 2013)
        //}
        CHECKEXCEPTIONS(shit);
        bool def = IntegerFI(wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("DefWindowProc")).ToLocalChecked());
        if (!def) {
            return IntegerFI(returnedValue.ToLocalChecked());
        }
        else {
            return DefWindowProcW(hwnd, msg, wp, lp);
        }
        //return def ? DefWindowProcW(hwnd, msg, wp, lp) : 0;
    }
    //if (msg == WM_PAINT) {
    //    //PAINTSTRUCT ps;
    //    //BeginPaint(hwnd, &ps);
    //    //
    //    //const char* className = CStringFI(wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("className")).ToLocalChecked());
    //    //
    //    //TextOutA(ps.hdc, 100, 100, className, strlen(className));
    //    //
    //    //EndPaint(hwnd, &ps);
    //}
    //else 
    //if (msg == WM_DESTROY) {
        //DestroyWindow(hwnd);
    //    PostQuitMessage(0);
    //}
    print("NULL?" << msg);
    return DefWindowProcW(hwnd, msg, wp, lp);; //uh
}