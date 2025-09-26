import { Crown, Star, Zap } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export function UsageStats() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-500">Carregando informações...</p>
        </div>
      </div>
    );
  }

  const getPlanInfo = (planId: string) => {
    switch (planId) {
      case "free":
        return {
          name: "Grátis (Starter)",
          limit: 2,
          period: "por semana",
          color: "gray",
          icon: Star,
        };
      case "pro":
        return {
          name: "Pro",
          limit: 50,
          period: "por mês",
          color: "blue",
          icon: Zap,
        };
      case "unlimited":
        return {
          name: "Ilimitado (Prime)",
          limit: "∞",
          period: "",
          color: "purple",
          icon: Crown,
        };
      default:
        return {
          name: "Desconhecido",
          limit: 0,
          period: "",
          color: "gray",
          icon: Star,
        };
    }
  };

  const planInfo = getPlanInfo(user.plan);

  // Calcular quantos dias até o próximo reset
  const getDaysUntilReset = () => {
    const resetDate = new Date(user.usage_reset_date);
    const now = new Date();
    const diffTime = resetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const daysUntilReset = getDaysUntilReset();

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl shadow-inner">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Estatísticas de Uso
          </h2>
          <p className="text-lg text-gray-600">
            Acompanhe o seu progresso e os limites do seu plano atual.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <planInfo.icon
                className={`h-8 w-8 ${
                  planInfo.color === "blue"
                    ? "text-blue-600"
                    : planInfo.color === "purple"
                    ? "text-purple-600"
                    : "text-gray-600"
                }`}
              />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {planInfo.name}
                </h3>
                <p className="text-sm text-gray-600">Plano Ativo</p>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  planInfo.color === "blue"
                    ? "bg-blue-100 text-blue-800"
                    : planInfo.color === "purple"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {planInfo.name}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* ProgressBar */}
            <div className="mb-2">
              <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                <span>Gerações utilizadas:</span>
                <span>
                  {user.usage_count} / {planInfo.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    planInfo.limit === "∞"
                      ? "bg-purple-600"
                      : user.usage_count > (planInfo.limit as number) * 0.8
                      ? "bg-red-500"
                      : "bg-blue-600"
                  }`}
                  style={{
                    width:
                      planInfo.limit === "∞"
                        ? "100%"
                        : `${Math.min(
                            (user.usage_count / (planInfo.limit as number)) *
                              100,
                            100
                          )}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Limite do Plano:</span>
                <p className="font-medium text-gray-900">
                  {planInfo.limit} gerações {planInfo.period}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Próximo Reset:</span>
                <p className="font-medium text-gray-900">
                  {daysUntilReset === 0 ? "Hoje" : `${daysUntilReset} dias`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
