
import { z } from "zod";

// THE POLITE QUESTION: Strict Input Sanitization
// Uses Zod schema validation + Regex Content Guards

const SQL_INJECTION_REGEX = /('|"|;|--|\/\*|\*\/|xp_)/i;
const XSS_REGEX = /(<|>|javascript:|vbscript:|data:)/i;

export const SafeString = z.string()
    .min(1)
    .max(255)
    .refine((val) => !SQL_INJECTION_REGEX.test(val), "Input contains potential SQL Injection patterns")
    .refine((val) => !XSS_REGEX.test(val), "Input contains potential XSS patterns");

// Schema for Patient Data Payload
export const PatientDataSchema = z.object({
    name: SafeString,
    age: z.coerce.number().min(0).max(150),
    weight: z.coerce.number().min(0).max(500),
    bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
    conditions: z.array(SafeString).max(10), // Treating as "Critical Chronic Conditions"
    medications: z.array(SafeString).max(10), // Treating as "High Risk Medications"
    allergies: z.array(SafeString).max(10)
});

// Schema for Visibility Toggle
export const PulseSchema = z.object({
    id: SafeString,
    isVisible: z.boolean(),
    // Allow payload to pass through but validated inside
    medicalData: PatientDataSchema.optional(),
});
