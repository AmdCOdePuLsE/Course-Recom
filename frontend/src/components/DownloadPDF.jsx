import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function DownloadPDF({ htmlId = 'syllabus-root', filename='syllabus.pdf' }){
  const download = async () => {
    const el = document.getElementById(htmlId)
    if (!el) return alert('Section not found')
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth
    const imgHeight = canvas.height * imgWidth / canvas.width

    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(filename)
  }
  return <button onClick={download} className="px-3 py-2 rounded bg-primary text-white">Download PDF</button>
}
