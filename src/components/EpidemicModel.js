import { Person } from './Person';

/*
  Основной класс модели эпидемии
  Управляет популяцией людей, их взаимодействиями и статистикой
 */
export class EpidemicModel {
    constructor(paramsRef) {
        this.paramsRef = paramsRef;  // Ссылка на параметры модели
        this.people = [];           // Массив людей
        this.frameCount = 0;        // Счетчик кадров
        this.stats = {              // Текущая статистика
            healthy: 0,
            infected: 0,
            recovered: 0,
            deceased: 0
        };
    }

    /*
      Инициализирует модель с заданными параметрами
      Создает популяцию людей с начальными зараженными
     */
    initialize() {
        this.people = [];
        const { population, initialInfected, width, height } = this.paramsRef.current;

        for (let i = 0; i < population; i++) {
            const status = i < initialInfected ? 'infected' : 'healthy';
            this.people.push(new Person(
                i,
                Math.random() * width,
                Math.random() * height,
                status,
                this.paramsRef
            ));
        }
        this.updateStats();
        this.frameCount = 0;
    }

    // Обновляет статистику по текущим статусам людей
    updateStats() {
        this.stats = {
            healthy: 0,
            infected: 0,
            recovered: 0,
            deceased: 0
        };

        this.people.forEach(person => {
            if (person.status === 'healthy') this.stats.healthy++;
            else if (person.status === 'infected') this.stats.infected++;
            else if (person.status === 'recovered') this.stats.recovered++;
            else if (person.status === 'deceased') this.stats.deceased++;
        });
    }

    // Проверяет столкновения между людьми и возможность заражения
    checkCollisions() {
        const { infectionDistance } = this.paramsRef.current;

        for (let i = 0; i < this.people.length; i++) {
            for (let j = i + 1; j < this.people.length; j++) {
                const p1 = this.people[i];
                const p2 = this.people[j];

                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < infectionDistance) {
                    this.handleInfection(p1, p2);
                }
            }
        }
    }

    /*
       Обрабатывает возможное заражение при столкновении
       p1 - первый человек
       p2 - второй человек
     */
    handleInfection(p1, p2) {
        if (p1.status === 'infected' && p2.status === 'healthy') {
            if (Math.random() < p2.getInfectionRate()) {
                p2.status = 'infected';
                p2.infectedSince = this.frameCount;
                p2.updateColor();
            }
        } else if (p2.status === 'infected' && p1.status === 'healthy') {
            if (Math.random() < p1.getInfectionRate()) {
                p1.status = 'infected';
                p1.infectedSince = this.frameCount;
                p1.updateColor();
            }
        }
    }

    /*
      Основной метод обновления модели
      Вызывается на каждом кадре анимации
     */
    update() {
        this.frameCount++;
        this.checkCollisions();

        this.people.forEach(person => {
            person.move();
            person.updateStatus(this.frameCount);
        });

        this.updateStats();
    }
}