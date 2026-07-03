import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8001;

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

/* --------------------------------------------------
   SIMPLE EXPLANATION CACHE
-------------------------------------------------- */

const explanationCache = new Map();

const EXAM_CONFIGS = {
    "NEET UG": {
        subjects: "Physics, Chemistry, Biology (Botany and Zoology)",
        banned: "Mathematics, Computer Science"
    },
    "NEET PG": {
        subjects: "Anatomy, Physiology, Biochemistry, Pharmacology, Pathology, Microbiology, Medicine, Surgery, Pediatrics, OBG, ENT, Ophthalmology"
    },
    "JEE Main": {
        subjects: "Physics, Chemistry, Mathematics"
    },
    "JEE Advanced": {
        subjects: "Physics, Chemistry, Mathematics"
    },
    "KCET": {
        subjects: "Physics, Chemistry, Mathematics, Biology"
    },
    "UPSC": {
        subjects: "History, Geography, Polity, Economy, Environment, Current Affairs"
    }
};

function buildExamPrompt(exam){
 const config = EXAM_CONFIGS[exam];
 if(!config) return `Generate EXACTLY 15 multiple choice questions for ${exam}.`;
 return `Generate EXACTLY 15 multiple choice questions for ${exam}.
 Subjects: ${config.subjects}
 ${config.banned ? `Forbidden Subjects: ${config.banned}` : ""}
 Use only the actual syllabus of the exam.`;
}


/* --------------------------------------------------
   TRUSTED EDUCATIONAL RESOURCES
-------------------------------------------------- */

function getEducationalResources(topic = "") {

    const t = topic.toLowerCase();

    if (
        t.includes("physics") ||
        t.includes("electric") ||
        t.includes("motion") ||
        t.includes("force")
    ) {

        return [
            {
                title: "Khan Academy Physics",
                url: "https://www.khanacademy.org/science/physics"
            },
            {
                title: "Britannica Physics",
                url: "https://www.britannica.com/science/physics-science"
            }
        ];
    }

    if (
        t.includes("chemistry") ||
        t.includes("reaction") ||
        t.includes("atom")
    ) {

        return [
            {
                title: "Khan Academy Chemistry",
                url: "https://www.khanacademy.org/science/chemistry"
            },
            {
                title: "Britannica Chemistry",
                url: "https://www.britannica.com/science/chemistry"
            }
        ];
    }

    if (
        t.includes("biology") ||
        t.includes("cell") ||
        t.includes("photosynthesis")
    ) {

        return [
            {
                title: "Khan Academy Biology",
                url: "https://www.khanacademy.org/science/biology"
            },
            {
                title: "Britannica Biology",
                url: "https://www.britannica.com/science/biology"
            }
        ];
    }

    if (
        t.includes("computer") ||
        t.includes("algorithm") ||
        t.includes("programming")
    ) {

        return [
            {
                title: "GeeksforGeeks",
                url: "https://www.geeksforgeeks.org"
            },
            {
                title: "MIT OpenCourseWare",
                url: "https://ocw.mit.edu"
            }
        ];
    }

    return [
        {
            title: "Britannica",
            url: "https://www.britannica.com"
        },
        {
            title: "Khan Academy",
            url: "https://www.khanacademy.org"
        }
    ];
}

/* --------------------------------------------------
   HEALTH CHECK
-------------------------------------------------- */

app.get("/", (req, res) => {

    res.json({
        success: true,
        provider: "Google Gemini",
        model: "gemini-2.5-flash",
        message: "Gen-S Quiz API Running"
    });

});

/* --------------------------------------------------
   GENERATE QUIZ (FAST MODE)
-------------------------------------------------- */

app.post("/api/generate-quiz", async (req, res) => {

    try {

        const { exam } = req.body;

        const prompt = `
Generate EXACTLY 15 multiple choice questions for ${exam}.

Return JSON only.

{
 "questions":[
  {
   "question":"...",
   "options":["A","B","C","D"],
   "answer":"exact correct option text",
   "explanation":"detailed explanation",
   "correctReason":"why correct answer is right",
   "wrongReason":"common mistake leading to wrong answer"
  }
 ]
}
`;

        const result =
        await ai.models.generateContent({

            model: "gemini-2.5-flash",

            contents: prompt

        });

        let content =
        result.text.trim();

        content = content
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const firstBrace =
        content.indexOf("{");

        const lastBrace =
        content.lastIndexOf("}");

        content =
        content.substring(
            firstBrace,
            lastBrace + 1
        );

        const parsed =
        JSON.parse(content);

        return res.json({

            success: true,

            exam,

            totalQuestions:
            parsed.questions.length,

            questions:
            parsed.questions

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message:
            "Quiz generation failed",

            error:
            error.message

        });

    }

});

/* --------------------------------------------------
   GENERATE EXPLANATION ON DEMAND
-------------------------------------------------- */

app.post("/api/explanation", async (req, res) => {

    try {

        const {
            question,
            answer,
            exam
        } = req.body;

        const cacheKey =
        `${question}_${answer}`;

        if (
            explanationCache.has(cacheKey)
        ) {

            return res.json(
                explanationCache.get(cacheKey)
            );
        }

        const prompt = `
Explain this exam question.

Exam:
${exam}

Question:
${question}

Correct Answer:
${answer}

Requirements:

1. Beginner friendly.
2. Educational.
3. 150 words maximum.
4. Mention why answer is correct.
5. Mention key concept.
6. Return plain text only.
`;

        const result =
        await ai.models.generateContent({

            model: "gemini-2.5-flash",

            contents: prompt

        });

        const explanation =
        result.text.trim();

        const response = {

            success: true,

            explanation,

            references:
            getEducationalResources(
                question
            )

        };

        explanationCache.set(
            cacheKey,
            response
        );

        return res.json(response);

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message:
            "Explanation generation failed",

            error:
            error.message

        });

    }

});

/* --------------------------------------------------
   START SERVER
-------------------------------------------------- */

app.listen(PORT, () => {

    console.log(
        `🚀 Gen-S Quiz Gemini API running on port ${PORT}`
    );

});

// V6 NOTE: Quiz generation should include explanation, references and subject metadata in each question.
