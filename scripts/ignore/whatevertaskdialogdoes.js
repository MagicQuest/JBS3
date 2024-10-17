//i've lowkey never heard of this taskdialog until i randomly found it on msdn
//ok i tried (not that hard lol) to get it to work but if i didn't specify Microsoft.Windows.Common-Controls when linking it would fail at some random point
//THEN after i did that it would fail when calling TaskDialog and for some reason my variables would get scrambled like garbage idk what the hell was happening

const str = "sigma";
const main = NULL;
const cont = "content";

print(TaskDialog(NULL, hInstance, str, main, cont, TDCBF_OK_BUTTON | TDCBF_CANCEL_BUTTON, TD_WARNING_ICON));