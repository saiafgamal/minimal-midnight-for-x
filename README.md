# Minimal Midnight For X (twitter)

An independent, open-source Chrome extension that gives x.com a quiet Midnight palette and optional layout controls. Choose between Noto Naskh Arabic, Noto Sans Arabic, and Noto Kufi Arabic in the extension popup. The fonts are bundled, so switching fonts makes no request to Google Fonts.

This project is not affiliated with X, Google, or Typefully. It includes no proprietary font files.

## Install from source

1. Open `chrome://extensions` in Chrome and enable **Developer mode**.
2. Click **Load unpacked** and select this repository's root folder.
3. Reload any open x.com tabs.
4. Open the extension popup to choose a font and adjust the layout.

The extension runs only on `x.com` and `www.x.com`. Its only requested permission is `storage`, used for preferences. It does not collect posts, messages, account details, or browsing history for the developer. See [Privacy](PRIVACY.md) for the exact storage behavior.

If you also use another X styling extension, disable one of them to avoid conflicting styles.

## Fonts and licenses

The 3 Noto families are from the [Google Fonts repository](https://github.com/google/fonts), each under the SIL Open Font License 1.1. Their exact license texts are in [`licenses/`](licenses). The layout work includes adaptations of [Minimal Theme for Twitter / X](https://github.com/typefully/minimal-twitter), which is MIT licensed; its notice is preserved in [`licenses/Minimal-Theme-MIT.txt`](licenses/Minimal-Theme-MIT.txt). See [third-party notices](THIRD_PARTY_NOTICES.md).

The original code in this repository is licensed under MIT. Third-party fonts and code retain their own licenses.

## Development

This extension uses Manifest V3 and has no build step. After editing source files, click **Reload** on its card at `chrome://extensions`, then reload x.com. Keep `manifest.json` at the root of the extension folder.

X changes its markup frequently. If a selector stops matching, open an issue with the affected page and a screenshot that contains no private information.
