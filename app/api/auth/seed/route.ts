import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import CarModel from '@/models/CarModel';
import IncentiveSlab from '@/models/IncentiveSlab';
import SalesRecord from '@/models/SalesRecord';
import Settings from '@/models/Settings';

export async function POST() {
  try {
    await dbConnect();

    // 1. Clear Existing Data
    await User.deleteMany({});
    await CarModel.deleteMany({});
    await IncentiveSlab.deleteMany({});
    await SalesRecord.deleteMany({});
    await Settings.deleteMany({});

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash('toyota', 10);

    // 3. Create Users
    const admin = await User.create({
      name: 'Toyota Administrator',
      email: 'admin@toyota.in',
      password: hashedPassword,
      role: 'admin'
    });

    const officer1 = await User.create({
      name: 'John Doe',
      email: 'officer1@toyota.in',
      password: hashedPassword,
      role: 'officer'
    });

    const officer2 = await User.create({
      name: 'Jane Smith',
      email: 'officer2@toyota.in',
      password: hashedPassword,
      role: 'officer'
    });

    // 4. Create Car Inventory
    const car1 = await CarModel.create({
      modelName: 'Toyota Corolla',
      baseSuffix: 'LE',
      variant: 'Hybrid',
      isActive: true
    });

    const car2 = await CarModel.create({
      modelName: 'Toyota Camry',
      baseSuffix: 'SE',
      variant: 'Gas',
      isActive: true
    });

    const car3 = await CarModel.create({
      modelName: 'Toyota RAV4',
      baseSuffix: 'XLE',
      variant: 'AWD Hybrid',
      isActive: true
    });

    const car4 = await CarModel.create({
      modelName: 'Toyota Tacoma',
      baseSuffix: 'TRD',
      variant: '4WD Double Cab',
      isActive: true
    });

    // 5. Create default Slabs (1-3: ₹1000, 4-7: ₹2000, 8+: ₹3500)
    await IncentiveSlab.create([
      { startCount: 1, endCount: 3, rate: 1000 },
      { startCount: 4, endCount: 7, rate: 2000 },
      { startCount: 8, endCount: null, rate: 3500 }
    ]);

    // 6. Create default Settings
    await Settings.create({
      calculationMode: 'progressive'
    });

    // 7. Seed Historical Sales
    // John Doe's April Sales (Total: 6 cars, rate: 2000)
    // Slabs: 1-3 = 1000, 4-7 = 2000.
    // Progressive: (3 * 1000) + (3 * 2000) = 9000
    await SalesRecord.create({
      officerId: officer1._id,
      month: '04',
      year: 2026,
      sales: [
        { modelId: car1._id, quantity: 2 },
        { modelId: car2._id, quantity: 4 }
      ],
      totalCars: 6,
      incentiveRate: 2000,
      totalIncentive: 9000,
      createdAt: new Date('2026-04-28T10:00:00Z')
    });

    // John Doe's May Sales (Total: 9 cars)
    // Slabs: 1-3 = 1000, 4-7 = 2000, 8+ = 3500
    // Progressive: (3 * 1000) + (4 * 2000) + (2 * 3500) = 3000 + 8000 + 7000 = 18000
    await SalesRecord.create({
      officerId: officer1._id,
      month: '05',
      year: 2026,
      sales: [
        { modelId: car1._id, quantity: 3 },
        { modelId: car2._id, quantity: 2 },
        { modelId: car3._id, quantity: 4 }
      ],
      totalCars: 9,
      incentiveRate: 3500,
      totalIncentive: 18000,
      createdAt: new Date('2026-05-28T12:00:00Z')
    });

    // Jane Smith's May Sales (Total: 3 cars)
    // Progressive: 3 * 1000 = 3000
    await SalesRecord.create({
      officerId: officer2._id,
      month: '05',
      year: 2026,
      sales: [
        { modelId: car1._id, quantity: 1 },
        { modelId: car3._id, quantity: 2 }
      ],
      totalCars: 3,
      incentiveRate: 1000,
      totalIncentive: 3000,
      createdAt: new Date('2026-05-29T09:30:00Z')
    });

    return NextResponse.json({
      message: 'Database seeded successfully',
      seededData: {
        users: 3,
        cars: 4,
        slabs: 3,
        salesRecords: 3,
        settings: 'progressive'
      }
    });

  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
