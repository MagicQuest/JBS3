#pragma once

#include <d2d1.h>
#include <dwrite_3.h>
#include <wincodec.h>
//#include <v8.h>

//using namespace v8;

//template<typename T>
class Direct2D
{
public:
	//https://stackoverflow.com/questions/37285528/drawing-and-creating-non-rectangular-bitmaps-using-direct2d
	// https://learn.microsoft.com/en-us/windows/win32/direct2d/improving-direct2d-performance
	// https://groups.google.com/g/microsoft.public.win32.programmer.directx.graphics/c/aDiqBVY43Jw
	// https://stackoverflow.com/questions/21768180/direct2d-how-to-save-content-of-id2d1rendertarget-to-an-image-file
// 
	//T* renderTarget;
	ID2D1RenderTarget* renderTarget;
	ID2D1Factory* factory;
	IDWriteFactory7* textfactory; //lol forgo to capitaliez f
	ID2D1SolidColorBrush* clearBrush;
	IWICImagingFactory2* wicFactory;
	ID2D1DrawingStateBlock* drawingStateBlock;
	//IDWriteTextFormat* textFormat;
	
	Direct2D() {
		factory = nullptr;
		renderTarget = nullptr;
		textfactory = nullptr;
		clearBrush = nullptr;
		wicFactory = nullptr;
		drawingStateBlock = nullptr;
		//textFormat = nullptr;
	}

	~Direct2D() {
		if (factory != nullptr) {
			factory->Release();
		}
		if (renderTarget != nullptr) {
			renderTarget->Release();
		}
		if (textfactory != nullptr) {
			textfactory->Release();
		}
		if (clearBrush != nullptr) {
			clearBrush->Release();
		}
		if (wicFactory != nullptr) {
			wicFactory->Release();
		}
		if (drawingStateBlock != nullptr) {
			drawingStateBlock->Release();
		}
		//std::cout << ("D2D DESTROYED") << std::endl;
		//if (textFormat != nullptr) {
		//	textFormat->Release();
		//}
	}

	bool Init(HWND window, int type);

	//void BeginDraw() {
	//V8FUNC(BeginDraw) {
	//	renderTarget->BeginDraw();
	//}
	//
	//V8FUNC(EndDraw) {
	//	renderTarget->EndDraw();
	//}
};

