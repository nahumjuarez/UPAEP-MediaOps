function onOpen() {
  SBEMenu.onOpen();
}

function setupSheets() {
  return SBESheets.setupSheets();
}

function syncSourceEvents() {
  return SBEEvents.syncSourceEvents();
}

function assignPendingEvents() {
  return SBEAssignment.assignPendingEvents();
}

function chooseBestCandidate(evento, becarios) {
  return SBEAssignment.chooseBestCandidate(evento, becarios);
}

function createAssignmentEvent(evento, becario) {
  return SBECalendar.createAssignmentEvent(evento, becario);
}

function checkRsvpAndReplace() {
  return SBERsvp.checkRsvpAndReplace();
}

function refreshDashboard() {
  return SBEDashboard.refreshDashboard();
}

function runDiagnostics() {
  return SBEDiagnostics.runDiagnostics();
}

function logInfo(action, message, data) {
  return SBELogger.logInfo(action, message, data);
}

function logWarn(action, message, data) {
  return SBELogger.logWarn(action, message, data);
}

function logError(action, message, data) {
  return SBELogger.logError(action, message, data);
}
