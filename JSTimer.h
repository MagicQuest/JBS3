//ahh nevermind screw this whole class i'm gonna use the timer id as a pointer to FunctionCallbackInfo<Value> and if that don't work im spawning a new thread and using Sleep (how did both ideas not work)

#pragma once

//i know including all the declarations AND definitions in here is bad because redefinitions ykykykyk if i include this header in other files but it's just jbs3.cpp so im good

#include <map>

class setTimeoutTimer { //aw i wanted to make a base class named JSTimer and setTimeoutTimer could extend but with TimerProc being static im not sure i can do that
public:
	v8::Isolate* isolate;
	const v8::FunctionCallbackInfo<v8::Value>& info;
	static std::map<UINT_PTR, setTimeoutTimer*> timers; //bruh i don't want this to be a global but it might be the only thing i can DO

	setTimeoutTimer(v8::Isolate* i, const v8::FunctionCallbackInfo<v8::Value>& fci) : isolate(i), info(fci) {
		//isolate = info.GetIsolate();
		timers[SetTimer(NULL, NULL, IntegerFI(info[1]), TimerProc)] = this; //IntegerFI works because i import in JBS3.cpp after i define it (apparently including header files is basically copying the code in the header to the destination file)
	}

	~setTimeoutTimer() {

	}

	//aw i need the static keyword uh oh this is getting complicayed
	static VOID CALLBACK TimerProc(HWND hwnd, UINT msg, UINT_PTR id, DWORD time) {
		using namespace v8;
		Isolate* isolate = timers[id]->isolate; //HO HE
		Local<Function> callback = timers[id]->info[0].As<Function>();
		callback->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 0, nullptr);
		print(id << " ID");
		KillTimer(NULL, id);
		delete timers[id]; //hey this is just like poor man's set timeout!
	}
};

std::map<UINT_PTR, setTimeoutTimer*> setTimeoutTimer::timers; //what