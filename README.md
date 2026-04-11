# Edunova Lite

Edunova Lite is a lightweight academic management web application designed to manage students, mentors, faculty, and academic workflows in an educational institution.  
The system is built with a clear role-based structure and uses Firebase for authentication, database, and hosting.
This project is developed as an academic management system prototype for educational institutions.


The main goal of Edunova Lite is to simplify attendance, marks, and result management while keeping the system secure, scalable, and easy to use.

---

## 🔹 Live Website

🔗 https://edunova-lite.web.app/

---

## 🔹 Roles & Access Flow

Edunova Lite follows a **controlled creation flow** to maintain security and authority.

### 1️⃣ HOD (Head of Department) – *Only One User*

- There is **only one HOD account** in the system.
- Login uses **email + password**.
- When a HOD retires, the existing HOD transfers ownership by sharing credentials with the next HOD.
- The new HOD simply changes the password and email.
- This ensures secure ownership transfer without data loss.

### HOD Permissions
HOD has **full control** over the system.

#### HOD Dashboard Features
1. **Dashboard** – Complete system overview  
2. **Profile** – View user details, change password and email  
3. **Create Mentor** – Create and manage mentors  
4. **Create Faculty** – Create and manage faculty  
5. **Upload Academic Structure**  
   - Bulk upload subjects  
   - Subjects are not deleted (past subjects are disabled and new ones activated)  
6. **Student Approval**  
   - Mentors create students  
   - HOD approves students before login access  
   - Authentication creation is restricted to HOD for security reasons  

---

### 2️⃣ Mentor

- Created by HOD
- Temporary password is provided by HOD
- On first login, mentor must reset password
- Mentor is assigned to one or more classes
- Mentor acts as the **class head**

#### Mentor Dashboard Features
1. **Dashboard**
   - Total students
   - Notifications (marks uploaded by faculty)
2. **My Students**
   - View all students
   - Blacklist or remove students
3. **Create Students**
   - Create students individually
   - Set passwords for students
4. **Upload Students**
   - Bulk upload students using Excel
5. **Attendance Verification**
   - Verify attendance uploaded by faculty
   - Publish to students
6. **Mark Verification**
   - Verify marks uploaded by faculty
   - Publish to students
7. **Result Analysis**
   - Generate full class report card
   - Publish results
8. **Profile**
   - View details
   - Change password  
   - Username (mentor ID) cannot be changed

---

### 3️⃣ Faculty

- Created by HOD
- Temporary password provided
- Password must be reset on first login
- Faculty must configure teaching details (class & subject)
- A faculty member can teach **multiple classes and subjects**

#### Faculty Dashboard Features
1. **Dashboard**
   - Total classes teaching
   - Total subjects teaching
2. **Attendance**
   - Upload attendance for each class
   - Data sent to mentor for verification
3. **Marks**
   - Upload internal marks
   - Data sent to mentor for verification
4. **Profile**
   - View details
   - Change password

---

### 4️⃣ Students

- Created and managed by Mentor
- Temporary password given by Mentor
- Must reset password on first login
- Student selects class during first login

#### Student Access
- View attendance
- View marks
- View results
- Manage profile and password

---

## 🔹 Tech Stack

- HTML5  
- CSS3  
- JavaScript  
- Firebase Authentication  
- Firebase Firestore  
- Firebase Hosting  

---

## 🔹 Project Structure

edunova-lite/
│
├── common/
├── css/
├── faculty/
├── hod/
├── mentor/
├── student/
├── js/
├── images/
│
├── index.html
├── login.html
├── 404.html
├── firebase.json
├── .firebaserc
└── .gitignore

---

## 🔹 Local Setup

```bash
git clone https://github.com/arjunrj-creator/Edunova-lite.git
cd edunova-lite

firebase login
firebase init
firebase deploy
```md
---

## 🔹 License

This project is licensed under the **MIT License**.

---

## 🔹 Author

**Futurestack**  
Creator of Edunova Lite
