
import React, { useState } from 'react';
import type { VideoConfig } from '../types';
import { MODELS, ASPECT_RATIOS } from '../constants';

interface ConfigStepProps {
  onNext: (config: VideoConfig) => void;
  onBack: () => void;
  initialConfig: VideoConfig;
}

const ConfigStep: React.FC<ConfigStepProps> = ({ onNext, onBack, initialConfig }) => {
  const [config, setConfig] = useState<VideoConfig>(initialConfig);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-sky-400">Bước 3: Cấu hình đầu ra</h2>
        <p className="mt-2 text-gray-400">Chọn các thông số cho video sẽ được tạo.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-300">Model sử dụng</label>
          <select id="model" name="model" value={config.model} onChange={handleChange} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm p-2">
            {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-300">Tỉ lệ khung hình</label>
          <select id="aspectRatio" name="aspectRatio" value={config.aspectRatio} onChange={handleChange} className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm p-2">
            {ASPECT_RATIOS.map(ar => <option key={ar} value={ar}>{ar}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="storagePath" className="block text-sm font-medium text-gray-300">Vị trí lưu trữ</label>
          <input
            type="text"
            id="storagePath"
            name="storagePath"
            value={config.storagePath}
            onChange={handleChange}
            className="mt-1 block w-full bg-gray-800 border-gray-600 rounded-md shadow-sm p-2"
            placeholder="Ví dụ: /videos/my_project (chỉ mang tính tham khảo)"
          />
          <p className="mt-1 text-xs text-gray-500">Lưu ý: Do giới hạn của trình duyệt, video sẽ được tải xuống máy của bạn.</p>
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="px-6 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Quay lại</button>
        <button onClick={() => onNext(config)} className="px-6 py-2 bg-indigo-600 rounded-md hover:bg-indigo-700">Tiếp theo</button>
      </div>
    </div>
  );
};

export default ConfigStep;
