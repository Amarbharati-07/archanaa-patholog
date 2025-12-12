import { db } from "./db";
import { tests, admins } from "@shared/schema";
import bcrypt from "bcrypt";

const seedTests = [
  {
    name: "Complete Blood Count (CBC)",
    code: "CBC",
    category: "Hematology",
    price: "450",
    duration: "24 hours",
    description: "Comprehensive blood test that evaluates overall health and detects a wide range of disorders.",
    parameters: [
      { name: "Hemoglobin", unit: "g/dL", normalRange: "12-16", paramCode: "HGB" },
      { name: "RBC Count", unit: "million/mcL", normalRange: "4.5-5.5", paramCode: "RBC" },
      { name: "WBC Count", unit: "cells/mcL", normalRange: "4500-11000", paramCode: "WBC" },
      { name: "Platelets", unit: "cells/mcL", normalRange: "150000-400000", paramCode: "PLT" },
      { name: "MCV", unit: "fL", normalRange: "80-100", paramCode: "MCV" },
      { name: "MCH", unit: "pg", normalRange: "27-33", paramCode: "MCH" },
      { name: "MCHC", unit: "g/dL", normalRange: "32-36", paramCode: "MCHC" },
    ],
  },
  {
    name: "Blood Sugar Fasting",
    code: "BSF",
    category: "Diabetes",
    price: "80",
    duration: "4 hours",
    description: "Measures blood glucose levels after an overnight fast.",
    parameters: [
      { name: "Fasting Blood Glucose", unit: "mg/dL", normalRange: "70-100", paramCode: "FBG" },
    ],
  },
  {
    name: "Blood Sugar PP (Postprandial)",
    code: "BSPP",
    category: "Diabetes",
    price: "80",
    duration: "4 hours",
    description: "Measures blood glucose levels 2 hours after eating.",
    parameters: [
      { name: "Postprandial Blood Glucose", unit: "mg/dL", normalRange: "<140", paramCode: "PPBG" },
    ],
  },
  {
    name: "Liver Function Test (LFT)",
    code: "LFT",
    category: "Biochemistry",
    price: "650",
    duration: "24 hours",
    description: "Comprehensive panel to assess liver health and function.",
    parameters: [
      { name: "Bilirubin Total", unit: "mg/dL", normalRange: "0.1-1.2", paramCode: "TBIL" },
      { name: "Bilirubin Direct", unit: "mg/dL", normalRange: "0-0.3", paramCode: "DBIL" },
      { name: "SGOT (AST)", unit: "U/L", normalRange: "10-40", paramCode: "AST" },
      { name: "SGPT (ALT)", unit: "U/L", normalRange: "7-56", paramCode: "ALT" },
      { name: "Alkaline Phosphatase", unit: "U/L", normalRange: "44-147", paramCode: "ALP" },
      { name: "Total Protein", unit: "g/dL", normalRange: "6-8.3", paramCode: "TP" },
      { name: "Albumin", unit: "g/dL", normalRange: "3.5-5", paramCode: "ALB" },
    ],
  },
  {
    name: "Kidney Function Test (KFT)",
    code: "KFT",
    category: "Biochemistry",
    price: "550",
    duration: "24 hours",
    description: "Evaluates kidney health and function.",
    parameters: [
      { name: "Blood Urea", unit: "mg/dL", normalRange: "7-20", paramCode: "BUN" },
      { name: "Creatinine", unit: "mg/dL", normalRange: "0.6-1.2", paramCode: "CREAT" },
      { name: "Uric Acid", unit: "mg/dL", normalRange: "3.5-7.2", paramCode: "UA" },
      { name: "Sodium", unit: "mEq/L", normalRange: "136-145", paramCode: "NA" },
      { name: "Potassium", unit: "mEq/L", normalRange: "3.5-5.0", paramCode: "K" },
    ],
  },
  {
    name: "Lipid Profile",
    code: "LIPID",
    category: "Biochemistry",
    price: "500",
    duration: "24 hours",
    description: "Measures cholesterol and triglyceride levels to assess cardiovascular health.",
    parameters: [
      { name: "Total Cholesterol", unit: "mg/dL", normalRange: "<200", paramCode: "TC" },
      { name: "HDL Cholesterol", unit: "mg/dL", normalRange: ">40", paramCode: "HDL" },
      { name: "LDL Cholesterol", unit: "mg/dL", normalRange: "<100", paramCode: "LDL" },
      { name: "Triglycerides", unit: "mg/dL", normalRange: "<150", paramCode: "TG" },
      { name: "VLDL", unit: "mg/dL", normalRange: "<30", paramCode: "VLDL" },
    ],
  },
  {
    name: "Thyroid Profile (T3, T4, TSH)",
    code: "THYROID",
    category: "Thyroid",
    price: "700",
    duration: "24 hours",
    description: "Comprehensive assessment of thyroid function.",
    parameters: [
      { name: "TSH", unit: "mIU/L", normalRange: "0.4-4.0", paramCode: "TSH" },
      { name: "T3", unit: "ng/dL", normalRange: "80-200", paramCode: "T3" },
      { name: "T4", unit: "mcg/dL", normalRange: "5-12", paramCode: "T4" },
    ],
  },
  {
    name: "Vitamin D",
    code: "VITD",
    category: "Biochemistry",
    price: "1200",
    duration: "48 hours",
    description: "Measures 25-hydroxyvitamin D levels in blood.",
    parameters: [
      { name: "Vitamin D (25-OH)", unit: "ng/mL", normalRange: "30-100", paramCode: "VITD" },
    ],
  },
  {
    name: "Urine Routine Examination",
    code: "URINE",
    category: "Urine",
    price: "150",
    duration: "4 hours",
    description: "Physical, chemical, and microscopic examination of urine.",
    parameters: [
      { name: "pH", unit: "", normalRange: "4.5-8", paramCode: "PH" },
      { name: "Protein", unit: "", normalRange: "Nil", paramCode: "PROT" },
      { name: "Sugar", unit: "", normalRange: "Nil", paramCode: "SUG" },
      { name: "RBC", unit: "/hpf", normalRange: "0-2", paramCode: "URBC" },
      { name: "WBC", unit: "/hpf", normalRange: "0-5", paramCode: "UWBC" },
    ],
  },
  {
    name: "HbA1c (Glycated Hemoglobin)",
    code: "HBA1C",
    category: "Diabetes",
    price: "550",
    duration: "24 hours",
    description: "Measures average blood sugar control over the past 2-3 months.",
    parameters: [
      { name: "HbA1c", unit: "%", normalRange: "<5.7", paramCode: "A1C" },
    ],
  },
];

export async function seedDatabase() {
  try {
    console.log("Seeding database...");

    // Check if tests exist
    const existingTests = await db.select().from(tests).limit(1);
    if (existingTests.length === 0) {
      console.log("Seeding tests...");
      await db.insert(tests).values(seedTests);
      console.log(`Inserted ${seedTests.length} tests`);
    } else {
      console.log("Tests already exist, skipping seed");
    }

    // Create default admin
    const existingAdmin = await db.select().from(admins).limit(1);
    if (existingAdmin.length === 0) {
      console.log("Creating default admin...");
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await db.insert(admins).values({
        username: "admin",
        password: hashedPassword,
        name: "Admin User",
        role: "admin",
      });
      console.log("Created admin user (username: admin, password: admin123)");
    } else {
      console.log("Admin already exists, skipping");
    }

    console.log("Database seeding complete!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
