import { NextResponse } from 'next/server';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }
    
    const userStatusRef = doc(db, 'userStatus', userId);
    const now = new Date();
    
    // Set user as explicitly offline
    await setDoc(userStatusRef, {
      online: false,
      lastSeen: now,
      updatedAt: now,
      clientTime: now.getTime(),
      lastHeartbeat: 0 // Force offline
    }, { merge: true });
    
    return NextResponse.json({ success: true, userId, status: 'offline' });
  } catch (error) {
    console.error('Error setting user offline:', error);
    return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
  }
} 