import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '20mb' }));

  // 1. Central Database GET endpoint
  // Retrieves data from the server's central persistent store
  app.get('/api/database', (_req, res) => {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(raw);
        return res.json({ success: true, data });
      }
      return res.json({ success: true, data: null });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ success: false, message: `Failed to read database: ${errorMsg}` });
    }
  });

  // 2. Central Database POST endpoint
  // Saves data to the server's central persistent store and triggers cloud background sync
  app.post('/api/database', async (req, res) => {
    try {
      const { personnelList, leaveRecords, settings, auditLogs } = req.body;
      const dbPayload = {
        personnelList,
        leaveRecords,
        settings,
        auditLogs,
        updatedAt: new Date().toISOString()
      };

      fs.writeFileSync(DB_FILE, JSON.stringify(dbPayload, null, 2), 'utf-8');

      // If Google Sheets webhook is configured and auto-sync is enabled, trigger background sync
      const promises: Promise<any>[] = [];

      if (settings?.googleSheetsWebhookUrl && settings?.isAutoSyncEnabled !== false) {
        promises.push(
          fetch(settings.googleSheetsWebhookUrl.trim(), {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'sync_records',
              records: leaveRecords,
              school: settings.schoolName || 'โรงเรียนบ้านห้วยไคร้ สพป.สุโขทัย เขต 2',
              syncTime: new Date().toISOString()
            })
          }).catch(err => {
            // Background sync failure handled gracefully without throwing
            const msg = err instanceof Error ? err.message : String(err);
            console.log('Background sync to Google Sheets status:', msg);
          })
        );
      }

      // We do not block response on cloud webhooks to keep UI blazing fast
      Promise.allSettled(promises);

      return res.json({ 
        success: true, 
        message: 'บันทึกข้อมูลลงฐานข้อมูลกลางสำเร็จ', 
        updatedAt: dbPayload.updatedAt 
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ success: false, message: `Failed to save database: ${errorMsg}` });
    }
  });

  // 3. Cloud Sync Proxy (Google Sheets)
  // Calls external cloud webhook endpoints from the server side to bypass browser CORS
  app.post('/api/cloud-sync', async (req, res) => {
    const { url, serviceType, payload } = req.body;

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return res.status(400).json({ 
        success: false, 
        message: 'กรุณาระบุ URL ของ Webhook ที่ถูกต้อง (ขึ้นต้นด้วย http:// หรือ https://)' 
      });
    }

    try {
      const cloudRes = await fetch(url.trim(), {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await cloudRes.text();
      let responseJson: any = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        // text response
      }

      const isOk = cloudRes.ok || (responseJson && responseJson.status === 'success');

      return res.json({
        success: isOk,
        status: cloudRes.status,
        message: responseJson?.message || responseText || `เชื่อมต่อ ${serviceType || 'Cloud'} สำเร็จ`,
        data: responseJson
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({
        success: false,
        message: `ไม่สามารถเชื่อมต่อคลาวด์ ${serviceType || ''}: ${errorMsg}`
      });
    }
  });

  // LINE Messaging API Push Proxy Endpoint
  // This enables sending push messages directly to a regular LINE group or user
  // without CORS restrictions from the browser.
  app.post('/api/line-notify', async (req, res) => {
    const { token, to, message } = req.body;

    if (!token || !to || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'กรุณาระบุ Channel Access Token, Group ID / User ID และข้อความที่ต้องการส่ง' 
      });
    }

    try {
      const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.trim()}`,
        },
        body: JSON.stringify({
          to: to.trim(),
          messages: [
            {
              type: 'text',
              text: message
            }
          ]
        })
      });

      if (!lineResponse.ok) {
        const errorBody = await lineResponse.text();
        return res.status(lineResponse.status).json({ 
          success: false, 
          message: `LINE API ตอบกลับข้อผิดพลาด (${lineResponse.status}): ${errorBody}` 
        });
      }

      return res.json({ 
        success: true, 
        message: 'ส่งข้อความแจ้งเตือนเข้ากลุ่ม LINE เรียบร้อยแล้ว' 
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return res.status(500).json({ 
        success: false, 
        message: `ไม่สามารถเชื่อมต่อ LINE API: ${errorMsg}` 
      });
    }
  });

  // Mount Vite development server middleware or serve built static files
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ระบบจัดการวันลาพร้อมทำงานที่ http://0.0.0.0:${PORT}`);
  });
}

startServer();
