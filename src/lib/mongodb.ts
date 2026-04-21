import { Db, MongoClient } from "mongodb";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let mongoClientPromise: Promise<MongoClient> | undefined;

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  return uri;
}

export function getMongoClientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      const devClient = new MongoClient(getMongoUri());
      global._mongoClientPromise = devClient.connect();
    }

    return global._mongoClientPromise;
  }

  if (!mongoClientPromise) {
    const prodClient = new MongoClient(getMongoUri());
    mongoClientPromise = prodClient.connect();
  }

  return mongoClientPromise;
}

export async function getMongoDb(dbName = "merryStory"): Promise<Db> {
  const client = await getMongoClientPromise();
  return client.db(dbName);
}
