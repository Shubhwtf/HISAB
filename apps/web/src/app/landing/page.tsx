"use client";

import React, { useState, useEffect } from "react";
import { LandingPage } from "@/components/LandingPage";
import { LoginPage } from "@/components/LoginPage";

export default function LandingPageRoute() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authInitialMode, setAuthInitialMode] = useState<"SIGN_IN" | "SIGN_UP_STEP_1">("SIGN_IN");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("hisab-theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }

    const savedSession = localStorage.getItem("hisab-auth-session");
    if (savedSession) {
      try {
        const sess = JSON.parse(savedSession);
        if (sess && sess.token) {
          setIsLoggedIn(true);
        }
      } catch {
        setIsLoggedIn(false);
      }
    }
  }, []);

  const handleToggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("hisab-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("hisab-theme", "light");
    }
  };

  const handleLoginSuccess = (session: any) => {
    localStorage.setItem("hisab-auth-session", JSON.stringify(session));
    window.location.href = "/";
  };

  if (showAuthModal) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onClose={() => setShowAuthModal(false)}
        initialMode={authInitialMode}
      />
    );
  }

  return (
    <LandingPage
      onOpenSignIn={() => {
        setAuthInitialMode("SIGN_IN");
        setShowAuthModal(true);
      }}
      onOpenSignUp={() => {
        setAuthInitialMode("SIGN_UP_STEP_1");
        setShowAuthModal(true);
      }}
      onOpenDocs={() => {
        window.location.href = "/docs";
      }}
      isDarkMode={isDarkMode}
      onToggleDarkMode={handleToggleDarkMode}
      isLoggedIn={isLoggedIn}
      onOpenDashboard={() => {
        window.location.href = "/";
      }}
    />
  );
}
