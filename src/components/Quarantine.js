export class Quarantine {
    constructor(id, x, y, paramsRef) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.paramsRef = paramsRef;
    }

    draw(ctx) {
        const radius = this.paramsRef.current.quarantineRadius;

        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFC107';
        ctx.globalAlpha = 0.2;
        ctx.fill();

        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#FF6F00';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠', this.x, this.y);
    }
}