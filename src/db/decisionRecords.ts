import { db } from './index.ts';
import { decisionRecords } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import { ArchitectureDecisionRecord } from '../types/infrastructure.ts';

export async function getUserDecisionRecords(userId: string) {
  try {
    return await db
      .select()
      .from(decisionRecords)
      .where(eq(decisionRecords.userId, userId))
      .orderBy(desc(decisionRecords.createdAt));
  } catch (error) {
    console.error('Database query failed in getUserDecisionRecords:', error);
    throw new Error('Failed to retrieve decision records', { cause: error });
  }
}

export async function saveDecisionRecord(adr: ArchitectureDecisionRecord, userId: string, architectureId?: string) {
  try {
    const inserted = await db
      .insert(decisionRecords)
      .values({
        id: adr.id,
        architectureId: architectureId || null,
        userId,
        title: adr.title,
        status: adr.status,
        context: adr.context,
        decision: adr.decision,
        consequences: adr.consequences,
        metricsEvidence: adr.metricsEvidence,
      })
      .returning();
    return inserted[0];
  } catch (error) {
    console.error('Database query failed in saveDecisionRecord:', error);
    throw new Error('Failed to persist decision record', { cause: error });
  }
}
