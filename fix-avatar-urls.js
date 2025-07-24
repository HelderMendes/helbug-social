const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function fixAvatarUrls() {
  try {
    console.log("Starting avatar URL cleanup...");

    // Find all users with malformed avatar URLs containing the placeholder
    const usersWithBadUrls = await prisma.user.findMany({
      where: { avatarUrl: { contains: "your_uploadthing_app_id_here" } },
      select: { id: true, username: true, avatarUrl: true },
    });

    console.log(
      `Found ${usersWithBadUrls.length} users with malformed avatar URLs`,
    );

    for (const user of usersWithBadUrls) {
      console.log(`User: ${user.username}, Bad URL: ${user.avatarUrl}`);

      // Extract the file key from the bad URL
      const urlParts = user.avatarUrl.split("/");
      const fileKey = urlParts[urlParts.length - 1];

      // Create the correct UploadThing URL
      const correctUrl = `https://utfs.io/f/${fileKey}`;

      console.log(`Fixing to: ${correctUrl}`);

      // Update the user's avatar URL
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: correctUrl },
      });
    }

    console.log("Avatar URL cleanup completed!");
  } catch (error) {
    console.error("Error fixing avatar URLs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAvatarUrls();
