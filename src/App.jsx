// App.jsx - Главный компонент приложения, управляющий всей симуляцией
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { Person } from './components/Person';
import { Pharmacy } from './components/Pharmacy';
import { Quarantine } from './components/Quarantine';
import { Morgue } from './components/Morgue';

const App = () => {
  // Параметры симуляции, хранимые в useRef для сохранения между рендерами
  const paramsRef = useRef({
    population: 150,                     // Общее количество людей
    initialInfected: 5,                  // Начальное количество зараженных
    infectionRate: 0.4,                  // Вероятность заражения при контакте
    infectionDistance: 20,               // Дистанция заражения
    recoveryTime: 2000,                  // Время выздоровления (мс)
    mortalityRate: 0.12,                 // Вероятность смерти
    simulationSpeed: 60,                 // Скорость симуляции (множитель)
    pharmacyCount: 4,                    // Количество аптек
    pharmacyRadius: 35,                  // Радиус действия аптек
    pharmacyRecoveryBoost: 3,            // Ускорение выздоровления в аптеке
    quarantineCount: 3,                  // Количество карантинных зон
    quarantineRadius: 60,                // Радиус карантинных зон
    quarantineInfectionReduction: 0.5,   // Снижение заражения в карантине
    reinfectionRate: 0.1,                // Вероятность повторного заражения
    width: 1200,                        // Ширина поля симуляции
    height: 700,                        // Высота поля симуляции
    incubationPeriodRatio: 0.3,          // Доля инкубационного периода
    progressionPeriodRatio: 0.5,         // Доля активной фазы болезни
    minRecoveryVariation: 0.7,           // Минимальная вариация времени болезни
    maxRecoveryVariation: 1.3,           // Максимальная вариация времени болезни
    morgueCount: 1,                      // Количество моргов
    morgueCollectionSpeed: 2,            // Скорость сбора тел
    morgueCollectionInterval: 5000       // Интервал между отправками машин
  });

  // Состояние для отображения параметров (синхронизировано с paramsRef)
  const [displayParams, setDisplayParams] = useState({ ...paramsRef.current });

  // Статистика симуляции
  const [stats, setStats] = useState({
    healthy: 0,         // Здоровые люди
    infected: 0,        // Зараженные
    recovered: 0,       // Выздоровевшие
    deceased: 0,        // Умершие (общее число)
    inPharmacy: 0,      // Люди в аптеках
    inQuarantine: 0,    // Люди в карантине
    contagious: 0       // Люди в заразной стадии
  });

  // Состояния управления симуляцией
  const [isRunning, setIsRunning] = useState(false);         // Запущена ли симуляция
  const [showInfectionRadius, setShowInfectionRadius] = useState(false); // Показать радиус заражения
  const [pulsePhase, setPulsePhase] = useState(0);          // Фаза пульсации радиуса

  // Refs для хранения изменяемых данных между рендерами
  const canvasRef = useRef(null);               // Ссылка на canvas
  const peopleRef = useRef([]);                 // Массив людей
  const pharmaciesRef = useRef([]);             // Массив аптек
  const quarantinesRef = useRef([]);            // Массив карантинных зон
  const morguesRef = useRef([]);                // Массив моргов
  const animationFrameId = useRef(null);        // ID анимационного фрейма
  const lastUpdateTime = useRef(0);             // Время последнего обновления
  const isRunningRef = useRef(false);           // Ссылка на состояние isRunning

  // Обновление параметра симуляции
  const updateParam = (name, value) => {
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    paramsRef.current = { ...paramsRef.current, [name]: numValue };
    setDisplayParams(prev => ({ ...prev, [name]: numValue }));

    // Параметры, требующие сброса симуляции при изменении
    const shouldReset = [
      'population',
      'initialInfected',
      'pharmacyCount',
      'quarantineCount',
      'morgueCount'
    ].includes(name);

    if (shouldReset) {
      if (isRunningRef.current) {
        resetSimulation();
      } else {
        initSimulation();
      }
    }
  };

  // Синхронизация isRunning с useRef
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Инициализация объектов (аптек, карантинов, моргов)
  const initObjects = useCallback(() => {
    pharmaciesRef.current = Array.from({ length: paramsRef.current.pharmacyCount }, (_, i) =>
      new Pharmacy(i, Math.random() * paramsRef.current.width, Math.random() * paramsRef.current.height, paramsRef)
    );

    quarantinesRef.current = Array.from({ length: paramsRef.current.quarantineCount }, (_, i) =>
      new Quarantine(i, Math.random() * paramsRef.current.width, Math.random() * paramsRef.current.height, paramsRef)
    );

    morguesRef.current = Array.from({ length: paramsRef.current.morgueCount }, (_, i) =>
      new Morgue(i, Math.random() * paramsRef.current.width, Math.random() * paramsRef.current.height, paramsRef)
    );
  }, []);

  // Инициализация симуляции (создание людей и объектов)
  const initSimulation = useCallback(() => {
    initObjects();

    peopleRef.current = Array.from({ length: paramsRef.current.population }, (_, i) => {
      const status = i < paramsRef.current.initialInfected ? 'infected' : 'healthy';
      return new Person(i, Math.random() * paramsRef.current.width, Math.random() * paramsRef.current.height, status, paramsRef);
    });

    updateStats();
    drawSimulation();
  }, [initObjects]);

  // Отрисовка радиуса заражения с эффектом пульсации
  const drawInfectionRadius = useCallback((ctx, person) => {
    const pulseFactor = 1 + 0.1 * Math.sin(pulsePhase);
    const currentRadius = paramsRef.current.infectionDistance * pulseFactor;

    // Создание градиента для радиуса
    const gradient = ctx.createRadialGradient(
      person.x, person.y, 0,
      person.x, person.y, currentRadius
    );
    gradient.addColorStop(0, 'rgba(255, 100, 100, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 100, 100, 0)');

    // Отрисовка радиуса
    ctx.beginPath();
    ctx.arc(person.x, person.y, currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Отрисовка границы радиуса
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  }, [pulsePhase]);

  // Отрисовка персонажа
  const drawPerson = useCallback((ctx, person) => {
    if (person.isBeingCollected) return;

    const radius = person.status === 'infected' ? 6 : 5;
    ctx.beginPath();
    ctx.arc(person.x, person.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = person.color;
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, []);

  // Основная функция отрисовки симуляции
  const drawSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Очистка canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Отрисовка радиусов заражения (если включено)
    if (showInfectionRadius) {
      peopleRef.current.forEach(person => {
        if (person.status === 'infected') {
          drawInfectionRadius(ctx, person);
        }
      });
    }

    // Отрисовка зон (карантин, аптеки, морги)
    quarantinesRef.current.forEach(q => q.draw(ctx));
    pharmaciesRef.current.forEach(p => p.draw(ctx));
    morguesRef.current.forEach(m => m.draw(ctx));

    // Отрисовка людей
    peopleRef.current.forEach(person => {
      drawPerson(ctx, person);
    });
  }, [showInfectionRadius, drawInfectionRadius, drawPerson]);

  // Основной игровой цикл
  const gameLoop = useCallback((timestamp) => {
    if (!isRunningRef.current) return;

    if (!lastUpdateTime.current) {
      lastUpdateTime.current = timestamp;
    }

    // Расчет времени между кадрами
    const deltaTime = timestamp - lastUpdateTime.current;
    lastUpdateTime.current = timestamp;

    // Анимация пульсации радиуса
    setPulsePhase(prev => (prev + 0.02) % (Math.PI * 2));

    // Масштабирование времени в зависимости от скорости симуляции
    const scaledDeltaTime = deltaTime * (paramsRef.current.simulationSpeed / 60);
    updateSimulation(scaledDeltaTime, timestamp);
    drawSimulation();

    // Запрос следующего кадра анимации
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [drawSimulation]);

  // Обновление состояния симуляции
  const updateSimulation = (deltaTime, currentTime) => {
    // Обновление позиций и состояний людей
    peopleRef.current.forEach(person => {
      person.move(
        pharmaciesRef.current,
        quarantinesRef.current,
        deltaTime,
        (statName) => {
          if (statName === 'deceased') {
            setStats(prev => ({ ...prev, deceased: prev.deceased + 1 }));
          }
        }
      );
      if (person.status === 'infected') {
        person.tryInfectOthers(peopleRef.current, quarantinesRef.current);
      }
    });

    // Обновление моргов (сбор тел)
    morguesRef.current.forEach(morgue => {
      morgue.update(currentTime, peopleRef.current, () => {
        setStats(prev => ({ ...prev, deceased: prev.deceased - 1 }));
      });
    });

    updateStats();
  };

  // Обновление статистики
  const updateStats = useCallback(() => {
    const newStats = {
      healthy: 0,
      infected: 0,
      recovered: 0,
      deceased: stats.deceased, // Общее число умерших
      inPharmacy: 0,
      inQuarantine: 0,
      contagious: 0
    };

    // Подсчет статистики по людям
    peopleRef.current.forEach(person => {
      newStats[person.status]++;
      if (person.inPharmacy) newStats.inPharmacy++;
      if (person.inQuarantine) newStats.inQuarantine++;
      if (person.status === 'infected' && person.infectionStage === 'progression') {
        newStats.contagious++;
      }
    });

    setStats(newStats);
  }, [stats.deceased]);

  // Управление симуляцией
  const startSimulation = () => {
    if (!isRunningRef.current) {
      setIsRunning(true);
      isRunningRef.current = true;
      lastUpdateTime.current = 0;
      animationFrameId.current = requestAnimationFrame(gameLoop);
    }
  };

  const stopSimulation = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
  };

  const resetSimulation = () => {
    stopSimulation();
    initSimulation();
  };

  const toggleInfectionRadius = () => {
    setShowInfectionRadius(!showInfectionRadius);
  };

  // Эффекты для отрисовки при изменении состояния
  useEffect(() => {
    drawSimulation();
  }, [showInfectionRadius, drawSimulation]);

  // Инициализация при монтировании и очистка при размонтировании
  useEffect(() => {
    initSimulation();
    return () => cancelAnimationFrame(animationFrameId.current);
  }, [initSimulation]);

  // Рендер интерфейса
  return (
    <div className="App">
      <h1 className="app-title">Эпидемиологическая модель</h1>

      <div className="main-layout">
        {/* Левая панель управления */}
        <div className="control-panel left-panel">
          <div className="panel-section">
            <h3>Основные параметры</h3>
            <div className="param">
              <label>Население: {displayParams.population}</label>
              <input
                type="range" min="10" max="500" step="1"
                value={displayParams.population}
                onChange={e => updateParam('population', e.target.value)}
              />
            </div>
            <div className="param">
              <label>Начальные зараженные: {displayParams.initialInfected}</label>
              <input
                type="range" min="1" max={displayParams.population} step="1"
                value={displayParams.initialInfected}
                onChange={e => updateParam('initialInfected', e.target.value)}
              />
            </div>
            <div className="param">
              <label>Скорость: {displayParams.simulationSpeed}x</label>
              <input
                type="range" min="1" max="120" step="1"
                value={displayParams.simulationSpeed}
                onChange={e => updateParam('simulationSpeed', e.target.value)}
              />
            </div>
          </div>

          <div className="panel-section">
            <h3>Стадии болезни</h3>
            <div className="param">
              <label>Инкубационный период: {(displayParams.incubationPeriodRatio * 100).toFixed(0)}%</label>
              <input
                type="range" min="10" max="60" step="1"
                value={displayParams.incubationPeriodRatio * 100}
                onChange={e => updateParam('incubationPeriodRatio', e.target.value / 100)}
              />
            </div>
            <div className="param">
              <label>Активная фаза: {(displayParams.progressionPeriodRatio * 100).toFixed(0)}%</label>
              <input
                type="range" min="20" max="70" step="1"
                value={displayParams.progressionPeriodRatio * 100}
                onChange={e => updateParam('progressionPeriodRatio', e.target.value / 100)}
              />
            </div>
            <div className="param">
              <label>Вариация длительности: ±{((displayParams.maxRecoveryVariation - 1) * 100).toFixed(0)}%</label>
              <input
                type="range" min="10" max="50" step="5"
                value={(displayParams.maxRecoveryVariation - 1) * 100}
                onChange={e => {
                  const variation = 1 + (parseInt(e.target.value) / 100);
                  updateParam('maxRecoveryVariation', variation);
                  updateParam('minRecoveryVariation', 2 - variation);
                }}
              />
            </div>
          </div>
        </div>

        {/* Центральная область с симуляцией */}
        <div className="simulation-container">
          <div className="simulation-area">
            <canvas ref={canvasRef} width={displayParams.width} height={displayParams.height} />
          </div>

          <div className="simulation-controls">
            <button onClick={startSimulation} disabled={isRunning}>Старт</button>
            <button onClick={stopSimulation} disabled={!isRunning}>Пауза</button>
            <button onClick={resetSimulation}>Сброс</button>
            <button
              onClick={toggleInfectionRadius}
              className={showInfectionRadius ? 'active' : ''}
            >
              {showInfectionRadius ? 'Скрыть радиус' : 'Показать радиус'}
            </button>
          </div>

          <div className="stats">
            <h3>Статистика</h3>
            <div className="stats-grid">
              <div>Здоровые: {stats.healthy}</div>
              <div>Зараженные: {stats.infected}</div>
              <div>Выздоровевшие: {stats.recovered}</div>
              <div>Умершие: {stats.deceased}</div>
              <div>В аптеках: {stats.inPharmacy}</div>
              <div>В карантине: {stats.inQuarantine}</div>
              <div>Заразные: {stats.contagious}</div>
            </div>
          </div>
        </div>

        {/* Правая панель управления */}
        <div className="control-panel right-panel">
          <div className="panel-section">
            <h3>Зоны заражения</h3>
            <div className="param">
              <label>Радиус: {displayParams.infectionDistance}</label>
              <input
                type="range" min="5" max="30" step="1"
                value={displayParams.infectionDistance}
                onChange={e => updateParam('infectionDistance', e.target.value)}
              />
            </div>
            <div className="param">
              <label>Вероятность: {displayParams.infectionRate.toFixed(2)}</label>
              <input
                type="range" min="0" max="1" step="0.01"
                value={displayParams.infectionRate}
                onChange={e => updateParam('infectionRate', e.target.value)}
              />
            </div>
          </div>

          <div className="panel-section">
            <h3>Аптеки</h3>
            <div className="param">
              <label>Количество: {displayParams.pharmacyCount}</label>
              <input
                type="range" min="0" max="10" step="1"
                value={displayParams.pharmacyCount}
                onChange={e => updateParam('pharmacyCount', e.target.value)}
              />
            </div>
            <div className="param">
              <label>Радиус: {displayParams.pharmacyRadius}</label>
              <input
                type="range" min="10" max="50" step="1"
                value={displayParams.pharmacyRadius}
                onChange={e => updateParam('pharmacyRadius', e.target.value)}
              />
            </div>
          </div>

          <div className="panel-section">
            <h3>Карантин</h3>
            <div className="param">
              <label>Количество: {displayParams.quarantineCount}</label>
              <input
                type="range" min="0" max="10" step="1"
                value={displayParams.quarantineCount}
                onChange={e => updateParam('quarantineCount', e.target.value)}
              />
            </div>
            <div className="param">
              <label>Радиус: {displayParams.quarantineRadius}</label>
              <input
                type="range" min="20" max="80" step="1"
                value={displayParams.quarantineRadius}
                onChange={e => updateParam('quarantineRadius', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;