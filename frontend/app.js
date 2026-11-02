// Realistic Synthetic UK Data Generator
const SURNAMES = ["SMITH", "JONES", "TAYLOR", "WILLIAMS", "BROWN", "DAVIES", "EVANS", "WILSON", "THOMAS", "JOHNSON"];
const FIRST_NAMES = ["Oliver", "George", "Harry", "Noah", "Jack", "Amelia", "Olivia", "Isla", "Emily", "Ava"];
const UK_REG_REGIONS = ["BD", "LD", "MD", "WN", "YK", "RA", "OX", "EX"];

function generateRandomDOB() {
  const start = new Date(1965, 0, 1);
  const end = new Date(2004, 11, 31);
  const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return randomDate.toISOString().split("T")[0]; // YYYY-MM-DD
}

function generateUKDrivingLicence(surname, firstName, dobString) {
  const [yearStr, monthStr, dayStr] = dobString.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // 1-5: First 5 letters of surname (padded with '9')
  let part1 = (surname.toUpperCase() + "99999").substring(0, 5);

  // 6: Decade digit of year (e.g. 1985 -> 8)
  let part2 = yearStr[2];

  // 7-8: Month of birth (01-12)
  let part3 = month.toString().padStart(2, "0");

  // 9-10: Day of birth (01-31)
  let part4 = day.toString().padStart(2, "0");

  // 11: Year digit (e.g. 1985 -> 5)
  let part5 = yearStr[3];

  // 12-13: Initials
  let initials = firstName.substring(0, 1).toUpperCase() + "9";

  // 14-16: Arbitrary security & check characters
  let part6 = "9AA";

  return `${part1}${part2}${part3}${part4}${part5}${initials}${part6}`;
}

function generateUKCarReg() {
  const region = UK_REG_REGIONS[Math.floor(Math.random() * UK_REG_REGIONS.length)];
  const yearCode = (Math.floor(Math.random() * 24) + 50).toString(); // e.g. 68, 71
  const letters = Array.from({ length: 3 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join("");
  return `${region}${yearCode} ${letters}`;
}

// "Generate for me" click event
document.getElementById("generate-btn").addEventListener("click", () => {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
  const dob = generateRandomDOB();

  const fullName = `${firstName} ${surname}`;
  const carReg = generateUKCarReg();
  const licence = generateUKDrivingLicence(surname, firstName, dob);

  document.getElementById("full_name").value = fullName;
  document.getElementById("dob").value = dob;
  document.getElementById("car_reg").value = carReg;
  document.getElementById("driving_licence").value = licence;
});

// Form Submission
document.getElementById("registration-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    full_name: document.getElementById("full_name").value,
    dob: document.getElementById("dob").value,
    car_reg: document.getElementById("car_reg").value,
    driving_licence: document.getElementById("driving_licence").value
  };

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    const statusBox = document.getElementById("status-message");
    statusBox.style.display = "block";
    statusBox.innerHTML = `<strong>Registration Status:</strong> ${result.status}<br><small>Record Saved. Check server logs to see raw PII exposure.</small>`;
  } catch (err) {
    alert("Error submitting registration: " + err);
  }
});

// Database Lookup (SQLi trigger test)
document.getElementById("lookup-btn").addEventListener("click", async () => {
  const reg = document.getElementById("lookup-reg").value;
  const res = await fetch(`/api/vehicles?reg=${encodeURIComponent(reg)}`);
  const data = await res.json();
  document.getElementById("lookup-result").innerText = JSON.stringify(data, null, 2);
});
