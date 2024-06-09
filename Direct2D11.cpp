#include "Direct2D11.h"
#include <string>
//#include <iostream>

using namespace D2D1;

bool Direct2D11::Init(HWND window, int type) {
    this->type = type;

    RECT r{0}; GetClientRect(window, &r);

    SusIfFailed(D2D1CreateFactory(D2D1_FACTORY_TYPE_SINGLE_THREADED, &factory), "Graphics Init Create Factory");

    // This flag adds support for surfaces with a different color channel ordering than the API default.
    // You need it for compatibility with Direct2D.
#ifndef _DEBUG
    UINT creationFlags = D3D11_CREATE_DEVICE_BGRA_SUPPORT;
#else
    MessageBoxA(NULL, "DEBUG", "HELP", MB_OK);
    UINT creationFlags = D3D11_CREATE_DEVICE_BGRA_SUPPORT | D3D11_CREATE_DEVICE_DEBUG;
#endif
    // This array defines the set of DirectX hardware feature levels this app  supports.
    // The ordering is important and you should  preserve it.
    // Don't forget to declare your app's minimum required feature level in its
    // description.  All apps are assumed to support 9.1 unless otherwise stated.
    D3D_FEATURE_LEVEL featureLevels[] =
    {
        D3D_FEATURE_LEVEL_11_1,
        D3D_FEATURE_LEVEL_11_0,
        D3D_FEATURE_LEVEL_10_1,
        D3D_FEATURE_LEVEL_10_0,
        D3D_FEATURE_LEVEL_9_3,
        D3D_FEATURE_LEVEL_9_2,
        D3D_FEATURE_LEVEL_9_1
    };

    // Create the DX11 API device object, and get a corresponding context.

    SusIfFailed(D3D11CreateDevice(
        nullptr,                    // specify null to use the default adapter
        D3D_DRIVER_TYPE_HARDWARE,
        0,
        creationFlags,              // optionally set debug and Direct2D compatibility flags
        featureLevels,              // list of feature levels this app can support
        ARRAYSIZE(featureLevels),   // number of possible feature levels
        D3D11_SDK_VERSION,
        &d11device,                    // returns the Direct3D device created
        nullptr,            // returns feature level of device created
        &d11context                    // returns the device immediate context
    ), "Graphics Init D3D11CreateDevice");

    // Obtain the underlying DXGI device of the Direct3D11 device.
    //DX::ThrowIfFailed(
    SusIfFailed(d11device.As(&dxgiDevice), "cast d11device to dxgiDevice");//->QueryInterface(IID_PPV_ARGS(&dxgiDevice));//__uuidof(IDXGIDevice4), (void**)&dxgiDevice);//d11device.As(&dxgiDevice);
    //);

    // Obtain the Direct2D device for 2-D rendering.
    //DX::ThrowIfFailed(
        //MessageBoxA(NULL, "he was running frrom a cop car", to_string((LONG_PTR)dxgiDevice).c_str(), MB_OK);
        //MessageBoxA(NULL, "he was running frrom a cop car", to_string((LONG_PTR)&d2device).c_str(), MB_OK);
    SusIfFailed(factory->CreateDevice(dxgiDevice.Get(), &d2device), "Graphics Init CreateDevice");
    //);

    // Get Direct2D device's corresponding device context object.
    //DX::ThrowIfFailed(
    SusIfFailed(d2device->CreateDeviceContext(
        D2D1_DEVICE_CONTEXT_OPTIONS_NONE,
        &d2dcontext
    ), "Graphics Init CreateDeviceContext");
    //);
    DXGI_SWAP_CHAIN_DESC1 swapChainDesc = { 0 };
    swapChainDesc.Width = r.right;
    swapChainDesc.Height = r.bottom;
    swapChainDesc.Format = DXGI_FORMAT_B8G8R8A8_UNORM; // this is the most common swapchain format
    swapChainDesc.Stereo = false;
    swapChainDesc.SampleDesc.Count = 1;                // don't use multi-sampling
    swapChainDesc.SampleDesc.Quality = 0;
    swapChainDesc.BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT;
    swapChainDesc.BufferCount = 2;                     // use double buffering to enable flip
    swapChainDesc.Scaling = DXGI_SCALING_STRETCH;
    swapChainDesc.SwapEffect = DXGI_SWAP_EFFECT_FLIP_SEQUENTIAL; // all apps must use this SwapEffect
    swapChainDesc.Flags = 0; //DXGI_SWAP_CHAIN_FLAG_GDI_COMPATIBLE (OOOOOOOOOOUH)
    if (type == 3) {
        swapChainDesc.AlphaMode = DXGI_ALPHA_MODE_PREMULTIPLIED; // <--
    }

    // Identify the physical adapter (GPU or card) this device is runs on.
    //DX::ThrowIfFailed(
    SusIfFailed(dxgiDevice->GetAdapter(&dxgiAdapter), "GetAdapter");
    //    );

    // Get the factory object that created the DXGI device.
    //DX::ThrowIfFailed(
    SusIfFailed(dxgiAdapter->GetParent(__uuidof(IDXGIFactory4), (void**)&dxgiFactory), "GetParent?");//IID_PPV_ARGS(&dxgiFactory));
    //    );

    // Get the final swap chain for this window from the DXGI factory.
    //DX::ThrowIfFailed(
        //MessageBoxA(NULL, "getlasterror", _bstr_t(_com_error(GetLastError()).ErrorMessage()), MB_OK);
    if (type == 3) {
        SusIfFailed(dxgiFactory->CreateSwapChainForComposition(//CreateSwapChainForCoreWindow(
            d11device.Get(),
            &swapChainDesc,
            nullptr,    // allow on all displays
            &swapChain
        ), "CreateSwapChainForComposition");
    }
    else {
        SusIfFailed(dxgiFactory->CreateSwapChainForHwnd(//CreateSwapChainForCoreWindow(
            d11device.Get(),
            window,
            &swapChainDesc,
            NULL,
            nullptr,    // allow on all displays
            &swapChain
        ), "CreateSwapChainForHwnd");
    }
    //     );

     // Ensure that DXGI doesn't queue more than one frame at a time.
     //DX::ThrowIfFailed(
         //SusIfFailed(dxgiDevice->SetMaximumFrameLatency(1);
         //if (shit != S_OK) {
         //    err(shit, "Graphics Init SetMaxFrameLatency");
         //    return false;
         //}
     //    );

     // Get the backbuffer for this window which is be the final 3D render target.
     //DX::ThrowIfFailed(
    SusIfFailed(swapChain->GetBuffer(0, IID_PPV_ARGS(&backBuffer)), "Graphic sInit GetBuffer");

    //    );


    // Direct2D needs the dxgi version of the backbuffer surface pointer.
    //DX::ThrowIfFailed(
    SusIfFailed(swapChain->GetBuffer(0, IID_PPV_ARGS(&dxgiBackBuffer)), "Graphics INit CreateFactory");
    //    );


                // Now we set up the Direct2D render target bitmap linked to the swapchain. 
    // Whenever we render to this bitmap, it is directly rendered to the 
    // swap chain associated with the window.

    //float dpi = GetDpiForWindow(window);

    this->renderTarget = (ID2D1RenderTarget*)this->d2dcontext.Get();

    SusIfFailed(DWriteCreateFactory(DWRITE_FACTORY_TYPE_SHARED, __uuidof(IDWriteFactory7), (IUnknown**)&textfactory), "Graphics Init Direct Write Instantiation");

    ContIfFailed(renderTarget->CreateSolidColorBrush(D2D1::ColorF(0, 0, 0, 0), &clearBrush), "Graphics Init Clear Brush (this isn't actually required so you can continue as normal (you cannot d2d.Clear with opacity anymore) )"); //idk if this is required because im pretty sure you can already clear with opacity?

    ContIfFailed(factory->CreateDrawingStateBlock(D2D1::DrawingStateDescription(), &drawingStateBlock), "HELP! Create drawing state block did NOT work (cannot Save/Restore DrawingState)");//D2D1::DrawingStateDescription();

    CreateAndSetDrawingBitmaps();

    if (type == 3) {
        //ComPtr<IDCompositionDevice3> m_dcompD1;
        // (1) Create the DirectComposition device
        SusIfFailed(DCompositionCreateDevice3(
            //nullptr, // <- DirectX 12 specific; see below
            dxgiDevice.Get(),
            IID_PPV_ARGS(m_dcompDevice.ReleaseAndGetAddressOf())), "DCompositionCreateDevice");

        //m_dcompDevice.As(&m_dcompD1);
        SusIfFailed(m_dcompDevice->QueryInterface(__uuidof(IDCompositionDevice3), (LPVOID*)&m_dcompD1), "DComp QueryInterface");

        // (2) Create a DirectComposition target associated with the window (pass in hWnd here)
        SusIfFailed(m_dcompDevice->CreateTargetForHwnd(window,
            true,
            m_dcompTarget.ReleaseAndGetAddressOf()), "Dcomp CreateTargetForHwnd");

        // (3) Create a DirectComposition "visual"
        SusIfFailed(m_dcompDevice->CreateVisual(m_dcompVisual.ReleaseAndGetAddressOf()), "Dcomp CreateVisual");

        SusIfFailed(m_dcompVisual->SetContent(swapChain.Get()), "Dcomp SetContent");

        SusIfFailed(m_dcompTarget->SetRoot(m_dcompVisual.Get()), "Dcomp SetRoot");
        SusIfFailed(m_dcompDevice->Commit(), "Dcomp Commit");
    }

    ComPtr<IDXGIOutput> tempOutput;
    for (UINT i = 0; dxgiAdapter->EnumOutputs(i, &tempOutput) != DXGI_ERROR_NOT_FOUND; i++) {
        break;
    }
    ComPtr<IDXGIOutput1> dxgiOutput;
    //ComPtr<IDXGIOutputDuplication> pDuplication;

    SusIfFailed(tempOutput->QueryInterface(__uuidof(IDXGIOutput1), (void**)&dxgiOutput), "QueryInterface dxgiOutput (for desktop duplication)");
    SusIfFailed(dxgiOutput->DuplicateOutput(dxgiDevice.Get(), &pDuplication), "duplicate output");//d2device.Get(), &pDuplication);

    DXGI_OUTDUPL_DESC duplDesc;
    pDuplication->GetDesc(&duplDesc);

    //ComPtr<IDXGIResource> pDesktopResource;
    D2D1_BITMAP_PROPERTIES screenProperties =
        D2D1::BitmapProperties(
            D2D1::PixelFormat(
                DXGI_FORMAT_B8G8R8A8_UNORM,
                D2D1_ALPHA_MODE_IGNORE),
            0,
            0
        );

    //ComPtr<ID2D1Bitmap> pTempBitmap;
    //d2dcontext->CreateBitmap(D2D1::SizeU(GetSystemMetrics(SM_CXSCREEN), GetSystemMetrics(SM_CYSCREEN)), screenProperties, pTempBitmap.GetAddressOf());
    ////SusIfFailed(d2dcontext->CreateBitmapFromDxgiSurface(dxgiBackBuffer.Get(), &screenProperties, &pDesktopBitmap), "creat enew pdesktopbitmap");
    //pTempBitmap.As(&pDesktopBitmap);
}

int Direct2D11::Resize(UINT width, UINT height) {
    //std::cout << ("inheritance call to resize idk if this gonna work but it should right") << std::endl;

    dxgiBackBuffer->Release();
    backBuffer->Release();
    d2dTargetBitmap = nullptr;//->Release();// = nullptr;
    d2dBackBitmap = nullptr;//->Release();// = nullptr;
    //bruh i had everything right besides the one thing i thought wouldn't be it
    //it seems like for some reason you have to release the d2dcontext TOO??/
    d2dcontext->SetTarget(NULL); //WAIT IM A GENIUS
    //no release of d2dTargetBitmap because ComPtrs will release when & (wait nvm)
    //d2dcontext->SetTarget(NULL);
    ContIfFailed(swapChain->ResizeBuffers(0, width, height, DXGI_FORMAT_UNKNOWN, 0), "ResizeBuffers");
    SusIfFailed(swapChain->GetBuffer(0, IID_PPV_ARGS(dxgiBackBuffer.GetAddressOf())), "Graphics INit CreateFactory");
    SusIfFailed(swapChain->GetBuffer(0, IID_PPV_ARGS(backBuffer.GetAddressOf())), "Graphic sInit GetBuffer");
    return CreateAndSetDrawingBitmaps();
}

bool Direct2D11::CreateAndSetDrawingBitmaps() {
    D2D1_BITMAP_PROPERTIES1 bitmapProperties =
        BitmapProperties1(
            D2D1_BITMAP_OPTIONS_TARGET | D2D1_BITMAP_OPTIONS_CANNOT_DRAW,
            PixelFormat(DXGI_FORMAT_B8G8R8A8_UNORM, D2D1_ALPHA_MODE_PREMULTIPLIED),
            0,//dpi, //dxgi
            0//dpi  //dxgi
        );
    // Get a D2D surface from the DXGI back buffer to use as the D2D render target.
    //DX::ThrowIfFailed(
    SusIfFailed(d2dcontext->CreateBitmapFromDxgiSurface(
        dxgiBackBuffer.Get(),
        &bitmapProperties,
        &d2dTargetBitmap
    ), "CreateBitmapFromDxgiSurface");
    //  );

  // Now we can set the Direct2D render target.
    d2dcontext->SetTarget(d2dTargetBitmap.Get());

    //RECT r; GetClientRect(window, &r);
    //SusIfFailed(d2dcontext->CreateBitmap(D2D1::SizeU(r.right, r.bottom), BitmapProperties(PixelFormat(DXGI_FORMAT_B8G8R8A8_UNORM, D2D1_ALPHA_MODE_IGNORE)), &d2dBackBitmap);
    SusIfFailed(d2dcontext->CreateBitmapFromDxgiSurface(dxgiBackBuffer.Get(), &bitmapProperties, &d2dBackBitmap), "intellij(sense) just DIED");
}

//https://stackoverflow.com/questions/22383209/id3d11texture2d-to-id2d1bitmap-is-it-possible
bool Direct2D11::ConvertID3D11Texture2DToID2D1Bitmap(ID3D11DeviceContext* ctx,
    ID3D11Texture2D* texture,
    ID2D1Bitmap1* bitmap)
{
    ComPtr<IDXGISurface> dxgiSurface;
    SusIfFailed(bitmap->GetSurface(&dxgiSurface), "ID2D1Bitmap1 GetSurface");
    //if (hr != S_OK)
    //    return false;
    ComPtr<ID3D11Resource> d3dResource;
    SusIfFailed(dxgiSurface.As(&d3dResource), "QueryInterface IDXGISurface as ID3D11Resource");
    //if (hr != S_OK)
    //    return false;
    ctx->CopyResource(d3dResource.Get(), texture);
}

void Direct2D11::EndDraw(bool donotpresent) {
    if (!donotpresent) {
        RetIfFailed(d2dcontext->EndDraw(), "D2D11 EndDraw failed?");
        RetIfFailed(swapChain->Present(1, 0), "D2D11 swapChain->Present(1, 0) failed?");
    }
    else {
        RetIfFailed(d2dcontext->EndDraw(), "D2D11 EndDraw (no present) failed?");
    }
}