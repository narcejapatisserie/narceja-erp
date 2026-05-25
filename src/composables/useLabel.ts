import JsBarcode from 'jsbarcode'
import { jsPDF } from 'jspdf'
import type { LabelSize } from '@/types'

interface LabelData {
  storeName: string
  productName: string
  barcode: string
  expirationDate?: string
  size: LabelSize
  copies?: number
}

export function useLabel() {
  const SIZE_MM: Record<LabelSize, [number, number]> = {
    '40x30': [40, 30],
    '50x30': [50, 30],
    '60x40': [60, 40],
    '100x50': [100, 50],
  }

  function generatePDFLabel(data: LabelData): void {
    const [w, h] = SIZE_MM[data.size]
    const copies = data.copies || 1

    const doc = new jsPDF({
      orientation: w > h ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [w, h]
    })

    for (let i = 0; i < copies; i++) {
      if (i > 0) doc.addPage([w, h], w > h ? 'landscape' : 'portrait')

      // Fundo branco
      doc.setFillColor(255, 255, 255)
      doc.rect(0, 0, w, h, 'F')

      // Borda
      doc.setDrawColor(200, 200, 200)
      doc.rect(0.5, 0.5, w - 1, h - 1)

      // Nome da loja
      doc.setFontSize(6)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(74, 44, 23)
      doc.text(data.storeName, w / 2, 4, { align: 'center' })

      // Nome do produto
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      const productLines = doc.splitTextToSize(data.productName, w - 4)
      doc.text(productLines, w / 2, 9, { align: 'center' })

      // Validade
      if (data.expirationDate) {
        doc.setFontSize(5.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(80, 80, 80)
        doc.text(`Val: ${data.expirationDate}`, w / 2, h - 9, { align: 'center' })
      }

      // Código de barras
      if (data.barcode) {
        try {
          const canvas = document.createElement('canvas')
          JsBarcode(canvas, data.barcode, {
            format: 'CODE128',
            width: 1.5,
            height: 30,
            displayValue: true,
            fontSize: 7,
            margin: 0,
          })
          const barcodeImg = canvas.toDataURL('image/png')
          const barcodeW = w - 8
          const barcodeH = 12
          doc.addImage(barcodeImg, 'PNG', 4, h - 8 - barcodeH, barcodeW, barcodeH)
        } catch {
          // sem código de barras válido
        }
      }
    }

    doc.save(`etiqueta-${data.productName.replace(/\s+/g, '-')}.pdf`)
  }

  function generateZPL(data: LabelData): string {
    const [w, h] = SIZE_MM[data.size]
    const dotsW = Math.round(w * 8)
    const dotsH = Math.round(h * 8)

    let zpl = `^XA\n`
    zpl += `^PW${dotsW}\n`
    zpl += `^LL${dotsH}\n`
    zpl += `^FO10,10^A0N,20,20^FD${data.storeName}^FS\n`
    zpl += `^FO10,35^A0N,24,24^FD${data.productName}^FS\n`

    if (data.expirationDate) {
      zpl += `^FO10,65^A0N,18,18^FDVal: ${data.expirationDate}^FS\n`
    }

    if (data.barcode) {
      zpl += `^FO10,85^BCN,50,Y,N,N^FD${data.barcode}^FS\n`
    }

    zpl += `^PQ${data.copies || 1}\n^XZ`
    return zpl
  }

  function downloadZPL(data: LabelData): void {
    const zpl = generateZPL(data)
    const blob = new Blob([zpl], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `etiqueta-${data.productName.replace(/\s+/g, '-')}.zpl`
    a.click()
    URL.revokeObjectURL(url)
  }

  return { generatePDFLabel, generateZPL, downloadZPL }
}
