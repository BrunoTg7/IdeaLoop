import { useState } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AuthModal } from "./components/AuthModal";
import { Dashboard } from "./components/Dashboard";
import { LandingPage } from "./components/LandingPage";
import LoadingPage from "./components/LoadingPage";
import { PlanUpgrade } from "./components/PlanUpgrade";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [showLoading, setShowLoading] = useState(false);

  const handleAuthAction = (action: "login" | "signup") => {
    setAuthMode(action);
    setAuthModalOpen(true);
  };

  const handleSwitchAuthMode = (mode: "login" | "signup") => {
    setAuthMode(mode);
  };

  // Novo: callback para AuthModal
  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
    setShowLoading(true);
    // Aguarda 1.5s antes de navegar (simula carregamento real)
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1500);
  };

  return (
    <Router>
      <Routes>
        {/* Rota pública - Landing Page */}
        <Route
          path="/"
          element={<LandingPage onAuthAction={handleAuthAction} />}
        />

        {/* Rotas protegidas - requerem autenticação */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/plans"
          element={
            <ProtectedRoute>
              <PlanUpgrade />
            </ProtectedRoute>
          }
        />
      </Routes>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onSwitchMode={handleSwitchAuthMode}
        onAuthSuccess={handleAuthSuccess}
      />
      {showLoading && <LoadingPage />}
    </Router>
  );
}

export default App;
