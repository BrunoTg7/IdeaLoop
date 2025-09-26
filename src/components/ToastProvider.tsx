import { createContext, ReactNode, useState } from "react";
// Provider isolado para evitar warning do Fast Refresh sobre múltiplos exports ligados a hooks.

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export interface ToastContextValue {
  push: (t: Omit<Toast, "id">) => void;
  remove: (id: string) => void;
  toasts: Toast[];
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push: ToastContextValue["push"] = ({ message, type }) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => remove(id), 4000);
  };

  const remove: ToastContextValue["remove"] = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ push, remove, toasts }}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 100,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background:
                t.type === "success"
                  ? "#dcfce7"
                  : t.type === "error"
                  ? "#fee2e2"
                  : "#e0f2fe",
              color:
                t.type === "success"
                  ? "#166534"
                  : t.type === "error"
                  ? "#991b1b"
                  : "#075985",
              padding: "8px 12px",
              borderRadius: 6,
              fontSize: 13,
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              minWidth: 200,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ marginRight: 12 }}>{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                fontSize: 12,
              }}
            >
              x
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
