import { useContext } from 'react';
import { ToastContext, ToastContextValue } from './ToastProvider';

export const useToasts = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) return { push: () => {}, remove: () => {}, toasts: [] } as ToastContextValue;
  return ctx;
};
