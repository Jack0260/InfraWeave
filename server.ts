import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser } from './src/db/users.ts';
import {
  getUserArchitectures,
  saveArchitecture,
  deleteArchitecture,
} from './src/db/architectures.ts';
import {
  getUserDecisionRecords,
  saveDecisionRecord,
} from './src/db/decisionRecords.ts';
import {
  getUserAuditLogs,
  saveAuditLog,
} from './src/db/auditLogs.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  // 1. Auth Sync / User Registration
  app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const email = user.email || 'user@example.com';
      const displayName = (user as any).name || (user as any).displayName || undefined;
      const photoUrl = (user as any).picture || undefined;

      const dbUser = await getOrCreateUser(user.uid, email, displayName, photoUrl);
      res.json({ success: true, user: dbUser });
    } catch (error: any) {
      console.error('Error syncing user:', error);
      res.status(500).json({ error: error.message || 'Failed to sync user' });
    }
  });

  // 2. Architectures CRUD
  app.get('/api/architectures', requireAuth, async (req: AuthRequest, res) => {
    try {
      const list = await getUserArchitectures(req.user!.uid);
      res.json(list);
    } catch (error: any) {
      console.error('Error fetching architectures:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch architectures' });
    }
  });

  app.post('/api/architectures', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { architecture } = req.body;
      if (!architecture || !architecture.id || !architecture.name) {
        return res.status(400).json({ error: 'Invalid architecture payload' });
      }
      const saved = await saveArchitecture(architecture, req.user!.uid);
      res.json(saved);
    } catch (error: any) {
      console.error('Error saving architecture:', error);
      res.status(500).json({ error: error.message || 'Failed to save architecture' });
    }
  });

  app.delete('/api/architectures/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const deleted = await deleteArchitecture(req.params.id, req.user!.uid);
      res.json({ success: true, deleted });
    } catch (error: any) {
      console.error('Error deleting architecture:', error);
      res.status(500).json({ error: error.message || 'Failed to delete architecture' });
    }
  });

  // 3. Decision Records (ADRs)
  app.get('/api/decisions', requireAuth, async (req: AuthRequest, res) => {
    try {
      const list = await getUserDecisionRecords(req.user!.uid);
      res.json(list);
    } catch (error: any) {
      console.error('Error fetching decision records:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch decisions' });
    }
  });

  app.post('/api/decisions', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { adr, architectureId } = req.body;
      if (!adr || !adr.id || !adr.title) {
        return res.status(400).json({ error: 'Invalid ADR payload' });
      }
      const saved = await saveDecisionRecord(adr, req.user!.uid, architectureId);
      res.json(saved);
    } catch (error: any) {
      console.error('Error saving decision record:', error);
      res.status(500).json({ error: error.message || 'Failed to save decision' });
    }
  });

  // 4. Audit Logs
  app.get('/api/audit-logs', requireAuth, async (req: AuthRequest, res) => {
    try {
      const list = await getUserAuditLogs(req.user!.uid);
      res.json(list);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch audit logs' });
    }
  });

  app.post('/api/audit-logs', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { entry, architectureId } = req.body;
      if (!entry || !entry.id) {
        return res.status(400).json({ error: 'Invalid audit entry' });
      }
      const saved = await saveAuditLog(entry, req.user!.uid, architectureId);
      res.json(saved);
    } catch (error: any) {
      console.error('Error saving audit log:', error);
      res.status(500).json({ error: error.message || 'Failed to save audit log' });
    }
  });

  // Vite Integration in Development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`InfraWeave Full-Stack server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
