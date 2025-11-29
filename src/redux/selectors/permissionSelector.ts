import type { RootState } from "@/redux/store";

export const selectPermissions = (state: RootState) =>
  state.auth.user?.permissions ?? [];
