export interface Story {
  id: string;
  prompt: string;
  name: string;
}

export interface Character {
  id: string;
  prompt: string;
  name: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  imageUrl?: string;
}

export interface VideoConfig {
  model: string;
  aspectRatio: string;
  storagePath: string;
}

export interface Scene {
  id:string;
  prompt: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  previewUrl?: string;
}

export interface ProjectData {
  story: Story | null;
  characters: Character[];
  config: VideoConfig;
}