// One-tap share of a JSON payload via the native share sheet, with a download fallback.
// Returns "shared" | "cancelled" | "downloaded".
export async function shareOrDownload(filename, payload) {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });

  try {
    if (typeof navigator !== "undefined" && navigator.canShare) {
      const file = new File([blob], filename, { type: "application/json" });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "Gym with Lalu" });
          return "shared";
        } catch (e) {
          if (e && e.name === "AbortError") return "cancelled";
          // fall through to download
        }
      }
    }
  } catch {
    /* fall through */
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return "downloaded";
}
