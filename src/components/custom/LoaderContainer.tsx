// components/custom/LoaderContainer.tsx
import { useAppSelector } from "@/hooks/useRedux";
import FullPageLoader from "./FullPageLoader";

export default function LoaderContainer() {
  const loader = useAppSelector((state) => state.loader);

  if (!loader.isVisible) return null;

  return (
    <FullPageLoader
      showLogo={loader.showLogo}
      showAppName={loader.showAppName}
      slogan={loader.slogan}
    />
  );
}
