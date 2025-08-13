/**
 * Test Data Fixtures and Factories
 * Provides consistent, realistic test data for construction documentation scenarios
 */

const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');

// Construction-specific faker extensions
const constructionFaker = {
  // Construction project names
  projectName: () => {
    const types = ['Tower', 'Bridge', 'Complex', 'Center', 'Plaza', 'Building'];
    const locations = ['Downtown', 'Riverside', 'Industrial', 'Metro', 'Corporate'];
    const descriptors = ['High-Rise', 'Commercial', 'Mixed-Use', 'Office', 'Residential'];
    
    return `${faker.helpers.arrayElement(locations)} ${faker.helpers.arrayElement(descriptors)} ${faker.helpers.arrayElement(types)}`;
  },

  // Construction activities
  activityType: () => faker.helpers.arrayElement([
    'ERECTION', 'FABRICATION', 'DELIVERY', 'WELDING', 
    'BOLTING', 'PLUMBING', 'DECKING', 'SAFETY', 'OTHER'
  ]),

  // Safety categories
  safetyCategory: () => faker.helpers.arrayElement([
    'PPE', 'FALL_PROTECTION', 'ELECTRICAL', 'CONFINED_SPACE',
    'CRANE_OPERATIONS', 'HAZMAT', 'FIRE_SAFETY', 'FIRST_AID'
  ]),

  // Quality check types
  qualityType: () => faker.helpers.arrayElement([
    'STRUCTURAL_INTEGRITY', 'WELD_INSPECTION', 'MATERIAL_COMPLIANCE',
    'DIMENSIONAL_ACCURACY', 'SURFACE_FINISH', 'BOLT_TORQUE'
  ]),

  // Construction locations within a site
  constructionLocation: () => {
    const buildings = ['Building A', 'Building B', 'Tower 1', 'Tower 2'];
    const levels = ['Ground Level', 'Level 1', 'Level 2', 'Level 3', 'Roof'];
    const grids = ['Grid A-B/1-2', 'Grid C-D/3-4', 'Grid E-F/5-6'];
    
    return `${faker.helpers.arrayElement(buildings)}, ${faker.helpers.arrayElement(levels)}, ${faker.helpers.arrayElement(grids)}`;
  },

  // Equipment types
  equipment: () => faker.helpers.arrayElement([
    'Tower Crane', 'Mobile Crane', 'Welder', 'Plasma Cutter',
    'Torch', 'Grinder', 'Drill', 'Impact Wrench', 'Level'
  ]),

  // Material types
  material: () => faker.helpers.arrayElement([
    'Structural Steel', 'Rebar', 'Concrete', 'Bolts',
    'Welding Rod', 'Paint', 'Primer', 'Decking'
  ])
};

class TestDataFactory {
  constructor() {
    this.sequenceCounters = {
      company: 0,
      user: 0,
      project: 0,
      media: 0,
      activity: 0,
      safetyInspection: 0,
      qualityCheck: 0
    };
  }

  /**
   * Get next sequence number for entity type
   */
  nextSequence(type) {
    return ++this.sequenceCounters[type];
  }

  /**
   * Create test company data
   */
  createCompany(overrides = {}) {
    const sequence = this.nextSequence('company');
    
    return {
      id: `test-company-${sequence}`,
      name: `${faker.company.name()} Construction`,
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      website: faker.internet.url(),
      licenseNumber: faker.string.alphanumeric(10).toUpperCase(),
      insuranceInfo: {
        provider: faker.company.name(),
        policyNumber: faker.string.alphanumeric(12),
        expiryDate: faker.date.future()
      },
      createdAt: faker.date.past({ years: 2 }),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  /**
   * Create test user data with construction roles
   */
  createUser(overrides = {}) {
    const sequence = this.nextSequence('user');
    const roles = ['ADMIN', 'PROJECT_MANAGER', 'FOREMAN', 'WORKER', 'STEEL_ERECTOR', 'WELDER', 'SAFETY_INSPECTOR', 'VIEWER'];
    const role = overrides.role || faker.helpers.arrayElement(roles);
    
    const baseUser = {
      id: `test-user-${sequence}`,
      email: `testuser${sequence}@construction.test`,
      password: bcrypt.hashSync('TestPass123!', 10),
      name: faker.person.fullName(),
      role,
      companyId: overrides.companyId || 'test-company-1',
      unionMember: faker.datatype.boolean({ probability: 0.7 }),
      phoneNumber: faker.phone.number(),
      avatar: faker.image.avatar(),
      certifications: this.generateCertifications(role),
      emergencyContact: {
        name: faker.person.fullName(),
        relationship: faker.helpers.arrayElement(['Spouse', 'Parent', 'Sibling', 'Friend']),
        phone: faker.phone.number()
      },
      hireDate: faker.date.past({ years: 5 }),
      lastLogin: faker.date.recent(),
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: faker.date.recent(),
      ...overrides
    };

    // Remove password from returned object for security
    const { password, ...userWithoutPassword } = baseUser;
    return userWithoutPassword;
  }

  /**
   * Generate role-appropriate certifications
   */
  generateCertifications(role) {
    const baseCertifications = ['OSHA 30', 'First Aid/CPR'];
    const roleCertifications = {
      'WELDER': ['AWS D1.1', 'Structural Welding', 'Pipe Welding'],
      'STEEL_ERECTOR': ['Rigging Certification', 'Fall Protection', 'Crane Operations'],
      'SAFETY_INSPECTOR': ['OSHA 500', 'Safety Management', 'Hazmat Certification'],
      'PROJECT_MANAGER': ['PMP', 'Construction Management', 'LEED AP'],
      'FOREMAN': ['Supervisory Training', 'Blueprint Reading', 'Quality Control']
    };

    return [
      ...baseCertifications,
      ...(roleCertifications[role] || [])
    ].map(cert => ({
      name: cert,
      number: faker.string.alphanumeric(8).toUpperCase(),
      issueDate: faker.date.past({ years: 3 }),
      expiryDate: faker.date.future({ years: 2 })
    }));
  }

  /**
   * Create test project data
   */
  createProject(overrides = {}) {
    const sequence = this.nextSequence('project');
    const status = overrides.status || faker.helpers.arrayElement(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']);
    
    const startDate = overrides.startDate || faker.date.past({ years: 1 });
    const duration = faker.number.int({ min: 30, max: 365 }); // 30 days to 1 year
    const expectedEndDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
    
    return {
      id: `test-project-${sequence}`,
      name: constructionFaker.projectName(),
      description: `${faker.lorem.sentence()} This project involves ${faker.helpers.arrayElements(['steel erection', 'concrete work', 'welding operations', 'safety inspections'], { min: 2, max: 4 }).join(', ')}.`,
      status,
      companyId: overrides.companyId || 'test-company-1',
      location: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}`,
      coordinates: {
        lat: faker.location.latitude(),
        lng: faker.location.longitude()
      },
      startDate,
      expectedEndDate,
      actualEndDate: status === 'COMPLETED' ? faker.date.between({ from: startDate, to: expectedEndDate }) : null,
      budget: faker.number.float({ min: 100000, max: 10000000, fractionDigits: 2 }),
      contractNumber: faker.string.alphanumeric(12).toUpperCase(),
      clientInfo: {
        name: faker.company.name(),
        contact: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number()
      },
      specifications: {
        buildingType: faker.helpers.arrayElement(['Commercial', 'Industrial', 'Residential', 'Infrastructure']),
        stories: faker.number.int({ min: 1, max: 50 }),
        totalArea: faker.number.int({ min: 10000, max: 1000000 }), // sq ft
        steelTonnage: faker.number.int({ min: 100, max: 5000 }) // tons
      },
      weatherRestrictions: faker.datatype.boolean({ probability: 0.3 }),
      safetyRequirements: [
        'OSHA Compliance',
        'Daily Safety Briefings',
        'PPE Mandatory',
        ...(faker.datatype.boolean({ probability: 0.5 }) ? ['Confined Space Training'] : []),
        ...(faker.datatype.boolean({ probability: 0.3 }) ? ['Fall Protection Certified'] : [])
      ],
      createdAt: faker.date.past({ years: 2 }),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  /**
   * Create test media data
   */
  createMedia(overrides = {}) {
    const sequence = this.nextSequence('media');
    const type = overrides.type || faker.helpers.arrayElement(['PHOTO', 'VIDEO', 'DUAL_CAMERA_VIDEO']);
    const fileExtension = type === 'VIDEO' || type === 'DUAL_CAMERA_VIDEO' ? 'mp4' : 'jpg';
    const filename = `construction_${sequence}.${fileExtension}`;
    
    const capturedAt = overrides.capturedAt || faker.date.recent({ days: 30 });
    const location = faker.datatype.boolean({ probability: 0.8 }) ? {
      lat: faker.location.latitude(),
      lng: faker.location.longitude(),
      address: constructionFaker.constructionLocation()
    } : null;

    return {
      id: `test-media-${sequence}`,
      type,
      url: `https://test-storage.s3.amazonaws.com/media/${filename}`,
      thumbnailUrl: type !== 'PHOTO' ? `https://test-storage.s3.amazonaws.com/thumbnails/${filename.replace(fileExtension, 'jpg')}` : null,
      filename,
      originalName: filename,
      mimeType: type === 'PHOTO' ? 'image/jpeg' : 'video/mp4',
      fileSize: faker.number.int({ 
        min: type === 'PHOTO' ? 500000 : 10000000, 
        max: type === 'PHOTO' ? 5000000 : 100000000 
      }),
      projectId: overrides.projectId || 'test-project-1',
      userId: overrides.userId || 'test-user-1',
      description: this.generateMediaDescription(type),
      capturedAt,
      location,
      metadata: this.generateMediaMetadata(type),
      tags: faker.helpers.arrayElements([
        'progress', 'safety', 'quality', 'issue', 'completed',
        'steel-work', 'welding', 'concrete', 'inspection'
      ], { min: 1, max: 4 }),
      viewCount: faker.number.int({ min: 0, max: 100 }),
      isProcessing: false,
      processingError: null,
      createdAt: capturedAt,
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  /**
   * Generate realistic media descriptions
   */
  generateMediaDescription(type) {
    const activities = [
      'Steel beam installation', 'Welding operations', 'Safety inspection',
      'Quality control check', 'Concrete pour', 'Equipment setup',
      'Progress documentation', 'Site conditions'
    ];
    
    const locations = [
      'on Level 3', 'at Grid A-5', 'in the east wing',
      'near the tower crane', 'at the welding station'
    ];

    const activity = faker.helpers.arrayElement(activities);
    const location = faker.helpers.arrayElement(locations);
    const timeContext = type === 'VIDEO' ? 'during' : 'showing';
    
    return `${activity} ${timeContext} construction work ${location}. ${faker.lorem.sentence()}`;
  }

  /**
   * Generate realistic media metadata
   */
  generateMediaMetadata(type) {
    const baseMetadata = {
      deviceModel: faker.helpers.arrayElement(['iPhone 14 Pro', 'Samsung Galaxy S23', 'iPad Pro', 'DJI Drone']),
      timestamp: faker.date.recent().toISOString(),
      weather: {
        condition: faker.helpers.arrayElement(['Clear', 'Cloudy', 'Light Rain', 'Sunny']),
        temperature: faker.number.int({ min: 20, max: 100 }),
        windSpeed: faker.number.int({ min: 0, max: 25 })
      }
    };

    if (type === 'PHOTO') {
      return {
        ...baseMetadata,
        camera: {
          make: 'Apple',
          model: 'iPhone Camera',
          iso: faker.number.int({ min: 50, max: 1600 }),
          aperture: faker.helpers.arrayElement(['f/1.6', 'f/2.4', 'f/2.8']),
          shutterSpeed: faker.helpers.arrayElement(['1/60', '1/125', '1/250']),
          focalLength: faker.number.int({ min: 24, max: 77 })
        },
        dimensions: {
          width: faker.helpers.arrayElement([3024, 4032, 4096]),
          height: faker.helpers.arrayElement([2268, 3024, 2732])
        }
      };
    } else {
      return {
        ...baseMetadata,
        video: {
          duration: faker.number.int({ min: 10, max: 300 }), // 10 seconds to 5 minutes
          resolution: faker.helpers.arrayElement(['1920x1080', '3840x2160', '1280x720']),
          frameRate: faker.helpers.arrayElement([30, 60]),
          bitrate: faker.number.int({ min: 5000, max: 50000 }),
          codec: 'H.264'
        },
        audio: type === 'DUAL_CAMERA_VIDEO' ? {
          channels: 2,
          sampleRate: 44100,
          bitrate: 128000
        } : null
      };
    }
  }

  /**
   * Create test activity data
   */
  createActivity(overrides = {}) {
    const sequence = this.nextSequence('activity');
    const type = constructionFaker.activityType();
    const scheduledStart = overrides.scheduledStart || faker.date.recent({ days: 7 });
    const duration = faker.number.int({ min: 2, max: 12 }); // 2-12 hours
    const scheduledEnd = new Date(scheduledStart.getTime() + duration * 60 * 60 * 1000);
    
    const status = overrides.status || faker.helpers.arrayElement(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
    const actualStart = status !== 'SCHEDULED' ? faker.date.between({ 
      from: new Date(scheduledStart.getTime() - 30 * 60 * 1000), 
      to: new Date(scheduledStart.getTime() + 30 * 60 * 1000) 
    }) : null;
    const actualEnd = status === 'COMPLETED' ? faker.date.between({ 
      from: actualStart || scheduledStart, 
      to: new Date((actualStart || scheduledStart).getTime() + duration * 60 * 60 * 1000) 
    }) : null;

    return {
      id: `test-activity-${sequence}`,
      type,
      description: this.generateActivityDescription(type),
      projectId: overrides.projectId || 'test-project-1',
      userId: overrides.userId || 'test-user-1',
      assignedTo: [
        overrides.userId || 'test-user-1',
        ...(faker.datatype.boolean({ probability: 0.6 }) ? [`test-user-${faker.number.int({ min: 2, max: 5 })}`] : [])
      ],
      location: constructionFaker.constructionLocation(),
      scheduledStart,
      scheduledEnd,
      actualStart,
      actualEnd,
      status,
      priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      progress: status === 'COMPLETED' ? 100 : 
                status === 'IN_PROGRESS' ? faker.number.int({ min: 10, max: 90 }) : 0,
      equipment: faker.helpers.arrayElements([
        constructionFaker.equipment(),
        constructionFaker.equipment()
      ], { min: 1, max: 3 }),
      materials: faker.helpers.arrayElements([
        constructionFaker.material(),
        constructionFaker.material()
      ], { min: 1, max: 4 }),
      crewSize: faker.number.int({ min: 1, max: 8 }),
      safetyRequirements: [
        'PPE Required',
        ...(faker.datatype.boolean({ probability: 0.4 }) ? ['Fall Protection'] : []),
        ...(faker.datatype.boolean({ probability: 0.3 }) ? ['Confined Space'] : [])
      ],
      weatherDependent: faker.datatype.boolean({ probability: 0.4 }),
      prerequisites: faker.datatype.boolean({ probability: 0.3 }) ? [
        `Activity test-activity-${sequence - 1} must be completed`
      ] : [],
      notes: faker.lorem.paragraph(),
      createdAt: faker.date.past({ days: 30 }),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  /**
   * Generate activity descriptions based on type
   */
  generateActivityDescription(type) {
    const descriptions = {
      'ERECTION': [
        'Install structural steel columns',
        'Erect steel beams for Level 3',
        'Position and secure steel trusses',
        'Raise precast concrete panels'
      ],
      'WELDING': [
        'Weld column-to-beam connections',
        'Complete structural welding on Grid A',
        'Perform fillet welding operations',
        'Weld steel plate reinforcement'
      ],
      'FABRICATION': [
        'Fabricate steel connection plates',
        'Cut and shape structural members',
        'Prepare steel components for installation',
        'Assemble steel framework sections'
      ],
      'SAFETY': [
        'Conduct daily safety briefing',
        'Inspect fall protection equipment',
        'Review emergency procedures',
        'Safety walk-through inspection'
      ],
      'OTHER': [
        'Site cleanup and organization',
        'Equipment maintenance check',
        'Material delivery coordination',
        'Progress documentation'
      ]
    };

    return faker.helpers.arrayElement(descriptions[type] || descriptions['OTHER']);
  }

  /**
   * Create test safety inspection data
   */
  createSafetyInspection(overrides = {}) {
    const sequence = this.nextSequence('safetyInspection');
    const score = overrides.score || faker.number.int({ min: 60, max: 100 });
    const status = overrides.status || (score >= 80 ? 'PASSED' : score >= 70 ? 'CONDITIONAL' : 'FAILED');
    const inspectionDate = overrides.inspectionDate || faker.date.recent({ days: 30 });
    
    return {
      id: `test-safety-${sequence}`,
      projectId: overrides.projectId || 'test-project-1',
      inspectorId: overrides.inspectorId || 'test-user-1',
      type: faker.helpers.arrayElement(['GENERAL_SAFETY', 'EQUIPMENT_SAFETY', 'FALL_PROTECTION', 'CONFINED_SPACE']),
      status,
      score,
      findings: this.generateSafetyFindings(score),
      recommendations: this.generateSafetyRecommendations(score),
      correctiveActions: status === 'FAILED' ? this.generateCorrectiveActions() : [],
      inspectionDate,
      nextInspectionDate: new Date(inspectionDate.getTime() + faker.number.int({ min: 7, max: 30 }) * 24 * 60 * 60 * 1000),
      weatherConditions: {
        condition: faker.helpers.arrayElement(['Clear', 'Cloudy', 'Light Rain']),
        temperature: faker.number.int({ min: 30, max: 90 }),
        windSpeed: faker.number.int({ min: 0, max: 20 })
      },
      photos: faker.helpers.arrayElements([
        'safety-inspection-1.jpg',
        'safety-inspection-2.jpg',
        'safety-equipment.jpg',
        'site-conditions.jpg'
      ], { min: 1, max: 3 }),
      createdAt: inspectionDate,
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  /**
   * Generate safety findings based on score
   */
  generateSafetyFindings(score) {
    const categories = ['PPE', 'FALL_PROTECTION', 'ELECTRICAL', 'HOUSEKEEPING', 'EQUIPMENT'];
    const findings = [];
    
    categories.forEach(category => {
      const categoryScore = score + faker.number.int({ min: -15, max: 15 });
      const status = categoryScore >= 80 ? 'PASS' : categoryScore >= 70 ? 'NEEDS_ATTENTION' : 'FAIL';
      
      findings.push({
        category,
        status,
        score: Math.max(0, Math.min(100, categoryScore)),
        notes: this.generateFindingNotes(category, status),
        photos: status === 'FAIL' ? [`${category.toLowerCase()}-issue.jpg`] : null
      });
    });

    return findings;
  }

  /**
   * Generate finding notes based on category and status
   */
  generateFindingNotes(category, status) {
    const notes = {
      'PPE': {
        'PASS': 'All workers properly wearing hard hats, safety glasses, and steel-toed boots.',
        'NEEDS_ATTENTION': 'Most workers compliant, minor issues with safety glasses usage.',
        'FAIL': 'Multiple workers not wearing required PPE. Immediate correction needed.'
      },
      'FALL_PROTECTION': {
        'PASS': 'All workers properly harnessed and connected to secure anchor points.',
        'NEEDS_ATTENTION': 'Some workers need reminder about proper harness inspection.',
        'FAIL': 'Workers found working at height without proper fall protection.'
      },
      'ELECTRICAL': {
        'PASS': 'All electrical equipment properly grounded and inspected.',
        'NEEDS_ATTENTION': 'Some extension cords showing minor wear.',
        'FAIL': 'Electrical hazards identified requiring immediate attention.'
      }
    };

    return notes[category]?.[status] || 'Standard inspection completed.';
  }

  /**
   * Generate safety recommendations
   */
  generateSafetyRecommendations(score) {
    const recommendations = [
      'Continue current safety practices',
      'Increase frequency of safety briefings',
      'Additional PPE training recommended',
      'Improve housekeeping standards',
      'Review emergency procedures with crew'
    ];

    const count = score >= 90 ? 1 : score >= 80 ? 2 : score >= 70 ? 3 : 4;
    return faker.helpers.arrayElements(recommendations, count);
  }

  /**
   * Generate corrective actions for failed inspections
   */
  generateCorrectiveActions() {
    return [
      {
        id: faker.string.uuid(),
        description: 'Provide additional PPE training to crew',
        assignedTo: 'test-user-2', // Foreman
        dueDate: faker.date.future({ days: 7 }),
        priority: 'HIGH',
        status: 'ASSIGNED'
      },
      {
        id: faker.string.uuid(),
        description: 'Replace worn safety equipment',
        assignedTo: 'test-user-1',
        dueDate: faker.date.future({ days: 3 }),
        priority: 'CRITICAL',
        status: 'ASSIGNED'
      }
    ];
  }

  /**
   * Create test quality check data
   */
  createQualityCheck(overrides = {}) {
    const sequence = this.nextSequence('qualityCheck');
    const type = constructionFaker.qualityType();
    const overallScore = overrides.overallScore || faker.number.int({ min: 65, max: 100 });
    const status = overrides.status || (overallScore >= 85 ? 'PASSED' : overallScore >= 75 ? 'CONDITIONAL' : 'FAILED');
    
    return {
      id: `test-quality-${sequence}`,
      projectId: overrides.projectId || 'test-project-1',
      inspectorId: overrides.inspectorId || 'test-user-1',
      type,
      status,
      overallScore,
      criteria: this.generateQualityCriteria(type, overallScore),
      location: constructionFaker.constructionLocation(),
      checkDate: overrides.checkDate || faker.date.recent({ days: 14 }),
      standards: this.getQualityStandards(type),
      equipment: [constructionFaker.equipment()],
      environmentalConditions: {
        temperature: faker.number.int({ min: 40, max: 85 }),
        humidity: faker.number.int({ min: 30, max: 80 }),
        windSpeed: faker.number.int({ min: 0, max: 15 })
      },
      photos: faker.helpers.arrayElements([
        `${type.toLowerCase()}-1.jpg`,
        `${type.toLowerCase()}-2.jpg`,
        'measurement-results.jpg'
      ], { min: 2, max: 3 }),
      certificates: type === 'MATERIAL_COMPLIANCE' ? [
        'material-cert-001.pdf',
        'mill-test-certificate.pdf'
      ] : [],
      correctiveActions: status === 'FAILED' ? this.generateQualityCorrectiveActions() : [],
      createdAt: faker.date.past({ days: 14 }),
      updatedAt: faker.date.recent(),
      ...overrides
    };
  }

  /**
   * Generate quality criteria based on type
   */
  generateQualityCriteria(type, targetScore) {
    const criteriaTemplates = {
      'STRUCTURAL_INTEGRITY': [
        { name: 'Column Plumb', requirement: '1/4" in 10 feet', unit: 'inches' },
        { name: 'Beam Level', requirement: '1/8" in 20 feet', unit: 'inches' },
        { name: 'Connection Alignment', requirement: 'Within 1/16"', unit: 'inches' }
      ],
      'WELD_INSPECTION': [
        { name: 'Penetration', requirement: 'Full penetration per AWS D1.1', unit: 'visual' },
        { name: 'Surface Quality', requirement: 'No cracks or undercuts', unit: 'visual' },
        { name: 'Weld Size', requirement: 'Per drawing specifications', unit: 'mm' }
      ],
      'BOLT_TORQUE': [
        { name: 'Torque Value', requirement: '250 ft-lbs minimum', unit: 'ft-lbs' },
        { name: 'Thread Engagement', requirement: 'Minimum 2 threads beyond nut', unit: 'threads' },
        { name: 'Washer Position', requirement: 'Proper alignment and seating', unit: 'visual' }
      ]
    };

    const templates = criteriaTemplates[type] || criteriaTemplates['STRUCTURAL_INTEGRITY'];
    
    return templates.map(template => {
      const criterionScore = targetScore + faker.number.int({ min: -10, max: 10 });
      const status = criterionScore >= 85 ? 'PASS' : criterionScore >= 75 ? 'MARGINAL' : 'FAIL';
      
      return {
        name: template.name,
        requirement: template.requirement,
        measurement: this.generateMeasurement(template, status),
        status,
        score: Math.max(0, Math.min(100, criterionScore)),
        notes: this.generateCriterionNotes(template.name, status),
        photos: status === 'FAIL' ? [`${template.name.toLowerCase().replace(/\s+/g, '-')}-issue.jpg`] : null
      };
    });
  }

  /**
   * Generate measurement based on requirement and status
   */
  generateMeasurement(template, status) {
    if (template.unit === 'visual') {
      return status === 'PASS' ? 'Acceptable per visual inspection' : 
             status === 'MARGINAL' ? 'Minor deviations noted' : 'Unacceptable condition';
    }

    // Generate realistic measurements
    const baseValue = template.requirement.match(/(\d+(?:\.\d+)?)/)?.[1];
    if (!baseValue) return 'Within specifications';

    const base = parseFloat(baseValue);
    const variation = status === 'PASS' ? faker.number.float({ min: 0.8, max: 0.95 }) :
                     status === 'MARGINAL' ? faker.number.float({ min: 0.95, max: 1.05 }) :
                     faker.number.float({ min: 1.1, max: 1.3 });

    return `${(base * variation).toFixed(2)} ${template.unit}`;
  }

  /**
   * Generate criterion notes
   */
  generateCriterionNotes(name, status) {
    const notes = {
      'PASS': `${name} meets all requirements. Excellent workmanship.`,
      'MARGINAL': `${name} acceptable but could be improved.`,
      'FAIL': `${name} does not meet specifications. Rework required.`
    };

    return notes[status];
  }

  /**
   * Get quality standards by type
   */
  getQualityStandards(type) {
    const standards = {
      'STRUCTURAL_INTEGRITY': ['AISC Steel Construction Manual', 'AWS D1.1'],
      'WELD_INSPECTION': ['AWS D1.1', 'AWS D1.3', 'ASME Section IX'],
      'MATERIAL_COMPLIANCE': ['ASTM A992', 'ASTM A325', 'ASTM A490'],
      'DIMENSIONAL_ACCURACY': ['ACI 117', 'AISC Code of Standard Practice'],
      'BOLT_TORQUE': ['AISC Steel Construction Manual', 'ASTM F3125']
    };

    return standards[type] || ['Industry Standard Specifications'];
  }

  /**
   * Generate quality corrective actions
   */
  generateQualityCorrectiveActions() {
    return [
      {
        id: faker.string.uuid(),
        description: 'Rework non-compliant welds per AWS standards',
        assignedTo: 'test-user-3', // Welder
        dueDate: faker.date.future({ days: 5 }),
        priority: 'HIGH',
        status: 'ASSIGNED',
        estimatedHours: faker.number.int({ min: 4, max: 16 })
      }
    ];
  }

  /**
   * Create comprehensive test dataset
   */
  createTestDataset() {
    // Create companies
    const companies = Array(3).fill().map(() => this.createCompany());
    
    // Create users for each company
    const users = [];
    companies.forEach(company => {
      // Admin
      users.push(this.createUser({ role: 'ADMIN', companyId: company.id }));
      // Project Managers
      users.push(...Array(2).fill().map(() => 
        this.createUser({ role: 'PROJECT_MANAGER', companyId: company.id })));
      // Foremen
      users.push(...Array(3).fill().map(() => 
        this.createUser({ role: 'FOREMAN', companyId: company.id })));
      // Workers
      users.push(...Array(8).fill().map(() => 
        this.createUser({ role: 'WORKER', companyId: company.id })));
      // Specialists
      users.push(this.createUser({ role: 'WELDER', companyId: company.id }));
      users.push(this.createUser({ role: 'STEEL_ERECTOR', companyId: company.id }));
      users.push(this.createUser({ role: 'SAFETY_INSPECTOR', companyId: company.id }));
    });

    // Create projects
    const projects = [];
    companies.forEach(company => {
      projects.push(...Array(faker.number.int({ min: 2, max: 5 })).fill().map(() =>
        this.createProject({ companyId: company.id })));
    });

    // Create media for projects
    const media = [];
    projects.forEach(project => {
      const mediaCount = faker.number.int({ min: 10, max: 50 });
      media.push(...Array(mediaCount).fill().map(() => {
        const projectUsers = users.filter(u => u.companyId === project.companyId);
        const randomUser = faker.helpers.arrayElement(projectUsers);
        return this.createMedia({ 
          projectId: project.id, 
          userId: randomUser.id 
        });
      }));
    });

    // Create activities
    const activities = [];
    projects.forEach(project => {
      const activityCount = faker.number.int({ min: 5, max: 20 });
      activities.push(...Array(activityCount).fill().map(() => {
        const projectUsers = users.filter(u => u.companyId === project.companyId);
        const randomUser = faker.helpers.arrayElement(projectUsers);
        return this.createActivity({
          projectId: project.id,
          userId: randomUser.id
        });
      }));
    });

    // Create safety inspections
    const safetyInspections = [];
    projects.forEach(project => {
      const inspectionCount = faker.number.int({ min: 3, max: 10 });
      safetyInspections.push(...Array(inspectionCount).fill().map(() => {
        const inspectors = users.filter(u => 
          u.companyId === project.companyId && 
          ['SAFETY_INSPECTOR', 'PROJECT_MANAGER', 'FOREMAN'].includes(u.role)
        );
        const inspector = faker.helpers.arrayElement(inspectors);
        return this.createSafetyInspection({
          projectId: project.id,
          inspectorId: inspector.id
        });
      }));
    });

    // Create quality checks
    const qualityChecks = [];
    projects.forEach(project => {
      const checkCount = faker.number.int({ min: 2, max: 8 });
      qualityChecks.push(...Array(checkCount).fill().map(() => {
        const inspectors = users.filter(u => 
          u.companyId === project.companyId && 
          ['PROJECT_MANAGER', 'FOREMAN'].includes(u.role)
        );
        const inspector = faker.helpers.arrayElement(inspectors);
        return this.createQualityCheck({
          projectId: project.id,
          inspectorId: inspector.id
        });
      }));
    });

    return {
      companies,
      users,
      projects,
      media,
      activities,
      safetyInspections,
      qualityChecks,
      metadata: {
        generatedAt: new Date(),
        totalRecords: companies.length + users.length + projects.length + 
                     media.length + activities.length + safetyInspections.length + qualityChecks.length
      }
    };
  }
}

// Export factory instance and individual generators
const testDataFactory = new TestDataFactory();

module.exports = {
  TestDataFactory,
  testDataFactory,
  constructionFaker
};