/**
 * Supabase 保活脚本
 * 通过 GitHub Actions 定时执行，防止免费项目因不活跃被暂停
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[keep-alive] 缺少必要的环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function keepAlive(): Promise<void> {
  console.log(`[${new Date().toISOString()}] 开始执行保活任务`);

  let successCount = 0;
  const operations: Array<{ method: string; success: boolean; error?: string }> = [];

  // 方法1: Storage API 健康检查
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('[keep-alive] Storage API 检查错误:', error.message);
      operations.push({ method: 'Storage API check', success: false, error: error.message });
    } else {
      console.log(`[keep-alive] Storage API 检查成功，Buckets 数量: ${data?.length || 0}`);
      operations.push({ method: 'Storage API check', success: true });
      successCount++;
    }
  } catch (error) {
    console.error('[keep-alive] Storage API 异常:', String(error));
    operations.push({ method: 'Storage API check', success: false, error: String(error) });
  }

  // 方法2: 数据库查询保活（查询不存在的表，预期报错但保持连接活跃）
  try {
    const { error } = await supabase
      .from(`_keep_alive_test_${Date.now()}`)
      .select('*')
      .limit(1);

    if (error && error.code === '42P01') {
      console.log('[keep-alive] 保活查询执行成功（预期的表不存在错误）');
      operations.push({ method: 'Keep-alive query', success: true });
      successCount++;
    } else if (error) {
      console.error('[keep-alive] 保活查询错误:', error.message);
      operations.push({ method: 'Keep-alive query', success: false, error: error.message });
    } else {
      console.log('[keep-alive] 保活查询意外成功');
      operations.push({ method: 'Keep-alive query', success: true });
      successCount++;
    }
  } catch (error) {
    console.error('[keep-alive] 保活查询异常:', String(error));
    operations.push({ method: 'Keep-alive query', success: false, error: String(error) });
  }

  // 方法3: Auth API 健康检查
  try {
    const { error } = await supabase.auth.getUser();
    if (error && error.message !== 'Auth session missing!') {
      console.error('[keep-alive] Auth API 检查错误:', error.message);
      operations.push({ method: 'Auth API check', success: false, error: error.message });
    } else {
      console.log('[keep-alive] Auth API 检查成功');
      operations.push({ method: 'Auth API check', success: true });
      successCount++;
    }
  } catch (error) {
    console.error('[keep-alive] Auth API 异常:', String(error));
    operations.push({ method: 'Auth API check', success: false, error: String(error) });
  }

  // 总结
  console.log(`[${new Date().toISOString()}] 保活任务执行完成`);
  console.log(`成功操作数: ${successCount}/${operations.length}`);
  console.log('操作详情:', JSON.stringify(operations, null, 2));

  if (successCount === 0) {
    console.error('[keep-alive] 所有保活操作都失败了');
    process.exit(1);
  }
}

keepAlive()
  .then(() => {
    console.log('[keep-alive] 保活脚本执行成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[keep-alive] 保活脚本执行失败:', error);
    process.exit(1);
  });
