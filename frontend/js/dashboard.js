/**
 * Analytics Dashboard JavaScript
 */

// Chart instances
let charts = {};
let dashboardData = null;

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Initialize loading screen
    const loadingScreen = document.getElementById('loadingScreen');
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        setTimeout(() => loadingScreen.style.display = 'none', 500);
    }, 1000);
    
    // Initialize navigation
    initializeNavigation();
    
    // Load dashboard data
    loadDashboardData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Auto-refresh every 30 seconds
    setInterval(loadDashboardData, 30000);
    
    console.log("Analytics Dashboard initialized!");
});

// Navigation
function initializeNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        showLoading(true);
        
        const response = await fetch('http://localhost:5000/api/analytics/dashboard');
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        dashboardData = data;
        updateDashboard(data);
        updateLastUpdateTime();
        showNotification('Dashboard updated successfully', 'success');
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Failed to load dashboard data', 'error');
        
        // Use sample data if API fails
        loadSampleData();
    } finally {
        showLoading(false);
    }
}

// Update Dashboard with Data
function updateDashboard(data) {
    // Update stats
    updateStats(data.overview);
    
    // Update charts
    updateCharts(data);
    
    // Update prediction feed
    updatePredictionFeed(data.predictions_timeline);
}

// Update Statistics
function updateStats(overview) {
    const totalPred = document.getElementById('totalPredictions');
    const accuracyRate = document.getElementById('accuracyRate');
    const avgResponse = document.getElementById('avgResponse');
    const highRiskCount = document.getElementById('highRiskCount');
    
    if (totalPred) {
        totalPred.textContent = overview.total_predictions.toLocaleString();
        animateCounter(totalPred, overview.total_predictions);
    }
    
    if (accuracyRate) {
        accuracyRate.textContent = overview.model_accuracy.toFixed(1) + '%';
    }
    
    if (avgResponse) {
        avgResponse.textContent = overview.avg_response_time + 's';
    }
    
    if (highRiskCount && dashboardData) {
        const highRisk = dashboardData.risk_distribution.high || 0;
        highRiskCount.textContent = highRisk.toLocaleString();
    }
}

// Update Charts
function updateCharts(data) {
    // Risk Distribution Chart
    updateRiskDistributionChart(data.risk_distribution);
    
    // Feature Importance Chart
    updateFeatureImportanceChart();
    
    // Hourly Trend Chart
    updateHourlyTrendChart(data.hourly_trend);
    
    // Performance Chart
    updatePerformanceChart(data.performance_metrics);
    
    // Age Distribution Chart
    updateAgeDistributionChart(data.feature_distribution);
}

// Risk Distribution Chart
function updateRiskDistributionChart(riskData) {
    const ctx = document.getElementById('riskDistributionChart');
    if (!ctx) return;
    
    const low = riskData.low || 0;
    const medium = riskData.medium || 0;
    const high = riskData.high || 0;
    const total = low + medium + high;
    
    // Update percentages
    document.getElementById('lowRiskPercent').textContent = total > 0 ? Math.round((low / total) * 100) + '%' : '0%';
    document.getElementById('mediumRiskPercent').textContent = total > 0 ? Math.round((medium / total) * 100) + '%' : '0%';
    document.getElementById('highRiskPercent').textContent = total > 0 ? Math.round((high / total) * 100) + '%' : '0%';
    
    if (charts.riskDistribution) {
        charts.riskDistribution.data.datasets[0].data = [low, medium, high];
        charts.riskDistribution.update();
    } else {
        charts.riskDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Low Risk', 'Medium Risk', 'High Risk'],
                datasets: [{
                    data: [low, medium, high],
                    backgroundColor: [
                        'rgba(76, 175, 80, 0.8)',
                        'rgba(255, 152, 0, 0.8)',
                        'rgba(244, 67, 54, 0.8)'
                    ],
                    borderColor: [
                        'rgba(76, 175, 80, 1)',
                        'rgba(255, 152, 0, 1)',
                        'rgba(244, 67, 54, 1)'
                    ],
                    borderWidth: 2,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: 1000
                }
            }
        });
    }
}

// Feature Importance Chart
function updateFeatureImportanceChart() {
    const ctx = document.getElementById('featureImportanceChart');
    if (!ctx) return;
    
    const features = [
        'Glucose', 'BMI', 'Age', 'Diabetes Pedigree', 
        'Blood Pressure', 'Pregnancies', 'Insulin', 'Skin Thickness'
    ];
    
    const importance = [95, 87, 78, 65, 58, 45, 32, 25];
    
    if (charts.featureImportance) {
        charts.featureImportance.data.datasets[0].data = importance;
        charts.featureImportance.update();
    } else {
        charts.featureImportance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: features,
                datasets: [{
                    label: 'Impact Score',
                    data: importance,
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 1,
                    borderRadius: 5
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            display: false
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 1000
                }
            }
        });
    }
}

// Hourly Trend Chart
function updateHourlyTrendChart(trendData) {
    const ctx = document.getElementById('hourlyTrendChart');
    if (!ctx) return;
    
    const labels = trendData.labels || Array.from({length: 24}, (_, i) => `${i}:00`);
    const data = trendData.data || Array.from({length: 24}, () => Math.floor(Math.random() * 10));
    
    if (charts.hourlyTrend) {
        charts.hourlyTrend.data.labels = labels;
        charts.hourlyTrend.data.datasets[0].data = data;
        charts.hourlyTrend.update();
    } else {
        charts.hourlyTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Predictions',
                    data: data,
                    borderColor: 'rgba(102, 126, 234, 1)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'white',
                    pointBorderColor: 'rgba(102, 126, 234, 1)',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        },
                        ticks: {
                            precision: 0
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 1000
                }
            }
        });
    }
}

// Performance Chart
function updatePerformanceChart(metrics) {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;
    
    // Update metric values
    document.getElementById('precisionValue').textContent = metrics.precision.toFixed(1) + '%';
    document.getElementById('recallValue').textContent = metrics.recall.toFixed(1) + '%';
    document.getElementById('f1Value').textContent = metrics.f1_score.toFixed(1) + '%';
    
    const performanceData = [
        metrics.precision || 92,
        metrics.recall || 89,
        metrics.f1_score || 90,
        metrics.auc_score || 94
    ];
    
    if (charts.performance) {
        charts.performance.data.datasets[0].data = performanceData;
        charts.performance.update();
    } else {
        charts.performance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Precision', 'Recall', 'F1-Score', 'AUC Score'],
                datasets: [{
                    label: 'Performance Metrics',
                    data: performanceData,
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            },
                            stepSize: 20
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                animation: {
                    duration: 1000
                }
            }
        });
    }
}

// Age Distribution Chart
function updateAgeDistributionChart(distribution) {
    const ctx = document.getElementById('ageDistributionChart');
    if (!ctx) return;
    
    const ageGroups = distribution.age_groups || {
        '<30': 25,
        '30-50': 45,
        '>50': 30
    };
    
    const labels = Object.keys(ageGroups);
    const data = Object.values(ageGroups);
    
    if (charts.ageDistribution) {
        charts.ageDistribution.data.labels = labels;
        charts.ageDistribution.data.datasets[0].data = data;
        charts.ageDistribution.update();
    } else {
        charts.ageDistribution = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Percentage',
                    data: data,
                    backgroundColor: [
                        'rgba(76, 175, 80, 0.8)',
                        'rgba(255, 152, 0, 0.8)',
                        'rgba(244, 67, 54, 0.8)'
                    ],
                    borderColor: [
                        'rgba(76, 175, 80, 1)',
                        'rgba(255, 152, 0, 1)',
                        'rgba(244, 67, 54, 1)'
                    ],
                    borderWidth: 1,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            display: false
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
                    duration: 1000
                }
            }
        });
    }
}

// Update Prediction Feed
async function updatePredictionFeed(predictions) {
    const feedContainer = document.getElementById('predictionFeed');
    if (!feedContainer) return;
    
    // If no predictions provided, fetch from API
    if (!predictions) {
        try {
            const response = await fetch('http://localhost:5000/api/analytics/predictions?limit=5');
            const data = await response.json();
            predictions = data.predictions || [];
        } catch (error) {
            console.error('Error fetching predictions:', error);
            predictions = [];
        }
    }
    
    // Clear feed
    feedContainer.innerHTML = '';
    
    if (predictions.length === 0) {
        feedContainer.innerHTML = `
            <div class="feed-empty">
                <i class="fas fa-inbox"></i>
                <p>No predictions yet</p>
            </div>
        `;
        return;
    }
    
    // Add prediction items
    predictions.forEach((prediction, index) => {
        const predictionData = prediction.prediction || {};
        const glucose = predictionData.Glucose || predictionData.glucose || 'N/A';
        const age = predictionData.Age || predictionData.age || 'N/A';
        const riskLevel = prediction.risk_level || 'unknown';
        
        const feedItem = document.createElement('div');
        feedItem.className = 'feed-item';
        feedItem.innerHTML = `
            <div class="feed-item-header">
                <div class="feed-item-icon">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="feed-item-info">
                    <strong>Prediction #${predictions.length - index}</strong>
                    <span class="feed-item-time">${formatTime(prediction.timestamp)}</span>
                </div>
            </div>
            <div class="feed-item-details">
                <span><i class="fas fa-tint"></i> Glucose: ${glucose}</span>
                <span><i class="fas fa-birthday-cake"></i> Age: ${age}</span>
                <span class="risk-badge ${riskLevel}">${riskLevel.toUpperCase()}</span>
            </div>
        `;
        
        // Add animation
        setTimeout(() => {
            feedItem.classList.add('show');
        }, index * 100);
        
        feedContainer.appendChild(feedItem);
    });
}

// Event Listeners
function setupEventListeners() {
    // Time filter change
    const timeFilter = document.getElementById('timeFilter');
    if (timeFilter) {
        timeFilter.addEventListener('change', () => {
            loadDashboardData();
            showNotification(`Filter updated to ${timeFilter.options[timeFilter.selectedIndex].text}`, 'info');
        });
    }
    
    // Refresh feed button
    const refreshBtn = document.getElementById('refreshFeed');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadDashboardData();
            refreshBtn.classList.add('spinning');
            setTimeout(() => refreshBtn.classList.remove('spinning'), 500);
        });
    }
    
    // Export buttons
    document.querySelectorAll('.export-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const format = btn.getAttribute('data-format');
            exportData(format);
        });
    });
}

// Export Data
function exportData(format) {
    if (!dashboardData) {
        showNotification('No data available to export', 'error');
        return;
    }
    
    let content, mimeType, filename;
    
    switch(format) {
        case 'json':
            content = JSON.stringify(dashboardData, null, 2);
            mimeType = 'application/json';
            filename = `diabetes-analytics-${new Date().toISOString().split('T')[0]}.json`;
            break;
            
        case 'csv':
            content = convertToCSV(dashboardData);
            mimeType = 'text/csv';
            filename = `diabetes-analytics-${new Date().toISOString().split('T')[0]}.csv`;
            break;
            
        case 'pdf':
            // PDF would require a server endpoint
            showNotification('PDF export requires server implementation', 'info');
            return;
            
        case 'excel':
            // Excel would require a server endpoint or library
            showNotification('Excel export requires server implementation', 'info');
            return;
    }
    
    // Download file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(`${format.toUpperCase()} exported successfully!`, 'success');
}

function convertToCSV(data) {
    // Simple CSV conversion for dashboard data
    const rows = [];
    
    // Overview
    rows.push('Overview');
    rows.push('Metric,Value');
    Object.entries(data.overview).forEach(([key, value]) => {
        rows.push(`${key},${value}`);
    });
    
    rows.push('\nRisk Distribution');
    rows.push('Risk Level,Count');
    Object.entries(data.risk_distribution).forEach(([key, value]) => {
        rows.push(`${key},${value}`);
    });
    
    return rows.join('\n');
}

// Sample Data for Development
function loadSampleData() {
    console.log('Loading sample data for development');
    
    const sampleData = {
        overview: {
            total_predictions: 1247,
            recent_predictions: 42,
            model_accuracy: 94.2,
            avg_response_time: 0.3
        },
        risk_distribution: {
            low: 560,
            medium: 437,
            high: 250
        },
        hourly_trend: {
            labels: ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'],
            data: [2, 1, 0, 0, 1, 2, 5, 8, 12, 15, 18, 20, 22, 21, 19, 17, 15, 13, 10, 8, 6, 4, 3, 2]
        },
        feature_distribution: {
            age_groups: { '<30': 25, '30-50': 45, '>50': 30 },
            bmi_categories: { 'Underweight': 15, 'Normal': 35, 'Overweight': 30, 'Obese': 20 },
            glucose_levels: { 'Normal': 40, 'Prediabetic': 35, 'Diabetic': 25 }
        },
        performance_metrics: {
            precision: 92,
            recall: 89,
            f1_score: 90,
            auc_score: 94
        },
        predictions_timeline: []
    };
    
    // Generate sample predictions
    for (let i = 0; i < 5; i++) {
        const hoursAgo = i;
        sampleData.predictions_timeline.push({
            timestamp: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
            prediction: {
                Glucose: 120 + Math.random() * 60,
                Age: 30 + Math.random() * 40
            },
            risk_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
        });
    }
    
    dashboardData = sampleData;
    updateDashboard(sampleData);
    updateLastUpdateTime();
}

// Utility Functions
function showLoading(show) {
    const refreshBtn = document.getElementById('refreshFeed');
    if (refreshBtn) {
        if (show) {
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            refreshBtn.disabled = true;
        } else {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            refreshBtn.disabled = false;
        }
    }
}

function showNotification(message, type = 'info') {
    // Similar to main script's showNotification
    console.log(`${type}: ${message}`);
    
    // Simple alert for now
    const colors = {
        success: '#4CAF50',
        error: '#F44336',
        info: '#2196F3',
        warning: '#FF9800'
    };
    
    // Create or update notification
    let notification = document.querySelector('.dashboard-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'dashboard-notification';
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(notification);
    }
    
    notification.style.background = colors[type] || colors.info;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function formatTime(timestamp) {
    if (!timestamp) return 'Just now';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function updateLastUpdateTime() {
    const lastUpdate = document.getElementById('lastUpdate');
    if (lastUpdate) {
        lastUpdate.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
}

function animateCounter(element, target) {
    // Simple counter animation
    let current = parseInt(element.textContent.replace(/,/g, '')) || 0;
    const increment = Math.ceil((target - current) / 20);
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
            clearInterval(timer);
            current = target;
        }
        element.textContent = current.toLocaleString();
    }, 50);
}