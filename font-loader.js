// Content-script font URLs must be resolved against the extension, not x.com.
// Each bundled family is licensed under the SIL Open Font License 1.1.
for (const [family, file] of [
  ["Noto Naskh Arabic", "NotoNaskhArabic-wght.ttf"],
  ["Noto Sans Arabic", "NotoSansArabic-wdth-wght.ttf"],
  ["Noto Kufi Arabic", "NotoKufiArabic-wght.ttf"],
]) {
  const url = chrome.runtime.getURL(`fonts/${file}`);
  const face = new FontFace(family, `url("${url}")`, {
    weight: "100 900",
    style: "normal",
    display: "swap",
  });
  document.fonts.add(face);
  face.load().catch(() => {});
}
