"use client";

import { createContext, useContext } from "react";

const AuthLogoContext = createContext<string | null>(null);

export function AuthLogoProvider({
  logoUrl,
  children,
}: {
  logoUrl: string | null;
  children: React.ReactNode;
}) {
  return (
    <AuthLogoContext.Provider value={logoUrl}>
      {children}
    </AuthLogoContext.Provider>
  );
}

export function useAuthLogo() {
  return useContext(AuthLogoContext);
}
