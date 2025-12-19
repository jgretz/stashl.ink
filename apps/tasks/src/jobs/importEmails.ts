import type PgBoss from 'pg-boss';
import {EmailService} from '@stashl/domain/src/services/email.service';
import {UserService} from '@stashl/domain/src/services/user.service';
import {GmailClient, extractEmailAddress} from '../utils/gmailClient';
import {parseLinksFromListFormat, type ParsedLink} from '../utils/emailParser';
import type {User} from '@stashl/domain/src/types';
import {withStashlConnection} from '../stashlConnection';

const API_URL = process.env.API_URL;
const TASK_API_KEY = process.env.TASK_API_KEY;

interface ImportEmailsJob {
  userId?: string; // Optional - if not provided, process all users
}

async function reportEmailStats(usersProcessed: number, emailsParsed: number, linksFound: number): Promise<void> {
  if (!TASK_API_KEY) {
    console.warn('TASK_API_KEY not set, skipping stats reporting');
    return;
  }

  if (!API_URL) {
    console.warn('API_URL not set, skipping stats reporting');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/stats/email-processor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Task-Key': TASK_API_KEY,
      },
      body: JSON.stringify({usersProcessed, emailsParsed, linksFound}),
    });

    if (!response.ok) {
      console.error('Failed to report email stats:', await response.text());
    } else {
      console.log(`📊 Reported email stats: ${usersProcessed} users, ${emailsParsed} emails, ${linksFound} links`);
    }
  } catch (error) {
    console.error('Error reporting email stats:', error);
  }
}

async function processUserEmails(
  user: User,
  emailService: EmailService,
): Promise<{emailCount: number; linkCount: number}> {
  if (!user.gmailAccessToken || !user.gmailRefreshToken) {
    console.log(`User ${user.id} missing Gmail tokens, skipping`);
    return {emailCount: 0, linkCount: 0};
  }

  const gmailClient = new GmailClient(user.gmailAccessToken, user.gmailRefreshToken);

  const refreshResult = await gmailClient.refreshTokenIfNeeded(user.gmailTokenExpiry);
  if (refreshResult) {
    await emailService.saveGmailTokens(user.id, {
      gmailAccessToken: refreshResult.accessToken,
      gmailRefreshToken: user.gmailRefreshToken,
      gmailTokenExpiry: refreshResult.expiry,
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
        const subjectPreview = message.subject?.slice(0, 15) || '';
        const emailFrom = subjectPreview
          ? `${extractEmailAddress(message.from)} (${subjectPreview})`
          : extractEmailAddress(message.from);
        const items = parsedLinks.map((parsed: ParsedLink) => ({
          emailMessageId: messageId,
          emailFrom,
          link: parsed.url,
          title: parsed.title,
          description: parsed.description,
        }));

        const result = await emailService.importEmailItems(user.id, items);
        totalLinkCount += result.newItems.length;

        console.log(`Email ${messageId}: found ${parsedLinks.length} links, imported ${result.newItems.length} new`);
      } else {
        console.log(`Email ${messageId} from "${message.from}" (${message.subject}): no links found (body length: ${message.htmlBody.length})`);
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

    console.log(isAdHoc ? `Running ad-hoc email import for user ${userId}...` : 'Running scheduled email import...');

    let usersProcessed = 0;
    let totalEmailsParsed = 0;
    let totalLinksFound = 0;

    try {
      await withStashlConnection(async () => {
        const emailService = new EmailService();
        const userService = new UserService();

        let users: User[];
        if (userId) {
          // Ad-hoc: process single user
          const user = await userService.getUserById(userId);
          users = user ? [user] : [];
        } else {
          // Scheduled: process all users with email enabled
          users = await emailService.getUsersWithEmailEnabled();
        }

        console.log(`Found ${users.length} users to process`);

        for (const user of users) {
          try {
            const result = await processUserEmails(user, emailService);
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
      });
    } catch (error) {
      console.error('Failed to run email import:', error);
      throw error;
    } finally {
      await reportEmailStats(usersProcessed, totalEmailsParsed, totalLinksFound);
    }
  };
}
