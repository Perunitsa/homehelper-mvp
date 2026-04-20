"use client";

import { useState } from "react";
import OnboardingTour from "../_components/OnboardingTour";
import { HelpCircle } from "lucide-react";

export default function ProfileClient() {
  const [isTourOpen, setIsTourOpen] = useState(false);

  return (
    <>
      <div className="mt-6">
        <button 
          onClick={() => setIsTourOpen(true)}
          className="btn-cozy btn-cozy-secondary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <HelpCircle className="w-4 h-4" />
          Как пользоваться приложением?
        </button>
      </div>

      <OnboardingTour 
        isOpen={isTourOpen} 
        onClose={() => setIsTourOpen(false)} 
      />
    </>
  );
}
