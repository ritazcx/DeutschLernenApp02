import React from 'react';

interface Props {
  analysis: any;
}

const AnalysisDetail: React.FC<Props> = ({ analysis }) => {
  if (!analysis) return <div />;

  return (
    <div>
      <h2 className="text-xl font-semibold">{analysis.title || analysis.id}</h2>
      <p className="text-sm text-slate-600">{analysis.word_count} words</p>
      <div className="mt-4 prose">
        <pre className="whitespace-pre-wrap">{analysis.text}</pre>
      </div>
      <div className="mt-6">
        {analysis.sentences?.map((s: any, i: number) => (
          <div key={i} className="mb-4">
            <div className="font-medium">{s.sentence}</div>
            <div className="text-sm text-slate-600">{s.translation}</div>
            <ul className="mt-2 list-disc ml-5 text-sm text-slate-700">
              {s.grammarPoints?.map((p: any, j: number) => (
                <li key={j}><strong>{p.type}</strong>: {p.text} — {p.explanation}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalysisDetail;
