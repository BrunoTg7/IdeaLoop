import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export function ProfileArea() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");

  if (!user) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        Faça login para ver seu perfil.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Perfil</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            {editing ? (
              <div className="flex gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-800 font-medium">
                  {user.name}
                </span>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Editar
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <p className="text-sm text-gray-800">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plano Atual
            </label>
            <p className="text-sm">
              <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                {user.plan}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Resumo do Plano
        </h2>
        <ul className="text-sm text-gray-700 space-y-2 list-disc pl-5">
          <li>Gerações usadas: {user.usage_count}</li>
          <li>
            Reset em: {new Date(user.usage_reset_date).toLocaleDateString()}
          </li>
          <li>
            Status: <span className="text-green-600 font-medium">Ativo</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
