import { httpClient } from './httpClient';
import type { ApiSuccess } from '@/types/api';

// The frontend only ever talks to these generic /ai/* endpoints. Which
// provider (OpenAI, Gemini, Claude, ...) actually serves them is a backend
// concern and must stay invisible here.
export interface CategorySuggestion {
  categoryId: string;
  confidence: number;
}

export interface MonthlyInsightRequest {
  month: string;
}

export const aiApi = {
  async suggestCategory(description: string, merchant?: string): Promise<CategorySuggestion> {
    const { data } = await httpClient.post<ApiSuccess<CategorySuggestion>>('/ai/categorize', {
      description,
      merchant,
    });
    return data.data;
  },

  async generateMonthlyInsight(payload: MonthlyInsightRequest): Promise<{ insightId: string }> {
    const { data } = await httpClient.post<ApiSuccess<{ insightId: string }>>(
      '/ai/insights/generate',
      payload,
    );
    return data.data;
  },
};
