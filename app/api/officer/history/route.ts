import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import SalesRecord from '@/models/SalesRecord';
import CarModel from '@/models/CarModel';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-toyota-portal-key-change-this-in-production';

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

export async function GET() {
  try {
    const officer = await verifyOfficer();
    if (!officer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    // Prevent Turbopack from tree-shaking the imported CarModel module
    // which is needed for .populate('sales.modelId') to succeed.
    const _dummyCarModel = CarModel;
    
    // Find all sales records for the officer, populating car model details
    const records = await SalesRecord.find({ officerId: officer.userId })
      .populate('sales.modelId')
      .sort({ year: -1, month: -1 });

    return NextResponse.json({ records });
  } catch (error: any) {
    console.error('Fetch sales history error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
