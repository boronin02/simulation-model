export class Person {
    constructor(id, x, y, status = 'healthy', paramsRef) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.status = status;
        this.paramsRef = paramsRef;
        this.radius = 5;
        this.dx = (Math.random() - 0.5) * 2;
        this.dy = (Math.random() - 0.5) * 2;
        this.infectedSince = status === 'infected' ? 0 : null;
        this.inPharmacy = false;
        this.inQuarantine = false;
        this.infectionStage = status === 'infected' ? 'incubation' : null;
        this.contagiousness = 0;
        this.immunity = Math.random() * 0.5 + 0.5;
        this.hasComorbidities = Math.random() < 0.2;
        this.isSuperSpreader = Math.random() < 0.1;
        this.updateColor();

        // Индивидуальное время болезни с вариацией
        this.personalRecoveryTime = this.calculatePersonalRecoveryTime();
    }

    calculatePersonalRecoveryTime() {
        const { recoveryTime, minRecoveryVariation, maxRecoveryVariation } = this.paramsRef.current;
        const variation = minRecoveryVariation + Math.random() * (maxRecoveryVariation - minRecoveryVariation);
        let personalTime = recoveryTime * variation;

        if (this.hasComorbidities) personalTime *= 1.3;
        if (this.inPharmacy) personalTime *= 0.8;

        return personalTime;
    }

    updateColor() {
        if (this.status === 'infected') {
            const colors = {
                incubation: '#FFA07A', // Светло-оранжевый
                progression: '#FF4500', // Оранжево-красный
                recovery: '#FF6347'    // Томатный
            };
            this.color = colors[this.infectionStage] || '#FF5252';
        } else {
            this.color = {
                healthy: '#4CAF50',
                recovered: '#2196F3',
                deceased: '#616161'
            }[this.status];
        }
    }


    move(pharmacies, quarantines, deltaTime = 16) {
        if (this.status === 'deceased') return;

        this.checkZones(pharmacies, quarantines);

        if (this.status === 'infected') {
            this.processInfection(deltaTime);
        }

        this.processMovement(deltaTime);
        this.checkBoundaries();
    }

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

    processMovement(deltaTime) {
        let speedFactor = 1;
        if (this.inQuarantine) speedFactor = 0.5;
        if (this.status === 'infected' && this.infectionStage === 'progression') speedFactor *= 0.7;

        const frameSpeed = (deltaTime / 16) * speedFactor;
        this.x += this.dx * frameSpeed;
        this.y += this.dy * frameSpeed;
    }

    checkBoundaries() {
        const { width, height } = this.paramsRef.current;
        if (this.x < 0 || this.x > width) this.dx = -this.dx;
        if (this.y < 0 || this.y > height) this.dy = -this.dy;
    }

    tryInfectOthers(people, quarantines) {
        const {
            infectionRate,
            infectionDistance,
            quarantineInfectionReduction,
            reinfectionRate
        } = this.paramsRef.current;

        // Только больные в активной стадии могут заражать других
        if (this.infectionStage !== 'progression') return;

        people.forEach(other => {
            // Пропускаем умерших
            if (other.status === 'deceased') return;

            // Определяем базовую вероятность заражения
            let infectionProbability = 0;

            if (other.status === 'healthy') {
                // Полная вероятность для здоровых
                infectionProbability = infectionRate;
            } else if (other.status === 'recovered') {
                // Для выздоровевших учитываем:
                // 1. Базовый шанс повторного заражения
                // 2. Уровень иммунитета
                // 3. Время после выздоровления
                const timeSinceRecovery = this.paramsRef.current.recoveryTime * 0.2; // 20% от времени болезни
                const immunityFactor = other.immunity * (1 + timeSinceRecovery / 1000);
                infectionProbability = reinfectionRate * 0.1 / immunityFactor;

                // Максимальный шанс повторного заражения 5%
                infectionProbability = Math.min(infectionProbability, 0.05);
            }

            // Супер-распространители в 3 раза заразнее
            if (this.isSuperSpreader) {
                infectionProbability *= 3;
            }

            // Учет карантина
            const targetInQuarantine = quarantines.some(q => {
                const dx = q.x - other.x;
                const dy = q.y - other.y;
                return Math.sqrt(dx * dx + dy * dy) < q.paramsRef.current.quarantineRadius;
            });

            if (targetInQuarantine) {
                infectionProbability *= quarantineInfectionReduction;
            }

            // Проверка расстояния
            const distance = Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);

            if (distance < infectionDistance && Math.random() < infectionProbability) {
                other.status = 'infected';
                other.infectedSince = 0;
                other.infectionStage = 'incubation';
                other.updateColor();
                other.personalRecoveryTime = other.calculatePersonalRecoveryTime();

                // После повторного заражения иммунитет снижается сильнее
                if (other.status === 'recovered') {
                    other.immunity = Math.max(0.2, other.immunity * 0.7);
                }
            }
        });
    }

    processInfection(deltaTime) {
        const { incubationPeriodRatio, progressionPeriodRatio } = this.paramsRef.current;

        const incubationPeriod = this.personalRecoveryTime * incubationPeriodRatio;
        const progressionPeriod = this.personalRecoveryTime * progressionPeriodRatio;

        // Прогрессия болезни через стадии
        if (this.infectedSince < incubationPeriod) {
            this.infectionStage = 'incubation';
            // Плавное увеличение заразности от 0.1 до 0.5
            this.contagiousness = 0.1 + 0.4 * (this.infectedSince / incubationPeriod);
        }
        else if (this.infectedSince < incubationPeriod + progressionPeriod) {
            this.infectionStage = 'progression';
            // Пик заразности с плавным нарастанием и спадом
            const progress = (this.infectedSince - incubationPeriod) / progressionPeriod;
            this.contagiousness = 0.5 + 0.4 * Math.sin(progress * Math.PI);
        }
        else {
            this.infectionStage = 'recovery';
            // Плавное снижение заразности от 0.3 до 0.1
            const recoveryPeriod = this.personalRecoveryTime - (incubationPeriod + progressionPeriod);
            const progress = (this.infectedSince - incubationPeriod - progressionPeriod) / recoveryPeriod;
            this.contagiousness = 0.3 - 0.2 * progress;
        }

        // Учет индивидуальных факторов скорости течения болезни
        let severityFactor = (1.7 - this.immunity);
        if (this.hasComorbidities) severityFactor *= 1.2;
        if (this.inPharmacy) severityFactor *= 0.7;

        this.infectedSince += deltaTime * severityFactor;

        // Проверка на завершение болезни
        if (this.infectedSince >= this.personalRecoveryTime) {
            this.finishTreatment();
        }
    }


    finishTreatment() {
        let deathChance = this.paramsRef.current.mortalityRate * (2 - this.immunity);
        if (this.hasComorbidities) deathChance *= 2;
        if (this.inPharmacy) deathChance *= 0.3;
        if (this.inQuarantine) deathChance *= 0.8;

        if (Math.random() < deathChance) {
            this.status = 'deceased';
        } else {
            this.status = 'recovered';
            // Усиление иммунитета после болезни, но не полная защита
            this.immunity = Math.min(1, this.immunity + 0.3);
        }

        this.infectedSince = null;
        this.infectionStage = null;
        this.contagiousness = 0;
        this.updateColor();
    }
}