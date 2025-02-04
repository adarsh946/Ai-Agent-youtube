"use client";

import Header from "@/components/Header";
import SideBar from "@/components/SideBar";
import { NavigationProvider } from "@/lib/NavigationProvider";
import { Authenticated } from "convex/react";
import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavigationProvider>
      <div className="h-screen flex">
        <Authenticated>
          <SideBar />
        </Authenticated>
        <div className="flex-1">
          <Header />
          <main>{children}</main>
        </div>
      </div>
    </NavigationProvider>
  );
}
