/*
  Класс для отрисовки модели эпидемии на canvas
  Обрабатывает визуализацию людей и дополнительных элементов
 */
export class SimulationRenderer {
    constructor(canvasRef, model) {
        this.canvas = canvasRef.current;  // Ссылка на canvas элемент
        this.ctx = this.canvas.getContext('2d'); // Контекст рисования
        this.model = model;               // Ссылка на модель
        this.showInfectionRadius = false; // Флаг отображения радиуса заражения
    }

    // Переключает отображение радиуса заражения
    toggleInfectionRadius() {
        this.showInfectionRadius = !this.showInfectionRadius;
    }

    // Отрисовывает текущее состояние модели
    draw() {
        const { width, height } = this.model.paramsRef.current;

        // Очистка canvas
        this.ctx.clearRect(0, 0, width, height);

        // Отрисовка радиусов заражения (если включено)
        if (this.showInfectionRadius) {
            this.model.people
                .filter(person => person.status === 'infected')
                .forEach(person => {
                    // Рисуем радиус заражения
                    this.ctx.beginPath();
                    this.ctx.arc(
                        person.x,
                        person.y,
                        this.model.paramsRef.current.infectionDistance,
                        0,
                        Math.PI * 2
                    );
                    this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
                    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.05)';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                    this.ctx.fill();
                    this.ctx.closePath();
                });
        }

        // Отрисовка людей
        this.model.people.forEach(person => {
            this.ctx.beginPath();
            this.ctx.arc(person.x, person.y, person.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = person.color;
            this.ctx.fill();

            // Обводка для инфицированных
            if (person.status === 'infected') {
                this.ctx.strokeStyle = 'red';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }

            this.ctx.closePath();
        });
    }
}