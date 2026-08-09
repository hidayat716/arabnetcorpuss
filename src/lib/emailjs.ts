/**
 * EmailJS Helper & Configuration Module
 * 
 * Modul ini menyimpan konfigurasi default EmailJS dan menyediakan fungsi
 * untuk mengirim kode verifikasi OTP ke email pengguna.
 * Anda dapat mengedit kredensial di bawah ini secara langsung jika ada perubahan akun.
 */

// Kredensial Default EmailJS (Jika tidak ditemukan di localStorage / .env)
export const EMAILJS_DEFAULT_CONFIG = {
  SERVICE_ID: 'service_mdtlqar',
  TEMPLATE_ID: 'template_lnxuj6g',
  PUBLIC_KEY: 'mdeAgzKvT88vIWrup'
};

interface EmailParams {
  email: string;
  name: string;
  otpCode: string;
}

/**
 * Mengirimkan email OTP menggunakan REST API EmailJS
 */
export const sendOtpEmail = async ({ email, name, otpCode }: EmailParams): Promise<{ success: boolean; error?: string }> => {
  const metaEnv = (import.meta as any).env || {};
  
  // Prioritas konfigurasi:
  // 1. localStorage (jika diset manual oleh developer di panel UI)
  // 2. Environment Variables (.env)
  // 3. Kredensial default
  const serviceId = localStorage.getItem('emailjs_service_id') || metaEnv.VITE_EMAILJS_SERVICE_ID || EMAILJS_DEFAULT_CONFIG.SERVICE_ID;
  const templateId = localStorage.getItem('emailjs_template_id') || metaEnv.VITE_EMAILJS_TEMPLATE_ID || EMAILJS_DEFAULT_CONFIG.TEMPLATE_ID;
  const publicKey = localStorage.getItem('emailjs_public_key') || metaEnv.VITE_EMAILJS_PUBLIC_KEY || EMAILJS_DEFAULT_CONFIG.PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn('EmailJS belum dikonfigurasi dengan lengkap.');
    return { success: false, error: 'Konfigurasi EmailJS tidak lengkap.' };
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_name: name,
          to_email: email,
          otp_code: otpCode,
          project_name: 'ArabNet Corpus Digital'
        }
      })
    });

    if (response.ok) {
      console.log('OTP Email berhasil dikirim via EmailJS ke:', email);
      return { success: true };
    } else {
      const errorText = await response.text();
      console.error('EmailJS Send Error:', errorText);
      return { success: false, error: errorText };
    }
  } catch (err: any) {
    console.error('EmailJS Connection Error:', err);
    return { success: false, error: err.message || String(err) };
  }
};
