/* =====================================================================
   DATA FILE — the only file you edit to add subjects, units and notes.
   Nothing is shown as "available" unless a note below has a real `file` path.

   HOW TO ADD A NOTE (3 steps)
   1. Put the PDF in the right folder, e.g. notes/engineering-physics/unit-1-notes.pdf
      (lowercase names, hyphens instead of spaces).
   2. Find the unit and add an entry inside its notes list:
        {
          id: "physics-u1-notes",           // unique; NEVER change later (progress is tied to it)
          title: "Unit 1 — Complete Notes",
          description: "Derivations and important questions.",
          file: "notes/engineering-physics/unit-1-notes.pdf",
          fileType: "PDF",
          size: "1.2 MB"                     // optional; delete the line if unsure
        }
      Separate several notes with commas.
   3. Save, commit, push to GitHub. Netlify redeploys automatically.

   VERIFY BEFORE PUBLISHING: open the site and click "View Notes" — the PDF
   must open. Also open  your-site.netlify.app/<file path>  directly.
   When the page loads it also checks each file and hides any note whose
   file is not found (a message appears in the browser console).
   Any PDF on a public site can be opened by anyone who has or guesses its link.

   HOW TO EDIT A UNIT: use units("physics", { 1: { title: "...", description: "..." } }).
   Units with no title just show "Unit 1", "Unit 2", ...
   HOW TO ADD A SUBJECT: copy one block below, give it a new unique id, name,
   description, icon (physics, maths, prompt, iks, electrical, code, book)
   and a new units("prefix") prefix. Also create notes/<subject-id>/.
   ===================================================================== */

function units(prefix, custom) {
  custom = custom || {};
  var list = [];
  for (var n = 1; n <= 5; n++) {
    var c = custom[n] || {};
    list.push({ id: prefix + "-u" + n, number: n, title: c.title || "",
                description: c.description || "", notes: c.notes || [] });
  }
  return list;
}

window.SUBJECTS = [
  { id: "engineering-physics", name: "Engineering Physics",
    description: "Concepts, derivations and exam-ready answers.", icon: "physics",
    units: units("physics") },
  { id: "engineering-mathematics", name: "Engineering Mathematics",
    description: "Formulas, methods and worked examples.", icon: "maths", units: units("maths") },
  { id: "ai-prompt-engineering", name: "AI Prompt Engineering",
    description: "Prompting concepts, techniques and practical notes.", icon: "prompt",
    units: units("prompt", {
      4: { notes: [
        {
          id: "prompt-u4-notes-question-bank",
          title: "Unit 4 — Notes & Solved Question Bank",
          description: "AKTU exam notes with a solved question bank for Unit 4.",
          file: "notes/ai-prompt-engineering/unit-4-notes-solved-question-bank.pdf",
          fileType: "PDF",
          size: "78 KB"
        }
      ] }
    }) },
  { id: "iks", name: "Indian Knowledge Systems (IKS)",
    description: "Key concepts, traditions and concise revision notes.", icon: "iks", units: units("iks") },
  { id: "electrical-engineering", name: "Electrical Engineering",
    description: "Core concepts, circuit theory and important formulas.", icon: "electrical", units: units("electrical") },
  { id: "programming-in-c", name: "Programming in C",
    description: "Fundamentals, syntax, programs and solved questions.", icon: "code",
    units: units("c", {
      2: { notes: [
        {
          id: "c-u2-exam-notes",
          title: "Unit 2 — Exam Notes",
          description: "Concise exam-ready notes for Unit 2.",
          file: "notes/programming-in-c/unit-2-exam-notes.pdf",
          fileType: "PDF",
          size: "18 KB"
        }
      ] }
    }) }
];
