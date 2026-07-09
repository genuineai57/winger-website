/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          let bgColor = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100";
          let Icon = Info;
          let iconColor = "text-sky-500";

          switch (toast.type) {
            case "success":
              bgColor = "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100";
              Icon = CheckCircle;
              iconColor = "text-emerald-500";
              break;
            case "error":
              bgColor = "bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100";
              Icon = XCircle;
              iconColor = "text-rose-500";
              break;
            case "warning":
              bgColor = "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100";
              Icon = AlertTriangle;
              iconColor = "text-amber-500";
              break;
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg pointer-events-auto ${bgColor}`}
              layout
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 text-sm font-medium pr-1">{toast.message}</div>
              <button
                onClick={() => onRemove(toast.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
