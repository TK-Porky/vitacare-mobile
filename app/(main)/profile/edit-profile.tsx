import { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { colors, fontFamily, fontSize } from "@/themes";
import {
  TopBar,
  NameInput,
  PrimaryButton,
  EmailInput,
  PhoneInput,
  HelperText,
} from "@/components";
import { router } from "expo-router";
import { useProfile } from "@/hooks";
import { useAuthStore } from "@/store";
import { getUpdateProfileSchema, UpdateProfileInput } from "@/schemas";

type AvatarStatus = "idle" | "uploading" | "success" | "error";

export default function EditProfileScreen() {
  const { t } = useTranslation();

  const user = useAuthStore((s) => s.user);
  const {
    updateProfile,
    isUpdatingProfile,
    uploadAvatar,
    isUploadingAvatar,
    error: profileError,
    clearState,
    success,
  } = useProfile();

  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [avatarStatus, setAvatarStatus] = useState<AvatarStatus>("idle");
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
    watch,
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(getUpdateProfileSchema(t)),
    defaultValues: useMemo(
      () => ({
        fullName: user?.fullName || "",
        email: user?.email || "",
        dateOfBirth: user?.dateOfBirth || "",
        bloodGroup: user?.bloodGroup || "",
        medicalHistory: user?.medicalHistory || "",
        address: user?.address || "",
      }),
      [user],
    ),
    mode: "onChange",
  });

  const formValues = watch();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false),
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (success) {
      Alert.alert(t("common.success"), t("profile.editScreen.success"), [
        {
          text: t("common.ok"),
          onPress: () => {
            clearState();
            router.back();
          },
        },
      ]);
    }
  }, [success, clearState, t]);

  useEffect(() => {
    return () => {
      clearState();
    };
  }, [clearState]);

  const handleAvatarPress = useCallback(async () => {
    if (avatarStatus === "uploading" || isUploadingAvatar) {
      Alert.alert(t("common.loading"), t("profile.editScreen.avatarUploadInProgress"));
      return;
    }

    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("profile.editScreen.permissionRequired"),
          t("profile.editScreen.galleryPermissionMessage"),
          [
            { text: t("common.cancel"), style: "cancel" },
            {
              text: t("profile.editScreen.openSettings"),
              onPress: () => Linking.openSettings(),
            },
          ],
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
        exif: false,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];

      try {
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (
          fileInfo.exists &&
          fileInfo.size &&
          fileInfo.size > 5 * 1024 * 1024
        ) {
          Alert.alert(
            t("profile.editScreen.fileTooLarge"),
            t("profile.editScreen.fileTooLargeMessage"),
            [{ text: t("common.ok") }],
          );
          return;
        }
      } catch (error) {
        console.warn("Failed to get file info:", error);
      }

      const fileExtension = asset.uri.split(".").pop() || "jpg";
      const fileName = `avatar-${Date.now()}.${fileExtension}`;
      const fileType = asset.mimeType || `image/${fileExtension}`;

      setLocalAvatarUri(asset.uri);
      setAvatarStatus("uploading");

      try {
        await uploadAvatar({
          fileUri: asset.uri,
          fileName,
          fileType,
        });
        setAvatarStatus("success");

        Alert.alert(
          t("profile.editScreen.avatarUpdated"),
          t("profile.editScreen.photoUpdatedMessage"),
          [{ text: t("common.ok") }],
        );
      } catch (uploadError) {
        console.error("Avatar upload error:", uploadError);
        setAvatarStatus("error");
        setLocalAvatarUri(null);
        Alert.alert(
          t("common.error"),
          t("profile.editScreen.uploadErrorMessage"),
          [{ text: t("common.ok") }],
        );
      }
    } catch (error) {
      console.error("Avatar picker error:", error);
      setAvatarStatus("error");
      Alert.alert(
        t("common.error"),
        t("profile.editScreen.unexpectedError"),
        [{ text: t("common.ok") }],
      );
    }
  }, [isUploadingAvatar, avatarStatus, uploadAvatar, t]);

  const handleRemoveAvatar = useCallback(() => {
    Alert.alert(
      t("profile.editScreen.deletePhoto"),
      t("profile.editScreen.deletePhotoConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              setLocalAvatarUri(null);
              setAvatarStatus("idle");
              Alert.alert(
                t("profile.editScreen.photoDeleted"),
                t("profile.editScreen.photoDeletedMessage"),
              );
            } catch (error) {
              Alert.alert(t("common.error"), t("profile.editScreen.deletePhotoError"));
            }
          },
        },
      ],
    );
  }, [t]);

  const onSave = useCallback(
    async (data: UpdateProfileInput) => {
      try {
        Keyboard.dismiss();

        if (!isDirty) {
          Alert.alert(
            t("profile.editScreen.noChanges"),
            t("profile.editScreen.noChangesMessage"),
            [{ text: t("common.ok") }],
          );
          return;
        }

        const cleanData = {
          fullName: data.fullName.trim(),
          email: data.email.trim(),
          dateOfBirth: data.dateOfBirth,
          bloodGroup: data.bloodGroup,
          medicalHistory: data.medicalHistory,
          address: data.address,
        };

        await updateProfile(cleanData);
      } catch (error) {
        console.error("Save profile error:", error);
        Alert.alert(
          t("common.error"),
          t("profile.editScreen.saveErrorMessage"),
          [{ text: t("common.ok") }],
        );
      }
    },
    [isDirty, updateProfile, t],
  );

  const getAvatarUri = useMemo(() => {
    if (localAvatarUri) return localAvatarUri;
    if (user?.avatarUrl) return user.avatarUrl;
    return "https://randomuser.me/api/portraits/men/75.jpg";
  }, [localAvatarUri, user?.avatarUrl]);

  const getAvatarStatusText = useMemo(() => {
    switch (avatarStatus) {
      case "uploading":
        return t("profile.editScreen.avatarUploading");
      case "success":
        return t("profile.editScreen.avatarUpdated");
      case "error":
        return t("profile.editScreen.avatarFailed");
      default:
        return t("profile.editScreen.avatarHint");
    }
  }, [avatarStatus, t]);

  const isAvatarUploading = avatarStatus === "uploading" || isUploadingAvatar;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />

        <TopBar title={t("profile.editScreen.title")} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoid}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.avatarContainer}>
              <TouchableOpacity
                style={styles.avatarWrapper}
                onPress={handleAvatarPress}
                onLongPress={handleRemoveAvatar}
                activeOpacity={0.8}
                disabled={isAvatarUploading}
                accessibilityLabel={t("accessibility.changeAvatar")}
                accessibilityHint={t("accessibility.chooseAvatarHint")}
              >
                <Image
                  source={{
                    uri:
                      getAvatarUri ||
                      "https://randomuser.me/api/portraits/men/75.jpg",
                  }}
                  style={styles.avatar}
                />

                {isAvatarUploading && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="large" color={colors.white} />
                  </View>
                )}

                {!isAvatarUploading && (
                  <View style={styles.cameraBtn}>
                    <Camera size={18} color={colors.white} />
                  </View>
                )}
              </TouchableOpacity>

              <Text
                style={[
                  styles.avatarHint,
                  avatarStatus === "error" && styles.avatarHintError,
                  avatarStatus === "success" && styles.avatarHintSuccess,
                ]}
              >
                {getAvatarStatusText}
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t("profile.editScreen.fullName")}</Text>
                <Controller
                  control={control}
                  name="fullName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <NameInput
                      placeholder={t("profile.editScreen.fullName")}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      error={!!errors.fullName?.message}
                      autoCapitalize="words"
                    />
                  )}
                />
                {errors.fullName && (
                  <HelperText
                    message={errors.fullName.message || ""}
                    type="error"
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t("profile.editScreen.labelEmail")}</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <EmailInput
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      error={!!errors.email}
                      autoCapitalize="none"
                    />
                  )}
                />
                {errors.email && (
                  <HelperText
                    message={errors.email.message || ""}
                    type="error"
                  />
                )}
              </View>

              {profileError && (
                <HelperText
                  message={
                    typeof profileError === "string"
                      ? profileError
                      : t("errors.generic")
                  }
                  type="error"
                />
              )}

              {isDirty && (
                <View style={styles.modificationStatus}>
                  <Text style={styles.modificationText}>
                    {t("profile.editScreen.unsavedChanges")}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.footer}>
              <PrimaryButton
                label={t("profile.editScreen.save")}
                fullWidth
                isLoading={isUpdatingProfile}
                onPress={handleSubmit(onSave)}
                isDisabled={!isValid || !isDirty || isUpdatingProfile}
              />

              {!isValid && isDirty && (
                <HelperText
                  message={t("profile.editScreen.formErrors")}
                  type="error"
                />
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarWrapper: {
    position: "relative",
    width: 100,
    height: 100,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.gray50,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.white,
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatarHint: {
    marginTop: 12,
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.inkLight,
  },
  avatarHintError: {
    color: colors.error,
  },
  avatarHintSuccess: {
    color: colors.success,
  },
  removeAvatarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    padding: 8,
  },
  removeAvatarText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.inkLight,
    textDecorationLine: "underline",
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.md,
    color: colors.ink,
    marginLeft: 4,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resetText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  modificationStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: colors.warningLight || "#FFF3E0",
    borderRadius: 8,
  },
  modificationText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.warning || "#F57C00",
  },
  footer: {
    marginTop: 40,
    gap: 12,
  },
  validationHint: {
    marginTop: 4,
    textAlign: "center",
  },
});

export type EditProfileScreenProps = {};
