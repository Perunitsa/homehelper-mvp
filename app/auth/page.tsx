import AuthForm from "./AuthForm";

export default function AuthPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const intent =
    typeof searchParams?.intent === "string" ? searchParams.intent : null;

  return <AuthForm intent={intent} />;
}

