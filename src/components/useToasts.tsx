export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

// Hook stub que evita erro caso provider completo não esteja montado ainda.
export const useToasts = () => {
  return {
    push: () => {},
    remove: () => {},
    toasts: [] as Toast[],
  };
};
