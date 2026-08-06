// GET /api/subscriptions (list) & POST /api/subscriptions (create)
import { NextRequest } from 'next/server';
import { subscriptionSchema } from '@/lib/validators';
import {
  getAuthUser,
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-helpers';
import * as subscriptionService from '@/services/subscription.service';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const subscriptions = await subscriptionService.getSubscriptions(authUser.id);
    return successResponse(subscriptions);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const body = await request.json();
    const parsed = subscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors.map((e) => e.message).join(', '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const subscription = await subscriptionService.createSubscription(
      authUser.id,
      parsed.data,
    );

    return successResponse(subscription, 'Subscription created', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
