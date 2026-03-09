/**
 * Reusable PDF Export Utility
 * Generates a printable PDF with header, footer, and table data
 */

/**
 * Generates a PDF with personal info card format
 * Displays data in a structured two-column layout like a profile/info card
 * Follows system color scheme: clean white background, gray tones, subtle borders
 */
export const generatePersonalInfoPDF = ({
  title = "Details Report",
  data = {},
  fields = [],
  companyName = "Management System",
  headerInfo = null,
}) => {
  const printWindow = window.open('', '_blank');
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();

  // Build info rows - two columns per row
  const infoRows = [];
  for (let i = 0; i < fields.length; i += 2) {
    const field1 = fields[i];
    const field2 = fields[i + 1];

    const value1 = field1.accessor ? field1.accessor(data) : data[field1.key];
    const value2 = field2 ? (field2.accessor ? field2.accessor(data) : data[field2.key]) : null;

    let row = `
      <tr>
        <td class="label">${field1.label}</td>
        <td class="value">${value1 || '—'}</td>
    `;

    if (field2) {
      row += `
        <td class="label">${field2.label}</td>
        <td class="value">${value2 || '—'}</td>
      `;
    } else {
      row += `<td class="label"></td><td class="value"></td>`;
    }

    row += `</tr>`;
    infoRows.push(row);
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @media print {
            @page { margin: 1.5cm; }
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 40px;
            background: #f9fafb;
            color: #111827;
            line-height: 1.5;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            border: 1px solid #e5e7eb;
            overflow: hidden;
          }
          .header {
            background: white;
            padding: 32px;
            border-bottom: 1px solid #e5e7eb;
          }
          .header-top {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 16px;
          }
          .header-icon {
            width: 48px;
            height: 48px;
            background: #f3f4f6;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            color: #374151;
            font-size: 18px;
          }
          .header h1 {
            font-size: 24px;
            font-weight: 600;
            color: #111827;
            margin: 0;
          }
          .header-meta {
            display: flex;
            gap: 24px;
            margin-top: 8px;
          }
          .header-meta span {
            font-size: 14px;
            color: #6b7280;
          }
          .badge {
            display: inline-block;
            background: #f3f4f6;
            color: #374151;
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 500;
            margin-top: 16px;
          }
          .content {
            padding: 32px;
          }
          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
          }
          .info-table tr {
            border-bottom: 1px solid #f3f4f6;
          }
          .info-table tr:last-child {
            border-bottom: none;
          }
          .info-table td {
            padding: 16px 12px;
            vertical-align: top;
          }
          .info-table td.label {
            width: 18%;
            font-weight: 500;
            color: #6b7280;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.025em;
          }
          .info-table td.value {
            width: 32%;
            color: #111827;
            font-size: 15px;
            font-weight: 400;
          }
          .footer {
            text-align: center;
            padding: 24px 32px;
            border-top: 1px solid #e5e7eb;
            background: #f9fafb;
          }
          .footer p {
            margin: 4px 0;
            font-size: 12px;
            color: #9ca3af;
          }
          .footer p:first-child {
            font-weight: 500;
            color: #6b7280;
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .container {
              border: none;
              border-radius: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-top">
              <div class="header-icon">${(headerInfo?.name || data.name || 'N/A').charAt(0).toUpperCase()}</div>
              <div>
                <h1>${title}</h1>
                <div class="header-meta">
                  <span>Generated on ${currentDate}</span>
                  <span>at ${currentTime}</span>
                </div>
              </div>
            </div>
            ${headerInfo ? `<div class="badge">${headerInfo.name || data.name || ''}</div>` : ''}
          </div>
          
          <div class="content">
            <div class="section-title">Personal Information</div>
            <table class="info-table">
              ${infoRows.join('')}
            </table>
          </div>

          <div class="footer">
            <p>${companyName}</p>
            <p>© ${new Date().getFullYear()} - All Rights Reserved</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export const generatePDF = ({
  title = "Report",
  data = [],
  columns = [],
  filters = {},
  companyName = "Management System",
}) => {
  const printWindow = window.open('', '_blank');
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();

  // Build filter summary
  const filterSummary = Object.entries(filters)
    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => {
      if (value instanceof Date) {
        return `${key}: ${value.toLocaleDateString()}`;
      }
      return `${key}: ${value}`;
    })
    .join(' | ');

  // Build table headers
  const tableHeaders = columns.map(col => `<th>${col.header}</th>`).join('');

  // Build table rows
  const tableRows = data.map(row => {
    const cells = columns.map(col => {
      const value = col.accessor ? col.accessor(row) : row[col.key];
      return `<td>${value || '—'}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @media print {
            @page { margin: 1cm; }
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #333;
          }
          .header p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 50px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #333;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            padding: 10px;
            border-top: 1px solid #ddd;
            background: white;
            font-size: 12px;
            color: #666;
          }
          .summary {
            margin-bottom: 20px;
            padding: 10px;
            background-color: #f0f0f0;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>Generated on ${currentDate} at ${currentTime}</p>
          <p>Total Records: ${data.length}</p>
        </div>
        
        ${filterSummary ? `
          <div class="summary">
            <strong>Filters Applied:</strong> ${filterSummary}
          </div>
        ` : ''}

        <table>
          <thead>
            <tr>${tableHeaders}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="footer">
          <p>${companyName} | Page 1 of 1</p>
          <p>© ${new Date().getFullYear()} - Confidential</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
