// App.jsx
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/auth.context.jsx";
import { ThemeProvider } from "./context/theme.context.jsx";


import Register from "./pages/authentication/Register.jsx";
import Login from "./pages/authentication/Login.jsx";
import GoogleOtp from "./pages/authentication/GoogleOtp.jsx";
import ForgotPassword from "./pages/authentication/ForgotPassword.jsx";
import VerifyCode from "./pages/authentication/VerifyCode.jsx";
import ResetPassword from "./pages/authentication/ResetPassword.jsx";
import Landing from "./pages/landing/Landing.jsx";
import NutritionAI from "./pages/nutrition/NutritionAI.jsx";
import NutritionDemo from "./pages/nutrition/NutritionDemo.jsx";
import NutritionPersonalize from "./pages/nutrition/NutritionPersonalize.jsx";
import Dashboard from "./pages/user/Dashboard.jsx";
import Modeling from "./pages/model3D/Modeling.jsx";
import ModelingDemo from "./pages/model3D/ModelingDemo.jsx";
import AiTrainer from "./components/AiTrainer.jsx";
import AiTrainerGuide from "./pages/AITrainer/AiTrainerGuide.jsx";
import ExerciseDetail from "./pages/exercises/ExerciseDetail.jsx";
import ExercisesDemo from "./pages/exercises/ExercisesDemo.jsx";
import Exercise from "./pages/exercises/Exercise.jsx";
import PlanNew from "./pages/plans/PlanNew.jsx";
import PlanPicker from "./pages/plans/PlanPicker.jsx";
import PlanDetail from "./pages/plans/PlanDetail.jsx";
import PlanEdit from "./pages/plans/PlanEdit.jsx"; // Thêm import
import Logout from "./pages/authentication/Logout.jsx";
import NotFoundRedirect from "./pages/system/NotFoundRedirect.jsx";
import WorkoutRun from "./pages/workout/WorkoutRun.jsx";
import AdminPlanDetail from "./pages/admin/AdminPlanDetail.jsx";
import Pricing from "./pages/pricing/Pricing.jsx";
import PaymentSuccess from "./pages/payment/PaymentSuccess.jsx";
import PaymentCancel from "./pages/payment/PaymentCancel.jsx";
// Onboarding
import OnboardingAge from "./pages/boardings/OnboardingAge.jsx";
import OnboardingBody from "./pages/boardings/OnboardingBody.jsx";
import OnboardingGoal from "./pages/boardings/OnboardingGoal.jsx";
import OnboardingWeight from "./pages/boardings/OnboardingWeight.jsx";
import OnboardingHeight from "./pages/boardings/OnboardingHeight.jsx";
import OnboardingBodyFat from "./pages/boardings/OnboardingBodyFat.jsx";
import OnboardingExperience from "./pages/boardings/OnboardingExperience.jsx";
import OnboardingFrequency from "./pages/boardings/OnboardingFrequency.jsx";
import OnboardingEntry from "./pages/boardings/OnboardingEntry.jsx";


// Admin
import AdminLayout from "./layouts/AdminLayout.jsx";
import AdminOverview from "./pages/admin/Overview.jsx";
import AdminUserDetail from "./pages/admin/UserDetail.jsx";
import AdminContentManage from "./pages/admin/ContentManage.jsx";
import AdminFinancialManage from "./pages/admin/AdminRevenue.jsx";
import Role from "./pages/admin/Role.jsx";
import Plan from "./pages/admin/Plan.jsx";
import AdminLockUnlock from "./pages/admin/LockUnlock.jsx";
import AdminResetPassword from "./pages/admin/ResetPassword.jsx";
import AdminUserPlans from "./pages/admin/UserPlans.jsx";
import UserPlanDetails from "./pages/admin/UserPlanDetails.jsx";
import AdminRevenue from "./pages/admin/AdminRevenue.jsx";

import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminPopularExercises from "./pages/admin/PopularExercises.jsx";
import AdminSupportReports from "./pages/admin/SupportReports.jsx";

// Account pages
import PersonalInfo from "./pages/account/PersonalInfo.jsx";
import ChangePassword from "./pages/account/ChangePassword.jsx";
import NotificationsCenter from "./pages/account/NotificationsCenter.jsx";
// import Activity from "./pages/account/Activity.jsx";

// Profile pages (only Avatar kept)
import Avatar from "./pages/profile/Avatar.jsx";

// Support pages
import FAQ from "./pages/support/FAQ.jsx";
// Settings pages
import Theme from "./pages/settings/Theme.jsx";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();


  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  const isAdmin = user && (user.role === "ADMIN" || user.isSuperAdmin === true);
  return isAdmin ? children : <Navigate to="/" replace />;
}


function App() {
  useEffect(() => {

    const handler = (e) => {
      console.log("oauth msg:", e.origin, e.data);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);


  return (
    <ThemeProvider>
      <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/login/otp" element={<GoogleOtp />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<OnboardingEntry />} />
          <Route path="/onboarding" element={<Navigate to="/onboarding/age" replace />} />
          <Route path="/onboarding/age" element={<OnboardingAge />} />
          <Route path="/onboarding/body_type" element={<OnboardingBody />} />
          <Route path="/onboarding/goal" element={<OnboardingGoal />} />
          <Route path="/onboarding/weight" element={<OnboardingWeight />} />
          <Route path="/onboarding/height" element={<OnboardingHeight />} />
          <Route path="/onboarding/level_body_fat" element={<OnboardingBodyFat />} />
          <Route path="/onboarding/experience_level" element={<OnboardingExperience />} />
          <Route path="/onboarding/workout_frequency" element={<OnboardingFrequency />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-code" element={<VerifyCode />} />
          <Route path="/reset-password" element={<ResetPassword />} />


          <Route path="/" element={<Landing />} />
          <Route
            path="/nutrition-ai"
            element={
              <PrivateRoute>
                <NutritionAI />
              </PrivateRoute>
            }
          />
          <Route path="/nutrition-demo" element={<NutritionDemo />} />
          <Route path="/nutrition-ai/personalize" element={<NutritionPersonalize />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />

          <Route path="/modeling-demo" element={<ModelingDemo />} />
          {/* Backward compat: redirect old preview path to new demo path */}
          <Route path="/modeling-preview" element={<Navigate to="/modeling-demo" replace />} />
          <Route path="/exercises-demo" element={<ExercisesDemo/>}/>
          <Route path="/ai-guide" element={<AiTrainerGuide />} />
          <Route
            path="/ai"
            element={
              <PrivateRoute>
                <AiTrainer />
              </PrivateRoute>
            }
          />
          <Route
            path="/exercises"
            element={
              <PrivateRoute>
                <Exercise />
              </PrivateRoute>
            }
          />
          <Route path="/logout" element={<Logout />} />
          <Route
            path="/plans/select"
            element={
              <PrivateRoute>
                <PlanPicker />
              </PrivateRoute>
            }
          />
          <Route
            path="/plans/:planId"
            element={
              <PrivateRoute>
                <PlanDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/plans/new"
            element={
              <PrivateRoute>
                <PlanNew />
              </PrivateRoute>
            }
          />
          <Route
            path="/plans/edit/:planId"
            element={
              <PrivateRoute>
                <PlanEdit />
              </PrivateRoute>
            }
          />
          <Route
            path="/exercises/:id"
            element={
                <ExerciseDetail />             
            }
          />

          <Route
            path="/workout-run/:sessionId"
            element={
              <PrivateRoute>
                <WorkoutRun />
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Protected route without MainLayout (full control) */}
          <Route
            path="/modeling"
            element={
              <PrivateRoute>
                <Modeling />
              </PrivateRoute>
            }
          />

          {/* Account Routes */}
          <Route
            path="/account/personal-info"
            element={
              <PrivateRoute>
                <PersonalInfo />
              </PrivateRoute>
            }
          />
          <Route
            path="/account/change-password"
            element={
              <PrivateRoute>
                <ChangePassword />
              </PrivateRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <PrivateRoute>
                <NotificationsCenter />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings/notifications"
            element={
              <PrivateRoute>
                <NotificationsCenter />
              </PrivateRoute>
            }
          />
          {/* Removed Security page */}
          {/* Activity route removed */}

          {/* Profile Routes (main profile removed) */}
          <Route
            path="/profile/avatar"
            element={
              <PrivateRoute>
                <Avatar />
              </PrivateRoute>
            }
          />

          {/* Support Routes */}
          <Route path="/support" element={<FAQ />} />
          <Route path="/support/faq" element={<FAQ />} />

          {/* Settings Routes */}
          <Route
            path="/settings/theme"
            element={
              <PrivateRoute>
                <Theme />
              </PrivateRoute>
            }
          />



          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="user-detail" element={<AdminUserDetail />} />
            <Route path="role" element={<Role />} />
            <Route path="plan" element={<Plan />} />
            <Route path="lock-unlock" element={<AdminLockUnlock />} />
            <Route path="reset-password" element={<AdminResetPassword />} />
            <Route path="content" element={<AdminContentManage />} />
            <Route path="finance" element={<AdminFinancialManage />} />
            <Route path="revenue" element={<AdminRevenue />} />
            <Route path="popular-exercises" element={<AdminPopularExercises />} />
            <Route path="user-plans" element={<AdminUserPlans />} />
            <Route path="user-plans/:userId" element={<UserPlanDetails />} />
<Route path="user-plans/:userId/plan/:planId" element={<AdminPlanDetail />} />

            {/* ThÃªm route nÃ y náº¿u báº¡n dÃ¹ng trang AdminUsers */}
            <Route path="users" element={<AdminUsers />} />
            <Route path="support" element={<AdminSupportReports />} />
          </Route>


          {/* Catch all: redirect based on auth status */}
          <Route path="*" element={<NotFoundRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  );
}


export default App;
