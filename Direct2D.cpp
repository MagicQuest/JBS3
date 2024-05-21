#include "Direct2D.h"
#include <string>
#include <typeinfo>

//#define err(shit, cstring) MessageBoxA(NULL, std::to_string(shit).c_str(), cstring, MB_OK | MB_ICONERROR);

//template <typename T>
bool Direct2D::Init(HWND window, int type) {
	/*HRESULT shit = */SusIfFailed(D2D1CreateFactory(D2D1_FACTORY_TYPE_SINGLE_THREADED, &factory), "Graphics Init Create Factory");
	//if (shit != S_OK) {
	//	err(shit, "Graphics Init Create Factory");
	//	return false;
	//}

	RECT rect{ 0 };// GetClientRect(window, &rect);
	//I DIDN'T INITIALIZE RECT AND IT WAS FULL OF GARBAGE
	if (window == NULL) {
		rect.right = 1920;
		rect.bottom = 1080;
	}
	else {
		GetClientRect(window, &rect);
	}

	//if constexpr (std::is_same_v<ID2D1RenderTarget, T>) {
	if(type == 0) {
		/*shit = */SusIfFailed(factory->CreateHwndRenderTarget(D2D1::RenderTargetProperties(), D2D1::HwndRenderTargetProperties(window, D2D1::SizeU(rect.right, rect.bottom)), (ID2D1HwndRenderTarget**)&renderTarget), "Graphics Init Create HWND Render Target");

		//if (shit != S_OK) {
		//	err(shit, "Graphics Init Create DC Render Target");
		//	err(GetLastError(), "Graphics Init DC Create Render Target");
		//	return false;
		//}
	}else if(type == 1) {
	//else if constexpr (std::is_same_v<ID2D1DCRenderTarget, T>) {
		D2D1_RENDER_TARGET_PROPERTIES props = D2D1::RenderTargetProperties(D2D1_RENDER_TARGET_TYPE_DEFAULT,
			D2D1::PixelFormat(
				DXGI_FORMAT_B8G8R8A8_UNORM,
				D2D1_ALPHA_MODE_PREMULTIPLIED), //having this set to ignore seriously made using CreateBitmap->CopyFromBitmap(WICBitmap) stop working (lemme explain)
			//i used fnBmp = CreateBitmapFromFilename("...")
			//then made another bitmap with cBitmap = CreateBitmap(...)
			//i wanted to copy the fnBmp to the cBitmap so
			//i used cBitmap.CopyFromBitmap(..., fnBmp, ...)
			//and it failed because cBitmap had a different pixel format and here was the source of that difference
			0,
			0,
			D2D1_RENDER_TARGET_USAGE_NONE,
			D2D1_FEATURE_LEVEL_DEFAULT
		);
		/*shit = */SusIfFailed(factory->CreateDCRenderTarget(&props, (ID2D1DCRenderTarget**)&renderTarget), "Graphics Init Create DC Render Target");

		//if (shit != S_OK) {
		//	err(shit, "Graphics Init Create DC Render Target");
		//	err(GetLastError(), "Graphics Init DC Create Render Target");
		//	return false;
		//}

		HDC dc = GetDC(window);

		HRESULT shit = ((ID2D1DCRenderTarget*)renderTarget)->BindDC(dc, &rect); //yo i forgot to release it

		ReleaseDC(window, dc);

		//if (shit != S_OK) {
			//err(shit, "Graphics Bind DC");
			SusIfFailed(shit, "Graphics Bind DC");
			//return false;
		//}
	}

	/*shit = */SusIfFailed(DWriteCreateFactory(DWRITE_FACTORY_TYPE_SHARED, __uuidof(IDWriteFactory7), (IUnknown**)&textfactory), "Graphics Init Direct Write Instantiation");
	//if (shit != S_OK) {
	//	err(shit, "Graphics Init Direct Write Instantiation"); //big ass word for no reason
	//	return false;
	//}

	/*shit = */ContIfFailed(renderTarget->CreateSolidColorBrush(D2D1::ColorF(0, 0, 0, 0), &clearBrush), "Graphics Init Clear Brush (this isn't actually required so you can continue as normal (you cannot d2d.Clear with opacity anymore) )"); //idk if this is required because im pretty sure you can already clear with opacity?
	//if (shit != S_OK) {
	//	MessageBoxA(NULL, "Graphics Init Clear Brush", "this isn't actually required so you can continue as normal (you cannot d2d.Clear with opacity anymore)", MB_OK | MB_ICONINFORMATION);
	//}

	//shit = CoCreateInstance(CLSID_WICImagingFactory, NULL, CLSCTX_INPROC_SERVER, IID_IWICImagingFactory, (LPVOID*)&wicFactory);
	
	//if (shit != S_OK) {
	//    MessageBoxA(NULL, "yo shit FUCKED UP co create instance WIC image", "yeah we failed to create the wic factory (for loading bitmaps/pictures)", MB_OK | MB_ICONERROR);
	//    //return;
	//}

	/*shit = */ContIfFailed(factory->CreateDrawingStateBlock(D2D1::DrawingStateDescription(), &drawingStateBlock), "HELP create drawing state block did NOT work (cannot Save/Restore DrawingState)");//D2D1::DrawingStateDescription();
	
	//if (shit != S_OK) {
	//	MessageBoxA(NULL, "HELP create drawing state block did NOT work (cannot Save/Restore DrawingState)", "uhhhh we need some HELP!", MB_OK | MB_ICONERROR);
	//	//return false;
	//}

	this->type = type;
	this->window = window;

	return true;
	//err(21, typeid(T).name());
}