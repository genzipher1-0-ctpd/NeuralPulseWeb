
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

// Server-Side Encryption Vault (At-Rest Encryption)
// Uses AES-256-CBC

// Demo Key: In production, store this in a secure KMS
const SECRET_KEY = process.env.ENCRYPTION_KEY || "neural-pulse-master-secret-key-2035";
// Ensure key is 32 bytes (Raw Buffer)
const key = createHash('sha256').update(String(SECRET_KEY)).digest();

export function encryptPacket(data: any): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(JSON.stringify(data));
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decryptPacket(text: string): any {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return JSON.parse(decrypted.toString());
}
