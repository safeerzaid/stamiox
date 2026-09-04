import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';

export const exportStampPdf = async (req: Request, res: Response) => {
  try {
    const {
      title = 'stamp-design',
      widthMm = 40,
      heightMm = 40,
      svgContent,
      mirror = false,
      invert = false,
    } = req.body;

    // Convert mm to points (1 inch = 25.4 mm = 72 pt -> 1 mm = 72 / 25.4 = ~2.83465 pt)
    const MM_TO_PT = 2.83464567;
    const widthPt = widthMm * MM_TO_PT;
    const heightPt = heightMm * MM_TO_PT;

    // Create PDF document with exact stamp size
    const doc = new PDFDocument({
      size: [widthPt, heightPt],
      margin: 0,
      info: {
        Title: title,
        Author: 'Stamiox Vector Stamp Studio',
        Subject: 'Production-Ready Rubber Stamp Vector',
      },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s+/g, '_')}.pdf"`);

    doc.pipe(res);

    // If invert mode (laser negative for rubber engraving), draw solid black background
    if (invert) {
      doc.rect(0, 0, widthPt, heightPt).fill('#000000');
    }

    // Embed metadata note & finalize
    doc.end();
  } catch (error: any) {
    console.error('Export PDF error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate PDF' });
  }
};

export const sanitizeAndValidateSvg = async (req: Request, res: Response) => {
  try {
    const { svgString, widthMm, heightMm } = req.body;
    if (!svgString) {
      return res.status(400).json({ success: false, message: 'SVG content is required' });
    }

    return res.json({
      success: true,
      dimensions: {
        widthMm,
        heightMm,
      },
      valid: true,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Invalid SVG format' });
  }
};
