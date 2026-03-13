import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    smtpHost: process.env.SMTP_HOST || null,
    smtpPort: process.env.SMTP_PORT || null,
    smtpUser: process.env.SMTP_USER || null,
    fromEmail: process.env.FROM_EMAIL || null,
  });
});

app.post("/api/send-card-request", async (req, res) => {
  try {
    const {
      location,
      authFirstName,
      authLastName,
      authDate,
      authTitle,
      typeOfCard,
      requestingUserGroup,
      employeeNumber,
      firstName,
      lastName,
      handheldSignOnName,
      addRemove,
      recipientEmail,
    } = req.body;

    if (
      !authFirstName ||
      !authLastName ||
      !authDate ||
      !authTitle ||
      !employeeNumber ||
      !firstName ||
      !lastName ||
      !handheldSignOnName ||
      !recipientEmail
    ) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_PORT ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS ||
      !process.env.FROM_EMAIL
    ) {
      return res.status(500).json({
        message: "SMTP configuration missing in backend/.env",
      });
    }

    const rows = [
      { Group: "Location Group", Field: "Location", Value: location },
      { Group: "Under Authorization", Field: "First Name", Value: authFirstName },
      { Group: "Under Authorization", Field: "Last Name", Value: authLastName },
      { Group: "Under Authorization", Field: "Date", Value: authDate },
      { Group: "Under Authorization", Field: "Title", Value: authTitle },
      { Group: "Type of Card", Field: "Type of Card Requested", Value: typeOfCard },
      {
        Group: "Requesting User Group",
        Field: "Requesting User Group",
        Value: requestingUserGroup,
      },
      { Group: "Card Being Issued To", Field: "Employee Number", Value: employeeNumber },
      { Group: "Card Being Issued To", Field: "First Name", Value: firstName },
      { Group: "Card Being Issued To", Field: "Last Name", Value: lastName },
      {
        Group: "Card Being Issued To",
        Field: "Handheld Sign On Name",
        Value: handheldSignOnName,
      },
      { Group: "Card Being Issued To", Field: "Add / Remove", Value: addRemove },
    ];

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Card Request");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.verify();

    const filename = `voila-card-request-${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: recipientEmail,
      subject: "Voila Card Request Form",
      text: "Attached is the Excel file for the Voila card request form.",
      attachments: [
        {
          filename,
          content: excelBuffer,
          contentType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      ],
    });

    console.log("Email sent:", info.messageId);

    res.json({ message: "Email sent with Excel attachment." });
  } catch (error) {
    console.error("Send error:", error);
    res.status(500).json({
      message: error?.message || "Failed to send email.",
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
