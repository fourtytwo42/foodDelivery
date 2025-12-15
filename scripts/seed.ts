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
    await prisma.menuItemModifier.deleteMany()
    await prisma.modifierOption.deleteMany()
    await prisma.modifier.deleteMany()
    await prisma.menuItem.deleteMany()
    await prisma.menuCategory.deleteMany()
    await prisma.userRole.deleteMany()
    await prisma.user.deleteMany()
    await prisma.role.deleteMany()
    await prisma.restaurantSettings.deleteMany()
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

  // Create Menu Categories
  console.log('Creating menu categories...')
  const appetizers = await prisma.menuCategory.create({
    data: {
      name: 'Appetizers',
      description: 'Start your meal right',
      order: 1,
      availableTimes: [
        { start: '11:00', end: '14:00' },
        { start: '17:00', end: '22:00' },
      ],
    },
  })

  const entrees = await prisma.menuCategory.create({
    data: {
      name: 'Entrees',
      description: 'Main courses',
      order: 2,
      availableTimes: [
        { start: '11:00', end: '14:00' },
        { start: '17:00', end: '22:00' },
      ],
    },
  })

  const desserts = await prisma.menuCategory.create({
    data: {
      name: 'Desserts',
      description: 'Sweet endings',
      order: 3,
      availableTimes: [{ start: '11:00', end: '22:00' }],
    },
  })

  const drinks = await prisma.menuCategory.create({
    data: {
      name: 'Drinks',
      description: 'Beverages and refreshments',
      order: 4,
      availableTimes: [{ start: '11:00', end: '22:00' }],
    },
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
          { name: 'Small', price: 0.0, order: 1 },
          { name: 'Medium', price: 2.0, order: 2 },
          { name: 'Large', price: 4.0, order: 3 },
        ],
      },
    },
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
          { name: 'Extra Cheese', price: 1.5, order: 1 },
          { name: 'Pepperoni', price: 1.5, order: 2 },
          { name: 'Mushrooms', price: 1.0, order: 3 },
          { name: 'Olives', price: 1.0, order: 4 },
          { name: 'Onions', price: 0.5, order: 5 },
          { name: 'Bell Peppers', price: 0.5, order: 6 },
        ],
      },
    },
  })

  const sauceModifier = await prisma.modifier.create({
    data: {
      name: 'Sauce',
      type: 'SINGLE_CHOICE',
      required: false,
      options: {
        create: [
          { name: 'Marinara', price: 0.0, order: 1 },
          { name: 'Ranch', price: 0.0, order: 2 },
          { name: 'BBQ', price: 0.0, order: 3 },
          { name: 'Garlic Butter', price: 0.5, order: 4 },
        ],
      },
    },
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
          modifierId: sauceModifier.id,
          required: false,
          order: 1,
        },
      },
    },
  })

  const wings = await prisma.menuItem.create({
    data: {
      categoryId: appetizers.id,
      name: 'Buffalo Wings',
      description: 'Spicy buffalo wings with celery and ranch',
      price: 12.99,
      popular: true,
      allergens: ['dairy'],
      calories: 450,
      spiceLevel: 3,
      modifiers: {
        create: {
          modifierId: sauceModifier.id,
          required: false,
          order: 1,
        },
      },
    },
  })

  const nachos = await prisma.menuItem.create({
    data: {
      categoryId: appetizers.id,
      name: 'Loaded Nachos',
      description: 'Tortilla chips topped with cheese, jalapeños, and sour cream',
      price: 10.99,
      dietaryTags: ['vegetarian'],
      allergens: ['dairy', 'gluten'],
      calories: 520,
    },
  })

  const pizza = await prisma.menuItem.create({
    data: {
      categoryId: entrees.id,
      name: 'Margherita Pizza',
      description: 'Classic pizza with tomato, mozzarella, and basil',
      price: 14.99,
      popular: true,
      featured: true,
      dietaryTags: ['vegetarian'],
      allergens: ['dairy', 'gluten'],
      calories: 280,
      modifiers: {
        create: [
          {
            modifierId: sizeModifier.id,
            required: true,
            order: 1,
          },
          {
            modifierId: toppingsModifier.id,
            required: false,
            order: 2,
          },
        ],
      },
    },
  })

  const burger = await prisma.menuItem.create({
    data: {
      categoryId: entrees.id,
      name: 'Classic Burger',
      description: 'Beef patty with lettuce, tomato, onion, and pickles',
      price: 11.99,
      popular: true,
      allergens: ['gluten'],
      calories: 650,
      modifiers: {
        create: {
          modifierId: toppingsModifier.id,
          required: false,
          order: 1,
        },
      },
    },
  })

  const pasta = await prisma.menuItem.create({
    data: {
      categoryId: entrees.id,
      name: 'Spaghetti Carbonara',
      description: 'Creamy pasta with bacon and parmesan',
      price: 13.99,
      dietaryTags: ['contains meat'],
      allergens: ['dairy', 'gluten', 'eggs'],
      calories: 580,
    },
  })

  const cheesecake = await prisma.menuItem.create({
    data: {
      categoryId: desserts.id,
      name: 'New York Cheesecake',
      description: 'Creamy classic cheesecake',
      price: 6.99,
      dietaryTags: ['vegetarian'],
      allergens: ['dairy', 'eggs', 'gluten'],
      calories: 450,
    },
  })

  const brownie = await prisma.menuItem.create({
    data: {
      categoryId: desserts.id,
      name: 'Chocolate Brownie Sundae',
      description: 'Warm brownie with vanilla ice cream and hot fudge',
      price: 7.99,
      featured: true,
      dietaryTags: ['vegetarian'],
      allergens: ['dairy', 'eggs', 'gluten'],
      calories: 520,
    },
  })

  const coke = await prisma.menuItem.create({
    data: {
      categoryId: drinks.id,
      name: 'Coca-Cola',
      description: 'Classic cola',
      price: 2.49,
      dietaryTags: ['vegan'],
      calories: 140,
      modifiers: {
        create: {
          modifierId: sizeModifier.id,
          required: true,
          order: 1,
        },
      },
    },
  })

  const lemonade = await prisma.menuItem.create({
    data: {
      categoryId: drinks.id,
      name: 'Fresh Lemonade',
      description: 'Homemade lemonade',
      price: 3.49,
      dietaryTags: ['vegetarian', 'vegan'],
      calories: 120,
      modifiers: {
        create: {
          modifierId: sizeModifier.id,
          required: true,
          order: 1,
        },
      },
    },
  })

  // ============================================
  // GIFT CARDS (Stage 7)
  // ============================================
  console.log('Creating gift cards...')
  const { giftCardService } = await import('../services/gift-card-service')

  const demoGiftCard1 = await giftCardService.createGiftCard({
    code: 'DEMO-GC-100',
    originalBalance: 50.0,
    purchasedBy: customerUser.id,
  })

  const demoGiftCard2 = await giftCardService.createGiftCard({
    code: 'DEMO-GC-25',
    originalBalance: 25.0,
  })

  console.log(`✅ Created gift card: ${demoGiftCard1.code}`)
  console.log(`✅ Created gift card: ${demoGiftCard2.code}`)

  // ============================================
  // COUPONS (Stage 7)
  // ============================================
  console.log('Creating coupons...')
  const { couponService } = await import('../services/coupon-service')

  const tenPercentOff = await couponService.createCoupon({
    code: 'SAVE10',
    name: '10% Off',
    description: 'Get 10% off your order',
    type: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: 20.0,
    maxDiscountAmount: 10.0,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    createdBy: adminUser.id,
  })

  const fiveDollarsOff = await couponService.createCoupon({
    code: 'SAVE5',
    name: '$5 Off',
    description: 'Get $5 off orders over $25',
    type: 'FIXED',
    discountValue: 5.0,
    minOrderAmount: 25.0,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    createdBy: adminUser.id,
  })

  const freeShipping = await couponService.createCoupon({
    code: 'FREESHIP',
    name: 'Free Shipping',
    description: 'Free delivery on your order',
    type: 'FREE_SHIPPING',
    minOrderAmount: 30.0,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    createdBy: adminUser.id,
  })

  console.log(`✅ Created coupon: ${tenPercentOff.code}`)
  console.log(`✅ Created coupon: ${fiveDollarsOff.code}`)
  console.log(`✅ Created coupon: ${freeShipping.code}`)

  // ============================================
  // LOYALTY SETUP (Stage 7)
  // ============================================
  console.log('Setting up loyalty accounts...')
  const { loyaltyService } = await import('../services/loyalty-service')

  // Enable loyalty points in settings
  await prisma.restaurantSettings.update({
    where: { id: 'default' },
    data: {
      enableLoyaltyPoints: true,
      loyaltyPointsPerDollar: 0.5, // 0.5 points per dollar
      loyaltyPointsForFree: 100, // 100 points = $1
    },
  })

  // Create loyalty account for demo customer with some points
  const loyaltyAccount = await loyaltyService.getOrCreateAccount(customerUser.id)
  await loyaltyService.adjustPoints(
    customerUser.id,
    250, // Give 250 points
    'ADJUSTED',
    'Demo account bonus points'
  )

  console.log(`✅ Created loyalty account for ${customerUser.email} with 250 points`)

  console.log('✅ Database seed complete!')
  console.log('\nDemo Accounts:')
  console.log('  Admin: admin@demo.com / demo123')
  console.log('  Manager: manager@demo.com / demo123')
  console.log('  Staff: staff@demo.com / demo123')
  console.log('  Driver: driver@demo.com / demo123')
  console.log('  Customer: customer@demo.com / demo123')
  console.log('\nMenu:')
  console.log('  - 4 Categories (Appetizers, Entrees, Desserts, Drinks)')
  console.log('  - 10 Menu Items with modifiers')
  console.log('  - 3 Modifiers (Size, Toppings, Sauce)')
  console.log('\nPromotions:')
  console.log('  - Gift Cards: DEMO-GC-100 ($50), DEMO-GC-25 ($25)')
  console.log('  - Coupons: SAVE10 (10% off), SAVE5 ($5 off), FREESHIP (Free shipping)')
  console.log('  - Loyalty: Customer account has 250 points')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
