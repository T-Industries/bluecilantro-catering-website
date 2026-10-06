// Loads the transcribed restaurant menus and creates the super admin.
// Re-running replaces each restaurant's menu (categories/items) but keeps orders and admin users.
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import batonRouge from './menus/baton-rouge.js'
import wendelClarks from './menus/wendel-clarks.js'
import lionsDen from './menus/lions-den.js'
import festive from './menus/festive.js'
import { categoryBanner, itemPhoto } from './menus/images.js'

const prisma = new PrismaClient()
const RESTAURANTS = [batonRouge, wendelClarks, lionsDen, festive]

async function seedRestaurant({ categories, ...info }) {
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: info.slug },
    update: info,
    create: info,
  })
  await prisma.menuCategory.deleteMany({ where: { restaurantId: restaurant.id } })

  let itemCount = 0
  for (const [ci, cat] of categories.entries()) {
    await prisma.menuCategory.create({
      data: {
        restaurantId: restaurant.id,
        name: cat.name,
        description: cat.description ?? null,
        imageUrl: cat.imageUrl ?? categoryBanner(info.slug, cat.name),
        displayOrder: ci,
        items: {
          create: cat.items.map(({ variants = [], optionGroups = [], ...item }, ii) => ({
            ...item,
            imageUrl: item.imageUrl ?? itemPhoto(info.slug, item.name),
            variants: JSON.stringify(variants),
            optionGroups: JSON.stringify(optionGroups),
            displayOrder: ii,
          })),
        },
      },
    })
    itemCount += cat.items.length
  }
  console.log(`  ✓ ${restaurant.name}: ${categories.length} categories, ${itemCount} items`)
}

async function seedAdmin() {
  const email = (process.env.SUPER_ADMIN_EMAIL || 'admin@bluecilantro.ca').toLowerCase()
  const password = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe123!'
  const existing = await prisma.adminUser.findUnique({ where: { email } })
  if (existing) {
    console.log(`  ✓ Super admin ${email} already exists (password unchanged)`)
    return
  }
  await prisma.adminUser.create({
    data: { email, name: 'BlueCilantro Admin', role: 'super', passwordHash: await bcrypt.hash(password, 10) },
  })
  console.log(`  ✓ Super admin created: ${email}`)
}

async function main() {
  console.log('Seeding restaurants...')
  for (const r of RESTAURANTS) await seedRestaurant(r)
  console.log('Seeding admin...')
  await seedAdmin()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
