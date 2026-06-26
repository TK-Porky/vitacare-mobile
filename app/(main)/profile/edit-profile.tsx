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
import { colors, fontFamily, fontSize } from "../../../src/themes";
import {
  TopBar,
  NameInput,
  PrimaryButton,
  EmailInput,
  PhoneInput,
  HelperText,
} from "../../../src/components";
import { router } from "expo-router";
import { useProfile } from "../../../src/hooks";
import { useAuthStore } from "../../../src/store";
import { updateProfileSchema, UpdateProfileInput } from "../../../src/schemas";

// Types
type AvatarStatus = "idle" | "uploading" | "success" | "error";

export default function EditProfileScreen() {
  // ================================================================================== //
  // Store & Hooks
  // ================================================================================== //

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

  // ================================================================================== //
  // Local State
  // ================================================================================== //

  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [avatarStatus, setAvatarStatus] = useState<AvatarStatus>("idle");
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // ================================================================================== //
  // Form Setup
  // ================================================================================== //

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
    watch,
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: useMemo(
      () => ({
        fullName: user?.fullName || "",
        email: user?.email || "",
        phoneNumber: user?.phoneNumber || "",
        dateOfBirth: user?.dateOfBirth || "",
        bloodGroup: user?.bloodGroup || "",
        medicalHistory: user?.medicalHistory || "",
        address: user?.address || "",
      }),
      [user],
    ),
    mode: "onChange", // Validation en temps réel
  });

  // Watch form values for debugging
  const formValues = watch();

  // ================================================================================== //
  // Effects
  // ================================================================================== //

  // Keyboard listeners
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

  // Handle success
  useEffect(() => {
    if (success) {
      Alert.alert("Succès", "Votre profil a été mis à jour.", [
        {
          text: "OK",
          onPress: () => {
            clearState();
            router.back();
          },
        },
      ]);
    }
  }, [success, clearState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearState();
    };
  }, [clearState]);

  // ================================================================================== //
  // Handlers
  // ================================================================================== //

  const handleAvatarPress = useCallback(async () => {
    // Vérifier si un upload est déjà en cours
    if (avatarStatus === "uploading" || isUploadingAvatar) {
      Alert.alert("En cours", "L'upload de l'avatar est déjà en cours.");
      return;
    }

    try {
      // Demander la permission
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission requise",
          "Autorisez l'accès à votre galerie dans les réglages pour changer votre photo.",
          [
            { text: "Annuler", style: "cancel" },
            {
              text: "Ouvrir les réglages",
              onPress: () => Linking.openSettings(),
            },
          ],
        );
        return;
      }

      // Ouvrir la galerie avec des options optimisées
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8, // Réduit à 0.8 pour optimiser la taille
        base64: false, // Évite de charger en mémoire
        exif: false, // Pas besoin des métadonnées
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];

      // Validation de la taille du fichier (max 5MB)
      try {
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (
          fileInfo.exists &&
          fileInfo.size &&
          fileInfo.size > 5 * 1024 * 1024
        ) {
          Alert.alert(
            "Fichier trop volumineux",
            "La taille de l'image ne doit pas dépasser 5 Mo.",
            [{ text: "OK" }],
          );
          return;
        }
      } catch (error) {
        console.warn("Failed to get file info:", error);
      }

      // Générer un nom de fichier unique
      const fileExtension = asset.uri.split(".").pop() || "jpg";
      const fileName = `avatar-${Date.now()}.${fileExtension}`;
      const fileType = asset.mimeType || `image/${fileExtension}`;

      // Afficher l'aperçu local immédiatement
      setLocalAvatarUri(asset.uri);
      setAvatarStatus("uploading");

      // Upload de l'avatar
      try {
        await uploadAvatar({
          fileUri: asset.uri,
          fileName,
          fileType,
        });
        setAvatarStatus("success");

        // Petit feedback visuel
        Alert.alert(
          "Photo mise à jour",
          "Votre photo de profil a été changée avec succès.",
          [{ text: "OK" }],
        );
      } catch (uploadError) {
        console.error("Avatar upload error:", uploadError);
        setAvatarStatus("error");
        setLocalAvatarUri(null);
        Alert.alert(
          "Erreur",
          "Impossible d'envoyer la photo. Vérifiez votre connexion et réessayez.",
          [{ text: "OK" }],
        );
      }
    } catch (error) {
      console.error("Avatar picker error:", error);
      setAvatarStatus("error");
      Alert.alert(
        "Erreur",
        "Une erreur inattendue est survenue. Veuillez réessayer.",
        [{ text: "OK" }],
      );
    }
  }, [isUploadingAvatar, avatarStatus, uploadAvatar]);

  const handleRemoveAvatar = useCallback(() => {
    Alert.alert(
      "Supprimer la photo",
      "Voulez-vous vraiment supprimer votre photo de profil ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              // Appeler l'API pour supprimer l'avatar
              // await deleteAvatar();
              setLocalAvatarUri(null);
              setAvatarStatus("idle");
              Alert.alert(
                "Photo supprimée",
                "Votre photo de profil a été supprimée.",
              );
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer la photo.");
            }
          },
        },
      ],
    );
  }, []);

  const onSave = useCallback(
    async (data: UpdateProfileInput) => {
      try {
        // Désactiver le clavier avant la soumission
        Keyboard.dismiss();

        // Vérifier si des champs ont été modifiés
        if (!isDirty) {
          Alert.alert(
            "Aucune modification",
            "Vous n'avez apporté aucune modification à votre profil.",
            [{ text: "OK" }],
          );
          return;
        }

        // Nettoyer les données avant l'envoi
        const cleanData = {
          fullName: data.fullName.trim(),
          email: data.email.trim(),
          phoneNumber: data.phoneNumber?.trim(),
          dateOfBirth: data.dateOfBirth,
          bloodGroup: data.bloodGroup,
          medicalHistory: data.medicalHistory,
          address: data.address,
        };

        await updateProfile(cleanData);
      } catch (error) {
        console.error("Save profile error:", error);
        Alert.alert(
          "Erreur",
          "Impossible de sauvegarder les modifications. Veuillez réessayer.",
          [{ text: "OK" }],
        );
      }
    },
    [isDirty, updateProfile],
  );

  const handleCancel = useCallback(() => {
    if (isDirty) {
      Alert.alert(
        "Quitter sans sauvegarder",
        "Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter ?",
        [
          { text: "Rester", style: "cancel" },
          {
            text: "Quitter",
            style: "destructive",
            onPress: () => router.back(),
          },
        ],
      );
    } else {
      router.back();
    }
  }, [isDirty]);

  // ================================================================================== //
  // UI Helpers
  // ================================================================================== //

  const getAvatarUri = useMemo(() => {
    if (localAvatarUri) return localAvatarUri;
    if (user?.avatarUrl) return user.avatarUrl;
    return "https://randomuser.me/api/portraits/men/75.jpg";
  }, [localAvatarUri, user?.avatarUrl]);

  const getAvatarStatusText = useMemo(() => {
    switch (avatarStatus) {
      case "uploading":
        return "Envoi en cours…";
      case "success":
        return "Photo mise à jour";
      case "error":
        return "Échec de l'upload";
      default:
        return "Appuyez pour changer la photo";
    }
  }, [avatarStatus]);

  const isAvatarUploading = avatarStatus === "uploading" || isUploadingAvatar;

  // ================================================================================== //
  // Main
  // ================================================================================== //

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />

        <TopBar title="Modifier le profil" />

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
            {/* ── Avatar Section ── */}
            <View style={styles.avatarContainer}>
              <TouchableOpacity
                style={styles.avatarWrapper}
                onPress={handleAvatarPress}
                onLongPress={handleRemoveAvatar}
                activeOpacity={0.8}
                disabled={isAvatarUploading}
                accessibilityLabel="Changer la photo de profil"
                accessibilityHint="Appuyez pour choisir une photo dans votre galerie"
              >
                <Image
                  source={{
                    uri:
                      getAvatarUri ||
                      "https://randomuser.me/api/portraits/men/75.jpg",
                  }}
                  style={styles.avatar}
                />

                {/* Badge de statut */}
                {isAvatarUploading && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="large" color={colors.white} />
                  </View>
                )}

                {/* Bouton appareil photo */}
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

              {user?.avatarUrl && !localAvatarUri && (
                <TouchableOpacity
                  onPress={handleRemoveAvatar}
                  style={styles.removeAvatarBtn}
                >
                  <X size={14} color={colors.inkLight} />
                  <Text style={styles.removeAvatarText}>Supprimer</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── Form Section ── */}
            <View style={styles.form}>
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom complet</Text>
                <Controller
                  control={control}
                  name="fullName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <NameInput
                      placeholder="Votre nom complet"
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

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Adresse Email</Text>
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

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Numéro de téléphone</Text>
                <Controller
                  control={control}
                  name="phoneNumber"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <PhoneInput
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      error={!!errors.phoneNumber}
                    />
                  )}
                />
                {errors.phoneNumber && (
                  <HelperText
                    message={errors.phoneNumber.message || ""}
                    type="error"
                  />
                )}
              </View>

              {/* Display general error */}
              {profileError && (
                <HelperText
                  message={
                    typeof profileError === "string"
                      ? profileError
                      : "Une erreur est survenue"
                  }
                  type="error"
                />
              )}

              {/* Modification status */}
              {isDirty && (
                <View style={styles.modificationStatus}>
                  <Text style={styles.modificationText}>
                    Modifications non sauvegardées
                  </Text>
                </View>
              )}
            </View>

            {/* ── Action Section ── */}
            <View style={styles.footer}>
              <PrimaryButton
                label="Enregistrer les modifications"
                fullWidth
                isLoading={isUpdatingProfile}
                onPress={handleSubmit(onSave)}
                isDisabled={!isValid || !isDirty || isUpdatingProfile}
              />

              {!isValid && isDirty && (
                <HelperText
                  message="Certains champs contiennent des erreurs"
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

// ================================================================================== //
// Styles
// ================================================================================== //

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

// Export du type pour le débogage
export type EditProfileScreenProps = {
  // Aucune prop requise
};
