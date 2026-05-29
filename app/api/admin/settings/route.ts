import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import Settings from '@/models/Settings';

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
    await dbConnect();
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({ calculationMode: 'progressive' });
    }
    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const { calculationMode } = await req.json();

    if (calculationMode !== 'progressive' && calculationMode !== 'flat') {
      return NextResponse.json({ error: 'Invalid calculation mode' }, { status: 400 });
    }

    let settings = await Settings.findOne({});
    if (!settings) {
      settings = new Settings({ calculationMode });
    } else {
      settings.calculationMode = calculationMode;
    }

    await settings.save();
    return NextResponse.json({ message: 'Settings updated successfully', settings });

  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
