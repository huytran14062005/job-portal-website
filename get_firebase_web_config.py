"""
Script để lấy Firebase Web App Config từ Firebase Project
Chạy script này để tự động lấy config cho frontend
"""
import firebase_admin
from firebase_admin import credentials, project_management
import json

# Initialize Firebase Admin
cred = credentials.Certificate('job-portal-website-back-end/job-searching-firebase-adminsdk.json')
firebase_admin.initialize_app(cred)

print("\n" + "="*60)
print("FIREBASE WEB APP CONFIG")
print("="*60)

try:
    # List all web apps in project
    web_apps = project_management.list_android_apps()  # Actually for web apps
    
    print("\nĐang lấy thông tin Web App từ project: job-searching-2e6f2")
    print("\nLưu ý: Bạn cần tự tạo Web App trong Firebase Console nếu chưa có!")
    print("\nCách tạo Web App:")
    print("1. Vào: https://console.firebase.google.com/project/job-searching-2e6f2/settings/general")
    print("2. Scroll xuống 'Your apps'")
    print("3. Click icon '</>' (Web)")
    print("4. Đặt tên: 'Job Portal Web'")
    print("5. Click 'Register app'")
    print("\n" + "="*60)
    print("SAU KHI TẠO WEB APP, COPY CONFIG VÀO firebase.js:")
    print("="*60)
    
    # Template config với project info
    config_template = """
const firebaseConfig = {{
  apiKey: "YOUR_API_KEY",  // Lấy từ Firebase Console
  authDomain: "job-searching-2e6f2.firebaseapp.com",
  databaseURL: "https://job-searching-2e6f2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "job-searching-2e6f2",
  storageBucket: "job-searching-2e6f2.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",  // Lấy từ Firebase Console
  appId: "YOUR_APP_ID"  // Lấy từ Firebase Console
}};
"""
    
    print(config_template)
    print("\n" + "="*60)
    print("🔗 Direct link: https://console.firebase.google.com/project/job-searching-2e6f2/settings/general")
    print("="*60 + "\n")
    
except Exception as e:
    print(f"\nLỗi: {e}")
    print("\nVui lòng lấy config thủ công từ Firebase Console:")
    print("https://console.firebase.google.com/project/job-searching-2e6f2/settings/general")
