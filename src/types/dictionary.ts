export interface DictionaryEntry {
  // 核心字段（必需）
  word: string;
  translation: string;  // 英文翻译（必需，因为 UI 中直接使用）
  
  // 显示字段（可选）
  gender?: 'der' | 'die' | 'das' | '';  // 冠词/性别
  definition?: string;  // 德文定义
  exampleSentenceGerman?: string;  // 德文例句（支持 | 分隔多个）
  exampleSentenceEnglish?: string;  // 英文例句（支持 | 分隔多个）
  difficulty?: string;  // 难度级别（A1/A2/B1 等）
  imageUrl?: string;  // 图片 URL
  
  // 可选扩展字段（向后兼容）
  level?: string;  // 同 difficulty，用于兼容
  article?: string;  // 同 gender，用于兼容
  plural?: string;  // 复数形式（未来可能使用）
  examples?: string[];  // 旧格式的例句数组（向后兼容）
  audioUrl?: string;  // 音频 URL（未来可能使用）
}

