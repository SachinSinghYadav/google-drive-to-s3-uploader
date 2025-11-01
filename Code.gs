/**
 * Google Apps Script to Upload Images from Google Drive to AWS S3
 * 
 * Setup Instructions:
 * 1. Create a Google Spreadsheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code
 * 4. Set up Script Properties (Project Settings > Script Properties):
 *    - ACCESS_KEY: Your AWS Access Key ID
 *    - SECRET_KEY: Your AWS Secret Access Key
 *    - BUCKET_NAME: Your S3 bucket name
 *    - REGION: Your AWS region (e.g., 'us-east-1')
 *    - SERVICE: 's3'
 * 5. In cell A2 of Sheet1, paste a Google Drive shareable link to your image
 * 6. Use the custom menu "Run Script > Upload Image"
 */

// Get configuration from Script Properties
const ACCESS_KEY = PropertiesService.getScriptProperties().getProperty('ACCESS_KEY');
const SECRET_KEY = PropertiesService.getScriptProperties().getProperty('SECRET_KEY');
const BUCKET_NAME = PropertiesService.getScriptProperties().getProperty('BUCKET_NAME');
const REGION = PropertiesService.getScriptProperties().getProperty('REGION') || 'us-east-1';
const SERVICE = 's3';

/**
 * Extract file ID from Google Drive share link
 * @param {string} url - Google Drive share URL
 * @returns {string} - File ID
 */
function getFileIdFromDriveLink(url) {
  const regex = /\/d\/([a-zA-Z0-9_-]+)\/view/;
  const match = url.match(regex);
  
  if (match && match[1]) {
    return match[1];
  } else {
    throw new Error('Invalid Google Drive URL. Expected format: https://drive.google.com/file/d/FILE_ID/view');
  }
}

/**
 * Generate AWS Signature Version 4 signing key
 */
function getSignatureKey(key, dateStamp, regionName, serviceName) {
  const kDate = Utilities.computeHmacSha256Signature(
    Utilities.newBlob(dateStamp).getBytes(), 
    Utilities.newBlob('AWS4' + key).getBytes()
  );
  const kRegion = Utilities.computeHmacSha256Signature(
    Utilities.newBlob(regionName).getBytes(), 
    kDate
  );
  const kService = Utilities.computeHmacSha256Signature(
    Utilities.newBlob(serviceName).getBytes(), 
    kRegion
  );
  const kSigning = Utilities.computeHmacSha256Signature(
    Utilities.newBlob('aws4_request').getBytes(), 
    kService
  );
  return kSigning;
}

/**
 * Convert byte array to hex string
 */
function toHexString(byteArray) {
  return byteArray.map(function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}

/**
 * Upload file from Google Drive to AWS S3
 * @param {string} imageUrl - Google Drive share link
 * @param {string} keyName - S3 object key (path in bucket)
 * @returns {string} - Public URL of uploaded file
 */
function uploadFileToS3(imageUrl, keyName) {
  keyName = keyName || 'images/uploaded-image.jpeg';
  
  // AWS4-HMAC-SHA256 Signature Setup
  const method = 'PUT';
  const host = BUCKET_NAME + '.s3.' + REGION + '.amazonaws.com';
  
  const currentDate = new Date();
  const amzDate = Utilities.formatDate(currentDate, 'UTC', 'yyyyMMdd\'T\'HHmmss\'Z\'');
  const datestamp = Utilities.formatDate(currentDate, 'UTC', 'yyyyMMdd');
  
  // Fetch file from Google Drive
  const imageOptions = {
    'method': 'get',
    'headers': {
      'Content-Type': 'application/json; charset=utf-8'
    },
    'muteHttpExceptions': true
  };
  
  const fileId = getFileIdFromDriveLink(imageUrl);
  const response = UrlFetchApp.fetch('https://lh3.googleusercontent.com/d/' + fileId, imageOptions);
  
  if (response.getResponseCode() !== 200) {
    throw new Error('Failed to fetch image from Google Drive. Make sure the file is publicly accessible.');
  }
  
  const fileBlob = response.getBlob();
  const payloadHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, fileBlob.getBytes());
  const payloadHashHex = toHexString(payloadHash);
  
  // Step 1: Create Canonical Request
  const canonicalUri = '/' + keyName;
  const canonicalQuerystring = '';
  const canonicalHeaders = 'host:' + host + '\n' + 
                          'x-amz-content-sha256:' + payloadHashHex + '\n' + 
                          'x-amz-date:' + amzDate + '\n';
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = method + '\n' + 
                          canonicalUri + '\n' + 
                          canonicalQuerystring + '\n' + 
                          canonicalHeaders + '\n' + 
                          signedHeaders + '\n' + 
                          payloadHashHex;
  
  // Step 2: Create the String to Sign
  const credentialScope = datestamp + '/' + REGION + '/' + SERVICE + '/aws4_request';
  const canonicalRequestHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, canonicalRequest);
  const stringToSign = 'AWS4-HMAC-SHA256' + '\n' + 
                       amzDate + '\n' + 
                       credentialScope + '\n' + 
                       toHexString(canonicalRequestHash);
  
  // Step 3: Calculate the Signature
  const signingKey = getSignatureKey(SECRET_KEY, datestamp, REGION, SERVICE);
  const signature = Utilities.computeHmacSha256Signature(Utilities.newBlob(stringToSign).getBytes(), signingKey);
  const signatureHex = toHexString(signature);
  
  // Step 4: Authorization Header
  const authorizationHeader = 'AWS4-HMAC-SHA256 Credential=' + 
                              ACCESS_KEY + '/' + credentialScope + 
                              ', SignedHeaders=' + signedHeaders + 
                              ', Signature=' + signatureHex;
  
  // Step 5: Make the HTTP PUT request to S3
  const url = 'https://' + host + canonicalUri;
  const contentType = 'image/jpeg';

  const options = {
    method: 'put',
    headers: {
      'x-amz-content-sha256': payloadHashHex,
      'x-amz-date': amzDate,
      'Authorization': authorizationHeader,
      'Content-Type': contentType
    },
    payload: fileBlob.getBytes(),
    muteHttpExceptions: true
  };

  const res = UrlFetchApp.fetch(url, options);
  
  if (res.getResponseCode() === 200) {
    Logger.log('File uploaded successfully to S3: ' + url);
    return url;
  } else {
    throw new Error('Failed to upload file to S3. Response code: ' + res.getResponseCode() + ', Response: ' + res.getContentText());
  }
}

/**
 * Main function to upload image from spreadsheet
 */
function myScriptFunction() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  
  if (!sheet) {
    Browser.msgBox('Sheet1 not found. Please create a sheet named "Sheet1".');
    return;
  }
  
  const driveUrl = sheet.getRange('A2').getValue();
  const keyName = sheet.getRange('B2').getValue() || 'images/uploaded-image.jpeg'; // Optional: custom path from B2
  
  if (!driveUrl) {
    Browser.msgBox('No URL found in cell A2. Please add a Google Drive share link.');
    return;
  }
  
  try {
    const s3Url = uploadFileToS3(driveUrl, keyName);
    Browser.msgBox('Image uploaded successfully!\\n\\nS3 URL: ' + s3Url);
  } catch (error) {
    Browser.msgBox('Failed to upload image: ' + error.message);
    Logger.log('Error: ' + error);
  }
}

/**
 * Create custom menu when spreadsheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 S3 Upload')
    .addItem('Upload Image', 'myScriptFunction')
    .addToUi();
}
