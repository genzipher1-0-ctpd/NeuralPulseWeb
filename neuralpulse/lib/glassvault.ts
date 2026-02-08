
// GLASSVAULT CLIENT-SIDE ENCRYPTION
// Using standard Web Crypto API (AES-GCM)

export async function generateKey(): Promise<CryptoKey> {
    return window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function exportKey(key: CryptoKey): Promise<JsonWebKey> {
    return window.crypto.subtle.exportKey("jwk", key);
}

export async function importKey(jwk: JsonWebKey): Promise<CryptoKey> {
    return window.crypto.subtle.importKey(
        "jwk",
        jwk,
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function encryptData(data: string, key: CryptoKey): Promise<{ shards: string[], iv: string }> {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedContent = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        encodedData
    );

    // Convert to Base64
    const encryptedArray = new Uint8Array(encryptedContent);
    const encryptedString = btoa(String.fromCharCode(...encryptedArray));
    const ivString = btoa(String.fromCharCode(...iv));

    // Simple Sharding (Split by length)
    // In a real Poly-Sharding, we'd distribute these shards physically
    const shards: string[] = [];
    const shardSize = Math.ceil(encryptedString.length / 5);
    for (let i = 0; i < 5; i++) {
        shards.push(encryptedString.substring(i * shardSize, (i + 1) * shardSize));
    }

    return { shards, iv: ivString };
}

export async function decryptData(shards: string[], key: CryptoKey, iv: string): Promise<string> {
    // Reassemble
    const encryptedString = shards.join("");
    const encryptedArray = Uint8Array.from(atob(encryptedString), c => c.charCodeAt(0));
    const ivArray = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

    const decryptedContent = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: ivArray
        },
        key,
        encryptedArray
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedContent);
}
