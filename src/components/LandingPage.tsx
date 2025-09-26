import {
  ArrowRight,
  CheckCircle,
  Sparkles,
  Star,
  Target,
  Zap,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
export interface LandingPageProps {
  onAuthAction: (action: "login" | "signup") => void;
}

export function LandingPage({ onAuthAction }: LandingPageProps) {
  const { loading, checkAuth } = useAuth();

  // Redirecionamento automático desabilitado: usuário decide quando entrar/criar conta.

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                IdeaLoop
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={async () => {
                  console.log("[Landing] Entrar clicado");
                  const user = await checkAuth();
                  if (user) {
                    window.location.href = "/dashboard";
                  } else {
                    onAuthAction("login");
                  }
                }}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={() => {
                  console.log("[Landing] Começar Grátis clicado");
                  alert("Botão Começar Grátis clicado - modal deve abrir");
                  onAuthAction("signup");
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Começar Grátis
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                <span>Powered by AI</span>
              </div>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Crie conteúdo de vídeo
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                otimizado com IA
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Gere títulos irresistíveis, roteiros envolventes e descrições
              otimizadas para YouTube, TikTok e Instagram Reels. Tudo com o
              poder da inteligência artificial, otimizado para cada plataforma.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onAuthAction("signup")}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold text-lg flex items-center justify-center group"
              >
                Começar Grátis
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-lg">
                Ver Demonstração
              </button>
            </div>

            <p className="text-sm text-gray-500 mt-4">
              ✅ Sem cartão de crédito • ✅ 2 gerações grátis por semana
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Otimização inteligente para cada plataforma
            </h2>
            <p className="text-xl text-gray-600">
              Conteúdo adaptado para YouTube, TikTok e Instagram Reels
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Otimização Multiplataforma
              </h3>
              <p className="text-gray-600">
                Conteúdo adaptado para YouTube (SEO), TikTok (viral) e Instagram
                Reels (engajamento). Cada plataforma tem suas próprias regras de
                otimização.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Refino Inteligente
              </h3>
              <p className="text-gray-600">
                Não gostou do resultado? Refine especificamente o título,
                roteiro ou descrição com instruções personalizadas. Disponível
                nos planos pagos.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-200">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Exportação Completa
              </h3>
              <p className="text-gray-600">
                Exporte seu conteúdo para planilhas (CSV/Excel) para
                planejamento ou copie diretamente para suas plataformas
                favoritas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Criadores adoram o IdeaLoop
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Carlos Mendes",
                role: "Creator Multiplataforma",
                content:
                  "O IdeaLoop revolucionou meu workflow! Agora crio conteúdo otimizado para YouTube, TikTok e Instagram em minutos.",
              },
              {
                name: "Ana Silva",
                role: "YouTuber de Lifestyle",
                content:
                  "A funcionalidade de refino é incrível. Posso ajustar títulos e roteiros sem gerar tudo novamente. Economizo horas!",
              },
              {
                name: "Mariana Costa",
                role: "Educadora Digital",
                content:
                  "Meus vídeos têm muito mais engajamento desde que comecei a usar o IdeaLoop para os títulos.",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
              >
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-gray-900">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Planos para todos os criadores
            </h2>
            <p className="text-xl text-gray-600">
              Comece grátis e escale conforme sua necessidade
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-xl p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Grátis
              </h3>
              <p className="text-3xl font-bold text-gray-900 mb-4">R$ 0,00</p>
              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                <li className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />2
                  gerações por semana
                </li>
                <li className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />3
                  plataformas suportadas
                </li>
                <li className="flex items-center justify-center text-red-600">
                  <div className="h-4 w-4 mr-2 flex items-center justify-center">
                    <div className="h-1 w-3 bg-red-400 rounded"></div>
                  </div>
                  Sem refino de conteúdo
                </li>
              </ul>
              <button
                onClick={() => onAuthAction("signup")}
                className="w-full py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Começar Grátis
              </button>
            </div>

            <div className="border-2 border-blue-500 rounded-xl p-6 text-center relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Mais Popular
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pro</h3>
              <p className="text-3xl font-bold text-gray-900 mb-4">
                R$ 50,00<span className="text-sm font-normal">/mês</span>
              </p>
              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                <li className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  50 gerações por mês
                </li>
                <li className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Refino de conteúdo
                </li>
                <li className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Exportação para planilhas
                </li>
                <li className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Prioridade na fila
                </li>
              </ul>
              <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Escolher Pro
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ilimitado
              </h3>
              <p className="text-3xl font-bold text-gray-900 mb-4">
                R$ 150,00<span className="text-sm font-normal">/mês</span>
              </p>
              <ul className="text-sm text-gray-600 space-y-2 mb-6">
                <li className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Gerações ilimitadas
                </li>
                <li className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Todas as funcionalidades
                </li>
                <li className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  API para integração
                </li>
                <li className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Consultoria mensal
                </li>
                <li className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Suporte prioritário
                </li>
              </ul>
              <button className="w-full py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Escolher Ilimitado
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para dominar todas as plataformas?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Crie conteúdo otimizado para YouTube, TikTok e Instagram Reels
          </p>
          <button
            onClick={() => onAuthAction("signup")}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-lg inline-flex items-center group"
          >
            Começar Agora Gratuitamente
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center mb-8">
            <Zap className="h-8 w-8 text-blue-400" />
            <span className="ml-2 text-xl font-bold text-white">IdeaLoop</span>
          </div>
          <div className="text-center">
            <p>&copy; 2025 IdeaLoop. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
