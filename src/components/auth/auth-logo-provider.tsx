"use client";

import { createContext, useContext } from "react";
import type { CompanyLogos } from "@/actions/settings";

const AuthLogoContext = createContext<CompanyLogos>({ light: null, dark: null });

export function AuthLogoProvider({
  logos,
  children,
}: {
  logos: CompanyLogos;
  children: React.ReactNode;
}) {
  return (
    <AuthLogoContext.Provider value={logos}>
      {children}
    </AuthLogoContext.Provider>
  );
}

export function useAuthLogos(): CompanyLogos {
  return useContext(AuthLogoContext);
}
