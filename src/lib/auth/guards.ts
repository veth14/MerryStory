import { DecodedIdToken } from "firebase-admin/auth";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { getMongoDb } from "@/lib/mongodb";

const VALID_ROLES = ["admin", "coordinator", "staff"] as const;

export type AppRole = (typeof VALID_ROLES)[number];

export type AuthenticatedUser = {
  uid: string;
  email: string | null;
  role: AppRole | null;
  accessRole?: string | null;
  token: DecodedIdToken;
};

export class AuthGuardError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AuthGuardError";
    this.statusCode = statusCode;
  }
}

function normalizeRole(input: unknown): AppRole | null {
  if (typeof input !== "string") {
    return null;
  }

  const lowered = input.toLowerCase();
  return (VALID_ROLES as readonly string[]).includes(lowered) ? (lowered as AppRole) : null;
}

function extractBearerToken(request: Request): string {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthGuardError("Missing or invalid authorization token.", 401);
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    throw new AuthGuardError("Authorization token is empty.", 401);
  }

  return token;
}

async function getUserFromMongo(decodedToken: DecodedIdToken) {
  try {
    const db = await getMongoDb();
    const usersCollection = db.collection<{ role?: string; accessRole?: string; firebaseUid?: string; email?: string }>("users");

    const filters: Array<{ firebaseUid?: string; email?: string }> = [{ firebaseUid: decodedToken.uid }];

    if (decodedToken.email) {
      filters.push({ email: decodedToken.email });
    }

    const user = await usersCollection.findOne({ $or: filters });
    console.log("------- DEBUG MONGO LOOKUP --------");
    console.log("Token UID:", decodedToken.uid);
    console.log("Token Email:", decodedToken.email);
    console.log("Filters used:", JSON.stringify({ $or: filters }));
    console.log("User found in Mongo:", user);
    console.log("-----------------------------------");
    
    return user;
  } catch (error) {
    console.error("DEBUG MONGO AUTH ERROR:", error);
    throw new AuthGuardError(`Database connection error: ${(error as Error).message}`, 500);
  }
}

export async function requireAuthenticatedUser(request: Request): Promise<AuthenticatedUser> {
  const bearerToken = extractBearerToken(request);
  const decodedToken = await getFirebaseAdminAuth().verifyIdToken(bearerToken);

  const mongoUser = await getUserFromMongo(decodedToken);
  const claimRole = normalizeRole(decodedToken.role);
  const mongoRole = normalizeRole(mongoUser?.role);

  return {
    uid: decodedToken.uid,
    email: decodedToken.email || null,
    role: claimRole || mongoRole,
    accessRole: mongoUser?.accessRole || null,
    token: decodedToken,
  };
}

export async function requireRole(request: Request, allowedRoles: AppRole[]): Promise<AuthenticatedUser> {
  const user = await requireAuthenticatedUser(request);

  if (!user.role) {
    throw new AuthGuardError("Authenticated account has no role assigned.", 403);
  }

  if (!allowedRoles.includes(user.role)) {
    throw new AuthGuardError("You do not have permission to access this resource.", 403);
  }

  return user;
}
