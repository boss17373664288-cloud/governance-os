import { Response } from "express";

export function sendCsv(res: Response, filename: string, headers: string[], rows: any[][]) {
  const BOM = "\uFEFF";
  const csvContent = BOM + [
    headers.map(h => `"${h}"`).join(","),
    ...rows.map(row => row.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\r\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
  res.send(csvContent);
}