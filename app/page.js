'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [sessionName, setSessionName] = useState('POV Session #1');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const [steps, setSteps] = useState([
    { id: '1', text: 'Inspect equipment and workspace', completed: false, timestamp: null },
    { id: '2', text: 'Position camera overhead / POV angle', completed: false, timestamp: null },
    { id: '3', text: 'Execute primary task action sequence', completed: false, timestamp: null },
    { id: '4', text: 'Verify output quality & cleanup', completed: false, timestamp: null },
  ]);
  const [newStepText, setNewStepText] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const animFrameRef = useRef(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedSteps = localStorage.getItem('pov_logger_steps');
    if (savedSteps) {
      try {
        setSteps(JSON.parse(savedSteps));
      } catch (e) {
        console.error('Failed to parse saved steps', e);
      }
    }
    const savedName = localStorage.getItem('pov_logger_session_name');
    if (savedName) {
      setSessionName(savedName);
    }
  }, []);

  // Save steps to localStorage
  useEffect(() => {
    localStorage.setItem('pov_logger_steps', JSON.stringify(steps));
  }, [steps]);

  // Save session name to localStorage
  useEffect(() => {
    localStorage.setItem('pov_logger_session_name', sessionName);
  }, [sessionName]);

  // Initialize camera access
  useEffect(() => {
    let streamInstance = null;

    async function startCamera() {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        streamInstance = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
          setDemoMode(false);
        }
      } catch (err) {
        console.warn('Camera access error, falling back to Demo Mode:', err);
        setCameraError(err.message || 'Camera blocked or unavailable.');
        setCameraActive(false);
        setDemoMode(true);
      }
    }

    startCamera();

    return () => {
      if (streamInstance) {
        streamInstance.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Canvas animation for Demo Mode
  useEffect(() => {
    if (!demoMode || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let angle = 0;

    const renderDemo = () => {
      angle += 0.02;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid pattern
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw simulated camera crosshairs / reticle
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 60 + Math.sin(angle) * 10, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DEMO POV FEED - SIMULATED CAMERA', cx, cy + 90);

      animFrameRef.current = requestAnimationFrame(renderDemo);
    };

    renderDemo();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [demoMode]);

  // Recording timer tick
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTimer = (seconds) => {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
    } else {
      setIsRecording(false);
    }
  };

  const toggleStep = (id) => {
    const now = new Date().toLocaleTimeString();
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id === id) {
          const nextCompleted = !step.completed;
          return {
            ...step,
            completed: nextCompleted,
            timestamp: nextCompleted ? (isRecording ? `REC +${formatTimer(recordingTime)} (${now})` : now) : null,
          };
        }
        return step;
      })
    );
  };

  const handleAddStep = (e) => {
    e.preventDefault();
    if (!newStepText.trim()) return;
    const newStep = {
      id: Date.now().toString(),
      text: newStepText.trim(),
      completed: false,
      timestamp: null,
    };
    setSteps((prev) => [...prev, newStep]);
    setNewStepText('');
  };

  const resetSession = () => {
    if (confirm('Reset checklist and clear all completed timestamps?')) {
      setSteps((prev) =>
        prev.map((step) => ({
          ...step,
          completed: false,
          timestamp: null,
        }))
      );
      setRecordingTime(0);
      setIsRecording(false);
    }
  };

  const exportLog = () => {
    const logData = {
      sessionName,
      exportTime: new Date().toISOString(),
      recordingDurationSeconds: recordingTime,
      steps,
    };
    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sessionName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_log.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container">
      <header>
        <h1>
          📷 POV Task Logger
          <span className="badge">Demo</span>
        </h1>
        <div className="controls">
          <button onClick={exportLog} className="btn btn-secondary">
            📥 Export Log
          </button>
          <button onClick={resetSession} className="btn btn-secondary">
            🔄 Reset
          </button>
        </div>
      </header>

      <div className="grid">
        <div className="video-section">
          <div className="session-input-group">
            <label className="label">Session Name</label>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="input"
              placeholder="e.g. PCB Assembly Task #1"
            />
          </div>

          <div className="video-card">
            <div className="rec-overlay">
              <div className={`rec-dot ${isRecording ? '' : 'idle'}`} />
              <span className="rec-timer">{formatTimer(recordingTime)}</span>
            </div>

            <div className="mode-badge">
              {demoMode ? 'Demo Mode (Simulated)' : 'Live Camera'}
            </div>

            {demoMode ? (
              <canvas ref={canvasRef} width={640} height={360} />
            ) : (
              <video ref={videoRef} autoPlay playsInline muted />
            )}
          </div>

          {cameraError && (
            <div className="demo-fallback">
              ⚠️ {cameraError} Switched to Demo mode fallback.
            </div>
          )}

          <div className="controls">
            <button
              onClick={toggleRecording}
              className={`btn ${isRecording ? 'btn-stop' : 'btn-primary'}`}
            >
              {isRecording ? '⏹️ Stop REC' : '🔴 Start REC'}
            </button>
            <button
              onClick={() => setDemoMode(!demoMode)}
              className="btn btn-secondary"
            >
              {demoMode ? '📹 Switch to Camera' : '🎮 Switch to Demo Feed'}
            </button>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-title">
              <span>Task Checklist</span>
              <span className="label">
                {steps.filter((s) => s.completed).length} / {steps.length} Done
              </span>
            </div>

            <ul className="step-list">
              {steps.map((step) => (
                <li
                  key={step.id}
                  className={`step-item ${step.completed ? 'completed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={step.completed}
                    onChange={() => toggleStep(step.id)}
                    className="checkbox"
                  />
                  <div className="step-content">
                    <div className="step-text">{step.text}</div>
                    {step.timestamp && (
                      <div className="step-time">Logged: {step.timestamp}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <form onSubmit={handleAddStep} className="add-step-form">
              <input
                type="text"
                value={newStepText}
                onChange={(e) => setNewStepText(e.target.value)}
                placeholder="Add a new checklist step..."
                className="input"
              />
              <button type="submit" className="btn btn-secondary">
                Add
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
