

export const LOCAL_STORAGE_STORIES_KEY = 'video-ai-stories';
export const LOCAL_STORAGE_CHARACTERS_KEY = 'video-ai-characters';

// FIX: Removed 'imagen-4.0-generate-001' as it is not a video model.
export const MODELS = ['veo-2.0-generate-001'];
export const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:3', '3:4'];

export const STEPS = [
  { id: 1, name: 'Câu chuyện' },
  { id: 2, name: 'Nhân vật' },
  { id: 3, name: 'Cấu hình' },
  { id: 4, name: 'Tổng hợp' }
];