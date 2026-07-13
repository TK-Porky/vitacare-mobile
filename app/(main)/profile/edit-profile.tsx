import { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera } from "lucide-react-native";
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
  ChipSelector,
  ConfirmSheet,
  DatePickerSheet,
} from "@/components";
import type { ConfirmSheetRef, DatePickerSheetRef } from "@/components";
import { router } from "expo-router";
import { useProfile } from "@/hooks";
import { useAuthStore } from "@/store";
import { getUpdateProfileSchema, UpdateProfileInput } from "@/schemas";

type AvatarStatus = "idle" | "uploading" | "success" | "error";

const GENDER_OPTIONS = [
  { labelKey: "male", value: "male" },
  { labelKey: "female", value: "female" },
];

const BLOOD_GROUP_OPTIONS = [
  { label: "A+", value: "A+" },
  { label: "A-", value: "A-" },
  { label: "B+", value: "B+" },
  { label: "B-", value: "B-" },
  { label: "AB+", value: "AB+" },
  { label: "AB-", value: "AB-" },
  { label: "O+", value: "O+" },
  { label: "O-", value: "O-" },
];

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
  const [profileLoaded, setProfileLoaded] = useState(false);

  const confirmSheetRef = useRef<ConfirmSheetRef>(null);
  const datePickerSheetRef = useRef<DatePickerSheetRef>(null);
  const [dateFieldTarget, setDateFieldTarget] = useState<string>("");

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
    watch,
    setValue,
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(getUpdateProfileSchema(t)),
    defaultValues: useMemo(
      () => ({
        fullName: user?.fullName || "",
        email: user?.email || "",
        phoneNumber: user?.phoneNumber || "",
        gender: user?.gender || "",
        dateOfBirth: user?.dateOfBirth || "",
        bloodGroup: user?.bloodGroup || "",
        medicalHistory: user?.medicalHistory || "",
        address: user?.address || "",
        emergencyName: user?.emergencyName || "",
        emergencyPhone: user?.emergencyPhone || "",
      }),
      [user],
    ),
    mode: "onChange",
  });

  const formValues = watch();

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => setProfileLoaded(true), 300);
      return () => clearTimeout(timer);
    }
  }, [user]);

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
    const onBackPress = () => {
      if (isDirty) {
        confirmSheetRef.current?.open();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [isDirty]);

  const handleDiscardBack = useCallback(() => {
    reset();
    clearState();
    router.back();
  }, [reset, clearState]);

  useEffect(() => {
    return () => clearState();
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
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      try {
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (fileInfo.exists && fileInfo.size && fileInfo.size > 5 * 1024 * 1024) {
          Alert.alert(
            t("profile.editScreen.fileTooLarge"),
            t("profile.editScreen.fileTooLargeMessage"),
            [{ text: t("common.ok") }],
          );
          return;
        }
      } catch (_) { /* file info not critical */ }
      const fileExtension = asset.uri.split(".").pop() || "jpg";
      const fileName = `avatar-${Date.now()}.${fileExtension}`;
      const fileType = asset.mimeType || `image/${fileExtension}`;
      setLocalAvatarUri(asset.uri);
      setAvatarStatus("uploading");
      try {
        await uploadAvatar({ fileUri: asset.uri, fileName, fileType });
        setAvatarStatus("success");
        Alert.alert(t("profile.editScreen.avatarUpdated"), t("profile.editScreen.photoUpdatedMessage"), [{ text: t("common.ok") }]);
      } catch {
        setAvatarStatus("error");
        setLocalAvatarUri(null);
        Alert.alert(t("common.error"), t("profile.editScreen.uploadErrorMessage"), [{ text: t("common.ok") }]);
      }
    } catch {
      setAvatarStatus("error");
      Alert.alert(t("common.error"), t("profile.editScreen.unexpectedError"), [{ text: t("common.ok") }]);
    }
  }, [isUploadingAvatar, avatarStatus, uploadAvatar, t]);

  const handleRemoveAvatar = useCallback(() => {
    Alert.alert(t("profile.editScreen.deletePhoto"), t("profile.editScreen.deletePhotoConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          setLocalAvatarUri(null);
          setAvatarStatus("idle");
          Alert.alert(t("profile.editScreen.photoDeleted"), t("profile.editScreen.photoDeletedMessage"));
        },
      },
    ]);
  }, [t]);

  const onSave = useCallback(
    async (data: UpdateProfileInput) => {
      try {
        Keyboard.dismiss();
        if (!isDirty) {
          Alert.alert(t("profile.editScreen.noChanges"), t("profile.editScreen.noChangesMessage"), [{ text: t("common.ok") }]);
          return;
        }
        const cleanData = {
          fullName: data.fullName.trim(),
          email: data.email.trim(),
          phoneNumber: data.phoneNumber?.trim() || undefined,
          gender: data.gender || undefined,
          dateOfBirth: data.dateOfBirth || undefined,
          bloodGroup: data.bloodGroup || undefined,
          medicalHistory: data.medicalHistory || undefined,
          address: data.address || undefined,
          emergencyName: data.emergencyName?.trim() || undefined,
          emergencyPhone: data.emergencyPhone?.trim() || undefined,
        };
        await updateProfile(cleanData);
      } catch {
        Alert.alert(t("common.error"), t("profile.editScreen.saveErrorMessage"), [{ text: t("common.ok") }]);
      }
    },
    [isDirty, updateProfile, t],
  );

  const getAvatarUri = useMemo(() => {
    if (localAvatarUri) return localAvatarUri;
    if (user?.avatarUrl) return user.avatarUrl;
    return undefined;
  }, [localAvatarUri, user?.avatarUrl]);

  const getAvatarStatusText = useMemo(() => {
    switch (avatarStatus) {
      case "uploading": return t("profile.editScreen.avatarUploading");
      case "success": return t("profile.editScreen.avatarUpdated");
      case "error": return t("profile.editScreen.avatarFailed");
      default: return t("profile.editScreen.avatarHint");
    }
  }, [avatarStatus, t]);

  const isAvatarUploading = avatarStatus === "uploading" || isUploadingAvatar;

  const handleDatePick = useCallback(
    (field: string) => {
      setDateFieldTarget(field);
      datePickerSheetRef.current?.open();
    },
    [],
  );

  const handleDateChange = useCallback(
    (dateString: string) => {
      setValue(dateFieldTarget as any, dateString, { shouldDirty: true });
    },
    [setValue, dateFieldTarget],
  );

  if (!profileLoaded) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <TopBar title={t("profile.editScreen.title")} />
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <View style={styles.skeletonLabel} />
              <View style={styles.skeletonField} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

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
                {getAvatarUri ? (
                  <Image source={{ uri: getAvatarUri }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Camera size={32} color={colors.inkLight} />
                  </View>
                )}
                {isAvatarUploading && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="large" color={colors.white} />
                  </View>
                )}
                {!isAvatarUploading && getAvatarUri && (
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

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("profile.editScreen.sectionPersonal")}</Text>
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
                    <HelperText message={errors.fullName.message || ""} type="error" />
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
                    <HelperText message={errors.email.message || ""} type="error" />
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t("profile.editScreen.phone")}</Text>
                  <Controller
                    control={control}
                    name="phoneNumber"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <PhoneInput
                        value={value || ""}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        error={!!errors.phoneNumber}
                      />
                    )}
                  />
                  {errors.phoneNumber && (
                    <HelperText message={errors.phoneNumber.message || ""} type="error" />
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t("profile.editScreen.gender")}</Text>
                  <Controller
                    control={control}
                    name="gender"
                    render={({ field: { onChange, value } }) => (
                      <ChipSelector
                        options={GENDER_OPTIONS.map((o) => ({
                          label: t(`profile.gender.${o.labelKey}`),
                          value: o.value,
                        }))}
                        value={value || ""}
                        onChange={onChange}
                      />
                    )}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t("profile.editScreen.dob")}</Text>
                  <TouchableOpacity
                    style={styles.dateField}
                    onPress={() => handleDatePick("dateOfBirth")}
                  >
                    <Text
                      style={[
                        styles.dateText,
                        !formValues.dateOfBirth && styles.datePlaceholder,
                      ]}
                    >
                      {formValues.dateOfBirth || t("profile.editScreen.dob")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("profile.editScreen.sectionMedical")}</Text>
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t("profile.editScreen.bloodGroup")}</Text>
                  <Controller
                    control={control}
                    name="bloodGroup"
                    render={({ field: { onChange, value } }) => (
                      <ChipSelector
                        options={BLOOD_GROUP_OPTIONS}
                        value={value || ""}
                        onChange={onChange}
                      />
                    )}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t("profile.editScreen.medicalHistory")}</Text>
                  <Controller
                    control={control}
                    name="medicalHistory"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <NameInput
                        placeholder={t("profile.editScreen.medicalHistory")}
                        value={value || ""}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        error={!!errors.medicalHistory?.message}
                        autoCapitalize="sentences"
                        multiline
                      />
                    )}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t("profile.editScreen.address")}</Text>
                  <Controller
                    control={control}
                    name="address"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <NameInput
                        placeholder={t("profile.editScreen.address")}
                        value={value || ""}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        error={!!errors.address?.message}
                        autoCapitalize="sentences"
                      />
                    )}
                  />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("profile.editScreen.sectionEmergency")}</Text>
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t("profile.editScreen.emergencyName")}</Text>
                  <Controller
                    control={control}
                    name="emergencyName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <NameInput
                        placeholder={t("profile.editScreen.emergencyNamePlaceholder")}
                        value={value || ""}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        autoCapitalize="words"
                      />
                    )}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t("profile.editScreen.emergencyPhone")}</Text>
                  <Controller
                    control={control}
                    name="emergencyPhone"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <PhoneInput
                        value={value || ""}
                        onBlur={onBlur}
                        onChangeText={onChange}
                      />
                    )}
                  />
                </View>
              </View>
            </View>

            {profileError && (
              <HelperText
                message={typeof profileError === "string" ? profileError : t("errors.generic")}
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

            <View style={styles.footer}>
              <PrimaryButton
                label={t("profile.editScreen.save")}
                fullWidth
                isLoading={isUpdatingProfile}
                onPress={handleSubmit(onSave)}
                isDisabled={!isValid || !isDirty || isUpdatingProfile}
              />
              {!isValid && isDirty && (
                <HelperText message={t("profile.editScreen.formErrors")} type="error" />
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <ConfirmSheet
          ref={confirmSheetRef}
          title={t("profile.editScreen.discardTitle")}
          message={t("profile.editScreen.discardMessage")}
          confirmLabel={t("profile.editScreen.discardConfirm")}
          cancelLabel={t("profile.editScreen.keepEditing")}
          onConfirm={handleDiscardBack}
        />

        <DatePickerSheet
          ref={datePickerSheetRef}
          value={(formValues as any)[dateFieldTarget] || ""}
          onChange={handleDateChange}
        />
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
  skeletonContainer: {
    padding: 20,
    gap: 24,
    marginTop: 20,
  },
  skeletonRow: {
    gap: 8,
  },
  skeletonLabel: {
    width: "40%",
    height: 14,
    borderRadius: 6,
    backgroundColor: "#EAE8EA",
  },
  skeletonField: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EAE8EA",
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
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
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
  avatarHintError: { color: colors.error },
  avatarHintSuccess: { color: colors.success },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.md,
    color: colors.ink,
    marginBottom: 16,
    paddingLeft: 4,
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
  dateField: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  dateText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  datePlaceholder: {
    color: colors.inkLight,
  },
  modificationStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    marginTop: 8,
  },
  modificationText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: "#F57C00",
  },
  footer: {
    marginTop: 40,
    gap: 12,
  },
});
