import QRCode from 'qrcode'

export const generateQRImage = async (value: string): Promise<string> => {
  return QRCode.toDataURL(value, { width: 300, margin: 1 })
}
