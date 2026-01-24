import { UserTag } from '../../types'
const now = new Date()

export const mockTags: UserTag[] = [
  {
    id: 'tag1',
    userId: 'user1',
    name: 'Dinner',
    color: '#FF5733',
    usageCount: 5,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'tag2',
    userId: 'user1',
    name: 'Quick Meals',
    color: '#33FF57',
    usageCount: 3,
    createdAt: now,
    updatedAt: now,
  },
]

export const mockTag: UserTag = mockTags[0]

