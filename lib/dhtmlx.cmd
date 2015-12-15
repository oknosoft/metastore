java -jar "C:\Program Files (x86)\JetBrains\WebStorm 11.0.2\plugins\JavaScriptLanguage\lib\compiler.jar" ^
--compilation_level SIMPLE_OPTIMIZATIONS --charset UTF-8 --language_in=ES5 ^
--js dhtmlx_debug.js       ^
--module dhtmlx:1
del dhtmlx.min.js
ren dhtmlx.js dhtmlx.min.js