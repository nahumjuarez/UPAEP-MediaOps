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

function inferMissingEventTypes() {
  return SBEOutputs.inferMissingEventTypes();
}

function validateEventTypeRules() {
  return SBEOutputs.validateEventTypeRules();
}

function generateMissingEventCodes() {
  return SBEOutputs.generateMissingEventCodes();
}

function generateOutputFields() {
  return SBEOutputs.generateOutputFields();
}

function generateFolderNames() {
  return SBEOutputs.generateFolderNames();
}

function previewBecarioInstructionEmail() {
  return SBEOutputs.previewBecarioInstructionEmail();
}

function previewWeeklyAdminDigest() {
  return SBEOutputs.previewWeeklyAdminDigest();
}

function validateOutputReadiness() {
  return SBEOutputs.validateOutputReadiness();
}

function generateFechaTag(date) {
  return SBEOutputs.generateFechaTag(date);
}

function generateBecarioSlug(nombre) {
  return SBEOutputs.generateBecarioSlug(nombre);
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
