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
