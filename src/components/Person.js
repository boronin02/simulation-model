export class Person {
    constructor(id, x, y, status = 'healthy', paramsRef) {
        this.id = id;                   // Уникальный идентификатор
        this.x = x;                     // Позиция по X
        this.y = y;                     // Позиция по Y
        this.status = status;           // Текущий статус (healthy/infected/recovered/deceased)
        this.paramsRef = paramsRef;     // Ссылка на параметры симуляции
        this.radius = 5;                // Размер отображения
        this.dx = (Math.random() - 0.5) * 2; // Скорость по X
        this.dy = (Math.random() - 0.5) * 2; // Скорость по Y
        this.infectedSince = status === 'infected' ? 0 : null; // Время заражения
        this.inPharmacy = false;        // Находится в аптеке
        this.inQuarantine = false;      // Находится в карантине
        this.infectionStage = status === 'infected' ? 'incubation' : null; // Стадия болезни
        this.contagiousness = 0;        // Текущая заразность (0-1)
        this.immunity = Math.random() * 0.5 + 0.5; // Уровень иммунитета (0.5-1.0)
        this.hasComorbidities = Math.random() < 0.2; // Наличие сопутствующих заболеваний
        this.isSuperSpreader = Math.random() < 0.1; // Является суперраспространителем
        this.updateColor();             // Устанавливаем цвет

        // Индивидуальное время болезни с вариацией
        this.personalRecoveryTime = this.calculatePersonalRecoveryTime();
    }

    // Расчет индивидуального времени болезни
    calculatePersonalRecoveryTime() {
        const { recoveryTime, minRecoveryVariation, maxRecoveryVariation } = this.paramsRef.current;
        const variation = minRecoveryVariation + Math.random() * (maxRecoveryVariation - minRecoveryVariation);
        let personalTime = recoveryTime * variation;

        // Коррекция времени болезни
        if (this.hasComorbidities) personalTime *= 1.3; // Увеличиваем при заболеваниях
        if (this.inPharmacy) personalTime *= 0.8;       // Уменьшаем в аптеке

        return personalTime;
    }

    // Обновление цвета в зависимости от статуса
    updateColor() {
        if (this.status === 'infected') {
            // Разные цвета для разных стадий болезни
            const colors = {
                incubation: '#FFA07A', // Светло-оранжевый (инкубация)
                progression: '#FF4500', // Оранжево-красный (активная фаза)
                recovery: '#FF6347'    // Томатный (выздоровление)
            };
            this.color = colors[this.infectionStage] || '#FF5252';
        } else {
            // Цвета для других статусов
            this.color = {
                healthy: '#4CAF50',   // Зеленый (здоров)
                recovered: '#2196F3', // Синий (выздоровел)
                deceased: '#616161'   // Серый (умер)
            }[this.status];
        }
    }

    // Движение персонажа
    move(pharmacies, quarantines, deltaTime = 16) {
        if (this.status === 'deceased') return; // Мертвые не двигаются

        this.checkZones(pharmacies, quarantines); // Проверяем зоны

        if (this.status === 'infected') {
            this.processInfection(deltaTime); // Обрабатываем развитие болезни
        }

        this.processMovement(deltaTime); // Двигаем персонажа
        this.checkBoundaries();          // Проверяем границы поля
    }

    // Проверка нахождения в зонах (аптеки/карантин)
    checkZones(pharmacies, quarantines) {
        const { pharmacyRadius, quarantineRadius } = this.paramsRef.current;

        this.inPharmacy = pharmacies.some(p => {
            const dx = p.x - this.x;
            const dy = p.y - this.y;
            return Math.sqrt(dx * dx + dy * dy) < pharmacyRadius;
        });

        this.inQuarantine = quarantines.some(q => {
            const dx = q.x - this.x;
            const dy = q.y - this.y;
            return Math.sqrt(dx * dx + dy * dy) < quarantineRadius;
        });
    }

    // Обработка движения с учетом зон
    processMovement(deltaTime) {
        let speedFactor = 1;
        if (this.inQuarantine) speedFactor = 0.5; // Замедление в карантине
        if (this.status === 'infected' && this.infectionStage === 'progression') {
            speedFactor *= 0.7; // Больные двигаются медленнее
        }

        const frameSpeed = (deltaTime / 16) * speedFactor;
        this.x += this.dx * frameSpeed;
        this.y += this.dy * frameSpeed;
    }

    // Проверка и отскок от границ поля
    checkBoundaries() {
        const { width, height } = this.paramsRef.current;
        if (this.x < 0 || this.x > width) this.dx = -this.dx;
        if (this.y < 0 || this.y > height) this.dy = -this.dy;
    }

    // Попытка заразить других людей
    tryInfectOthers(people, quarantines) {
        const {
            infectionRate,
            infectionDistance,
            quarantineInfectionReduction,
            reinfectionRate
        } = this.paramsRef.current;

        // Только в активной фазе можно заражать
        if (this.infectionStage !== 'progression') return;

        people.forEach(other => {
            if (other.status === 'deceased') return; // Мертвых не заражаем

            let infectionProbability = 0;

            // Для здоровых - полная вероятность
            if (other.status === 'healthy') {
                infectionProbability = infectionRate;
            }
            // Для выздоровевших - уменьшенная вероятность
            else if (other.status === 'recovered') {
                const timeSinceRecovery = this.paramsRef.current.recoveryTime * 0.2;
                const immunityFactor = other.immunity * (1 + timeSinceRecovery / 1000);
                infectionProbability = reinfectionRate * 0.1 / immunityFactor;
                infectionProbability = Math.min(infectionProbability, 0.05); // Макс 5%
            }

            // Суперраспространители более заразны
            if (this.isSuperSpreader) infectionProbability *= 3;

            // Учет карантина
            const targetInQuarantine = quarantines.some(q => {
                const dx = q.x - other.x;
                const dy = q.y - other.y;
                return Math.sqrt(dx * dx + dy * dy) < q.paramsRef.current.quarantineRadius;
            });

            if (targetInQuarantine) {
                infectionProbability *= quarantineInfectionReduction;
            }

            // Проверка расстояния и вероятности заражения
            const distance = Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
            if (distance < infectionDistance && Math.random() < infectionProbability) {
                other.status = 'infected';
                other.infectedSince = 0;
                other.infectionStage = 'incubation';
                other.updateColor();
                other.personalRecoveryTime = other.calculatePersonalRecoveryTime();

                // После повторного заражения иммунитет снижается
                if (other.status === 'recovered') {
                    other.immunity = Math.max(0.2, other.immunity * 0.7);
                }
            }
        });
    }

    // Процесс развития инфекции
    processInfection(deltaTime) {
        const { incubationPeriodRatio, progressionPeriodRatio } = this.paramsRef.current;
        const incubationPeriod = this.personalRecoveryTime * incubationPeriodRatio;
        const progressionPeriod = this.personalRecoveryTime * progressionPeriodRatio;

        // Инкубационный период
        if (this.infectedSince < incubationPeriod) {
            this.infectionStage = 'incubation';
            this.contagiousness = 0.1 + 0.4 * (this.infectedSince / incubationPeriod);
        }
        // Активная фаза
        else if (this.infectedSince < incubationPeriod + progressionPeriod) {
            this.infectionStage = 'progression';
            const progress = (this.infectedSince - incubationPeriod) / progressionPeriod;
            this.contagiousness = 0.5 + 0.4 * Math.sin(progress * Math.PI);
        }
        // Фаза выздоровления
        else {
            this.infectionStage = 'recovery';
            const recoveryPeriod = this.personalRecoveryTime - (incubationPeriod + progressionPeriod);
            const progress = (this.infectedSince - incubationPeriod - progressionPeriod) / recoveryPeriod;
            this.contagiousness = 0.3 - 0.2 * progress;
        }

        // Учет индивидуальных факторов
        let severityFactor = (1.7 - this.immunity);
        if (this.hasComorbidities) severityFactor *= 1.2;
        if (this.inPharmacy) severityFactor *= 0.7;

        this.infectedSince += deltaTime * severityFactor;

        // Проверка завершения болезни
        if (this.infectedSince >= this.personalRecoveryTime) {
            this.finishTreatment();
        }
    }

    // Завершение лечения (выздоровление или смерть)
    finishTreatment() {
        let deathChance = this.paramsRef.current.mortalityRate * (2 - this.immunity);
        if (this.hasComorbidities) deathChance *= 2;
        if (this.inPharmacy) deathChance *= 0.3;
        if (this.inQuarantine) deathChance *= 0.8;

        if (Math.random() < deathChance) {
            this.status = 'deceased';
        } else {
            this.status = 'recovered';
            this.immunity = Math.min(1, this.immunity + 0.3);
        }

        // Сбрасываем параметры болезни
        this.infectedSince = null;
        this.infectionStage = null;
        this.contagiousness = 0;
        this.updateColor();
    }
}