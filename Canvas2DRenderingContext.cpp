#include "Canvas2DRenderingContext.h"

using namespace v8;

bool Canvas2DRenderingContext::Init(HWND window) {
	((Direct2D11*)this)->Init(window, 3); //lmao
	SusIfFailed(this->d2dcontext->CreateSolidColorBrush(D2D1::ColorF(0, 0, 0, 1.0), &this->fillBrush), "Canvas2DRenderingContext failed to create fillStyleBrush");
	SusIfFailed(this->d2dcontext->CreateSolidColorBrush(D2D1::ColorF(0, 0, 0, 1.0), &this->strokeBrush), "Canvas2DRenderingContext failed to create strokeStyleBrush");

}

void Canvas2DRenderingContext::save(const Local<Object>& jsObj) {
	SaveState newState{0, };
	RetIfFailed(this->factory->CreateDrawingStateBlock(D2D1::DrawingStateDescription(), &newState.realState), "failed to CreateDrawingStateBlock");
	this->d2dcontext->SaveDrawingState(newState.realState);
	this->stateStack.push_back(newState);
}

void Canvas2DRenderingContext::UpdateTransform() {
	this->d2dcontext->SetTransform(currentTransform);
}

void Canvas2DRenderingContext::restore(const Local<Object>& jsObj) {
	//bruh pop_back doesn't return anything i thought it wouold be like js
	SaveState state = this->stateStack[this->stateStack.size() - 1];
	this->d2dcontext->RestoreDrawingState(state.realState);
	this->stateStack.pop_back();
}

//void Canvas2DRenderingContext::FindOrCreateBrush(std::string brush) {
//
//}

D2D1_COLOR_F Canvas2DRenderingContext::SerializeColor(std::string color) {
	//https://html.spec.whatwg.org/multipage/canvas.html#serialisation-of-a-color
}