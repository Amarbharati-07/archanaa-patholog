import { 
  patients, tests, results, reports, bookings, otps, admins, reviews, advertisements,
  type Patient, type InsertPatient,
  type Test, type InsertTest,
  type Result, type InsertResult,
  type Report, type InsertReport,
  type Booking, type InsertBooking,
  type Otp, type InsertOtp,
  type Admin, type InsertAdmin,
  type Review, type InsertReview,
  type Advertisement, type InsertAdvertisement,
} from "@shared/schema";
import { db } from "./db";
import { eq, or, ilike, desc, and, gte, sql } from "drizzle-orm";

export interface IStorage {
  // Patients
  getPatient(id: string): Promise<Patient | undefined>;
  getPatientByPatientId(patientId: string): Promise<Patient | undefined>;
  getPatientByPhone(phone: string): Promise<Patient | undefined>;
  getPatientByEmail(email: string): Promise<Patient | undefined>;
  getAllPatients(): Promise<Patient[]>;
  searchPatients(query: string): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  updatePatientFirebaseUid(id: string, firebaseUid: string): Promise<Patient | undefined>;
  updatePatientPassword(id: string, password: string): Promise<Patient | undefined>;
  updatePatientEmailVerified(id: string, verified: boolean): Promise<Patient | undefined>;

  // Tests
  getTest(id: string): Promise<Test | undefined>;
  getTestByCode(code: string): Promise<Test | undefined>;
  getAllTests(): Promise<Test[]>;
  createTest(test: InsertTest): Promise<Test>;

  // Results
  getResult(id: string): Promise<Result | undefined>;
  getResultsByPatient(patientId: string): Promise<Result[]>;
  createResult(result: InsertResult): Promise<Result>;

  // Reports
  getReport(id: string): Promise<Report | undefined>;
  getReportByToken(token: string): Promise<Report | undefined>;
  getReportsByPatient(patientId: string): Promise<Report[]>;
  getAllReports(): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;

  // Bookings
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByPatient(patientId: string): Promise<Booking[]>;
  getAllBookings(): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: string, status: string): Promise<Booking | undefined>;
  updateBookingPayment(id: string, paymentData: {
    paymentMethod: string;
    paymentStatus: string;
    transactionId?: string;
    amountPaid: string;
    paymentDate: Date;
  }): Promise<Booking | undefined>;
  verifyBookingPayment(id: string, adminId: string): Promise<Booking | undefined>;

  // OTP
  createOtp(otp: InsertOtp): Promise<Otp>;
  verifyOtp(contact: string, otp: string, purpose: string): Promise<Otp | undefined>;
  incrementOtpAttempts(id: string): Promise<number>;
  getOtpByContact(contact: string, purpose: string): Promise<Otp | undefined>;
  deleteOtp(id: string): Promise<void>;

  // Admins
  getAdmin(id: string): Promise<Admin | undefined>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;

  // Stats
  getDashboardStats(): Promise<{
    totalPatients: number;
    totalReports: number;
    pendingBookings: number;
    totalTests: number;
    recentBookings: number;
    todayReports: number;
  }>;

  // Reviews
  getAllReviews(): Promise<Review[]>;
  getApprovedReviews(): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  updateReviewApproval(id: string, isApproved: boolean): Promise<Review | undefined>;
  deleteReview(id: string): Promise<void>;

  // Advertisements
  getAllAdvertisements(): Promise<Advertisement[]>;
  getActiveAdvertisements(): Promise<Advertisement[]>;
  createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement>;
  updateAdvertisement(id: string, ad: Partial<InsertAdvertisement>): Promise<Advertisement | undefined>;
  deleteAdvertisement(id: string): Promise<void>;

  // Utility
  generatePatientId(): Promise<string>;
}

export class DatabaseStorage implements IStorage {
  // Patients
  async getPatient(id: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient || undefined;
  }

  async getPatientByPatientId(patientId: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.patientId, patientId));
    return patient || undefined;
  }

  async getPatientByPhone(phone: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.phone, phone));
    return patient || undefined;
  }

  async getPatientByEmail(email: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.email, email));
    return patient || undefined;
  }

  async getAllPatients(): Promise<Patient[]> {
    return db.select().from(patients).orderBy(desc(patients.createdAt));
  }

  async searchPatients(query: string): Promise<Patient[]> {
    const searchPattern = `%${query}%`;
    return db.select().from(patients).where(
      or(
        ilike(patients.patientId, searchPattern),
        ilike(patients.name, searchPattern),
        ilike(patients.phone, searchPattern),
        ilike(patients.email, searchPattern)
      )
    ).orderBy(desc(patients.createdAt));
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const [created] = await db.insert(patients).values(patient).returning();
    return created;
  }

  async updatePatient(id: string, patient: Partial<InsertPatient>): Promise<Patient | undefined> {
    const [updated] = await db.update(patients).set(patient).where(eq(patients.id, id)).returning();
    return updated || undefined;
  }

  async updatePatientFirebaseUid(id: string, firebaseUid: string): Promise<Patient | undefined> {
    const [updated] = await db.update(patients).set({ firebaseUid }).where(eq(patients.id, id)).returning();
    return updated || undefined;
  }

  async updatePatientPassword(id: string, password: string): Promise<Patient | undefined> {
    const [updated] = await db.update(patients).set({ password }).where(eq(patients.id, id)).returning();
    return updated || undefined;
  }

  async updatePatientEmailVerified(id: string, verified: boolean): Promise<Patient | undefined> {
    const [updated] = await db.update(patients).set({ emailVerified: verified }).where(eq(patients.id, id)).returning();
    return updated || undefined;
  }

  async generatePatientId(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `ARCH-${dateStr}-`;
    
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(patients)
      .where(ilike(patients.patientId, `${prefix}%`));
    
    const count = (result?.count || 0) + 1;
    return `${prefix}${count.toString().padStart(4, '0')}`;
  }

  // Tests
  async getTest(id: string): Promise<Test | undefined> {
    const [test] = await db.select().from(tests).where(eq(tests.id, id));
    return test || undefined;
  }

  async getTestByCode(code: string): Promise<Test | undefined> {
    const [test] = await db.select().from(tests).where(eq(tests.code, code));
    return test || undefined;
  }

  async getAllTests(): Promise<Test[]> {
    return db.select().from(tests).orderBy(tests.category, tests.name);
  }

  async createTest(test: InsertTest): Promise<Test> {
    const [created] = await db.insert(tests).values(test).returning();
    return created;
  }

  // Results
  async getResult(id: string): Promise<Result | undefined> {
    const [result] = await db.select().from(results).where(eq(results.id, id));
    return result || undefined;
  }

  async getResultsByPatient(patientId: string): Promise<Result[]> {
    return db.select().from(results)
      .where(eq(results.patientId, patientId))
      .orderBy(desc(results.createdAt));
  }

  async createResult(result: InsertResult): Promise<Result> {
    const [created] = await db.insert(results).values(result).returning();
    return created;
  }

  // Reports
  async getReport(id: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || undefined;
  }

  async getReportByToken(token: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.secureDownloadToken, token));
    return report || undefined;
  }

  async getReportsByPatient(patientId: string): Promise<Report[]> {
    return db.select().from(reports)
      .where(eq(reports.patientId, patientId))
      .orderBy(desc(reports.generatedAt));
  }

  async getAllReports(): Promise<Report[]> {
    return db.select().from(reports).orderBy(desc(reports.generatedAt));
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [created] = await db.insert(reports).values(report).returning();
    return created;
  }

  // Bookings
  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getBookingsByPatient(patientId: string): Promise<Booking[]> {
    return db.select().from(bookings)
      .where(eq(bookings.patientId, patientId))
      .orderBy(desc(bookings.slot));
  }

  async getAllBookings(): Promise<Booking[]> {
    return db.select().from(bookings).orderBy(desc(bookings.slot));
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [created] = await db.insert(bookings).values(booking).returning();
    return created;
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking | undefined> {
    const [updated] = await db.update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    return updated || undefined;
  }

  async updateBookingPayment(id: string, paymentData: {
    paymentMethod: string;
    paymentStatus: string;
    transactionId?: string;
    amountPaid: string;
    paymentDate: Date;
  }): Promise<Booking | undefined> {
    const [updated] = await db.update(bookings)
      .set({
        paymentMethod: paymentData.paymentMethod,
        paymentStatus: paymentData.paymentStatus,
        transactionId: paymentData.transactionId || null,
        amountPaid: paymentData.amountPaid,
        paymentDate: paymentData.paymentDate,
      })
      .where(eq(bookings.id, id))
      .returning();
    return updated || undefined;
  }

  async verifyBookingPayment(id: string, adminId: string): Promise<Booking | undefined> {
    const [updated] = await db.update(bookings)
      .set({
        paymentStatus: 'verified',
        paymentVerifiedAt: new Date(),
        paymentVerifiedBy: adminId,
      })
      .where(eq(bookings.id, id))
      .returning();
    return updated || undefined;
  }

  // OTP
  async createOtp(otp: InsertOtp): Promise<Otp> {
    // Delete any existing OTPs for this contact and purpose
    await db.delete(otps).where(
      and(eq(otps.contact, otp.contact), eq(otps.purpose, otp.purpose))
    );
    const [created] = await db.insert(otps).values(otp).returning();
    return created;
  }

  async verifyOtp(contact: string, otpCode: string, purpose: string): Promise<Otp | undefined> {
    const [otp] = await db.select().from(otps).where(
      and(
        eq(otps.contact, contact),
        eq(otps.otp, otpCode),
        eq(otps.purpose, purpose),
        gte(otps.expiresAt, new Date())
      )
    );
    return otp || undefined;
  }

  async deleteOtp(id: string): Promise<void> {
    await db.delete(otps).where(eq(otps.id, id));
  }

  async incrementOtpAttempts(id: string): Promise<number> {
    const [updated] = await db.update(otps)
      .set({ attempts: sql`${otps.attempts} + 1` })
      .where(eq(otps.id, id))
      .returning();
    return updated?.attempts || 0;
  }

  async getOtpByContact(contact: string, purpose: string): Promise<Otp | undefined> {
    const [otp] = await db.select().from(otps).where(
      and(
        eq(otps.contact, contact),
        eq(otps.purpose, purpose),
        gte(otps.expiresAt, new Date())
      )
    );
    return otp || undefined;
  }

  // Admins
  async getAdmin(id: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin || undefined;
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.username, username));
    return admin || undefined;
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const [created] = await db.insert(admins).values(admin).returning();
    return created;
  }

  // Dashboard Stats
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [patientsCount] = await db.select({ count: sql<number>`count(*)` }).from(patients);
    const [reportsCount] = await db.select({ count: sql<number>`count(*)` }).from(reports);
    const [pendingCount] = await db.select({ count: sql<number>`count(*)` })
      .from(bookings).where(eq(bookings.status, 'pending'));
    const [testsCount] = await db.select({ count: sql<number>`count(*)` }).from(tests);
    const [recentCount] = await db.select({ count: sql<number>`count(*)` })
      .from(bookings).where(gte(bookings.createdAt, sevenDaysAgo));
    const [todayCount] = await db.select({ count: sql<number>`count(*)` })
      .from(reports).where(gte(reports.generatedAt, today));

    return {
      totalPatients: Number(patientsCount?.count || 0),
      totalReports: Number(reportsCount?.count || 0),
      pendingBookings: Number(pendingCount?.count || 0),
      totalTests: Number(testsCount?.count || 0),
      recentBookings: Number(recentCount?.count || 0),
      todayReports: Number(todayCount?.count || 0),
    };
  }

  // Reviews
  async getAllReviews(): Promise<Review[]> {
    return db.select().from(reviews).orderBy(desc(reviews.createdAt));
  }

  async getApprovedReviews(): Promise<Review[]> {
    return db.select().from(reviews)
      .where(eq(reviews.isApproved, true))
      .orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [created] = await db.insert(reviews).values(review).returning();
    return created;
  }

  async updateReviewApproval(id: string, isApproved: boolean): Promise<Review | undefined> {
    const [updated] = await db.update(reviews)
      .set({ isApproved })
      .where(eq(reviews.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteReview(id: string): Promise<void> {
    await db.delete(reviews).where(eq(reviews.id, id));
  }

  // Advertisements
  async getAllAdvertisements(): Promise<Advertisement[]> {
    return db.select().from(advertisements).orderBy(advertisements.sortOrder);
  }

  async getActiveAdvertisements(): Promise<Advertisement[]> {
    return db.select().from(advertisements)
      .where(eq(advertisements.isActive, true))
      .orderBy(advertisements.sortOrder);
  }

  async createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement> {
    const [created] = await db.insert(advertisements).values(ad).returning();
    return created;
  }

  async updateAdvertisement(id: string, ad: Partial<InsertAdvertisement>): Promise<Advertisement | undefined> {
    const [updated] = await db.update(advertisements)
      .set(ad)
      .where(eq(advertisements.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteAdvertisement(id: string): Promise<void> {
    await db.delete(advertisements).where(eq(advertisements.id, id));
  }
}

export const storage = new DatabaseStorage();
