import type { User } from '@/types';

interface CompletenessItem {
  name: string;
  completed: boolean;
  weight: number;
}

export function calculateProfileCompleteness(user: User | null): {
  score: number;
  items: CompletenessItem[];
} {
  if (!user) return { score: 0, items: [] };

  const items: CompletenessItem[] = [
    { name: 'Profile Picture', completed: !!user.avatar && !user.avatar.includes('default'), weight: 25 },
    { name: 'Phone Number', completed: !!user.phone, weight: 25 },
    { name: 'Location', completed: !!user.location?.address, weight: 20 },
    { name: 'Verified Account', completed: !!user.isVerified, weight: 30 },
  ];

  const score = items
    .filter((item) => item.completed)
    .reduce((sum, item) => sum + item.weight, 0);

  return { score, items };
}
