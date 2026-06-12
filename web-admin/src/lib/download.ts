import { api } from "./api";

export async function downloadCsv(url: string, filename: string) {
  const token = localStorage.getItem("access_token");
  if (!token) { alert("請先登入"); return; }
  
  try {
    const resp = await fetch(url, {
      headers: { Authorization: "Bearer " + token },
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ message: "下載失敗" }));
      alert(err.message || "下載失敗 (" + resp.status + ")");
      return;
    }
    const blob = await resp.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    }, 200);
  } catch (e: any) {
    alert("下載失敗: " + (e.message || "網絡錯誤"));
  }
}