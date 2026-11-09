import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

interface SupportTicket {
  id: string;
  type: 'REQUIREMENT' | 'SUGGESTION' | 'ISSUE';
  subject: string;
  message: string;
  email?: string;
  userMeta?: Record<string, any>;
  createdAt: string;
}

const TICKETS_FILE = path.join(__dirname, '../data/support-tickets.json');

const readTickets = (): SupportTicket[] => {
  try {
    if (fs.existsSync(TICKETS_FILE)) {
      const data = fs.readFileSync(TICKETS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading support tickets:', err);
  }
  return [];
};

const saveTickets = (tickets: SupportTicket[]) => {
  try {
    const dir = path.dirname(TICKETS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving support tickets:', err);
  }
};

export const submitSupportTicket = async (req: Request, res: Response) => {
  try {
    const { type, subject, message, email, userMeta } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required.' });
    }

    const ticketType = type === 'REQUIREMENT' || type === 'SUGGESTION' ? type : 'SUGGESTION';
    const prefix = ticketType === 'REQUIREMENT' ? 'REQ' : 'SUG';
    const ticketId = `${prefix}-${Date.now().toString(36).toUpperCase()}`;

    const newTicket: SupportTicket = {
      id: ticketId,
      type: ticketType,
      subject: String(subject).trim(),
      message: String(message).trim(),
      email: email ? String(email).trim() : undefined,
      userMeta,
      createdAt: new Date().toISOString(),
    };

    const tickets = readTickets();
    tickets.unshift(newTicket);
    saveTickets(tickets);

    console.log(`[Support] New ${ticketType} Ticket [${ticketId}]: "${newTicket.subject}"`);

    return res.status(201).json({
      success: true,
      ticketId,
      message: `Your ${ticketType.toLowerCase()} has been received successfully!`,
      ticket: newTicket,
    });
  } catch (error) {
    console.error('Failed to submit support ticket:', error);
    return res.status(500).json({ error: 'Internal server error while saving ticket.' });
  }
};

export const getSupportTickets = async (_req: Request, res: Response) => {
  try {
    const tickets = readTickets();
    return res.json({ count: tickets.length, tickets });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve tickets.' });
  }
};

