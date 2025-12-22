import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const exportPDF = async () => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pages = document.querySelectorAll(".roster-paper");

  for (let i = 0; i < pages.length; i++) {
    sanitizeColors(pages[i]); // 👈 FIX
    const canvas = await html2canvas(pages[i], { scale: 2 });
    const img = canvas.toDataURL("image/png");

    if (i !== 0) pdf.addPage();
    pdf.addImage(img, "PNG", 10, 10, 190, 0);
  }

  pdf.save("Class-Rosters.pdf");
};
 

export const exportPNG = async () => {
  const node = document.getElementById("all-rosters");
  const canvas = await html2canvas(node, { scale: 2 });
  const link = document.createElement("a");
  link.download = "Class-Rosters.png";
  link.href = canvas.toDataURL();
  link.click();
};

const sanitizeColors = (node) => {
  node.querySelectorAll("*").forEach(el => {
    const style = window.getComputedStyle(el);

    if (style.backgroundColor.includes("oklch")) {
      el.style.backgroundColor = "#ffffff";
    }
    if (style.color.includes("oklch")) {
      el.style.color = "#000000";
    }
  });
};
