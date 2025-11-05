import React, { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Bounds } from "@react-three/drei";
import { HumanModel } from "../../components/3d/HumanModel";
import ExerciseList from "../../components/exercise/ExerciseList";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth.context";
import api from "../../lib/api";

export default function Home() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPart, setSelectedPart] = useState("");

  const handleBodyPartClick = async (bodyPart) => {
    if (bodyPart === selectedPart) return;

    setLoading(true);
    setError("");
    setSelectedPart(bodyPart);
    try {
      const response = await api.get(`/api/exercises/${bodyPart}`);
      setExercises(response.data);
    } catch (err) {
      setError("Failed to fetch exercises. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = (user?.username || "").replaceAll("_", " ");

  return (
    <div className="h-screen bg-gradient-to-br from-[#2D1B69] via-[#351C7A] to-[#7B2574]">
      <div className="px-6 py-4 flex items-center justify-between bg-gradient-to-b from-[#2D1B69]/50 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
              <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm8 7h-5v13h-2v-6h-2v6H9V9H4V7h16v2z"/>
            </svg>
            <h1 className="text-2xl font-bold text-white">
              FitNexus 3D
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Profile Button */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-600 rounded-full">
              <span className="text-sm font-medium text-white">
                {user?.username?.[0]?.toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-white no-underline">Welcome, {displayName}</span>
          </div>

          {/* Homepage Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-purple-600 rounded-full hover:bg-purple-700"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z"/>
            </svg>
            Homepage
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-red-600 rounded-full hover:bg-red-700"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-5rem)] p-6 grid grid-cols-3 gap-6">
        {/* Left: 3D Model */}
        <div className="relative col-span-2 overflow-hidden rounded-3xl bg-white/5 backdrop-blur-sm">
          <div className="absolute z-10 top-6 left-6">
            <h2 className="mb-2 text-2xl font-bold text-white">3D Human Body Model</h2>
            <p className="text-sm text-purple-200">
              Click on body parts to select them and explore exercises
            </p>
          </div>

          <Canvas camera={{ position: [0, 1.6, 9], fov: 45, near: 0.01, far: 10000 }}>
            <ambientLight intensity={0.65} />
            <directionalLight position={[10, 12, 8]} intensity={0.9} />
            <Suspense fallback={null}>
              <Bounds fit observe margin={1.3}>
                <HumanModel onBodyPartClick={handleBodyPartClick} />
              </Bounds>
            </Suspense>
            <OrbitControls 
              makeDefault 
              target={[0, 1, 0]} 
              enablePan={false} 
              minDistance={0.01} 
              maxDistance={Infinity} 
              zoomSpeed={0.9}
            />
          </Canvas>
        </div>

        {/* Right: Body Part Information */}
        <div className="space-y-6">
          {/* Info Card */}
          <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-600 rounded-xl">
                <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Body Part Information</h2>
            </div>
            <p className="text-sm text-purple-200">
              {selectedPart ? (
                `Selected: ${selectedPart}`
              ) : (
                'Click on any body part in the 3D model to see information and exercises.'
              )}
            </p>
          </div>

          {/* Exercise List */}
          <div className="flex-1 overflow-hidden rounded-3xl bg-white/5 backdrop-blur-sm">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Exercises</h2>
                {loading && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
                    <span className="text-sm text-purple-200">Loading...</span>
                  </div>
                )}
              </div>
            </div>
            <div className="max-h-[calc(100vh-24rem)] overflow-y-auto">
              <ExerciseList 
                exercises={exercises} 
                loading={loading} 
                error={error} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
