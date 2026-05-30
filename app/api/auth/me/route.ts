import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-toyota-portal-key-change-this-in-production';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      // Clear cookie on the NextResponse object (fully supported in GET route handlers)
      const response = NextResponse.json({ user: null }, { status: 200 });
      response.cookies.delete('token');
      return response;
    }

    await dbConnect();
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      // Clear cookie on the NextResponse object (fully supported in GET route handlers)
      const response = NextResponse.json({ user: null }, { status: 200 });
      response.cookies.delete('token');
      return response;
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
