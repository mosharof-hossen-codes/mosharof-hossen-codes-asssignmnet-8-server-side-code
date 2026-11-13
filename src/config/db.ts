import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studiospace';
let client: MongoClient | null = null;
let db: Db | null = null;

// In-memory fallback database if MongoDB Atlas is unreachable or offline
class MemoryDB {
  private collections: Map<string, any[]> = new Map();

  constructor() {
    this.collections.set('users', []);
    this.collections.set('studios', []);
    this.collections.set('bookings', []);
    this.collections.set('wishlist', []);
  }

  getCollection(name: string) {
    if (!this.collections.has(name)) {
      this.collections.set(name, []);
    }
    const store = this.collections.get(name)!;

    return {
      find: (query: any = {}) => {
        let results = store.filter(item => {
          for (const key of Object.keys(query)) {
            if (key === '$or' && Array.isArray(query.$or)) {
              const matchesOr = query.$or.some((subQuery: any) => {
                return Object.keys(subQuery).every(subKey => {
                  const val = subQuery[subKey];
                  if (val && typeof val === 'object' && val.$regex) {
                    const regex = new RegExp(val.$regex, val.$options || 'i');
                    return regex.test(item[subKey] || '');
                  }
                  return item[subKey] === val;
                });
              });
              if (!matchesOr) return false;
            } else if (query[key] && typeof query[key] === 'object' && query[key].$regex) {
              const regex = new RegExp(query[key].$regex, query[key].$options || 'i');
              if (!regex.test(item[key] || '')) return false;
            } else if (query[key] && typeof query[key] === 'object' && query[key].$in) {
              if (!query[key].$in.includes(item[key])) return false;
            } else if (query[key] !== undefined && item[key] !== query[key]) {
              return false;
            }
          }
          return true;
        });

        const cursor = {
          sort: (sortObj: any) => {
            const [sortKey, sortDir] = Object.entries(sortObj)[0] || ['createdAt', -1];
            results.sort((a, b) => {
              if (a[sortKey] < b[sortKey]) return sortDir === 1 ? -1 : 1;
              if (a[sortKey] > b[sortKey]) return sortDir === 1 ? 1 : -1;
              return 0;
            });
            return cursor;
          },
          limit: (n: number) => {
            results = results.slice(0, n);
            return cursor;
          },
          toArray: async () => [...results],
        };
        return cursor;
      },
      findOne: async (query: any) => {
        return store.find(item => {
          for (const key of Object.keys(query)) {
            if (key === '_id' || key === 'id') {
              const qVal = query[key]?.toString();
              const itemVal = (item._id || item.id)?.toString();
              if (itemVal === qVal) continue;
              return false;
            }
            if (key === 'email' && typeof query[key] === 'string' && typeof item[key] === 'string') {
              if (item[key].toLowerCase() === query[key].toLowerCase()) continue;
              return false;
            }
            if (item[key] !== query[key]) return false;
          }
          return true;
        }) || null;
      },
      insertOne: async (doc: any) => {
        const _id = doc._id || 'doc_' + Math.random().toString(36).substring(2, 9);
        const newDoc = { ...doc, _id, id: _id };
        store.push(newDoc);
        return { insertedId: _id, acknowledged: true };
      },
      insertMany: async (docs: any[]) => {
        const insertedIds: { [key: number]: string } = {};
        docs.forEach((doc, idx) => {
          const _id = doc._id || 'doc_' + Math.random().toString(36).substring(2, 9) + idx;
          const newDoc = { ...doc, _id, id: _id };
          store.push(newDoc);
          insertedIds[idx] = _id;
        });
        return { insertedCount: docs.length, insertedIds, acknowledged: true };
      },
      updateOne: async (query: any, update: any) => {
        const item = await this.getCollection(name).findOne(query);
        if (item) {
          if (update.$set) {
            Object.assign(item, update.$set);
          }
          return { matchedCount: 1, modifiedCount: 1, acknowledged: true };
        }
        return { matchedCount: 0, modifiedCount: 0, acknowledged: true };
      },
      deleteOne: async (query: any) => {
        const index = store.findIndex(item => {
          for (const key of Object.keys(query)) {
            if (key === '_id' || key === 'id') {
              const qVal = query[key]?.toString();
              const itemVal = (item._id || item.id)?.toString();
              if (itemVal === qVal) continue;
              return false;
            }
            if (key === 'email' && typeof query[key] === 'string' && typeof item[key] === 'string') {
              if (item[key].toLowerCase() === query[key].toLowerCase()) continue;
              return false;
            }
            if (item[key] !== query[key]) return false;
          }
          return true;
        });
        if (index !== -1) {
          store.splice(index, 1);
          return { deletedCount: 1, acknowledged: true };
        }
        return { deletedCount: 0, acknowledged: true };
      },
      countDocuments: async (query: any = {}) => {
        const cursor = this.getCollection(name).find(query);
        const docs = await cursor.toArray();
        return docs.length;
      },
      deleteMany: async (query: any = {}) => {
        if (Object.keys(query).length === 0) {
          store.length = 0;
          return { deletedCount: store.length, acknowledged: true };
        }
        let count = 0;
        for (let i = store.length - 1; i >= 0; i--) {
          const item = store[i];
          let match = true;
          for (const k of Object.keys(query)) {
            if (item[k] !== query[k]) {
              match = false;
              break;
            }
          }
          if (match) {
            store.splice(i, 1);
            count++;
          }
        }
        return { deletedCount: count, acknowledged: true };
      }
    };
  }
}

export const memoryDb = new MemoryDB();
let isUsingMemoryDb = false;

export async function connectDB(): Promise<Db> {
  if (db && !isUsingMemoryDb) return db;

  if (process.env.USE_MEMORY_DB === 'true') {
    console.log('[DB] Running in MemoryDB mode.');
    isUsingMemoryDb = true;
    return memoryDb as unknown as Db;
  }

  try {
    console.log('[DB] Connecting to MongoDB...');
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });
    
    // Guard against hanging DNS lookup
    let isConnected = false;
    const connectTask = client.connect().then(() => { isConnected = true; });
    const timer = new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout (2s)')), 2000));
    
    await Promise.race([connectTask, timer]);
    db = client.db('studiospace');
    console.log('[DB] MongoDB Connected Successfully to Cluster Database: studiospace');
    isUsingMemoryDb = false;
    return db;
  } catch (err: any) {
    console.warn('[DB] MongoDB Connection notice:', err.message);
    if (client) {
      try {
        client.close().catch(() => {});
      } catch (e) {}
      client = null;
    }
    console.log('[DB] Using high-fidelity In-Memory Store for reliable development & testing.');
    isUsingMemoryDb = true;
    return memoryDb as unknown as Db;
  }
}

export function getDB(): any {
  if (isUsingMemoryDb) {
    return memoryDb;
  }
  if (!db) {
    return memoryDb;
  }
  return db;
}

export function isMemoryMode(): boolean {
  return isUsingMemoryDb;
}
