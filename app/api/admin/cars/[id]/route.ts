import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import CarModel from '@/models/CarModel';

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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();
    const { modelName, baseSuffix, variant, isActive } = await req.json();

    const car = await CarModel.findById(id);
    if (!car) {
      return NextResponse.json({ error: 'Car model not found' }, { status: 404 });
    }

    if (modelName !== undefined) car.modelName = modelName;
    if (baseSuffix !== undefined) car.baseSuffix = baseSuffix;
    if (variant !== undefined) car.variant = variant;
    if (isActive !== undefined) car.isActive = isActive;

    await car.save();

    return NextResponse.json({ message: 'Car model updated successfully', car });
  } catch (error: any) {
    console.error('Update car error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();

    const result = await CarModel.findByIdAndDelete(id);
    if (!result) {
      return NextResponse.json({ error: 'Car model not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Car model deleted successfully' });
  } catch (error: any) {
    console.error('Delete car error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
