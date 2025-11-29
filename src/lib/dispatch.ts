import { store } from "@/redux/store";
import type { Toast } from "@/redux/slices/toastSlice";
import { showToast } from "@/redux/slices/toastSlice";
import { showLoader, hideLoader } from "@/redux/slices/loaderSlice";
import type { ShowLoaderPayload } from "@/redux/slices/loaderSlice";
import {
  fetchCsrfToken,
  loginUser, 
  logoutUser,
  logoutUserAll,
  logoutUserOther,
} from "@/redux/slices/authSlice";
import type { LoginUserPayload } from "@/redux/slices/authSlice";
import { setTableColumnSettings } from '@/redux/slices/tableColumnSettingsSlice'
import type { ColumnsPayload } from '@/redux/slices/tableColumnSettingsSlice'



export const dispatchShowToast = (toast: Toast) => store.dispatch(showToast(toast))
;
export const dispatchShowLoader = (payload?: ShowLoaderPayload) => store.dispatch(showLoader(payload));
export const dispatchHideLoader = () => store.dispatch(hideLoader());

//Auth
export const dispatchFetchCsrfToken = () => store.dispatch(fetchCsrfToken());
export const dispatchLoginUser = (payload: LoginUserPayload) => store.dispatch(loginUser(payload));
export const dispatchLogoutUser = () => store.dispatch(logoutUser());

export const dispatchLogoutUserAll = () => store.dispatch(logoutUserAll());

export const dispatchLogoutUserOther = () => store.dispatch(logoutUserOther());
export const dispatchSetTableColumnSettings=(payload:ColumnsPayload)=>store.dispatch(setTableColumnSettings(payload));
