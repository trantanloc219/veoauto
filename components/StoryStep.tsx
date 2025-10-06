
import React, { useState } from 'react';
import type { Story } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { LOCAL_STORAGE_STORIES_KEY } from '../constants';

interface StoryStepProps {
  onNext: (story: Story) => void;
  initialStory: Story | null;
}

const StoryStep: React.FC<StoryStepProps> = ({ onNext, initialStory }) => {
  const [prompt, setPrompt] = useState(initialStory?.prompt || '');
  const [name, setName] = useState(initialStory?.name || 'Câu chuyện mới');
  const [stories, setStories] = useLocalStorage<Story[]>(LOCAL_STORAGE_STORIES_KEY, []);

  const handleNext = () => {
    if (prompt.trim()) {
      const newStory: Story = { id: initialStory?.id || crypto.randomUUID(), prompt, name };
      const existingStoryIndex = stories.findIndex(s => s.id === newStory.id);
      if (existingStoryIndex > -1) {
          const updatedStories = [...stories];
          updatedStories[existingStoryIndex] = newStory;
          setStories(updatedStories);
      } else if (!stories.some(s => s.prompt === prompt)) {
        setStories([...stories, newStory]);
      }
      onNext(newStory);
    }
  };
  
  const selectStory = (story: Story) => {
    setPrompt(story.prompt);
    setName(story.name);
  };
  
  const deleteStory = (storyId: string) => {
    setStories(stories.filter(s => s.id !== storyId));
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-sky-400">Bước 1: Tạo câu chuyện</h2>
        <p className="mt-2 text-gray-400">Nhập mô tả cho câu chuyện của bạn. Ví dụ: "Một hiệp sĩ du hành qua thế giới tương lai..."</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="story-name" className="block text-sm font-medium text-gray-300">Tên câu chuyện</label>
          <input
            type="text"
            id="story-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            placeholder="Ví dụ: Hiệp sĩ tương lai"
          />
        </div>
        <div>
          <label htmlFor="story-prompt" className="block text-sm font-medium text-gray-300">Mô tả câu chuyện</label>
          <textarea
            id="story-prompt"
            rows={6}
            className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
            placeholder="Nhập prompt của bạn tại đây..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
      </div>
      
      {stories.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-200">Hoặc chọn câu chuyện đã có</h3>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto p-2 bg-gray-900/50 rounded-lg">
            {stories.map((story) => (
              <div key={story.id} className="relative group bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-indigo-500 transition-colors cursor-pointer" onClick={() => selectStory(story)}>
                <h4 className="font-bold truncate">{story.name}</h4>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{story.prompt}</p>
                <button
                    onClick={(e) => { e.stopPropagation(); deleteStory(story.id); }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-gray-700 text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-opacity"
                    aria-label="Delete story"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={!prompt.trim()}
          className="px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          Tiếp theo
        </button>
      </div>
    </div>
  );
};

export default StoryStep;
