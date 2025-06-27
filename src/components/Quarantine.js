export class Quarantine {
    constructor(id, x, y, paramsRef) {
        this.id = id;             // Уникальный идентификатор
        this.x = x;               // Позиция по X
        this.y = y;               // Позиция по Y
        this.paramsRef = paramsRef; // Ссылка на параметры симуляции
    }

    // Отрисовка карантинной зоны на canvas
    draw(ctx) {
        const radius = this.paramsRef.current.quarantineRadius;

        // Рисуем фон зоны
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFC107'; // Желтый цвет
        ctx.globalAlpha = 0.2;     // Полупрозрачный
        ctx.fill();

        // Рисуем иконку предупреждения
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#FF6F00'; // Оранжевый
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠', this.x, this.y); // Эмодзи предупреждения
    }
}