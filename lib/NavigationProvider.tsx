"use client";

import { createContext, useState } from "react";

interface NavigationProviderType {
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (open: boolean) => void;
  closeMobileNav: () => void;
}

export const NavigationCreateContext = createContext<NavigationProviderType>({
  isMobileNavOpen: false,
  setIsMobileNavOpen: () => {},
  closeMobileNav: () => {},
});

export function NavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const closeMobileNav = () => setIsMobileNavOpen(false);
  return (
    <NavigationCreateContext
      value={{ isMobileNavOpen, setIsMobileNavOpen, closeMobileNav }}
    >
      <div>{children}</div>;
    </NavigationCreateContext>
  );
}
