#pragma once
#include "Direct2D11.h"
#include <vector>
#include <string>
#include <d2d1helper.h>
#include <map>
#include "v8-object.h"
class Canvas2DRenderingContext : public Direct2D11 //wait wtf???
{
public:
	struct SaveState {
		ID2D1DrawingStateBlock* realState;
		const char* brushcolor;
		const char* strokecolor;
		const char* font;
		int lineWidth;
	};

	std::vector<SaveState> stateStack;
	D2D1::Matrix3x2F currentTransform;
	std::map<std::string, ID2D1Brush*> colorBrushes;
	void save(const v8::Local<v8::Object>&);
	void restore(const v8::Local<v8::Object>&);
	void UpdateTransform();
	void FindOrCreateBrush(std::string);

	~Canvas2DRenderingContext() {
		for (SaveState& state : stateStack) {
			state.realState->Release();
		}
		stateStack.clear();
	}
};

