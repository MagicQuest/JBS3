#pragma once

#include "goodmacrosfordirect2dandwichelper.h"
#include <string>
#include <wincodec.h>
#include <sstream>

struct WICHelper
{
	IWICImagingFactory2* wicFactory;

	WICHelper() {
		wicFactory = nullptr;
	}
	~WICHelper() {
		SafeRelease(wicFactory);
	}
	bool Init();
	IWICFormatConverter* LoadBitmapFromFrame(IWICBitmapDecoder* wicDecoder, IWICBitmapFrameDecode* wicFrame, GUID format, bool release);
	IWICFormatConverter* LoadBitmapFromFilename(const wchar_t* filenamews, GUID format, int frame);
	//IWICFormatConverter* LoadBitmapFromStream(const wchar_t* stream, GUID format, int frame);
};

