# Localization Runtime Debug Report

Generated: 2026-06-01T22:38:08.122Z

## Findings

- language before clicking ES: en
- localStorage before/after: null -> es
- context language before/after: en -> es
- UI rerenders: yes
- refresh persists ES: yes
- failing components: none

## Root Cause

The locale store worked, but the only visible language selector was inside the authenticated Taste surface. Unauthenticated users could not switch language from the auth panel; several venue-detail labels also used overly abstract dictionary copy.
