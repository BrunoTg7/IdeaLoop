import { CreditCard, LogOut, User, Zap } from "lucide-react";
import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

export function Layout({ children, showHeader = false }: LayoutProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showBilling, setShowBilling] = useState(false);

  if (!showHeader) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center group focus:outline-none"
              title="Voltar para início"
            >
              <Zap className="h-8 w-8 text-blue-600 group-hover:scale-105 transition-transform" />
              <span className="ml-2 text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                IdeaLoop
              </span>
            </button>

            {user && (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">{user.name}</span>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowProfile((v) => !v)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Perfil"
                    >
                      <User className="h-5 w-5" />
                    </button>
                    {showProfile && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg p-3 text-left z-20">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 mb-3">
                          Plano: {user.plan}
                        </p>
                        <div
                          role="button"
                          onClick={() => {
                            setShowProfile(false);
                            navigate("/dashboard");
                          }}
                          className="w-full text-left text-xs px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
                        >
                          Ir para Dashboard
                        </div>
                        <div
                          role="button"
                          onClick={() => {
                            setShowProfile(false);
                            signOut();
                          }}
                          className="w-full text-left text-xs px-2 py-1 rounded hover:bg-gray-100 text-red-600 cursor-pointer"
                        >
                          Sair
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowBilling((v) => !v)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Pagamento / Upgrade"
                    >
                      <CreditCard className="h-5 w-5" />
                    </button>
                    {showBilling && (
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg p-3 text-left z-20">
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          Planos & Upgrade
                        </p>
                        <div
                          role="button"
                          onClick={() => {
                            setShowBilling(false);
                            navigate("/dashboard");
                          }}
                          className="w-full text-left text-xs px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
                        >
                          Ver Página de Planos
                        </div>
                        <div
                          role="button"
                          onClick={() => {
                            setShowBilling(false);
                            alert("Fluxo de pagamento não implementado.");
                          }}
                          className="w-full text-left text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                        >
                          Fazer Upgrade
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={signOut}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Sair"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
