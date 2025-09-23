"use client";

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
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

import { logoutUser, logoutUserAll, logoutUserOther } from "@/redux/slices/authSlice";
import type { AppDispatch } from "@/redux/store";

const LogoutButton: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login", { replace: true });
    setOpen(false);
  };

  const handleLogoutAll = () => {
    dispatch(logoutUserAll());
    navigate("/login", { replace: true });
    setOpen(false);
  };

  const handleLogoutOther = () => {
    dispatch(logoutUserOther());
    alert(t("common.logoutOtherSuccess", "Logged out from other devices"));
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setOpen(true)}
        className="font-semibold w-full md:w-auto"
      >
        {t("common.logout", "Log Out")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">
              {t("common.logoutConfirm", "Confirm Logout")}
            </DialogTitle>
            <DialogDescription className="text-gray-700 dark:text-gray-300">
              {t(
                "common.logoutChoice",
                "Choose how you want to log out from your account."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-4">
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full"
            >
              {t("common.logout", "Logout")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogoutAll}
              className="w-full"
            >
              {t("common.logoutAll", "Logout from All Devices")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogoutOther}
              className="w-full"
            >
              {t("common.logoutOther", "Logout from Other Devices")}
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="w-full text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
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
