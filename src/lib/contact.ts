// WhatsApp orders & floating button — keep on your test number until client go-live.
export const WHATSAPP_NUMBER = "233558758720";

// Footer contact display only (client's public number).
export const CONTACT_PHONE_NUMBER = "233558758720";

export const WHATSAPP_DEFAULT_MESSAGE = "Hi Shop Albie — I'd like to ask about an item.";

export function whatsappUrl(message: string = WHATSAPP_DEFAULT_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const TIKTOK_URL = "https://vm.tiktok.com/ZS96uXVusEXSV-p3kJV/";
export const SNAPCHAT_URL =
  "https://www.snapchat.com/add/albertaaubin?share_id=GuPF7fK5KMo&locale=en-US";
