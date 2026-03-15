const BRAND_COLOR = '#d77a57';
const APP_NAME = 'Solutionizing';

function layout(title: string, content: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb; display: block !important; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #fff; padding: 24px 20px; text-align: center; border-radius: 12px 12px 0 0; border-bottom: 3px solid ${BRAND_COLOR}; }
    .logo { font-size: 26px; font-weight: 700; color: ${BRAND_COLOR}; margin: 0; letter-spacing: -0.02em; }
    .content { background-color: #fff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05); }
    .footer { text-align: center; margin-top: 32px; font-size: 13px; color: #9ca3af; }
    .btn { display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin-top: 24px; font-size: 15px; box-shadow: 0 2px 4px rgba(215, 122, 87, 0.3); transition: transform 0.2s, box-shadow 0.2s; }
    .btn:hover { box-shadow: 0 4px 8px rgba(215, 122, 87, 0.4); }
    h1 { color: #111827; font-size: 22px; margin-top: 0; margin-bottom: 8px; font-weight: 600; letter-spacing: -0.01em; }
    p { margin: 0 0 16px 0; font-size: 15px; color: #4b5563; }
    .details { background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #f3f4f6; margin: 28px 0; }
    .label { font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 6px; }
    .value { font-weight: 500; color: #111827; font-size: 15px; margin: 0; line-height: 1.5; }
    .reason-value { font-weight: 500; color: #dc2626; font-size: 15px; margin: 0; line-height: 1.5; }
    .link-wrapper { text-align: center; padding: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 class="logo">${APP_NAME}</h2>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br>
      You receive this because you have an account on Solutionizing.
    </div>
  </div>
</body>
</html>
  `;
}

export function assignmentReceivedTemplate(mission: { goal: string; estimatedMinutes: number }, url: string) {
  const content = `
    <h1>You have a new mission!</h1>
    <p>A new mission has been assigned to you. We need your feedback to help improve the product experience.</p>
    <div class="details">
      <div class="label">Primary Goal</div>
      <p class="value">${mission.goal}</p>
      <div class="label" style="margin-top: 16px;">Estimated Time</div>
      <p class="value">${mission.estimatedMinutes} minutes</p>
    </div>
    <div class="link-wrapper">
      <a href="${url}" class="btn">Open Assignment</a>
    </div>
  `;
  return layout('New Mission Assignment', content);
}

export function missionApprovedTemplate(mission: { title: string }, url: string) {
  const content = `
    <h1>Your mission is live!</h1>
    <p>Great news! Your mission has been approved by our safety reviewers and is now active for testers.</p>
    <div class="details">
      <div class="label">Mission Title</div>
      <p class="value">${mission.title}</p>
    </div>
    <div class="link-wrapper">
      <a href="${url}" class="btn">View Mission Dashboard</a>
    </div>
  `;
  return layout('Mission Approved', content);
}

export function missionRejectedTemplate(mission: { title: string }, reason: string, url: string) {
  const content = `
    <h1>Your mission needs some changes</h1>
    <p>Your mission cannot proceed in its current state. Please review the feedback below and make the necessary updates before resubmitting.</p>
    <div class="details">
      <div class="label">Mission Title</div>
      <p class="value">${mission.title}</p>
      <div class="label" style="margin-top: 16px;">Reason for Changes</div>
      <p class="reason-value">${reason}</p>
    </div>
    <div class="link-wrapper">
      <a href="${url}" class="btn">Review Mission</a>
    </div>
  `;
  return layout('Mission Needs Changes', content);
}

export function missionCompletedTemplate(mission: { title: string }, url: string) {
  const content = `
    <h1>Mission results are ready!</h1>
    <p>Your mission has completed and the synthesized results are ready for your review. See what insights we uncovered.</p>
    <div class="details">
      <div class="label">Mission Title</div>
      <p class="value">${mission.title}</p>
    </div>
    <div class="link-wrapper">
      <a href="${url}" class="btn">View Feedback & Insights</a>
    </div>
  `;
  return layout('Mission Completed', content);
}
