export function isDarkTheme() {
  let systemInfo = wx.getSystemInfoSync();
  return systemInfo.theme === "dark"
}