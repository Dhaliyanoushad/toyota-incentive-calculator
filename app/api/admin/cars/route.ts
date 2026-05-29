import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import CarModel from '@/models/CarModel';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-toyota-portal-key-change-this-in-production';

// Helper to verify admin permissions
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
    await dbConnect();
    // Return all cars, sorted by name
    const cars = await CarModel.find({}).sort({ modelName: 1 });
    return NextResponse.json({ cars });
  } catch (error: any) {
    console.error('Fetch cars error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const { modelName, baseSuffix, variant } = await req.json();

    if (!modelName || !baseSuffix || !variant) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newCar = await CarModel.create({
      modelName,
      baseSuffix,
      variant,
      isActive: true
    });

    return NextResponse.json({ message: 'Car model created successfully', car: newCar });
  } catch (error: any) {
    console.error('Create car error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
