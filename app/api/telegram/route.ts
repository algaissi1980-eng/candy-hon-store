import { NextResponse } from 'next/server';
import { getCityName } from '@/lib/deliveryAreas';

function escapeHtml(unsafe: string | null | undefined) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newOrder = body.record || body; // Support direct or webhook

    if (!newOrder || !newOrder.id) {
      return NextResponse.json({ error: 'No order data' }, { status: 400 });
    }

    const orderId = String(newOrder.id).split('-')[0];
    const customerName = escapeHtml(newOrder.customer_name) || 'غير معروف';
    const customerPhone = escapeHtml(newOrder.customer_phone) || '—';
    const totalAmount = newOrder.total_amount;
    const notes = escapeHtml(newOrder.notes) || '';
    
    let deliveryInfo = '';
    if (newOrder.delivery_city) {
      const cityId = newOrder.delivery_city;
      const cityName = cityId === '__other__' ? 'منطقة أخرى' : getCityName(cityId, 'ar');
      deliveryInfo = `\n📍 <b>منطقة التوصيل:</b> ${escapeHtml(cityName)}\n🚚 <b>رسوم التوصيل:</b> ${newOrder.delivery_fee || 0} JOD`;
    }

    let message = `🍬 <b>طلب جديد من Candy Hon!</b>\n\n`;
    message += `👤 <b>الزبون:</b> ${customerName}\n`;
    message += `📱 <b>الهاتف:</b> ${customerPhone}\n`;
    message += `💰 <b>القيمة:</b> ${totalAmount} JOD${deliveryInfo}\n`;
    message += `📦 <b>رقم الطلب:</b> #${orderId}`;
    
    if (notes) {
      message += `\n📝 <b>ملاحظات:</b> ${notes}`;
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
    }

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chat_id: CHAT_ID, 
        text: message, 
        parse_mode: 'HTML' 
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Telegram API error:', errorData);
      throw new Error(`Telegram API error: ${errorData}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Telegram Webhook Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
