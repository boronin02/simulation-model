export class Person {
    constructor(id, x, y, status = 'healthy', paramsRef) {
        this.id = id;               // Уникальный идентификатор
        this.x = x;                 // Позиция по X
        this.y = y;                 // Позиция по Y
        this.status = status;       // Текущий статус: healthy/infected/recovered/deceased
        this.paramsRef = paramsRef;  // Ссылка на параметры модели
        this.radius = 5;            // Радиус отрисовки
        this.dx = (Math.random() - 0.5) * 2; // Скорость по X
        this.dy = (Math.random() - 0.5) * 2; // Скорость по Y
        this.infectedSince = status === 'infected' ? 0 : null; // Время заражения
        this.updateColor();         // Обновление цвета в зависимости от статуса
    }

    // Обновляет цвет человека в зависимости от его статуса
    updateColor() {
        this.color = {
            healthy: '#4CAF50',     // Зеленый
            infected: '#FF5252',    // Красный
            recovered: '#2196F3',    // Синий
            deceased: '#000000'      // Черный
        }[this.status];
    }

    /*
      Перемещает человека с учетом границ холста
      Мертвые люди не двигаются
     */
    move() {
        if (this.status === 'deceased') return;

        const { width, height } = this.paramsRef.current;
        this.x += this.dx;
        this.y += this.dy;

        // Отскок от границ
        if (this.x < 0 || this.x > width) {
            this.x -= this.dx;
            this.dx = -this.dx;
        }

        if (this.y < 0 || this.y > height) {
            this.y -= this.dy;
            this.dy = -this.dy;
        }
    }

    // Обновляет статус человека на основе времени заражения
    updateStatus(frameCount) {
        if (this.status === 'infected' && this.infectedSince !== null) {
            const { recoveryTime, mortalityRate } = this.paramsRef.current;
            const timeInfected = frameCount - this.infectedSince;

            // Проверка на выздоровление или смерть
            if (timeInfected > recoveryTime) {
                if (Math.random() < mortalityRate) {
                    this.status = 'deceased';
                    this.dx = 0;
                    this.dy = 0;
                } else {
                    this.status = 'recovered';
                }
                this.updateColor();
            }
        }
    }

    // Возвращает текущий уровень заразности из параметров модели
    getInfectionRate() {
        return this.paramsRef.current.infectionRate;
    }
}