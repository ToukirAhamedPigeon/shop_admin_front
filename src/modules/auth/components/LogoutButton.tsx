import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTranslations } from "@/hooks/useTranslations";
import { dispatchHideLoader, dispatchLogoutUser, dispatchLogoutUserAll, dispatchLogoutUserOther, dispatchShowLoader, dispatchShowToast } from "@/lib/dispatch";

const LogoutButton: React.FC = () => {
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);

  const triggerLoaderAndNavigate = (action: () => void, slogan: string, type="") => {
    setOpen(false);
    // 1. Show loader before doing anything
    dispatchShowLoader({message: slogan});



    // 2. Run logout action
    try {
      // setTimeout(() => {
        action();
      // }, 20000000);
      // 5. Hide loader after successful logout
      dispatchHideLoader();
      if (type === "other") {
        dispatchShowToast({
            type: "success",
            message: "Logout successful on other devices."
          });
      }
    } catch (error) {
      // 6. Hide loader if logout fails
      if (type === "other") {
        dispatchHideLoader();
        dispatchShowToast({
            type: "success",
            message: "Logout successful on other devices."
          });
      }
      console.error("Logout error:", error);
      // Handle error (e.g., show an error message)
    }


    // 4. Close dialog
  };

  const handleLogout = () =>
    triggerLoaderAndNavigate(() => dispatchLogoutUser(), t("common.loggingOut", "Logging out..."));

  const handleLogoutAll = () =>
    triggerLoaderAndNavigate(() => dispatchLogoutUserAll(), t("common.loggingOutAll", "Logging out from all devices..."));

  const handleLogoutOther = () =>
    triggerLoaderAndNavigate(() => {
      dispatchLogoutUserOther();
      alert(t("common.logoutOtherSuccess", "Logged out from other devices"));
    }, t("common.loggingOutOther", "Logging out from other devices..."), "other");

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setOpen(true)}
        className="font-semibold w-full"
      >
        {t("common.logout", "Log Out")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-300">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">
              {t("common.logoutConfirm", "Confirm Logout")}
            </DialogTitle>
            <DialogDescription className="text-gray-700 dark:text-gray-300">
              {t("common.logoutChoice", "Choose how you want to log out from your account.")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-4">
            <Button variant="destructive" onClick={handleLogout} className="w-full">
              {t("common.logout", "Logout")}
            </Button>
            <Button variant="destructive" onClick={handleLogoutAll} className="w-full">
              {t("common.logoutAll", "Logout from All Devices")}
            </Button>
            <Button variant="destructive" onClick={handleLogoutOther} className="w-full">
              {t("common.logoutOther", "Logout from Other Devices")}
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="w-full text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {t("common.cancel", "Cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LogoutButton;
