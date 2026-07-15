import { useRef, forwardRef, useImperativeHandle } from "react";
import { Alert } from "react-native";
import i18next from "@/i18n";
import {
  MomoPaymentSheet,
  OrangePaymentSheet,
  CardPaymentSheet,
} from "@/components/payment";
import type { PaymentSheetRef } from "@/components/payment/MomoPaymentSheet";

type PaymentSheetManagerProps = {
  appointmentId: number;
  amount: number;
  onPaymentSuccess: () => void;
};

export type PaymentSheetManagerRef = {
  handlePay: (paymentProvider?: string) => void;
};

export const PaymentSheetManager = forwardRef<
  PaymentSheetManagerRef,
  PaymentSheetManagerProps
>(({ appointmentId, amount, onPaymentSuccess }, ref) => {
  const momoSheetRef = useRef<PaymentSheetRef>(null);
  const orangeSheetRef = useRef<PaymentSheetRef>(null);
  const cardSheetRef = useRef<PaymentSheetRef>(null);

  useImperativeHandle(ref, () => ({
    handlePay: (paymentProvider: string = "mobile_money") => {
      switch (paymentProvider) {
        case "mobile_money":
          momoSheetRef.current?.open();
          break;
        case "orange_money":
          orangeSheetRef.current?.open();
          break;
        case "card":
          cardSheetRef.current?.open();
          break;
        default:
          Alert.alert(i18next.t('common.error'), i18next.t('errors.somethingWrong'));
      }
    },
  }));

  return (
    <>
      <MomoPaymentSheet
        ref={momoSheetRef}
        appointmentId={appointmentId}
        amount={amount}
        onSuccess={onPaymentSuccess}
      />
      <OrangePaymentSheet
        ref={orangeSheetRef}
        appointmentId={appointmentId}
        amount={amount}
        onSuccess={onPaymentSuccess}
      />
      <CardPaymentSheet
        ref={cardSheetRef}
        appointmentId={appointmentId}
        amount={amount}
        onSuccess={onPaymentSuccess}
      />
    </>
  );
});
