import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HeaderLogin from '../../components/header/HeaderLogin.jsx';
import {
  getCurrentExerciseApi,
  completeCurrentExerciseApi,
  skipCurrentExerciseApi,
  completeWorkoutSessionApi,
} from '../../lib/api.js';
import axios from 'axios';

function Badge({ children, tone = 'gray' }) {
  const tones = { 
    gray: 'bg-gray-100 text-gray-700', 
    blue: 'bg-blue-100 text-blue-700', 
    green: 'bg-green-100 text-green-700', 
    amber: 'bg-amber-100 text-amber-700',
    purple: 'bg-purple-100 text-purple-700'
  };
  return <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${tones[tone] || tones.gray}`}>{children}</span>;
}

function ProgressBar({ current, total }) {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="w-full h-3 overflow-hidden bg-gray-200 rounded-full">
      <div 
        className="h-full transition-all duration-500 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export default function WorkoutRun() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [exercise, setExercise] = useState(null);
  const [isDone, setIsDone] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [steps, setSteps] = useState([]);

  const [seconds, setSeconds] = useState(60);
  const [running, setRunning] = useState(false);
  const timerRef = useRef(null);
  const autoCompleteRef = useRef(false);

  const loadCurrent = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCurrentExerciseApi(sessionId);
      if (res?.success) {
        const total = Number(res.data?.total_exercises) || 0;
        const sess = res.data?.session || null;
        setSession(sess ? { ...sess, exercises_count: total } : null);
        setExercise(res.data?.exercise || null);
        setIsDone(!!res.data?.is_done);
        setTotalCount(total);
        const preset = Number(res.data?.exercise?.target_rest_seconds);
        setSeconds(Number.isFinite(preset) && preset > 0 ? preset : 60);
        setRunning(false);
        // reset auto-complete guard for new/current exercise
        autoCompleteRef.current = false;
        if (timerRef.current) { 
          clearInterval(timerRef.current); 
          timerRef.current = null; 
        }
      } else {
        setError({ message: res?.message || 'Không thể tải dữ liệu' });
      }
    } catch (e) {
      setError({ message: e?.response?.data?.message || e?.message || 'Lỗi kết nối' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadCurrent(); 
  }, [sessionId]);

  // Load instructions/steps when exercise changes
  useEffect(() => {
    let alive = true;
    async function fetchSteps() {
      setSteps([]);
      const exId = exercise?.exercise_id;
      if (!exId) return;
      try {
        const r = await axios.get(`/api/exercises/id/${exId}/steps`);
        if (alive && r?.data?.success) {
          const arr = r.data.data || [];
          setSteps(Array.isArray(arr) ? arr : []);
        }
      } catch {}
    }
    fetchSteps();
    return () => { alive = false; };
  }, [exercise?.exercise_id]);

  useEffect(() => {
    if (!running) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current); 
          timerRef.current = null; 
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { 
      if (timerRef.current) clearInterval(timerRef.current); 
    };
  }, [running]);

  // Auto-complete when timer hits zero
  useEffect(() => {
    if (seconds !== 0) return;
    if (isDone) return;
    if (!exercise?.session_exercise_id) return;
    if (autoCompleteRef.current) return;
    autoCompleteRef.current = true;
    (async () => {
      try {
        const res = await completeCurrentExerciseApi(sessionId);
        if (res?.success) await loadCurrent();
      } catch (e) {
        // swallow, user can retry manually
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, exercise?.session_exercise_id]);

  const adjust = (delta) => setSeconds((s) => Math.max(0, s + delta));

  const handleComplete = async () => {
    try {
      const res = await completeCurrentExerciseApi(sessionId);
      if (res?.success) {
        await loadCurrent();
      } else {
        alert(res?.message || 'Không thể hoàn thành bài');
      }
    } catch (e) { 
      alert(e?.response?.data?.message || e?.message || 'Không thể hoàn thành bài'); 
    }
  };

  const handleSkip = async () => {
    if (!confirm('Bạn chắc chắn muốn bỏ qua bài tập này?')) return;
    try {
      const res = await skipCurrentExerciseApi(sessionId);
      if (res?.success) {
        await loadCurrent();
      } else {
        alert(res?.message || 'Không thể bỏ qua bài');
      }
    } catch (e) { 
      alert(e?.response?.data?.message || e?.message || 'Không thể bỏ qua bài'); 
    }
  };

  const handleEndSession = async () => {
    if (!confirm('Bạn có chắc muốn kết thúc buổi tập không?')) return;
    try {
      const res = await completeWorkoutSessionApi(sessionId, {});
      if (res?.success) {
        navigate('/dashboard');
      } else {
        alert(res?.message || 'Không thể kết thúc buổi');
      }
    } catch (e) { 
      alert(e?.response?.data?.message || e?.message || 'Không thể kết thúc buổi'); 
    }
  };

  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');

  const totalExercises = totalCount || session?.exercises_count || 0;
  const currentIndex = Number(session?.current_exercise_index || 0);
  const completedCount = currentIndex;


  return (
    <div className="min-h-screen text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100">
      <HeaderLogin />
      
      <main className="px-4 py-6 mx-auto max-w-7xl">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Quay lại</span>
          </button>
          
          <button
            onClick={handleEndSession}
            className="px-4 py-2 text-sm font-medium text-red-600 transition-colors border border-red-300 rounded-lg hover:bg-red-50"
          >
            Kết thúc buổi
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              <p className="mt-4 text-gray-600">Đang tải bài tập...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 mb-6 text-sm text-red-700 border-l-4 border-red-500 rounded-lg bg-red-50">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error.message}</span>
            </div>
          </div>
        )}

        {!loading && session && (
          <div className="space-y-6">
            {/* Session Progress Card */}
            <div className="p-6 bg-white shadow-sm rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {session.plan_name || `Buổi tập #${sessionId}`}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Đã hoàn thành {completedCount} / {totalExercises} bài tập
                  </p>
                </div>
                <Badge tone="blue">
                  Bài {currentIndex + 1}/{totalExercises}
                </Badge>
              </div>
              <ProgressBar current={completedCount} total={totalExercises} />
            </div>

            {isDone ? (
              /* Completion Screen */
              <div className="p-12 text-center border-2 border-green-300 shadow-lg bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-green-500 rounded-full">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="mb-3 text-3xl font-bold text-green-900">
                  Chúc mừng! 🎉
                </h2>
                <p className="mb-8 text-lg text-green-700">
                  Bạn đã hoàn thành tất cả bài tập trong buổi này
                </p>
                <button 
                  className="px-8 py-3 text-lg font-semibold text-white transition-all transform bg-green-600 shadow-lg rounded-xl hover:bg-green-700 hover:scale-105"
                  onClick={handleEndSession}
                >
                  Hoàn thành buổi tập
                </button>
              </div>
            ) : (
              /* Two Column Layout: Left (Image + Instructions) | Right (Timer + Controls) */
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                
                {/* LEFT COLUMN - Image & Instructions */}
                <div className="space-y-6">
                  {/* Exercise Image */}
                  <div className="overflow-hidden bg-white shadow-lg rounded-2xl">
                    <div className="relative w-full h-96 bg-gradient-to-br from-gray-200 to-gray-300">
                      {exercise?.image_url ? (
                        <img 
                          src={exercise.image_url} 
                          alt={exercise.name} 
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Exercise Basic Info */}
                    <div className="p-6">
                      <h2 className="mb-3 text-3xl font-bold text-gray-900">
                        {exercise?.name || 'Bài tập'}
                      </h2>
                      
                      {exercise?.description && (
                        <p className="mb-4 text-base leading-relaxed text-gray-600">
                          {exercise.description}
                        </p>
                      )}

                      {steps && steps.length > 0 && (
                        <div className="mt-4">
                          <h3 className="mb-2 text-lg font-semibold text-gray-800">Hướng dẫn</h3>
                          <ol className="pl-6 space-y-2 text-gray-700 list-decimal">
                            {steps.map((s, i) => (
                              <li key={i}>
                                {s.instruction_text || s.title || ''}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Exercise Targets */}
                      <div className="flex flex-wrap gap-3">
                        {exercise?.target_sets && (
                          <Badge tone="green">
                            <svg className="w-4 h-4 mr-1.5 inline" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                            </svg>
                            {exercise.target_sets} sets
                          </Badge>
                        )}
                        {exercise?.target_reps && (
                          <Badge tone="amber">
                            <svg className="w-4 h-4 mr-1.5 inline" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                            </svg>
                            {exercise.target_reps} reps
                          </Badge>
                        )}
                        {exercise?.difficulty_level && (
                          <Badge tone="purple">
                            {exercise.difficulty_level}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Instructions Card */}
                  <div className="p-6 bg-white shadow-lg rounded-2xl">
                    <h3 className="flex items-center gap-2 mb-4 text-xl font-semibold text-gray-900">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      Hướng dẫn từng bước
                    </h3>
                    {steps?.length ? (
                      <ol className="space-y-3">
                        {steps.map((s, i) => (
                          <li
                            key={i}
                            className="p-4 text-sm text-gray-800 transition-colors border-l-4 border-blue-500 rounded-r-lg bg-blue-50 hover:bg-blue-100"
                          >
                            <span className="inline-block px-2 py-1 mr-3 text-xs font-bold text-white bg-blue-600 rounded">
                              Bước {i + 1}
                            </span>
                            <span className="text-base">
                              {typeof s === "string"
                                ? s
                                : s.instruction_text || s.text || JSON.stringify(s)}
                            </span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <div className="flex items-center gap-3 p-4 text-sm text-gray-500 rounded-lg bg-gray-50">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                        </svg>
                        Chưa có hướng dẫn chi tiết.
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN - Timer & Controls */}
                <div className="space-y-6">
                  {/* Timer Card */}
                  <div className="sticky p-6 bg-white shadow-lg top-6 rounded-2xl">
                    <div className="flex items-center justify-center mb-6">
                      <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-lg font-semibold text-gray-900">Thời gian bài tập</span>
                    </div>

                    {/* Timer Display */}
                    <div className="relative mb-8">
                      <div className={`font-mono text-8xl font-bold text-center tabular-nums transition-colors ${
                        running ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {mins}:{secs}
                      </div>
                      {running && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-40 h-40 border-4 border-blue-200 rounded-full animate-ping opacity-20"></div>
                        </div>
                      )}
                    </div>

                    {/* Timer Controls */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <button 
                        className="px-5 py-3 text-base font-medium text-gray-700 transition-colors border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400" 
                        onClick={() => adjust(-15)}
                      >
                        -15s
                      </button>
                      <button 
                        className="px-5 py-3 text-base font-medium text-gray-700 transition-colors border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400" 
                        onClick={() => adjust(-5)}
                      >
                        -5s
                      </button>
                      <button 
                        className="px-5 py-3 text-base font-medium text-gray-700 transition-colors border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400" 
                        onClick={() => adjust(5)}
                      >
                        +5s
                      </button>
                      <button 
                        className="px-5 py-3 text-base font-medium text-gray-700 transition-colors border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400" 
                        onClick={() => adjust(15)}
                      >
                        +15s
                      </button>
                    </div>

                    {/* Start/Pause Button */}
                    <div className="flex justify-center mb-6">
                      {!running ? (
                        <button 
                          className="flex items-center justify-center w-full gap-3 px-8 py-4 text-lg font-semibold text-white transition-all transform bg-blue-600 shadow-lg rounded-xl hover:bg-blue-700 hover:scale-105"
                          onClick={() => setRunning(true)}
                        >
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                          </svg>
                          Bắt đầu đếm giờ
                        </button>
                      ) : (
                        <button 
                          className="flex items-center justify-center w-full gap-3 px-8 py-4 text-lg font-semibold text-white transition-all transform shadow-lg rounded-xl bg-amber-600 hover:bg-amber-700 hover:scale-105"
                          onClick={() => setRunning(false)}
                        >
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                          </svg>
                          Tạm dừng
                        </button>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <button 
                        className="flex items-center justify-center w-full gap-3 px-6 py-4 text-lg font-semibold text-white transition-all transform bg-green-600 shadow-md rounded-xl hover:bg-green-700 hover:scale-105"
                        onClick={handleComplete}
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Hoàn thành bài tập
                      </button>
                      
                      <button 
                        className="flex items-center justify-center w-full gap-3 px-6 py-4 text-lg font-medium text-gray-700 transition-all border-2 border-gray-300 rounded-xl hover:bg-gray-50"
                        onClick={handleSkip}
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                        Bỏ qua bài tập
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
