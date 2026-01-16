"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/store";
import { ProfileSettings } from "@/components/dashboard/ProfileSettings";
import { AchievementSection } from "@/components/dashboard/AchievementSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCircle, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfilePage() {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="container mx-auto max-w-5xl p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-fluid-h1 font-black text-slate-900 tracking-tight">My Profile</h1>
        <p className="text-fluid-body text-slate-500 font-medium">Manage your identity and view your achievements.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-transparent border-b rounded-none h-auto w-full flex p-0">
          <TabsTrigger 
            value="profile" 
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-slate-500 data-[state=active]:text-blue-600 transition-all py-3 px-1 flex items-center justify-center gap-2"
          >
            <UserCircle className="h-4 w-4" />
            <span className="whitespace-nowrap">Profile Details</span>
          </TabsTrigger>
          <TabsTrigger 
            value="achievements" 
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-slate-500 data-[state=active]:text-blue-600 transition-all py-3 px-1 flex items-center justify-center gap-2"
          >
            <Trophy className="h-4 w-4" />
            <span className="whitespace-nowrap">Achievements</span>
          </TabsTrigger>
        </TabsList>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            {activeTab === "profile" && (
              <div className="py-2">
                <ProfileSettings />
              </div>
            )}
            {activeTab === "achievements" && (
              <div className="py-2">
                <AchievementSection user={user} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
