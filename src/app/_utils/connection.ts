import * as QRCode from "qrcode";

export const createQRCode = async (sdp: string): Promise<[string, string]> => {
  const center = (sdp.length / 2) % 2 === 0 ? sdp.length / 2 : sdp.length / 2 + 1;
  const qr1 = await QRCode.toDataURL(sdp.substring(0, center));
  const qr2 = await QRCode.toDataURL(sdp.substring(center));
  return [qr1, qr2];
}