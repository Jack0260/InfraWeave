import { db } from './index.ts';
import { architectures } from './schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import { InfrastructureArchitecture } from '../types/infrastructure.ts';

export async function getUserArchitectures(userId: string) {
  try {
    const records = await db
      .select()
      .from(architectures)
      .where(eq(architectures.userId, userId))
      .orderBy(desc(architectures.updatedAt));

    return records.map(r => ({
      ...r,
      data: r.data as InfrastructureArchitecture,
    }));
  } catch (error) {
    console.error('Database query failed in getUserArchitectures:', error);
    throw new Error('Failed to retrieve architectures', { cause: error });
  }
}

export async function saveArchitecture(arch: InfrastructureArchitecture, userId: string) {
  try {
    const existing = await db
      .select()
      .from(architectures)
      .where(and(eq(architectures.id, arch.id), eq(architectures.userId, userId)))
      .limit(1);

    if (existing.length > 0) {
      const updated = await db
        .update(architectures)
        .set({
          name: arch.name,
          description: arch.description,
          data: arch,
          updatedAt: new Date(),
        })
        .where(and(eq(architectures.id, arch.id), eq(architectures.userId, userId)))
        .returning();
      return updated[0];
    } else {
      const inserted = await db
        .insert(architectures)
        .values({
          id: arch.id,
          userId,
          name: arch.name,
          description: arch.description,
          isPreset: false,
          data: arch,
        })
        .returning();
      return inserted[0];
    }
  } catch (error) {
    console.error('Database query failed in saveArchitecture:', error);
    throw new Error('Failed to persist architecture', { cause: error });
  }
}

export async function deleteArchitecture(id: string, userId: string) {
  try {
    const result = await db
      .delete(architectures)
      .where(and(eq(architectures.id, id), eq(architectures.userId, userId)))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in deleteArchitecture:', error);
    throw new Error('Failed to remove architecture', { cause: error });
  }
}
