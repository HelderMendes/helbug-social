// import { PrismaClient } from "@prisma/client";

// // PrismaClient is attached to the `globalThis` in development to prevent
// // new connections being created on every hot-reload in Next.js or NestJS.
// const createPrismaClient = () => {
//   return new PrismaClient();
// };

// declare global {
//   // Declare prisma on the global object to cache in development
//   var prismaGlobal: PrismaClient | undefined;
// }

// // Use a global cached instance of PrismaClient in development to prevent
// // multiple instances from being created during hot-reloads
// const prisma = globalThis.prismaGlobal ?? createPrismaClient();

// if (process.env.NODE_ENV !== "production") {
//   globalThis.prismaGlobal = prisma;
// }

// export default prisma;

//02
// import { PrismaClient } from "@prisma/client";

// const prismaClientSingleton = () => {
//   return new PrismaClient();
// };

// declare global {
//   var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
// }

// const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// export default prisma;

// if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;

//03
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
