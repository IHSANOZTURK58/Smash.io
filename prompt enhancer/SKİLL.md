# General Development Skills & Best Practices

## 🎯 Core Philosophy
- **User Verification First:** always verify changes visually or via tests before marking a task as done.
- **Incremental Changes:** Make small, testable commits rather than massive, breaking changes.
- **Aesthetic Excellence:** Never blindly accept default styles. Always aim for a polished, modern look (Glassmorphism, Neon, Clean UI).
- **Clean Code:** Use TypeScript effectively (interfaces, types) and avoid `any`.

## 🛠️ Workflow Rules
1. **Understand Before Coding:** Read the relevant file entirely before making edits.
2. **Plan -> Execute -> Verify:**
   - **Plan:** Create a quick checklist of what files will change.
   - **Execute:** Write the code.
   - **Verify:** Confirm it works (No regression).
3. **Error Handling:** If a command fails, analyze the output. Don't blindly retry the same command.

## 🎨 UI/UX Standards
- **Font:** Use standard, readable fonts (Inter, Roboto) or Google Fonts.
- **Color:** Avoid excessive saturated colors. Use palettes.
- **Feedback:** Every user action (click, toggle) should provide visual feedback (hover, active states).

## 🚀 Performance
- **React:** Avoid unnecessary re-renders. Use `useMemo` and `useCallback` appropriately.
- **3D (Three.js):** Optimize geometry and texture sizes.

---
*This file serves as a general guide for the AI Assistant to maintain high quality across any project.*