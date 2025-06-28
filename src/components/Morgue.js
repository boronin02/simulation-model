export class Morgue {
    constructor(id, x, y, paramsRef) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.paramsRef = paramsRef;
        this.ambulances = [];
        this.lastAmbulanceTime = 0;
        this.ambulanceCooldown = paramsRef.current.morgueCollectionInterval;
    }

    draw(ctx) {
        // Рисуем здание морга
        ctx.fillStyle = '#616161';
        ctx.fillRect(this.x - 15, this.y - 15, 30, 30);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(this.x - 15, this.y - 15, 30, 30);

        // Иконка
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚰', this.x, this.y);

        // Рисуем машины
        this.ambulances.forEach(ambulance => ambulance.draw(ctx));
    }

    update(time, people, onBuried) {
        // Удаляем завершившие работу машины
        this.ambulances = this.ambulances.filter(a => !a.isDone);

        // Ищем трупы для сбора
        const corpses = people.filter(p => p.status === 'deceased' && !p.isBeingCollected);
        if (corpses.length > 0 && time - this.lastAmbulanceTime > this.ambulanceCooldown) {
            this.lastAmbulanceTime = time;
            const target = corpses[Math.floor(Math.random() * corpses.length)];
            this.ambulances.push(new Ambulance(
                this.x,
                this.y,
                target,
                this.paramsRef.current.morgueCollectionSpeed,
                onBuried
            ));
        }

        // Обновляем все машины
        this.ambulances.forEach(ambulance => ambulance.update(people));
    }
}

class Ambulance {
    constructor(startX, startY, target, speed, onBuried) {
        this.x = startX;
        this.y = startY;
        this.startX = startX;
        this.startY = startY;
        this.target = target;
        this.speed = speed;
        this.state = 'going'; // 'going' | 'collecting' | 'returning'
        this.collectionTime = 0;
        this.collectionDuration = 2000;
        this.isDone = false;
        this.onBuried = onBuried;
        this.hasBuried = false;
    }

    draw(ctx) {
        // Рисуем корпус машины
        ctx.fillStyle = '#FFFFFF'; // Белый цвет
        ctx.fillRect(this.x - 10, this.y - 6, 20, 12);

        // Рисуем окна
        ctx.fillStyle = '#87CEEB'; // Голубой цвет
        ctx.fillRect(this.x - 8, this.y - 5, 6, 4);
        ctx.fillRect(this.x + 2, this.y - 5, 6, 4);

        // Рисуем мигалки
        const flashPhase = Date.now() % 1000 > 500 ? '#FF0000' : '#0000FF';
        ctx.fillStyle = flashPhase;
        ctx.fillRect(this.x - 10, this.y - 8, 4, 4);
        ctx.fillRect(this.x + 6, this.y - 8, 4, 4);

        // Рисуем контур
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - 10, this.y - 6, 20, 12);
    }

    update(people) {
        if (this.state === 'going') {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 5) {
                this.state = 'collecting';
                this.target.isBeingCollected = true;
            } else {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
        }
        else if (this.state === 'collecting') {
            this.collectionTime += 16;
            if (this.collectionTime >= this.collectionDuration) {
                this.state = 'returning';
                this.target.isBeingCollected = true;
            }
        }
        else if (this.state === 'returning') {
            const dx = this.startX - this.x;
            const dy = this.startY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 5) {
                this.isDone = true;
                if (!this.hasBuried) {
                    this.onBuried();
                    this.hasBuried = true;
                }
            } else {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
        }
    }
}