import React from "react";
import { useNavigate } from "react-router-dom";
import ModelViewer from "../../components/ModelViewer.jsx";
import logo from "../../assets/logo.png";
import useModelingController from "../../features/modeling/useModelingController.js";
import HeaderDemo from "../../components/header/HeaderDemo.jsx";

function ModelingDemo() {
  const navigate = useNavigate();
  const {
    selectedMuscleGroup,
    exercises,
    loading,
    error,
    isPanelOpen,
    isPrimaryOpen,
    isSecondaryOpen,
    primaryExercises,
    secondaryExercises,
    handleSelectMuscle,
    togglePanel,
    togglePrimary,
    toggleSecondary,
    formatGroupLabel,
  } = useModelingController({ persistInURL: false });

  return (
    <div className="flex flex-col h-screen text-black">
      <HeaderDemo/>
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left side - 3D Model (40%) */}
        <div className="w-2/5 p-4 border-r bg-gray-50">
          <div className="flex flex-col h-full">
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-gray-800">
                Xem thử mô hình 3D
              </h2>
              <p className="text-sm text-gray-600">
                Khám phá mô hình 3D tương tác. Chọn nhóm cơ để xem bài tập.
              </p>
            </div>
            <div className="flex-1 overflow-hidden bg-white rounded-lg">
              {/* Model preview */}
              <ModelViewer onSelectMuscleGroup={handleSelectMuscle} />
            </div>
          </div>
        </div>

        {/* Right side - ExercisesDemo (60%) */}
        <div className="flex flex-col w-3/5">
          {/* Filters (preview disabled) */}
          <div className="p-4 bg-white border-b">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block mb-1 text-xs font-medium text-gray-700">
                  Cấp độ
                </label>
                <select
                  disabled
                  className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
                >
                  <option value="all">Tất cả cấp độ</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block mb-1 text-xs font-medium text-gray-700">
                  Tác động
                </label>
                <select
                  disabled
                  className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
                >
                  <option value="all">Primary & Secondary</option>
                  <option value="primary">Chỉ Primary</option>
                  <option value="secondary">Chỉ Secondary</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block mb-1 text-xs font-medium text-gray-700">
                  Sắp xếp
                </label>
                <select
                  disabled
                  className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
                >
                  <option value="name">Tên A-Z</option>
                  <option value="popular">Phổ biến nhất</option>
                  <option value="level">Theo cấp độ</option>
                </select>
              </div>
            </div>
          </div>

          {/* Exercise lists area */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {/* Empty state */}
            {!selectedMuscleGroup && (
              <div className="flex items-center justify-center h-full text-center">
                <div className="max-w-md text-sm text-gray-600">
                  Chọn nhóm cơ trên mô hình 3D để xem danh sách bài tập (xem
                  thử). Đăng nhập để trải nghiệm đầy đủ.
                </div>
              </div>
            )}

            {selectedMuscleGroup && (
              <div className="space-y-4">
                {/* Confirmation button to toggle panel */}
                <button
                  type="button"
                  onClick={togglePanel}
                  className="flex items-center justify-between w-full p-4 transition bg-white rounded-lg shadow hover:shadow-md"
                >
                  <div className="text-left">
                    <div className="text-sm text-gray-500">
                      {isPanelOpen
                        ? "Thu gọn danh sách bài tập"
                        : `Bạn muốn chọn nhóm cơ ${formatGroupLabel(
                            selectedMuscleGroup
                          )} này?`}
                    </div>
                    <div className="text-lg font-semibold text-gray-800">
                      {formatGroupLabel(selectedMuscleGroup)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isPanelOpen && (
                      <span className="px-2 py-1 text-xs text-blue-700 rounded-full bg-blue-50">
                        {exercises.length}
                      </span>
                    )}
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        isPanelOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {isPanelOpen && (
                  <>
            
                    <button
                      type="button"
                      onClick={togglePrimary}
                      className="flex items-center justify-between w-full p-4 transition bg-white rounded-lg shadow hover:shadow-md"
                    >
                      <div className="text-left">
                        <div className="text-sm text-gray-500">
                          Bài tập tác động chính
                        </div>
                        <div className="text-lg font-semibold text-gray-800">
                          Primary
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 text-xs text-blue-700 rounded-full bg-blue-50">
                          {primaryExercises.length}
                        </span>
                        <svg
                          className={`w-5 h-5 text-gray-500 transition-transform ${
                            isPrimaryOpen ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </button>

                    {/* Loading state */}
                    {loading && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <div className="w-4 h-4 border-2 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                        <span>Đang tải danh sách bài tập...</span>
                      </div>
                    )}

                    {/* Error state */}
                    {error && !loading && (
                      <div className="text-red-600">{error}</div>
                    )}

                    {/* Primary list */}
                    {isPrimaryOpen && !loading && !error && (
                      <div className="bg-white divide-y rounded-lg shadow">
                        {primaryExercises.length === 0 ? (
                          <div className="p-4 text-gray-500">
                            Không có bài tập phù hợp.
                          </div>
                        ) : (
                          primaryExercises.map((ex) => (
                            <button
                              key={ex.id}
                              type="button"
                              onClick={() =>
                                navigate(`/exercises/${ex.id}`, { state: ex })
                              }
                              className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-50"
                            >
                              <span className="text-gray-800">{ex.name}</span>
                              <svg
                                className="w-4 h-4 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>
                          ))
                        )}
                      </div>
                    )}

     
                    <button
                      type="button"
                      onClick={toggleSecondary}
                      className="flex items-center justify-between w-full p-4 transition bg-white rounded-lg shadow hover:shadow-md"
                    >
                      <div className="text-left">
                        <div className="text-sm text-gray-500">
                          Bài tập hỗ trợ/phụ
                        </div>
                        <div className="text-lg font-semibold text-gray-800">
                          Secondary
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 text-xs text-blue-700 rounded-full bg-blue-50">
                          {secondaryExercises.length}
                        </span>
                        <svg
                          className={`w-5 h-5 text-gray-500 transition-transform ${
                            isSecondaryOpen ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </button>

                    {/* Secondary list */}
                    {isSecondaryOpen && !loading && !error && (
                      <div className="bg-white divide-y rounded-lg shadow">
                        {secondaryExercises.length === 0 ? (
                          <div className="p-4 text-gray-500">
                            Không có bài tập phù hợp.
                          </div>
                        ) : (
                          secondaryExercises.map((ex) => (
                            <button
                              key={ex.id}
                              type="button"
                              onClick={() =>
                                navigate(`/exercises/${ex.id}`, { state: ex })
                              }
                              className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-50"
                            >
                              <span className="text-gray-800">{ex.name}</span>
                              <svg
                                className="w-4 h-4 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModelingDemo;
