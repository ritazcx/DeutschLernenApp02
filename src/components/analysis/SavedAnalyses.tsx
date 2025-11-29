import React, { useEffect, useState } from 'react';
import { listAnalyses, getAnalysis, deleteAnalysis } from '../../services/analysisService';

const SavedAnalyses: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any | null>(null);

  useEffect(() => {
    setLoading(true);
    listAnalyses().then((data: any) => {
      setItems(data.items || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const open = async (id: string) => {
    setSelectedId(id);
    setDetail(null);
    try {
      const d = await getAnalysis(id);
      setDetail(d);
    } catch (err) {
      console.error(err);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this saved analysis?')) return;
    try {
      await deleteAnalysis(id);
      setItems(items.filter(i => i.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setDetail(null);
      }
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  return (
    <div className="flex gap-4">
      <div className="w-1/3">
        <h2 className="text-lg font-semibold mb-2">Saved Analyses</h2>
        {loading && <div>Loading…</div>}
        <ul className="space-y-2">
          {items.map(item => (
            <li key={item.id} className="p-2 border rounded hover:bg-slate-50">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{item.title || item.id}</div>
                  <div className="text-sm text-slate-500">{item.word_count} words · {new Date(item.created_at).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => open(item.id)} className="text-sm text-blue-600">Open</button>
                  <button onClick={() => remove(item.id)} className="text-sm text-red-600">Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1">
        {selectedId ? (
          detail ? (
            <div>
              <h3 className="text-xl font-semibold mb-2">{detail.title || detail.id}</h3>
              <div className="prose">
                <pre className="whitespace-pre-wrap">{detail.text}</pre>
              </div>
              <div className="mt-4">
                {detail.sentences?.map((s: any, idx: number) => (
                  <div key={idx} className="mb-3">
                    <div className="font-medium">{s.sentence}</div>
                    <div className="text-sm text-slate-600">{s.translation}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>Loading detail…</div>
          )
        ) : (
          <div className="text-slate-500">Select an analysis to view details</div>
        )}
      </div>
    </div>
  );
};

export default SavedAnalyses;
