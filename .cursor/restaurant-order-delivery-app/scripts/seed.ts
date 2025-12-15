/**
 * Database Seed Script
 * Seeds demo data for development and demo mode
 * 
 * Run with: npm run db:seed
 * Or: tsx scripts/seed.ts
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data (optional - be careful in production)
  if (process.env.NODE_ENV !== 'production') {
    console.log('Clearing existing data...')
    // Delete in correct order (respecting foreign keys)
    await prisma.orderModifier.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.giftCardTransaction.deleteMany()
    await prisma.giftCard.deleteMany()
    await prisma.couponUsage.deleteMany()
    await prisma.coupon.deleteMany()
    await prisma.loyaltyPoint.deleteMany()
    await prisma.rating.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.delivery.deleteMany()
    await prisma.address.deleteMany()
    await prisma.paymentMethod.deleteMany()
    await prisma.menuItemModifier.deleteMany()
    await prisma.modifierOption.deleteMany()
    await prisma.modifier.deleteMany()
    await prisma.menuItem.deleteMany()
    await prisma.menuCategory.deleteMany()
    await prisma.userRole.deleteMany()
    await prisma.user.deleteMany()
    await prisma.role.deleteMany()
    await prisma.restaurantSettings.deleteMany()
    await prisma.deliveryZone.deleteMany()
  }

  // Create Roles
  console.log('Creating roles...')
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Full system access',
      permissions: ['*']
    }
  })

  const managerRole = await prisma.role.upsert({
    where: { name: 'MANAGER' },
    update: {},
    create: {
      name: 'MANAGER',
      description: 'All access except permissions',
      permissions: ['orders:*', 'menu:*', 'staff:*', 'analytics:*']
    }
  })

  const staffRole = await prisma.role.upsert({
    where: { name: 'STAFF' },
    update: {},
    create: {
      name: 'STAFF',
      description: 'Order management and POS access',
      permissions: ['orders:view', 'orders:update', 'pos:*', 'gift-cards:create']
    }
  })

  const driverRole = await prisma.role.upsert({
    where: { name: 'DRIVER' },
    update: {},
    create: {
      name: 'DRIVER',
      description: 'Delivery management',
      permissions: ['deliveries:view', 'deliveries:update', 'deliveries:accept']
    }
  })

  const customerRole = await prisma.role.upsert({
    where: { name: 'CUSTOMER' },
    update: {},
    create: {
      name: 'CUSTOMER',
      description: 'Customer access',
      permissions: ['orders:create', 'orders:view:own', 'account:*']
    }
  })

  // Hash password for demo accounts
  const hashedPassword = await bcrypt.hash('demo123', 12)

  // Create Demo Users
  console.log('Creating demo users...')
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      emailVerified: true,
      roles: {
        create: {
          roleId: adminRole.id
        }
      }
    }
  })

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@demo.com' },
    update: {},
    create: {
      email: 'manager@demo.com',
      passwordHash: hashedPassword,
      firstName: 'Manager',
      lastName: 'User',
      emailVerified: true,
      roles: {
        create: {
          roleId: managerRole.id
        }
      }
    }
  })

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@demo.com' },
    update: {},
    create: {
      email: 'staff@demo.com',
      passwordHash: hashedPassword,
      firstName: 'Staff',
      lastName: 'User',
      emailVerified: true,
      roles: {
        create: {
          roleId: staffRole.id
        }
      }
    }
  })

  const driverUser = await prisma.user.upsert({
    where: { email: 'driver@demo.com' },
    update: {},
    create: {
      email: 'driver@demo.com',
      passwordHash: hashedPassword,
      firstName: 'Driver',
      lastName: 'User',
      phone: '+1234567890',
      emailVerified: true,
      roles: {
        create: {
          roleId: driverRole.id
        }
      }
    }
  })

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@demo.com' },
    update: {},
    create: {
      email: 'customer@demo.com',
      passwordHash: hashedPassword,
      firstName: 'Customer',
      lastName: 'User',
      phone: '+1234567891',
      emailVerified: true,
      roles: {
        create: {
          roleId: customerRole.id
        }
      }
    }
  })

  // Create Restaurant Settings
  console.log('Creating restaurant settings...')
  const restaurantSettings = await prisma.restaurantSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'Demo Restaurant',
      description: 'A demo restaurant showcasing the ordering system',
      phone: '+1234567890',
      email: 'info@demorestaurant.com',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'US',
      latitude: 40.7128,
      longitude: -74.0060,
      hoursMonday: { open: '11:00', close: '22:00' },
      hoursTuesday: { open: '11:00', close: '22:00' },
      hoursWednesday: { open: '11:00', close: '22:00' },
      hoursThursday: { open: '11:00', close: '22:00' },
      hoursFriday: { open: '11:00', close: '23:00' },
      hoursSaturday: { open: '11:00', close: '23:00' },
      hoursSunday: { open: '12:00', close: '21:00' },
      minOrderAmount: 10.00,
      maxDeliveryDistance: 10.0,
      defaultPrepTime: 20,
      taxRate: 0.0825,
      demoMode: true,
      setupWizardEnabled: false
    }
  })

  // Create Delivery Zones
  console.log('Creating delivery zones...')
  const zone1 = await prisma.deliveryZone.create({
    data: {
      name: 'Zone 1 - Close',
      description: 'Within 2 miles',
      radius: 2.0,
      deliveryFee: 0.00,
      freeDeliveryThreshold: 25.00,
      order: 1
    }
  })

  const zone2 = await prisma.deliveryZone.create({
    data: {
      name: 'Zone 2 - Medium',
      description: '2-5 miles',
      radius: 5.0,
      deliveryFee: 3.00,
      freeDeliveryThreshold: 50.00,
      order: 2
    }
  })

  const zone3 = await prisma.deliveryZone.create({
    data: {
      name: 'Zone 3 - Far',
      description: '5-10 miles',
      radius: 10.0,
      deliveryFee: 5.00,
      freeDeliveryThreshold: 75.00,
      order: 3
    }
  })

  // Create Menu Categories
  console.log('Creating menu categories...')
  const appetizers = await prisma.menuCategory.create({
    data: {
      name: 'Appetizers',
      description: 'Start your meal right',
      order: 1,
      availableTimes: [
        { start: '11:00', end: '14:00' },
        { start: '17:00', end: '22:00' }
      ]
    }
  })

  const entrees = await prisma.menuCategory.create({
    data: {
      name: 'Entrees',
      description: 'Main courses',
      order: 2,
      availableTimes: [
        { start: '11:00', end: '14:00' },
        { start: '17:00', end: '22:00' }
      ]
    }
  })

  const desserts = await prisma.menuCategory.create({
    data: {
      name: 'Desserts',
      description: 'Sweet endings',
      order: 3,
      availableTimes: [
        { start: '11:00', end: '22:00' }
      ]
    }
  })

  // Create Modifiers
  console.log('Creating modifiers...')
  const sizeModifier = await prisma.modifier.create({
    data: {
      name: 'Size',
      type: 'SINGLE_CHOICE',
      required: true,
      options: {
        create: [
          { name: 'Small', price: 0.00, order: 1 },
          { name: 'Medium', price: 2.00, order: 2 },
          { name: 'Large', price: 4.00, order: 3 }
        ]
      }
    }
  })

  const toppingsModifier = await prisma.modifier.create({
    data: {
      name: 'Toppings',
      type: 'MULTIPLE_CHOICE',
      required: false,
      minSelections: 0,
      maxSelections: 5,
      options: {
        create: [
          { name: 'Extra Cheese', price: 1.50, order: 1 },
          { name: 'Pepperoni', price: 1.50, order: 2 },
          { name: 'Mushrooms', price: 1.00, order: 3 },
          { name: 'Olives', price: 1.00, order: 4 },
          { name: 'Onions', price: 0.50, order: 5 }
        ]
      }
    }
  })

  // Create Menu Items
  console.log('Creating menu items...')
  const mozzSticks = await prisma.menuItem.create({
    data: {
      categoryId: appetizers.id,
      name: 'Mozzarella Sticks',
      description: 'Crispy fried mozzarella with your choice of sauce',
      price: 8.99,
      featured: true,
      dietaryTags: ['vegetarian'],
      allergens: ['dairy', 'gluten'],
      calories: 320,
      modifiers: {
        create: {
          modifierId: toppingsModifier.id,
          required: false,
          order: 1
        }
      }
    }
  })

  const pizza = await prisma.menuItem.create({
    data: {
      categoryId: entrees.id,
      name: 'Margherita Pizza',
      description: 'Classic pizza with tomato, mozzarella, and basil',
      price: 14.99,
      popular: true,
      dietaryTags: ['vegetarian'],
      allergens: ['dairy', 'gluten'],
      calories: 280,
      modifiers: {
        create: [
          {
            modifierId: sizeModifier.id,
            required: true,
            order: 1
          },
          {
            modifierId: toppingsModifier.id,
            required: false,
            order: 2
          }
        ]
      }
    }
  })

  const cheesecake = await prisma.menuItem.create({
    data: {
      categoryId: desserts.id,
      name: 'New York Cheesecake',
      description: 'Creamy classic cheesecake',
      price: 6.99,
      dietaryTags: ['vegetarian'],
      allergens: ['dairy', 'eggs', 'gluten'],
      calories: 450
    }
  })

  // Create Demo Coupon
  console.log('Creating demo coupon...')
  await prisma.coupon.create({
    data: {
      code: 'DEMO10',
      name: 'Demo 10% Off',
      description: '10% off your order',
      type: 'PERCENTAGE',
      value: 10.00,
      minOrderAmount: 20.00,
      maxDiscount: 10.00,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      usageLimit: 1000
    }
  })

  console.log('✅ Database seed complete!')
  console.log('\nDemo Accounts:')
  console.log('  Admin: admin@demo.com / demo123')
  console.log('  Manager: manager@demo.com / demo123')
  console.log('  Staff: staff@demo.com / demo123')
  console.log('  Driver: driver@demo.com / demo123')
  console.log('  Customer: customer@demo.com / demo123')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

