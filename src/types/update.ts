export interface AppVersion {
  version: string;
  buildNumber: number;
  releaseDate: string;
  releaseNotes?: string;
  downloadUrl?: string;
  isMandatory?: boolean;
  minSupportedBuild?: number;
}

export type UpdateChannel = "production" | "staging" | "development";

export interface UpdateCheckResult {
  hasUpdate: boolean;
  isMandatory: boolean;
  latestVersion?: AppVersion;
  currentVersion: string;
  currentBuild: number;
}
