import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom"; // React Router
import { loginUser } from "../redux/slices/authSlice";
import type { RootState, AppDispatch } from "../redux/store";
import { useTranslations } from "../hooks/useTranslations";
import AuthLayout from "../layouts/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Schema for identifier login
const loginSchema = z.object({
  identifier: z.string().min(1, "Required"),
  password: z.string().min(6),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, error, accessToken } = useSelector(
    (state: RootState) => state.auth
  );
  const { t } = useTranslations();

  const { register, handleSubmit } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (accessToken) {
      navigate("/dashboard", { replace: true }); // replace so user can't go back to login
    }
  }, [accessToken, navigate]);

  const onSubmit = async (data: LoginForm) => {
    const result = await dispatch(loginUser(data));
    // If login success, redirect
    if (result.meta.requestStatus === "fulfilled") {
      navigate("/dashboard");
    }
  };

  return (
    <AuthLayout>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-lg shadow-md w-96"
      >
        <h2 className="text-xl font-bold mb-4">{t("common.login.title","Login")}</h2>
        <Input
          {...register("identifier")}
          placeholder="Email, Username or Mobile No"
          className="mb-4"
        />
        <Input
          {...register("password")}
          type="password"
          placeholder="Password"
          className="mb-4"
        />
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <Button variant="success" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </AuthLayout>
  );
}
