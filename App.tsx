
import React, { useState, useCallback } from 'react';
import StoryStep from './components/StoryStep';
import CharacterStep from './components/CharacterStep';
import ConfigStep from './components/ConfigStep';
import SummaryStep from './components/SummaryStep';
import StepIndicator from './components/StepIndicator';
import type { ProjectData, Story, Character, VideoConfig } from './types';
import { MODELS, ASPECT_RATIOS } from './constants';
import { sampleStoryJson } from './data/sampleData';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);

  const initialProjectData: ProjectData = {
    story: {
      id: 'sample-story-tortoise-hare',
      name: sampleStoryJson.title,
      prompt: `${sampleStoryJson.theme}. A classic fable about a race between a boastful, speedy hare and a slow, persistent tortoise. The hare gets a big lead and decides to nap, allowing the tortoise to steadily pass him and win the race, teaching a lesson about perseverance.`
    },
    characters: [
      { id: 'char-tho', name: 'Thỏ', prompt: 'A white rabbit, looking very confident and arrogant.', status: 'pending' },
      { id: 'char-rua', name: 'Rùa', prompt: 'A wise-looking tortoise, calm and determined.', status: 'pending' }
    ],
    config: {
      model: MODELS[0],
      aspectRatio: ASPECT_RATIOS[0],
      storagePath: '/downloads/video_ai',
    },
  };
  
  const [projectData, setProjectData] = useState<ProjectData>(initialProjectData);

  const handleNextStep = () => setCurrentStep(prev => prev + 1);
  const handlePrevStep = () => setCurrentStep(prev => prev - 1);

  const handleStorySubmit = (story: Story) => {
    setProjectData(prev => ({ ...prev, story }));
    handleNextStep();
  };

  const handleCharacterSubmit = (characters: Character[]) => {
    setProjectData(prev => ({ ...prev, characters }));
    handleNextStep();
  };

  const handleConfigSubmit = (config: VideoConfig) => {
    setProjectData(prev => ({ ...prev, config }));
    handleNextStep();
  };

  const updateCharacter = (updatedChar: Character) => {
    setProjectData(prev => ({
        ...prev,
        characters: prev.characters.map(c => c.id === updatedChar.id ? updatedChar : c)
    }));
  };
  
  const exportProject = () => {
    const dataStr = JSON.stringify(projectData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'video_project.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  const importProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result;
          if (typeof content === 'string') {
            const imported: ProjectData = JSON.parse(content);
            // Add some validation here if needed
            setProjectData(imported);
            setCurrentStep(1); // Reset to first step to review
            alert('Dự án đã được tải thành công!');
          }
        } catch (error) {
          alert('Lỗi khi đọc file JSON dự án.');
        }
      };
      reader.readAsText(file);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StoryStep onNext={handleStorySubmit} initialStory={projectData.story} />;
      case 2:
        return <CharacterStep onNext={handleCharacterSubmit} onBack={handlePrevStep} initialCharacters={projectData.characters}/>;
      case 3:
        return <ConfigStep onNext={handleConfigSubmit} onBack={handlePrevStep} initialConfig={projectData.config}/>;
      case 4:
        return <SummaryStep projectData={projectData} onBack={handlePrevStep} onUpdateCharacter={updateCharacter} />;
      default:
        return <div>Invalid Step</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 flex flex-col items-center">
      <header className="w-full max-w-6xl mb-8">
        <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
          Video Storyboard AI
        </h1>
        <p className="text-center text-gray-400 mt-2">Tạo video từ ý tưởng của bạn với sức mạnh của VEO AI</p>
         <div className="flex justify-center gap-4 mt-4">
          <button onClick={exportProject} className="px-4 py-2 text-sm bg-gray-700 rounded-md hover:bg-gray-600">Xuất dự án (.json)</button>
          <label className="cursor-pointer px-4 py-2 text-sm bg-gray-700 rounded-md hover:bg-gray-600">
            Nhập dự án (.json)
            <input type="file" onChange={importProject} accept=".json" className="hidden" />
          </label>
        </div>
      </header>

      <div className="w-full max-w-6xl p-8 bg-gray-800/50 rounded-2xl shadow-2xl border border-gray-700">
        <div className="mb-12 flex justify-center">
          <StepIndicator currentStep={currentStep} />
        </div>
        <main>
          {renderStep()}
        </main>
      </div>
      
      <footer className="mt-8 text-gray-500 text-sm">
        Powered by Google Gemini API
      </footer>
    </div>
  );
};

export default App;
