// FILE: src/components/workout/StartWorkoutButton.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { api } from '../../lib/api.js';
import ResumeRestartModal from './ResumeRestartModal.jsx';


/**
* StartWorkoutButton
* - Props:
* planId (number|string) - id của kế hoạch hiện tại
* planName (string) - tên plan (để hiển thị trong modal)
* exercises (array) - danh sách bài tập cho buổi tập tự do
*
* Usage:
* <StartWorkoutButton planId={planId} planName={plan?.name} />
* <StartWorkoutButton exercises={todayList} />
*/
export default function StartWorkoutButton({ planId, planName, exercises }) {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [showResumeModal, setShowResumeModal] = useState(false);


  const createNewSession = async () => {
    try {
      const payload = planId 
        ? { plan_id: Number(planId) }
        : { exercise_ids: exercises.map(ex => ex.id) };
      
      const res = await api.post('/api/workout', payload);

      if (res?.data?.success) {
        const sessionId = res.data.data.session_id;
        navigate(`/workout-run/${sessionId}`);
        return true;
      }
      console.error('Create session failed:', res?.data?.message);
      alert(`Không thể tạo buổi tập: ${res?.data?.message || 'Lỗi không xác định'}`);
      return false;
    } catch (err) {
      // race: someone else (or another tab) created session in between -> backend may return 409 with session data
      if (err?.response?.status === 409) {
        const sessionData = err.response.data?.data;
        if (sessionData?.session_id) {
          setActiveSession(sessionData);
          setShowResumeModal(true);
          return true; // Technically not a failure, just a conflict
        }
      }
      console.error('Create session error:', err);
      alert(`Lỗi khi tạo buổi tập: ${err?.response?.data?.message || err.message}`);
      return false;
    }
  };


  const startWorkout = async () => {
    setStarting(true);
    try {
      // 1. check active session
      const activeRes = await api.get('/api/workout/active');
      const sess = activeRes?.data?.data?.session || null;


      if (!sess) {
        // no active -> create
        await createNewSession();
        return;
      }


      // there is an active session
      setActiveSession(sess);
      setShowResumeModal(true);

    } catch (err) {
      console.error('startWorkout error:', err);
      // If checking for active session fails, assume none and try to create.
      // The creation will fail with 409 if there is one, which is handled.
      await createNewSession();
    } finally {
      setStarting(false);
    }
  };


  const handleResume = () => {
    setShowResumeModal(false);
    if (!activeSession) return;
    navigate(`/workout-run/${activeSession.session_id}`);
  };


  const handleRestart = async () => {
    setShowResumeModal(false);
    if (!activeSession) return;
    setStarting(true);
    try {
      // Mark the old session as complete first
      await api.post(`/api/workout/${activeSession.session_id}/complete`);
      // Then create the new one
      await createNewSession();
    } catch (err) {
      console.error('Failed to restart workout:', err);
      alert(`Không thể bắt đầu lại buổi tập: ${err?.response?.data?.message || err.message}`);
    } finally {
      setStarting(false);
    }
  };

  return (
    <>
      <button
        className="w-full px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg disabled:opacity-60"
        onClick={startWorkout}
        disabled={starting}
      >
        {starting ? 'Đang bắt đầu...' : 'Bắt đầu buổi'}
      </button>

      {showResumeModal && activeSession && (
        <ResumeRestartModal
          activeSession={activeSession}
          currentPlanId={planId}
          currentPlanName={planName}
          onClose={() => setShowResumeModal(false)}
          onResume={handleResume}
          onRestart={handleRestart}
        />
      )}
    </>
  );
}

StartWorkoutButton.propTypes = {
  planId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  planName: PropTypes.string,
  exercises: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.any.isRequired,
    name: PropTypes.string,
  })),
};

StartWorkoutButton.defaultProps = {
  planId: null,
  planName: '',
  exercises: null,
};