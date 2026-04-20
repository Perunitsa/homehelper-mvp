"use client";

import { Suspense, useSearchParams } from "react";
import AuthForm from "./AuthForm";

function AuthFormWrapper() {
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent");
  
  return <AuthForm intent={intent} />;
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-full flex-1 flex items-center justify-center bg-cream">Загрузка...</div>}>
      <AuthFormWrapper />
    </Suspense>
  );
}
