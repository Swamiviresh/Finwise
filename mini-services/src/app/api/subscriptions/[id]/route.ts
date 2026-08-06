// GET /api/subscriptions/[id], PUT /api/subscriptions/[id], DELETE /api/subscriptions/[id]
import { NextRequest } from 'next/server';
import { subscriptionSchema } from '@/lib/validators';
import {
  getAuthUser,
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-helpers';
import * as subscriptionService from '@/services/subscription.service';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const { id } = await context.params;
    const subscriptions = await subscriptionService.getSubscriptions(authUser.id);
    const subscription = subscriptions.find((s) => s.id === id);

    if (!subscription) {
      return errorResponse('Subscription not found', 404, 'NOT_FOUND');
    }

    return successResponse(subscription);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const { id } = await context.params;
    const body = await request.json();
    const parsed = subscriptionSchema.partial().safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        parsed.error.errors.map((e) => e.message).join(', '),
        400,
        'VALIDATION_ERROR',
      );
    }

    const subscription = await subscriptionService.updateSubscription(
      authUser.id,
      id,
      parsed.data,
    );

    return successResponse(subscription, 'Subscription updated');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');

    const { id } = await context.params;
    await subscriptionService.deleteSubscription(authUser.id, id);

    return successResponse(null, 'Subscription deleted');
  } catch (error) {
    return handleApiError(error);
  }
}
