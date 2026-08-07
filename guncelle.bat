@echo off
title ERCAEVDESTEK Otomatik Guncelleyici
color 0A

echo ========================================================
echo Guncellemeler GitHub'a gonderiliyor Lutfen bekleyin...
echo ========================================================
echo.

git add .
git commit -m "Otomatik guncelleme: %date% %time%"
git push origin main

echo.
echo ========================================================
echo ISLEM TAMAMLANDI! 
echo Kodlar GitHub'a gitti, sunucunuz birazdan guncellenecek.
echo ========================================================
echo Cikmak icin herhangi bir tusa basin...
pause >nul