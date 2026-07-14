const base = process.env.AGENCY_E2E_BASE || 'https://my-virtual-office-nodejs.netlify.app/api/agency';

const driveGramBrief = `Website Brief: Instagram Clone Using Google Drive as Storage

Project Name

DriveGram

Project Summary

Build a responsive Instagram-style web app where users can upload, browse, like, comment on, and manage photo/video posts. Instead of using a traditional backend file storage system, the app should use Google Drive as the main media storage layer. User-uploaded images and videos should be saved into Google Drive folders, while post metadata can be stored separately using Firebase, Supabase, or JSON-based storage depending on the build phase.

Core Concept

Users sign in with Google, connect their Google Drive, and use the app as a visual social platform. When a user uploads a post, the media file is stored in Google Drive. The app retrieves the file URL or preview link and displays it inside the social feed.

Main User Flow

Landing page with app logo, Sign in with Google, mock feed preview, feature highlights, and a privacy message explaining that media is stored in the user's Google Drive.

Google Sign-In should request basic profile info, email, and the minimum Google Drive file scope possible: https://www.googleapis.com/auth/drive.file.

First-time setup creates DriveGram Uploads with Images, Videos, Thumbnails, and User Avatars folders.

Home feed should look like a modern Instagram-style timeline with avatar, username, media, like button, comment button, share link, caption, comment preview, post date, and options menu. Mobile should have a bottom navigation bar. Desktop should use a centered feed with sidebar.

Upload post should include drag-and-drop, file picker, image/video preview, caption, optional location, optional tags, crop/resize option, upload progress, and post button.

Profile page should include avatar, display name, username, bio, website, post count, follower placeholder, following placeholder, and a grid of uploaded posts.

Post detail page should include large media preview, full caption, like button, comment list, add comment box, date posted, and owner edit/delete options.

Explore page should include masonry or square grid, search, tag filtering, trending placeholder, and recent uploads.

Required Pages

Public: landing page, privacy policy, terms page.
Authenticated: home feed, upload/create post, explore page, profile page, edit profile page, post detail page, settings page.

UI Style

Clean, modern, familiar, inspired by Instagram but not a direct copy. White or off-white background, rounded cards, soft borders, minimal shadows, clean typography, large image previews, mobile-first layout, smooth transitions, app-like bottom navigation.

Suggested Colours: #FAFAFA, #FFFFFF, #111111, #737373, #DBDBDB, #E1306C, #22C55E, #EF4444.

Metadata Storage Options

Option A: Firebase with Google Sign-In and Firestore.
Option B: Supabase with SQL-based Postgres metadata.
Option C: Local JSON for prototype only.

Security Requirements

Use OAuth securely, never expose Google API secrets in frontend code, use backend or serverless functions for sensitive API operations, validate file types, limit upload size, prevent users from editing other users' posts, protect private data, store only required Google Drive IDs and metadata, and allow users to delete their data.

Final Deliverable

Create a working responsive web app prototype with landing page, Google login, feed, upload modal, Google Drive upload integration, profile page, explore page, likes and comments, basic settings, mobile-first navigation, and clean modern Instagram-style UI.`;

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    method: options.method || 'GET',
    headers: options.body ? { 'content-type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function pollProjectForDesignApproval(projectId, workflowRunId) {
  let misses = 0;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    let project;
    try {
      project = await request(`/project/${projectId}`);
    } catch (error) {
      if (!String(error.message || error).includes('404')) throw error;
      misses += 1;
      await sleep(2000);
      continue;
    }
    const approvals = project.approvals || project.officeState?.approvals || [];
    const approval = approvals.find(item => item.type === 'design_options' && item.status === 'pending');
    if (approval) return { project, approval, misses };
    const directions = project.officeState?.designStudio?.creativeDirections || [];
    if (project.officeState?.designStudio?.phase === 'creative_direction_approval' && directions.length) {
      return {
        project,
        misses,
        approval: {
          id: `design-options-${projectId}`,
          projectId,
          type: 'design_options',
          title: 'Choose a creative direction',
          description: 'Synthetic E2E approval from workflow state.',
          payload: { workflowRunId, designOptions: directions }
        }
      };
    }
    await sleep(2000);
  }
  throw new Error(`No design approval appeared for ${projectId}`);
}

async function pollWorkflowForPreview(workflowRunId) {
  let last;
  let misses = 0;
  for (let attempt = 0; attempt < 180; attempt += 1) {
    try {
      last = await request(`/workflow/${workflowRunId}/status`);
    } catch (error) {
      if (!String(error.message || error).includes('404')) throw error;
      misses += 1;
      await sleep(2000);
      continue;
    }
    if (last.officeState?.project?.previewUrl || last.workflow?.status === 'failed') return last;
    await sleep(2000);
  }
  if (last) last.pollMisses = misses;
  return last;
}

async function main() {
  const run = Date.now();
  const intake = await request('/intake/start', { method: 'POST', body: {} });
  const { customer } = await request('/customer/create', {
    method: 'POST',
    body: {
      name: 'DriveGram Regression',
      email: `drivegram-regression-${run}@example.com`,
      businessName: 'DriveGram',
      businessType: 'social media app',
      phone: '',
      existingWebsite: '',
      notes: 'Regression test for technical app brief with Google Drive media storage.'
    }
  });
  const brief = await request('/brief/submit', {
    method: 'POST',
    body: { customerId: customer.id, customer, workflowRunId: intake.workflowRunId, originalBrief: driveGramBrief }
  });
  const approvedBrief = await request('/brief/approve', {
    method: 'POST',
    body: {
      workflowRunId: brief.workflowRunId,
      customerId: customer.id,
      customer,
      originalBrief: driveGramBrief,
      structuredBrief: brief.structuredBrief
    }
  });
  const projectId = approvedBrief.project.id;
  if (approvedBrief.project.title !== 'DriveGram') {
    throw new Error(`Expected project title DriveGram, got ${approvedBrief.project.title}`);
  }
  const { project, approval, misses: projectPollMisses } = await pollProjectForDesignApproval(projectId, approvedBrief.workflowRunId);
  const selectedDesignOption = approval.payload.designOptions[1] || approval.payload.designOptions[0];
  const approvedDesign = await request(`/approval/${approval.id}/approve`, {
    method: 'POST',
    body: {
      projectId,
      workflowRunId: approvedBrief.workflowRunId,
      selectedDesignOption,
      approval,
      project: project.project
    }
  });
  if (approvedDesign.officeState?.project?.status === 'planning') {
    throw new Error('Project regressed to planning immediately after design approval');
  }
  const workflowRunId = approvedDesign.workflowRunId || approvedBrief.workflowRunId;
  const final = await pollWorkflowForPreview(workflowRunId);
  const pendingDesignApprovals = (final.officeState?.approvals || []).filter(item => item.type === 'design_options' && item.status === 'pending');
  if (pendingDesignApprovals.length) {
    throw new Error(`Duplicate pending design approvals remained: ${pendingDesignApprovals.map(item => item.id).join(', ')}`);
  }
  if (!final.officeState?.project?.previewUrl) {
    throw new Error(`Preview was not created. Last step: ${final.workflow?.currentStep || 'unknown'}`);
  }
  console.log(JSON.stringify({
    ok: true,
    projectId,
    workflowRunId,
    title: final.officeState.project.title,
    status: final.officeState.project.status,
    step: final.workflow.currentStep,
    previewUrl: final.officeState.project.previewUrl,
    projectPollMisses,
    workflowPollMisses: final.pollMisses || 0
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
