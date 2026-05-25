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
  template?: 'standard' | 'flavor'
}

export function useLabel() {
  const SIZE_MM: Record<LabelSize, [number, number]> = {
    '40x30': [40, 30],
    '50x30': [50, 30],
    '60x40': [60, 40],
    '100x50': [100, 50],
  }

  async function loadLogoBase64(): Promise<string | null> {
    try {
      const response = await fetch('/logo.jpg')
      const blob = await response.blob()
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(blob)
      })
    } catch {
      return null
    }
  }

  function renderStandardLabel(doc: jsPDF, data: LabelData, w: number, h: number): void {
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

  function renderFlavorLabel(doc: jsPDF, data: LabelData, w: number, h: number, logoBase64: string | null): void {
    // Fundo branco
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, w, h, 'F')

    // Borda dourada
    doc.setDrawColor(184, 146, 74)
    doc.setLineWidth(0.5)
    doc.rect(0.5, 0.5, w - 1, h - 1)
    doc.setLineWidth(0.2)

    let cursorY = 2.5

    // Logo (se disponível)
    if (logoBase64) {
      const logoSize = Math.min(w * 0.3, h * 0.35, 14)
      const logoX = (w - logoSize) / 2
      doc.addImage(logoBase64, 'JPEG', logoX, cursorY, logoSize, logoSize)
      cursorY += logoSize + 1.5
    } else {
      // Fallback: nome da loja em dourado
      doc.setFontSize(6)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(184, 146, 74)
      doc.text(data.storeName, w / 2, cursorY + 3, { align: 'center' })
      cursorY += 6
    }

    // Linha separadora dourada
    doc.setDrawColor(184, 146, 74)
    doc.line(3, cursorY, w - 3, cursorY)
    cursorY += 3

    // "Sabor:" label
    doc.setFontSize(6)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(74, 44, 23)
    doc.text('Sabor:', 3, cursorY)
    cursorY += 1.5

    // Linha para escrita manual
    const lineY = cursorY + 3.5
    doc.setDrawColor(100, 100, 100)
    doc.setLineWidth(0.3)
    doc.line(3, lineY, w - 3, lineY)
    cursorY = lineY + 3

    // Segunda linha de sabor (para etiquetas maiores)
    if (h >= 40) {
      doc.line(3, cursorY + 3.5, w - 3, cursorY + 3.5)
      cursorY += 7
    }

    // Linha separadora
    doc.setDrawColor(184, 146, 74)
    doc.setLineWidth(0.2)
    doc.line(3, cursorY, w - 3, cursorY)
    cursorY += 2

    // Validade
    if (data.expirationDate) {
      doc.setFontSize(5.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(80, 80, 80)
      doc.text(`Val: ${data.expirationDate}`, w / 2, cursorY + 2, { align: 'center' })
      cursorY += 4
    }

    // Código de barras (só se tiver espaço)
    const barcodeH = 10
    const remainingSpace = h - cursorY - 1
    if (data.barcode && remainingSpace >= barcodeH + 1) {
      try {
        const canvas = document.createElement('canvas')
        JsBarcode(canvas, data.barcode, {
          format: 'CODE128',
          width: 1.2,
          height: 25,
          displayValue: true,
          fontSize: 6,
          margin: 0,
        })
        const barcodeImg = canvas.toDataURL('image/png')
        const barcodeW = w - 6
        doc.addImage(barcodeImg, 'PNG', 3, h - barcodeH - 1, barcodeW, barcodeH)
      } catch {
        // sem código de barras válido
      }
    }
  }

  async function generatePDFLabel(data: LabelData): Promise<void> {
    const [w, h] = SIZE_MM[data.size]
    const copies = data.copies || 1
    const isFlavor = data.template === 'flavor'

    let logoBase64: string | null = null
    if (isFlavor) {
      logoBase64 = await loadLogoBase64()
    }

    const doc = new jsPDF({
      orientation: w > h ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [w, h]
    })

    for (let i = 0; i < copies; i++) {
      if (i > 0) doc.addPage([w, h], w > h ? 'landscape' : 'portrait')

      if (isFlavor) {
        renderFlavorLabel(doc, data, w, h, logoBase64)
      } else {
        renderStandardLabel(doc, data, w, h)
      }
    }

    const suffix = isFlavor ? '-sabor' : ''
    doc.save(`etiqueta-${data.productName.replace(/\s+/g, '-')}${suffix}.pdf`)
  }

  function generateZPL(data: LabelData): string {
    const [w, h] = SIZE_MM[data.size]
    const dotsW = Math.round(w * 8)
    const dotsH = Math.round(h * 8)
    const isFlavor = data.template === 'flavor'

    let zpl = `^XA\n`
    zpl += `^PW${dotsW}\n`
    zpl += `^LL${dotsH}\n`

    if (isFlavor) {
      zpl += `^FO10,10^A0N,20,20^FD${data.storeName}^FS\n`
      zpl += `^FO10,38^A0N,18,18^FDSabor:^FS\n`
      // Linha para escrita manual
      zpl += `^FO10,62^GB${dotsW - 20},2,2^FS\n`
      if (h >= 40) {
        zpl += `^FO10,88^GB${dotsW - 20},2,2^FS\n`
      }
      if (data.expirationDate) {
        zpl += `^FO10,${h >= 40 ? 108 : 78}^A0N,16,16^FDVal: ${data.expirationDate}^FS\n`
      }
      if (data.barcode) {
        zpl += `^FO10,${h >= 40 ? 128 : 98}^BCN,40,Y,N,N^FD${data.barcode}^FS\n`
      }
    } else {
      zpl += `^FO10,10^A0N,20,20^FD${data.storeName}^FS\n`
      zpl += `^FO10,35^A0N,24,24^FD${data.productName}^FS\n`
      if (data.expirationDate) {
        zpl += `^FO10,65^A0N,18,18^FDVal: ${data.expirationDate}^FS\n`
      }
      if (data.barcode) {
        zpl += `^FO10,85^BCN,50,Y,N,N^FD${data.barcode}^FS\n`
      }
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
