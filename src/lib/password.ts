/**
 * Password utilities — verify Django (pbkdf2_sha256) and bcrypt hashes.
 * New passwords are stored as bcrypt; Django hashes are upgraded on login.
 */

import crypto from "crypto";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

function verifyDjangoPbkdf2(password: string, encoded: string): boolean {
    const parts = encoded.split("$");
    if (parts.length !== 4) return false;

    const [algorithm, iterationsStr, salt, storedHash] = parts;
    if (algorithm !== "pbkdf2_sha256") return false;

    const iterations = parseInt(iterationsStr, 10);
    if (!Number.isFinite(iterations) || iterations <= 0) return false;

    const derived = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256");

    try {
        const stored = Buffer.from(storedHash, "base64");
        if (derived.length !== stored.length) return false;
        return crypto.timingSafeEqual(derived, stored);
    } catch {
        return false;
    }
}

function isBcryptHash(hash: string): boolean {
    return /^\$2[aby]\$/.test(hash);
}

function isDjangoHash(hash: string): boolean {
    return hash.startsWith("pbkdf2_sha256$");
}

/** True when the stored hash should be replaced with bcrypt after a successful login. */
export function shouldUpgradePasswordHash(hash: string): boolean {
    return isDjangoHash(hash);
}

/** Hash a new password (always bcrypt). */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Verify a password against Django or bcrypt stored hashes. */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    if (!password || !storedHash) return false;

    if (isBcryptHash(storedHash)) {
        return bcrypt.compare(password, storedHash);
    }

    if (isDjangoHash(storedHash)) {
        return verifyDjangoPbkdf2(password, storedHash);
    }

    return false;
}
