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
#include <comdef.h>

#include "include/libplatform/libplatform.h"
#include "include/v8-context.h"
#include "include/v8-initialization.h"
#include "include/v8-isolate.h"
#include "include/v8-local-handle.h"
#include "include/v8-primitive.h"
#include "include/v8-script.h"
#include "include/v8-template.h"
#include <include/v8-function.h>
#include <include/v8-container.h>

//https://medium.com/angular-in-depth/how-to-build-v8-on-windows-and-not-go-mad-6347c69aacd4
//https://v8.dev/docs/embed
//https://chromium.googlesource.com/v8/v8/+/branch-heads/6.8/samples/hello-world.cc

// the v8_base_without_compiler.lib was corrupt everytime i built it and i KEPT TRYING and eventually found out i had to build v8_monolith.lib
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

#include <sstream>
#include <windows.h>
//#include "guicon.h"
#include "console2.h"
#include <wincodec.h>

#pragma comment(lib, "windowscodecs.lib")

#define LITERAL(cstr) String::NewFromUtf8Literal(isolate, cstr)

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
        printf("%s", Highlight(info.GetIsolate(), console, info[i]));
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
        std::stringstream buffer;

        std::string shit;

        std::ifstream file(*String::Utf8Value(info.GetIsolate(), info[0]));//, std::ios::binary);

        if (file.is_open()) {
            
            //i hate reading files in c++
            buffer << file.rdbuf();
            shit = buffer.str();
            //std::string tempstring(shit.size(), '#');
            //v8::Local<String> str = String::NewFromUtf8(info.GetIsolate(), tempstring.c_str()).ToLocalChecked();
            //str->WriteOneByte(info.GetIsolate(), (uint8_t*)(shit.c_str()), 0, shit.length(), v8::String::NO_NULL_TERMINATION);
            //str->WriteUtf8(info.GetIsolate(), (char*)shit.c_str(), shit.length(),nullptr, v8::String::NO_NULL_TERMINATION);

                info.GetReturnValue().Set(String::NewFromUtf8(info.GetIsolate(), shit.c_str()).ToLocalChecked());
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

        std::stringstream buffer;

        std::string shit;

        std::ifstream file(*String::Utf8Value(info.GetIsolate(), info[0]), std::ios::binary);

        if (file.is_open()) {

            buffer << file.rdbuf();
            shit = buffer.str();

            Local<Array> jsArray = Array::New(isolate, shit.size());
            for (int i = 0; i < shit.size(); i++) {
                jsArray->Set(isolate->GetCurrentContext(), i, Number::New(isolate, shit[i]));
            }

            //std::string* fuck = new std::string(shit); //it's giving undefined behavior

            //ok i works but i could just pass an array of chars (ints) //probably use arraybuffer because i think thats what browsers do for files maybe idk

            //char* stringPtr = new char[shit.size()]; //uh oh
            //strcpy(stringPtr, shit.c_str());
            //strncpy(stringPtr, shit.c_str(), shit.size());
            //memcpy(stringPtr, shit.c_str(), shit.size()); //shit.c_str() gets cut off!
            //print(stringPtr << " shit->" << shit.c_str() << " " << shit);

            //info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)fuck/*stringPtr*/));//String::NewFromUtf8(info.GetIsolate(), shit.c_str()).ToLocalChecked());
            info.GetReturnValue().Set(jsArray);
            //print(shit << " youcanstandundermyinbrelela" << shit.size());
        }
        else {
            info.GetReturnValue().SetUndefined();
        }

        file.close();
    }

    void write(const v8::FunctionCallbackInfo<v8::Value>& info) {
        using v8::String;
        std::ofstream file(*String::Utf8Value(info.GetIsolate(), info[0]));

        if (file.is_open()) {
            //file.write(*String::Utf8Value(info.GetIsolate(), info[1]), );
            file << *String::Utf8Value(info.GetIsolate(), info[1]);
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

void SystemWrapper(const v8::FunctionCallbackInfo<v8::Value>& info) {
    info.GetReturnValue().Set(system(*v8::String::Utf8Value(info.GetIsolate(), info[0])));
}

void setBackground(const v8::FunctionCallbackInfo<v8::Value>& info) {
    //ok so there are 2 versions of JBS and for some reason in the last one this was a function so im adding it again
    info.GetReturnValue().Set(SystemParametersInfo(SPI_SETDESKWALLPAPER, 0, *v8::String::Utf8Value(info.GetIsolate(), info[0]), SPIF_UPDATEINIFILE));
}

void Msgbox(const v8::FunctionCallbackInfo<v8::Value>& info) {
    using namespace v8;
    info.GetReturnValue().Set(MessageBoxA(NULL, *String::Utf8Value(info.GetIsolate(), info[0]), *String::Utf8Value(info.GetIsolate(), info[1]), info[2].As<Number>()->IntegerValue(info.GetIsolate()->GetCurrentContext()).FromJust()));
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
        const char** data = (const char**)lParam;
        print(data[0] << " " << data[1] << " " << data[2]);
        //print(dlg.title);
        //print(dlg.description);
        //print(dlg.input);
        SetWindowTextA(hwnd, data[1]);//dlg.title);
        //SetDlgItemTextA(hwnd, IDC_BUTTON1, dlg->description);
        SetDlgItemTextA(hwnd, IDC_STATIC1, data[0]);//dlg.description);
        SetDlgItemTextA(hwnd, IDC_EDIT1, data[2]);//dlg.input);

        return TRUE;
    }
    case WM_COMMAND:
        switch (LOWORD(wParam))
        {
        case IDOK:
            char shit[100];
            //GetWindowTextA(GetDlgItem, shit, 100);
            GetDlgItemTextA(hwnd, IDC_EDIT1, shit, 100);
            print(shit);
            *(bool*)GetWindowLongPtr(hwnd, GWLP_USERDATA) = true;
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
#define CStringFI(e) *String::Utf8Value(isolate, e)
#define IntegerFI(e) e/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust()
#define FloatFI(e) e.As<Number>()->Value()

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
    const char* data[3]{ CStringFI(info[0]), CStringFI(info[1]), CStringFI(info[2]) };
    print(data[0] << " " << data[1] << " " << data[2]);
    SendMessageA(dialog, WM_HELP, NULL, (LPARAM) & data);
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
    char shit[100];
    //GetWindowTextA(GetDlgItem, shit, 100);
    GetDlgItemTextA(dialog, IDC_EDIT1, shit, 100);

    info.GetReturnValue().Set(String::NewFromUtf8(isolate, shit).ToLocalChecked());
    //char shit[100];
    ////GetWindowTextA(GetDlgItem, shit, 100);
    //GetDlgItemTextA(dialog, IDC_EDIT1, shit, 100);
    //print(shit);

    //print(WaitForSingleObject(dialog, 100000) << " wait " << GetLastError());
}

#define V8FUNC(name) void name(const v8::FunctionCallbackInfo<v8::Value>& info)

//V8FUNC(nigga) {
//    
//}

//namespace Window {
//    V8FUNC(addEventListener) {
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

    print("deleting lps");

    delete lps; //phew
}

V8FUNC(GetDCWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    HWND window = NULL;
    if (info[0]->IsNumber()) {
        window = (HWND)IntegerFI(info[0]);
    }
    //print(window << " get dc window == " << (HWND)NULL);
    info.GetReturnValue().Set(Number::New(info.GetIsolate(), (long long)GetDC(window)));
}

V8FUNC(ReleaseDCWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    HWND window = NULL;
    if (info[0]->IsNumber()) {
        window = (HWND)IntegerFI(info[0]);
    }
    info.GetReturnValue().Set(Number::New(info.GetIsolate(), ReleaseDC(window, (HDC)IntegerFI(info[1]))));
}

V8FUNC(TextOutWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    HDC dc = (HDC)IntegerFI(info[0]);
    const char* words = CStringFI(info[3]);
    //print(words << " words");
    info.GetReturnValue().Set(TextOutA(dc, IntegerFI(info[1]), IntegerFI(info[2]), words, strlen(words)));
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
    info.GetReturnValue().Set(GetAsyncKeyState(key) & 0x1); //0x01 and 0x1 AND 0x001 work the same?
}

V8FUNC(PostQuitMessageWrapper) {
    PostQuitMessage(0);
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
    info.GetReturnValue().Set(Number::New(isolate, DrawTextA((HDC)IntegerFI(info[0]), CStringFI(info[1]), -1, &r, IntegerFI(info[6]))));
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

    info.GetReturnValue().Set(Number::New(isolate, (long long)GetStockObject(IntegerFI(info[0]))));
}

V8FUNC(FindWindowWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    const char* className = NULL;
    if (!info[0]->IsNullOrUndefined() && info[0]->IsString()) {
        className = CStringFI(info[0]);
    }

    info.GetReturnValue().Set(Number::New(isolate, (long long)FindWindowA(className, CStringFI(info[1]))));
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

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)CreateFontA(IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]), IntegerFI(info[5]), IntegerFI(info[6]), IntegerFI(info[7]), IntegerFI(info[8]), IntegerFI(info[9]), IntegerFI(info[10]), IntegerFI(info[11]), IntegerFI(info[12]), CStringFI(info[13]))));
}

V8FUNC(CreateFontSimpleWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)CreateFontA(IntegerFI(info[2]), IntegerFI(info[1]), 0, 0, FW_DONTCARE, FALSE, FALSE, FALSE, DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, CStringFI(info[0]))));
}

V8FUNC(CreateFontIndirectWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    LOGFONTA lplf{0};

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
    strcpy(lplf.lfFaceName, CStringFI(GetProperty("lfFaceName")));
    //lplf.lfFaceName = CStringFI(GetProperty("lfFaceName"));

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)CreateFontIndirectA(&lplf)));
}

int CALLBACK EnumFontFamExProc(const LOGFONTA* lpelfe, const TEXTMETRICA* lpntme, DWORD FontType, LPARAM lParam) {
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
    SetPropertyRaw(jsLOGFONT, "lfFaceName", String::NewFromUtf8(isolate, lpelfe->lfFaceName).ToLocalChecked());
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

    LOGFONTA digga{ 0 };
    digga.lfCharSet = DEFAULT_CHARSET;
    
    //digga.lfFaceName[0] = '\0';
    //digga.lfPitchAndFamily; //https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-enumfontfamiliesexa

    EnumFontFamiliesExA((HDC)IntegerFI(info[0]), &digga, EnumFontFamExProc, (LPARAM)&info, NULL);
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

#include "Direct2D.h"

#pragma comment(lib, "d2d1.lib")
#pragma comment(lib, "dwrite.lib")

//float lerp(float a, float b, float f)
//{
//    return a * (1.0 - f) + (b * f);
//}

namespace DIRECT2D {
    using namespace v8;
    Local<ObjectTemplate> getDefaultBrushImpl(Isolate* isolate, ID2D1Brush* newBrush, const char* type = "solid") {
        Local<ObjectTemplate> jsBrush = ObjectTemplate::New(isolate);

        jsBrush->Set(isolate, "internalPtr", Number::New(isolate, (LONG_PTR)newBrush));

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
        jsBrush->Set(isolate, "Release", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            ID2D1Brush* newBrush = (ID2D1Brush*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            newBrush->Release();
        }));

        return jsBrush;
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

    Local<Object> getMatrixImpl(Isolate* isolate, D2D1_MATRIX_3X2_F matrix) {
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

    ID2D1Brush* AdjustGradients(Isolate* isolate, Local<Object> jsBrush, D2D1_POINT_2F point0, D2D1_POINT_2F point1, float angle = 0.0F) {
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
        d2d->Init(info[2]->IsNumber() ? (HWND)IntegerFI(info[2]) : (HWND)NULL, IntegerFI(info[1]));

        context->Set(isolate, "internalDXPtr", Number::New(isolate, (LONG_PTR)d2d));
        context->Set(isolate, "renderTarget", Number::New(isolate, (LONG_PTR)d2d->renderTarget));
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
            MessageBoxA(NULL, "SetFontSize does NOT work yet", "CreateFont", MB_OK | MB_ICONWARNING);
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

            const char* text = CStringFI(info[0]);
            size_t length = strlen(text);
            std::wstring filenamews(length, L'#');
            mbstowcs(&filenamews[0], text, length);

            HRESULT shit = d2d->wicFactory->CreateDecoderFromFilename(filenamews.c_str(), NULL, GENERIC_READ, WICDecodeMetadataCacheOnLoad, &wicDecoder);
            if (shit != S_OK) {
                MessageBoxA(NULL, "NewWICBitmap likely failed because the file was not found", "yeah we failed that hoe (CreateDecoderFromFilename)", MB_OK | MB_ICONERROR);
                return;
            }

            IWICBitmapFrameDecode* wicFrame = NULL;
            shit = wicDecoder->GetFrame(0, &wicFrame);

            if (shit != S_OK) {
                MessageBoxA(NULL, "GetFirstFrameWiC", "yeah we failed the hoe (wicDecoder->GetFrame(0, &wicFrame))", MB_OK | MB_ICONERROR);
                return;
            }

            IWICFormatConverter* wicConverter = NULL;
            shit = d2d->wicFactory->CreateFormatConverter(&wicConverter);

            if (shit != S_OK) {
                MessageBoxA(NULL, "Wic converter", "failed wicFactory->CreateFormatConverter(&wicConverter)", MB_OK | MB_ICONERROR);
                return;
            }

            shit = wicConverter->Initialize(wicFrame, GUID_WICPixelFormat32bppPBGRA, WICBitmapDitherTypeNone, NULL, 0.0, WICBitmapPaletteTypeCustom);
            if (shit != S_OK) {
                MessageBoxA(NULL, "WIC CONVERTER2", "failed wicConverter->Initialize", MB_OK | MB_ICONERROR);
                return;
            }

            ID2D1Bitmap* bmp;

            d2d->renderTarget->CreateBitmapFromWicBitmap(wicConverter, NULL, &bmp);

            

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
            MessageBoxA(NULL, "if i can be bothered i might have to implement the transform methods", "buddy i ain't do that yet ok", MB_OK | MB_ICONASTERISK);
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            ID2D1LinearGradientBrush* newBrush;
            ID2D1GradientStopCollection* gSC = (ID2D1GradientStopCollection*)(info[4].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust());
            //print("gSC -> " << (LONG_PTR)gSC);
            //D2D1_GRADIENT_STOP stops[2]; gSC->GetGradientStops(stops, 2);
            //print("stops -> " << stops << " " << stops[0].color.r << " " << stops[0].color.g);

            d2d->renderTarget->CreateLinearGradientBrush(D2D1::LinearGradientBrushProperties(D2D1::Point2F(FloatFI(info[0]), FloatFI(info[1])), D2D1::Point2F(FloatFI(info[2], FloatFI(info[3])))), gSC, &newBrush);//D2D1::ColorF(FloatFI(info[0]), FloatFI(info[1]), FloatFI(info[2]), info[3]->IsNumber() ? FloatFI(info[3]) : 1.0F), & newBrush);//FloatFI(info[3])), &newBrush);
        
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
                newBrush->SetRadiusY(FloatFI(info[1]));
            }));

            info.GetReturnValue().Set(jsBrush->NewInstance(isolate->GetCurrentContext()).ToLocalChecked());
        }));
        context->Set(isolate, "RestoreDrawingState", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            ID2D1DrawingStateBlock* drawingStateBlock;// = (ID2D1DrawingStateBlock*)IntegerFI(info[0]);
            
            if (info[0]->IsNumber()) {
                drawingStateBlock = (ID2D1DrawingStateBlock*)info[0].As<Object>()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust();
            }
            else {
                drawingStateBlock = d2d->drawingStateBlock;
            }
            d2d->renderTarget->RestoreDrawingState(drawingStateBlock);
        }));
        context->Set(isolate, "CreateDrawingStateBlock", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            MessageBoxA(NULL, "warning probably not implemented correctly yet", "get to it lil nigga", MB_OK | MB_ICONEXCLAMATION);
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
            ID2D1DrawingStateBlock* drawingStateBlock;
            HRESULT result = d2d->factory->CreateDrawingStateBlock(D2D1::DrawingStateDescription(), &drawingStateBlock);//D2D1::DrawingStateDescription();
            
            if (result != S_OK) {
                MessageBoxA(NULL, "HELP create drawing state block did NOT work", "uhhhh we need some HELP!", MB_OK | MB_ICONERROR);
                return;
            }

            Local<ObjectTemplate> jsDSB = DIRECT2D::getIUnknownImpl(isolate, d2d->drawingStateBlock);//ObjectTemplate::New(isolate);

            info.GetReturnValue().Set(jsDSB->NewInstance(isolate->GetCurrentContext()).ToLocalChecked());
        }));
        context->Set(isolate, "SaveDrawingState", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
            MessageBoxA(NULL, "warning probably not implemented correctly yet", "get to it lil nigga", MB_OK | MB_ICONEXCLAMATION);
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

        //context->Set(isolate, "GetTransform", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        //    Isolate* isolate = info.GetIsolate();
        //    Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
        //    D2D1_MATRIX_3X2_F* matrix = new D2D1_MATRIX_3X2_F(); d2d->renderTarget->GetTransform(matrix);
        //    
        //    //Local<Object> jsMatrixObj = Object::New(isolate);
        //    //jsMatrixObj->Set(isolate->GetCurrentContext(), LITERAL("dx"), Number::New(isolate, matrix.dx));
        //    //jsMatrixObj->Set(isolate->GetCurrentContext(), LITERAL("dy"), Number::New(isolate, matrix.dy));
        //
        //    //Local<ObjectTemplate> jsMatrix = ObjectTemplate::New(isolate);
        //    //jsMatrix->Set(isolate, "internalPtr", Number::New(isolate, (LONG_PTR)matrix));
        //    //jsMatrix->Set(isolate, "Release", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        //    //    Isolate* isolate = info.GetIsolate();
        //    //    D2D1_MATRIX_3X2_F* matrix = (D2D1_MATRIX_3X2_F*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
        //    //    
        //    //    delete matrix;
        //    //}));
        //
        //    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)matrix));//DIRECT2D::getMatrixImpl(isolate, matrix));
        //}));
        //context->Set(isolate, "SetTransform", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        //    Isolate* isolate = info.GetIsolate();
        //    Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();
        //
        //    D2D1_MATRIX_3X2_F* matrix = (D2D1_MATRIX_3X2_F*)IntegerFI(info[0]);
        //    d2d->renderTarget->SetTransform(matrix);
        //}));
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
    info.GetReturnValue().Set(((int)(short)LOWORD(IntegerFI(info[0]))));
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
    char shit[255];
    GetWindowTextA((HWND)IntegerFI(info[0]), shit, 255);
    info.GetReturnValue().Set(String::NewFromUtf8(isolate, shit).ToLocalChecked());
}

V8FUNC(SetWindowTextWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    
    info.GetReturnValue().Set(SetWindowTextA((HWND)IntegerFI(info[0]), CStringFI(info[1])));
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
    ftn.AlphaFormat = AC_SRC_ALPHA;

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

    delete[] inputs;
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

V8FUNC(LoadImageWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)LoadImageA((HINSTANCE)IntegerFI(info[0]), CStringFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]), IntegerFI(info[5]))));
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
    jsSize->Set(isolate->GetCurrentContext(), LITERAL("cx"), Number::New(isolate, size.cx));
    jsSize->Set(isolate->GetCurrentContext(), LITERAL("cy"), Number::New(isolate, size.cy));

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
    wndclass->Set(isolate->GetCurrentContext(), LITERAL("init"), info[1]);
    wndclass->Set(isolate->GetCurrentContext(), LITERAL("windowProc"), info[2]);
    wndclass->Set(isolate->GetCurrentContext(), LITERAL("loop"), info[3]);
    
    info.GetReturnValue().Set(wndclass);//result);
}

LRESULT CALLBACK WinProc(HWND hWnd, UINT msg, WPARAM wp, LPARAM lp);

v8::Local<v8::Object> wndclass;

V8FUNC(CreateWindowWrapper) {
    //MessageBoxA(NULL, "aw shit another unfiinished hting", "ok so like no cap the only message you can resieve as of now is WM_PAINT", MB_OK | MB_ICONEXCLAMATION);
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    wndclass = info[0].As<Object>();

#define GetProperty(name) wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL(name)).ToLocalChecked()

    //const char* className = *String::Utf8Value(isolate, wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), String::NewFromUtf8Literal(isolate, "className")).ToLocalChecked());
    print(*String::Utf8Value(isolate, wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), String::NewFromUtf8Literal(isolate, "lpszClassName")).ToLocalChecked()));
    //WNDCLASSA wc{ 0 };
    WNDCLASSEXA wc{ 0 };
    wc.cbSize = sizeof(WNDCLASSEXA);
    wc.hbrBackground = (HBRUSH)IntegerFI(GetProperty("hbrBackground"));
    wc.hCursor = (HCURSOR)IntegerFI(GetProperty("hCursor"));
    wc.hIcon = (HICON)IntegerFI(GetProperty("hIcon"));
    wc.hIconSm = (HICON)IntegerFI(GetProperty("hIconSm"));
    HINSTANCE shit = hInstance;
    if (!GetProperty("hInstance")->IsUndefined()) {
        shit = (HINSTANCE)IntegerFI(GetProperty("hInstance"));
    }
    wc.hInstance = shit;
    wc.lpszClassName = CStringFI(GetProperty("lpszClassName"));
    if (!GetProperty("lpszMenuName")->IsUndefined()) {
        wc.lpszMenuName = CStringFI(GetProperty("lpszMenuName"));
    }
    wc.style = IntegerFI(GetProperty("style"));
    wc.lpfnWndProc = WinProc;

    if (!RegisterClassExA(&wc)) {
        info.GetReturnValue().Set(false);
        print("FAILED RegisteClassExA "<<hInstance<< " " << GetModuleHandle(NULL));
        MessageBoxA(NULL, "failed to register window class (keep trying idk why CreateWindow is a little sketchy)", (std::string("err: [") + std::to_string(GetLastError()) + "]").c_str(), MB_OK | MB_ICONERROR);
        return;
    }

    int x = IntegerFI(info[3]);
    int y = IntegerFI(info[4]);
    int width = IntegerFI(info[5]);
    int height = IntegerFI(info[6]);

    print(CStringFI(info[1]) << " " << x << " " << y << " " << width << " " << height);

    HWND newWindow = CreateWindowA(CStringFI(GetProperty("lpszClassName")), CStringFI(info[1]), IntegerFI(info[2]), x, y, width, height, NULL, NULL, hInstance, NULL);

    if (GetLastError() != 0) {
        if (MessageBoxA(NULL, "RESTART JBS because there's a 99% chance that the window was NOT created", "CreateWindow Error Checking", MB_OKCANCEL | MB_ICONWARNING) == IDCANCEL) {
            return;
        }
    }
    MessageBoxA(NULL, (std::string("shit")+std::to_string(GetLastError())).c_str(), "titlke", MB_OKCANCEL); //https://www.youtube.com/watch?v=58OhXFmTUo0
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

    Local<Value> args[] = { Number::New(isolate, (LONG_PTR)newWindow)};

    UpdateWindow(newWindow);
    GetProperty("init").As<Function>()->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 1, args)/*.ToLocalChecked()*/;

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
                looper->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 0, nullptr);
                //print("LOPER CALLED!");

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

    info.GetReturnValue().Set(Number::New(isolate, SendMessageA((HWND)IntegerFI(info[0]), IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]))));
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

    info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)CreateBitmap(IntegerFI(info[0]), IntegerFI(info[1]), 1, 32, nullptr)));
}

V8FUNC(StretchDIBitsWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    std::string bits;
    Local<Array> jsBits = info[9].As<Array>();
    for (int i = 0; i < jsBits->Length(); i++) {
        bits.push_back((char)jsBits->Get(isolate->GetCurrentContext(), i).ToLocalChecked()->IntegerValue(isolate->GetCurrentContext()).FromJust());
    }
    HDC dc = (HDC)IntegerFI(info[0]);

    int ul = CHECKJPEGFORMAT;
    print(jsBits->Length() << " " << bits.length());
    if (
        // Check if CHECKJPEGFORMAT exists: 

        (ExtEscape(dc, QUERYESCSUPPORT,
            sizeof(ul), (LPCSTR) & ul, 0, 0) > 0) &&

        // Check if CHECKJPEGFORMAT executed without error: 

        (ExtEscape(dc, CHECKJPEGFORMAT,
            bits.length(), &bits[0], sizeof(ul), (LPSTR)&ul) > 0) &&

        // Check status code returned by CHECKJPEGFORMAT: 

        (ul == 1)
        )
    {
        print("WORKING CHECK JPEG");
    }
    //print(bits);

    BITMAPINFO bmi;//{0};
    memset(&bmi, 0, sizeof(bmi));
    bmi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
    bmi.bmiHeader.biWidth = IntegerFI(info[10]);
    bmi.bmiHeader.biHeight = -IntegerFI(info[11]); // top-down image 
    bmi.bmiHeader.biPlanes = 1;
    bmi.bmiHeader.biBitCount = 0;
    bmi.bmiHeader.biCompression = IntegerFI(info[12]);
    bmi.bmiHeader.biSizeImage = bits.length();//IntegerFI(info[10])*IntegerFI(info[11]);
    
    info.GetReturnValue().Set(Number::New(isolate, StretchDIBits(dc, IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4]), IntegerFI(info[5]), IntegerFI(info[6]), IntegerFI(info[7]), IntegerFI(info[8]), &bits[0], &bmi, DIB_RGB_COLORS, IntegerFI(info[13]))));
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

v8::Local<v8::Context> InitGlobals(v8::Isolate* isolate, const char* filename) {
    using namespace v8;

    Local<ObjectTemplate> global = ObjectTemplate::New(isolate);
    // Bind the global 'print' function to the C++ Print callback.
    
    Local<ObjectTemplate> console = ObjectTemplate::New(isolate);
    console->Set(isolate, "log", FunctionTemplate::New(isolate, Print));

    global->Set(isolate, "console", console);

    global->Set(isolate, "print", FunctionTemplate::New(isolate, Print));
    // Bind the global 'read' function to the C++ Read callback.
    // Bind the 'version' function
    global->Set(isolate, "version", FunctionTemplate::New(isolate, Version));

    global->Set(isolate, "require", FunctionTemplate::New(isolate, Require));

    global->Set(isolate, "nigg", String::NewFromUtf8(isolate, "er").ToLocalChecked());

    global->Set(isolate, "child_process", FunctionTemplate::New(isolate, SystemWrapper));

    global->Set(isolate, "setBackground", FunctionTemplate::New(isolate, setBackground));

    global->Set(isolate, "hInstance", Number::New(isolate, (LONG_PTR)hInstance));

    Local<ObjectTemplate> file = ObjectTemplate::New(isolate);
    file->Set(isolate, "name", String::NewFromUtf8(isolate, filename).ToLocalChecked());

    global->Set(isolate, "file", file);

    {
        std::string tempStr(filename);
        std::string strFileName = tempStr.substr(0, tempStr.find_last_of('\\'));
        print(tempStr << " " << strFileName);

        global->Set(isolate, "__dirname", String::NewFromUtf8(isolate, strFileName.c_str()).ToLocalChecked());
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
    global->Set(isolate, "ReleaseDC", FunctionTemplate::New(isolate, ReleaseDCWrapper));

    global->Set(isolate, "TextOut", FunctionTemplate::New(isolate, TextOutWrapper));

    global->Set(isolate, "BitBlt", FunctionTemplate::New(isolate, BitBltWrapper));
    global->Set(isolate, "StretchBlt", FunctionTemplate::New(isolate, StretchBltWrapper));
    setGlobalWrapper(StretchDIBits);
    setGlobalWrapper(PatBlt);
    setGlobalWrapper(CreatePatternBrush);
    setGlobalWrapper(CreateHatchBrush);

    //https://stackoverflow.com/questions/6707148/foreach-macro-on-macros-arguments
#define setGlobalConst(g) global->Set(isolate, #g, Number::New(isolate, g))

    setGlobalConst(PATCOPY); setGlobalConst(PATINVERT); setGlobalConst(DSTINVERT); setGlobalConst(BLACKNESS); setGlobalConst(WHITENESS);

    setGlobalConst(BI_RGB);
    setGlobalConst(BI_RLE8);
    setGlobalConst(BI_RLE4);
    setGlobalConst(BI_BITFIELDS);
    setGlobalConst(BI_JPEG);
    setGlobalConst(BI_PNG);
    
    global->Set(isolate, "CreateWindow", FunctionTemplate::New(isolate, CreateWindowWrapper));
    global->Set(isolate, "CreateWindowClass", FunctionTemplate::New(isolate, CreateWindowClass));

    setGlobalConst(COLOR_ACTIVEBORDER); setGlobalConst(COLOR_ACTIVECAPTION); setGlobalConst(COLOR_APPWORKSPACE); setGlobalConst(COLOR_BACKGROUND); setGlobalConst(COLOR_BTNFACE); setGlobalConst(COLOR_BTNSHADOW); setGlobalConst(COLOR_BTNTEXT); setGlobalConst(COLOR_CAPTIONTEXT); setGlobalConst(COLOR_GRAYTEXT); setGlobalConst(COLOR_HIGHLIGHT); setGlobalConst(COLOR_HIGHLIGHTTEXT); setGlobalConst(COLOR_INACTIVEBORDER); setGlobalConst(COLOR_INACTIVECAPTION); setGlobalConst(COLOR_MENU); setGlobalConst(COLOR_MENUTEXT); setGlobalConst(COLOR_SCROLLBAR); setGlobalConst(COLOR_WINDOW); setGlobalConst(COLOR_WINDOWFRAME); setGlobalConst(COLOR_WINDOWTEXT);
    setGlobalConst(WS_BORDER); setGlobalConst(WS_CAPTION); setGlobalConst(WS_CHILD); setGlobalConst(WS_CHILDWINDOW); setGlobalConst(WS_CLIPCHILDREN); setGlobalConst(WS_CLIPSIBLINGS); setGlobalConst(WS_DISABLED); setGlobalConst(WS_DLGFRAME); setGlobalConst(WS_GROUP); setGlobalConst(WS_HSCROLL); setGlobalConst(WS_ICONIC); setGlobalConst(WS_MAXIMIZE); setGlobalConst(WS_MAXIMIZEBOX); setGlobalConst(WS_MINIMIZE); setGlobalConst(WS_MINIMIZEBOX); setGlobalConst(WS_OVERLAPPED); setGlobalConst(WS_OVERLAPPEDWINDOW); setGlobalConst(WS_POPUP); setGlobalConst(WS_POPUPWINDOW); setGlobalConst(WS_SIZEBOX); setGlobalConst(WS_SYSMENU); setGlobalConst(WS_TABSTOP); setGlobalConst(WS_THICKFRAME); setGlobalConst(WS_TILED); setGlobalConst(WS_TILEDWINDOW); setGlobalConst(WS_VISIBLE); setGlobalConst(WS_VSCROLL);
    setGlobalConst(CS_BYTEALIGNCLIENT); setGlobalConst(CS_BYTEALIGNWINDOW); setGlobalConst(CS_CLASSDC); setGlobalConst(CS_DBLCLKS); setGlobalConst(CS_DROPSHADOW); setGlobalConst(CS_GLOBALCLASS); setGlobalConst(CS_HREDRAW); setGlobalConst(CS_NOCLOSE); setGlobalConst(CS_OWNDC); setGlobalConst(CS_PARENTDC); setGlobalConst(CS_SAVEBITS); setGlobalConst(CS_VREDRAW);

    setGlobalWrapper(RedrawWindow);
    setGlobalWrapper(InvalidateRect);
    setGlobalWrapper(ShowWindow);
    setGlobalWrapper(UpdateWindow);
    setGlobalWrapper(EnableWindow);
    setGlobalWrapper(ClientToScreen);
    setGlobalWrapper(SetRect);
    setGlobalWrapper(SetROP2);
    
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
    setGlobalWrapper(CreateFontIndirect); //bruh i forgot this line and V8 didn't say SHIT   it just started gaining a ton memory and stopped running
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
    
    setGlobalWrapper(Rectangle);

    global->Set(isolate, "GetDefaultFont", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        static HFONT defaultfont = NULL;
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

    #define DWRITE_FLOW_DIRECTION_TOP_TO_BOTTOM DWRITE_FLOW_DIRECTION_TOP_TO_BOTTOM
    #define DWRITE_FLOW_DIRECTION_BOTTOM_TO_TOP DWRITE_FLOW_DIRECTION_BOTTOM_TO_TOP
    #define DWRITE_FLOW_DIRECTION_LEFT_TO_RIGHT DWRITE_FLOW_DIRECTION_LEFT_TO_RIGHT
    #define DWRITE_FLOW_DIRECTION_RIGHT_TO_LEFT DWRITE_FLOW_DIRECTION_RIGHT_TO_LEFT
    setGlobalConst(DWRITE_FLOW_DIRECTION_TOP_TO_BOTTOM);
    setGlobalConst(DWRITE_FLOW_DIRECTION_BOTTOM_TO_TOP);
    setGlobalConst(DWRITE_FLOW_DIRECTION_LEFT_TO_RIGHT);
    setGlobalConst(DWRITE_FLOW_DIRECTION_RIGHT_TO_LEFT);
    #define DWRITE_FONT_STRETCH_UNDEFINED       DWRITE_FONT_STRETCH_UNDEFINED
    #define DWRITE_FONT_STRETCH_ULTRA_CONDENSED DWRITE_FONT_STRETCH_ULTRA_CONDENSED
    #define DWRITE_FONT_STRETCH_EXTRA_CONDENSED DWRITE_FONT_STRETCH_EXTRA_CONDENSED
    #define DWRITE_FONT_STRETCH_CONDENSED       DWRITE_FONT_STRETCH_CONDENSED
    #define DWRITE_FONT_STRETCH_SEMI_CONDENSED  DWRITE_FONT_STRETCH_SEMI_CONDENSED
    #define DWRITE_FONT_STRETCH_NORMAL          DWRITE_FONT_STRETCH_NORMAL
    #define DWRITE_FONT_STRETCH_MEDIUM          DWRITE_FONT_STRETCH_MEDIUM
    #define DWRITE_FONT_STRETCH_SEMI_EXPANDED   DWRITE_FONT_STRETCH_SEMI_EXPANDED
    #define DWRITE_FONT_STRETCH_EXPANDED        DWRITE_FONT_STRETCH_EXPANDED
    #define DWRITE_FONT_STRETCH_EXTRA_EXPANDED  DWRITE_FONT_STRETCH_EXTRA_EXPANDED
    #define DWRITE_FONT_STRETCH_ULTRA_EXPANDED  DWRITE_FONT_STRETCH_ULTRA_EXPANDED
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
    #define DWRITE_FONT_STYLE_NORMAL  DWRITE_FONT_STYLE_NORMAL
    #define DWRITE_FONT_STYLE_OBLIQUE DWRITE_FONT_STYLE_OBLIQUE
    #define DWRITE_FONT_STYLE_ITALIC  DWRITE_FONT_STYLE_ITALIC
    setGlobalConst(DWRITE_FONT_STYLE_NORMAL);
    setGlobalConst(DWRITE_FONT_STYLE_OBLIQUE);
    setGlobalConst(DWRITE_FONT_STYLE_ITALIC);
    
        #define DWRITE_FONT_WEIGHT_THIN          DWRITE_FONT_WEIGHT_THIN
        #define DWRITE_FONT_WEIGHT_EXTRA_LIGHT   DWRITE_FONT_WEIGHT_EXTRA_LIGHT
        #define DWRITE_FONT_WEIGHT_ULTRA_LIGHT   DWRITE_FONT_WEIGHT_ULTRA_LIGHT
        #define DWRITE_FONT_WEIGHT_LIGHT         DWRITE_FONT_WEIGHT_LIGHT
        #define DWRITE_FONT_WEIGHT_SEMI_LIGHT    DWRITE_FONT_WEIGHT_SEMI_LIGHT
        #define DWRITE_FONT_WEIGHT_NORMAL        DWRITE_FONT_WEIGHT_NORMAL
        #define DWRITE_FONT_WEIGHT_REGULAR       DWRITE_FONT_WEIGHT_REGULAR
        #define DWRITE_FONT_WEIGHT_MEDIUM        DWRITE_FONT_WEIGHT_MEDIUM
        #define DWRITE_FONT_WEIGHT_DEMI_BOLD     DWRITE_FONT_WEIGHT_DEMI_BOLD
        #define DWRITE_FONT_WEIGHT_SEMI_BOLD     DWRITE_FONT_WEIGHT_SEMI_BOLD
        #define DWRITE_FONT_WEIGHT_BOLD          DWRITE_FONT_WEIGHT_BOLD
        #define DWRITE_FONT_WEIGHT_EXTRA_BOLD    DWRITE_FONT_WEIGHT_EXTRA_BOLD
        #define DWRITE_FONT_WEIGHT_ULTRA_BOLD    DWRITE_FONT_WEIGHT_ULTRA_BOLD
        #define DWRITE_FONT_WEIGHT_BLACK         DWRITE_FONT_WEIGHT_BLACK
        #define DWRITE_FONT_WEIGHT_HEAVY         DWRITE_FONT_WEIGHT_HEAVY
        #define DWRITE_FONT_WEIGHT_EXTRA_BLACK   DWRITE_FONT_WEIGHT_EXTRA_BLACK
        #define DWRITE_FONT_WEIGHT_ULTRA_BLACK   DWRITE_FONT_WEIGHT_ULTRA_BLACK
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

#define DWRITE_PARAGRAPH_ALIGNMENT_NEAR   DWRITE_PARAGRAPH_ALIGNMENT_NEAR
#define DWRITE_PARAGRAPH_ALIGNMENT_FAR    DWRITE_PARAGRAPH_ALIGNMENT_FAR
#define DWRITE_PARAGRAPH_ALIGNMENT_CENTER DWRITE_PARAGRAPH_ALIGNMENT_CENTER

    setGlobalConst(DWRITE_PARAGRAPH_ALIGNMENT_NEAR);
    setGlobalConst(DWRITE_PARAGRAPH_ALIGNMENT_FAR);
    setGlobalConst(DWRITE_PARAGRAPH_ALIGNMENT_CENTER);

#define DWRITE_READING_DIRECTION_TOP_TO_BOTTOM DWRITE_READING_DIRECTION_TOP_TO_BOTTOM
#define DWRITE_READING_DIRECTION_BOTTOM_TO_TOP DWRITE_READING_DIRECTION_BOTTOM_TO_TOP
#define DWRITE_READING_DIRECTION_LEFT_TO_RIGHT DWRITE_READING_DIRECTION_LEFT_TO_RIGHT
#define DWRITE_READING_DIRECTION_RIGHT_TO_LEFT DWRITE_READING_DIRECTION_RIGHT_TO_LEFT
    setGlobalConst(DWRITE_READING_DIRECTION_TOP_TO_BOTTOM);
    setGlobalConst(DWRITE_READING_DIRECTION_BOTTOM_TO_TOP);
    setGlobalConst(DWRITE_READING_DIRECTION_LEFT_TO_RIGHT);
    setGlobalConst(DWRITE_READING_DIRECTION_RIGHT_TO_LEFT);

    #define DWRITE_TEXT_ALIGNMENT_LEADING   DWRITE_TEXT_ALIGNMENT_LEADING
    #define DWRITE_TEXT_ALIGNMENT_TRAILING  DWRITE_TEXT_ALIGNMENT_TRAILING
    #define DWRITE_TEXT_ALIGNMENT_CENTER    DWRITE_TEXT_ALIGNMENT_CENTER
    #define DWRITE_TEXT_ALIGNMENT_JUSTIFIED DWRITE_TEXT_ALIGNMENT_JUSTIFIED
    setGlobalConst(DWRITE_TEXT_ALIGNMENT_LEADING);
    setGlobalConst(DWRITE_TEXT_ALIGNMENT_TRAILING);
    setGlobalConst(DWRITE_TEXT_ALIGNMENT_CENTER);
    setGlobalConst(DWRITE_TEXT_ALIGNMENT_JUSTIFIED);

    #define DWRITE_WORD_WRAPPING_WRAP            DWRITE_WORD_WRAPPING_WRAP
    #define DWRITE_WORD_WRAPPING_NO_WRAP         DWRITE_WORD_WRAPPING_NO_WRAP
    #define DWRITE_WORD_WRAPPING_EMERGENCY_BREAK DWRITE_WORD_WRAPPING_EMERGENCY_BREAK
    #define DWRITE_WORD_WRAPPING_WHOLE_WORD      DWRITE_WORD_WRAPPING_WHOLE_WORD
    #define DWRITE_WORD_WRAPPING_CHARACTER       DWRITE_WORD_WRAPPING_CHARACTER
    setGlobalConst(DWRITE_WORD_WRAPPING_WRAP);
    setGlobalConst(DWRITE_WORD_WRAPPING_NO_WRAP);
    setGlobalConst(DWRITE_WORD_WRAPPING_EMERGENCY_BREAK);
    setGlobalConst(DWRITE_WORD_WRAPPING_WHOLE_WORD);
    setGlobalConst(DWRITE_WORD_WRAPPING_CHARACTER);

    #define DWRITE_TRIMMING_GRANULARITY_NONE      DWRITE_TRIMMING_GRANULARITY_NONE
    #define DWRITE_TRIMMING_GRANULARITY_CHARACTER DWRITE_TRIMMING_GRANULARITY_CHARACTER
    #define DWRITE_TRIMMING_GRANULARITY_WORD      DWRITE_TRIMMING_GRANULARITY_WORD
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

    global->Set(isolate, "HWND_BOTTOM", Number::New(isolate, (int)HWND_BOTTOM));
    global->Set(isolate, "HWND_NOTOPMOST", Number::New(isolate, (int)HWND_NOTOPMOST));
    global->Set(isolate, "HWND_TOP", Number::New(isolate, (int)HWND_TOP));
    global->Set(isolate, "HWND_TOPMOST", Number::New(isolate, (int)HWND_TOPMOST));

    setGlobalConst(SWP_ASYNCWINDOWPOS); setGlobalConst(SWP_DEFERERASE); setGlobalConst(SWP_DRAWFRAME); setGlobalConst(SWP_FRAMECHANGED); setGlobalConst(SWP_HIDEWINDOW); setGlobalConst(SWP_NOACTIVATE); setGlobalConst(SWP_NOCOPYBITS); setGlobalConst(SWP_NOMOVE); setGlobalConst(SWP_NOOWNERZORDER); setGlobalConst(SWP_NOREDRAW); setGlobalConst(SWP_NOREPOSITION); setGlobalConst(SWP_NOSENDCHANGING); setGlobalConst(SWP_NOSIZE); setGlobalConst(SWP_NOZORDER); setGlobalConst(SWP_SHOWWINDOW);

    global->Set(isolate, "RGB", FunctionTemplate::New(isolate, RGBWRAPPER));

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

    setGlobalWrapper(IsIconic);
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

    global->Set(isolate, "HELP", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        using namespace v8;
        Isolate* isolate = info.GetIsolate();
        HandleScope handle_scope(isolate);
        //print(CStringFI(info[0]));
        //const char* shit = (const char*)IntegerFI(info[0]);
        std::string shit = *(std::string*)IntegerFI(info[0]);
        print(shit);
    }));
    
//#define setGlobal(name) global->Set(isolate, "name", v8::FunctionTemplate::New(isolate, name));
    //wait a funking mineite i was on to ssomething
    //setGlobalWrapper(BitBlt);
    //setGlobal(Msgbox);

    //https://stackoverflow.com/questions/37385102/failed-to-draw-on-desktopwindow GRRRRR

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
    print("UNFORTUNATELY i need to use create text layout some where for font boldness and the like");
    //print("replace all using of RGB() with a js function");
    print("figure out win timers");
    //print("maybe do send input but if i can't i can't");
    //print("investigate 3/11 -> why does SetClassLongPtr AND GetWindowLongPtr not work?"); //haha i can change the icons now!
    print(/*"GDI CreateFont and */"CreateWindowExA AND use ID2D1BitmapBrush1!");

    SetConsoleTextAttribute(GetStdHandle(STD_OUTPUT_HANDLE), 7);

    print("JBS3 -> Version 1.3.0"); //so idk how normal version things work so the first number will probably stay one --- i will increment the second number if i change an existing function like when i remade the CreateWindowClass and CreateWindow functions --- i might random increment the third number if i feel like it
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
    


    // Initialize V8.
    if (strlen(nCmdList) == 0) {
        std::cout << "PATH, NIGGA! (bellunicode\x07)" << std::endl;
        return -1;
    }
    else if (strcmp(nCmdList,"--help")==0) {
        print("yo we got functions like require and and child_process and and uhhh setBackground idk man just do for in globalThis :sob:");
        return -1;
    }
    v8::V8::InitializeICUDefaultLocation(nCmdList);//argv[0]);
    v8::V8::InitializeExternalStartupData(nCmdList);//argv[0]);
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
    
            std::ifstream file(nCmdList);//argv[1]);
    
            if (file.is_open()) {
                print("working file ok good " << nCmdList << " ;");
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
            }
    
            file.close();
    
            v8::Local<v8::String> source = v8::String::NewFromUtf8(isolate, shit.c_str(), v8::NewStringType::kNormal, shit.length()).ToLocalChecked();//v8::String::NewFromUtf8(isolate, (const char*)shit, v8::NewStringType::kNormal, strlen(shit)).ToLocalChecked();
                //v8::String::NewFromUtf8Literal(isolate, shit);//"'Hello' + ', World!'");
    
            // Compile the source code.
            v8::Local<v8::Script> script =
                v8::Script::Compile(context, source).ToLocalChecked();
    
            // Run the script to get the result.
            v8::Local<v8::Value> result = script->Run(context).ToLocalChecked();
    
            // Convert the result to an UTF8 string and print it.
            v8::String::Utf8Value utf8(isolate, result);
            printf("%s\n", *utf8);
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
//#include <windowsx.h>
LRESULT CALLBACK WinProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
    using namespace v8;
    Isolate* isolate = (Isolate*)GetWindowLongPtr(hwnd, GWLP_USERDATA);

    //Local<Function> listener = wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("windowProc")).ToLocalChecked().As<Function>();
    //Local<Value> args[] = { Number::New(isolate, (size_t)hwnd), Number::New(isolate, msg) };
    //Local<Value> result = listener->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 1, args).ToLocalChecked();
    //print(CStringFI(result));
    if (isolate != nullptr) {
        Local<Function> listener = wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("windowProc")).ToLocalChecked().As<Function>();
        Local<Value> args[] = { Number::New(isolate, (long long)hwnd),  Number::New(isolate, msg), Number::New(isolate, wp), Number::New(isolate, lp)};
        /*Local<Value> result = */listener->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 4, args)/*.ToLocalChecked()*/;
        //print(CStringFI(result));
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

    return DefWindowProcA(hwnd, msg, wp, lp);
}