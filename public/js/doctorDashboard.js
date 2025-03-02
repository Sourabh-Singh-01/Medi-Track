// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    displayPatientsList();
});

// Display patients list
function displayPatientsList() {
    const patientsListElement = document.getElementById('patientsList');
    patientsListElement.innerHTML = '';

    patients.forEach(patient => {
        const patientElement = document.createElement('div');
        patientElement.className = 'patient-item';
        patientElement.innerHTML = `
            <h3>${patient.name}</h3>
            <p>ID: ${patient.id}</p>
            <p>Current Diagnosis: ${patient.diagnosis}</p>
        `;
        patientElement.onclick = () => displayMedicalHistory(patient);
        patientsListElement.appendChild(patientElement);
    });
}

// Display medical history for selected patient
function displayMedicalHistory(patient) {
    // Update diagnosis history
    document.getElementById('diagnosisHistory').innerHTML = `
        <p><strong>Current Diagnosis:</strong> ${patient.diagnosis}</p>
        <p><strong>History:</strong></p>
        <ul>${patient.history.map(h => `<li>${h}</li>`).join('')}</ul>
    `;

    // Update medications
    document.getElementById('medications').innerHTML = `
        <p><strong>Current Medications:</strong></p>
        <ul>${patient.medications.map(med => `<li>${med}</li>`).join('')}</ul>
    `;

    document.getElementById('Pmedications').innerHTML = `
    <p><strong>Current Medications:</strong></p>
    <ul>${patient.medications.map(med => `<li>${med}</li>`).join('')}</ul>
`;

    // Update lab results
    document.getElementById('labResults').innerHTML = `
        <p><strong>Recent Results:</strong></p>
        <ul>${patient.labResults.map(result => `<li>${result}</li>`).join('')}</ul>
    `;

    // Update allergies
    document.getElementById('allergies').innerHTML = `
        <p><strong>Known Allergies:</strong></p>
        <ul>${patient.allergies.map(allergy => `<li>${allergy}</li>`).join('')}</ul>
    `;
}
async function searchPatients() {
  const searchQuery = document.getElementById("patientSearch").value.trim();

  if (!searchQuery) {
      alert("Please enter a valid Aadhar ID.");
      return;
  }

  try {
      const response = await fetch(`/search-patients?q=${searchQuery}`);
      const data = await response.json();

      if (data.success && data.patient) {
          document.getElementById("patientsList").innerHTML = '';
          addPatientToList(data.patient); // Add patient to the recent list
      } else {
          alert("No patient found with this Aadhar ID.");
      }
  } catch (error) {
      console.error("Error fetching patient data:", error);
  }
}

// Function to add a patient to the "Recent Patients" list dynamically
function addPatientToList(patient) {
  const patientsListElement = document.getElementById("patientsList");
  // Remove "No recent patients found" text
  if (patientsListElement.innerHTML.includes("No recent patients found.")) {
      patientsListElement.innerHTML = "";
  }

  const patientElement = document.createElement("div");
  patientElement.className = "patient-card";
  patientElement.innerHTML = `
      <h3>${patient.Name}</h3>
      <p>Age: ${patient.Age}</p>
      <p>Gender: ${patient.Gender}</p>
      <p>Aadhar ID: ${patient.aadhar_id}</p>
      <button onclick="fetchPatientDetails('${patient.aadhar_id}')">View Details</button>
  `;
  
  patientsListElement.appendChild(patientElement);
}
async function fetchPatientDetails(aadharId) {
  try {
      const response = await fetch(`/get-patient-details?aadhar=${aadharId}`);
      const data = await response.json();

      if (data.success && data.patient) {
          displayMedicalHistory(data.patient,aadharId);
      } else {
          alert("Patient details not found.");
      }
  } catch (error) {
      console.error("Error fetching patient details:", error);
  }
}

// Function to display patient details in medical history
function displayMedicalHistory(patient,aadharId) {
    console.log(aadharId)
  document.getElementById("medicalHistory").innerHTML = `
      <h2>Patient Medical History</h2>
      <div class="history-content">
          <div class="history-section">
              <h3>Diagnosis History</h3>
              <ul>
                  ${patient.Diagnosis.map(d => 
                      `<li><strong>${d.condition}</strong> (Date: ${d.date}, Doctor: ${d.doctor}) - ${d.notes}</li>`
                  ).join("")}
              </ul>
          </div>
          <div class="history-section">
              <h3>Current Medications</h3>
              <ul>
                  ${patient.Current_Medication.map(med => 
                      `<li><strong>${med.Name}</strong> - ${med.Frequency}, ${med.Period} (${med.Instruction})</li>`
                  ).join("")}
              </ul>
          </div>
          <div class="history-section">
              <h3>Past Medications</h3>
              <ul>
                  ${patient.Past_Medication.map(med => 
                      `<li><strong>${med.Name}</strong> - ${med.Period}</li>`
                  ).join("")}
              </ul>
          </div>
          <div class="history-section">
              <h3>Lab Results</h3>
              <ul>
                  ${patient.Lab_Results.map(lab => 
                      `<li><strong>${lab.Type}</strong> (Date: ${lab.Date}) - Result: ${lab.Result}</li>`
                  ).join("")}
              </ul>
          </div>
          <div class="history-section">
              <h3>Allergies & Conditions</h3>
              <p>${patient.Medical_Information.Allergies || "No known allergies"}</p>
          </div>
      </div>
  `;

  if (!document.querySelector(".add-medication-form")) {
    
    const formElement = document.createElement("form");
    formElement.className = "add-medication-form";
    formElement.method = "POST"; 
    formElement.action = "/medicationform";
    
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.name = "aadharId";
    hiddenInput.value = aadharId; 
    
    const addMedicationButton = document.createElement("button");
    addMedicationButton.className = "add-medication-btn";
    addMedicationButton.textContent = "Add New Medication";
    
    formElement.appendChild(hiddenInput);
    formElement.appendChild(addMedicationButton);
    document.getElementById("medicalHistory").appendChild(formElement);
}
}
// Show add patient form (placeholder function)
function showAddPatientForm() {
    alert('Add Patient functionality would be implemented here');
}
