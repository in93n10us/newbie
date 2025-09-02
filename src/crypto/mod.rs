rust
//! Encryption and security module for SentinelAI
//! 
//! Provides cryptographic primitives and security utilities for:
//! - Secure communication between components
//! - Data encryption at rest
//! - Authentication and authorization
//! - Cryptographic signatures

use ring::{aead, rand};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CryptoError {
    #[error("Encryption failed: {0}")]
    EncryptionError(String),
    
    #[error("Decryption failed: {0}")] 
    DecryptionError(String),
    
    #[error("Key generation failed: {0}")]
    KeyGenerationError(String),
    
    #[error("Invalid key format: {0}")]
    InvalidKeyError(String),
}

pub type Result<T> = std::result::Result<T, CryptoError>;

/// Represents an encryption key
#[derive(Clone)]
pub struct Key(Vec<u8>);

impl Key {
    /// Generate a new random encryption key
    pub fn generate() -> Result<Self> {
        let rng = rand::SystemRandom::new();
        let mut key = vec![0; 32];
        rng.fill(&mut key)
            .map_err(|e| CryptoError::KeyGenerationError(e.to_string()))?;
        Ok(Key(key))
    }

    /// Create a key from existing bytes
    pub fn from_slice(bytes: &[u8]) -> Result<Self> {
        if bytes.len() != 32 {
            return Err(CryptoError::InvalidKeyError(
                "Key must be 32 bytes".to_string(),
            ));
        }
        Ok(Key(bytes.to_vec()))
    }
}

/// Encrypts data using AES-GCM
pub fn encrypt(key: &Key, data: &[u8]) -> Result<Vec<u8>> {
    let nonce = generate_nonce()?;
    let sealing_key = aead::UnboundKey::new(&aead::AES_256_GCM, &key.0)
        .map_err(|e| CryptoError::EncryptionError(e.to_string()))?;
    
    let mut sealed = Vec::with_capacity(data.len() + 16);
    sealed.extend_from_slice(&nonce);
    sealed.extend_from_slice(data);
    
    let sealing_key = aead::LessSafeKey::new(sealing_key);
    sealing_key
        .seal_in_place_append_tag(
            aead::Nonce::assume_unique_for_key(nonce),
            aead::Aad::empty(),
            &mut sealed,
        )
        .map_err(|e| CryptoError::EncryptionError(e.to_string()))?;
    
    Ok(sealed)
}

/// Decrypts data using AES-GCM
pub fn decrypt(key: &Key, encrypted: &[u8]) -> Result<Vec<u8>> {
    if encrypted.len() < 12 {
        return Err(CryptoError::DecryptionError(
            "Encrypted data too short".to_string(),
        ));
    }

    let (nonce, ciphertext) = encrypted.split_at(12);
    let opening_key = aead::UnboundKey::new(&aead::AES_256_GCM, &key.0)
        .map_err(|e| CryptoError::DecryptionError(e.to_string()))?;
    
    let opening_key = aead::LessSafeKey::new(opening_key);
    let mut buffer = ciphertext.to_vec();
    
    let decrypted = opening_key
        .open_in_place(
            aead::Nonce::assume_unique_for_key(*array_ref!(nonce, 0, 12)),
            aead::Aad::empty(),
            &mut buffer,
        )
        .map_err(|e| CryptoError::DecryptionError(e.to_string()))?;
        
    Ok(decrypted.to_vec())
}

/// Generates a random 96-bit nonce
fn generate_nonce() -> Result<[u8; 12]> {
    let rng = rand::SystemRandom::new();
    let mut nonce = [0u8; 12];
    rng.fill(&mut nonce)
        .map_err(|e| CryptoError::EncryptionError(e.to_string()))?;
    Ok(nonce)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_key_generation() {
        let key = Key::generate().unwrap();
        assert_eq!(key.0.len(), 32);
    }

    #[test]
    fn test_encryption_decryption() {
        let key = Key::generate().unwrap();
        let data = b"test data";
        
        let encrypted = encrypt(&key, data).unwrap();
        let decrypted = decrypt(&key, &encrypted).unwrap();
        
        assert_eq!(&decrypted, data);
    }

    #[test]
    fn test_invalid_key() {
        let result = Key::from_slice(&[0u8; 16]);
        assert!(result.is_err());
    }
}