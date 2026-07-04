import { getAccessToken } from './firebase';

export interface SheetExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

export interface CalendarEventParams {
  summary: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
}

/**
 * Creates a Google Spreadsheet and writes the specified 2D array of rows to it.
 */
export async function createGoogleSheet(title: string, headers: string[], dataRows: any[][]): Promise<SheetExportResult> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('User is not signed in with Google Workspace credentials.');
  }

  // 1. Create the empty spreadsheet with specified title
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title }
    })
  });

  if (!createResponse.ok) {
    const errorBody = await createResponse.text();
    throw new Error(`Google Sheets creation failed: ${errorBody}`);
  }

  const spreadsheet = await createResponse.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const spreadsheetUrl = spreadsheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Populate the sheets with headers + rows
  const allValues = [headers, ...dataRows];
  const range = 'Sheet1!A1';

  const updateResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: allValues
      })
    }
  );

  if (!updateResponse.ok) {
    const errorBody = await updateResponse.text();
    throw new Error(`Google Sheets data population failed: ${errorBody}`);
  }

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Fetches sheet rows from a Google Sheet.
 */
export async function getGoogleSheetRows(spreadsheetId: string, range: string): Promise<string[][]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('User is not signed in with Google Workspace credentials.');
  }

  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to retrieve Google Sheet data: ${errorBody}`);
  }

  const result = await response.json();
  return result.values || [];
}

/**
 * Creates an event in the user's primary Google Calendar.
 */
export async function createCalendarEvent(params: CalendarEventParams): Promise<any> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('User is not signed in with Google Workspace credentials.');
  }

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      summary: params.summary,
      description: params.description,
      start: {
        dateTime: params.startDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      },
      end: {
        dateTime: params.endDateTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to create Google Calendar event: ${errorBody}`);
  }

  return await response.json();
}

/**
 * Sends an email using the Gmail API.
 */
export async function sendGmailEmail(to: string, subject: string, htmlMessage: string, senderEmail: string = 'me'): Promise<any> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('User is not signed in with Google Workspace credentials.');
  }

  // Create standard MIME message
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const mimeParts = [
    `To: ${to}`,
    `From: ${senderEmail}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlMessage
  ];

  const mimeString = mimeParts.join('\r\n');

  // Safe base64url encode
  const rawEmail = btoa(unescape(encodeURIComponent(mimeString)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw: rawEmail
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to send email via Gmail API: ${errorBody}`);
  }

  return await response.json();
}
