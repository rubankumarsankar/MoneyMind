import { NextResponse } from "next/server";
import { sendEnquiryEmail } from "@/lib/email";

export async function POST(req) {
  try {
    const { name, email, phone, message } = await req.json();

    // Validation
    if (!name || !email || !message) {
      return NextResponse.json(
        { message: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email address" },
        { status: 400 }
      );
    }

    // Send emails
    const success = await sendEnquiryEmail(name, email, phone, message);

    if (success) {
      return NextResponse.json({ 
        message: "Enquiry sent successfully! We'll get back to you soon." 
      });
    } else {
      return NextResponse.json(
        { message: "Failed to send enquiry. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Enquiry API Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
