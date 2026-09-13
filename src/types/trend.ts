import { ApiResponse } from '@/types';

export interface TrendPoint {
  date: string;
  safe: number;
  unsafe: number;
  total: number;
}

export interface TrendResponse {
  days: number;
  trend: TrendPoint[];
}

export type TrendApiResponse = ApiResponse<TrendResponse>;
