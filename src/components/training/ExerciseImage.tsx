import { useState } from 'react';
import type { Exercise } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { getExerciseImageUrl } from '@/utils/exerciseCatalog';

export function ExerciseImage({ exercise, className = 'h-10 w-10' }: {
  exercise: Pick<Exercise, 'id' | 'name' | 'gifUrl' | 'category'>;
  className?: string;
}) {
  const { state } = useApp();
  const url = getExerciseImageUrl(exercise, state.exerciseLibrary);
  const [failedUrl, setFailedUrl] = useState<string>();
  if (url && url !== failedUrl) {
    return <img src={url} alt={exercise.name} loading="lazy" onError={() => setFailedUrl(url)}
      className={`${className} shrink-0 rounded-xl bg-white object-contain`} />;
  }
  return <div className={`${className} shrink-0 rounded-xl bg-slate-50 flex items-center justify-center`}>
    <i aria-hidden="true" className={`fas ${exercise.category === 'cardio' ? 'fa-heart-pulse' : 'fa-dumbbell'} text-slate-300`}></i>
  </div>;
}
