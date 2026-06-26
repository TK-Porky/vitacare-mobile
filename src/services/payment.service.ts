import { apiClient } from "../lib/api.client";
import { API_ENDPOINTS } from "../types/api-endpoints";
import { InitiatePaymentRequest } from "../types/api-requests";
import { PaymentResponse } from "../types/api-responses";

function unwrapData<T>(res: any): T {
  if (!res.success) throw new Error(res.error ?? "Payment request failed");
  const body = res.data;
  if (body && typeof body === 'object' && 'data' in body) {
    return body.data as T;
  }
  return body as T;
}

export const paymentService = {
  async initiatePayment(data: InitiatePaymentRequest): Promise<PaymentResponse> {
    const res = await apiClient.post<any>(API_ENDPOINTS.PAYMENTS.INITIATE, {
      appointmentId: data.appointmentId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      phoneNumber: data.phoneNumber,
    });
    return unwrapData<PaymentResponse>(res);
  },
};
