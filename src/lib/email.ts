import { Resend } from "resend";

let resendInstance: Resend | null = null;

/**
 * Get or create the Resend instance
 * Uses lazy initialization to prevent build-time errors when RESEND_API_KEY is missing
 */
export function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY environment variable is not configured. " +
          "Email functionality will not work without this key."
      );
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

// Backwards compatibility export
export const resend = {
  get emails() {
    return getResend().emails;
  },
};
