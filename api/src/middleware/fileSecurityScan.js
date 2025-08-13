/**
 * File Security Scanning Middleware
 * Implements malware detection and enhanced file validation for uploaded media
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { fileTypeFromBuffer } = require('file-type');

/**
 * Magic number signatures for common file types
 * Used for deep content validation beyond MIME type checking
 */
const FILE_SIGNATURES = {
  // Images
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF], // JPEG
    [0xFF, 0xD8, 0xFF, 0xE0], // JPEG with JFIF
    [0xFF, 0xD8, 0xFF, 0xE1] // JPEG with EXIF
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] // PNG
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] // GIF89a
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50] // RIFF....WEBP
  ],

  // Videos
  'video/mp4': [
    [0x00, 0x00, 0x00, null, 0x66, 0x74, 0x79, 0x70], // MP4
    [0x00, 0x00, 0x00, null, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D] // MP4 ISO
  ],
  'video/quicktime': [
    [0x00, 0x00, 0x00, null, 0x6D, 0x6F, 0x6F, 0x76], // QuickTime
    [0x00, 0x00, 0x00, null, 0x6D, 0x64, 0x61, 0x74] // QuickTime data
  ],
  'video/x-msvideo': [
    [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x41, 0x56, 0x49, 0x20] // AVI
  ]
};

/**
 * Suspicious patterns that may indicate malicious content
 */
const MALICIOUS_PATTERNS = [
  // Executable signatures
  Buffer.from([0x4D, 0x5A]), // MZ (Windows PE)
  Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF (Linux executable)
  Buffer.from([0xCE, 0xFA, 0xED, 0xFE]), // Mach-O (macOS executable)
  Buffer.from([0xCA, 0xFE, 0xBA, 0xBE]), // Java class file
  
  // Script patterns
  Buffer.from('<?php'), // PHP
  Buffer.from('<script'), // JavaScript
  Buffer.from('#!/bin/'), // Shell scripts
  Buffer.from('eval('), // Potentially dangerous eval
  
  // Archive formats that shouldn't be in media files
  Buffer.from([0x50, 0x4B, 0x03, 0x04]), // ZIP
  Buffer.from([0x52, 0x61, 0x72, 0x21]), // RAR
  Buffer.from([0x1F, 0x8B]), // GZIP
  
  // Database files
  Buffer.from('SQLite format 3'), // SQLite
  
  // Suspicious strings in metadata
  Buffer.from('javascript:'),
  Buffer.from('data:text/html'),
  Buffer.from('<iframe'),
  Buffer.from('onload='),
  Buffer.from('onerror=')
];

class FileSecurityScanner {
  constructor(options = {}) {
    this.maxScanSize = options.maxScanSize || 50 * 1024 * 1024; // 50MB limit for scanning
    this.quarantinePath = options.quarantinePath || path.join(process.cwd(), 'quarantine');
    this.enableQuarantine = options.enableQuarantine !== false;
    this.logSuspiciousFiles = options.logSuspiciousFiles !== false;
  }

  /**
   * Validate file content matches declared MIME type
   */
  async validateFileSignature(filePath, declaredMimeType) {
    try {
      const buffer = await fs.readFile(filePath);
      
      // Check file size
      if (buffer.length > this.maxScanSize) {
        throw new Error(`File too large for security scanning: ${buffer.length} bytes`);
      }

      // Use file-type library for detection
      const detectedType = await fileTypeFromBuffer(buffer);
      
      if (!detectedType) {
        throw new Error('Unable to detect file type - potentially suspicious');
      }

      // Verify MIME type matches
      if (detectedType.mime !== declaredMimeType) {
        throw new Error(
          `MIME type mismatch: declared ${declaredMimeType}, detected ${detectedType.mime}`
        );
      }

      // Additional signature validation
      const signatures = FILE_SIGNATURES[declaredMimeType];
      if (signatures) {
        const isValidSignature = signatures.some(signature => 
          this.matchesSignature(buffer, signature)
        );
        
        if (!isValidSignature) {
          throw new Error(`Invalid file signature for ${declaredMimeType}`);
        }
      }

      return {
        isValid: true,
        detectedType: detectedType.mime,
        fileSize: buffer.length
      };

    } catch (error) {
      return {
        isValid: false,
        error: error.message,
        detectedType: null
      };
    }
  }

  /**
   * Check if buffer matches a signature pattern
   */
  matchesSignature(buffer, signature) {
    if (buffer.length < signature.length) return false;
    
    for (let i = 0; i < signature.length; i++) {
      if (signature[i] !== null && buffer[i] !== signature[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Scan file for malicious patterns
   */
  async scanForMaliciousContent(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      const threats = [];
      
      // Check for suspicious patterns
      for (const pattern of MALICIOUS_PATTERNS) {
        if (buffer.indexOf(pattern) !== -1) {
          threats.push({
            type: 'suspicious_pattern',
            pattern: pattern.toString('hex'),
            description: `Suspicious pattern found: ${pattern.toString()}`
          });
        }
      }

      // Check for excessive embedded scripts or HTML
      const htmlCount = (buffer.toString().match(/<[^>]+>/g) || []).length;
      const scriptCount = (buffer.toString().match(/<script/gi) || []).length;
      
      if (htmlCount > 10) {
        threats.push({
          type: 'excessive_html',
          count: htmlCount,
          description: 'Excessive HTML tags found in media file'
        });
      }

      if (scriptCount > 0) {
        threats.push({
          type: 'embedded_scripts',
          count: scriptCount,
          description: 'JavaScript detected in media file'
        });
      }

      // Check file entropy (high entropy might indicate encryption/compression)
      const entropy = this.calculateEntropy(buffer);
      if (entropy > 7.8) {
        threats.push({
          type: 'high_entropy',
          entropy: entropy,
          description: 'Unusually high entropy - potential encrypted/compressed payload'
        });
      }

      return {
        isClean: threats.length === 0,
        threats: threats,
        entropy: entropy,
        fileSize: buffer.length
      };

    } catch (error) {
      return {
        isClean: false,
        threats: [{
          type: 'scan_error',
          description: `Failed to scan file: ${error.message}`
        }],
        error: error.message
      };
    }
  }

  /**
   * Calculate Shannon entropy of file content
   */
  calculateEntropy(buffer) {
    const frequencies = new Array(256).fill(0);
    
    // Count byte frequencies
    for (let i = 0; i < buffer.length; i++) {
      frequencies[buffer[i]]++;
    }

    // Calculate entropy
    let entropy = 0;
    const length = buffer.length;

    for (let i = 0; i < 256; i++) {
      if (frequencies[i] > 0) {
        const probability = frequencies[i] / length;
        entropy -= probability * Math.log2(probability);
      }
    }

    return entropy;
  }

  /**
   * Quarantine suspicious file
   */
  async quarantineFile(filePath, reason) {
    if (!this.enableQuarantine) return null;

    try {
      await fs.mkdir(this.quarantinePath, { recursive: true });
      
      const fileName = path.basename(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const quarantineFileName = `${timestamp}_${fileName}`;
      const quarantinePath = path.join(this.quarantinePath, quarantineFileName);
      
      await fs.copyFile(filePath, quarantinePath);
      
      // Create metadata file
      const metadataPath = quarantinePath + '.meta.json';
      const metadata = {
        originalPath: filePath,
        quarantinedAt: new Date().toISOString(),
        reason: reason,
        fileSize: (await fs.stat(filePath)).size,
        hash: await this.calculateFileHash(filePath)
      };
      
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      
      return quarantinePath;

    } catch (error) {
      console.error('Failed to quarantine file:', error);
      return null;
    }
  }

  /**
   * Calculate SHA-256 hash of file
   */
  async calculateFileHash(filePath) {
    const buffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Comprehensive file security check
   */
  async scanFile(filePath, declaredMimeType, options = {}) {
    const startTime = Date.now();
    const result = {
      filePath: filePath,
      declaredMimeType: declaredMimeType,
      scanStartTime: new Date().toISOString(),
      isSecure: false,
      threats: [],
      validationErrors: []
    };

    try {
      // Step 1: Validate file signature
      const signatureValidation = await this.validateFileSignature(filePath, declaredMimeType);
      result.signatureValidation = signatureValidation;

      if (!signatureValidation.isValid) {
        result.validationErrors.push(signatureValidation.error);
      }

      // Step 2: Scan for malicious content
      const malwareCheck = await this.scanForMaliciousContent(filePath);
      result.malwareCheck = malwareCheck;

      if (!malwareCheck.isClean) {
        result.threats = malwareCheck.threats;
      }

      // Step 3: Determine overall security status
      result.isSecure = signatureValidation.isValid && malwareCheck.isClean;

      // Step 4: Handle threats
      if (!result.isSecure) {
        const threatDescription = [
          ...result.validationErrors,
          ...result.threats.map(t => t.description)
        ].join('; ');

        if (options.quarantine !== false) {
          result.quarantinePath = await this.quarantineFile(filePath, threatDescription);
        }

        if (this.logSuspiciousFiles) {
          console.warn('Security threat detected in file:', {
            filePath: filePath,
            threats: result.threats,
            validationErrors: result.validationErrors,
            quarantined: !!result.quarantinePath
          });
        }
      }

      result.scanDuration = Date.now() - startTime;
      result.scanEndTime = new Date().toISOString();

      return result;

    } catch (error) {
      result.error = error.message;
      result.scanDuration = Date.now() - startTime;
      result.scanEndTime = new Date().toISOString();
      
      console.error('File security scan failed:', error);
      return result;
    }
  }
}

/**
 * Fastify middleware for file security scanning
 */
function createFileSecurityMiddleware(options = {}) {
  const scanner = new FileSecurityScanner(options);

  return async function fileSecurityMiddleware(request, reply) {
    // Only process multipart uploads
    if (!request.isMultipart()) {
      return;
    }

    const parts = request.parts();
    const scanResults = [];

    for await (const part of parts) {
      if (part.file && part.filename) {
        try {
          // Create temporary file for scanning
          const tempPath = path.join(
            options.tempDir || '/tmp',
            `security_scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          );

          // Write uploaded file to temp location
          await fs.writeFile(tempPath, await part.toBuffer());

          // Scan the file
          const scanResult = await scanner.scanFile(tempPath, part.mimetype);
          scanResults.push({
            fieldName: part.fieldname,
            fileName: part.filename,
            scanResult: scanResult
          });

          // Check if file is secure
          if (!scanResult.isSecure) {
            // Clean up temp file
            await fs.unlink(tempPath).catch(() => {}); // Ignore errors
            
            return reply.code(400).send({
              error: 'File failed security validation',
              details: scanResult.threats.map(t => t.description),
              fileName: part.filename,
              code: 'SECURITY_THREAT_DETECTED'
            });
          }

          // Clean up temp file
          await fs.unlink(tempPath).catch(() => {}); // Ignore errors

        } catch (error) {
          console.error('File security scanning error:', error);
          return reply.code(500).send({
            error: 'File security scan failed',
            details: error.message,
            fileName: part.filename,
            code: 'SECURITY_SCAN_ERROR'
          });
        }
      }
    }

    // Attach scan results to request for logging
    request.fileScanResults = scanResults;
  };
}

module.exports = {
  FileSecurityScanner,
  createFileSecurityMiddleware,
  FILE_SIGNATURES,
  MALICIOUS_PATTERNS
};