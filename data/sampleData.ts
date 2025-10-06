
export const sampleStoryJson = {
  "title": "Cuộc đua giữa Thỏ và Rùa",
  "theme": "Bài học về sự kiên trì và khiêm tốn",
  "scenes": [
    {
      "id": 1,
      "name": "Giới thiệu – Thỏ và Rùa gặp nhau",
      "description": "Trong khu rừng xanh mát, thỏ khoe khoang về tốc độ của mình trong khi rùa bình tĩnh đáp lại.",
      "setting": {
        "location": "Khu rừng nhiều cây xanh, ánh nắng nhẹ xuyên qua tán lá",
        "time": "Buổi sáng sớm"
      },
      "characters": [
        {"name": "Thỏ", "emotion": "tự tin, kiêu ngạo"},
        {"name": "Rùa", "emotion": "điềm đạm, kiên nhẫn"}
      ],
      "dialogue": [
        {"Thỏ": "Tôi là kẻ chạy nhanh nhất trong rừng này!"},
        {"Rùa": "Nhanh không có nghĩa là sẽ luôn thắng, bạn ạ."}
      ]
    },
    {
      "id": 2,
      "name": "Bắt đầu cuộc đua",
      "description": "Các con vật trong rừng tụ tập cổ vũ khi thỏ và rùa chuẩn bị xuất phát.",
      "setting": {
        "location": "Đường mòn xuyên rừng, hai bên là hoa dại",
        "time": "Buổi sáng"
      },
      "characters": [
        {"name": "Thỏ", "emotion": "hào hứng"},
        {"name": "Rùa", "emotion": "bình tĩnh"}
      ],
      "action": [
        "Thỏ giậm chân khởi động",
        "Rùa chậm rãi chuẩn bị",
        "Tất cả hô vang: '3, 2, 1... Bắt đầu!'"
      ]
    },
    {
      "id": 3,
      "name": "Thỏ nghỉ ngơi giữa chừng",
      "description": "Sau khi bỏ xa rùa, thỏ dừng lại dưới gốc cây để ngủ.",
      "setting": {
        "location": "Gốc cây lớn, bóng mát rợp",
        "time": "Giữa trưa"
      },
      "characters": [
        {"name": "Thỏ", "emotion": "chủ quan, lười biếng"}
      ],
      "action": [
        "Thỏ ngáp dài, nằm xuống ngủ",
        "Xa xa, rùa vẫn bước đều, chậm rãi"
      ]
    },
    {
      "id": 4,
      "name": "Rùa kiên trì tiến về đích",
      "description": "Rùa tiếp tục đi, mồ hôi lấm tấm nhưng không bỏ cuộc.",
      "setting": {
        "location": "Đoạn đường quanh co, gần về đích",
        "time": "Chiều muộn"
      },
      "characters": [
        {"name": "Rùa", "emotion": "mệt nhưng kiên định"}
      ],
      "monologue": "Không nhanh, nhưng mình sẽ không dừng lại."
    },
    {
      "id": 5,
      "name": "Kết thúc – Rùa chiến thắng",
      "description": "Rùa về đích trước khi thỏ kịp tỉnh dậy, mọi con vật reo hò chúc mừng.",
      "setting": {
        "location": "Vạch đích, có bảng ghi 'Finish'",
        "time": "Chiều tà"
      },
      "characters": [
        {"name": "Thỏ", "emotion": "hối hận, xấu hổ"},
        {"name": "Rùa", "emotion": "vui mừng, khiêm tốn"}
      ],
      "dialogue": [
        {"Thỏ": "Tôi... đã quá chủ quan."},
        {"Rùa": "Không sao đâu, mỗi cuộc đua là một bài học."}
      ],
      "moral": "Chậm mà chắc, kiên trì sẽ chiến thắng sự chủ quan."
    }
  ]
};

// A helper to generate a descriptive prompt for the video model from a scene object.
export const generatePromptFromScene = (scene: any): string => {
    const parts: string[] = [];
    
    // Core description
    parts.push(scene.description);

    // Setting details
    if (scene.setting) {
        parts.push(`The scene is set in a ${scene.setting.location} in the ${scene.setting.time}.`);
    }

    // Character emotions and presence
    if (scene.characters) {
        const characterDescriptions = scene.characters.map((c: any) => `${c.name} is present, feeling ${c.emotion}`).join('. ');
        parts.push(characterDescriptions);
    }
    
    // Specific actions
    if (scene.action) {
        parts.push(`Key actions: ${scene.action.join(', ')}.`);
    }

    // Implied dialogue or monologue for context
    if (scene.dialogue) {
        const dialogueSummary = scene.dialogue.map((d: any) => `${Object.keys(d)[0]} says something like "${Object.values(d)[0]}"`).join(' ');
        parts.push(`Visually represent the moment where ${dialogueSummary}.`);
    }
    
    if (scene.monologue) {
        parts.push(`The mood reflects Rùa's inner thought: "${scene.monologue}".`);
    }

    // Combine into a cohesive prompt
    return parts.join(' ').replace(/\s+/g, ' ').trim();
};
