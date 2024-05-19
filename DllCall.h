#pragma once

//well im calling it DllCall based off of autohotkey's function of a similar name but the way they do it seems really complicated and this is all i got
//https://github.com/AutoHotkey/AutoHotkey/blob/alpha/source/lib/DllCall.cpp
//https://dyncall.org/
//https://github.com/AutoHotkey/AutoHotkey/tree/alpha/source/libx64call
//im just writing these links down just incase i need them LO!

typedef void* (__stdcall* g_func_ptr_0)();
typedef void* (__stdcall* g_func_ptr_1)(void*); //generic function pointer 1
typedef void* (__stdcall* g_func_ptr_2)(void*, void*);
typedef void* (__stdcall* g_func_ptr_3)(void*, void*, void*);
typedef void* (__stdcall* g_func_ptr_4)(void*, void*, void*, void*);
typedef void* (__stdcall* g_func_ptr_5)(void*, void*, void*, void*, void*);
typedef void* (__stdcall* g_func_ptr_6)(void*, void*, void*, void*, void*, void*);
typedef void* (__stdcall* g_func_ptr_7)(void*, void*, void*, void*, void*, void*, void*);
typedef void* (__stdcall* g_func_ptr_8)(void*, void*, void*, void*, void*, void*, void*, void*);
typedef void* (__stdcall* g_func_ptr_9)(void*, void*, void*, void*, void*, void*, void*, void*, void*);
typedef void* (__stdcall* g_func_ptr_10)(void*, void*, void*, void*, void*, void*, void*, void*, void*, void*);

#define BLAHSHIT(i) g_func_ptr_##i func_ptr = (g_func_ptr_##i)GetProcAddress(dll, name); \
					if(!func_ptr) { \
						MessageBoxA(NULL, "couldn't find function", name, MB_OK | MB_ICONERROR); \
						return 0; \
					} \
					return func_ptr

//wait i'll just make a function
void* DllCall(HMODULE dll, const char* name, int argc, void** argv) { //we finding out the return value type later
	//there's probably some weird macro trick you could use but i guess im writing this by hand
	if(argc == 0) {
		BLAHSHIT(0)();
	}else if (argc == 1) {
		BLAHSHIT(1)(argv[0]);
	}
	else if (argc == 2) {
		BLAHSHIT(2)(argv[0], argv[1]);
	}
	else if (argc == 3) {
		BLAHSHIT(3)(argv[0], argv[1], argv[2]);
	}
	else if (argc == 4) {
		BLAHSHIT(4)(argv[0], argv[1], argv[2], argv[3]);
	}
	else if (argc == 5) {
		BLAHSHIT(5)(argv[0], argv[1], argv[2], argv[3], argv[4]);
	}
	else if (argc == 6) {
		BLAHSHIT(6)(argv[0], argv[1], argv[2], argv[3], argv[4], argv[5]);
	}
	else if (argc == 7) {
		BLAHSHIT(7)(argv[0], argv[1], argv[2], argv[3], argv[4], argv[5], argv[6]);
	}
	else if (argc == 8) {
		BLAHSHIT(8)(argv[0], argv[1], argv[2], argv[3], argv[4], argv[5], argv[6], argv[7]);
	}
	else if (argc == 9) {
		BLAHSHIT(9)(argv[0], argv[1], argv[2], argv[3], argv[4], argv[5], argv[6], argv[7], argv[8]);
	}
	else if (argc == 10) {
		BLAHSHIT(10)(argv[0], argv[1], argv[2], argv[3], argv[4], argv[5], argv[6], argv[7], argv[8], argv[9]);
	}
}

/*struct DllCall {
	//ok this is kinda weird but im just gonna use it as a staticly created thing in V8FUNC(DllCallWrapper)
	DllCall() {

	}
};*/