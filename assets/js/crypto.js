/**
 * ============================================================
 * CRYPTO MODULE - PENTAS PAI KOTA BANDUNG 2026
 * ============================================================
 * Modul enkripsi menggunakan Web Crypto API
 * - RSA-2048 untuk enkripsi data sensitif
 * - PBKDF2 untuk derivasi password
 * - SHA-256 untuk hashing
 * ============================================================
 */

/**
 * Kelas untuk manajemen kriptografi
 */
class CryptoManager {
    constructor() {
        this.publicKey = null;
        this.privateKeyShards = [];
    }
    
    /**
     * Generate pasangan kunci RSA-2048
     * @returns {Promise<{publicKey: CryptoKey, privateKey: CryptoKey}>}
     */
    async generateKeyPair() {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: 'RSA-OAEP',
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: 'SHA-256'
            },
            true, // extractable
            ['encrypt', 'decrypt']
        );
        
        return keyPair;
    }
    
    /**
     * Export public key ke format PEM
     * @param {CryptoKey} publicKey 
     * @returns {Promise<string>} PEM string
     */
    async exportPublicKeyToPEM(publicKey) {
        const exported = await window.crypto.subtle.exportKey('spki', publicKey);
        const exportedAsString = String.fromCharCode(...new Uint8Array(exported));
        const exportedAsBase64 = btoa(exportedAsString);
        const pemExported = `-----BEGIN PUBLIC KEY-----\n${this.chunkString(exportedAsBase64, 64)}\n-----END PUBLIC KEY-----`;
        return pemExported;
    }
    
    /**
     * Import public key dari format PEM
     * @param {string} pemString 
     * @returns {Promise<CryptoKey>}
     */
    async importPublicKeyFromPEM(pemString) {
        const pemHeader = '-----BEGIN PUBLIC KEY-----';
        const pemFooter = '-----END PUBLIC KEY-----';
        const pemContents = pemString
            .replace(pemHeader, '')
            .replace(pemFooter, '')
            .replace(/\s/g, '');
        
        const binaryDer = window.atob(pemContents);
        const binaryDerBuffer = new ArrayBuffer(binaryDer.length);
        const binaryDerView = new Uint8Array(binaryDerBuffer);
        for (let i = 0; i < binaryDer.length; i++) {
            binaryDerView[i] = binaryDer.charCodeAt(i);
        }
        
        return await window.crypto.subtle.importKey(
            'spki',
            binaryDerBuffer,
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256'
            },
            true,
            ['encrypt']
        );
    }
    
    /**
     * Export private key ke format PEM
     * @param {CryptoKey} privateKey 
     * @returns {Promise<string>} PEM string
     */
    async exportPrivateKeyToPEM(privateKey) {
        const exported = await window.crypto.subtle.exportKey('pkcs8', privateKey);
        const exportedAsString = String.fromCharCode(...new Uint8Array(exported));
        const exportedAsBase64 = btoa(exportedAsString);
        const pemExported = `-----BEGIN PRIVATE KEY-----\n${this.chunkString(exportedAsBase64, 64)}\n-----END PRIVATE KEY-----`;
        return pemExported;
    }
    
    /**
     * Enkripsi data menggunakan RSA public key
     * @param {string} data - Data plaintext
     * @param {CryptoKey} publicKey - RSA public key
     * @returns {Promise<string>} Base64 ciphertext
     */
    async encryptData(data, publicKey) {
        const encoder = new TextEncoder();
        const encodedData = encoder.encode(data);
        
        const encrypted = await window.crypto.subtle.encrypt(
            {
                name: 'RSA-OAEP'
            },
            publicKey,
            encodedData
        );
        
        return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    }
    
    /**
     * Enkripsi data dengan public key PEM (untuk digunakan di frontend)
     * @param {string} data - Data plaintext
     * @param {string} pemPublicKey - Public key dalam format PEM
     * @returns {Promise<string>} Base64 ciphertext
     */
    async encryptWithPEM(data, pemPublicKey) {
        const publicKey = await this.importPublicKeyFromPEM(pemPublicKey);
        return await this.encryptData(data, publicKey);
    }
    
    /**
     * Hash data menggunakan SHA-256
     * @param {string} data - Data untuk dihash
     * @returns {Promise<string>} Hex hash
     */
    async sha256(data) {
        const encoder = new TextEncoder();
        const encoded = encoder.encode(data);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    /**
     * Derive key menggunakan PBKDF2
     * @param {string} password - Password
     * @param {Uint8Array} salt - Salt (minimal 16 bytes)
     * @param {number} iterations - Jumlah iterasi (default: 100000)
     * @returns {Promise<CryptoKey>}
     */
    async deriveKeyPBKDF2(password, salt, iterations = 100000) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        
        const baseKey = await window.crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveKey']
        );
        
        return await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: iterations,
                hash: 'SHA-256'
            },
            baseKey,
            {
                name: 'AES-GCM',
                length: 256
            },
            true,
            ['encrypt', 'decrypt']
        );
    }
    
    /**
     * Generate salt random
     * @param {number} length - Panjang salt dalam bytes
     * @returns {Uint8Array}
     */
    generateSalt(length = 16) {
        return window.crypto.getRandomValues(new Uint8Array(length));
    }
    
    /**
     * Generate IV random untuk AES-GCM
     * @returns {Uint8Array}
     */
    generateIV() {
        return window.crypto.getRandomValues(new Uint8Array(12));
    }
    
    /**
     * Enkripsi data menggunakan AES-GCM
     * @param {string} data - Data plaintext
     * @param {CryptoKey} key - AES key
     * @param {Uint8Array} iv - Initialization vector
     * @returns {Promise<string>} Base64 ciphertext
     */
    async encryptAESGCM(data, key, iv) {
        const encoder = new TextEncoder();
        const encoded = encoder.encode(data);
        
        const encrypted = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            encoded
        );
        
        return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    }
    
    /**
     * Split string menjadi chunks
     * @param {string} str 
     * @param {number} size 
     * @returns {string}
     */
    chunkString(str, size) {
        const chunks = [];
        for (let i = 0; i < str.length; i += size) {
            chunks.push(str.substring(i, i + size));
        }
        return chunks.join('\n');
    }
    
    /**
     * Split private key menjadi 3 shards menggunakan Shamir's Secret Sharing sederhana
     * @param {string} privateKeyPEM - Private key dalam format PEM
     * @returns {Array<{shard: string, index: number}>} Array of shards
     */
    splitPrivateKey(privateKeyPEM) {
        // Generate 3 shards dengan XOR sederhana
        // Catatan: Ini adalah implementasi sederhana, untuk produksi gunakan library SSS yang proper
        const encoder = new TextEncoder();
        const data = encoder.encode(privateKeyPEM);
        
        // Generate 2 random shards
        const shard1 = window.crypto.getRandomValues(new Uint8Array(data.length));
        const shard2 = window.crypto.getRandomValues(new Uint8Array(data.length));
        
        // Shard3 = data XOR shard1 XOR shard2
        const shard3 = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
            shard3[i] = data[i] ^ shard1[i] ^ shard2[i];
        }
        
        return [
            { index: 1, shard: btoa(String.fromCharCode(...shard1)), label: 'Ketua Panitia' },
            { index: 2, shard: btoa(String.fromCharCode(...shard2)), label: 'Sekretaris' },
            { index: 3, shard: btoa(String.fromCharCode(...shard3)), label: 'Bendahara' }
        ];
    }
    
    /**
     * Reconstruct private key dari 3 shards
     * @param {Array<string>} shards - Array of 3 shards
     * @returns {string} Private key PEM
     */
    reconstructPrivateKey(shards) {
        if (shards.length !== 3) {
            throw new Error('Diperlukan 3 shards untuk merekonstruksi private key');
        }
        
        const shard1 = new Uint8Array(Array.from(atob(shards[0])).map(c => c.charCodeAt(0)));
        const shard2 = new Uint8Array(Array.from(atob(shards[1])).map(c => c.charCodeAt(0)));
        const shard3 = new Uint8Array(Array.from(atob(shards[2])).map(c => c.charCodeAt(0)));
        
        const data = new Uint8Array(shard1.length);
        for (let i = 0; i < shard1.length; i++) {
            data[i] = shard1[i] ^ shard2[i] ^ shard3[i];
        }
        
        return String.fromCharCode(...data);
    }
    
    /**
     * Enkripsi field data sensitif
     * @param {Object} data - Object berisi data sensitif
     * @param {string} publicKeyPEM - Public key PEM
     * @returns {Promise<Object>} Object dengan data terenkripsi
     */
    async encryptSensitiveFields(data, publicKeyPEM) {
        const encrypted = {};
        
        for (const [key, value] of Object.entries(data)) {
            if (value) {
                encrypted[key] = await this.encryptWithPEM(String(value), publicKeyPEM);
            }
        }
        
        return encrypted;
    }
    
    /**
     * Generate hash SHA-256 untuk NISN (untuk public log)
     * @param {string} nisn 
     * @returns {Promise<string>}
     */
    async hashNISN(nisn) {
        return await this.sha256(nisn);
    }
}

// ============================================
// AUTHENTICATION MODULE (PBKDF2)
// ============================================

/**
 * Kelas untuk autentikasi admin menggunakan PBKDF2
 */
class AuthManager {
    constructor() {
        this.sessionKey = null;
        this.sessionExpiry = null;
    }
    
    /**
     * Hash password menggunakan PBKDF2
     * @param {string} password - Password plaintext
     * @param {Uint8Array} salt - Salt (16 bytes)
     * @returns {Promise<{hash: string, salt: string}>}
     */
    async hashPassword(password, salt = null) {
        const cryptoManager = new CryptoManager();
        
        if (!salt) {
            salt = cryptoManager.generateSalt(16);
        }
        
        const key = await cryptoManager.deriveKeyPBKDF2(password, salt, 100000);
        const exported = await window.crypto.subtle.exportKey('raw', key);
        const hashArray = Array.from(new Uint8Array(exported));
        const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return {
            hash: hash,
            salt: btoa(String.fromCharCode(...salt))
        };
    }
    
    /**
     * Verifikasi password
     * @param {string} password - Password input
     * @param {string} storedHash - Hash yang tersimpan
     * @param {string} storedSalt - Salt yang tersimpan
     * @returns {Promise<boolean>}
     */
    async verifyPassword(password, storedHash, storedSalt) {
        const salt = new Uint8Array(Array.from(atob(storedSalt)).map(c => c.charCodeAt(0)));
        const result = await this.hashPassword(password, salt);
        return result.hash === storedHash;
    }
    
    /**
     * Generate JWT token sederhana (untuk session)
     * @param {Object} payload - Data payload
     * @param {string} secret - Secret key
     * @returns {Promise<string>} JWT token
     */
    async generateJWT(payload, secret) {
        const header = { alg: 'HS256', typ: 'JWT' };
        const encodedHeader = btoa(JSON.stringify(header));
        const encodedPayload = btoa(JSON.stringify(payload));
        
        const cryptoManager = new CryptoManager();
        const signature = await cryptoManager.sha256(`${encodedHeader}.${encodedPayload}.${secret}`);
        
        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }
    
    /**
     * Verifikasi JWT token
     * @param {string} token - JWT token
     * @param {string} secret - Secret key
     * @returns {Promise<Object|null>} Payload jika valid, null jika tidak
     */
    async verifyJWT(token, secret) {
        const [header, payload, signature] = token.split('.');
        
        const cryptoManager = new CryptoManager();
        const expectedSignature = await cryptoManager.sha256(`${header}.${payload}.${secret}`);
        
        if (signature !== expectedSignature) {
            return null;
        }
        
        const decodedPayload = JSON.parse(atob(payload));
        
        // Cek expiry
        if (decodedPayload.exp && Date.now() > decodedPayload.exp) {
            return null;
        }
        
        return decodedPayload;
    }
    
    /**
     * Set session di memory (bukan localStorage untuk keamanan)
     * @param {string} token - JWT token
     * @param {number} expiry - Timestamp expiry
     */
    setSession(token, expiry) {
        this.sessionKey = token;
        this.sessionExpiry = expiry;
    }
    
    /**
     * Clear session
     */
    clearSession() {
        this.sessionKey = null;
        this.sessionExpiry = null;
    }
    
    /**
     * Cek apakah session valid
     * @returns {boolean}
     */
    isSessionValid() {
        if (!this.sessionKey || !this.sessionExpiry) {
            return false;
        }
        return Date.now() < this.sessionExpiry;
    }
    
    /**
     * Get session token
     * @returns {string|null}
     */
    getSessionToken() {
        if (this.isSessionValid()) {
            return this.sessionKey;
        }
        return null;
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate RSA key pair dan simpan ke localStorage (untuk development)
 * @returns {Promise<{publicKey: string, privateKeyShards: Array}>}
 */
async function setupEncryptionKeys() {
    const cryptoManager = new CryptoManager();
    
    try {
        // Generate key pair
        const keyPair = await cryptoManager.generateKeyPair();
        
        // Export keys
        const publicKeyPEM = await cryptoManager.exportPublicKeyToPEM(keyPair.publicKey);
        const privateKeyPEM = await cryptoManager.exportPrivateKeyToPEM(keyPair.privateKey);
        
        // Split private key
        const shards = cryptoManager.splitPrivateKey(privateKeyPEM);
        
        // Simpan public key
        localStorage.setItem('RSA_PUBLIC_KEY', publicKeyPEM);
        
        return {
            publicKey: publicKeyPEM,
            privateKeyShards: shards
        };
    } catch (error) {
        console.error('Error generating keys:', error);
        throw error;
    }
}

/**
 * Enkripsi data form untuk dikirim ke server
 * @param {Object} formData - Data form
 * @returns {Promise<Object>} Data terenkripsi
 */
async function encryptFormData(formData) {
    const cryptoManager = new CryptoManager();
    const publicKeyPEM = localStorage.getItem('RSA_PUBLIC_KEY');
    
    if (!publicKeyPEM) {
        throw new Error('Public key tidak ditemukan. Silakan setup enkripsi terlebih dahulu.');
    }
    
    // Data yang perlu dienkripsi (sensitif)
    const sensitiveFields = {
        nisn: formData.nisn,
        hpPeserta: formData.hpPeserta,
        hpOfficial: formData.hpOfficial,
        email: formData.email
    };
    
    // Enkripsi data sensitif
    const encryptedSensitive = await cryptoManager.encryptSensitiveFields(sensitiveFields, publicKeyPEM);
    
    // Hash NISN untuk public log
    const nisnHash = await cryptoManager.hashNISN(formData.nisn);
    
    // Mask data untuk public log
    const maskedData = {
        nisn: maskData(formData.nisn, 4),
        hpPeserta: maskData(formData.hpPeserta, 4),
        email: maskEmail(formData.email)
    };
    
    return {
        // Data publik (tidak dienkripsi)
        public: {
            namaSekolah: formData.namaSekolah,
            npsn: formData.npsn,
            kecamatan: formData.kecamatan,
            namaPeserta: formData.namaPeserta,
            jenisKelamin: formData.jenisKelamin,
            kelas: formData.kelas,
            jenisLomba: formData.jenisLomba,
            tanggalDaftar: new Date().toISOString()
        },
        // Data terenkripsi (sensitif)
        encrypted: encryptedSensitive,
        // Data untuk public log
        publicLog: {
            nisnHash: nisnHash,
            masked: maskedData,
            status: 'MENUNGGU_VERIFIKASI'
        }
    };
}

/**
 * Mask email untuk ditampilkan
 * @param {string} email 
 * @returns {string}
 */
function maskEmail(email) {
    if (!email) return '';
    const [username, domain] = email.split('@');
    const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
}

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CryptoManager,
        AuthManager,
        setupEncryptionKeys,
        encryptFormData
    };
}
