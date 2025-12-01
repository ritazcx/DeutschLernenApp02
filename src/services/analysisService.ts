export async function listAnalyses(limit = 20, offset = 0) {
  const res = await fetch(`/api/analyses?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error('Failed to list analyses');
  return res.json();
}

export async function getAnalysis(id: string) {
  const res = await fetch(`/api/analyses/${id}`);
  if (!res.ok) throw new Error('Failed to get analysis');
  return res.json();
}

export async function saveAnalysis(payload: any) {
  const res = await fetch('/api/analyses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save analysis');
  return res.json();
}

export async function deleteAnalysis(id: string) {
  const res = await fetch(`/api/analyses/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete analysis');
  return res.json();
}

export default { listAnalyses, getAnalysis, saveAnalysis, deleteAnalysis };
