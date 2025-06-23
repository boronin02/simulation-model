/*
  Класс управления симуляцией
  Обеспечивает запуск, остановку, сброс и контроль скорости симуляции
 */
export class SimulationControls {
    constructor(model, renderer, setStats) {
        this.model = model;           // Ссылка на модель
        this.renderer = renderer;     // Ссылка на рендерер
        this.setStats = setStats;     // Функция обновления статистики
        this.isRunning = false;      // Флаг активности симуляции
        this.animationId = null;     // ID анимационного кадра
        this.lastTime = 0;           // Время последнего кадра
        this.fps = 60;               // Целевой FPS
        this.fpsInterval = 1000 / this.fps; // Интервал между кадрами
    }

    /*
      Устанавливает скорость симуляции.
      fps - желаемая частота кадров
     */
    setSpeed(fps) {
        this.fps = fps;
        this.fpsInterval = 1000 / fps;
    }

    // Запускает симуляцию
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.run();
    }

    // Останавливает симуляцию
    stop() {
        this.isRunning = false;
        cancelAnimationFrame(this.animationId);
    }

    // Сбрасывает симуляцию в начальное состояние
    reset() {
        this.stop();
        this.model.initialize();
        this.renderer.draw();
        this.setStats(this.model.stats);
    }

    /*
      Основной цикл симуляции
      currentTime - текущее время
     */
    run(currentTime = 0) {
        if (!this.isRunning) return;

        this.animationId = requestAnimationFrame((time) => this.run(time));

        const elapsed = currentTime - this.lastTime;
        if (elapsed > this.fpsInterval) {
            this.lastTime = currentTime - (elapsed % this.fpsInterval);

            this.model.update();
            this.renderer.draw();
            this.setStats(this.model.stats);
        }
    }
}