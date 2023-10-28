//ahh nevermind screw this whole class i'm gonna use the timer id as a pointer to FunctionCallbackInfo<Value> and if that don't work im spawning a new thread and using Sleep (how did both ideas not work)

#pragma once

//i know including all the declarations AND definitions in here is bad because redefinitions ykykykyk if i include this header in other files but it's just jbs3.cpp so im good

#include <map>

class setTimeoutTimer { //aw i wanted to make a base class named JSTimer and setTimeoutTimer could extend but with TimerProc being static im not sure i can do that
public:
	v8::Isolate* isolate;
	//const v8::FunctionCallbackInfo<v8::Value>& info;
	v8::Persistent<v8::Function> function;
	static std::map<UINT_PTR, setTimeoutTimer*> timers; //bruh i don't want this to be a global but it might be the only thing i can DO (NEVERMIND https://stackoverflow.com/questions/13464325/static-map-initialization)

											//v8 does NOT want me to pass this Persistent object like this but when i tried to do it the "good" way (const v8::Persistent<v8::Function>& func) it crashed with some weird error SO IM COMMENTING OUT THE ASSERT (v8-persistent-handle.h)
	setTimeoutTimer(v8::Isolate* i, v8::Persistent<v8::Function> func) : isolate(i), function(func) {//info(fci) {
		//isolate = info.GetIsolate();
	}

	UINT_PTR init(UINT time) {
		UINT_PTR id = SetTimer(NULL, NULL, time, TimerProc);
		timers[id] = this; //IntegerFI works because i import in JBS3.cpp after i define it (apparently including header files is basically copying the code in the header to the destination file)
		return id;
	}

	~setTimeoutTimer() {
		print("deleting timerout");
	}

	//aw i need the static keyword uh oh this is getting complicayed
	static VOID CALLBACK TimerProc(HWND hwnd, UINT msg, UINT_PTR id, DWORD time) {
		using namespace v8;
		Isolate* isolate = timers[id]->isolate; //HO HE
		//Local<Function> callback = timers[id]->info[0].As<Function>();
		TryCatch shit(isolate);
		timers[id]->function.Get(isolate)->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 0, nullptr);
		//print(id << " ID");
		CHECKEXCEPTIONS(shit);
		KillTimer(NULL, id);
		delete timers[id]; //hey this is just like poor man's set timeout!
	}
};

//std::map<UINT_PTR, setTimeoutTimer*> setTimeoutTimer::timers; //what (i have learned since my past mistakes https://stackoverflow.com/questions/13464325/static-map-initialization)

class setIntervalTimer { //yeah im kinda mad i had to recreate the whole class instead of extending but with the static classes i think it makes it impossible
public:
	v8::Isolate* isolate;
	v8::Persistent<v8::Function> function;
	static std::map<UINT_PTR, setIntervalTimer*> timers;

	//v8 does NOT want me to pass this Persistent object like this but when i tried to do it the "good" way (const v8::Persistent<v8::Function>& func) it crashed with some weird error SO IM COMMENTING OUT THE ASSERT (v8-persistent-handle.h)
	setIntervalTimer(v8::Isolate* i, v8::Persistent<v8::Function> func) : isolate(i), function(func) {}

	UINT_PTR init(UINT time) {
		UINT_PTR id = SetTimer(NULL, NULL, time, TimerProc);
		timers[id] = this;
		return id;
	}

	~setIntervalTimer() {
		print("deleting INTERVAL timer");
	}

	//aw i need the static keyword uh oh this is getting complicayed
	static VOID CALLBACK TimerProc(HWND hwnd, UINT msg, UINT_PTR id, DWORD time) {
		using namespace v8;
		Isolate* isolate = timers[id]->isolate; //HO HE
		TryCatch shit(isolate);
		timers[id]->function.Get(isolate)->Call(isolate->GetCurrentContext(), isolate->GetCurrentContext()->Global(), 0, nullptr);
		//print(id << " ID");
		CHECKEXCEPTIONS(shit);
	}
};