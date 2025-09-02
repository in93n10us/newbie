//! ML inference module for cheat detection using ONNX models
//! 
//! This module handles loading and running ML models for real-time inference
//! on game telemetry data to detect potential cheating behavior.

use std::path::Path;
use thiserror::Error;
use tract_onnx::prelude::*;
use tracing::{debug, error, info};

#[derive(Error, Debug)]
pub enum MLError {
    #[error("Failed to load model: {0}")]
    ModelLoadError(String),
    #[error("Inference error: {0}")]
    InferenceError(String),
    #[error("Invalid input shape: {0}")]
    InvalidInputError(String),
}

pub struct MLInference {
    model: SimplePlan<TypedFact, Box<dyn TypedOp>, Graph<TypedFact, Box<dyn TypedOp>>>,
}

impl MLInference {
    /// Creates a new ML inference instance by loading an ONNX model from the specified path
    pub async fn new<P: AsRef<Path>>(model_path: P) -> Result<Self, MLError> {
        info!("Loading ML model from {:?}", model_path.as_ref());
        
        let model = tract_onnx::onnx()
            .model_for_path(model_path)
            .map_err(|e| MLError::ModelLoadError(e.to_string()))?
            .into_optimized()
            .map_err(|e| MLError::ModelLoadError(e.to_string()))?
            .into_runnable()
            .map_err(|e| MLError::ModelLoadError(e.to_string()))?;

        debug!("Model loaded successfully");
        Ok(Self { model })
    }

    /// Performs inference on the input tensor
    /// 
    /// # Arguments
    /// * `input` - Input tensor with shape matching model requirements
    /// 
    /// # Returns
    /// * `Result<Tensor, MLError>` - Output tensor or error
    pub async fn infer(&self, input: Tensor) -> Result<Tensor, MLError> {
        debug!("Running inference with input shape: {:?}", input.shape());

        let result = self.model
            .run(tvec!(input))
            .map_err(|e| MLError::InferenceError(e.to_string()))?;

        Ok(result[0].clone())
    }

    /// Validates input shape against model requirements
    pub fn validate_input_shape(&self, shape: &[usize]) -> Result<(), MLError> {
        let expected = self.model.model.input_fact(0)
            .map_err(|e| MLError::InvalidInputError(e.to_string()))?
            .shape();

        if shape != expected.as_concrete().unwrap() {
            return Err(MLError::InvalidInputError(format!(
                "Expected shape {:?}, got {:?}",
                expected, shape
            )));
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_model_loading() {
        let result = MLInference::new("models/test.onnx").await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_invalid_model_path() {
        let result = MLInference::new("nonexistent.onnx").await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_input_validation() {
        let ml = MLInference::new("models/test.onnx").await.unwrap();
        let valid_shape = vec![1, 3, 224, 224];
        assert!(ml.validate_input_shape(&valid_shape).is_ok());
    }
}