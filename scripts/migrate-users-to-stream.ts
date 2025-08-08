import { PrismaClient } from "@prisma/client";
import { StreamChat } from "stream-chat";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

if (!process.env.NEXT_PUBLIC_STREAM_KEY || !process.env.STREAM_SECRET) {
  throw new Error("Stream environment variables are not set");
}

const streamClient = StreamChat.getInstance(
  process.env.NEXT_PUBLIC_STREAM_KEY,
  process.env.STREAM_SECRET,
);

async function migrateUsersToStream() {
  try {
    console.log("Starting user migration to Stream Chat...");

    // Get all users from your database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        displayName: true,
        username: true,
        avatarUrl: true,
      },
    });

    console.log(`Found ${users.length} users to migrate`);

    if (users.length === 0) {
      console.log("No users found to migrate");
      return;
    }

    // Create Stream users in batches
    const batchSize = 100;
    let migratedCount = 0;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      const streamUsers = batch.map((user) => ({
        id: user.id,
        name: user.displayName || user.username,
        username: user.username,
        image: user.avatarUrl || undefined,
      }));

      try {
        await streamClient.upsertUsers(streamUsers);
        migratedCount += batch.length;
        console.log(
          `✅ Migrated batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(users.length / batchSize)} (${migratedCount}/${users.length} users)`,
        );
      } catch (batchError) {
        console.error(
          `❌ Failed to migrate batch ${Math.floor(i / batchSize) + 1}:`,
          batchError,
        );
        // Continue with next batch instead of stopping
      }
    }

    console.log(
      `🎉 Migration completed! Successfully migrated ${migratedCount}/${users.length} users`,
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log("Database connection closed");
  }
}

// Run the migration
migrateUsersToStream()
  .then(() => {
    console.log("Migration script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });
