require('dotenv').config();
const { sequelize } = require('../config/database');
const { User, Department, Service, Request, Payment, Notification } = require('../models');
const { generateRequestNumber, generateTransactionId, generateReceiptNumber } = require('../utils/helpers');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await sequelize.sync({ force: true });
    // console.log('✅ Database cleared');

    // Create Departments
    console.log('📁 Creating departments...');
    const departments = await Department.bulkCreate([
      {
        name: 'Department of Interior',
        code: 'DOI',
        description: 'Handles passport, national ID, and civil registration services'
      },
      {
        name: 'Department of Commerce',
        code: 'DOC',
        description: 'Manages business licenses and commercial registrations'
      },
      {
        name: 'Department of Health',
        code: 'DOH',
        description: 'Provides health certificates and medical records'
      },
      {
        name: 'Department of Transportation',
        code: 'DOT',
        description: 'Issues driver licenses and vehicle registrations'
      },
      {
        name: 'Department of Education',
        code: 'DOE',
        description: 'Handles academic certifications and transcripts'
      }
    ]);
    console.log(`✅ Created ${departments.length} departments`);

    // Create Admin User
    console.log('👤 Creating admin user...');
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@egovernment.gov',
      password: 'Admin123!',
      role: 'admin',
      phoneNumber: '+1-555-0001',
      isActive: true
    });
    console.log('✅ Admin user created (email: admin@egovernment.gov, password: Admin123!)');

    // Create Department Heads
    console.log('👥 Creating department heads...');
    const departmentHeads = [];
    for (let i = 0; i < departments.length; i++) {
      const head = await User.create({
        name: `${departments[i].name} Head`,
        email: `head.${departments[i].code.toLowerCase()}@egovernment.gov`,
        password: 'Head123!',
        role: 'department_head',
        departmentId: departments[i].id,
        jobTitle: 'Department Head',
        phoneNumber: `+1-555-010${i}`,
        isActive: true
      });
      departmentHeads.push(head);
    }
    console.log(`✅ Created ${departmentHeads.length} department heads`);

    // Create Officers
    console.log('👮 Creating officers...');
    const officers = [];
    for (let i = 0; i < departments.length; i++) {
      for (let j = 1; j <= 2; j++) {
        const officer = await User.create({
          name: `Officer ${j} - ${departments[i].code}`,
          email: `officer${j}.${departments[i].code.toLowerCase()}@egovernment.gov`,
          password: 'Officer123!',
          role: 'officer',
          departmentId: departments[i].id,
          jobTitle: 'Service Officer',
          phoneNumber: `+1-555-02${i}${j}`,
          isActive: true
        });
        officers.push(officer);
      }
    }
    console.log(`✅ Created ${officers.length} officers`);

    // Create Services
    console.log('🎫 Creating services...');
    const services = await Service.bulkCreate([
      // Department of Interior services
      {
        name: 'Passport Renewal',
        description: 'Renew your passport for international travel',
        departmentId: departments[0].id,
        fee: 110.00,
        processingTime: '10-15 business days',
        requiredDocuments: 'Current passport, 2 passport photos, proof of citizenship',
        isActive: true
      },
      {
        name: 'National ID Application',
        description: 'Apply for a new national identification card',
        departmentId: departments[0].id,
        fee: 25.00,
        processingTime: '5-7 business days',
        requiredDocuments: 'Birth certificate, proof of address, passport photo',
        isActive: true
      },
      // Department of Commerce services
      {
        name: 'Business License',
        description: 'Register and obtain a business license',
        departmentId: departments[1].id,
        fee: 250.00,
        processingTime: '15-20 business days',
        requiredDocuments: 'Business plan, tax ID, proof of address',
        isActive: true
      },
      {
        name: 'Trade Name Registration',
        description: 'Register your business trade name',
        departmentId: departments[1].id,
        fee: 100.00,
        processingTime: '7-10 business days',
        requiredDocuments: 'ID proof, business details',
        isActive: true
      },
      // Department of Health services
      {
        name: 'Health Certificate',
        description: 'Obtain a health certificate for employment or travel',
        departmentId: departments[2].id,
        fee: 50.00,
        processingTime: '3-5 business days',
        requiredDocuments: 'Medical examination results, ID proof',
        isActive: true
      },
      // Department of Transportation services
      {
        name: 'Driver License Renewal',
        description: 'Renew your driver license',
        departmentId: departments[3].id,
        fee: 75.00,
        processingTime: '5-7 business days',
        requiredDocuments: 'Current license, vision test, ID proof',
        isActive: true
      },
      {
        name: 'Vehicle Registration',
        description: 'Register a new or used vehicle',
        departmentId: departments[3].id,
        fee: 150.00,
        processingTime: '7-10 business days',
        requiredDocuments: 'Bill of sale, insurance proof, ID proof',
        isActive: true
      },
      // Department of Education services
      {
        name: 'Transcript Request',
        description: 'Request official academic transcripts',
        departmentId: departments[4].id,
        fee: 30.00,
        processingTime: '5-7 business days',
        requiredDocuments: 'Student ID, clearance form',
        isActive: true
      }
    ]);
    console.log(`✅ Created ${services.length} services`);

    // Create Sample Citizens
    console.log('👨‍👩‍👧‍👦 Creating sample citizens...');
    const citizens = await User.bulkCreate([
      {
        name: 'John Smith',
        email: 'john.smith@example.com',
        password: 'Citizen123!',
        role: 'citizen',
        nationalId: 'NID-2024-001',
        dateOfBirth: new Date('1990-05-15'),
        phoneNumber: '+1-555-1001',
        address: '123 Main St, City, State 12345',
        isActive: true
      },
      {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'Citizen123!',
        role: 'citizen',
        nationalId: 'NID-2024-002',
        dateOfBirth: new Date('1985-08-22'),
        phoneNumber: '+1-555-1002',
        address: '456 Oak Ave, City, State 12346',
        isActive: true
      },
      {
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        password: 'Citizen123!',
        role: 'citizen',
        nationalId: 'NID-2024-003',
        dateOfBirth: new Date('1992-11-30'),
        phoneNumber: '+1-555-1003',
        address: '789 Pine Rd, City, State 12347',
        isActive: true
      },
      {
        name: 'Alice Williams',
        email: 'alice.williams@example.com',
        password: 'Citizen123!',
        role: 'citizen',
        nationalId: 'NID-2024-004',
        dateOfBirth: new Date('1988-03-10'),
        phoneNumber: '+1-555-1004',
        address: '321 Elm St, City, State 12348',
        isActive: true
      },
      {
        name: 'Charlie Brown',
        email: 'charlie.brown@example.com',
        password: 'Citizen123!',
        role: 'citizen',
        nationalId: 'NID-2024-005',
        dateOfBirth: new Date('1995-07-18'),
        phoneNumber: '+1-555-1005',
        address: '654 Maple Dr, City, State 12349',
        isActive: true
      }
    ]);
    console.log(`✅ Created ${citizens.length} sample citizens`);

    // Create Sample Requests
    console.log('📝 Creating sample requests...');
    const requests = [];
    const statuses = ['submitted', 'under_review', 'approved', 'rejected', 'completed'];

    for (let i = 0; i < 15; i++) {
      const citizen = citizens[i % citizens.length];
      const service = services[i % services.length];
      const status = statuses[i % statuses.length];

      const request = await Request.create({
        requestNumber: generateRequestNumber(),
        userId: citizen.id,
        serviceId: service.id,
        status: status,
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        notes: `Sample request for ${service.name}`,
        reviewedBy: status !== 'submitted' ? officers[0].id : null,
        reviewComments: status === 'rejected' ? 'Missing required documents' : null,
        reviewedAt: status !== 'submitted' ? new Date() : null,
        completedAt: status === 'completed' ? new Date() : null
      });
      requests.push(request);
    }
    console.log(`✅ Created ${requests.length} sample requests`);

    // Create Sample Payments
    console.log('💳 Creating sample payments...');
    const payments = [];
    for (let i = 0; i < 10; i++) {
      const request = requests[i];
      const service = services.find(s => s.id === request.serviceId);

      const payment = await Payment.create({
        transactionId: generateTransactionId(),
        requestId: request.id,
        userId: request.userId,
        amount: service.fee,
        paymentMethod: ['credit_card', 'debit_card', 'bank_transfer'][Math.floor(Math.random() * 3)],
        paymentStatus: 'completed',
        paymentDate: new Date(),
        receiptNumber: generateReceiptNumber()
      });
      payments.push(payment);
    }
    console.log(`✅ Created ${payments.length} sample payments`);

    // Create Sample Notifications
    console.log('🔔 Creating sample notifications...');
    for (let citizen of citizens) {
      await Notification.create({
        userId: citizen.id,
        title: 'Welcome to E-Government Portal',
        message: 'Thank you for registering. You can now apply for government services online.',
        type: 'info',
        isRead: false
      });
    }
    console.log('✅ Created sample notifications');

    console.log('\n==============================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('==============================================\n');
    console.log('📋 Sample Credentials:');
    console.log('─────────────────────────────────────────────');
    console.log('Admin:');
    console.log('  Email: admin@egovernment.gov');
    console.log('  Password: Admin123!');
    console.log('');
    console.log('Department Head (DOI):');
    console.log('  Email: head.doi@egovernment.gov');
    console.log('  Password: Head123!');
    console.log('');
    console.log('Officer (DOI):');
    console.log('  Email: officer1.doi@egovernment.gov');
    console.log('  Password: Officer123!');
    console.log('');
    console.log('Citizen:');
    console.log('  Email: john.smith@example.com');
    console.log('  Password: Citizen123!');
    console.log('==============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
