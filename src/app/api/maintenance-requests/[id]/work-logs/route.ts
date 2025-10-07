import { NextRequest, NextResponse } from 'next/server';

// Temporary in-memory storage for work logs
// In a real application, this would be stored in the database
const workLogsStorage: Record<string, any[]> = {};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Get work logs for this request
    const workLogs = workLogsStorage[requestId] || [];

    return NextResponse.json({
      success: true,
      data: workLogs
    });
  } catch (error) {
    console.error('Error fetching work logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work logs' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { notes, userId, userName, timeSpent } = body;

    if (!notes || !userId) {
      return NextResponse.json(
        { error: 'Notes and user ID are required' },
        { status: 400 }
      );
    }

    // Create new work log entry
    const workLog = {
      id: Date.now().toString(),
      requestId,
      notes,
      userId,
      userName: userName || 'Unknown User',
      timeSpent: timeSpent || 0, // Time in seconds
      timestamp: new Date().toLocaleDateString('de-DE') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString()
    };

    // Initialize array if it doesn't exist
    if (!workLogsStorage[requestId]) {
      workLogsStorage[requestId] = [];
    }

    // Add work log to storage
    workLogsStorage[requestId].push(workLog);

    return NextResponse.json({
      success: true,
      data: workLog
    });
  } catch (error) {
    console.error('Error creating work log:', error);
    return NextResponse.json(
      { error: 'Failed to create work log' },
      { status: 500 }
    );
  }
}