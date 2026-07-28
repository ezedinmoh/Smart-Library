/**
 * QR Code generation — mirrors Django's Book.generate_qr_code()
 */
import QRCode from "qrcode";

export async function generateQRCode(
    isbn: string,
    title: string,
    author: string
): Promise<Buffer> {
    const data = `ISBN: ${isbn}\nTitle: ${title}\nAuthor: ${author}`;
    const buffer = await QRCode.toBuffer(data, {
        errorCorrectionLevel: "L",
        type: "png",
        margin: 4,
        width: 300,
    });
    return buffer;
}

export async function generateQRCodeDataURL(
    isbn: string,
    title: string,
    author: string
): Promise<string> {
    const data = `ISBN: ${isbn}\nTitle: ${title}\nAuthor: ${author}`;
    return QRCode.toDataURL(data, {
        errorCorrectionLevel: "L",
        margin: 4,
        width: 300,
    });
}
