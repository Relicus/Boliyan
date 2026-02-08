"use client";

import BannerAd from "@/components/ads/BannerAd";

const SIDEBAR_AD_VISIBILITY_LIMIT = 3;

export default function SidebarAdDock() {
  return (
    <div
      id="sidebar-ad-dock-01"
      className="sticky top-20 self-start px-4 pb-4"
    >
      <div id="sidebar-ad-dock-list-02">
        {Array.from({ length: SIDEBAR_AD_VISIBILITY_LIMIT }).map((_, index) => {
          const slotIndex = index + 1;
          return (
            <div
              id={`sidebar-ad-slot-${slotIndex}`}
              key={`sidebar-ad-slot-${slotIndex}`}
              className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <BannerAd variant="sidebar" index={slotIndex} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
