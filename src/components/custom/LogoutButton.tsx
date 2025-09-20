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
        className="font-semibold"
      >
        {t("common.logout", "Log Out")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("common.logoutConfirm", "Confirm Logout")}</DialogTitle>
            <DialogDescription>
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
              className="w-full"
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
