import { GoogleGenAI, Type } from "@google/genai";
import type { VideoConfig } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateCharacterImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `A full-body character portrait in a cinematic style. The character is: ${prompt}`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1',
      },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
  } catch (error) {
    console.error("Error generating character image:", error);
    throw new Error("Failed to generate character image.");
  }
};

export const generateScenesFromStory = async (storyPrompt: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a screenwriting assistant. Based on the following story description, break it down into a sequence of 5 to 10 distinct, visually descriptive scenes. Each scene should be a short prompt suitable for a text-to-video AI model.

Story: "${storyPrompt}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenes: {
              type: Type.ARRAY,
              description: "An array of strings, where each string is a descriptive prompt for a video scene.",
              items: {
                type: Type.STRING
              }
            }
          }
        },
      },
    });

    const jsonResponse = JSON.parse(response.text);
    return jsonResponse.scenes || [];
  } catch (error) {
    console.error("Error generating scenes:", error);
    throw new Error("Failed to generate scenes from story.");
  }
};

export const generateScenePreviewVideo = async (
  scenePrompt: string,
  config: VideoConfig
): Promise<string> => {
  try {
    const fullPrompt = `Create a short video clip, approximately 5-7 seconds long, for the following scene description. Aspect ratio: ${config.aspectRatio}. Scene: "${scenePrompt}"`;
    
    let operation = await ai.models.generateVideos({
      model: config.model,
      prompt: fullPrompt,
      config: {
        numberOfVideos: 1,
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) {
        throw new Error(`Scene preview generation failed: ${operation.error.message}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Could not get preview video download link from API.");
    }
    
    return downloadLink;

  } catch (error) {
    console.error("Error generating scene preview:", error);
    throw error;
  }
};


export const generateVideo = async (
  finalPrompt: string,
  config: VideoConfig,
  updateLog: (message: string) => void
): Promise<string> => {
  try {
    updateLog("Bắt đầu yêu cầu tạo video...");
    let operation = await ai.models.generateVideos({
      model: config.model,
      prompt: finalPrompt,
      config: {
        numberOfVideos: 1,
      }
    });

    updateLog(`Đã gửi yêu cầu. Operation ID: ${operation.name}. Đang chờ xử lý...`);
    updateLog("Quá trình này có thể mất vài phút. Vui lòng kiên nhẫn.");

    let pollCount = 0;
    while (!operation.done) {
      pollCount++;
      updateLog(`Kiểm tra trạng thái lần thứ ${pollCount}...`);
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) {
        throw new Error(`Video generation failed with error: ${operation.error.message}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Không thể lấy được link tải video từ API.");
    }
    
    updateLog("Tạo video thành công! Chuẩn bị link tải xuống.");
    return downloadLink;

  } catch (error) {
    console.error("Error generating video:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    updateLog(`Lỗi: ${errorMessage}`);
    throw new Error("Failed to generate video.");
  }
};