import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, any>;
  timestamp: string;
}

function serializeBigInt(obj: any, seen = new WeakSet()): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (obj instanceof Date) return obj.toISOString();
  if (typeof obj === 'object') {
    if (seen.has(obj)) return undefined;
    seen.add(obj);

    if (Array.isArray(obj)) {
      return obj.map(item => serializeBigInt(item, seen));
    }

    // Ignore streams, HTTP sockets or express response instances
    if (
      typeof obj.pipe === 'function' ||
      obj.constructor?.name === 'ServerResponse' ||
      obj.constructor?.name === 'Socket' ||
      obj.constructor?.name === 'IncomingMessage'
    ) {
      return undefined;
    }

    const res: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      res[key] = serializeBigInt(obj[key], seen);
    }
    return res;
  }
  return obj;
}

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map(response => {
        const serialized = serializeBigInt(response);
        // Handle custom meta if provided
        if (serialized && typeof serialized === 'object' && 'data' in serialized && 'meta' in serialized) {
          return {
            success: true,
            data: serialized.data,
            meta: serialized.meta,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true,
          data: serialized ?? null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
