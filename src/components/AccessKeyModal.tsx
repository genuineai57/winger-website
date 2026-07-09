/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { KeyRound, Lock, User, ShieldAlert, X, Eye, EyeOff, Loader2 } from "lucide-react";

interface AccessKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, user: { username: string; displayName: string; role: string }) => void;
  addToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
}

export function AccessKeyModal({ isOpen, onClose, onLoginSuccess, addToast }: AccessKeyModalProps) {
  const [step, setStep] = useState<2 | 3>(2); // Step 2: Access Key, Step 3: Login Credentials
  const [accessKey, setAccessKey] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [step1Token, setStep1Token] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleAccessKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey.trim()) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/verify-access-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessKey: accessKey.trim() })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStep1Token(data.step1Token);
        setStep(3);
        addToast("Security Layer 1 Authorized. Enter login details.", "success");
      } else {
        // Enforce generic message for failed access keys
        const err = data.error || "Access Denied";
        setErrorMessage(err);
        addToast(err, "error");
      }
    } catch (err) {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          step1Token // Pass token from step 1
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        addToast(`Welcome back, ${data.user.displayName}!`, "success");
        onLoginSuccess(data.token, data.user);
        resetForm();
        onClose();
      } else {
        setErrorMessage(data.error || "Invalid username or password.");
        addToast(data.error || "Invalid login credentials.", "error");
      }
    } catch (err) {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep(2);
    setAccessKey("");
    setUsername("");
    setPassword("");
    setStep1Token("");
    setErrorMessage("");
    setShowPassword(false);
  };

  const handleCloseModal = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          onClick={handleCloseModal}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl max-w-md w-full p-6 overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
                  System Authentication
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Step {step} of 3: Secure Administrator Portal
                </p>
              </div>
            </div>
            <button
              onClick={handleCloseModal}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Locked Out Alert */}
          {errorMessage && errorMessage.includes("Restricted") && (
            <div className="flex gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-800 dark:text-rose-200 text-xs mb-4">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div>{errorMessage}</div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 2 ? (
              /* Layer 2: Access Key */
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                onSubmit={handleAccessKeySubmit}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="accessKey" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Enter Hidden Access Key
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <input
                      id="accessKey"
                      type="password"
                      value={accessKey}
                      onChange={(e) => setAccessKey(e.target.value)}
                      placeholder="••••••••••••"
                      disabled={isLoading || (errorMessage && errorMessage.includes("Restricted"))}
                      className="w-full pl-11 pr-4 py-3 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60 transition-all font-mono"
                    />
                  </div>
                  {errorMessage && !errorMessage.includes("Restricted") && (
                    <p className="text-xs text-rose-500 mt-2 font-medium">{errorMessage}</p>
                  )}
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                    This authentication request is strictly monitored. Multiple failed attempts will result in an IP lockout.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !accessKey.trim() || (errorMessage && errorMessage.includes("Restricted"))}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Authorizing...
                    </>
                  ) : (
                    "Verify Key"
                  )}
                </button>
              </motion.form>
            ) : (
              /* Layer 3: Username & Password */
              <motion.form
                key="step3"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                onSubmit={handleLoginSubmit}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="username" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Admin Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin"
                      disabled={isLoading}
                      required
                      className="w-full pl-11 pr-4 py-3 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="adminPassword" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Security Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <input
                      id="adminPassword"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                      required
                      className="w-full pl-11 pr-11 py-3 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errorMessage && !errorMessage.includes("Restricted") && (
                    <p className="text-xs text-rose-500 mt-2 font-medium">{errorMessage}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !username.trim() || !password.trim()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying Account...
                    </>
                  ) : (
                    "Authorize Credentials"
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
