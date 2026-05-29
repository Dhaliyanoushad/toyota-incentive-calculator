import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import IncentiveSlab from '@/models/IncentiveSlab';

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
    const slabs = await IncentiveSlab.find({}).sort({ startCount: 1 });
    return NextResponse.json({ slabs });
  } catch (error: any) {
    console.error('Fetch slabs error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!(await verifyAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const { slabs } = await req.json(); // Array of { startCount, endCount, rate }

    if (!Array.isArray(slabs) || slabs.length === 0) {
      return NextResponse.json({ error: 'Slabs array is required' }, { status: 400 });
    }

    // Sort slabs by startCount to be sure
    const sortedSlabs = [...slabs].sort((a, b) => a.startCount - b.startCount);

    // Dynamic Slabs Validation Engine
    for (let i = 0; i < sortedSlabs.length; i++) {
      const slab = sortedSlabs[i];
      const start = Number(slab.startCount);
      const end = slab.endCount !== null ? Number(slab.endCount) : null;
      const rate = Number(slab.rate);

      if (isNaN(start) || start <= 0) {
        return NextResponse.json({ error: `Slab ${i + 1} has an invalid start count.` }, { status: 400 });
      }
      if (isNaN(rate) || rate < 0) {
        return NextResponse.json({ error: `Slab ${i + 1} has an invalid incentive rate.` }, { status: 400 });
      }

      if (end !== null) {
        if (end < start) {
          return NextResponse.json({ error: `Slab ${i + 1} end count (${end}) cannot be less than start count (${start}).` }, { status: 400 });
        }
      }

      // Check sequencing
      if (i > 0) {
        const prevSlab = sortedSlabs[i - 1];
        if (prevSlab.endCount === null) {
          return NextResponse.json({ error: `Slab ${i} has an open-ended upper limit, so Slab ${i + 1} is unreachable.` }, { status: 400 });
        }
        if (start !== prevSlab.endCount + 1) {
          return NextResponse.json({ error: `Slab gap detected! Slab ${i + 1} must start at ${prevSlab.endCount + 1} (previous end count + 1).` }, { status: 400 });
        }
      } else {
        if (start !== 1) {
          return NextResponse.json({ error: `First slab must start at count 1.` }, { status: 400 });
        }
      }
    }

    // Verify last slab is open-ended
    const lastSlab = sortedSlabs[sortedSlabs.length - 1];
    if (lastSlab.endCount !== null) {
      return NextResponse.json({ error: 'The final slab must be open-ended (represented as 8+ or upper limit empty).' }, { status: 400 });
    }

    // Clear old slabs and seed new ones
    await IncentiveSlab.deleteMany({});
    const insertedSlabs = await IncentiveSlab.create(
      sortedSlabs.map(s => ({
        startCount: s.startCount,
        endCount: s.endCount,
        rate: s.rate
      }))
    );

    return NextResponse.json({ message: 'Slabs updated successfully', slabs: insertedSlabs });

  } catch (error: any) {
    console.error('Update slabs error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
