export class Pharmacy {
    constructor(id, x, y, paramsRef) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.paramsRef = paramsRef;
    }

    draw(ctx) {
        const radius = this.paramsRef.current.pharmacyRadius;

        // Фон зоны
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#8BC34A';
        ctx.globalAlpha = 0.2;
        ctx.fill();

        // Граница зоны
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.stroke();

        // Иконка аптеки
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#2E7D32';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⛑', this.x, this.y);
    }
}