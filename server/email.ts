export async function sendParthaEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const recipient = input.to.trim().toLowerCase();
  if (!resendKey || !recipient) {
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL?.trim() || 'PARTHA <onboarding@resend.dev>',
        to: [recipient],
        subject: input.subject,
        text: input.text,
      }),
    });
    if (!response.ok) {
      console.error('Resend API returned non-OK status:', response.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to send email via Resend:', err);
    return false;
  }
}
