import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import SalesRecord from '@/models/SalesRecord';
import IncentiveSlab from '@/models/IncentiveSlab';
import CarModel from '@/models/CarModel';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-toyota-portal-key-change-this-in-production';

// Helper to verify sales officer
async function verifyOfficer() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'officer') return null;
    return decoded;
  } catch {
    return null;
  }
}

// Core Math Engine: Calculate Flat Rate Incentive Payouts
export function calculateIncentive(totalCars: number, slabs: any[]) {
  if (totalCars <= 0 || slabs.length === 0) {
    return { totalIncentive: 0, nominalRate: 0, breakdown: [] };
  }

  // Ensure slabs are sorted
  const sortedSlabs = [...slabs].sort((a, b) => a.startCount - b.startCount);
  
  // Flat mode: Find the highest slab that covers totalCars
  let activeSlab = sortedSlabs[0];
  for (const slab of sortedSlabs) {
    if (totalCars >= slab.startCount) {
      activeSlab = slab;
    }
  }
  
  // If totalCars is less than first slab's startCount
  if (totalCars < sortedSlabs[0].startCount) {
    return { totalIncentive: 0, nominalRate: 0, breakdown: [] };
  }

  const nominalRate = activeSlab.rate;
  const totalIncentive = totalCars * nominalRate;
  const breakdown = [{
    slabRange: `${activeSlab.startCount}${activeSlab.endCount ? '-' + activeSlab.endCount : '+'}`,
    count: totalCars,
    rate: nominalRate,
    subtotal: totalIncentive
  }];

  return { totalIncentive, nominalRate, breakdown };
}

export async function POST(req: Request) {
  try {
    const officer = await verifyOfficer();
    if (!officer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // Prevent Turbopack from tree-shaking the imported CarModel module
    // which is needed for .populate('sales.modelId') to succeed.
    const _dummyCarModel = CarModel;
    const { month, year, sales, previewOnly, action } = await req.json();

    if (!month || !year || !Array.isArray(sales)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Determine current month/year
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

    // Find existing record
    const query = { officerId: officer.userId, month, year };
    const existingRecord = await SalesRecord.findOne(query);

    // 1. Locked State Check: If submitted, it is frozen.
    if (existingRecord && existingRecord.status === 'submitted') {
      if (previewOnly) {
        return NextResponse.json({
          preview: {
            totalCars: existingRecord.totalCars,
            calculationMode: 'flat',
            totalIncentive: existingRecord.totalIncentive,
            nominalRate: existingRecord.incentiveRate,
            breakdown: [{
              slabRange: 'Locked',
              count: existingRecord.totalCars,
              rate: existingRecord.incentiveRate,
              subtotal: existingRecord.totalIncentive
            }],
            isLocked: true
          }
        });
      } else {
        return NextResponse.json(
          { error: 'This month is locked and cannot be modified.' },
          { status: 400 }
        );
      }
    }

    // 2. Current Month Check: Only current month can be saved/submitted
    if (!previewOnly) {
      if (Number(year) !== currentYear || month !== currentMonth) {
        return NextResponse.json(
          { error: 'Only the current month can be edited.' },
          { status: 400 }
        );
      }
    }

    // 3. Calculate total cars sold
    let totalCars = 0;
    const cleanSales: { modelId: string; quantity: number }[] = [];

    for (const item of sales) {
      const qty = Math.max(0, Number(item.quantity) || 0);
      if (qty > 0) {
        totalCars += qty;
        cleanSales.push({
          modelId: item.modelId,
          quantity: qty
        });
      }
    }

    // 4. Fetch Active Slabs
    const slabs = await IncentiveSlab.find({}).sort({ startCount: 1 });

    // 5. Compute final incentive
    const calcResult = calculateIncentive(totalCars, slabs);

    if (previewOnly) {
      return NextResponse.json({
        preview: {
          totalCars,
          calculationMode: 'flat',
          ...calcResult,
          isLocked: false
        }
      });
    }

    // 6. Save Draft vs Submit
    const isSubmit = action === 'submit';
    const update = {
      sales: cleanSales,
      totalCars,
      incentiveRate: calcResult.nominalRate,
      totalIncentive: calcResult.totalIncentive,
      status: isSubmit ? 'submitted' : 'draft',
      ...(isSubmit ? { submittedAt: new Date() } : {})
    };

    const record = await SalesRecord.findOneAndUpdate(query, update, {
      new: true,
      upsert: true
    }).populate('sales.modelId');

    return NextResponse.json({
      message: isSubmit ? 'Monthly sales record submitted and locked successfully' : 'Draft saved successfully',
      record,
      breakdown: calcResult.breakdown,
      calculationMode: 'flat'
    });

  } catch (error: any) {
    console.error('Submit sales error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
