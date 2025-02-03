"use client";

import Header from "@/components/Header";
import { Authenticated } from "convex/react";
import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex">
      <Authenticated>
        <h1>Sidebar</h1>
      </Authenticated>
      <div className="flex-1">
        <Header />
        <main>{children}</main>
      </div>
    </div>
  );
}
