import JsBarcode from 'jsbarcode'

export function useBarcode() {
  function generateBarcode(elementId: string, value: string, format = 'CODE128') {
    const el = document.getElementById(elementId)
    if (!el) return
    JsBarcode(`#${elementId}`, value, {
      format,
      width: 2,
      height: 60,
      displayValue: true,
      fontSize: 12,
      margin: 5,
    })
  }

  function generateBarcodeToDataUrl(value: string, format = 'CODE128'): string {
    const canvas = document.createElement('canvas')
    JsBarcode(canvas, value, {
      format,
      width: 2,
      height: 60,
      displayValue: true,
      fontSize: 12,
    })
    return canvas.toDataURL('image/png')
  }

  function generateSKU(name: string): string {
    const clean = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${clean}${rand}`
  }

  function generateBarcodValue(): string {
    return Date.now().toString().slice(-12)
  }

  return { generateBarcode, generateBarcodeToDataUrl, generateSKU, generateBarcodValue }
}
