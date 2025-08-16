import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../redux/slices/authSlice";
import type { RootState, AppDispatch } from "../redux/store"; // <- type-only import
import AuthLayout from "../layouts/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  const { register, handleSubmit } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    dispatch(loginUser(data));
  };

  return (
    <AuthLayout>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-lg shadow-md w-96"
      >
        <h2 className="text-xl font-bold mb-4">Login</h2>
        <Input {...register("email")} placeholder="Email" className="mb-4" />
        <Input {...register("password")} type="password" placeholder="Password" className="mb-4" />
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <Button variant="success" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </AuthLayout>
  );
}
