//im including this cpp file here so you don't have to be scared of WindowsTools (because this is the source ripped straight out of the project on my computer)

#include "pch.h"
#include "framework.h"
#include "WindowsTools.h"
#include <string>
#include <iostream>
#include <vector>
//#include <windows.h>
//#include <Commdlg.h>

#define random(min,max) rand() % max + min

struct text {
    COLORREF color;
    float x, y;
    float vx, vy;

    std::string str;

    text(int x, int y, const char* str) {
        this->x = x;
        this->y = y;

        this->vx = (random(0, 2) == 1 ? random(1, 25) : -random(1, 25))/*/5.f*/;
        this->vy = random(1, 5) * -25;

        this->color = RGB(random(0, 255), random(0, 255), random(0, 255));

        this->str = str;
    }
};

std::vector<text> words;

//RECT screenRect{0,0,1920-30,1080-50};

const int bottom = 1080 - 50;
const int right = 1920 - 30;

//screen.right = 1920 - 30;
//screen.bottom = 1080 - 50;

std::string filestring;

WINDOWSTOOLS_API const char* OFD(const char* tiitle){//, const char* args) {
    //return tiitle;//"shut up nigga damn!";
    OPENFILENAME ofn;
    
    char file_name[100];
    
    ZeroMemory(&ofn, sizeof(OPENFILENAME));
    ofn.lStructSize = sizeof(OPENFILENAME);
    ofn.lpstrFile = file_name;
    ofn.lpstrFile[0] = '\0';
    ofn.nMaxFile = 100;
    ofn.lpstrFilter = "pictures (png or jpg)\0*.png;*.jpg\0" "iwentandputflavorinspongeboy\0*.*\0";
    ofn.nFilterIndex = 1;
    ofn.lpstrTitle = tiitle;
    
    GetOpenFileName(&ofn);
    
    //could do (int) or + (nevermind i couldn't find anybody say it again lets try it tho)
    if (+file_name[0]) {
        std::cout << file_name << std::endl;
        filestring = std::string(file_name);//std::string("niggers: ") + file_name;
        return filestring.c_str();
        //return (std::string("nigger: ") + file_name).c_str();
        //return std::string(file_name).c_str(); //cap ~~~~~~~
        //changePicture(file_name);
    }
    else {
        return "";//"NIGGER!"; //null might do something weird
    }
}

WINDOWSTOOLS_API void drawToScreen() {
    HDC screen = GetDC(NULL);

    //for (int i = 0; i < words.size(); i++) {
    for(text &word : words) {
        //text word = words[i];
        word.vy += 5; //https://stackoverflow.com/questions/19744668/openfilename-undeclared-identifier
        word.x += word.vx; //
        word.y += word.vy;
        if (word.y > bottom) {
            word.y = bottom;
            word.vy *= -.8f;
            //word.vy *= -((random(3, 20)) / 10.f);
        }
        if (word.x > right + word.str.size()) {
            word.x = right + word.str.size();
            word.vy = 50 + abs(word.vy) * -1.5f;
            word.vx *= -.95f;
        }
        if (word.x < 0) {
            word.x = 0;
            word.vy = 50 + abs(word.vy) * -1.5f;
            word.vx *= -1.1f;
        }
        if (word.y < 0) {
            word.y = 0;
            word.vy *= -1.f;
        }
        SetBkColor(screen, word.color);
        TextOut(screen, word.x, word.y, word.str.c_str(), word.str.size()); //if drawing is so slow create a new thread for all objects (or wait i could draw it all to a bitmap offscreen and draw that once to the screen (with alpha maybe?????))
    }

    ReleaseDC(NULL, screen);
    //TextOut(screen, 200,  , "NIGGERRRR", 10);
}

WINDOWSTOOLS_API void newWord(float x, float y, const char* str) { //WTF i ask for a float and turn it back into an int
    words.push_back(text(x,y, str));
    //words.emplace_back(x, y, str);
}

WINDOWSTOOLS_API void clearWords() {
    words.clear();
}

WINDOWSTOOLS_API int niggers(int i) {
    if (i == 9) {
        return 21;
    }
    else {
        return i + 10;
    }
}

WINDOWSTOOLS_API float f_niggers(float i) {
    MessageBoxA(NULL, std::to_string(i).c_str(), "lets see", MB_OK);
    return i;
}