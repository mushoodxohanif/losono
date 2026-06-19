"use client";

import { createContext, useContext, useState } from "react";

const tabs = [
  { id: "chat", label: "Chat" },
  { id: "voice", label: "Voice" },
  { id: "deploy", label: "Deploy" },
] as const;

export type MockupTabId = (typeof tabs)[number]["id"];

type MockupContextValue = {
  activeTab: MockupTabId;
  setActiveTab: (tab: MockupTabId) => void;
};

const MockupContext = createContext<MockupContextValue | null>(null);

export function MockupProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<MockupTabId>("chat");

  return (
    <MockupContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </MockupContext.Provider>
  );
}

export function useMockup() {
  const context = useContext(MockupContext);
  if (!context) {
    throw new Error("useMockup must be used within MockupProvider");
  }
  return context;
}

export { tabs as mockupTabs };
