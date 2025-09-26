import { useState } from "react";
import { ContentGenerator } from "./ContentGenerator";
import { Layout } from "./Layout";
import { PlanUpgrade } from "./PlanUpgrade";
import { ProfileArea } from "./ProfileArea";
import { UsageStats } from "./UsageStats";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<
    "generate" | "usage" | "billing" | "profile"
  >("generate");

  return (
    <Layout showHeader>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Crie conteúdo incrível para seus vídeos com IA
          </p>
        </div>

        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "generate", label: "Gerar Conteúdo" },
              { id: "usage", label: "Uso & Estatísticas" },
              { id: "billing", label: "Planos & Upgrade" },
              { id: "profile", label: "Perfil" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(
                    tab.id as "generate" | "usage" | "billing" | "profile"
                  )
                }
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === "generate" && <ContentGenerator />}
        {activeTab === "usage" && <UsageStats />}
        {activeTab === "billing" && <PlanUpgrade />}
        {activeTab === "profile" && <ProfileArea />}
      </div>
    </Layout>
  );
}
