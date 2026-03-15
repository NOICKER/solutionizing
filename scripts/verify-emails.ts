import {
  assignmentReceivedTemplate,
  missionApprovedTemplate,
} from '../lib/email/templates'

console.log('--- ASSIGNMENT RECEIVED ---');
console.log(assignmentReceivedTemplate({ goal: 'Test Checkout Flow', estimatedMinutes: 4 }, 'https://example.com/mission'));

console.log('\n--- MISSION APPROVED ---');
console.log(missionApprovedTemplate({ title: 'Test the Pricing Page Clarity' }, 'https://example.com/admin'));
