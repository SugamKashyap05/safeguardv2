# PLAN-lpu-capstone-docs

## Overview
Create a complete, compliant document folder structure for the LPU Capstone Project submission, including a dedicated Patent Documentation section. This ensures the user has all mandatory files ready for evaluation.

## Project Type
**DOCS** (Documentation only, no code implementation)

## Success Criteria
1.  **Folder Structure:** Clearly organized `submission/` folder with subdirectories.
2.  **Mandatory Files:** All requested files (Title, Abstract, etc.) created with placeholders/templates.
3.  **Patent Section:** Dedicated folder with all patent-related documents.
4.  **Format:** Content structured for easy export to PDF/Word (Markdown format).

## File Structure

```
submission/
├── 01_Preliminaries/
│   ├── 01_Title_Page.md
│   ├── 02_Declaration.md
│   ├── 03_Certificate.md
│   ├── 04_Acknowledgement.md
│   ├── 05_Abstract.md
│   └── 06_Table_of_Contents_Placeholder.md
├── 02_Chapters/
│   ├── 01_Introduction.md (Problem Statement, Objectives)
│   ├── 02_Literature_Review.md
│   ├── 03_Methodology.md (System Architecture)
│   ├── 04_Implementation.md (Tools, Tech, Code Snippets)
│   ├── 05_Results_and_Analysis.md
│   └── 06_Conclusion_and_Future_Scope.md
├── 03_References_and_Appendices/
│   ├── 01_References.md (IEEE Format)
│   └── 02_Appendices.md
└── 04_Patent_Documentation/
    ├── 01_Patent_Title_and_Field.md
    ├── 02_Background_and_Problem.md
    ├── 03_Detailed_Description.md
    ├── 04_Drawings_and_Diagrams.md
    ├── 05_Claims.md
    └── 06_Novelty_and_Advantages.md
```

## Task Breakdown

### Phase 1: Structure Setup
- [ ] **Task 1: Create Directory Structure**
    - **Input:** None
    - **Output:** Folders `submission/01_Preliminaries`, `submission/02_Chapters`...
    - **Verify:** `ls -R submission/` shows correct folders.

### Phase 2: Preliminaries & Chapters
- [ ] **Task 2: Create Preliminary Documents**
    - **Input:** LPU Templates (Standard Academic)
    - **Output:** Title Page, Declaration, Certificate, etc.
    - **Verify:** Files exist with correct headers.

- [ ] **Task 3: Create Chapter Documents**
    - **Input:** Project details (Safeguard)
    - **Output:** Introduction, Lit Review, Methodology files.
    - **Verify:** Files exist with section headers.

### Phase 3: Patent Documentation
- [ ] **Task 4: Create Patent Documents**
    - **Input:** Patent requirements
    - **Output:** Patent files in `04_Patent_Documentation`
    - **Verify:** All 6 patent files exist.

### Phase X: Verification
- [ ] No Empty Files: Ensure all files have at least a template/placeholder.
- [ ] Naming Convention: Check file naming consistency.
