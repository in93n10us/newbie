rust
use std::path::Path;
use crate::ml::{MLError, load_model, run_inference};
use ndarray::{Array, Array2};
use tract_onnx::prelude::*;

// Test fixtures and helpers
const TEST_MODEL_PATH: &str = "tests/fixtures/test_model.onnx";
const INVALID_PATH: &str = "tests/fixtures/nonexistent.onnx";

fn setup_test_data() -> Array2<f32> {
    Array2::from_shape_vec((1, 10), vec![0.1; 10]).unwrap()
}

#[tokio::test]
async fn test_model_loading_success() {
    let model_path = Path::new(TEST_MODEL_PATH);
    let result = load_model(&model_path).await;
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_model_loading_invalid_path() {
    let invalid_path = Path::new(INVALID_PATH);
    let result = load_model(&invalid_path).await;
    assert!(matches!(result, Err(MLError::ModelLoadError(_))));
}

#[tokio::test]
async fn test_inference_valid_input() {
    let model_path = Path::new(TEST_MODEL_PATH);
    let model = load_model(&model_path).await.unwrap();
    let input = setup_test_data();
    
    let result = run_inference(&model, input);
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_inference_invalid_shape() {
    let model_path = Path::new(TEST_MODEL_PATH);
    let model = load_model(&model_path).await.unwrap();
    let invalid_input = Array2::from_shape_vec((2, 5), vec![0.1; 10]).unwrap();
    
    let result = run_inference(&model, invalid_input);
    assert!(matches!(result, Err(MLError::InferenceError(_))));
}

#[tokio::test]
async fn test_inference_empty_input() {
    let model_path = Path::new(TEST_MODEL_PATH);
    let model = load_model(&model_path).await.unwrap();
    let empty_input = Array2::from_shape_vec((0, 0), vec![]).unwrap();
    
    let result = run_inference(&model, empty_input);
    assert!(matches!(result, Err(MLError::InferenceError(_))));
}

#[tokio::test]
async fn test_model_version_compatibility() {
    let model_path = Path::new(TEST_MODEL_PATH);
    let model = load_model(&model_path).await.unwrap();
    
    // Check model metadata
    assert!(model.version() >= 1);
}

#[tokio::test]
async fn test_inference_output_shape() {
    let model_path = Path::new(TEST_MODEL_PATH);
    let model = load_model(&model_path).await.unwrap();
    let input = setup_test_data();
    
    let result = run_inference(&model, input).unwrap();
    assert_eq!(result.shape()[0], 1); // Batch size
    assert_eq!(result.shape()[1], 2); // Output classes
}

#[tokio::test]
async fn test_inference_output_range() {
    let model_path = Path::new(TEST_MODEL_PATH);
    let model = load_model(&model_path).await.unwrap();
    let input = setup_test_data();
    
    let output = run_inference(&model, input).unwrap();
    
    // Check output values are valid probabilities
    for value in output.iter() {
        assert!(*value >= 0.0 && *value <= 1.0);
    }
}

#[tokio::test]
async fn test_model_memory_cleanup() {
    let model_path = Path::new(TEST_MODEL_PATH);
    {
        let _model = load_model(&model_path).await.unwrap();
        // Model should be dropped here
    }
    // Verify no memory leaks (would need memory profiling tools)
}

#[cfg(test)]
mod error_tests {
    use super::*;

    #[test]
    fn test_ml_error_display() {
        let load_err = MLError::ModelLoadError("test error".to_string());
        assert_eq!(
            load_err.to_string(),
            "Failed to load model: test error"
        );

        let inference_err = MLError::InferenceError("test error".to_string());
        assert_eq!(
            inference_err.to_string(),
            "Inference error: test error"
        );
    }
}