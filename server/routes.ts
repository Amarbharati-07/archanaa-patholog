import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomBytes, createHash, createHmac } from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { verifyFirebaseToken } from "./firebase-admin";
import { sendOtpEmail } from "./email";
import multer from "multer";
import path from "path";
import fs from "fs";
import Razorpay from "razorpay";

const uploadsDir = path.join(process.cwd(), "uploads", "banners");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "banner-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadBanner = multer({
  storage: bannerStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const JWT_SECRET = process.env.SESSION_SECRET || "archana-pathology-secret-key";

// Initialize Razorpay instance (only if credentials are available)
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

let razorpayInstance: Razorpay | null = null;
if (razorpayKeyId && razorpayKeySecret) {
  razorpayInstance = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });
  console.log("Razorpay initialized successfully");
} else {
  console.log("Razorpay credentials not found - payment gateway disabled");
}

// Generate a random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate secure download token
function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}

// JWT token verification middleware
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; type: string };
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

// Admin-only middleware
function adminOnly(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || user.type !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ==================== AUTH ROUTES ====================

  // Request OTP
  app.post("/api/auth/request-otp", async (req, res) => {
    try {
      const { contact, purpose } = req.body;
      
      if (!contact || !purpose) {
        return res.status(400).json({ message: "Contact and purpose are required" });
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      await storage.createOtp({
        contact,
        otp,
        purpose,
        expiresAt,
      });

      // In production, send OTP via SMS/Email
      console.log(`OTP for ${contact}: ${otp}`);

      res.json({ message: "OTP sent successfully", debug_otp: otp });
    } catch (error) {
      console.error("Error requesting OTP:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  // Verify OTP
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { contact, otp, purpose } = req.body;

      if (!contact || !otp || !purpose) {
        return res.status(400).json({ message: "Contact, OTP, and purpose are required" });
      }

      const otpRecord = await storage.verifyOtp(contact, otp, purpose);
      
      if (!otpRecord) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      await storage.deleteOtp(otpRecord.id);

      // Find or create patient
      let patient = await storage.getPatientByPhone(contact) || 
                    await storage.getPatientByEmail(contact);

      if (!patient && purpose === "register") {
        return res.status(400).json({ message: "Patient not found. Please register first." });
      }

      if (!patient) {
        return res.status(400).json({ message: "Patient not found" });
      }

      const token = jwt.sign({ id: patient.id, type: 'patient' }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ patient, token });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // Register new patient
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, phone, email, gender, dob } = req.body;

      if (!name || !phone) {
        return res.status(400).json({ message: "Name and phone are required" });
      }

      // Check if patient already exists
      const existing = await storage.getPatientByPhone(phone);
      if (existing) {
        return res.status(400).json({ message: "Phone number already registered" });
      }

      const patientId = await storage.generatePatientId();
      
      const patient = await storage.createPatient({
        patientId,
        name,
        phone,
        email: email || null,
        gender: gender || null,
        dob: dob ? new Date(dob) : null,
        address: null,
        password: null,
        notes: null,
      });

      // Generate and send OTP
      const otp = generateOTP();
      await storage.createOtp({
        contact: phone,
        otp,
        purpose: "register",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });

      console.log(`OTP for ${phone}: ${otp}`);

      res.json({ message: "Registration successful. OTP sent.", patientId: patient.patientId, debug_otp: otp });
    } catch (error) {
      console.error("Error registering:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Firebase Login - Now with proper server-side token verification
  app.post("/api/auth/firebase-login", async (req, res) => {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({ message: "Firebase ID token is required" });
      }

      const verified = await verifyFirebaseToken(idToken);
      if (!verified) {
        return res.status(401).json({ message: "Invalid or expired Firebase token" });
      }

      const phone = verified.phone;
      if (!phone) {
        return res.status(400).json({ message: "Phone number not found in Firebase account" });
      }

      let patient = await storage.getPatientByPhone(phone);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found. Please register first." });
      }

      if (patient.firebaseUid && patient.firebaseUid !== verified.uid) {
        return res.status(403).json({ message: "Phone number linked to another account" });
      }

      if (!patient.firebaseUid) {
        patient = await storage.updatePatientFirebaseUid(patient.id, verified.uid);
      }

      const token = jwt.sign({ id: patient!.id, type: 'patient' }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ patient, token });
    } catch (error) {
      console.error("Error in Firebase login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Firebase Register - Now with proper server-side token verification
  app.post("/api/auth/firebase-register", async (req, res) => {
    try {
      const { name, idToken, email, gender, dob } = req.body;

      if (!name || !idToken) {
        return res.status(400).json({ message: "Name and Firebase ID token are required" });
      }

      const verified = await verifyFirebaseToken(idToken);
      if (!verified) {
        return res.status(401).json({ message: "Invalid or expired Firebase token" });
      }

      const phone = verified.phone;
      if (!phone) {
        return res.status(400).json({ message: "Phone number not found in Firebase account" });
      }

      const existing = await storage.getPatientByPhone(phone);
      if (existing) {
        if (existing.firebaseUid === verified.uid) {
          const token = jwt.sign({ id: existing.id, type: 'patient' }, JWT_SECRET, { expiresIn: '7d' });
          return res.json({ patient: existing, token });
        }
        return res.status(400).json({ message: "Phone number already registered" });
      }

      const patientId = await storage.generatePatientId();
      
      const patient = await storage.createPatient({
        patientId,
        name,
        phone,
        email: email || verified.email || null,
        gender: gender || null,
        dob: dob ? new Date(dob) : null,
        address: null,
        password: null,
        firebaseUid: verified.uid,
        notes: null,
      });

      const token = jwt.sign({ id: patient.id, type: 'patient' }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ patient, token });
    } catch (error) {
      console.error("Error in Firebase register:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // ==================== EMAIL/PASSWORD AUTH ROUTES ====================

  // Register with email and password
  app.post("/api/auth/register-email", async (req, res) => {
    try {
      const { name, email, phone, password, gender, dob } = req.body;

      if (!name || !email || !phone || !password) {
        return res.status(400).json({ message: "Name, email, phone, and password are required" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Validate password strength
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Check if email already exists
      const existingEmail = await storage.getPatientByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Check if phone already exists
      const existingPhone = await storage.getPatientByPhone(phone);
      if (existingPhone) {
        return res.status(400).json({ message: "Phone number already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const patientId = await storage.generatePatientId();
      
      const patient = await storage.createPatient({
        patientId,
        name,
        phone,
        email,
        gender: gender || null,
        dob: dob ? new Date(dob) : null,
        address: null,
        password: hashedPassword,
        emailVerified: false,
        notes: null,
      });

      // Generate and send email verification OTP
      const otp = generateOTP();
      await storage.createOtp({
        contact: email,
        otp,
        purpose: "email_verification",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });

      await sendOtpEmail(email, otp, "email_verification");
      
      // Don't return password in response
      const { password: _, ...patientData } = patient as any;
      res.json({ 
        message: "Registration successful. Please verify your email.", 
        patient: patientData,
        requiresVerification: true 
      });
    } catch (error) {
      console.error("Error in email registration:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Resend email verification OTP
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const patient = await storage.getPatientByEmail(email);
      if (!patient) {
        return res.status(404).json({ message: "Email not found" });
      }

      if (patient.emailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      const otp = generateOTP();
      await storage.createOtp({
        contact: email,
        otp,
        purpose: "email_verification",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });

      await sendOtpEmail(email, otp, "email_verification");

      res.json({ message: "Verification OTP sent successfully" });
    } catch (error) {
      console.error("Error resending verification:", error);
      res.status(500).json({ message: "Failed to resend verification" });
    }
  });

  // Verify email with OTP
  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required" });
      }

      // Get OTP record to check attempts
      const otpRecord = await storage.getOtpByContact(email, "email_verification");
      
      if (!otpRecord) {
        return res.status(400).json({ message: "No verification request found. Please request a new OTP." });
      }

      // Check max attempts (3)
      if (otpRecord.attempts >= 3) {
        await storage.deleteOtp(otpRecord.id);
        return res.status(400).json({ message: "Maximum attempts exceeded. Please request a new OTP." });
      }

      // Increment attempts
      await storage.incrementOtpAttempts(otpRecord.id);

      // Verify OTP
      if (otpRecord.otp !== otp) {
        const remainingAttempts = 2 - otpRecord.attempts;
        return res.status(400).json({ 
          message: `Invalid OTP. ${remainingAttempts > 0 ? `${remainingAttempts} attempts remaining.` : 'Please request a new OTP.'}` 
        });
      }

      // Delete OTP
      await storage.deleteOtp(otpRecord.id);

      // Get patient and update emailVerified
      const patient = await storage.getPatientByEmail(email);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      await storage.updatePatientEmailVerified(patient.id, true);

      // Generate token and return patient data
      const token = jwt.sign({ id: patient.id, type: 'patient' }, JWT_SECRET, { expiresIn: '7d' });
      
      const { password: _, ...patientData } = patient as any;
      res.json({ 
        message: "Email verified successfully",
        patient: { ...patientData, emailVerified: true }, 
        token 
      });
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // Login with email and password
  app.post("/api/auth/login-email", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const patient = await storage.getPatientByEmail(email);
      
      if (!patient) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!patient.password) {
        return res.status(401).json({ message: "Password not set. Please use forgot password to set one." });
      }

      const valid = await bcrypt.compare(password, patient.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if email is verified
      if (!patient.emailVerified) {
        return res.status(403).json({ 
          message: "Please verify your email before logging in.",
          requiresVerification: true,
          email: patient.email
        });
      }

      const token = jwt.sign({ id: patient.id, type: 'patient' }, JWT_SECRET, { expiresIn: '7d' });
      
      // Don't return password in response
      const { password: _, ...patientData } = patient as any;
      res.json({ patient: patientData, token });
    } catch (error) {
      console.error("Error in email login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Request password reset OTP
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const patient = await storage.getPatientByEmail(email);
      
      if (!patient) {
        // Don't reveal if email exists or not for security
        return res.json({ message: "If this email is registered, you will receive a password reset OTP" });
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes for reset

      await storage.createOtp({
        contact: email,
        otp,
        purpose: "password_reset",
        expiresAt,
      });

      // Send OTP via Email
      await sendOtpEmail(email, otp, "password_reset");

      res.json({ message: "If this email is registered, you will receive a password reset OTP" });
    } catch (error) {
      console.error("Error requesting password reset:", error);
      res.status(500).json({ message: "Failed to send reset OTP" });
    }
  });

  // Reset password with OTP
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: "Email, OTP, and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const otpRecord = await storage.verifyOtp(email, otp, "password_reset");
      
      if (!otpRecord) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      await storage.deleteOtp(otpRecord.id);

      const patient = await storage.getPatientByEmail(email);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Hash and update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updatePatientPassword(patient.id, hashedPassword);

      res.json({ message: "Password reset successful. You can now login with your new password." });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Password reset failed" });
    }
  });

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const admin = await storage.getAdminByUsername(username);
      
      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ id: admin.id, type: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
      const { password: _, ...adminData } = admin;
      res.json({ admin: adminData, token });
    } catch (error) {
      console.error("Error in admin login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // ==================== PUBLIC ROUTES ====================

  // Get all tests
  app.get("/api/tests", async (req, res) => {
    try {
      const tests = await storage.getAllTests();
      res.json(tests);
    } catch (error) {
      console.error("Error fetching tests:", error);
      res.status(500).json({ message: "Failed to fetch tests" });
    }
  });

  // ==================== RAZORPAY PAYMENT ROUTES ====================

  // Get Razorpay key for frontend
  app.get("/api/payment/razorpay-key", (req, res) => {
    if (!razorpayKeyId) {
      return res.status(503).json({ message: "Payment gateway not configured" });
    }
    res.json({ keyId: razorpayKeyId });
  });

  // Create Razorpay order
  app.post("/api/payment/create-order", async (req, res) => {
    try {
      if (!razorpayInstance) {
        return res.status(503).json({ message: "Payment gateway not configured" });
      }

      const { amount, testIds, phone, email, name } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }

      if (!testIds || !Array.isArray(testIds) || testIds.length === 0) {
        return res.status(400).json({ message: "Test IDs are required" });
      }

      // Create Razorpay order
      const order = await razorpayInstance.orders.create({
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency: "INR",
        receipt: `order_${Date.now()}`,
        notes: {
          testIds: testIds.join(","),
          phone: phone || "",
          email: email || "",
          name: name || "",
        },
      });

      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: razorpayKeyId,
      });
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ message: "Failed to create payment order" });
    }
  });

  // Verify Razorpay payment
  app.post("/api/payment/verify", async (req, res) => {
    try {
      if (!razorpayKeySecret) {
        return res.status(503).json({ message: "Payment gateway not configured" });
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: "Missing payment verification details" });
      }

      // Verify signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = createHmac("sha256", razorpayKeySecret)
        .update(body)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: "Invalid payment signature" });
      }

      res.json({
        success: true,
        message: "Payment verified successfully",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: "Payment verification failed" });
    }
  });

  // Create booking (public - allows guest bookings)
  app.post("/api/bookings", async (req, res) => {
    try {
      const { patientId, guestName, phone, email, testIds, type, slot, paymentMethod, transactionId, amountPaid, razorpayOrderId, razorpayPaymentId } = req.body;

      if (!phone || !testIds || !type || !slot) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (!paymentMethod) {
        return res.status(400).json({ message: "Payment method is required" });
      }

      // Determine payment status based on method
      const isCashPayment = paymentMethod === 'cash_on_delivery' || paymentMethod === 'pay_at_lab';
      // If razorpay payment is verified, mark as verified
      const isRazorpayVerified = razorpayPaymentId && razorpayOrderId;
      const paymentStatus = isCashPayment ? paymentMethod : (isRazorpayVerified ? 'verified' : 'paid_unverified');

      const booking = await storage.createBooking({
        patientId: patientId || null,
        guestName: guestName || null,
        phone,
        email: email || null,
        testIds,
        type,
        slot: new Date(slot),
        status: "pending",
        paymentMethod,
        paymentStatus,
        transactionId: transactionId || null,
        razorpayOrderId: razorpayOrderId || null,
        razorpayPaymentId: razorpayPaymentId || null,
        amountPaid: amountPaid || null,
        paymentDate: new Date(),
      });

      res.json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Download report (public with token)
  app.get("/api/reports/download/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const report = await storage.getReportByToken(token);

      if (!report) {
        return res.status(404).json({ message: "Report not found or link expired" });
      }

      // Check payment status before allowing download
      // For reports with a booking, verify payment status
      if (report.bookingId) {
        const booking = await storage.getBooking(report.bookingId);
        if (!booking) {
          return res.status(403).json({ 
            message: "Unable to verify payment status. Please contact support." 
          });
        }
        const allowedPaymentStatuses = ['verified', 'cash_on_delivery', 'pay_at_lab'];
        if (!allowedPaymentStatuses.includes(booking.paymentStatus)) {
          return res.status(403).json({ 
            message: "Payment is not verified. Please complete your payment to access the report." 
          });
        }
      }
      // Reports without bookingId are legacy reports created before payment tracking
      // These are allowed to be downloaded (admin-created reports)

      // In production, serve the actual PDF file
      // For now, generate a simple HTML response
      const patient = await storage.getPatient(report.patientId);
      const result = await storage.getResult(report.resultId);
      const test = result ? await storage.getTest(result.testId) : null;

      res.setHeader('Content-Type', 'text/html');
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Report - ${patient?.patientId}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #005B96; }
            .header { text-align: center; border-bottom: 2px solid #87CEEB; padding-bottom: 20px; }
            .patient-info { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #87CEEB; color: white; }
            .abnormal { color: red; font-weight: bold; }
            .normal { color: green; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Archana Pathology Lab</h1>
            <p>NABL Accredited | ISO 9001 Certified</p>
          </div>
          <div class="patient-info">
            <strong>Patient ID:</strong> ${patient?.patientId}<br>
            <strong>Name:</strong> ${patient?.name}<br>
            <strong>Phone:</strong> ${patient?.phone}<br>
            <strong>Date:</strong> ${new Date(report.generatedAt).toLocaleDateString()}
          </div>
          <h2>${test?.name || 'Test Report'}</h2>
          <table>
            <tr>
              <th>Parameter</th>
              <th>Value</th>
              <th>Unit</th>
              <th>Normal Range</th>
              <th>Status</th>
            </tr>
            ${(result?.parameterResults as any[] || []).map((p: any) => `
              <tr>
                <td>${p.parameterName}</td>
                <td>${p.value}</td>
                <td>${p.unit}</td>
                <td>${p.normalRange}</td>
                <td class="${p.isAbnormal ? 'abnormal' : 'normal'}">${p.isAbnormal ? 'Abnormal' : 'Normal'}</td>
              </tr>
            `).join('')}
          </table>
          <div class="footer">
            <p>This is a computer generated report.</p>
            <p>Archana Pathology Lab | Contact: +91 98765 43210 | info@archanapathology.com</p>
          </div>
        </body>
        </html>
      `);
    } catch (error) {
      console.error("Error downloading report:", error);
      res.status(500).json({ message: "Failed to download report" });
    }
  });

  // ==================== PATIENT ROUTES ====================

  // Get patient bookings
  app.get("/api/patient/bookings", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const bookings = await storage.getBookingsByPatient(user.id);
      
      // Fetch test details for each booking
      const bookingsWithTests = await Promise.all(
        bookings.map(async (booking) => {
          const tests = await Promise.all(
            (booking.testIds as string[]).map(id => storage.getTest(id))
          );
          return { ...booking, tests: tests.filter(Boolean) };
        })
      );

      res.json(bookingsWithTests);
    } catch (error) {
      console.error("Error fetching patient bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Get patient reports (with payment status check)
  app.get("/api/patient/reports", authenticateToken, async (req, res) => {
    try {
      const user = (req as any).user;
      const reports = await storage.getReportsByPatient(user.id);
      const bookings = await storage.getBookingsByPatient(user.id);
      
      const reportsWithDetails = await Promise.all(
        reports.map(async (report) => {
          const result = await storage.getResult(report.resultId);
          const test = result ? await storage.getTest(result.testId) : null;
          
          // Find associated booking to check payment status
          // First try to match by bookingId if available
          let associatedBooking = report.bookingId 
            ? bookings.find(b => b.id === report.bookingId)
            : null;
          
          // Fallback: match by testId if no direct bookingId link
          if (!associatedBooking && result?.testId) {
            associatedBooking = bookings.find(b => 
              (b.testIds as string[]).some(testId => testId === result.testId)
            );
          }
          
          const paymentVerified = associatedBooking?.paymentStatus === 'verified' || 
                                  associatedBooking?.paymentStatus === 'cash_on_delivery' ||
                                  associatedBooking?.paymentStatus === 'pay_at_lab';
          
          return { 
            ...report, 
            test,
            paymentVerified,
            paymentStatus: associatedBooking?.paymentStatus || 'pending',
            // Only include download token if payment is verified
            secureDownloadToken: paymentVerified ? report.secureDownloadToken : null
          };
        })
      );

      res.json(reportsWithDetails);
    } catch (error) {
      console.error("Error fetching patient reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Update booking payment
  app.patch("/api/patient/bookings/:id/payment", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const { paymentMethod, transactionId, amountPaid } = req.body;

      if (!paymentMethod || !amountPaid) {
        return res.status(400).json({ message: "Payment method and amount are required" });
      }

      // Verify the booking belongs to this patient
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (booking.patientId !== user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Determine payment status based on method
      const isCashPayment = paymentMethod === 'cash_on_delivery' || paymentMethod === 'pay_at_lab';
      const paymentStatus = isCashPayment ? paymentMethod : 'paid_unverified';

      const updated = await storage.updateBookingPayment(id, {
        paymentMethod,
        paymentStatus,
        transactionId: transactionId || undefined,
        amountPaid,
        paymentDate: new Date(),
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating payment:", error);
      res.status(500).json({ message: "Failed to update payment" });
    }
  });

  // ==================== ADMIN ROUTES ====================

  // Dashboard stats
  app.get("/api/admin/dashboard", authenticateToken, adminOnly, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Get all patients
  app.get("/api/admin/patients", authenticateToken, adminOnly, async (req, res) => {
    try {
      const { q } = req.query;
      const patients = q 
        ? await storage.searchPatients(q as string)
        : await storage.getAllPatients();
      res.json(patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  // Create patient
  app.post("/api/admin/patients", authenticateToken, adminOnly, async (req, res) => {
    try {
      const { name, phone, email, gender, address } = req.body;

      if (!name || !phone) {
        return res.status(400).json({ message: "Name and phone are required" });
      }

      const patientId = await storage.generatePatientId();
      
      const patient = await storage.createPatient({
        patientId,
        name,
        phone,
        email: email || null,
        gender: gender || null,
        dob: null,
        address: address || null,
        password: null,
        notes: null,
      });

      res.json(patient);
    } catch (error) {
      console.error("Error creating patient:", error);
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  // Get all bookings
  app.get("/api/admin/bookings", authenticateToken, adminOnly, async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      
      const bookingsWithDetails = await Promise.all(
        bookings.map(async (booking) => {
          const patient = booking.patientId ? await storage.getPatient(booking.patientId) : null;
          const tests = await Promise.all(
            (booking.testIds as string[]).map(id => storage.getTest(id))
          );
          return { ...booking, patient, tests: tests.filter(Boolean) };
        })
      );

      res.json(bookingsWithDetails);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Update booking status
  app.patch("/api/admin/bookings/:id/status", authenticateToken, adminOnly, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const booking = await storage.updateBookingStatus(id, status);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(booking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  // Verify booking payment
  app.patch("/api/admin/bookings/:id/verify-payment", authenticateToken, adminOnly, async (req, res) => {
    try {
      const { id } = req.params;
      const admin = (req as any).user;

      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      if (booking.paymentStatus !== 'paid_unverified') {
        return res.status(400).json({ message: "Payment is not pending verification" });
      }

      const updated = await storage.verifyBookingPayment(id, admin.id);
      if (!updated) {
        return res.status(500).json({ message: "Failed to verify payment" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  // Get all reports
  app.get("/api/admin/reports", authenticateToken, adminOnly, async (req, res) => {
    try {
      const reports = await storage.getAllReports();
      
      const reportsWithDetails = await Promise.all(
        reports.map(async (report) => {
          const patient = await storage.getPatient(report.patientId);
          const result = await storage.getResult(report.resultId);
          const test = result ? await storage.getTest(result.testId) : null;
          return { ...report, patient, test };
        })
      );

      res.json(reportsWithDetails);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Generate report
  app.post("/api/admin/reports/generate", authenticateToken, adminOnly, async (req, res) => {
    try {
      const { patientId, testId, technician, referredBy, collectedAt, parameterResults, remarks } = req.body;

      if (!patientId || !testId || !technician || !parameterResults) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Create result
      const result = await storage.createResult({
        patientId,
        testId,
        technician,
        referredBy: referredBy || null,
        collectedAt: new Date(collectedAt),
        parameterResults,
      });

      // Generate secure token
      const secureDownloadToken = generateSecureToken();

      // Create report
      const report = await storage.createReport({
        patientId,
        resultId: result.id,
        pdfPath: null,
        secureDownloadToken,
      });

      // In production: Generate PDF, send email/SMS notifications

      res.json({ report, result, downloadUrl: `/api/reports/download/${secureDownloadToken}` });
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // Create test
  app.post("/api/admin/tests", authenticateToken, adminOnly, async (req, res) => {
    try {
      const { name, code, category, price, duration, description, parameters } = req.body;

      if (!name || !code || !category || !price || !duration || !parameters) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const existing = await storage.getTestByCode(code);
      if (existing) {
        return res.status(400).json({ message: "Test code already exists" });
      }

      const test = await storage.createTest({
        name,
        code,
        category,
        price: price.toString(),
        duration,
        description: description || null,
        parameters,
      });

      res.json(test);
    } catch (error) {
      console.error("Error creating test:", error);
      res.status(500).json({ message: "Failed to create test" });
    }
  });

  // ==================== REVIEWS ROUTES ====================

  // Get approved reviews (public)
  app.get("/api/reviews", async (req, res) => {
    try {
      const reviews = await storage.getApprovedReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Submit a review (public)
  app.post("/api/reviews", async (req, res) => {
    try {
      const { name, location, rating, review } = req.body;

      if (!name || !location || !rating || !review) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      const newReview = await storage.createReview({
        name,
        location,
        rating,
        review,
        isApproved: false,
      });

      res.json({ message: "Review submitted successfully. It will appear after approval.", review: newReview });
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to submit review" });
    }
  });

  // Get all reviews (admin)
  app.get("/api/admin/reviews", authenticateToken, adminOnly, async (req, res) => {
    try {
      const reviews = await storage.getAllReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Approve/reject review (admin)
  app.patch("/api/admin/reviews/:id/approve", authenticateToken, adminOnly, async (req, res) => {
    try {
      const { id } = req.params;
      const { isApproved } = req.body;

      const review = await storage.updateReviewApproval(id, isApproved);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      res.json(review);
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(500).json({ message: "Failed to update review" });
    }
  });

  // Delete review (admin)
  app.delete("/api/admin/reviews/:id", authenticateToken, adminOnly, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteReview(id);
      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ message: "Failed to delete review" });
    }
  });

  // ==================== ADVERTISEMENTS ROUTES ====================

  // Get active advertisements (public)
  app.get("/api/advertisements", async (req, res) => {
    try {
      const ads = await storage.getActiveAdvertisements();
      res.json(ads);
    } catch (error) {
      console.error("Error fetching advertisements:", error);
      res.status(500).json({ message: "Failed to fetch advertisements" });
    }
  });

  // Get all advertisements (admin)
  app.get("/api/admin/advertisements", authenticateToken, adminOnly, async (req, res) => {
    try {
      const ads = await storage.getAllAdvertisements();
      res.json(ads);
    } catch (error) {
      console.error("Error fetching advertisements:", error);
      res.status(500).json({ message: "Failed to fetch advertisements" });
    }
  });

  // Upload banner image (admin)
  app.post("/api/admin/upload-banner", authenticateToken, adminOnly, uploadBanner.single("banner"), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const imageUrl = `/uploads/banners/${req.file.filename}`;
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error uploading banner:", error);
      res.status(500).json({ message: "Failed to upload banner" });
    }
  });

  // Create advertisement (admin)
  app.post("/api/admin/advertisements", authenticateToken, adminOnly, async (req, res) => {
    try {
      const { title, subtitle, description, gradient, icon, imageUrl, ctaText, ctaLink, isActive, sortOrder } = req.body;

      if (!title || !subtitle || !description || !gradient || !icon || !ctaText || !ctaLink) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const ad = await storage.createAdvertisement({
        title,
        subtitle,
        description,
        gradient,
        icon,
        imageUrl: imageUrl || null,
        ctaText,
        ctaLink,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
      });

      res.json(ad);
    } catch (error) {
      console.error("Error creating advertisement:", error);
      res.status(500).json({ message: "Failed to create advertisement" });
    }
  });

  // Update advertisement (admin)
  app.patch("/api/admin/advertisements/:id", authenticateToken, adminOnly, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const ad = await storage.updateAdvertisement(id, updates);
      if (!ad) {
        return res.status(404).json({ message: "Advertisement not found" });
      }

      res.json(ad);
    } catch (error) {
      console.error("Error updating advertisement:", error);
      res.status(500).json({ message: "Failed to update advertisement" });
    }
  });

  // Delete advertisement (admin)
  app.delete("/api/admin/advertisements/:id", authenticateToken, adminOnly, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAdvertisement(id);
      res.json({ message: "Advertisement deleted successfully" });
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      res.status(500).json({ message: "Failed to delete advertisement" });
    }
  });

  return httpServer;
}
