/* 云端同步配置（公开信息，可放前端）
 * publishable key 只能调用 studyhub_get / studyhub_save 两个 RPC；
 * 真正的同步码（32 位）保存在浏览器里，相当于档案钥匙。
 */
window.StudyHubConfig = {
  supabaseUrl: 'https://bheonzqtihbvjvrviodf.supabase.co',
  supabaseKey: 'sb_publishable_DySwWOkKjXf5y-u8cr2yAA_5u8cjtMn'
};