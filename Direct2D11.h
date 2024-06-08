#pragma once

#include <d3d11_4.h>
#include "Direct2D.h"
//#include "goodmacrosfordirect2dandwichelper.h"
#include <dcomp.h>
#include <wrl.h>

using namespace Microsoft::WRL;

class Direct2D11 : Direct2D
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

    Direct2D11() {

    }

    bool Init(HWND window, int type);

    int Resize(UINT width, UINT height);

    bool CreateAndSetDrawingBitmaps();

    void EndDraw(bool donotpresent);
};