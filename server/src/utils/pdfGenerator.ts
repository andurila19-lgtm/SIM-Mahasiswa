import PDFDocument from 'pdfkit';
import { Response } from 'express';

const generateKHS = (data: any, stream: Response) => {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(stream);

    // Header
    doc.fontSize(18).text('KARTU HASIL STUDI (KHS)', { align: 'center' });
    doc.fontSize(14).text('SIM MAHASISWA UNIVERSITAS', { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Student Info (Mocked data mapping)
    doc.fontSize(10).text(`Nama: ${data.profile.full_name}`);
    doc.text(`NIM: ${data.nim}`);
    doc.text(`Program Studi: ${data.study_program.name}`);
    doc.text(`Semester: ${data.semester_current}`);
    doc.moveDown();

    // Table header
    const tableTop = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('KODE', 50, tableTop);
    doc.text('MATA KULIAH', 100, tableTop);
    doc.text('SKS', 350, tableTop);
    doc.text('NILAI', 400, tableTop);
    doc.text('BOBOT', 450, tableTop);
    doc.font('Helvetica');
    doc.moveDown();

    // Grades
    data.grades.forEach((grade: any) => {
        const y = doc.y;
        doc.text(grade.course.code, 50, y);
        doc.text(grade.course.name, 100, y, { width: 240 });
        doc.text(grade.course.sks.toString(), 350, y);
        doc.text(grade.grade_letter, 400, y);
        doc.text(grade.grade_point.toFixed(2), 450, y);
        doc.moveDown(0.5);
    });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Calculated Stats
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`Total SKS: ${data.total_sks}`, { align: 'right' });
    doc.text(`IP Semester: ${data.ips.toFixed(2)}`, { align: 'right' });
    doc.text(`IP Kumulatif: ${data.ipk.toFixed(2)}`, { align: 'right' });

    doc.end();
};

export { generateKHS };
