
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ProjectData, Character, Scene } from '../types';
import { generateScenesFromStory, generateScenePreviewVideo, generateVideo, generateCharacterImage } from '../services/geminiService';
import { sampleStoryJson, generatePromptFromScene } from '../data/sampleData';

// Helper to fetch video blob and create object URL
const fetchVideoAsURL = async (downloadLink: string): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API key is not configured.");
    const fullUrl = `${downloadLink}&key=${apiKey}`;
    const response = await fetch(fullUrl);
    if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


interface SummaryStepProps {
  projectData: ProjectData;
  onBack: () => void;
  onUpdateCharacter: (character: Character) => void;
}

const SummaryStep: React.FC<SummaryStepProps> = ({ projectData, onBack, onUpdateCharacter }) => {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [localCharacters, setLocalCharacters] = useState<Character[]>([]);
  const [isLoadingScenes, setIsLoadingScenes] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  const [generationLog, setGenerationLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const { story, config } = projectData;

  useEffect(() => {
    setLocalCharacters(projectData.characters.map(c => ({...c, status: c.imageUrl ? 'completed' : 'pending'})));
  }, [projectData.characters]);
  
  const updateLog = useCallback((message: string) => {
    setGenerationLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  },[]);

  const handleGenerateScenes = useCallback(async () => {
    if (!story) return;
    setIsLoadingScenes(true);
    setError(null);
    setScenes([]);

    // Special handling for the pre-configured sample story
    if (story.id === 'sample-story-tortoise-hare') {
      updateLog("Đang tải các cảnh từ dự án mẫu...");
      try {
        const initialScenes: Scene[] = sampleStoryJson.scenes.map((s) => ({
          id: `scene-${s.id}-${Date.now()}`,
          prompt: generatePromptFromScene(s),
          status: 'pending',
        }));
        setScenes(initialScenes);
        updateLog(`Đã tải thành công ${initialScenes.length} cảnh.`);
      } catch (err) {
        const msg = "Không thể tải các cảnh mẫu.";
        setError(msg);
        updateLog(`Lỗi: ${msg}`);
        console.error(err);
      } finally {
        setIsLoadingScenes(false);
      }
      return; // Stop execution here for the sample story
    }

    // Original logic for user-created stories
    updateLog("Bắt đầu tạo kịch bản từ câu chuyện...");
    try {
      const scenePrompts = await generateScenesFromStory(story.prompt);
      const initialScenes: Scene[] = scenePrompts.map((prompt, index) => ({
        id: `scene-${index}-${Date.now()}`, prompt, status: 'pending',
      }));
      setScenes(initialScenes);
      updateLog(`Tạo thành công ${initialScenes.length} cảnh.`);
    } catch (err) {
      const msg = "Không thể tạo kịch bản. Vui lòng thử lại.";
      setError(msg);
      updateLog(`Lỗi: ${msg}`);
      console.error(err);
    } finally {
      setIsLoadingScenes(false);
    }
  }, [story, updateLog]);


  const handleScenePromptChange = (sceneId: string, newPrompt: string) => {
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, prompt: newPrompt } : s));
  };
  
  const handleCharacterPromptChange = (charId: string, newPrompt: string) => {
    setLocalCharacters(prev => prev.map(c => c.id === charId ? { ...c, prompt: newPrompt } : c));
  };

  const handleGeneratePreview = async (sceneId: string) => {
    const sceneIndex = scenes.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) return;
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, status: 'generating' } : s));
    updateLog(`Bắt đầu tạo video preview cho Cảnh ${sceneIndex + 1}...`);
    try {
      const scene = scenes[sceneIndex];
      const downloadLink = await generateScenePreviewVideo(scene.prompt, config);
      const previewUrl = await fetchVideoAsURL(downloadLink);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, status: 'completed', previewUrl } : s));
      updateLog(`Tạo preview cho Cảnh ${sceneIndex + 1} thành công.`);
    } catch (err) {
      console.error(err);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, status: 'error' } : s));
      updateLog(`Lỗi khi tạo preview cho Cảnh ${sceneIndex + 1}.`);
    }
  };
  
  const handleGenerateCharacterImage = async (charId: string) => {
      const charIndex = localCharacters.findIndex(c => c.id === charId);
      if (charIndex === -1) return;
      setLocalCharacters(prev => prev.map(c => c.id === charId ? { ...c, status: 'generating' } : c));
      updateLog(`Bắt đầu tạo ảnh cho nhân vật '${localCharacters[charIndex].name}'...`);
      try {
        const character = localCharacters[charIndex];
        const imageUrl = await generateCharacterImage(character.prompt);
        setLocalCharacters(prev => prev.map(c => c.id === charId ? { ...c, status: 'completed', imageUrl } : c));
        updateLog(`Tạo ảnh cho nhân vật '${character.name}' thành công.`);
      } catch(err) {
        console.error(err);
        setLocalCharacters(prev => prev.map(c => c.id === charId ? { ...c, status: 'error' } : c));
        updateLog(`Lỗi khi tạo ảnh cho nhân vật '${localCharacters[charIndex].name}'.`);
      }
  }
  
  const handleImageUpload = async (charId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const imageUrl = await fileToDataUrl(file);
        setLocalCharacters(prev => prev.map(c => c.id === charId ? {...c, imageUrl, status: 'completed'} : c));
        updateLog(`Đã tải lên ảnh cho nhân vật.`);
      } catch (err) {
        console.error(err);
        updateLog(`Lỗi khi tải ảnh lên.`);
      }
    }
  };


  const handleGenerateFinalVideo = async () => {
    if (!story || scenes.length === 0) {
      setError("Cần có kịch bản và phân cảnh trước khi tạo video.");
      return;
    }
    setIsGeneratingVideo(true);
    setFinalVideoUrl(null);
    setGenerationLog([]);
    setError(null);
    try {
      let characterDescriptions = '';
      if (localCharacters.length > 0) {
        characterDescriptions = "The video should feature the following characters: " + localCharacters.map(c => `${c.name} (${c.prompt})`).join('. ');
      }
      const finalPrompt = `Create a short film based on this story: "${story.prompt}". ${characterDescriptions} The film is composed of the following scenes: ${scenes.map((s, i) => `Scene ${i+1}: ${s.prompt}`).join('; ')}. Ensure a consistent style and characters throughout the video. The video aspect ratio is ${config.aspectRatio}.`;
      
      const downloadLink = await generateVideo(finalPrompt, config, updateLog);
      updateLog("Đang tải dữ liệu video...");
      const videoObjectURL = await fetchVideoAsURL(downloadLink);
      setFinalVideoUrl(videoObjectURL);
      updateLog("Video đã sẵn sàng để tải xuống!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.";
      setError(`Lỗi tạo video: ${errorMessage}`);
      updateLog(`Lỗi: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  if (!story) {
    return (
      <div className="text-center">
        <p className="text-gray-400">Vui lòng quay lại bước 1 và tạo một câu chuyện.</p>
        <button onClick={onBack} className="mt-4 px-6 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-sky-400">Bước 4: Tổng hợp và Tạo Video</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* --- SCENES TABLE --- */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Bảng Kịch bản Phân cảnh</h3>
            {!isLoadingScenes && scenes.length === 0 && (
              <div className="text-center p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <p className="text-gray-400">Bấm nút bên dưới để AI phân tích câu chuyện và tạo ra các cảnh quay.</p>
                <button onClick={handleGenerateScenes} disabled={isLoadingScenes} className="mt-4 px-6 py-2 bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-500">
                  { isLoadingScenes ? 'Đang tạo...' : 'Tạo kịch bản'}
                </button>
              </div>
            )}
            {isLoadingScenes && <p className="text-center animate-pulse py-4">Đang tạo kịch bản...</p>}
            {scenes.length > 0 && (
              <div className="overflow-x-auto bg-gray-800/70 rounded-lg border border-gray-700">
                <table className="min-w-full divide-y divide-gray-600">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Cảnh</th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Prompt</th>
                      <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider">Preview</th>
                      <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {scenes.map((scene, index) => (
                      <tr key={scene.id}>
                        <td className="px-4 py-2 whitespace-nowrap font-semibold">{index + 1}</td>
                        <td className="px-4 py-2">
                          <textarea value={scene.prompt} onChange={(e) => handleScenePromptChange(scene.id, e.target.value)} className="w-full bg-gray-700 p-2 rounded-md text-sm border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500" rows={3}></textarea>
                        </td>
                        <td className="px-4 py-2 text-center align-middle">
                          {scene.status === 'completed' && scene.previewUrl ? <video src={scene.previewUrl} className="w-32 h-20 object-cover mx-auto rounded-md bg-black" controls/> : <div className="w-32 h-20 bg-gray-700/50 rounded-md flex items-center justify-center text-xs text-gray-400 mx-auto">Chưa có</div>}
                        </td>
                        <td className="px-4 py-2 text-center align-middle">
                          {scene.status === 'generating' && <span className="text-xs text-yellow-400 animate-pulse">Đang tạo...</span>}
                          {scene.status === 'pending' && <button onClick={() => handleGeneratePreview(scene.id)} className="text-xs px-2 py-1 bg-sky-600 rounded hover:bg-sky-700">Tạo Video</button>}
                          {scene.status === 'error' && <button onClick={() => handleGeneratePreview(scene.id)} className="text-xs px-2 py-1 bg-red-600 rounded hover:bg-red-700">Thử lại</button>}
                          {scene.status === 'completed' && (
                            <div className="flex flex-col items-center gap-1">
                              <a href={scene.previewUrl} download={`scene_${index+1}.mp4`} className="text-xs w-full px-2 py-1 bg-green-600 rounded hover:bg-green-700">Tải xuống</a>
                              <button onClick={() => handleGeneratePreview(scene.id)} className="text-xs w-full px-2 py-1 bg-yellow-600 rounded hover:bg-yellow-700">Tạo lại</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* --- CHARACTERS TABLE --- */}
          <div className="space-y-4">
              <h3 className="text-xl font-bold">Bảng Nhân vật</h3>
              {localCharacters.length > 0 ? (
                 <div className="overflow-x-auto bg-gray-800/70 rounded-lg border border-gray-700">
                  <table className="min-w-full divide-y divide-gray-600">
                    <thead className="bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Tên</th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Prompt</th>
                        <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider">Ảnh</th>
                        <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {localCharacters.map(char => (
                        <tr key={char.id}>
                          <td className="px-4 py-2 whitespace-nowrap font-semibold">{char.name}</td>
                          <td className="px-4 py-2">
                            <textarea value={char.prompt} onChange={(e) => handleCharacterPromptChange(char.id, e.target.value)} className="w-full bg-gray-700 p-2 rounded-md text-sm border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500" rows={3}></textarea>
                          </td>
                          <td className="px-4 py-2 text-center align-middle">
                            {char.status === 'completed' && char.imageUrl ? <img src={char.imageUrl} alt={char.name} className="w-24 h-24 object-cover mx-auto rounded-md bg-black" /> : <div className="w-24 h-24 bg-gray-700/50 rounded-md flex items-center justify-center text-xs text-gray-400 mx-auto">Chưa có</div>}
                          </td>
                          <td className="px-4 py-2 text-center align-middle">
                            {char.status === 'generating' && <span className="text-xs text-yellow-400 animate-pulse">Đang tạo...</span>}
                            {(char.status === 'pending' || char.status === 'error' || char.status === 'completed') && (
                              <div className="flex flex-col items-center gap-1">
                                <button onClick={() => handleGenerateCharacterImage(char.id)} className="text-xs w-full px-2 py-1 bg-sky-600 rounded hover:bg-sky-700">Tạo ảnh</button>
                                <button onClick={() => fileInputRefs.current[char.id]?.click()} className="text-xs w-full px-2 py-1 bg-gray-600 rounded hover:bg-gray-500">Tải ảnh lên</button>
                                {/* FIX: Changed ref callback to not return a value, which fixes a TypeScript type error. */}
                                <input type="file" ref={el => { fileInputRefs.current[char.id] = el; }} onChange={(e) => handleImageUpload(char.id, e)} accept="image/*" className="hidden" />
                                {char.status === 'error' && <span className="text-xs text-red-400 mt-1">Lỗi</span>}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ): <p className="text-gray-400 bg-gray-800/50 p-4 rounded-lg border border-gray-700">Không có nhân vật nào được chọn.</p>}
          </div>
        </div>
        
        {/* Right Column */}
        <div className="lg:col-span-1 space-y-8">
            {/* --- CONFIG INFO --- */}
            <div className="space-y-4 p-4 bg-gray-800/70 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-indigo-400">Cấu hình Video</h3>
              <p><strong>Model:</strong> {config.model}</p>
              <p><strong>Tỉ lệ:</strong> {config.aspectRatio}</p>
            </div>
            
            {/* --- LOGS --- */}
            <div className="p-4 bg-gray-800/70 rounded-lg border border-gray-700">
               <h4 className="font-semibold mb-2 text-indigo-400">Nhật ký tiến trình</h4>
               <div className="bg-black/30 p-2 rounded-md max-h-96 h-96 overflow-y-auto">
                 <div className="space-y-1 text-sm font-mono text-gray-300">
                    {generationLog.map((log, i) => <p key={i}><span className="text-gray-500 mr-2">&gt;</span>{log}</p>)}
                    {(isGeneratingVideo || isLoadingScenes) && <p className="animate-pulse"><span className="text-gray-500 mr-2">&gt;</span>Đang xử lý...</p>}
                 </div>
               </div>
            </div>
        </div>
      </div>


      {error && <p className="text-red-400 text-center font-semibold bg-red-900/50 p-3 rounded-md">{error}</p>}
      
      {/* --- FINAL VIDEO --- */}
      <div className="space-y-4 pt-8 border-t border-gray-700">
        <h3 className="text-xl font-bold text-center">Tạo Video Cuối Cùng</h3>
        {finalVideoUrl ? (
          <div className="text-center space-y-4">
              <video src={finalVideoUrl} controls className="w-full max-w-2xl mx-auto rounded-lg border-2 border-green-500" />
              <a href={finalVideoUrl} download={`video_${story.name.replace(/\s+/g, '_') || 'generated'}.mp4`} className="inline-block px-6 py-2 bg-green-600 rounded-md hover:bg-green-700">Tải Video Xuống</a>
          </div>
        ) : (
          <div className="text-center">
             <button onClick={handleGenerateFinalVideo} disabled={isGeneratingVideo || scenes.length === 0} className="px-8 py-3 bg-green-600 text-lg font-bold rounded-md shadow-lg hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-transform transform hover:scale-105">
              {isGeneratingVideo ? 'Đang tạo Video...' : 'Bắt đầu tạo Video'}
            </button>
            {scenes.length === 0 && <p className="text-xs text-gray-500 mt-2">Vui lòng tạo kịch bản trước.</p>}
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8 pt-8 border-t border-gray-700">
        <button onClick={onBack} disabled={isGeneratingVideo} className="px-6 py-2 bg-gray-600 rounded-md hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed">Quay lại</button>
      </div>
    </div>
  );
};

export default SummaryStep;
