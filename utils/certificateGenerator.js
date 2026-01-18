const fs = require("fs");
const path = require("path");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

async function generateCertificate({ userName, courseTitle, date, certificateId, templateFile, outputFile }) {
  try {
    const templatePath = path.join(
      __dirname,
      "..",
      "public",
      "uploads",
      "certificates",
      templateFile
    );

    const outputPath = path.join(
      __dirname,
      "..",
      "public",
      "uploads",
      "certificates",
      "generated",
      outputFile
    );

    // Load the blank certificate template
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const page = pdfDoc.getPages()[0];
    const { width } = page.getSize();

    // Fonts
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Global left shift
    const xOffset = -125;
    const yOffset = -40;

    // ======================
    // 🎓 AUTO-SCALING NAME
    // ======================
    let nameFontSize = 30; // default
    let nameTextWidth = fontBold.widthOfTextAtSize(userName, nameFontSize);

    // Shrink until it fits (max width 70% of the page)
    const maxWidth = width * 0.7;
    while (nameTextWidth > maxWidth && nameFontSize > 16) {
      nameFontSize -= 1;
      nameTextWidth = fontBold.widthOfTextAtSize(userName, nameFontSize);
    }

    const nameX = (width - nameTextWidth) / 2 + xOffset;
    page.drawText(userName, {
      x: nameX,
      y: 420,
      size: nameFontSize,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Course title line
    const sentence1 = `has successfully completed the ${courseTitle} under the CHABALINGO:`;
    const sentence1FontSize = 12;
    const sentence1Width = fontRegular.widthOfTextAtSize(sentence1, sentence1FontSize);
    const sentence1X = (width - sentence1Width) / 2 + xOffset;
    page.drawText(sentence1, {
      x: sentence1X,
      y: 370,
      size: sentence1FontSize,
      font: fontRegular,
      color: rgb(0, 0, 0),
    });

    // Paragraph lines
    const para = [
      "A KABITEÑO CHAVACANO WEB-BASED LANGUAGE LEARNING PLATFORM,",
      `given this ${date} in recognition of the recipient’s dedication and`,
      "effort in language learning and cultural connection.",
      "This certificate is also approved and recognized by the Tourism Department of Cavite City.",
    ];

    let y = 345;
    para.forEach((line) => {
      const fontSize = 12;
      const lineWidth = fontRegular.widthOfTextAtSize(line, fontSize);
      const x = (width - lineWidth) / 2 + xOffset;
      page.drawText(line, {
        x,
        y,
        size: fontSize,
        font: fontRegular,
        color: rgb(0, 0, 0),
      });
      y -= 20;
    });

    // Certificate ID
    page.drawText(`Certificate ID: ${certificateId}`, {
      x: 100,
      y: 210,
      size: 11,
      font: fontRegular,
      color: rgb(0, 0, 0),
    });

    // Save
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);

    console.log("✅ Certificate generated:", outputPath);
    return outputFile;
  } catch (err) {
    console.error("Certificate generation error:", err);
    throw err;
  }
}

module.exports = generateCertificate;
