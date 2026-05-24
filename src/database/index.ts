import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { runMigrations } from '@/database/migrations';
import { createUuid } from '@/utils/uuid';

const DATABASE_NAME = 'formalio_offline.db';
const DEVICE_ID_KEY = 'formalio.localDatabase.deviceId';

let databasePromise: Promise<SQLiteDatabase> | null = null;
let deviceIdPromise: Promise<string> | null = null;

async function openDatabase() {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await runMigrations(db);
  return db;
}

export async function initializeDatabase() {
  if (!databasePromise) {
    databasePromise = openDatabase();
  }
  return databasePromise;
}

export async function getDatabase() {
  return initializeDatabase();
}

export async function getDeviceId() {
  if (!deviceIdPromise) {
    deviceIdPromise = AsyncStorage.getItem(DEVICE_ID_KEY).then(async (existing) => {
      if (existing) return existing;
      const next = createUuid();
      await AsyncStorage.setItem(DEVICE_ID_KEY, next);
      return next;
    });
  }

  return deviceIdPromise;
}

export const database = {
  name: DATABASE_NAME,
  initialize: initializeDatabase,
  getConnection: getDatabase,
  getDeviceId,
};
