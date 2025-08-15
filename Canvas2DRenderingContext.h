#pragma once
#include "Direct2D11.h"
#include <vector>
#include <string>
#include <d2d1helper.h>
#include <map>
#include "v8-object.h"
#include "v8-template.h"
#include "v8-isolate.h"
#include <regex>
#include <iostream>

static std::regex rgbregex("[0-9.]+");
static std::regex hexregex("#([a-f0-9]{2})"
						      "([a-f0-9]{2})"
							  "([a-f0-9]{2})");

class Canvas2DRenderingContext : public Direct2D11 //wait wtf public???
{
public:
	struct SaveState {
		ID2D1DrawingStateBlock* realState;
		std::string fillcolor; //v8 gets weird when storing c-strings
		std::string strokecolor;
		std::string font;
		float lineWidth;
	};

	std::vector<SaveState> stateStack;
	D2D1::Matrix3x2F currentTransform;
	//char* fillStyle;
	//char* strokeStyle;
	std::string fillStyle;
	std::string strokeStyle;
	ID2D1SolidColorBrush* fillBrush = nullptr;
	ID2D1SolidColorBrush* strokeBrush = nullptr;
	ID2D1PathGeometry1* path = nullptr;
	ID2D1GeometrySink* sink = nullptr;
	//std::map<std::string, ID2D1Brush*> colorBrushes;
	void save(const v8::Local<v8::Object>&);
	void restore(const v8::Local<v8::Object>&);
	void UpdateTransform();
	void beginPath(v8::Isolate*, D2D1_POINT_2F, D2D1_FIGURE_BEGIN);
	void closePath(D2D1_FIGURE_END);
	static void defineTemplates(v8::Isolate*);
	static v8::Local<v8::ObjectTemplate> jsPathTemplate;
	static v8::Local<v8::Object> getJSPathImpl(v8::Isolate*, ID2D1PathGeometry1*, ID2D1GeometrySink*);
	//void FindOrCreateBrush(std::string);
	//void UpdateFillBrush(const char*);
	//void UpdateStrokeBrush(const char*);
	void SetFillStyle(const char*);
	void SetStrokeStyle(const char*);
	D2D1_COLOR_F SerializeColor(std::string color);

	bool Init(HWND window);

	~Canvas2DRenderingContext() {
		for (SaveState& state : stateStack) {
			state.realState->Release();
		}
		stateStack.clear();
		
		SafeRelease(fillBrush);
		SafeRelease(strokeBrush);

		SafeRelease(path);
		SafeRelease(sink);
	}
};