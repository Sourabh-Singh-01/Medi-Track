    const express = require('express');
    const path = require('path');
    const app = express();
    const mysql = require("mysql2");
    const mongoose = require('mongoose');
    const Patient = require("./models/patient.js");
    const Doctor = require("./models/doctor.js");
    const { faker } = require("@faker-js/faker");
    require("dotenv").config();
    const axios = require("axios");
    const port = 3000;
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyCX9tnj1VcajxvIeJbmLcm4UtmyXLBJg4E`;

    async function main() {
        await mongoose.connect('mongodb://127.0.0.1:27017/mediTrack');
    }
    main()
        .then(()=>{
            console.log("Mongo Connection Successful")
        })
        .catch((err)=>{
            console.log(err)
        })

    app.set("view engine","ejs");
    app.set("views",path.join(__dirname,"/views"))
    app.use(express.json());
    app.use(express.urlencoded({extended : true}));
    app.use(express.static(path.join(__dirname,"public")));
    
    app.get("/",(req,res)=>{
        res.sendFile(path.join(__dirname,'public','home.html'))
    });

    // Adding User
    app.get("/signup/new",(req,res)=>{
        res.sendFile(path.join(__dirname,'public','Signup.html'))
    })
    app.post("/signup",(req,res)=>{
        // console.log(req.body);
        // console.log(req.body.p_allergies);
        let {user_type} = req.body;
        console.log(user_type);
        if(user_type == "patient"){
            let user = req.body;
            let newPatient = new Patient({
                Patient : {
                    Name : user.patient_name,
                    Age : user.patient_age,
                    Gender : user.patient_gender,
                    aadhar_id : user.aadhar_id,
                    password : user.patient_confirm_password,
                    email : user.patient_email    
                },
                Emergency_Contact : {
                    name : user.emergency_name,
                    Relationship : user.emergency_relation,
                    Phone : user.emergency_contact
                },
                Medical_Information : {
                    Blood_Group : user.blood_group,
                    Allergies :  user.p_allergies
                }
            })
            newPatient.save()
                .then((res)=>{
                    console.log(res)
                })
                .catch((err)=>{
                    console.log(err)
                })
        }
        else if(user_type == "doctor"){
            let {d_id,d_full_name,hospital_name,d_email,d_password} = req.body;
            let newDoctor = new Doctor({
                d_id : d_id,
                d_full_name : d_full_name,
                hospital_name : hospital_name,
                d_email : d_email,
                d_password : d_password
            })
            newDoctor.save()
                .then((res)=>{
                    console.log(res);
                })
                .catch((err)=>{
                    console.log(err);
                })
        }
    })

    // Login 
    app.get("/login",(req,res)=>{
        res.sendFile(path.join(__dirname,'public','login.html'))
    })

    app.post("/login", async (req, res) => {
        // console.log(req.body)
        let { user_type } = req.body;
        if (user_type == 'patient') {
            try{
                let { aadhar_id,p_password } = req.body;
                const patientData = await Patient.findOne({"Patient.aadhar_id" : aadhar_id});
                if (!patientData) {
                    console.log("No MongoDB data found for this patient");
                    res.sendFile(path.join(__dirname,'public','Error.html'))
                }
                else if (patientData.Patient.password == p_password) {
                        const templateData = {
                            patient: {
                                name: patientData?.Patient?.Name || data.p_full_name,
                                age: patientData?.Patient?.Age || "Not specified",
                                gender: patientData?.Patient?.Gender || "Not specified",
                                aadhar_id : patientData?.Patient?.aadhar_id,
                                blood_group: patientData?.Medical_Information?.Blood_Group || "Not specified",
                                allergies: patientData?.Medical_Information?.Allergies ? 
                                            [patientData.Medical_Information.Allergies] : [],
                                emergency_contact: {
                                    name: patientData?.Emergency_Contact?.name || "Not specified",
                                    relationship: patientData?.Emergency_Contact?.Relationship || "Not specified",
                                    phone: patientData?.Emergency_Contact?.Phone || "Not specified"
                                }
                            },
                            currentMedications: patientData?.Current_Medication && patientData.Current_Medication.length > 0 
                            ? patientData.Current_Medication.map(med => ({
                                name: med.Name || "Not specified",
                                dosage: med.Instruction || "As prescribed",
                                frequency: med.Frequency || "Not specified",
                                period: med.Period || "Not specified"
                            }))
                            : [],
                            pastMedications: patientData?.Past_Medication && patientData.Past_Medication.length > 0 
                                ? patientData.Past_Medication.map(med => ({
                                    name: med.Name || "Not specified",
                                    period: med.Period || "Not specified",
                            }))
                            : [],                            
                            labResults: patientData?.Lab_Results && patientData.Lab_Results.length > 0
                                ? patientData.Lab_Results.map(result => ({
                                    testName: result.Type || "Not specified",
                                    date: result.Date || "Not specified",
                                    value: result.Result || "Not specified",
                                    unit: "",
                                    status: "Completed"
                                }))
                                : [],
                                diagnoses: patientData?.Diagnosis && patientData.Diagnosis.length > 0
                                ? patientData.Diagnosis.map(condition => ({
                                    condition: condition.condition || "Not specified",
                                    date: condition.date || "Date not specified",
                                    doctor: condition.doctor || "Doctor information not available",
                                    notes: condition.notes || "Additional notes not available"
                                }))
                                : [],
                        };
                        res.render("newpatientDashboard.ejs", templateData);
                }
            }catch(err){
                console.log(err)
            };
            
        } else if (user_type == 'doctor') {
            try{
                let data = req.body;
                const doctorData = await Doctor.findOne({"d_email" : data.d_email })
                if (!doctorData) {
                    console.log("No MongoDB data found for this patient");
                    res.sendFile(path.join(__dirname,'public','Error.html'))
                }
                else if(data.d_password == doctorData.d_password){
                    // res.render("doctorDashboard.ejs",{doctorData},{patients:[]});
                    res.render("doctorDashboard", { doctorData, patients: [], selectedPatient: null });
                }
            }catch(err){
                console.log(err);
            };
        }   
    });
    app.get("/dashboard",(req,res)=>{
        res.send("Working")
    })
    // Handle Search 
    app.get('/search-patients', async (req, res) => {
        const { q } = req.query;
    
        if (!q) {
            return res.json({ success: false, message: "Aadhar ID is required." });
        }
    
        try {
            const patient = await Patient.findOne({ "Patient.aadhar_id": q });
    
            if (patient) {
                return res.json({ success: true, patient: patient.Patient });
            } else {
                return res.json({ success: false, message: "Patient not found." });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: "Server error." });
        }
    });
    app.get('/get-patient-details', async (req, res) => {
        const { aadhar } = req.query;
    
        if (!aadhar) {
            return res.json({ success: false, message: "Aadhar ID is required." });
        }
    
        try {
            const patient = await Patient.findOne({ "Patient.aadhar_id": aadhar });
    
            if (patient) {
                return res.json({ success: true, patient });
            } else {
                return res.json({ success: false, message: "Patient details not found." });
            }
        } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: "Server error." });
        }
    });
    
    //add medication 
    app.post('/medicationform', (req, res) => {
        const aadharId = req.body.aadharId; // Get Aadhar ID from hidden input
        res.render('addMedicine.ejs',{aadharId});
    });

    app.post("/addmedication", async (req, res) => {
        if (!req.body.aadharId) {
            return res.status(400).json({ message: "Aadhar ID is missing!" });
        }
        try {
            const { aadharId, medicineName, frequency, duration, specialInstructions } = req.body;
            const patient = await Patient.updateOne(
                { "Patient.aadhar_id": aadharId },
                {
                    $push: {
                        "Current_Medication": {
                            Name: medicineName,
                            Frequency: frequency,
                            Period: duration,
                            Instruction: specialInstructions || "",
                        }
                    }
                }
            );
    
            if (patient.modifiedCount === 0) {
                return res.status(404).json({ message: "Patient not found!" });
            }
    
            res.status(200).json({ message: "Medication added successfully!" });
    
        } catch (err) {
            console.error("Error updating medication:", err);
            res.status(500).json({ message: "Internal server error" });
        }
    });
    
    // app.get("/get-ai-suggestion", async (req, res) => {
    //     console.log(req.body)
    //     try {
    //         console.log("AI Suggestion request received"); // Debugging log
    
    //         const aiSuggestion = await getGeminiResponse("Provide a health recommendation based on patient records.");
            
    //         if (!aiSuggestion) {
    //             return res.status(500).json({ error: "No AI suggestion available." });
    //         }
    
    //         console.log("AI Response:", aiSuggestion); // Debugging log
    //         res.json({ suggestion: aiSuggestion });
    
    //     } catch (error) {
    //         console.error("Error fetching AI response:", error);
    //         res.status(500).json({ error: "Failed to fetch AI suggestions." });
    //     }
    // });
    
    
    // async function getGeminiResponse(patientData) {
    //     const prompt = `
    //     Based on this medical information, provide health tips and dietary recommendations under 100 words.`;
    
    //     try {
    //         const response = await axios.post(
    //             GEMINI_URL,
    //             { contents: [{ parts: [{ text: prompt }] }] },
    //             { headers: { "Content-Type": "application/json" } }
    //         );
    
    //         return response.data.candidates[0].content.parts[0].text;
    //     } catch (error) {
    //         console.error("Error calling Gemini API:", error);
    //     }
    // }
    app.get("/get-ai-suggestion", async (req, res) => {
        const { aadharId } = req.query;
    
        if (!aadharId) {
            return res.status(400).json({ error: "Aadhar ID is required." });
        }
    
        try {
            const patient = await Patient.findOne({ "Patient.aadhar_id": aadharId });
    
            if (!patient) {
                return res.status(404).json({ error: "Patient not found." });
            }
    
            // Prepare AI prompt using patient data
            const patientInfo = `
                Name: ${patient.Patient.Name},
                Age: ${patient.Patient.Age},
                Gender: ${patient.Patient.Gender},
                Blood Group: ${patient.Medical_Information.Blood_Group},
                Allergies: ${patient.Medical_Information.Allergies || "None"},
                Current Medications: ${patient.Current_Medication.map(med => med.Name).join(", ") || "None"},
                Diagnoses: ${patient.Diagnosis.map(d => d.condition).join(", ") || "None"}
            `;
    
            const aiSuggestion = await getGeminiResponse(patientInfo);
    
            if (!aiSuggestion) {
                return res.status(500).json({ error: "No AI suggestion available." });
            }
    
            res.json({ suggestion: aiSuggestion });
    
        } catch (error) {
            console.error("Error fetching AI response:", error);
            res.status(500).json({ error: "Failed to fetch AI suggestions." });
        }
    });
    
    async function getGeminiResponse(patientData) {
        const prompt = `Based on this medical information, provide a personalized health recommendation under 100 words,also suggest some exercises:\n${patientData}`;
    
        try {
            const response = await axios.post(
                GEMINI_URL,
                { contents: [{ parts: [{ text: prompt }] }] },
                { headers: { "Content-Type": "application/json" } }
            );
    
            return response.data.candidates[0]?.content.parts[0]?.text || "No response from AI.";
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            return "AI service unavailable.";
        }
    }
    app.get("/aboutus",(req,res)=>{
        res.sendFile(path.join(__dirname,'public','About.html'));
    })

    app.listen(port,()=>{
        console.log(`Server is Running at http://localhost:3000/`);
    })