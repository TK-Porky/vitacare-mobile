import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppBottomSheet, AppBottomSheetRef } from "../generics";
import { PrimaryButton } from "../buttons";
import { GrayButton } from "../buttons/GrayButton";
import { colors, fontFamily, fontSize } from "../../themes";
import { Drug } from "../../types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DrugDetailBottomSheetRef = {
  open: () => void;
  close: () => void;
};

type Props = {
  drug?: Drug | null;
  onAddToReminder?: (drug: Drug) => void;
  onClose?: () => void;
  relatedDrugs?: Drug[];
  hasReminder?: boolean;
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  "Adulte",
  "Enfant",
  "Avis",
  "Garde",
  "Generique",
  "Indication",
  "Mise en garde",
] as const;
type DrugTab = (typeof TABS)[number];

type Section = { title: string; body: string };

const TAB_CONTENT: Record<DrugTab, Section[]> = {
  Adulte: [
    {
      title: "POSOLOGIE ADULTE",
      body: "1 à 2 comprimés de 500 mg toutes les 4 à 6 heures. Ne pas dépasser 4 g (8 comprimés de 500 mg) par 24 heures. Respectez la posologie minimale efficace et la durée de traitement la plus courte possible.",
    },
    {
      title: "VOIE D'ADMINISTRATION",
      body: "Voie orale uniquement. Avaler les comprimés avec un grand verre d'eau, au moment ou en dehors des repas.",
    },
    {
      title: "DURÉE DU TRAITEMENT",
      body: "La durée ne doit pas dépasser 3 jours en cas de fièvre et 5 jours en cas de douleur sans avis médical.",
    },
  ],
  Enfant: [
    {
      title: "POSOLOGIE ENFANT",
      body: "La dose recommandée est de 15 mg/kg de poids corporel par prise, renouvelable toutes les 6 heures si nécessaire. Ne pas dépasser 60 mg/kg/jour en 4 prises.",
    },
    {
      title: "ÂGE MINIMUM",
      body: "Ce médicament est déconseillé aux enfants de moins de 3 ans sans avis médical. Consultez un médecin ou pharmacien pour les nourrissons.",
    },
  ],
  Avis: [
    {
      title: "AVIS MÉDICAL",
      body: "Médicament recommandé par l'OMS comme analgésique et antipyrétique de première intention. Efficacité prouvée dans le traitement des douleurs légères à modérées.",
    },
    {
      title: "CONTRE-INDICATIONS",
      body: "Hypersensibilité connue au paracétamol. Insuffisance hépatocellulaire sévère. Ne pas associer à d'autres médicaments contenant du paracétamol.",
    },
  ],
  Garde: [
    {
      title: "DISPONIBILITÉ",
      body: "Médicament disponible sans ordonnance dans toutes les pharmacies agréées. Accessible en pharmacies de garde 24h/24.",
    },
    {
      title: "CONSERVATION",
      body: "À conserver à une température inférieure à 25°C, à l'abri de la lumière et de l'humidité. Tenir hors de portée des enfants.",
    },
  ],
  Generique: [
    {
      title: "MÉDICAMENTS GÉNÉRIQUES",
      body: "Le paracétamol est la substance active. Des génériques sont disponibles en comprimés à 500 mg, 1000 mg et en formes sécables.",
    },
    {
      title: "ÉQUIVALENCE THÉRAPEUTIQUE",
      body: "Tous les médicaments à base de paracétamol ont la même efficacité thérapeutique à dosages équivalents. Le choix du générique est souvent motivé par des raisons économiques.",
    },
  ],
  Indication: [
    {
      title: "INDICATIONS THÉRAPEUTIQUES",
      body: "Traitement symptomatique des douleurs légères à modérées et des états fébriles : céphalées, douleurs dentaires, douleurs musculaires, douleurs arthritiques, fièvre.",
    },
    {
      title: "MÉCANISME D'ACTION",
      body: "Le paracétamol exerce son action analgésique et antipyrétique par inhibition centrale de la synthèse des prostaglandines, sans action anti-inflammatoire périphérique significative.",
    },
  ],
  "Mise en garde": [
    {
      title: "MISES EN GARDE ET PRÉCAUTIONS D'EMPLOI",
      body: "En cas de traitement par le paracétamol, éviter la consommation d'alcool. Ne pas dépasser la dose prescrite. En cas de surdosage accidentel, consulter immédiatement un médecin même en l'absence de symptômes.",
    },
    {
      title: "INTERACTIONS MÉDICAMENTEUSES",
      body: "Informer votre médecin ou pharmacien si vous prenez d'autres médicaments contenant du paracétamol afin d'éviter un surdosage. Précautions particulières avec les anticoagulants oraux de type warfarine.",
    },
  ],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Tag = ({ label }: { label: string | undefined | null }) => {
  if (!label) return null;
  return (
    <View style={styles.tag}>
      <Text style={styles.tagLabel}>{label}</Text>
    </View>
  );
};

const RelatedCard = ({ item }: { item: Drug }) => (
  <TouchableOpacity style={styles.relatedCard} activeOpacity={0.8}>
    <View style={styles.relatedImageWrap}>
      <Image
        source={{ uri: item.imageUrl || "https://via.placeholder.com/150" }}
        style={styles.relatedImage}
        resizeMode="contain"
      />
    </View>
    <View style={styles.relatedInfo}>
      <Text style={styles.relatedCategory} numberOfLines={1}>
        {item.dosageForm || "Médicament"}
      </Text>
      <Text style={styles.relatedName} numberOfLines={2}>
        {item.name}
      </Text>
      {item.referencePrice != null && (
        <Text style={styles.relatedPrice}>{item.referencePrice} FCFA</Text>
      )}
    </View>
  </TouchableOpacity>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const DrugDetailBottomSheet = forwardRef<
  DrugDetailBottomSheetRef,
  Props
>(
  (
    { drug, onAddToReminder, onClose, relatedDrugs = [], hasReminder = false },
    ref,
  ) => {
    const sheetRef = useRef<AppBottomSheetRef>(null);
    const [activeTab, setActiveTab] = useState<DrugTab>("Adulte");

    useImperativeHandle(ref, () => ({
      open: () => sheetRef.current?.open(),
      close: () => sheetRef.current?.close(),
    }));

    if (!drug) return null;

    const tags = [drug.dosageForm ?? "Médicament", ...(drug.requiresPrescription ? ["Sur ordonnance"] : ["Sans ordonnance"])];

    return (
      <AppBottomSheet
        ref={sheetRef}
        onClose={onClose}
        scrollable={false}
        containerStyle={styles.sheetContainer}
      >
        {/* ── Main scrollable area ── */}
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled
        >
          {/* ── Header: image + info ── */}
          <View style={styles.header}>
            <View style={styles.imageWrap}>
              <Image
                source={{ uri: drug.imageUrl || "https://via.placeholder.com/150" }}
                style={styles.drugImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.infoWrap}>
              {drug.dosageForm && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText} numberOfLines={2}>
                    {drug.dosageForm}
                  </Text>
                </View>
              )}
              <Text style={styles.drugName} numberOfLines={2}>
                {drug.name}
              </Text>
              {drug.referencePrice != null && (
                <Text style={styles.drugPrice}>{drug.referencePrice} FCFA</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* ── Description ── */}
          <View style={styles.descriptionWrap}>
            <Text style={styles.descriptionText}>
              Ce médicament est indiqué dans le traitement symptomatique des
              douleurs légères à modérées et des états fébriles. Toujours lire
              attentivement la notice avant utilisation et consulter un
              professionnel de santé en cas de doute.
            </Text>
          </View>

          {/* ── Tags ── */}
          <View style={styles.tagsWrap}>
            {tags.map((tag) => (
              <Tag key={tag} label={tag} />
            ))}
          </View>

          {/* ── CTA ── */}
          <View style={styles.ctaWrap}>
            <PrimaryButton
              label={
                hasReminder ? "Déjà dans mes rappels" : "Ajouter à mes rappels"
              }
              variant={hasReminder ? "outline" : "solid"}
              size="md"
              fullWidth
              icon={
                <Ionicons
                  name={hasReminder ? "checkmark-circle" : "alarm-outline"}
                  size={18}
                  color={hasReminder ? colors.error : colors.white}
                />
              }
              onPress={() => !hasReminder && drug && onAddToReminder?.(drug)}
              isDisabled={hasReminder}
            />
          </View>

          <View style={styles.divider} />

          {/* ── Tab bar ── */}
          <View style={styles.tabBarWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabBarContent}
            >
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      activeTab === tab && styles.tabLabelActive,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── Tab content (expanded inline) ── */}
          <View style={styles.tabContent}>
            {TAB_CONTENT[activeTab].map((section, i) => (
              <View
                key={i}
                style={[styles.section, i > 0 && styles.sectionSpacing]}
              >
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionBody}>{section.body}</Text>
              </View>
            ))}
          </View>

          {/* ── "Vous aimerez aussi" ── */}
          {relatedDrugs.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.relatedSection}>
                <Text style={styles.relatedTitle}>Vous aimerez aussi</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.relatedList}
                >
                  {relatedDrugs.map((item) => (
                    <RelatedCard key={item.id} item={item} />
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          <View style={styles.scrollPad} />
        </ScrollView>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <GrayButton
            label="Fermer"
            onPress={() => sheetRef.current?.close()}
            style={styles.closeBtn}
          />
        </View>
      </AppBottomSheet>
    );
  },
);

DrugDetailBottomSheet.displayName = "DrugDetailBottomSheet";

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheetContainer: {
    paddingBottom: 0,
    paddingHorizontal: 0,
  },

  // ── Scroll ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  scrollPad: {
    height: 16,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  imageWrap: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: colors.surface,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  drugImage: {
    width: "100%",
    height: "100%",
  },
  infoWrap: {
    flex: 1,
    gap: 6,
    paddingTop: 2,
    justifyContent: "center",
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(17, 199, 147, 0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.primaryDark,
  },
  drugName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.ink,
    lineHeight: 22,
  },
  drugPrice: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.primaryDark,
  },

  // ── Divider ──
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },

  // ── Description ──
  descriptionWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  descriptionText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.inkLight,
    lineHeight: 22,
  },

  // ── Tags ──
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.inkLight,
  },

  // ── CTA ──
  ctaWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  // ── Tab bar ──
  tabBarWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tabBarContent: {
    paddingHorizontal: 12,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.primaryDark,
  },
  tabLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.inkLight,
  },
  tabLabelActive: {
    fontFamily: fontFamily.semiBold,
    color: colors.primaryDark,
  },

  // ── Tab content ──
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  section: {
    gap: 8,
  },
  sectionSpacing: {
    marginTop: 20,
  },
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.inkLight,
    letterSpacing: 0.4,
  },
  sectionBody: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.ink,
    lineHeight: 22,
  },

  // ── "Vous aimerez aussi" ──
  relatedSection: {
    paddingTop: 20,
  },
  relatedTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.ink,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  relatedList: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 4,
  },
  relatedCard: {
    width: 130,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  relatedImageWrap: {
    width: "100%",
    height: 90,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  relatedImage: {
    width: "100%",
    height: "100%",
  },
  relatedInfo: {
    padding: 8,
    gap: 3,
  },
  relatedCategory: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.inkMuted,
  },
  relatedName: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.ink,
    lineHeight: 17,
  },
  relatedPrice: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.primaryDark,
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  closeBtn: {
    width: "100%",
  },
});
