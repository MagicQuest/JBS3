#pragma once

class JSWindow {
public: //yeah
	v8::Isolate* isolate;
	v8::Local<v8::Object> wndclass;
    static std::map<int, JSWindow*> jsWindows; //WHY CAN'T I DO THAT

    JSWindow(v8::Isolate* i, v8::Local<v8::Object> wc) : isolate(i), wndclass(wc) {
        //jsWindows[jsWindows.size()] = this;
    }

	~JSWindow() {
        print("destroying js window");
	}

    void Create(int x, int y, int width, int height,const v8::FunctionCallbackInfo<v8::Value>& info, HINSTANCE hInstance) {
        using namespace v8;
#define GetProperty(name) this->wndclass->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL(name)).ToLocalChecked()

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

        wchar_t CLAZZ[256]; //https://learn.microsoft.com/en-us/windows/win32/api/winuser/ns-winuser-wndclassa#:~:text=The%20class%20name%20can%20be,the%20RegisterClass%20function%20will%20fail.

        wcscpy(CLAZZ, WStringFI(GetProperty("lpszClassName")));
        print(CLAZZ);
        wprint(CLAZZ);

        wc.lpszClassName = CLAZZ;

        if (GetProperty("lpszMenuName")->NumberValue(isolate->GetCurrentContext()).FromJust() != 0) {
            wc.lpszMenuName = WStringFI(GetProperty("lpszMenuName"));
        }
        wc.style = IntegerFI(GetProperty("style"));
        wc.lpfnWndProc = WinProc;

        if (!RegisterClassExW(&wc)) {
            info.GetReturnValue().Set(false);
            print("FAILED RegisteClassExW " << hInstance << " " << GetModuleHandle(NULL));
            MessageBoxA(NULL, "failed to register window class (keep trying idk why CreateWindow is a little sketchy)", (std::string("err: [") + (const char*)_bstr_t(_com_error(GetLastError()).ErrorMessage()) + "]").c_str(), MB_OK | MB_ICONERROR);
            return;
        }

        HWND newWindow = CreateWindowExW(IntegerFI(info[0]), //HOLY SHIT THIS LINE WAS FAILING EVERYTIME I EVEN USED BREAKPOINTS TO FIND THE ISSUE AND GUESS WHAT
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

        jsWindows[(LONG_PTR)newWindow] = this;
        print("NEW IWNDOW " << (LONG_PTR)newWindow << " " << jsWindows.size());

        //ShowWindow(newWindow, SW_SHOW);

        //https://rave.dj/xXjJ5rcPG5qLcQ (i made this like 4 years ago)

        if (GetLastError() != 0) {
            //std::string shit = std::string("RESTART JBS because there's a 99% chance that the window was NOT created ") + (const char*)_bstr_t(_com_error(GetLastError()).ErrorMessage()) + ")";
                                //ahhhhhhh
            if (MessageBoxA(NULL, /*&shit[0]*/"I'm not gonna lie something when wrong when we tried to create that window", _bstr_t(_com_error(GetLastError()).ErrorMessage()), MB_OKCANCEL | MB_ICONWARNING | MB_DEFBUTTON2) == IDCANCEL) {
                return;
            }
        }


        MSG Message;
        Message.message = ~WM_QUIT;

        //info.GetReturnValue().Set(Number::New(isolate, (LONG_PTR)newWindow));

        Local<Function> looper = GetProperty("loop").As<Function>();
        print(looper.IsEmpty() << " " << looper->IsUndefined());

        if (!looper->IsUndefined()) {
            while (Message.message != WM_QUIT)
            {
                if (PeekMessage(&Message, NULL, 0, 0, PM_REMOVE))
                {
                    // If a message was waiting in the message queue, process it
                    TranslateMessage(&Message);
                    DispatchMessage(&Message);
                }
                else
                {
                    v8::HandleScope handle_scope(isolate); //apparently i needed this so good to know
                    v8::TryCatch shit(isolate);
                    looper->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 0, nullptr);
                    //print("LOPER CALLED!");
                    if (shit.HasCaught()) {
                        HANDLE console = GetStdHandle(STD_OUTPUT_HANDLE);
                        SetConsoleTextAttribute(console, 4);
                        print(CStringFI(shit.Message()->Get()) << "\007");
                        SetConsoleTextAttribute(console, 7);
                    }
                    isolate->PerformMicrotaskCheckpoint(); //i just assume i should put what ever this is because before trying to make jbs3 i was trying to make an fl studio vst and you have to call some update function like this one so i had to make sure i wasn't blocking all of js ya feel me (which i assume that's what this function solves idk don't listen to anything i just said)
                }
            }
        }
        else {
            while (Message.message != WM_QUIT)
            {
                if (GetMessage(&Message, NULL, 0, 0))
                {
                    TranslateMessage(&Message);
                    DispatchMessage(&Message);
                }
            }
        }

        print("loop over nigga");
        delete this;
    }

    static LRESULT CALLBACK WinProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
        using namespace v8;
        print(hwnd << " CHECKING WINDOW " << jsWindows.size());
        JSWindow* thus = jsWindows[(LONG_PTR)hwnd];

        Isolate* isolate = thus->isolate;
        Local<Context> context = isolate->GetCurrentContext();

        Local<Object> wndclass = thus->wndclass;

        HandleScope handle_scope(isolate);
        TryCatch shit(isolate);

        Local<Value> args[] = { Number::New(isolate, (LONG_PTR)hwnd),  Number::New(isolate, msg), Number::New(isolate, wp), Number::New(isolate, lp) };
        Local<Function> listener = wndclass->GetRealNamedProperty(context, LITERAL("windowProc")).ToLocalChecked().As<Function>(); //i think i named this listener because i was thinking about addEventListener
        MaybeLocal<Value> returnedValue = listener->Call(context, context->Global(), 4, args);
    
        if (shit.HasCaught()) {
            HANDLE console = GetStdHandle(STD_OUTPUT_HANDLE);
            SetConsoleTextAttribute(console, 4);
            print(CStringFI(shit.Message()->Get()) << "\007");
            SetConsoleTextAttribute(console, 7);
            return 0;
        }
        else {
            bool def = IntegerFI(wndclass->GetRealNamedProperty(context, LITERAL("DefWindowProc")).ToLocalChecked());
            if (!def) {
                return IntegerFI(returnedValue.ToLocalChecked());
            }
            else {
                return DefWindowProcW(hwnd, msg, wp, lp);
            }
        }
    }
};