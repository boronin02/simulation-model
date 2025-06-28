import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { Person } from './components/Person';
import { Pharmacy } from './components/Pharmacy';
import { Quarantine } from './components/Quarantine';
import { Morgue } from './components/Morgue';

const App = () => {
  // Параметры симуляции
  const paramsRef = useRef({
    population: 150,
    initialInfected: 5,
    infectionRate: 0.4,
    infectionDistance: 20,
    recoveryTime: 2000,
    mortalityRate: 0.12,
    simulationSpeed: 60,
    pharmacyCount: 4,
    pharmacyRadius: 35,
    pharmacyRecoveryBoost: 3,
    quarantineCount: 3,
    quarantineRadius: 60,
    quarantineInfectionReduction: 0.5,
    reinfectionRate: 0.1,
    width: 1200,
    height: 700,
    incubationPeriodRatio: 0.3,
    progressionPeriodRatio: 0.5,
    minRecoveryVariation: 0.7,
    maxRecoveryVariation: 1.3,
    morgueCount: 1,
    morgueCollectionSpeed: 2,
    morgueCollectionInterval: 5000
  });

  const [displayParams, setDisplayParams] = useState({ ...paramsRef.current });
  const [stats, setStats] = useState({
    healthy: 0,
    infected: 0,
    recovered: 0,
    deceased: 0,    // Всего умерших
    inPharmacy: 0,
    inQuarantine: 0,
    contagious: 0
  });

  const [isRunning, setIsRunning] = useState(false);
  const [showInfectionRadius, setShowInfectionRadius] = useState(false);
  const [pulsePhase, setPulsePhase] = useState(0);

  // Refs
  const canvasRef = useRef(null);
  const peopleRef = useRef([]);
  const pharmaciesRef = useRef([]);
  const quarantinesRef = useRef([]);
  const morguesRef = useRef([]);
  const animationFrameId = useRef(null);
  const lastUpdateTime = useRef(0);
  const isRunningRef = useRef(false);

  const updateParam = (name, value) => {
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    paramsRef.current = { ...paramsRef.current, [name]: numValue };
    setDisplayParams(prev => ({ ...prev, [name]: numValue }));

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

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Инициализация объектов
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

  // Инициализация симуляции
  const initSimulation = useCallback(() => {
    initObjects();

    peopleRef.current = Array.from({ length: paramsRef.current.population }, (_, i) => {
      const status = i < paramsRef.current.initialInfected ? 'infected' : 'healthy';
      return new Person(i, Math.random() * paramsRef.current.width, Math.random() * paramsRef.current.height, status, paramsRef);
    });

    updateStats();
    drawSimulation();
  }, [initObjects]);

  // Отрисовка радиуса заражения
  const drawInfectionRadius = useCallback((ctx, person) => {
    const pulseFactor = 1 + 0.1 * Math.sin(pulsePhase);
    const currentRadius = paramsRef.current.infectionDistance * pulseFactor;

    const gradient = ctx.createRadialGradient(
      person.x, person.y, 0,
      person.x, person.y, currentRadius
    );
    gradient.addColorStop(0, 'rgba(255, 100, 100, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 100, 100, 0)');

    ctx.beginPath();
    ctx.arc(person.x, person.y, currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

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

  // Основная отрисовка
  const drawSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Рисуем радиусы заражения
    if (showInfectionRadius) {
      peopleRef.current.forEach(person => {
        if (person.status === 'infected') {
          drawInfectionRadius(ctx, person);
        }
      });
    }

    // 2. Рисуем зоны
    quarantinesRef.current.forEach(q => q.draw(ctx));
    pharmaciesRef.current.forEach(p => p.draw(ctx));
    morguesRef.current.forEach(m => m.draw(ctx));

    // 3. Рисуем людей
    peopleRef.current.forEach(person => {
      drawPerson(ctx, person);
    });
  }, [showInfectionRadius, drawInfectionRadius, drawPerson]);

  // Игровой цикл
  const gameLoop = useCallback((timestamp) => {
    if (!isRunningRef.current) return;

    if (!lastUpdateTime.current) {
      lastUpdateTime.current = timestamp;
    }

    const deltaTime = timestamp - lastUpdateTime.current;
    lastUpdateTime.current = timestamp;

    // Анимация пульсации радиуса
    setPulsePhase(prev => (prev + 0.02) % (Math.PI * 2));

    const scaledDeltaTime = deltaTime * (paramsRef.current.simulationSpeed / 60);
    updateSimulation(scaledDeltaTime, timestamp);
    drawSimulation();

    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [drawSimulation]);


  const updateSimulation = (deltaTime, currentTime) => {
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

    // Удаляем вызов morgue.update()
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

  useEffect(() => {
    drawSimulation();
  }, [showInfectionRadius, drawSimulation]);

  useEffect(() => {
    initSimulation();
    return () => cancelAnimationFrame(animationFrameId.current);
  }, [initSimulation]);

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