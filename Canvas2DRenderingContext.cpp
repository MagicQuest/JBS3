#include "Canvas2DRenderingContext.h"

using namespace v8;

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

void Canvas2DRenderingContext::FindOrCreateBrush(std::string brush) {

}