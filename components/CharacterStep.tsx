import React, { useState, useRef } from 'react';
import type { Character } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { LOCAL_STORAGE_CHARACTERS_KEY } from '../constants';

interface CharacterStepProps {
  onNext: (characters: Character[]) => void;
  onBack: () => void;
  initialCharacters: Character[];
}

const CharacterStep: React.FC<CharacterStepProps> = ({ onNext, onBack, initialCharacters }) => {
  const [name, setName] = useState('Nhân vật chính');
  const [prompt, setPrompt] = useState('');
  const [characters, setCharacters] = useLocalStorage<Character[]>(LOCAL_STORAGE_CHARACTERS_KEY, []);
  const [selectedCharacters, setSelectedCharacters] = useState<Character[]>(initialCharacters);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addCharacter = () => {
    if (prompt.trim() && name.trim()) {
      // FIX: Added missing 'status' property to align with the 'Character' type.
      const newChar: Character = { id: crypto.randomUUID(), name, prompt, status: 'pending' };
      setCharacters([...characters, newChar]);
      setSelectedCharacters([...selectedCharacters, newChar]);
      setName('Nhân vật mới');
      setPrompt('');
    }
  };
  
  const toggleCharacterSelection = (char: Character) => {
    setSelectedCharacters(prev => 
      prev.some(c => c.id === char.id) 
        ? prev.filter(c => c.id !== char.id) 
        : [...prev, char]
    );
  };
  
  const deleteCharacter = (charId: string) => {
    setCharacters(characters.filter(c => c.id !== charId));
    setSelectedCharacters(selectedCharacters.filter(c => c.id !== charId));
  };
  
  const exportCharacters = () => {
    if (characters.length === 0) {
      alert("Không có nhân vật nào để xuất.");
      return;
    }
    const dataStr = JSON.stringify(characters, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'characters.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  const importCharacters = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result;
          if (typeof content === 'string') {
            const imported: Partial<Character>[] = JSON.parse(content);
            // Validation and sanitization
            if (Array.isArray(imported) && imported.every(c => c && c.id && c.name && c.prompt)) {
               const currentCharacterIds = new Set(characters.map(c => c.id));
               const charactersToAdd = imported.filter(impChar => impChar.id && !currentCharacterIds.has(impChar.id));

               if (charactersToAdd.length > 0) {
                 const sanitizedNewCharacters: Character[] = charactersToAdd.map(impChar => ({
                    id: impChar.id!,
                    name: impChar.name!,
                    prompt: impChar.prompt!,
                    status: impChar.status || 'pending',
                    imageUrl: impChar.imageUrl
                 }));
                 setCharacters([...characters, ...sanitizedNewCharacters]);
                 alert(`Đã nhập thành công ${charactersToAdd.length} nhân vật mới.`);
               } else {
                 alert('Không có nhân vật mới nào được tìm thấy trong file để nhập.');
               }

            } else {
              alert('File JSON không hợp lệ. Mỗi nhân vật phải là một object có "id", "name", và "prompt".');
            }
          }
        } catch (error) {
          console.error("Error importing characters:", error);
          alert('Lỗi khi đọc file JSON.');
        }
      };
      reader.readAsText(file);
      // Reset file input value to allow re-importing the same file
      if(event.target) {
        event.target.value = '';
      }
    }
  };


  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-sky-400">Bước 2: Tạo nhân vật</h2>
        <p className="mt-2 text-gray-400">Thêm các nhân vật cho câu chuyện của bạn. Bạn có thể chọn nhiều nhân vật.</p>
      </div>

      <div className="p-4 border border-dashed border-gray-600 rounded-lg space-y-4">
        <h3 className="text-lg font-semibold">Thêm nhân vật mới</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên nhân vật"
          className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm p-2"
        />
        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Mô tả nhân vật (ví dụ: 'Một cô gái với mái tóc tím, mặc áo giáp năng lượng')"
          className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm p-2"
        />
        <div className="text-right">
          <button onClick={addCharacter} className="px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-700">Thêm nhân vật</button>
        </div>
      </div>
      
      {characters.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-200">Danh sách nhân vật (Chọn để sử dụng)</h3>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-60 overflow-y-auto p-2 bg-gray-900/50 rounded-lg">
            {characters.map((char) => (
              <div 
                key={char.id} 
                onClick={() => toggleCharacterSelection(char)}
                className={`relative group p-4 rounded-lg border transition-colors cursor-pointer ${selectedCharacters.some(c => c.id === char.id) ? 'border-indigo-500 bg-indigo-900/30' : 'bg-gray-800 border-gray-700 hover:border-sky-500'}`}
              >
                <h4 className="font-bold truncate">{char.name}</h4>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{char.prompt}</p>
                 <button
                    onClick={(e) => { e.stopPropagation(); deleteCharacter(char.id); }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-gray-700 text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-opacity"
                    aria-label="Delete character"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
            <button onClick={exportCharacters} className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600">Xuất JSON</button>
            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-gray-700 rounded-md hover:bg-gray-600">Nhập JSON</button>
            <input type="file" ref={fileInputRef} onChange={importCharacters} accept=".json" className="hidden" />
        </div>
        <div className="flex gap-4">
          <button onClick={onBack} className="px-6 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Quay lại</button>
          <button onClick={() => onNext(selectedCharacters)} className="px-6 py-2 bg-indigo-600 rounded-md hover:bg-indigo-700">Tiếp theo</button>
        </div>
      </div>
    </div>
  );
};

export default CharacterStep;