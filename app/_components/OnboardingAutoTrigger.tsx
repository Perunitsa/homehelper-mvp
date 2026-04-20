"use client";

import { useState, useEffect } from "react";
import OnboardingTour from "./OnboardingTour";
import { markOnboardingSeenAction } from "@/app/profile/actions";

type OnboardingAutoTriggerProps = {
  hasSeenOnboarding: boolean;
};

export default function OnboardingAutoTrigger({ hasSeenOnboarding }: OnboardingAutoTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // We only show it if the database says they haven't seen it AND it's not already open
    if (!hasSeenOnboarding) {
      setIsOpen(true);
    }
  }, [hasSeenOnboarding]);

  const handleComplete = async () => {
    await markOnboardingSeenAction();
  };

  return (
    <OnboardingTour 
      isOpen={isOpen} 
      onClose={() => setIsOpen(false)} 
      onComplete={handleComplete} 
    />
  );
}
