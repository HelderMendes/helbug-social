import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create some sample users
  const users = [];
  
  // Create user 1
  const user1Id = generateIdFromEntropySize(10);
  const user1Password = await hash("password123", {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
  
  const user1 = await prisma.user.create({
    data: {
      id: user1Id,
      username: "john_doe",
      displayName: "John Doe",
      email: "john@example.com",
      passwordHash: user1Password,
      bio: "Software developer and coffee enthusiast ☕",
    },
  });
  users.push(user1);

  // Create user 2
  const user2Id = generateIdFromEntropySize(10);
  const user2Password = await hash("password123", {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
  
  const user2 = await prisma.user.create({
    data: {
      id: user2Id,
      username: "jane_smith",
      displayName: "Jane Smith",
      email: "jane@example.com",
      passwordHash: user2Password,
      bio: "UI/UX Designer | Love creating beautiful interfaces ✨",
    },
  });
  users.push(user2);

  // Create user 3
  const user3Id = generateIdFromEntropySize(10);
  const user3Password = await hash("password123", {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
  
  const user3 = await prisma.user.create({
    data: {
      id: user3Id,
      username: "mike_wilson",
      displayName: "Mike Wilson",
      email: "mike@example.com",
      passwordHash: user3Password,
      bio: "Full-stack developer | Building the future 🚀",
    },
  });
  users.push(user3);

  console.log(`✅ Created ${users.length} users`);

  // Create some sample posts
  const posts = [];
  
  const post1 = await prisma.post.create({
    data: {
      content: "Just shipped a new feature! Excited to see how users react to the updated UI. #webdev #coding",
      userId: user1.id,
    },
  });
  posts.push(post1);

  const post2 = await prisma.post.create({
    data: {
      content: "Beautiful sunset today! 🌅 Taking a break from coding to appreciate nature. #life #sunset",
      userId: user1.id,
    },
  });
  posts.push(post2);

  const post3 = await prisma.post.create({
    data: {
      content: "Working on a new design system. The goal is to make our app more accessible and user-friendly. #design #ux",
      userId: user2.id,
    },
  });
  posts.push(post3);

  const post4 = await prisma.post.create({
    data: {
      content: "Just discovered this amazing React library that makes animations so much easier! Anyone else using Framer Motion? #react #frontend",
      userId: user3.id,
    },
  });
  posts.push(post4);

  const post5 = await prisma.post.create({
    data: {
      content: "Coffee shop coding session ☕💻 There's something magical about working in a cozy café with good music.",
      userId: user2.id,
    },
  });
  posts.push(post5);

  console.log(`✅ Created ${posts.length} posts`);

  // Create some follows
  await prisma.follow.create({
    data: {
      followerId: user1.id,
      followingId: user2.id,
    },
  });

  await prisma.follow.create({
    data: {
      followerId: user1.id,
      followingId: user3.id,
    },
  });

  await prisma.follow.create({
    data: {
      followerId: user2.id,
      followingId: user1.id,
    },
  });

  await prisma.follow.create({
    data: {
      followerId: user3.id,
      followingId: user1.id,
    },
  });

  console.log("✅ Created follow relationships");

  // Create some likes
  await prisma.like.create({
    data: {
      userId: user2.id,
      postId: post1.id,
    },
  });

  await prisma.like.create({
    data: {
      userId: user3.id,
      postId: post1.id,
    },
  });

  await prisma.like.create({
    data: {
      userId: user1.id,
      postId: post3.id,
    },
  });

  await prisma.like.create({
    data: {
      userId: user1.id,
      postId: post4.id,
    },
  });

  console.log("✅ Created likes");

  // Create some comments
  await prisma.comment.create({
    data: {
      content: "Great work! Looking forward to trying it out 👍",
      userId: user2.id,
      postId: post1.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "Framer Motion is awesome! I've been using it for all my animations lately.",
      userId: user2.id,
      postId: post4.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "This sounds like an amazing project! Can't wait to see the results.",
      userId: user3.id,
      postId: post3.id,
    },
  });

  console.log("✅ Created comments");

  console.log("🎉 Database seeding completed!");
  console.log("\nSample login credentials:");
  console.log("Username: john_doe | Password: password123");
  console.log("Username: jane_smith | Password: password123");
  console.log("Username: mike_wilson | Password: password123");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
