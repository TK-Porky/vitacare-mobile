import { useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontFamily, fontSize } from "@/themes";
import { NotificationData, NotificationCategory } from "@/types";
import { formatRelative } from "@/utils";
import { CATEGORY_META } from "@/constants/notifications";

interface NotificationItemProps {
  notification: NotificationData;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export const NotificationItem = ({
  notification,
  onRead,
  onDelete,
}: NotificationItemProps) => {
  const meta =
    CATEGORY_META[notification.type as NotificationCategory] ??
    CATEGORY_META.system;
  const isUnread = !notification.read;
  const timeLabel = useMemo(
    () => formatRelative(notification.createdAt),
    [notification.createdAt],
  );

  const handlePress = useCallback(() => {
    onRead(notification.id!);
  }, [notification.id, onRead]);

  const handleDelete = useCallback(() => {
    onDelete(notification.id!);
  }, [notification.id, onDelete]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Bloc gauche */}
      <View style={[styles.cardLeft, { backgroundColor: meta.color }]}>
        {isUnread && <View style={styles.unreadDot} />}
        <Ionicons name={meta.icon} size={22} color="#fff" />
        <Text style={styles.leftLabel}>{meta.label}</Text>
      </View>

      {/* Contenu */}
      <View style={styles.cardContent}>
        <Text
          style={[styles.notifTitle, !isUnread && styles.notifTitleRead]}
          numberOfLines={1}
        >
          {notification.title}
        </Text>
        <Text style={styles.notifBody} numberOfLines={2}>
          {notification.content}
        </Text>
        <Text style={styles.notifTime}>{timeLabel}</Text>
      </View>

      {/* Suppression */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={handleDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 14,
    overflow: "hidden",
    minHeight: 88,
    backgroundColor: colors.white,
  },
  cardLeft: {
    width: 66,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 6,
    position: "relative",
    borderRadius: 14,
  },
  unreadDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    opacity: 0.9,
  },
  leftLabel: {
    fontSize: 10,
    fontFamily: fontFamily.semiBold,
    color: colors.white,
    textAlign: "center",
    lineHeight: 13,
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
    paddingVertical: 11,
    paddingHorizontal: 12,
    minWidth: 0,
  },
  deleteBtn: {
    paddingRight: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 6,
  },
  notifTitle: {
    flex: 1,
    fontSize: fontSize.base,
    fontFamily: fontFamily.semiBold,
    color: colors.ink,
    lineHeight: 18,
  },
  notifTitleRead: {
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
  },
  notifBody: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
    lineHeight: 17,
  },
  notifTime: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.inkLight,
    marginTop: 2,
  },
});
