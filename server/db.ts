import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, complaints, settings, statistics, likes } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create a new complaint
 */
export async function createComplaint(data: {
  fullName: string;
  phoneNumber: string;
  complaintSubject: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const complaintNumber = `COMP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  await db.insert(complaints).values({
    complaintNumber,
    fullName: data.fullName,
    phoneNumber: data.phoneNumber,
    complaintSubject: data.complaintSubject,
  });

  await ensureStatisticsRow();
  await db.update(statistics)
    .set({
      totalComplaints: sql`${statistics.totalComplaints} + 1`,
      lastComplaintAt: new Date(),
    })
    .where(eq(statistics.id, 1));

  return complaintNumber;
}


/**
 * Ensure there is exactly one statistics row used by counters.
 */
export async function ensureStatisticsRow() {
  const db = await getDb();
  if (!db) return;

  await db.insert(statistics).values({
    id: 1,
    totalComplaints: 0,
  }).onDuplicateKeyUpdate({
    set: { id: 1 },
  });
}

/**
 * Reset complaint statistics counter without deleting complaints.
 */
export async function resetComplaintsStatistics() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await ensureStatisticsRow();
  await db.update(statistics)
    .set({ totalComplaints: 0, lastComplaintAt: null })
    .where(eq(statistics.id, 1));
}

/**
 * Get total complaints count
 */
export async function getTotalComplaints() {
  const db = await getDb();
  if (!db) return 0;

  await ensureStatisticsRow();
  const result = await db.select().from(statistics).where(eq(statistics.id, 1)).limit(1);
  return result.length > 0 ? result[0].totalComplaints : 0;
}

/**
 * Get setting by key
 */
export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return result.length > 0 ? result[0].value : null;
}

/**
 * Set or update setting
 */
export async function setSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  
  if (existing.length > 0) {
    await db.update(settings)
      .set({ value })
      .where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value });
  }
}

/**
 * Get all complaints
 */
export async function getAllComplaints() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(complaints).orderBy(complaints.createdAt);
}

// Re-export types for use in routers


/**
 * Add a like/approval
 */
export async function addLike(userType: 'citizen' | 'employee', ipAddress: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Check if this IP already liked
  const existing = await db.select().from(likes).where(eq(likes.ipAddress, ipAddress)).limit(1);
  
  if (existing.length === 0) {
    await db.insert(likes).values({
      userType,
      ipAddress,
    });
  }
}

/**
 * Get total likes count
 */
export async function getTotalLikes() {
  const db = await getDb();
  if (!db) return { total: 0, citizens: 0, employees: 0 };

  const result = await db.select().from(likes);
  const citizens = result.filter(l => l.userType === 'citizen').length;
  const employees = result.filter(l => l.userType === 'employee').length;
  
  return {
    total: result.length,
    citizens,
    employees,
  };
}

/**
 * Check if IP already liked
 */
export async function hasUserLiked(ipAddress: string) {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select().from(likes).where(eq(likes.ipAddress, ipAddress)).limit(1);
  return result.length > 0;
}
