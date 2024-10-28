//snatched from https://www.equestionanswers.com/vcpp/getdc-getwindowdc.php

//it's a conspiracy bruh they don't want you to know about nonclient drawing and the dwm...

//click in the client area to draw the green outline

function WndProc(hWnd, message, wParam, lParam)
{
  let hDC;
  let rect;
  let dc;
  let hB;
  let lb = {}; //LOGBRUSH (i gotta initialize this because in c++ land it would already be having these members)

  switch (message) 
  {
    /* On Left mouse click we are drawing using GetDC() */
    case WM_CREATE:
    {
        //ShowWindow(hWnd, SW_SHOWNORMAL);
        print(nCmdShow);
        ShowWindow(hWnd, nCmdShow);
        UpdateWindow(hWnd);
        //DwmExtendFrameIntoClientArea(hWnd, 50, 50, 50, 50); //lowkey made the window slightly transparent
        //DwmExtendFrameIntoClientArea(hWnd, -1, -1, -1, -1); //also made the window slightly transparent
        break;
    }
    case WM_LBUTTONDOWN:
    {

      hDC = GetDC(hWnd);
      dc = SaveDC(hDC);
      rect = GetClientRect(hWnd);
      SelectObject(hDC, CreatePen(PS_SOLID, 4, RGB(0,255,0)));
      lb.lbColor = 0;
      lb.lbStyle = BS_NULL;
      lb.lbHatch = 0;
      hB = CreateBrushIndirect(lb);
      SelectObject(hDC, hB);
      Rectangle(hDC, 0, 0, rect.right-rect.left , rect.bottom-rect.top);
      RestoreDC(hDC, dc);
      ReleaseDC(hWnd, hDC);
      break;
    }
    /* Window non client area painting */
    case WM_NCPAINT:
    {
      /* Let Windows draw the title bar etc */
      DefWindowProc(hWnd, message, wParam, lParam);

      lb.lbColor = 0;
      lb.lbStyle = BS_NULL;
      lb.lbHatch = 0;

      hDC = GetWindowDC(hWnd);
      dc = SaveDC(hDC);
      rect = GetWindowRect(hWnd);
      SelectObject(hDC, CreatePen(PS_SOLID, 4, RGB(0,0,255)));
      hB = CreateBrushIndirect(lb);
      SelectObject(hDC, hB);
      Rectangle(hDC, 0, 0, rect.right-rect.left , rect.bottom-rect.top);
      RestoreDC(hDC, dc);
      ReleaseDC(hWnd, hDC);
      break;
    }

    case WM_DESTROY:
      PostQuitMessage(0);
      break;
    default:
      return DefWindowProc(hWnd, message, wParam, lParam);
   }
   return 0;
}

const wc = CreateWindowClass("GetDC-GetWindowDC", WndProc);

wc.style           = CS_HREDRAW | CS_VREDRAW;
//wc.lpfnWndProc     = WndProc;
wc.hInstance       = hInstance;
wc.hCursor         = LoadCursor(NULL, IDC_ARROW);
wc.hbrBackground   = COLOR_BACKGROUND;
//wc.lpszClassName   = "GetDC-GetWindowDC";
wc.DefWindowProc   = false; //important!

hWnd = CreateWindow(NULL, wc,
                    "GetDC() and GetWindowDC()",
                    WS_OVERLAPPEDWINDOW,
                    CW_USEDEFAULT,
                    0,
                    CW_USEDEFAULT,
                    0,
                    NULL,
                    NULL,
                    hInstance);