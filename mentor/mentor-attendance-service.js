// Mentor Attendance Service
// FIXED to match attendance_records + students MAP

class MentorAttendanceService {
    constructor() {
        this.collectionName = 'attendance_records';
        this.setupCollectionName = 'mentorSetup';
    }

    /* =====================
       MENTOR SETUP
    ===================== */
    async getMentorSetup(mentorId) {
        try {
            const doc = await db.collection(this.setupCollectionName).doc(mentorId).get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            console.error('Error getting mentor setup:', error);
            return null;
        }
    }

    async updateMentorSetup(mentorId, setupData) {
        try {
            await db.collection(this.setupCollectionName).doc(mentorId).update(setupData);
            return { success: true };
        } catch (error) {
            console.error('Error updating setup:', error);
            return { success: false, error: error.message };
        }
    }

    /* =====================
       CLASS ATTENDANCE
    ===================== */
    async getClassAttendance(mentorSetup) {
        try {
            const snapshot = await db.collection(this.collectionName)
                .where('classId', '==', mentorSetup.classId)
                .get();

            const records = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                const students = Object.values(data.students || {});

                records.push({
                    id: doc.id,
                    classId: data.classId,
                    createdAt: data.createdAt,
                    students
                });
            });

            return records;
        } catch (error) {
            console.error('Error fetching class attendance:', error);
            return [];
        }
    }

    /* =====================
       SUBJECT ATTENDANCE
    ===================== */
    async getSubjectAttendance(mentorSetup, subjectId) {
        try {
            const snapshot = await db.collection(this.collectionName)
                .where('classId', '==', mentorSetup.classId)
                .get();

            const records = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                const students = Object.values(data.students || {})
                    .filter(s => s.subjectId === subjectId);

                if (students.length > 0) {
                    records.push({
                        id: doc.id,
                        subjectId,
                        students
                    });
                }
            });

            return records;
        } catch (error) {
            console.error('Error fetching subject attendance:', error);
            return [];
        }
    }

    /* =====================
       STUDENT DETAIL
    ===================== */
    getStudentDetail(attendanceRecords, studentId) {
        const studentData = [];

        attendanceRecords.forEach(record => {
            record.students.forEach(stu => {
                if (stu.studentId === studentId) {
                    studentData.push({
                        subjectId: stu.subjectId,
                        attended: stu.attended,
                        totalClasses: stu.totalClasses,
                        percentage: stu.percentage
                    });
                }
            });
        });

        return studentData;
    }

    /* =====================
       CLASS STATISTICS
    ===================== */
    calculateClassStats(attendanceRecords) {
        const studentSet = new Set();
        let totalPercentage = 0;
        let count = 0;

        attendanceRecords.forEach(record => {
            record.students.forEach(stu => {
                studentSet.add(stu.studentId);
                totalPercentage += Number(stu.percentage || 0);
                count++;
            });
        });

        return {
            totalStudents: studentSet.size,
            subjectsTracked: attendanceRecords.length,
            averageAttendance: count > 0 ? (totalPercentage / count).toFixed(2) : 0
        };
    }

    /* =====================
       STUDENT SUMMARY
    ===================== */
    getStudentSummary(attendanceRecords) {
        const map = new Map();

        attendanceRecords.forEach(record => {
            record.students.forEach(stu => {
                if (!map.has(stu.studentId)) {
                    map.set(stu.studentId, {
                        studentId: stu.studentId,
                        name: stu.studentName,
                        subjects: [],
                        totalPercentage: 0
                    });
                }

                map.get(stu.studentId).subjects.push({
                    subjectId: stu.subjectId,
                    attended: stu.attended,
                    totalClasses: stu.totalClasses,
                    percentage: stu.percentage
                });
            });
        });

        const result = [];
        map.forEach(student => {
            const total = student.subjects.reduce(
                (sum, s) => sum + Number(s.percentage), 0
            );
            student.totalPercentage =
                (total / student.subjects.length).toFixed(2);
            result.push(student);
        });

        return result;
    }

    /* =====================
       REPORT
    ===================== */
    generateReport(attendanceRecords, mentorSetup) {
        return {
            classInfo: mentorSetup,
            statistics: this.calculateClassStats(attendanceRecords),
            studentSummary: this.getStudentSummary(attendanceRecords),
            generatedDate: new Date().toISOString(),
            reportType: 'Class Attendance Report'
        };
    }

    /* =====================
       CSV EXPORT
    ===================== */
    exportClassReportCSV(attendanceRecords, mentorSetup) {
        let csv = 'Student ID,Student Name,Subject ID,Attended,Total Classes,Percentage\n';

        attendanceRecords.forEach(record => {
            record.students.forEach(stu => {
                csv += `${stu.studentId},"${stu.studentName}",${stu.subjectId},${stu.attended},${stu.totalClasses},${stu.percentage}\n`;
            });
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Attendance_${mentorSetup.classId}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }

    /* =====================
       ATTENDANCE TREND
    ===================== */
    getAttendanceTrend(attendanceRecords) {
        const trend = {};

        attendanceRecords.forEach(record => {
            record.students.forEach(stu => {
                if (!trend[stu.subjectId]) {
                    trend[stu.subjectId] = {
                        subjectId: stu.subjectId,
                        high: 0,
                        medium: 0,
                        low: 0
                    };
                }

                if (stu.percentage >= 75) trend[stu.subjectId].high++;
                else if (stu.percentage >= 50) trend[stu.subjectId].medium++;
                else trend[stu.subjectId].low++;
            });
        });

        return Object.values(trend);
    }
}

// Global instance
const mentorAttendanceService = new MentorAttendanceService();
