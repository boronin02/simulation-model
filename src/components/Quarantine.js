// Quarantine.js - Класс, представляющий карантинную зону в симуляции
export class Quarantine {
    constructor(id, x, y, paramsRef) {
        this.id = id;             // Уникальный идентификатор зоны
        this.x = x;               // Координата X на canvas
        this.y = y;               // Координата Y на canvas
        this.paramsRef = paramsRef; // Ссылка на параметры симуляции
    }

    // Метод отрисовки карантинной зоны
    draw(ctx) {
        const radius = this.paramsRef.current.quarantineRadius;

        // Отрисовка зоны влияния (полупрозрачный желтый круг)
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFC107'; // Желтый цвет
        ctx.globalAlpha = 0.2;    // Полупрозрачность
        ctx.fill();

        // Отрисовка иконки предупреждения (эмодзи восклицательного знака)
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#FF6F00'; // Оранжевый
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠', this.x, this.y);
    }
}