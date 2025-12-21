// Utility to handle raw PCM audio data

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function playAudioData(base64Data: string, sampleRate: number = 24000) {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
  
  const byteArray = decodeBase64(base64Data);
  
  // Convert 16-bit PCM to Float32
  const dataInt16 = new Int16Array(byteArray.buffer);
  const float32Data = new Float32Array(dataInt16.length);
  
  for (let i = 0; i < dataInt16.length; i++) {
    float32Data[i] = dataInt16[i] / 32768.0;
  }

  const buffer = audioContext.createBuffer(1, float32Data.length, sampleRate);
  buffer.copyToChannel(float32Data, 0);

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start();

  return new Promise<void>((resolve) => {
    source.onended = () => {
      source.disconnect();
      audioContext.close();
      resolve();
    };
  });
}
