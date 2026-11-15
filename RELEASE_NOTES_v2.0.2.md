# Aura Launcher Legacy v2.0.2 — Development Build

## Essential feature update
- **Improved Dashboard:** recently played clients, last-played timestamps, and quick launch.
- **Game Profiles:** per-client profile name, RAM allocation, Java executable, game directory, and JVM arguments.
- **Download Manager improvements:** clearer download progress with speed/ETA when available, plus a retry/install action.
- **Advanced Java Manager:** detect the system Java runtime and report its path/version, or browse to a custom executable.

## Notes
- Profile data is stored locally in the launcher's renderer storage.
- Pause/resume is not advertised because the current download implementation does not expose safe pause/resume controls.
- This is a development package. It requires runtime testing on Windows, including client installation, Java detection, profile-specific launches, and the installer/updater.
