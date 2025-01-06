@echo off
setlocal enabledelayedexpansion
set "dir=%~dp0"
set "dir=%dir:~0,-1%"

for %%i in ("%dir%") do set "foldername=%%~ni"
for /f "tokens=4 delims=-" %%a in ("%foldername%") do (
    set "keyword=%%a"
    set "keyword=!keyword: (1)=!"
    set "keyword=!keyword: (2)=!"
    set "keyword=!keyword: (3)=!"
    set "keyword=!keyword: (4)=!"
    set "keyword=!keyword: (5)=!"
    set "keyword=!keyword: (6)=!"
    set "keyword=!keyword: (7)=!"
    set "keyword=!keyword: (8)=!"
    set "keyword=!keyword: (9)=!"
    set "keyword=!keyword: (10)=!"
)

echo Extracted keyword: %keyword%

for %%f in ("%~dp0..\imgs-%keyword%-*.csv") do (
    echo Found matching file: %%f
    node download.mjs -i "%%f"
)
pause
endlocal
