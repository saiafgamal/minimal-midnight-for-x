// Content-script font URLs must be resolved against the extension, not x.com.
// Readex Pro is bundled under OFL 1.1. Calibri and Convection are used only
// when already installed on the user's device; their files are not included.
const url = chrome.runtime.getURL("fonts/ReadexPro-HEXP-wght.ttf");
const face = new FontFace("Readex Pro", `url("${url}")`, {
  weight: "100 900",
  style: "normal",
  display: "swap",
});
document.fonts.add(face);
face.load().catch(() => {});
