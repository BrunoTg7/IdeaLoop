import React from 'react'
import { CheckCircle, Star, Zap, Crown } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export function PlanUpgrade() {
  const { user, updateUserPlan } = useAuth()
  const [loading, setLoading] = React.useState<string | null>(null)

  const plans = [
    {
      id: 'free',
      name: 'Grátis (Starter)',
      price: 'R$ 0,00',
      period: 'para sempre',
      icon: Star,
      color: 'gray',
      features: [
        '2 gerações por semana',
        'Acesso às funcionalidades básicas',
        'Títulos, roteiros e descrições',
        'Tags otimizadas para SEO',
        'Suporte por email'
      ],
      limitations: [
        'Sem funcionalidade de refino',
        'Limite de 2 gerações semanais'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 'R$ 50,00',
      period: '/mês',
      icon: Zap,
      color: 'blue',
      popular: true,
      features: [
        '50 gerações por mês',
        'Prioridade na fila de geração',
        'Refino de conteúdo completo',
        'Todas as funcionalidades básicas',
        'Templates personalizados',
        'Suporte prioritário'
      ],
      limitations: []
    },
    {
      id: 'unlimited',
      name: 'Ilimitado (Prime)',
      price: 'R$ 150,00',
      period: '/mês',
      icon: Crown,
      color: 'purple',
      features: [
        'Gerações ilimitadas',
        'Todas as funcionalidades',
        'Acesso antecipado a novos recursos',
        'API para integração',
        'Suporte dedicado 24/7',
        'Consultoria de conteúdo mensal'
      ],
      limitations: []
    }
  ]

  const handlePlanSelection = async (planId: string) => {
    if (!user || planId === user.plan) return
    
    setLoading(planId)
    try {
      // In a real app, you would integrate with Stripe/payment provider here
      // For demo purposes, we'll directly update the plan
      await updateUserPlan(planId as 'free' | 'pro' | 'unlimited')
      
      // Show success message
      alert(`Plano atualizado para ${planId === 'free' ? 'Grátis' : planId === 'pro' ? 'Pro' : 'Ilimitado'} com sucesso!`)
    } catch (error) {
      console.error('Error updating plan:', error)
      alert('Erro ao atualizar plano. Tente novamente.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Current Plan Status */}
      {user && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Plano Atual</h3>
              <p className="text-gray-600">Gerenciamento da sua assinatura</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {user.plan === 'free' ? 'Grátis' : user.plan === 'pro' ? 'Pro' : 'Ilimitado'}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Uso Atual:</span>
              <p className="font-medium text-gray-900">
                {user.usage_count} / {
                  user.plan === 'unlimited' ? '∞' : user.plan === 'free' ? '2' : '50'
                } gerações
              </p>
            </div>
            <div>
              <span className="text-gray-600">Próximo Reset:</span>
              <p className="font-medium text-gray-900">
                {user.plan === 'free' ? '7 dias' : '30 dias'}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <p className="font-medium text-green-600">Ativo</p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Plans */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Escolha o plano ideal para você
          </h2>
          <p className="text-xl text-gray-600">
            Escale sua criação de conteúdo conforme sua necessidade
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const IconComponent = plan.icon
            const isCurrentPlan = user?.plan === plan.id
            const isPro = plan.id === 'pro'
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-xl shadow-sm border-2 p-6 transition-all duration-200 ${
                  plan.popular
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                } ${isCurrentPlan ? 'ring-2 ring-green-200 border-green-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Mais Popular
                    </span>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Plano Atual
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
                    plan.color === 'blue' ? 'bg-blue-100' :
                    plan.color === 'purple' ? 'bg-purple-100' : 'bg-gray-100'
                  }`}>
                    <IconComponent className={`h-6 w-6 ${
                      plan.color === 'blue' ? 'text-blue-600' :
                      plan.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                    }`} />
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.limitations.map((limitation, index) => (
                    <div key={index} className="flex items-center">
                      <div className="h-5 w-5 mr-3 flex-shrink-0 flex items-center justify-center">
                        <div className="h-1 w-3 bg-gray-400 rounded"></div>
                      </div>
                      <span className="text-gray-500 text-sm">{limitation}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handlePlanSelection(plan.id)}
                  disabled={isCurrentPlan || loading === plan.id}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    isCurrentPlan
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : isPro
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {loading === plan.id ? (
                    'Atualizando...'
                  ) : isCurrentPlan ? (
                    'Plano Atual'
                  ) : plan.id === 'free' ? (
                    'Começar Grátis'
                  ) : (
                    `Escolher ${plan.name}`
                  )}
                  
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Perguntas Frequentes</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Posso cancelar a qualquer momento?</h4>
            <p className="text-gray-600 text-sm">
              Sim, você pode cancelar sua assinatura a qualquer momento. Não há contratos ou taxas de cancelamento.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Como funciona o refino de conteúdo?</h4>
            <p className="text-gray-600 text-sm">
              O refino permite que você ajuste especificamente títulos, roteiros ou descrições com instruções personalizadas,
              sem precisar gerar todo o conteúdo novamente.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">As gerações não utilizadas acumulam?</h4>
            <p className="text-gray-600 text-sm">
              Não, as gerações seguem um sistema de reset. O plano Grátis reseta semanalmente e os pagos mensalmente.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Há desconto para pagamento anual?</h4>
            <p className="text-gray-600 text-sm">
              Sim! Oferecemos 20% de desconto para pagamentos anuais. Entre em contato conosco para mais detalhes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}