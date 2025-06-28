// Pharmacy.js - Класс, представляющий аптеку в симуляции
export class Pharmacy {
    constructor(id, x, y, paramsRef) {
        this.id = id;             // Уникальный идентификатор аптеки
        this.x = x;               // Координата X на canvas
        this.y = y;               // Координата Y на canvas
        this.paramsRef = paramsRef; // Ссылка на параметры симуляции
    }

    // Метод отрисовки аптеки на canvas
    draw(ctx) {
        const radius = this.paramsRef.current.pharmacyRadius;

        // Отрисовка зоны влияния аптеки (полупрозрачный круг)
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#8BC34A'; // Зеленый цвет
        ctx.globalAlpha = 0.2;     // Полупрозрачность
        ctx.fill();

        // Отрисовка границы зоны
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#2E7D32'; // Темно-зеленый
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.stroke();

        // Отрисовка иконки аптеки (эмодзи креста)
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#2E7D32';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⛑', this.x, this.y);
    }
}