"""
Complete ML Pipeline for Diabetes Prediction Model
Simplified version for the project structure
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import joblib
import warnings
warnings.filterwarnings('ignore')

print("=" * 60)
print("DIABETES PREDICTION MODEL TRAINING PIPELINE")
print("=" * 60)

# 1. Load Data
print("\n📊 STEP 1: Loading Data...")
try:
    # Try local file first
    df = pd.read_csv('data/diabetes.csv')
    print(f"✅ Data loaded from local file. Shape: {df.shape}")
except:
    print("⚠️  Local file not found, loading from URL...")
    url = "https://raw.githubusercontent.com/jbrownlee/Datasets/master/pima-indians-diabetes.csv"
    df = pd.read_csv(url, header=None)
    df.columns = ['Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness', 
                  'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age', 'Outcome']
    print(f"✅ Data loaded from URL. Shape: {df.shape}")
    
    # Save to local file for future use
    df.to_csv('data/diabetes.csv', index=False)
    print("💾 Data saved to 'data/diabetes.csv'")

print("\nDataset Overview:")
print(df.head())
print(f"\nClass Distribution:")
print(df['Outcome'].value_counts())

# 2. Data Preprocessing
print("\n🔄 STEP 2: Data Preprocessing...")

# Handle zeros in specific columns (they represent missing values)
zero_columns = ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI']
for col in zero_columns:
    df[col] = df[col].replace(0, np.nan)
    df[col].fillna(df[col].median(), inplace=True)

print("✅ Replaced zeros with median values")

# Separate features and target
X = df.drop('Outcome', axis=1)
y = df['Outcome']

print(f"\nFeature shape: {X.shape}")
print(f"Target shape: {y.shape}")

# 3. Split Data
print("\n📊 STEP 3: Splitting Data...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"✅ Training set: {X_train.shape}")
print(f"✅ Testing set: {X_test.shape}")

# 4. Feature Scaling
print("\n⚖️ STEP 4: Feature Scaling...")
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print("✅ Features scaled using StandardScaler")

# Save the scaler
import os
os.makedirs('model', exist_ok=True)
joblib.dump(scaler, 'model/scaler.pkl')
print("💾 Scaler saved to 'model/scaler.pkl'")

# 5. Model Training
print("\n🤖 STEP 5: Model Training...")

# Initialize and train Random Forest
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42
)

print("Training Random Forest Classifier...")
model.fit(X_train_scaled, y_train)

# Cross-validation
cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='accuracy')
print(f"✅ Cross-validation accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

# 6. Model Evaluation
print("\n📈 STEP 6: Model Evaluation...")

# Predictions
y_pred_train = model.predict(X_train_scaled)
y_pred_test = model.predict(X_test_scaled)

# Calculate metrics
train_accuracy = accuracy_score(y_train, y_pred_train)
test_accuracy = accuracy_score(y_test, y_pred_test)
precision = precision_score(y_test, y_pred_test)
recall = recall_score(y_test, y_pred_test)
f1 = f1_score(y_test, y_pred_test)

print(f"📊 Training Accuracy: {train_accuracy:.4f}")
print(f"📊 Testing Accuracy: {test_accuracy:.4f}")
print(f"📊 Precision: {precision:.4f}")
print(f"📊 Recall: {recall:.4f}")
print(f"📊 F1-Score: {f1:.4f}")

# Confusion Matrix
print("\n📋 Confusion Matrix:")
cm = confusion_matrix(y_test, y_pred_test)
print(f"True Negatives: {cm[0][0]}")
print(f"False Positives: {cm[0][1]}")
print(f"False Negatives: {cm[1][0]}")
print(f"True Positives: {cm[1][1]}")

# Classification Report
print("\n📋 Classification Report:")
print(classification_report(y_test, y_pred_test))

# 7. Feature Importance
print("\n🔍 STEP 7: Feature Importance Analysis...")
feature_importance = pd.DataFrame({
    'Feature': X.columns,
    'Importance': model.feature_importances_
}).sort_values('Importance', ascending=False)

print("\nFeature Importance Ranking:")
for i, (_, row) in enumerate(feature_importance.iterrows(), 1):
    print(f"{i:2d}. {row['Feature']:25s}: {row['Importance']:.4f}")

# 8. Save Model
print("\n💾 STEP 8: Saving Model...")
joblib.dump(model, 'model/model.pkl')
print("✅ Model saved to 'model/model.pkl'")

# 9. Final Summary
print("\n" + "=" * 60)
print("TRAINING PIPELINE COMPLETE")
print("=" * 60)
print(f"\n📁 Files Created:")
print(f"  • model/model.pkl - Trained Random Forest model")
print(f"  • model/scaler.pkl - Feature scaler")
print(f"  • data/diabetes.csv - Dataset")
print(f"\n📊 Model Performance:")
print(f"  • Test Accuracy: {test_accuracy:.4f}")
print(f"  • Precision: {precision:.4f}")
print(f"  • Recall: {recall:.4f}")
print(f"  • F1-Score: {f1:.4f}")
print(f"\n🎯 Top 3 Important Features:")
for i in range(3):
    print(f"  {i+1}. {feature_importance.iloc[i]['Feature']} ({feature_importance.iloc[i]['Importance']:.4f})")
print(f"\n✅ Ready for deployment!")