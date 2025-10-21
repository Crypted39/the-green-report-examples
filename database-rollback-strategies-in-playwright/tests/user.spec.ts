import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

test.beforeEach(async () => {
  await prisma.$executeRaw`BEGIN`;
});

test.afterEach(async () => {
  await prisma.$executeRaw`ROLLBACK`;
});

test("creates user successfully", async () => {
  const user = await prisma.user.create({
    data: {
      email: "test@example.com",
      name: "Test User",
    },
  });

  expect(user.id).toBeDefined();
  expect(user.email).toBe("test@example.com");
});

test("finds created user", async () => {
  await prisma.user.create({
    data: {
      email: "findme@example.com",
      name: "Find Me",
    },
  });

  const found = await prisma.user.findUnique({
    where: { email: "findme@example.com" },
  });

  expect(found).not.toBeNull();
  expect(found.name).toBe("Find Me");
});

test("updates user", async () => {
  const user = await prisma.user.create({
    data: {
      email: "update@example.com",
      name: "Original Name",
    },
  });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name: "New Name" },
  });

  expect(updated.name).toBe("New Name");
});
