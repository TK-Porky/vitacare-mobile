/**
 * UpdateService
 *
 * Two-layer update strategy:
 *
 * 1. OTA (Over-The-Air) via expo-updates
 *    Works for JS/asset changes between app-store releases.
 *    Silently fetches in the background; prompts the user to reload.
 *
 * 2. Native binary update via GitHub Releases
 *    When a new app-store / APK version is published, we surface a modal
 *    that deep-links to the store (or a direct APK download for Android).
 *    Mandatory updates cannot be dismissed.
 */

import * as ExpoUpdates from 'expo-updates';
import * as Application from 'expo-application';
import { Platform, Linking, Alert } from 'react-native';
import Constants from 'expo-constants';
import type { AppVersion, UpdateCheckResult, UpdateChannel } from '@vitacare/shared-types';

// ── Configuration ─────────────────────────────────────────────────────────

/** Change these to match your repository / hosting. */
const GITHUB_OWNER = 'your-org';
const GITHUB_REPO  = 'vitacare';

/**
 * URL that returns an AppVersion JSON object.
 * We use the GitHub Releases API, but you can swap this for your own API.
 *
 * GitHub API: https://api.github.com/repos/{owner}/{repo}/releases/latest
 * Your own:   https://api.vitacare.cm/v1/app/latest-version
 */
const VERSION_CHECK_URL = (channel: UpdateChannel) =>
  channel === 'production'
    ? `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`
    : `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases?per_page=5`;

const PLAY_STORE_URL  = 'https://play.google.com/store/apps/details?id=cm.vitacare.app';
const APP_STORE_URL   = 'https://apps.apple.com/app/vitacare/id000000000'; // update id

// ── Helpers ───────────────────────────────────────────────────────────────

/** Parse a GitHub Release into our AppVersion shape. */
function parseGithubRelease(release: Record<string, unknown>): AppVersion {
  const tag      = (release.tag_name as string).replace(/^v/, '');
  const parts    = tag.split('-');
  const version  = parts[0];
  const build    = parts[1] ? parseInt(parts[1], 10) : 1;

  // Look for a direct APK asset in the release
  const assets   = (release.assets as Array<Record<string, unknown>>) ?? [];
  const apkAsset = assets.find((a) => (a.name as string).endsWith('.apk'));

  return {
    version,
    buildNumber: build,
    releaseDate: release.published_at as string,
    releaseNotes: (release.body as string) ?? '',
    downloadUrl: apkAsset ? (apkAsset.browser_download_url as string) : undefined,
    isMandatory: !!(release.prerelease === false && (release.body as string)?.includes('[MANDATORY]')),
    minSupportedBuild: undefined,
  };
}

/** Semver comparison: returns true if `a` is newer than `b`. */
function isNewer(a: string, b: string): boolean {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return true;
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return false;
  }
  return false;
}

// ── UpdateService class ───────────────────────────────────────────────────

class UpdateService {
  private channel: UpdateChannel;

  constructor() {
    const chan = (Constants.expoConfig?.extra?.updateChannel ?? 'production') as UpdateChannel;
    this.channel = chan;
  }

  // ── 1. OTA updates (expo-updates) ────────────────────────────────────────

  /**
   * Silently check for an OTA update in the background.
   * Safe to call on app focus / every few hours.
   * Returns true if an update was downloaded and is ready to apply.
   */
  async checkForOTAUpdate(): Promise<boolean> {
    if (__DEV__) return false; // expo-updates is not active in dev mode

    try {
      const result = await ExpoUpdates.checkForUpdateAsync();
      if (!result.isAvailable) return false;

      await ExpoUpdates.fetchUpdateAsync();
      return true;
    } catch (error) {
      console.warn('[UpdateService] OTA check failed:', error);
      return false;
    }
  }

  /**
   * Apply a previously-fetched OTA update.
   * Calling this will restart the app JS runtime.
   */
  async applyOTAUpdate(): Promise<void> {
    try {
      await ExpoUpdates.reloadAsync();
    } catch (error) {
      console.warn('[UpdateService] OTA apply failed:', error);
    }
  }

  /**
   * Full OTA flow: check → fetch → show alert → reload.
   * Call this on app foreground or a background task.
   */
  async runOTAFlow(): Promise<void> {
    const hasUpdate = await this.checkForOTAUpdate();
    if (!hasUpdate) return;

    Alert.alert(
      'Mise à jour disponible',
      'Une nouvelle version de VitaCare est prête. Voulez-vous l\'installer maintenant ?',
      [
        { text: 'Plus tard', style: 'cancel' },
        {
          text: 'Installer',
          onPress: () => this.applyOTAUpdate(),
        },
      ],
    );
  }

  // ── 2. Native binary update (GitHub Releases) ────────────────────────────

  /** Fetch the latest release info from GitHub / your API. */
  async fetchLatestVersion(): Promise<AppVersion | null> {
    try {
      const response = await fetch(VERSION_CHECK_URL(this.channel), {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!response.ok) return null;

      const data = await response.json();
      // Production channel → single latest release object
      // Other channels → array; pick the first non-draft
      const release = Array.isArray(data)
        ? data.find((r: Record<string, unknown>) => !r.draft)
        : data;

      if (!release) return null;
      return parseGithubRelease(release as Record<string, unknown>);
    } catch (error) {
      console.warn('[UpdateService] Version fetch failed:', error);
      return null;
    }
  }

  /** Compare latest release to the currently installed app version. */
  async checkForNativeUpdate(): Promise<UpdateCheckResult> {
    const currentVersion = Application.nativeApplicationVersion ?? '0.0.0';
    const currentBuild   = parseInt(Application.nativeBuildVersion ?? '0', 10);

    const latest = await this.fetchLatestVersion();

    if (!latest) {
      return { hasUpdate: false, isMandatory: false, currentVersion, currentBuild };
    }

    const hasUpdate =
      isNewer(latest.version, currentVersion) ||
      latest.buildNumber > currentBuild;

    const isMandatory =
      hasUpdate &&
      (latest.isMandatory ||
        (latest.minSupportedBuild !== undefined && currentBuild < latest.minSupportedBuild));

    return { hasUpdate, isMandatory, latestVersion: latest, currentVersion, currentBuild };
  }

  /** Open the appropriate store page (or direct APK URL on Android). */
  async openStoreOrDownload(version?: AppVersion): Promise<void> {
    let url: string;

    if (Platform.OS === 'android' && version?.downloadUrl) {
      url = version.downloadUrl;
    } else if (Platform.OS === 'android') {
      url = PLAY_STORE_URL;
    } else {
      url = APP_STORE_URL;
    }

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  }
}

export const updateService = new UpdateService();
