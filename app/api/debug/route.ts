import { NextResponse } from 'next/server';
import debugTeacherExperience from '@/lib/debug-experience';

export async function GET() {
  try {
    // Only enable this in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ 
        error: 'Debug API only available in development environment' 
      }, { status: 403 });
    }
    
    await debugTeacherExperience();
    
    return NextResponse.json({ 
      message: 'Debug logs have been sent to the server console. Check your terminal output.' 
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Failed to run debug utilities' }, { status: 500 });
  }
} 