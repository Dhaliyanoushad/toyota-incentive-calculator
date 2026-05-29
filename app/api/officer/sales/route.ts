import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import SalesRecord from '@/models/SalesRecord';
import IncentiveSlab from '@/models/IncentiveSlab';
import Settings from '@/models/Settings';
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

// Core Math Engine: Calculate Progressive or Flat Incentive Payouts
export function calculateIncentive(totalCars: number, slabs: any[], mode: 'progressive' | 'flat') {
  if (totalCars <= 0 || slabs.length === 0) {
    return { totalIncentive: 0, nominalRate: 0, breakdown: [] };
  }

  // Ensure slabs are sorted
  const sortedSlabs = [...slabs].sort((a, b) => a.startCount - b.startCount);
  
  let totalIncentive = 0;
  let nominalRate = 0;
  const breakdown: { slabRange: string; count: number; rate: number; subtotal: number }[] = [];

  if (mode === 'flat') {
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

    nominalRate = activeSlab.rate;
    totalIncentive = totalCars * nominalRate;
    breakdown.push({
      slabRange: `${activeSlab.startCount}${activeSlab.endCount ? '-' + activeSlab.endCount : '+'}`,
      count: totalCars,
      rate: nominalRate,
      subtotal: totalIncentive
    });
  } else {
    // Progressive (step-wise) mode
    for (const slab of sortedSlabs) {
      const start = slab.startCount;
      const end = slab.endCount !== null ? slab.endCount : Infinity;
      
      // Calculate how many cars fall into this specific slab bracket
      const carsInSlab = Math.max(0, Math.min(end, totalCars) - (start - 1));
      
      if (carsInSlab > 0) {
        const subtotal = carsInSlab * slab.rate;
        totalIncentive += subtotal;
        nominalRate = slab.rate; // record the highest rate hit
        breakdown.push({
          slabRange: `${start}${slab.endCount ? '-' + slab.endCount : '+'}`,
          count: carsInSlab,
          rate: slab.rate,
          subtotal
        });
      }
    }
  }

  return { totalIncentive, nominalRate, breakdown };
}

export async function POST(req: Request) {
  try {
    const officer = await verifyOfficer();
    if (!officer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const { month, year, sales, previewOnly } = await req.json();

    if (!month || !year || !Array.isArray(sales)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Calculate total cars sold
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

    // 2. Fetch Active Slabs and Settings
    const slabs = await IncentiveSlab.find({}).sort({ startCount: 1 });
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({ calculationMode: 'progressive' });
    }

    // 3. Compute final incentive
    const calcResult = calculateIncentive(totalCars, slabs, settings.calculationMode);

    if (previewOnly) {
      return NextResponse.json({
        preview: {
          totalCars,
          calculationMode: settings.calculationMode,
          ...calcResult
        }
      });
    }

    // 4. Save or Upsert Sales Record
    const query = { officerId: officer.userId, month, year };
    const update = {
      sales: cleanSales,
      totalCars,
      incentiveRate: calcResult.nominalRate,
      totalIncentive: calcResult.totalIncentive
    };

    const record = await SalesRecord.findOneAndUpdate(query, update, {
      new: true,
      upsert: true
    }).populate('sales.modelId');

    return NextResponse.json({
      message: 'Monthly sales record submitted successfully',
      record,
      breakdown: calcResult.breakdown,
      calculationMode: settings.calculationMode
    });

  } catch (error: any) {
    console.error('Submit sales error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
