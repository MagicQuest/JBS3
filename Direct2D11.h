#pragma once

#include <d3d11_4.h>
#include "Direct2D.h"
//#include "goodmacrosfordirect2dandwichelper.h"
#include <dcomp.h>
#include <wrl.h>

//https://www.gamedev.net/forums/topic/639578-d2d-d3d11-help-me-to-make-them-work-together/
//https://www.gamedev.net/forums/topic/650990-transparency-problems-with-d2d-over-d3d/
//just in case

using namespace Microsoft::WRL;

class Direct2D11 : public Direct2D
{
public:
    ComPtr<ID3D11Device> d11device;
    ComPtr<ID3D11DeviceContext> d11context;
    ComPtr<ID2D1DeviceContext> d2dcontext;
    ComPtr<IDXGIDevice> dxgiDevice;
    ComPtr<ID2D1Device6> d2device;
    ComPtr<IDXGISwapChain1> swapChain;
    ComPtr<ID2D1Bitmap1> d2dTargetBitmap;
    ComPtr<ID2D1Bitmap1> d2dBackBitmap;
    ComPtr<IDXGIAdapter> dxgiAdapter;
    ComPtr<IDXGIFactory2> dxgiFactory;
    ComPtr<ID3D11Texture2D> backBuffer;
    ComPtr<IDXGISurface> dxgiBackBuffer;

    //optional
    ComPtr<IDCompositionDesktopDevice> m_dcompDevice;
    ComPtr<IDCompositionTarget> m_dcompTarget;
    ComPtr<IDCompositionVisual2> m_dcompVisual;
    ComPtr<IDCompositionDevice3> m_dcompD1;

    ComPtr<IDXGIOutputDuplication> pDuplication;
    ComPtr<IDXGIResource> pDesktopResource;
    //ComPtr<ID2D1Bitmap1> pDesktopBitmap;

    ~Direct2D11() {
        //oh you aren't supposed to call bass class destructors!
        swapChain->SetFullscreenState(FALSE, NULL); //apparently d3d wont shut down if we're in fullscreen (http://www.directxtutorial.com/Lesson.aspx?lessonid=11-4-4)
    }

    bool Init(HWND window, int type);

    int Resize(UINT width, UINT height);

    bool CreateAndSetDrawingBitmaps();

    bool ConvertID3D11Texture2DToID2D1Bitmap(ID3D11DeviceContext* ctx, ID3D11Texture2D* texture, ID2D1Bitmap1* bitmap);

    void EndDraw(bool donotpresent);
};