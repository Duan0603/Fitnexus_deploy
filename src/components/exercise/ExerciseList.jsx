import React from 'react';
import { useNavigate } from 'react-router-dom';

function ExerciseList({ exercises, loading, error, total }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Đang tải danh sách bài tập...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-600">Lỗi: {error}</p>
      </div>
    );
  }

  if (!exercises || exercises.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
        Không tìm thấy bài tập phù hợp. Hãy thử thay đổi bộ lọc hoặc tìm kiếm.
      </div>
    );
  }

  const handleExerciseClick = (exercise) => {
    navigate(`/exercises/${exercise.id}`, { state: exercise });
  };

  return (
    <div>
      <div className="mb-3 text-sm text-gray-600">
        Tìm thấy {typeof total === 'number' ? total : (exercises?.length || 0)} bài tập
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {exercises.map((exercise) => (
          <div
            key={exercise.id}
            onClick={() => handleExerciseClick(exercise)}
            className="overflow-hidden transition-shadow border border-gray-200 rounded-lg cursor-pointer hover:shadow-lg"
          >
            {exercise.imageUrl && (
              <div className="relative w-full bg-gray-100" style={{ paddingBottom: '75%' }}>
                <img
                  src={exercise.imageUrl}
                  alt={exercise.name}
                  className="absolute inset-0 object-cover w-full h-full"
                  loading="lazy"
                />
              </div>
            )}
            
            <div className="p-4">
              <h3 className="mb-2 text-lg font-semibold text-gray-900 line-clamp-2">
                {exercise.name}
              </h3>
              
              {exercise.description && (
                <p className="mb-3 text-sm text-gray-600 line-clamp-2">
                  {exercise.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-2">
                {exercise.difficulty && (
                  <span className="px-2 py-1 text-xs font-medium text-blue-700 rounded bg-blue-50">
                    {exercise.difficulty}
                  </span>
                )}
                {exercise.equipment && (
                  <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded">
                    {exercise.equipment}
                  </span>
                )}
                {exercise.impact && (
                  <span className="px-2 py-1 text-xs font-medium text-green-700 rounded bg-green-50">
                    {exercise.impact}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExerciseList;
