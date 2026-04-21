import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "merrystory";

if (!MONGODB_URI) {
  console.error("❌ Missing MONGODB_URI in .env");
  process.exit(1);
}

const adminUser = {
  _id: new ObjectId("69e730f75b34b935abd19c59"),
  firebaseUid: "7DmjOdmWZihfLP2GeDqiTPRdWCL2",
  email: "merrystoryeventservices@gmail.com",
  name: "Merry Admin",
  role: "admin",
  phone: "",
  createdAt: new Date(),
  updatedAt: new Date(),
};

async function seedAdmin() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(MONGODB_DB_NAME);
    const usersCollection = db.collection("users");

    // Check if already exists
    const existing = await usersCollection.findOne({
      $or: [
        { firebaseUid: adminUser.firebaseUid },
        { email: adminUser.email },
      ],
    });

    if (existing) {
      console.log("⚠️  Admin user already exists. Updating...");
      await usersCollection.updateOne(
        { _id: existing._id },
        {
          $set: {
            firebaseUid: adminUser.firebaseUid,
            email: adminUser.email,
            name: adminUser.name,
            role: adminUser.role,
            updatedAt: new Date(),
          },
        }
      );
      console.log("✅ Admin user updated successfully.");
    } else {
      await usersCollection.insertOne(adminUser);
      console.log("✅ Admin user inserted successfully.");
    }

    const result = await usersCollection.findOne({ firebaseUid: adminUser.firebaseUid });
    console.log("\n📋 Admin document in DB:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\n🔌 MongoDB connection closed.");
  }
}

seedAdmin();
