// testbank_app.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const sections = [
  { name: "General Reasoning", count: 5 },
  { name: "Math", count: 5 },
  { name: "Word Problem", count: 3 },
  { name: "Real World Analysis", count: 4 },
];

export default function TestbankApp() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState(Date.now());
  const [responses, setResponses] = useState([]);
  const [questions, setQuestions] = useState([]);
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
    setStep(1); // move to first section intro
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
      setStep(step + 2); // go to next section's intro page
    } else {
      setStep("done");
    }
  };

  const downloadCSV = () => {
    const header = "Name,Question Number,Answer,Time (s)\n";
    const rows = responses.map(r => `${name},${r.questionNumber},${r.answer},${r.time}`);
    const blob = new Blob([header + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `responses_${name}.csv`;
    a.click();
  };

  if (step === 0) {
    return (
      <Card className="max-w-xl mx-auto mt-10 p-6">
        <h1 className="text-xl font-bold mb-4">Welcome to the Test</h1>
        <p className="mb-4">Please enter your name to begin. You will go through 4 sections of questions. Each section will have its own instructions and you can move freely within that section.</p>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" className="mb-4" />
        <Button onClick={handleStart} disabled={!name || questions.length === 0}>Start Test</Button>
      </Card>
    );
  }

  if (step === "done") {
    return (
      <Card className="max-w-xl mx-auto mt-10 p-6">
        <h2 className="text-xl font-bold mb-4">Thank you, {name}!</h2>
        <p className="mb-4">You have completed the test. Click below to download your responses.</p>
        <Button onClick={downloadCSV}>Download CSV</Button>
      </Card>
    );
  }

  const section = sections[currentSectionIndex];

  if (step % 2 === 1) {
    return (
      <Card className="max-w-xl mx-auto mt-10 p-6">
        <h2 className="text-xl font-bold mb-4">Section: {section.name}</h2>
        <p className="mb-4">Instructions for this section go here. You may move freely between questions in this section.</p>
        <Button onClick={() => setStep(step + 1)}>Start Section</Button>
      </Card>
    );
  }

  const globalQIndex = getSectionStart(currentSectionIndex) + currentQuestionIndex;
  const q = questions[globalQIndex];

  return (
    <Card className="max-w-xl mx-auto mt-10 p-6">
      <h2 className="text-xl font-bold mb-4">{section.name} - Question {currentQuestionIndex + 1}</h2>
      <p className="mb-4 whitespace-pre-wrap">{q?.prompt}</p>

      {q?.type === "mc" ? (
        <div className="space-y-2 mb-4">
          {q.options.map((opt: string, i: number) => (
            <Button
              key={i}
              variant="outline"
              onClick={() => {
                const updated = [...responses];
                updated[globalQIndex] = {
                  ...(updated[globalQIndex] || {}),
                  answer: opt,
                };
                setResponses(updated);
              }}
              className="w-full text-left"
            >
              {String.fromCharCode(97 + i)}) {opt}
            </Button>
          ))}
        </div>
      ) : (
        <Input
          placeholder="Type your answer..."
          onChange={(e) => {
            const updated = [...responses];
            updated[globalQIndex] = {
              ...(updated[globalQIndex] || {}),
              answer: e.target.value,
            };
            setResponses(updated);
          }}
          className="mb-4"
        />
      )}

      <div className="flex justify-between mt-6">
        <Button
          onClick={() => {
            if (currentQuestionIndex > 0) setCurrentQuestionIndex(currentQuestionIndex - 1);
          }}
          disabled={currentQuestionIndex === 0}
        >
          Back
        </Button>
        <Button onClick={handleNextQuestion}>Submit & Continue</Button>
      </div>
    </Card>
  );
}
