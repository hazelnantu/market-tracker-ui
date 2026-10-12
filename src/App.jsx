import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [formData, setFormData] = useState({
    competitor: '', price: '', promo: '', socialVolume: '', kol: '', comments: ''
  });
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiReport, setAiReport] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('market_data').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); setLoading(false); return; }

    const processed = data.map((row, index) => {
      const prev = data.slice(index + 1).find(d => d.competitor_name === row.competitor_name);
      return {
        ...row,
        date: new Date(row.created_at).toLocaleDateString(),
        priceDiff: prev ? (row.price - prev.price).toFixed(0) : '-',
        socialDiff: prev ? (row.social_volume - prev.social_volume) : '-'
      };
    });
    setDataList(processed);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newRow = {
      competitor_name: formData.competitor,
      price: Number(formData.price) || 0,
      promo: formData.promo,
      social_volume: Number(formData.socialVolume) || 0,
      kol_activity: formData.kol,
      user_comments: formData.comments
    };
    const { error } = await supabase.from('market_data').insert([newRow]);
    if (error) alert('保存失败: ' + error.message);
    else {
      alert('✅ 数据已成功存入数据库！');
      setFormData({ competitor: '', price: '', promo: '', socialVolume: '', kol: '', comments: '' });
      fetchData();
    }
  };

  const handleGenerateReport = async () => {
    if (dataList.length === 0) { alert('没有数据可供分析'); return; }
    setIsGenerating(true);
    setAiReport('AI 正在阅读数据并撰写简报，请稍候...');
    
    try {
      // ✅ 请把下面单引号里的内容，替换成你的真实 Worker 网址！
      const WORKER_URL = 'https://market-tracker-api.hazelnantu.workers.dev/'; 
      
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataList })
      });
      const result = await response.json();
      
      if (result.error) throw new Error(result.error);
      setAiReport(result.choices[0].message.content);
    } catch (err) {
      setAiReport('生成失败：' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🌍 东北欧市场竞品与渠道追踪器</h1>
        <p className="text-gray-600 mb-6">输入每周竞品数据，自动对比历史数据，AI一键生成三语洞察简报与待办清单。</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md md:col-span-1">
            <h2 className="text-xl font-semibold mb-4">📝 本周数据录入</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required name="competitor" value={formData.competitor} onChange={handleChange} placeholder="竞品名称 (必填)" className="w-full border p-2 rounded" />
              <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="当前价格 (₽)" className="w-full border p-2 rounded" />
              <input name="promo" value={formData.promo} onChange={handleChange} placeholder="促销活动" className="w-full border p-2 rounded" />
              <input type="number" name="socialVolume" value={formData.socialVolume} onChange={handleChange} placeholder="社媒声量 (提及次数)" className="w-full border p-2 rounded" />
              <input name="kol" value={formData.kol} onChange={handleChange} placeholder="KOL/KOC合作" className="w-full border p-2 rounded" />
              <textarea name="comments" value={formData.comments} onChange={handleChange} placeholder="用户评论要点" rows="2" className="w-full border p-2 rounded"></textarea>
              <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-medium">保存本周数据</button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">📊 历史数据与变化检测</h2>
            {loading ? <p className="text-gray-500">正在从云端加载数据...</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border p-2">日期</th><th className="border p-2">竞品</th><th className="border p-2">价格(₽)</th>
                      <th className="border p-2">价格变化</th><th className="border p-2">声量</th><th className="border p-2">声量变化</th>
                      <th className="border p-2">促销</th><th className="border p-2">评论要点</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataList.length === 0 ? (
                      <tr><td colSpan="8" className="text-center p-4 text-gray-500">暂无数据，请在左侧录入第一条竞品数据。</td></tr>
                    ) : (
                      dataList.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="border p-2">{row.date}</td>
                          <td className="border p-2 font-medium">{row.competitor_name}</td>
                          <td className="border p-2">{row.price}</td>
                          <td className={`border p-2 font-bold ${row.priceDiff < 0 ? 'text-red-600' : (row.priceDiff > 0 ? 'text-green-600' : '')}`}>{row.priceDiff}</td>
                          <td className="border p-2">{row.social_volume}</td>
                          <td className={`border p-2 font-bold ${row.socialDiff > 0 ? 'text-blue-600' : (row.socialDiff < 0 ? 'text-red-600' : '')}`}>{row.socialDiff}</td>
                          <td className="border p-2">{row.promo || '-'}</td>
                          <td className="border p-2 text-xs">{row.user_comments || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">🤖 AI 洞察简报与跟进清单</h2>
          <div className="flex gap-2 mb-4">
            <button 
              onClick={handleGenerateReport} 
              disabled={isGenerating}
              className={`px-4 py-2 rounded font-medium text-white ${isGenerating ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isGenerating ? '⏳ AI 正在生成...' : '🚀 生成三语洞察简报'}
            </button>
          </div>
          {aiReport && (
            <div className="bg-gray-50 border p-4 rounded text-sm text-gray-800 whitespace-pre-wrap font-mono">
              {aiReport}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}