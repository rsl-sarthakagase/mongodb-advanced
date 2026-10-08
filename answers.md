# MongoDB Advanced Assignment - Answers

## Task 5.2 - explain("executionStats")

### Query Used

```javascript
db.employees
  .find({ departmentId: 10 })
  .sort({ name: 1 })
  .explain("executionStats")
```

### Execution Statistics

| Metric | Value |
|---|---:|
| Winning Plan Stage | IXSCAN |
| nReturned | 2 |
| totalDocsExamined | 2 |
| totalKeysExamined | 2 |

---

# MongoDB Advanced Assignment — MCQ Answers

Q1  - B
Q2  - B
Q3  - C
Q4  - A
Q5  - C
Q6  - B
Q7  - C
Q8  - B
Q9  - C
Q10 - B
Q11 - A
Q12 - C