// JBS3.cpp : This file contains the 'main' function. Program execution begins and ends there.

// Copyright 2015 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

//#define V8_COMPRESS_POINTERS
//#define V8_31BIT_SMIS_ON_64BIT_ARCH

#define V8_ENABLE_SANDBOX
#define _CRT_SECURE_NO_WARNINGS

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <iostream>

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

#pragma comment(lib, "v8_monolith")

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

const char* ToCString(const v8::String::Utf8Value& value) {
    return *value ? *value : "<string conversion failed>";
}

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
        const char* cstr = ToCString(str);
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

        std::ifstream file(*String::Utf8Value(info.GetIsolate(), info[0]));

        if (file.is_open()) {
            
            //i hate reading files in c++
            buffer << file.rdbuf();
            shit = buffer.str();
            info.GetReturnValue().Set(String::NewFromUtf8(info.GetIsolate(), shit.c_str()).ToLocalChecked());
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
        filesys->Set(isolate, "write", FunctionTemplate::New(isolate, fs::write));
        //filesys->Set(isolate->GetCurrentContext(), String::NewFromUtf8(isolate, "open").ToLocalChecked(), v8::FunctionTemplate::New(isolate, fs::open));
        //filesys->Set(isolate, "v", String::NewFromUtf8(isolate, "KYS").ToLocalChecked());
        
        //print(filesys->IsValue() << " is value");

        Local<Object> result = filesys->NewInstance(isolate->GetCurrentContext()).ToLocalChecked(); //why did i have to cap on this dawg
        
        info.GetReturnValue().Set(result);
    }
}

void SystemWrapper(const v8::FunctionCallbackInfo<v8::Value>& info) {
    info.GetReturnValue().Set(system(*v8::String::Utf8Value(info.GetIsolate(), info[0])));
}

void setBackground(const v8::FunctionCallbackInfo<v8::Value>& info) {
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
#define IntegerFI(e) e.As<Number>()->IntegerValue(isolate->GetCurrentContext()).FromJust()
#define FloatFI(e) e.As<Number>()->Value()

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

V8FUNC(CreateWindowClass) {
    using namespace v8;

    Isolate* isolate = info.GetIsolate();

    //WNDCLASSA wc{ 0 };
    //wc.hInstance = hInstance;
    //wc.lpszClassName = *String::Utf8Value(info.GetIsolate(), info[0]);

    //Local<ObjectTemplate> wndclass = ObjectTemplate::New(isolate);
    Local<Object> wndclass = Object::New(isolate);
    wndclass->Set(isolate->GetCurrentContext(), LITERAL("className"), Undefined(isolate));//info[0]);
    wndclass->Set(isolate->GetCurrentContext(), LITERAL("windowProc"), Undefined(isolate));//info[1]);
    wndclass->Set(isolate->GetCurrentContext(), LITERAL("loop"), Undefined(isolate));
    //wndclass->Set(isolate, "write", FunctionTemplate::New(isolate, fs::write));

    //Local<Object> result = wndclass->NewInstance(isolate->GetCurrentContext()).ToLocalChecked(); //why did i have to cap on this dawg

    info.GetReturnValue().Set(wndclass);//result);

}

LRESULT CALLBACK WinProc(HWND hWnd, UINT msg, WPARAM wp, LPARAM lp);

v8::Local<v8::Object> wndclass;

V8FUNC(CreateWindowWrapper) {
    MessageBoxA(NULL, "aw shit another unfiinished hting", "ok so like no cap the only message you can resieve as of now is WM_PAINT", MB_OK | MB_ICONEXCLAMATION);
    using namespace v8;

    Isolate* isolate = info.GetIsolate();

    wndclass = info[0].As<Object>();

    const char* className = *String::Utf8Value(isolate, wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), String::NewFromUtf8Literal(isolate, "className")).ToLocalChecked());
        
    WNDCLASSA wc{ 0 };
    wc.hInstance = hInstance;
    wc.lpszClassName = className;
    wc.lpfnWndProc = WinProc;
    wc.hbrBackground = (HBRUSH)COLOR_WINDOW;
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);

    if (!RegisterClassA(&wc)) {
        info.GetReturnValue().Set(false);
    }

    int x = info[2].As<Number>()->IntegerValue(isolate->GetCurrentContext()).FromJust();
    int y = info[3].As<Number>()->IntegerValue(isolate->GetCurrentContext()).FromJust();
    int width = info[4].As<Number>()->IntegerValue(isolate->GetCurrentContext()).FromJust();
    int height = info[5].As<Number>()->IntegerValue(isolate->GetCurrentContext()).FromJust();

    print(CStringFI(info[1]));

    HWND newWindow = CreateWindowA(className, *String::Utf8Value(isolate, info[1]), WS_OVERLAPPEDWINDOW | WS_VISIBLE, x, y, width, height, NULL, NULL, hInstance, NULL);

    SetWindowLongPtrW(newWindow, GWLP_USERDATA, (long long)isolate);//(size_t) & wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("windowProc")).ToLocalChecked().As<Function>());

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

    Local<Promise::Resolver> uh = Promise::Resolver::New(isolate->GetCurrentContext()).ToLocalChecked();
    info.GetReturnValue().Set(uh->GetPromise());

    Local<Function> looper = wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("loop")).ToLocalChecked().As<Function>();

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
            looper->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 0, nullptr);
            //print("LOPER CALLED!");

            isolate->PerformMicrotaskCheckpoint(); 
        }
    }

    print("loop over nigga");

    uh->Resolve(isolate->GetCurrentContext(), Undefined(isolate)); //https://gist.github.com/jupp0r/5f11c0ee2b046b0ab89660ce85ea480e
}

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
    LPPAINTSTRUCT lps; //oh god
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
    print(window << " get dc window == " << (HWND)NULL);
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
    info.GetReturnValue().Set(GetAsyncKeyState(key) & 0x1); //0x01 and 0x1 work the same?
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

V8FUNC(SetBkColorWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    SetBkColor((HDC)IntegerFI(info[0]), RGB(IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3])));
}

V8FUNC(SetBkModeWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();
    //SetBkColor((HDC)IntegerFI(info[0]), RGB(IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3])));
    SetBkMode((HDC)IntegerFI(info[0]), IntegerFI(info[1]));
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

    info.GetReturnValue().Set(Number::New(isolate, (long long)CreatePen(IntegerFI(info[0]), IntegerFI(info[1]), RGB(IntegerFI(info[2]), IntegerFI(info[3]), IntegerFI(info[4])))));
}

V8FUNC(DeleteObjectWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    info.GetReturnValue().Set(DeleteObject((HGDIOBJ)IntegerFI(info[0])));
}

V8FUNC(SetDCPenColorWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    /*info.GetReturnValue().Set(*/SetDCPenColor((HDC)IntegerFI(info[0]), RGB(IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3])));//);
}

V8FUNC(SetDCBrushColorWrapper) {
    using namespace v8;
    Isolate* isolate = info.GetIsolate();

    /*info.GetReturnValue().Set(*/SetDCBrushColor((HDC)IntegerFI(info[0]), RGB(IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3])));//);
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
    SetTextColor((HDC)IntegerFI(info[0]), RGB(IntegerFI(info[1]), IntegerFI(info[2]), IntegerFI(info[3])));
}

#include "Direct2D.h"

#pragma comment(lib, "d2d1.lib")
#pragma comment(lib, "dwrite.lib")

float lerp(float a, float b, float f)
{
    return a * (1.0 - f) + (b * f);
}

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
            
            bmp->CopyFromBitmap(&point, (ID2D1Bitmap*)IntegerFI(info[2]), &rect);
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
                        //damn it i lose precision
            angle = fmod(angle, 360.f);
            ID2D1LinearGradientBrush* brush = (ID2D1LinearGradientBrush*)bruh;
            D2D1_POINT_2F zeroRotP0 = D2D1::Point2F(point0.x+(point1.x-point0.x)*f3(angle/360), point1.y - (point1.y - point0.y) * f(angle / 360));
            D2D1_POINT_2F zeroRotP1 = D2D1::Point2F(point1.x + (point0.x - point1.x) * f3(angle / 360), point0.y - (point0.y - point1.y) * f(angle / 360));
            //https://www.desmos.com/calculator/erqmojpc7j
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
            Isolate* isolate = info.GetIsolate();
            Direct2D* d2d = (Direct2D*)info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalDXPtr")).ToLocalChecked()/*.As<Number>()*/->IntegerValue(isolate->GetCurrentContext()).FromJust();

            IDWriteTextFormat* font;

            const char* fontFamily = CStringFI(info[0]);
            size_t length = strlen(fontFamily);
            std::wstring fFws(length, L'#');

            mbstowcs(&fFws[0], fontFamily, length);
            d2d->textfactory->CreateTextFormat(
                fFws.c_str(),
                NULL,
                DWRITE_FONT_WEIGHT_NORMAL,
                DWRITE_FONT_STYLE_NORMAL,
                DWRITE_FONT_STRETCH_NORMAL,
                FloatFI(info[1]),
                L"en-us", //locale
                &font
            );

            //font->SetWordWrapping(DWRITE_WORD_WRAPPING_NO_WRAP);

            Local<ObjectTemplate> jsFont = ObjectTemplate::New(isolate);

            jsFont->Set(isolate, "internalPtr", Number::New(isolate, (LONG_PTR)font));
            jsFont->Set(isolate, "family", String::NewFromUtf8(isolate, fontFamily).ToLocalChecked());
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
            
            d2d->renderTarget->DrawBitmap(bmp, D2D1::RectF(FloatFI(info[1]), FloatFI(info[2]), FloatFI(info[3]), FloatFI(info[4])), FloatFI(info[5]), (D2D1_BITMAP_INTERPOLATION_MODE)IntegerFI(info[6]), D2D1::RectF(info[7]->IsNumber() ? FloatFI(info[7]) : 0.0F, info[8]->IsNumber() ? FloatFI(info[8]) : 0.0F, info[9]->IsNumber() ? FloatFI(info[9]) : bmp->GetSize().width, info[10]->IsNumber() ? FloatFI(info[10]) : bmp->GetSize().height));
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
                bmpBrush->SetExtendModeY((D2D1_EXTEND_MODE)IntegerFI(info[1]));
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
        //d2d->renderTarget->CreateRadialGradientBrush;
        //d2d->renderTarget->SetTransform;
        //d2d->renderTarget->GetTransform;
        //d2d->renderTarget->CreateBitmapBrush;
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
        //    D2D1_MATRIX_3X2_F matrix; d2d->renderTarget->GetTransform(&matrix);
        //    
        //    Local<Object> jsMatrixObj = Object::New(isolate);
        //    jsMatrixObj->Set(isolate->GetCurrentContext(), LITERAL("dx"), Number::New(isolate, matrix.dx));
        //    jsMatrixObj->Set(isolate->GetCurrentContext(), LITERAL("dy"), Number::New(isolate, matrix.dy));
        //    jsMatrixObj->Set(isolate->GetCurrentContext(), LITERAL("m"), Number::New(isolate, matrix.m));
        //    jsMatrixObj->Set(isolate->GetCurrentContext(), LITERAL("dx"), Number::New(isolate, matrix.dx));
        //    jsMatrixObj->Set(isolate->GetCurrentContext(), LITERAL("dx"), Number::New(isolate, matrix.dx));
        //    jsMatrixObj->Set(isolate->GetCurrentContext(), LITERAL("dx"), Number::New(isolate, matrix.dx));
        //    jsMatrixObj->Set(isolate->GetCurrentContext(), LITERAL("dx"), Number::New(isolate, matrix.dx));
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


    Local<ObjectTemplate> file = ObjectTemplate::New(isolate);
    file->Set(isolate, "name", String::NewFromUtf8(isolate, filename).ToLocalChecked());

    global->Set(isolate, "file", file);
    
    global->Set(isolate, "Msgbox", FunctionTemplate::New(isolate, Msgbox));
    global->Set(isolate, "Inputbox", FunctionTemplate::New(isolate, Inputbox));

    //https://stackoverflow.com/questions/4201399/prompting-a-user-with-an-input-box-c

    global->Set(isolate, "CreateWindow", FunctionTemplate::New(isolate, CreateWindowWrapper));
    global->Set(isolate, "CreateWindowClass", FunctionTemplate::New(isolate, CreateWindowClass));

#define setGlobal(name) global->Set(isolate, #name, FunctionTemplate::New(isolate, name)) //https://stackoverflow.com/questions/10507264/how-to-use-macro-argument-as-string-literal
#define setGlobalWrapper(name) global->Set(isolate, #name, FunctionTemplate::New(isolate, name####Wrapper)) //https://stackoverflow.com/questions/30113944/how-to-write-a-macro-that-will-append-text-to-a-partial-function-name-to-create

    global->Set(isolate, "BeginPaint", FunctionTemplate::New(isolate, BeginPaintWrapper));
    global->Set(isolate, "EndPaint", FunctionTemplate::New(isolate, EndPaintWrapper));

    global->Set(isolate, "GetDC", FunctionTemplate::New(isolate, GetDCWrapper));
    global->Set(isolate, "ReleaseDC", FunctionTemplate::New(isolate, ReleaseDCWrapper));

    global->Set(isolate, "TextOut", FunctionTemplate::New(isolate, TextOutWrapper));

    global->Set(isolate, "BitBlt", FunctionTemplate::New(isolate, BitBltWrapper));
    global->Set(isolate, "StretchBlt", FunctionTemplate::New(isolate, StretchBltWrapper));

    //https://stackoverflow.com/questions/6707148/foreach-macro-on-macros-arguments
#define setGlobalConst(g) global->Set(isolate, #g, Number::New(isolate, g))
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

#define D2D1_EXTEND_MODE_CLAMP D2D1_EXTEND_MODE_CLAMP
#define D2D1_EXTEND_MODE_WRAP D2D1_EXTEND_MODE_WRAP
#define D2D1_EXTEND_MODE_MIRROR D2D1_EXTEND_MODE_MIRROR
#define D2D1_EXTEND_MODE_FORCE_DWORD D2D1_EXTEND_MODE_FORCE_DWORD

    setGlobalConst(D2D1_EXTEND_MODE_CLAMP);
    setGlobalConst(D2D1_EXTEND_MODE_WRAP);
    setGlobalConst(D2D1_EXTEND_MODE_MIRROR);
    setGlobalConst(D2D1_EXTEND_MODE_FORCE_DWORD);

#define D2D1_BITMAP_INTERPOLATION_MODE_NEAREST_NEIGHBOR D2D1_BITMAP_INTERPOLATION_MODE_NEAREST_NEIGHBOR
#define D2D1_BITMAP_INTERPOLATION_MODE_LINEAR D2D1_BITMAP_INTERPOLATION_MODE_LINEAR
#define D2D1_BITMAP_INTERPOLATION_MODE_FORCE_DWORD D2D1_BITMAP_INTERPOLATION_MODE_FORCE_DWORD

    setGlobalConst(D2D1_BITMAP_INTERPOLATION_MODE_NEAREST_NEIGHBOR);
    setGlobalConst(D2D1_BITMAP_INTERPOLATION_MODE_LINEAR);
    setGlobalConst(D2D1_BITMAP_INTERPOLATION_MODE_FORCE_DWORD);

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

    setGlobal(GetKey);
    setGlobal(GetKeyDown);

    setGlobalWrapper(PostQuitMessage);

    setGlobal(GetMousePos);

    setGlobalWrapper(SetBkColor);
    setGlobalWrapper(SetBkMode);
    
    setGlobalWrapper(SelectObject);
    setGlobalWrapper(DeleteObject);
    setGlobalWrapper(SetDCPenColor);
    setGlobalWrapper(SetDCBrushColor);
    setGlobalWrapper(MoveTo);
    setGlobalWrapper(LineTo);

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

    setGlobalWrapper(Sleep);
    setGlobalWrapper(GetClientRect);
    setGlobalWrapper(GetWindowRect);

    setGlobalWrapper(GetConsoleWindow);

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

    print("uhhh i need to define like 100 WM_ global macros kthxbai");
    print("also i MUST consider adding convenience functions like setting the color of objects that don't support it (by creating new ones)");

    SetConsoleTextAttribute(GetStdHandle(STD_OUTPUT_HANDLE), 7);

    CoInitialize(NULL);

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

    system("pause");
    
    // Dispose the isolate and tear down V8.
    isolate->Dispose();
    v8::V8::Dispose();
    v8::V8::DisposePlatform();
    delete create_params.array_buffer_allocator;
    return 0;
}

LRESULT CALLBACK WinProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
    using namespace v8;
    Isolate* isolate = (Isolate*)GetWindowLongPtr(hwnd, GWLP_USERDATA);

    //Local<Function> listener = wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("windowProc")).ToLocalChecked().As<Function>();
    //Local<Value> args[] = { Number::New(isolate, (size_t)hwnd), Number::New(isolate, msg) };
    //Local<Value> result = listener->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 1, args).ToLocalChecked();
    //print(CStringFI(result));

    if (msg == WM_PAINT) {
        Local<Function> listener = wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("windowProc")).ToLocalChecked().As<Function>();
        Local<Value> args[] = {Number::New(isolate, (long long)hwnd),  Number::New(isolate, msg) };
        Local<Value> result = listener->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 2, args).ToLocalChecked();
        print(CStringFI(result));
        //PAINTSTRUCT ps;
        //BeginPaint(hwnd, &ps);
        //
        //const char* className = CStringFI(wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("className")).ToLocalChecked());
        //
        //TextOutA(ps.hdc, 100, 100, className, strlen(className));
        //
        //EndPaint(hwnd, &ps);
    }
    else if (msg == WM_DESTROY) {
        //DestroyWindow(hwnd);
        PostQuitMessage(0);
    }

    return DefWindowProcA(hwnd, msg, wp, lp);
}