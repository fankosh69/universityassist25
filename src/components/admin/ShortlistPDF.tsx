import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Register fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ],
});

interface Campus {
  id: string;
  name: string;
  city_name: string;
  is_main_campus: boolean;
}

interface ShortlistPDFProps {
  title: string;
  studentName: string;
  staffName: string;
  message?: string;
  programs: Array<{
    id: string;
    name: string;
    degree_type: string;
    duration_semesters: number;
    semester_fees: number;
    tuition_amount?: number;
    tuition_fee_structure?: 'monthly' | 'semester' | 'yearly';
    winter_intake?: boolean;
    summer_intake?: boolean;
    winter_deadline?: string;
    summer_deadline?: string;
    uni_assist_required?: boolean;
    university: {
      name: string;
      city_name?: string;
    };
    campuses?: Campus[];
    staff_notes?: string;
  }>;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2pt solid #2E57F6',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#2E57F6',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 5,
  },
  greeting: {
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 10,
  },
  messageBox: {
    backgroundColor: '#f0f7ff',
    borderLeft: '4pt solid #2E57F6',
    padding: 12,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  programCard: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    border: '1pt solid #e5e7eb',
  },
  programTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1a202c',
    marginBottom: 8,
  },
  universityText: {
    fontSize: 11,
    color: '#4a5568',
    marginBottom: 10,
  },
  campusText: {
    fontSize: 10,
    color: '#4a5568',
    marginBottom: 10,
    paddingLeft: 10,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  detailItem: {
    width: '33.333%',
    fontSize: 9,
    marginBottom: 6,
    color: '#4a5568',
  },
  label: {
    fontWeight: 700,
  },
  deadlineSection: {
    backgroundColor: '#fff5f5',
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  deadline: {
    fontSize: 9,
    color: '#c53030',
    fontWeight: 600,
    marginBottom: 4,
  },
  notesBox: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 4,
    marginTop: 10,
    border: '1pt solid #e5e7eb',
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 5,
    color: '#2d3748',
  },
  notesText: {
    fontSize: 9,
    color: '#4a5568',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#a0aec0',
    borderTop: '1pt solid #e5e7eb',
    paddingTop: 10,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 15,
    right: 40,
    fontSize: 8,
    color: '#a0aec0',
  },
  badge: {
    backgroundColor: '#2E57F6',
    color: '#ffffff',
    padding: '3 8',
    borderRadius: 3,
    fontSize: 8,
    fontWeight: 600,
    marginRight: 5,
  },
});

export const ShortlistPDF = ({
  title,
  studentName,
  staffName,
  message,
  programs,
}: ShortlistPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Curated by {staffName}</Text>
      </View>

      {/* Greeting */}
      <View style={{ marginBottom: 15 }}>
        <Text style={styles.greeting}>Hi {studentName}! 👋</Text>
        <Text style={{ fontSize: 11, marginBottom: 10 }}>
          {staffName} has carefully selected these programs for you:
        </Text>
      </View>

      {/* Message */}
      {message && (
        <View style={styles.messageBox}>
          <Text>{message}</Text>
        </View>
      )}

      {/* Programs */}
      {programs.map((program, index) => (
        <View key={program.id} style={styles.programCard} wrap={false}>
          <Text style={styles.programTitle}>{program.name}</Text>
          
          <Text style={styles.universityText}>
            🏛️ {program.university.name}
          </Text>

          {program.campuses && program.campuses.length > 0 && (
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.campusText}>
                📍 Campus{program.campuses.length > 1 ? 'es' : ''}: {' '}
                {program.campuses
                  .sort((a, b) => (b.is_main_campus ? 1 : 0) - (a.is_main_campus ? 1 : 0))
                  .map((campus, idx) => 
                    `${idx > 0 ? ', ' : ''}${campus.name} (${campus.city_name})${campus.is_main_campus ? ' ⭐' : ''}`
                  ).join('')}
              </Text>
            </View>
          )}

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text>
                🎓 <Text style={styles.label}>{program.degree_type}</Text>
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text>
                ⏱️ <Text style={styles.label}>{program.duration_semesters} semesters</Text>
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text>
                💶 <Text style={styles.label}>
                  {(() => {
                    const amount = program.tuition_amount !== undefined && program.tuition_amount !== null 
                      ? program.tuition_amount 
                      : program.semester_fees;
                    const structure = program.tuition_fee_structure || 'semester';
                    const labels = { monthly: '/month', semester: '/semester', yearly: '/year' };
                    return amount === 0 ? 'Free' : `€${amount.toLocaleString()}${labels[structure]}`;
                  })()}
                </Text>
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text>
                📅 <Text style={styles.label}>Intake: </Text>
                {program.winter_intake && program.summer_intake && 'Winter & Summer'}
                {program.winter_intake && !program.summer_intake && 'Winter Only'}
                {!program.winter_intake && program.summer_intake && 'Summer Only'}
                {!program.winter_intake && !program.summer_intake && 'Not specified'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text>
                📝 <Text style={styles.label}>Application: </Text>
                {program.uni_assist_required ? 'Via Uni-Assist' : 'Direct'}
              </Text>
            </View>
          </View>

          {(program.winter_intake || program.summer_intake) && (
            <View style={styles.deadlineSection}>
              {program.winter_intake && program.winter_deadline && (
                <Text style={styles.deadline}>
                  ❄️ Winter Deadline: {program.winter_deadline}
                </Text>
              )}
              {program.summer_intake && program.summer_deadline && (
                <Text style={styles.deadline}>
                  ☀️ Summer Deadline: {program.summer_deadline}
                </Text>
              )}
            </View>
          )}

          {program.staff_notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>💡 Why this program?</Text>
              <Text style={styles.notesText}>{program.staff_notes}</Text>
            </View>
          )}
        </View>
      ))}

      {/* Footer */}
      <View style={styles.footer} fixed>
        <Text>
          University Assist is not affiliated with uni-assist e.V., DAAD, or German universities.
        </Text>
        <Text style={{ marginTop: 3 }}>All trademarks belong to their respective owners.</Text>
      </View>

      {/* Page Number */}
      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
        `${pageNumber} / ${totalPages}`
      )} fixed />
    </Page>
  </Document>
);
