import { useEffect, useState } from 'react';
import api from '../../lib/api.js';
import { useSearchParams } from 'react-router-dom';

export default function useModelingController(options = {}) {
  const { persistInURL = false } = options;

  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPrimaryOpen, setIsPrimaryOpen] = useState(false);
  const [isSecondaryOpen, setIsSecondaryOpen] = useState(false);
  const [primaryExercises, setPrimaryExercises] = useState([]);
  const [secondaryExercises, setSecondaryExercises] = useState([]);

  useEffect(() => {
    if (!persistInURL) return;
    const group = searchParams.get('group');
    const openPanel = searchParams.get('openPanel') === '1';
    const openP = searchParams.get('openP') === '1';
    const openS = searchParams.get('openS') === '1';
    if (group) {
      setSelectedMuscleGroup(group);
      setIsPanelOpen(openPanel);
      setIsPrimaryOpen(openP);
      setIsSecondaryOpen(openS);
    }
  }, []);

  useEffect(() => {
    if (!selectedMuscleGroup) {
      setExercises([]);
      setPrimaryExercises([]);
      setSecondaryExercises([]);
      return;
    }
    if (isPanelOpen) {
      fetchExercises(selectedMuscleGroup);
    }
  }, [selectedMuscleGroup, isPanelOpen]);

  const fetchExercises = async (muscleGroup) => {
    setLoading(true);
    setError(null);
    try {
      // Request a large pageSize so modeling lists have the full set
      const response = await api.get(`/api/exercises/muscle/${muscleGroup}`, {
        params: { page: 1, pageSize: 1000 },
      });
      if (response.data?.success) {
        const list = response.data.data || [];
        setExercises(list);
        const prim = [];
        const sec = [];
        for (const ex of list) {
          const impact = ex.impact_level || ex.impact || ex.impactLevel || null;
          if (impact === 'primary') prim.push(ex);
          else if (impact === 'secondary') sec.push(ex);
        }
        setPrimaryExercises(prim);
        setSecondaryExercises(sec);
      } else {
        setExercises([]);
        setPrimaryExercises([]);
        setSecondaryExercises([]);
        setError('Failed to fetch exercises');
      }
    } catch (err) {
      setExercises([]);
      setPrimaryExercises([]);
      setSecondaryExercises([]);
      setError(err?.message || 'Error fetching exercises');
    } finally {
      setLoading(false);
    }
  };

  const formatGroupLabel = (str) =>
    (str || '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const syncURL = (next) => {
    if (!persistInURL) return;
    setSearchParams(next, { replace: false });
  };

  const handleSelectMuscle = (group) => {
    setSelectedMuscleGroup(group);
    setIsPanelOpen(false);
    setIsPrimaryOpen(false);
    setIsSecondaryOpen(false);

    const next = new URLSearchParams(searchParams);
    next.set('group', group);
    if (persistInURL) {
      next.set('openPanel', '0');
      next.set('openP', '0');
      next.set('openS', '0');
    }
    syncURL(next);
  };

  const togglePanel = () => {
    const nextOpen = !isPanelOpen;
    setIsPanelOpen(nextOpen);
    const next = new URLSearchParams(searchParams);
    next.set('group', selectedMuscleGroup || '');
    if (persistInURL) {
      next.set('openPanel', nextOpen ? '1' : '0');
      next.set('openP', isPrimaryOpen ? '1' : '0');
      next.set('openS', isSecondaryOpen ? '1' : '0');
    }
    syncURL(next);
    if (nextOpen && selectedMuscleGroup) fetchExercises(selectedMuscleGroup);
  };

  const togglePrimary = () => {
    const nextOpen = !isPrimaryOpen;
    setIsPrimaryOpen(nextOpen);
    const next = new URLSearchParams(searchParams);
    next.set('group', selectedMuscleGroup || '');
    if (persistInURL) {
      next.set('openPanel', '1');
      next.set('openP', nextOpen ? '1' : '0');
      next.set('openS', isSecondaryOpen ? '1' : '0');
    }
    syncURL(next);
  };

  const toggleSecondary = () => {
    const nextOpen = !isSecondaryOpen;
    setIsSecondaryOpen(nextOpen);
    const next = new URLSearchParams(searchParams);
    next.set('group', selectedMuscleGroup || '');
    if (persistInURL) {
      next.set('openPanel', '1');
      next.set('openP', isPrimaryOpen ? '1' : '0');
      next.set('openS', nextOpen ? '1' : '0');
    }
    syncURL(next);
  };

  return {
    // state
    selectedMuscleGroup,
    exercises,
    loading,
    error,
    isPanelOpen,
    isPrimaryOpen,
    isSecondaryOpen,
    primaryExercises,
    secondaryExercises,
    // actions
    handleSelectMuscle,
    togglePanel,
    togglePrimary,
    toggleSecondary,
    formatGroupLabel,
  };
}
