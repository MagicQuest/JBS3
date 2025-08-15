#include "Canvas2DRenderingContext.h"

using namespace v8;

bool Canvas2DRenderingContext::Init(HWND window) {
	//((Direct2D11*)this)->Init(window, 3); //lmao (wait is Init virtual?)
	Direct2D11::Init(window, 3);
	//__super::Init(window, 3); (i think this also works)
	std::cout << "this trenderf type " << this->type << " " << this->textfactory << std::endl;
	SusIfFailed(this->factory->CreatePathGeometry(&this->path), "ID2D1Factory7->CreatePathGeometry failed (Canvas2DRenderingContext)");
	SusIfFailed(this->d2dcontext->CreateSolidColorBrush(D2D1::ColorF(0, 0, 0, 1.0), &this->fillBrush), "Canvas2DRenderingContext failed to create fillStyleBrush");
	SusIfFailed(this->d2dcontext->CreateSolidColorBrush(D2D1::ColorF(0, 0, 0, 1.0), &this->strokeBrush), "Canvas2DRenderingContext failed to create strokeStyleBrush");
	this->currentTransform = D2D1::Matrix3x2F::Identity();
	this->SetFillStyle("black");
	this->SetStrokeStyle("black");
}

void Canvas2DRenderingContext::save(const Local<Object>& info) {
	SaveState newState{};
	Isolate* isolate = info->GetIsolate();
	RetIfFailed(this->factory->CreateDrawingStateBlock(D2D1::DrawingStateDescription(), &newState.realState), "failed to CreateDrawingStateBlock");
	this->d2dcontext->SaveDrawingState(newState.realState);
	newState.fillcolor = CStringFI(info->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("fillStyle")).ToLocalChecked());
	newState.strokecolor = CStringFI(info->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("strokeStyle")).ToLocalChecked());
	newState.font = CStringFI(info->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("font")).ToLocalChecked());
	newState.lineWidth = FloatFI(info->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("lineWidth")).ToLocalChecked());
	//newState.font
	this->stateStack.push_back(newState);
}

void Canvas2DRenderingContext::UpdateTransform() {
	this->d2dcontext->SetTransform(currentTransform);
}

void Canvas2DRenderingContext::restore(const Local<Object>& info) {
	//bruh pop_back doesn't return anything i thought it wouold be like js
	std::cout << this->stateStack.size() - 1 << " stateStack" << std::endl;
	SaveState state = this->stateStack[this->stateStack.size() - 1];
	Isolate* isolate = info->GetIsolate();
	this->d2dcontext->RestoreDrawingState(state.realState);
	state.realState->Release(); //oops forgot that
	this->d2dcontext->GetTransform(&this->currentTransform); //oh yeah forgot that too
	
	info->Set(isolate->GetCurrentContext(), LITERAL("fillStyle"), String::NewFromOneByte(isolate, (const uint8_t*)state.fillcolor.c_str()).ToLocalChecked());
	info->Set(isolate->GetCurrentContext(), LITERAL("strokeStyle"), String::NewFromOneByte(isolate, (const uint8_t*)state.strokecolor.c_str()).ToLocalChecked());
	info->Set(isolate->GetCurrentContext(), LITERAL("font"), String::NewFromOneByte(isolate, (const uint8_t*)state.font.c_str()).ToLocalChecked());
	info->Set(isolate->GetCurrentContext(), LITERAL("lineWidth"), Number::New(isolate, state.lineWidth));
	this->stateStack.pop_back();
}

//void Canvas2DRenderingContext::FindOrCreateBrush(std::string brush) {
//
//}

void Canvas2DRenderingContext::SetFillStyle(const char* style) {
	/*if (this->fillStyle) {
		delete[] this->fillStyle;
	}
	size_t len = strlen(style);
	this->fillStyle = new char[len+1];
	strcpy(this->fillStyle, style);*/

	//ok i WAS gonna use a char* on the heap but since most of the style strings are usually less than 7 characters, i could get the benefits of using a string (if the data in a vector is less than 16 bytes)
	//this->fillStyle.resize(strlen(style));
	this->fillStyle = std::string(style);
	this->fillBrush->SetColor(this->SerializeColor(this->fillStyle));
}

void Canvas2DRenderingContext::SetStrokeStyle(const char* style) {
	this->strokeStyle = std::string(style);
	this->strokeBrush->SetColor(this->SerializeColor(this->strokeStyle));
}

D2D1_COLOR_F Canvas2DRenderingContext::SerializeColor(std::string color) {
	//https://html.spec.whatwg.org/multipage/canvas.html#serialisation-of-a-color
	//regex for rgb/rgba /[0-9.]+/g
	D2D1_COLOR_F retColor{0, 0, 0, 1.0};
	//std::cout << color << " " << color.rfind("rgb", 0) << std::endl;
	if (color.rfind("rgb", 0) == 0) {
		//regex time
		//std::string::const_iterator text_iter = color.cbegin();
		//std::smatch results; //(wrong)
		//while (std::regex_search(text_iter, color.end(), results, r)) //wtf is results bruh i don't know
		//{
		//	int count = results.size();
		//	
		//
		//	std::cout << std::string(results[0].first, results[0].second) << std::endl;
		//	text_iter = results[0].second;
		//}

		std::string color2(color); //(unfortunately)
		std::smatch m;
		//std::regex_search(color, m, r);
		float c[4]{ 0.0, 0.0, 0.0, 1.0 };//{1.0}; //oh i thought this would set every element to 1.0? (damn it just doesn't work like that)
		int i = 0;
		//for (std::ssub_match v : m) {
		while (std::regex_search(color2, m, rgbregex)) {
			//aw i thought i could access a struct like retColor[0] but nope (but i can cheat with pointers! (but the google says that's a bad idea))
			float v = std::stof(std::string(m[0].first, m[0].second));
			if (i < 3) { //4th value is 0 - 1 (for some reason)
				v /= 255.f;
			}
			c[i] = v;
			//std::cout << v << " ERM" << std::endl;
			color2 = m.suffix().str();
			i++;
		}
		retColor = {c[0], c[1], c[2], c[3]};
	}
	else if (color[0] == '#') { //for some reason the spec specifically mentions that the hex should be in lowercase for some reason but in html canvas it actually doesn't matter
		//here's what the google says for string to lower
		std::transform(color.begin(), color.end(), color.begin(),
			[](unsigned char c) { return std::tolower(c); });

		//wow the cppreference for regex dropped the expression for hex color (https://en.cppreference.com/w/cpp/regex/regex_search)
		//lmao https://puzzling.stackexchange.com/questions/127064/unpaired-socks-in-my-lap
		std::smatch m;
		float c[3]{ 0.0, 0.0, 0.0 };
		if (std::regex_search(color, m, hexregex))
		{
			for (std::size_t i = 1; i < m.size(); ++i) {//[idgaf] about the first element
				c[i - 1] = ((float)std::stoi(m[i].str(), nullptr, 16)) / 255.f;
				//std::cout << i << ": " << m[i] << '\n';
			}
		}
		retColor = { c[0], c[1], c[2], 1.0 };
	}
	else {
		//imma find a list of the css names for colors or whatever soon

	}
	//std::cout << retColor.r << " " << retColor.g << " " << retColor.b << " " << retColor.a << std::endl;
	return retColor;
}

Local<ObjectTemplate> Canvas2DRenderingContext::jsPathTemplate;
void Canvas2DRenderingContext::defineTemplates(Isolate* isolate) {
	Canvas2DRenderingContext::jsPathTemplate = ObjectTemplate::New(isolate);

	jsPathTemplate->Set(isolate, "Release", FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo<v8::Value>& info) {
        Isolate* isolate = info.GetIsolate();
		ID2D1PathGeometry1* path = (ID2D1PathGeometry1*)IntegerFI(info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalPtr")).ToLocalChecked());
		ID2D1GeometrySink* sink = (ID2D1GeometrySink*)IntegerFI(info.This()->GetRealNamedProperty(isolate->GetCurrentContext(), LITERAL("internalSinkPtr")).ToLocalChecked());
		
		sink->Release();
		path->Release();
    }));
}

Local<Object> Canvas2DRenderingContext::getJSPathImpl(Isolate* isolate, ID2D1PathGeometry1* path, ID2D1GeometrySink* sink) {
	Local<Context> context = isolate->GetCurrentContext();
	Local<Object> jsPath = jsPathTemplate->NewInstance(context).ToLocalChecked();
	jsPath->Set(context, LITERAL("internalPtr"), Number::New(isolate, (LONG_PTR)path));
	///ID2D1GeometrySink* sink;
	///ContIfFailed(path->Open(&sink), "ID2D1PathGeometry1->Open failed! Most path functions will not work on this object! (beginPath[->]getJSPathImpl stacktrace)");
	jsPath->Set(context, LITERAL("internalSinkPtr"), Number::New(isolate, (LONG_PTR)sink));

	return jsPath;
}

/*Local<Object>*/void Canvas2DRenderingContext::beginPath(Isolate* isolate, D2D1_POINT_2F point, D2D1_FIGURE_BEGIN fill) {
	//ID2D1PathGeometry1* path;
	//ID2D1GeometrySink* sink;
	//aw i thought i didn't have to create them every time
	SafeRelease(path);
	SafeRelease(sink);

	RetIfFailed(this->factory->CreatePathGeometry(&this->path), "ID2D1Factory7->CreatePathGeometry failed (beginPath Canvas2DRenderingContext)");
	//if (this->sink == nullptr) {
	RetIfFailed(path->Open(&this->sink), "ID2D1PathGeometry1->Open failed! (beginPath Canvas2DRenderingContext)"); //wait can you reopen the same one? (no.)
	//}
	sink->BeginFigure(point, fill);
	//Local<Object> jsPathGeo = Canvas2DRenderingContext::jsPathTemplate->NewInstance(isolate->GetCurrentContext()).ToLocalChecked();
	//return getJSPathImpl(isolate, path, sink);
}

void Canvas2DRenderingContext::closePath(D2D1_FIGURE_END end) {
	if (sink != nullptr) {
		sink->EndFigure(end);
		RetIfFailed(sink->Close(), "Failed to Close() ID2D1GeometrySink (closePath)");
		SafeRelease(sink);
	}
}