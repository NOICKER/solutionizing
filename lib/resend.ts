import { Resend } from 'resend'

type ResendLike = Resend | {
  emails: {
    send: (args: unknown) => Promise<void>
  }
}

let warnedMissingResendConfig = false

export const resend: ResendLike = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : {
      emails: {
        async send() {
          if (!warnedMissingResendConfig) {
            console.warn('[Resend] RESEND_API_KEY is not configured. Skipping email delivery.')
            warnedMissingResendConfig = true
          }
        },
      },
    }
