export async function callGemini(
  actor: any,
  apiKey: string,
  prompt: string,
  imageBase64?: string,
  imageMimeType = "image/jpeg",
): Promise<string> {
  const parts: any[] = [];
  if (imageBase64) {
    parts.push({ inlineData: { mimeType: imageMimeType, data: imageBase64 } });
  }
  parts.push({ text: prompt });

  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: { temperature: 0.9, maxOutputTokens: 2048 },
  });

  const result = await actor.generateGeminiCompletion(apiKey, body);
  try {
    const parsed = JSON.parse(result);
    return parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? result;
  } catch {
    return result;
  }
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip data URL prefix
      const base64 = result.split(",")[1] ?? result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
