/**
 * Diabetes Prediction System - Main JavaScript
 */

// API Configuration
const API_BASE_URL = 'http://localhost:5000';

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initializeLoadingScreen();
    initializeNavigation();
    initializeForm();
    initializeCounters();
    initializeHeroChart();
    
    // Check API health
    checkAPIHealth();
    
    console.log("Diabetes Prediction System initialized!");
});

// Loading Screen
function initializeLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    
    // Simulate loading time
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        
        // Remove from DOM after animation
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 1500);
}

// Navigation
function initializeNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });
}

// Form Initialization
function initializeForm() {
    const form = document.getElementById('predictionForm');
    const loadSampleBtn = document.getElementById('loadSample');
    const resetBtn = document.querySelector('.btn-reset');
    
    if (!form) return;
    
    // Initialize range sliders
    initializeRangeSliders();
    
    // Form submission
    form.addEventListener('submit', handleFormSubmit);
    
    // Load sample data
    if (loadSampleBtn) {
        loadSampleBtn.addEventListener('click', loadSampleData);
    }
    
    // Reset form
    if (resetBtn) {
        resetBtn.addEventListener('click', resetForm);
    }
}

function initializeRangeSliders() {
    // Connect range sliders with number inputs
    document.querySelectorAll('.range-slider').forEach(sliderContainer => {
        const slider = sliderContainer.querySelector('.slider');
        const valueDisplay = sliderContainer.querySelector('.slider-value');
        const numberInput = sliderContainer.parentElement.querySelector('input[type="number"]');
        
        if (!slider || !valueDisplay || !numberInput) return;
        
        // Update slider when number input changes
        numberInput.addEventListener('input', () => {
            slider.value = numberInput.value;
            updateSliderDisplay(slider, valueDisplay);
        });
        
        // Update number input when slider changes
        slider.addEventListener('input', () => {
            numberInput.value = slider.value;
            updateSliderDisplay(slider, valueDisplay);
        });
        
        // Initial display
        updateSliderDisplay(slider, valueDisplay);
    });
}

function updateSliderDisplay(slider, valueDisplay) {
    const value = parseFloat(slider.value);
    
    // Format display based on field
    if (slider.id.includes('Glucose')) {
        valueDisplay.textContent = `${value} mg/dL`;
    } else if (slider.id.includes('BloodPressure')) {
        valueDisplay.textContent = `${value} mm Hg`;
    } else if (slider.id.includes('SkinThickness')) {
        valueDisplay.textContent = `${value} mm`;
    } else if (slider.id.includes('Insulin')) {
        valueDisplay.textContent = `${value} mu U/ml`;
    } else if (slider.id.includes('BMI')) {
        valueDisplay.textContent = `${value}`;
    } else if (slider.id.includes('Age')) {
        valueDisplay.textContent = `${value} years`;
    } else {
        valueDisplay.textContent = value;
    }
}

// Form Submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Collect form data
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Validate inputs
    const validation = validateFormData(data);
    if (!validation.valid) {
        showNotification(validation.message, 'error');
        return;
    }
    
    // Show loading state
    showLoading(true);
    
    try {
        // Send prediction request
        const response = await fetch(`${API_BASE_URL}/api/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            // Display results
            displayPredictionResult(result);
            showNotification('Prediction completed successfully!', 'success');
        } else {
            showNotification(result.error || 'Prediction failed', 'error');
        }
        
    } catch (error) {
        console.error('Prediction error:', error);
        showNotification('Unable to connect to prediction service', 'error');
    } finally {
        showLoading(false);
    }
}

function validateFormData(data) {
    const errors = [];
    
    // Required fields
    const requiredFields = ['Glucose', 'BMI', 'Age'];
    requiredFields.forEach(field => {
        if (!data[field] || data[field].trim() === '') {
            errors.push(`${field} is required`);
        }
    });
    
    // Numeric validation
    Object.keys(data).forEach(key => {
        const value = parseFloat(data[key]);
        if (isNaN(value)) {
            errors.push(`${key} must be a number`);
        }
    });
    
    // Range validation
    if (data.Glucose) {
        const glucose = parseFloat(data.Glucose);
        if (glucose < 0 || glucose > 300) {
            errors.push('Glucose must be between 0 and 300 mg/dL');
        }
    }
    
    if (data.BMI) {
        const bmi = parseFloat(data.BMI);
        if (bmi < 10 || bmi > 70) {
            errors.push('BMI must be between 10 and 70');
        }
    }
    
    if (data.Age) {
        const age = parseFloat(data.Age);
        if (age < 1 || age > 120) {
            errors.push('Age must be between 1 and 120 years');
        }
    }
    
    if (errors.length > 0) {
        return {
            valid: false,
            message: errors.join(', ')
        };
    }
    
    return { valid: true };
}

// Display Prediction Result
function displayPredictionResult(result) {
    // Show result container
    const placeholder = document.querySelector('.result-placeholder');
    const content = document.getElementById('resultContent');
    
    if (placeholder) placeholder.style.display = 'none';
    if (content) content.style.display = 'block';
    
    // Update prediction label
    const predictionLabel = document.getElementById('predictionLabel');
    if (predictionLabel) {
        predictionLabel.textContent = result.prediction_label;
    }
    
    // Update risk badge
    const riskBadge = document.getElementById('riskBadge');
    if (riskBadge) {
        riskBadge.textContent = result.risk_level.charAt(0).toUpperCase() + result.risk_level.slice(1) + ' Risk';
        riskBadge.className = 'risk-badge ' + result.risk_level;
    }
    
    // Update confidence meter
    const confidenceValue = document.getElementById('confidenceValue');
    const meterFill = document.getElementById('meterFill');
    const nonDiabeticProb = document.getElementById('nonDiabeticProb');
    const diabeticProb = document.getElementById('diabeticProb');
    
    const diabeticPercent = result.confidence.diabetic;
    
    if (confidenceValue) confidenceValue.textContent = diabeticPercent.toFixed(1) + '%';
    if (meterFill) {
        meterFill.style.width = '0%';
        setTimeout(() => {
            meterFill.style.width = diabeticPercent + '%';
        }, 100);
    }
    if (nonDiabeticProb) nonDiabeticProb.textContent = result.confidence.non_diabetic.toFixed(1) + '%';
    if (diabeticProb) diabeticProb.textContent = diabeticPercent.toFixed(1) + '%';
    
    // Update health advice
    const adviceList = document.getElementById('adviceList');
    if (adviceList && result.health_advice) {
        adviceList.innerHTML = '';
        result.health_advice.forEach(advice => {
            const li = document.createElement('li');
            li.textContent = advice;
            adviceList.appendChild(li);
        });
    }
    
    // Setup share and download buttons
    setupResultActions(result);
    
    // Scroll to results
    content.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function setupResultActions(result) {
    // Share button
    const shareBtn = document.getElementById('shareResult');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const shareText = `My diabetes risk assessment: ${result.prediction_label} (${result.confidence.diabetic.toFixed(1)}% probability). ${result.health_advice[0]}`;
            
            if (navigator.share) {
                navigator.share({
                    title: 'Diabetes Risk Assessment',
                    text: shareText,
                    url: window.location.href
                });
            } else {
                // Fallback: copy to clipboard
                navigator.clipboard.writeText(shareText)
                    .then(() => showNotification('Results copied to clipboard!', 'success'))
                    .catch(() => showNotification('Failed to copy results', 'error'));
            }
        });
    }
    
    // Download button
    const downloadBtn = document.getElementById('downloadResult');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            downloadResultReport(result);
        });
    }
}

function downloadResultReport(result) {
    const report = `
Diabetes Risk Assessment Report
===============================

Assessment Date: ${new Date().toLocaleDateString()}
Assessment Time: ${new Date().toLocaleTimeString()}

PREDICTION RESULTS
------------------
Status: ${result.prediction_label}
Risk Level: ${result.risk_level.toUpperCase()}
Confidence Score: ${result.confidence.diabetic.toFixed(1)}%

CONFIDENCE BREAKDOWN
--------------------
Non-Diabetic Probability: ${result.confidence.non_diabetic.toFixed(1)}%
Diabetic Probability: ${result.confidence.diabetic.toFixed(1)}%

HEALTH RECOMMENDATIONS
----------------------
${result.health_advice.map((advice, index) => `${index + 1}. ${advice}`).join('\n')}

IMPORTANT DISCLAIMER
--------------------
This assessment is for informational purposes only and is not a substitute for professional medical advice. Please consult with a healthcare professional for proper diagnosis and treatment.

Generated by Diabetes Prediction System
© ${new Date().getFullYear()} All rights reserved
    `.trim();
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diabetes-assessment-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Report downloaded successfully!', 'success');
}

// Load Sample Data
async function loadSampleData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/sample-data`);
        const data = await response.json();
        
        if (data.samples && data.samples.length > 0) {
            // Use first sample
            const sample = data.samples[0];
            
            // Fill form with sample data
            Object.keys(sample).forEach(key => {
                if (key !== 'description') {
                    const input = document.getElementById(key);
                    if (input) {
                        input.value = sample[key];
                        
                        // Update corresponding slider
                        const slider = input.parentElement.querySelector('.slider');
                        const valueDisplay = input.parentElement.querySelector('.slider-value');
                        if (slider) {
                            slider.value = sample[key];
                            updateSliderDisplay(slider, valueDisplay);
                        }
                    }
                }
            });
            
            showNotification('Sample data loaded successfully!', 'success');
        }
    } catch (error) {
        console.error('Error loading sample data:', error);
        showNotification('Failed to load sample data', 'error');
    }
}

function resetForm() {
    const form = document.getElementById('predictionForm');
    if (form) {
        form.reset();
        
        // Reset all sliders
        document.querySelectorAll('.slider').forEach(slider => {
            const defaultValue = slider.getAttribute('value') || '0';
            slider.value = defaultValue;
            
            const valueDisplay = slider.parentElement.querySelector('.slider-value');
            updateSliderDisplay(slider, valueDisplay);
        });
        
        // Show placeholder
        const placeholder = document.querySelector('.result-placeholder');
        const content = document.getElementById('resultContent');
        
        if (placeholder) placeholder.style.display = 'block';
        if (content) content.style.display = 'none';
        
        showNotification('Form reset successfully', 'info');
    }
}

// Counter Animation
function initializeCounters() {
    const counters = document.querySelectorAll('.counter');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target'));
                animateCounter(counter, target);
                observer.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 100;
    const duration = 2000;
    const stepTime = duration / 100;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            clearInterval(timer);
            element.textContent = target + (element.getAttribute('data-target').includes('.') ? '%' : '');
        } else {
            element.textContent = Math.floor(current) + (element.getAttribute('data-target').includes('.') ? '%' : '');
        }
    }, stepTime);
}

// Hero Chart
function initializeHeroChart() {
    const canvas = document.getElementById('heroChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.8)');
    gradient.addColorStop(1, 'rgba(118, 75, 162, 0.2)');
    
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [{
                label: 'Model Accuracy',
                data: [85, 87, 89, 90, 92, 93, 94.2],
                borderColor: '#667eea',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'white',
                pointBorderColor: '#667eea',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Accuracy: ${context.parsed.y}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 80,
                    max: 100,
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// API Health Check
async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        const health = await response.json();
        
        if (!health.model_loaded || !health.scaler_loaded) {
            console.warn('API health check: Model or scaler not loaded');
        }
    } catch (error) {
        console.warn('API health check failed:', error);
    }
}

// Utility Functions
function showLoading(show) {
    const buttons = document.querySelectorAll('.btn-predict');
    buttons.forEach(btn => {
        if (show) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            btn.disabled = true;
        } else {
            btn.innerHTML = '<i class="fas fa-calculator"></i> Predict Diabetes Risk';
            btn.disabled = false;
        }
    });
}

function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    }[type];
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : type === 'warning' ? '#FF9800' : '#2196F3'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Feature Info Tooltip
function initializeFeatureInfo() {
    document.querySelectorAll('.form-group label').forEach(label => {
        label.addEventListener('mouseenter', showFeatureInfo);
        label.addEventListener('mouseleave', hideFeatureInfo);
    });
}

function showFeatureInfo(e) {
    const featureName = e.target.textContent.trim();
    // Could fetch feature info from API and display tooltip
}

function hideFeatureInfo() {
    // Hide tooltip
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const form = document.getElementById('predictionForm');
        if (form) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.click();
        }
    }
    
    // Escape to reset form
    if (e.key === 'Escape') {
        const resetBtn = document.querySelector('.btn-reset');
        if (resetBtn) resetBtn.click();
    }
});