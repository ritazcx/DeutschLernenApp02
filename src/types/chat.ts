export interface ChatMessage {
  // UI 显示字段
  id?: string;  // UI 需要，API 不需要
  text?: string;  // UI 显示用
  correction?: string;  // UI 显示用（语法纠正）
  
  // API 调用字段
  role: 'user' | 'model' | 'assistant' | 'system';  // 支持所有角色
  content?: string;  // API 调用用（与 text 互斥，用于 API）
}
