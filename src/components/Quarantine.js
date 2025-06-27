export class Quarantine {
    constructor(id, x, y, paramsRef) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.paramsRef = paramsRef;
    }

    draw(ctx) {
        const radius = this.paramsRef.current.quarantineRadius;

        // Фон зоны
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFC107';
        ctx.globalAlpha = 0.15;
        ctx.fill();

        // Граница зоны
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#FF6F00';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.stroke();

        // Иконка предупреждения
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#FF6F00';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠', this.x, this.y);
    }
}