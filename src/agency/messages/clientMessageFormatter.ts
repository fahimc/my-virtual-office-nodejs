export function previewReadyMessage(projectTitle: string): { subject: string; body: string } {
  return {
    subject: 'Preview ready for review',
    body: `${projectTitle} has a new website preview ready. Please review it in the portal, leave visual feedback, or approve it when you are happy.`
  };
}

export function approvalNeededMessage(title: string): { subject: string; body: string } {
  return {
    subject: title,
    body: 'A project decision is ready for you in the portal. The agency will continue after your approval or feedback.'
  };
}
