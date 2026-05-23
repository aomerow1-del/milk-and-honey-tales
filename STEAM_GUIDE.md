# Steam Upload Readiness & Accessibility Guide

If you intend to distribute "Milk & Honey Tales" on Steam, there are several business, technical, and accessibility requirements you are currently missing.

## 1. Technical SDK Integration (Steamworks)
Because this game is written in Vanilla TypeScript running in a browser environment (HTML5 Canvas), you cannot upload raw HTML/JS to Steam.
*   **Missing Component:** You need a wrapper like **Electron** or **NW.js** to package your web app into a standalone desktop executable (.exe / .app / .AppImage).
*   **Steamworks API:** To support Steam features (Achievements, Cloud Saves, Leaderboards), you will need a bridge library like `greenworks` (if using NW.js) or a custom Node-API module for Electron to talk to the native C++ Steamworks SDK.

## 2. Privacy & Legal (Supabase)
*   **Privacy Policy:** Because you are using Supabase to save player states to a remote cloud server, you are collecting user data. Steam requires a link to a formal Privacy Policy on your store page explaining what data is collected, how it is used, and how players can request deletion (GDPR/CCPA compliance).
*   **Authentication:** Currently, the game relies on basic anonymous/local storage IDs to interact with Supabase. For Steam, you should tie the save data to the player's unique `SteamID64` to prevent cross-account contamination.

## 3. Accessibility (A11y)
Steam curators and players value accessible games. Currently, your HTML5 Canvas implementation is essentially a "black box" to screen readers.
*   **Visual Accessibility:**
    *   Add a settings menu to toggle the *Day/Night cycle* and *Sandstorm particles*, as flashing/moving overlays can cause motion sickness or visual fatigue.
    *   Add an option for "High Contrast Text" or larger font sizes for the dialogue boxes.
*   **Audio Accessibility:**
    *   You need separate volume sliders for BGM (Background Music) and SFX (Sound Effects). Currently, our `AudioManager` hardcodes the gain (volume) values.
*   **Control Accessibility:**
    *   The game currently hardcodes movement to Arrow Keys/WASD and interaction to Space/Enter. You should implement a "Key Rebinding" menu so players can remap controls to their preference, including basic Controller/Gamepad Support (using the HTML5 Gamepad API).

## 4. Steam Store Assets
You will need a specific set of graphical assets to publish:
*   Capsule Images (Header, Small, Main, Library).
*   A gameplay trailer (min 1).
*   At least 5 screenshots demonstrating gameplay.
