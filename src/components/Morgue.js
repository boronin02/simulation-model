// Morgue.js - Класс, представляющий морг в симуляции
export class Morgue {
    constructor(id, x, y, paramsRef) {
        this.id = id;                     // Уникальный идентификатор морга
        this.x = x;                      // Координата X на canvas
        this.y = y;                      // Координата Y на canvas
        this.paramsRef = paramsRef;      // Ссылка на параметры симуляции
        this.ambulances = [];            // Массив машин для сбора тел
        this.lastAmbulanceTime = 0;      // Время последней отправки машины
        this.ambulanceCooldown = paramsRef.current.morgueCollectionInterval; // Интервал между отправками
    }

    // Метод отрисовки морга и его машин
    draw(ctx) {
        // Отрисовка здания морга (серый квадрат)
        ctx.fillStyle = '#616161';
        ctx.fillRect(this.x - 15, this.y - 15, 30, 30);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(this.x - 15, this.y - 15, 30, 30);

        // Отрисовка иконки морга (эмодзи гроба)
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚰', this.x, this.y);

        // Отрисовка всех машин морга
        this.ambulances.forEach(ambulance => ambulance.draw(ctx));
    }

    // Метод обновления состояния морга
    update(time, people, onBuried) {
        // Удаление завершивших работу машин
        this.ambulances = this.ambulances.filter(a => !a.isDone);

        // Поиск трупов для сбора
        const corpses = people.filter(p => p.status === 'deceased' && !p.isBeingCollected);
        if (corpses.length > 0 && time - this.lastAmbulanceTime > this.ambulanceCooldown) {
            this.lastAmbulanceTime = time;
            // Случайный выбор трупа для сбора
            const target = corpses[Math.floor(Math.random() * corpses.length)];
            // Создание новой машины
            this.ambulances.push(new Ambulance(
                this.x,
                this.y,
                target,
                this.paramsRef.current.morgueCollectionSpeed,
                onBuried
            ));
        }

        // Обновление всех машин
        this.ambulances.forEach(ambulance => ambulance.update(people));
    }
}

// Вложенный класс, представляющий машину для сбора тел
class Ambulance {
    constructor(startX, startY, target, speed, onBuried) {
        this.x = startX;                // Текущая позиция X
        this.y = startY;                // Текущая позиция Y
        this.startX = startX;           // Начальная позиция X (морг)
        this.startY = startY;           // Начальная позиция Y (морг)
        this.target = target;           // Цель (труп) для сбора
        this.speed = speed;             // Скорость движения
        this.state = 'going';           // Состояние: 'going' | 'collecting' | 'returning'
        this.collectionTime = 0;        // Время сбора трупа
        this.collectionDuration = 2000; // Длительность сбора
        this.isDone = false;            // Завершена ли работа
        this.onBuried = onBuried;       // Колбэк при захоронении
        this.hasBuried = false;         // Было ли захоронение
    }

    // Метод отрисовки машины
    draw(ctx) {
        // Отрисовка корпуса машины (белый прямоугольник)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(this.x - 10, this.y - 6, 20, 12);

        // Отрисовка окон (голубые прямоугольники)
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(this.x - 8, this.y - 5, 6, 4);
        ctx.fillRect(this.x + 2, this.y - 5, 6, 4);

        // Отрисовка мигалок (чередование красного и синего)
        const flashPhase = Date.now() % 1000 > 500 ? '#FF0000' : '#0000FF';
        ctx.fillStyle = flashPhase;
        ctx.fillRect(this.x - 10, this.y - 8, 4, 4);
        ctx.fillRect(this.x + 6, this.y - 8, 4, 4);

        // Отрисовка контура машины
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - 10, this.y - 6, 20, 12);
    }

    // Метод обновления состояния машины
    update(people) {
        if (this.state === 'going') {
            // Движение к цели (трупу)
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 5) {
                // Достигли цели - начинаем сбор
                this.state = 'collecting';
                this.target.isBeingCollected = true;
            } else {
                // Продолжаем движение
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
        }
        else if (this.state === 'collecting') {
            // Процесс сбора трупа
            this.collectionTime += 16;
            if (this.collectionTime >= this.collectionDuration) {
                // Сбор завершен - возвращаемся в морг
                this.state = 'returning';
            }
        }
        else if (this.state === 'returning') {
            // Возвращение в морг
            const dx = this.startX - this.x;
            const dy = this.startY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 5) {
                // Вернулись в морг - завершаем работу
                this.isDone = true;
                if (!this.hasBuried) {
                    this.onBuried(); // Вызываем колбэк
                    this.hasBuried = true;
                    // Удаляем труп из общего массива
                    const index = people.indexOf(this.target);
                    if (index !== -1) people.splice(index, 1);
                }
            } else {
                // Продолжаем движение к моргу
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
        }
    }
}