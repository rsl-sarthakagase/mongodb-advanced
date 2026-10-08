// ============================================================
// TASK 1: Schema Validation and Data Creation
// ============================================================

// Use a fresh database
    use("company_advanced");

// ------------------------------------------------------------
// Step 1: Create employees collection with JSON Schema validation
// ------------------------------------------------------------

db.createCollection("employees", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "name",
        "departmentId",
        "experience",
        "active"
      ],
      properties: {
        name: {
          bsonType: "string"
        },
        departmentId: {
          bsonType: "int"
        },
        experience: {
          bsonType: "int"
        },
        active: {
          bsonType: "bool"
        }
      }
    }
  }
});

// ------------------------------------------------------------
// Step 2: Insert starting employee dataset
// ------------------------------------------------------------

db.employees.insertMany([
  {
    _id: 1,
    name: "John",
    departmentId: 10,
    skills: ["Java", "MongoDB"],
    experience: 4,
    active: true,
    certifications: [
      {
        name: "MongoDB",
        status: "Expired",
        expiryYear: 2026
      }
    ]
  },
  {
    _id: 2,
    name: "Alice",
    departmentId: 10,
    skills: ["Python", "MongoDB"],
    experience: 6,
    active: true,
    certifications: [
      {
        name: "MongoDB",
        status: "Active",
        expiryYear: 2028
      }
    ]
  },
  {
    _id: 3,
    name: "David",
    departmentId: 20,
    skills: ["Communication"],
    experience: 3,
    active: false,
    certifications: [
      {
        name: "Communication",
        status: "Active",
        expiryYear: 2027
      }
    ]
  }
]);

// Verify starting employee count
print("Initial employee count:");
print(db.employees.countDocuments());

// ------------------------------------------------------------
// Step 3: Test schema validation
// ------------------------------------------------------------

try {
  db.employees.insertOne({
    _id: 99,
    name: 123,
    departmentId: "HR",
    experience: "one",
    active: "yes"
  });
} catch (error) {
  print("Invalid document rejected as expected.");
  print(error.message);
}

// Verify that invalid document was not inserted
print("Employee count after invalid insert attempt:");
print(db.employees.countDocuments());


// ============================================================
// TASK 2: Advanced Array Queries and Updates
// ============================================================

// ------------------------------------------------------------
// Task 2.1: Find one matching array object using $elemMatch
// Find employees having a certification where BOTH:
// name = MongoDB
// status = Active
// ------------------------------------------------------------

print("Employees with active MongoDB certification:");

db.employees.find({
  certifications: {
    $elemMatch: {
      name: "MongoDB",
      status: "Active"
    }
  }
}).forEach(printjson);


// ------------------------------------------------------------
// Task 2.2: Update one matching array element
// Change John's MongoDB certification from Expired to Active
// using the positional $ operator.
// ------------------------------------------------------------

db.employees.updateOne(
  {
    _id: 1,
    "certifications.name": "MongoDB"
  },
  {
    $set: {
      "certifications.$.status": "Active"
    }
  }
);

// Verify John's certification
print("John after positional array update:");

db.employees.findOne(
  { _id: 1 },
  { _id: 0, name: 1, certifications: 1 }
);


// ------------------------------------------------------------
// Task 2.3: Update selected array elements using arrayFilters
// Change certification status to Renewal Due when expiryYear < 2027.
// ------------------------------------------------------------

db.employees.updateOne(
  { _id: 1 },
  {
    $set: {
      "certifications.$[c].status": "Renewal Due"
    }
  },
  {
    arrayFilters: [
      {
        "c.expiryYear": {
          $lt: 2027
        }
      }
    ]
  }
);

// Verify John's final certification
print("John after arrayFilters update:");

db.employees.findOne(
  { _id: 1 },
  { _id: 0, name: 1, certifications: 1 }
);


// Verify Alice's certification remains Active
print("Alice certification:");

db.employees.findOne(
  { _id: 2 },
  { _id: 0, name: 1, certifications: 1 }
);


// ============================================================
// TASK 3: Bulk Write Operations
// ============================================================

// Perform all three operations using one bulkWrite() call:
//
// 1. Increase John's experience by 1
// 2. Set Alice's active value to false
// 3. Insert Emma
// ------------------------------------------------------------

db.employees.bulkWrite([
  {
    updateOne: {
      filter: {
        name: "John"
      },
      update: {
        $inc: {
          experience: 1
        }
      }
    }
  },
  {
    updateOne: {
      filter: {
        name: "Alice"
      },
      update: {
        $set: {
          active: false
        }
      }
    }
  },
  {
    insertOne: {
      document: {
        _id: 4,
        name: "Emma",
        departmentId: 20,
        skills: ["Excel"],
        experience: 2,
        active: true,
        certifications: [
          {
            name: "Excel",
            status: "Active",
            expiryYear: 2026
          }
        ]
      }
    }
  }
]);


// ------------------------------------------------------------
// Verify final state
// ------------------------------------------------------------

print("John final state:");

db.employees.findOne(
  { _id: 1 },
  { _id: 0, name: 1, experience: 1 }
);

print("Alice final state:");

db.employees.findOne(
  { _id: 2 },
  { _id: 0, name: 1, active: 1 }
);

print("Final employee count:");
print(db.employees.countDocuments());


// ============================================================
// TASK 4: Advanced Aggregation
// ============================================================

// ------------------------------------------------------------
// Task 4.1: Create departments collection
// ------------------------------------------------------------

db.createCollection("departments");

db.departments.insertMany([
  {
    _id: 10,
    name: "Engineering"
  },
  {
    _id: 20,
    name: "HR"
  }
]);


// ------------------------------------------------------------
// Task 4.2: Join Employees with Departments
//
// $lookup:
// employees.departmentId -> departments._id
//
// $unwind:
// Convert department array into a single object.
//
// Return:
// employee name
// departmentName
//
// Sort employee name ascending.
// ------------------------------------------------------------

print("Employees with department names:");

db.employees.aggregate([
  {
    $lookup: {
      from: "departments",
      localField: "departmentId",
      foreignField: "_id",
      as: "department"
    }
  },
  {
    $unwind: "$department"
  },
  {
    $project: {
      _id: 0,
      name: 1,
      departmentName: "$department.name"
    }
  },
  {
    $sort: {
      name: 1
    }
  }
]).forEach(printjson);


// ------------------------------------------------------------
// Task 4.3: Count Employees for Each Skill
//
// $unwind skills
// $group by skill
// count employees
// sort count descending
// for equal counts, skill ascending
// ------------------------------------------------------------

print("Employee count for each skill:");

db.employees.aggregate([
  {
    $unwind: "$skills"
  },
  {
    $group: {
      _id: "$skills",
      employeeCount: {
        $sum: 1
      }
    }
  },
  {
    $sort: {
      employeeCount: -1,
      _id: 1
    }
  }
]).forEach(printjson);


// ------------------------------------------------------------
// Task 4.4: Return Active Employees and Active Count
//
// Use $facet to return:
// 1. Active employee names
// 2. Total active employee count
// ------------------------------------------------------------

print("Active employees and total active employee count:");

db.employees.aggregate([
  {
    $match: {
      active: true
    }
  },
  {
    $facet: {
      results: [
        {
          $project: {
            _id: 0,
            name: 1
          }
        },
        {
          $sort: {
            name: 1
          }
        }
      ],
      summary: [
        {
          $count: "activeEmployees"
        }
      ]
    }
  }
]).forEach(printjson);


// ============================================================
// TASK 5: Indexing and Query Performance
// ============================================================

// ------------------------------------------------------------
// Task 5.1: Create Compound Index
//
// Required:
// departmentId ascending
// name ascending
//
// Required index name:
// departmentId_1_name_1
// ------------------------------------------------------------

db.employees.createIndex(
  {
    departmentId: 1,
    name: 1
  },
  {
    name: "departmentId_1_name_1"
  }
);


// Verify indexes
print("Employee indexes:");

db.employees.getIndexes().forEach(printjson);


// ------------------------------------------------------------
// Task 5.2: explain("executionStats")
//
// Required query:
// find departmentId = 10
// sort name ascending
// ------------------------------------------------------------

print("Execution statistics:");

db.employees
  .find({
    departmentId: 10
  })
  .sort({
    name: 1
  })
  .explain("executionStats");


// ------------------------------------------------------------
// Task 5.3: Create TTL Index
// ------------------------------------------------------------

// Create sessions collection
db.createCollection("sessions");

// Insert session document
db.sessions.insertOne({
  _id: 1,
  userName: "John",
  expiresAt: new Date(Date.now() + 600000)
});

// Create TTL index
db.sessions.createIndex(
  {
    expiresAt: 1
  },
  {
    expireAfterSeconds: 0,
    name: "expiresAt_1"
  }
);

// Verify TTL index
print("Session indexes:");

db.sessions.getIndexes().forEach(printjson);

// Verify session document
print("Session document:");

db.sessions.find().forEach(printjson);


// ============================================================
// END OF TASKS 1-5
// ============================================================

// Useful final verification
print("Final employees:");
db.employees.find().sort({ _id: 1 }).forEach(printjson);

print("Employee count:");
print(db.employees.countDocuments());

print("Departments:");
db.departments.find().sort({ _id: 1 }).forEach(printjson);