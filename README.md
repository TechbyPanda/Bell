# Bell

**A bell for discipline.**

Bell is an Android-first time scheduler for study, work, and routines. Give each session a start and an end, then let Bell cue you when to begin, switch tasks, or stop. For example, if Polity ends at 09:45 and React starts at 09:45, one alert announces both.

## What works today

- The Today screen shows the local schedule, the active session's progress, and what comes next.
- You can add, edit, and remove sessions. Enter a start time and either an end time or a duration. Overlaps are blocked, and back-to-back sessions are allowed.
- Sessions are saved locally by date. The current interface plans the current day.
- Installed Android builds schedule start and end alerts, use a bundled wake-up-style tone, and provide a **Test alarm sound** button. The tone plays once per alert.

Built with Expo SDK 58, React Native, TypeScript, Expo Router, AsyncStorage, and Expo Notifications.

## Run locally

Use Node.js 24.3 or later in the Node 24 series and npm. Run these commands from the project root.

```sh
npm ci
npx expo start
```

| Task | Command or action |
| --- | --- |
| Open in Expo Go on Android | Keep the phone and laptop on the same Wi-Fi and scan the terminal QR code in Expo Go. |
| Connect when the local network blocks the phone | `npx expo start --go --tunnel` |
| Restart Metro and clear its cache | `npx expo start --clear` |
| Open the browser preview | `npm run web` or press `w` in the Expo terminal. |
| Open a configured Android emulator | `npm run android` or press `a` in the Expo terminal. |

Expo Go is useful for testing the UI, editing, and local storage. Its Android alerts use the standard notification sound and can arrive late. The browser preview has its own local schedule. Use Bell's APK for the bundled tone and exact-alarm testing.

## Build and install the Android APK

The EAS `preview` profile uses internal distribution and produces an APK for direct installation.

```sh
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

Open the completed EAS build link on your phone, download the APK, and install it. Launch **Bell** from its own app icon. This route needs no ADB setup. Build a new APK after changes to native dependencies, the launcher icon, permissions, or the bundled sound. [Expo APK installation guide](https://docs.expo.dev/build-reference/apk/#physical-device)

### Verify alarms on a phone

1. Create a session starting three minutes from now with a two-minute duration.
2. If Bell prompts you, allow **notifications** and **exact alarms**. Return to Bell and look for **Upcoming alarms scheduled**.
3. Tap **Test alarm sound** to test playback immediately. If the test notification appears silently, check the phone's **Alarm** volume and Bell's **Session alarm tone** category in Android notification settings.
4. Lock the phone and check for a start alert and an end alert. To verify a handoff, add a second session that starts at the first session's end and check for one combined alert.

## Development checks

```sh
npx expo lint
npx tsc --noEmit
npx expo-doctor
```

Use `npx expo install <package>` to add Expo-compatible packages. Run `npx expo install --fix` when Expo reports dependency versions that need aligning. Keep native configuration in `app.json` and config plugins.

## Project roadmap

| Phase | Scope | Milestone |
| --- | --- | --- |
| 1 · Working prototype | Today timeline, session editor, local storage, and Android start/end alerts. | The prototype is in place. Continue testing alarm delivery on physical devices. |
| 2 · Reliable alarms and alert controls | Verify locked-screen and background delivery. Add a stop action for a ringing alarm, per-session alert toggles, and a pause-until-time option for Bell's alerts. Explain notification and exact-alarm permissions in the app. | Users can tell whether alerts are enabled, silence a session, and resume alerts at a chosen time. |
| 3 · Scheduler and calendar | Plan future dates, browse a calendar, and create recurring or reusable schedules. Keep overlap checks and back-to-back handoffs. | Users can plan and review an entire week from Bell. |
| 4 · UI and focus tools | Refine the timeline and editor with clearer hierarchy, accessible controls, and useful animation. Explore an optional timed focus mode for other apps' interruptions, subject to Android permissions and with previous settings restored when the session ends. | Adding, checking, and adjusting a session feels quick on a small screen. |
| 5 · Beta and launch | Run a small Android beta, measure alarm reliability and repeat use, then prepare onboarding, support, a privacy policy, and the Play Store listing. | Ship the core scheduler after it meets the device-test checklist and beta users can set up alerts independently. |
| 6 · Business validation | Learn which planning features users return for and might pay for. Keep the basic schedule and alerts simple while evaluating optional upgrades such as advanced recurring schedules or sync. | Use beta feedback to decide whether a paid offering makes sense. |

## Project structure

| Path | Purpose |
| --- | --- |
| `src/app/` | Expo Router screens and layouts |
| `src/components/` | Session editor, time input, and animated bell mascot |
| `src/hooks/use-schedule-clock.ts` | Local clock updates for the Today screen |
| `src/utils/` | Session validation, schedule storage, and alert scheduling |
| `app.json`, `eas.json` | Expo configuration and EAS build profiles |

See [LICENSE](LICENSE).
