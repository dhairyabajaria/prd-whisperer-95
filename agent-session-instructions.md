# 🔄 AGENT SESSION TRACKING INSTRUCTIONS

## ⚠️ CRITICAL USAGE RULE - READ FIRST
**When Agent usage reaches 80%, IMMEDIATELY update all logs and documentation before continuing work. This prevents work loss when usage hits 100%.**

### 80% Usage Checkpoint Actions:
1. Complete current session log with all work done so far
2. Update progress dashboard with latest status
3. Create handoff notes for next agent
4. Save all progress before continuing

---

## Overview
This document provides mandatory procedures for agents to maintain continuity, track progress, and ensure seamless handoffs between sessions through systematic file management and documentation.

## 📋 SESSION START PROCEDURE (First 5 Minutes)

### 1. Read Current Status (In Order)
Execute these steps immediately upon session start:

```bash
# Read files in this specific order:
1. progress-dashboard.md     → Overall project status
2. implementation-plan.md    → Current session objectives  
3. implementation-log-[latest-date].md → Previous session results
```

### 2. Update Progress Dashboard
```markdown
# Update timestamp
**Last Updated:** [Current Date/Time]

# Update system health metrics based on current logs
# Document any resolved/new issues discovered
```

## 🔧 DURING SESSION WORK

### 1. Create Session Log
```bash
# Copy template to new session file
cp session-log-template.md implementation-log-YYYY-MM-DD.md

# Fill in real-time as work progresses:
- Session objectives
- Tasks completed with details  
- Performance metrics before/after
- Issues encountered and resolved
```

### 2. Track Progress in Real-Time
Update `progress-dashboard.md` continuously:
- Phase completion percentages
- Performance metrics table
- Critical issues status
- System health indicators

### 3. **⚠️ MONITOR USAGE - UPDATE AT 80%**
**When agent usage reaches 80%:**
- Stop current work immediately
- Update session log with all completed tasks
- Update progress dashboard
- Document current status and next steps
- Only continue after all logs are saved

## 🏁 SESSION END PROCEDURE (Last 10 Minutes OR at 80% Usage)

### 1. Complete Session Documentation
In `implementation-log-[date].md`:
- Fill in all template sections
- Document final performance metrics
- List next session priorities
- Add handoff notes for next agent

### 2. Update Master Progress
In `progress-dashboard.md`:
- Update overall completion percentage
- Mark completed tasks as ✅
- Update "Next Session Priorities" 
- Refresh system status based on latest state

### 3. Update Project Status
In `replit.md`, add new log entry:
```markdown
**🕐 [Date] - [Time]**: **SESSION [X] COMPLETE**
- Implementation: [Key achievements]
- Status: [Current system state]
- Next Steps: [Immediate priorities for next session]
- Usage: [X%] - [Completed normally / Stopped at 80% threshold]
```

## 📊 DOCUMENTATION EXAMPLES

### Example: Database Fix Completed
**In progress-dashboard.md:**
```markdown
| **Database Connection** | 🟢 CONNECTED | Sept 18, 10:30 AM | CONNECTED | Secret loading fixed |
```

**In session log:**
```markdown
### Task 2.1: Database Secret Loading Fix
**Status:** ✅ COMPLETE
**Results Achieved:**
- DATABASE_URL now loading successfully from environment
- PostgreSQL connection restored
- Storage layer switched from memory to database
- No data loss during transition
```

### Example: Phase Completion
**In progress-dashboard.md:**
```markdown
- 🚧 **Phase 2: Query Optimization** - 100% Complete (September 18-19, 2025)

### Progress Visualization
Phase 1: ████████████████████████ 100% ✅
Phase 2: ████████████████████████ 100% ✅  
Phase 3: ░░░░░░░░░░░░░░░░░░░░░░░░   0% 📅
Overall: ████████████░░░░░░░░░░░░  60%
```

## 🎯 SYSTEM BENEFITS

### For Continuity
- **No Repeated Work:** Previous accomplishments clearly documented
- **Clear Next Steps:** Each session knows exactly what to work on
- **Progress Tracking:** Real-time visibility into completion status
- **Issue Management:** Critical problems tracked across sessions

### For Efficiency
- **Quick Startup:** New agent gets context in 5 minutes
- **Structured Work:** Clear objectives and time estimates
- **Validated Progress:** Success criteria defined for each task
- **Systematic Approach:** Methodical completion without gaps

### For Quality
- **Documentation:** All changes tracked with rationale
- **Testing:** Validation requirements defined
- **Performance Metrics:** Before/after measurements
- **Risk Management:** Issues and mitigation strategies documented

## 📅 SESSION HANDOFF TEMPLATE

Each session must end with this handoff note:

```markdown
**Session Completed By:** [Agent Name]
**Next Session Priority:** [Top 3 critical tasks]
**System Status:** [Overall health summary]
**Blockers:** [Any issues preventing progress]
**Ready for Next Agent:** [✅ YES / ❌ NO - with reason]
**Usage Status:** [X%] - [Normal completion / 80% threshold reached]

**Critical Handoff Notes:**
- [Most important context for next agent]
- [Any urgent issues discovered]
- [Files modified that need attention]
```

## 🔒 COMPLIANCE REQUIREMENTS

### Mandatory Actions
- ✅ **Must read** all three status files at session start
- ✅ **Must update** progress dashboard timestamp
- ✅ **Must create** new session log from template
- ✅ **Must monitor usage and update logs at 80%**
- ✅ **Must complete** handoff template before session end
- ✅ **Must update** replit.md with session summary

### Critical Usage Management
- **80% Threshold:** Immediately update all logs and documentation
- **No Exceptions:** This rule prevents work loss when usage hits 100%
- **Continue Only After:** All progress is documented and saved

### Quality Checkpoints
- All tasks have clear success criteria
- Performance metrics documented before/after changes
- Critical issues tracked with mitigation strategies
- Next session priorities clearly defined

---

**Purpose:** This system ensures seamless session continuity, prevents duplicate work, maintains comprehensive project tracking, and protects against work loss due to usage limits reaching 100%.