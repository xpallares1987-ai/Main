import { NextRequest, NextResponse } from 'next/server';
import { 
  getUnifiedStock, 
  getUnifiedBoardingList, 
  getUnifiedPendingReceptions 
} from '@/services/warehouse-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    let data;
    switch (action) {
      case 'GetStock':
        data = await getUnifiedStock();
        break;
      case 'GetBoardingList':
        data = await getUnifiedBoardingList();
        break;
      case 'GetPendingReceptions':
        data = await getUnifiedPendingReceptions();
        break;
      default:
        return NextResponse.json({ error: 'Parámetro de acción no válido' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`[API ERROR] ${action}:`, error.message);
    return NextResponse.json({ error: 'Error interno al procesar los datos locales' }, { status: 500 });
  }
}
