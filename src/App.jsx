import React, { useState, useEffect, useRef } from 'react';
import { EpidemicModel } from './components/EpidemicModel';
import { SimulationRenderer } from './components/SimulationRenderer';
import { SimulationControls } from './components/SimulationControls';
import './App.css';

const App = () => {
  const [params, setParams] = useState({
    population: 100,
    initialInfected: 3,
    infectionRate: 0.3,
    infectionDistance: 10,
    recoveryTime: 200,
    mortalityRate: 0.02,
    simulationSpeed: 60,
    width: 1200,
    height: 600
  });

  const paramsRef = useRef(params);
  const [stats, setStats] = useState({
    healthy: 0,
    infected: 0,
    recovered: 0,
    deceased: 0
  });

  const canvasRef = useRef(null);
  const modelRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    modelRef.current = new EpidemicModel(paramsRef);
    rendererRef.current = new SimulationRenderer(canvasRef, modelRef.current);
    controlsRef.current = new SimulationControls(
      modelRef.current,
      rendererRef.current,
      setStats
    );
    controlsRef.current.setSpeed(params.simulationSpeed);
    controlsRef.current.reset();

    return () => controlsRef.current.stop();
  }, []);

  const updateParam = (name, value) => {
    setParams(prev => {
      const newParams = { ...prev, [name]: value };
      if (name === 'simulationSpeed') {
        controlsRef.current?.setSpeed(value);
      }
      return newParams;
    });
  };

  const toggleInfectionRadius = () => {
    rendererRef.current?.toggleInfectionRadius();
    // Принудительная перерисовка, если симуляция запущена
    if (controlsRef.current?.isRunning) {
      rendererRef.current?.draw();
    }
  };

  return (
    <div className="App">
      <h1 className='app__header'>Эпидемиологическая модель</h1>

      <div className="control-panels">
        <div className="control-panel">
          <h3>Отображение</h3>
          <div className="param">
            <label>
              <input
                type="checkbox"
                onChange={toggleInfectionRadius}
              />
              Показать зоны заражения
            </label>
          </div>
          <h3>Основные параметры</h3>
          <div className="param">
            <label>Население:</label>
            <input
              type="number"
              min="10"
              max="500"
              value={params.population}
              onChange={e => updateParam('population', parseInt(e.target.value))}
            />
          </div>

          <div className="param">
            <label>Начальные зараженные:</label>
            <input
              type="number"
              min="1"
              max={params.population}
              value={params.initialInfected}
              onChange={e => updateParam('initialInfected', parseInt(e.target.value))}
            />
          </div>

          <div className="param">
            <label>Скорость симуляции:</label>
            <input
              type="range"
              min="1"
              max="120"
              value={params.simulationSpeed}
              onChange={e => updateParam('simulationSpeed', parseInt(e.target.value))}
            />
            <span>{params.simulationSpeed}</span>
          </div>
        </div>

        <div className="control-panel">
          <h3>Параметры болезни</h3>
          <div className="param">
            <label>Вероятность заражения:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={params.infectionRate}
              onChange={e => updateParam('infectionRate', parseFloat(e.target.value))}
            />
            <span>{params.infectionRate.toFixed(2)}</span>
          </div>

          <div className="param">
            <label>Дистанция заражения:</label>
            <input
              type="range"
              min="5"
              max="20"
              value={params.infectionDistance}
              onChange={e => updateParam('infectionDistance', parseInt(e.target.value))}
            />
            <span>{params.infectionDistance}</span>
          </div>

          <div className="param">
            <label>Время болезни:</label>
            <input
              type="number"
              min="50"
              max="500"
              value={params.recoveryTime}
              onChange={e => updateParam('recoveryTime', parseInt(e.target.value))}
            />
          </div>

          <div className="param">
            <label>Смертность (%):</label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={params.mortalityRate * 100}
              onChange={e => updateParam('mortalityRate', parseFloat(e.target.value) / 100)}
            />
            <span>{(params.mortalityRate * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="simulation-area">
        <canvas
          ref={canvasRef}
          width={params.width}
          height={params.height}
        />
      </div>

      <div className="simulation-controls">
        <button onClick={() => controlsRef.current.start()}>Старт</button>
        <button onClick={() => controlsRef.current.stop()}>Пауза</button>
        <button onClick={() => controlsRef.current.reset()}>Сброс</button>
      </div>

      <div className="stats">
        <h3>Статистика</h3>
        <p>Здоровые: {stats.healthy}</p>
        <p>Зараженные: {stats.infected}</p>
        <p>Выздоровевшие: {stats.recovered}</p>
        <p>Умершие: {stats.deceased}</p>
      </div>
    </div>
  );
};
export default App;