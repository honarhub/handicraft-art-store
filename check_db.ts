import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const msgs = await prisma.supportMessage.findMany()
  console.log(msgs)
}
main()
