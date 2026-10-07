import { db } from './index.ts';
import { auditLogs } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import { ArchitectureAuditEntry } from '../types/infrastructure.ts';

export async function getUserAuditLogs(userId: string) {
  try {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(50);
  } catch (error) {
    console.error('Database query failed in getUserAuditLogs:', error);
    throw new Error('Failed to retrieve audit logs', { cause: error });
  }
}

export async function saveAuditLog(entry: ArchitectureAuditEntry, userId: string, architectureId?: string) {
  try {
    const inserted = await db
      .insert(auditLogs)
      .values({
        id: entry.id,
        architectureId: architectureId || null,
        userId,
        action: entry.action,
        summary: entry.summary,
        deltaCost: entry.deltaCost.toString(),
        deltaLatency: entry.deltaLatencyP95.toString(),
        deltaAvailability: entry.deltaAvailability.toString(),
      })
      .returning();
    return inserted[0];
  } catch (error) {
    console.error('Database query failed in saveAuditLog:', error);
    throw new Error('Failed to persist audit log', { cause: error });
  }
}
