# Google Drive to AWS S3 Uploader

A Google Apps Script that uploads images from Google Drive directly to AWS S3 with AWS Signature Version 4 authentication.

## ✨ Features

- 📤 Upload images from Google Drive to AWS S3
- 🔐 Secure AWS Signature V4 authentication
- 📊 Simple spreadsheet interface
- 🎨 Custom menu integration
- 🛡️ Error handling and validation
- 🔧 Configurable S3 paths

## 🚀 Quick Start

### Prerequisites

- A Google account
- An AWS account with S3 access
- AWS credentials (Access Key ID and Secret Access Key)
- An S3 bucket (with appropriate permissions)

### Setup Instructions

#### Step 1: Create a Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it something like "S3 Image Uploader"

#### Step 2: Open Apps Script Editor

1. In your spreadsheet, click **Extensions** → **Apps Script**
2. Delete any existing code in the editor
3. Copy and paste the entire `Code.gs` file from this repository

#### Step 3: Configure AWS Credentials

1. In the Apps Script editor, click **Project Settings** (⚙️ icon on the left)
2. Scroll down to **Script Properties**
3. Click **Add script property** and add the following:

| Property | Value | Example |
|----------|-------|---------|
| `ACCESS_KEY` | Your AWS Access Key ID | `AKIAIOSFODNN7EXAMPLE` |
| `SECRET_KEY` | Your AWS Secret Access Key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `BUCKET_NAME` | Your S3 bucket name | `my-images-bucket` |
| `REGION` | Your AWS region | `us-east-1` |

⚠️ **Security Note**: Never commit your AWS credentials to version control. Always use Script Properties.

#### Step 4: Configure S3 Bucket Permissions

Ensure your S3 bucket policy allows uploads. Here's a sample policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_USER"
      },
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}
```

#### Step 5: Prepare Your Google Drive Image

1. Upload an image to Google Drive
2. Right-click the image → **Share** → **Change to Anyone with the link**
3. Copy the share link (format: `https://drive.google.com/file/d/FILE_ID/view`)

#### Step 6: Use the Script

1. Go back to your spreadsheet
2. In cell **A2**, paste the Google Drive share link
3. (Optional) In cell **B2**, specify a custom S3 path like `images/myfile.jpeg`
4. Refresh the page to see the custom menu
5. Click **🚀 S3 Upload** → **Upload Image**
6. Wait for the success message with your S3 URL!

## 📋 Usage

### Basic Upload

```
Cell A2: https://drive.google.com/file/d/1ABC...XYZ/view
Cell B2: (leave empty for default path)
```

The image will be uploaded to: `s3://your-bucket/images/uploaded-image.jpeg`

### Custom Path Upload

```
Cell A2: https://drive.google.com/file/d/1ABC...XYZ/view
Cell B2: photos/2024/vacation.jpeg
```

The image will be uploaded to: `s3://your-bucket/photos/2024/vacation.jpeg`

## 🔧 Configuration

### Script Properties

| Property | Required | Description | Default |
|----------|----------|-------------|---------|
| `ACCESS_KEY` | ✅ Yes | AWS Access Key ID | - |
| `SECRET_KEY` | ✅ Yes | AWS Secret Access Key | - |
| `BUCKET_NAME` | ✅ Yes | S3 bucket name | - |
| `REGION` | ❌ No | AWS region | `us-east-1` |

### Customization

To change the default upload path, modify line 91 in `Code.gs`:

```javascript
const keyName = sheet.getRange('B2').getValue() || 'your/custom/path.jpeg';
```

## 🛠️ Troubleshooting

### Common Issues

**"Invalid Google Drive URL"**
- Ensure the link format is: `https://drive.google.com/file/d/FILE_ID/view`
- Make sure the file is shared with "Anyone with the link"

**"Failed to upload file to S3"**
- Verify your AWS credentials are correct
- Check that your IAM user has `s3:PutObject` permission
- Ensure the bucket name and region are correct
- Check S3 bucket CORS settings if accessing from web

**"Failed to fetch image from Google Drive"**
- Ensure the file is publicly accessible
- The file must be an image format
- Check that the share link is valid

### Enable Logging

To see detailed logs:
1. In Apps Script editor, click **Execution log** at the bottom
2. Run the script
3. Check logs for detailed error messages

## 🤝 Contributing

Contributions are welcome! Here are some ways you can help:

- 🐛 Report bugs
- 💡 Suggest new features
- 📝 Improve documentation
- 🔧 Submit pull requests

### Development Setup

1. Fork this repository
2. Clone your fork
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- AWS Signature Version 4 signing process
- Google Apps Script community
- Contributors and users

## 📧 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Search existing [GitHub Issues](../../issues)
3. Create a new issue with detailed information

## 🌟 Star This Repo

If you find this project helpful, please give it a ⭐️ on GitHub!

---

**Made with ❤️ for the open-source community**
