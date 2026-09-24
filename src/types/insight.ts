export type InsightKind = 'monthly-summary' | 'spending-alert' | 'saving-tip';

export interface Insight {
  id: string;
  userId: string;
  kind: InsightKind;
  title: string;
  body: string;
  month?: string; // relevant for 'monthly-summary'
  isAiGenerated: boolean;
  createdAt: string;
}

export interface SavingTip {
  id: string;
  title: string;
  body: string;
  category?: string;
  isAiGenerated: boolean;
  createdAt: string;
}

export type BookmarkTargetType = 'insight' | 'saving-tip';

export interface Bookmark {
  id: string;
  userId: string;
  targetType: BookmarkTargetType;
  targetId: string;
  createdAt: string;
}
