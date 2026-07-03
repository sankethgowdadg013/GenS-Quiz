const streams = {
    Engineering: [
        "KCET",
        "JEE Main",
        "JEE Advanced",
        "COMEDK",
        "GATE","BITSAT","VITEEE","SRMJEEE"
    ],

    Medical: [
        "NEET UG",
        "AIIMS","NEET PG","JIPMER"
    ],

    PublicService: [
        "UPSC",
        "KPSC",
        "SSC CGL"
    ],

    Police: [
        "SI",
        "Constable"
    ],

    Banking: [
        "IBPS PO",
        "SBI PO",
        "RRB Banking"
    ],

    Railway: [
        "RRB NTPC",
        "RRB Group D"
    ],

    Defence: [
        "NDA",
        "CDS",
        "AFCAT"
    ],

    Teaching: [
        "CTET",
        "KSET"
    ],

    Law: [
        "CLAT","AILET"
    ]
};

/* -----------------------------
   GLOBAL VARIABLES
------------------------------ */

let questions = [];
let userAnswers = [];

let currentQuestion = 0;
let score = 0;

let timer = 30;
let interval = null;

let selectedExam = "";

/* -----------------------------
   SCREENS
------------------------------ */

const landingScreen =
document.getElementById("landing-screen");

const streamScreen =
document.getElementById("stream-screen");

const examScreen =
document.getElementById("exam-screen");

const loadingScreen =
document.getElementById("loading-screen");

const quizScreen =
document.getElementById("quiz-screen");

const resultScreen =
document.getElementById("result-screen");

/* -----------------------------
   ELEMENTS
------------------------------ */

const streamButtons =
document.getElementById("stream-buttons");

const examButtons =
document.getElementById("exam-buttons");

const selectedStreamTitle =
document.getElementById("selected-stream-title");

const questionEl =
document.getElementById("question");

const answersEl =
document.getElementById("answer-buttons");

const timerEl =
document.getElementById("timer");

const progressEl =
document.getElementById("timer-progress");

const scoreDisplay =
document.getElementById("score-display");

const questionCounter =
document.getElementById("question-counter");

const examName =
document.getElementById("exam-name");

const modal =
document.getElementById("modal");

const explanationText =
document.getElementById("explanation-text");

/* -----------------------------
   LANDING
------------------------------ */

document
.getElementById("get-started-btn")
.addEventListener("click", () => {

    landingScreen.classList.remove("active");

    streamScreen.classList.add("active");
});

/* -----------------------------
   LOAD STREAMS
------------------------------ */

function loadStreams() {

    streamButtons.innerHTML = "";

    Object.keys(streams).forEach(stream => {

        const btn =
        document.createElement("button");

        btn.className = "stream-btn";

        btn.textContent = stream;

        btn.onclick = () =>
        showExams(stream);

        streamButtons.appendChild(btn);
    });
}

loadStreams();

/* -----------------------------
   SHOW EXAMS
------------------------------ */

function showExams(stream) {

    streamScreen.classList.remove("active");

    examScreen.classList.add("active");

    selectedStreamTitle.textContent =
    `${stream} Exams`;

    examButtons.innerHTML = "";

    streams[stream].forEach(exam => {

        const btn =
        document.createElement("button");

        btn.className = "exam-btn";

        btn.textContent = exam;

        btn.onclick = () =>
        generateQuiz(exam);

        examButtons.appendChild(btn);
    });
}

/* -----------------------------
   GENERATE QUIZ FROM BACKEND
------------------------------ */

async function generateQuiz(exam) {

    selectedExam = exam;

    examScreen.classList.remove("active");

    loadingScreen.classList.add("active");

    document
    .getElementById("loading-text")
    .textContent =
    `Generating 15 ${exam} Questions...`;

    try {

        const response =
        await fetch(
            "http://https://gens-quiz-backend.onrender.com/api/generate-quiz",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                    "application/json"
                },

                body: JSON.stringify({
                    exam
                })
            }
        );

        const data =
        await response.json();

        questions =
        data.questions;

        userAnswers = [];

        score = 0;

        currentQuestion = 0;

        loadingScreen.classList.remove(
            "active"
        );

        quizScreen.classList.add(
            "active"
        );

        examName.textContent =
        selectedExam;

        scoreDisplay.textContent =
        "Score : 0";

        loadQuestion();

    } catch (error) {

        console.error(error);

        alert(
            "Failed to generate quiz. Check backend server."
        );

        loadingScreen.classList.remove(
            "active"
        );

        examScreen.classList.add(
            "active"
        );
    }
}

/* -----------------------------
   LOAD QUESTION
------------------------------ */

function loadQuestion() {

    clearInterval(interval);

    timer = 30;

    startTimer();

    const q =
    questions[currentQuestion];

    questionCounter.textContent =
    `Question ${currentQuestion + 1} / 15`;

    questionEl.textContent =
    q.question;

    answersEl.innerHTML = "";

    q.options.forEach(option => {

        const btn =
        document.createElement("button");

        btn.className =
        "answer-btn";

        btn.textContent =
        option;

        btn.onclick = () =>
        checkAnswer(btn, option);

        answersEl.appendChild(btn);
    });
}

/* -----------------------------
   CHECK ANSWER
------------------------------ */

function checkAnswer(
    clickedButton,
    selectedOption
) {

    clearInterval(interval);

    const q =
    questions[currentQuestion];

    const correct =
    q.answer;

    document
    .querySelectorAll(".answer-btn")
    .forEach(btn => {

        btn.disabled = true;

        if (
            btn.textContent === correct
        ) {

            btn.classList.add(
                "correct"
            );
        }
    });

    let isCorrect = false;

    if (
        selectedOption === correct
    ) {

        clickedButton.classList.add(
            "correct"
        );

        score++;

        isCorrect = true;

        scoreDisplay.textContent =
        `Score : ${score}`;

    } else {

        clickedButton.classList.add(
            "wrong"
        );
    }

    userAnswers.push({

        question:
        q.question,

        selected:
        selectedOption,

        correct:
        correct,

        explanation:
        q.explanation,

        isCorrect
    });
}

/* -----------------------------
   TIMER
------------------------------ */

function startTimer() {

    timerEl.textContent =
    "30s";

    progressEl.style.width =
    "100%";

    interval =
    setInterval(() => {

        timer--;

        timerEl.textContent =
        `${timer}s`;

        progressEl.style.width =
        `${(timer / 30) * 100}%`;

        if (timer <= 0) {

            clearInterval(interval);

            revealCorrectAnswer();

            userAnswers.push({

                question:
                questions[currentQuestion]
                .question,

                selected:
                "Not Answered",

                correct:
                questions[currentQuestion]
                .answer,

                explanation:
                questions[currentQuestion]
                .explanation,

                isCorrect:false
            });
        }

    }, 1000);
}

/* -----------------------------
   REVEAL CORRECT ANSWER
------------------------------ */

function revealCorrectAnswer() {

    const q =
    questions[currentQuestion];

    document
    .querySelectorAll(".answer-btn")
    .forEach(btn => {

        btn.disabled = true;

        if (
            btn.textContent === q.answer
        ) {

            btn.classList.add(
                "correct"
            );
        }
    });
}

/* -----------------------------
   NEXT
------------------------------ */

document
.getElementById("next-btn")
.addEventListener("click", () => {

    currentQuestion++;

    if (
        currentQuestion >=
        questions.length
    ) {

        showResults();

        return;
    }

    loadQuestion();
});

/* -----------------------------
   SKIP
------------------------------ */

document
.getElementById("skip-btn")
.addEventListener("click", () => {

    userAnswers.push({

        question:
        questions[currentQuestion]
        .question,

        selected:
        "Skipped",

        correct:
        questions[currentQuestion]
        .answer,

        explanation:
        questions[currentQuestion]
        .explanation,

        isCorrect:false
    });

    currentQuestion++;

    if (
        currentQuestion >=
        questions.length
    ) {

        showResults();

        return;
    }

    loadQuestion();
});

/* -----------------------------
   EXPLANATION
------------------------------ */

document
.getElementById("explain-btn")
.addEventListener("click", () => {

    const q =
    questions[currentQuestion];

    explanationText.textContent =
    q.explanation;

    modal.style.display =
    "flex";
});

document
.getElementById("close-modal")
.addEventListener("click", () => {

    modal.style.display =
    "none";
});

/* -----------------------------
   RESULTS
------------------------------ */

function showResults() {

    clearInterval(interval);

    quizScreen.classList.remove(
        "active"
    );

    resultScreen.classList.add(
        "active"
    );

    document
    .getElementById("result-exam")
    .textContent =
    selectedExam;

    document
    .getElementById("final-score")
    .textContent =
    `${score} / 15`;

    const accuracy =
    Math.round(
        (score / 15) * 100
    );

    document
    .getElementById("accuracy")
    .textContent =
    `${accuracy}%`;

    document
    .getElementById("correct-count")
    .textContent =
    score;

    document
    .getElementById("wrong-count")
    .textContent =
    15 - score;
}

/* -----------------------------
   RESTART
------------------------------ */

document
.getElementById("restart-btn")
.addEventListener("click", () => {

    resultScreen.classList.remove(
        "active"
    );

    landingScreen.classList.add(
        "active"
    );

    questions = [];
    userAnswers = [];

    currentQuestion = 0;
    score = 0;
});

/* -----------------------------
   REVIEW (TEMP)
------------------------------ */

document
.getElementById("review-btn")
.addEventListener("click", () => {

    console.table(
        userAnswers
    );

    showReview();
});

/* -----------------------------
   BACK BUTTON
------------------------------ */

document
.getElementById("back-btn")
.addEventListener("click", () => {

    examScreen.classList.remove(
        "active"
    );

    streamScreen.classList.add(
        "active"
    );
});
// V6 Review Enhancements
window.GenSV6Features={
 review:true,
 explanations:true,
 references:true,
 scoreBreakdown:true,
 subjectTracking:true
};


function showReview(){
 const resultScreen=document.getElementById("result-screen");
 resultScreen.classList.remove("active");
 let review=document.getElementById("review-screen");
 if(!review){
   review=document.createElement("section");
   review.id="review-screen";
   review.className="screen active";
   review.innerHTML=`<div style="padding:20px;overflow:auto;height:90vh">
<h1>Answer Review</h1>
<div id="review-container"></div>
<button id="back-review" style="
display:block;
margin:30px auto;
padding:14px 32px;
border-radius:999px;
background:rgba(0,191,255,.12);
border:2px solid #00bfff;
color:white;
font-weight:700;
cursor:pointer;
box-shadow:0 0 10px rgba(0,191,255,.25);
">Back To Results</button>
</div>`;
   document.querySelector(".container").appendChild(review);
   document.addEventListener("click",e=>{
    if(e.target&&e.target.id==="back-review"){
      review.classList.remove("active");
      resultScreen.classList.add("active");
    }
   });
 }
 review.classList.add("active");
 const c=document.getElementById("review-container");
 c.innerHTML="";
 userAnswers.forEach((ua,i)=>{
   const q=questions[i]||{};
   const div=document.createElement("div");
   div.className="question-card";
   div.style.margin="20px";
   div.innerHTML=`
   <h3>Question ${i+1}</h3>
   <p>${ua.question||''}</p>
   <p><b>Your Answer:</b> ${ua.selected}</p>
   <p><b>Correct Answer:</b> ${ua.correct}</p>
   <p>${ua.isCorrect?'✅ Correct':'❌ Incorrect'}</p>
   <p><b>Why Correct:</b> ${q.correctReason||'Not available'}</p>
   <p><b>Why Wrong Answers Fail:</b> ${q.wrongReason||'Not available'}</p>
   <p><b>Explanation:</b> ${q.explanation||ua.explanation||'Not available'}</p>`;
   c.appendChild(div);
 });
}
