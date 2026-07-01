import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Entrar · CPPEM Marketing Hub",
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <LoginForm />
    </div>
  );
}
