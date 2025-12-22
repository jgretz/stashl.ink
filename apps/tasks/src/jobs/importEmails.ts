import type PgBoss from 'pg-boss';
import {GmailClient, extractDisplayName} from '../utils/gmailClient';
import {parseLinksFromListFormat, type ParsedLink} from '../utils/emailParser';
import {
  getUsersWithEmailEnabled,
  getUserById,
  saveGmailTokens,
  importEmailItems,
  reportEmailProcessorStats,
  type TaskUser,
} from '../apiClient';

interface ImportEmailsJob {
  userId?: string; // Optional - if not provided, process all users
}

async function processUserEmails(user: TaskUser): Promise<{emailCount: number; linkCount: number}> {
  if (!user.gmailAccessToken || !user.gmailRefreshToken) {
    console.log(`User ${user.id} missing Gmail tokens, skipping`);
    return {emailCount: 0, linkCount: 0};
  }

  const gmailClient = new GmailClient(user.gmailAccessToken, user.gmailRefreshToken);

  // Parse token expiry (comes as ISO string from API)
  const tokenExpiry = user.gmailTokenExpiry ? new Date(user.gmailTokenExpiry) : null;
  const refreshResult = await gmailClient.refreshTokenIfNeeded(tokenExpiry);
  if (refreshResult) {
    await saveGmailTokens(user.id, {
      gmailAccessToken: refreshResult.accessToken,
      gmailRefreshToken: user.gmailRefreshToken,
      gmailTokenExpiry: refreshResult.expiry.toISOString(),
    });
    console.log(`Refreshed tokens for user ${user.id}`);
  }

  const query = user.emailFilter || '';
  const messageIds = await gmailClient.listMessages(query);

  if (messageIds.length === 0) {
    console.log(`No new emails for user ${user.id}`);
    return {emailCount: 0, linkCount: 0};
  }

  console.log(`Found ${messageIds.length} emails for user ${user.id}`);

  let totalLinkCount = 0;

  for (const messageId of messageIds) {
    try {
      const message = await gmailClient.getMessage(messageId);
      const parsedLinks = parseLinksFromListFormat(message.htmlBody);

      if (parsedLinks.length > 0) {
        const displayName = extractDisplayName(message.from);
        const subjectPreview = message.subject?.trim().slice(0, 25) || '';
        const emailFrom = subjectPreview.length > 0
          ? `${displayName} (${subjectPreview}...)`
          : displayName;
        const items = parsedLinks.map((parsed: ParsedLink) => ({
          emailMessageId: messageId,
          emailFrom,
          link: parsed.url,
          title: parsed.title,
          description: parsed.description,
        }));

        const result = await importEmailItems(user.id, items);
        totalLinkCount += result.newItems;

        console.log(
          `Email ${messageId}: found ${parsedLinks.length} links, imported ${result.newItems} new`,
        );
      } else {
        console.log(
          `Email ${messageId} from "${message.from}" (${message.subject}): no links found (body length: ${message.htmlBody.length})`,
        );
      }

      await gmailClient.markAsRead(messageId);
    } catch (error) {
      console.error(`Failed to process email ${messageId}:`, error);
    }
  }

  return {emailCount: messageIds.length, linkCount: totalLinkCount};
}

export function importEmailsHandler() {
  return async function (jobs: PgBoss.Job<ImportEmailsJob>[]) {
    // Take first job's data (batch usually contains one job)
    const job = jobs[0];
    const {userId} = job?.data || {};
    const isAdHoc = !!userId;

    console.log(
      isAdHoc
        ? `Running ad-hoc email import for user ${userId}...`
        : 'Running scheduled email import...',
    );

    let usersProcessed = 0;
    let totalEmailsParsed = 0;
    let totalLinksFound = 0;

    try {
      let users: TaskUser[];
      if (userId) {
        // Ad-hoc: process single user
        const user = await getUserById(userId);
        users = user ? [user] : [];
      } else {
        // Scheduled: process all users with email enabled
        users = await getUsersWithEmailEnabled();
      }

      console.log(`Found ${users.length} users to process`);

      for (const user of users) {
        try {
          const result = await processUserEmails(user);
          usersProcessed++;
          totalEmailsParsed += result.emailCount;
          totalLinksFound += result.linkCount;
        } catch (error) {
          console.error(`Failed to process emails for user ${user.id}:`, error);
        }
      }

      console.log(
        `Email import complete: ${usersProcessed} users, ${totalEmailsParsed} emails, ${totalLinksFound} links`,
      );
    } catch (error) {
      console.error('Failed to run email import:', error);
      throw error;
    } finally {
      await reportEmailProcessorStats(usersProcessed, totalEmailsParsed, totalLinksFound);
    }
  };
}
