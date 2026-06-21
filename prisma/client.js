/** Shared PrismaClient singleton -- import this instead of creating new instances. */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
