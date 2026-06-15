// Light/dark theme application. Dark is default; light adds .theme-light to <html>.
export const applyTheme = (theme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "light") root.classList.add("theme-light");
  else root.classList.remove("theme-light");
};
