import React, { useState, useEffect } from "react";

const sections = [
  { name: "General Reasoning", count: 5 },
  { name: "Math", count: 5 },
  { name: "Word Problem", count: 3 },
  { name: "Real World Analysis", count: 4 },
];

export default function TestbankApp() {
  const [step, setStep] = useState<number | "done">(0);
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState(Date.now());
  const [responses, setResponses] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    fetch("/questions.json")
      .then((res) => res.json())
      .then((data) => setQuestions(data));
  }, []);

  const getSectionStart = (index: number) =>
    sections.slice(0, index).reduce((sum, s) => sum + s.count, 0);

  const handleStart = () => {
    setStep(1);
  };

  const handleNextQuestion = () => {
    const now = Date.now();
    const timeTaken = (now - startTime) / 1000;
    const qNum = getSectionStart(currentSectionIndex) + currentQuestionIndex;
    const updated = [...responses];
    updated[qNum] = {
      questionNumber: qNum + 1,
      answer: responses[qNum]?.answer || "",
      time: timeTaken,
    };
    setResponses(updated);
    setStartTime(now);

    if (currentQuestionIndex + 1 < sections[currentSectionIndex].count) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentSectionIndex + 1 < sections.length) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentQuestionIndex(0);
      if (typeof step === "number") setStep(step + 2);
    } else {
      setStep("done");
    }
  };

  const downloadCSV = () => {
    const header = "Name,Question Number,Answer,Time (s)\n";
    const rows = responses.map(
      (r) => `${name},${r.questionNumber},${r.answer},${r.time}`
    );
    const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `responses_${name}.csv`;
    a.click();
  };

  if (!questions.length) {
    return <p style={{ padding: "2rem" }}>Loading questions...</p>;
  }

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "50px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        boxShadow: "0 0 8px rgba(0,0,0,0.05)",
      }}
    >
      {step === 0 && (
        <>
          <h1>Welcome to the Test</h1>
          <p>
            Please enter your name to begin. You will go through 4 sections of
            questions. Each section will have its own instructions and you can
            move freely within that section.
          </p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            style={{ width: "90%", padding: "10px", marginTop: "10px" }}
          />
          <br />
          <button
            style={{ marginTop: "20px" }}
            onClick={handleStart}
            disabled={!name || questions.length === 0}
          >
            Start Test
          </button>
        </>
      )}

      {step === "done" && (
        <>
          <h2>Thank you, {name}!</h2>
          <p>
            You have completed the test. Click below to download your
            responses.
          </p>
          <button onClick={downloadCSV}>Download CSV</button>
        </>
      )}

      {typeof step === "number" && step % 2 === 1 && step !== 0 && (
        <>
          <h2 style={{ textAlign: "center" }}>Section: {sections[currentSectionIndex].name}</h2>
          <p style={{ textAlign: "center" }}>
            Instructions for this section go here. You may move freely between
            questions in this section.
          </p>
          <button onClick={() => setStep(step + 1)}>Start Section</button>
        </>
      )}

      {typeof step === "number" && step % 2 === 0 && step !== 0 && (() => {
        const section = sections[currentSectionIndex];
        const globalQIndex = getSectionStart(currentSectionIndex) + currentQuestionIndex;
        const q = questions[globalQIndex];

        return (
          <>
            <h2 style={{ textAlign: "center" }}>
              {section.name} - Question {currentQuestionIndex + 1}
            </h2>
            <p>{q?.prompt}</p>

            {q?.type === "mc" ? (
              <div style={{ marginBottom: "20px" }}>
                {q.options.map((opt: string, i: number) => (
                  <button
                    key={i}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "10px",
                      marginTop: "5px",
                    }}
                    onClick={() => {
                      const updated = [...responses];
                      updated[globalQIndex] = {
                        ...(updated[globalQIndex] || {}),
                        answer: opt,
                      };
                      setResponses(updated);
                    }}
                  >
                    {String.fromCharCode(97 + i)}) {opt}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Type your answer..."
                onChange={(e) => {
                  const updated = [...responses];
                  updated[globalQIndex] = {
                    ...(updated[globalQIndex] || {}),
                    answer: e.target.value,
                  };
                  setResponses(updated);
                }}
                style={{ width: "100%", padding: "10px", marginBottom: "20px" }}
              />
            )}

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                onClick={() => {
                  if (currentQuestionIndex > 0)
                    setCurrentQuestionIndex(currentQuestionIndex - 1);
                }}
                disabled={currentQuestionIndex === 0}
              >
                Back
              </button>
              <button onClick={handleNextQuestion}>Submit & Continue</button>
            </div>
          </>
        );
      })()}
    </div>
  );
}
