import { Capacitor } from "@capacitor/core";

export function useCapacitor() {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  return {
    isNative,
    isAndroid: platform === "android",
    isIOS: platform === "ios",
    isWeb: platform === "web",
    platform,
  };
}
