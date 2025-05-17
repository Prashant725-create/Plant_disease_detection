document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const imageInput = document.getElementById('imageInput');
    const predictBtn = document.getElementById('predictBtn');
    const previewContainer = document.getElementById('preview');
    const resultContainer = document.getElementById('result');
    
    // Show file name when selected
    imageInput.addEventListener('change', function() {
      const file = this.files[0];
      if (file) {
        displayImagePreview(file);
        // Reset results when new image is selected
        resetResults();
      }
    });
    
    // Predict button click handler
    predictBtn.addEventListener('click', function() {
      uploadImage();
    });
    
    // Display image preview
    function displayImagePreview(file) {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        previewContainer.innerHTML = `
          <img src="${e.target.result}" alt="Plant Image">
          <p class="file-info">
            <i class="fas fa-file-image"></i> ${file.name}
          </p>
        `;
      };
      
      reader.readAsDataURL(file);
    }
    
    // Reset results container
    function resetResults() {
      resultContainer.innerHTML = `
        <div class="placeholder">
          <i class="fas fa-clipboard-check"></i>
          <p>Click "Predict Disease" to analyze</p>
        </div>
      `;
    }
    
    // Process image and get prediction
    function uploadImage() {
      const file = imageInput.files[0];
      if (!file) {
        showNotification('Please select an image first', 'error');
        return;
      }
      
      // Show loading state
      resultContainer.innerHTML = `
        <div class="placeholder">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Analyzing image...</p>
        </div>
      `;
      
      const formData = new FormData();
      formData.append("image", file);
      
      // Send to backend
      fetch("http://127.0.0.1:3000/predict", {
        method: "POST",
        body: formData
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Server response was not OK');
        }
        return response.json();
      })
      .then(data => {
        displayResults(data);
      })
      .catch(error => {
        console.error('Error:', error);
        showError();
      });
    }
    
    // Display results
    function displayResults(data) {
      // Get severity class based on confidence
      const severityClass = getSeverityClass(data.severity);
      
      resultContainer.innerHTML = `
        <div class="result-details">
          <div class="result-item">
            <span class="result-label">Prediction:</span>
            <span class="result-value">${data.predicted_label}</span>
          </div>
          <div class="result-item">
            <span class="result-label">Confidence:</span>
            <span class="result-value">${data.confidence.toFixed(2)}%</span>
          </div>
          <div class="result-item">
            <span class="result-label">Severity:</span>
            <span class="result-value ${severityClass}">${data.severity}</span>
          </div>
        </div>
        <div class="recommendations">
          <h4><i class="fas fa-info-circle"></i> Recommendations</h4>
          <p>Based on the detection results, here are some recommended actions:</p>
          ${getRecommendations(data.severity, data.predicted_label)}
        </div>
      `;
    }
    
    // Show error message
    function showError() {
      resultContainer.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Prediction failed. Please try again or check your connection.</p>
        </div>
      `;
    }
    
    // Show notification
    function showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.innerHTML = `<p>${message}</p>`;
      
      document.body.appendChild(notification);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 500);
      }, 3000);
    }
    
    // Get severity class for styling
    function getSeverityClass(severity) {
      severity = severity.toLowerCase();
      if (severity.includes('high') || severity.includes('severe')) {
        return 'high-severity';
      } else if (severity.includes('medium') || severity.includes('moderate')) {
        return 'medium-severity';
      } else {
        return 'low-severity';
      }
    }
    
    // Get recommendations based on severity and disease
    function getRecommendations(severity, disease) {
      // This is a placeholder. In a real app, you would have specific recommendations for each disease
      const severityLevel = severity.toLowerCase();
      
      if (severityLevel.includes('high') || severityLevel.includes('severe')) {
        return `
          <ul>
            <li>Immediately isolate the affected plant</li>
            <li>Consider applying appropriate fungicide/pesticide</li>
            <li>Remove severely affected leaves and dispose properly</li>
            <li>Consult with a plant pathologist</li>
          </ul>
        `;
      } else if (severityLevel.includes('medium') || severityLevel.includes('moderate')) {
        return `
          <ul>
            <li>Monitor the plant closely</li>
            <li>Improve air circulation around plants</li>
            <li>Apply appropriate treatment as needed</li>
            <li>Adjust watering practices</li>
          </ul>
        `;
      } else {
        return `
          <ul>
            <li>Continue regular monitoring</li>
            <li>Ensure proper watering and nutrition</li>
            <li>Maintain good garden hygiene</li>
          </ul>
        `;
      }
    }
  
    // Add CSS for notifications
    const style = document.createElement('style');
    style.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
      }
      
      .notification.info {
        background-color: #e3f2fd;
        border-left: 4px solid #2196f3;
        color: #0d47a1;
      }
      
      .notification.error {
        background-color: #ffebee;
        border-left: 4px solid #f44336;
        color: #b71c1c;
      }
      
      .notification.success {
        background-color: #e8f5e9;
        border-left: 4px solid #4caf50;
        color: #1b5e20;
      }
      
      .notification.fade-out {
        animation: fadeOut 0.5s ease-out forwards;
      }
      
      .high-severity {
        color: #d32f2f;
        font-weight: bold;
      }
      
      .medium-severity {
        color: #f57c00;
        font-weight: bold;
      }
      
      .low-severity {
        color: #388e3c;
        font-weight: bold;
      }
      
      .recommendations {
        margin-top: 20px;
        padding: 15px;
        background-color: #f1f8e9;
        border-radius: 8px;
        border-left: 4px solid #7cb342;
      }
      
      .recommendations h4 {
        color: #33691e;
        margin-bottom: 10px;
      }
      
      .recommendations ul {
        padding-left: 20px;
      }
      
      .recommendations li {
        margin: 5px 0;
      }
      
      .file-info {
        margin-top: 10px;
        color: #666;
        font-size: 0.9rem;
      }
      
      .error-message {
        color: #d32f2f;
        text-align: center;
        padding: 20px;
      }
      
      .error-message i {
        font-size: 2rem;
        margin-bottom: 10px;
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes fadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }
    `;
    
    document.head.appendChild(style);
  });