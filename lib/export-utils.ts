import * as XLSX from "xlsx";

export function exportToExcel(data: Record<string, any>[], filename: string = "Laporan_Monitoring_Tablet.xlsx") {
  if (!data || data.length === 0) {
    alert("Tidak ada data untuk diekspor.");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");

  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export function exportToPdf() {
  if (typeof window !== "undefined") {
    window.print();
  }
}
