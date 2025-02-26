# JBS3  
![JBS "LOGO"](https://github.com/MagicQuest/JBS3/blob/main/jbs3.png?raw=true)

a program made to use C++ without compiling C++

Heavily geared towards drawing to the screen for some reason!

most of the functions are just rips from MSN so if you look at MSN and use the [VSCode extension](https://github.com/MagicQuest/JBS3Extension) you'd probably be good

### What this really is
A JavaScript engine made to run C++/Windows.h functions because sometimes I want to make something in c++  
but I don't have Visual Studio, so the solution -> **JBS3**

### Backstory
I wanted to recreate Visual Basic Script but with JavaScript and thats where JBS came from  

JBS3 is actually only the second version of JBS and I don't remember why the first was called JBS2 but...  

JBS1 actually could have been made with lua (of course it wouldn't be called JBS if I did) but i didn't go through with it because I heard about [Luvit](https://luvit.io/) which is basically lua node.js  

JBS2 used Duktape which is a simple JS engine and I had to switch to V8 because it didn't even support ES6!  

JBS3 uses google's V8 engine which was HARD to setup but now im 1 step closer to building chromium!  

speaking of node.js maybe i should just make a node.js library instead

### Examples
In the scripts folder there are a few examples like minesweeper and msnexample while the rest of the scripts folder are completely random tests or funny things I wanted to do that and they should all work (including some of the ones in the ignore folder except most of them don't really do anything (that's why they are in the ignore folder))

### Yapping
Can you believe that I started making JBS3 because I was learning about Direct2D then remembered about JBS2, fiddled with V8 for a day, and then made JBS3 with Direct2D and MANY drawing type functions  

The pipeline is crazy  
**How to make overlay C++/C#** -> **[cool article](http://kylehalladay.com/blog/2021/07/14/Dll-Search-Order-Hijacking-For-PostProcess-Injection.html) talks about DLL Injecting** -> **read his [other articles](http://kylehalladay.com/blog/2020/05/20/Hooking-Input-Snake-In-Notepad.html) about DLL Injecting** -> **~~try to hack Roblox for decent while~~ (roblox has new anticheat so nope)** -> **go back to article to learn DirectX** -> **Direct2D** -> **remember JBS2** -> **JBS3xDirect2D**