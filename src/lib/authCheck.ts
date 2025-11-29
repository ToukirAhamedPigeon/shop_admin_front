import { store } from "@/redux/store";
import { selectPermissions } from "@/redux/selectors/permissionSelector";

export function can(
  permissionArray: string[],
  checkType: "any" | "all" = "all"
): boolean {
  try {
    const state = store.getState();
    const userPermissions = selectPermissions(state);

    if (!userPermissions || userPermissions.length === 0) return false;

    if (checkType === "any") {
      return permissionArray.some((perm) => userPermissions.includes(perm));
    }

    return permissionArray.every((perm) => userPermissions.includes(perm));
  } catch (err) {
    console.error("Permission check failed:", err);
    return false;
  }
}
