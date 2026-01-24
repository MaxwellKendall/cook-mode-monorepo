import { eq } from 'drizzle-orm';
import { getDb } from '../client.js';
import { voiceSessions, type VoiceSession } from '../schema.js';
import { hasAvailableMinutes } from './subscriptions.js';

export async function startVoiceSession(userId: string, recipeId?: string): Promise<string> {
  const db = getDb();

  const hasMinutes = await hasAvailableMinutes(userId);
  if (!hasMinutes) {
    throw new Error('No minutes available');
  }

  const [session] = await db
    .insert(voiceSessions)
    .values({
      userId,
      recipeId: recipeId || null,
      startedAt: new Date(),
    })
    .returning();

  return session!.id;
}

export async function endVoiceSession(sessionId: string): Promise<void> {
  const db = getDb();

  const [session] = await db
    .select()
    .from(voiceSessions)
    .where(eq(voiceSessions.id, sessionId))
    .limit(1);

  if (!session) {
    throw new Error('Session not found');
  }

  const endTime = new Date();
  const durationSeconds = Math.floor((endTime.getTime() - session.startedAt.getTime()) / 1000);
  const estimatedCost = (durationSeconds / 60) * 0.03;

  await db
    .update(voiceSessions)
    .set({
      endedAt: endTime,
      estimatedCost: estimatedCost.toFixed(4),
    })
    .where(eq(voiceSessions.id, sessionId));
}
