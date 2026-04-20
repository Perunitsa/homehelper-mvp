"use client";

import { useEffect, useMemo } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type RewardConfettiListenerProps = {
  userId: string;
};

export default function RewardConfettiListener({ userId }: RewardConfettiListenerProps) {
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const channel = supabase
      .channel(`reward-confetti-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const next = payload.new as { type?: string; title?: string; message?: string };
          if (next.type === "task") {
            toast.success(next.title ?? "Quest approved", {
              description: next.message ?? "You earned points!",
            });
            confetti({
              particleCount: 120,
              spread: 75,
              origin: { y: 0.7 },
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  return null;
}
