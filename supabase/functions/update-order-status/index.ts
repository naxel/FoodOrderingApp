import { withSupabase } from '@supabase/server';
import type { SupabaseContext } from '@supabase/server';

// Admin changes an order's status; the owner gets a push notification.
// Push tokens stay on the server: the client never reads other users' profiles.

const STATUSES = ['New', 'Cooking', 'Delivering', 'Delivered'];
// Optional: required only if "Enhanced security for push notifications" is on in Expo
const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN');

export default {
  fetch: withSupabase({ auth: ['user'] }, async (req, ctx) => {
    const { supabase, supabaseAdmin } = ctx;

    try {
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
      if (adminError) throw adminError;
      if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });

      const { orderId, status } = await req.json().catch(() => ({}));
      if (!Number.isInteger(orderId) || !STATUSES.includes(status)) {
        return Response.json({ error: 'orderId and a valid status are required' }, { status: 400 });
      }

      const { data: order, error: updateError } = await supabaseAdmin
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .maybeSingle();
      if (updateError) throw updateError;
      if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

      // The status is saved either way; a failed push must not fail the request
      const notified = await notifyOwner(supabaseAdmin, order).catch((error) => {
        console.error('update-order-status: push failed', order.id, error);
        return false;
      });

      return Response.json({ order, notified });
    } catch (error) {
      console.error('update-order-status failed', error);
      return Response.json({ error: 'Failed to update order' }, { status: 500 });
    }
  }),
};

const notifyOwner = async (
  supabaseAdmin: SupabaseContext['supabaseAdmin'],
  order: { id: number; user_id: string | null; status: string },
) => {
  if (!order.user_id) return false;

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('expo_push_token')
    .eq('id', order.user_id)
    .maybeSingle();
  if (error) throw error;
  const token: string | null = profile?.expo_push_token;
  if (!token) return false;

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(expoAccessToken ? { Authorization: `Bearer ${expoAccessToken}` } : {}),
    },
    body: JSON.stringify({
      to: token,
      sound: 'default',
      title: `Your order is ${order.status}`,
      body: 'It should be there soon',
      data: { orderId: order.id },
    }),
  });
  const { data: ticket } = await response.json();

  if (ticket?.status !== 'ok') {
    // The app was uninstalled or the token expired: stop sending to it
    if (ticket?.details?.error === 'DeviceNotRegistered') {
      await supabaseAdmin
        .from('profiles')
        .update({ expo_push_token: null })
        .eq('id', order.user_id)
        .eq('expo_push_token', token);
    }
    console.warn('update-order-status: push not accepted', order.id, ticket?.message);
    return false;
  }
  return true;
};
