#include "pch.h"
#include "opencvhelper.h"
#include <iostream>

//this nigga got my shit right https://www.youtube.com/watch?v=YUjamcyuKT4

using namespace cv;

OPENCVHELPER_API void* getVideoCapture(int whatever, int preference = 0) {
	VideoCapture* cap = new VideoCapture(whatever, preference);
	return cap;
}

OPENCVHELPER_API void* getVideoCaptureFromFilename(const char* darksouls3skillcheck) { //unrelated variable name
	VideoCapture* cap = new VideoCapture(darksouls3skillcheck); //this wasn't working because it couldn't find the ffmpeg4100 dll
	//std::cout << darksouls3skillcheck << std::endl;
	//HDC dc = GetDC(NULL);
	//TextOutA(dc, 0, 0, darksouls3skillcheck, 25);
	//ReleaseDC(NULL, dc);
	return cap;
}

OPENCVHELPER_API void* getFrameDataFromCapture(void* ptr, /*float*/int frameNumber, bool length) {
	VideoCapture* cap = (VideoCapture*)ptr;
	cap->set(CAP_PROP_POS_FRAMES, frameNumber);
	Mat frame; cap->operator>>(frame); //cap->operator>>(frame);

	//float width = cap->get(CAP_PROP_FRAME_WIDTH);
	//float height = cap->get(CAP_PROP_FRAME_HEIGHT);

	size_t len = frame.dataend - frame.datastart;//width * height * 3;

	uchar* memodata = new uchar[len];
	memcpy(memodata, frame.data, len);

	if (length) {
		return (void*)(len);
	}
	else {
		return memodata; //frame.data; //awshit i thought if i used frame.datastart it would work better because it was a const uchar*
	}
}

OPENCVHELPER_API void freeData(void* ptr) {
	delete[] ptr;
}

OPENCVHELPER_API void* getNextFrameDataFromCapture(void* ptr, bool length) {
	VideoCapture* cap = (VideoCapture*)ptr;
	Mat frame; cap->operator>>(frame); //cap->operator>>(frame);
	
	size_t len = frame.dataend - frame.datastart;//width * height * 3;

	uchar* memodata = new uchar[len];
	memcpy(memodata, frame.data, len);

	if (length) {
		return (void*)(len);
	}
	else {
		return memodata;
	}
}

OPENCVHELPER_API int setCapProp(void* cap, int propId, int/*double*/ value) { //as a limitation of jbs's DllCall i can't have NO floats or doubles
	return ((VideoCapture*)cap)->set(propId, value);
}

OPENCVHELPER_API int/*double*/ getCapProp(void* cap, int propId) { //as a limitation of jbs's DllCall i can't have NO floats or doubles
	return (int)((VideoCapture*)cap)->get(propId);
}

OPENCVHELPER_API int isVideoCaptureOpened(void* ptr) { //oops apparently returning a bool doesn't work
	VideoCapture* cap = (VideoCapture*)ptr;
	return cap->isOpened();
}

OPENCVHELPER_API void releaseVideoCapture(void* ptr) {
	VideoCapture* cap = (VideoCapture*)ptr;
	cap->release();
	delete cap;
}