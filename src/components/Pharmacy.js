export class Pharmacy {
    constructor(id, x, y, paramsRef) {
        this.id = id;             // Уникальный идентификатор
        this.x = x;               // Позиция по X
        this.y = y;               // Позиция по Y
        this.paramsRef = paramsRef; // Ссылка на параметры симуляции
    }

    // Отрисовка аптеки на canvas
    draw(ctx) {
        const radius = this.paramsRef.current.pharmacyRadius;

        // Рисуем фон зоны
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#8BC34A'; // Зеленый цвет
        ctx.globalAlpha = 0.2;     // Полупрозрачный
        ctx.fill();

        // Рисуем границу зоны
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#2E7D32'; // Темно-зеленый
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.stroke();

        // Рисуем иконку аптеки (эмодзи креста)
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#2E7D32';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⛑', this.x, this.y);
    }
}