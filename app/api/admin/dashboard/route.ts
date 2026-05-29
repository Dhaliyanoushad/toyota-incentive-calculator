import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import CarModel from '@/models/CarModel';
import IncentiveSlab from '@/models/IncentiveSlab';
import SalesRecord from '@/models/SalesRecord';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-toyota-portal-key-change-this-in-production';

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return false;
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded.role === 'admin';
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // Prevent Turbopack from tree-shaking the imported CarModel module
    // which is needed for .populate('sales.modelId') to succeed.
    const _dummyCarModel = CarModel;

    // 1. Core KPIs
    const totalOfficers = await User.countDocuments({ role: 'officer' });
    const activeSlabsCount = await IncentiveSlab.countDocuments({});

    const salesStats = await SalesRecord.aggregate([
      {
        $group: {
          _id: null,
          totalCars: { $sum: '$totalCars' },
          totalIncentive: { $sum: '$totalIncentive' }
        }
      }
    ]);

    const totalCarsSold = salesStats[0]?.totalCars || 0;
    const totalIncentivePaid = salesStats[0]?.totalIncentive || 0;

    // 2. Fetch all sales records with populate for full analytics logs
    const allRecords = await SalesRecord.find({})
      .populate('officerId', 'name email')
      .populate('sales.modelId')
      .sort({ year: -1, month: -1 });

    // 3. Monthly Sales and Payouts Trend Chart Data
    const monthlyTrend = await SalesRecord.aggregate([
      {
        $group: {
          _id: { year: '$year', month: '$month' },
          carsSold: { $sum: '$totalCars' },
          incentivePaid: { $sum: '$totalIncentive' }
        }
      },
      {
        $project: {
          _id: 0,
          period: { $concat: [ '$_id.month', '/', { $toString: '$_id.year' } ] },
          sortKey: { $concat: [ { $toString: '$_id.year' }, '-', '$_id.month' ] },
          carsSold: 1,
          incentivePaid: 1
        }
      },
      { $sort: { sortKey: 1 } }
    ]);

    // 4. Sales Officer Leaderboard (Incentive Distribution)
    const officerLeaderboard = await SalesRecord.aggregate([
      {
        $group: {
          _id: '$officerId',
          totalCars: { $sum: '$totalCars' },
          totalIncentives: { $sum: '$totalIncentive' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'officerDetails'
        }
      },
      { $unwind: '$officerDetails' },
      {
        $project: {
          _id: 1,
          name: '$officerDetails.name',
          email: '$officerDetails.email',
          totalCars: 1,
          totalIncentives: 1
        }
      },
      { $sort: { totalIncentives: -1 } }
    ]);

    // 5. Car Model Performance Breakdown
    const carModelBreakdown = await SalesRecord.aggregate([
      { $unwind: '$sales' },
      {
        $group: {
          _id: '$sales.modelId',
          quantitySold: { $sum: '$sales.quantity' }
        }
      },
      {
        $lookup: {
          from: 'carmodels',
          localField: '_id',
          foreignField: '_id',
          as: 'carDetails'
        }
      },
      { $unwind: { path: '$carDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          modelName: { $ifNull: [ '$carDetails.modelName', 'Unknown Model' ] },
          baseSuffix: { $ifNull: [ '$carDetails.baseSuffix', '' ] },
          variant: { $ifNull: [ '$carDetails.variant', '' ] },
          quantitySold: 1
        }
      },
      { $sort: { quantitySold: -1 } }
    ]);

    return NextResponse.json({
      kpis: {
        totalOfficers,
        totalCarsSold,
        totalIncentivePaid,
        activeSlabsCount
      },
      records: allRecords,
      charts: {
        monthlyTrend,
        officerLeaderboard,
        carModelBreakdown
      }
    });

  } catch (error: any) {
    console.error('Fetch dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
