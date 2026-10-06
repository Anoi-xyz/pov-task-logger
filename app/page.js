'use client';

import { useState, useEffect, useRef } from 'react';

const PRESETS = [
  { name: 'Pick & Pack', steps: ['Pick item', 'Pack item', 'Scan & Label', 'Ship'] },
  { name: 'Cooking', steps: ['Prep ingredients', 'Chop vegetables', 'Cook', 'Plate & serve'] },
  { name: 'Cleaning', steps: ['Clear surfaces', 'Wipe down', 'Vacuum/mop', 'Final check'] },
];

function getStepImageUrl(stepText, seed) {
  const prompt = `POV first person view, realistic photo, ${stepText}`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=640&height=360&nologo=true&seed=${seed}`;
}

export default function Home() {
  const [presetIndex, setPresetIndex] = useState(0);
  const [sessionName, setSessionName] = useState(PRESETS[0].name);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoAutoProgress, setDemoAutoProgress] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  const [steps, setSteps] = useState(() =>
    PRESETS[0].steps.map((text, i) => ({
      id: String(i + 1),
      text,
      completed: false,
      timestamp: null,
    }))
  );
  const [newStepText, setNewStepText] = useState('');

  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const recordingTimeRef = useRef(0);

  // Sync recordingTimeRef with recordingTime state
  useEffect(() => {
    recordingTimeRef.current = recordingTime;
  }, [recordingTime]);

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
    const savedIndex = localStorage.getItem('pov_logger_preset_index');
    if (savedIndex !== null) {
      setPresetIndex(Number(savedIndex));
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

  // Save preset index to localStorage
  useEffect(() => {
    localStorage.setItem('pov_logger_preset_index', String(presetIndex));
  }, [presetIndex]);

  // Determine active step for demo image generation
  const activeStep = steps.find((s) => !s.completed) || steps[steps.length - 1];
  const activeStepIndex = activeStep ? steps.indexOf(activeStep) : 0;
  const seed = activeStep ? (presetIndex + activeStepIndex) * 17 + 42 : 42;
  const imageUrl = activeStep ? getStepImageUrl(activeStep.text, seed) : null;

  // Reset loading & error state on image URL change
  useEffect(() => {
    if (imageUrl) {
      setImgLoading(true);
      setImgError(false);
    }
  }, [imageUrl]);

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

  // Auto-progress timer for demo mode when active
  useEffect(() => {
    if (!demoMode || !demoAutoProgress || !isRecording) return;

    const interval = setInterval(() => {
      setSteps((prevSteps) => {
        const nextStepIndex = prevSteps.findIndex((s) => !s.completed);
        if (nextStepIndex === -1) return prevSteps; // All steps already completed

        const now = new Date().toLocaleTimeString();
        const timeStr = `REC +${formatTimer(recordingTimeRef.current)} (${now})`;

        return prevSteps.map((step, idx) => {
          if (idx === nextStepIndex) {
            return {
              ...step,
              completed: true,
              timestamp: timeStr,
            };
          }
          return step;
        });
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [demoMode, demoAutoProgress, isRecording]);

  const toggleRecording = () => {
    setIsRecording((prev) => !prev);
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

  const handleNextTask = () => {
    const nextIdx = (presetIndex + 1) % PRESETS.length;
    setPresetIndex(nextIdx);
    setSessionName(PRESETS[nextIdx].name);
    setSteps(
      PRESETS[nextIdx].steps.map((text, i) => ({
        id: String(Date.now() + i),
        text,
        completed: false,
        timestamp: null,
      }))
    );
  };

  const handleNewSession = () => {
    setSessionName('Custom Session');
    setSteps([]);
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

  const isAllCompleted = steps.length > 0 && steps.every((s) => s.completed);

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
              placeholder="e.g. Pick & Pack"
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
              steps.length === 0 ? (
                <div className="demo-placeholder">Add a task to see a preview</div>
              ) : imgError || !imageUrl ? (
                <div className="demo-placeholder">DEMO POV FEED - SIMULATED CAMERA</div>
              ) : (
                <>
                  {imgLoading && (
                    <div className="demo-loading-overlay">
                      <div className="spinner" />
                      <span>Generating preview...</span>
                    </div>
                  )}
                  <img
                    src={imageUrl}
                    alt={activeStep?.text || 'POV Step Preview'}
                    onLoad={() => setImgLoading(false)}
                    onError={() => {
                      setImgLoading(false);
                      setImgError(true);
                    }}
                    className="demo-img"
                    style={{ display: imgLoading ? 'none' : 'block' }}
                  />
                </>
              )
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

            {demoMode && (
              <label className="toggle-label" title="Toggle automatic step progression in demo mode">
                <input
                  type="checkbox"
                  checked={demoAutoProgress}
                  onChange={(e) => setDemoAutoProgress(e.target.checked)}
                  className="checkbox"
                />
                <span>{demoAutoProgress ? '🤖 Auto-progress' : '👆 Manual tap'}</span>
              </label>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            {isAllCompleted && (
              <div className="session-complete-banner">
                <div className="banner-title">🎉 Session Complete!</div>
                <p className="banner-subtitle">All tasks logged for this session.</p>
                <div className="banner-actions">
                  <button onClick={handleNextTask} className="btn btn-primary">
                    ⏭️ Next Task
                  </button>
                  <button onClick={handleNewSession} className="btn btn-secondary">
                    ➕ New Session
                  </button>
                </div>
              </div>
            )}

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
