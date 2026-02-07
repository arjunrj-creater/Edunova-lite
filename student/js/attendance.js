// Attendance Service
// This service handles all attendance-related operations

class AttendanceService {
    constructor() {
        this.collectionName = 'attendance';
    }

    /**
     * Upload attendance records
     */
    async uploadAttendance(semesterData) {
        try {
            const result = await db.collection(this.collectionName).add({
                ...semesterData,
                uploadDate: new Date().toISOString(),
                uploadedBy: firebase.auth().currentUser.uid
            });
            return { success: true, docId: result.id };
        } catch (error) {
            console.error('Error uploading attendance:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get student attendance for a specific semester
     */
    async getStudentAttendance(rollNumber, semester = null) {
        try {
            let query = db.collection(this.collectionName);

            const records = [];
            const snapshot = await query.get();

            snapshot.forEach(doc => {
                const data = doc.data();
                const studentRecord = data.attendanceData.find(
                    att => att.rollNum === rollNumber
                );

                if (studentRecord) {
                    if (!semester || data.semester === semester) {
                        records.push({
                            id: doc.id,
                            semester: data.semester,
                            subject: data.subject,
                            subjectCode: data.subjectCode,
                            totalClasses: data.totalClasses,
                            attended: studentRecord.attended,
                            percentage: studentRecord.percentage,
                            uploadDate: data.uploadDate
                        });
                    }
                }
            });

            return records;
        } catch (error) {
            console.error('Error fetching student attendance:', error);
            return [];
        }
    }

    /**
     * Get all attendance records for a subject
     */
    async getSubjectAttendance(subjectCode, semester) {
        try {
            const snapshot = await db.collection(this.collectionName)
                .where('subjectCode', '==', subjectCode)
                .where('semester', '==', semester)
                .get();

            const records = [];
            snapshot.forEach(doc => {
                records.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return records;
        } catch (error) {
            console.error('Error fetching subject attendance:', error);
            return [];
        }
    }

    /**
     * Calculate overall attendance statistics
     */
    calculateStats(attendanceRecords) {
        if (attendanceRecords.length === 0) {
            return {
                totalSubjects: 0,
                overallAttendance: 0,
                satisfactory: 0,
                needsImprovement: 0
            };
        }

        let totalPercentage = 0;
        let satisfactory = 0;

        attendanceRecords.forEach(record => {
            const percentage = parseFloat(record.percentage);
            totalPercentage += percentage;
            if (percentage >= 75) satisfactory++;
        });

        return {
            totalSubjects: attendanceRecords.length,
            overallAttendance: (totalPercentage / attendanceRecords.length).toFixed(2),
            satisfactory: satisfactory,
            needsImprovement: attendanceRecords.length - satisfactory
        };
    }

    /**
     * Generate attendance report
     */
    generateReport(attendanceRecords, studentName) {
        const stats = this.calculateStats(attendanceRecords);

        return {
            studentName: studentName,
            generatedDate: new Date().toISOString(),
            statistics: stats,
            records: attendanceRecords,
            summary: `${stats.satisfactory}/${stats.totalSubjects} subjects meeting minimum 75% attendance`
        };
    }

    /**
     * Export attendance to CSV
     */
    exportToCSV(attendanceRecords, filename = 'attendance.csv') {
        let csv = 'Subject,Code,Semester,Classes Attended,Total Classes,Attendance %\n';

        attendanceRecords.forEach(record => {
            csv += `"${record.subject}","${record.subjectCode}",${record.semester},${record.attended},${record.totalClasses},"${record.percentage}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Update attendance record
     */
    async updateAttendance(docId, updates) {
        try {
            await db.collection(this.collectionName).doc(docId).update(updates);
            return { success: true };
        } catch (error) {
            console.error('Error updating attendance:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete attendance record
     */
    async deleteAttendance(docId) {
        try {
            await db.collection(this.collectionName).doc(docId).delete();
            return { success: true };
        } catch (error) {
            console.error('Error deleting attendance:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get attendance summary by semester
     */
    async getAttendanceBySemester(rollNumber) {
        try {
            const records = await this.getStudentAttendance(rollNumber);
            const grouped = {};

            records.forEach(record => {
                if (!grouped[record.semester]) {
                    grouped[record.semester] = [];
                }
                grouped[record.semester].push(record);
            });

            const summary = {};
            for (const semester in grouped) {
                summary[semester] = this.calculateStats(grouped[semester]);
            }

            return summary;
        } catch (error) {
            console.error('Error getting semester summary:', error);
            return {};
        }
    }
}

// Create global instance
const attendanceService = new AttendanceService();
