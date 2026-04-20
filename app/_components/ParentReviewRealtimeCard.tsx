"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type ParentReviewRealtimeCardProps = {
  familyId: string;
};

export default function ParentReviewRealtimeCard({ familyId }: ParentReviewRealtimeCardProps) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const reviewQuery = useQuery({
    queryKey: ["tasks-review", familyId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("family_id", familyId)
        .eq("status", "in_review");

      if (error) throw error;
      return count ?? 0;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`task-review-realtime-${familyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `family_id=eq.${familyId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["tasks-review", familyId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, queryClient, supabase]);

  const count = reviewQuery.data ?? 0;

  return (
    <Link href="/tasks" className="card-cozy p-6 border-l-4 border-gold-soft block">
      <h3 className="heading-handwritten text-2xl text-brown mb-1">Task Review Queue</h3>
      <p className="text-text-secondary text-sm">
        Waiting for approval: <strong>{count}</strong>
      </p>
      <p className="text-text-muted text-xs mt-2">Updates in realtime without refresh.</p>
    </Link>
  );
}
