/** Coach's WhatsApp (also the SINPE Móvil number), in wa.me format. */
export const STORE_WHATSAPP_NUMBER = "50672554101";

export function whatsappLink(message: string): string {
  return `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
