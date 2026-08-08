#!/bin/bash

set -e

echo "===================================="
echo "ERCA EV DESTEK DEPLOY BAŞLADI"
echo "===================================="

echo ""
echo "1/8 GitHub'dan son kodlar çekiliyor..."
git fetch origin
git reset --hard origin/main

echo ""
echo "2/8 Backend bağımlılıkları kuruluyor..."
cd backend
composer install --no-interaction --prefer-dist

echo ""
echo "3/8 Laravel önbellekleri temizleniyor..."
php artisan optimize:clear
php artisan cache:clear || true
php artisan config:clear || true
php artisan route:clear || true

echo ""
echo "4/8 Migration çalıştırılıyor..."
php artisan migrate --force

echo ""
echo "5/8 Frontend derleniyor..."
cd ../frontend
npm install
npm run build

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "6/8 Frontend yayınlanıyor..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo ln -sfn "$SCRIPT_DIR/backend" /var/www/html/backend

echo ""
echo "7/8 Nginx yeniden yükleniyor..."
sudo systemctl reload nginx

echo ""
echo "8/8 Backend servisi yeniden başlatılıyor..."
sudo systemctl restart erca-backend || true
sudo systemctl restart php8.2-fpm 2>/dev/null || sudo systemctl restart php8.1-fpm 2>/dev/null || sudo systemctl restart php8.3-fpm 2>/dev/null || sudo systemctl restart php-fpm 2>/dev/null || true

echo ""
echo "===================================="
echo "DEPLOY TAMAMLANDI"
echo "===================================="