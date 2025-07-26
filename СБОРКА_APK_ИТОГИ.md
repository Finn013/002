
# Итоги и правильная настройка сборки APK из PWA

Этот документ — итог нашей работы по превращению PWA-приложения в APK-файл с автоматической сборкой через GitHub Actions. Здесь собрана вся ключевая информация, правильные конфигурации и решения всех проблем, с которыми мы столкнулись.

---

## 1. Финальная правильная структура проекта

Чтобы сборка работала, структура папок и файлов в репозитории должна быть следующей:

```
C:/Users/01000/002/
├── .github/
│   └── workflows/
│       └── build.yml       # <== Главный файл с инструкциями для сборки
├── android/                # <== Полноценный Android-проект (ДОЛЖЕН БЫТЬ в репозитории)
├── www/                    # <== Все ваши веб-файлы (html, js, css, иконки)
│   ├── index.html          # <== Главный файл переименован в index.html
│   └── ... (остальные файлы)
├── .gitignore              # <== Указывает, что НЕ НУЖНО загружать на GitHub
├── capacitor.config.json   # <== Конфигурация Capacitor
├── package.json            # <== Список зависимостей проекта
├── package-lock.json       # <== "Замок" версий зависимостей
└── ... (остальные файлы, не влияющие на сборку)
```

**Ключевые моменты:**
- Папки `android/` и `www/` **ОБЯЗАТЕЛЬНО** должны быть загружены в репозиторий.
- Папка `node_modules/` **НЕ ДОЛЖНА** быть в репозитории (она указывается в `.gitignore`).

---

## 2. Правильные файлы конфигурации

Ниже — финальные, рабочие версии файлов, которые мы создали и исправили.

### `build.yml` (файл инструкций для GitHub Actions)

*Путь: `.github/workflows/build.yml`*
```yml
name: Build Android APK

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    # 1. Скачиваем код из репозитория
    - name: Checkout code
      uses: actions/checkout@v3

    # 2. Устанавливаем правильную версию Java (21)
    - name: Set up JDK 21
      uses: actions/setup-java@v4
      with:
        java-version: '21'
        distribution: 'temurin'

    # 3. Устанавливаем правильную версию Node.js (20)
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'

    # 4. Устанавливаем все зависимости из package.json
    - name: Install dependencies
      run: npm install

    # 5. Синхронизируем веб-файлы с Android-проектом
    - name: Sync project
      run: npx cap sync android

    # 6. Даем права на выполнение скрипту сборки (ОЧЕНЬ ВАЖНО)
    - name: Make gradlew executable
      run: chmod +x ./gradlew
      working-directory: ./android

    # 7. Запускаем сборку APK
    - name: Build APK
      run: ./gradlew assembleDebug
      working-directory: ./android

    # 8. Загружаем собранный APK как артефакт
    - name: Upload APK
      uses: actions/upload-artifact@v4
      with:
        name: app-debug.apk
        path: android/app/build/outputs/apk/debug/app-debug.apk
```

### `.gitignore` (файл для игнорирования)

*Путь: `.gitignore`*
```
# Dependencies
/node_modules

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Misc
.DS_Store
.npm
```

---

## 3. Хронология ошибок и их решения

1.  **Ошибка:** `actions/upload-artifact: v3` устарел.
    -   **Решение:** Заменили версию на `@v4` в файле `build.yml`.

2.  **Ошибка:** Неправильные рабочие директории в `build.yml`.
    -   **Решение:** Полностью переписали `build.yml`, убрав лишние `working-directory` из большинства шагов.

3.  **Ошибка:** `The Capacitor CLI requires NodeJS >=20.0.0` (требуется Node.js версии 20+).
    -   **Решение:** Изменили версию в `build.yml` с `node-version: '18'` на `node-version: '20'`.

4.  **Ошибка:** `android platform has not been added yet` (не найдена папка `android`).
    -   **Причина:** Папка `android/` была ошибочно добавлена в `.gitignore`.
    -   **Решение:** Удалили строку `/android` из `.gitignore` и загрузили папку в репозиторий.

5.  **Ошибка:** `Could not find the web assets directory: ./www` (не найдена папка `www`).
    -   **Причина:** Папка `www/` также была ошибочно добавлена в `.gitignore`.
    -   **Решение:** Удалили строку `/www` из `.gitignore` и загрузили папку в репозиторий.

6.  **Ошибка:** `Unable to find node_modules/@capacitor/android` (пакет не установлен на сервере).
    -   **Причина:** Пакет не был сохранен в `package.json`.
    -   **Решение:** Локально выполнили `npm install @capacitor/android`, чтобы сохранить зависимость в `package.json`, и загрузили изменения.

7.  **Ошибка:** `./gradlew: Permission denied` (нет прав на выполнение файла).
    -   **Причина:** Git для Windows не сохраняет права на выполнение, как в Linux.
    -   **Решение:** Добавили в `build.yml` шаг `run: chmod +x ./gradlew` перед сборкой.

8.  **Ошибка:** `error: invalid source release: 21` (требуется Java версии 21).
    -   **Причина:** В `build.yml` была указана Java 17.
    -   **Решение:** Изменили версию в `build.yml` с `java-version: '17'` на `java-version: '21'`.
