"use client";

import React, { createContext, useContext, useState } from "react";
import { User } from "@/types";
import { mockUsers } from "@/lib/mock-data";

interface AuthContextType {
  user: User;
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  getUser: (id: string) => User | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize with mock data for now
  // Current user is hardcoded as 'u1' (Ahmed Ali)
  const [user] = useState<User>(mockUsers[0]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

  const login = () => setIsLoggedIn(true);
  const logout = () => setIsLoggedIn(false);

  const getUser = (id: string) => {
    return mockUsers.find(u => u.id === id);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout, getUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
