const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const QRCode = require('qrcode');
const prisma = require('../lib/prisma');
const { logger } = require('../utils/logger');

class PDFReportService {
  constructor() {
    this.pageWidth = 612; // Letter size
    this.pageHeight = 792;
    this.margin = 50;
  }

  /**
   * Generate a PDF report
   * @param {Object} report - Report data from database
   * @param {Object} options - Generation options
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generatePDF(report, options = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        // Load custom template if specified
        let template = null;
        if (options.templateId) {
          template = await this.getTemplate(options.templateId);
        }
        // Create PDF document
        const doc = new PDFDocument({
          size: 'letter',
          margins: {
            top: this.margin,
            bottom: this.margin,
            left: this.margin,
            right: this.margin
          },
          info: {
            Title: report.title,
            Author: 'FSW Iron Task',
            Subject: `${report.reportType} Report`,
            Keywords: 'construction,documentation,steel',
            CreationDate: new Date()
          }
        });

        // Collect PDF chunks
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Get project and company details
        const project = await prisma.project.findUnique({
          where: { id: report.projectId },
          include: {
            company: true,
            projectMembers: {
              include: { user: true }
            }
          }
        });

        // Get report user
        const user = await prisma.user.findUnique({
          where: { id: report.userId }
        });

        // Use template-based generation if template is provided
        if (template) {
          await this.generateFromTemplate(doc, template, report, project, user);
        } else {
          // Standard generation
          await this.addHeader(doc, project, report);
          this.addProjectInfo(doc, project, report);

          // Add content based on report type
          switch (report.reportType) {
            case 'PROGRESS_RECAP':
              await this.addProgressRecapContent(doc, report, project);
              break;
            case 'SUMMARY':
              await this.addSummaryContent(doc, report, project);
              break;
            case 'DAILY_LOG':
              await this.addDailyLogContent(doc, report, project);
              break;
          }
        }

        // Add footer on each page with QR codes
        await this.addFooter(doc, project, report);

        // Finalize PDF
        doc.end();
      } catch (error) {
        logger.error('Failed to generate PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate QR code as base64 data URL
   */
  async generateQRCode(text, options = {}) {
    try {
      const qrOptions = {
        type: 'png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: options.size || 100,
        ...options
      };
      
      return await QRCode.toDataURL(text, qrOptions);
    } catch (error) {
      logger.error('Failed to generate QR code:', error);
      return null;
    }
  }

  /**
   * Add header to PDF with QR code
   */
  async addHeader(doc, project, report) {
    // Company logo placeholder
    doc.rect(this.margin, this.margin, 80, 40).stroke();
    doc.fontSize(10).text('LOGO', this.margin + 30, this.margin + 15);

    // Company name and report title
    doc.fontSize(20)
       .text(project.company.name, 150, this.margin, { width: 300, align: 'center' });
    
    doc.fontSize(16)
       .text(report.title, 150, this.margin + 25, { width: 300, align: 'center' });

    // Generate QR code for digital access
    const reportUrl = `${process.env.FRONTEND_URL || 'https://fsw-iron-task.vercel.app'}/reports/${report.shareToken || report.id}`;
    const qrCodeDataUrl = await this.generateQRCode(reportUrl, { size: 80 });
    
    if (qrCodeDataUrl) {
      try {
        // Convert base64 to buffer
        const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
        
        // Add QR code to top right
        doc.image(qrBuffer, this.pageWidth - this.margin - 80, this.margin, {
          fit: [80, 80],
          align: 'center'
        });
        
        // Add QR code label
        doc.fontSize(8)
           .text('Scan for Digital Report', this.pageWidth - this.margin - 80, this.margin + 85, {
             width: 80,
             align: 'center'
           });
      } catch (qrError) {
        logger.error('Failed to add QR code to PDF:', qrError);
        // Continue without QR code
      }
    }

    // Line separator
    doc.moveTo(this.margin, this.margin + 100)
       .lineTo(this.pageWidth - this.margin, this.margin + 100)
       .stroke();

    doc.y = this.margin + 110;
  }

  /**
   * Add project information section
   */
  addProjectInfo(doc, project, report) {
    const y = doc.y;
    
    doc.fontSize(14).font('Helvetica-Bold').text('Project Information', this.margin, y);
    doc.moveDown(0.5);

    const infoY = doc.y;
    doc.fontSize(10).font('Helvetica');

    // Left column
    doc.text(`Project: ${project.name}`, this.margin, infoY);
    doc.text(`Job Number: ${project.jobNumber}`, this.margin, infoY + 15);
    doc.text(`Location: ${project.location}`, this.margin, infoY + 30);
    
    // Right column
    doc.text(`Status: ${project.status}`, 300, infoY);
    doc.text(`Report Date: ${format(new Date(report.createdAt), 'MM/dd/yyyy')}`, 300, infoY + 15);
    doc.text(`Generated By: ${report.user?.name || 'System'}`, 300, infoY + 30);

    doc.y = infoY + 50;
    
    // Line separator
    doc.moveTo(this.margin, doc.y)
       .lineTo(this.pageWidth - this.margin, doc.y)
       .stroke();
    
    doc.moveDown(2);
  }

  /**
   * Add progress recap content
   */
  async addProgressRecapContent(doc, report, project) {
    doc.fontSize(14).font('Helvetica-Bold').text('Progress Overview', this.margin, doc.y);
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');

    // Get media stats
    const mediaStats = await this.getMediaStats(report.projectId, report.metadata?.dateRange);
    
    doc.text(`Total Photos: ${mediaStats.photos}`, this.margin);
    doc.text(`Total Videos: ${mediaStats.videos}`, this.margin);
    doc.text(`Team Members Active: ${mediaStats.activeUsers}`, this.margin);
    doc.moveDown();

    // Activities summary
    if (report.metadata?.activities) {
      doc.fontSize(12).font('Helvetica-Bold').text('Activities Summary', this.margin);
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');

      for (const activity of report.metadata.activities) {
        doc.text(`• ${activity.type}: ${activity.count} items`, this.margin + 10);
      }
      doc.moveDown();
    }

    // Key accomplishments
    if (report.content?.accomplishments) {
      doc.fontSize(12).font('Helvetica-Bold').text('Key Accomplishments', this.margin);
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');

      const accomplishments = report.content.accomplishments.split('\n');
      for (const item of accomplishments) {
        if (item.trim()) {
          doc.text(`• ${item.trim()}`, this.margin + 10);
        }
      }
      doc.moveDown();
    }

    // Safety notes
    if (report.content?.safetyNotes) {
      doc.fontSize(12).font('Helvetica-Bold').text('Safety Notes', this.margin);
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(report.content.safetyNotes, this.margin + 10);
      doc.moveDown();
    }

    // Media section
    await this.addMediaSection(doc, report);
  }

  /**
   * Add summary content
   */
  async addSummaryContent(doc, report, project) {
    doc.fontSize(14).font('Helvetica-Bold').text('Summary', this.margin, doc.y);
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');

    if (report.content?.summary) {
      doc.text(report.content.summary, this.margin, doc.y, {
        width: this.pageWidth - (2 * this.margin),
        align: 'justify'
      });
      doc.moveDown();
    }

    // Key points
    if (report.content?.keyPoints) {
      doc.fontSize(12).font('Helvetica-Bold').text('Key Points', this.margin);
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');

      const points = report.content.keyPoints.split('\n');
      for (const point of points) {
        if (point.trim()) {
          doc.text(`• ${point.trim()}`, this.margin + 10);
        }
      }
      doc.moveDown();
    }

    // Media section
    await this.addMediaSection(doc, report);
  }

  /**
   * Add daily log content
   */
  async addDailyLogContent(doc, report, project) {
    doc.fontSize(14).font('Helvetica-Bold').text('Daily Activities', this.margin, doc.y);
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');

    // Work performed
    if (report.content?.workPerformed) {
      doc.fontSize(12).font('Helvetica-Bold').text('Work Performed', this.margin);
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(report.content.workPerformed, this.margin + 10);
      doc.moveDown();
    }

    // Weather conditions
    if (report.metadata?.weather) {
      doc.fontSize(12).font('Helvetica-Bold').text('Weather Conditions', this.margin);
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Temperature: ${report.metadata.weather.temperature}°F`, this.margin + 10);
      doc.text(`Conditions: ${report.metadata.weather.conditions}`, this.margin + 10);
      doc.moveDown();
    }

    // Tomorrow's plan
    if (report.content?.tomorrowPlan) {
      doc.fontSize(12).font('Helvetica-Bold').text("Tomorrow's Plan", this.margin);
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      
      const tasks = report.content.tomorrowPlan.split('\n');
      for (const task of tasks) {
        if (task.trim()) {
          doc.text(`□ ${task.trim()}`, this.margin + 10);
        }
      }
      doc.moveDown();
    }

    // Media section
    await this.addMediaSection(doc, report);
  }

  /**
   * Add media section with thumbnails
   */
  async addMediaSection(doc, report) {
    if (!report.metadata?.mediaIds || report.metadata.mediaIds.length === 0) {
      return;
    }

    // Check if we need a new page
    if (doc.y > this.pageHeight - 200) {
      doc.addPage();
    }

    doc.fontSize(12).font('Helvetica-Bold').text('Documentation', this.margin);
    doc.moveDown(0.5);

    // Get media items
    const media = await prisma.media.findMany({
      where: {
        id: { in: report.metadata.mediaIds }
      },
      include: {
        user: true
      },
      orderBy: { timestamp: 'desc' }
    });

    // Add media grid (3 columns)
    const colWidth = (this.pageWidth - (2 * this.margin) - 20) / 3;
    let x = this.margin;
    let y = doc.y;
    let col = 0;

    for (const item of media) {
      // Check if we need a new page
      if (y > this.pageHeight - 150) {
        doc.addPage();
        y = this.margin + 80;
        x = this.margin;
        col = 0;
      }

      // Media placeholder box
      doc.rect(x, y, colWidth, colWidth).stroke();
      
      // Media type indicator
      doc.fontSize(8).font('Helvetica');
      const typeText = item.mediaType === 'VIDEO' ? 'VIDEO' : 'PHOTO';
      doc.text(typeText, x + 5, y + 5);

      // User and timestamp
      doc.fontSize(7);
      doc.text(item.user.name, x + 5, y + colWidth - 20, { width: colWidth - 10 });
      doc.text(format(new Date(item.timestamp), 'MM/dd HH:mm'), x + 5, y + colWidth - 10, { width: colWidth - 10 });

      // Notes if available
      if (item.notes) {
        doc.fontSize(6);
        doc.text(item.notes.substring(0, 50) + '...', x + 5, y + 20, { 
          width: colWidth - 10,
          height: 40
        });
      }

      // Move to next position
      col++;
      if (col >= 3) {
        col = 0;
        x = this.margin;
        y += colWidth + 20;
      } else {
        x += colWidth + 10;
      }
    }

    doc.y = y + colWidth + 20;
  }

  /**
   * Add footer to all pages with QR code on last page
   */
  async addFooter(doc, project, report) {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      // Footer line
      doc.moveTo(this.margin, this.pageHeight - 60)
         .lineTo(this.pageWidth - this.margin, this.pageHeight - 60)
         .stroke();
      
      // Footer text
      doc.fontSize(8).font('Helvetica');
      doc.text(
        `Generated by FSW Iron Task | ${project.company.name}`,
        this.margin,
        this.pageHeight - 50,
        { width: 200, align: 'left' }
      );
      
      // Page number
      doc.text(
        `Page ${i + 1} of ${pageCount}`,
        this.pageWidth - 150,
        this.pageHeight - 50,
        { width: 100, align: 'right' }
      );

      // Add small QR code to last page footer for easy access
      if (i === pageCount - 1) {
        const reportUrl = `${process.env.FRONTEND_URL || 'https://fsw-iron-task.vercel.app'}/reports/${report.shareToken || report.id}`;
        const qrCodeDataUrl = await this.generateQRCode(reportUrl, { size: 40 });
        
        if (qrCodeDataUrl) {
          try {
            const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
            
            // Small QR code in footer
            doc.image(qrBuffer, this.pageWidth - this.margin - 40, this.pageHeight - 40, {
              fit: [30, 30]
            });
            
            doc.fontSize(6)
               .text('Digital Access', this.pageWidth - this.margin - 40, this.pageHeight - 8, {
                 width: 30,
                 align: 'center'
               });
          } catch (error) {
            // Silently continue without footer QR code
          }
        }
      }
    }
  }

  /**
   * Get media statistics for a project
   */
  async getMediaStats(projectId, dateRange) {
    const where = {
      projectId,
      ...(dateRange && {
        timestamp: {
          gte: dateRange.start ? new Date(dateRange.start) : undefined,
          lte: dateRange.end ? new Date(dateRange.end) : undefined
        }
      })
    };

    const [photos, videos, users] = await Promise.all([
      prisma.media.count({ where: { ...where, mediaType: 'PHOTO' } }),
      prisma.media.count({ where: { ...where, mediaType: { in: ['VIDEO', 'DUAL_VIDEO'] } } }),
      prisma.media.groupBy({
        by: ['userId'],
        where,
        _count: true
      })
    ]);

    return {
      photos,
      videos,
      activeUsers: users.length
    };
  }

  /**
   * Save PDF to file system
   */
  async savePDF(buffer, filename) {
    const dir = path.join(process.cwd(), 'reports');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filepath = path.join(dir, filename);
    await fs.promises.writeFile(filepath, buffer);
    
    return filepath;
  }

  // ================================
  // CUSTOM TEMPLATE SYSTEM
  // ================================

  /**
   * Get template by ID
   */
  async getTemplate(templateId) {
    try {
      const template = await prisma.reportTemplate.findUnique({
        where: { id: templateId },
        include: {
          company: true
        }
      });
      return template;
    } catch (error) {
      logger.error('Failed to get template:', error);
      return null;
    }
  }

  /**
   * Generate PDF from custom template
   */
  async generateFromTemplate(doc, template, report, project, user) {
    const templateConfig = template.templateConfig || {};
    const sections = templateConfig.sections || [];

    // Apply template styling
    if (templateConfig.colors) {
      // Store colors for later use
      this.templateColors = templateConfig.colors;
    }

    // Generate header based on template config
    if (templateConfig.header) {
      await this.addTemplateHeader(doc, template, project, report, templateConfig.header);
    } else {
      await this.addHeader(doc, project, report);
    }

    // Add sections based on template configuration
    for (const section of sections) {
      await this.addTemplateSection(doc, section, report, project, user);
    }
  }

  /**
   * Add template-based header
   */
  async addTemplateHeader(doc, template, project, report, headerConfig) {
    const showLogo = headerConfig.showLogo !== false;
    const showQR = headerConfig.showQR !== false;
    const titleStyle = headerConfig.titleStyle || {};

    if (showLogo) {
      // Company logo placeholder
      doc.rect(this.margin, this.margin, 80, 40).stroke();
      doc.fontSize(10).text('LOGO', this.margin + 30, this.margin + 15);
    }

    // Title with custom styling
    const titleSize = titleStyle.fontSize || 20;
    const titleColor = titleStyle.color || '#000000';
    
    doc.fontSize(titleSize)
       .fillColor(titleColor)
       .text(headerConfig.title || report.title, 150, this.margin, { 
         width: showQR ? 300 : 400, 
         align: titleStyle.align || 'center' 
       });

    // Subtitle
    if (headerConfig.showSubtitle !== false) {
      doc.fontSize(titleSize - 4)
         .text(project.company.name, 150, this.margin + 25, { 
           width: showQR ? 300 : 400, 
           align: 'center' 
         });
    }

    // QR Code
    if (showQR) {
      const reportUrl = `${process.env.FRONTEND_URL || 'https://fsw-iron-task.vercel.app'}/reports/${report.shareToken || report.id}`;
      const qrCodeDataUrl = await this.generateQRCode(reportUrl, { size: 80 });
      
      if (qrCodeDataUrl) {
        try {
          const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
          doc.image(qrBuffer, this.pageWidth - this.margin - 80, this.margin, {
            fit: [80, 80],
            align: 'center'
          });
          
          doc.fontSize(8)
             .fillColor('#666666')
             .text('Scan for Digital Report', this.pageWidth - this.margin - 80, this.margin + 85, {
               width: 80,
               align: 'center'
             });
        } catch (error) {
          logger.error('Failed to add template QR code:', error);
        }
      }
    }

    // Header separator
    const separatorY = this.margin + (headerConfig.height || 100);
    doc.moveTo(this.margin, separatorY)
       .lineTo(this.pageWidth - this.margin, separatorY)
       .strokeColor(headerConfig.borderColor || '#000000')
       .stroke();

    doc.y = separatorY + 10;
  }

  /**
   * Add template section
   */
  async addTemplateSection(doc, sectionConfig, report, project, user) {
    const { type, title, showTitle = true, style = {} } = sectionConfig;

    // Add section title
    if (showTitle && title) {
      const titleSize = style.titleSize || 14;
      const titleColor = style.titleColor || '#000000';
      
      doc.fontSize(titleSize)
         .fillColor(titleColor)
         .font('Helvetica-Bold')
         .text(title, this.margin, doc.y);
      
      doc.moveDown(0.5);
    }

    // Add section content based on type
    switch (type) {
      case 'project_info':
        this.addProjectInfo(doc, project, report);
        break;
      case 'media_gallery':
        await this.addMediaSection(doc, report);
        break;
      case 'summary':
        await this.addSummaryContent(doc, report, project);
        break;
      case 'progress':
        await this.addProgressRecapContent(doc, report, project);
        break;
      case 'daily_log':
        await this.addDailyLogContent(doc, report, project);
        break;
      case 'custom_text':
        this.addCustomTextSection(doc, sectionConfig, report, project);
        break;
      case 'signature_block':
        this.addSignatureBlock(doc, sectionConfig);
        break;
      default:
        break;
    }

    doc.moveDown(1);
  }

  /**
   * Add custom text section
   */
  addCustomTextSection(doc, sectionConfig, report, project) {
    const { content, style = {} } = sectionConfig;
    
    if (!content) return;

    const fontSize = style.fontSize || 10;
    const textColor = style.color || '#000000';
    const alignment = style.align || 'left';

    // Replace template variables
    const processedContent = content
      .replace(/\{\{project\.name\}\}/g, project.name)
      .replace(/\{\{project\.location\}\}/g, project.location)
      .replace(/\{\{company\.name\}\}/g, project.company.name)
      .replace(/\{\{report\.title\}\}/g, report.title)
      .replace(/\{\{date\}\}/g, format(new Date(), 'MM/dd/yyyy'));

    doc.fontSize(fontSize)
       .fillColor(textColor)
       .font('Helvetica')
       .text(processedContent, this.margin, doc.y, {
         width: this.pageWidth - (2 * this.margin),
         align: alignment
       });
  }

  /**
   * Add signature block
   */
  addSignatureBlock(doc, sectionConfig) {
    const { signatures = [], style = {} } = sectionConfig;
    const blockHeight = style.height || 60;
    const signatureWidth = (this.pageWidth - (2 * this.margin) - (signatures.length - 1) * 20) / signatures.length;

    let x = this.margin;
    
    for (const signature of signatures) {
      // Signature line
      doc.moveTo(x, doc.y + blockHeight - 20)
         .lineTo(x + signatureWidth, doc.y + blockHeight - 20)
         .stroke();
      
      // Signature label
      doc.fontSize(8)
         .text(signature.label || 'Signature', x, doc.y + blockHeight - 15, {
           width: signatureWidth,
           align: 'center'
         });
      
      // Date line
      if (signature.includeDate !== false) {
        doc.text('Date: _______________', x, doc.y + 5, {
          width: signatureWidth,
          align: 'center'
        });
      }
      
      x += signatureWidth + 20;
    }

    doc.y += blockHeight + 20;
  }
}

module.exports = new PDFReportService();