rust
use crate::crypto::{CryptoError, encrypt_data, decrypt_data, generate_key};
use ring::{aead, rand};
use std::vec::Vec;

// Test constants
const TEST_DATA: &[u8] = b"test message to encrypt";
const INVALID_KEY: &[u8] = &[0u8; 32];

// Helper functions for test setup
fn setup_test_key() -> aead::LessSafeKey {
    let rng = rand::SystemRandom::new();
    let key_bytes = rand::generate::<[u8; 32]>(&rng).unwrap();
    aead::LessSafeKey::new(aead::UnboundKey::new(&aead::CHACHA20_POLY1305, &key_bytes).unwrap())
}

#[test]
fn test_generate_key_success() {
    let result = generate_key();
    assert!(result.is_ok());
    let key = result.unwrap();
    assert_eq!(key.len(), 32);
}

#[test]
fn test_encrypt_decrypt_roundtrip() {
    let key = setup_test_key();
    
    // Encrypt data
    let encrypted = encrypt_data(&key, TEST_DATA).unwrap();
    assert_ne!(encrypted, TEST_DATA);
    
    // Decrypt data
    let decrypted = decrypt_data(&key, &encrypted).unwrap();
    assert_eq!(decrypted, TEST_DATA);
}

#[test]
fn test_encrypt_with_invalid_key() {
    let invalid_key = aead::UnboundKey::new(&aead::CHACHA20_POLY1305, INVALID_KEY).unwrap();
    let key = aead::LessSafeKey::new(invalid_key);
    
    let result = encrypt_data(&key, TEST_DATA);
    assert!(result.is_err());
    match result {
        Err(CryptoError::EncryptionError(_)) => (),
        _ => panic!("Expected EncryptionError")
    }
}

#[test]
fn test_decrypt_with_invalid_data() {
    let key = setup_test_key();
    let invalid_data = vec![0u8; 32];
    
    let result = decrypt_data(&key, &invalid_data);
    assert!(result.is_err());
    match result {
        Err(CryptoError::DecryptionError(_)) => (),
        _ => panic!("Expected DecryptionError")
    }
}

#[test]
fn test_encrypt_empty_data() {
    let key = setup_test_key();
    let empty_data: &[u8] = &[];
    
    let result = encrypt_data(&key, empty_data);
    assert!(result.is_ok());
    assert!(!result.unwrap().is_empty());
}

#[test]
fn test_decrypt_empty_data() {
    let key = setup_test_key();
    let empty_data: Vec<u8> = vec![];
    
    let result = decrypt_data(&key, &empty_data);
    assert!(result.is_err());
}

#[test]
fn test_encrypt_large_data() {
    let key = setup_test_key();
    let large_data = vec![1u8; 1_000_000];
    
    let result = encrypt_data(&key, &large_data);
    assert!(result.is_ok());
    assert!(result.unwrap().len() > large_data.len());
}

#[test]
fn test_key_uniqueness() {
    let key1 = generate_key().unwrap();
    let key2 = generate_key().unwrap();
    assert_ne!(key1, key2);
}

#[test]
fn test_encryption_uniqueness() {
    let key = setup_test_key();
    let encrypted1 = encrypt_data(&key, TEST_DATA).unwrap();
    let encrypted2 = encrypt_data(&key, TEST_DATA).unwrap();
    
    // Same data should encrypt to different ciphertexts due to random nonce
    assert_ne!(encrypted1, encrypted2);
}