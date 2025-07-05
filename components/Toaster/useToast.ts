import { useRef, useCallback } from "react";
import { toast } from "sonner";

interface ToastOptions {
  duration?: number;
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  dismissible?: boolean;
  description?: string;
}

export function useToast() {
  const lastToastRef = useRef<string | null>(null);

  const showToast = useCallback((message: string, options: ToastOptions = {}) => {
    const { duration = 2000, position = "top-center", dismissible = true, description } = options;

    // 같은 메시지가 연속으로 호출되는 것을 방지
    if (lastToastRef.current === message) {
      return;
    }

    lastToastRef.current = message;

    toast(message, {
      duration,
      position,
      dismissible,
      description,
    });

    setTimeout(() => {
      lastToastRef.current = null;
    }, 3000);
  }, []);

  const showSuccess = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast(message, { ...options, description: "성공적으로 완료되었습니다." });
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast(message, { ...options, description: "오류가 발생했습니다." });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast(message, { ...options, description: "주의가 필요합니다." });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast(message, { ...options, description: "정보를 확인해주세요." });
    },
    [showToast]
  );

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
