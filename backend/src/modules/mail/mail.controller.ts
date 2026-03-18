import { Request, Response } from 'express';
import { mailService } from './mail.service.js';

export const mailController = {
  async testEmail(req: Request, res: Response) {
    const { to } = req.body;
    if (!to) {
      res.status(400).json({ success: false, errors: [{ message: 'Email destination required', code: 'VALIDATION_ERROR' }] });
      return;
    }

    const html = `
      <div style="font-family:Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto;">
        <h2 style="color:#1a56db;">✅ Email de prueba</h2>
        <p>Si recibes este email, la configuración SMTP es correcta.</p>
        <p style="font-size:12px;color:#888;">Enviado el ${new Date().toLocaleString('es-ES')}</p>
      </div>
    `;

    await mailService.send(to, '✅ Prueba de email - DMShop', html);
    res.json({ success: true, data: { message: `Email de prueba enviado a ${to}` } });
  },
};
