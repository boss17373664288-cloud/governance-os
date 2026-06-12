"use client";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) pages.push(i);

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t">
      <span className="text-sm text-gray-500">共 {total} 条，第 {page}/{totalPages} 页</span>
      <div className="flex gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page <= 1}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">上一页</button>
        {pages.map(p => (
          <button key={p} onClick={() => onChange(p)}
            className={`px-3 py-1 text-sm border rounded ${p === page ? "bg-blue-600 text-white border-blue-600" : "hover:bg-gray-100"}`}>{p}</button>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page >= totalPages}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">下一页</button>
      </div>
    </div>
  );
}
