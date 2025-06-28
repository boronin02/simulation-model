// Person.js - Класс, представляющий человека в эпидемиологической симуляции

export class Person {
    constructor(id, x, y, status = 'healthy', paramsRef) {
        // Идентификатор и позиция
        this.id = id;               // Уникальный ID человека
        this.x = x;                 // Позиция по оси X
        this.y = y;                 // Позиция по оси Y

        // Состояние здоровья
        this.status = status;       // Текущий статус: 'healthy', 'infected', 'recovered', 'deceased'
        this.paramsRef = paramsRef; // Ссылка на параметры симуляции

        // Физические параметры
        this.radius = 5;            // Радиус отрисовки на canvas
        this.dx = (Math.random() - 0.5) * 2; // Направление движения по X (-1 до 1)
        this.dy = (Math.random() - 0.5) * 2; // Направление движения по Y (-1 до 1)

        // Параметры инфекции
        this.infectedSince = status === 'infected' ? 0 : null; // Время с момента заражения
        this.infectionStage = status === 'infected' ? 'incubation' : null; // Стадия болезни
        this.contagiousness = 0;    // Текущий уровень заразности (0-1)

        // Локационные флаги
        this.inPharmacy = false;     // Находится ли в зоне аптеки
        this.inQuarantine = false;   // Находится ли в карантинной зоне
        this.isBeingCollected = false; // Собирается ли моргом

        // Биологические особенности
        this.immunity = Math.random() * 0.5 + 0.5; // Уровень иммунитета (0.5-1.0)
        this.hasComorbidities = Math.random() < 0.2; // Наличие сопутствующих заболеваний
        this.isSuperSpreader = Math.random() < 0.1;  // Является ли суперраспространителем

        // Визуальные параметры
        this.updateColor();          // Установка цвета в зависимости от статуса

        // Временные параметры
        this.personalRecoveryTime = this.calculatePersonalRecoveryTime(); // Персональное время выздоровления
        this.updateStats = null;     // Callback для обновления статистики
    }

    /*
      Рассчитывает персональное время выздоровления с учетом:
      - Базового времени из параметров
      - Случайной вариации
      - Наличия заболеваний
      - Нахождения в аптеке
     */
    calculatePersonalRecoveryTime() {
        const { recoveryTime, minRecoveryVariation, maxRecoveryVariation } = this.paramsRef.current;

        // Случайная вариация времени выздоровления
        const variation = minRecoveryVariation + Math.random() * (maxRecoveryVariation - minRecoveryVariation);
        let personalTime = recoveryTime * variation * 2;

        // Корректировки времени:
        if (this.hasComorbidities) personalTime *= 1.5;  // +50% при заболеваниях
        if (this.inPharmacy) personalTime *= 0.8;       // -20% в аптеке

        return personalTime;
    }

    /*
      Обновляет цвет персонажа в зависимости от статуса:
      - Здоровые: зеленый
      - Зараженные: оттенки оранжевого/красного по стадиям
      - Выздоровевшие: синий
      - Умершие: серый
     */
    updateColor() {
        if (this.status === 'infected') {
            // Цвета для разных стадий болезни
            const colors = {
                incubation: '#FFA07A', // Светло-оранжевый (инкубация)
                progression: '#FF4500', // Ярко-оранжевый (активная фаза)
                recovery: '#FF6347'    // Томатный (выздоровление)
            };
            this.color = colors[this.infectionStage] || '#FF5252'; // Красный по умолчанию
        } else {
            // Цвета для других статусов
            this.color = {
                healthy: '#4CAF50',   // Зеленый
                recovered: '#2196F3', // Синий
                deceased: '#616161'   // Серый
            }[this.status];
        }
    }

    /*
      Основной метод обновления состояния персонажа:
      - Проверка зон (аптеки/карантин)
      - Обработка инфекции
      - Движение
      - Проверка границ
     */
    move(pharmacies, quarantines, deltaTime, updateStatsCallback) {
        this.updateStats = updateStatsCallback;

        // Не двигаем умерших и тех, кого собирает морг
        if (this.status === 'deceased' || this.isBeingCollected) return;

        // Проверяем нахождение в специальных зонах
        this.checkZones(pharmacies, quarantines);

        // Обрабатываем развитие болезни, если заражен
        if (this.status === 'infected') {
            this.processInfection(deltaTime);
        }

        // Двигаем персонажа
        this.processMovement(deltaTime);

        // Проверяем выход за границы поля
        this.checkBoundaries();
    }

    /*
      Проверяет нахождение персонажа в зонах:
      - Аптек (ускоряют выздоровление)
      - Карантина (снижают скорость и заразность)
     */
    checkZones(pharmacies, quarantines) {
        const { pharmacyRadius, quarantineRadius } = this.paramsRef.current;

        // Проверка аптек
        this.inPharmacy = pharmacies.some(p => {
            const dx = p.x - this.x;
            const dy = p.y - this.y;
            return Math.sqrt(dx * dx + dy * dy) < pharmacyRadius;
        });

        // Проверка карантинных зон
        this.inQuarantine = quarantines.some(q => {
            const dx = q.x - this.x;
            const dy = q.y - this.y;
            return Math.sqrt(dx * dx + dy * dy) < quarantineRadius;
        });
    }

    /*
      Обрабатывает движение персонажа с учетом:
      - Базовой скорости
      - Нахождения в карантине (снижает скорость)
      - Активной фазы болезни (снижает скорость)
     */
    processMovement(deltaTime) {
        let speedFactor = 1; // Базовый множитель скорости

        // Корректировки скорости:
        if (this.inQuarantine) speedFactor = 0.5;              // В карантине -50%
        if (this.status === 'infected' && this.infectionStage === 'progression') speedFactor *= 0.7; // В активной фазе -30%

        // Масштабирование скорости относительно времени кадра
        const frameSpeed = (deltaTime / 16) * speedFactor;
        this.x += this.dx * frameSpeed;
        this.y += this.dy * frameSpeed;
    }

    /*
      Проверяет границы поля и отражает направление движения при столкновении
     */
    checkBoundaries() {
        const { width, height } = this.paramsRef.current;

        // Отражение по X
        if (this.x < 0 || this.x > width) {
            this.dx = -this.dx;
            this.x = Math.max(0, Math.min(width, this.x)); // Корректировка позиции
        }

        // Отражение по Y
        if (this.y < 0 || this.y > height) {
            this.dy = -this.dy;
            this.y = Math.max(0, Math.min(height, this.y)); // Корректировка позиции
        }
    }

    /*
      Пытается заразить других персонажей в радиусе:
      - Учитывает вероятность заражения
      - Учитывает иммунитет
      - Учитывает суперраспространителей
      - Учитывает карантинные зоны
     */
    tryInfectOthers(people, quarantines) {
        const {
            infectionRate,
            infectionDistance,
            quarantineInfectionReduction,
            reinfectionRate
        } = this.paramsRef.current;

        // Заражать могут только в активной фазе
        if (this.infectionStage !== 'progression') return;

        people.forEach(other => {
            // Пропускаем умерших и тех, кого собирает морг
            if (other.status === 'deceased' || other.isBeingCollected) return;

            let infectionProbability = 0;

            // Вероятность заражения зависит от статуса цели
            if (other.status === 'healthy') {
                infectionProbability = infectionRate; // Базовая вероятность
            } else if (other.status === 'recovered') {
                // Для выздоровевших - сниженная вероятность с учетом иммунитета
                const timeSinceRecovery = this.paramsRef.current.recoveryTime * 0.2;
                const immunityFactor = other.immunity * (1 + timeSinceRecovery / 1000);
                infectionProbability = reinfectionRate * 0.1 / immunityFactor;
                infectionProbability = Math.min(infectionProbability, 0.05); // Максимум 5%
            }

            // Суперраспространители в 3 раза заразнее
            if (this.isSuperSpreader) {
                infectionProbability *= 3;
            }

            // Проверяем, находится ли цель в карантине
            const targetInQuarantine = quarantines.some(q => {
                const dx = q.x - other.x;
                const dy = q.y - other.y;
                return Math.sqrt(dx * dx + dy * dy) < q.paramsRef.current.quarantineRadius;
            });

            // В карантине вероятность заражения снижается
            if (targetInQuarantine) {
                infectionProbability *= quarantineInfectionReduction;
            }

            // Проверяем дистанцию и случайное число для заражения
            const distance = Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
            if (distance < infectionDistance && Math.random() < infectionProbability) {
                // Заражение цели
                other.status = 'infected';
                other.infectedSince = 0;
                other.infectionStage = 'incubation';
                other.updateColor();
                other.personalRecoveryTime = other.calculatePersonalRecoveryTime();

                // Если цель была выздоровевшей, снижаем иммунитет
                if (other.status === 'recovered') {
                    other.immunity = Math.max(0.2, other.immunity * 0.7);
                }
            }
        });
    }

    /*
      Обрабатывает развитие болезни:
      - Инкубационный период
      - Активная фаза
      - Фаза выздоровления
      - Возможный летальный исход
     */
    processInfection(deltaTime) {
        const { incubationPeriodRatio, progressionPeriodRatio } = this.paramsRef.current;

        // Расчет длительности фаз
        const incubationPeriod = this.personalRecoveryTime * incubationPeriodRatio;
        const progressionPeriod = this.personalRecoveryTime * progressionPeriodRatio;

        // Определение текущей стадии болезни
        if (this.infectedSince < incubationPeriod) {
            this.infectionStage = 'incubation';
            this.contagiousness = 0.1 + 0.4 * (this.infectedSince / incubationPeriod);
        }
        else if (this.infectedSince < incubationPeriod + progressionPeriod) {
            this.infectionStage = 'progression';
            const progress = (this.infectedSince - incubationPeriod) / progressionPeriod;
            this.contagiousness = 0.5 + 0.4 * Math.sin(progress * Math.PI);
        }
        else {
            this.infectionStage = 'recovery';
            const recoveryPeriod = this.personalRecoveryTime - (incubationPeriod + progressionPeriod);
            const progress = (this.infectedSince - incubationPeriod - progressionPeriod) / recoveryPeriod;
            this.contagiousness = 0.3 - 0.2 * progress;
        }

        // Фактор тяжести болезни (зависит от иммунитета и условий)
        let severityFactor = (1.7 - this.immunity);
        if (this.hasComorbidities) severityFactor *= 1.2;  // +20% при заболеваниях
        if (this.inPharmacy) severityFactor *= 0.7;       // -30% в аптеке

        // Увеличиваем время болезни с учетом тяжести
        this.infectedSince += deltaTime * severityFactor;

        // Проверяем завершение болезни
        if (this.infectedSince >= this.personalRecoveryTime) {
            this.finishTreatment();
        }
    }

    /*
      Завершает процесс болезни:
      - Определяет исход (выздоровление или смерть)
      - Обновляет статус
      - Вызывает callback для статистики
     */
    finishTreatment() {
        // Расчет вероятности смерти
        let deathChance = this.paramsRef.current.mortalityRate * (2 - this.immunity);

        // Модификаторы вероятности смерти:
        if (this.hasComorbidities) deathChance *= 2;  // В 2 раза при заболеваниях
        if (this.inPharmacy) deathChance *= 0.3;      // -70% в аптеке
        if (this.inQuarantine) deathChance *= 0.8;    // -20% в карантине

        // Определение исхода
        if (Math.random() < deathChance) {
            this.status = 'deceased';
            // Вызываем callback для обновления статистики смертей
            if (this.updateStats) this.updateStats('deceased');
        } else {
            this.status = 'recovered';
            this.immunity = Math.min(1, this.immunity + 0.3); // Увеличиваем иммунитет
        }

        // Сброс параметров инфекции
        this.infectedSince = null;
        this.infectionStage = null;
        this.contagiousness = 0;
        this.updateColor();
    }
}