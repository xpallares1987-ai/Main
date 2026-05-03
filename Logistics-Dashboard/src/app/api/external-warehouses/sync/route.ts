import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import util from 'util';

const execPromise = util.promisify(exec);
const LOG_FILE = path.join(process.cwd(), 'data', 'sync_log.json');

export async function POST() {
  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'sync_external_warehouses.ps1');
    const command = `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`;
    
    const startTime = new Date();
    const { stdout, stderr } = await execPromise(command);
    const endTime = new Date();

    const logEntry = {
      timestamp: startTime.toISOString(),
      durationMs: endTime.getTime() - startTime.getTime(),
      success: !stderr,
      error: stderr || null
    };

    // Save log entry
    let logs = [];
    if (fs.existsSync(LOG_FILE)) {
      try {
        logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
      } catch (e) {
        logs = [];
      }
    }
    logs.unshift(logEntry);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs.slice(0, 50), null, 2));

    return NextResponse.json({ 
      success: true, 
      message: 'Sincronización completada',
      lastSync: logEntry.timestamp 
    });
  } catch (error: any) {
    console.error('[SYNC ERROR]:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  if (!fs.existsSync(LOG_FILE)) return NextResponse.json({ lastSync: null });
  try {
    const logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
    return NextResponse.json({ lastSync: logs[0]?.timestamp || null });
  } catch (e) {
    return NextResponse.json({ lastSync: null });
  }
}
