import { Loader } from "lucide-react";
import { useState } from "react";
import { AuthModal } from "./components/AuthModal";
import { Dashboard } from "./components/Dashboard";
import { LandingPage } from "./components/LandingPage";
import { useAuth } from "./hooks/useAuth";

function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const { user, loading } = useAuth();

  // Debug logs
  console.log(
    "🏠 App render - User:",
    user?.email || "none",
    "Loading:",
    loading
  );

  const handleAuthAction = (action: "login" | "signup") => {
    // Se o usuário já estiver logado, já está no dashboard
    if (user) {
      return; // Já está no dashboard, não precisa fazer nada
    }

    // Se não estiver logado, abrir modal de autenticação
    setAuthMode(action);
    setAuthModalOpen(true);
  };

  const handleSwitchAuthMode = (mode: "login" | "signup") => {
    setAuthMode(mode);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {user ? <Dashboard /> : <LandingPage onAuthAction={handleAuthAction} />}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onSwitchMode={handleSwitchAuthMode}
      />
    </>
  );
}

export default App;
