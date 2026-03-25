# МосАГРПроект

Сайт для заказа услуг по разработке буклетов АГР (Архитектурно-градостроительного решения) по требованиям Москомархитектуры.

**Компания:** ООО «Минерал»  
**Домен:** [razrabotka-agr.ru](https://razrabotka-agr.ru)

---

## Технологический стек

| Компонент | Технология |
|-----------|-----------|
| Фронтенд | React 18 + Vite 7 + TypeScript |
| Бэкенд | Node.js + Express 5 + TypeScript |
| База данных | PostgreSQL + Drizzle ORM |
| Стили | Tailwind CSS |
| Управление пакетами | pnpm (монорепозиторий) |
| Генерация документов | PDFKit + docx |
| 3D-просмотр | Three.js + web-ifc |

---

## Структура проекта

```
/
├── artifacts/
│   ├── ag-booklet/          # Фронтенд (React + Vite)
│   │   ├── src/
│   │   │   ├── pages/       # Публичные страницы и страницы админки
│   │   │   ├── components/  # UI-компоненты
│   │   │   ├── hooks/       # React-хуки
│   │   │   └── contexts/    # Контексты React
│   │   └── public/          # Статика (wasm, изображения)
│   └── api-server/          # Бэкенд (Express API)
│       ├── src/
│       │   ├── routes/      # API-маршруты
│       │   ├── lib/         # Утилиты (PDF, email, договоры)
│       │   └── middlewares/ # Аутентификация и др.
│       └── uploads/         # Загружаемые файлы
└── lib/
    └── db/                  # Схема базы данных (Drizzle ORM)
        └── src/schema/      # Таблицы БД
```

### Таблицы базы данных

| Таблица | Назначение |
|---------|-----------|
| `orders` | Заявки на разработку буклета |
| `contracts` | Договоры (с версионированием) |
| `proposals` | Коммерческие предложения |
| `templates` | Шаблоны и материалы для скачивания |
| `services` | Услуги компании |
| `news_articles` | Новости |
| `reviews` | Отзывы клиентов |
| `faqs` | Часто задаваемые вопросы |
| `contacts` | Контактная информация |
| `site_settings` | Настройки сайта (пароль, шаблоны, SMTP) |

---

## Локальный запуск (разработка)

### Требования

- Node.js 20+
- pnpm 9+
- PostgreSQL 14+

### 1. Установка зависимостей

```bash
pnpm install
```

### 2. Переменные окружения

Создайте файл `.env` в корне проекта:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mosagr
ADMIN_PASSWORD=ваш_пароль_администратора
DADATA_API_KEY=ваш_ключ_dadata
```

### 3. Создание базы данных

```bash
createdb mosagr
cd lib/db && pnpm run push
```

### 4. Запуск серверов

```bash
# Запустить API (порт 8080)
pnpm --filter @workspace/api-server run dev

# В отдельном терминале — запустить фронтенд (порт 5173)
pnpm --filter @workspace/ag-booklet run dev
```

Откройте [http://localhost:5173](http://localhost:5173).  
Административная панель: [http://localhost:5173/admin](http://localhost:5173/admin)

---

## Развёртывание на сервере (production)

Ниже — полный пошаговый процесс установки на чистый Ubuntu 22.04 / Debian 12.

### Шаг 1. Обновление системы и установка зависимостей

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx certbot python3-certbot-nginx postgresql postgresql-contrib
```

### Шаг 2. Установка Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # v20.x.x
```

### Шаг 3. Установка pnpm

```bash
npm install -g pnpm
pnpm --version   # 9.x.x
```

### Шаг 4. Создание пользователя для приложения

```bash
sudo useradd -m -s /bin/bash mosagr
sudo su - mosagr
```

### Шаг 5. Клонирование репозитория

```bash
cd /home/mosagr
git clone https://github.com/stepangur/mosagr-project.git app
cd app
```

### Шаг 6. Настройка базы данных

```bash
# Создать БД от имени postgres
sudo -u postgres psql -c "CREATE USER mosagr WITH PASSWORD 'ваш_пароль_бд';"
sudo -u postgres psql -c "CREATE DATABASE mosagr OWNER mosagr;"
```

### Шаг 7. Переменные окружения

Создайте файл `/home/mosagr/app/.env`:

```bash
cat > /home/mosagr/app/.env << 'EOF'
NODE_ENV=production
DATABASE_URL=postgresql://mosagr:ваш_пароль_бд@localhost:5432/mosagr
ADMIN_PASSWORD=ваш_пароль_администратора
DADATA_API_KEY=ваш_ключ_dadata
PORT=8080
EOF
chmod 600 /home/mosagr/app/.env
```

> **SMTP (опционально)** — настройка email-уведомлений выполняется через панель администратора в разделе «Настройки → Email».

### Шаг 8. Установка зависимостей

```bash
cd /home/mosagr/app
pnpm install --frozen-lockfile
```

### Шаг 9. Применение схемы базы данных

```bash
cd /home/mosagr/app/lib/db
pnpm run push
cd /home/mosagr/app
```

### Шаг 10. Сборка проекта

```bash
# Собрать бэкенд (TypeScript → CJS bundle)
pnpm --filter @workspace/api-server run build

# Собрать фронтенд (Vite production build)
pnpm --filter @workspace/ag-booklet run build
```

Результат:
- `artifacts/api-server/dist/index.cjs` — скомпилированный сервер
- `artifacts/ag-booklet/dist/` — статика фронтенда

### Шаг 11. Настройка systemd-сервиса

Создайте файл `/etc/systemd/system/mosagr.service`:

```bash
sudo nano /etc/systemd/system/mosagr.service
```

```ini
[Unit]
Description=МосАГРПроект API Server
After=network.target postgresql.service

[Service]
Type=simple
User=mosagr
WorkingDirectory=/home/mosagr/app/artifacts/api-server
ExecStart=/usr/bin/node dist/index.cjs
Restart=always
RestartSec=5
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=mosagr
EnvironmentFile=/home/mosagr/app/.env
Environment=PORT=8080

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable mosagr
sudo systemctl start mosagr
sudo systemctl status mosagr
```

### Шаг 12. Настройка Nginx

```bash
sudo nano /etc/nginx/sites-available/razrabotka-agr.ru
```

```nginx
server {
    listen 80;
    server_name razrabotka-agr.ru www.razrabotka-agr.ru;

    # Максимальный размер загружаемых файлов (для IFC-моделей и документов)
    client_max_body_size 150M;

    # Статика фронтенда
    root /home/mosagr/app/artifacts/ag-booklet/dist/public;
    index index.html;

    # Загруженные файлы (шаблоны, документы)
    location /api/uploads/ {
        alias /home/mosagr/app/artifacts/api-server/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API проксирование на Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
        client_max_body_size 150M;
    }

    # SPA fallback — все маршруты отдаём index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Кэширование статических ресурсов
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/razrabotka-agr.ru /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Шаг 13. SSL-сертификат (Let's Encrypt)

```bash
sudo certbot --nginx -d razrabotka-agr.ru -d www.razrabotka-agr.ru
```

Certbot автоматически изменит конфигурацию Nginx для HTTPS. Сертификат обновляется автоматически.

Проверьте автообновление:

```bash
sudo certbot renew --dry-run
```

### Шаг 14. Права на папку uploads

```bash
mkdir -p /home/mosagr/app/artifacts/api-server/uploads
chown -R mosagr:mosagr /home/mosagr/app/artifacts/api-server/uploads
chmod 755 /home/mosagr/app/artifacts/api-server/uploads
```

---

## Обновление сайта

При выходе новой версии:

```bash
cd /home/mosagr/app

# 1. Получить изменения
git pull origin main

# 2. Обновить зависимости
pnpm install --frozen-lockfile

# 3. Применить изменения схемы БД (если есть)
cd lib/db && pnpm run push && cd ../..

# 4. Пересобрать проект
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/ag-booklet run build

# 5. Перезапустить сервис
sudo systemctl restart mosagr
```

---

## Административная панель

Доступна по адресу `/admin` на вашем домене.

| Раздел | Назначение |
|--------|-----------|
| Заявки | Просмотр и управление входящими заявками |
| Договоры | Создание PDF/DOCX договоров с версионированием |
| КП | Коммерческие предложения |
| Шаблоны | Загрузка и управление файлами (включая IFC 3D-модели) |
| Клиенты | База клиентов |
| Новости | Управление новостями |
| Услуги | Редактирование услуг |
| Отзывы | Управление отзывами |
| FAQ | Часто задаваемые вопросы |
| Настройки | SMTP, шаблон договора, пароль администратора |

---

## Функции сайта

- **Заявки** — форма заказа с автозаполнением данных компании по ИНН (через DaData)
- **Договоры** — генерация PDF и DOCX с автозаполнением реквизитов; версионирование редакций
- **Онлайн-просмотр 3D** — загрузка и просмотр IFC-моделей прямо в браузере (без дополнительного ПО)
- **Шаблоны** — библиотека материалов: регламенты, шаблоны PPTX, 3D-модели, плагины

---

## Переменные окружения

| Переменная | Обязательная | Описание |
|-----------|:---:|---------|
| `DATABASE_URL` | ✅ | Строка подключения к PostgreSQL |
| `PORT` | ✅ | Порт API-сервера (в prod: 8080) |
| `NODE_ENV` | ✅ | `development` или `production` |
| `ADMIN_PASSWORD` | ✅ | Пароль для входа в административную панель |
| `DADATA_API_KEY` | ✅ | API-ключ сервиса DaData (автозаполнение по ИНН) |
| `ADMIN_TOKEN_SECRET` | — | Секрет для подписи JWT-токенов (по умолчанию генерируется из ADMIN_PASSWORD) |

> SMTP-настройки задаются через административную панель (Настройки → Email), а не через env-переменные.

---

## Полезные команды

```bash
# Логи приложения в реальном времени
sudo journalctl -u mosagr -f

# Статус сервиса
sudo systemctl status mosagr

# Перезапустить сервис
sudo systemctl restart mosagr

# Проверить синтаксис Nginx
sudo nginx -t

# Логи Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Подключиться к БД
psql -U mosagr -d mosagr
```

---

## Лицензия

Проект разработан для ООО «Минерал». Все права защищены.
