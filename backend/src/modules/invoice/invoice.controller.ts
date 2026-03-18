import { Request, Response } from 'express';
import { invoiceService } from './invoice.service.js';
import { orderService } from '../order/service.js';
import type { JwtPayload } from '../../middleware/authenticate.js';

export const invoiceController = {
  async downloadInvoice(req: Request, res: Response) {
    const orderId = parseInt(req.params['id'], 10);
    if (isNaN(orderId)) {
      res.status(400).json({ success: false, errors: [{ message: 'Invalid order ID', code: 'VALIDATION_ERROR' }] });
      return;
    }

    const authUser = (req as any).user as JwtPayload;
    const isAdmin = authUser?.role === 'admin';

    // For customers, verify ownership via getById (throws if not found or not theirs)
    const order = await orderService.getById(orderId, isAdmin ? undefined : authUser.userId);

    const pdfBuffer = await invoiceService.generateInvoicePDF(orderId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="factura-${order.reference}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  },
};
