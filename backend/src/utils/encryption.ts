import crypto from 'crypto';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16;
  private static readonly SALT_LENGTH = 64;
  private static readonly TAG_LENGTH = 16;
  private static readonly KEY_LENGTH = 32;
  private static readonly ITERATIONS = 100000;

  static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static encrypt(data: any, key: string): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const salt = crypto.randomBytes(this.SALT_LENGTH);
    
    // Derive key using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(
      key,
      salt,
      this.ITERATIONS,
      this.KEY_LENGTH,
      'sha512'
    );

    const cipher = crypto.createCipheriv(this.ALGORITHM, derivedKey, iv);
    
    const jsonData = JSON.stringify(data);
    const encrypted = Buffer.concat([
      cipher.update(jsonData, 'utf8'),
      cipher.final()
    ]);

    const tag = cipher.getAuthTag();

    // Combine all components
    const result = Buffer.concat([
      salt,
      iv,
      tag,
      encrypted
    ]);

    return result.toString('base64');
  }

  static decrypt(encryptedData: string, key: string): any {
    const buffer = Buffer.from(encryptedData, 'base64');

    // Extract components
    const salt = buffer.slice(0, this.SALT_LENGTH);
    const iv = buffer.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
    const tag = buffer.slice(
      this.SALT_LENGTH + this.IV_LENGTH,
      this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH
    );
    const encrypted = buffer.slice(this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH);

    // Derive key using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(
      key,
      salt,
      this.ITERATIONS,
      this.KEY_LENGTH,
      'sha512'
    );

    const decipher = crypto.createDecipheriv(this.ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  }
} 